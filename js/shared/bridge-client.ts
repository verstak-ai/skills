// MCP client over stdio to a child bridge, and its answers in pi's form.
import { type ChildProcess, spawn } from "node:child_process";
import { basename } from "node:path";

import { BRIDGE_CLIENT, envName, ID_PREFIX } from "../delivery/index.ts";
import { words } from "./lang.ts";

const W = () => words(BRIDGE_CLIENT);

/**
 * What runs the bridge. Under pi — node itself. Under OpenCode the process is the Bun
 * built into the opencode binary: a bare execPath would start opencode with the bridge
 * path as a project directory (observed), but with BUN_BE_BUN=1 it runs as plain bun,
 * so OpenCode needs no Node. The NODE variable is an explicit override for people and probes.
 */
export function bridgeRuntime(): { bin: string; env: NodeJS.ProcessEnv } {
  const own = process.env[envName("NODE")]?.trim();
  if (own) return { bin: own, env: process.env };
  if (process.versions?.bun)
    return { bin: process.execPath, env: { ...process.env, BUN_BE_BUN: "1" } };
  if (!/^node/i.test(basename(process.execPath))) return { bin: "node", env: process.env };
  return { bin: process.execPath, env: process.env };
}

/** Id prefix of a client's service call (launch line etc.): the bridge does not count it as agent work. */
export const SERVICE_ID = `${ID_PREFIX}service-`;

/** Grace after SIGTERM — longer than the 3 s ceiling on publishing a cleared busy status. */
const STOP_GRACE_MS = 5000;

export type Content =
  { type: "text"; text: string } | { type: "image"; data: string; mimeType: string };

/** MCP client over stdio; NDJSON framing both ways, as the bridge does. */
export class Bridge {
  private proc: ChildProcess | null = null;
  private buf = "";
  private nextId = 1;
  private pending = new Map<
    number | string,
    { resolve: (v: any) => void; reject: (e: Error) => void }
  >();
  private tail: string[] = [];
  private dead: Error | null = null;
  private readonly bin: string;
  private readonly onLog: (line: string) => void;
  private readonly onNotification: (method: string, params: any) => void;
  private readonly onDie: (e: Error) => void;
  private readonly args: string[];

  constructor(
    bin: string,
    onLog: (line: string) => void,
    onNotification: (method: string, params: any) => void = () => {},
    /** The bridge died or was stopped — once, with the reason; the OpenCode plugin announces lost hearing by it. */
    onDie: (e: Error) => void = () => {},
    /** Bridge flags (OpenCode plugin: `--satellite` of a child session, #6002). */
    args: string[] = [],
  ) {
    this.bin = bin;
    this.onLog = onLog;
    this.onNotification = onNotification;
    this.onDie = onDie;
    this.args = args;
  }

  /** The bridge exited or failed to start — calls to it are refused with this. */
  get failure(): Error | null {
    return this.dead;
  }

