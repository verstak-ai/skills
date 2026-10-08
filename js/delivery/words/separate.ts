// Choosing a seat (SEPARATE): this session's former bridge's own seat, a seat beside,
// 'board unread' and 'everything beside is taken' refusals.
import type { Lang } from "../lang.ts";

export interface SeparateWords {
  ownSession: (base: string) => string;
  beside: (base: string, name: string, own: boolean) => string;
  unknown: (name: string) => string;
  noFree: (base: string) => string;
}

export const SEPARATE: Readonly<Record<Lang, SeparateWords>> = {
  en: {
    ownSession: (base) =>
      `the seat ${base} was held by a former bridge of this same harness session (a restart or a compaction) — this session's own seat, the bridge took it back itself`,
    beside: (base, name, own) =>
      `another session holds the seat ${base} — leaving its seat alone and not signing with it; standing beside as ${name} with hearing${own ? " (a former bridge of this same session held it — taken back)" : ""}: it is this session's own seat, its frames come here; evicting that session (take=true) — only on the user's word`,
    unknown: (name) =>
      `Refused (bridge): the board was not read in full — the bridge does not know whether another session listens on the seat ${name}; not standing blind and not advising take=true. Repeat when the board reads, or pass another name.`,
    noFree: (base) =>
      `Refused (bridge): another session holds the seat ${base}, and every seat beside ${base}.2…99 is taken — the bridge will not sign with another's seat without hearing; clear the dead seats or pass another name.`,
  },
};
