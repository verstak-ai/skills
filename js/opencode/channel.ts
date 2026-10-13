// The "channel" half — standing frames inside an OpenCode session (graph @nks/nks-dev, node #4266).
//
// The session's bridge holds the standing socket; the plugin puts a frame into the agent's
// session as a prompt (ctx.session.prompt). steer enters the running turn at the next step,
// queue waits for the turn's end, one prompt per turn: a live frame and a loud word go steer,
// or frames lagged by hours (#5233). Wake-up and stale batches go queue: not urgent.
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
import { createHalts, descendantsOf } from "./halts.ts";
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
/** How many times a stop's refused interrupt is tried, and how long apart. */
const CUT_TRIES = 3;
const CUT_RETRY_MS = 500;
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
): Channel {
  const W = words(OPENCODE);
  const P = words(PLUGIN);
  const halts = createHalts(
    (s) => parents.get(s),
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
    try {
      const r: any = await ctx.session.prompt({ sessionID: id, text: markFrame(text), delivery });
      say(W.delivered(frame, id), "info");
      const inbox = r?.id ?? r?.data?.id;
      return { session: id, inbox: typeof inbox === "string" ? inbox : null };
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

  function dropPile(key: string): void {
    const p = piles.get(key);
    if (p?.timer) clearTimeout(p.timer);
    piles.delete(key);
  }

  // A cut belongs to the stops over the session's chain (halts.ts stopOf): a new stop of the
  // session or of any ancestor cuts it anew.
  const stopOf = (id: string): string | null => halts.stopOf(id);
  const cutDone = new Map<string, string>(); // the stops whose turn is cut
  const cutting = new Map<string, string>(); // the stops whose interrupt is in flight
  const cutFails = new Map<string, [string, number]>(); // refused interrupts of those stops
  const retries = new Set<ReturnType<typeof setTimeout>>();
  /**
   * A stopped session's running turn is interrupted, its piles and waiting tact are dropped — once
   * per stop. A refused interrupt is tried again, by a timer and by the next halt, up to CUT_TRIES.
   * An interrupt answers only for its own stop: a stop after a held while the previous stop's
   * interrupt is in flight gets its own interrupt right after it.
   * Prompts OpenCode already took into the session's inbox stay there: the plugin's session domain
   * has no inbox.cancel (@opencode/plugin 2.0.4 through 2.0.28, only the full client has it).
   */
  function cut(id: string): void {
    const gen = stopOf(id);
    if (gen === null || cutDone.get(id) === gen || cutting.get(id) === gen) return;
    for (const k of ["child", "root"]) dropPile(`${k}:${id}`);
    tacts.gone(id);
    if (cutting.has(id)) return; // the previous stop's interrupt is in flight: this one follows it
    const s = ctx.session as any;
    if (typeof s.interrupt !== "function") return void cutDone.set(id, gen);
    cutting.set(id, gen);
    void Promise.resolve()
      .then(() => s.interrupt({ sessionID: id, resume: false }))
      .then(
        () => {
          if (stopOf(id) !== gen) return;
          cutDone.set(id, gen);
          cutFails.delete(id);
        },
        (e: Error) => {
          if (stopOf(id) !== gen) return;
          const was = cutFails.get(id);
          const n = (was?.[0] === gen ? was[1] : 0) + 1;
          cutFails.set(id, [gen, n]);
          say(W.notDelivered(W.frame(), id, e.message), n < CUT_TRIES ? "warning" : "error");
          if (n >= CUT_TRIES) return void cutDone.set(id, gen);
          const t = setTimeout(() => {
            retries.delete(t);
            if (halts.halted(id)) cut(id);
          }, CUT_RETRY_MS);
          (t as { unref?: () => void }).unref?.();
          retries.add(t);
        },
      )
      .finally(() => {
        cutting.delete(id);
        if (stopOf(id) !== gen) cut(id);
      });
  }

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
      cutDone.delete(session);
      cutFails.delete(session);
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
      tacts.stop();
      for (const t of retries) clearTimeout(t);
      retries.clear();
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
          if (frame && toPile(frame)) return pile(session, child, frame);
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
          noteOwn(piles.get(`${child ? "child" : "root"}:${session ?? ""}`), ev.marks);
          if (ev.text && !tact(session, child, ev, W.staleBatch()))
            void deliver(session, ev.text, W.staleBatch(), "queue", child); // one pile — one prompt
          return;
        case "backlog":
          noteOwn(piles.get(`${child ? "child" : "root"}:${session ?? ""}`), ev.marks);
          // A wake-up with the backlog — one prompt per pile, queued: steered mid-turn it would cut the doer's work (#5140).
          if (ev.text) {
            const what = W.wakeBatch(ev.frames?.length ?? 0);
            if (!tact(session, child, ev, what))
              void deliver(session, ev.text, what, "queue", child);
          }
          return;
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
            cutDone.delete(s);
            cutFails.delete(s);
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
