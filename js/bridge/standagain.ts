// The full stand call after a seat went from under the bridge (graph @nks/nks-dev, node #7554):
// named by this session's own former seat, never by another's record of the same directory.
import { STAND_MOVES, tool } from "../delivery/index.ts";
import { words } from "../shared/lang.ts";
import { sessionCwd } from "../shared/scope.ts";
import { callTool } from "./call.ts";
import { harnessName } from "./client.ts";
import { holdRecordsWhere, sessionOfBridge } from "./holdrecord.ts";
import { resolveRealms, sameRealm } from "./realms.ts";
import { standCall } from "./standmoves.ts";
import { type StatusMiss } from "./status.ts";
import { type Standing } from "./transport.ts";

/**
 * The seat this session's former bridge held in the graph, by the hold records (newest): the
 * same graph in @owner/slug (another owner's slug is another graph), the same role when the
 * call names it, this session's directory, harness and session — never another's seat.
 */
async function formerSeat(realm: string, karta: string): Promise<Standing | null> {
  const cwd = sessionCwd();
  const me = sessionOfBridge();
  const client = harnessName();
  const recs = holdRecordsWhere(
    (r) =>
      !!r.realm &&
      r.cwd === cwd &&
      (!karta || String(r.karta) === karta) &&
      (!r.client || !client || r.client === client) &&
      (!r.session || r.session === me),
  );
  await resolveRealms([realm, ...recs.map((r) => r.realm)], async () => {
    const r = await callTool(tool("realm"), { action: "list" });
    return r.isError ? null : r.text;
  });
  const best = recs
    .filter((r) => sameRealm(r.realm, realm))
    .sort((a, b) => (b.at ?? 0) - (a.at ?? 0))[0];
  return best ? { realm: best.realm, karta: best.karta, name: best.name } : null;
}

/**
 * A status call without karta that set no busy line, on a seat that went from under the
 * bridge (plugin restart, eviction, leave): the refusal names the full call that takes it
 * back — with karta and the former name (#7554); none known — the bare refusal.
 */
export async function standAgainWord(
  realm: string,
  karta: string,
  miss: StatusMiss | null,
): Promise<string> {
  if (!realm || !miss || !["none", "parked", "elsewhere"].includes(miss.why)) return "";
  const seat = "seat" in miss ? miss.seat : await formerSeat(realm, karta);
  const call = seat ? standCall(seat.realm, seat.karta, seat.name ?? "") : "";
  return call ? ` ${words(STAND_MOVES).standAgain(call)}` : "";
}
