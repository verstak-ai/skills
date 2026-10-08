import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

import {
  BRIDGE_NAME,
  DEFAULT_SERVER_URL,
  envName,
  HOME_DIR,
  SERVER_CHOICE,
  SERVER_URLS,
  tool,
  TOOL_PREFIX,
} from "../delivery/index.ts";
import { setServerLang } from "../shared/lang.ts";
import { envOf, scoped } from "../shared/scope.ts";
import { BUILD } from "./build.ts";
import { log } from "./streams.ts";
import { type Config } from "./types.ts";

export { DEFAULT_SERVER_URL };
/** The English production address (graph @nks/nks-dev, node #5040). */
export const ENGLISH_SERVER_URL = SERVER_URLS.en;
/** Only behind production addresses does the bridge follow delivery releases. */
const PRODUCTION_URLS = new Set([DEFAULT_SERVER_URL, ENGLISH_SERVER_URL].map(strip));
function strip(url: string): string {
  return url.replace(/\/+$/, "");
}
export const isProductionServer = (url: string): boolean => PRODUCTION_URLS.has(strip(url));
/** The human's word for the address: `ru` and `en` name the production ones, else a full URL. */
export function resolveServerChoice(word: string): string | null {
  const w = word.trim();
  if (SERVER_CHOICE.ru.test(w)) return DEFAULT_SERVER_URL;
  if (SERVER_CHOICE.en.test(w)) return ENGLISH_SERVER_URL;
  try {
    return new URL(w).href;
  } catch {
    return null;
  }
}

/**
 * The machine's persistent address choice, a file beside the grant: a plugin entry
 * carries no arguments. Read when neither argument nor environment names the address.
 */
export const serverChoicePath = (authDir: string): string => join(authDir, "server");
export function readServerChoice(authDir: string): string | null {
  try {
    const text = readFileSync(serverChoicePath(authDir), "utf8").trim();
    return text ? new URL(text).href : null;
  } catch {
    return null;
  }
}
export function writeServerChoice(authDir: string, url: string): string {
  const path = serverChoicePath(authDir);
  mkdirSync(authDir, { recursive: true, mode: 0o700 });
  const tmp = `${path}.tmp-${process.pid}`;
  writeFileSync(tmp, url + "\n", { mode: 0o600 });
  renameSync(tmp, path);
  return path;
}

// One config per session scope; CFG proxies to the current scope's config.
const cfgSlot = scoped(() => ({ cfg: null as Config | null }));
export const CFG: Config = new Proxy({} as Config, {
  get: (_, k) => (cfgSlot.cfg ? Reflect.get(cfgSlot.cfg, k) : undefined),
  has: (_, k) => !!cfgSlot.cfg && Reflect.has(cfgSlot.cfg, k),
});

export function setConfig(cfg: Config): void {
  cfgSlot.cfg = cfg;
  setServerLang(cfg.serverUrl);
}

/** Bad arguments (or --version): the process exits with this code, the daemon refuses the session. */
export class ArgsError extends Error {
  readonly code: number;
  /** Text for stdout instead of stderr (--version). */
  readonly out: string | null;
  constructor(message: string, code: number, out: string | null = null) {
    super(message);
    this.code = code;
    this.out = out;
  }
}

/** Parses process arguments; bad ones print and exit. */
export function parseArgs(argv: string[]): Config {
  try {
    return readArgs(argv);
  } catch (e) {
    if (!(e instanceof ArgsError)) throw e;
    if (e.out !== null) process.stdout.write(e.out);
    else log(e.message);
    process.exit(e.code);
  }
}

/** Parses arguments without exiting: bad ones throw ArgsError. */
export function readArgs(argv: string[]): Config {
  const cfg: Config = {
    serverUrl: "",
    timeoutMs: Number(envOf(envName("BRIDGE_TIMEOUT"))) || 120_000,
    authDir: envOf(envName("BRIDGE_AUTH_DIR")) || join(homedir(), HOME_DIR),
    clientName: BRIDGE_NAME,
    noBrowser: !!envOf(envName("BRIDGE_NO_BROWSER")),
    debug: !!envOf(envName("BRIDGE_DEBUG")),
    scope: envOf(envName("BRIDGE_SCOPE")) || null,
    resource: envOf(envName("BRIDGE_RESOURCE")) || null,
    staticClientId: envOf(envName("BRIDGE_CLIENT_ID")) || null,
    deviceClientId: envOf(envName("BRIDGE_DEVICE_CLIENT")) || null,
    deviceRegister: envOf(envName("BRIDGE_DEVICE_REGISTER")) === "1",
    pat: null,
    patSource: null,
    serverSource: "argument",
    // Flag only: an older bridge fails loudly on an unknown flag but would ignore a variable.
    satellite: false,
    tools: null,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--timeout") cfg.timeoutMs = Number(argv[++i]);
    else if (a === "--tools") {
      // Harness tool set (narrow.ts): comma-separated names, the tool prefix optional.
      const names = (argv[++i] ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      if (!names.length) {
        log("--tools needs a comma-separated list of tool names");
        process.exit(2);
      }
      cfg.tools = new Set(names.map((n) => (n.startsWith(TOOL_PREFIX) ? n : tool(n))));
    } else if (a === "--auth-dir") cfg.authDir = argv[++i];
    else if (a === "--client-name") cfg.clientName = argv[++i];
    else if (a === "--no-browser") cfg.noBrowser = true;
    else if (a === "--debug") cfg.debug = true;
    else if (a === "--satellite") cfg.satellite = true;
    else if (a === "--version") throw new ArgsError("--version", 0, BUILD + "\n");
    else if (!a.startsWith("--") && !cfg.serverUrl) cfg.serverUrl = a;
    else throw new ArgsError(`unknown argument: ${a}`, 2);
  }
  if (!cfg.serverUrl) {
    const fromEnv = envOf(envName("BRIDGE_URL"))?.trim();
    const fromFile = fromEnv ? null : readServerChoice(cfg.authDir);
    cfg.serverUrl = fromEnv || fromFile || DEFAULT_SERVER_URL;
    cfg.serverSource = fromEnv ? "env" : fromFile ? "file" : "default";
  }
  try {
    new URL(cfg.serverUrl);
  } catch {
    throw new ArgsError(`not a URL: ${cfg.serverUrl}`, 2);
  }
  if (!Number.isFinite(cfg.timeoutMs) || cfg.timeoutMs < 1000) cfg.timeoutMs = 120_000;
  readPat(cfg);
  return cfg;
}

/**
 * Personal access token, bypassing OAuth (graph @nks/nks-dev, node #4267): the
 * BRIDGE_TOKEN variable, then the `token` file beside the grant (never argv: ps shows it).
 */
function readPat(cfg: Config): void {
  const fromEnv = envOf(envName("BRIDGE_TOKEN"))?.trim();
  if (fromEnv) {
    cfg.pat = fromEnv;
    cfg.patSource = envName("BRIDGE_TOKEN");
    return;
  }
  const file = join(cfg.authDir, "token");
  try {
    const text = readFileSync(file, "utf8").trim();
    if (text) {
      cfg.pat = text;
      cfg.patSource = file;
    }
  } catch {
    /* no file: OAuth login */
  }
}
