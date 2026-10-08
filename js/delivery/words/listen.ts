// The bridge block in connect and verstak_stand answers (LISTEN): the own-harness listening
// line, watchdog commands; watchdog flags as a ready string.
import type { Lang } from "../lang.ts";

export interface ListenWords {
  block: (listen: string) => string;
  unheard: (listen: string) => string;
  monitor: (self: string, key: string, where: string) => string;
  exit: (self: string, key: string, where: string) => string;
  codex: (self: string, key: string, where: string) => string;
  self: (pi: boolean) => string;
  claude: (monitor: string, exit: string) => string;
  codexLine: (codex: string, exit: string) => string;
  any: (monitor: string, exit: string, codex: string) => string;
}

export const LISTEN: Readonly<Record<Lang, ListenWords>> = {
  en: {
    block: (listen) =>
      `[verstak-bridge] The bridge holds this standing's socket — there is no one to hand it to` +
      ` (a line above saying no one listens describes the moment before this holding).` +
      `\n${listen}` +
      `\nBusy line: verstak_stand(realm, status) on this seat — an empty status clears it.` +
      `\nFrames also come as MCP notifications (logger verstak-channel).`,
    unheard: (listen) =>
      `[verstak-bridge] No watchdog is attached to this seat — frames pile up. ${listen}`,
    monitor: (self, key, where) =>
      `under Monitor — node "${self}" watchdog ${key}${where} with the largest timeout_ms, re-armed when it runs out (Claude Code)`,
    exit: (self, key, where) =>
      `as a background task — node "${self}" watchdog-exit ${key}${where} (exits zero on the first message)`,
    codex: (self, key, where) =>
      `in Codex inside one long command of your shell — node "${self}" watchdog-codex ${key}${where} & …; kill %1 (a frame enters the running thread through app-server; as a separate nohup command the watchdog dies with it)`,
    self: (pi) =>
      `The ${pi ? "pi extension" : "OpenCode plugin"} listens itself — no watchdog needed, frames enter the turn.`,
    claude: (monitor, exit) => `Listen: ${monitor}; without Monitor — ${exit}.`,
    codexLine: (codex, exit) => `Listen: ${codex}; without the app-server door — ${exit}.`,
    any: (monitor, exit, codex) => `Listen: ${monitor}; ${exit}; ${codex}.`,
  },
};