  /** env — over the runtime's: host version for attrs.harness_version (#6226). */
  start(env: Record<string, string> = {}): void {
    const rt = bridgeRuntime();
    const proc = spawn(rt.bin, [this.bin, ...this.args], {
      stdio: ["pipe", "pipe", "pipe"],
      env: { ...rt.env, ...env },
    });
    this.proc = proc;
    proc.stdout?.setEncoding("utf8");
    proc.stdout?.on("data", (chunk: string) => this.feed(chunk));
    proc.stderr?.setEncoding("utf8");
    // The bridge's stderr is the only window into a long OAuth: seeing it means no hang.
    let errBuf = "";
    proc.stderr?.on("data", (chunk: string) => {
      errBuf += chunk;
      const lines = errBuf.split("\n");
      errBuf = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.trim()) continue;
        this.tail.push(line);
        if (this.tail.length > 20) this.tail.shift();
        this.onLog(line);
      }
    });
    proc.on("error", (e) => this.die(new Error(W().failedToStart(e.message))));
    proc.on("exit", (code, signal) => this.die(new Error(W().exited(code, signal, this.why()))));
  }

  private why(): string {
    return this.tail.length ? W().lastFromBridge(this.tail.slice(-3).join(" | ")) : "";
  }

  private die(e: Error): void {
    if (this.dead) return;
    this.dead = e;
    for (const [, p] of this.pending) p.reject(e);
    this.pending.clear();
    try {
      this.onDie(e);
    } catch {
      /* the death notice must not crash the reader */
    }
  }

  private feed(chunk: string): void {
    this.buf += chunk;
    // LF only: U+2028/U+2029 are legal inside a JSON string, so no generic line reader.
    const lines = this.buf.split("\n");
    this.buf = lines.pop() ?? "";
    for (const line of lines) {
      const trimmed = line.replace(/\r$/, "").trim();
      if (!trimmed) continue;
      let msg: any;
      try {
        msg = JSON.parse(trimmed);
      } catch {
        continue; // not our frame — the bridge talks on stderr
      }
      const service = typeof msg?.id === "string" && msg.id.startsWith(SERVICE_ID);
      if (typeof msg?.id !== "number" && !service) {
        // A notification without id — standing frames come this way.
        if (typeof msg?.method === "string") this.onNotification(msg.method, msg.params);
        continue;
      }
      const waiter = this.pending.get(msg.id);
      if (!waiter) continue;
      this.pending.delete(msg.id);
      if (msg.error)
        waiter.reject(
          Object.assign(new Error(msg.error.message || JSON.stringify(msg.error)), {
            code: msg.error.code,
          }),
        );
      else waiter.resolve(msg.result);
    }
  }

  notify(method: string, params?: unknown): void {
    if (this.dead || !this.proc?.stdin?.writable) return;
    this.proc.stdin.write(JSON.stringify({ jsonrpc: "2.0", method, params }) + "\n");
  }

  request(
    method: string,
    params: unknown,
    opts: { timeoutMs?: number; signal?: AbortSignal; service?: boolean } = {},
  ): Promise<any> {
    if (this.dead) return Promise.reject(this.dead);
    // A plugin's or extension's service call is not agent work (#6510): the bridge knows it by id.
    const id = opts.service ? `${SERVICE_ID}${this.nextId++}` : this.nextId++;
    return new Promise((res, rej) => {
      let timer: ReturnType<typeof setTimeout> | null = null;
      const settle = (fn: (v: any) => void) => (v: any) => {
        if (timer) clearTimeout(timer);
        opts.signal?.removeEventListener("abort", onAbort);
        fn(v);
      };
      const resolve = settle(res);
      const reject = settle(rej as (v: any) => void);
      function onAbort() {
        reject(new Error(W().aborted()));
      }
      this.pending.set(id, { resolve, reject });
      if (opts.signal) {
        if (opts.signal.aborted) return onAbort();
        opts.signal.addEventListener("abort", onAbort, { once: true });
      }
      const ms = opts.timeoutMs;
      if (ms) {
        timer = setTimeout(() => {
          this.pending.delete(id);
          reject(new Error(W().noAnswer(method, ms, this.why())));
        }, ms);
        timer.unref?.();
      }
      if (!this.proc?.stdin?.writable) return reject(new Error(W().noWrites()));
      this.proc.stdin.write(JSON.stringify({ jsonrpc: "2.0", id, method, params }) + "\n");
    });
  }

  stop(): void {
    this.die(new Error(W().sessionClosed()));
    const proc = this.proc;
    this.proc = null;
    if (!proc || proc.killed || proc.exitCode !== null) return;
    try {
      proc.stdin?.end();
      proc.kill("SIGTERM");
      // A pending OAuth would keep the bridge past the session, but leaving first clears
      // the busy status (3 s ceiling); an earlier SIGKILL left a ghost busy seat (#5140).
      const hard = setTimeout(() => {
        try {
          proc.kill("SIGKILL");
        } catch {
          /* already dead */
        }
      }, STOP_GRACE_MS);
      hard.unref?.();
      proc.on("exit", () => clearTimeout(hard));
    } catch {
      /* nothing to close */
    }
  }
}

/** Tool schema for pi: no conversion, only the meta key is dropped. */
export function toParameters(inputSchema: any): any {
  const schema =
    inputSchema && typeof inputSchema === "object"
      ? { ...inputSchema }
      : { type: "object", properties: {} };
  delete schema.$schema; // the dialect's passport, not part of the parameter contract
  if (!schema.type) schema.type = "object";
  if (schema.type === "object" && !schema.properties) schema.properties = {};
  return schema;
}

/** One line for the system prompt's "Available tools" section. */
export function snippet(description: string): string {
  const first = (description || "").split("\n").find((l) => l.trim()) ?? "";
  const cut = first.trim().split(/(?<=[.。!?])\s/)[0] ?? first.trim();
  return cut.length > 160 ? cut.slice(0, 157) + "…" : cut;
}

export function resultToContent(result: any): Content[] {
  const blocks = Array.isArray(result?.content) ? result.content : [];
  const out: Content[] = blocks.map((b: any): Content => {
    if (b?.type === "text") return { type: "text" as const, text: String(b.text ?? "") };
    if (b?.type === "image" && b.data) {
      return {
        type: "image" as const,
        data: String(b.data),
        mimeType: String(b.mimeType ?? "image/png"),
      };
    }
    return { type: "text" as const, text: JSON.stringify(b) };
  });
  if (out.length) return out;
  const structured = result?.structuredContent;
  return [
    {
      type: "text" as const,
      text: structured ? JSON.stringify(structured) : W().emptyAnswer(),
    },
  ];
}
