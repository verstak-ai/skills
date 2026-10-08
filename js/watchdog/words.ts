// Watchdog words in the session language (graph @nks/nks-dev, node #6080).
import { WATCHDOG, type WatchdogWords } from "../delivery/index.ts";
import { words } from "../shared/lang.ts";

export const wd = (): WatchdogWords => words(WATCHDOG);

export const doer = (text: string): string => wd().doer(text);
