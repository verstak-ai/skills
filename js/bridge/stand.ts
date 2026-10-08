// The stand tool — the bridge's tool that takes a standing in one call (graph
// @nks/nks-dev: phenomenon #4511, inquiry #4508, transformation #4504). It never
// reaches the server: the bridge runs it with the same calls an agent used to make by
// the standing skill — the board, the derived name, connect and register (or register
// alone when this bridge already holds the socket: a live standing is not rotated
// without cause), the role's inbox hook, a knock into the human's seat by the full
// address from the wire (once per session: a second join is a repeat, not a talk), busyness.
// One answer: name, watchdog command, waiting frames, hook, knock receipt. A call with
// status on a seat the bridge already holds is busyness only (status.ts, #6509).
// No stand tool in a session means tools bypass the bridge or the bridge is an old build.
import { statSync } from "node:fs";
import { isAbsolute } from "node:path";

import { ID_PREFIX, tool } from "../delivery/index.ts";
import { scoped, sessionCwd } from "../shared/scope.ts";
import { alive, listens, nameOf, readBoard } from "./board.ts";
import {
  type AskedHearing,
  besideRefusal,
  callTool as call,
  leadsOtherPlace,
  otherPlaceWord,
  serialized,
  short,
  unresolvedRefusal,
} from "./call.ts";
import { CFG } from "./config.ts";
import { wireEviction } from "./evicted.ts";
import { seatField } from "./fields.ts";
import {
  askedHearing,
  boardHearing,
  ledHere,
  ofSeat,
  seatKarta,
  seatRealm,
  unresolvedAgent,
} from "./hearing.ts";
import {
  awaitHello,
  doors,
  hasStatusAddressFor,
  heldKey,
  holdsStanding,
  isParked,
  ledKey,
  noteStandCwd,
  standingIdIn,
  wasEvicted,
} from "./hold.ts";
import { keyOf, noteSeatBase } from "./holdrecord.ts";
import { armRoleHook } from "./hook.ts";
import { knock, resetKnocks } from "./knock.ts";
import { heardOnReturn, returnToStanding } from "./leave.ts";
import { listenBlock } from "./listen.ts";
import {
  deriveParts,
  fitName,
  git,
  joinName,
  NAME_MAX,
  nameFault,
  normKarta,
  normName,
  sanitize,
} from "./names.ts";
import { ownerRefusal } from "./owner.ts";
import { placeFields, rememberModel } from "./placefields.ts";
import { otherRealm } from "./realms.ts";
import { resumeFromDisk, takeLapsed } from "./resume.ts";
import { resumeWords } from "./resumewords.ts";
import { SATELLITE_TTL_S, satelliteGate, satelliteListenWord, ttlRefused } from "./satellite.ts";
import { baseOf, type Resumed, seatFor, theirsByRecord } from "./separate.ts";
import { boardHeaders, needRealmKarta, sw } from "./standwords.ts";
import { busyLine, publishStatus, standStatusOnly, TAKE_PATH, TURNED_GUIDANCE } from "./status.ts";
import { state } from "./transport.ts";
import { type JsonRpcMessage } from "./types.ts";
import { readLatest, staleNotice } from "./update.ts";

/** One repeat of the call after a refused return to a left seat. */
const R = scoped(() => ({ again: false }));

/** The name of the seat the bridge leads — for the one-standing-per-bridge refusal. */
const ledName = (): string => state.standing?.name ?? "";

const isDirectory = (p: string): boolean => {
  try {
    return isAbsolute(p) && statSync(p).isDirectory();
  } catch {
    return false;
  }
};

export const isStandCall = (msg: JsonRpcMessage): boolean =>
  msg?.method === "tools/call" && msg?.params?.name === tool("stand");

/** Seat taken (evicted.ts, #6706): stand beside on name.N the same way as the stand tool with that name. */
wireEviction(async (place, cwd) => {
  const r = await serialized(() =>
    runStand({
      jsonrpc: "2.0",
      id: `${ID_PREFIX}bridge-evicted`,
      method: "tools/call",
      params: {
        name: tool("stand"),
        arguments: {
          realm: place.realm,
          karta: String(place.karta),
          name: baseOf(place.realm, place.karta, place.name ?? ""), // the base the seat was chosen from (#6706)
          ...(cwd && isDirectory(cwd) ? { cwd } : {}),
        },
      },
    }),
  );
  const text = ((r.result?.content ?? []) as { text?: string }[]).map((c) => c.text ?? "");
  return { ok: !r.result?.isError, text: text.join("\n") };
});

