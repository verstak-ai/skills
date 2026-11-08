// js/cli/rituals-hook.ts
import { readFileSync as readFileSync8 } from "node:fs";

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

// js/delivery/patterns/sections.ts
var SECTIONS = {
  /** The stage self-check — the push word. */
  check: (h) => /self-check|self-review/i.test(h),
  /** The session lifecycle — the merge word, beside the merge section. */
  lifecycle: (h) => /lifecycle/i.test(h),
  /** The after-merge acts — the merge word. */
  merge: (h) => /merge/i.test(h) && /graph/i.test(h) || /every merge/i.test(h),
  /** A push to the trunk — the merge word on a push to main or master, before the merge heading. */
  trunk: (h) => /push/i.test(h) && /main|master|trunk/i.test(h),
  /** The persistence rules — the memory guard's refusal. */
  persist: (h) => /persistence/i.test(h)
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
    rule: () => "only on the user's word; a seat on the board is no evidence its holder is alive: a dead agent's seat closes in about a minute if held via a machine bridge with a daemon, otherwise by the platform's term"
  }
};

// js/delivery/words/frame-text.ts
var FRAME_TEXT = {
  en: {
    myCases: () => `${tool("case")}(action="mine"), then read each`,
    frame: (id) => `frame ${id}`,
    yoursBelow: () => ` — yours in the lines below; `,
    noneYours: () => ` — none of them yours; `,
    count: (head2, n, mine) => `${head2}: ${n} records, yours ${mine}`,
    supersededLines: (gone) => `, ${gone} superseded lines of a key`,
    askAnswered: (n, by) => `; your question [${n}] is closed: answered by ${by}`,
    askMoved: (n, to) => `; your question [${n}] is re-asked of ${to}`,
    inFull: (cases) => `in full — ${cases || FRAME_TEXT.en.myCases()}`,
    caseHistory: (args, since) => `${tool("case")}(${args}, since=${since})`,
    lifeCheckReply: () => `Answer with an action: update your status — ${tool("stand")}(realm, status=<what you are doing>) — or say a word in the case.`,
    lifeCheckSeat: (name) => `Seat warned: ${name || "the platform did not name the seat"}.`,
    humanWordReply: (realm, karta, standing, id) => `reply: ${tool("channel")}(action="send", realm=${realm}, karta=${karta}, standing=${standing}, in_reply_to=${id}, text=…)`,
    noReplyAddress: (m) => `no address to reply: missing ${[
      m.realm && "the graph",
      m.karta && "the person's role",
      m.standing && "the person's seat",
      m.id && "the word's id"
    ].filter(Boolean).join(", ")}`
  }
};

// js/delivery/words/mindslice.ts
var LOOK = `${tool("look")}(realm="mind", node_id="#N")`;

// js/delivery/words/prepare.ts
var RITE = (what) => `the repository's own ${what} in .claude/settings.json — the delivery carries the rituals and keeps silent beside its own: take it off, and in a script with branches of other kinds only this one's branch (align, Step 4, the transition)`;
var PREPARE = {
  en: {
    usage: () => "usage: prepare [--dir <repo>] [--graph rN] [--holon N] [--agent-role N] [--contract N] [--stamp YYYY-MM-DD] [--case N] [--json]\n",
    badArg: (flag, value) => `${flag}: "${value}" is not the right form; see prepare --help`,
    notRepo: (dir) => `${dir} is not a git repository: nothing to prepare, nothing written`,
    foreign: (file) => `${file} carries another delivery's cover: switching deliveries is the person's call, nothing written`,
    unparsed: (file) => `${file} does not parse: nothing written`,
    reality: (caseNo) => `# Reality — what a claim is checked against

Carriers not yet established${caseNo ? `; alignment case #${caseNo}` : ""}. Until they are, behavioural claims are not accepted.
`,
    start: ({ graph, holon, role }) => `Load the verstak skill (/verstak) and run its Start section before anything else. Cover: graph ${graph}${holon ? `, holon #${holon}` : ""}${role ? `, role #${role}` : ""}.`,
    guard: (graph, section = "Persistence") => `BLOCKED: local agent memory is forbidden entirely, not by category (AGENTS.md${section ? `, ${section}` : ""}). Route the fact: repo conventions / code facts → AGENTS.md; project state, this repo's servers and dated duties → the project graph ${graph}; a user-scoped fact no project owns → personal mind through the minding method of the verstak skill. This dir stays frozen: nothing is written here.`,
    left: (item, keys) => ({
      "cover.repeat": `the key ${keys} stands twice in the front matter of AGENTS.md; strict YAML refuses it and AGENTS.md is untouched: keep one value and run prepare again`,
      "cover.rituals": `the delivery knows no ritual ${keys} in the cover's rituals: field, so it switches nothing on; its rituals: start push merge guard turn. Fix the name or drop it`,
      "cover.graph": 'no graph named: --graph rN (verstak_realm(action="list"); align, Round 1, step 1)',
      "cover.holon": "no holon named: --holon N, the repository's holon found by its repository attr or created (align, Round 1, step 2)",
      "cover.agent_role": "no agent role named: --agent-role N, the holon's steward (verstak_search with steward_of) or created (align, Round 1, step 3)",
      "cover.contract": "no contract named: --contract N in the run's last call (align, Step 7)",
      "cover.flat": "an older flat cover stands beside the block: move its judgment slots into Project and drop the flat keys (align, From contract 9)",
      "CLAUDE.md": "CLAUDE.md is a file of its own, not a pointer: merge its content into AGENTS.md and replace it with the pointer (align, Step 7)",
      "hook.start": RITE("start hook"),
      "hook.guard": "the memory guard waits for a graph in the cover: run prepare again with --graph",
      "hook.push": RITE("push hook"),
      "hook.merge": RITE("merge hook"),
      "opencode.rituals": `the repository's own rituals plugin in .opencode/plugins — the delivery carries the rituals and keeps silent beside it: take it off, and if it carries branches of other kinds (a merge gate and the like) take off only start, push, merge and the memory guard and keep the rest in a file whose name lacks "ritual" (align, Step 4, the transition)`
    })[item],
    unread: (item, hook) => item === "hook.guard" ? `"${hook}" stands, and prepare could not tell whether it is the memory guard — none of its own was put beside it: read the script; if it is, do nothing; if not, add it by align's Step 4 (references/align-hooks.md)` : `"${hook}" stands, and prepare could not tell whether it is the start hook: read the script; if it is, take it off (the delivery carries the start and keeps silent beside its own); if not, do nothing`,
    head: (kind) => ({ done: "done", kept: "already there", left: "for the model" })[kind]
  }
};

