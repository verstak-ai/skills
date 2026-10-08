// doctor's satellite-bridge probe (SAT_PROBE); the prose it parses lives in
// patterns/satprobe.ts.
import type { Lang } from "../lang.ts";

export interface SatProbeWords {
  loginAdvice: () => string;
  exited: (code: string) => string;
  refusalLogin: (label: string, what: string, advice: string) => string;
  refusal: (label: string, what: string, msg: string) => string;
  silent: (secs: number) => string;
  oldFlag: (flag: string) => string;
  runByHand: () => string;
  noInit: (label: string, why: string, stderrNote: string, old: string) => string;
  noList: (label: string, name: string, version: string, exited: string | null) => string;
  answered: (label: string, name: string, version: string, tools: number) => string;
  schema: (tool: string | undefined, bad: string) => string;
  winKilled: (label: string, secs: number) => string;
  sigKilled: (label: string, secs: number) => string;
}

export const SAT_PROBE: Readonly<Record<Lang, SatProbeWords>> = {
  en: {
    loginAdvice: () =>
      "log in: call any verstak_* tool in the main session and open the login link from its answer (or put a personal token in ~/.verstak-bridge/token — the establish-mcp skill), then repeat doctor",
    exited: (code) => `exited with code ${code}`,
    refusalLogin: (label, what, advice) =>
      `probe "${label}": ${what} — the satellite is not logged in: the machine grant is dead or revoked → ${advice}`,
    refusal: (label, what, msg) =>
      `probe "${label}": ${what} returned a refusal: ${msg} → do what the refusal says and repeat doctor`,
    silent: (secs) => `silent for ${secs}s`,
    oldFlag: (flag) =>
      ` — it seems the home bridge is older than the ${flag} flag → node ~/.verstak-bridge/verstak-bridge.mjs update`,
    runByHand: () => " → run this command by hand and read what it writes to stderr",
    noInit: (label, why, stderrNote, old) =>
      `probe "${label}": the bridge did not answer initialize (${why}${stderrNote})${old}`,
    noList: (label, name, version, exited) =>
      `probe "${label}": initialize answered (${name} v${version}), tools/list did not (${exited ?? "silent"}) → run the command by hand and read its stderr`,
    answered: (label, name, version, tools) =>
      `probe "${label}": the bridge answered — ${name} v${version}, tools ${tools}`,
    schema: (tool, bad) =>
      `tool ${tool}: the schema carries ${bad} at the top level — the server hands out a schema the Anthropic API will reject ("input_schema does not support oneOf, allOf, or anyOf at the top level"), and the whole subagent run fails, not just this tool → the server fixes this, not the agent file or the bridge (the bridge passes the schema as is): tell the MCP server operator the tool name — whoever holds the address from the "server" line above — and wait for their update, then repeat doctor`,
    winKilled: (label, secs) =>
      `probe "${label}": the bridge did not leave on closed stdin within ${secs}s — killed forcibly → repeat doctor; if it was renewing the token, a login may be needed again`,
    sigKilled: (label, secs) =>
      `probe "${label}": the bridge left neither on closed stdin nor on SIGTERM within ${secs}s — killed with SIGKILL → repeat doctor; if it was renewing the token, a login may be needed again`,
  },
};
