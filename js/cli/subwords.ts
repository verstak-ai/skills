// doctor's words about agent files, in the session language (graph @nks/nks-dev, node #6080).
import { SUBAGENT, type SubagentWords } from "../delivery/index.ts";
import { words } from "../shared/lang.ts";
import { type SatForm } from "./satform.ts";

export const subWords = (): SubagentWords => words(SUBAGENT);

/** What is wrong with the entry form, and why the single form replaces it. */
export const formWord = (form: Exclude<SatForm, "eval">): string => subWords().form(form);

/** The mark of a line to carry out: doctor is rerun until the section has none. */
export const todo = (): string => subWords().todo();
