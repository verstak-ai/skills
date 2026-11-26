// Seats beside come back with the main one (graph @nks/nks-dev, nodes #7602, #5838, #6482):
// a seat of another graph lies on the same channel, so its hold record carries the main
// seat's socket address. When the main seat returns from disk, every live record on that
// address is registered again on the channel — the same register that stood it — and gets
// its door back; nothing new opens on the board.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { type Frame } from "../shared/channel.ts";
import { standingsDirOf } from "../shared/standings.ts";
import { resolveAgainstLed, short } from "./call.ts";
import { harnessName } from "./client.ts";
import { CFG } from "./config.ts";
import { awaitHello } from "./hold.ts";
import { dropHoldRecord, type HoldRecord, keyOf, readHoldRecord } from "./holdrecord.ts";
import { placeFields } from "./placefields.ts";
import {
  type MoveSeat,
  rateLimitedWait,
  type RegisterMove,
  throughRateLimit,
} from "./ratelimit.ts";
import { learnRealm, otherRealm, resolvedRealm, sameRealm } from "./realms.ts";
import { registerByCall } from "./registergate.ts";
import { standingLog } from "./store.ts";
import { log } from "./streams.ts";

/** Live hold records of seats of other graphs on the channel at `url` (not left, this harness). */
function besideRecords(url: string, primary: HoldRecord): HoldRecord[] {
  const dir = standingsDirOf(CFG.authDir);
  if (!existsSync(dir)) return [];
  const out: HoldRecord[] = [];
  for (const f of readdirSync(dir).filter((x) => x.endsWith(".hold"))) {
    try {
      const raw = JSON.parse(readFileSync(join(dir, f), "utf8")) as HoldRecord;
      if (!raw || raw.url !== url || raw.client !== harnessName()) continue;
      if (sameRealm(primary.realm, raw.realm)) continue;
      const rec = readHoldRecord(keyOf(raw.realm, raw.karta, raw.name)); // an expired one is erased
      if (rec && !rec.left) out.push(rec);
    } catch {
      /* foreign or broken file */
    }
  }
  return out;
}

/** hello's seats of the channel that are the record's: its role and name outside the main seat's graph. */
const listedAs = (hello: Frame | null, rec: HoldRecord, primary: HoldRecord) =>
  (Array.isArray(hello?.standings) ? hello.standings : []).filter(
    (e) =>
      typeof e.realm === "string" &&
      !sameRealm(e.realm, primary.realm) &&
      String(e.standing ?? "").replace(/^.*:/, "") === rec.name &&
      (e.karta_seq == null || String(e.karta_seq) === String(rec.karta)),
  );

/** The record's seat id from hello — its graph, role and name, exactly one with an id; null — not known. */
function idFromHello(hello: Frame | null, rec: HoldRecord, primary: HoldRecord): string | null {
  const fits = listedAs(hello, rec, primary).filter((e) => sameRealm(e.realm, rec.realm));
  const id = fits.length === 1 ? fits[0]?.standing_id : null;
  return typeof id === "string" && id ? id : null;
}

/**
 * The record's graph as the agent named it (rN, slug) resolves to @owner/slug (#5838) — first
 * from hello, which lists the channel's seats with canonical graphs, by role and name outside
 * the main seat's graph; the same role and name in two graphs leave it to the graph list.
 * An unresolved graph would make the register replace the main seat (standing.ts).
 */
async function resolveRecord(
  hello: Frame | null,
  rec: HoldRecord,
  primary: HoldRecord,
): Promise<void> {
  if (resolvedRealm(rec.realm)) return;
  const fits = listedAs(hello, rec, primary);
  if (fits.length === 1 && resolvedRealm(primary.realm))
    learnRealm(rec.realm, String(fits[0].realm));
  else await resolveAgainstLed(rec.realm);
}

/**
 * Register the seat of a hold record as a step of a return `move` (ratelimit.ts): a stop ends
 * the move; the seat (`seat`: its id, if known, and whether it is the main one) ended since the
 * move began is not registered (endedseats.ts, #7439); only the main seat waits out a 429 (#10801).
 */
export const registerRecord = (rec: HoldRecord, move: RegisterMove, seat: MoveSeat) =>
  throughRateLimit(
    () =>
      registerByCall(move, seat, {
        realm: rec.realm,
        karta: rec.karta,
        name: rec.name,
        ...placeFields(rec),
      }),
    rateLimitedWait,
    move,
    seat,
  );

/**
 * Register again the seats beside the main seat just returned from disk at `url`; the
 * register answer puts each on the channel (standing.ts), and its `beside` word tells the
 * thin bridge the seat is back. One not back gets no word: the thin bridge says it lost.
 * `move` — the return's register move (ratelimit.ts): a seat beside does not wait out a 429,
 * its refusal stands (#10801); one ended since the return began (endedseats.ts) is not
 * registered and its record goes; a stop ends the return, no register after it (#7439).
 */
export async function besideBack(
  url: string,
  primary: HoldRecord,
  move: RegisterMove,
): Promise<void> {
  if (CFG.satellite) return;
  const recs = besideRecords(url, primary);
  if (!recs.length) return;
  const hello = await awaitHello(0);
  for (const rec of recs) {
    const key = keyOf(rec.realm, rec.karta, rec.name);
    await resolveRecord(hello, rec, primary);
    if (!otherRealm(primary.realm, rec.realm)) {
      log(`seat beside ${key}: its graph is not known as another one — not registered`);
      continue;
    }
    const id = idFromHello(hello, rec, primary); // the seat is not held yet: hello names it
    const { r, stop, ended } = await registerRecord(rec, move, { id, main: false });
    // A stop ends the whole return (#7439): no register of the next seats beside.
    if (stop) return log(`seats beside from ${key} on: the return was stopped`);
    // This seat ended in the return (its owner took it off): it alone is not registered.
    if (!r || ended) {
      log(`seat beside ${key} ended during the return — not registered, its record dropped`);
      dropHoldRecord(key);
      continue;
    }
    standingLog(r.isError ? `beside not resumed ${key}` : `resumed-from-disk beside ${key}`);
    log(
      `seat beside ${key} with the main one: ${r.isError ? `not back — ${short(r.text)}` : "back"}`,
    );
  }
}