export async function runStand(msg: JsonRpcMessage): Promise<JsonRpcMessage> {
  // Busyness on a seat the bridge already holds — the line only (#6509).
  const statusOnly = await standStatusOnly(msg);
  if ("reply" in statusOnly) return statusOnly.reply;
  const a = msg.params?.arguments ?? {};
  let realm = typeof a.realm === "string" ? a.realm.trim() : "";
  let karta = a.karta != null ? normKarta(a.karta) : "";
  const lines: string[] = [];
  const done = (isError = false): JsonRpcMessage => ({
    jsonrpc: "2.0",
    id: msg.id,
    result: {
      ...(isError ? { isError: true } : {}),
      content: [{ type: "text", text: lines.join("\n") }],
    },
  });
  if (!realm || !karta) {
    lines.push(needRealmKarta(statusOnly.miss, statusOnly.of));
    return done(true);
  }
  const model = typeof a.model === "string" && a.model.trim() ? a.model : undefined;
  rememberModel(model);
  // Default directory is the harness bridge's: for a daemon session, the thin bridge's cwd.
  const cwd = typeof a.cwd === "string" && a.cwd.trim() ? a.cwd.trim() : sessionCwd();
  // A bad cwd would address another seat — a refusal aloud, as for an explicit name (#5068).
  if (cwd !== sessionCwd() && !isDirectory(cwd)) {
    lines.push(sw().badCwd(cwd, !isAbsolute(cwd)));
    return done(true);
  }
  const nameNotes: string[] = [];
  // The name is the seat's address: an explicit name is taken as is or refused aloud; a
  // silently shortened one addresses ANOTHER seat (#5068). A derived name is cut to the
  // server's limit with a note right after the header.
  const asked = normName(a.name);
  if (asked) {
    const fault = nameFault(asked);
    if (fault) {
      lines.push(sw().badName(asked, fault, NAME_MAX));
      return done(true);
    }
  }
  // The owner's role — only on the human's word (owner.ts, #6550 p.2).
  const notOwner = await ownerRefusal(realm, karta);
  if (notOwner) {
    lines.push(notOwner);
    return done(true);
  }
  // A subagent's satellite seat (satellite.ts, #6002): only on a satellite bridge, and only it there.
  const gate = await satelliteGate(a, realm, karta, asked);
  if (gate && !gate.ok) {
    lines.push(gate.refusal);
    return done(true);
  }
  const sat = gate?.ok ? { name: gate.name, caller: gate.caller } : null;
  if (gate?.ok) nameNotes.push(...gate.notes);
  const parts = asked || sat ? null : deriveParts(model, cwd);
  const fitted = parts ? fitName(parts) : null;
  const derived = asked || sat ? "" : (fitted?.name ?? "");
  let name = asked || sat?.name || derived;
  const base = sat ? "" : name; // base of a seat beside: the derived or explicit name (#6706)
  realm = await seatRealm(realm, name); // one graph form (#5838); own seat keeps its spelling (hearing.ts)
  karta = seatKarta(realm, karta, name); // "agent" — the own seat's role, before any check (hearing.ts)
  // The bridge already stands on a separate seat of this name — go there (#5407); take=true calls the name itself.
  const led0 = state.standing && !otherRealm(state.standing.realm, realm) ? state.standing : null;
  // The bridge remembers the base of a seat beside (#6706); it cannot be guessed from the name's
  // shape: glm-5.3 is not a seat beside glm-5.
  const ledSuffix =
    !!base &&
    !!led0 &&
    String(led0.karta) === String(karta) &&
    led0.name !== base &&
    baseOf(led0.realm, led0.karta, led0.name ?? "") === base;
  // A taken seat beside is no return: seatFor picks the next seat beside (#6706).
  const besideTaken = ledSuffix && !!led0 && wasEvicted(led0.realm, led0.karta, led0.name ?? "");
  if (ledSuffix && !besideTaken && a.take !== true) name = led0?.name ?? name;
  if (parts && fitted && fitted.cut.length) {
    const what = fitted.cut.map((k) => sw().cutPart(k)).join(", ");
    nameNotes.push(sw().nameCut(joinName(parts), NAME_MAX, name, what));
  }
  if (!asked && !sat && !model) nameNotes.push(sw().noModel());
  const room = typeof a.room === "string" && a.room.trim() ? a.room.trim() : null;
  // One standing per bridge (#5154): another seat while leading one only on explicit
  // take=true. A graph name unresolved to @owner/slug is refused, not guessed (#5838);
  // so is an unresolved role sentinel (hearing.ts).
  const unresolved = unresolvedRefusal(realm) ?? unresolvedAgent(karta, "connect");
  if (unresolved) {
    lines.push(unresolved);
    return done(true);
  }
  const led = besideTaken ? null : leadsOtherPlace(realm, karta, name);
  if (led && a.take !== true) {
    // Another session listens on the asked seat — take=true is not advised: evicting it is the human's word (#6706).
    // An unread board gives no take=true advice either: the bridge does not know who listens.
    const hearing = await askedHearing(realm, karta, name, cwd);
    lines.push(otherPlaceWord(led, keyOf(realm, karta, name), name === ledName(), hearing));
    return done(true);
  }
  // A seat of another graph stands beside on the channel the bridge holds (#5838).
  const noChannel = besideRefusal(realm, "stand");
  if (noChannel) {
    lines.push(noChannel);
    return done(true);
  }
  const prim = state.standing;
  const beside = !!prim && otherRealm(realm, prim.realm) && !holdsStanding(realm, karta, name);
  // The session directory goes into the hold record: a re-raised bridge returns the seat by it (#5140).
  noteStandCwd(cwd);

  const here = () => placeFields({ realm, karta, name }); // seat fields on every registration (#5174)
  const register = () =>
    call(tool("channel"), { action: "register", realm, karta, name, ...here() });

  // 1. The board — before any change.
  const board = await call(tool("channel"), { action: "list", realm });
  if (board.isError) {
    lines.push(sw().boardUnread(short(board.text)));
    return done(true);
  }
  // Fields or server prose (board.ts, #4514). Controlling moves — rotation, knock,
  // hook — only on a recognized unambiguous form; otherwise an honest refusal.
  const bd = readBoard(board);
  const { entries, recognized, declared } = bd;
  let own = entries.filter((e) => ofSeat(e, karta, name));
  // The header count disagrees with the parsed lines — who listens is unknown (hearing.ts):
  // no blind rotation; an explicit take=true is the doer's word.
  const unread = declared != null && declared !== entries.length;
  const hearing = (n: string): AskedHearing => boardHearing(bd, karta, n);
  if (!recognized || own.length > 1 || (hearing(name) === "unknown" && a.take !== true)) {
    lines.push(
      !recognized
        ? sw().boardUnknown(short(board.text, 160), ...boardHeaders())
        : own.length > 1
          ? sw().boardAmbiguous(own.length, name, karta)
          : sw().boardCount(declared ?? 0, entries.length),
    );
    return done(true);
  }
  // A former bridge of this session holds the name — ours, taken back; another session —
  // stand beside on name.N with hearing; never sign with someone else's seat (#6706).
  let ownSession = false;
  let byRecord: Resumed | null = null; // own seat returned by the hold record (seatFor)
  // Base of a seat beside: an explicit seat-beside name — its base, not base.N.N; a derived one is its own base (#6706).
  const root = !base ? "" : asked ? baseOf(realm, karta, base) : base;
  // A seat of another graph stands by register, which takes no hearing: the seat is chosen the same way.
  if (base && (a.take !== true || beside) && name === base) {
    const seat = await seatFor(realm, karta, base, hearing, beside, cwd, root);
    const choice = seat.choice;
    byRecord = seat.resumed;
    if ("refusal" in choice) {
      lines.push(choice.refusal);
      return done(true);
    }
    name = choice.name;
    ownSession = choice.own;
    own = entries.filter((e) => ofSeat(e, karta, name));
    if (own.length > 1) {
      lines.push(sw().boardAmbiguous(own.length, name, karta));
      return done(true);
    }
    if (choice.note) nameNotes.push(choice.note);
  }
  // Before connect: this choice's base into the record and the base file (#6706).
  if (base) noteSeatBase(keyOf(realm, karta, name), root);
  const take = a.take === true || ownSession;
  const sub = !!sat || baseOf(realm, karta, name) !== name; // seat beside and satellite: no role inbox hook
  // Seats of the former name standard (host.repo.branch) of the same host and repo are
  // orphans after the move to host.repo.model: cases and inbox hooks hold their address, nobody listens. The former name is
  // told by a third part equal to a local branch — otherwise it is a neighbour on another
  // model, and its seat must not be touched.
  const stem = name.split(".").slice(0, 2).join(".");
  const branches = new Set(
    git(["branch", "--format=%(refname:short)"], cwd)
      .split("\n")
      .map((x) => sanitize(x.trim()))
      .filter(Boolean),
  );
  const legacy = entries.filter((e) => {
    if (sat) return false; // the caller's former seats are not the satellite's business
    if (e.karta !== karta || nameOf(e.address) === name) return false;
    const own = nameOf(e.address);
    if (!own.startsWith(`${stem}.`)) return false;
    const third = own.slice(stem.length + 1);
    return branches.has(third) && alive(e);
  });
  for (const e of legacy) nameNotes.push(sw().legacy(e.address, realm, karta));
  if (unread) lines.push(sw().boardCountFound(declared ?? 0, entries.length));
  const mine = own[0];
  let incoming = mine?.incoming ?? null;

  // 2. The seat. This bridge holds the socket — register. Another session's seat does not
  // get here — a seat beside was chosen above (#6706); a former bridge of this session —
  // connect, as by take. Otherwise connect and register; a new socket resets the knock count.
  let how: string;
  let heardHere: boolean;
  // Own seat whose socket the bridge is reopening itself: the board still reads it listening — it is us.
  const reopening = !sat && !holdsStanding(realm, karta, name) && ledHere(realm, karta, name);
  const listensElsewhere =
    !!mine && listens(mine) && !holdsStanding(realm, karta, name) && !reopening;
  // A bridge raised again under a seat the former bridge of this directory held: the seat
  // returns from disk, not rotated — same address, hooks and queue (#5061). A board still
  // reading "listening" was handled above by record, with hearing (seatFor; #6706). A
  // satellite never returns from disk (satellite.ts); another named session's record is
  // its seat — only its bridge returns it (#6706).
  const fresh =
    !sat &&
    !take &&
    !reopening &&
    !holdsStanding(realm, karta, name) &&
    !isParked(realm, karta, name) &&
    !theirsByRecord(keyOf(realm, karta, name));
  const resumed =
    byRecord ?? (fresh && !listensElsewhere ? await resumeFromDisk(realm, karta, name) : null);
  const extra: string[] = []; // lines after the answer's header
  // This bridge held the socket before the call (own register, return from disk): no hello wait.
  let socketBefore = false;
  // take=true is an explicit new entry cycle: connect even when the socket is already ours.
  if (beside) {
    // A channel holds seats in several graphs: register adds the seat on the same socket;
    // connect would open a second channel (#5838).
    const r = await register();
    if (r.isError) {
      lines.push(sw().refused("register", short(r.text)));
      return done(true);
    }
    heardHere = holdsStanding(realm, karta, name);
    // The seat id comes from the register answer (standing.ts); without it frames find the seat by graph and address.
    if (heardHere && !standingIdIn(realm)) extra.push(sw().noIdInRegister());
    how = sw().howBeside(ledKey() ?? "");
  } else if (resumed) {
    const r = await register();
    if (r.isError) {
      lines.push(sw().refused("register", short(r.text)));
      return done(true);
    }
    heardHere = true;
    socketBefore = true;
    // A return does not republish the record's busy line (#6017): a fresh mark would pass old words as current.
    how = `${resumed.word}, register`;
  } else if (!take && isParked(realm, karta, name) && returnToStanding(tool("stand"))) {
    // Left the seat and came back: same address, socket reopened, register attributes. If
    // another session turned the address meanwhile, the socket is refused and released —
    // the same call again picks a seat beside (#6706).
    await heardOnReturn(); // no hello — the address may have turned: socket released (leave.ts)
    if (!holdsStanding(realm, karta, name) && !R.again) {
      R.again = true;
      try {
        return await runStand(msg);
      } finally {
        R.again = false;
      }
    }
    const r = await register();
    if (r.isError) {
      lines.push(sw().refused("register", short(r.text)));
      return done(true);
    }
    heardHere = true;
    how = sw().howReturned();
  } else if (!take && (holdsStanding(realm, karta, name) || reopening)) {
    const r = await register();
    if (r.isError) {
      lines.push(sw().refused("register", short(r.text)));
      return done(true);
    }
    heardHere = true;
    socketBefore = true;
    how = sw().howRegister();
  } else if (!take && listensElsewhere) {
    // Another holder listens and no seat beside was chosen: no signing without hearing (#6706).
    lines.push(sw().otherHolder(mine?.address ?? name));
    return done(true);
  } else {
    const args: Record<string, unknown> = { action: "connect", realm, karta, name };
    Object.assign(args, here());
    if (typeof a.mute_siblings === "boolean") args.mute_siblings = a.mute_siblings;
    if (sat) args.ttl_seconds = SATELLITE_TTL_S; // a satellite's invitations do not outlive the run (#6001, condition a)
    let c = await call(tool("channel"), args); // the holder takes the new socket itself: a clean frame ring
    if (sat && c.isError && ttlRefused(c)) {
      // The contour holds the window range; outside it the run still needs the seat, with the default window.
      extra.push(sw().ttlRefused(SATELLITE_TTL_S, short(c.text, 120)));
      delete args.ttl_seconds;
      c = await call(tool("channel"), args);
    }
    if (c.isError) {
      lines.push(sw().refused("connect", short(c.text)));
      return done(true);
    }
    incoming =
      seatField(c.structured, "connect")?.inbound ??
      /https?:\/\/\S+\/channel\/in\/\S+/.exec(c.text)?.[0] ??
      incoming;
    const r = await register();
    if (r.isError) {
      lines.push(sw().takenButRegister(short(r.text)));
      return done(true);
    }
    resetKnocks(realm, karta, name);
    heardHere = true;
    how = ownSession
      ? sw().howOwnSession()
      : sw().howConnect(!!mine, listensElsewhere, a.take === true);
    // The seat retaken after a return that found no record: cases may have been lost (#6649).
    if (takeLapsed()) extra.push(sw().note(resumeWords.rejoin()));
  }
  lines.push(
    sw().head(mine?.address ?? name, karta, realm, how),
    ...nameNotes.map((n) => sw().note(n)),
    ...extra,
  );
  const block = heardHere ? (sat ? satelliteListenWord() : listenBlock(realm)) : null;
  if (block) lines.push(block);
  else lines.push(heardHere ? sw().noSocket() : sw().noWatchdog());

  // 3. hello — proof of holding; fresh only for this call's connect.
  if (!heardHere) lines.push(sw().besideNoDoor());
  else if (beside) lines.push(sw().besideHeard());
  else if (socketBefore) lines.push(sw().heldAlready());
  else {
    const hello = await awaitHello(4000);
    lines.push(hello ? sw().hello(String(hello.pending ?? 0)) : sw().noHello());
  }
  // The service socket is up but the local one for the watchdog is not — no hearing; say so.
  const localFault = heardHere
    ? (doors().find((d) => d.key === heldKey(realm))?.listenError ?? null)
    : null;
  if (localFault) lines.push(sw().noLocalSocket(localFault));

  // 4. The role's inbox hook — so a vimarsha posed_to arrives by the same socket.
  const main = state.standing;
  lines.push(
    await armRoleHook({
      realm,
      karta,
      name,
      incoming,
      heardHere,
      sub,
      beside: !!main && otherRealm(realm, main.realm), // a seat on a channel opened in another graph
      channelRealm: main?.realm ?? realm,
    }),
  );

  // 5. Knock into the human's seat — by the full address from the wire (knock.ts, #4342).
  if (room && !heardHere) {
    lines.push(sw().knockNotHere(room));
  } else if (room) {
    const onBoard = entries.find((e) => e.address === room);
    const roomKarta =
      onBoard?.karta ??
      (typeof a.room_karta === "string" && a.room_karta.trim()
        ? a.room_karta.trim().replace(/^#/, "")
        : null);
    lines.push(
      await knock({ realm, karta, name, room, roomKarta, again: a.repeat_knock === true }),
    );
  }

  // 6. Busyness follows the standing the bridge leads, not the live socket (#5033):
  // also after eviction, while the bridge has the status address.
  if (typeof a.status === "string" && a.status.trim() && !hasStatusAddressFor(realm, karta, name)) {
    lines.push(sw().statusElsewhere(TAKE_PATH()));
  } else if (typeof a.status === "string" && a.status.trim()) {
    const st = await publishStatus(a.status.trim(), realm);
    lines.push(
      st.ok
        ? busyLine(a.status.trim(), realm)
        : sw().statusRefused(short(st.body), st.code === 404 ? ` ${TURNED_GUIDANCE()}` : ""),
    );
  }
  const stale = staleNotice(readLatest(CFG.authDir), CFG.authDir);
  if (stale) lines.push(stale);
  return done();
}
