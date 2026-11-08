// The bridge block in connect and verstak_stand answers (LISTEN): the own-harness listening
// line, watchdog commands; watchdog flags as a ready string.
import type { Lang } from "../lang.ts";
import { tool } from "../protocol.ts";

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
      `[verstak-bridge] The bridge holds this standing's socket (a "no one listens" line above predates this).` +
      `\n${listen}` +
      `\nBusy line: ${tool("stand")}(realm, status) on this seat; an empty status clears it.` +
      `\nFrames also come as MCP notifications (logger verstak-channel).`,
    unheard: (listen) => `[verstak-bridge] No watchdog on this seat — frames pile up. ${listen}`,
    monitor: (self, key, where) =>
      `under Monitor — node "${self}" watchdog ${key}${where}, largest timeout_ms, re-armed when it ends (Claude Code)`,
    exit: (self, key, where) =>
      `as a background task — node "${self}" watchdog-exit ${key}${where} (exits on the first message)`,
    codex: (self, key, where) =>
      `in Codex, within one shell command — node "${self}" watchdog-codex ${key}${where} & …; kill %1 (a separate nohup command dies)`,
    self: (pi) =>
      `The ${pi ? "pi extension" : "OpenCode plugin"} listens itself — no watchdog needed: frames enter the turn by their kind, a graph question posed to a role at the next turn.`,
    claude: (monitor, exit) => `Listen: ${monitor}; without Monitor — ${exit}.`,
    codexLine: (codex, exit) => `Listen: ${codex}; without the app-server door — ${exit}.`,
    any: (monitor, exit, codex) => `Listen: ${monitor}; ${exit}; ${codex}.`,
  },
};
