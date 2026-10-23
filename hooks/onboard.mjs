// js/cli/onboard-hook.ts
import { readFileSync as readFileSync4 } from "node:fs";

// js/delivery/config.ts
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

// js/delivery/lang.ts
var LANGS = ["en"];
var DEFAULT_LANG = "en";
function langOfServer(_url) {
  return "en";
}

// js/delivery/product.ts
var PRODUCT = "verstak";
var UPPER = PRODUCT.toUpperCase();
var ENV_PREFIX = `${UPPER}_`;
var envName = (suffix) => `${ENV_PREFIX}${suffix}`;
var BRIDGE_NAME = `${PRODUCT}-bridge`;
var HOME_DIR = `.${BRIDGE_NAME}`;
var HOME_BRIDGE_FILE = `${BRIDGE_NAME}.mjs`;
var GLOBAL_PREFIX = `__${PRODUCT}`;
var BRIDGE_FILE = `${BRIDGE_NAME}.mjs`;
var PLUGIN_COPY_FILE = `${PRODUCT}.js`;
var SUB_ENTRY_PREFIX = `${PRODUCT}-sub`;
var CLIENTS = {
  opencode: `opencode-${PRODUCT}`,
  pi: `pi-${PRODUCT}`,
  doctor: `${PRODUCT}-doctor`,
  watchdog: `${PRODUCT}-watchdog`
};
var SERVER_URLS = {
  en: "https://mcp.verstak.ai/"
};
var BUILD_SERVER_URL = SERVER_URLS[DEFAULT_LANG];

// js/delivery/config.ts
var BUILD_TOOL_PREFIX = `${PRODUCT}_`;
var CONFIG_FILE = "config.json";
var configPath = () => join(process.env[envName("BRIDGE_AUTH_DIR")]?.trim() || join(homedir(), HOME_DIR), CONFIG_FILE);
var PREFIX_RE = /^[a-z][a-z0-9-]{0,30}_$/;
var KEYS = /* @__PURE__ */ new Set(["server", "tool_prefix"]);
var warn = (path, what) => {
  process.stderr.write(`${BRIDGE_NAME}: ${path}: ${what}
`);
};
function parseConfig(text2, say) {
  let raw;
  try {
    raw = JSON.parse(text2);
  } catch (e) {
    say(`not JSON (${e.message}) — build defaults are used`);
    return {};
  }
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    say("not a JSON object — build defaults are used");
    return {};
  }
  const o = raw;
  const out = {};
  for (const k of Object.keys(o)) if (!KEYS.has(k)) say(`unknown key "${k}" ignored`);
  if (o.server !== void 0) {
    let url = null;
    try {
      url = typeof o.server === "string" ? new URL(o.server) : null;
    } catch {
    }
    if (url && (url.protocol === "https:" || url.protocol === "http:")) out.server = url.href;
    else say(`"server" is not an http(s) URL — the build address ${BUILD_SERVER_URL} is used`);
  }
  if (o.tool_prefix !== void 0) {
    if (typeof o.tool_prefix === "string" && PREFIX_RE.test(o.tool_prefix))
      out.tool_prefix = o.tool_prefix;
    else
      say(
        `"tool_prefix" must match ${PREFIX_RE} (e.g. "${BUILD_TOOL_PREFIX}") — the build prefix ${BUILD_TOOL_PREFIX} is used`
      );
  }
  return out;
}
function readConfig() {
  const path = configPath();
  let text2;
  try {
    text2 = readFileSync(path, "utf8");
  } catch {
    return {};
  }
  return parseConfig(text2, (what) => warn(path, what));
}
var CONFIG = readConfig();
var CONFIG_SERVER = CONFIG.server ?? null;
var DEFAULT_SERVER_URL = CONFIG.server ?? BUILD_SERVER_URL;
var TOOL_PREFIX = CONFIG.tool_prefix ?? BUILD_TOOL_PREFIX;

