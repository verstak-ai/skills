// The `watchdog-codex` subcommand: a standing frame enters the RUNNING Codex thread
// through the app-server door (graph @nks/nks-dev, node #4286). Codex puts
// CODEX_THREAD_ID and CODEX_HOME only into the environment of commands the agent runs
// (MCP servers do not get them), so the agent starts this watchdog from its shell as a
// background task; each message frame goes into the thread by turn/start — a steer on a
// busy thread, a new turn on an idle one. A dead token and drops while the service is
// alive are a non-zero exit, as with the other watchdogs.
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

import { type ChannelEvent } from "../bridge/hold.ts";
import { CLIENTS, LOGGERS, PRODUCT } from "../delivery/index.ts";
import { addressedToMine } from "../shared/addressed.ts";
import { type Door, openDoor } from "../shared/appserver.ts";
import { type Frame } from "../shared/channel.ts";
import { frameToText } from "../shared/frame-text.ts";
import { deliveryKeys, eventIn, noteSeen, seenIds } from "../shared/seen.ts";
import { seenFilePathOf } from "../shared/standings.ts";
import {
  adoptSeenPath,
  attach,
  heldHeads,
  parseWatchdogArgs,
  resolveStanding,
  staleOf,
} from "./client.ts";
import { doer, wd } from "./words.ts";

const FLUSH_WAIT_MS = 5000; // an own release waits for in-flight puts at most this long

const note = (s: string): void => {
  process.stderr.write(s + "\n");
};

export function codexDoorPath(): string {
  const home = process.env.CODEX_HOME?.trim() || join(homedir(), ".codex");
  return join(home, "app-server-control", "app-server-control.sock");
}

