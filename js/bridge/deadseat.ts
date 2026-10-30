// A dead agent's seat before its revoke (graph @nks/nks-dev, node #7493; case №677): the
// server says whether the seat is still on the socket the agent held — this machine's socket
// alone cannot: a bridge of another machine or home may take the name in the death window,
// and a revoke by name would close its new holder's live seat. And the hold record goes only
// with a confirmed revoke: a seat left on the board keeps it, so the window or the next start
// repeats the revoke.
import { tool } from "../delivery/index.ts";
import { normKarta, type SeatKey } from "../shared/seat.ts";
import { listens, nameOf, readBoard } from "./board.ts";
import { callTool } from "./call.ts";
import { dropHoldRecord, keyOf, readHoldRecord } from "./holdrecord.ts";
import { canonRealm } from "./realms.ts";
import { publishStatusTo } from "./statuspost.ts";
import { log } from "./streams.ts";
import { type Standing } from "./transport.ts";

export const seatKeyOf = (s: Standing): string => keyOf(s.realm, s.karta, s.name ?? "");

/** When the seat's hold record was last written (any age); null — no record. */
export const recordAt = (key: string): number | null => readHoldRecord(key, true)?.at ?? null;

/**
 * Whether a bridge held the seat after the dead run's end (case №677, round 6): any hold of it
 * — a return, a connect, an announced absence, a refresh — rewrites its hold record, so a record
 * newer than the one the run left means a later life of the seat, and this run's death window
 * is not its own any more: that life ends by its own window or waits by its own mark. `at` —
 * the record's time at the run's end; undefined — not known, the window goes as before.
 */
export function heldSince(key: string, at: number | null | undefined): boolean {
  if (at === undefined) return false;
  const now = recordAt(key);
  return now !== null && now > (at ?? 0);
}

/**
 * Drops the hold records of the seats this bridge's own revoke confirmed (caseexit.ts,
 * revokeOutcome); the answer — the seats still standing, their records kept and said aloud.
 */
export function dropConfirmed(places: Standing[], revoked: SeatKey[]): Standing[] {
  const left: Standing[] = [];
  for (const s of places) {
    const done = revoked.some(
      (k) => k.realm === canonRealm(s.realm) && k.karta === normKarta(s.karta) && k.name === s.name,
    );
    if (done) dropHoldRecord(seatKeyOf(s));
    else left.push(s);
  }
  if (left.length)
    log(
      `the agent's seats NOT revoked: ${left.map(seatKeyOf).join(", ")} — their hold records stay, the revoke repeats after the death window (#7493)`,
    );
  return left;
}

/**
 * Whether the dead agent's seat is still its own. `status` — the status address of the dead
 * socket: another holder's connect turns it, and it answers 404. The board: a seat someone
 * listens on is held by a live socket, and this machine's is dead. Taken — not revoked, the
 * own record dropped; not known (no answer, an unread board) — not revoked, the seat goes by
 * the platform's term.
 */
export async function stillOwn(s: Standing, status: string | null): Promise<boolean> {
  const key = seatKeyOf(s);
  const taken = (why: string): false => {
    log(`${key}: ${why} — another holder took it, not closed; the own hold record dropped`);
    dropHoldRecord(key);
    return false;
  };
  const unknown = (why: string): false => {
    log(`${key}: ${why} — not closed, the seat goes by the platform's term`);
    return false;
  };
  if (status) {
    const r = await publishStatusTo(status, "", 3000);
    if (r.code === 404) return taken("its socket's address was turned");
    if (!r.ok) return unknown(`its status address did not answer: ${r.body.slice(0, 120)}`);
  }
  const board = await callTool(tool("channel"), {
    action: "list",
    realm: s.realm,
    karta: normKarta(s.karta),
  }).catch((e: Error) => ({ isError: true, text: e.message, structured: undefined }));
  if (board.isError) return unknown(`the board did not read: ${board.text.slice(0, 120)}`);
  const bd = readBoard(board);
  const own = bd.entries.filter(
    (e) => e.karta === normKarta(s.karta) && nameOf(e.address) === (s.name ?? ""),
  );
  if (!bd.recognized || own.length > 1) return unknown("the board is not read unambiguously");
  if (!own.length) {
    log(`${key} is off the board already — the hold record dropped`);
    dropHoldRecord(key);
    return false;
  }
  if (listens(own[0])) return taken("someone listens on it");
  return true;
}
