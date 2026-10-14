// The "channel" half — standing frames inside an OpenCode session (graph @nks/nks-dev, node #4266).
//
// The session's bridge holds the standing socket; the plugin puts a frame into the agent's
// session as a prompt (ctx.session.prompt). steer enters the running turn at the next step,
// queue waits for the turn's end, one prompt per turn: a live frame and a loud word go steer,
// or frames lagged by hours (#5233). Wake-up and stale batches go queue: not urgent — but a
// wake-up or stale batch carrying the launcher's word to its lead steers, as the word alone would (#7505).
// Case frames for the pile go queue too, one prompt per pile: a head of counts per case and
// below it only lines addressed to the seat (#6574). While the pile's previous prompt is not
// taken, new frames gather here and leave as one when OpenCode says it took it; a pile of counts
// only wakes no turn and rides the next prompt into the session (the prompt hook). A direct word
// and a human's word go steer, whole. Delivery is handing control back to the agent; a frame
// gone to a log is a silencer (#4355).
//
// The addressee is the session whose bridge brought the frame; a frame of a bridge given to
// nobody yet goes to the freshest root seen; a child session is the addressee only of its own
// bridge (#5154).
import { type ChannelEvent } from "../bridge/hold.ts";
import { envName, OPENCODE, PLUGIN } from "../delivery/index.ts";
import { addressedToMine } from "../shared/addressed.ts";
import { askFromPerson } from "../shared/asks.ts";
import { classifyOrigin, type Frame, isDirectWord } from "../shared/channel.ts";
import { batchHead, batchLines, frameToText, markFrame } from "../shared/frame-text.ts";
import { words } from "../shared/lang.ts";
import { roomKind, stackOf } from "../shared/room-kinds.ts";
import { deliveryKeys, eventIn } from "../shared/seen.ts";
import { authDir } from "./bridge-io.ts";
import { createCuts } from "./cuts.ts";
import { processDescendants, processParent, shareLineage } from "./cutwait.ts";
import { createHalts, descendantsOf } from "./halts.ts";
import { type ChildLeads, fromLauncher, NO_LEADS } from "./leadframes.ts";
import type { Context } from "./plugin.ts";
import { setupTacts } from "./tacts.ts";
import { type Say } from "./tools.ts";

export interface Channel {
  /** The tools half's door: an event of session `session`'s bridge (null — nobody's yet); `child` — a child's own bridge. */
  onEvent(session: string | null, params: unknown, child?: boolean): void;
  /** OpenCode took a prompt from the session's queue (`inbox` — its id) or the session went idle (no id). */
  taken(session: string, inbox?: string): void;
  /** The session's turn is busy or free — by session.status. */
  status(session: string, busy: boolean): void;
  /** The session was deleted: its waiting tact has nowhere to go (tacts.ts), its stop goes (halts.ts). */
  gone(session: string): void;
  /** The session or an ancestor is stopped (another instance's stop too): its turn is cut once; false — not stopped. */
  halt(session: string): boolean;
  /**
   * How the stop's interrupt of session `session` and its descendants ended, whichever instance of
   * the process cuts them: null — every turn is cut (or nothing was stopped), a code — the first
   * refusal (cutwait.ts). `signal` drops the wait.
   */
  halted(session: string | null, signal?: AbortSignal): Promise<string | null>;
  /** The plugin stops: what gathered leaves now. */
  stop(): void;
  /** Counts of records waiting for a passing prompt into root session `session`; null — none. */
  ride(session: string): string | null;
  /** The stop word a turn of root session `session` reads while it stays stopped; null — none. */
  stopWord(session: string): string | null;
}

/** The case pile window; the variable is a probe seam. */
const CASE_BATCH_MS = Number(process.env[envName("OPENCODE_BATCH_MS")]) || 5_000;
/** A full pile leaves without waiting for the window. */
const CASE_BATCH_CAP = 20;
/** A pile prompt whose taking OpenCode keeps silent about longer is counted taken. */
const PENDING_MAX_MS = Number(process.env[envName("OPENCODE_PENDING_MS")]) || 120_000;
/**
 * A case frame for the pile: not a direct word and not a human's word (its flight and abort —
 * to the pile, #6081); a case record not addressed to the seat — to the pile at any stack (#6574).
 */
