// The end of a run (RUN_END): the reason for leaving when the plugin called the end.
import type { Lang } from "../lang.ts";

export interface RunEndWords {
  pluginEnd: () => string;
}

export const RUN_END: Readonly<Record<Lang, RunEndWords>> = {
  en: {
    pluginEnd: () => "the run's end on the plugin's word",
  },
};
