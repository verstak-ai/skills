// The push and merge lines after a shell call (graph @nks/nks-dev, node #9319, section RITUALS;
// dsh — #11071): one composition for the delivery of every harness — OpenCode's rites, Claude
// Code's rituals hook, dsh's plugin. The outcome is judged by ritualjudge.ts; a push to the trunk
// shipped and speaks the merge word (#8362); a kind the cover's rituals field leaves out is silent.
import { RITES } from "../delivery/index.ts";
import { wordsIn } from "./lang.ts";
import { mergeHeads, type RitualCover } from "./ritualcover.ts";
import { merged, pushedTo, type ShellCall } from "./ritualjudge.ts";

export type ShellRite = "push" | "merge";

/** The lines the call calls for in dir; skip — a kind another hook already says there. */
export function shellNotes(
  cover: RitualCover,
  call: ShellCall,
  dir: string,
  skip: (kind: ShellRite) => boolean = () => false,
): string[] {
  const W = wordsIn(RITES, cover.lang);
  const { on, holon, sections } = cover;
  const push = on.has("push") && !skip("push") ? pushedTo(call, dir) : null;
  const said: string[] = [];
  if (push === "branch") said.push(W.push(sections.check));
  if (push === "trunk" || (on.has("merge") && !skip("merge") && merged(call)))
    said.push(W.merge(holon, ...mergeHeads(sections, push === "trunk")));
  return said;
}
