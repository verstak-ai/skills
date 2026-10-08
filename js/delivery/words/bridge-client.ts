// MCP client refusals towards a child bridge and an empty answer (BRIDGE_CLIENT).
import type { Lang } from "../lang.ts";

export interface BridgeClientWords {
  failedToStart: (message: string) => string;
  exited: (code: number | null, signal: string | null, why: string) => string;
  lastFromBridge: (lines: string) => string;
  aborted: () => string;
  noAnswer: (method: string, ms: number, why: string) => string;
  noWrites: () => string;
  sessionClosed: () => string;
  emptyAnswer: () => string;
}

export const BRIDGE_CLIENT: Readonly<Record<Lang, BridgeClientWords>> = {
  en: {
    failedToStart: (message) => `the bridge failed to start: ${message}`,
    exited: (code, signal, why) => `the bridge exited (code=${code}, signal=${signal})${why}`,
    lastFromBridge: (lines) => `; last from the bridge: ${lines}`,
    aborted: () => "call aborted",
    noAnswer: (method, ms, why) => `${method}: no answer in ${ms} ms${why}`,
    noWrites: () => "the bridge does not accept writes",
    sessionClosed: () => "session closed",
    emptyAnswer: () => "(empty answer)",
  },
};
