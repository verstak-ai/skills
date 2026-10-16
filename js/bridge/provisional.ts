// A provisional seat (#7972): the seat a plugin took for a root session by its project's cover
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
import { SERVICE_ID } from "../shared/serviceid.ts";
import {
  type HoldRecord,
  keyOf,
  readHoldRecord,
  sessionOfBridge,
  writeHoldRecord,
} from "./holdrecord.ts";
import { NAME_MAX } from "./names.ts";
import { ledIn } from "./standmoves.ts";
import type { JsonRpcMessage } from "./types.ts";

/** Fresh service seats have their own address even when two instances read an empty board.
 * Never race for host.repo (or host.repo.model) and rotate the neighbour's socket. */
export function name(base: string): string {
  const suffix = `.root-${randomBytes(6).toString("hex")}`;
  return (base || "root").slice(0, NAME_MAX - suffix.length).replace(/[.-]+$/, "") + suffix;
}

/** The call takes a provisional seat: the service id and the plugin's flag together. */
export const takesProvisional = (msg: JsonRpcMessage): boolean =>
  msg.params?.arguments?.provisional === true &&
  typeof msg.id === "string" &&
  msg.id.startsWith(SERVICE_ID);

/** The seat this bridge leads in the graph is provisional and this call is not the seating's own. */
export function replacesProvisional(realm: string, own: boolean): boolean {
  const led = ledIn(realm);
  if (own || !led?.name) return false;
  const rec = readHoldRecord(keyOf(led.realm, led.karta, led.name), true);
  // The mark follows the hold record through return and daemon handover, not a name pattern.
  return rec?.provisional === true && !!sessionOfBridge() && rec.session === sessionOfBridge();
}

/** A stand succeeded: the seating's marks its seat; any other in the same graph unmarks it. */
export function noteStood(own: boolean, realm: string, karta: string, name: string): void {
  const key = keyOf(realm, karta, name);
  const rec = readHoldRecord(key, true);
  if (rec) writeHoldRecord(key, { ...rec, provisional: own });
}

/** Returning from a still-live own bridge uses stand internally (#6702), not an agent's choice.
 * Its new socket has a new URL; restore the original own record's mark on that returned seat. */
export function restore(rec: HoldRecord): void {
  if (rec.provisional !== true || !rec.session || rec.session !== sessionOfBridge()) return;
  const led = ledIn(rec.realm);
  if (led?.name === rec.name && String(led.karta) === String(rec.karta))
    noteStood(true, led.realm, String(led.karta), rec.name);
}

/** The note of the released former seat: a provisional one is said to be replaced. */
export const releasedNote = (
  replaced: boolean,
  freed: { ok: boolean; note: string },
  prior: string,
) => (replaced && freed.ok ? words(STAND_MOVES).provisionalReplaced(prior) : freed.note);
