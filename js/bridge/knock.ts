// The stand tool's knock into the human's seat by the full address from the wire
// (stand.ts); the rule — graph @nks/nks-dev, node #4342: one knock, one repeat no sooner
// than two minutes later, then a word to the human.
import { envName, tool } from "../delivery/index.ts";
import { scoped } from "../shared/scope.ts";
import { callTool as call, short } from "./call.ts";
import { sw } from "./standwords.ts";

/**
 * Knocks into human seats, keyed by graph, role, name and seat address (node #4342).
 * Lives in the bridge process; a new entry cycle (connect, a fresh socket) resets the
 * count for that seat: the repeat limit is per entry, not for life.
 */
const knocks = scoped(() => new Map<string, { at: number; count: number }>());
// Repeat window 2 minutes (node #4342); the variable is a seam for probes.
const KNOCK_REPEAT_AFTER_MS = Number(process.env[envName("STAND_KNOCK_REPEAT_MS")]) || 120_000;
const KNOCK_LIMIT = 2;

/** A new entry cycle of the seat resets its knock count. */
export function resetKnocks(realm: string, karta: string, name: string): void {
  for (const k of [...knocks.keys()])
    if (k.startsWith(`${realm}|${karta}|${name}|`)) knocks.delete(k);
}

export interface KnockAsk {
  realm: string;
  karta: string;
  name: string;
  room: string;
  /** the human seat holder's role — from the board or room_karta; none — no knock */
  roomKarta: string | null;
  again: boolean;
}

/** Knock into the human's seat if the rule allows — one line of the stand answer. */
export async function knock(k: KnockAsk): Promise<string> {
  const { realm, karta, name, room, roomKarta } = k;
  const key = `${realm}|${karta}|${name}|${room}`;
  const prior = knocks.get(key);
  const waited = prior ? Date.now() - prior.at : Infinity;
  if (prior && prior.count >= KNOCK_LIMIT) return sw().knockTwice(room);
  if (prior && !k.again) return sw().knockSent(room, waited, KNOCK_REPEAT_AFTER_MS);
  if (prior && waited < KNOCK_REPEAT_AFTER_MS)
    return sw().knockEarly(room, waited, KNOCK_REPEAT_AFTER_MS);
  if (!roomKarta) return sw().knockNoRole(room, realm);
  const s = await call(tool("channel"), {
    action: "send",
    realm,
    karta: roomKarta,
    standing: room,
    text: "join",
  });
  if (s.isError) return sw().knockRefused(room, short(s.text));
  knocks.set(key, { at: Date.now(), count: (prior?.count ?? 0) + 1 });
  return sw().knockDone(room, !!prior, short(s.text, 200));
}
