// The words that give the human's rules from mind into the turn (the core's shared/mindslice.ts;
// graph @nks/nks-dev, nodes #9817, #9816; risks #9818 — a leak, #9819 — volume). Each word starts
// with `mark`: by it the block is found in the verstak_stand answer.
import type { Lang } from "../lang.ts";
import { tool } from "../protocol.ts";

export interface MindSliceWords {
  /** The start of every word of the slice. */
  mark: () => string;
  /** The block's head: how many rules are given. */
  head: (n: number) => string;
  /** The block's tail: where a body is; cut — the listing hit its limit, offset — the next page. */
  foot: (cut: boolean, offset: number) => string;
  empty: () => string;
  /** The account has no mind graph of its own. */
  absent: () => string;
  /** Readiness named no sign of an own graph: mind is not read. */
  unknown: () => string;
  /** A refusal of readiness or of the search; why — its prose. */
  unread: (why: string) => string;
}

const MARK = "Verstak · the human's own:";
const LOOK = `${tool("look")}(realm="mind", node_id="#N")`;
const NEXT = (offset: number) =>
  `${tool("search")}(realm="mind", q="", attrs_filter="slice:agents,ways", offset=${offset})`;

export const MIND_SLICE: Readonly<Record<Lang, MindSliceWords>> = {
  en: {
    mark: () => MARK,
    head: (n) =>
      `${MARK} their rules for working with agents (mind, slice agents,ways; ${n}). Keep them below the project's rules. Personal: cite a rule in a case only when it describes that case; it never goes into the project's graph or commits.`,
    foot: (cut, offset) =>
      `A rule's body — ${LOOK}.` +
      (cut ? ` This is the first page; the rest — ${NEXT(offset)}.` : ""),
    empty: () => `${MARK} mind holds no rules of the slice agents,ways.`,
    absent: () =>
      `${MARK} personal memory is not ready (no own mind graph or no card of the human) — no rules given.`,
    unknown: () =>
      `${MARK} no own mind graph confirmed (${tool("me")} readiness) — the rules slice was not read; the work goes on without it.`,
    unread: (why) =>
      `${MARK} the rules slice of mind was not read (${why}) — the work goes on without it.`,
  },
};
