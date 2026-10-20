// Two-phase addressedness of a word body, and of what closes a question to me, on the
// frame itself (graph @nks/nks-dev, nodes #6574, #6867; question memory — askmemory.ts).
//
// A body carries no addressee signs: the word in flight addressed it. Likewise what
// closes a question to me (a withdrawal, an answer by another seat of my role, a re-ask
// to another): it has no addressee. The exit watchdog leaves on the first frame and the second
// reaches a new process, so the bridge marks the second addressed and remembers the
// first on disk (.seen for words, .asks for questions — askdisk.ts) across restarts.
// The bridge's decision on a question frame is final: the frame carries asks_decided, and
// plugins and watchdogs do not re-decide it with their own question memory.
import { addressedToMine, asideKeyOf, wordKeyOf } from "../shared/addressed.ts";
import { closesMine, noteAsk } from "../shared/askmemory.ts";
import { ASK_KINDS } from "../shared/asks.ts";
import { type Frame } from "../shared/channel.ts";
import { roomKind } from "../shared/room-kinds.ts";
import { namedMine } from "../shared/seats.ts";
import { noteSeen } from "../shared/seen.ts";
import { diskAsks } from "./askdisk.ts";

const markOf = (frame: Frame): string => `word:${wordKeyOf(frame)}`;

/** A word in flight and a question to me go to memory; a body and a withdrawal get `addressed`, another's closer `closes_mine`. */
export function markAddressed(frame: Frame, seenPath: string, seen: Set<string>): void {
  const rk = roomKind(frame);
  if (rk?.kind === "said" && rk.aside && frame.body_pending === true) {
    noteSeen(seenPath, asideKeyOf(frame), seen); // its body goes to the addressee only (#6574)
  } else if (rk?.kind === "said" && rk.phase === "pending") {
    if (addressedToMine(frame)) noteSeen(seenPath, markOf(frame), seen);
  } else if (rk?.kind === "body" && !rk.aside) {
    if (seen.has(asideKeyOf(frame))) frame.addressed = false;
    else if (seen.has(markOf(frame)) || addressedToMine(frame)) frame.addressed = true;
  } else if (rk && (ASK_KINDS.has(rk.kind) || rk.kind === "progress")) {
    // One decision per frame, kept in .asks: a platform replay of the same frame
    // (bridge died inside the batch window) finds it though the question is closed.
    // A withdrawal of my question is mine; another's record that closes it is not —
    // the number it closes rides on the frame for the count's closing line (#6867).
    const id = typeof frame.id === "string" ? frame.id : "";
    const hit = `hit:${id}`;
    const store = diskAsks(seenPath);
    const n =
      (id && store.get?.(`closes:${id}`)) || closesMine(store, frame as Record<string, unknown>);
    if (store.has(hit) || (n && rk.kind === "progress")) {
      frame.addressed = true;
      if (id) store.add(hit);
    } else if (n && !namedMine(frame, rk.kind)) {
      Object.assign(frame, { addressed: false, closes_mine: n });
      if (id) store.add(`closes:${id}=${n}`);
    }
    noteAsk(store, frame as Record<string, unknown>);
    (frame as Record<string, unknown>).asks_decided = true;
  }
}
