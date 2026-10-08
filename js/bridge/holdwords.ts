// Socket holder's words in the session language (graph @nks/nks-dev, node #6080).
import { HOLD, type HoldWords } from "../delivery/index.ts";
import { deadTokenAdvice } from "../shared/channel.ts";
import { words } from "../shared/lang.ts";

export const holdWords = (): HoldWords => words(HOLD);

export const deadWord = (code: number): string => holdWords().dead(deadTokenAdvice(code));
