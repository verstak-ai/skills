// Handing a seat's socket to the successor on daemon change (graph @nks/nks-dev, nodes #6586, #6482):
// the leaving daemon keeps the socket until the successor's 4000 or the limit; frames go to the spool.
// The server counts a frame delivered once written, until it reads the close frame, so a
// closed socket would lose a word silently.
import { HANDOFF, LOGGERS } from "../delivery/index.ts";
import { EVICTED_CODE, type Frame, type Holder } from "../shared/channel.ts";
import { words } from "../shared/lang.ts";
import { socketPathOf, spoolFilePathOf } from "../shared/standings.ts";
import { CFG } from "./config.ts";
import { type ChannelEvent } from "./door.ts";
import { type Place, strayOf } from "./places.ts";
import { closeSpool, drainSpool, HANDOFF_MS, openSpool, spoolFrame } from "./spool.ts";
import { publishStatusTo } from "./statuspost.ts";
import { emit, log } from "./streams.ts";
import { localSocketAlive } from "./sweep.ts";

/** Kept seat sockets, per process: the daemon awaits them all before leaving. */
const pending = new Set<Promise<void>>();

function keepUntilEvicted(holder: Holder, key: string, statusUrl: string | null): void {
  const path = spoolFilePathOf(CFG.authDir, key);
  const door = socketPathOf(CFG.authDir, key);
  openSpool(path);
  let timer: ReturnType<typeof setTimeout> | undefined;
  let over = false;
  const done = new Promise<void>((resolve) => {
    const end = (why: string, after?: Promise<unknown>): void => {
      if (over) return;
      over = true;
      clearTimeout(timer);
      closeSpool(path);
      log(`place ${key} handed over: ${why}`);
      void Promise.resolve(after).then(() => resolve());
    };
    timer = setTimeout(() => {
      // No successor: the busy line leaves with the seat (graph @nks/nks-dev, nodes #5059, #6017).
      // A later bridge gets the seat back from the hold record, the line only in the same named
      // harness session (resume.ts); a bridge without a session name (Claude Code) gets none.
      const cleared = statusUrl ? clearBusy(key, statusUrl, door) : undefined;
      end(`no successor took the socket in ${HANDOFF_MS / 1000}s — closed`, cleared);
      holder.close("the successor did not take the place");
    }, HANDOFF_MS);
    holder.handOff(
      (raw) => spoolFrame(path, raw),
      (code) =>
        end(
          code === EVICTED_CODE
            ? "the successor took the socket (close 4000)"
            : `the socket closed (${code})`,
        ),
    );
  });
  pending.add(done);
}

/**
 * Clears the busy line of a seat no successor took. An empty POST hits every seat of
 * the channel, so a listening door means a late successor and the line is left alone.
 * One window remains: the successor opened the service socket but has not raised its door.
 */
async function clearBusy(key: string, statusUrl: string, door: string): Promise<void> {
  if (await localSocketAlive(door)) {
    log(`place ${key}: busy line left — the successor's door is up`);
    return;
  }
  const st = await publishStatusTo(statusUrl, "", 3000);
  log(`place ${key}: ${st.ok ? "busy line cleared" : `busy line not cleared — ${st.body}`}`);
}

/**
 * Lets a seat's socket go: kept until eviction when handed over (keepFor), else closed.
 * `statusUrl` — the seat's busy line, cleared if no successor comes.
 */
export function letGo(
  holder: Holder | null,
  keepFor: string | null,
  reason: string,
  statusUrl: string | null = null,
): void {
  if (holder && keepFor) keepUntilEvicted(holder, keepFor, statusUrl);
  else holder?.close(reason);
}

/**
 * Feeds the leaving daemon's spool through this holder. A frame of a seat the bridge
 * does not hold is not given to the primary seat nor marked in its .seen — it becomes a
 * note to the doer.
 */
export function takeSpool(
  key: string,
  primary: () => Place | null,
  feed: (raw: string, frame: Frame | null) => void,
): void {
  drainSpool(spoolFilePathOf(CFG.authDir, key), (raw, frame) => {
    const p = primary();
    const to = p && strayOf(frame, p);
    if (!p || !to) return feed(raw, frame);
    const text = words(HANDOFF).strayFrame(String(frame?.id ?? "?"), to, p.door.key, raw);
    log(text);
    const ev: ChannelEvent = { kind: "note", text };
    p.door.broadcast(ev);
    emit({
      jsonrpc: "2.0",
      method: "notifications/message",
      params: { level: "info", logger: LOGGERS.channel, data: ev },
    });
  });
}

export const handoffsSettled = (): Promise<void> => Promise.all([...pending]).then(() => undefined);
