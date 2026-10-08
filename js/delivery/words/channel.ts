// The live channel's holder (CHANNEL): dead-token advice, a hung connection, rollout.
import type { Lang } from "../lang.ts";
import { tool } from "../protocol.ts";

export interface ChannelWords {
  deadTokenAdvice: (code: number) => string;
  binaryFrame: () => string;
  hung: (silent: number, ping: number) => string;
  rollout: () => string;
}

export const CHANNEL: Readonly<Record<Lang, ChannelWords>> = {
  en: {
    deadTokenAdvice: (code) => `close ${code} — the token is dead, call connect`,
    binaryFrame: () => "[binary frame]",
    hung: (silent, ping) =>
      `the connection has been silent for ${silent} s with a ping every ${ping} s — hung without closing; reopening at the same address. Frames that arrived during the silence may be lost — check ${tool("channel")}(action="history")`,
    rollout: () => "the service is not answering — a rollout is under way, keeping the same token",
  },
};
