// The `watchdog` subcommand: a watchdog under a harness observer. The bridge holds the
// standing socket (../bridge/hold.ts); this process is its local client: it prints each
// frame to stdout (under Monitor each line is an event in the doer's turn) and exits
// non-zero, loudly, on a dead token and on drops while the service is alive. It holds
// no secret and needs no argument while the bridge holds one standing.
import { writeSync } from "node:fs";

import { envName } from "../delivery/index.ts";
import { addressedToMine } from "../shared/addressed.ts";
import { type Frame } from "../shared/channel.ts";
import { batchLine, caseKey, frameToText } from "../shared/frame-text.ts";
import { deliveryKeys, noteSeen, seenIds } from "../shared/seen.ts";
import { seenFilePathOf } from "../shared/standings.ts";
import { adoptSeenPath, attach, heldHeads, resolveStanding, staleOf } from "./client.ts";
import { RingReplay } from "./replay.ts";
import { doer, wd } from "./words.ts";

// Claude Code's Monitor cuts an event line longer than ~500 chars and glues the lines
// of one burst into one event. A message frame goes as the same text as in pi and
// OpenCode, its body line by line (graph @nks/nks-dev, nodes #5011, #5033).
const LINE_MAX = 400;

export function wrapLines(text: string, max = LINE_MAX): string[] {
  const out: string[] = [];
  for (const line of text.split("\n")) {
    let rest = line;
    while ([...rest].length > max) {
      const head = [...rest].slice(0, max).join("");
      const cut = head.lastIndexOf(" ");
      const at = cut > max / 2 ? cut : head.length;
      out.push(rest.slice(0, at).trimEnd());
      rest = rest.slice(at).trimStart();
    }
    out.push(rest);
  }
  return out;
}

// Monitor glues lines arriving within ~200 ms into one event: a frame outside a batch
// is printed as its own event, with a pause longer than the glue window around it.
// The variable is a probe seam, not a human knob.
const ALONE_GAP_MS = Number(process.env[envName("WATCHDOG_ALONE_MS")]) || 300;
/** At most this many count-only batch heads wait for an addressed line. */
const RIDERS_MAX = 100;
let queue: Promise<void> = Promise.resolve();
let lastAt = 0;
let lastAlone = false;

/** How long the attach line waits for the ring frames the bridge named, at most. */
const REPLAY_WAIT_MS = 1000;

/**
 * A block of lines in one write; alone — a separate Monitor event. after runs when the
 * write went out (write callback), so .seen is marked after delivery. A lines function
 * is built at print time; ready — lines known later than they queue: the queue waits.
 */
const out = (
  lines: string[] | (() => string[]),
  alone = false,
  after?: () => void,
  ready?: Promise<void>,
): void => {
  queue = queue.then(async () => {
    await ready;
    const wait = lastAt && (alone || lastAlone) ? lastAt + ALONE_GAP_MS - Date.now() : 0;
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    const text = typeof lines === "function" ? lines() : lines;
    if (!text.length) return after?.();
    const failed = await new Promise<boolean>((r) =>
      process.stdout.write(text.join("\n") + "\n", (e) => r(!!e)),
    );
    lastAt = Date.now();
    lastAlone = alone;
    if (!failed) after?.(); // not written means not delivered: re-arming delivers it again
  });
};

const log = (s: string): void => out([s]);

// The last word before exit is written synchronously, else the exit takes the line with
// it; the exit waits for the queue to drain.
const loudExit = (s: string, code: number): void => {
  queue = queue.then(() => exitNow(s, code));
};
const exitNow = (s: string, code: number): void => {
  try {
    writeSync(1, s + "\n");
    process.exit(code);
  } catch {
    process.stdout.write(s + "\n", () => process.exit(code));
    setTimeout(() => process.exit(code), 1000).unref();
  }
};

