// The bridge holds the standing's socket (graph @nks/nks-dev, nodes #4233, #4234, #4235).
// The socket address, shown once in the channel connect|mint answer, is held with the
// channel discipline of ../shared/channel.ts until the MCP session ends. Two doors lead
// out, neither carries the secret: the local socket in the grant dir (#4230, door.ts) for
// the watchdog, and MCP notifications/message under LOGGERS.channel for pi.
// One socket per channel, places of several graphs on it (#5838, places.ts).
// The busy text is written by the doer beside the socket (#4231) and published by the bridge.
import { LOGGERS } from "../delivery/index.ts";
import { holdSocket, isDirectWord, statusUrl as deriveStatusUrl } from "../shared/channel.ts";
import { bindAll } from "../shared/scope.ts";
import { deliveryKeys, noteSeen } from "../shared/seen.ts";
import { socketPathOf } from "../shared/standings.ts";
import { markAddressed } from "./addressmark.ts";
import { harnessName, notifiedClient } from "./client.ts";
import { stampOrigin } from "./complete.ts";
import { CFG } from "./config.ts";
import { type ChannelEvent, Door, type DoorHooks, ENV_KEY } from "./door.ts";
import { isDelivered, redundantCopy } from "./fanout.ts";
import { letGo, takeSpool } from "./handoff.ts";
import { dropOwnHoldRecord, keyOf, readHoldRecord, writeHoldRecord } from "./holdrecord.ts";
import { E, type Frame, H, handoverReason } from "./holdstate.ts";
import { deadWord, holdWords } from "./holdwords.ts";
import {
  addExtra,
  type Channel,
  dropAllExtras,
  extraIn,
  extraOf,
  extraPlaces,
  learnFromHello,
  type Place,
  rememberExtraStatus,
  repointExtras,
  routeFrame,
} from "./places.ts";
import { otherRealm, sameRealm } from "./realms.ts";
import { batchForWatchdogs, noteRoomKind } from "./roomstack.ts";
import { standingLog } from "./store.ts";
import { emit, log } from "./streams.ts";
import { type Standing, state } from "./transport.ts";

export type { ChannelEvent } from "./door.ts";

function keyFor(): string {
  const s = state.standing;
  return s ? keyOf(s.realm, s.karta, s.name ?? "") : ENV_KEY;
}

/** Returns the previous cwd: a failed resume from disk rolls back to it (resume.ts). */
export function noteStandCwd(cwd: string | null): string | null {
  const prev = H.standCwd;
  H.standCwd = cwd;
  // Already held (connect came before stand): write the cwd into the record now.
  if (cwd && H.currentKey && H.currentUrl)
    rememberStatus(readHoldRecord(H.currentKey)?.status ?? "");
  return prev;
}

const channel = (): Channel | null =>
  H.currentUrl ? { url: H.currentUrl, statusUrl: H.currentStatusUrl, cwd: H.standCwd } : null;

/** Busy text accepted by the board: keep it in the hold record of this graph's place (status.ts). */
export function rememberStatus(text: string, realm?: string): void {
  const s = state.standing;
  const ch = channel();
  if (!s || !H.currentKey || !ch) return;
  const extra = realm ? extraIn(realm) : undefined;
  if (extra) return rememberExtraStatus(extra.door.key, ch, text);
  writeHoldRecord(H.currentKey, {
    realm: s.realm,
    karta: s.karta,
    name: s.name ?? "",
    url: ch.url,
    statusUrl: H.currentStatusUrl,
    status: text || undefined,
    cwd: H.standCwd ?? readHoldRecord(H.currentKey)?.cwd,
    client: harnessName(),
    key: H.currentKey,
  });
}

export { keyOf, readHoldRecord } from "./holdrecord.ts";

/** Whether the bridge holds a live socket for exactly this key (resume.ts). */
export const holdsKey = (key: string): boolean => !!H.holder?.alive && H.currentKey === key;
/** Key of the place the bridge leads, held or parked; null if none (resume.ts). */
export const ledKey = (): string | null => H.currentKey;
/** Whether the bridge holds a live channel socket; places of other graphs stand beside it (#5838). */
export const holdsChannel = (): boolean => !!H.holder?.alive && !!H.currentKey;
/** Local socket path of the key, to probe for a live holder (resume.ts). */
export const localSocketPathOf = (key: string): string => socketPathOf(CFG.authDir, key);
export { noteResuming, setClosingOwn, setRevokingOwn } from "./holdstate.ts";

// Stale service repeats after a session rebuild fold into one word, not one wake per frame
// (graph @nks/nks-dev, nodes #4881, #5033).

