// Mechanical exclusion of blocking questionnaires (graph @nks/nks-dev, #10397; #5048).
import type { Context } from "./plugin.ts";

export async function setupQuestionGuard(ctx: Context): Promise<void> {
  await ctx.tool.transform((editor) => editor.remove("question"));
  await ctx.permission.hook("evaluate", (event) => {
    if (event.action !== "question") return;
    event.effect = "deny";
    event.message = "Use a case ask card, not the blocking question tool.";
  });
}
