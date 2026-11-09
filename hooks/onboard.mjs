// js/cli/onboard-hook.ts
import { readFileSync as readFileSync5 } from "node:fs";

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
  /** The delivery's root key of the cover in the front matter. */
  root: "verstak",
  /** The older flat forms by the repository's language (in passing): the one whose keys stand in the front matter is read. */
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
       * contract counter it read "(verstakify: contract DATE". Capture 1 is the contract number.
       */
      stamp: /\((?:verstak align:\s*contract\s*`?(\d+)`?\s*,\s*stamped|verstakify:\s*contract\b)/,
      /**
       * The older stamp lines' contract number, capture 1: "(verstak align: contract N" and
       * "(verstakify: contract N" at a line's start; a date there is no contract number.
       */
      contractStamp: /^[\s*_]*\((?:verstak align|verstakify):\s*contract\s*`?(\d+)`?(?=\s*[,\u2014)])/m
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

// js/delivery/spawned-for.ts
var SPAWNED_FOR_ENV = envName("SPAWNED_FOR");

// js/delivery/words/take.ts
var TAKE = {
  en: {
    rule: () => "only on the user's word; a seat on the board is no evidence its holder is alive: a dead agent's seat closes in about a minute if held via a machine bridge with a daemon, otherwise by the platform's term"
  }
};

// js/delivery/words/compaction.ts
var role = (karta, none) => {
  const seq = karta.replace(/^#/, "");
  return seq && seq !== "undefined" ? `#${seq}` : none;
};
var COMPACTION = {
  en: {
    keep: (karta, name, realm) => `Verstak: this summary keeps role ${role(karta, "<role>")} in ${realm}, seat ${name}, the live cases (number, what each waits for), the user's standing words on how agents work verbatim, and the instruction to reload the verstak skill and the role's methods first.`,
    back: (karta, name, realm) => `Verstak: context compacted. Role ${role(karta, "<role>")} in ${realm}, seat ${name} (the bridge holds it). First load the verstak skill, the methods its door names for the role (only those) and writing. The user's personal slice comes back with the seat's answer (the door's Start) before your next word to them; a standing word of theirs on how agents work that only the summary holds goes to their mind from where they said it, else confirmed where they alone read — never from the summary alone (minding, Write). The summary points, it isn't the record: re-read in the graph what you lean on (entry, Recalling).`,
    bare: () => `Verstak: context compacted. First load the verstak skill, the methods its door names for the role (only those) and writing. With no seat, read the user's personal slice yourself (the door's Start) before your next word to them; a standing word of theirs on how agents work that only the summary holds goes to their mind from where they said it, else confirmed where they alone read — never from the summary alone (minding, Write). The summary points, it isn't the record: re-read in the graph what you lean on (entry, Recalling).`,
    restand: (karta, name, realm) => ` As the first move call ${tool("stand")}(realm="${realm}", karta="${role(karta, "<role>")}", name="${name}") without take: the seat stays, and its answer carries the human's rules.`,
    returned: (sessionID) => `Verstak: the role word after the compaction went into the first request of session ${sessionID}`
  }
};

// js/delivery/words/mindslice.ts
var LOOK = `${tool("look")}(realm="mind", node_id="#N")`;

// js/delivery/words/onboardstart.ts
var ONBOARD_START = {
  en: {
    start: () => ""
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
var standingsDirOf = (authDir) => join2(authDir, "standings");
var HOLD_RECORD_MAX_AGE_MS = 6 * 60 * 60 * 1e3;

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

// js/shared/coverblock.ts
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
var KEY = String.raw`('(?:[^']|'')*'|"(?:[^"\\]|\\.)*"|[^\s'"#][^:]*?)`;
var PAIR = new RegExp(String.raw`^\s*${KEY}\s*:(?:\s+(.*))?$`);
var TOP = new RegExp(String.raw`^${KEY}\s*:(?:\s+#.*)?\s*$`);
var CHILD = new RegExp(String.raw`^\s+${KEY}\s*:(?:\s+(.*))?$`);
var bare = (v) => unquote(
  /^['"]/.test(v.trim()) ? v.trim().replace(/^('(?:[^']|'')*'|"(?:[^"\\]|\\.)*")\s+#.*$/, "$1") : v.replace(/\s+#.*$/, "")
);
function fences(text2) {
  const lines = text2.replace(/^\uFEFF/, "").split(/\r?\n/);
  if (lines[0]?.trim() !== "---") return null;
  const end = lines.findIndex((l, i) => i > 0 && l.trim() === "---");
  return end < 0 ? null : { lines, end };
}
function frontMatter(text2) {
  const f = fences(text2);
  if (!f) return null;
  const raw = /* @__PURE__ */ new Map();
  let last = null;
  for (const line2 of f.lines.slice(1, f.end)) {
    const kv = PAIR.exec(line2);
    if (kv) raw.set(last = unquote(kv[1]), kv[2] ?? "");
    else if (last !== null && /^\s+[^\s#]/.test(line2))
      raw.set(last, `${raw.get(last)}
${line2.trim()}`);
  }
  return new Map([...raw].map(([k, v]) => [k, unquote(v)]));
}
function coverBlocks(text2) {
  const blocks = /* @__PURE__ */ new Map();
  const f = fences(text2);
  let open = null;
  for (const line2 of f ? f.lines.slice(1, f.end) : []) {
    if (/^\s*(#|$)/.test(line2)) continue;
    const top = TOP.exec(line2);
    const child = open && CHILD.exec(line2);
    if (top) blocks.set(unquote(top[1]), open = /* @__PURE__ */ new Map());
    else if (open && child) open.set(unquote(child[1]), bare(child[2] ?? ""));
    else open = null;
  }
  return blocks;
}
var coverBlock = (text2, root) => coverBlocks(text2).get(root) ?? null;
var stamped = (block) => /^\d+$/.test(block.get("contract") ?? "") && !!block.get("stamp");
var foreignBlock = (text2, root) => [...coverBlocks(text2)].some(([k, b]) => k !== root && b.has("contract"));

// js/shared/graphslot.ts
var SLUG = String.raw`@[\w.-]+\/[\w.-]*\w`;
var ADDRESS = String.raw`(?:${SLUG}(?=[.-]*(?:$|[\s)\x60'",;.:]))|r\d+(?=$|[\s)\x60'",;.:]))`;
var FRAME = String.raw`[\s\x60'"]*`;
var HEAD = new RegExp(String.raw`^(${ADDRESS})(?:${FRAME}\(${FRAME}(${ADDRESS})${FRAME}\))?`);
var ANY = new RegExp(String.raw`${SLUG}|(?<![\w/])r\d+(?!\w)`, "gu");
var PROSE = new RegExp("^[—–\\-:.(]*\\s*(?!r\\d)\\p{L}", "u");

// js/shared/cover.ts
var formsIn = (pairs, cover) => Object.entries(cover.forms).filter(([, f]) => pairs.has(f.graph) || pairs.has(f.role));
function stampOf(text2, cover = COVER) {
  const block = coverBlock(text2, cover.root);
  if (block && stamped(block) || Object.values(cover.forms).some((f) => f.stamp.test(text2)))
    return "own";
  if (block) return null;
  return foreignBlock(text2, cover.root) || cover.stampShape.test(text2) ? "foreign" : null;
}
function hasCover(text2, cover = COVER) {
  if (coverBlock(text2, cover.root)) return true;
  const pairs = frontMatter(text2);
  return !!pairs && formsIn(pairs, cover).length > 0;
}

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
function repoRoot(dir2) {
  let at = resolve3(dir2);
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
function repoSigns(dir2, harness, keys = REPO_SIGNS, cover = COVER) {
  const root = repoRoot(dir2);
  const hooks = { "claude-code": false, opencode: false };
  if (root === null) return { root, cover: false, stamp: false, hooks, verdict: "outside" };
  const agents = text(join4(root, cover.file));
  const stamped2 = agents === null ? null : stampOf(agents, cover);
  const signs = {
    cover: agents !== null && stamped2 !== "foreign" && hasCover(agents, cover),
    stamp: stamped2 === "own",
    hooks: {
      "claude-code": startHook(text(join4(root, keys.settings)), keys.startMark),
      opencode: exists(join4(root, keys.rituals))
    }
  };
  const hooked = signs.hooks["claude-code"] || signs.hooks.opencode;
  const any = signs.cover || signs.stamp || hooked;
  const block = agents === null ? null : coverBlock(agents, cover.root);
  const carried = !!block?.get("graph") && !!block.get("holon") && !!block.get("agent_role");
  const complete = signs.cover && signs.stamp && (harness === null || carried || signs.hooks[harness]);
  const verdict = stamped2 === "foreign" && !hooked ? "foreign" : !any ? "invite" : complete ? "aligned" : "partial";
  return { root, ...signs, verdict };
}

// js/shared/seatbydir.ts
import { readdirSync, readFileSync as readFileSync4 } from "node:fs";
import { join as join5 } from "node:path";

// js/shared/canon.ts
import { realpathSync } from "node:fs";
import { sep } from "node:path";
function canonDir(p) {
  let real = p;
  try {
    real = realpathSync.native(p);
  } catch {
  }
  while (real.length > 1 && (real.endsWith("/") || real.endsWith(sep))) real = real.slice(0, -1);
  return real;
}
var sameDir = (a, b) => !!a && !!b && (a === b || canonDir(a) === canonDir(b));

// js/shared/seatbydir.ts
function seatByDir(authDir, cwd, client, now = Date.now()) {
  const seats = /* @__PURE__ */ new Map();
  let files;
  try {
    files = readdirSync(standingsDirOf(authDir)).filter((f) => f.endsWith(".hold"));
  } catch {
    return null;
  }
  for (const f of files) {
    try {
      const r = JSON.parse(readFileSync4(join5(standingsDirOf(authDir), f), "utf8"));
      if (r?.client !== client || r.left === true || !sameDir(r.cwd, cwd)) continue;
      if (typeof r.at !== "number" || now - r.at > HOLD_RECORD_MAX_AGE_MS) continue;
      if (typeof r.realm !== "string" || !r.realm || r.karta == null) continue;
      if (typeof r.name !== "string" || !r.name) continue;
      const seat = { realm: r.realm, karta: String(r.karta), name: r.name };
      seats.set(`${seat.realm}\0${seat.karta}\0${seat.name}`, seat);
    } catch {
    }
  }
  return seats.size === 1 ? [...seats.values()][0] : null;
}

// js/cli/onboard-hook.ts
function hookInput() {
  try {
    if (!process.stdin.isTTY) return JSON.parse(readFileSync5(0, "utf8")) ?? {};
  } catch {
  }
  return {};
}
var input = hookInput();
var dir = typeof input.cwd === "string" && input.cwd ? input.cwd : process.env.CLAUDE_PROJECT_DIR || process.cwd();
function line() {
  if (input.source === "compact") {
    const W = words(COMPACTION);
    const seat = seatByDir(authDirFromEnv(), dir, "claude-code");
    if (seat)
      return W.back(seat.karta, seat.name, seat.realm) + W.restand(seat.karta, seat.name, seat.realm);
    const { verdict } = repoSigns(dir, "claude-code");
    return verdict === "aligned" || verdict === "partial" ? W.bare() : null;
  }
  return repoSigns(dir, "claude-code").verdict === "invite" ? words(ONBOARD_START).start() : null;
}
try {
  const text2 = line();
  if (text2) process.stdout.write(`${text2}
`);
} catch {
}
process.exitCode = 0;