const doorHooks: DoorHooks = {
  onAttach: () => {
    for (const fn of H.attachHooks) fn();
  },
  lateEvent: () => (H.evictedKey ? H.evictedEvent : null),
  onError: (text) => {
    log(text);
    notify("error", { kind: "note", text });
  },
};

/** All channel doors: the primary place and the places beside. */
export const doors = (): Door[] => [
  ...(H.door ? [H.door] : []),
  ...extraPlaces().map((p) => p.door),
];

function isOwn(realm: string, karta: string | number, name: string): boolean {
  const s = state.standing;
  if (!H.currentKey) return false;
  if (extraOf(realm, karta, name)) return true;
  return (
    !!s &&
    (s.realm === realm || sameRealm(s.realm, realm)) &&
    String(s.karta) === String(karta) &&
    (s.name ?? "") === name &&
    H.currentKey === keyFor()
  );
}

/** Whether this bridge holds the socket of exactly this standing: then register suffices, connect would rotate a live place. */
export function holdsStanding(realm: string, karta: string | number, name: string): boolean {
  return !!H.holder?.alive && !H.unheard && isOwn(realm, karta, name); // resumed without hello is not held
}

/** Whether exactly this standing's socket was taken from this bridge (close 4000): binding intact, hearing elsewhere; status address kept until a foreign connect rotates it. */
export function wasEvicted(realm: string, karta: string | number, name: string): boolean {
  return !!H.evictedKey && H.evictedKey === H.currentKey && isOwn(realm, karta, name);
}

/** Whether the bridge has a status address for exactly this standing: busy follows the standing, not a live socket, but only its own. */
export const hasStatusAddressFor = (realm: string, karta: string | number, name: string): boolean =>
  !!H.currentStatusUrl && !!H.currentKey && isOwn(realm, karta, name);

/** Places the bridge holds: the primary first, then places of other graphs (#5838). */
export const heldPlaces = (): { key: string; realm: string; primary: boolean }[] => [
  ...(H.door && state.standing
    ? [{ key: H.door.key, realm: state.standing.realm, primary: true }]
    : []),
  ...extraPlaces().map((p) => ({ key: p.door.key, realm: p.standing.realm, primary: false })),
];

/** The place of another graph if the call names it: leave and busy belong to that graph's place (#5838). */
export const besideKeyIn = (realm: unknown): string | null => extraIn(realm)?.door.key ?? null;

/** Whether the bridge left exactly this place (leave.ts): address kept, socket closed, return needs no connect. */
export const isParked = (realm: string, karta: string | number, name: string): boolean =>
  H.parked && isOwn(realm, karta, name);

/** Since when no local listener is at any door; null if listened to or nothing is held. */
export function listenerIdleSince(): number | null {
  if (!H.holder?.alive) return null;
  const ds = doors();
  if (!ds.length || ds.some((d) => d.clients.size > 0)) return null;
  return Math.max(...ds.map((d) => d.idleAt ?? 0));
}

/** Called when a local client attaches: the watchdog is back at the place. */
export function onListenerAttached(fn: () => void): void {
  H.attachHooks.push(fn);
}
/** Local clients at all doors now (the sweep.ts liveness probe drops at once; it is not a watchdog). */
export const localListeners = (): number => doors().reduce((n, d) => n + d.clients.size, 0);

/** The hello frame proves holding: from the ring if already here, else awaited up to the timeout. */
export function awaitHello(timeoutMs: number): Promise<Frame | null> {
  const seen = H.door?.ring.find((r) => r.frame?.type === "hello")?.frame ?? null;
  if (seen) return Promise.resolve(seen);
  return new Promise((resolve) => {
    const done = (f: Frame | null): void => {
      H.helloWaiters.delete(done);
      resolve(f);
    };
    H.helloWaiters.add(done);
    setTimeout(() => done(null), timeoutMs).unref();
  });
}

/** Key of the held standing: the primary or the named graph's place (listen.ts). */
export const heldKey = (realm?: string): string | null =>
  (realm ? besideKeyIn(realm) : null) ?? H.currentKey;

/** A channel event goes to every door: places share the socket. */
export function broadcast(ev: ChannelEvent): void {
  for (const d of doors()) d.broadcast(ev);
}

export function notify(level: "info" | "warning" | "error", data: ChannelEvent): void {
  emit({
    jsonrpc: "2.0",
    method: "notifications/message",
    params: { level, logger: LOGGERS.channel, data },
  });
}

