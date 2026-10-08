// The product name and everything derived from it: two deliveries on one machine do
// not collide while every name here comes from its own PRODUCT — home and grant,
// environment variables, sockets and pipes, files, clients.

/** The product name, lower case, as in the home, file and client names. */
export const PRODUCT = "verstak";
/** The product name in variable names. */
const UPPER = PRODUCT.toUpperCase();

/** Prefix of the delivery's environment variables; the daemon takes a session's env by it. */
export const ENV_PREFIX = `${UPPER}_`;
/** A delivery environment variable: `envName("BRIDGE_URL")` is `VERSTAK_BRIDGE_URL`. */
export const envName = (suffix: string): string => `${ENV_PREFIX}${suffix}`;

/** The bridge's name: MCP client, user-agent, home directory. */
export const BRIDGE_NAME = `${PRODUCT}-bridge`;
/** Home directory under the user's home: grant, sockets, the bridge's home copy. */
export const HOME_DIR = `.${BRIDGE_NAME}`;
/** The home copy's file name — a contract with harness configs. */
export const HOME_BRIDGE_FILE = `${BRIDGE_NAME}.mjs`;
/** Short private socket directory in /tmp and Windows pipes: `<prefix>-…`. */
export const RUNTIME_PREFIX = PRODUCT;
/** Key of the process registries on globalThis (two plugins in one OpenCode process). */
export const GLOBAL_PREFIX = `__${PRODUCT}`;

/**
 * The skill carrying the bridge and the bridge file in its `scripts/`: the set root is
 * recognised by them. The multi-skill layout ships the bridge in `establish-mcp`; the
 * one-skill layout moves it to `verstak`.
 */
export const BRIDGE_SKILL = "establish-mcp";
export const BRIDGE_FILE = `${BRIDGE_NAME}.mjs`;
/** The OpenCode plugin in the delivery (beside the bridge) and its copy's name in OpenCode's `plugins/`. */
export const PLUGIN_FILE = "opencode-plugin.js";
export const PLUGIN_COPY_FILE = `${PRODUCT}.js`;
/**
 * Stamp mask of the set: the file in each skill directory of the root whose hash measures
 * the set.
 * TODO(sibling): the core hashes one file per skill (bridge/skillset.ts treeStamp), so
 * edits under references/ (and, in the one-skill layout, methods/) leave the stamp as is.
 * A mask covering the whole skill directory waits on the core taking a tree hash.
 */
export const SKILL_STAMP_FILE = "SKILL.md";
/** The delivery's skill set: the `npx skills` source, the releases repository. */
export const SKILL_SET = "verstak-ai/skills";

/** Claude Code and Codex plugin: `<name>@<marketplace>`; the MCP entry key is the product name too. */
export const PLUGIN_NAME = PRODUCT;
/** A subagent's satellite bridge entry: `<prefix>-<role>`. */
export const SUB_ENTRY_PREFIX = `${PRODUCT}-sub`;
/**
 * An MCP entry leading to this delivery, by name or command (doctor). The old http entry
 * pointed at the lab instance; a bare `nks` is not taken, so a neighbouring delivery's
 * doctor and ours never both claim the same entry.
 */
export const CONNECTOR_PATTERN = /verstak|nks\.lab\.mirari/i;

/** MCP client names the delivery's parts introduce themselves by. */
export const CLIENTS = {
  opencode: `opencode-${PRODUCT}`,
  pi: `pi-${PRODUCT}`,
  doctor: `${PRODUCT}-doctor`,
  watchdog: `${PRODUCT}-watchdog`,
} as const;

/**
 * Server addresses. One production address; the core names it as its English one.
 * The endpoint is the root path.
 */
export const SERVER_URLS = {
  en: "https://mcp.verstak.ai/",
} as const;
export const DEFAULT_SERVER_URL = SERVER_URLS.en;

/**
 * The `node -e` code of the one satellite-bridge entry form: home path from homedir,
 * the path into argv[1], import of the bridge. The copies in role files and the
 * delegation reference are held equal to this one.
 */
export const SATELLITE_CODE =
  "const p=require('path').join(require('os').homedir(),'.verstak-bridge','verstak-bridge.mjs');process.argv.splice(1,0,p);import(require('url').pathToFileURL(p).href)";
/** The hooks section heading in the delivery's bootstrap skill, as the skill spells it. */
export const HOOKS_SECTION = "Step 4 — Hooks";
