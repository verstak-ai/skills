// A trial run of the satellite bridge for doctor's subagents section: does the command
// the harness will raise answer initialize and tools/list, and will the Anthropic API
// accept its tool schemas. A top-level oneOf/allOf/anyOf fails the whole subagent run
// with a 400 that names no tool; here the tool is named.
import { spawn } from "node:child_process";
import { createInterface } from "node:readline";

import {
  CLIENTS,
  envName,
  SAT_LOGIN_RE,
  SAT_OLD_FLAG_RE,
  SAT_PROBE,
  type SatProbeWords,
} from "../delivery/index.ts";
import { words } from "../shared/lang.ts";

const sw = (): SatProbeWords => words(SAT_PROBE);

const PROBE_MS = Number(process.env[envName("DOCTOR_PROBE_MS")]) || 30_000;
/** One request deadline of the probe bridge: how long it may wait for an in-flight request when leaving. */
const REQUEST_MS = 20_000;
/** Windows: wait for leaving on closed stdin, longer than a request with a token renewal. */
const WIN_WAIT_MS = 40_000;

interface Reply {
  id?: unknown;
  error?: { message?: unknown };
  result?: {
    serverInfo?: { name?: string; version?: string };
    tools?: { name?: string; inputSchema?: Record<string, unknown> }[];
  };
}

export interface ProbeCommand {
  command: string;
  args: string[];
  env: Record<string, string>;
}

/** How to log in when the machine has no live login: the probe bridge's link dies with it. */
export const loginAdvice = (): string => sw().loginAdvice();

/** The probe's outcome: `lines` observed, `findings` breakages, each with a ready action. */
export interface ProbeResult {
  lines: string[];
  findings: string[];
}

export async function probeSatellite(
  label: string,
  e: ProbeCommand,
  cwd: string,
): Promise<ProbeResult> {
  const lines: string[] = [];
  const findings: string[] = [];
  const env: Record<string, string | undefined> = {
    ...process.env,
    ...e.env,
    [envName("BRIDGE_NO_BROWSER")]: "1",
    [envName("BRIDGE_NO_UPDATE")]: "1",
    [envName("BRIDGE_ORPHAN_FLOW_MS")]: "1",
    [envName("BRIDGE_TIMEOUT")]: e.env[envName("BRIDGE_TIMEOUT")] ?? String(REQUEST_MS),
  };
  delete env[envName("CHANNEL_SOCKET")]; // the probe holds no foreign socket
  delete env[envName("CHANNEL_STATUS")];
  const child = spawn(e.command, e.args, { cwd, env, stdio: ["pipe", "pipe", "pipe"] });
  child.stdin.on("error", () => {}); // the bridge left before the write: its outcome, not a doctor crash
  let stderr = "";
  child.stderr.on("data", (c: Buffer) => (stderr = (stderr + c.toString()).slice(-4000)));
  const replies = new Map<number, Reply>();
  let wake: (() => void) | null = null;
  createInterface({ input: child.stdout }).on("line", (l) => {
    try {
      const m = JSON.parse(l) as Reply;
      if (typeof m.id === "number") replies.set(m.id, m);
    } catch {}
    wake?.();
  });
  let exited: string | null = null;
  child.on("error", (err) => {
    exited = err.message;
    wake?.();
  });
  child.on("exit", (code, sig) => {
    exited ??= sw().exited(String(code ?? sig));
    wake?.();
  });
  const deadline = Date.now() + PROBE_MS;
  const ask = async (id: number, method: string, params: unknown): Promise<Reply | null> => {
    if (!exited)
      child.stdin.write(JSON.stringify({ jsonrpc: "2.0", id, method, params }) + "\n", () => {});
    while (!replies.has(id) && !exited && Date.now() < deadline)
      await new Promise<void>((res) => {
        wake = res;
        setTimeout(res, 200);
      });
    return replies.get(id) ?? null;
  };
  const tail = () =>
    stderr
      .trim()
      .split("\n")
      .slice(-2)
      .map((s) => s.slice(0, 300))
      .join(" | ");
  const init = await ask(1, "initialize", {
    protocolVersion: "2025-06-18",
    capabilities: {},
    clientInfo: { name: CLIENTS.doctor, version: "1" },
  });
  // A refusal with a login link is a dead machine grant: the link leaves with the
  // probe, so the advice is the no-login one, not "do what the refusal says".
  const refusal = (what: string, raw: unknown): string => {
    const msg = String(raw ?? "");
    return SAT_LOGIN_RE.test(msg)
      ? sw().refusalLogin(label, what, loginAdvice())
      : sw().refusal(label, what, msg.slice(0, 300));
  };
  if (!init) {
    const why = exited ?? sw().silent(Math.round(PROBE_MS / 1000));
    const flag = /unknown argument: --tools/.test(stderr)
      ? "--tools"
      : SAT_OLD_FLAG_RE.test(stderr)
        ? "--satellite"
        : null;
    const old = flag ? sw().oldFlag(flag) : sw().runByHand();
    const stderrNote = tail() ? `; stderr: ${tail()}` : "";
    findings.push(sw().noInit(label, why, stderrNote, old));
  } else if (init.error) {
    findings.push(refusal("initialize", init.error.message));
  } else {
    child.stdin.write(
      JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }) + "\n",
      () => {},
    );
    const info = init.result?.serverInfo ?? {};
    const list = await ask(2, "tools/list", {});
    const tools = list?.result?.tools ?? [];
    const name = info.name ?? "?";
    const version = info.version ?? "?";
    if (!list) findings.push(sw().noList(label, name, version, exited));
    else if (list.error) findings.push(refusal("tools/list", list.error.message));
    else {
      lines.push(sw().answered(label, name, version, tools.length));
      for (const t of tools) {
        const bad = ["oneOf", "allOf", "anyOf"].filter((k) => t.inputSchema && k in t.inputSchema);
        if (bad.length) findings.push(sw().schema(t.name, bad.join(", ")));
      }
    }
  }
  // Leave politely: on closed stdin and SIGTERM the bridge waits for in-flight requests,
  // a token renewal among them — a SIGKILL mid-renewal would leave the machine with a
  // spent refresh token. SIGKILL only for a bridge still there after SIGTERM, with a line.
  const gone = new Promise<void>((res) => (exited ? res() : child.once("exit", () => res())));
  // Timers are unref'd: a bridge that left at once does not hold doctor.
  const within = (ms: number) =>
    Promise.race([
      gone.then(() => true),
      new Promise<boolean>((res) => setTimeout(() => res(false), ms).unref()),
    ]);
  child.stdin.end();
  if (process.platform === "win32") {
    // On Windows any signal is an instant TerminateProcess without cleanup: only closed stdin is left.
    if (!(await within(WIN_WAIT_MS))) {
      child.kill();
      findings.push(sw().winKilled(label, WIN_WAIT_MS / 1000));
    }
    return { lines, findings };
  }
  if (!(await within(10_000))) {
    child.kill("SIGTERM");
    if (!(await within(REQUEST_MS + 10_000))) {
      child.kill("SIGKILL");
      const secs = Math.round((REQUEST_MS + 20_000) / 1000);
      findings.push(sw().sigKilled(label, secs));
    }
  }
  return { lines, findings };
}
