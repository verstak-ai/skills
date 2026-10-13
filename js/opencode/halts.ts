// Sessions the owner stopped (graph @nks/nks-dev, nodes #7439, #7440): a stopped session and its
// descendants get no channel word — frame, batch, tact, resumed — until a new "held" of that session,
// which after a stop only an explicit call of the stand tool brings (bridge stophold.ts).
// OpenCode loads an instance per location and a reload drops memory: the stop lies in a registry
// on globalThis, shared by the process's live instances like the twins' (twins.ts), and on disk
// next to the plugin's other records (marker.ts) for the instance after a reload. A refused write
// is loud: the live instances still keep the ban, a reload would lose it. The record is the
// session's id, the time, the stop's id and its word for the session's turns (#7585), no secret —
// the word lives as long as the stop; the session's deletion removes it. A new held lifts the
// ban in the registry always, the stops recorded up to it, not a later one; a refused removal of
// the record is loud and rewrites it as lifted, so a reload reads no ban either. Each stop has an
// id of its own: what a stop has already cut does not count for the next stop over the chain.
/* eslint-disable @typescript-eslint/no-explicit-any -- the process registry lives on globalThis */
import { createHash, randomUUID } from "node:crypto";
import { mkdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { GLOBAL_PREFIX } from "../delivery/index.ts";

export interface Halts {
  /** `word` — what the session's turns read while it stays stopped; null — none (a child). */
  stop(session: string, word: string | null): void;
  held(session: string | null): void;
  /** The session or any of its ancestors is stopped. */
  halted(session: string): boolean;
  /** The ids of the stops over the session and its ancestors; null — none. */
  stopOf(session: string): string | null;
  /**
   * The word of the session's own stop; a stop recorded before words were kept reads `general`.
   * null — the session is not stopped itself, or its stop has no word.
   */
  wordOf(session: string, general: string): string | null;
  /** The session was deleted: its stop goes. */
  gone(session: string): void;
}

const PREFIX = "opencode-stopped";
const fileOf = (dir: string, session: string): string =>
  join(dir, `${PREFIX}.${createHash("sha256").update(session).digest("hex").slice(0, 16)}.json`);
const stops = (): Set<string> =>
  ((globalThis as any)[`${GLOBAL_PREFIX}Halts`] ??= new Set<string>());
/**
 * Bans lifted in this process, with the time of the held: a record the disk would not let go no
 * longer stops them, a stop recorded later does.
 */
const lifted = (): Map<string, number> =>
  ((globalThis as any)[`${GLOBAL_PREFIX}LiftedAt`] ??= new Map<string, number>());
/** The id of each stop in the registry. */
const ids = (): Map<string, string> =>
  ((globalThis as any)[`${GLOBAL_PREFIX}StopIds`] ??= new Map<string, string>());
/** The word of each stop in the registry. */
const words = (): Map<string, string | null> =>
  ((globalThis as any)[`${GLOBAL_PREFIX}StopWords`] ??= new Map<string, string | null>());

const code = (e: unknown): string | undefined => (e as NodeJS.ErrnoException).code;

/** A stop that bans: its id and word; `word` undefined — recorded before words were kept. */
interface Mark {
  id: string;
  word?: string | null;
}

/**
 * The stop the record bans by: present, not rewritten as lifted, and newer than a held lifted at
 * `since`; one unreadable bans, as before. null — no ban.
 */
function recorded(file: string, since: number | undefined): Mark | null {
  try {
    const r = JSON.parse(readFileSync(file, "utf8")) as {
      at?: string;
      lifted?: string;
      id?: string;
      word?: string | null;
    };
    if (r.lifted || (since !== undefined && Date.parse(r.at ?? "") <= since)) return null;
    return { id: r.id ?? r.at ?? "?", word: r.word };
  } catch (e) {
    return code(e) === "ENOENT" ? null : { id: "?" };
  }
}

/**
 * `parentOf` — the known parent of a child session, without asking OpenCode; `dir` — the records'
 * directory; `unwritten` — the disk refused a stop's record; `unlifted` — the disk refused to
 * remove it, `kept` — and to rewrite it as lifted.
 */
export function createHalts(
  parentOf: (session: string) => string | undefined,
  dir: () => string,
  unwritten: (session: string, message: string) => void,
  unlifted: (session: string, message: string, kept: boolean) => void,
): Halts {
  const marked = (s: string): Mark | null =>
    stops().has(s)
      ? { id: ids().get(s) ?? "?", word: words().get(s) }
      : recorded(fileOf(dir(), s), lifted().get(s));
  const drop = (s: string): void => {
    stops().delete(s);
    ids().delete(s);
    words().delete(s);
    lifted().set(s, Date.now());
    const file = fileOf(dir(), s);
    try {
      unlinkSync(file);
    } catch (e) {
      if (code(e) === "ENOENT") return; // no record or removed by another instance
      let kept = false;
      try {
        const record = JSON.stringify({ session: s, lifted: new Date().toISOString() });
        writeFileSync(file, record, { mode: 0o600 });
      } catch {
        kept = true;
      }
      unlifted(s, (e as Error).message, kept);
    }
  };
  function stopOf(session: string): string | null {
    const found: string[] = [];
    const seen = new Set<string>();
    for (let s: string | undefined = session; s && !seen.has(s); s = parentOf(s)) {
      const m = marked(s);
      if (m) found.push(m.id);
      seen.add(s);
    }
    return found.length ? found.join(" ") : null;
  }
  return {
    stop(session, word) {
      const id = randomUUID();
      stops().add(session);
      ids().set(session, id);
      words().set(session, word);
      lifted().delete(session);
      try {
        mkdirSync(dir(), { recursive: true, mode: 0o700 });
        const record = JSON.stringify({ session, at: new Date().toISOString(), id, word });
        writeFileSync(fileOf(dir(), session), record, { mode: 0o600 });
      } catch (e) {
        unwritten(session, (e as Error).message);
      }
    },
    held: (session) => void (session && drop(session)),
    gone: drop,
    halted: (session) => stopOf(session) !== null,
    stopOf,
    wordOf(session, general) {
      const m = marked(session);
      return m ? (m.word === undefined ? general : m.word) : null;
    },
  };
}

/* eslint-enable @typescript-eslint/no-explicit-any */

/** Every known descendant of `session` — children, theirs, and so on — by the parent map `parents`. */
export function descendantsOf(session: string, parents: Iterable<[string, string]>): string[] {
  const all = [...parents];
  const found: string[] = [];
  const seen = new Set([session]);
  for (let i = -1; i < found.length; i++) {
    const of = i < 0 ? session : found[i];
    for (const [child, parent] of all)
      if (parent === of && !seen.has(child)) {
        seen.add(child);
        found.push(child);
      }
  }
  return found;
}