export function runWatchdog(argv: string[]): void {
  const target = resolveStanding(argv);
  if ("error" in target) {
    writeSync(2, `${doer(target.error)}\n`);
    process.exit(2);
  }
  // A printed frame is a delivered one: its mark, not the bridge's, keeps re-arming from repeats.
  let seenPath = seenFilePathOf(target.authDir, target.key);
  const seen = seenIds(seenPath);
  const queued = new Set<string>(); // ids queued for print: marked after it
  const folded: (() => void)[] = []; // marks of folded words of a run, after its line
  const cases = new Set<string>(); // cases already introduced in the current batch
  // Under Monitor a stdout line wakes the turn: a count-only batch (#6574) is not
  // printed by itself — its head waits and goes before the next addressed line.
  let head = false; // the current batch's head waits for its first addressed line
  let fresh = false; // the current batch has a frame not delivered before
  let batch: Frame[] = []; // the current batch's frames, its count
  const riders: Frame[][] = []; // count-only batches, as frames until printed (heldHeads)
  const riderMarks: (() => void)[] = []; // their marks, after printing
  const hold = (): void => {
    if (head) riders.push(batch);
    riders.splice(0, Math.max(0, riders.length - RIDERS_MAX)); // the oldest go: the count is bounded
    head = false;
  };
  /** Lines and marks of the current batch's addressed lines, printed as a block on its last frame. */
  let block: { lines: string[]; marks: (() => void)[]; carriers: Frame[] } = {
    lines: [],
    marks: [],
    carriers: [],
  };
  /** Waiting heads and the current batch's head as lines before the addressed one, at print time; marks after. */
  const take = (carriers: Frame[]): { lines: () => string[]; marks: (() => void)[] } => {
    const groups = [...riders.splice(0), ...(head ? [batch] : [])];
    head = false;
    return {
      lines: () => heldHeads(groups, (k) => seen.has(k), carriers),
      marks: riderMarks.splice(0),
    };
  };
  // The attach line goes after the ring frames, with the printed count (replay.ts).
  const ring = new RingReplay();
  // The watchdog's last word does not wait for the ring gate.
  const leave = (s: string, code: number): void => {
    ring.end();
    loudExit(s, code);
  };
  attach(target.path, {
    onEvent: (ev) => {
      const fromRing = ev.kind === "frame" && ring.next();
      switch (ev.kind) {
        case "attached": {
          seenPath = adoptSeenPath(ev.seen, seenPath, seen); // the seat's memory on its server
          const ready = ring.start(ev.buffered ?? 0, REPLAY_WAIT_MS);
          const key = ev.key;
          out(
            () => [
              wd().listening(key, ring.printed ? wd().backfilled(wd().frames(ring.printed)) : ""),
              ...(ring.hello ? [ring.hello] : []),
            ],
            false,
            undefined,
            ready,
          );
          break;
        }
        case "frame": {
          const f = ev.frame;
          if (fromRing && f?.type === "hello") {
            ring.hello = ev.raw ?? "";
            break;
          }
          if (f?.type !== "message") {
            log(ev.raw ?? ""); // a service frame (hello, status) is short and printed as is
            break;
          }
          // A repeat of a printed or queued frame (same id) is not printed (#5831).
          const id = typeof f.id === "string" ? f.id : "";
          const again = !!id && (seen.has(id) || queued.has(id));
          if (id && !again) queued.add(id);
          const mark = (): void => {
            for (const k of deliveryKeys(f)) noteSeen(seenPath, k, seen); // after printing
            queued.delete(id);
          };
          if (ev.batch) {
            // A case batch goes as a per-case count in the head (#6574); a line only for
            // the addressed seat. A folded word not for me prints no line and is marked with
            // the run line that counts it (#6081); an unaddressed one with the head that
            // counted it. The batch prints as one block on its last frame (client.ts heldHeads).
            if (ev.batch.at === 1) {
              cases.clear(); // a case's intro goes with its first line in the batch
              fresh = false;
              batch = [];
              block = { lines: [], marks: [], carriers: [] };
            }
            batch.push(f);
            if (!again) fresh = true;
            if (ev.batch.folded) {
              if (!again) folded.push(mark);
            } else {
              const within = folded.splice(0);
              const all = (): void => [...within, mark].forEach((m) => m());
              if (!addressedToMine(f)) riderMarks.push(all);
              else if (again) all();
              else {
                const first = !cases.has(caseKey(f));
                cases.add(caseKey(f));
                if (fromRing) ring.printed++;
                block.lines.push(...wrapLines(batchLine(f, ev.batch.fold, first)));
                block.marks.push(all);
                block.carriers.push(f);
              }
            }
            if (ev.batch.at < ev.batch.of) break;
            // A batch of only delivered frames is a repeat: its head went already.
            if (!fresh) head = false;
            if (!block.lines.length) {
              hold();
              break;
            }
            const r = take(block.carriers);
            const { lines, marks } = block;
            out(
              () => [...r.lines(), ...lines],
              false,
              () => [...r.marks, ...marks].forEach((m) => m()),
            );
            break;
          }
          if (!again) {
            if (fromRing) ring.printed++;
            const r = take([f]);
            out(r.lines, false, () => r.marks.forEach((m) => m()));
            out(wrapLines(frameToText(f, ev.raw ?? "")), true, mark);
          }
          break;
        }
        case "note":
          if (ev.batch)
            head = true; // a batch head goes by its frames, with its first addressed line
          else log(ev.text ?? "");
          break;
        case "stale": {
          // One batch, one event, judged at print time by the watchdog's memory
          // (shared/stalebatch.ts). Printed means delivered whole.
          let keys: string[] = [];
          const lines = (): string[] => {
            const b = staleOf(ev, (k) => seen.has(k));
            keys = b.keys;
            return b.text ? wrapLines(b.text) : [];
          };
          out(lines, false, () => {
            for (const k of keys) noteSeen(seenPath, k, seen);
          });
          break;
        }
        case "dead":
        case "evicted":
          leave(ev.text ?? wd().seatLost(), 1);
          break;
        case "alive":
          log(ev.text ?? wd().aliveNote()); // holding goes on, the watchdog keeps listening
          break;
        case "released":
          // An own close/revoke is the last word, without alarm or a non-zero code (#6638).
          if (ev.own) leave(wd().bridgeReleasedSocket(ev.text ?? ""), 0);
          else log(wd().bridgeReleasedSocket(ev.text ?? ""));
          break;
      }
      ring.settle(); // the ring is delivered: the attach line knows the count
    },
    onGone: (why) => leave(doer(why), 1),
  });
}
