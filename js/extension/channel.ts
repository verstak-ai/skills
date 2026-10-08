// The "channel" half — standing frames inside a pi session.
//
// The bridge (a child process of this same session) holds the standing socket: it takes the
// address from the connect answer, reopens on a drop, tells a dead token from a rollout and
// publishes the busy line. The extension does what the bridge cannot — puts an arriving frame
// into the running turn and raises a turn for an idle agent: `pi.sendMessage(..., { triggerTurn:
// true })`. Frames come as the standard MCP `notifications/message` with the channel logger;
// the tools half hands them here as they are.
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

import { type ChannelEvent } from "../bridge/hold.ts";
import { envName, LOGGERS, PLUGIN, PRODUCT } from "../delivery/index.ts";
import { addressedToMine } from "../shared/addressed.ts";
import { type Frame } from "../shared/channel.ts";
import { batchHead, batchLines, frameToText } from "../shared/frame-text.ts";
import { words } from "../shared/lang.ts";
import { byKind, roomKind, stackOf } from "../shared/room-kinds.ts";
import { deliveryKeys, eventIn, isTact, onlyTacts, tactAt } from "../shared/seen.ts";

/** The fold window of unaddressed case frames; the variable is a probe seam. */
const ASIDE_MS = Number(process.env[envName("PI_ASIDE_MS")]) || 3_000;
/** How often a waiting tact asks whether the turn is free. */
const TACT_POLL_MS = 1_000;

/* eslint-disable @typescript-eslint/no-explicit-any -- the pi context is read here by two fields */

/**
 * The "channel" half: its own handlers, its own state, its own failure.
 * Returns the door by which the tools half hands the bridge's notifications here.
 */
