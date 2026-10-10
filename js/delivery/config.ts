// The machine's override of two build values (graph @nks/nks-dev, node #7243): the
// default server address and the tool prefix, read once per process from config.json
// in the bridge home. Without the file both stay the build's. A bad file is said on
// stderr and ignored whole or by key — never a crash.
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

import { BRIDGE_NAME, BUILD_SERVER_URL, HOME_DIR, PRODUCT } from "./product.ts";

/** The build's tool prefix: `verstak_`. */
export const BUILD_TOOL_PREFIX = `${PRODUCT}_`;
/** The file's name in the bridge home. */
export const CONFIG_FILE = "config.json";
export const configPath = (): string => join(homedir(), HOME_DIR, CONFIG_FILE);

/** A tool prefix MCP names can carry: a lower-case letter first, an underscore last. */
const PREFIX_RE = /^[a-z][a-z0-9-]{0,30}_$/;
const KEYS = new Set(["server", "tool_prefix"]);

export interface BridgeConfig {
  server?: string;
  tool_prefix?: string;
}

const warn = (path: string, what: string): void => {
  process.stderr.write(`${BRIDGE_NAME}: ${path}: ${what}\n`);
};

/** Parses the file's text; every refusal goes to `say`, and what is left valid is kept. */
export function parseConfig(text: string, say: (what: string) => void): BridgeConfig {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch (e) {
    say(`not JSON (${(e as Error).message}) — build defaults are used`);
    return {};
  }
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    say("not a JSON object — build defaults are used");
    return {};
  }
  const o = raw as Record<string, unknown>;
  const out: BridgeConfig = {};
  for (const k of Object.keys(o)) if (!KEYS.has(k)) say(`unknown key "${k}" ignored`);
  if (o.server !== undefined) {
    let url: URL | null = null;
    try {
      url = typeof o.server === "string" ? new URL(o.server) : null;
    } catch {
      /* said below */
    }
    if (url && (url.protocol === "https:" || url.protocol === "http:")) out.server = url.href;
    else say(`"server" is not an http(s) URL — the build address ${BUILD_SERVER_URL} is used`);
  }
  if (o.tool_prefix !== undefined) {
    if (typeof o.tool_prefix === "string" && PREFIX_RE.test(o.tool_prefix))
      out.tool_prefix = o.tool_prefix;
    else
      say(
        `"tool_prefix" must match ${PREFIX_RE} (e.g. "${BUILD_TOOL_PREFIX}") — the build prefix ${BUILD_TOOL_PREFIX} is used`,
      );
  }
  return out;
}

function readConfig(): BridgeConfig {
  const path = configPath();
  let text: string;
  try {
    text = readFileSync(path, "utf8");
  } catch {
    return {};
  }
  return parseConfig(text, (what) => warn(path, what));
}

const CONFIG = readConfig();

/** The address with no argument, variable or chosen `server` file: the file's, else the build's. */
export const DEFAULT_SERVER_URL = CONFIG.server ?? BUILD_SERVER_URL;
/** Tool prefix of the delivery's server: the file's, else the build's. */
export const TOOL_PREFIX = CONFIG.tool_prefix ?? BUILD_TOOL_PREFIX;
