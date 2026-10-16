// A provisional seat (#777): the seat a plugin took for a root session by its project's cover
// before the agent's first turn (opencode/rootseat.ts) is the session's until the agent names
// its own. An explicit stand of the same session in the same graph on another name or role
// replaces it the way take=true does — the bridge releases it (releasePrior) and stands on the
// named one; a seat the agent took itself keeps the guard of one seat per bridge (#5164).
//
// Only a service call names a seat provisional: its id carries the service prefix the plugin
// alone sends (shared/serviceid.ts), so an agent's argument cannot fake it. Per session
// (shared/scope.ts): the daemon holds one per session.
import { randomBytes } from "node:crypto";

import { STAND_MOVES } from "../delivery/index.ts";
import { words } from "../shared/lang.ts";
import { scoped } from "../shared/scope.ts";
import { SERVICE_ID } from "../shared/serviceid.ts";
import { NAME_MAX } from "./names.ts";
import { sameRealm } from "./realms.ts";
import { ledIn } from "./standmoves.ts";
import type { JsonRpcMessage } from "./types.ts";

type Seat = { realm: string; karta: string; name: string };
const P = scoped(() => ({ seat: null as Seat | null }));

/** Fresh service seats have their own address even when two instances read an empty board.
 * Never race for host.repo (or host.repo.model) and rotate the neighbour's socket. */
export function name(base: string): string {
  const suffix = `.root-${randomBytes(12).toString("hex")}`;
  return (base || "root").slice(0, NAME_MAX - suffix.length).replace(/[.-]+$/, "") + suffix;
}

/** The call takes a provisional seat: the service id and the plugin's flag together. */
export const takesProvisional = (msg: JsonRpcMessage): boolean =>
  msg.params?.arguments?.provisional === true &&
  typeof msg.id === "string" &&
  msg.id.startsWith(SERVICE_ID);

/** The seat this bridge leads in the graph is provisional and this call is not the seating's own. */
export function replacesProvisional(realm: string, own: boolean): boolean {
  const s = P.seat;
  const led = ledIn(realm);
  if (own || !s || !led) return false;
  return sameRealm(s.realm, led.realm) && s.karta === String(led.karta) && s.name === led.name;
}

/** A stand succeeded: the seating's marks its seat; any other in the same graph unmarks it. */
export function noteStood(own: boolean, realm: string, karta: string, name: string): void {
  if (own) P.seat = { realm, karta: String(karta), name };
  else if (P.seat && sameRealm(P.seat.realm, realm)) P.seat = null;
}

/** The note of the released former seat: a provisional one is said to be replaced. */
export const releasedNote = (
  replaced: boolean,
  freed: { ok: boolean; note: string },
  prior: string,
) => (replaced && freed.ok ? words(STAND_MOVES).provisionalReplaced(prior) : freed.note);
