import { spawn } from "node:child_process";
import { join } from "node:path";

import { envName } from "../../delivery/index.ts";
import { noteServerDate, now } from "../clock.ts";
import { CFG } from "../config.ts";
import { errorMessage } from "../errors.ts";
import { loadStore, saveStore, sha256 } from "../store.ts";
import { debug, log } from "../streams.ts";
import { type AsMetadata, type Client, type Meta } from "../types.ts";

export async function fetchJson<T = any>( // eslint-disable-line @typescript-eslint/no-explicit-any
  url: string,
  opts: RequestInit = {},
  timeoutMs = 15_000,
): Promise<T> {
  const res = await fetch(url, { ...opts, signal: AbortSignal.timeout(timeoutMs) });
  noteServerDate(res);
  if (!res.ok) throw new Error(`${opts.method || "GET"} ${url} -> ${res.status}`);
  return res.json() as Promise<T>;
}

interface ProtectedResourceMetadata {
  authorization_servers?: string[];
  scopes_supported?: string[];
  resource?: string;
}

// RFC 9728: locate the protected-resource metadata, then the AS metadata, and
// remember the result in the store.
export async function discover(wwwAuthenticate: string | null | undefined): Promise<Meta> {
  const meta = await discoverMeta(wwwAuthenticate);
  saveStore({ meta });
  return meta;
}

// The same discovery, read-only: what `doctor` looks with.
export async function discoverMeta(wwwAuthenticate: string | null | undefined): Promise<Meta> {
  const u = new URL(CFG.serverUrl);
  const candidates: string[] = [];
  const m = /resource_metadata="?([^",\s]+)"?/.exec(wwwAuthenticate || "");
  if (m) candidates.push(m[1]);
  const path = u.pathname === "/" ? "" : u.pathname;
  candidates.push(`${u.origin}/.well-known/oauth-protected-resource${path}`);
  candidates.push(`${u.origin}/.well-known/oauth-protected-resource`);

  let prm: ProtectedResourceMetadata | null = null;
  for (const c of candidates) {
    try {
      prm = await fetchJson<ProtectedResourceMetadata>(c);
      debug(`protected-resource metadata: ${c}`);
      break;
    } catch (e) {
      debug(`no PRM at ${c}: ${errorMessage(e)}`);
    }
  }
  const asBase = prm?.authorization_servers?.[0] || u.origin;
  const asUrl = new URL(asBase);
  const asPath = asUrl.pathname === "/" ? "" : asUrl.pathname;
  const asCandidates = [
    `${asUrl.origin}/.well-known/oauth-authorization-server${asPath}`,
    `${asUrl.origin}${asPath}/.well-known/oauth-authorization-server`,
    `${asUrl.origin}/.well-known/openid-configuration${asPath}`,
    `${asUrl.origin}${asPath}/.well-known/openid-configuration`,
  ];
  let as: AsMetadata | null = null;
  for (const c of asCandidates) {
    try {
      as = await fetchJson<AsMetadata>(c);
      debug(`AS metadata: ${c}`);
      break;
    } catch (e) {
      debug(`no AS metadata at ${c}: ${errorMessage(e)}`);
    }
  }
  if (!as?.authorization_endpoint || !as?.token_endpoint) {
    throw new Error(
      `OAuth discovery failed for ${CFG.serverUrl}: no authorization server metadata reachable`,
    );
  }
  const scope =
    CFG.scope || (prm?.scopes_supported?.length ? prm.scopes_supported.join(" ") : null);
  // The resource indicator decides the token's audience, so it must be the
  // exact string the MCP server validates against — including a trailing
  // slash. Discovery is the default because the server publishes it; the
  // override exists because a deployment can validate a form its own metadata
  // does not print, and then only its operator knows the right one.
  return { as, resource: CFG.resource || prm?.resource || CFG.serverUrl, scope };
}

// The resource every grant asks for — the loopback login, its exchange, the
// refresh, the device poll. Discovery is cached in the store, so an override
// set after a flow ran is seen only where the value is used: here.
export const resourceOf = (meta: Meta): string => CFG.resource || meta.resource;

