// Words shared by the OpenCode plugin and the pi extension (PLUGIN): finding and raising
// the bridge, the channel half.
import type { Lang } from "../lang.ts";
import { tool, TOOL_PREFIX } from "../protocol.ts";
import { TAKE } from "./take.ts";

export interface PluginWords {
  noBridge: (tried: string) => string;
  bridgeLine: (line: string) => string;
  notRaised: (message: string) => string;
  refusalNoText: (name: string) => string;
  relistFailed: (message: string) => string;
  listening: () => string;
  dead: (code: number | string) => string;
  /** text — the bridge's stop word (the owner took the seat off, #7439): to the human, no session turn. */
  stopped: (text: string) => string;
  /** stopped — the stop word (`stopped`): in the turn context of a stopped session until it stands again. */
  stoppedTurn: (stopped: string) => string;
  /** The general stop word — a stop record laid before the plugin kept its word. */
  stoppedAny: () => string;
  evicted: (code: number | string) => string;
  alive: (version: string) => string;
  note: (text: string) => string;
}

export const PLUGIN: Readonly<Record<Lang, PluginWords>> = {
  en: {
    noBridge: (tried) =>
      `Verstak: the bridge was not found — there will be no ${TOOL_PREFIX}* tools in this session. Looked in: ` +
      tried +
      ". Set VERSTAK_BRIDGE_PATH or install the bridge by the verstak skill's establish-mcp method.",
    bridgeLine: (line) => `Verstak/bridge: ${line}`,
    notRaised: (message) => `Verstak: the bridge did not come up — ${message}`,
    refusalNoText: (name) => `${name}: refusal without text`,
    relistFailed: (message) =>
      `Verstak: the tool list was not reread after the change on the server — ${message}`,
    listening: () => "Verstak: the channel is listening",
    dead: (code) =>
      String(code) === "4002"
        ? `Verstak: channel closed with code 4002 — the seat went out after idling. Return it: ${tool("stand")} with the same name.`
        : `Verstak: channel closed with code ${code} — the token is dead. Call ${tool("channel")}(action="connect")` +
          ", then register with the same name; no restart needed.",
    stopped: (text) => `Verstak: ${text}`,
    stoppedTurn: (stopped) =>
      `${stopped}. This holds while the seat is off; stand again only on the user's word, by an explicit ${tool("stand")} call.`,
    stoppedAny: () =>
      "Verstak: the seat was taken off — you are stopped: end the work, do not take the seat",
    evicted: (code) =>
      `Verstak: the channel was closed with code ${code} — the seat was taken, another holder listens. ` +
      `The bridge stands beside on its own seat name.N with hearing, not taking the other; the outcome follows, ${tool("stand")} with the same call tells the seat and the watchdog command. ` +
      `Evicting that session (take=true): ${TAKE.en.rule()}.`,
    alive: (version) =>
      `Verstak: the socket keeps dropping though the service answers (${version}) — seat held, reopening less often; ` +
      "if it fails, ask about the token.",
    note: (text) => `Verstak: ${text}`,
  },
};
