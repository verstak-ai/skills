import { type Writable } from "node:stream";

import { BRIDGE_NAME } from "../delivery/index.ts";
import { currentScope, scoped } from "../shared/scope.ts";
import { CFG } from "./config.ts";
import { type JsonRpcMessage } from "./types.ts";

// The stop of last resort under a wind-down flush: long enough that a busy but
// living harness still gets its whole answer, short enough that no wedged pipe
// keeps a process alive on the machine.
const FLUSH_STOP_MS = 5_000;

// A harness that goes away leaves BOTH our pipes broken, and a write to a
// broken pipe fails asynchronously, as an error event on the stream. Unhandled,
// that event reaches the uncaughtException handler — which logs, writing to
// the same broken pipe, which fails again. The loop that follows burns a core
// and starves whatever else the process was doing; witnessed in the field as a
// pending login whose click landed on a bridge too busy to exchange it, twice,
// while the human was shown "authenticated" both times. So: note a stream's
// death once, and never answer a failed write with another write.
type Stream = Writable;
const deadStreams = new WeakSet<Stream>();

// Where a bridge session writes to the harness: the process's stdout for the full
// bridge; a session given stdio as streams (session.ts) has its own, per scope.
const out = scoped(() => ({ stream: null as Stream | null }));
const sessionStream = (): Stream => out.stream ?? process.stdout;

export function setSessionOutput(s: Stream): void {
  out.stream = s;
}

// A process without stderr (the machine daemon) logs to its journal; a daemon session
// logs into its own scope.
let processLog: ((line: string) => void) | null = null;
export function setProcessLog(fn: (line: string) => void): void {
  processLog = fn;
}

export function canWrite(s: Stream | null | undefined): s is Stream {
  return !!s && !deadStreams.has(s) && !s.destroyed && s.writable !== false;
}

export function guardStream(s: Stream | null | undefined): void {
  if (s) s.on("error", () => deadStreams.add(s));
}

// The last write did not fit the buffer: wait for drain before exit, not for an empty
// write's callback — under Bun that fires before the bytes reach the reader (measured:
// 300 KB to a stopped reader, callback at once, drain 0.7 s later). Under Node write()
// returns false exactly when the buffer passed highWaterMark.
const backlogged = new WeakSet<Stream>();

export function writeTo(s: Stream | null | undefined, text: string): boolean {
  if (!canWrite(s)) return false;
  try {
    const fit = s.write(text);
    if (!fit && !backlogged.has(s)) s.once("drain", () => backlogged.delete(s));
    if (fit) backlogged.delete(s);
    else backlogged.add(s);
    return true;
  } catch {
    deadStreams.add(s);
    return false;
  }
}

export function log(msg: string): void {
  const line = `[${BRIDGE_NAME} ${new Date().toISOString()}] ${msg}\n`;
  const sink = currentScope().log ?? processLog;
  if (sink) sink(line);
  else writeTo(process.stderr, line);
}

export function debug(msg: string): void {
  if (CFG?.debug) log(`debug: ${msg}`);
}

export function emit(msg: JsonRpcMessage): void {
  // The daemon outside a harness session writes to nobody: a word without its scope goes to the journal.
  if (!out.stream && processLog)
    return processLog(`emit outside of a session, dropped: ${JSON.stringify(msg).slice(0, 200)}\n`);
  writeTo(sessionStream(), JSON.stringify(msg) + "\n");
}

// Writing to a pipe is asynchronous, and process.exit does not wait: an answer
// still in the buffer dies with the process. One pipe buffer is 64KB, so the
// answers that get cut are the big ones — a whole realm read — and the harness
// sees a truncated line, which is silence wearing an answer's clothes. Every
// exit path goes through here first. Measured: 200KB written and exited on the
// spot arrives as 65536 bytes; drained first, it arrives whole.
export function flushStdout(out: Stream = sessionStream()): Promise<void> {
  return new Promise((resolve) => {
    // Not by writableLength: Bun does not keep it, and the flush would end before the write.
    if (!canWrite(out)) return resolve();
    // A pipe whose reader is gone never drains, so the drain callback never
    // fires — and an exit path that waits on it does not exit at all. The
    // reader's death has its own signal: the queued bytes fail, and the stream
    // errors. Wait for whichever comes first, and keep a long stop of last
    // resort under both, so no harness can wedge the wind-down.
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      out.off("error", finish);
      out.off("close", finish);
      resolve();
    };
    out.once("error", finish);
    out.once("close", finish);
    if (backlogged.has(out)) out.once("drain", finish);
    else out.write("", finish); // queued behind everything already written
    setTimeout(finish, FLUSH_STOP_MS).unref();
  });
}