// js/delivery/words/resume.ts
var via = tool("stand");

// js/delivery/words/rites.ts
var RITES = {
  en: {
    lifecycle: () => "Persistence",
    push: () => `${FRAME_MARK} Pushed, nothing shipped yet: self-review the diff, the vocabulary pass over the PR text; pick the review tier for the batch (verstak, methods/code-work.md, Cold review).`,
    merge: () => `${FRAME_MARK} Merged: the after-merge acts (verstak, methods/code-work.md, After merge) — weave, the map, modes on evidence not on merge, end by axis, reconcile, feedback, vocabulary; work tasked by another agent: the seed and delivery modes only.`,
    early: (graph) => `Load the verstak skill (/verstak) and run its Start section before anything else. Onboarding unfinished: graph ${graph}, no holon or roles yet — continue it from the first missing sign.`
  }
};

// js/delivery/words/rooms.ts
var ROOM = {
  en: {
    said: (author) => `message from ${author}`,
    saidPending: (author) => `message from ${author} in flight — the text follows`,
    aside: (author, addressee, word2) => `${author} → ${addressee}: message [${word2}]`,
    asideRun: (author, addressee, count, word2) => `${author} → ${addressee}: ${count} (last [${word2}])`,
    asideBody: (author, addressee, word2) => `${author} → ${addressee}: text of message [${word2}]`,
    messages: (n) => `${n} ${n === 1 ? "message" : "messages"}`,
    body: (refersTo, author) => `text of message [${refersTo}] from ${author}`,
    bodyAborted: (refersTo) => `message [${refersTo}] cut off by its author`,
    bodyLapsed: (refersTo) => `message [${refersTo}] cut off by the platform on its deadline`,
    closing: (author, endsAt, evidence) => `the lead ${author} proposes to close the case by ${endsAt}${evidence ? `; evidence: ${evidence}` : ""}`,
    closingMay: (entryId) => `you may object — ${tool("case")}(action="object", in_reply_to=${entryId})`,
    closingNot: () => "the objection is not yours to make",
    closed: (reason) => `case closed: ${reason}`,
    objection: (author, reason) => `${author} objects to closing: ${reason}`,
    lateObjection: (author) => `${author} objected after the close`,
    progress: (key, done, verdict, note, author) => `[${key}] [${done}] = ${verdict}${note} · ${author}`,
    opened: (author) => `case opened by ${author}`,
    joined: (who) => `entered ${who}`,
    left: (who, reason) => `left ${who}${reason ? `; reason: ${reason}` : ""}`,
    invite: (author, who) => `${author} invites ${who} to the case`,
    withdraw: (author) => `invitation withdrawn by ${author}`,
    retract: (author, answer, afterAck) => `answer [${answer}] retracted${afterAck ? " after acceptance" : ""} by ${author}`,
    node: (seq, name, realm, reasoning) => `node #${seq} ${name} (${realm}) in the case${reasoning}`,
    nodeUpdated: (seq, name, reasoning) => `node #${seq} ${name} updated${reasoning}`,
    nodeDeleted: (seq, name, reasoning) => `node #${seq} ${name} deleted${reasoning}`,
    nodeUndeleted: (seq, name, reasoning) => `node #${seq} ${name} restored${reasoning}`,
    link: (room, rel) => `case linked to case #${room} (${rel})`,
    auto: (code, room) => `platform record ${code} about case #${room}`,
    unknown: (kind) => `kind ${kind} is unknown to the bridge`,
    case: (room) => `case #${room}`,
    replyTo: (id) => `in reply to [${id}]`,
    stale: () => "stale",
    bodyRead: (how) => `body: ${how}`,
    whoHuman: (user) => `user${user}`,
    whoRole: (karta) => `role #${karta}`,
    whoSibling: (karta) => `sibling of role #${karta}`,
    whoPlatform: () => "platform — a wake-up",
    whoGraph: () => "graph event",
    legacy: (kind, stack) => `kind ${kind}${stack ? ` · ${stack}` : ""}`
  }
};

// js/delivery/words/stalebatch.ts
var STALE = {
  en: {
    head: (count, shown, legacy = false) => `Stale frames: ${count}` + (count > shown ? `, the first ${shown} here, ${count - shown} left out` : "") + (legacy ? ` — taken while the seat was not listening, or the service repeating after a session rebuild; those addressed to the seat as text, the rest by count; in full — by the case lines below, the rest — ${FRAME_TEXT.en.myCases()}.` : ".")
  }
};

