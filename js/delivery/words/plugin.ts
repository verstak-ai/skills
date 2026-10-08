// Words shared by the OpenCode plugin and the pi extension (PLUGIN): finding and raising
// the bridge, the channel half.
import type { Lang } from "../lang.ts";

export interface PluginWords {
  noBridge: (tried: string) => string;
  bridgeLine: (line: string) => string;
  notRaised: (message: string) => string;
  refusalNoText: (name: string) => string;
  relistFailed: (message: string) => string;
  listening: () => string;
  dead: (code: number | string) => string;
  evicted: (code: number | string) => string;
  alive: (version: string) => string;
  note: (text: string) => string;
}

export const PLUGIN: Readonly<Record<Lang, PluginWords>> = {
  en: {
    noBridge: (tried) =>
      "Verstak: the bridge was not found — there will be no verstak_* tools in this session. Looked in: " +
      tried +
      ". Set VERSTAK_BRIDGE_PATH or install the bridge with the establish-mcp skill.",
    bridgeLine: (line) => `Verstak/bridge: ${line}`,
    notRaised: (message) => `Verstak: the bridge did not come up — ${message}`,
    refusalNoText: (name) => `${name}: refusal without text`,
    relistFailed: (message) =>
      `Verstak: the tool list was not reread after the change on the server — ${message}`,
    listening: () => "Verstak: the channel is listening",
    dead: (code) =>
      `Verstak: the channel was closed with code ${code} — the token is dead. Call verstak_channel(action="connect")` +
      ", then register with the same name: the bridge takes the new socket from the answer itself, no restart needed.",
    evicted: (code) =>
      `Verstak: the channel was closed with code ${code} — the seat was taken, another holder is listening. ` +
      "The bridge stands beside as name.N with hearing itself — its own seat, the other one is not taken over; the outcome comes next, verstak_stand with the same call tells the seat and the watchdog command. Evicting that session (take=true) — only on the user's word.",
    alive: (version) =>
      `Verstak: the socket keeps being cut while the service answers (${version}) — the bridge holds the seat and reopens less often; ` +
      "if it fails, ask about the token.",
    note: (text) => `Verstak: ${text}`,
  },
};