/** Stand a place of another graph beside, on the channel the bridge holds (#5838). Null if no channel. */
export function addPlace(s: Standing): string | null {
  const ch = channel();
  const primary = state.standing;
  if (!H.holder?.alive || !ch || !primary || !otherRealm(primary.realm, s.realm)) return null;
  return addExtra(s, ch, doorHooks, H.door?.address ?? null);
}

/** The platform id of this graph's place, if register, hello or a frame named it. */
export const standingIdIn = (realm: string): string | null =>
  (extraIn(realm)?.door ?? H.door)?.standingId ?? null;

/**
 * Place id from the register answer (RegisteredSession.standing_id, #5838): frames find
 * the place's door by it, busy finds the place. A new place arrives on the same socket:
 * the service rereads the channel's places on each delivery pass.
 */
export function noteStandingId(realm: string, id: string | null): void {
  const d =
    extraIn(realm)?.door ??
    (state.standing && !otherRealm(realm, state.standing.realm) ? H.door : null);
  if (d && id) d.standingId = id;
}

const held = (): Place | null =>
  H.door && state.standing ? { standing: state.standing, door: H.door } : null;

/**
 * Release everything held: service socket, doors, publication. Idempotent.
 * `forget` also drops hold records (revoke, dead token). `keepBeside`: the same channel
 * reopens and places beside stay on it. `own`: the session's own close, revoke or leave;
 * released carries own and watchdogs leave without alarm (#6638).
 * `keepBusy`: a paused place (suspend.ts); a handed socket not taken by a successor keeps busy.
 */
export function releaseStanding(
  reason: string,
  forget = false,
  keepBeside = false,
  own = false,
  keepBusy = false,
): void {
  if (forget && H.currentKey) dropOwnHoldRecord(H.currentKey, H.currentUrl);
  if (!keepBeside) dropAllExtras(reason, forget, own);
  if (!H.holder && !H.door) return;
  // An unsent batch leaves now instead of being lost silently (backlog.ts).
  H.door?.flushBatches();
  const key = H.currentKey ?? undefined;
  const handover = handoverReason();
  if (handover && !forget) {
    // Handed to a successor daemon (daemon.ts), not released: the watchdog re-attaches the
    // same door, the plugin keeps holding, the thin bridge restores the place in a new session.
    standingLog(`handed over ${H.currentKey ?? "?"}: ${handover}`);
    broadcast({ kind: "handover", key, text: handover });
  } else {
    standingLog(`released ${H.currentKey ?? "?"}: ${reason}${forget ? " (record dropped)" : ""}`);
    const released: ChannelEvent = { kind: "released", key, text: reason, ...(own && { own }) };
    broadcast(released);
    notify("info", released); // the OpenCode plugin drops holding on this word, not a guess (#5140)
  }
  const busy = keepBusy ? null : H.currentStatusUrl;
  letGo(H.holder, handover && !forget ? (key ?? null) : null, reason, busy); // before eviction (#6586)
  H.holder = null;
  for (const w of [...H.helloWaiters]) w(null);
  H.door?.close();
  H.door = null;
  Object.assign(H, { parked: false, unheard: false });
  H.currentKey = null;
  H.currentUrl = null;
  H.currentStatusUrl = null;
  H.evictedKey = null;
  H.evictedEvent = null;
}

/** Take this address and hold it, whatever the previous one was. */
export function holdStanding(url: string, statusUrl?: string | null): string {
  const key = keyFor();
  if (url === H.currentUrl && key === H.currentKey && H.holder?.alive) return key;
  // Another name: the old place's record is dropped, else a cwd resume would raise it (#5140).
  // The same place again: places beside stay on the channel (#5838).
  const same = !!H.currentKey && H.currentKey === key;
  releaseStanding(holdWords().newSocket(), !!H.currentKey && H.currentKey !== key, same);
  const status = statusUrl || deriveStatusUrl(url);
  Object.assign(H, { currentKey: key, currentUrl: url, currentStatusUrl: status });
  H.door = new Door(key, doorHooks);
  H.door.open();
  const s = state.standing;
  if (s)
    writeHoldRecord(key, {
      status: readHoldRecord(key)?.status,
      realm: s.realm,
      karta: s.karta,
      name: s.name ?? "",
      url,
      statusUrl: H.currentStatusUrl,
      cwd: H.standCwd ?? readHoldRecord(key)?.cwd,
      client: harnessName(),
      key,
      left: false, // held again: the leave mark is cleared
    });
  const ch = channel();
  if (same && ch) repointExtras(ch);
  openHolder(url, key);
  standingLog(`held ${key}${H.standCwd ? ` cwd=${H.standCwd}` : ""}`);
  // "held" also goes as a notification: the OpenCode plugin has no local socket to learn it
  // from and must not reap a holding bridge on idle (#5140); the place lets a child session
  // stand as its satellite (#6002).
  const place = s ? { realm: s.realm, karta: String(s.karta), name: s.name ?? "" } : undefined;
  notify("info", { kind: "held", key, ...(place ? { place } : {}) });
  return key;
}

