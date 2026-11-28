// Seats the server ended, and a life check on the dispatcher for a channel no live subscription
// holds (graph @nks/nks-dev, nodes #11362, #11359): never a turn. gone — only a seat the end's
// ended[] named (the authority, endreport.ts): a seat another live channel carries is spared by
// the server, not in ended[], and lives on — unknown, as a leave, an away, a supersede, a handover
// or a seat none held here. A held channel's check goes to its holding (lifeanswer.ts).
import { type Frame } from "../shared/channel.ts";
import { type Link } from "./muxlink.ts";
import { log } from "./streams.ts";

/** Seat ids remembered at most: the oldest goes first. */
const KEPT = 500;

/** The process's ended seats: ids are the platform's, one per seat. */
const ended = new Set<string>();

/** The server's ended[] of an end of this machine's session. */
export function seatsEnded(ids: readonly string[]): void {
  for (const id of ids) {
    ended.delete(id);
    ended.add(id);
  }
  for (const old of ended) if (ended.size > KEPT) ended.delete(old);
}

export const seatEnded = (id: string): boolean => !!id && ended.has(id);

export function lifeOfLetGo(link: Link, channel: string, f: Frame): void {
  const ref = typeof f.ref === "string" ? f.ref : null; // the server's string, echoed as is
  if (ref === null) return log(`dispatcher: a life_check of ${channel} without a string ref`);
  const standing_id = typeof f.standing_id === "string" ? f.standing_id : "";
  const state = seatEnded(standing_id) ? "gone" : "unknown";
  link.send({ type: "life", channel_id: channel, standing_id, ref, state });
  log(`dispatcher: life_check ${ref} of ${channel}: ${state}`);
}