export function setupChannel(pi: ExtensionAPI): (params: any) => void {
  const P = words(PLUGIN);
  let ctxRef: any = null;

  pi.on("session_start", async (_event, ctx) => {
    ctxRef = ctx;
  });
  pi.on("session_shutdown", async () => {
    ctxRef = null;
  });

  // fatal — the holding ended (a dead token); without it — a word into the turn, the holding goes on.
  function loud(text: string, fatal = true) {
    if (ctxRef?.hasUI) ctxRef.ui.notify(text, fatal ? "error" : "warning");
    pi.sendMessage(
      { customType: LOGGERS.channel, content: text, display: true, details: { fatal } },
      { triggerTurn: true, deliverAs: "steer" },
    );
  }

  // Case records not addressed to the seat (#6574) gather in a short window and leave as one
  // entry for the next turn (nextTurn: no interrupt, no raise): counts per case with addressed lines.
  const aside: Frame[] = [];
  let asideTimer: ReturnType<typeof setTimeout> | null = null;
  /** Marks of what entered the turn as text (seen.ts deliveryKeys): the fold's count skips them. */
  const marks = new Set<string>();
  function noteText(keys: string[] | undefined): void {
    for (const k of keys ?? []) marks.add(k);
    for (const old of marks) if (marks.size > 500) marks.delete(old);
  }
  function flushAsides(): void {
    if (asideTimer) clearTimeout(asideTimer);
    asideTimer = null;
    const got = aside.splice(0).filter((f) => !eventIn(f, (k) => marks.has(k)));
    if (!got.length) return;
    pi.sendMessage(
      {
        customType: LOGGERS.channel,
        content: [batchHead(got), ...batchLines(got)].join("\n"),
        display: true,
        details: { count: got.map((f) => f.id ?? null) },
      },
      { triggerTurn: false, deliverAs: "nextTurn" },
    );
  }

  // One batch — one word into the turn: stale frames or a wake-up with the backlog.
  function sendBatch(ev: ChannelEvent): void {
    pi.sendMessage(
      {
        customType: LOGGERS.channel,
        content: ev.text ?? "",
        display: true,
        details: ev.kind === "stale" ? { stale: true } : { backlog: true },
      },
      { triggerTurn: true, deliverAs: "steer" },
    );
  }

  // An attention tact waiting for a busy turn's end (#6569): once free, the agent sees the last.
  // The turn's end is agent_end; a tact that came while its handlers run is caught by polling.
  let tact: ChannelEvent | null = null;
  let tactPoll: ReturnType<typeof setInterval> | null = null;
  function releaseTact(): void {
    if (tactPoll) clearInterval(tactPoll);
    tactPoll = null;
    const t = tact;
    tact = null;
    if (t) sendBatch(t);
  }
  /** The batch's tact was taken by the platform before the waiting one — a stale batch comes after a live one. */
  function olderTact(ev: ChannelEvent): boolean {
    const at = tactAt(ev.frames);
    const was = tact ? tactAt(tact.frames) : "";
    return !!at && !!was && at < was;
  }
  function holdTact(ev: ChannelEvent): void {
    if (olderTact(ev)) return; // the waiting one is newer — this one is folded
    tact = ev;
    tactPoll ??= setInterval(() => {
      if (ctxRef?.isIdle?.() !== false) releaseTact();
    }, TACT_POLL_MS);
    (tactPoll as { unref?: () => void }).unref?.();
  }
  pi.on("agent_end", async () => releaseTact());

  return (params: any) => {
    const ev = params?.data as ChannelEvent | undefined;
    if (!ev || typeof ev !== "object") return;
    switch (ev.kind) {
      case "frame": {
        const frame = ev.frame ?? null;
        const raw = ev.raw ?? "";
        // Service frames wake nothing: hello proves the socket is held, and only that.
        if (frame?.type === "hello") {
          // setStatus is a (key, text) pair; one argument leaves the line without text, invisible.
          if (ctxRef?.hasUI) ctxRef.ui.setStatus?.(PRODUCT, P.listening());
          return;
        }
        if (frame?.type === "status") return;
        // The point of it all: the frame enters the running turn and raises an idle agent.
        // A case record not addressed to the seat (#6574) goes to the fold as a count, no text.
        if (frame && (byKind(frame) || roomKind(frame)?.aside) && !addressedToMine(frame)) {
          aside.push(frame);
          asideTimer ??= setTimeout(flushAsides, ASIDE_MS);
          (asideTimer as { unref?: () => void }).unref?.();
          return;
        }
        noteText(deliveryKeys(frame)); // the frame enters as text — the fold skips its event
        flushAsides(); // what gathered — before the next frame: the order holds
        // A room frame of a "pile" kind (#5851) waits for the turn's end; one without event_kind steers.
        const later = byKind(frame) && stackOf(frame) === "batch";
        pi.sendMessage(
          {
            customType: LOGGERS.channel,
            content: frameToText(frame, raw),
            display: true,
            details: frame ?? { raw },
          },
          { triggerTurn: true, deliverAs: later ? "followUp" : "steer" },
        );
        return;
      }
      case "dead":
        // There is no process to exit here: loud means the doer sees it in the turn, not in a log.
        loud(P.dead(String(ev.code)));
        return;
      case "stale":
      case "backlog":
        noteText(ev.marks); // the batch's marks — what it brought into the turn
        if (!ev.text) return;
        // An attention tact does not enter a busy turn: it waits, a new one replaces it (seen.ts foldedTacts).
        if (onlyTacts(ev.frames) && ctxRef?.isIdle?.() === false) return holdTact(ev);
        if (ev.frames?.some(isTact) && !olderTact(ev)) tact = null;
        sendBatch(ev);
        return;
      case "evicted":
        loud(P.evicted(String(ev.code)));
        return;
      case "alive":
        loud(P.alive(ev.version ?? ""), false);
        return;
      case "note":
        if (ctxRef?.hasUI && ev.text) ctxRef.ui.notify(P.note(ev.text), "warning");
        return;
      case "attached":
      case "held":
      case "released":
      case "lost":
      case "resumed":
        return;
    }
  };
}

/* eslint-enable @typescript-eslint/no-explicit-any */