/** Leave the place (leave.ts): the service socket closes for all channel places; keys, addresses and doors stay. Returns the key or null. */
export function parkStanding(reason: string): string | null {
  if (!H.holder?.alive || !H.currentKey) return null;
  H.heardAt = Math.max(H.heardAt, H.holder.heardAt);
  H.holder.close(reason);
  H.holder = null;
  H.parked = true;
  standingLog(`parked ${H.currentKey}: ${reason}`);
  const text = holdWords().parked(reason);
  broadcast({ kind: "note", text });
  return H.currentKey;
}

/** The socket reopens on the same address: hearing comes from this opening's hello, not an old one in the ring (#5036 §4, deaf.ts). */
function expectHello(): void {
  H.unheard = true;
  for (const d of doors())
    d.ring.splice(0, d.ring.length, ...d.ring.filter((r) => r.frame?.type !== "hello"));
}

/** Return to the place left: same address, socket reopened. */
export function resumeStanding(): boolean {
  if (!H.parked || !H.currentUrl || !H.currentKey) return false;
  H.parked = false;
  expectHello();
  openHolder(H.currentUrl, H.currentKey);
  standingLog(`resumed ${H.currentKey}: socket reopened on the same address`);
  return true;
}

/** One door's frame: ring, broadcast to its clients, notification. */
function deliverTo(d: Door, raw: string, frame: Frame | null, full: Frame | null): void {
  const seenPath = d.seenPath;
  const id = full?.type === "message" && typeof full.id === "string" ? full.id : "";
  // A copy of a graph event already offered or delivered (fanout.ts) goes to no one.
  if (redundantCopy(full, d)) return;
  if (full?.type === "message") markAddressed(full, seenPath, d.seen); // before repeat and stale checks
  // A repeat of a delivered frame (same id, re-sent after the place returned) is broadcast to no one; clients mark delivered frames themselves, in the file.
  const again = isDelivered(id ? [id] : [], d.seen, seenPath);
  // A stale frame (accepted while unheard, e.g. the predecessor's mail after revoke, or a
  // service repeat after a session rebuild) costs no turn but is not lost: one batch per lane;
  // a stale copy of a delivered frame is skipped. In pi and OpenCode the batch notification is
  // the delivery, so every frame of the lane is marked seen, else the platform re-sends and
  // wakes again after reconnect (#5831). A direct word skips the stale batch and goes live.
  if (full?.type === "message" && full.stale === true && !isDirectWord(full))
    return again
      ? log(`stale frame ${id} already delivered — dropped`)
      : d.stale.note(full, (ev) => {
          if (notifiedClient()) for (const k of ev.marks ?? []) noteSeen(seenPath, k, d.seen);
          d.broadcast(ev);
          notify("info", keyed(d, ev));
        });
  const text = full === frame && !full?.addressed ? raw : JSON.stringify(full);
  // hello goes into every door's ring: a watchdog attaching later must see the proof of holding.
  const hello = full?.type === "hello";
  for (const x of hello ? doors() : [d]) x.push(text, full);
  if (hello) Object.assign(H, { unheard: false, deafKey: null }); // hearing proven
  if (hello) for (const w of [...H.helloWaiters]) w(full);
  const ev: ChannelEvent = { kind: "frame", raw: text, frame: full };
  const msg = full?.type === "message" && !again ? full : null;
  if (msg) noteRoomKind(msg);
  // Watchdogs get batched room frames per window, an interrupting one after the batch (roomstack.ts).
  const toBatch = (b: ChannelEvent): void => (d.broadcast(b), notify("info", keyed(d, b)));
  if (msg && !notifiedClient() && batchForWatchdogs(d, text, msg, toBatch)) return;
  if (!again) for (const x of hello ? doors() : [d]) x.broadcast(ev);
  if (full?.type === "status") return;
  if (again) return log(`frame ${id} came again — already delivered, not raised`);
  if (notifiedClient()) {
    // pi and OpenCode: the notification is the delivery, so .seen is written when it is sent;
    // a frame in the batch window (backlog.ts, #5140) is not yet delivered and the platform
    // re-sends it if the bridge dies. All window frames are marked, even those the batch
    // names only by count and history address.
    const flushBacklog = (b: ChannelEvent): void => {
      for (const k of b.marks ?? []) noteSeen(seenPath, k, d.seen);
      notify("info", keyed(d, b));
    };
    if (hello && Number(full.pending) > 0) d.backlog.open(Number(full.pending), flushBacklog);
    if (full?.type === "message") {
      if (full.origin === "platform") d.backlog.open(0, flushBacklog);
      if (d.backlog.note(full)) return;
    }
    for (const k of deliveryKeys(full)) noteSeen(seenPath, k, d.seen);
  }
  notify("info", keyed(d, ev));
}

