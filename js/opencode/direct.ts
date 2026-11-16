// Graph-reading tools stand outside OpenCode's code mode (graph @nks/nks-dev, nodes #10962,
// #10952): called directly, their answer reaches the model whole — a script cannot keep the
// node's text and drop its arrows. Writing tools stay in code mode, where batches belong.
import { tool } from "../delivery/index.ts";
import type { Context } from "./plugin.ts";

const DIRECT = ["look", "orient", "search", "semantic_search", "history"].map(tool);

/** A transform after the tools half's own: each graph read the session has is direct-only. */
export const standDirect = (ctx: Context): Promise<unknown> =>
  ctx.tool.transform((editor) => {
    for (const id of DIRECT) editor.update(id, (t) => void (t.options = { codemode: false }));
  });
