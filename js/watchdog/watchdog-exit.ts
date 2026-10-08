// The `watchdog-exit` subcommand: exit on a frame, for harnesses WITHOUT a socket
// observer, where the only thing turned into an interrupt is a process ending. The
// bridge holds the socket; this client prints the first real message synchronously and
// EXITS zero — the exit is the delivery. Service frames go to stderr; a dead token and
// drops while the service is alive are a non-zero exit.
import { createHash } from "node:crypto";
import { writeSync } from "node:fs";

import { type ChannelEvent } from "../bridge/hold.ts";
import { addressedToMine } from "../shared/addressed.ts";
import { type Frame } from "../shared/channel.ts";
import { batchLine, caseKey, frameToText } from "../shared/frame-text.ts";
import { deliveryKeys, noteSeen, seenIds } from "../shared/seen.ts";
import { seenFilePathOf } from "../shared/standings.ts";
import { adoptSeenPath, attach, heldHeads, resolveStanding, staleOf } from "./client.ts";
import { doer, wd } from "./words.ts";

// The bridge replays its ring to every client that attaches, so a watchdog
// re-armed after a wake meets the frame it was woken on again. Leaving on it
// woke the doer three times on one frame (graph @nks/nks-dev, node #4469).
// What "already delivered" means is a fact about THIS standing, kept next to
// its socket: the ids this mode has left on. A frame the ring replays that is
// not in it — one that arrived while nobody was attached — still wakes.
// Stale frames never arrive here one by one: the bridge gathers a burst into one
// `stale` event (#4881) — noted as seen and waited past, bodies in the log.

export function frameId(ev: ChannelEvent): string {
  const id = ev.frame?.id;
  return typeof id === "string" && id
    ? id
    : `raw:${createHash("sha256")
        .update(ev.raw ?? "")
        .digest("hex")
        .slice(0, 16)}`;
}

const wake = (s: string): void => {
  writeSync(1, s + "\n"); // to the doer: what wakes them
};
const note = (s: string): void => {
  writeSync(2, s + "\n"); // to the log: what must not wake
};

export function runWatchdogExit(argv: string[]): void {
  const target = resolveStanding(argv);
  if ("error" in target) {
    note(doer(target.error));
    process.exit(2);
  }
  let seenPath = seenFilePathOf(target.authDir, target.key);
  const seen = seenIds(seenPath);
  let head = false; // the current batch's head waits for its last frame
  let fresh = false; // the current batch has a frame not delivered before
  let block: { lines: string[]; shown: Frame[]; ids: string[] } = { lines: [], shown: [], ids: [] };
  const folded: string[] = []; // ids of folded addressed words of a run, marked with its line (#6081)
  const cases = new Set<string>(); // cases already introduced in the current batch
  // A count-only batch (#6574) does not wake: its head waits for the next wake-up, its
  // ids for that marking; if the watchdog dies, the undelivered comes again from the ring.
  let batch: Frame[] = []; // the current batch's frames, its count if it did not wake
  const riders: Frame[][] = []; // count-only batches, as frames until a wake-up (heldHeads)
  const riderIds: string[] = [];
  const hold = (): void => {
    if (head) riders.push(batch);
    riders.splice(0, Math.max(0, riders.length - 100)); // the oldest go: the count is bounded
    head = false;
  };
  attach(target.path, {
    onEvent: (ev) => {
      switch (ev.kind) {
        case "frame": {
          const type = ev.frame?.type;
          if (type !== "message") return note(wd().notWakeup(type));
          const id = frameId(ev);
          const f = ev.frame ?? null;
          const has = (k: string): boolean => seen.has(k);
          // Deliver first, then mark what was printed (seen.ts deliveryKeys); the exit IS the
          // delivery. Marking before the wake-up would lose the frame on a death in between.
          const deliver = (
            groups: Frame[][],
            lines: string[],
            shown: Frame[],
            ids: string[],
          ): never => {
            for (const s of [...heldHeads(groups, has, shown), ...lines]) wake(s);
            const keys = [...riderIds.splice(0), ...ids, ...shown.flatMap((s) => deliveryKeys(s))];
            for (const k of keys) noteSeen(seenPath, k, seen);
            process.exit(0);
          };
          if (!ev.batch) {
            if (seen.has(id)) return note(wd().seenEarlier(id));
            return deliver(
              riders.splice(0),
              [f ? frameToText(f, ev.raw ?? "") : (ev.raw ?? "")],
              f ? [f] : [],
              [id],
            );
          }
          // A room batch (bridge, roomstack.ts) is one wake-up, printed as a block on the last
          // frame: the head over all its frames (#6574), lines only for the addressed seat.
          // A batch with nothing addressed does not wake: its head waits for the next one.
          if (ev.batch.at === 1) {
            batch = [];
            cases.clear(); // a case's intro goes with its first line in the batch
            block = { lines: [], shown: [], ids: [] };
            fresh = false;
          }
          if (f) batch.push(f);
          if (seen.has(id)) note(wd().seenEarlier(id));
          else {
            fresh = true;
            if (ev.batch.folded) folded.push(id);
            else if (!f || !addressedToMine(f)) riderIds.push(id, ...folded.splice(0));
            else {
              const first = !cases.has(caseKey(f));
              cases.add(caseKey(f));
              block.lines.push(batchLine(f, ev.batch.fold, first));
              block.shown.push(f);
              block.ids.push(id, ...folded.splice(0));
            }
          }
          if (ev.batch.at < ev.batch.of) return;
          if (!fresh) head = false; // a batch of only delivered frames is a repeat: not counted
          if (!block.lines.length) {
            hold();
            return note(wd().unaddressed());
          }
          const groups = [...riders.splice(0), ...(head ? [batch] : [])];
          head = false;
          return deliver(groups, block.lines, block.shown, block.ids);
        }
        case "stale":
          {
            // A stale batch does not wake but is not lost: bodies in the log, its marks noted;
            // judged at write time by the watchdog's memory (shared/stalebatch.ts).
            const b = staleOf(ev, (k) => seen.has(k));
            if (b.text) note(b.text);
            for (const k of b.keys) noteSeen(seenPath, k, seen);
          }
          break;
        case "dead":
        case "alive":
        case "evicted":
          note(ev.text ?? wd().seatLost());
          process.exit(1);
          break;
        case "attached":
          seenPath = adoptSeenPath(ev.seen, seenPath, seen); // the seat's memory on its server
          note(wd().listening(ev.key));
          break;
        case "released":
          note(wd().bridgeReleasedSocket(ev.text ?? ""));
          if (ev.own) process.exit(0); // an own close/revoke is not the bridge leaving (#6638)
          break;
        default:
          if (ev.kind === "note" && ev.batch) head = true; // a batch head goes by its frames
          note(ev.text ?? ev.kind);
      }
    },
    onGone: (why) => {
      note(doer(why));
      process.exit(1);
    },
  });
}
