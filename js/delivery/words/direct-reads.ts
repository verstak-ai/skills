// The word about direct graph reads (DIRECT_READ_WORD): under OpenCode's code mode the reads
// stand outside execute, every other tool of ours inside it (the core's opencode/direct.ts).
import type { Lang } from "../lang.ts";
import { tool } from "../protocol.ts";

export interface DirectReadWords {
  /** list — the direct read tools, comma-separated. */
  word: (list: string) => string;
}

export const DIRECT_READ_WORD: Readonly<Record<Lang, DirectReadWords>> = {
  en: {
    word: (list) =>
      `Graph reads — ${list} — are direct tool calls outside execute; search() inside execute does not list them. Every other ${tool("*")} tool is called inside execute.`,
  },
};
