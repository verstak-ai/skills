// Seat-return words in the session language (graph @nks/nks-dev, node #6080).
import { RESUME, type ResumeWords } from "../delivery/index.ts";
import { words } from "../shared/lang.ts";

/** Each word is looked up at call time: the language is set after modules load. */
export const resumeWords: ResumeWords = new Proxy({} as ResumeWords, {
  get: (_, k) => words(RESUME)[k as keyof ResumeWords],
});
