// Ended lead subagents (leads.ts; graph @nks/nks-dev, nodes #7505, #4266): nothing is laid into
// an ended lead's session any more — by the channel or by a word about its own subagent (teller).
// OpenCode loads an instance per location and a reload drops memory: a grandchild served by
// another location's instance would wake its ended parent. So the end lies, like the owner's stop
// (halts.ts), in a registry on globalThis shared by the process's live instances, and on disk next
// to the plugin's other records for the instance after a reload. Only a new explicit stand of the
// session lifts it; the session's deletion removes it. A refused write or removal is loud.
/* eslint-disable @typescript-eslint/no-explicit-any -- the process registry lives on globalThis */
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { GLOBAL_PREFIX } from "../delivery/index.ts";

export interface Ends {
  end(session: string): void;
  /** Stood again by an explicit call, or deleted: the end goes. */
  lift(session: string): void;
  has(session: string): boolean;
}

const fileOf = (dir: string, session: string): string =>
  join(
    dir,
    `opencode-ended.${createHash("sha256").update(session).digest("hex").slice(0, 16)}.json`,
  );
const ended = (): Set<string> =>
  ((globalThis as any)[`${GLOBAL_PREFIX}Ended`] ??= new Set<string>());
/** Ends lifted in this process, with the time: a record the disk would not let go no longer ends them. */
const lifted = (): Map<string, number> =>
  ((globalThis as any)[`${GLOBAL_PREFIX}EndLiftedAt`] ??= new Map<string, number>());

/** The record ends the session: present, not rewritten as lifted, newer than a lift at `since`; unreadable ends it. */
function recorded(file: string, since: number | undefined): boolean {
  try {
    const r = JSON.parse(readFileSync(file, "utf8")) as { at?: string; lifted?: string };
    return !r.lifted && !(since !== undefined && Date.parse(r.at ?? "") <= since);
  } catch (e) {
    return (e as NodeJS.ErrnoException).code !== "ENOENT";
  }
}

/** `dir` — the records' directory; `unwritten`/`unlifted` — the disk refused the record or its removal. */
export function createEnds(
  dir: () => string,
  unwritten: (session: string, message: string) => void,
  unlifted: (session: string, message: string) => void,
): Ends {
  return {
    end(session) {
      ended().add(session);
      lifted().delete(session);
      try {
        mkdirSync(dir(), { recursive: true, mode: 0o700 });
        const record = JSON.stringify({ session, at: new Date().toISOString() });
        writeFileSync(fileOf(dir(), session), record, { mode: 0o600 });
      } catch (e) {
        unwritten(session, (e as Error).message);
      }
    },
    lift(session) {
      ended().delete(session);
      lifted().set(session, Date.now());
      const file = fileOf(dir(), session);
      try {
        unlinkSync(file);
      } catch (e) {
        if ((e as NodeJS.ErrnoException).code === "ENOENT") return;
        try {
          writeFileSync(file, JSON.stringify({ session, lifted: new Date().toISOString() }), {
            mode: 0o600,
          });
        } catch {
          unlifted(session, (e as Error).message); // a reload would read it ended again
        }
      }
    },
    has: (session) =>
      ended().has(session) || recorded(fileOf(dir(), session), lifted().get(session)),
  };
}

/* eslint-enable @typescript-eslint/no-explicit-any */
