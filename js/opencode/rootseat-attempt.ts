// One seating attempt of a root (rootseat.ts): the cover of the session's directory, then the
// seat through the instance's line, one at a time; its outcome is the word it carries.
import { coverIn, stamp } from "./rootseat-again.ts";
import { ceilingMs, pause, type RootSeatDoors } from "./rootseat-doors.ts";
import { heldWord, notSeatedWord, realignWord, refusedWord } from "./rootseat-say.ts";

export type Told = { word: string | null; seated: boolean };
/** retry — after the alignment; said — its word is delivered; followed — its late word is scheduled. */
export type Attempt = {
  abort: AbortController;
  done: boolean;
  begun: boolean;
  promise: Promise<Told>;
  retry?: boolean;
  said?: boolean;
  followed?: boolean;
};

export interface AttemptDoors {
  d: RootSeatDoors;
  stopped(): boolean;
  /** The cover is defective inside a repository: the root waits for the alignment. */
  arm(session: string, where: string, why: string, sig: string): void;
  /** The instance's line: one seating at a time. */
  line: { at: Promise<unknown> };
}

/** expect — the directory a retry waited in: a session no longer there is not seated by this instance. */
export function attempt(session: string, x: AttemptDoors, expect?: string): Attempt {
  const { d } = x;
  const no = (word: string | null): Told => ({ word, seated: false });
  const t: Attempt = {
    abort: new AbortController(),
    done: false,
    begun: false,
    promise: Promise.resolve(no(null)),
  };
  const cancelled = () => x.stopped() || t.abort.signal.aborted || d.halted(session);
  t.promise = (async (): Promise<Told> => {
    const where = await d.directoryOf(session);
    if (cancelled() || !where || (expect !== undefined && where !== expect)) return no(null);
    const sig = stamp(where);
    const cover = coverIn(where);
    if (cover === null) return no(null);
    if ("why" in cover) {
      if (!cover.align) return no(notSeatedWord(cover.why));
      x.arm(session, where, cover.why, sig);
      return no(realignWord(cover.why));
    }
    const before = x.line.at;
    const turn = before.then(() => {
      if (cancelled()) return { cancelled: true } as const;
      t.begun = true;
      return d.seat(session, cover.realm, cover.karta, cancelled);
    });
    // A seating hung in the bridge holds the line no longer than its ceiling: the next goes.
    x.line.at = before.then(() => Promise.race([turn, pause(ceilingMs())])).catch(() => {});
    const r = await turn;
    if (cancelled() || "cancelled" in r) {
      if (t.begun) await d.release(session);
      return no(null);
    }
    if ("error" in r) return no(refusedWord(r.error));
    return { word: heldWord(r, cover.realm, cover.karta), seated: true };
  })()
    .catch(async (e: Error) => {
      if (cancelled()) {
        if (t.begun) await d.release(session);
        return no(null);
      }
      return no(refusedWord(e.message));
    })
    .finally(() => {
      t.done = true;
      if (t.begun) d.finished(session);
    });
  return t;
}
