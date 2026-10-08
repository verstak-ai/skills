// Pure helpers of the "tools" half (tools.ts): where the bridge is, the tool list cache
// next to the grant, the handshake that waits for the human's sign-in, paged tools/list.
import {
  accessSync,
  constants,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";

import { envName, HOME_DIR, OPENCODE, PLUGIN } from "../delivery/index.ts";
import { type Bridge, resultToContent } from "../shared/bridge-client.ts";
import { OPENCODE_CLIENT } from "../shared/clients.ts";
import { FIELDS_CAPABILITIES } from "../shared/fields.ts";
import { homeBridgePath } from "../shared/home.ts";
import { words } from "../shared/lang.ts";
import { buildOf, buildOfFile } from "../shared/version.ts";
import { codeWatch, deviceOf } from "./devicewait.ts";

/** The handshake's own ceiling; when it runs out the handshake is repeated, not given up. */
export const HANDSHAKE_MS = Number(process.env[envName("MCP_HANDSHAKE_MS")] || 600000);
/** How often to ask the bridge again while the human signs in. */
export const AUTH_POLL_MS = Number(process.env[envName("MCP_AUTH_POLL_MS")] || 2000);
/**
 * The pause before the n-th retry of a handshake that failed not on the sign-in: a refusal
 * that repeats is not hammered every AUTH_POLL_MS (in the field that made ~1500 handshakes an hour).
 */
export const retryPause = (n: number): number => Math.min(AUTH_POLL_MS * 2 ** n, 60_000);
/** The bridge's refusal without a grant is a sign-in in progress: killing the bridge kills the sign-in (#4712). */
const AUTH_PENDING = /authorization required/i;
const PROTOCOL = "2025-06-18";

/* eslint-disable @typescript-eslint/no-explicit-any -- bridge answers come without a schema */

/** Where the bridge is: the variable, then the home copy (the plugin lies as a copy, not in a package). */
export function findBridge(): { path: string | null; tried: string[] } {
  const tried: string[] = [];
  const env = process.env[envName("BRIDGE_PATH")]?.trim();
  if (env) tried.push(resolve(env));
  tried.push(homeBridgePath());
  for (const candidate of tried) {
    try {
      accessSync(candidate, constants.R_OK);
      return { path: candidate, tried };
    } catch {
      /* next */
    }
  }
  return { path: null, tried };
}

/**
 * Both builds for the status tool — the bridge's by its file and the plugin's own. Taken
 * once at start: a self-update rewrites both files while the old build keeps running.
 */
export function buildsLine(bridgePath: string, pluginUrl: string): string {
  const W = words(OPENCODE);
  return W.builds(buildOfFile(bridgePath) ?? W.unreadable(), buildOf(pluginUrl));
}

export function authDir(): string {
  return process.env[envName("BRIDGE_AUTH_DIR")] || join(homedir(), HOME_DIR);
}

function cachePath(): string {
  return join(authDir(), "opencode-tools.json");
}

/**
 * The grant's fingerprint — the bridge's stores next to the tool cache. Changed — the human
 * signed in and the handshake is worth repeating; not earlier: asking a bridge without a
 * grant after its sign-in ended would open the browser again.
 */
function grantStamp(): string {
  const dir = authDir();
  try {
    return readdirSync(dir)
      .filter((f) => f.endsWith(".json") && f !== "opencode-tools.json")
      .map((f) => `${f}:${statSync(join(dir, f)).mtimeMs}`)
      .sort()
      .join("|");
  } catch {
    return "";
  }
}

export const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

export function readCache(): any[] | null {
  try {
    const list = JSON.parse(readFileSync(cachePath(), "utf8"));
    return Array.isArray(list) && list.length ? list : null;
  } catch {
    return null;
  }
}

export function writeCache(tools: any[]): void {
  try {
    mkdirSync(join(cachePath(), ".."), { recursive: true, mode: 0o700 });
    writeFileSync(cachePath(), JSON.stringify(tools), { mode: 0o600 });
  } catch {
    /* the cache is a convenience, not an obligation */
  }
}

/** The sign-in link from the bridge's refusal, if it named one. */
function loginUrlOf(message: string): string | null {
  return /open in a browser: (\S+)/.exec(message)?.[1] ?? null;
}

/**
 * The handshake. To "sign-in needed" the bridge answers at once and waits for the sign-in in
 * the background; the handshake repeats when the grant lands, ceiling HANDSHAKE_MS. A changed
 * or expired device code (devicewait.ts) is a reason to repeat too. Success always clears the
 * sign-in flag: the grant may have landed from outside (a token file, another bridge).
 */
export async function handshake(
  b: Bridge,
  onLogin: (url: string | null, device: string | null) => void,
  onReady: () => void,
): Promise<void> {
  const deadline = Date.now() + HANDSHAKE_MS;
  for (;;) {
    const stamp = grantStamp();
    try {
      await b.request(
        "initialize",
        {
          protocolVersion: PROTOCOL,
          capabilities: FIELDS_CAPABILITIES, // answer fields — for this client too (#6637)
          clientInfo: { name: OPENCODE_CLIENT, version: "1" },
        },
        { timeoutMs: Math.max(1, deadline - Date.now()) },
      );
      break;
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      if (!AUTH_PENDING.test(message)) throw e;
      onLogin(loginUrlOf(message), deviceOf(message));
      const code = codeWatch(authDir(), message);
      while (grantStamp() === stamp) {
        if (Date.now() + AUTH_POLL_MS > deadline) throw e;
        await sleep(AUTH_POLL_MS);
        if (code.moved()) break;
      }
    }
  }
  onReady();
  b.notify("notifications/initialized");
}

export async function listTools(b: Bridge): Promise<any[]> {
  const tools: any[] = [];
  let cursor: string | undefined;
  do {
    const page = await b.request("tools/list", cursor ? { cursor } : {}, {
      timeoutMs: HANDSHAKE_MS,
    });
    for (const t of page?.tools ?? []) tools.push(t);
    cursor = page?.nextCursor;
  } while (cursor);
  return tools;
}

export function textOf(result: any): string {
  return resultToContent(result)
    .map((c) => (c.type === "text" ? c.text : "[image]"))
    .join("\n");
}

/* eslint-enable @typescript-eslint/no-explicit-any */

/** The server changed its tools and the bridge said list_changed (#5406): reread and replace. */
export async function refreshToolList(
  b: Bridge,
  state: { listed: any[]; source: string },
  reload: () => Promise<void>,
  say: (text: string, level: "info" | "warning") => void,
  live: () => boolean, // the plugin is not stopped: after a stop — no replacement, no word
): Promise<void> {
  try {
    const list = await listTools(b);
    if (!live() || JSON.stringify(list) === JSON.stringify(state.listed)) return;
    state.listed = list;
    state.source = words(OPENCODE).fromServer();
    writeCache(list);
    await reload();
    say(words(OPENCODE).serverChanged(list.length), "info");
  } catch (e) {
    if (!live()) return;
    say(words(PLUGIN).relistFailed((e as Error).message), "warning");
  }
}
