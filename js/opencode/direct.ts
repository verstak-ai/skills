// Graph-reading tools stand outside OpenCode's code mode (graph @nks/nks-dev, nodes #10962,
// #10952): called directly, their answer reaches the model whole — a script cannot keep the
// node's text and drop its arrows. Writing tools stay in code mode, where batches belong.
import { DIRECT_READ_WORD, tool } from "../delivery/index.ts";
import { words } from "../shared/lang.ts";
import type { Context } from "./plugin.ts";

const DIRECT_READ_NAMES = ["look", "orient", "search", "semantic_search", "history"].map(tool);

export const directWord = (tools: Record<string, unknown> | undefined): string | null =>
  tools?.execute && DIRECT_READ_NAMES.some((name) => name in tools)
    ? words(DIRECT_READ_WORD).word(DIRECT_READ_NAMES.join(", "))
    : null;

/** A transform after the tools half's own: each graph read the session has is direct-only. */
export const standDirect = (ctx: Context): Promise<unknown> =>
  ctx.tool.transform((editor) => {
    for (const id of DIRECT_READ_NAMES)
      editor.update(id, (t) => void (t.options = { codemode: false }));
  });