export function runWatchdogCodex(argv: string[]): void {
  parseWatchdogArgs(argv); // the language from the bridge, before the first word to the doer
  const threadId = process.env.CODEX_THREAD_ID?.trim();
  if (!threadId) {
    note(wd().noThread());
    process.exit(2);
  }
  const socketPath = codexDoorPath();
  if (!existsSync(socketPath)) {
    note(wd().noDoor(socketPath));
    process.exit(2);
  }
  const target = resolveStanding(argv);
  if ("error" in target) {
    note(doer(target.error));
    process.exit(2);
  }
  let seenPath = seenFilePathOf(target.authDir, target.key);
  const seen = seenIds(seenPath);
  const waiting = new Map<number, string[]>(); // turn/start request id → frame ids awaiting acceptance

  let door: Door | null = null;
  let ready: Promise<Door> | null = null;
  let nextId = 1;

  function open(): Promise<Door> {
    if (ready) return ready;
    ready = openDoor(
      socketPath,
      (m) => {
        // A frame is delivered when the thread ACCEPTED turn/start, not when it was sent (#5428).
        // A daemon's own request (has a method) is not a reply, even with a matching id.
        const ids = !m?.method && typeof m?.id === "number" ? waiting.get(m.id) : undefined;
        if (!ids) return;
        waiting.delete(m.id);
        settle(m.id, !m.error);
        if (m.error) return note(wd().threadRefused(m.error.message ?? wd().refusal()));
        note(wd().framePut(threadId));
        for (const id of ids) noteSeen(seenPath, id, seen);
      },
      (why) => {
        // Close the door for everyone first, then return: what comes back does not go into it.
        door = null;
        ready = null;
        const lost = [...waiting.values()].flat();
        const gone = [...waiting.keys()];
        waiting.clear();
        for (const r of gone) settle(r, false);
        note(wd().doorClosed(why, lost.join(", ")));
      },
    ).then((d) => {
      door = d;
      d.send({
        method: "initialize",
        id: nextId++,
        params: { clientInfo: { name: CLIENTS.watchdog, title: PRODUCT, version: "1" } },
      });
      d.send({ method: "initialized" });
      const back = again.splice(0);
      if (back.length) putStale(back);
      return d;
    });
    ready.catch((e: Error) => {
      note(wd().doorNotOpened(e.message));
      ready = null;
    });
    return ready;
  }

  // In-flight puts: an own release waits for them before exiting (#6638).
  const inFlight = new Set<Promise<void>>();
  function deliver(text: string, ids: string[] = []): Promise<void> {
    // In the thread from the moment it is queued, not from the door opening: batches judged
    // before that see its marks in waiting (seen.ts eventIn); a door failure removes them.
    const reqId = nextId++;
    waiting.set(reqId, ids);
    const p = put(reqId, text).finally(() => inFlight.delete(p));
    inFlight.add(p);
    return p;
  }
  async function put(reqId: number, text: string): Promise<void> {
    try {
      const d = door ?? (await open());
      d.send({
        method: "turn/start",
        id: reqId,
        params: { threadId, input: [{ type: "text", text }], turnTrigger: LOGGERS.channel },
      });
      note(wd().frameSent(threadId));
    } catch (e) {
      if (waiting.delete(reqId)) settle(reqId, false); // the door did not open: not in the thread
      note(wd().frameNotPut((e as Error).message));
    }
  }

  // Copies whose event rides only on a turn still awaiting the thread are not counted but
  // not lost: they wait with it. Accepted — their marks are written; refused or the door
  // closed — the count returns to pending and a stale batch is judged again: at once with
  // an open door, else when the next one opens (again; seen.ts eventIn).
  type Held = { frame: Frame; ids: string[]; stale: boolean };
  const heldBy = new Map<number, Held[]>();
  const again: Frame[] = [];
  function holdOut(items: Held[]): Held[] {
    return items.filter((h) => {
      if (eventIn(h.frame, (k) => seen.has(k))) return true;
      const r = [...waiting].find(([, ids]) => eventIn(h.frame, (k) => ids.includes(k)))?.[0];
      if (r === undefined) return true;
      heldBy.set(r, [...(heldBy.get(r) ?? []), h]);
      return false;
    });
  }
  function settle(reqId: number, ok: boolean): void {
    const held = heldBy.get(reqId) ?? [];
    heldBy.delete(reqId);
    if (ok) return held.forEach((h) => h.ids.forEach((k) => noteSeen(seenPath, k, seen)));
    pend.unshift(...held.filter((h) => !h.stale).map(({ frame, ids }) => ({ frame, ids })));
    const stale = held.filter((h) => h.stale).map((h) => h.frame);
    if (!stale.length) return;
    if (door) putStale(stale);
    else again.push(...stale);
  }
  /** A stale batch is one turn, judged at put time (shared/stalebatch.ts); marks on acceptance. */
  function putStale(frames: Frame[], ev?: ChannelEvent): void {
    // An older bridge's batch goes as its text, nothing to judge it by (client.ts staleOf).
    const rest = ev?.unshown
      ? frames
      : holdOut(frames.map((f) => ({ frame: f, ids: deliveryKeys(f), stale: true }))).map(
          (h) => h.frame,
        );
    const b = staleOf({ ...(ev ?? { kind: "stale" }), frames: rest }, (k) => seen.has(k));
    if (b.text) void deliver(b.text, b.keys);
    else for (const k of b.keys) noteSeen(seenPath, k, seen);
  }

  // The ring replays only what nobody delivered (#5428): frames that came between
  // armings, put in as live ones. A ring frame without an id cannot be marked and would
  // come on every arming, so it is skipped.
  let replay = 0;
  // Case records not addressed to the seat (#6574) pile up and start no turn: they ride
  // as a per-case count head with the next frame; their text does not go into the thread.
  let pend: { frame: NonNullable<ChannelEvent["frame"]>; ids: string[] }[] = [];
  /**
   * The pending count as a head before `text`, built at put time by the watchdog's memory;
   * copies of an event on a turn awaiting the thread wait with it (holdOut, client.ts heldHeads).
   */
  const withPend = (text: string, ids: string[], carrier?: ChannelEvent["frame"]): void => {
    const got = holdOut(pend.map((p) => ({ ...p, stale: false })));
    pend = [];
    const head = heldHeads([got.map((g) => g.frame)], (k) => seen.has(k), carrier ? [carrier] : []);
    const keys = [...got.flatMap((g) => g.ids), ...ids];
    const lines = [...head, ...(text ? [text] : [])];
    // Nothing to put, what waited is already in a turn: marks are written, no empty turn.
    if (!lines.length) return void keys.forEach((k) => noteSeen(seenPath, k, seen));
    void deliver(lines.join("\n"), keys);
  };
  attach(target.path, {
    onEvent: (ev) => {
      switch (ev.kind) {
        case "frame": {
          const fromRing = replay > 0;
          if (fromRing) replay--;
          const type = ev.frame?.type;
          if (type !== "message") return note(wd().notWakeup(type));
          if (fromRing && typeof ev.frame?.id !== "string") return note(wd().noIdFromRing());
          // A repeat of an already put frame (same id), the second line behind the bridge (#5831).
          if (typeof ev.frame?.id === "string" && seen.has(ev.frame.id))
            return note(wd().alreadyPut(ev.frame.id));
          // Not addressed to the seat: counted, piled up, no line put (#6574).
          if (ev.batch && ev.frame && !addressedToMine(ev.frame)) {
            pend.push({ frame: ev.frame, ids: deliveryKeys(ev.frame) });
            pend.splice(0, Math.max(0, pend.length - 500)); // the oldest go: the count is bounded
            return;
          }
          // The piled-up count as a head in front; the frame as text, marks on acceptance.
          withPend(frameToText(ev.frame, ev.raw ?? ""), deliveryKeys(ev.frame), ev.frame);
          break;
        }
        case "stale":
          putStale(ev.frames ?? [], ev);
          break;
        case "dead":
        case "evicted":
          note(ev.text ?? wd().seatLost());
          void deliver(ev.text ?? wd().codexLost()).then(() => process.exit(1));
          break;
        case "alive":
          note(ev.text ?? wd().aliveNote());
          void deliver(ev.text ?? wd().codexAlive()); // holding goes on, the watchdog keeps listening
          break;
        case "attached":
          replay = ev.buffered ?? 0;
          seenPath = adoptSeenPath(ev.seen, seenPath, seen); // the seat's memory on its server
          note(wd().listeningCodex(ev.key, threadId));
          break;
        case "released":
          note(wd().bridgeReleasedSocket(ev.text ?? ""));
          // An own close/revoke/leave: last frames and the pending count into the thread, then exit (#6638).
          if (!ev.own) break;
          if (pend.length) withPend("", []);
          if (again.length) putStale(again.splice(0)); // a batch that waited for the door opens it
          // A door that never answers the upgrade would hold the watchdog forever: a limit and a loud exit.
          setTimeout(() => {
            note(wd().flushNotPut(FLUSH_WAIT_MS / 1000));
            process.exit(1);
          }, FLUSH_WAIT_MS);
          void Promise.allSettled([...inFlight]).then(() => process.exit(0));
          break;
        default:
          note(ev.text ?? ev.kind);
      }
    },
    onGone: (why) => {
      note(doer(why));
      process.exit(1);
    },
  });
}
