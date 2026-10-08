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
import { addressedToMine, wordKeyOf } from "../shared/addressed.ts";
import { closesMine, noteAsk } from "../shared/askmemory.ts";
import { ASK_KINDS } from "../shared/asks.ts";
import { type Frame } from "../shared/channel.ts";
import { roomKind } from "../shared/room-kinds.ts";
import { noteSeen } from "../shared/seen.ts";
import { diskAsks } from "./askdisk.ts";

const markOf = (frame: Frame): string => `word:${wordKeyOf(frame)}`;

/** A word in flight and a question to me go to memory; a body and a closer get `addressed`. */
export function markAddressed(frame: Frame, seenPath: string, seen: Set<string>): void {
  const rk = roomKind(frame);
  if (rk?.kind === "said" && rk.phase === "pending") {
    if (addressedToMine(frame)) noteSeen(seenPath, markOf(frame), seen);
  } else if (rk?.kind === "body" && !rk.aside) {
    if (seen.has(markOf(frame)) || addressedToMine(frame)) frame.addressed = true;
  } else if (rk && (ASK_KINDS.has(rk.kind) || rk.kind === "progress")) {
    // One decision per frame, kept in .asks: a platform replay of the same frame
    // (bridge died inside the batch window) finds it though the question is closed.
    const hit = `hit:${typeof frame.id === "string" ? frame.id : ""}`;
    const store = diskAsks(seenPath);
    if (store.has(hit)) frame.addressed = true;
    else if (closesMine(store, frame as Record<string, unknown>)) {
      frame.addressed = true;
      if (typeof frame.id === "string") store.add(hit);
    }
    noteAsk(store, frame as Record<string, unknown>);
    (frame as Record<string, unknown>).asks_decided = true;
  }
}