function toPile(frame: Frame | null): boolean {
  if (!frame || frame.type !== "message" || isDirectWord(frame)) return false;
  const rk = roomKind(frame);
  if (
    (frame.origin ?? classifyOrigin(frame)) === "human" &&
    !rk?.phase &&
    !rk?.aside &&
    !askFromPerson(frame)
  )
    return false;
  return !addressedToMine(frame) || stackOf(frame) === "batch"; // addressing before stack: a word in flight is remembered
}

/** How many unaddressed records wait for a passing prompt at most; older ones go. */
const RIDERS_MAX = 500;

interface Pile {
  session: string | null;
  child: boolean;
  held: Frame[];
  /** Piles of counts only (#6574): they wake no turn and ride the next prompt into the session. */
  riders: Frame[];
  timer: ReturnType<typeof setTimeout> | null;
  /** The pile's prompt in the session's queue, not taken yet; inbox null — still in flight. */
  pending: { session: string; inbox: string | null; at: number } | null;
  /** Marks of what entered this session as text (seen.ts deliveryKeys): the pile's count skips them. */
  marks: Set<string>;
}

const MARKS_KEPT = 500;

/* eslint-disable @typescript-eslint/no-explicit-any -- bridge notifications without a schema */

export function setupChannel(
  ctx: Context,
  say: Say,
  freshestRoot: () => string | null,
  parents: ReadonlyMap<string, string> = new Map(),
  onStop: (session: string) => void = () => {},
  leads: ChildLeads = NO_LEADS,
  /** A frame was laid into the session (the seat's pulse, pulse.ts). */
  prompted: (session: string, inbox: string | null, delivery: "steer" | "queue") => void = () => {},
): Channel {
  const W = words(OPENCODE);
  const P = words(PLUGIN);
  // The instance's lineage joins the process's: a stop's confirmation waits for descendants other
  // instances serve, and reads their stops by the same chain those instances cut by (cutwait.ts).
  const unshare = shareLineage(parents);
  const halts = createHalts(
    (s) => parents.get(s) ?? processParent(s),
    authDir,
    (id, message) => say(W.haltUnwritten(id, message), "warning"),
    (id, message, kept) => say(W.haltUnlifted(id, message, kept), "warning"),
  );
  /** The session still takes a word: exists and is not archived. */
  async function accepting(id: string): Promise<boolean> {
    try {
      const info: any = await ctx.session.get({ sessionID: id } as any);
      return !(info?.time?.archived ?? info?.data?.time?.archived);
    } catch {
      return false;
    }
  }

  // Every delivery is a log line with the address and the frame, a refusal is loud (#4355).
  async function deliver(
    session: string | null,
    text: string,
    frame = W.frame(),
    delivery: "steer" | "queue" = "steer",
    child = false,
  ): Promise<{ session: string; inbox: string | null } | null> {
    let id = session;
    if (child && (!id || !(await accepting(id)))) {
      // The child's seat outlived it: the frame is not the root's (#5167); it stays in the seat's history.
      say(W.childGone(frame, id ?? "?", text.slice(0, 120)), "error");
      return null;
    }
    if (id && !(await accepting(id))) {
      say(W.sessionClosed(id, frame), "warning");
      id = null;
    }
    id ??= freshestRoot();
    if (id && id !== session && !(await accepting(id))) id = null;
    if (!id) {
      say(W.nowhere(frame, text.slice(0, 120)), "error");
      return null;
    }
    if (halts.halted(id)) {
      say(W.halted(frame, id), "warning");
      return null;
    }
    // An ended lead is woken by nothing — a frame, a pile, a tact, a word (#7505): the journal keeps it.
    if (child && leads.ended(id)) {
      say(W.childEnded(frame, id, text.slice(0, 120)), "info");
      return null;
    }
    try {
      const r: any = await ctx.session.prompt({ sessionID: id, text: markFrame(text), delivery });
      say(W.delivered(frame, id), "info");
      const inbox = r?.id ?? r?.data?.id;
      const got = { session: id, inbox: typeof inbox === "string" ? inbox : null };
      prompted(got.session, got.inbox, delivery);
      return got;
    } catch (e) {
      say(W.notDelivered(frame, id, (e as Error).message), "error");
      return null;
    }
  }

  // Case piles by the addressee bridge: gathered by the window, and while the previous pile
  // prompt waits in the session's queue — until it is taken.
  const piles = new Map<string, Pile>();
  const takenEarly = new Set<string>();
  // The attention tact does not enter a busy turn — it waits for its end, last (tacts.ts, #6569).
  const tacts = setupTacts(
    (session, text, what, child) => deliver(session, text, what, "queue", child),
    takenEarly,
    freshestRoot,
    say,
  );
  const tact = tacts.offer;

  function schedule(p: Pile): void {
    if (p.timer) clearTimeout(p.timer);
    const wait = p.pending
      ? Math.max(0, p.pending.at + PENDING_MAX_MS - Date.now())
      : CASE_BATCH_MS;
    p.timer = setTimeout(() => {
      p.timer = null;
      p.pending = null; // the window passed or OpenCode is silent about the taking past the limit
      flush(p);
    }, wait);
    (p.timer as { unref?: () => void }).unref?.();
  }

  function flush(p: Pile): void {
    if (p.timer) clearTimeout(p.timer);
    p.timer = null;
    const frames = fresh(p, p.held.splice(0));
    if (!frames.length) return;
    // A pile of counts only wakes no turn (#6574): it waits for a passing prompt.
    if (!frames.some((f) => addressedToMine(f))) {
      p.riders.push(...frames);
      p.riders.splice(0, Math.max(0, p.riders.length - RIDERS_MAX));
      return;
    }
    const at = Date.now();
    p.pending = { session: "", inbox: null, at };
    const text = [
      batchHead([...fresh(p, p.riders.splice(0)), ...frames]),
      ...batchLines(frames),
    ].join("\n");
    void deliver(p.session, text, W.caseBatch(frames.length), "queue", p.child).then((got) => {
      // Without an id the taking is not seen: the next pile goes by the window.
      const inbox = got?.inbox && !takenEarly.delete(got.inbox) ? got.inbox : null;
      p.pending = got && inbox ? { session: got.session, inbox, at } : null;
      if (p.held.length) schedule(p);
    });
  }

  function pile(session: string | null, child: boolean, frame: Frame): void {
    // A stopped session gathers neither piles nor counts to ride until it stands again (#7440).
    if (session && halts.halted(session)) {
      const what = frame.id != null ? W.frameId(String(frame.id)) : W.frameNoId();
      return say(W.halted(what, session), "warning");
    }
    const key = `${child ? "child" : "root"}:${session ?? ""}`;
    let p = piles.get(key);
    if (!p)
      piles.set(
        key,
        (p = {
          session,
          child,
          held: [],
          riders: [],
          timer: null,
          pending: null,
          marks: new Set(),
        }),
      );
    if (frame.id && p.held.some((f) => f.id === frame.id)) return; // a repeat of a waiting one
    p.held.push(frame);
    if (!p.pending && p.held.length >= CASE_BATCH_CAP) return flush(p);
    if (!p.timer) schedule(p);
  }

  /** What entered the session as text — into its pile's marks. Only its own session. */
  function noteOwn(p: Pile | undefined, keys: string[] | undefined): void {
    if (!p) return;
    for (const k of keys ?? []) p.marks.add(k);
    for (const old of p.marks) if (p.marks.size > MARKS_KEPT) p.marks.delete(old);
  }

  /** The pile's frames whose event has not entered the session yet (seen.ts eventIn). */
  const fresh = (p: Pile, fs: Frame[]): Frame[] =>
    fs.filter((f) => !eventIn(f, (k) => p.marks.has(k)));

  /** The piles' riding counts as head lines; the piles give them away. */
  function riding(ps: Pile[]): string[] {
    const got = ps.flatMap((p) => fresh(p, p.riders.splice(0)));
    return got.length ? [batchHead(got)] : [];
  }

  function loud(session: string | null, text: string, child = false): void {
    say(text, "error");
    void deliver(session, text, W.frame(), "steer", child);
  }

  /**
   * A stale or wake-up batch — one prompt per pile, queued or held as a tact. The launcher's word
   * gathered into it steers its lead's turn, the batch with it (#7505): queued, it would wait past
   * the turn's end and wake an ended lead. The single frame and the case pile take that word by
   * the same predicate (onEvent "frame"), so no queued path carries it.
   */
  function batch(session: string | null, child: boolean, ev: ChannelEvent, what: string): void {
    noteOwn(piles.get(`${child ? "child" : "root"}:${session ?? ""}`), ev.marks);
    if (!ev.text) return;
    if (launcherWordIn(session, child, ev.frames))
      void deliver(session, ev.text, what, "steer", child);
    else if (!tact(session, child, ev, what)) void deliver(session, ev.text, what, "queue", child);
  }

  const launcherWordIn = (
    session: string | null,
    child: boolean,
    frames?: Frame[] | null,
  ): boolean => {
    const launcher = child ? leads.launcherOf(session ?? "") : null;
    return !!frames?.some((f) => fromLauncher(f, launcher));
  };

  function dropPile(key: string): void {
    const p = piles.get(key);
    if (p?.timer) clearTimeout(p.timer);
    piles.delete(key);
  }

  const session = (): any => ctx.session;
  const cuts = createCuts({
    stopOf: (id) => halts.stopOf(id),
    halted: (id) => halts.halted(id),
    canInterrupt: () => typeof session().interrupt === "function",
    interrupt: (id) => session().interrupt({ sessionID: id, resume: false }),
    dropped: (id) => {
      for (const k of ["child", "root"]) dropPile(`${k}:${id}`);
      tacts.gone(id);
    },
    refused: (id, why, last) => say(W.notDelivered(W.frame(), id, why), last ? "error" : "warning"),
  });
  const cut = cuts.cut;

  /**
   * The owner took the seat off (#7439, #7440 item 2): the running turns of the session and of
   * every descendant are interrupted, their piles and waiting tacts are dropped, and the stop
   * word goes to the human and to the context of the session's turns while it stays stopped —
   * not into its inbox, where a later turn would take it stale (#7585); the word lies with the
   * stop and outlives a reload as the stop does. Nothing of this session or its descendants
   * reaches them afterwards until it stands again by an explicit call (halts.ts). The
   * descendants' seats go down in their own instances (onStop).
   */
  function stopped(session: string | null, text: string, child: boolean): void {
    say(text, "error");
    dropPile(`${child ? "child" : "root"}:${session ?? ""}`);
    if (!session) return;
    // A child's end goes to its parent (leads.ts): no word is laid into the child.
    halts.stop(session, child ? null : text);
    cut(session);
    for (const d of descendantsOf(session, parents)) cut(d);
    onStop(session);
  }

  return {
    status(session, on) {
      if (on) tacts.busy(session);
      else this.taken(session);
    },
    gone(session) {
      tacts.gone(session);
      halts.gone(session);
      cuts.forget(session);
    },
    // Each reading cuts the descendants this instance serves, a child born during the wait too;
    // other instances cut theirs by the same stops (plugin.ts sweep).
    halted(session, signal) {
      return cuts.outcome(() => {
        if (!session) return [];
        this.halt(session);
        return [session, ...processDescendants(session)];
      }, signal);
    },
    halt(session) {
      if (!halts.halted(session)) return false;
      cut(session);
      for (const d of descendantsOf(session, parents)) cut(d);
      return true;
    },
    taken(session, inbox) {
      tacts.taken(session, inbox);
      let matched = false;
      for (const p of piles.values()) {
        if (!p.pending || (inbox ? p.pending.inbox !== inbox : p.pending.session !== session))
          continue;
        matched = true;
        p.pending = null;
        flush(p); // what gathered behind the turn has waited — it leaves now
      }
      // The taking overtook the prompt's answer: the id is remembered, the pile checks it by the answer.
      if (inbox && !matched) {
        takenEarly.add(inbox);
        for (const old of takenEarly) if (takenEarly.size > 100) takenEarly.delete(old);
      }
    },
    stop() {
      unshare();
      tacts.stop();
      cuts.stop();
      for (const p of piles.values()) {
        p.pending = null;
        flush(p);
      }
    },
    ride(session) {
      if (halts.halted(session)) return null;
      const own = [...piles.values()].filter(
        (p) => !p.child && (p.session === session || (!p.session && freshestRoot() === session)),
      );
      return riding(own).join("\n") || null;
    },
    stopWord(session) {
      const word = halts.wordOf(session, P.stoppedAny());
      return word === null ? null : markFrame(P.stoppedTurn(word));
    },
    onEvent(session, params: any, child = false) {
      const ev = params?.data as ChannelEvent | undefined;
      if (!ev || typeof ev !== "object") return;
      switch (ev.kind) {
        case "frame": {
          const frame = ev.frame ?? null;
          // Service frames wake nothing: hello proves the socket is held, and only that.
          if (frame?.type === "hello") return say(P.listening(), "info");
          if (frame?.type === "status") return;
          // The frame's path (#5851): with event_kind — the kind's rule, without — its own stack (#4957).
          // The launcher's word to its working lead steers its turn whatever its stack (#7505).
          const steers = !!frame && launcherWordIn(session, child, [frame]);
          if (frame && !steers && toPile(frame)) return pile(session, child, frame);
          const own = piles.get(`${child ? "child" : "root"}:${session ?? ""}`);
          noteOwn(own, deliveryKeys(frame)); // the frame enters as text — the pile's count skips it
          void deliver(
            session,
            [...riding(own ? [own] : []), frameToText(frame, ev.raw ?? "")].join("\n"),
            frame?.id != null ? W.frameId(String(frame.id)) : W.frameNoId(),
            "steer",
            child,
          );
          return;
        }
        // A child's bridge word goes only to it (child): it is not the root's (#6625).
        case "dead":
          loud(session, P.dead(String(ev.code)), child);
          return;
        case "stopped":
          stopped(session, P.stopped(ev.text ?? ""), child);
          return;
        case "stale":
          return batch(session, child, ev, W.staleBatch());
        case "backlog":
          // A wake-up with the backlog — one prompt per pile, queued: steered mid-turn it would cut the doer's work (#5140).
          return batch(session, child, ev, W.wakeBatch(ev.frames?.length ?? 0));
        case "lost":
          // The holding bridge exited or the previous plugin was stopped: loudly, into the session.
          if (ev.text) loud(session, ev.text, child);
          return;
        case "resumed":
          // The bridge returned the seat itself (#5366): the taken name goes into the session.
          if (ev.text) {
            say(ev.text, "warning");
            void deliver(session, ev.text, W.resumedLabel(), "steer", child);
          }
          return;
        case "held":
          halts.held(session); // after a stop only an explicit stand holds again (halts.ts)
          // The marks of the session's cuts go with it, its descendants' too.
          for (const s of session ? [session, ...descendantsOf(session, parents)] : []) {
            cuts.forget(s);
          }
          say(W.held(ev.key ?? ""), "info");
          return;
        case "released":
          say(W.released(ev.key ?? "", ev.text ?? ""), "warning");
          return;
        case "evicted":
          loud(session, P.evicted(String(ev.code)), child);
          return;
        case "alive":
          loud(session, P.alive(ev.version ?? ""), child);
          return;
        case "note":
          if (ev.text) say(P.note(ev.text), "warning");
          return;
        default:
          return;
      }
    },
  };
}

/* eslint-enable @typescript-eslint/no-explicit-any */
