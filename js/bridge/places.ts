// Channel seats in other graphs (graph nks-dev: #5838, answering #5837): one
// service socket (hold.ts); here the seats beside the one it was taken for —
// each with its own door, hold record and re-register line (standing.ts).
// register on the same channel in another graph adds a seat; hello lists them all;
// a write is signed by the seat of its own graph.
import { LOGGERS, PLACES } from "../delivery/index.ts";
import { type Frame } from "../shared/channel.ts";
import { words } from "../shared/lang.ts";
import { scoped } from "../shared/scope.ts";
import { harnessName } from "./client.ts";
import { type ChannelEvent, Door, type DoorHooks } from "./door.ts";
import { dropHoldRecord, keyOf, readHoldRecord, writeHoldRecord } from "./holdrecord.ts";
import { handoverReason } from "./holdstate.ts";
import { normKarta, normName } from "./names.ts";
import { canonRealm, learnRealm, sameRealm } from "./realms.ts";
import { standingLog } from "./store.ts";
import { emit } from "./streams.ts";
import { type Standing, state } from "./transport.ts";

export interface Place {
  standing: Standing;
  door: Door;
}

/** Channel addresses, written into each seat's hold record. */
export interface Channel {
  url: string;
  statusUrl: string | null;
  cwd?: string | null;
}

const extras = scoped(() => new Map<string, Place>()); // seat key → seat with its door (per session)

export const keyOfPlace = (s: Standing): string => keyOf(s.realm, s.karta, s.name ?? "");
export const extraPlaces = (): Place[] => [...extras.values()];

/** The channel seat in this graph (surely the same graph), if the bridge holds it. */
export const extraIn = (realm: unknown): Place | undefined =>
  extraPlaces().find((p) => sameRealm(p.standing.realm, realm));

/** The seat with exactly these three names among seats of other graphs. */
export function extraOf(realm: unknown, karta: unknown, name: unknown): Place | undefined {
  const p = extraIn(realm);
  return p &&
    String(p.standing.karta) === normKarta(karta) &&
    (p.standing.name ?? "") === normName(name)
    ? p
    : undefined;
}

/** Remember a seat of another graph for re-registering — one per graph. */
export function rememberPlace(s: Standing): void {
  state.places = state.places.filter((p) => !sameRealm(p.realm, s.realm));
  state.places.push(s);
}

function writeRecord(p: Place, ch: Channel, status?: string): void {
  const s = p.standing;
  writeHoldRecord(p.door.key, {
    realm: s.realm,
    karta: s.karta,
    name: s.name ?? "",
    url: ch.url,
    statusUrl: ch.statusUrl,
    status: status ?? readHoldRecord(p.door.key)?.status,
    cwd: ch.cwd ?? readHoldRecord(p.door.key)?.cwd,
    client: harnessName(),
    key: p.door.key,
  });
}

/** A beside seat's address from the main seat's handle (one channel, same handle) — marked derived. */
function deriveAddress(p: Place, primaryAddress: string | null | undefined): void {
  const handle = primaryAddress?.match(/^(.*):/)?.[1];
  if (!handle || !p.standing.name) return;
  p.door.address = `${handle}:${p.standing.name}`;
  p.door.addressDerived = true;
}

/**
 * Put a beside seat on the bridge's channel: its own door and hold record. Returns the key.
 * `primaryAddress` gives the beside seat's @handle:name; without it, hello names it later.
 */
export function addExtra(
  s: Standing,
  ch: Channel,
  hooks: DoorHooks,
  primaryAddress: string | null = null,
): string {
  const key = keyOfPlace(s);
  const have = extras.get(key);
  if (have) return key;
  // Another seat of the same graph replaces the old one: one seat per graph is already checked.
  for (const p of extraPlaces())
    if (sameRealm(p.standing.realm, s.realm))
      dropExtra(p.door.key, words(PLACES).anotherSeat(), true);
  const door = new Door(key, hooks);
  const place = { standing: s, door };
  deriveAddress(place, primaryAddress);
  door.open();
  extras.set(key, place);
  writeRecord(place, ch);
  standingLog(`held ${key} beside the channel`);
  besideWord({
    kind: "beside",
    key,
    place: { realm: s.realm, karta: String(s.karta), name: s.name ?? "" },
  });
  return key;
}

// beside/beside-gone let the thin bridge know the session's seats (lostplaces.ts);
// not held/released: those are about the main seat, which the OpenCode plugin reads.
const besideWord = (data: ChannelEvent): void =>
  emit({
    jsonrpc: "2.0",
    method: "notifications/message",
    params: { level: "info", logger: LOGGERS.channel, data },
  });

/** The channel changed addresses (reopened by the same seat): beside records follow it. */
export function repointExtras(ch: Channel): void {
  for (const p of extraPlaces()) writeRecord(p, ch);
}

/** Busyness accepted by the board for a beside seat — into its hold record. */
export function rememberExtraStatus(key: string, ch: Channel, text: string): void {
  const p = extras.get(key);
  if (p) writeRecord(p, ch, text || "");
}