/** An event of another graph's place carries its key so the notification client knows whose it is (#5838). */
const keyed = (d: Door, ev: ChannelEvent): ChannelEvent =>
  d === H.door ? ev : { ...ev, key: d.key };

// Socket handlers get the opening session's scope explicitly (shared/scope.ts); the runtime
// need not carry it across events.
function openHolder(url: string, key: string): void {
  H.holder = holdSocket(
    bindAll<Parameters<typeof holdSocket>[0]>({
      url,
      onDropped: expectHello,
      onFrame: function onFrame(raw, frame) {
        void Promise.resolve(stampOrigin(frame)).then((full) => {
          const primary = held();
          if (!primary) return H.door ? deliverTo(H.door, raw, frame, full) : undefined; // socket without a standing (env)
          // hello names the channel's places: their ids and canonical graphs (#5838).
          if (full?.type === "hello") learnFromHello(full, primary);
          // A frame goes to its place's door by to_standing_id; an unmatched one to the primary with a note.
          const { door: d, note } = routeFrame(full?.type === "hello" ? null : full, primary);
          if (note) {
            log(note);
            d.broadcast({ kind: "note", text: note });
          }
          deliverTo(d, raw, frame, full);
          if (full?.type === "hello") takeSpool(key, held, onFrame); // what reached the leaving daemon (#6586)
        });
      },
      onEvicted: (code) => {
        standingLog(`evicted ${key}: close ${code}`);
        H.evictedKey = key;
        dropOwnHoldRecord(key, url); // address rotated: own record is dead, the evictor's stays
        E.next?.(key, url, code); // evicted.ts
      },
      onDeadToken: (code) => {
        if (H.revokingOwn) {
          // Own revoke in flight: 4001 outran the revoke answer, the token is closed, not dead;
          // release quietly, else an obedient agent re-creates the place just revoked.
          log(
            `standing revoked by this session — released quietly, binding forgotten (${state.standing?.name ?? "unnamed"}; close ${code} arrived before the answer)`,
          );
          releaseStanding(holdWords().revokedOwn(), true, false, true);
          state.standing = null;
          state.standingSession = null;
          return;
        }
        if (H.closingOwn) {
          // Own channel close, like own revoke: 4001 outran the answer (#6634).
          log(
            `channel closed by this session — released quietly (close ${code} arrived before the answer)`,
          );
          releaseStanding(holdWords().closedOwn(), true, false, true);
          state.standing = null;
          state.standingSession = null;
          return;
        }
        if (H.resuming > 0) {
          // Stale hold record, the place is already dead at the platform: a quiet rollback, not
          // an alarm; the stand tool takes the place anew by connect.
          log(`hold record for ${key} is dead at the platform (close ${code}) — dropped`);
          releaseStanding(holdWords().resumeFailed(), true);
          return;
        }
        const text = deadWord(code);
        log(text);
        standingLog(`dead ${key}: close ${code}`);
        const ev: ChannelEvent = { kind: "dead", code, text };
        broadcast(ev);
        notify("error", ev);
        Object.assign(H, { deafKey: key, deadPlaces: [...state.places] }); // binding remembered, no hearing (deaf.ts)
        releaseStanding(holdWords().tokenDead(), true);
      },
      onServiceAlive: (version) => {
        const text = holdWords().alive(version);
        log(text);
        const ev: ChannelEvent = { kind: "alive", version, text };
        broadcast(ev);
        notify("warning", ev);
      },
      onNote: (text) => {
        log(text);
        broadcast({ kind: "note", text });
      },
      // Hang: a line waking the agent for the Monitor watchdog; pi and OpenCode show the human a notification that does not wake the agent (#5380).
      onHung: (text) => {
        log(text);
        broadcast({ kind: "note", text });
        notify("warning", { kind: "note", text });
      },
    }),
  );
}
