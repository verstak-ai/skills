// Choosing a seat (SEPARATE): this session's former bridge's own seat, a seat beside,
// 'board unread' and 'everything beside is taken' refusals.
import type { Lang } from "../lang.ts";

/**
 * Who holds base when the bridge stood beside: live — a live bridge of another session in
 * this grant home (the same role, the same account); record — another session's record in
 * this home, its bridge does not answer here; board — the board only: the same role, the
 * doer checks the account; null — unknown.
 */
export type Kin = "live" | "record" | "board" | null;

const probe = (base: string): string =>
  `ask it by word — verstak_channel(action="send", standing=${base}, text="alive? what do you hold?") — and wait up to 5 minutes for the answer: it answered — agree, do not take its cases; it is silent — verstak_stand(name=${base}, take=true) and enter its cases (verstak_case(action="mine", standing=${base})); do not ask the user`;

const HOLDER: Record<NonNullable<Kin>, string> = {
  live: "another live session of your own name (the same role, the same account)",
  record:
    "another session of your own name (the same role, the same account; its bridge does not answer here — the probe tells whether it is alive)",
  board: "another session of the same role",
};

export interface SeparateWords {
  ownSession: (base: string) => string;
  beside: (base: string, name: string, own: boolean, kin: Kin) => string;
  unknown: (name: string) => string;
  noFree: (base: string) => string;
}

export const SEPARATE: Readonly<Record<Lang, SeparateWords>> = {
  en: {
    ownSession: (base) =>
      `the seat ${base} was held by a former bridge of this same harness session (a restart or a compaction) — this session's own seat, the bridge took it back itself`,
    beside: (base, name, own, kin) =>
      `${kin ? HOLDER[kin] : "another session"} holds the seat ${base} — leaving its seat alone and not signing with it; standing beside as ${name} with hearing${own ? " (a former bridge of this same session held it — taken back)" : ""}: it is this session's own seat, its frames come here; ` +
      (kin === "board"
        ? `check the holder's account on the board against your own seat's address: the same — ${probe(base)}; another — evicting that session (take=true) only on the user's word`
        : kin
          ? probe(base)
          : "evicting that session (take=true) — only on the user's word"),
    unknown: (name) =>
      `Refused (bridge): the board was not read in full — the bridge does not know whether another session listens on the seat ${name}; not standing blind and not advising take=true. Repeat when the board reads, or pass another name.`,
    noFree: (base) =>
      `Refused (bridge): another session holds the seat ${base}, and every seat beside ${base}.2…99 is taken — the bridge will not sign with another's seat without hearing; clear the dead seats or pass another name.`,
  },
};