// js/delivery/words/status.ts
var TAKE_PATH_EN = `${tool("stand")} with take=true (${TAKE.en.rule()}) moves the hearing and the status address here ONCE: the address stays with THIS bridge instance, and a watchdog raised after it does not carry it off — by design: the watchdog is a local client of the socket and makes no connect of its own. The former holder gets close 4000 (the evicted one need not take the seat back the same way — it gets a seat beside, name.N); connect does not touch the seat's incoming address and queue, what waited comes in hello (help: ${tool("channel")} action="?", connect); after the move re-arm the watchdog with the command from the answer`;
var TWO_ENTRIES_EN = `If the seat is yours and a bridge of this same session holds it (the session has two verstak entries, the plugin's and the user's), call status with the same tool set you called ${tool("stand")} with: no move is needed.`;
var TURNED_EN = `${TWO_ENTRIES_EN} Otherwise ${TAKE_PATH_EN}.`;

// js/delivery/words/turn.ts
var TURN = {
  en: {
    wake: () => `${FRAME_MARK} No human at the console: a question — an ask card in the case; a report — the case or the channel to their seat (${tool("case")} ask/say, ${tool("channel")} send). Nothing to say — the turn ends, no text.`,
    notLaid: (session, why) => `the turn's end word did not enter session ${session}: ${why}`
  }
};

// js/delivery/words/watchdog.ts
var WATCHDOG = {
  en: {
    doer: (text2) => `DOER: ${text2}`,
    listening: (key, tail = "") => `listening on standing ${key}${tail}`,
    listeningCodex: (key, thread) => `listening on standing ${key}; putting frames into thread ${thread}`,
    backfilled: (count) => ` (${count} back-dated)`,
    frames: (n) => `${n} ${n === 1 ? "frame" : "frames"}`,
    noHeld: () => `the bridge holds no standing — name yourself with one call to ${tool("stand")}(realm, karta, model): its answer names the listening command`,
    severalHeld: (held) => `the bridge holds several standings — name the one you need: ${held}`,
    bridgeLetGo: () => "the bridge released the standing or went away — did the session end?",
    seatNotBack: (s, path) => `the seat did not return within ${s}s after the daemon change — socket ${path} is not up; to bring it back use ${tool("stand")}`,
    noSocket: (path, s) => `the bridge did not bring up the local socket ${path} within ${s}s`,
    bridgeReleasedSocket: (text2) => `the bridge released the socket: ${text2}`,
    notWakeup: (type) => `frame ${type ?? "unparsed"} — not a reason to wake`,
    seenEarlier: (id) => `frame ${id} was already delivered by an earlier arming — not a reason to wake`,
    unaddressed: () => "a batch with nothing addressed to the seat — the count waits for the next wake-up",
    seatLost: () => "DOER: the standing is lost",
    aliveNote: () => "DOER: the socket keeps being cut while the service answers — the bridge holds the seat",
    codexLost: () => `Verstak: the standing is lost — name yourself again: ${tool("stand")}`,
    codexAlive: () => "Verstak: the socket keeps being cut while the service answers — the bridge holds the seat",
    noThread: () => "DOER: no CODEX_THREAD_ID — run this watchdog from the Codex session shell: that is where Codex puts the thread id into the environment",
    noDoor: (path) => `DOER: no door (${path}) — this thread is not under an app-server daemon. This is the USER's move before the session starts, not yours: the daemon and the Codex session must start with one short CODEX_HOME (recipe in SETUP, section Codex). Tell them so; until there is a door, listen with watchdog-exit`,
    threadRefused: (why) => `DOER: the thread did not accept the frame — ${why}`,
    refusal: () => "refusal",
    framePut: (thread) => `frame put into thread ${thread}`,
    frameSent: (thread) => `frame sent to thread ${thread}`,
    flushNotPut: (s) => `DOER: the put did not go through within ${s}s after one's own release — the batch was not sent to the thread`,
    frameNotPut: (why) => `DOER: the frame was not put in — ${why}`,
    doorClosed: (why, lost) => `the door closed: ${why} — will reopen on the next frame` + (lost ? `; unanswered: ${lost} — will come back from the ring on the next arming` : ""),
    doorNotOpened: (why) => `the door did not open: ${why}`,
    noIdFromRing: () => "a frame without an id from the ring — nothing to mark it with, not putting it into the thread again",
    alreadyPut: (id) => `frame ${id} was already put in — not putting it into the thread again`
  }
};

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
var wordsIn = (dict, l) => dict[l ?? lang()];