// Stable per-origin loopback port, so the registered redirect_uri survives
// restarts. The port sits in the OS's ephemeral range on Linux, so any
// outbound socket on the machine can happen to hold it (witnessed on a shared
// CI runner) — hence a short ladder of derived rungs rather than one port:
// one foreign occupant must not make login impossible. The first rung is the
// historical port, so existing registrations keep working; a changed rung
// merely re-registers the client.
export const CALLBACK_PORT_RUNGS = 3;
export function callbackPort(rung = 0): number {
  const d = sha256(new URL(CFG.serverUrl).origin);
  return 42000 + ((d[0] * 256 + d[1] + rung * 613) % 2000);
}

// Rauthy deletes a dynamic client that made no login within its cleanup
// horizon — 60 minutes by default for unauthenticated registration — and the
// NotFound that meets a kept client_id happens in the human's browser, where
// the bridge never sees it (graph @nks/nks-dev, node #4539). A browser flow
// starts only when the grant is dead or absent, so an old registration has
// nothing left to offer it: the flow reuses a registration only while it is
// young (a retry of a login just offered), and otherwise makes one anew —
// cheap, and the server discards the leftovers itself. The clock is the
// server-corrected one, like every other hour the bridge judges by.
export const REGISTRATION_REUSE_MS = 45 * 60_000;

export function registrationReusable(
  client: Client | null | undefined,
  redirectUri: string,
): boolean {
  if (!client?.client_id || client.redirect_uri !== redirectUri) return false;
  return !!client.registered_at && now() - client.registered_at < REGISTRATION_REUSE_MS;
}

export async function ensureClient(meta: Meta, redirectUri: string): Promise<Client> {
  if (CFG.staticClientId) return { client_id: CFG.staticClientId };
  const stored = loadStore().client;
  if (registrationReusable(stored, redirectUri)) return stored as Client;
  if (stored?.client_id && stored.redirect_uri === redirectUri) {
    log(
      stored.registered_at
        ? "the dynamic client registration is older than the server's cleanup horizon — registering anew for this login"
        : "the dynamic client registration carries no timestamp (an earlier build wrote it) — registering anew for this login",
    );
  }
  if (!meta.as.registration_endpoint) {
    throw new Error(
      `server offers no dynamic client registration; pass ${envName("BRIDGE_CLIENT_ID")}`,
    );
  }
  const reg = await fetchJson<{ client_id: string }>(meta.as.registration_endpoint, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      client_name: CFG.clientName,
      redirect_uris: [redirectUri],
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
      token_endpoint_auth_method: "none",
    }),
  });
  const client: Client = {
    client_id: reg.client_id,
    redirect_uri: redirectUri,
    registered_at: now(),
  };
  saveStore({ client });
  log(`registered OAuth client ${reg.client_id}`);
  return client;
}

export function openBrowser(url: string): void {
  log(`authorize in the browser:\n  ${url}`);
  if (CFG.noBrowser) return;
  const [cmd, args]: [string, string[]] =
    process.platform === "darwin"
      ? ["open", [url]]
      : process.platform === "win32"
        ? windowsOpener(url)
        : ["xdg-open", [url]];
  const manually = (e: unknown) =>
    log(`could not open a browser (${errorMessage(e)}) — open the URL above manually`);
  try {
    // A missing opener surfaces as an 'error' event, not a throw; unhandled, it
    // would take the bridge down under the human's login.
    const child = spawn(cmd, args, { stdio: "ignore", detached: true });
    child.on("error", manually);
    child.unref();
  } catch (e) {
    manually(e);
  }
}

// cmd.exe reads `&` as a command separator, so `cmd /c start "" <url>` opened
// the authorize URL cut at its first parameter (graph @nks/nks-dev, node
// #4538). PowerShell takes the whole command base64-encoded — no shell ever
// parses the URL — and its single-quoted string is literal; the window is
// hidden by PowerShell itself (`detached` cancels Node's windowsHide).
function windowsOpener(url: string): [string, string[]] {
  const powershell = join(
    process.env.SystemRoot || "C:\\Windows",
    "System32",
    "WindowsPowerShell",
    "v1.0",
    "powershell.exe",
  );
  const command = `Start-Process -FilePath '${url.replace(/'/g, "''")}'`;
  return [
    powershell,
    [
      "-NoProfile",
      "-NonInteractive",
      "-WindowStyle",
      "Hidden",
      "-EncodedCommand",
      Buffer.from(command, "utf16le").toString("base64"),
    ],
  ];
}