/**
 * Release a beside seat; `forget` drops its record and re-register line. `own` — the
 * session's own close or revoke: the watchdog hears released with own and quits calmly (#6638).
 */
export function dropExtra(key: string, reason: string, forget: boolean, own = false): void {
  const p = extras.get(key);
  if (!p) return;
  extras.delete(key);
  if (own) {
    p.door.flushBatches();
    p.door.broadcast({ kind: "released", key, text: reason, own });
  }
  p.door.close();
  if (forget) {
    dropHoldRecord(key);
    state.places = state.places.filter((s) => keyOfPlace(s) !== key);
  }
  standingLog(`released ${key}: ${reason}${forget ? " (record dropped)" : ""}`);
  // A daemon change drops seats not by the agent's word: the thin bridge must remember them.
  if (!handoverReason()) besideWord({ kind: "beside-gone", key, text: reason });
}

export function dropAllExtras(reason: string, forget: boolean, own = false): void {
  for (const k of [...extras.keys()]) dropExtra(k, reason, forget, own);
  if (forget) state.places = [];
}

const nameOfAddress = (a: unknown): string => (typeof a === "string" ? a.replace(/^.*:/, "") : "");
const all = (primary: Place | null): Place[] => [...(primary ? [primary] : []), ...extraPlaces()];
const unresolved = (realm: string): boolean => !canonRealm(realm).startsWith("@");

/**
 * hello lists the channel's seats {realm, standing, standing_id, karta_seq}: each
 * recognized one gives its door the id; a seat's rN or slug graph learns its canonical form
 * when name and role match exactly one hello seat.
 */
export function learnFromHello(hello: Frame | null, primary: Place | null): void {
  const listed = Array.isArray(hello?.standings) ? hello.standings : [];
  for (const p of all(primary)) {
    const same = listed.filter(
      (e) =>
        nameOfAddress(e.standing) === (p.standing.name ?? "") &&
        (e.karta_seq == null || String(e.karta_seq) === String(p.standing.karta)),
    );
    const mine = same.filter((e) => sameRealm(e.realm, p.standing.realm));
    const e =
      mine.length === 1
        ? mine[0]
        : unresolved(p.standing.realm) && same.length === 1
          ? same[0]
          : null;
    if (!e) continue;
    if (e.realm && unresolved(p.standing.realm)) learnRealm(p.standing.realm, e.realm);
    if (typeof e.standing_id === "string" && e.standing_id) p.door.standingId = e.standing_id;
    if (typeof e.standing === "string" && e.standing) {
      p.door.address = e.standing;
      p.door.addressDerived = false;
    }
  }
}

/** Seats a frame is addressed to (by id when known, else by its address, learning the id); null — no address. */
function fitsOf(frame: Frame, places: Place[]): Place[] | null {
  const id = typeof frame.to_standing_id === "string" ? frame.to_standing_id : "";
  const byId = id ? places.find((p) => p.door.standingId === id) : undefined;
  if (byId) return [byId];
  const to = nameOfAddress(frame.to_standing);
  if (!id && !to && frame.realm == null && frame.karta_seq == null) return null;
  const fits = places.filter(
    (p) =>
      (frame.realm == null || sameRealm(frame.realm, p.standing.realm)) &&
      (!to || to === (p.standing.name ?? "")) &&
      (frame.karta_seq == null || String(frame.karta_seq) === String(p.standing.karta)),
  );
  if (fits.length === 1 && id && !fits[0].door.standingId) fits[0].door.standingId = id;
  return fits;
}

/**
 * A daemon-change spool frame addressed to a seat the bridge does not hold (#6586):
 * the seat key from re-register, else the frame's address. Null — a held seat's or no address.
 */
export function strayOf(frame: Frame | null, primary: Place): string | null {
  if (frame?.type !== "message" || fitsOf(frame, all(primary))?.length !== 0) return null;
  const back = state.places.find((s) => frame.realm != null && sameRealm(s.realm, frame.realm));
  return back
    ? keyOfPlace(back)
    : `${String(frame.to_standing ?? "—")}, ${words(PLACES).graph()} ${String(frame.realm ?? "—")}`;
}

/**
 * Whose door a frame is (#5838): by id, else by graph, address and role naming exactly
 * one seat. No address — the main seat; several or none — the main seat with a word, not silently.
 */
export function routeFrame(frame: Frame | null, primary: Place): { door: Door; note?: string } {
  if (!frame || !extras.size) return { door: primary.door };
  const fits = fitsOf(frame, all(primary));
  if (!fits) return { door: primary.door };
  if (fits.length === 1) return { door: fits[0].door };
  const id = typeof frame.to_standing_id === "string" ? frame.to_standing_id : "";
  return {
    door: primary.door,
    note: words(PLACES).unmatched(
      String(frame.id ?? "?"),
      id || "—",
      frame.to_standing ?? "—",
      frame.realm ?? "—",
      fits.length > 0,
      primary.door.key,
    ),
  };
}