// js/shared/ritualcover.ts
import { readdirSync, readFileSync as readFileSync4 } from "node:fs";
import { join as join5 } from "node:path";

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
function coverBlocks(text2) {
  const blocks2 = /* @__PURE__ */ new Map();
  const f = fences(text2);
  let open = null;
  for (const line of f ? f.lines.slice(1, f.end) : []) {
    if (/^\s*(#|$)/.test(line)) continue;
    const top = TOP.exec(line);
    const child = open && CHILD.exec(line);
    if (top) blocks2.set(unquote(top[1]), open = /* @__PURE__ */ new Map());
    else if (open && child) open.set(unquote(child[1]), bare(child[2] ?? ""));
    else open = null;
  }
  return blocks2;
}
var coverBlock = (text2, root) => coverBlocks(text2).get(root) ?? null;
var stamped = (block) => /^\d+$/.test(block.get("contract") ?? "") && !!block.get("stamp");
var foreignBlock = (text2, root) => [...coverBlocks(text2)].some(([k, b]) => k !== root && b.has("contract"));
var RITUALS2 = ["start", "push", "merge", "guard", "turn"];
function ritualsOf(block) {
  const field = block?.get("rituals");
  if (field === void 0) return { on: new Set(RITUALS2), unknown: [] };
  const names = field.split(/\s+/).filter(Boolean);
  const known = (n) => RITUALS2.includes(n);
  return { on: new Set(names.filter(known)), unknown: names.filter((n) => !known(n)) };
}

// js/shared/graphslot.ts
var SLUG = String.raw`@[\w.-]+\/[\w.-]*\w`;
var ADDRESS = String.raw`(?:${SLUG}(?=[.-]*(?:$|[\s)\x60'",;.:]))|r\d+(?=$|[\s)\x60'",;.:]))`;
var FRAME = String.raw`[\s\x60'"]*`;
var HEAD = new RegExp(String.raw`^(${ADDRESS})(?:${FRAME}\(${FRAME}(${ADDRESS})${FRAME}\))?`);
var ANY = new RegExp(String.raw`${SLUG}|(?<![\w/])r\d+(?!\w)`, "gu");
var PROSE = new RegExp("^[—–\\-:.(]*\\s*(?!r\\d)\\p{L}", "u");

// js/shared/cover.ts
function stampOf(text2, cover = COVER) {
  const block = coverBlock(text2, cover.root);
  if (block && stamped(block) || Object.values(cover.forms).some((f) => f.stamp.test(text2)))
    return "own";
  if (block) return null;
  return foreignBlock(text2, cover.root) || cover.stampShape.test(text2) ? "foreign" : null;
}

// js/shared/reposigns.ts
import { readFileSync as readFileSync3, statSync } from "node:fs";
import { dirname, join as join4, resolve as resolve3 } from "node:path";
var exists = (path) => {
  try {
    statSync(path);
    return true;
  } catch {
    return false;
  }
};
function repoRoot(dir) {
  let at2 = resolve3(dir);
  for (; ; ) {
    if (exists(join4(at2, ".git"))) return at2;
    const up = dirname(at2);
    if (up === at2) return null;
    at2 = up;
  }
}

// js/shared/ritualcover.ts
function headings(text2) {
  const lines = text2.split("\n");
  let i = lines[0]?.trim() === "---" ? lines.findIndex((l, n) => n > 0 && l.trim() === "---") + 1 : 0;
  let fenced = false;
  const out = [];
  for (; i < lines.length; i++) {
    const l = lines[i] ?? "";
    if (/^\s*(?:```|~~~)/.test(l)) fenced = !fenced;
    else if (!fenced && /^#{1,6}\s/.test(l)) out.push(l.replace(/^#+\s*|\s+#+\s*$/g, "").trim());
  }
  return out;
}
function bodyLang(text2) {
  const heads = headings(text2).map((h) => h.toLowerCase());
  return LANGS.find((l) => heads.some((h) => h.startsWith(RITES[l].lifecycle().toLowerCase())));
}
function sectionsOf(text2) {
  const heads = headings(text2);
  const out = {};
  for (const k of Object.keys(SECTIONS)) {
    const h = heads.find(SECTIONS[k]);
    if (h) out[k] = h;
  }
  return out;
}
function ritualCover(dir, cover = COVER) {
  const root = repoRoot(dir);
  if (!root) return null;
  let text2;
  try {
    text2 = readFileSync4(join5(root, cover.file), "utf8");
  } catch {
    return null;
  }
  if (stampOf(text2, cover) === "foreign") return null;
  const block = coverBlock(text2, cover.root);
  const graph = block?.get("graph");
  if (!block || !graph) return null;
  const holon = block.get("holon") || void 0;
  const role = block.get("agent_role") || void 0;
  const lang2 = bodyLang(text2);
  const { on } = ritualsOf(block);
  const sections = sectionsOf(text2);
  return {
    root,
    graph,
    ...holon ? { holon } : {},
    ...role ? { role } : {},
    lang: lang2,
    on,
    sections
  };
}
function mergeHeads(s, trunk) {
  return trunk && s.trunk ? [s.trunk] : [s.lifecycle, s.merge];
}
function startWord(c) {
  const { graph, holon, role, lang: lang2 } = c;
  return holon && role ? wordsIn(PREPARE, lang2).start({ graph, holon, role }) : wordsIn(RITES, lang2).early(graph);
}

// js/shared/trunkpush.ts
import { execFileSync } from "node:child_process";
var TRUNK = /^(?:refs\/heads\/)?(?:main|master)$/;
var REF_LINE = /^ [ *+-] \S+(?: \S+)*? +\S+ -> (\S+)/gm;
var words2 = (args) => args.match(/(?:\\.|'[^']*'|"(?:[^"\\]|\\.)*"|[^ '"\\])+/g) ?? [];
function git(cwd, ...a) {
  try {
    const stdio = ["ignore", "pipe", "ignore"];
    return execFileSync("git", a, { cwd, encoding: "utf8", stdio, windowsHide: true }).trim();
  } catch {
    return "";
  }
}
function targets(args) {
  const pos = [];
  let skip = false;
  for (const t of words2(args)) {
    if (skip) skip = false;
    else if (/^[0-9]*(?:>>?|<|>&)$/.test(t)) skip = true;
    else if (/^[0-9]*(?:>>?|<|>&)/.test(t)) continue;
    else if (/['"\\$`]/.test(t)) return null;
    else if (/^--(?:all|mirror)$/.test(t)) return null;
    else if (/^(?:-o|--push-option|--receive-pack|--exec|--repo)$/.test(t)) skip = true;
    else if (!t.startsWith("-")) pos.push(t);
  }
  const out = [];
  let tag = false;
  for (const r of pos.slice(1)) {
    if (tag) tag = false;
    else if (r === "tag") tag = true;
    else out.push(r.replace(/^\+/, "").split(":").at(-1) || "HEAD");
  }
  return out.length ? out : ["HEAD"];
}
var isTrunk = (branch) => TRUNK.test(branch);
var namesTrunk = (runs) => runs.some((args) => (targets(args) ?? []).some((r) => TRUNK.test(r)));
function toTrunk(runs, output, cwd, quiet2 = false) {
  const printed2 = [...output.matchAll(REF_LINE)].map((m) => m[1] ?? "");
  if (printed2.length) return printed2.some((r) => TRUNK.test(r));
  const branch = () => cwd ? git(cwd, "symbolic-ref", "--short", "-q", "HEAD") : "";
  if (quiet2) return namesTrunk(runs) ? true : isTrunk(branch()) ? null : false;
  return runs.some(
    (args) => (targets(args) ?? []).some((r) => TRUNK.test(r === "HEAD" ? branch() : r))
  );
}

// js/shared/ritualjudge.ts
var ARG = String.raw`(?:>&|\\.|'[^']*'|"(?:[^"\\]|\\.)*"|[^;&|)\n'"\\])*`;
var ENV = String.raw`(?:env +)?(?:[A-Za-z_]+=\S+ +)*`;
var PUSH = String.raw`${ENV}git(?: -C \S+)* push`;
var at = (head2, noop) => String.raw`(?:^|[;&|(\n] *)${head2}(?=[ ;&|)\n]|$)(?!${ARG} (?:${noop})(?:[ ;&|)\n]|$))`;
var PULL = new RegExp(
  at(String.raw`${ENV}git(?: -C \S+)* (?:checkout|switch)`, "-h|--help") + String.raw` (?:main|master)(?=[ ;&|)\n]|$)` + String.raw`(?:${ARG}(?:&&|;|\n))+ *${ENV}git(?: -C \S+)* pull(?=[ ;&|)\n]|$)`
);
var REFUSED = /^(?:fatal:|error:| ! \[(?:remote )?rejected\])/m;
var PUSH_REPORT = /To [^\n]+(?:\n [!=] .*)*\n [ *+-]/;
var HELD = /^(?:[Ee]rror:|fatal:|GraphQL:|X )|not mergeable|merge failed/m;
var TAGS_OUT = /^(?=[\s\S]*\n [*] \[new tag\])(?![\s\S]*\n (?:[ +-] |\* (?!\[new tag\])))/;
var QUIET = new RegExp(
  String.raw`^(?:${ARG}[;&|(\n] *)*` + PUSH + String.raw`(?=[ ;&|)\n]|$)(?!${ARG} (?:-h|--help)(?:[ ;&|)\n]|$))` + ARG + String.raw` (?:-q|--quiet)(?=[ ;&|)\n]|$)`
);
function ran(c, head2, noop, said) {
  if (!new RegExp(at(head2, noop)).test(c.command)) return false;
  const last = new RegExp(at(head2, noop) + ARG + String.raw`\s*(?:&&|$)`).test(c.command);
  return (c.exit ?? 0) === 0 && last || said.test(c.output);
}
function tagOnly(args) {
  let skip = false;
  let tags = false;
  let broad = false;
  const pos = [];
  for (const t of words2(args)) {
    if (skip) skip = false;
    else if (/^[0-9]*(?:>>?|<|>&)$/.test(t)) skip = true;
    else if (/^[0-9]*(?:>>?|<|>&)/.test(t)) continue;
    else if (/['"\\$`]/.test(t)) broad = true;
    else if (t === "--tags") tags = true;
    else if (/^(?:--(?:all|mirror|follow-tags|delete)(?:=|$)|-d$)/.test(t)) broad = true;
    else if (/^(?:-o|--push-option|--receive-pack|--exec)$/.test(t)) skip = true;
    else if (!t.startsWith("-")) pos.push(t);
  }
  const refs = pos.slice(1);
  let name = false;
  let ok = true;
  for (const r of refs) {
    if (name) name = false;
    else if (r === "tag") name = true;
    else if (!/^\+?refs\/tags\/[^:]+(?::refs\/tags\/[^:]+)?$/.test(r)) ok = false;
  }
  if (broad) return "no";
  if (ok && !name && (refs.length > 0 || tags)) return "tag";
  return refs.length === 1 && !tags && /^(?!refs\/|tag$)[^:+]+$/.test(refs[0] ?? "") ? "bare" : "no";
}
var pushRuns = (c) => {
  const all = new RegExp(String.raw`(?:^|[;&|(\n] *)${PUSH}(?=[ ;&|)\n]|$)(${ARG})`, "g");
  return [...c.command.matchAll(all)].map((m) => m[1] ?? "");
};
function tagsOnly(c) {
  const kinds = pushRuns(c).map(tagOnly);
  return kinds.length > 0 && !kinds.includes("no") && (!kinds.includes("bare") || TAGS_OUT.test(`
${c.output}`));
}
function quietLanded(c, cwd) {
  if (!cwd) return false;
  const head2 = git(cwd, "rev-parse", "HEAD");
  const trunk = isTrunk(git(cwd, "rev-parse", "--abbrev-ref", "HEAD"));
  return head2 !== "" && head2 === git(cwd, "rev-parse", "@{push}") && (!trunk || namesTrunk(pushRuns(c)));
}
function exitRefused(c) {
  const last = new RegExp(at(PUSH, "-h|--help") + ARG + String.raw`\s*$`);
  return c.exit != null && c.exit !== 0 && last.test(c.command) && !PUSH_REPORT.test(c.output);
}
function pushed(c, cwd) {
  if (REFUSED.test(c.output) || tagsOnly(c) || exitRefused(c)) return false;
  if (ran(c, PUSH, "-h|--help", PUSH_REPORT)) return true;
  return QUIET.test(c.command) && !c.command.includes("<<") && quietLanded(c, cwd);
}
function pushedTo(c, cwd) {
  if (!pushed(c, cwd)) return null;
  const to = toTrunk(pushRuns(c), c.output, cwd, QUIET.test(c.command));
  return to === null ? null : to ? "trunk" : "branch";
}
function merged(c) {
  if (HELD.test(c.output)) return false;
  const noop = "-h|--help|--auto|--disable-auto";
  return ran(c, "gh pr merge", noop, /(Merged|Squashed and merged|Rebased and merged) pull request/) || ran(c, "fj pr merge", noop, /Merged PR #/) || (c.exit ?? 0) === 0 && PULL.test(c.command);
}

// js/shared/turnend.ts
var TURN_RITE = "turn";
var SPEAKING = /* @__PURE__ */ new Map([
  [tool("case"), /* @__PURE__ */ new Set(["ask", "say", "answer", "talk"])],
  [tool("channel"), /* @__PURE__ */ new Set(["send"])]
]);
function speaks(name, input) {
  if (typeof name !== "string") return false;
  const is = (t) => name === t || name.endsWith(`__${t}`);
  const i = input;
  if (is(tool("stand"))) return i?.status != null;
  for (const [t, acts] of SPEAKING)
    if (is(t)) return typeof i?.action === "string" && acts.has(i.action);
  return false;
}
var marked = (text2) => text2.trimStart().startsWith(FRAME_MARK);
var WATCHED_MS = 30 * 6e4;
var RECEIPT_MAX = 280;
var receipt = (text2) => [...text2.trim()].length <= RECEIPT_MAX && !text2.includes("?");
var lostWord = (t, now = Date.now()) => t.framed && !t.human && !t.spoke && !!t.text.trim() && !receipt(t.text) && !(t.heard !== null && now - t.heard < WATCHED_MS);

// js/cli/hookkinds.ts
import { readFileSync as readFileSync6 } from "node:fs";
import { join as join7 } from "node:path";

// js/cli/preparescripts.ts
import { readFileSync as readFileSync5, statSync as statSync2 } from "node:fs";
import { isAbsolute, join as join6 } from "node:path";
var SCRIPT = /\.(sh|bash|zsh|js|cjs|mjs|ts|py|rb|pl)$/;
var PROJECT = /\$\{?CLAUDE_PROJECT_DIR\}?/g;
var INTERPRETER = /(^|\/)(sh|bash|zsh|dash|node|bun|deno|tsx|python3?|ruby|perl)$/;
function scriptsOf(root, command) {
  const words3 = command.split(/\s+/).map((t) => t.replace(/["']/g, ""));
  const at2 = (t) => {
    const p = t.replace(PROJECT, root);
    return isAbsolute(p) ? p : join6(root, p);
  };
  return words3.filter(
    (t, i) => SCRIPT.test(t) || t.includes("CLAUDE_PROJECT_DIR") || i > 0 && INTERPRETER.test(words3[i - 1] ?? "") && /^[\w.~]/.test(t) || t.includes("/") && isFile(at2(t))
  ).map(at2);
}
function isFile(path) {
  try {
    return statSync2(path).isFile();
  } catch {
    return false;
  }
}
function text(path) {
  try {
    return isFile(path) ? readFileSync5(path, "utf8") : "";
  } catch {
    return "";
  }
}
function knownHook(root, command, known) {
  return known(command) || scriptsOf(root, command).some((p) => known(text(p)));
}
function runsOn(matcher, tool2) {
  try {
    return new RegExp(`^(?:${matcher})$`).test(tool2);
  } catch {
    return false;
  }
}

// js/cli/hookkinds.ts
var covers = (m, target) => !m || m === "*" || runsOn(m, target);
var onAny = (...targets2) => (m) => targets2.some((t) => covers(m, t));
var KNOWN = {
  "hook.start": {
    event: "SessionStart",
    known: (c) => c.toLowerCase().includes(PRODUCT),
    on: onAny("startup", "resume", "clear")
  },
  "hook.guard": {
    event: "PreToolUse",
    known: (c) => /\.claude\W{0,4}projects/.test(c) && /memory/i.test(c),
    on: (m) => ["Write", "Edit"].every((t) => covers(m, t))
  },
  "hook.push": {
    event: "PostToolUse",
    known: (c) => c.includes("git(?: -C [^ ]+)* push"),
    on: onAny("Bash")
  },
  "hook.merge": {
    event: "PostToolUse",
    known: (c) => c.includes("gh pr merge"),
    on: onAny("Bash")
  }
};
var hooksOf = (s, event, on = () => true) => (s.hooks?.[event] ?? []).filter((e) => on(e.matcher)).flatMap((e) => e.hooks ?? []);
var cmd = (h) => h.command ?? "";
var knownOf = (root, s, kind, target) => {
  const k = KNOWN[kind];
  const on = target === void 0 ? k.on : onAny(target);
  return hooksOf(s, k.event, on).filter((h) => knownHook(root, cmd(h), k.known));
};
function read(path) {
  try {
    const s = JSON.parse(readFileSync6(path, "utf8"));
    return s && typeof s === "object" && !Array.isArray(s) ? s : {};
  } catch {
    return {};
  }
}
function standingRites(root, target) {
  const files = ["settings.json", "settings.local.json"].map((f) => read(join7(root, ".claude", f)));
  const kinds = Object.keys(KNOWN);
  return new Set(kinds.filter((k) => files.some((s) => knownOf(root, s, k, target).length > 0)));
}

// js/cli/turnread.ts
import { readFileSync as readFileSync7 } from "node:fs";

// js/shared/quietframe.ts
var flat = (s) => s.replace(/\s+/g, "");
var esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
var HEAD2 = "";
var ARGS = "";
var N = 1234567;
var NUM = new RegExp(String(N), "g");
function countLine(lang2) {
  const T = FRAME_TEXT[lang2];
  const call = esc(flat(T.caseHistory(ARGS, N))).replace(ARGS, `[^()]*`).replace(NUM, String.raw`-?\d+`);
  const cases = `(?:${call}(?:;${call})*|${esc(flat(T.myCases()))})`;
  const count = esc(flat(T.count(HEAD2, N, 0))).replace(HEAD2, ".+?").replace(NUM, String.raw`\d+`);
  return `${count}[^()]*?${esc(flat(T.noneYours()))}${esc(flat(T.inFull(ARGS))).replace(ARGS, cases)}\\.`;
}
var head = (lang2) => [false, true].flatMap((legacy) => [STALE[lang2].head(1, 1, legacy), STALE[lang2].head(2, 1, legacy)]).map((h) => esc(flat(h)).replace(/\d+/g, String.raw`\d+`));
var LINE = `(?:${LANGS.map(countLine).join("|")})`;
var QUIET2 = new RegExp(`^(?:${LANGS.flatMap(head).join("|")})?(?:${LINE})+$`);
function compact(lang2) {
  const T = FRAME_TEXT[lang2];
  const caseHead = esc(flat(ROOM[lang2].case(HEAD2))).replace(HEAD2, "[^«»():;]+") + "(?:«[^»]*»)?";
  const count = esc(flat(T.count(HEAD2, N, 0))).replace(HEAD2, caseHead).replace(NUM, String.raw`\d+`);
  const gone = esc(flat(T.supersededLines(N))).replace(NUM, String.raw`\d+`);
  const history = esc(flat(T.inFull(T.caseHistory(ARGS, N)))).replace(ARGS, "[^()]*").replace(NUM, String.raw`-?\d+`);
  const template = esc(flat(T.inFull(T.caseHistory('realm=R, action="history", room=N', "S"))));
  const fallback = esc(flat(T.inFull("")));
  const cursor = String.raw`·realm="(?:[^"\\]|\\.)*",since=\d+`;
  const line = `${count}(?:${gone})?`;
  return `(?:${line}(?:${cursor})?;(?:${history}|${fallback})\\.|(?:${line}(?:${cursor})?){2,}(?:${template}|${fallback})\\.)`;
}
var COMPACT = new RegExp(
  `^(?:${LANGS.flatMap(head).join("|")})?(?:${LANGS.map(compact).join("|")})$`
);
function quiet(text2) {
  const t = flat(text2);
  const body = t.startsWith(FRAME_MARK) ? t.slice(FRAME_MARK.length) : t;
  return QUIET2.test(body) || COMPACT.test(body);
}

// js/cli/turnread.ts
var WATCH = /\bwatchdog(?:-exit)?\b/;
var EXITS = /\bwatchdog-exit\b/;
var NOTICE = /^\s*<task-notification>/;
var OWN = [...LANGS.map((l) => WATCHDOG[l].listening("").trim()), "[Monitor "];
var ownEvent = (event) => event.split("\n").map((l) => l.trim()).filter(Boolean).every((l) => OWN.some((p) => l.startsWith(p)) || /^\{.*"type":"hello"/.test(l));
var blocks = (e) => {
  const c = e.message?.content;
  return typeof c === "string" ? [{ type: "text", text: c }] : Array.isArray(c) ? c : [];
};
var textOf = (b) => b.map((x) => x.type === "text" && typeof x.text === "string" ? x.text : "").join("\n");
function watchTasks(entries) {
  const calls = /* @__PURE__ */ new Map();
  const tasks = /* @__PURE__ */ new Map();
  for (const e of entries)
    for (const b of blocks(e)) {
      const command = String(b.input?.command ?? "");
      if (b.type === "tool_use" && WATCH.test(command))
        calls.set(String(b.id), EXITS.test(command));
      if (b.type !== "tool_result" || !calls.has(String(b.tool_use_id))) continue;
      const r = e.toolUseResult;
      const shell = typeof r?.backgroundTaskId === "string";
      const id = r?.taskId ?? r?.backgroundTaskId;
      const said = typeof b.content === "string" ? b.content : textOf(b.content ?? []);
      const found = typeof id === "string" ? id : /\btask:? ([\w-]+)/.exec(said)?.[1];
      if (found) tasks.set(found, shell && calls.get(String(b.tool_use_id)) === true);
    }
  return tasks;
}
function frameNotice(text2, exits) {
  const event = /<event>([\s\S]*?)<\/event>/.exec(text2)?.[1]?.trim();
  if (event !== void 0) return !ownEvent(event) && !quiet(event);
  return exits && /<status>\s*completed\s*<\/status>/.test(text2);
}
function prompt(e, watch) {
  if (e.type !== "user" || e.isMeta || e.isCompactSummary) return null;
  const b = blocks(e);
  if (!b.length || b.some((x) => x.type === "tool_result")) return null;
  const text2 = textOf(b);
  const origin = e.origin?.kind;
  if (origin === "human") return "human";
  if (NOTICE.test(text2) || origin === "task-notification") {
    const id = /<task-id>([^<]+)<\/task-id>/.exec(text2)?.[1]?.trim();
    return id && watch.has(id) && frameNotice(text2, watch.get(id) === true) ? "frame" : "other";
  }
  if (marked(text2)) return quiet(text2) ? "other" : "frame";
  return origin === void 0 ? "human" : "other";
}
var ended = (e) => {
  const r = e.message?.stop_reason;
  return e.type === "assistant" && typeof r === "string" && r !== "tool_use";
};
function lastTurn(path) {
  let entries;
  try {
    entries = readFileSync7(path, "utf8").split("\n").filter((l) => l.trim()).map((l) => {
      try {
        return JSON.parse(l);
      } catch {
        return {};
      }
    }).filter((e) => (e.type === "user" || e.type === "assistant") && !e.isSidechain);
  } catch {
    return null;
  }
  const watch = watchTasks(entries);
  const said = [...entries].reverse().find((e) => prompt(e, watch) === "human")?.timestamp;
  const heard = typeof said === "string" ? Date.parse(said) : NaN;
  const seen = { framed: false, human: false, spoke: false, text: "", heard: null };
  if (Number.isFinite(heard)) seen.heard = heard;
  const last = [...entries].reverse().find((e) => e.type === "assistant");
  const tail = last && !last.isApiErrorMessage ? blocks(last).at(-1) : void 0;
  if (tail?.type === "text" && typeof tail.text === "string") seen.text = tail.text;
  let prompts = 0;
  for (let i = entries.length - 1; i >= 0; i--) {
    const e = entries[i];
    if (prompts && ended(e)) break;
    const kind = prompt(e, watch);
    if (kind) prompts++;
    if (kind === "frame") seen.framed = true;
    if (kind === "human") seen.human = true;
    for (const b of e.type === "assistant" ? blocks(e) : [])
      if (b.type === "tool_use" && speaks(b.name, b.input)) seen.spoke = true;
  }
  return seen;
}

// js/cli/rituals-hook.ts
function hookInput() {
  try {
    if (!process.stdin.isTTY) return JSON.parse(readFileSync8(0, "utf8")) ?? {};
  } catch {
  }
  return {};
}
function printed(r) {
  if (!r || typeof r !== "object") return { output: String(r ?? ""), exit: null };
  const o = r;
  const exit = typeof o.exit_code === "number" ? o.exit_code : null;
  return { output: `${String(o.stdout ?? "")}
${String(o.stderr ?? "")}`, exit };
}
function riteWords(input, dir) {
  const cover = ritualCover(dir);
  if (!cover) return [];
  const event = input.hook_event_name;
  if (event === "SessionStart") {
    const source = typeof input.source === "string" ? input.source : "startup";
    if (source === "compact" || !cover.on.has("start")) return [];
    if (standingRites(cover.root, source).has("hook.start")) return [];
    return [startWord(cover)];
  }
  if (event !== "PostToolUse" || input.tool_name !== "Bash") return [];
  const own = standingRites(cover.root, "Bash");
  const call = {
    command: String(input.tool_input?.command ?? ""),
    ...printed(input.tool_response)
  };
  const said = [];
  const W = wordsIn(RITES, cover.lang);
  const push = cover.on.has("push") && !own.has("hook.push") ? pushedTo(call, dir) : null;
  if (push === "branch") said.push(W.push(cover.sections.check));
  if (push === "trunk" || cover.on.has("merge") && !own.has("hook.merge") && merged(call))
    said.push(W.merge(cover.holon, ...mergeHeads(cover.sections, push === "trunk")));
  return said;
}
function turnWord(input, dir) {
  if (input.stop_hook_active === true || typeof input.transcript_path !== "string") return null;
  const cover = ritualCover(dir);
  if (cover && !cover.on.has(TURN_RITE)) return null;
  const turn = lastTurn(input.transcript_path);
  return turn && lostWord(turn) ? wordsIn(TURN, cover?.lang).wake() : null;
}
try {
  const input = hookInput();
  const dir = typeof input.cwd === "string" && input.cwd ? input.cwd : process.env.CLAUDE_PROJECT_DIR || process.cwd();
  const reason = input.hook_event_name === "Stop" ? turnWord(input, dir) : null;
  if (reason) process.stdout.write(`${JSON.stringify({ decision: "block", reason })}
`);
  const said = riteWords(input, dir);
  if (said.length) {
    const hookEventName = String(input.hook_event_name);
    const additionalContext = said.join("\n\n");
    process.stdout.write(
      `${JSON.stringify({ hookSpecificOutput: { hookEventName, additionalContext } })}
`
    );
  }
} catch {
}
process.exitCode = 0;
