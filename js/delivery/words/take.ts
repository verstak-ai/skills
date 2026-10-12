// The occupied-seat takeover rule (TAKE): recover your own name after a silent probe;
// taking another role's or account's name requires the user's word. Shared by all advice.
import type { Lang } from "../lang.ts";
import { tool } from "../protocol.ts";

export interface TakeWords {
  rule: () => string;
}

export const TAKE: Readonly<Record<Lang, TakeWords>> = {
  en: {
    rule: () =>
      `your own name (the same role, the same account) — by yourself when the holder stays silent 5 minutes to a probe by word (${tool("channel")} send); another's (another role or account) — only on the user's word`,
  },
};