// js/delivery/patterns/cover.ts
var COVER = {
  /** The cover file in the session's directory. */
  file: "AGENTS.md",
  /** The cover's forms by the repository's language: the one whose keys stand in the front matter is read. */
  forms: {
    en: {
      /** The graph slot: the value starts with a full graph address (the owner's handle/slug) or rN. */
      graph: "Graph",
      /**
       * The words that list equal working graphs in the graph slot ("@a/x or @b/y" is ambiguous); a
       * graph after prose (a pointer to the methodology, "not used") is not a working one.
       */
      graphJoins: ["or", "and", "Or", "And", "OR", "AND"],
      /** The agent-role slot: the value starts with exactly one reference '#N "name"'. */
      role: "Agent role",
      /** The quotes around the name in the role reference: opening and closing (here the same character). */
      roleQuotes: ['"', '"'],
      /**
       * Align's stamp in the cover file: "(verstak align: contract N, stamped …"; before the
       * contract counter it read "(verstakify: contract DATE".
       */
      stamp: /\((?:verstak align:\s*contract\s*`?\d+`?\s*,\s*stamped|verstakify:\s*contract\b)/
    }
  },
  /**
   * Another delivery's alignment stamp: a line starting "(<who>: contract N" — or the Russian
   * word for contract, escaped below, for no Cyrillic stands in this repository — where who is
   * not verstak's own ("verstak align:", the older "verstakify:"). Such a stamp without our
   * own is another delivery's cover, even under the shared English keys; the same bracket inside
   * a prose line is no stamp.
   */
  stampShape: /^[\s*_]*\((?!verstak align:|verstakify:)[^()\n]*?:\s*(?:contract|\u043a\u043e\u043d\u0442\u0440\u0430\u043a\u0442)\s*`?\d+/m
};

// js/delivery/patterns/launch.ts
var LAUNCH_WORD = "verstak";
var word = LAUNCH_WORD.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
var LAUNCH_LINE = new RegExp(
  `^[ \\t]*${word}\\s+(\\S+)\\s+(\\S+)\\s+(?:case\\s+)?[№#]\\s?(\\d+)(?:[ \\t]+from[ \\t]+(@\\S+))?(?=\\s|$)`,
  "mu"
);

// js/delivery/patterns/reposigns.ts
var REPO_SIGNS = {
  /** The repository's Claude Code settings: the start hook is a hooks.SessionStart entry. */
  settings: ".claude/settings.json",
  /**
   * Align's start-hook mark: the line asks for the door's Start — "Load the verstak skill
   * first (/verstak) and read its Start section", in the full and the initial form alike
   * (skills/verstak/references/align-hooks.md). The product name elsewhere in a command
   * (verstak_orient, another suite) is no mark.
   */
  startMark: /\bverstak skill\b[^.]*\bStart section\b/,
  /** The OpenCode rituals plugin align writes. */
  rituals: ".opencode/plugins/verstak-rituals.js"
};

// js/delivery/protocol.ts
var tool = (name) => `${TOOL_PREFIX}${name}`;
var LOGGERS = { channel: `${PRODUCT}-channel`, bridge: BRIDGE_NAME };
var ID_PREFIX = `${PRODUCT}-`;
var FRAME_MARK = `[${PRODUCT}]`;
var STRUCTURED_CAPABILITY = `${PRODUCT}/structured`;
var HALTS_CAPABILITY = `${PRODUCT}/halts`;

// js/delivery/words/take.ts
var TAKE = {
  en: {
    rule: () => `your own name (the same role, the same account) — by yourself when the holder stays silent 5 minutes to a probe by word (${tool("channel")} send); another's (another role or account) — only on the user's word`
  }
};

// js/delivery/words/onboardstart.ts
var ONBOARD_START = {
  en: {
    start: () => "Verstak: this repository is not yet aligned for the agent — load the verstak skill and run its onboarding method before anything else; it creates nothing without the person's word."
  }
};

// js/delivery/words/resume.ts
var via = tool("stand");

// js/delivery/words/status.ts
var TAKE_PATH_EN = `${tool("stand")} with take=true (${TAKE.en.rule()}) moves the hearing and the status address here ONCE: the address stays with THIS bridge instance, and a watchdog raised after it does not carry it off — by design: the watchdog is a local client of the socket and makes no connect of its own. The former holder gets close 4000 (the evicted one need not take the seat back the same way — it gets a seat beside, name.N); connect does not touch the seat's incoming address and queue, what waited comes in hello (help: ${tool("channel")} action="?", connect); after the move re-arm the watchdog with the command from the answer`;
var TWO_ENTRIES_EN = `If the seat is yours and a bridge of this same session holds it (the session has two verstak entries, the plugin's and the user's), call status with the same tool set you called ${tool("stand")} with: no move is needed.`;
var TURNED_EN = `${TWO_ENTRIES_EN} Otherwise ${TAKE_PATH_EN}.`;

// js/shared/lang.ts
import { readFileSync as readFileSync2 } from "node:fs";
import { join as join3 } from "node:path";

// js/shared/scope.ts
import { AsyncLocalStorage } from "node:async_hooks";
var als = new AsyncLocalStorage();
var PROCESS = {
  id: "process",
  origin: null,
  sessionKey: () => false,
  slots: /* @__PURE__ */ new Map(),
  log: null
};
var currentScope = () => als.getStore() ?? PROCESS;
function scoped(init) {
  const key = {};
  const own = () => {
    const slots = currentScope().slots;
    let v = slots.get(key);
    if (v === void 0) {
      v = init();
      slots.set(key, v);
    }
    return v;
  };
  return new Proxy({}, {
    get: (_, k) => {
      const t = own();
      const v = Reflect.get(t, k, t);
      return typeof v === "function" ? v.bind(t) : v;
    },
    set: (_, k, v) => Reflect.set(own(), k, v),
    has: (_, k) => Reflect.has(own(), k),
    deleteProperty: (_, k) => Reflect.deleteProperty(own(), k),
    ownKeys: () => Reflect.ownKeys(own()),
    getOwnPropertyDescriptor: (_, k) => {
      const d = Reflect.getOwnPropertyDescriptor(own(), k);
      if (d) d.configurable = true;
      return d;
    }
  });
}
function envOf(k) {
  const s = currentScope();
  if (s.origin && s.sessionKey(k)) return s.origin.env[k];
  return process.env[k];
}

// js/shared/standings.ts
import { homedir as homedir2 } from "node:os";
import { join as join2, resolve } from "node:path";
var defaultAuthDir = () => join2(homedir2(), HOME_DIR);
var authDirFromEnv = () => envOf(envName("BRIDGE_AUTH_DIR"))?.trim() || defaultAuthDir();

// js/shared/lang.ts
var isLang = (v) => LANGS.includes(v ?? "");
function forcedLang() {
  const v = envOf(envName("BRIDGE_LANG"))?.trim().toLowerCase();
  return isLang(v) ? v : null;
}
function resolve2() {
  const forced = forcedLang();
  if (forced) return forced;
  const fromEnv = envOf(envName("BRIDGE_URL"))?.trim();
  if (fromEnv) return langOfServer(fromEnv);
  try {
    const text2 = readFileSync2(join3(authDirFromEnv(), "server"), "utf8").trim();
    if (text2) return langOfServer(text2);
  } catch {
  }
  return DEFAULT_LANG;
}
var S = scoped(() => ({ current: null }));
var lang = () => S.current ??= resolve2();
var words = (dict) => dict[lang()];

// js/shared/reposigns.ts
import { readFileSync as readFileSync3, statSync } from "node:fs";
import { dirname, join as join4, resolve as resolve3 } from "node:path";

// js/shared/graphslot.ts
var SLUG = String.raw`@[\w.-]+\/[\w.-]*\w`;
var ADDRESS = String.raw`(?:${SLUG}(?=[.-]*(?:$|[\s)\x60'",;.:]))|r\d+(?=$|[\s)\x60'",;.:]))`;
var FRAME = String.raw`[\s\x60'"]*`;
var HEAD = new RegExp(String.raw`^(${ADDRESS})(?:${FRAME}\(${FRAME}(${ADDRESS})${FRAME}\))?`);
var ANY = new RegExp(String.raw`${SLUG}|(?<![\w/])r\d+(?!\w)`, "gu");
var PROSE = new RegExp("^[—–\\-:.(]*\\s*(?!r\\d)\\p{L}", "u");

// js/shared/cover.ts
var unquote = (v) => {
  const t = v.trim();
  if (t.length >= 2 && t.startsWith("'") && t.endsWith("'"))
    return t.slice(1, -1).replace(/''/g, "'");
  if (t.length >= 2 && t.startsWith('"') && t.endsWith('"')) {
    try {
      return String(JSON.parse(t));
    } catch {
      return t.slice(1, -1);
    }
  }
  return t;
};
function frontMatter(text2) {
  const lines = text2.replace(/^\uFEFF/, "").split(/\r?\n/);
  if (lines[0]?.trim() !== "---") return null;
  const end = lines.findIndex((l, i) => i > 0 && l.trim() === "---");
  if (end < 0) return null;
  const raw = /* @__PURE__ */ new Map();
  let last = null;
  for (const line of lines.slice(1, end)) {
    const kv = /^\s*('(?:[^']|'')*'|"(?:[^"\\]|\\.)*"|[^\s'"#][^:]*?)\s*:(?:\s+(.*))?$/.exec(line);
    if (kv) raw.set(last = unquote(kv[1]), kv[2] ?? "");
    else if (last !== null && /^\s+[^\s#]/.test(line))
      raw.set(last, `${raw.get(last)}
${line.trim()}`);
  }
  return new Map([...raw].map(([k, v]) => [k, unquote(v)]));
}
var formsIn = (pairs, cover) => Object.entries(cover.forms).filter(([, f]) => pairs.has(f.graph) || pairs.has(f.role));
function stampOf(text2, cover = COVER) {
  if (Object.values(cover.forms).some((f) => f.stamp.test(text2))) return "own";
  return cover.stampShape.test(text2) ? "foreign" : null;
}
var hasForm = (pairs, cover = COVER) => formsIn(pairs, cover).length > 0;

// js/shared/reposigns.ts
var exists = (path) => {
  try {
    statSync(path);
    return true;
  } catch {
    return false;
  }
};
var text = (path) => {
  try {
    return readFileSync3(path, "utf8");
  } catch {
    return null;
  }
};
function repoRoot(dir) {
  let at = resolve3(dir);
  for (; ; ) {
    if (exists(join4(at, ".git"))) return at;
    const up = dirname(at);
    if (up === at) return null;
    at = up;
  }
}
function startHook(settings, mark) {
  if (settings === null) return false;
  try {
    const entries = JSON.parse(settings)?.hooks?.SessionStart;
    if (!Array.isArray(entries)) return false;
    return entries.some(
      (e) => Array.isArray(e?.hooks) && e.hooks.some((h) => {
        const command = h?.command;
        return typeof command === "string" && mark.test(command);
      })
    );
  } catch {
    return false;
  }
}
function repoSigns(dir, harness, keys = REPO_SIGNS, cover = COVER) {
  const root = repoRoot(dir);
  const hooks = { "claude-code": false, opencode: false };
  if (root === null) return { root, cover: false, stamp: false, hooks, verdict: "outside" };
  const agents = text(join4(root, cover.file));
  const pairs = agents === null ? null : frontMatter(agents);
  const stamped = agents === null ? null : stampOf(agents, cover);
  const signs = {
    cover: !!pairs && stamped !== "foreign" && hasForm(pairs, cover),
    stamp: stamped === "own",
    hooks: {
      "claude-code": startHook(text(join4(root, keys.settings)), keys.startMark),
      opencode: exists(join4(root, keys.rituals))
    }
  };
  const hooked = signs.hooks["claude-code"] || signs.hooks.opencode;
  const any = signs.cover || signs.stamp || hooked;
  const complete = signs.cover && signs.stamp && (harness === null || signs.hooks[harness]);
  const verdict = stamped === "foreign" && !hooked ? "foreign" : !any ? "invite" : complete ? "aligned" : "partial";
  return { root, ...signs, verdict };
}

// js/cli/onboard-hook.ts
function sessionDir() {
  try {
    if (!process.stdin.isTTY) {
      const cwd = JSON.parse(readFileSync4(0, "utf8"))?.cwd;
      if (typeof cwd === "string" && cwd) return cwd;
    }
  } catch {
  }
  return process.env.CLAUDE_PROJECT_DIR || process.cwd();
}
try {
  if (repoSigns(sessionDir(), "claude-code").verdict === "invite")
    process.stdout.write(`${words(ONBOARD_START).start()}
`);
} catch {
}
process.exitCode = 0;
