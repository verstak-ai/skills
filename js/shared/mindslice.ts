// The human's rules into the session's turn (graph @nks/nks-dev, kriya #9817, outcome #9816):
// the delivery reads the slice agents,ways of the account's own graph "mind" — not the model.
// Readiness first: no own graph — no read (the short name must not reach another's graph).
// Name and one line per rule, the body by number (#9819); every word carries the mark
// "personal": a rule is cited only in a case it describes, never in briefs, the project's graph
// or commits — the owner's word on #9818; the words themselves live in MIND_SLICE.
import {
  LANGS,
  MIND_MISSING,
  MIND_PRESENT,
  MIND_ROW,
  MIND_SLICE,
  tool,
} from "../delivery/index.ts";
import { words } from "./lang.ts";

/** One tool call on the account's behalf: the answer's text and whether it was a refusal. */
export type MindCall = (
  name: string,
  args: Record<string, unknown>,
) => Promise<{ isError?: boolean; text: string }>;

const LIMIT = 100;
/** Any node row of the server's page, a rule or not: the page is full by these, not by parsed rules. */
const NODE_ROW = /^\s+\S.* \(#\d+, /;
const SLICE_ARGS = {
  realm: "mind",
  q: "",
  attrs_filter: "slice:agents,ways",
  limit: LIMIT,
  include_description: true,
};

const brief = (s: string): string => {
  const t = s.replace(/\s+/g, " ").trim();
  return t.length > 120 ? `${t.slice(0, 119)}\u2026` : t || "-";
};

/** Recovery must retry a failed read; ordinary starts retain the soft diagnostic (#9817). */
export interface MindSliceOptions {
  strict?: boolean;
}

/** The slice as a block of lines; strict recovery propagates failures instead of rendering them. */
export async function mindSlice(call: MindCall, options: MindSliceOptions = {}): Promise<string> {
  const W = words(MIND_SLICE);
  const unread = (text: string): string => {
    if (options.strict) throw new Error(brief(text));
    return W.unread(brief(text));
  };
  try {
    const ready = await call(tool("me"), { action: "readiness" });
    if (ready.isError) return unread(ready.text);
    if (MIND_MISSING.test(ready.text)) return W.absent();
    if (!MIND_PRESENT.test(ready.text)) {
      if (options.strict) throw new Error("mind readiness unknown");
      return W.unknown();
    }
    const got = await call(tool("search"), SLICE_ARGS);
    if (got.isError) return unread(got.text);
    // A rule's line: its name, number and the description's fragment — the badges stay in the graph.
    const listed = got.text.split("\n").filter((l) => NODE_ROW.test(l)).length;
    const rows = got.text.split("\n").flatMap((l) => {
      const [, name, seq, line] = MIND_ROW.exec(l) ?? [];
      return name ? [`  ${name} (#${seq})${line ? ` — ${line}` : ""}`] : [];
    });
    if (!rows.length) return listed >= LIMIT ? `${W.empty()}\n${W.foot(true, LIMIT)}` : W.empty();
    return [W.head(rows.length), ...rows, W.foot(listed >= LIMIT, LIMIT)].join("\n");
  } catch (e) {
    if (options.strict) throw e;
    return unread((e as Error).message);
  }
}

/** The slice block a stand answer carries — from its mark to the end; none — null. */
export function sliceIn(text: string): string | null {
  for (const lang of LANGS) {
    const mark = MIND_SLICE[lang].mark();
    if (text.startsWith(mark)) return text;
    const at = text.indexOf(`\n${mark}`);
    if (at >= 0) return text.slice(at + 1);
  }
  return null;
}
