// The launcher's revoke of its lead subagent's seat (graph @nks/nks-dev, nodes #7505, #6593, #7599):
// the plugin ends the child first (leads.ts — the outcome to the parent, the child's bridge
// leaves its cases, revokes and goes down), then the launcher's own revoke goes to the platform
// by the launcher's bridge, the seat's role filled in. One word of the launcher takes the seat
// off the board whatever the child's bridge managed; a seat the child's bridge revoked itself is
// not revoked twice — the second call met only "no such seat" (#7599); the same seat is the same
// canonical graph, role and name, a graph not known in that form is no match (№664); a seat
// already gone counts as taken off, any other refusal is a loud refusal of the launcher's call,
// not a quiet "released".
import { refusalOf, seatAlreadyOff } from "../bridge/refusal.ts";
import type { JsonRpcMessage } from "../bridge/types.ts";
import type { Released } from "./leaddoors.ts";
import { W } from "./leadwords.ts";

/**
 * The seat is already off only by the api's refusal data (tools.ts carries it on the throw),
 * read as the bridge's end-of-run revoke reads it (refusal.ts seatAlreadyOff). A missing role
 * or graph, a refusal without data, any prose — the seat is NOT taken off.
 */
const seatGone = (e: unknown): boolean =>
  seatAlreadyOff(refusalOf({ result: (e as { result?: unknown }).result } as JsonRpcMessage));

/**
 * The refusal's first line without the calls it suggests: the platform may list the role's
 * other seats with a revoke for each — the launcher's own seat among them (#7599).
 */
const reason = (message: string): string =>
  (message.split("\n").find((s) => s.trim()) ?? "").replace(/\b\w+\([^()]*\)/g, "…").trim();

export async function revokeAsLauncher(
  freed: Released,
  args: Record<string, unknown>,
  call: (args: Record<string, unknown>) => Promise<unknown>,
): Promise<string> {
  if (freed.off) return freed.word;
  const p = freed.place;
  const full = {
    ...args,
    ...(args.realm == null && p?.realm ? { realm: p.realm } : {}),
    ...(args.karta == null && p?.karta ? { karta: p.karta } : {}),
  };
  try {
    await call(full);
    return freed.word;
  } catch (e) {
    if (seatGone(e)) return freed.word;
    const why = reason((e as Error).message);
    throw new Error(W().unreleased(p?.name ?? String(args.standing ?? ""), why), { cause: e });
  }
}
