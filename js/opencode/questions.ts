// Mechanical exclusion of blocking questionnaires (graph @nks/nks-dev, #10397; #5048).
import { QUESTION_SCOPE, QUESTIONS } from "../delivery/index.ts";
import { words } from "../shared/lang.ts";
import { repoSigns } from "../shared/reposigns.ts";
import type { Context } from "./plugin.ts";

export async function setupQuestionGuard(ctx: Context): Promise<void> {
  const selected = (): boolean =>
    QUESTION_SCOPE === "all" ||
    (!!ctx.location?.directory && repoSigns(ctx.location.directory, "opencode").cover);
  await ctx.tool.transform((editor) => {
    if (selected()) editor.remove("question");
  });
  await ctx.permission.hook("evaluate", (event) => {
    if (event.action !== "question" || !selected()) return;
    event.effect = "deny";
    event.message = words(QUESTIONS).guard();
  });
}
