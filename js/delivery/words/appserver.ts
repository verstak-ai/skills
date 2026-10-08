// The door into a Codex thread (APPSERVER).
import type { Lang } from "../lang.ts";

export interface AppServerWords {
  socketClosed: () => string;
  doorNotOpened: (status: number | undefined) => string;
}

export const APPSERVER: Readonly<Record<Lang, AppServerWords>> = {
  en: {
    socketClosed: () => "socket closed",
    doorNotOpened: (status) => `the door did not open: HTTP ${status}`,
  },
};
