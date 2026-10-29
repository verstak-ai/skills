#!/usr/bin/env node

// js/shared/version.ts
import { createHash } from "node:crypto";
import { readFileSync as readFileSync2 } from "node:fs";
import { fileURLToPath } from "node:url";

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
var RUNTIME_PREFIX = PRODUCT;
var GLOBAL_PREFIX = `__${PRODUCT}`;
var BRIDGE_SKILL = PRODUCT;
var BRIDGE_FILE = `${BRIDGE_NAME}.mjs`;
var PLUGIN_FILE = "opencode-plugin.js";
var PLUGIN_COPY_FILE = `${PRODUCT}.js`;
var SKILL_STAMP_MASK = "*/**";
var SKILL_SET = "verstak-ai/skills";
var PLUGIN_NAME = PRODUCT;
var SUB_ENTRY_PREFIX = `${PRODUCT}-sub`;
var CONNECTOR_PATTERN = /verstak|nks\.lab\.mirari/i;
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
var SATELLITE_CODE = "const p=require('path').join(require('os').homedir(),'.verstak-bridge','verstak-bridge.mjs');process.argv.splice(1,0,p);import(require('url').pathToFileURL(p).href)";
var HOOKS_SECTION = { en: "Step 4 — Hooks" };

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
function parseConfig(text2, say2) {
  let raw;
  try {
    raw = JSON.parse(text2);
  } catch (e) {
    say2(`not JSON (${e.message}) — build defaults are used`);
    return {};
  }
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    say2("not a JSON object — build defaults are used");
    return {};
  }
  const o = raw;
  const out7 = {};
  for (const k of Object.keys(o)) if (!KEYS.has(k)) say2(`unknown key "${k}" ignored`);
  if (o.server !== void 0) {
    let url = null;
    try {
      url = typeof o.server === "string" ? new URL(o.server) : null;
    } catch {
    }
    if (url && (url.protocol === "https:" || url.protocol === "http:")) out7.server = url.href;
    else say2(`"server" is not an http(s) URL — the build address ${BUILD_SERVER_URL} is used`);
  }
  if (o.tool_prefix !== void 0) {
    if (typeof o.tool_prefix === "string" && PREFIX_RE.test(o.tool_prefix))
      out7.tool_prefix = o.tool_prefix;
    else
      say2(
        `"tool_prefix" must match ${PREFIX_RE} (e.g. "${BUILD_TOOL_PREFIX}") — the build prefix ${BUILD_TOOL_PREFIX} is used`
      );
  }
  return out7;
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

// js/delivery/patterns/board.ts
var BOARD_HEADER = { en: "Channels" };
var BOARD_FORM = {
  boardHeader: /^\s*Channels(?:\s*\((\d+)\))?(?:\s|:|$)/m,
  boardEmpty: /^\s*No role (?:of|in) this graph (?:holds a channel|stands anywhere)/m,
  listens: /(^|·)\s*listening/,
  alive: /\blive\b|listening/,
  undelivered: /undelivered\s+(\d+)/,
  seatId: /id of this (?:seat|place)[^\n]*\n\s*([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i
};

// js/delivery/patterns/caseexit.ts
var CASE_EXIT_CLOSED = /closed|revoked|not found/i;

// js/delivery/patterns/channel.ts
var ACTION_LIST_RE = /(one of:\s*)([a-z_]+(?:\s*\|\s*[a-z_]+)*)/i;
var SEAT_GONE_RE = /no such standing|take it with connect/i;
var UNATTRIBUTED_RE = /hold no registered standing/i;

// js/delivery/patterns/config.ts
var SERVER_CHOICE = {
  en: /^(en|ai|english|verstak)$/i
};

// js/delivery/patterns/deliver.ts
var NOTICE_MARK = /DELIVERY BEHIND/;

// js/delivery/patterns/launch.ts
var LAUNCH_WORD = "verstak";
var word = LAUNCH_WORD.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
var LAUNCH_LINE = new RegExp(
  `^[ \\t]*${word}\\s+(\\S+)\\s+(\\S+)\\s+(?:case\\s+)?[№#]\\s?(\\d+)(?:[ \\t]+from[ \\t]+(@\\S+))?(?=\\s|$)`,
  "mu"
);

// js/delivery/patterns/satprobe.ts
var SAT_LOGIN_RE = /\/login\b|oauth|authoriz|sign.?in|log.?in|\b401\b/i;
var SAT_OLD_FLAG_RE = /satellite|unknown (flag|option)/i;

// js/delivery/protocol.ts
var tool = (name2) => `${TOOL_PREFIX}${name2}`;
var method = (name2) => `${PRODUCT}/${name2}`;
var LOGGERS = { channel: `${PRODUCT}-channel`, bridge: BRIDGE_NAME };
var ID_PREFIX = `${PRODUCT}-`;
var FRAME_MARK = `[${PRODUCT}]`;
var STRUCTURED_CAPABILITY = `${PRODUCT}/structured`;
var HALTS_CAPABILITY = `${PRODUCT}/halts`;
var serverProtocol = {
  refusal: "verstak/refusal"
};
var SERVER_LOCALE = { en: "en" };

// js/delivery/version.ts
var VERSION = "3.19.0";
var BUILD_MARK = "verstak-build";
var CHANNEL_MARK = "verstak-build:release";

// js/delivery/words/absorb.ts
var ABSORB = {
  en: {
    socketHidden: () => "(the bridge holds the socket address — it is not shown to the agent)",
    statusHidden: () => "(the bridge holds the status address)",
    mainSeatHeld: (name2, held2) => `[verstak-bridge] ${name2 ?? "this seat"} is the main seat of the bridge's channel, and seats of other graphs stand on the channel: ${held2}. The bridge released nothing; to remove the main one, first remove them (revoke in their graph).`
  }
};

// js/delivery/words/appserver.ts
var APPSERVER = {
  en: {
    socketClosed: () => "socket closed",
    doorNotOpened: (status) => `the door did not open: HTTP ${status}`
  }
};

// js/delivery/words/asks.ts
var ASK = {
  en: {
    ask: (author, to, toPlace, key2, done, form, advice) => `${author} asks the role ${to}${toPlace} [${key2}]: “${done}”${form}${advice}`,
    place: (place) => `(seat ${place})`,
    yesNo: () => "answer: yes or no (yes | no)",
    free: () => "answer in your own words",
    choice: (options) => `options: ${options}`,
    advice: (option, why) => `recommended: ${option}${why}`,
    answer: (author, refersTo, reply2) => `${author} answers [${refersTo}]: ${reply2}`,
    ack: (refersTo, reply2, author) => `answer [${refersTo}] accepted${reply2} · ${author}`,
    withdrawn: (withdraws, key2, done, verdict, author) => `question [${withdraws}] withdrawn: [${key2}] [${done}] = ${verdict} · ${author}`,
    inviteOwnerless: (who, standing) => `the platform calls the role ${who} to the case: the seat ${standing} is gone, its lines are nobody's`,
    inviteAnswerWaiting: (who, standing) => `the platform calls the role ${who} to the case: an answer awaits acceptance, the asking seat ${standing} has left`
  }
};

// js/delivery/words/frame-text.ts
var FRAME_TEXT = {
  en: {
    myCases: () => `${tool("case")}(action="mine"), then read each`,
    frame: (id) => `frame ${id}`,
    yoursBelow: () => ` — yours in the lines below; `,
    noneYours: () => ` — none of them yours; `,
    count: (head, n, mine) => `${head}: ${n} records, yours ${mine}`,
    supersededLines: (gone) => `, ${gone} superseded lines of a key`,
    askAnswered: (n, by) => `; your question [${n}] is closed: answered by ${by}`,
    askMoved: (n, to) => `; your question [${n}] is re-asked of ${to}`,
    inFull: (cases) => `in full — ${cases || FRAME_TEXT.en.myCases()}`,
    caseHistory: (args, since) => `${tool("case")}(${args}, since=${since})`,
    lifeCheckReply: () => `Answer with an action: update your status — ${tool("stand")}(realm, status=<what you are doing>) — or say a word in the case.`,
    lifeCheckSeat: (name2) => `Seat warned: ${name2 || "the platform did not name the seat"}.`,
    humanWordReply: (standing, id) => `reply: ${tool("channel")}(action="send", standing=${standing}, in_reply_to=${id}, text=…)`
  }
};
var CASE_LINE = {
  en: {
    platform: () => "platform",
    quote: (s2) => `“${s2}”`
  }
};

// js/delivery/words/backlog.ts
var BACKLOG = {
  en: {
    head: (count, expected, shown, direct) => `Wake-up: ${count} frames` + (expected ? ` (waiting in the queue: ${expected})` : "") + (count > shown ? `, the first ${shown} here, ${count - shown} left out` : "") + ` — those addressed to the seat as text, the rest by count; in full — by the case lines below, the rest — ${FRAME_TEXT.en.myCases()}.` + (direct ? ` ${direct} direct messages are not here: each came on its own and whole.` : "")
  }
};

// js/delivery/words/take.ts
var TAKE = {
  en: {
    rule: () => `your own name (the same role, the same account) — by yourself when the holder stays silent 5 minutes to a probe by word (${tool("channel")} send); another's (another role or account) — only on the user's word`
  }
};

// js/delivery/words/call.ts
var CALL = {
  en: {
    sameNamePrefix: () => "the same name under another role; ",
    heardAdvice: (other, asked, led) => `${other ? `another session listens on the seat ${asked}` : `the bridge does not know whether another session listens on the seat ${asked}`} — leave it alone; this bridge's own seat is ${led}: stay on it or pass another name; to stand beside — ${tool("stand")} without name; taking the seat (take=true): ${TAKE.en.rule()}`,
    sameKeysAdvice: () => `the keys match — it is the same seat: repeat ${tool("stand")} with take=true to reopen it deliberately`,
    sameNameAdvice: () => `the same name under another role (derived from the same directory) — pass another name, or ${tool("stand")} with take=true to change this bridge's seat`,
    takeOtherAdvice: () => `to take another seat instead of this one — ${tool("stand")} with take=true (the former stays on the board without hearing; remove what is not needed with revoke)`,
    otherPlace: (led, asked, advice) => `Refused (bridge): this bridge already leads the seat ${led} — one seat per bridge in a graph, and the seat ${asked} would silently take it off the socket. ${advice}; holding both at once needs a second bridge, that is another harness session; a seat in another graph stands beside by itself.`,
    besideConnect: (led) => `Refused (bridge): this bridge leads the seat ${led}, and a connect in another graph would open a second channel and take it off the socket. A seat in another graph stands beside on the same channel — ${tool("stand")}(realm=…) or register.`,
    besideStand: (led) => `Refused (bridge): this bridge leads the seat ${led}, but has no channel socket now (it left the seat or the seat was taken) — a seat of another graph cannot stand beside. First bring back ${led}: ${tool("stand")} for its graph.`,
    noReply: () => "no reply"
  }
};

// js/delivery/words/channel.ts
var CHANNEL = {
  en: {
    deadTokenAdvice: (code) => code === 4002 ? `close 4002 — the seat went out after idling; to return it — ${tool("stand")} with the same name` : `close ${code} — the token is dead, call connect`,
    binaryFrame: () => "[binary frame]",
    hung: (silent, ping) => `the connection has been silent for ${silent} s with a ping every ${ping} s — hung without closing; reopening at the same address. Frames that arrived during the silence may be lost — check the cases: ${FRAME_TEXT.en.myCases()}; a direct word — ask for it again`,
    rollout: () => "the service is not answering — a rollout is under way, keeping the same token"
  }
};

// js/delivery/words/cli.ts
var CLI = {
  en: {
    usage: (build, rituals) => `verstak ${build}
  node verstak-bridge.mjs [bridge] [server-url] [--timeout <ms>] [--auth-dir <dir>] [--no-browser] [--debug] [--satellite] [--tools <a,b,c>]
      (--satellite — the bridge of a subagent run from an agent file: only the satellite seat <caller's seat>.sub-N)
      (--tools — which tools the harness sees, ${tool("stand")} always; without the flag — all)
  node verstak-bridge.mjs watchdog [key] [--auth-dir <dir>] [--lang en]
  node verstak-bridge.mjs watchdog-exit [key] [--auth-dir <dir>] [--lang en]
  node verstak-bridge.mjs watchdog-codex [key] [--auth-dir <dir>] [--lang en]   (from the Codex shell: CODEX_THREAD_ID, CODEX_HOME)
      (--lang — the surface language; the bridge block prints the watchdog command with it)
  node verstak-bridge.mjs doctor [server-url] [--auth-dir <dir>]
  node verstak-bridge.mjs status [--json] [--auth-dir <dir>] [--lang en]
  node verstak-bridge.mjs stop <seat|session id> [--realm <graph>] [--auth-dir <dir>] [--lang en]   (a stop order to the seat; an older api — a revoke)
  node verstak-bridge.mjs orchestra <on|off|status|step> [--realm <graph>]… [--auth-dir <dir>] [--lang en]   (the bridge's orchestrator — the daemon's flag; on needs the machine's consent; step — one tact of reading the queues from the cursor)
  node verstak-bridge.mjs update [--auth-dir <dir>]
  node verstak-bridge.mjs use <en|url> [--auth-dir <dir>]   (en — mcp.verstak.ai)
  ${rituals}
  node verstak-bridge.mjs daemon --auth-dir <dir>   (the machine daemon; the thin bridge raises it — the default bridge)
  node verstak-bridge.mjs version   (or --version)
  env: VERSTAK_BRIDGE_TOKEN — a personal token instead of OAuth (or the file <auth-dir>/token);
       VERSTAK_BRIDGE_DAEMON=0 — the full bridge in its own process, without the machine daemon;
       VERSTAK_BRIDGE_URL, VERSTAK_BRIDGE_AUTH_DIR, VERSTAK_BRIDGE_NO_BROWSER, VERSTAK_BRIDGE_DEBUG
`,
    homeUpdated: (path) => `[verstak-bridge] home updated by this build: ${path}
`,
    updateTitle: (build) => `verstak update — ${build}`,
    updateServer: (url, source, fresh2) => `server: ${url} (${source}) — ${fresh2}`,
    rateLimited: (error, reset) => `latest release unknown: ${error} — GitHub rate limit; retry ${reset ? "after the reset" : "later"}`,
    latestUnknown: (error) => `latest release unknown: ${error ?? "no answer"} — network or GitHub; retry later`,
    lag: (cmp) => cmp > 0 ? " — behind" : cmp < 0 ? " — newer than the release (a branch build)" : " — not behind",
    latest: (version, tag, mine, lag) => `latest release: v${version} (${tag}); this file: v${mine}${lag}`,
    downloadFailed: (error) => `download failed: ${error}`,
    placed: (path) => `placed: ${path}`,
    nothingPlaced: (home) => `nothing was placed in the home: ${home} is not older than the release`,
    next: () => "Next:",
    stepSkills: (setup, fetched) => `  1. Skills are updated by the harness channel — the order is in the fresh installer ${setup}${fetched ? "" : " (not downloaded — take it from the release)"}: read it and carry out the update steps for this harness.`,
    stepRestart: () => "  2. Restart the harness sessions: a bridge started by the previous build lives until the end of its session.",
    stepDoctor: () => "  3. node ~/.verstak-bridge/verstak-bridge.mjs doctor — a check of what is installed and working.",
    useNoAddress: () => "use: name an address — en (mcp.verstak.ai) or the full URL of an instance",
    useWritten: (url, path, fresh2) => `the bridge looks at ${url} — written to ${path}; ${fresh2}`,
    useEffect: () => "Takes effect from a new bridge process: restart the harness sessions. The grant is separate per address — the first call at a new address leads to login."
  }
};

// js/delivery/words/deaf.ts
var DEAF = {
  en: {
    takenByOther: (name2) => `the seat ${name2} has no hearing (left, or the token died), and the board reads it listening — another session may have taken it`,
    unknownHearing: (name2) => `the seat ${name2} has no hearing (left, or the token died), and the bridge does not know whether another session listens on it`,
    refusal: (why) => `Refused (bridge): ${why}; the call will not go under its signature — not sent. Stand again with ${tool("stand")}: the bridge takes its own seat back by itself and stands beside another's on name.N with hearing.`
  }
};

// js/delivery/words/doctor.ts
var DOCTOR = {
  en: {
    title: (build) => `verstak doctor — ${build}`,
    homeNone: (home) => `home copy: none (${home}) — the verstak skill's establish-mcp method places it on connect`,
    homeSame: (home) => `home copy: ${home} — the same build as this file`,
    homeDiffers: (home, v, hash, selfPath2) => {
      const fix2 = selfPath2 ? `update it from the delivery: cp "${selfPath2}" ${home}` : "this file is unreadable";
      return `home copy: ${home} — v${v}+${hash}, DIFFERENT bytes: ${fix2}`;
    },
    srcArgument: () => "launch argument",
    srcEnv: () => "the VERSTAK_BRIDGE_URL variable",
    srcFile: (p) => `choice file ${p}${CONFIG_SERVER ? ` — it shadows "server" in ${configPath()}; delete the choice file to let config.json apply` : ""}`,
    srcDefault: (p) => `the default${DEFAULT_SERVER_URL === BUILD_SERVER_URL ? "" : ` from ${configPath()}`}; to change — node <bridge> use en | <url>, file ${p}`,
    freshProd: () => "production address: self-update from the delivery releases is on",
    freshOther: () => "another instance: there are no updates from the delivery releases",
    server: (url, source) => `server: ${url} (${source})
  tool prefix: ${TOOL_PREFIX} (${TOOL_PREFIX === BUILD_TOOL_PREFIX ? "the build's" : `from ${configPath()}`}; read at process start — a running daemon keeps its own)`,
    unreachable: (why) => `  unreachable: ${why}`,
    wantsOAuth: () => " (asks for OAuth)",
    noTokenProbe: () => " (a probe without a token — a refusal is expected)",
    answers: (status, note4) => `  answers: HTTP ${status}${note4}`,
    grantPat: (source) => `grant: a personal token (PAT) from ${source} — OAuth is not used`,
    patCheckFailed: (why) => `  the check failed: ${why}`,
    patRejected: () => "  TOKEN REJECTED (HTTP 401) — revoked, expired or without rights to this graph: issue a new one on the graph's token page",
    patAccepted: (status) => `  the token is accepted by the server (HTTP ${status})`,
    patOther: (status) => `  the server answered HTTP ${status} — not a token refusal, see the "server" line`,
    patStore: (path) => `  the OAuth store ${path} exists but is not read while a PAT is set`,
    grant: (path) => `grant: ${path}`,
    noStore: () => "  no store — the bridge has never logged in to this server",
    noTokens: () => "  no tokens",
    access: (usable, left2, span) => `  access: ${usable ? "usable" : "not usable"}${left2 !== null ? ` (${left2 > 0 ? "expires in" : "expired"} ${span})` : ""}`,
    refreshNone: () => "  refresh: none",
    refreshValidIn: (s2) => `valid in ${s2}`,
    refreshValid: () => "valid",
    refreshExpired: () => "EXPIRED — a login is needed",
    refreshExpiresIn: (s2) => `expires in ${s2}`,
    refresh: (parts) => `  refresh: present${parts ? ` (${parts})` : ""}`,
    refusedSince: (since, reason) => `  a refusal stands since ${since}: ${reason}`,
    lock: (p) => `  lock: ${p}`,
    grantLog: () => "  grant.log, latest:",
    latestNotAsked: () => "latest release: the bridge has not asked about releases yet (it will in a couple of seconds after the session starts; by hand — the update subcommand)",
    latestUnknown: (why, ago) => `latest release: unknown (${why ?? "no reason"}), asked ${ago} min ago`,
    latestBehind: (latest, v, downloaded, ago) => `latest release: v${latest} — THIS FILE IS BEHIND (v${v}); downloaded to the home: ${downloaded || "nothing"}; asked ${ago} min ago`,
    latestCurrent: (latest, ago) => `latest release: v${latest}, this file is not behind; asked ${ago} min ago`,
    pluginMissing: (registry) => `Claude Code: the verstak plugin is not installed (${registry})`,
    entryNotFound: () => "no bridge entry found in the manifest",
    entryFound: (name2) => `entry "${name2}" → the bridge from the plugin`,
    unreadable: (p) => `${p} is unreadable`,
    pluginLine: (key2, v, scope, entry, path) => `Claude Code: plugin ${key2} v${v} (${scope}) — ${entry}; ${path}`,
    claudeUnreadable: (p) => `Claude Code: ${p} is unreadable`,
    codexNoManifest: () => "no manifest",
    codexManifest: (v, hit) => `v${v}, ${hit ? "the bridge entry is in the manifest" : "no bridge entry in the manifest"}`,
    codexPlugin: (plugin, market, word3, dir2) => `Codex: plugin ${plugin}@${market} — ${word3}; ${dir2}`,
    codexNoPlugin: (cache) => `Codex: no verstak plugin in the cache (${cache})`,
    claudeEntry: (name2, cmd, args) => `Claude Code: entry "${name2}" → ${cmd} ${args}`,
    claudeNoManual: () => "Claude Code: no manual bridge entry in the user config (the standard one is in the plugin)",
    ocNoPlugin: (copy) => `OpenCode: no plugin (${copy}) — the verstak skill's establish-mcp method places it on connect`,
    ocNoPackaged: (copy) => `OpenCode: the plugin ${copy} is installed; there is no plugin next to this delivery file, nothing to compare with`,
    ocSame: (copy) => `OpenCode: the plugin ${copy} — the same build as in the delivery`,
    ocDiffers: (copy, packaged) => `OpenCode: the plugin ${copy} — DIFFERENT bytes, update from the delivery: cp "${packaged}" ${copy}`,
    codexHome: (h) => `Codex: home ${h}`,
    codexDoorOpen: (door) => `Codex: the app-server door is open (${door})`,
    codexDoorNever: () => "Codex: there is no door and there will not be — the home is longer than the unix socket limit; a short home is needed for the daemon and sessions",
    codexDoorNone: (door) => `Codex: no door (${door}) — the app-server daemon is not up; without it the frame is delivered by watchdog-exit`,
    codexManual: (has) => `Codex: ${has ? "there is a manual bridge entry in config.toml" : "no manual bridge entry in config.toml (the standard one is in the plugin)"}`,
    daemonOn: () => "machine daemon: the thin bridge is on — the default (the switch is VERSTAK_BRIDGE_DAEMON=0 in the bridge environment)",
    daemonOff: () => "machine daemon: off — the bridge runs full (the switch is set in this process environment: VERSTAK_BRIDGE_DAEMON=0 or VERSTAK_BRIDGE_NO_DAEMON)",
    daemonNeverUp: (dir2) => `  never started: the seam directory ${dir2} does not exist`,
    daemonGrant: (dir2) => `  grant directory: ${dir2} — one daemon per directory`,
    daemonSocket: (s2) => `  entrance, socket: ${s2}`,
    fallbackNone: () => "  no session goes around the daemon (the full bridge in its own process — the fallback path or the switch)",
    fallbackCount: (n) => `  sessions around the daemon (the full bridge in its own process — the fallback path or the switch): ${n} — the daemon does not see them nor count them in "sessions"`,
    fallbackOne: (pid, build, since, cwd, why) => `    pid ${pid}, build ${build}, since ${since}, directory ${cwd}: ${why}`,
    daemonAnswers: (pid, build, other, v, sessions, path) => `  answers: pid ${String(pid)}, build ${build}${other ? ` — DIFFERENT from this file (v${v})` : ""}, sessions ${String(sessions ?? "?")}${path ? `, file ${path}` : ""}`,
    daemonUnsafe: (why) => `  the entrance is not private: ${String(why)} — the thin bridge will go full`,
    daemonSilent: (socket, why) => `  socket: ${String(socket)} — not answering (${String(why)})`,
    thisFile: (p) => `this file: ${p}`
  }
};

// js/delivery/words/doctorharness.ts
var HARNESS = {
  en: {
    launchFix: (harness, entry, node, bridge) => {
      const abs = node ?? "<absolute node path: command -v node>";
      const shell = "start the harness from a shell where node is found";
      const alt = harness === "codex" ? "the Codex plugin entry takes no absolute path, and a second entry beside it would make two bridges" : `or an entry with the absolute node path, independent of PATH: ${entry ? `claude mcp remove "${entry}" --scope user, then ` : ""}claude mcp add --scope user "${entry ?? "verstak-bridge"}" -- ${abs} "${bridge}"${entry ? "" : " — and disable the plugin entry plugin:verstak:verstak in /mcp so the bridge is one"}; the path is tied to this node install — change it, rewrite the entry`;
      return `    fix: ${shell}; ${alt}`;
    },
    launchNotFound: (who, cmd, absolute) => `${who}: the command "${cmd}" is not found${absolute ? "" : " in this shell's PATH"} or not executable — the harness will not raise the bridge (spawn ENOENT)`,
    launchAbsolute: (who, cmd) => `${who}: the command ${cmd} is executable and independent of PATH`,
    launchFound: (who, cmd, found) => `${who}: "${cmd}" → ${found}`,
    launchProfile: (who, cmd, found, dir2) => `${who}: "${cmd}" → ${found} — in this shell's PATH; the directory ${dir2} is put there by the shell profile or a version manager, and a harness started outside a shell (an app, a service) may not see it. The harness's PATH cannot be seen from here; if the harness says spawn ENOENT — the fix is on the next line`,
    openCodeRuntime: () => "OpenCode: the plugin's bridge runs on OpenCode's own runtime — independent of node in PATH",
    secondPath: (where, name2, url, remove) => `${where}: the entry "${name2}" leads to ${url} directly over http, around the bridge — a second path to the same server: the tools double, and writes on this path go out without a seat. The one path to the graph is the bridge → remove it: ${remove}`,
    deleteFrom: (file) => `delete it from ${file}`,
    connector: (name2, file) => `Claude Code: the connector "${name2}" is in the connection history (${file}, claudeAiMcpEverConnected; the line stays after removal) — claude.ai connectors come into every Claude Code session next to the bridge, and the connector's address is not on disk. If it is installed and leads to the graph server, it is a second path around the bridge → remove it in claude.ai (Settings → Connectors) or disable it in Claude Code (/mcp)`,
    skillsOtherChannel: (pi) => `by the channel the set was installed with (pi — ${pi}; the order — SETUP.md, section "Update")`,
    skillsNone: () => "skills: no delivery set found (the Claude Code plugin, the Codex plugin, ~/.agents/skills, VERSTAK_SKILLS_ROOT)",
    skillsUnreadable: (root) => `skills: ${root} — the set's version is unreadable`,
    skillsCurrent: (root, v) => `skills: ${root} — v${v}, not behind the bridge`,
    skillsBelowBridge: (bridge) => `BEHIND the bridge v${bridge}: the method in the agent's context is older than the bridge`,
    skillsBelowRelease: (release) => `BEHIND the release v${release}, level with the bridge: the whole delivery is behind (the bridge — the update subcommand)`,
    skillsBehind: (root, v, why, how2) => `skills: ${root} — v${v}, ${why} → update the set: ${how2}; then a new session`,
    ocUnreadable: (file) => `OpenCode: ${file} is unreadable`,
    ocDisabled: (name2, file) => `OpenCode: the mcp entry "${name2}" in ${file} leads to Verstak but is disabled — not in play`,
    ocBridge: (name2, file, path) => `OpenCode: the mcp entry "${name2}" in ${file} calls ${path} — it looks like the delivery bridge. If it is, its tools are namespaced, and the bridge is shared by the service's sessions: the entry may go out under a neighbouring session's signature. Then remove it from this file by hand: opencode mcp has list, add, auth, logout — there is no remove command. The delivery surface is the plugin`,
    ocHttp: (name2, file) => `OpenCode: the mcp entry "${name2}" in ${file} leads to Verstak directly over http, around the bridge — its tools are namespaced, it has no channel standing, and its writes go out without a seat. The one path to the graph is the bridge, brought by the delivery plugin. Remove it from this file by hand: opencode mcp has list, add, auth, logout — there is no remove command`,
    ocNone: (unreadable, cwd) => `OpenCode: found no Verstak mcp entries${unreadable ? ` in what I read (${unreadable} file(s) could not be parsed — see the lines above)` : ""} — looked upward from ${cwd}, the global layer and variables; an entry in another tree is not checked by this, call doctor from the project directory`
  }
};

// js/delivery/words/door.ts
var DOOR = {
  en: {
    privateDir: (bad) => `DOER: the local standing socket is not up — ${bad}`,
    listenFailed: (message) => `DOER: the local standing socket did not come up (${message}) — the watchdog has nothing to attach to`
  }
};

// js/delivery/words/handoff.ts
var HANDOFF = {
  en: {
    strayFrame: (id, to, key2, raw) => `DOER: frame ${id} from the daemon-change spool is addressed to the seat ${to}, which has not returned — not a frame of the seat ${key2}; to bring the seat back — ${tool("stand")} in its graph. Frame: ${raw}`
  }
};

// js/delivery/words/hearing.ts
var HEARING = {
  en: {
    unresolvedAgent: (what) => `Refused (bridge): karta="agent" — the bridge leads no seat in this graph and does not know which role this session held the name under, and a seat under the sentinel matches neither the board nor a former hold (${what} could make a second seat or take another's). Name the role by number — the agent's role from AGENTS.md.`,
    otherListens: (seat2) => `another session listens on the seat ${seat2}`,
    unknownListens: (seat2) => `the bridge does not know whether another session listens on the seat ${seat2} (the board did not read, or not all of it)`,
    rawSeatRefusal: (who, action) => `Refused (bridge): ${who} — ${action} ${action === "register" ? "would sign writes with another's seat" : "would take it"}; the call was not sent. Stand with ${tool("stand")}: the bridge takes its own seat back by itself and stands beside another's on name.N with hearing.`
  }
};

// js/delivery/words/hold.ts
var HOLD = {
  en: {
    newSocket: () => "new socket",
    revokedOwn: () => "revoked by this session",
    closedOwn: () => `the channel was closed by this session's own close — the seat is released, the token is alive; to stand again — ${tool("stand")}`,
    resumeFailed: () => "resume from disk failed",
    tokenDead: () => "the seat went out after idling (4002)",
    parked: (reason) => `the bridge left the seat (${reason}) — socket closed, seat intact; to return use the watchdog or ${tool("stand")}`,
    evicted: (code) => `DOER: close ${code} — the seat was taken, another holder is listening; the bridge sends no writes into this graph until you stand on your own seat — they would go under its signature; to listen here, ${tool("stand")} without name stands beside on name.N; to retake the seat (take=true): ${TAKE.en.rule()}`,
    evictedBeside: (code, name2, base) => `DOER: close ${code} — the seat ${name2} was taken, another holder is listening; not taking it over and not signing with it — standing beside as ${base}.N with hearing myself; the outcome comes next, ${tool("stand")} with the same call tells the seat and the watchdog command; evicting that session (take=true): ${TAKE.en.rule()}`,
    besideDone: (name2, said2) => `Verstak: the seat ${name2} was taken (4000) — the bridge stood beside on its own seat with hearing. ${said2}`,
    besideFailed: (name2, base, said2) => `Verstak: the seat ${name2} was taken (4000), and the bridge could not stand beside — no hearing: ${said2} The move — ${tool("stand")} with name=${base} without take: the bridge stands beside as ${base}.N with hearing.`,
    evictedRefusal: (name2, base) => `Refused (bridge): the seat ${name2} was taken (4000), another holder listens on it, and the bridge could not stand beside yet — the write would go under its signature; the call was not sent. The move — ${tool("stand")} with name=${base} without take: the bridge stands beside as ${base}.N with hearing; then repeat the call.`,
    besideOther: (place, ok, said2) => ok ? `The seat of another graph ${place} was on the taken channel — it stands again on the new one. ${said2}` : `The seat of another graph ${place} was on the taken channel and did not stand again — no hearing there: ${said2} The move — ${tool("stand")} in that graph with the same name.`,
    takenBySession: () => "a new bridge of this same session took the seat — this instance lets the socket go, the hearing is the new one's",
    dead: (advice) => `DOER: ${advice}`,
    alive: (version) => `DOER: the socket keeps being cut while the service answers (${version}) — holding the seat, reopening less often; if it fails, ask about the token`
  }
};

// js/delivery/words/leave.ts
var LEAVE = {
  en: {
    notHolding: () => "the bridge holds no seat — nothing to leave",
    cleared: () => "busyness cleared",
    notCleared: (body) => `busyness not cleared (${body})`,
    keptOnBoard: () => "the busy line stays on the board till the pulse runs out — the dispatcher connection is broken now; it comes back with the return",
    seats: (keys) => `the seats ${keys} (they share the channel socket)`,
    seat: (key2) => `the seat ${key2}`,
    leftByWord: (which2, line) => `left ${which2}: the socket is closed, ${line}; address, queue and hooks intact — mail piles up; the seat is released by word and will not return by itself — to bring it back: ${tool("stand")} with the same name`,
    left: (which2, line) => `left ${which2}: the socket is closed, ${line}; address, queue and hooks intact — mail piles up and arrives on return (the watchdog or ${tool("stand")})`,
    satelliteReleased: () => "the satellite seat is released whole",
    leftSatellite: (place, line) => `left the satellite seat ${place}: the socket is closed, ${line}; the seat is released whole — neither the watchdog nor a return will raise it; to stand again — ${tool("stand")} with satellite_of`,
    returned: (how2, status) => `the bridge is back on the seat (${how2}) — the socket is reopened at the same address${status ? `, busyness "${status}" restored` : ""}`,
    noHello: () => "the socket reopened at the same address gave no hello — another may have turned the address",
    watchdogAttached: () => "a watchdog attached",
    nobodyListens: (min) => `nobody has listened for ${min} min`,
    byDoerWord: () => "by the doer's word",
    refusedBeside: (beside, led, realm) => `Refused (bridge): the seat ${beside} stands on the bridge's shared channel beside ${led} — leaving would close the socket for all seats of the channel. To leave all — leave in the graph ${realm ?? "of the main seat"}; to remove only this seat — revoke.`,
    refusedOther: (realm, led, ledRealm) => `Refused (bridge): this bridge holds no seat in the graph ${realm} — nothing to leave; its seat ${led} in the graph ${ledRealm} is untouched.`,
    refusedNamed: (standing, led) => `Refused (bridge): ${standing} is not this bridge's seat, the call was not sent; leave releases only this bridge's seat${led ? ` (${led}, untouched)` : " (it holds no seat now)"}; a spare seat of your own account is removed by revoke(karta, standing=${standing}) — only on the user's word: revoke destroys the seat's incoming address and hooks.`
  }
};

// js/delivery/words/listen.ts
var LISTEN = {
  en: {
    block: (listen2) => `[verstak-bridge] The bridge holds this standing's socket — there is no one to hand it to (a line above saying no one listens describes the moment before this holding).
${listen2}
Busy line: ${tool("stand")}(realm, status) on this seat — an empty status clears it.
Frames also come as MCP notifications (logger verstak-channel).`,
    unheard: (listen2) => `[verstak-bridge] No watchdog is attached to this seat — frames pile up. ${listen2}`,
    monitor: (self, key2, where) => `under Monitor — node "${self}" watchdog ${key2}${where} with the largest timeout_ms, re-armed when it runs out (Claude Code)`,
    exit: (self, key2, where) => `as a background task — node "${self}" watchdog-exit ${key2}${where} (exits zero on the first message)`,
    codex: (self, key2, where) => `in Codex inside one long command of your shell — node "${self}" watchdog-codex ${key2}${where} & …; kill %1 (a frame enters the running thread through app-server; as a separate nohup command the watchdog dies with it)`,
    self: (pi) => `The ${pi ? "pi extension" : "OpenCode plugin"} listens itself — no watchdog needed, frames enter the turn.`,
    claude: (monitor, exit) => `Listen: ${monitor}; without Monitor — ${exit}.`,
    codexLine: (codex, exit) => `Listen: ${codex}; without the app-server door — ${exit}.`,
    any: (monitor, exit, codex) => `Listen: ${monitor}; ${exit}; ${codex}.`
  }
};

// js/delivery/words/lostplaces.ts
var LOST = {
  en: {
    satellite: (key2) => `Refused (bridge): the satellite's seat was lost in the machine daemon's change (${key2}) — a satellite seat has no holding record, and writes would go unattributed; the call was not sent. Stand again: ${tool("stand")} with satellite_of.`,
    seat: (key2, realm, why) => `Refused (bridge): the seat ${key2} (graph ${realm}) did not come back after the machine daemon's change (${why}) — writes would go unattributed; the call was not sent. Bring it back: ${tool("stand")} in that graph with the same name.`
  }
};

// js/delivery/words/machinestatus.ts
var MACHINE_STATUS = {
  en: {
    daemon: () => "daemon",
    absent: () => "daemon: no answer",
    unavailable: () => "session snapshot unavailable: older daemon build",
    missing: () => "daemon: directory does not exist",
    protocol: () => "daemon: different protocol",
    refused: () => "daemon: refused",
    snapshotFailed: () => "session snapshot unavailable: snapshot failed",
    sessions: () => "Sessions",
    fallback: () => "Bridges outside the daemon",
    disk: () => "Disk records outside the daemon snapshot",
    record: () => "record, liveness unknown",
    left: (left2) => left2 ? "left" : "not left",
    attached: () => "attached",
    detached: () => "detached",
    primary: () => "primary",
    beside: () => "beside",
    satellite: () => "satellite",
    listening: () => "listening",
    silent: () => "not listening",
    lastWork: () => "last graph call",
    unknown: () => "not observed"
  }
};

// js/delivery/words/moment.ts
var MOMENT = {
  en: {
    status: () => `[bridge] Busyness is set by ${tool("stand")}(realm, status) on a seat the bridge already holds — the main move; action="status" (realm, text up to 64 characters) is the former one, kept for compatibility: the bridge, the socket holder, executes it, the call does not go to the server; an empty text clears; a surface refusal comes whole.`,
    leave: () => `[bridge] action="leave" (realm) — leave the seat: the bridge executes it — the socket is closed, busyness cleared, address, queue and hooks intact; mail piles up and arrives on return (the watchdog or ${tool("stand")}). For a subagent's satellite seat the leave is total: the seat is released whole, mail does not pile up, there is no return — standing again is only ${tool("stand")} with satellite_of. The bridge itself leaves only where a frame reaches only through a watchdog (Claude Code, Codex) and the watchdog has not been armed for 15 minutes; in pi and OpenCode a frame comes as a notification, and the bridge does not abandon the seat. Busyness clears at the end of the session.`,
    formerMoments: () => [
      "[bridge] The writing skill's moment: before each node, name the reader, what will change retrieval and what is new here; type and given_as, the three modes as claims, a thesis name, arrows with sense; the body is present knowledge, never provenance: who said it, when, by whose hand — lives in the node's history and in the case, a node is rewritten, not appended with a section; hint is a transformation's seed: only what matters after the session, not a log; a question to a neighbour and a wait are a vimarsha with `posed_to`, not a case line; the CHECKS lines in the reply are this beat's work."
    ]
  }
};

// js/delivery/words/names.ts
var NAMES = {
  en: {
    overLimit: (length) => `over the limit: ${length} signs`,
    capitals: () => "capital letters are not allowed",
    badSigns: () => "signs not allowed, or the first sign is neither a letter nor a digit"
  }
};

// js/delivery/words/narrow.ts
var NARROW = {
  en: {
    outsideSet: (name2, list3) => `Refused (bridge): the tool ${name2} is not in this bridge's set (${list3}) — the set comes from --tools in the bridge entry.`
  }
};

// js/delivery/words/oauth.ts
var CALLBACK_EN = {
  loginUnreachable: (error) => `<h3>verstak-bridge: the sign-in page could not be reached (${error}) — reload this page.</h3>`,
  anotherTab: () => "verstak-bridge: another tab is finishing this login — you can close this one.",
  refused: (err) => `verstak-bridge: authorization failed (${err})`,
  stillRunning: () => "verstak-bridge: the code arrived and the exchange is still running — watch the agent.",
  failed: (failure) => `verstak-bridge: authorization failed (${failure}) — nothing was stored; the agent has the details.`,
  authenticated: () => "verstak-bridge: authenticated — you can close this tab.",
  abandoned: () => "verstak-bridge: the login was abandoned — nothing was stored.",
  loginOver: () => "verstak-bridge: this page belongs to a login that is over — open the link the agent gave you."
};
var CALLBACK = { en: CALLBACK_EN };
var DEVICE_CLIENT = {
  en: {
    bareRefusal: (id, status) => `the sign-in server refused a sign-in code to the client ${id}: ${status} with no word why — a move for the operator of the sign-in server`,
    namedRefused: (id, word3) => `the sign-in server refused the client ${id} named by VERSTAK_BRIDGE_DEVICE_CLIENT (${word3}) — fix the variable or the client on the server`,
    unset: (id) => `sign-in by code is not set up on this server: there is no client ${id} — a move for the operator of the sign-in server`
  }
};

// js/delivery/words/orchestra.ts
var ORCHESTRA = {
  en: {
    usage: () => "usage: orchestra <on|off|status|step> [--realm <graph>]… [--auth-dir <dir>] [--lang en]\n",
    noDaemon: () => "the machine daemon is not running — the orchestrator lives by the daemon and its local entrance; raise a bridge (any harness session raises the daemon) and retry",
    doorSilent: () => "the daemon's entrance did not answer in time — the daemon is alive but busy or older than orchestra; retry later",
    unknownOp: (op) => `orchestra: unknown op ${op}`,
    doorError: (message) => `the daemon's entrance answered with an error: ${message}`,
    notAdmitted: () => "the machine has not admitted the orchestrator: the daemon's consent is the VERSTAK_ORCHESTRA=1 environment variable of its own process; without it raising agents is refused and the flag is not moved",
    on: (realms) => `the orchestrator is on${realms ? `, named boundary: ${realms}` : " (the boundary is the graphs of the machine's live agents)"}; the flag lies next to the grant`,
    onShortRealm: (realms) => `the boundary is not taken: ${realms} — the short rN form does not ride the REST doors of the api (live probe: 404 "Realm not found"); name the graph by its full address — the owner's handle/slug from the list of graphs`,
    off: () => "the orchestrator is off; raised agents live out their own path — the switching off itself extinguishes none",
    status: (on, realms, found, tact) => on ? `on; named boundary: ${realms || "—"}${found ? `; graphs of the machine's live agents: ${found}` : " (plus the graphs of the machine's live agents)"}${tact ? `; tact: ${tact}` : ""}` : `off${tact ? `; tact: ${tact}` : ""}`,
    stepEmpty: () => "the tact is empty: the orchestrator is off or the boundary is empty — no named graphs and no live places on the machine",
    step: (parts) => `the tact passed: ${parts}`,
    tactRealm: (realm, invites, signals, causes) => `${realm}: invites ${invites}, signals ${signals}${causes ? ` (${causes})` : ""}`,
    stepReadError: (realm, why) => `the tact is refused whole: ${realm} did not read (${why}) — no cursor moved, no stop order went out`,
    stepUnresolvedRealm: (realm, why) => `the tact is refused: ${realm} — a live place's graph is named by its short form and the realm list does not resolve it (${why}); the boundary is incomplete, no cursor moved`,
    stepNoApi: () => "the tact is refused: the api address is unknown — the daemon holds no live channel and no hold records; the channel (the connect answer) carries the api address, not the mcp server",
    stepGone: () => "the tact commits nothing: the caller left before its end — the refusal has already been spoken, no cursor moved",
    tactOut: (realm, invites, signals, cursor, at3) => `${realm}: invites ${invites}, signals ${signals}, cursor ${cursor || "—"} (${at3})`
  }
};

// js/delivery/words/owner.ts
var OWNER = {
  en: {
    refused: (what, env2) => `Refused (bridge): ${what} is the owner's role (主). An agent does not take it without the user's word; the user's word is the setting ${env2}=1 in the bridge's environment, set by the user. Stand in your own role (karta) — the one the user or AGENTS.md named as the agent's.`,
    human: (karta) => `karta="${karta}" is the user's own role`,
    unread: (seq3, why) => `Refused (bridge): the type of role #${seq3} could not be read (${why}) — the owner's role is not taken unchecked; retry.`,
    incomplete: () => "the list of the owner's roles is incomplete"
  }
};

// js/delivery/words/places.ts
var PLACES = {
  en: {
    anotherSeat: () => "another seat of the graph",
    graph: () => "graph",
    unmatched: (frame2, standingId, to, realm, several, key2) => `DOER: frame ${frame2} (to_standing_id ${standingId}, ${to}, graph ${realm}) matches no seat of the bridge (${several ? "several fit" : "none fits"}) — given to the main seat ${key2}; check the frame's address.`
  }
};

// js/delivery/words/realms.ts
var REALMS = {
  en: {
    unresolved: (realm, held2) => `Refused (bridge): the bridge did not resolve the graph "${realm}" to a full address (there is no list of graphs, or the name is not in it or not once) — whether it is the graph of the bridge's seats (${held2}) is unknown, and guessing is not allowed. Repeat the call with the full graph address from ${tool("realm")}(action="list").`
  }
};

// js/delivery/words/releases.ts
var RELEASES = {
  en: {
    reset: (iso2, min) => `reset ${iso2} (in ${min} min)`,
    noReset: () => "GitHub did not name the reset time",
    perHour: (limit) => `${limit} requests an hour`,
    anyHourly: () => "an hourly limit",
    exhausted: (per, reset) => `the anonymous GitHub API limit is exhausted: ${per} per the machine's external address, shared by all bridges and clients behind it; ${reset}`,
    secondary: (reset) => `GitHub API secondary limit: too frequent requests from the machine's external address; ${reset}`,
    recordedByOther: (reset) => `a GitHub API limit recorded by another bridge of the machine; ${reset}`,
    httpFrom: (status, url) => `HTTP ${status} from ${url}`,
    noTag: (status, url, location) => `HTTP ${status} from ${url}${location ? ` → ${location}` : ""} — no tag`,
    fromPage: (apiError, tag) => `releases: the API did not answer (${apiError}) — tag ${tag} from the releases page`,
    fallback: () => "fallback"
  }
};

// js/delivery/words/resume.ts
var via = tool("stand");
var RESUME = {
  en: {
    failed: () => "the return to the seat failed",
    returnedParked: (pending2) => pending2 === null ? "the return to the seat the bridge had left; hello did not come in 4 s" : `the return to the seat the bridge had left (frames waiting — ${pending2})`,
    legacy: (n) => `there is a seat of an earlier build without a session: ${n} — to bring it back: ${via}(name="${n}")`,
    noRecord: (key2, cwd) => `there is no own hold record ${key2 ? `with the key ${key2}` : `for the directory ${cwd ?? "?"}`}`,
    rejoin: () => `the seat may have expired at the platform and left its cases — after ${via} join again the cases that wait for you: ${tool("case")}(action="join", room="#N")`,
    foreignDir: (foreign) => `the directory holds records of seats this session did not stand on (${foreign}); they are not taken by directory alone, ${via} will take the seat`,
    neighbourKey: (keys) => `another session stood on the seat ${keys} — a return does not take a neighbour's seat; ${via} will take your own`,
    left: (left2) => `the seat was released by the holder's word (leave): ${left2} — it will not return by itself, to bring it back: ${via} with the same name`,
    staleKey: (stale, fresher) => `the seat ${stale} is not taken by the return: this session has a fresher record in the same role — ${fresher}; to bring the seat back: ${via}(name="${fresher}"), the former one — ${via}(name="${stale}")`,
    alreadyHolding: () => "the bridge already holds this seat",
    byRecord: () => "return by record",
    otherSeat: (key2, led) => `${key2}: the bridge leads another seat ${led}`,
    liveBridge: (key2) => `${key2}: held by a live bridge`,
    ownNotTaken: (key2, why) => `${key2}: a former bridge of this session holds it, taking it failed — ${why}`,
    noHello: (key2) => `${key2}: hello did not come — the record is intact, the watchdog will repeat the return; if you do not wait — ${via}`,
    stale: (key2) => `${key2}: the record went stale — ${via} will take the seat`,
    registerRefused: (text2) => `register refused — ${text2}`,
    othersInDir: (others) => `the same directory holds records of other seats too: ${others}`,
    notYours: () => `the seat is not yours — ${tool("channel")}(action="leave") will release it, the channel stays intact`,
    nothingToReturn: (skipped) => `nothing to return — ${skipped}`,
    noKeyNoCwd: () => "neither key nor cwd was passed",
    noSeatNoKeyNoCwd: () => "no seat, and neither key nor cwd was passed",
    leftByWord: (key2) => `the seat ${key2} was released by the holder's word (leave) — the watchdog does not raise it; to bring it back: ${via} with the same name`,
    watchdogReason: () => "the hearing watchdog",
    boardUnread: (text2) => `the board could not be read — ${text2}`,
    noSeatOnBoard: () => "the own seat is not on the board",
    listening: () => "listening",
    gaveUp: (key2, limit) => `Verstak: the board reads the seat ${key2} as not listening and after ${limit} socket reopenings — I no longer tear it; check the board and the server, to restore hearing — ${via} with the same name: it leaves another session on the seat alone and stands beside; take=true: ${TAKE.en.rule()}.`,
    deafBoard: () => "the board does not read it as listening",
    reopened: (pending2) => pending2 === null ? "the socket is reopened, hello did not come in 4 s" : `the socket is reopened: frames waiting — ${pending2}`,
    busyRestored: (kept3) => `; busy line restored: ${kept3}`,
    busyNotRestored: (body) => `; busy line not restored: ${body}`,
    busyForeign: () => "; the former busy line is not restored — say your own",
    fromDisk: (pending2, busy) => `the seat returned from disk after the bridge restarted — the socket reopened at the same address (frames waiting — ${pending2})${busy}`
  }
};

// js/delivery/words/rituals.ts
var ruleEn = (section) => `the rule is the verstak skill's align method, "${section}"; the sample is its references/align-harness-surfaces.md`;
var RITUALS = {
  en: {
    usage: () => "node verstak-bridge.mjs check-rituals [repo...] [--json] [-- repo...]   (.opencode/plugins write into no session of another directory and do not break; no repo — the current directory)",
    fixScope: (section) => `fix: the event-stream subscriber takes the event's directory (location.directory of the event or its data), canonicalises it and ctx.location.directory (realpath, the string on failure, no trailing separator) and skips a foreign one; ${ruleEn(section)}`,
    fixBroken: (section) => `fix: a tool hook runs in its own session as written — its names defined, only the guard throws, on a memory path; ${ruleEn(section)}`,
    notChecked: (file, error) => `not checked  ${file}: ${error}`,
    noSubscription: () => " (no event-stream subscription — tool hooks only)",
    hole: (file) => `HOLE  ${file}`,
    foreignWrites: (count) => `  writes into a session of another directory: ${count} writes on session.created — that session gets this repo's addresses`,
    lostSpelling: (mine, twin) => `  its own session under another spelling of the folder gets no greeting (the real path: ${mine}, the instance's spelling: ${twin}) — directories are compared as raw strings, while one folder comes as /tmp/… and as /private/tmp/…`,
    mute: () => "  subscribed to the event stream, yet its own root session got no greeting — the instance's directory is not taken from ctx.location.directory (Context has no ctx.directory) or the condition drops its own",
    broken: (hit) => `  a tool hook breaks in its own session (the plugin is run as is) — ${hit}`,
    unknownFlag: (flag) => `unknown flag ${flag} (a directory of that name — ./${flag} or after --)`,
    noDir: (dir2) => `no such directory: ${dir2}`,
    noPlugins: () => "no plugins in .opencode/plugins"
  }
};

// js/delivery/words/rooms.ts
var ROOM = {
  en: {
    said: (author) => `message from ${author}`,
    saidPending: (author) => `message from ${author} in flight — the text follows`,
    aside: (author, addressee, word3) => `${author} → ${addressee}: message [${word3}]`,
    asideRun: (author, addressee, count, word3) => `${author} → ${addressee}: ${count} (last [${word3}])`,
    asideBody: (author, addressee, word3) => `${author} → ${addressee}: text of message [${word3}]`,
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
    progress: (key2, done, verdict, note4, author) => `[${key2}] [${done}] = ${verdict}${note4} · ${author}`,
    opened: (author) => `case opened by ${author}`,
    joined: (who) => `entered ${who}`,
    left: (who, reason) => `left ${who}${reason ? `; reason: ${reason}` : ""}`,
    invite: (author, who) => `${author} invites ${who} to the case`,
    withdraw: (author) => `invitation withdrawn by ${author}`,
    retract: (author, answer2, afterAck) => `answer [${answer2}] retracted${afterAck ? " after acceptance" : ""} by ${author}`,
    node: (seq3, name2, realm, reasoning) => `node #${seq3} ${name2} (${realm}) in the case${reasoning}`,
    nodeUpdated: (seq3, name2, reasoning) => `node #${seq3} ${name2} updated${reasoning}`,
    nodeDeleted: (seq3, name2, reasoning) => `node #${seq3} ${name2} deleted${reasoning}`,
    nodeUndeleted: (seq3, name2, reasoning) => `node #${seq3} ${name2} restored${reasoning}`,
    link: (room, rel) => `case linked to case #${room} (${rel})`,
    auto: (code, room) => `platform record ${code} about case #${room}`,
    unknown: (kind) => `kind ${kind} is unknown to the bridge`,
    case: (room) => `case #${room}`,
    replyTo: (id) => `in reply to [${id}]`,
    stale: () => "stale",
    bodyRead: (how2) => `body: ${how2}`,
    whoHuman: (user) => `user${user}`,
    whoRole: (karta) => `role #${karta}`,
    whoSibling: (karta) => `sibling of role #${karta}`,
    whoPlatform: () => "platform — a wake-up",
    whoGraph: () => "graph event",
    legacy: (kind, stack) => `kind ${kind}${stack ? ` · ${stack}` : ""}`
  }
};
var ROOM_AUTO = {
  en: {
    child_opened: (room) => `child case #${room} opened`,
    child_closing: (room) => `child case #${room} is closing`,
    child_closed: (room) => `child case #${room} closed`,
    child_late_objection: (room) => `late objection in child case #${room}`
  }
};
var ROOM_REL = {
  en: {
    parent: () => "its child",
    child: () => "its parent",
    continues: () => "continues it"
  }
};
var VERDICT = {
  en: { ok: () => "ok", partial: () => "partial", bad: () => "slop" }
};

// js/delivery/words/runend.ts
var RUN_END = {
  en: {
    pluginEnd: () => "the run's end on the plugin's word"
  }
};

// js/delivery/words/satellite.ts
var SATELLITE = {
  en: {
    empty: () => "empty",
    notSeatName: (of, fault) => `Refused (bridge): satellite_of "${of}" is not a seat name (${fault}); pass the caller's seat as the board prints it: @handle:name.`,
    noCaller: (of) => `Refused (bridge): the caller's seat ${of} is not on this graph's board — the satellite has nothing to stand beside; check satellite_of and the graph in the brief.`,
    ambiguous: (count, base) => `Refused (bridge): ${count} seats on the board carry the name ${base} — pass satellite_of as the full address @handle:name.`,
    alreadyHolds: (led) => `the bridge already holds ${led} — a repeat of this run or a parallel run with the same bridge entry (the same agent file or another with the same entry), which shares this seat and loses it when the first one ends; in parallel — no more than one run per bridge entry`,
    nameCut: (base, n, max, name2) => `the name ${base}.sub-${n} is longer than the ${max}-sign limit — the base is cut: ${name2}`,
    allTaken: (caller) => `Refused (bridge): every satellite .sub-1…99 of the seat ${caller} is taken — clear the dead seats of former runs.`,
    needSatelliteOf: () => "Refused (bridge): this is a satellite bridge — it takes only a subagent's satellite seat; pass satellite_of — the caller's seat (@handle:name) from the brief.",
    notSatellite: () => "Refused (bridge): satellite_of is for a satellite bridge only (a bridge entry with --satellite in the agent file); this is a session bridge, and a satellite seat on it would take the caller's voice. A subagent without a bridge of its own has a limit: it speaks as the caller's seat and names itself in its lines.",
    derivesName: () => "Refused (bridge): the bridge derives the satellite's name — name, take and room do not go with satellite_of.",
    boardUnread: (text2) => `Refused: the board did not read — ${text2}`,
    claimsUnsure: (unsure, name2) => `satellite name claims on this machine did not hold the pick (${unsure}) — the name ${name2} was picked by the board: uniqueness is not guaranteed, a satellite bridge standing at the same moment may have taken the same name`,
    seat: (caller, karta, ttl) => `satellite seat of ${caller}: role #${karta}, channel idle window ${ttl} s, no holding record — the seat lives by the run`,
    noCallerId: (caller) => `the board did not print the id of ${caller} — the satellite sign (satellite_of) was not sent to the platform: the seat may inherit the role's undelivered mail`,
    bypass: (action) => `Refused (satellite bridge): ${action} bypassing ${tool("stand")} — only ${tool("stand")} with satellite_of gives this bridge a seat; a satellite neither takes nor releases another's seat.`,
    onlyOwn: (action, own, karta, realm) => `Refused (satellite bridge): ${action} — only its own seat ${own} (role #${karta}, graph ${realm}); a satellite neither takes nor releases the caller's seat or any other.`,
    listen: (ttl) => `[verstak-bridge] Satellite seat: do not arm a watchdog — the seat lives by the subagent's run and signs its records; when the run ends the bridge leaves the seat itself, the channel dies after the ${ttl} s idle window. The first move — enter the case the brief names and retell the brief as your first message in it.`
  }
};

// js/delivery/words/satprobe.ts
var SAT_PROBE = {
  en: {
    loginAdvice: () => `log in: call any ${TOOL_PREFIX}* tool in the main session and open the login link from its answer (or put a personal token in ~/.verstak-bridge/token — the verstak skill, its establish-mcp method), then repeat doctor`,
    exited: (code) => `exited with code ${code}`,
    refusalLogin: (label, what, advice) => `probe "${label}": ${what} — the satellite is not logged in: the machine grant is dead or revoked → ${advice}`,
    refusal: (label, what, msg) => `probe "${label}": ${what} returned a refusal: ${msg} → do what the refusal says and repeat doctor`,
    silent: (secs2) => `silent for ${secs2}s`,
    oldFlag: (flag) => ` — it seems the home bridge is older than the ${flag} flag → node ~/.verstak-bridge/verstak-bridge.mjs update`,
    runByHand: () => " → run this command by hand and read what it writes to stderr",
    noInit: (label, why, stderrNote, old) => `probe "${label}": the bridge did not answer initialize (${why}${stderrNote})${old}`,
    noList: (label, name2, version, exited) => `probe "${label}": initialize answered (${name2} v${version}), tools/list did not (${exited ?? "silent"}) → run the command by hand and read its stderr`,
    answered: (label, name2, version, tools) => `probe "${label}": the bridge answered — ${name2} v${version}, tools ${tools}`,
    schema: (tool2, bad) => `tool ${tool2}: the schema carries ${bad} at the top level — the server hands out a schema the Anthropic API will reject ("input_schema does not support oneOf, allOf, or anyOf at the top level"), and the whole subagent run fails, not just this tool → the server fixes this, not the agent file or the bridge (the bridge passes the schema as is): tell the MCP server operator the tool name — whoever holds the address from the "server" line above — and wait for their update, then repeat doctor`,
    winKilled: (label, secs2) => `probe "${label}": the bridge did not leave on closed stdin within ${secs2}s — killed forcibly → repeat doctor; if it was renewing the token, a login may be needed again`,
    sigKilled: (label, secs2) => `probe "${label}": the bridge left neither on closed stdin nor on SIGTERM within ${secs2}s — killed with SIGKILL → repeat doctor; if it was renewing the token, a login may be needed again`
  }
};

// js/delivery/words/separate.ts
var probe = (base) => `ask it by word — ${tool("channel")}(action="send", standing=${base}, text="alive? what do you hold?") — and wait up to 5 minutes for the answer: it answered — agree, do not take its cases; it is silent — ${tool("stand")}(name=${base}, take=true) and enter its cases (${tool("case")}(action="mine", standing=${base})); do not ask the user`;
var HOLDER = {
  live: "another live session of your own name (the same role, the same account)",
  record: "another session of your own name (the same role, the same account; its bridge does not answer here — the probe tells whether it is alive)",
  board: "another session of the same role"
};
var SEPARATE = {
  en: {
    ownSession: (base) => `the seat ${base} was held by a former bridge of this same harness session (a restart or a compaction) — this session's own seat, the bridge took it back itself`,
    beside: (base, name2, own, kin) => `${kin ? HOLDER[kin] : "another session"} holds the seat ${base} — leaving its seat alone and not signing with it; standing beside as ${name2} with hearing${own ? " (a former bridge of this same session held it — taken back)" : ""}: it is this session's own seat, its frames come here; ` + (kin === "board" ? `check the holder's account on the board against your own seat's address: the same — ${probe(base)}; another — evicting that session (take=true) only on the user's word` : kin ? probe(base) : `evicting that session (take=true): ${TAKE.en.rule()}`),
    unknown: (name2) => `Refused (bridge): the board was not read in full — the bridge does not know whether another session listens on the seat ${name2}; not standing blind and not advising take=true. Repeat when the board reads, or pass another name.`,
    noFree: (base) => `Refused (bridge): another session holds the seat ${base}, and every seat beside ${base}.2…99 is taken — the bridge will not sign with another's seat without hearing; clear the dead seats or pass another name.`
  }
};

// js/delivery/words/stalebatch.ts
var STALE = {
  en: {
    head: (count, shown) => `Stale frames: ${count}` + (count > shown ? `, the first ${shown} here, ${count - shown} left out` : "") + ` — taken while the seat was not listening, or the service repeating after a session rebuild; those addressed to the seat as text, the rest by count; in full — by the case lines below, the rest — ${FRAME_TEXT.en.myCases()}.`
  }
};

// js/delivery/words/stand.ts
var s = (ms2) => Math.round(ms2 / 1e3);
var left = (window, waited) => Math.ceil((window - waited) / 1e3);
var STAND = {
  en: {
    needRealmKarta: (tail2) => `Refused (bridge): ${tool("stand")} needs realm and karta — the graph and the role from AGENTS.md or the launch line.` + tail2,
    badCwd: (cwd, relative) => `Refused (bridge): cwd must be an existing absolute directory — got "${cwd}"${relative ? " (a relative path would resolve against the bridge's cwd, not the session's)" : ""}.`,
    badName: (asked, fault, max) => `Refused (bridge): name "${asked}" — ${fault}; the name rule: lowercase latin letters, digits, dot, underscore, hyphen, the first sign a letter or digit, at most ${max} signs. A name is never cut silently: a shorter name would address another seat.`,
    cutPart: (k) => k === "repo" ? "repo" : k === "host" ? "host" : "model",
    nameCut: (full, max, name2, what) => `the derived name ${full} is longer than the ${max}-sign limit — cut to ${name2} (dropped: ${what}); want another — pass name`,
    noModel: () => "model not passed — the name has no third part (host.repo): a second session of this machine over this repository lands on the same seat; pass model to tell them apart",
    legacy: (address, realm, karta) => `a seat of the former name ${address} is alive on the board — cases and hooks may hold its address; remove it: ${tool("channel")}(action="revoke", realm="${realm}", karta="${karta}", standing="${address}")`,
    boardUnread: (text2) => `Refused: the board did not read — ${text2}`,
    boardUnknown: (start, own, others) => `Refused: the board's form is not recognized — no "${own}" header${others ? ` ("${others}")` : ""}, no word about an empty graph, no seat lines; no controlling moves (connect, knock) on a guess. The answer begins: ${start}`,
    boardAmbiguous: (n, name2, karta) => `Refused: the board has ${n} seats named ${name2} for role #${karta} — the form is ambiguous, the state cannot be told.`,
    boardCount: (declared, parsed) => `Refused: the board declares ${declared} seats, ${parsed} were read, and your own is not among them — the unread line may be it, or a seat another session listens on; connect would rotate it blind, and take=true would take it. Repeat when the board reads, or stand under another name.`,
    boardCountFound: (declared, parsed) => `The board declares ${declared} seats, ${parsed} were read — the parser missed a line; your own seat is found, going on.`,
    refused: (what, text2) => `Refused: ${what} — ${text2}`,
    noIdInRegister: () => "register did not name the seat's id — the seat's frames are found by graph and address; the busy line waits for the id.",
    modelNotCleared: (why) => `The seat's earlier model is not cleared (${why}): the harness named no model, and the board may still show the earlier one.`,
    howBeside: (led) => `a seat of another graph — stands beside on the channel this bridge holds (${led}): register`,
    howReturned: () => "back to the seat the bridge had left — the socket reopened at the same address, register",
    howOwnSession: () => "this session's own seat — taken back: a former bridge of this same harness session held it, connect (the socket is now this bridge's, the former one got 4000) and register",
    otherHolder: (holder) => `Refused (bridge): another holder listens on the seat ${holder} — the bridge will not sign with it without hearing; stand on your own seat: ${tool("stand")} without name or with another name.`,
    howRegister: () => "this bridge already holds the socket — register",
    ttlRefused: (ttl, text2) => `The contour refused the ${ttl} s idle window (${text2}) — the seat is taken with the contour's default window.`,
    takenButRegister: (text2) => `The seat is taken, but register refused — ${text2}`,
    howConnect: (mine, listensElsewhere, take3) => mine ? listensElsewhere ? "another holder listened on the seat — connect by take (the socket is now this bridge's, the former holder got 4000) and register" : take3 ? "connect by take — a new entry cycle, the knock count reset — and register" : "the seat was there — connect (the socket is now this bridge's) and register" : "connect and register",
    head: (place, karta, realm, how2) => `[${tool("stand")}] standing ${place} — role #${karta}, graph ${realm}: ${how2}.`,
    note: (text2) => `[${tool("stand")}] ${text2}`,
    noWatchdog: () => "No watchdog command: the bridge does not hold this seat's socket yet — this session takes no frames and no invitations until the seat is back.",
    noSocket: () => "The bridge holds no socket — nothing to listen with; check the connect answer.",
    besideNoDoor: () => "The seat is recorded, but it has no door — the bridge's channel socket is not alive; this graph's frames will not come here.",
    besideHeard: () => "This bridge holds the channel socket — this graph's seat frames go to its watchdog.",
    heldAlready: () => "This bridge holds the socket (hello came when the socket opened).",
    hello: (pending2) => `hello received: frames waiting — ${pending2}.`,
    noLocalSocket: (why) => `BUT the standing's local socket is not up (${why}) — the watchdog has nothing to attach to: no hearing in this session, the watchdog command above will not work. The seat is held, records are signed; tell the user.`,
    noHello: () => "no hello within 4 s — the bridge holds the socket, but there is no proof of hearing yet: check the board.",
    knockNotHere: (room) => `The user's seat ${room}: no knock sent — the bridge does not hold this seat's socket yet, the user's answer would not come here; knock with the same call once the seat is back.`,
    knockTwice: (room) => `The user's seat ${room}: knocked twice, no invitation — no more knocks this time; tell the user their seat did not answer and ask them to open the chat (a new entry resets the count: take=true or a new session).`,
    knockSent: (room, waited, window) => `The user's seat ${room}: a knock went ${s(waited)} s ago — wait for the invitation; a deliberate repeat — the same call with repeat_knock=true, not before ${s(window)} s.`,
    knockEarly: (room, waited, window) => `The user's seat ${room}: too early to repeat — ${s(waited)} s since the first knock, the rule waits ${s(window)} s; repeat in ${left(window, waited)} s.`,
    knockNoRole: (room, realm) => `The user's seat ${room}: the board of graph ${realm} does not have it, and send needs its holder's role — no knock sent. The user's seat lives by their presence: either they have been away past the threshold (ask them to open the chat and repeat), or pass room_karta=<the user's role>.`,
    knockRefused: (room, text2) => `The user's seat ${room}: the knock was refused — ${text2}`,
    knockDone: (room, again, text2) => `The user's seat ${room}: ${again ? "repeated " : ""}knock sent — ${text2} Wait for the first message from the user's seat with its header; do not write there before it — you will stand beside the user when it comes.`,
    statusElsewhere: (takePath) => `The busy line is not published: the bridge has no status address for this standing — the socket's holder has it; ${takePath}.`,
    statusRefused: (body, guidance) => `The busy line was not accepted: ${body}${guidance}`
  }
};

// js/delivery/words/standing.ts
var STANDING = {
  en: { seatExpired: () => "the seat expired at the platform — register: no such seat" }
};

// js/delivery/words/standings.ts
var STANDINGS = {
  en: {
    notDir: (dir2) => `${dir2} is not a directory`,
    otherUser: (dir2) => `${dir2} belongs to another user`,
    openToOthers: (dir2) => `${dir2} is open to group or others`
  }
};

// js/delivery/words/standmiss.ts
var ONLY_EN = "Without karta the call only sets the busy line of the seat this bridge leads";
var STAND_MISS = {
  en: {
    none: () => `${ONLY_EN} in this graph — there is none.`,
    args: (args) => `${ONLY_EN}, and the call carries ${args} — that is taking a seat; for the busy line alone — only realm and status.`,
    name: (asked, held2) => `${ONLY_EN}: the call names ${asked}, and the bridge holds ${held2} here — name it or leave name out.`,
    satellite: (of) => `${ONLY_EN}: the bridge's seat is not a satellite of ${of}.`,
    cwd: (cwd) => `${ONLY_EN}: the directory ${cwd} does not exist or is not absolute.`,
    parked: () => `${ONLY_EN}, and this bridge left its seat by word (leave): return by ${tool("stand")} with karta under the same name.`,
    elsewhere: () => `${ONLY_EN}, and the bridge has neither the socket nor the status address of this seat — the seat's socket is not with this bridge: the seat waits for its return from disk, or the socket was released (dead token, revoke); take the seat by ${tool("stand")} with karta.`
  }
};

// js/delivery/words/standmoves.ts
var STAND_MOVES = {
  en: {
    standsInRealm: (realm, call, board, leave, roleOpen) => `Refused (409): this bridge's channel already stands in the graph ${realm} with another seat — the platform holds no second seat of one channel in one graph. ` + (call ? `Stand as it: ${call}${roleOpen ? ` — the seat's karta is in its line on the board ${board}` : ""}. ` : `Its name is this channel's line on the board ${board}; stand as it: ${tool("stand")}(realm="${realm}", karta, name=<that name>). `) + `If a new name is what you need, release the former one first: ${leave}, then repeat the call.`,
    standAgain: (call) => `The bridge does not hold this session's seat now — take it with the full call: ${call} (status can go in the same call).`,
    priorReleased: (prior) => `this session's former seat ${prior} is revoked: take moves the session to the taken seat, it does not add a second one`,
    provisionalReplaced: (prior) => `the auto-seating's seat ${prior} is replaced: it was provisional — the explicit call stood on the named one and revoked it`,
    priorKept: (prior, text2, revoke) => `this session's former seat ${prior} is not revoked (${text2}) — while it lives, cases will ask for from_standing; revoke it: ${revoke}`,
    besideHoldsMain: (prior, asked, beside, revokes, keep) => `Refused: seats beside in other graphs stand on this session's main seat ${prior} — ${beside}. Moving to ${asked} would open a new channel: the seats beside would lose hearing, and ${prior} would not be revoked while they stand. Nothing was touched. Move: revoke the seats beside first — ${revokes}, then repeat the call; or keep the former name: ${keep}.`,
    reissueWaited: (seconds2, own) => own ? `yours — returned: the bridge itself was reopening this seat's socket at that moment, the call waited for its outcome (${seconds2} s)` : `this seat's socket was just reopened — the call waited out the platform's threshold (${seconds2} s) and took the seat`,
    moveUndone: (asked, prior) => `The move did not happen: the seat ${asked} just taken is revoked, the session stays on its former seat ${prior} — its only one.`,
    moveNotUndone: (asked, text2, revoke) => `The seat ${asked} just taken could not be revoked (${text2}) — revoke it: ${revoke}`
  }
};

// js/delivery/words/standtool.ts
var STAND_TOOL = {
  en: {
    description: () => `[bridge] Take a standing in one call: the bridge reads the board, derives the name (machine.repo.model), takes the seat (connect and register; only register if this bridge already holds the socket), with room knocks a join frame into the user's seat by the full address from the wire (a repeat — only repeat_knock=true, once, no sooner than 2 minutes) and returns the name, the watchdog command, the number of waiting frames and the knock receipt. Read the role queue with ${tool("orient")}(focus=role) on entry and when occasion calls; frames go to the addressee and case participants. A seat in another graph stands beside on the same channel (register): the session hears all its graphs, and a write in each is signed by that graph's seat. Then — start the watchdog with the command from the reply and wait. It is also the busyness move: on a seat this bridge already holds, a call with realm and status (karta and name — the same or omitted; with model, room or take it is a seat-taking and a check) only sets the busyness line — no board, connect, register or knock; an empty status clears; the former ${tool("channel")}(action="status") is kept for compatibility. The bridge executes the tool; if it is not in the session, the tools go past the bridge or the bridge is an old build (doctor will say), stand by the verstak skill's collaborate method.`,
    realm: () => `Graph address: the full address from ${tool("realm")}(action="list") or rN; a bare name only for a graph of your own.`,
    karta: () => "The agent's role (#N from AGENTS.md or the launch line). Needed to take a seat; for busyness on a held seat it may be omitted.",
    name: () => "Your own half of the standing's name; without it machine.repo.model is derived — the model from the model parameter.",
    room: () => "The user's seat address @handle:name (the user's window gives it); the bridge knocks a join there to stand beside the user.",
    model: () => "The model the agent runs on (id or name, for example claude-opus-5 or opus-5) — the third part of the derived name; without it the name is machine.repo.",
    muteSiblings: () => "Do not hear the echo of other standings of the same role.",
    take: () => `A deliberate move: to displace a live holder of ANOTHER session — of your own name (the same role, the same account) by yourself when it stays silent 5 minutes to a probe by word (${tool("channel")} send), of another's (another role or account) — only on the user's word (without take a name, derived or explicit, that another session holds stands beside on name.N with hearing; the bridge takes back by itself a seat a former bridge of this same harness session holds — no take needed); or to change this bridge's seat in a graph (one seat per bridge in a graph: another role or another name without take is a refusal aloud, the former seat stays on the board without hearing). A seat in another graph does not need take — it stands beside.`,
    roomKarta: () => "The role of the user whose seat it is (#N) if the seat is not on the board; usually the role of the user who sent the seat address.",
    repeatKnock: () => "A deliberate repeat of the knock at the same user seat: allowed once and no sooner than 2 minutes after the first; without it a repeated call sends no second join.",
    satelliteOf: () => "Only for a subagent's satellite bridge (the bridge entry with --satellite in the agent file): the caller's seat @handle:name from the brief. The bridge stands beside as the satellite seat <caller's name>.sub-N (the first free N), with the role from karta (the brief names it, the caller's role is not inherited); the seat lives for the run. name, take and room are not passed with it.",
    status: () => "The seat's busyness, up to 64 characters: on taking — the first line; on a seat this bridge already holds — the main way to update busyness (the call sets only it); an empty string clears.",
    cwd: () => "The harness session's directory, an existing absolute path — the repo for the name is derived from it (git toplevel, in a linked worktree — of the main copy, otherwise its basename) and branches are read when looking for seats of the former name, when the bridge is not started from the working copy; the OpenCode plugin supplies it itself. Without it — the bridge's cwd; a nonexistent or relative one is a refusal aloud."
  }
};

// js/delivery/words/status.ts
var TAKE_PATH_EN = `${tool("stand")} with take=true (${TAKE.en.rule()}) moves the hearing and the status address here ONCE: the address stays with THIS bridge instance, and a watchdog raised after it does not carry it off — by design: the watchdog is a local client of the socket and makes no connect of its own. The former holder gets close 4000 (the evicted one need not take the seat back the same way — it gets a seat beside, name.N); connect does not touch the seat's incoming address and queue, what waited comes in hello (help: ${tool("channel")} action="?", connect); after the move re-arm the watchdog with the command from the answer`;
var TWO_ENTRIES_EN = `If the seat is yours and a bridge of this same session holds it (the session has two verstak entries, the plugin's and the user's), call status with the same tool set you called ${tool("stand")} with: no move is needed.`;
var TURNED_EN = `${TWO_ENTRIES_EN} Otherwise ${TAKE_PATH_EN}.`;
var NOT_HELD_EN = "Refused (bridge): this bridge holds no seat, it has no status address.";
var STATUS = {
  en: {
    busyLine: (label, line, nudge) => `busyness ${label}: ${line || "(cleared)"}${nudge}`,
    placeDerived: (place) => `${place} (address derived, hello did not name it)`,
    placeUnnamed: (name2) => `of the seat${name2 ? ` "${name2}"` : ""} (no @handle:name address yet — hello has not come)`,
    evictedWhy: () => `the hearing is with another holder — take it back by ${tool("stand")} with take=true: ${TAKE.en.rule()}`,
    reopeningWhy: () => "the socket is reopening — the line is published, the hearing comes back by itself",
    noSeatId: (key2) => `Refused (bridge): the bridge does not yet know the id of the seat ${key2} (hello did not name it) — without it the line would land on all seats of the channel; repeat ${tool("stand")} for this graph.`,
    takePath: () => TAKE_PATH_EN,
    turnedGuidance: () => TURNED_EN,
    notHeld: () => NOT_HELD_EN,
    notHeldNone: () => `${NOT_HELD_EN} Introduce yourself with one call ${tool("stand")}(realm, karta, model, status) — busyness can be passed right in it. If another holder listens on the seat, ${tool("stand")} will say so; then ${TAKE_PATH_EN}.`,
    notHeldList: (list3) => `${NOT_HELD_EN} Seats of this graph on this machine are held by live bridges: ${list3}. ${TURNED_EN}`,
    whereCwd: (cwd) => `directory ${cwd}`,
    whereClient: (client) => `harness ${client}`
  }
};

// js/delivery/words/statuspost.ts
var STATUS_POST = {
  en: {
    trimmedBy: (message) => `the server trimmed the line: ${message}`,
    trimmed: () => "the server trimmed the line; rename it shorter",
    noAnswer: (error) => `Refused (bridge): the status address did not answer — ${error}`,
    gone: (body) => `Refused (404) by the surface: ${body || "no body"} — this seat address no longer addresses: another holder's connect may have turned it, or another instance of the same session's bridge may have held it. Whose it is now, the bridge cannot know from here.`,
    refused: (status, body) => `Refused (${status}) by the surface: ${body || "no body"}`,
    notSubscribed: () => "Refused (bridge): the channel goes through the dispatcher and no subscription carries it now — the line did not go; the old status address is called only after falling back to a socket",
    seatUnnamed: () => "Refused (bridge): the channel's subscription lives, but the line names no seat — the channel carries several and the bridge does not know its own id; the line did not go",
    late: () => "its limit passed in the turn"
  }
};

// js/delivery/words/stop.ts
var WHO_EN = {
  person: "by the human",
  self: "by a session of the same account",
  silent: "by the platform: no action of yours after the liveness wake-up",
  other: "by the owner or another session"
};
var STOP = {
  en: {
    stopped: (name2, who) => `the seat ${name2} was taken off (${WHO_EN[who]}) — you are stopped: end the work, do not take the seat`,
    orderJournalRefused: (order, outcome) => `stop order ${order}: the journal on disk did not take the ${outcome ? "outcome" : "order"} — the stop is executed all the same, ${outcome ? "the outcome" : "the outcome without accepted"} is sent once, not repeated after a bridge restart; check the grant directory (orders/)`
  }
};

// js/delivery/words/stopcli.ts
var STOP_CLI = {
  en: {
    usage: () => "usage: stop <seat|session id> [--realm <graph>] [--auth-dir <dir>] [--lang en]\n",
    noDaemon: () => `the machine daemon gave no snapshot — no live seats are seen; a seat a bridge holds past the daemon is revoked by its session (${tool("channel")} action=revoke)`,
    notFound: (target) => `the machine daemon has neither a session nor a seat «${target}» — status prints the names and session ids`,
    ambiguous: (target, list3) => `«${target}» names several seats: ${list3} — narrow it by --realm or name the session id`,
    otherOwner: (target, list3) => `this machine has no seat ${target}: the seat of that name here is ${list3}, another owner's; stop takes off only this machine's seats by their address, nothing is sent`,
    noOwner: (target) => `the owner of the seat ${target} cannot be checked: the daemon named no address of the seats of that name (not known yet or an older build) — nothing is sent; name the session id from status`,
    noId: (seat2) => `the bridge does not know the id of the seat ${seat2} yet (hello did not name it) — the order has no address; repeat later`,
    noRecord: (seat2) => `there is no hold record of the seat ${seat2} on disk — the seat's api address is unknown`,
    noServer: (seat2) => `the daemon did not name the server of the seat ${seat2} (a build older than stop) — no key can be chosen; update the delivery: update`,
    noKey: (server) => `no account key for the server ${server} — neither a personal token nor an OAuth grant in the grant directory; sign in — the verstak skill's establish-mcp method`,
    signIn: (server, why) => `SIGN IN AGAIN: the grant of the server ${server} did not refresh (${why}) — another server's key is never sent to the seat; sign in — the verstak skill's establish-mcp method, then repeat stop`,
    ordered: (seat2, order) => `a stop order is issued to the seat ${seat2}${order ? ` (order ${order})` : ""}: the bridge puts the agent down and answers the outcome; whether the seat went — status`,
    revoked: (seat2) => `the api has no stop order (404 of the route) — the seat ${seat2} is revoked: the agent goes down on the socket's close`,
    gone: (seat2) => `the seat ${seat2} is already ended (410)`,
    refused: (seat2, how2, status, body) => `seat ${seat2}: ${how2} refused (${status}) — ${body}`,
    unreachable: (seat2, why) => `seat ${seat2}: the api did not answer — ${why}`,
    unnamedGraph: (seat2, realm) => `seat ${seat2}: the graph "${realm}" names no owner and the api's graph list did not resolve it — nothing is sent; repeat stop once the list answers`
  }
};

// js/delivery/words/subagents.ts
var SUBAGENT = {
  en: {
    todo: () => "TODO:",
    form: (form) => {
      switch (form) {
        case "eval-no-sep":
          return '--satellite stands without `--` after the `node -e` code — node takes it for its own flag ("bad option") and will not start';
        case "eval-session":
          return "the bridge will not see --satellite in its argv (no `--` before it, or the bridge path is not put into argv[1]) and will stand as a session bridge, not a satellite";
        case "eval-other":
          return "the `node -e` code does not match the reference form — only that form, verified live, is accepted as working";
        case "shell":
          return "the form of the former contract (sh -c): Windows has no sh, and Claude Code does not expand variables in frontmatter args";
        case "path":
          return "the bridge path is written straight into args — a machine path in a shared file, absent on another machine";
        case "session":
          return "the entry calls the bridge without --satellite — the subagent would stand as a session bridge, not a satellite";
      }
    },
    osJudged: (platform3) => `OS under judgment: ${platform3}`,
    header: (root, os) => `subagents: project ${root} (${os})`,
    noFiles: (dirs) => `  no agent files (${dirs}) — call doctor from the project directory if the subagents are there`,
    shadowed: (path, agent) => `  ${path}: shadowed by the project file with the same name "${agent}" — Claude Code takes the project one`,
    withBlock: (ready) => `with the block below instead of the former mcpServers and disallowedTools:
${ready}`,
    proposed: (name2) => `${name2} (proposed form)`,
    refEntry: (name2, block) => `entry "${name2}" is a reference to a server from the session config, not its own bridge per run → replace it with an inline entry, ${block}`,
    formEntry: (name2, form, block) => `entry "${name2}": ${form} → ${block}`,
    noEntry: (block) => `no satellite bridge entry — the subagent has no graph tools → insert into the frontmatter ${block}`,
    sharedName: (agent) => `the entry is named "verstak-sub" — the shared name of the former contract: a second file with it would run its runs through the same bridge process → rename the entry to verstak-sub-${agent}`,
    replaceEntry: (name2, form, block) => `entry "${name2}": ${form} → replace ${block}`,
    noCommand: (name2, command) => `the command of entry "${name2}" "${command}" is not found on this machine (PATH) → install Node 22+ or add the node directory to PATH: Claude Code launches it via PATH`,
    noBridge: (bridge, home) => `no bridge at the entry path: ${bridge} → install it (the verstak skill's establish-mcp method places a home copy at ${home}), then repeat doctor`,
    callerBridges: (need2, fix2) => `the caller's bridges are not removed (${need2 || "no disallowedTools"}) — the subagent would inherit their tools, and its writes would go out under the caller's seat → replace the line: disallowedTools: ${fix2}`,
    ownRemoved: (own) => `disallowedTools removes the entry's own bridge ${own} → remove ${own} from disallowedTools`,
    nameShared: (name2, count, files, agent) => `the entry name "${name2}" is shared by ${count} file(s): ${files} — Claude Code keeps one connection per entry name, their runs would go through one bridge process, and the first to finish would put out the seat for the others → rename the entry in this file: verstak-sub-${agent}`,
    noGrantAgain: () => "the satellite probe did not run — there is no graph login on this machine (the action is in the line above)",
    noGrant: (advice) => `the satellite probe did not run — there is no graph login on this machine → ${advice}`,
    sameFailed: (label) => `the probe of the same command as "${label}" failed — the action is above`,
    sameProbe: (label) => `probe: the same command as "${label}" above`,
    userScope: () => " (user)",
    named: (...names2) => `entry "${names2.join('", "')}"`,
    unnamed: () => "no satellite bridge entry",
    fine: () => " — fine",
    ocKeys: (keys) => `; TODO: the key ${keys} is not read by OpenCode in an agent file → remove it`,
    ocAgent: (path, keyNote) => `  ${path}: OpenCode — the delivery plugin gives the child session a satellite bridge (the OpenCode line above), no entry is needed in the file${keyNote}`,
    trustNear: (near, here) => `folder trust was accepted for "${near}", but the project is opened as "${here}" — Claude Code compares the path letter for letter (C:/ and c:/ are different folders), and in an untrusted folder the frontmatter server does not start without a dialog → run claude in a terminal from this folder and accept the trust dialog, or open the folder with the same spelling of the path`,
    trustNone: (here) => `trust for the folder "${here}" and its parents is not marked in ~/.claude.json — in an untrusted folder the frontmatter server does not start, and there is no dialog about it → run claude in this folder and accept the trust dialog`
  }
};

// js/delivery/words/suspend.ts
var SUSPEND = {
  en: {
    noSeat: () => "no satellite seat — nothing to pause",
    reason: () => "satellite pause"
  }
};

// js/delivery/words/thin.ts
var THIN = {
  en: {
    besideNotBack: () => "the seat beside did not come back with the main one"
  }
};

// js/delivery/words/unnamed.ts
var UNNAMED = {
  en: {
    refused: (action) => `Refused (bridge): ${action} without a seat name — the bridge does not take a role seat with an empty name (its address would coincide with the user's seat, and nothing could take it off); the call was not sent. Name the seat explicitly: name (lower-case Latin letters, digits, ".", "_", "-"). The user's own unnamed seat is karta="me" with VERSTAK_BRIDGE_OWNER_ROLE=1 in the bridge's environment, set by the user.`
  }
};

// js/delivery/words/update.ts
var UPDATE = {
  en: {
    reexecNewer: (homeVersion, version, path) => `the home copy is newer than this build (v${homeVersion} > v${version}) — restarting with it: ${path}`,
    restartFailed: (error) => `restart failed: ${error}`,
    versionMismatch: (got, version) => `the downloaded bridge names v${got}, the release — v${version}`,
    bridgeDownloaded: () => `The fresh bridge is already downloaded into ~/${HOME_DIR} and comes up with a new session.`,
    downloadFailed: (error, self) => `Downloading the fresh bridge failed (${error}); repeat: node "${self}" update.`,
    homeSymlink: () => "The fresh bridge is not put home: home is a symlink to another copy, left alone; update that copy yourself.",
    bridgeAlreadyHome: () => `The fresh bridge already lies in ~/${HOME_DIR} and comes up with a new session.`,
    bridgeNotHome: (self) => `The fresh bridge is not put home; repeat: node "${self}" update (the bridge that answers is the one that updates home; in OpenCode's packaged delivery the bridge lives in the package and updates with it).`,
    stale: (version, fresh2, bridgeWord, claude, flat, pi, codex, setup) => `[${BRIDGE_NAME}] DELIVERY BEHIND: this bridge is v${version}, the fresh release is v${fresh2}. ${bridgeWord} The harness channel updates the skills, and this must be TOLD TO THE USER: Claude Code — ${claude}; flat install — ${flat}; pi — ${pi}; Codex — ${codex}. The full order — the fresh installer ${setup} (update puts it); on the user's word "update" run it.`,
    moveClaude: () => "/plugin marketplace update verstak, then /reload-plugins",
    moveFlat: () => "repeat npx skills add verstak-ai/skills --all --global (it brings new skills and refreshes standing ones: npx skills update --global walks only the lock file and brings none, a dropped skill is removed by hand — npx skills remove <name> --global)",
    movePi: () => "pi update git:github.com/verstak-ai/skills",
    moveCodex: () => "codex plugin marketplace upgrade verstak, then codex plugin remove verstak@verstak and codex plugin add verstak@verstak"
  }
};

// js/delivery/words/usage.ts
var USAGE = {
  en: {
    notHosted: () => "only OpenCode and pi report usage",
    noNumbers: () => "the snapshot has no numbers",
    tooLarge: (max) => `the snapshot is over ${max} bytes, the tact record's limit; not sent`
  }
};

// js/delivery/words/watchdog.ts
var WATCHDOG = {
  en: {
    doer: (text2) => `DOER: ${text2}`,
    listening: (key2, tail2 = "") => `listening on standing ${key2}${tail2}`,
    listeningCodex: (key2, thread) => `listening on standing ${key2}; putting frames into thread ${thread}`,
    backfilled: (count) => ` (${count} back-dated)`,
    frames: (n) => `${n} ${n === 1 ? "frame" : "frames"}`,
    noHeld: () => `the bridge holds no standing — name yourself with one call to ${tool("stand")}(realm, karta, model): its answer names the listening command`,
    severalHeld: (held2) => `the bridge holds several standings — name the one you need: ${held2}`,
    bridgeLetGo: () => "the bridge released the standing or went away — did the session end?",
    seatNotBack: (s2, path) => `the seat did not return within ${s2}s after the daemon change — socket ${path} is not up; to bring it back use ${tool("stand")}`,
    noSocket: (path, s2) => `the bridge did not bring up the local socket ${path} within ${s2}s`,
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
    flushNotPut: (s2) => `DOER: the put did not go through within ${s2}s after one's own release — the batch was not sent to the thread`,
    frameNotPut: (why) => `DOER: the frame was not put in — ${why}`,
    doorClosed: (why, lost) => `the door closed: ${why} — will reopen on the next frame` + (lost ? `; unanswered: ${lost} — will come back from the ring on the next arming` : ""),
    doorNotOpened: (why) => `the door did not open: ${why}`,
    noIdFromRing: () => "a frame without an id from the ring — nothing to mark it with, not putting it into the thread again",
    alreadyPut: (id) => `frame ${id} was already put in — not putting it into the thread again`
  }
};

// js/shared/version.ts
var releaseBuild = () => CHANNEL_MARK.endsWith(":release");
var devBuildIn = (text2) => text2.includes(`"${[BUILD_MARK, "dev"].join(":")}"`);
function buildOf(selfUrl) {
  try {
    const src = readFileSync2(fileURLToPath(selfUrl));
    return `v${VERSION}+${createHash("sha256").update(src).digest("hex").slice(0, 8)}`;
  } catch {
    return `v${VERSION}`;
  }
}
var MARK_LITERAL = /"([^"\s]+-build):(?:dev|release)"/g;
function versionIn(text2) {
  for (const [, name2] of text2.matchAll(MARK_LITERAL)) if (name2 !== BUILD_MARK) return null;
  const m = /^(?:const|let|var)\s+VERSION\s*=\s*"([^"]+)"/m.exec(text2);
  return m ? m[1] : null;
}

// js/bridge/build.ts
var BUILD = buildOf(import.meta.url);

// js/bridge/daemon.ts
import { spawn as spawn3 } from "node:child_process";
import { appendFileSync as appendFileSync5, mkdirSync as mkdirSync17, readFileSync as readFileSync30, statSync as statSync9 } from "node:fs";
import { join as join27 } from "node:path";
import { fileURLToPath as fileURLToPath5 } from "node:url";

// js/shared/channel.ts
import * as diagnostics from "node:diagnostics_channel";

// js/shared/lang.ts
import { readFileSync as readFileSync3 } from "node:fs";
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
function newScope(id, origin2, sessionKey) {
  return { id, origin: origin2, sessionKey, slots: /* @__PURE__ */ new Map(), log: null };
}
var runIn = (scope, fn) => als.run(scope, fn);
function bindScope(fn) {
  const s2 = als.getStore();
  return s2 ? (...a) => als.run(s2, () => fn(...a)) : fn;
}
var bindAll = (o) => Object.fromEntries(
  Object.entries(o).map(([k, v]) => [
    k,
    typeof v === "function" ? bindScope(v) : v
  ])
);
function scoped(init) {
  const key2 = {};
  const own = () => {
    const slots = currentScope().slots;
    let v = slots.get(key2);
    if (v === void 0) {
      v = init();
      slots.set(key2, v);
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
  const s2 = currentScope();
  if (s2.origin && s2.sessionKey(k)) return s2.origin.env[k];
  return process.env[k];
}
var sessionPid = () => currentScope().origin?.pid ?? process.pid;
var sessionCwd = () => currentScope().origin?.cwd ?? process.cwd();

// js/shared/standings.ts
import { createHash as createHash2 } from "node:crypto";
import { lstatSync, mkdirSync } from "node:fs";
import { homedir as homedir2 } from "node:os";
import { join as join2, resolve } from "node:path";
var defaultAuthDir = () => join2(homedir2(), HOME_DIR);
var authDirFromEnv = () => envOf(envName("BRIDGE_AUTH_DIR"))?.trim() || defaultAuthDir();
var standingsDirOf = (authDir) => join2(authDir, "standings");
var hashOf = (key2) => createHash2("sha256").update(key2).digest("hex").slice(0, 16);
function socketPathOf(authDir, key2) {
  if (process.platform === "win32") return `\\\\.\\pipe\\${RUNTIME_PREFIX}-${hashOf(key2)}`;
  const near = join2(standingsDirOf(authDir), `${hashOf(key2)}.sock`);
  if (Buffer.byteLength(near) <= SOCKET_PATH_MAX) return near;
  return join2(shortSocketDir(), `${hashOf(resolve(authDir) + "\0" + key2)}.sock`);
}
var SOCKET_PATH_MAX = 103;
var shortSocketDir = () => join2(
  "/tmp",
  `${RUNTIME_PREFIX}-${typeof process.getuid === "function" ? process.getuid() : "u"}`
);
function privateDirProblem(dir2, create = true) {
  let st;
  try {
    try {
      if (create) mkdirSync(dir2, { mode: 448 });
    } catch (e) {
      if (e.code !== "EEXIST") throw e;
    }
    st = lstatSync(dir2);
  } catch (e) {
    return `${dir2}: ${e.message}`;
  }
  const W4 = words(STANDINGS);
  if (!st.isDirectory()) return W4.notDir(dir2);
  if (typeof process.getuid === "function" && st.uid !== process.getuid()) return W4.otherUser(dir2);
  if (st.mode & 63) return W4.openToOthers(dir2);
  return null;
}
var keyFilePathOf = (authDir, key2) => join2(standingsDirOf(authDir), `${hashOf(key2)}.key`);
var holdFilePathOf = (authDir, key2) => join2(standingsDirOf(authDir), `${hashOf(key2)}.hold`);
var baseFilePathOf = (authDir, key2) => join2(standingsDirOf(authDir), `${hashOf(key2)}.base`);
var takingFilePathOf = (authDir, key2) => join2(standingsDirOf(authDir), `${hashOf(key2)}.taking`);
var spoolFilePathOf = (authDir, key2) => join2(standingsDirOf(authDir), `${hashOf(key2)}.spool`);
function seenFilePathOf(authDir, key2, server = "") {
  if (!server) return join2(standingsDirOf(authDir), `${hashOf(key2)}.seen`);
  let origin2 = server;
  try {
    origin2 = new URL(server).origin;
  } catch {
  }
  return join2(standingsDirOf(authDir), `${hashOf(key2)}.${hashOf(origin2).slice(0, 8)}.seen`);
}

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
    const text2 = readFileSync3(join3(authDirFromEnv(), "server"), "utf8").trim();
    if (text2) return langOfServer(text2);
  } catch {
  }
  return DEFAULT_LANG;
}
var S = scoped(() => ({ current: null }));
function setServerLang(serverUrl) {
  S.current = forcedLang() ?? langOfServer(serverUrl);
}
function setLang(l) {
  if (isLang(l)) S.current = l;
}
var lang = () => S.current ??= resolve2();
var words = (dict) => dict[lang()];

// js/shared/channel.ts
var PING_CHANNEL = "undici:websocket:ping";
var SILENT_INTERVALS = 3;
var SILENT_FLOOR_MS = Number(process.env[envName("CHANNEL_SILENT_FLOOR_MS")]) || 6e4;
var DEAD_TOKEN_CODES = [4002];
var STOPPED_CODE = 4001;
var EVICTED_CODE = 4e3;
var ROLLOUT_CODE = 4003;
var FAST_DROP_MS = 5e3;
var ERROR_GUESS_DELAY_MS = 500;
var FLAP_PAUSES_MS = (process.env[envName("CHANNEL_FLAP_MS")] || "5000,10000,20000,40000,60000").split(",").map(Number).filter((n) => Number.isFinite(n) && n > 0);
function httpOrigin(socketUrl) {
  return new URL(socketUrl).origin.replace(/^wss:/, "https:").replace(/^ws:/, "http:");
}
function versionUrl(socketUrl) {
  return apiBase(socketUrl) + "/version";
}
function apiBase(socketUrl) {
  return httpOrigin(socketUrl) + "/api";
}
function statusUrl(socketUrl) {
  return socketUrl.replace(/^wss:/, "https:").replace(/^ws:/, "http:").replace("/channel/ws/", "/channel/status/");
}
async function serviceUp(socketUrl) {
  return fetch(versionUrl(socketUrl), { signal: AbortSignal.timeout(5e3) }).then((r) => r.ok ? r.json() : null).catch(() => null);
}
function deadTokenAdvice(code) {
  return words(CHANNEL).deadTokenAdvice(code);
}
function classifyOrigin(frame2, myKarta) {
  const p = frame2.provenance ?? {};
  const noAuthor = p.via === "room" && p.from_karta_seq == null && !p.from_standing;
  if (p.via === "platform" || p.auth === "none" || p.auth === "platform" || noAuthor)
    return "platform";
  if (p.from_person === true || p.as_person === true) return "human";
  if (p.from_karta_seq != null && p.user_karta_seq != null && p.from_karta_seq === p.user_karta_seq)
    return "human";
  if (myKarta != null && p.from_karta_seq != null && String(p.from_karta_seq) === String(myKarta))
    return "sibling";
  return "peer";
}
function isDirectWord(frame2) {
  if (frame2?.type !== "message") return false;
  const f = frame2;
  if (f.room || typeof f.event_kind === "string" && f.event_kind.startsWith("room."))
    return false;
  const p = frame2.provenance ?? {};
  if (p.via === "graph" || p.via === "room") return false;
  const origin2 = frame2.origin ?? classifyOrigin(frame2);
  if (origin2 === "platform") return false;
  return origin2 === "human" || !!p.from_standing || p.from_karta_seq != null;
}
function holdSocket(o) {
  let fastDrops = 0;
  let slowdown = 0;
  let rolloutTold = false;
  let dead = false;
  let stopped = false;
  let retry = null;
  let ws = null;
  let handing = null;
  let lastLife = 0;
  let heardAt = 0;
  let pingMs = 0;
  let runtimeSeesPings = false;
  let lastTick = 0;
  let watch2 = null;
  const onPing = (m) => {
    const from = m?.websocket;
    if (!ws || from !== void 0 && from !== ws) return;
    lastLife = heardAt = Date.now();
    runtimeSeesPings = true;
  };
  diagnostics.subscribe?.(PING_CHANNEL, onPing);
  const unsubscribePing = () => {
    diagnostics.unsubscribe?.(PING_CHANNEL, onPing);
  };
  const stopWatch = () => {
    if (watch2) clearInterval(watch2);
    watch2 = null;
  };
  function open() {
    if (stopped) return;
    const startedAt = Date.now();
    const sock = new WebSocket(o.url);
    ws = sock;
    stopWatch();
    lastLife = startedAt;
    let gone = false;
    sock.addEventListener("ping", () => {
      if (ws !== sock) return;
      lastLife = heardAt = Date.now();
      runtimeSeesPings = true;
    });
    sock.addEventListener("message", (e) => {
      if (stopped || ws !== sock) return;
      lastLife = heardAt = Date.now();
      const raw = typeof e.data === "string" ? e.data : words(CHANNEL).binaryFrame();
      if (handing) return handing.onFrame(raw);
      let frame2 = null;
      if (typeof e.data === "string") {
        try {
          frame2 = JSON.parse(raw);
        } catch {
        }
      }
      if (frame2?.type === "hello") {
        rolloutTold = false;
        watchLife(Number(frame2.ping_interval_seconds) * 1e3);
      }
      o.onFrame(raw, frame2 && typeof frame2 === "object" ? frame2 : null);
    });
    sock.addEventListener(
      "error",
      () => setTimeout(() => void dropped(1006), ERROR_GUESS_DELAY_MS)
    );
    sock.addEventListener("close", (e) => {
      const c = e;
      void dropped(c.code, typeof c.reason === "string" ? c.reason : "");
    });
    function watchLife(interval) {
      stopWatch();
      if (!(interval > 0)) return;
      pingMs = interval;
      const every = Math.max(pingMs, 250);
      lastTick = Date.now();
      watch2 = setInterval(() => {
        const now2 = Date.now();
        if (now2 - lastTick > 2 * every + 1e3) lastLife = now2;
        lastTick = now2;
        if (stopped || ws !== sock || !runtimeSeesPings) return;
        const silent = now2 - lastLife;
        if (silent <= Math.max(SILENT_INTERVALS * pingMs + 1e3, SILENT_FLOOR_MS)) return;
        stopWatch();
        (o.onHung ?? o.onNote)?.(words(CHANNEL).hung(Math.round(silent / 1e3), pingMs / 1e3));
        try {
          sock.close();
        } catch {
        }
        void dropped(1006);
      }, every);
      watch2.unref?.();
    }
    function yieldTo(cb, code) {
      if (dead) return;
      dead = true;
      stopped = true;
      if (retry) clearTimeout(retry);
      stopWatch();
      unsubscribePing();
      cb(code);
    }
    async function dropped(code, reason = "") {
      if (stopped || ws !== sock) return;
      stopWatch();
      if (handing) {
        const h = handing;
        handing = null;
        stopped = true;
        ws = null;
        unsubscribePing();
        return h.onGone(code);
      }
      if (DEAD_TOKEN_CODES.includes(code)) return yieldTo(o.onDeadToken, code);
      if (code === STOPPED_CODE) return yieldTo((c) => o.onStopped(c, reason), code);
      if (code === EVICTED_CODE) return yieldTo(o.onEvicted ?? o.onDeadToken, code);
      if (gone) return;
      gone = true;
      o.onDropped?.();
      const fast = Date.now() - startedAt < FAST_DROP_MS;
      fastDrops = fast ? fastDrops + 1 : 0;
      if (!fast) slowdown = 0;
      if (fastDrops >= 3) {
        const up = await serviceUp(o.url);
        if (stopped || ws !== sock) return;
        if (up) {
          if (slowdown === 0) o.onServiceAlive(String(up.version ?? ""));
          const wait = FLAP_PAUSES_MS[Math.min(slowdown, FLAP_PAUSES_MS.length - 1)] ?? 6e4;
          slowdown++;
          fastDrops = 2;
          retry = setTimeout(open, wait);
          return;
        }
        if (!rolloutTold) o.onNote?.(words(CHANNEL).rollout());
        rolloutTold = true;
        fastDrops = 1;
      }
      retry = setTimeout(open, code === ROLLOUT_CODE ? 3e3 : 2e3);
    }
  }
  open();
  return {
    close(reason = "held no more") {
      stopped = true;
      handing = null;
      stopWatch();
      unsubscribePing();
      if (retry) clearTimeout(retry);
      retry = null;
      const sock = ws;
      ws = null;
      try {
        sock?.close(1e3, reason);
      } catch {
      }
    },
    handOff(onFrame, onGone) {
      if (stopped || !ws || ws.readyState !== 1) {
        this.close("handed off without a socket");
        return onGone(0);
      }
      if (retry) clearTimeout(retry);
      retry = null;
      stopWatch();
      handing = { onFrame, onGone };
    },
    send(text2, sent) {
      if (stopped || handing || !ws || ws.readyState !== 1) return false;
      try {
        ws.send(text2);
      } catch {
        return false;
      }
      sent?.(Date.now());
      return true;
    },
    get alive() {
      return !stopped && !!ws && (ws.readyState === 0 || ws.readyState === 1);
    },
    get heardAt() {
      return heardAt;
    }
  };
}

// js/shared/home.ts
import { homedir as homedir3 } from "node:os";
import { join as join4 } from "node:path";
var homeBridgePath = () => join4(homedir3(), HOME_DIR, HOME_BRIDGE_FILE);

// js/shared/regex.ts
var escapeRe = (s2) => s2.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// js/shared/seam.ts
import { createHash as createHash3 } from "node:crypto";
import { connect } from "node:net";

// js/shared/snapshot.ts
var record = (v) => v && typeof v === "object" && !Array.isArray(v) ? v : {};
var text = (v) => typeof v === "string" ? v : "";
var number = (v) => typeof v === "number" && Number.isFinite(v) ? v : 0;
var list = (v) => Array.isArray(v) ? v : [];
function safeSkills(v) {
  const s2 = record(v);
  if (typeof s2.name !== "string" || typeof s2.version !== "string") return void 0;
  return {
    name: s2.name,
    version: s2.version,
    ...typeof s2.stamp === "string" ? { stamp: s2.stamp } : {}
  };
}
function safeUsage(v) {
  const raw = record(v);
  const out7 = {};
  for (const k of [
    "tokens",
    "input",
    "output",
    "cache_read",
    "cache_write",
    "context",
    "window",
    "percent"
  ])
    if (typeof raw[k] === "number" && Number.isFinite(raw[k])) out7[k] = raw[k];
  for (const k of ["model", "at"]) if (typeof raw[k] === "string") out7[k] = raw[k];
  return Object.keys(out7).length ? out7 : void 0;
}
function safePulse(v) {
  const raw = record(v);
  if (typeof raw.state !== "string") return void 0;
  const out7 = { state: raw.state };
  if (typeof raw.pending === "number" && Number.isFinite(raw.pending)) out7.pending = raw.pending;
  for (const k of ["turn_at", "read_at", "act_at", "cycle_at", "sent_at"])
    if (typeof raw[k] === "string") out7[k] = raw[k];
  return out7;
}
function safePlace(v) {
  const p = record(v);
  const usage2 = safeUsage(p.usage);
  const pulse = safePulse(p.pulse);
  const skills = safeSkills(p.skills);
  return {
    name: text(p.name),
    realm: text(p.realm),
    karta: typeof p.karta === "number" ? number(p.karta) : text(p.karta),
    primary: p.primary === true,
    listening: p.listening === true,
    ...typeof p.standing_id === "string" ? { standing_id: p.standing_id } : {},
    ...typeof p.address === "string" && p.address ? { address: p.address } : {},
    ...typeof p.satellite_of === "string" ? { satellite_of: p.satellite_of } : {},
    ...typeof p.last_work_at === "string" ? { last_work_at: p.last_work_at } : {},
    ...usage2 ? { usage: usage2 } : {},
    ...pulse ? { pulse } : {},
    ...skills ? { skills } : {},
    ...typeof p.skills_mismatch === "boolean" ? { skills_mismatch: p.skills_mismatch } : {}
  };
}
function safeSnapshot(v) {
  const raw = record(v);
  const d = record(raw.daemon);
  return {
    daemon: { pid: number(d.pid), build: text(d.build), path: text(d.path) },
    sessions: list(raw.sessions).map((v2) => {
      const s2 = record(v2);
      const skills = safeSkills(s2.skills);
      const installed = safeSkills(s2.installed_skills);
      return {
        local_id: text(s2.local_id),
        thin_pid: number(s2.thin_pid),
        attached: s2.attached === true,
        harness: text(s2.harness),
        harness_session: typeof s2.harness_session === "string" ? s2.harness_session : null,
        cwd: text(s2.cwd),
        build: text(s2.build),
        ...typeof s2.server === "string" && s2.server ? { server: s2.server } : {},
        ...typeof s2.api === "string" && s2.api ? { api: s2.api } : {},
        ...skills ? { skills } : {},
        ...installed ? { installed_skills: installed } : {},
        ...typeof s2.skills_mismatch === "boolean" ? { skills_mismatch: s2.skills_mismatch } : {},
        places: list(s2.places).map(safePlace)
      };
    })
  };
}

// js/shared/seam.ts
var SEAM_PROTOCOL = 1;
var SEAM_REATTACH_GRACE_MS = 5e3;
var DAEMON_ENV = envName("BRIDGE_DAEMON");
var NO_DAEMON_ENV = envName("BRIDGE_NO_DAEMON");
var TOKEN_ENV = envName("BRIDGE_TOKEN");
var patShaOf = (pat) => pat ? createHash3("sha256").update(pat).digest("hex").slice(0, 16) : null;
var PASS_ENV = /* @__PURE__ */ new Set([
  "CLAUDE_PLUGIN_ROOT",
  "XDG_STATE_HOME",
  "NODE_EXTRA_CA_CERTS",
  "NODE_USE_ENV_PROXY",
  "HTTP_PROXY",
  "HTTPS_PROXY",
  "NO_PROXY",
  "ALL_PROXY",
  "http_proxy",
  "https_proxy",
  "no_proxy",
  "all_proxy"
]);
var isSessionEnvKey = (k) => k !== TOKEN_ENV && (k.startsWith(ENV_PREFIX) || PASS_ENV.has(k));
function seamEnv(env2 = process.env) {
  const out7 = {};
  for (const [k, v] of Object.entries(env2)) if (v !== void 0 && isSessionEnvKey(k)) out7[k] = v;
  return out7;
}
var BASE_ENV = [
  "HOME",
  "USERPROFILE",
  "PATH",
  "TMPDIR",
  "TMP",
  "TEMP",
  "SystemRoot",
  "LANG",
  "LC_ALL",
  "BUN_BE_BUN",
  TOKEN_ENV
];
function daemonEnv(env2 = process.env) {
  const out7 = seamEnv(env2);
  for (const k of BASE_ENV) if (env2[k] !== void 0) out7[k] = env2[k];
  return out7;
}
function helloFrame(o) {
  return {
    t: "hello",
    seam: SEAM_PROTOCOL,
    product: PRODUCT,
    build: o.build,
    path: o.path,
    argv: o.argv,
    env: seamEnv(),
    cwd: process.cwd(),
    pid: process.pid,
    session: o.session ?? null,
    patSha: o.patSha ?? null,
    ...o.probe ? { probe: true } : {}
  };
}
function checkHello(f) {
  const h = f;
  if (!h || h.t !== "hello") return "the first frame is not a hello";
  if (h.seam !== SEAM_PROTOCOL)
    return `seam protocol ${String(h.seam)} is not spoken here (this side speaks ${SEAM_PROTOCOL})`;
  if (h.product !== void 0 && h.product !== PRODUCT)
    return `the thin bridge belongs to the delivery ${String(h.product)} (this side is ${PRODUCT})`;
  if (!Array.isArray(h.argv) || typeof h.cwd !== "string" || typeof h.pid !== "number")
    return "the hello lacks argv, cwd or pid";
  return null;
}
function readFrames(socket, onFrame, onBad = () => {
}) {
  socket.setEncoding("utf8");
  let buf = "";
  socket.on("data", (chunk) => {
    buf += chunk;
    let nl;
    while ((nl = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, nl).trim();
      buf = buf.slice(nl + 1);
      if (!line) continue;
      let f;
      try {
        f = JSON.parse(line);
      } catch {
        onBad(line);
        continue;
      }
      onFrame(f);
    }
  });
}
function writeFrame(socket, frame2, cb) {
  if (socket.destroyed || !socket.writable) {
    cb?.(new Error("the seam socket is closed"));
    return false;
  }
  return socket.write(JSON.stringify(frame2) + "\n", cb);
}
var SeamError = class extends Error {
  kind;
  protocol;
  constructor(kind, message, protocol) {
    super(message);
    this.kind = kind;
    this.protocol = protocol;
  }
};
var ABSENT = /* @__PURE__ */ new Set(["ENOENT", "ECONNREFUSED", "ENOTSOCK", "ENOTDIR"]);
function connectSeam(path, hello, timeoutMs) {
  return new Promise((resolveLink, reject) => {
    const socket = connect(path);
    let welcome = null;
    const early = [];
    let frameCb = null;
    let closeCb = null;
    let closed = false;
    const fail2 = (e) => {
      clearTimeout(timer);
      socket.destroy();
      reject(e);
    };
    const timer = setTimeout(
      () => fail2(new SeamError("broken", `no welcome from the daemon in ${timeoutMs}ms`)),
      timeoutMs
    );
    timer.unref?.();
    socket.on("error", (e) => {
      if (welcome) return;
      fail2(new SeamError(ABSENT.has(e.code ?? "") ? "absent" : "broken", `${e.code ?? e.message}`));
    });
    socket.on("close", () => {
      if (!welcome) {
        fail2(new SeamError("broken", "the daemon closed the seam before its welcome"));
        return;
      }
      if (closed) return;
      closed = true;
      closeCb?.();
    });
    socket.on("connect", () => writeFrame(socket, hello));
    readFrames(socket, (f) => {
      if (!welcome) {
        if (f.t === "refuse") return fail2(new SeamError("refused", f.reason, f.seam));
        if (f.t !== "welcome") return fail2(new SeamError("broken", `expected welcome, got ${f.t}`));
        if (f.seam !== SEAM_PROTOCOL)
          return fail2(new SeamError("refused", "the daemon speaks another seam protocol", f.seam));
        welcome = f;
        clearTimeout(timer);
        resolveLink({
          welcome: f,
          send: (frame2, cb) => writeFrame(socket, frame2, cb),
          onFrame: (cb) => {
            frameCb = cb;
            for (const e of early.splice(0)) cb(e);
          },
          onClose: (cb) => {
            closeCb = cb;
            if (closed) cb();
          },
          close: () => {
            socket.end();
            setTimeout(() => socket.destroy(), 1e3).unref?.();
          }
        });
        return;
      }
      if (frameCb) frameCb(f);
      else early.push(f);
    });
  });
}

// js/shared/seam-entrance.ts
import { createHash as createHash4, randomBytes } from "node:crypto";
import { linkSync, mkdirSync as mkdirSync2, readFileSync as readFileSync4, renameSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, join as join5, resolve as resolve3 } from "node:path";
var seamKey = (authDir) => createHash4("sha256").update(resolve3(authDir)).digest("hex").slice(0, 16);
var seamRunDir = (authDir) => join5(resolve3(authDir), "run");
var SUN_PATH_MAX = 103;
function pipeNonce(authDir, create = true) {
  const run2 = seamRunDir(authDir);
  const file = join5(run2, "pipe");
  if (!create) return readFileSync4(file, "utf8").trim();
  mkdirSync2(run2, { recursive: true, mode: 448 });
  const tmp = `${file}.${process.pid}-${randomBytes(6).toString("hex")}`;
  try {
    writeFileSync(tmp, randomBytes(16).toString("hex"), { mode: 384 });
    linkSync(tmp, file);
  } catch {
  } finally {
    try {
      unlinkSync(tmp);
    } catch {
    }
  }
  for (let i = 0; i < 50; i++) {
    const word3 = readFileSync4(file, "utf8").trim();
    if (word3) return word3;
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 20);
  }
  throw new Error(`${file} stays empty — the pipe name is unknown`);
}
function seamSocketPath(authDir, create = true) {
  const key2 = seamKey(authDir);
  if (process.platform === "win32")
    return `\\\\.\\pipe\\${RUNTIME_PREFIX}-daemon-${key2}-${pipeNonce(authDir, create)}`;
  const inRun = join5(seamRunDir(authDir), "daemon.sock");
  if (Buffer.byteLength(inRun) <= SUN_PATH_MAX) return inRun;
  return join5(shortSocketDir(), `daemon-${key2}.sock`);
}
function orchestraDoorPath(authDir, create = true) {
  const key2 = seamKey(authDir);
  if (process.platform === "win32")
    return `\\\\.\\pipe\\${RUNTIME_PREFIX}-orchestra-${key2}-${pipeNonce(authDir, create)}`;
  const inRun = join5(seamRunDir(authDir), "orchestra.sock");
  if (Buffer.byteLength(inRun) <= SUN_PATH_MAX) return inRun;
  return join5(shortSocketDir(), `orchestra-${key2}.sock`);
}
function seamEntranceProblem(authDir, create = true) {
  if (process.platform === "win32") return null;
  const run2 = seamRunDir(authDir);
  try {
    if (create) mkdirSync2(dirname(run2), { recursive: true, mode: 448 });
  } catch (e) {
    return `${dirname(run2)}: ${e.message}`;
  }
  const bad = privateDirProblem(run2, create);
  if (bad) return bad;
  const sockDir = dirname(seamSocketPath(authDir, create));
  return sockDir === run2 ? null : privateDirProblem(sockDir, create);
}
var seamRaiseLockPath = (authDir) => join5(seamRunDir(authDir), "daemon.raising");
var seamDaemonLockPath = (authDir) => join5(seamRunDir(authDir), "daemon.lock");
var ownPidAlive = (pid) => {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
};
var readLock = (path) => {
  try {
    return JSON.parse(readFileSync4(path, "utf8"));
  } catch {
    return null;
  }
};
function takeFileLock(path, staleMs) {
  const token = `${process.pid}-${randomBytes(8).toString("hex")}`;
  const body = JSON.stringify({ pid: process.pid, token, started_at: Date.now() });
  const release = () => {
    if (readLock(path)?.token === token) {
      try {
        unlinkSync(path);
      } catch {
      }
    }
  };
  const claim = () => {
    const tmp = `${path}.${token}`;
    writeFileSync(tmp, body, { mode: 384 });
    try {
      linkSync(tmp, path);
      return true;
    } catch (e) {
      if (e.code === "EEXIST") return false;
      throw e;
    } finally {
      try {
        unlinkSync(tmp);
      } catch {
      }
    }
  };
  try {
    if (claim()) return { held: true, release };
    const held2 = readLock(path);
    if (held2 && ownPidAlive(held2.pid) && Date.now() - held2.started_at < staleMs)
      return { held: false, fault: null, holder: { pid: held2.pid, started_at: held2.started_at } };
    const mistake = carryAwayStale(path, held2?.token);
    if (mistake) return { held: false, fault: mistake.putBack ? null : mistake.word };
    return claim() ? { held: true, release } : { held: false, fault: null };
  } catch (e) {
    return { held: false, fault: `${path}: ${e.message}` };
  }
}
function carryAwayStale(path, staleToken) {
  const away = `${path}.stale-${process.pid}-${randomBytes(6).toString("hex")}`;
  try {
    renameSync(path, away);
  } catch {
    return null;
  }
  if (readLock(away)?.token !== staleToken) {
    try {
      linkSync(away, path);
    } catch {
      return {
        putBack: false,
        word: `a live lock was carried away by mistake and could not be put back (${path} is taken again); it is left as ${away}`
      };
    }
    try {
      unlinkSync(away);
    } catch {
    }
    return {
      putBack: true,
      word: `a live lock was carried away by mistake and put back — ${path} is held`
    };
  }
  try {
    unlinkSync(away);
  } catch {
  }
  return null;
}

// js/shared/seam-host.ts
import { chmodSync, unlinkSync as unlinkSync2 } from "node:fs";
import { connect as connect2, createServer } from "node:net";
import { createInterface } from "node:readline";
import { PassThrough } from "node:stream";
var HELLO_WAIT_MS = 5e3;
var graceTimers = /* @__PURE__ */ new Map();
var owners = /* @__PURE__ */ new Map();
function serveSeam(socket, host, graceMs = SEAM_REATTACH_GRACE_MS) {
  const say2 = (m) => host.log?.(m);
  let session = null;
  let helloSeen = false;
  let byeing = false;
  const early = [];
  const helloTimer = setTimeout(() => {
    if (!helloSeen) socket.destroy();
  }, HELLO_WAIT_MS);
  helloTimer.unref?.();
  socket.on("error", () => {
  });
  const refuse2 = (reason) => {
    say2(`seam refused: ${reason}`);
    writeFrame(socket, { t: "refuse", seam: SEAM_PROTOCOL, build: host.build, reason });
    socket.end();
  };
  let chain = Promise.resolve();
  const onFrame = (s2, f) => {
    if (f.t === "rpc") {
      const msg = f.msg;
      const request2 = msg.method !== void 0 && msg.id !== void 0 && msg.id !== null;
      if (request2 && host.draining?.()) {
        const late2 = host.answerDraining?.(s2.id, msg) ?? null;
        if (!late2) {
          say2(`request ${JSON.stringify(msg.id)} not taken: the daemon is handing over`);
          return;
        }
        writeFrame(socket, { t: "ack", id: msg.id });
        void late2.then((reply2) => writeFrame(socket, { t: "rpc", msg: reply2 })).catch((e) => say2(`request ${JSON.stringify(msg.id)} failed: ${e.message}`));
        return;
      }
      chain = chain.then(
        () => new Promise((done) => {
          if (!request2) {
            s2.deliver(msg);
            return done();
          }
          writeFrame(socket, { t: "ack", id: msg.id }, (err) => {
            if (!err) s2.deliver(msg);
            else say2(`request ${JSON.stringify(msg.id)} not taken: its ack did not go out`);
            done();
          });
        })
      );
    } else if (f.t === "bye") {
      byeing = true;
      owners.delete(s2);
      chain = chain.then(
        () => s2.end(f.why || "bye").then(() => {
          writeFrame(socket, { t: "bye-ok" });
          socket.end();
        })
      );
    }
  };
  readFrames(
    socket,
    (f) => {
      if (!helloSeen) {
        helloSeen = true;
        clearTimeout(helloTimer);
        const why = checkHello(f);
        if (why) return refuse2(why);
        void accept(f);
        return;
      }
      if (session) onFrame(session, f);
      else early.push(f);
    },
    (line) => say2(`unparseable seam line: ${line.slice(0, 120)}`)
  );
  const accept = async (hello) => {
    let snapshot;
    let snapshot_error;
    if (hello.snapshot && host.snapshot) {
      try {
        snapshot = host.snapshot();
      } catch {
        snapshot_error = "snapshot failed";
        say2("seam snapshot failed");
      }
    }
    const welcome = (id, resumed2) => writeFrame(socket, {
      t: "welcome",
      seam: SEAM_PROTOCOL,
      build: host.build,
      pid: process.pid,
      session: id,
      resumed: resumed2,
      ack: true,
      ...id === null && host.count ? { sessions: host.count() } : {},
      ...id === null && host.path ? { path: host.path } : {},
      ...snapshot ? { snapshot } : {},
      ...snapshot_error ? { snapshot_error } : {}
    });
    if (hello.probe || hello.snapshot) {
      welcome(null, false);
      socket.end();
      return;
    }
    if (host.draining?.()) {
      say2("seam hello dropped: the daemon is handing over to its successor");
      socket.destroy();
      return;
    }
    let s2 = hello.session ? host.find(hello.session) : null;
    const resumed = !!s2;
    if (!s2) {
      const opened = await host.open(hello);
      if (typeof opened === "string") return refuse2(opened);
      s2 = opened;
    }
    const grace = graceTimers.get(s2);
    if (grace) clearTimeout(grace);
    graceTimers.delete(s2);
    session = s2;
    owners.set(s2, socket);
    welcome(s2.id, resumed);
    s2.attach(
      (msg) => writeFrame(socket, { t: "rpc", msg }),
      (line) => writeFrame(socket, { t: "log", line })
    );
    say2(
      `seam session ${s2.id} ${resumed ? "resumed" : "opened"} for pid ${hello.pid} (${hello.build})`
    );
    for (const f of early.splice(0)) onFrame(s2, f);
  };
  socket.on("close", () => {
    clearTimeout(helloTimer);
    const s2 = session;
    if (!s2 || byeing || owners.get(s2) !== socket) return;
    owners.delete(s2);
    s2.attach(null, null);
    say2(`seam of session ${s2.id} closed without bye — ending it in ${graceMs}ms unless reattached`);
    const t = setTimeout(() => {
      graceTimers.delete(s2);
      void s2.end("the thin bridge is gone (seam closed without bye)");
    }, graceMs);
    t.unref?.();
    graceTimers.set(s2, t);
  });
}
function streamSeamSession(id, open, onLost, onLog) {
  const input = new PassThrough();
  const output = new PassThrough();
  let logSink = null;
  const engine = open({ input, output }, (line) => {
    onLog?.(line);
    logSink?.(line);
  });
  let sink = null;
  createInterface({ input: output, terminal: false }).on("line", (line) => {
    if (!line.trim()) return;
    let msg;
    try {
      msg = JSON.parse(line);
    } catch {
      return;
    }
    if (sink) sink(msg);
    else onLost?.(msg);
  });
  let ending = null;
  return {
    id,
    // Session gone — input closed: writing to an ended stream would be an error.
    deliver: (msg) => void (input.writableEnded || input.write(JSON.stringify(msg) + "\n")),
    attach: (s2, l) => {
      sink = s2;
      logSink = l ?? null;
    },
    end: (why) => ending ??= engine.leave(why).then(() => new Promise((r) => setImmediate(r))).then(() => void input.end())
  };
}
var fail = (code, message) => Object.assign(new Error(message), { code });
var DAEMON_RISE_MS = 15e3;
var socketAnswers = (path) => new Promise((r) => {
  const probe2 = connect2(path);
  probe2.once("connect", () => {
    probe2.destroy();
    r(true);
  });
  probe2.once("error", () => r(false));
});
async function listenSeam(authDir, onSocket) {
  const bad = seamEntranceProblem(authDir);
  if (bad) throw fail("EUNSAFE", `the seam entrance is not private: ${bad}`);
  const path = seamSocketPath(authDir);
  if (await socketAnswers(path)) throw fail("EADDRINUSE", `a daemon already listens on ${path}`);
  const lockPath = seamDaemonLockPath(authDir);
  const lock = takeFileLock(lockPath, DAEMON_RISE_MS);
  if (!lock.held)
    throw fail(
      "EADDRINUSE",
      lock.fault ?? `the daemon lock ${lockPath} is held by pid ${lock.holder?.pid ?? "?"}, rising for ${Math.round((Date.now() - (lock.holder?.started_at ?? Date.now())) / 1e3)}s — its socket does not answer yet`
    );
  const win = process.platform === "win32";
  try {
    if (!win) {
      try {
        unlinkSync2(path);
      } catch {
      }
    }
    const server = createServer(onSocket);
    await new Promise((r, reject) => {
      server.once("error", reject);
      server.listen(path, () => r());
    });
    if (!win) chmodSync(path, 384);
    server.once("close", lock.release);
    process.once("exit", lock.release);
    return server;
  } catch (e) {
    lock.release();
    throw e;
  }
}

// js/shared/semver.ts
function parseVersion(v) {
  const m = /^v?(\d+)\.(\d+)\.(\d+)/.exec((v ?? "").trim());
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null;
}
function compareVersions(a, b) {
  const pa = parseVersion(a);
  const pb = parseVersion(b);
  if (!pa || !pb) return 0;
  for (let i = 0; i < 3; i++) if (pa[i] !== pb[i]) return pa[i] - pb[i];
  return 0;
}

// js/bridge/config.ts
import { mkdirSync as mkdirSync3, readFileSync as readFileSync5, renameSync as renameSync2, writeFileSync as writeFileSync2 } from "node:fs";
import { homedir as homedir4 } from "node:os";
import { join as join6 } from "node:path";

// js/bridge/streams.ts
var FLUSH_STOP_MS = 5e3;
var deadStreams = /* @__PURE__ */ new WeakSet();
var out = scoped(() => ({ stream: null }));
var sessionStream = () => out.stream ?? process.stdout;
function setSessionOutput(s2) {
  out.stream = s2;
}
var processLog = null;
function setProcessLog(fn) {
  processLog = fn;
}
function canWrite(s2) {
  return !!s2 && !deadStreams.has(s2) && !s2.destroyed && s2.writable !== false;
}
function guardStream(s2) {
  if (s2) s2.on("error", () => deadStreams.add(s2));
}
var backlogged = /* @__PURE__ */ new WeakSet();
function writeTo(s2, text2) {
  if (!canWrite(s2)) return false;
  try {
    const fit = s2.write(text2);
    if (!fit && !backlogged.has(s2)) s2.once("drain", () => backlogged.delete(s2));
    if (fit) backlogged.delete(s2);
    else backlogged.add(s2);
    return true;
  } catch {
    deadStreams.add(s2);
    return false;
  }
}
function log(msg) {
  const line = `[${BRIDGE_NAME} ${(/* @__PURE__ */ new Date()).toISOString()}] ${msg}
`;
  const sink = currentScope().log ?? processLog;
  if (sink) sink(line);
  else writeTo(process.stderr, line);
}
function debug(msg) {
  if (CFG?.debug) log(`debug: ${msg}`);
}
function emit(msg) {
  if (!out.stream && processLog)
    return processLog(`emit outside of a session, dropped: ${JSON.stringify(msg).slice(0, 200)}
`);
  writeTo(sessionStream(), JSON.stringify(msg) + "\n");
}
function flushStdout(out7 = sessionStream()) {
  return new Promise((resolve11) => {
    if (!canWrite(out7)) return resolve11();
    let done = false;
    const finish2 = () => {
      if (done) return;
      done = true;
      out7.off("error", finish2);
      out7.off("close", finish2);
      resolve11();
    };
    out7.once("error", finish2);
    out7.once("close", finish2);
    if (backlogged.has(out7)) out7.once("drain", finish2);
    else out7.write("", finish2);
    setTimeout(finish2, FLUSH_STOP_MS).unref();
  });
}

// js/bridge/config.ts
var PRODUCTION_URLS = new Set(LANGS.map((l) => strip(SERVER_URLS[l])));
function strip(url) {
  return url.replace(/\/+$/, "");
}
var isProductionServer = (url) => PRODUCTION_URLS.has(strip(url));
function resolveServerChoice(word3) {
  const w5 = word3.trim();
  const chosen = LANGS.find((l) => SERVER_CHOICE[l].test(w5));
  if (chosen) return SERVER_URLS[chosen];
  try {
    return new URL(w5).href;
  } catch {
    return null;
  }
}
var serverChoicePath = (authDir) => join6(authDir, "server");
function readServerChoice(authDir) {
  try {
    const text2 = readFileSync5(serverChoicePath(authDir), "utf8").trim();
    return text2 ? new URL(text2).href : null;
  } catch {
    return null;
  }
}
function writeServerChoice(authDir, url) {
  const path = serverChoicePath(authDir);
  mkdirSync3(authDir, { recursive: true, mode: 448 });
  const tmp = `${path}.tmp-${process.pid}`;
  writeFileSync2(tmp, url + "\n", { mode: 384 });
  renameSync2(tmp, path);
  return path;
}
var cfgSlot = scoped(() => ({ cfg: null }));
var CFG = new Proxy({}, {
  get: (_, k) => cfgSlot.cfg ? Reflect.get(cfgSlot.cfg, k) : void 0,
  has: (_, k) => !!cfgSlot.cfg && Reflect.has(cfgSlot.cfg, k)
});
function setConfig(cfg) {
  cfgSlot.cfg = cfg;
  setServerLang(cfg.serverUrl);
}
var ArgsError = class extends Error {
  code;
  /** Text for stdout instead of stderr (--version). */
  out;
  constructor(message, code, out7 = null) {
    super(message);
    this.code = code;
    this.out = out7;
  }
};
function parseArgs(argv2) {
  try {
    return readArgs(argv2);
  } catch (e) {
    if (!(e instanceof ArgsError)) throw e;
    if (e.out !== null) process.stdout.write(e.out);
    else log(e.message);
    process.exit(e.code);
  }
}
function readArgs(argv2) {
  const cfg = {
    serverUrl: "",
    timeoutMs: Number(envOf(envName("BRIDGE_TIMEOUT"))) || 12e4,
    authDir: envOf(envName("BRIDGE_AUTH_DIR")) || join6(homedir4(), HOME_DIR),
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
    // Flag only: an older bridge fails loudly on an unknown flag but would ignore a variable
    // and stand as a full seat with a hold record.
    satellite: false,
    tools: null
  };
  for (let i = 0; i < argv2.length; i++) {
    const a = argv2[i];
    if (a === "--timeout") cfg.timeoutMs = Number(argv2[++i]);
    else if (a === "--tools") {
      const names2 = (argv2[++i] ?? "").split(",").map((s2) => s2.trim()).filter(Boolean);
      if (!names2.length) {
        log("--tools needs a comma-separated list of tool names");
        process.exit(2);
      }
      cfg.tools = new Set(names2.map((n) => n.startsWith(TOOL_PREFIX) ? n : tool(n)));
    } else if (a === "--auth-dir") cfg.authDir = argv2[++i];
    else if (a === "--client-name") cfg.clientName = argv2[++i];
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
  if (!Number.isFinite(cfg.timeoutMs) || cfg.timeoutMs < 1e3) cfg.timeoutMs = 12e4;
  readPat(cfg);
  return cfg;
}
function readPat(cfg) {
  const fromEnv = envOf(envName("BRIDGE_TOKEN"))?.trim();
  if (fromEnv) {
    cfg.pat = fromEnv;
    cfg.patSource = envName("BRIDGE_TOKEN");
    return;
  }
  const file = join6(cfg.authDir, "token");
  try {
    const text2 = readFileSync5(file, "utf8").trim();
    if (text2) {
      cfg.pat = text2;
      cfg.patSource = file;
    }
  } catch {
  }
}

// js/bridge/oauth/flow.ts
import { randomBytes as randomBytes2 } from "node:crypto";

// js/bridge/errors.ts
var NOT_SENT = "not-sent";
var UNKNOWN = "unknown";
var UpstreamError = class extends Error {
  static NOT_SENT = NOT_SENT;
  static UNKNOWN = UNKNOWN;
  kind;
  // `presented` carries the access token the refused request actually used —
  // knowledge only the caller has. The store may have moved on since, and a
  // token a sibling has already replaced must not be blamed for this refusal.
  presented;
  // `outcome` says whether the request this error ends could ALREADY have taken
  // effect upstream. NOT_SENT — it never reached the server, so a retry is free.
  // UNKNOWN — it went out and the answer was lost, so a blind retry may write a
  // second time. Nothing between those two is honest, and saying neither is what
  // made "retry the call" dangerous: under one sentence lived both outcomes, and
  // the caller could not tell them apart. Witnessed: an update reported as failed
  // had applied, and the retry advised by that sentence collided with its own
  // first write.
  outcome;
  // `retryable` marks a network failure worth another knock from the bridge
  // itself: a connection that failed outright. A timeout is not — it already
  // spent the whole deadline, and repeating it multiplies the wait.
  retryable;
  constructor(message, kind, presented = null, outcome = UNKNOWN, retryable = false) {
    super(message);
    this.kind = kind;
    this.presented = presented;
    this.outcome = outcome;
    this.retryable = retryable;
  }
};
var TokenError = class extends Error {
  oauthError;
  status;
  oauthMessage;
  constructor(message, oauthError, status, oauthMessage) {
    super(message);
    this.oauthError = oauthError;
    this.status = status;
    this.oauthMessage = oauthMessage;
  }
};
var DEFINITIVE_OAUTH_ERRORS = /* @__PURE__ */ new Set([
  "invalid_grant",
  "invalid_token",
  "invalid_client",
  "unauthorized_client"
]);
var TokenRefused = class extends Error {
};
var utcTime = (ms2) => new Date(ms2).toISOString().replace("T", " ").slice(0, 19) + " UTC";
var AuthPending = class extends Error {
  authorizeUrl;
  constructor(url, note4, device) {
    super(
      `authorization required — open in a browser: ${url}${note4 ? ` (${note4})` : ""}` + (typeof device === "string" ? ` — no sign-in by code: ${device}` : device ? ` — or sign in from another device: ${device.link} (code ${device.user_code}, valid until ${utcTime(device.expires_at)}; a call after that brings a new one)` : "") + ` — or give the bridge a personal access token instead (${envName("BRIDGE_TOKEN")}, or the file <auth-dir>/token)`
    );
    this.authorizeUrl = url;
  }
};
var HoldOffError = class extends Error {
  // retryNow marks the one flavor where an immediate retry is the honest move:
  // the FIRST early refusal of a needed refresh. The cooldown refusal and a
  // refusal that repeats both name waits that are real.
  retryNow;
  // When the hold ends, on the server-corrected clock — the refresh token's own
  // hour; null when nobody knows. A caller sits out a short one inside the call
  // and answers a long one with the login.
  until;
  constructor(message, retryNow = false, until = null) {
    super(message);
    this.retryNow = retryNow;
    this.until = until;
  }
};
var DeadGrantError = class extends Error {
  expired;
  constructor(message, expired = false) {
    super(message);
    this.expired = expired;
  }
};
var CLOSED = /* @__PURE__ */ new Set(["UND_ERR_SOCKET", "ECONNRESET", "EPIPE"]);
var closedUnder = (e) => {
  const err = e;
  return CLOSED.has(err?.code ?? "") || CLOSED.has(err?.cause?.code ?? "");
};
function errorCode(e) {
  const err = e;
  return err?.cause?.code ?? err?.code;
}
function errorMessage(e) {
  return e instanceof Error ? e.message : String(e);
}

// js/bridge/store.ts
import { createHash as createHash5 } from "node:crypto";
import {
  appendFileSync,
  mkdirSync as mkdirSync4,
  readFileSync as readFileSync6,
  renameSync as renameSync3,
  statSync,
  unlinkSync as unlinkSync3,
  writeFileSync as writeFileSync3
} from "node:fs";
import { join as join7 } from "node:path";
var b64url = (buf) => Buffer.from(buf).toString("base64url");
var sha256 = (s2) => createHash5("sha256").update(s2).digest();
var sleep = (ms2) => new Promise((r) => setTimeout(r, ms2));
function storePath() {
  const u = new URL(CFG.serverUrl);
  const h = b64url(sha256(u.origin + u.pathname)).slice(0, 10);
  return join7(CFG.authDir, `${u.hostname}_${h}.json`);
}
function loadStore() {
  try {
    return JSON.parse(readFileSync6(storePath(), "utf8"));
  } catch {
    return {};
  }
}
function saveStore(patch) {
  mkdirSync4(CFG.authDir, { recursive: true, mode: 448 });
  const next = {
    ...loadStore(),
    ...patch,
    server_url: CFG.serverUrl,
    updated_at: (/* @__PURE__ */ new Date()).toISOString()
  };
  const tmp = `${storePath()}.tmp-${process.pid}`;
  try {
    writeFileSync3(tmp, JSON.stringify(next, null, 2), { mode: 384 });
    renameSync3(tmp, storePath());
  } catch (e) {
    try {
      unlinkSync3(tmp);
    } catch {
    }
    throw e;
  }
  return next;
}
function serverCachePath() {
  return storePath() + ".server-answers";
}
function loadServerCache() {
  try {
    return JSON.parse(readFileSync6(serverCachePath(), "utf8"));
  } catch {
    return {};
  }
}
function saveServerCache(patch) {
  try {
    mkdirSync4(CFG.authDir, { recursive: true, mode: 448 });
    const tmp = `${serverCachePath()}.tmp-${process.pid}`;
    writeFileSync3(tmp, JSON.stringify({ ...loadServerCache(), ...patch }), { mode: 384 });
    renameSync3(tmp, serverCachePath());
  } catch {
  }
}
function grantLogPath() {
  return join7(CFG.authDir, "grant.log");
}
function grantLog(msg) {
  appendJournal(grantLogPath(), msg);
}
function rotateJournal(path, max) {
  try {
    if (statSync(path).size > max) renameSync3(path, `${path}.1`);
  } catch {
  }
}
function appendJournal(path, msg) {
  try {
    mkdirSync4(CFG.authDir, { recursive: true, mode: 448 });
    rotateJournal(path, 128e3);
    appendFileSync(path, `${(/* @__PURE__ */ new Date()).toISOString()} pid=${process.pid} ${BUILD} ${msg}
`, {
      mode: 384
    });
  } catch {
  }
}
function standingsLogPath() {
  return join7(CFG.authDir, "standings.log");
}
function standingLog(msg) {
  appendJournal(standingsLogPath(), msg);
}
function grantStatePath() {
  return storePath() + ".grant-state";
}
function loadGrantState() {
  try {
    return JSON.parse(readFileSync6(grantStatePath(), "utf8"));
  } catch {
    return {};
  }
}
function saveGrantState(patch) {
  try {
    mkdirSync4(CFG.authDir, { recursive: true, mode: 448 });
    const next = { ...loadGrantState(), ...patch };
    const tmp = `${grantStatePath()}.tmp-${process.pid}`;
    writeFileSync3(tmp, JSON.stringify(next), { mode: 384 });
    renameSync3(tmp, grantStatePath());
  } catch {
  }
}
function clearGrantState() {
  try {
    unlinkSync3(grantStatePath());
  } catch {
  }
}

// js/bridge/oauth/authlock.ts
import {
  mkdirSync as mkdirSync5,
  readdirSync,
  readFileSync as readFileSync7,
  renameSync as renameSync4,
  unlinkSync as unlinkSync4,
  writeFileSync as writeFileSync4
} from "node:fs";
import { connect as connect3 } from "node:net";
import { basename, dirname as dirname2, join as join8 } from "node:path";

// js/bridge/clock.ts
var SKEW_NOISE_MS = 5e3;
var SKEW_MATERIAL_MS = 3e4;
var clockSkewMs = null;
function skewMs() {
  if (clockSkewMs === null) {
    const s2 = Number(loadStore().clock_skew_ms);
    clockSkewMs = Number.isFinite(s2) ? s2 : 0;
  }
  return clockSkewMs;
}
function now() {
  return Date.now() + skewMs();
}
function noteServerDate(res) {
  const d = Date.parse(res?.headers?.get("date") || "");
  if (!Number.isFinite(d)) return;
  const measured = d - Date.now();
  const skew = Math.abs(measured) < SKEW_NOISE_MS ? 0 : measured;
  const prev = skewMs();
  clockSkewMs = skew;
  if (Math.abs(skew - prev) >= SKEW_MATERIAL_MS) {
    try {
      saveStore({ clock_skew_ms: skew });
    } catch {
    }
    grantLog(
      skew === 0 ? "machine clock is back in step with the server" : `machine clock is ${Math.round(Math.abs(skew) / 1e3)}s ${skew > 0 ? "behind" : "ahead of"} the server — token hours are judged by the server's clock (fix NTP to stop paying a 401 per rotation)`
    );
  }
}

// js/bridge/oauth/devicecode.ts
var DEVICE_GRANT = "urn:ietf:params:oauth:grant-type:device_code";
var DeviceRefusal = class extends Error {
  error;
  status;
  constructor(message, error, status) {
    super(message);
    this.error = error;
    this.status = status;
  }
};
function deviceOffered(meta) {
  const endpoint = meta.as.device_authorization_endpoint;
  const grants = meta.as.grant_types_supported;
  return typeof endpoint === "string" && !!endpoint && (!Array.isArray(grants) || grants.includes(DEVICE_GRANT));
}
async function post(url, type, body) {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": type === "json" ? "application/json" : "application/x-www-form-urlencoded"
    },
    body: type === "json" ? JSON.stringify(body) : new URLSearchParams(body).toString(),
    signal: AbortSignal.timeout(15e3)
  });
  noteServerDate(res);
  const answer2 = await res.json().catch(() => null) ?? {};
  if (!res.ok) {
    const error = typeof answer2.error === "string" ? answer2.error : void 0;
    const said2 = answer2.error_description ?? answer2.message ?? "";
    throw new DeviceRefusal(
      `POST ${url} -> ${res.status} ${error ?? ""} ${said2}`.trim(),
      error,
      res.status
    );
  }
  return answer2;
}
async function issueDeviceCode(meta, clientId) {
  const form = { client_id: clientId };
  if (meta.scope) form.scope = meta.scope;
  const a = await post(String(meta.as.device_authorization_endpoint), "form", form);
  const complete = a.verification_uri_complete ?? a.verification_uri;
  if (typeof a.device_code !== "string" || typeof complete !== "string") {
    throw new DeviceRefusal("the device code answer carries no code or no page", void 0);
  }
  const code = {
    client_id: clientId,
    device_code: a.device_code,
    user_code: String(a.user_code ?? ""),
    link: complete,
    expires_at: Date.now() + (Number(a.expires_in) || 300) * 1e3,
    // RFC 8628 §3.2: five seconds when the server names no interval.
    interval_ms: (Number.isFinite(Number(a.interval)) ? Number(a.interval) : 5) * 1e3
  };
  log(
    `sign in from another device: ${code.link} (code ${code.user_code}, valid until ${utcTime(code.expires_at)})`
  );
  return code;
}

// js/bridge/oauth/authlock.ts
function authLockPath() {
  return storePath() + ".auth-pending";
}
function pidAlive(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (e) {
    return e.code === "EPERM";
  }
}
function portListening(port, timeoutMs = 700) {
  return new Promise((resolve11) => {
    if (!Number.isInteger(port)) return resolve11(false);
    const sock = connect3({ host: "127.0.0.1", port });
    const done = (v) => {
      sock.destroy();
      resolve11(v);
    };
    sock.setTimeout(timeoutMs, () => done(false));
    sock.once("connect", () => done(true));
    sock.once("error", () => done(false));
  });
}
function readAuthLock() {
  try {
    return JSON.parse(readFileSync7(authLockPath(), "utf8"));
  } catch {
    return null;
  }
}
function writeAuthLock(fields) {
  mkdirSync5(CFG.authDir, { recursive: true, mode: 448 });
  const tmp = `${authLockPath()}.tmp-${process.pid}`;
  const body = JSON.stringify({
    ...fields,
    pid: fields.pid ?? process.pid,
    started_at: fields.started_at ?? Date.now()
  });
  try {
    writeFileSync4(tmp, body, { mode: 384 });
    renameSync4(tmp, authLockPath());
  } catch {
    try {
      unlinkSync4(tmp);
    } catch {
    }
    writeFileSync4(authLockPath(), body, { mode: 384 });
  }
}
function releaseAuthLock(owns) {
  try {
    const l = readAuthLock();
    if (owns && (!l || !owns(l))) return;
    unlinkSync4(authLockPath());
  } catch {
  }
}
var tabMarkPath = (state2) => `${authLockPath()}.tab-${state2}`;
function claimTab(state2) {
  try {
    mkdirSync5(CFG.authDir, { recursive: true, mode: 448 });
    writeFileSync4(tabMarkPath(state2), "", { flag: "wx", mode: 384 });
    return true;
  } catch {
    return false;
  }
}
function sweepTabMarks() {
  const prefix = `${basename(authLockPath())}.tab-`;
  try {
    for (const f of readdirSync(dirname2(authLockPath()))) {
      if (f.startsWith(prefix)) unlinkSync4(join8(dirname2(authLockPath()), f));
    }
  } catch {
  }
}
function installAuthLockExitHook() {
  process.on("exit", () => {
    try {
      const l = JSON.parse(readFileSync7(authLockPath(), "utf8"));
      if (l.pid === process.pid && !l.authorize_url) unlinkSync4(authLockPath());
    } catch {
    }
  });
}

// js/bridge/oauth/callback.ts
import { createServer as createServer2 } from "node:http";
var PAGE_HOLD_MS = 2e4;
function bindCallback(port) {
  return new Promise((resolve11, reject) => {
    let handOff = null;
    let received = null;
    let browser = null;
    let mint = null;
    let loginKey = "";
    const deliver3 = (v) => {
      if (handOff) handOff(v);
      else received = v;
    };
    const esc = (s2) => String(s2).replace(
      /[<>&"]/g,
      (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" })[c]
    );
    const tellBrowser = (line) => {
      if (!browser) return;
      const res = browser;
      browser = null;
      try {
        res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
        res.end(`<h3>${line}</h3>`);
      } catch {
      }
    };
    const server = createServer2((req, res) => {
      const u = new URL(req.url ?? "/", `http://127.0.0.1:${port}`);
      if (u.pathname === "/login" && mint && loginKey && u.searchParams.get("k") === loginKey) {
        mint().then(
          (to) => {
            res.writeHead(302, { location: to, "cache-control": "no-store" });
            res.end();
          },
          (e) => {
            res.writeHead(502, { "content-type": "text/html; charset=utf-8" });
            res.end(words(CALLBACK).loginUnreachable(esc(errorMessage(e))));
          }
        );
        return;
      }
      if (u.pathname !== "/callback") {
        res.writeHead(404);
        res.end();
        return;
      }
      const err = u.searchParams.get("error");
      if (browser) tellBrowser(words(CALLBACK).anotherTab());
      browser = res;
      if (err) tellBrowser(words(CALLBACK).refused(esc(err)));
      else setTimeout(() => tellBrowser(words(CALLBACK).stillRunning()), PAGE_HOLD_MS).unref();
      deliver3({ code: u.searchParams.get("code"), state: u.searchParams.get("state"), err });
    });
    server.once("error", reject);
    server.listen(port, "127.0.0.1", () => {
      server.removeListener("error", reject);
      server.on("error", (e) => log(`callback server: ${e.message}`));
      resolve11({
        port,
        report: (failure) => tellBrowser(
          failure ? words(CALLBACK).failed(esc(failure)) : words(CALLBACK).authenticated()
        ),
        close: () => {
          tellBrowser(words(CALLBACK).abandoned());
          server.close();
        },
        serveLogin: (key2, fn) => {
          loginKey = key2;
          mint = fn;
        },
        // No deadline by default: the login lives as long as the bridge holding
        // it, so a human who comes back to the tab late still lands it (graph
        // @nks/nks-dev, node #4721). A bridge left by its harness bounds the wait itself.
        waitForCode: (expectedState, timeoutMs = 0) => new Promise((res, rej) => {
          const timer = timeoutMs > 0 ? setTimeout(
            () => rej(new Error("timed out waiting for the browser authorization")),
            timeoutMs
          ) : null;
          const settle2 = (v) => {
            if (v.state !== expectedState) {
              tellBrowser(words(CALLBACK).loginOver());
              return false;
            }
            if (timer) clearTimeout(timer);
            handOff = null;
            if (v.err) rej(new Error(`authorization refused: ${v.err}`));
            else if (!v.code) rej(new Error("callback missing code"));
            else res(v.code);
            return true;
          };
          if (received && settle2(received)) return;
          received = null;
          handOff = settle2;
        })
      });
    });
  });
}

// js/bridge/oauth/deviceclient.ts
var DEVICE_CLIENT_ID = BRIDGE_NAME;
var clientRefused = (e) => e instanceof DeviceRefusal && /^(invalid_client|unauthorized_client)$/.test(e.error ?? "");
var bareRefusal = (e) => e instanceof DeviceRefusal && e.error === void 0 && (e.status === 400 || e.status === 401);
var DeviceUnset = class extends DeviceRefusal {
};
async function codeThrough(meta, redirectUri, clientId) {
  const named2 = CFG.deviceClientId || DEVICE_CLIENT_ID;
  const id = clientId ?? named2;
  try {
    return await issueDeviceCode(meta, id);
  } catch (e) {
    if (bareRefusal(e)) {
      throw new DeviceUnset(words(DEVICE_CLIENT).bareRefusal(id, e.status), void 0, e.status);
    }
    if (!clientRefused(e)) throw e;
    const word3 = e.error;
    if (id === CFG.deviceClientId) {
      throw new DeviceUnset(words(DEVICE_CLIENT).namedRefused(id, String(word3)), word3);
    }
    if (id !== named2) return await codeThrough(meta, redirectUri, void 0);
    if (CFG.deviceRegister) {
      log(`device client ${id} refused (${errorMessage(e)}) — registering one`);
      return await issueDeviceCode(meta, await registerDeviceClient(meta, redirectUri));
    }
    throw new DeviceUnset(words(DEVICE_CLIENT).unset(id), word3);
  }
}
async function registerDeviceClient(meta, redirectUri) {
  if (CFG.staticClientId) return CFG.staticClientId;
  if (!meta.as.registration_endpoint) {
    throw new DeviceRefusal("server offers no dynamic client registration", void 0);
  }
  const reg = await post(meta.as.registration_endpoint, "json", {
    client_name: CFG.clientName,
    redirect_uris: [redirectUri],
    grant_types: [DEVICE_GRANT, "refresh_token"],
    token_endpoint_auth_method: "none"
  });
  if (typeof reg.client_id !== "string") {
    throw new DeviceRefusal("registration answered without a client_id", void 0);
  }
  log(`registered OAuth client ${reg.client_id} for sign-in from another device`);
  return reg.client_id;
}

// js/bridge/oauth/discovery.ts
import { spawn } from "node:child_process";
import { join as join9 } from "node:path";
async function fetchJson(url, opts = {}, timeoutMs = 15e3) {
  const res = await fetch(url, { ...opts, signal: AbortSignal.timeout(timeoutMs) });
  noteServerDate(res);
  if (!res.ok) throw new Error(`${opts.method || "GET"} ${url} -> ${res.status}`);
  return res.json();
}
async function discover(wwwAuthenticate) {
  const meta = await discoverMeta(wwwAuthenticate);
  saveStore({ meta });
  return meta;
}
async function discoverMeta(wwwAuthenticate) {
  const u = new URL(CFG.serverUrl);
  const candidates = [];
  const m = /resource_metadata="?([^",\s]+)"?/.exec(wwwAuthenticate || "");
  if (m) candidates.push(m[1]);
  const path = u.pathname === "/" ? "" : u.pathname;
  candidates.push(`${u.origin}/.well-known/oauth-protected-resource${path}`);
  candidates.push(`${u.origin}/.well-known/oauth-protected-resource`);
  let prm = null;
  for (const c of candidates) {
    try {
      prm = await fetchJson(c);
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
    `${asUrl.origin}${asPath}/.well-known/openid-configuration`
  ];
  let as = null;
  for (const c of asCandidates) {
    try {
      as = await fetchJson(c);
      debug(`AS metadata: ${c}`);
      break;
    } catch (e) {
      debug(`no AS metadata at ${c}: ${errorMessage(e)}`);
    }
  }
  if (!as?.authorization_endpoint || !as?.token_endpoint) {
    throw new Error(
      `OAuth discovery failed for ${CFG.serverUrl}: no authorization server metadata reachable`
    );
  }
  const scope = CFG.scope || (prm?.scopes_supported?.length ? prm.scopes_supported.join(" ") : null);
  return { as, resource: CFG.resource || prm?.resource || CFG.serverUrl, scope };
}
var resourceOf = (meta) => CFG.resource || meta.resource;
var CALLBACK_PORT_RUNGS = 3;
function callbackPort(rung = 0) {
  const d = sha256(new URL(CFG.serverUrl).origin);
  return 42e3 + (d[0] * 256 + d[1] + rung * 613) % 2e3;
}
var REGISTRATION_REUSE_MS = 45 * 6e4;
function registrationReusable(client, redirectUri) {
  if (!client?.client_id || client.redirect_uri !== redirectUri) return false;
  return !!client.registered_at && now() - client.registered_at < REGISTRATION_REUSE_MS;
}
async function ensureClient(meta, redirectUri) {
  if (CFG.staticClientId) return { client_id: CFG.staticClientId };
  const stored = loadStore().client;
  if (registrationReusable(stored, redirectUri)) return stored;
  if (stored?.client_id && stored.redirect_uri === redirectUri) {
    log(
      stored.registered_at ? "the dynamic client registration is older than the server's cleanup horizon — registering anew for this login" : "the dynamic client registration carries no timestamp (an earlier build wrote it) — registering anew for this login"
    );
  }
  if (!meta.as.registration_endpoint) {
    throw new Error(
      `server offers no dynamic client registration; pass ${envName("BRIDGE_CLIENT_ID")}`
    );
  }
  const reg = await fetchJson(meta.as.registration_endpoint, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      client_name: CFG.clientName,
      redirect_uris: [redirectUri],
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
      token_endpoint_auth_method: "none"
    })
  });
  const client = {
    client_id: reg.client_id,
    redirect_uri: redirectUri,
    registered_at: now()
  };
  saveStore({ client });
  log(`registered OAuth client ${reg.client_id}`);
  return client;
}
function openBrowser(url) {
  log(`authorize in the browser:
  ${url}`);
  if (CFG.noBrowser) return;
  const [cmd, args] = process.platform === "darwin" ? ["open", [url]] : process.platform === "win32" ? windowsOpener(url) : ["xdg-open", [url]];
  const manually = (e) => log(`could not open a browser (${errorMessage(e)}) — open the URL above manually`);
  try {
    const child = spawn(cmd, args, { stdio: "ignore", detached: true });
    child.on("error", manually);
    child.unref();
  } catch (e) {
    manually(e);
  }
}
function windowsOpener(url) {
  const powershell = join9(
    process.env.SystemRoot || "C:\\Windows",
    "System32",
    "WindowsPowerShell",
    "v1.0",
    "powershell.exe"
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
      Buffer.from(command, "utf16le").toString("base64")
    ]
  ];
}

// js/bridge/oauth/pacing.ts
var pauses = (v, fallback2) => (v || fallback2).split(",").map(Number).filter((n) => Number.isFinite(n) && n >= 0);
var DEAD_RECHECK_MS = pauses(process.env[envName("BRIDGE_DEAD_RECHECK_MS")], "1000,2000");
var IN_CALL_WAIT_MS = Number(process.env[envName("BRIDGE_IN_CALL_WAIT_MS")]) || 1e4;
var ORPHAN_FLOW_MS = Number(process.env[envName("BRIDGE_ORPHAN_FLOW_MS")]) || 5 * 6e4;
var pauseUntil = (signal, ms2) => new Promise((r) => {
  const done = () => {
    clearTimeout(t);
    signal.removeEventListener("abort", done);
    r();
  };
  const t = setTimeout(done, ms2);
  signal.addEventListener("abort", done, { once: true });
});

// js/bridge/tokens.ts
function jwtClaims(token) {
  try {
    return JSON.parse(Buffer.from(String(token).split(".")[1], "base64url").toString());
  } catch {
    return null;
  }
}
var CLOCK_SKEW_MS = 6e4;
function tokenSchedule(body, refresh) {
  const a = jwtClaims(body.access_token);
  const r = jwtClaims(refresh);
  const accessExp = Number.isFinite(a?.exp) ? a.exp * 1e3 : body.expires_in ? now() + body.expires_in * 1e3 : null;
  const skew = accessExp ? Math.min(CLOCK_SKEW_MS, Math.max(0, (accessExp - now()) / 2)) : 0;
  return {
    expires_at: accessExp ? accessExp - skew : null,
    refresh_not_before: Number.isFinite(r?.nbf) ? r.nbf * 1e3 : null,
    refresh_expires_at: Number.isFinite(r?.exp) ? r.exp * 1e3 : null
  };
}
function refreshHours(t) {
  const c = jwtClaims(t?.refresh_token);
  return {
    nbf: Number.isFinite(t?.refresh_not_before) ? t.refresh_not_before : Number.isFinite(c?.nbf) ? c.nbf * 1e3 : null,
    exp: Number.isFinite(t?.refresh_expires_at) ? t.refresh_expires_at : Number.isFinite(c?.exp) ? c.exp * 1e3 : null
  };
}
function tokenUsable(t, { rejected = null, marginMs = 0 } = {}) {
  if (!t?.access_token) return false;
  if (rejected && t.access_token === rejected) return false;
  if (t.expires_at && t.expires_at - now() <= marginMs) return false;
  return true;
}
function usableTokens(opts) {
  const t = loadStore().tokens;
  return tokenUsable(t, opts) ? t : null;
}

// js/bridge/oauth/tokenrequest.ts
async function tokenRequestOnce(meta, params) {
  const res = await fetch(meta.as.token_endpoint, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(params).toString(),
    signal: AbortSignal.timeout(3e4)
  });
  noteServerDate(res);
  const body = await res.json().catch(() => null) ?? {};
  if (!res.ok) {
    throw new TokenError(
      `token endpoint ${res.status}: ${body.error || ""} ${body.error_description || body.message || ""}`.trim(),
      body.error,
      res.status,
      body.message
    );
  }
  const before = loadStore().tokens;
  const refresh = body.refresh_token ?? before?.refresh_token;
  const byCode = params.grant_type === DEVICE_GRANT || params.grant_type === "refresh_token" && !!before?.by_code && before.client_id === params.client_id;
  const tokens = {
    access_token: body.access_token,
    refresh_token: refresh,
    ...tokenSchedule(body, refresh),
    ...params.client_id ? { client_id: params.client_id } : {},
    ...byCode ? { by_code: true } : {}
  };
  saveStore({ tokens });
  clearGrantState();
  grantLog(
    `tokens stored (${params.grant_type}); access good for ${tokens.expires_at ? Math.round((tokens.expires_at - now()) / 1e3) + "s" : "an unstated time"}${tokens.refresh_not_before ? `, refresh usable in ${Math.round((tokens.refresh_not_before - now()) / 1e3)}s` : ""}`
  );
  return tokens;
}
var tokenRequestsInFlight = /* @__PURE__ */ new Set();
async function tokenRequest(meta, params) {
  const p = tokenRequestOnce(meta, params);
  tokenRequestsInFlight.add(p);
  try {
    return await p;
  } finally {
    tokenRequestsInFlight.delete(p);
  }
}

// js/bridge/oauth/device.ts
var SLOW_DOWN_MS = Number(process.env[envName("BRIDGE_DEVICE_SLOW_DOWN_MS")]) || 5e3;
var REISSUE_PAUSE_MS = Number(process.env[envName("BRIDGE_DEVICE_REISSUE_MS")]) || 3e4;
var never = new Promise(() => {
});
function deviceSide(meta, redirectUri, resume, onCode, called) {
  const halt = new AbortController();
  let tellFirst = () => {
  };
  const first2 = new Promise((r) => tellFirst = r);
  let unset2;
  const pause = (ms2) => pauseUntil(halt.signal, ms2);
  const fresh2 = async (clientId) => {
    try {
      const code = await codeThrough(meta, redirectUri, clientId);
      return halt.signal.aborted ? null : code;
    } catch (e) {
      if (e instanceof DeviceUnset) unset2 = e.message;
      log(`sign-in from another device not offered: ${errorMessage(e)}`);
      return null;
    }
  };
  const giveUp = () => {
    onCode(null, unset2);
    return never;
  };
  const newer = (code) => {
    const r = called();
    return r && r.device_code !== code.device_code && r.expires_at > code.expires_at ? r : null;
  };
  const run2 = async () => {
    if (!deviceOffered(meta)) {
      tellFirst(null);
      return never;
    }
    let code = resume && resume.expires_at > Date.now() ? resume : await fresh2(resume?.client_id);
    tellFirst(code ?? unset2 ?? null);
    if (unset2) return giveUp();
    onCode(code);
    let clientId = code?.client_id ?? resume?.client_id;
    for (; ; ) {
      while (!code) {
        await pause(REISSUE_PAUSE_MS);
        if (halt.signal.aborted) return never;
        code = await fresh2(clientId);
        if (unset2) return giveUp();
        if (code) onCode(code);
      }
      clientId = code.client_id;
      await pause(code.interval_ms);
      if (halt.signal.aborted) return never;
      const taken2 = newer(code);
      if (taken2) {
        debug(`device poll: taking the code ${taken2.user_code} a caller issued`);
        code = { ...taken2, interval_ms: Math.max(taken2.interval_ms, code.interval_ms) };
        onCode(code);
        continue;
      }
      let renew = Date.now() >= code.expires_at;
      if (!renew) {
        try {
          await tokenRequest(meta, {
            grant_type: DEVICE_GRANT,
            device_code: code.device_code,
            client_id: code.client_id,
            resource: resourceOf(meta)
          });
          return;
        } catch (e) {
          const word3 = e instanceof TokenError ? e.oauthError : void 0;
          if (word3 === "access_denied") {
            throw new Error("authorization refused on the other device", { cause: e });
          }
          if (word3 === "slow_down") {
            code = { ...code, interval_ms: code.interval_ms + SLOW_DOWN_MS };
            onCode(code);
          } else if (word3 && word3 !== "authorization_pending") {
            renew = true;
          } else if (!word3) debug(`device poll: ${errorMessage(e)} — asking again`);
        }
      }
      if (renew) {
        code = newer(code) ?? await fresh2(clientId);
        if (halt.signal.aborted) return never;
        if (unset2) return giveUp();
        onCode(code);
      }
    }
  };
  const landed = run2();
  landed.catch(() => {
  });
  return {
    first: first2,
    landed,
    stop: () => {
      halt.abort();
      tellFirst(null);
    }
  };
}

// js/bridge/oauth/devicehandout.ts
import { readFileSync as readFileSync8, renameSync as renameSync5, writeFileSync as writeFileSync5 } from "node:fs";
var freshPath = () => `${authLockPath()}.device`;
function callerCode(state2) {
  try {
    const f = JSON.parse(readFileSync8(freshPath(), "utf8"));
    return state2 && f.state === state2 ? f.code : void 0;
  } catch {
    return void 0;
  }
}
var later = (a, b) => !a || b && b.expires_at > a.expires_at ? b : a;
async function joinedPending(meta, l, note4) {
  const stale = later(l.device, callerCode(l.state));
  const device = stale && stale.expires_at <= Date.now() ? await renewed(meta, l, stale) : stale;
  return new AuthPending(l.authorize_url, note4, device ?? l.device_unset);
}
async function renewed(meta, l, stale) {
  const alive6 = (c) => c && c.expires_at > Date.now() ? c : void 0;
  let code;
  try {
    code = await issueDeviceCode(meta, stale.client_id);
  } catch (e) {
    log(`no fresh code for sign-in from another device: ${errorMessage(e)}`);
    return alive6(stale);
  }
  const other = callerCode(l.state);
  if (other && other.device_code !== stale.device_code) return alive6(other);
  const fresh2 = { ...code, interval_ms: Math.max(code.interval_ms, stale.interval_ms) };
  const tmp = `${freshPath()}.tmp-${process.pid}`;
  try {
    writeFileSync5(tmp, JSON.stringify({ state: l.state, code: fresh2 }), { mode: 384 });
    renameSync5(tmp, freshPath());
  } catch (e) {
    log(`fresh code for sign-in from another device not kept: ${errorMessage(e)}`);
    return alive6(stale);
  }
  return fresh2;
}

// js/bridge/oauth/flow.ts
var CLAIM_WAIT_MS = Number(process.env[envName("BRIDGE_CLAIM_WAIT_MS")]) || 15e3;
var CLAIM_GLANCE_MS = 1e3;
var LANDED_POLL_MS = Number(process.env[envName("BRIDGE_LANDED_POLL_MS")]) || 2e3;
var RELEASE_GAP_MS = Number(process.env[envName("BRIDGE_RELEASE_GAP_MS")]) || 0;
var DEVICE_FIRST_WAIT_MS = 1e4;
var flows = /* @__PURE__ */ new Set();
function pendingFlow() {
  return flows.size ? Promise.allSettled([...flows]).then(() => {
  }) : null;
}
var clicked = /* @__PURE__ */ new Set();
function clickPending() {
  return clicked.size ? Promise.allSettled([...clicked]).then(() => {
  }) : null;
}
var loginLink = (port, key2) => `http://127.0.0.1:${port}/login?k=${key2}`;
var linkPrefix = (port) => `http://127.0.0.1:${port}/login?k=`;
var redirectFor = (port) => `http://127.0.0.1:${port}/callback`;
var grantPrint = (t) => {
  const both = [t?.refresh_token, t?.access_token].filter(Boolean).join("|");
  return both ? b64url(sha256(both)).slice(0, 16) : "";
};
var grantBack = (judged) => {
  const now2 = loadStore().tokens;
  return now2?.access_token && grantPrint(now2) !== judged ? now2 : null;
};
function published(l) {
  if (!l?.authorize_url || !l.state || !l.verifier) return false;
  if (!l.authorize_url.startsWith(linkPrefix(l.callback_port))) return false;
  return l.grant === void 0 || grantPrint(loadStore().tokens) === l.grant;
}
function older(l) {
  return !!l?.authorize_url && !l.state;
}
var firstCode = (first2) => new Promise((resolve11) => {
  const t = setTimeout(() => resolve11(void 0), DEVICE_FIRST_WAIT_MS);
  t.unref?.();
  void first2.then((c) => {
    clearTimeout(t);
    resolve11(c ?? void 0);
  });
});
function loginPublished() {
  return published(readAuthLock());
}
function openTabOnce(l) {
  if (!CFG.noBrowser && claimTab(l.state)) openBrowser(l.authorize_url);
}
function showTab(l) {
  const current2 = readAuthLock();
  if (!published(current2)) return l;
  openTabOnce(current2);
  return current2;
}
function handOut(l, wantTab) {
  return wantTab && published(l) ? showTab(l) : l;
}
async function mootFreed(port) {
  const l = readAuthLock();
  if (!l || l.callback_port !== port || !l.state || published(l) || !pidAlive(l.pid)) return;
  const deadline = Date.now() + LANDED_POLL_MS * 2 + 1e3;
  while (Date.now() < deadline && await portListening(port)) await sleep(100);
}
async function bindOrNull(port) {
  try {
    return await bindCallback(port);
  } catch (e) {
    if (errorCode(e) !== "EADDRINUSE") throw e;
    return null;
  }
}
async function linkOn(port) {
  const glance = Date.now() + CLAIM_GLANCE_MS;
  const deadline = Date.now() + CLAIM_WAIT_MS;
  for (; ; ) {
    const l = readAuthLock();
    const ours = !!l && l.callback_port === port && pidAlive(l.pid);
    if (ours && (published(l) || older(l))) return l;
    const claimed = ours && !l?.authorize_url;
    if (!claimed && Date.now() > glance || Date.now() > deadline) return null;
    await sleep(100);
  }
}
async function interactiveFlow(meta, judged, note4, wantTab = true) {
  const over = grantPrint(judged);
  const back = grantBack(over);
  if (back) return back;
  const standing = readAuthLock();
  if ((published(standing) || older(standing)) && pidAlive(standing.pid) && await portListening(standing.callback_port)) {
    debug(`joining the login held by pid ${standing.pid}`);
    throw await joinedPending(meta, handOut(standing, wantTab), note4);
  }
  let callback = null;
  if (published(standing)) {
    const cb = await bindOrNull(standing.callback_port);
    const still = cb ? readAuthLock() : null;
    if (cb && published(still) && still.state === standing.state) {
      try {
        writeAuthLock({ ...still, pid: process.pid });
      } catch (e) {
        cb.close();
        throw e;
      }
      log(
        `the bridge that published this login (pid ${standing.pid}) is gone — listening on its link, so the tab the human has still lands:
  ${still.authorize_url}`
      );
      grantLog(
        `authorization flow of pid ${standing.pid} (gone) taken over on the same link — waiting for the human`
      );
      const first2 = runFlow(meta, cb, still, wantTab);
      throw new AuthPending(still.authorize_url, note4, await firstCode(first2));
    }
    if (cb && published(still)) {
      cb.close();
      return interactiveFlow(meta, judged, note4, wantTab);
    }
    callback = cb;
  }
  if (published(standing) && !callback) {
    const taken2 = readAuthLock();
    if (published(taken2) && taken2.state === standing.state && pidAlive(taken2.pid) && await portListening(taken2.callback_port)) {
      throw await joinedPending(meta, handOut(taken2, wantTab), note4);
    }
    debug(
      `the published login's port ${standing.callback_port} is held by a foreign process — its link can land nowhere; publishing a new login`
    );
  } else if (standing && !standing.authorize_url && pidAlive(standing.pid) && await portListening(standing.callback_port)) {
    const found = await linkOn(standing.callback_port);
    if (found) throw await joinedPending(meta, handOut(found, wantTab), note4);
  }
  for (let rung = 0; rung < CALLBACK_PORT_RUNGS && !callback; rung++) {
    callback = await bindOrNull(callbackPort(rung));
    if (callback) break;
    const found = await linkOn(callbackPort(rung));
    if (found) throw await joinedPending(meta, handOut(found, wantTab), note4);
    await mootFreed(callbackPort(rung));
    callback = await bindOrNull(callbackPort(rung));
    if (callback) break;
    debug(
      `callback port ${callbackPort(rung)} is held by a foreign process — trying the next rung`
    );
  }
  if (!callback) {
    const rungs = Array.from({ length: CALLBACK_PORT_RUNGS }, (_, k) => callbackPort(k)).join(", ");
    throw new Error(
      `all candidate callback ports (${rungs}) are held by other processes — free one, then retry`
    );
  }
  const landed = grantBack(over);
  if (landed) {
    callback.close();
    return landed;
  }
  let started = false;
  try {
    const login = {
      pid: process.pid,
      started_at: Date.now(),
      callback_port: callback.port,
      authorize_url: loginLink(callback.port, b64url(randomBytes2(18))),
      state: b64url(randomBytes2(24)),
      verifier: b64url(randomBytes2(48)),
      grant: over
    };
    sweepTabMarks();
    writeAuthLock(login);
    grantLog("authorization flow published — waiting for the human");
    const first2 = runFlow(meta, callback, login, wantTab);
    started = true;
    throw new AuthPending(login.authorize_url, note4, await firstCode(first2));
  } catch (e) {
    if (!started) {
      callback.close();
      releaseAuthLock((l) => l.pid === process.pid);
    }
    throw e;
  }
}
function runFlow(meta, cb, login, openTab) {
  const ours = (l) => l.pid === process.pid && l.state === login.state;
  const redirectUri = redirectFor(login.callback_port);
  const key2 = login.authorize_url.slice(linkPrefix(login.callback_port).length);
  cb.serveLogin(key2, async () => {
    if (flow) clicked.add(flow);
    const client = await ensureClient(meta, redirectUri);
    const current2 = readAuthLock();
    if (current2 && ours(current2)) writeAuthLock({ ...current2, client_id: client.client_id });
    const u = new URL(meta.as.authorization_endpoint);
    u.searchParams.set("response_type", "code");
    u.searchParams.set("client_id", client.client_id);
    u.searchParams.set("redirect_uri", redirectUri);
    u.searchParams.set("state", login.state);
    u.searchParams.set("code_challenge", b64url(sha256(login.verifier)));
    u.searchParams.set("code_challenge_method", "S256");
    u.searchParams.set("resource", resourceOf(meta));
    if (meta.scope) u.searchParams.set("scope", meta.scope);
    return u.toString();
  });
  let watch2;
  const cameBack = new Promise((_, reject) => {
    watch2 = setInterval(() => {
      if (login.grant !== void 0 && grantPrint(loadStore().tokens) !== login.grant) {
        reject(new Error("the grant came back by itself — this login is no longer needed"));
      }
    }, LANDED_POLL_MS);
    watch2.unref?.();
  });
  cameBack.catch(() => {
  });
  const device = deviceSide(
    meta,
    redirectUri,
    login.device,
    (code, unset2) => {
      const current2 = readAuthLock();
      if (current2 && ours(current2)) {
        writeAuthLock({ ...current2, device: code ?? void 0, device_unset: unset2 });
      }
    },
    () => callerCode(login.state)
  );
  let flow = null;
  flow = (async () => {
    try {
      const codePromise = cb.waitForCode(login.state);
      if (openTab) openTabOnce(login);
      const code = await Promise.race([codePromise, cameBack, device.landed.then(() => null)]);
      if (code === null) {
        releaseAuthLock(ours);
        log("signed in from another device — tokens saved for every local agent");
        grantLog("authorization complete (another device)");
        return;
      }
      device.stop();
      const record2 = readAuthLock();
      const clientId = (record2?.state === login.state ? record2.client_id : void 0) || CFG.staticClientId || loadStore().client?.client_id || "";
      log("authorization code received — exchanging for tokens");
      await tokenRequest(meta, {
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
        client_id: clientId,
        code_verifier: login.verifier,
        resource: resourceOf(meta)
      });
      releaseAuthLock(ours);
      log("authorization complete — tokens saved for every local agent");
      grantLog("authorization complete");
      cb.report(null);
    } catch (e) {
      const message = errorMessage(e);
      cb.report(message);
      log(`authorization flow failed: ${message}`);
      grantLog(
        `authorization not completed (${message}) — the next call that needs the graph offers a new login`
      );
    } finally {
      clearInterval(watch2);
      device.stop();
      releaseAuthLock(ours);
      if (RELEASE_GAP_MS) await sleep(RELEASE_GAP_MS);
      cb.close();
      if (flow) {
        flows.delete(flow);
        clicked.delete(flow);
      }
    }
  })();
  flows.add(flow);
  return device.first;
}

// js/bridge/daemon-idle.ts
var secs = (ms2) => Math.round(ms2 / 1e3);
function idleWatch(idleMs, busy, leave) {
  let timer = null;
  let round = 0;
  const hold = () => {
    round++;
    if (timer) clearTimeout(timer);
    timer = null;
  };
  const arm = () => {
    hold();
    if (busy()) return;
    const mine = round;
    timer = setTimeout(() => {
      timer = null;
      if (busy()) return;
      const flow = pendingFlow();
      if (!flow) {
        log(`no session for ${secs(idleMs)}s — the daemon leaves`);
        return leave();
      }
      log(
        `idle, but an authorization flow is pending — staying for the human's click, at most ${secs(ORPHAN_FLOW_MS)}s`
      );
      timer = setTimeout(() => {
        timer = null;
        if (round !== mine || busy()) return;
        log(
          `no session and the login unclicked for ${secs(ORPHAN_FLOW_MS)}s — the daemon leaves; the next bridge takes the login over on its link`
        );
        leave();
      }, ORPHAN_FLOW_MS);
      void flow.finally(() => {
        if (round === mine) arm();
      });
    }, idleMs);
  };
  return { arm, hold };
}

// js/bridge/oauth/refreshlock.ts
import { linkSync as linkSync2, mkdirSync as mkdirSync6, readFileSync as readFileSync9, unlinkSync as unlinkSync5, writeFileSync as writeFileSync6 } from "node:fs";
var REFRESH_LOCK_STALE_MS = 45e3;
function refreshLockPath() {
  return storePath() + ".refreshing";
}
function acquireRefreshLock() {
  const claim = () => {
    const tmp = `${refreshLockPath()}.${process.pid}`;
    writeFileSync6(tmp, JSON.stringify({ pid: process.pid, started_at: Date.now() }), {
      mode: 384
    });
    try {
      linkSync2(tmp, refreshLockPath());
      return true;
    } finally {
      try {
        unlinkSync5(tmp);
      } catch {
      }
    }
  };
  const notHeld = (e) => {
    if (errorCode(e) !== "EEXIST") {
      throw new Error(`cannot take the refresh lock: ${errorMessage(e)}`, { cause: e });
    }
  };
  try {
    mkdirSync6(CFG.authDir, { recursive: true, mode: 448 });
    return claim();
  } catch (e) {
    notHeld(e);
  }
  let held2 = null;
  try {
    held2 = JSON.parse(readFileSync9(refreshLockPath(), "utf8"));
  } catch {
  }
  if (held2 && pidAlive(held2.pid) && Date.now() - held2.started_at < REFRESH_LOCK_STALE_MS) {
    return false;
  }
  debug("breaking a refresh lock nobody is holding");
  try {
    unlinkSync5(refreshLockPath());
  } catch {
  }
  try {
    return claim();
  } catch (e) {
    notHeld(e);
    return false;
  }
}
function releaseRefreshLock() {
  try {
    const l = JSON.parse(readFileSync9(refreshLockPath(), "utf8"));
    if (l.pid === process.pid) unlinkSync5(refreshLockPath());
  } catch {
  }
}
function installRefreshLockExitHook() {
  process.on("exit", releaseRefreshLock);
}

// js/bridge/oauth/refresh.ts
var REFRESH_WAIT_MS = 6e4;
var REFRESH_POLL_MS = 120;
var EARLY_REFUSAL_COOLDOWN_MS = 15e3;
var REFUSED_KNOCK_MS = 5 * 6e4;
async function refreshOnce(meta, cur, proactive) {
  const hours = refreshHours(cur);
  const inTheWindow = hours.nbf && now() < hours.nbf;
  const cooling = inTheWindow && loadGrantState().early_refused_until;
  if (cooling && now() < cooling) {
    const left2 = Math.round((cooling - now()) / 1e3);
    throw new HoldOffError(
      `the token endpoint refused this grant as too early moments ago — not knocking again for ${left2}s; grant kept, will retry`,
      false,
      hours.nbf
    );
  }
  const clientId = CFG.staticClientId || cur.client_id || loadStore().client?.client_id || "";
  debug("refreshing access token");
  try {
    return await tokenRequest(meta, {
      grant_type: "refresh_token",
      refresh_token: cur.refresh_token ?? "",
      client_id: clientId,
      resource: resourceOf(meta)
    });
  } catch (e) {
    const message = errorMessage(e);
    const deadRefresh = e instanceof TokenError && e.status === 404 && e.oauthError === "NotFound" && e.oauthMessage === "Refresh Token does not exist";
    const gone = e instanceof TokenError ? !deadRefresh && [404, 405, 410].includes(e.status) : ["ENOTFOUND", "ECONNREFUSED"].includes(errorCode(e) ?? "");
    if (gone && e instanceof TokenError && e.status === 404 && !await tokenEndpointMoved(meta)) {
      log(
        "the token endpoint answers NotFound while discovery still names it — the server no longer knows this client; dropping the registration"
      );
      grantLog(
        `refresh refused by an endpoint discovery still names (${message}) — registration dropped`
      );
      dropRegistration(clientId);
      throw new DeadGrantError(message);
    }
    if (gone) {
      saveStore({ meta: null });
      grantLog(
        `token endpoint is gone (${message}) — cached discovery dropped, rediscovering on the next attempt`
      );
      throw new Error(
        `the token endpoint is gone (${message}) — rediscovering on the next attempt; grant kept, will retry`,
        { cause: e }
      );
    }
    const definitive = e instanceof TokenError && e.oauthError !== "temporarily_unavailable" && (deadRefresh || DEFINITIVE_OAUTH_ERRORS.has(e.oauthError ?? "") || e.status === 400 || e.status === 401);
    if (!definitive) {
      throw new Error(`token refresh failed transiently (${message}) — grant kept, will retry`, {
        cause: e
      });
    }
    const expired = hours.exp && now() >= hours.exp;
    const notYet = hours.nbf && now() < hours.nbf;
    const speculative = proactive && tokenUsable(cur);
    if (!expired && !deadRefresh && (notYet || speculative)) {
      const stamp = loadGrantState().early_refused_until;
      const repeated = !!notYet && !!stamp && stamp > now() - 12e4;
      const why = notYet ? `the refresh token's own hour is another ${Math.round((hours.nbf - now()) / 1e3)}s away on the server's clock` : "the access token in hand still works";
      let until = null;
      if (notYet) {
        until = Math.min(now() + EARLY_REFUSAL_COOLDOWN_MS, hours.nbf);
        saveGrantState({ early_refused_until: until });
      }
      grantLog(
        `refresh refused early — ${why}; grant kept` + (until ? `, not knocking again for ${Math.round((until - now()) / 1e3)}s` : "") + ` (${message})`
      );
      throw new HoldOffError(
        repeated ? `token refresh refused too early again (${message}) — the hour is real: ${why}; grant kept` : `token refresh refused too early (${message}) — ${why}; grant kept, will retry`,
        !!notYet && !repeated,
        notYet ? hours.nbf : null
      );
    }
    if (loadStore().tokens?.refresh_token !== cur.refresh_token) {
      debug("our refresh token was already rotated by a sibling — retrying with the stored one");
      return null;
    }
    if (e instanceof TokenError && e.oauthError === "invalid_client") {
      log("the server no longer knows this client — dropping the registration");
      grantLog("server no longer knows this client — registration dropped");
      dropRegistration(clientId);
    }
    const overdue = hours.exp && now() >= hours.exp;
    grantLog(
      `refresh refused${overdue ? " and the grant is past its own expiry" : ""}: ${message}`
    );
    throw new DeadGrantError(overdue ? `${message} (grant expired)` : message, !!overdue);
  }
}
var ENDPOINT_CHECK_BUDGET_MS = 1e4;
async function tokenEndpointMoved(meta) {
  try {
    const fresh2 = await Promise.race([
      discoverMeta(null),
      sleep(ENDPOINT_CHECK_BUDGET_MS).then(() => {
        throw new Error("discovery did not answer within the budget");
      })
    ]);
    return fresh2.as.token_endpoint !== meta.as.token_endpoint;
  } catch {
    return true;
  }
}
async function refreshShared(meta, rejected, proactive, interactive) {
  const deadline = Date.now() + REFRESH_WAIT_MS;
  for (; ; ) {
    const sibling = usableTokens({ rejected });
    if (sibling) {
      debug("a sibling refreshed the grant — reusing it");
      return sibling;
    }
    if (Date.now() > deadline) {
      throw new Error("the shared grant could not be refreshed in time — grant kept, will retry");
    }
    if (acquireRefreshLock()) {
      try {
        const late2 = usableTokens({ rejected });
        if (late2) {
          debug("a sibling refreshed the grant — reusing it");
          return late2;
        }
        if (!interactive && refusalStands()) {
          throw new DeadGrantError(
            "the grant stands refused on this machine — the background knock waits for the next stretch or a human's call"
          );
        }
        try {
          const cur = loadStore().tokens;
          if (!cur?.refresh_token) throw new DeadGrantError("no refresh grant on disk");
          const fresh2 = await refreshOnce(meta, cur, proactive);
          if (fresh2) return fresh2;
        } catch (e) {
          if (e instanceof DeadGrantError) noteRefusal(e.message);
          throw e;
        }
      } finally {
        releaseRefreshLock();
      }
    } else {
      await sleep(REFRESH_POLL_MS);
    }
  }
}
function dropRegistration(clientId) {
  if (clientId && loadStore().client?.client_id === clientId) saveStore({ client: null });
}
function noteRefusal(reason) {
  const local = Date.now();
  const first2 = !loadGrantState().refused_since;
  saveGrantState({ refused_at: local, ...first2 ? { refused_since: local, reason } : {} });
  if (first2) grantLog(`grant refused: ${reason}`);
}
function refusalStands() {
  const at3 = loadGrantState().refused_at;
  return !!at3 && Date.now() - at3 < REFUSED_KNOCK_MS;
}

// js/bridge/auth.ts
var authInFlight = /* @__PURE__ */ new Map();
function heldNote(until) {
  if (until === null) return "the grant itself is whole";
  const minutes = Math.max(1, Math.round((until - now()) / 6e4));
  return `the grant itself is whole and comes back on its own in about ${minutes} min`;
}
async function ensureAuth(wwwAuthenticate, opts = {}) {
  const { force = false, interactive = true, proactive = false } = opts;
  if (CFG.pat) {
    throw new TokenRefused(
      `the personal access token from ${CFG.patSource} is refused by the server — revoked, expired or without rights to this graph; mint a new one on the graph's token page and put it in ${CFG.patSource}`
    );
  }
  const grant = storePath();
  const flight = authInFlight.get(grant);
  if (flight) {
    if (!interactive || flight.interactive) return flight.promise;
    await flight.promise.catch(() => {
    });
    const again = authInFlight.get(grant);
    if (again) return again.promise;
    const s2 = loadStore();
    if (tokenUsable(s2.tokens)) return s2.tokens;
  }
  const promise = (async () => {
    try {
      const s2 = loadStore();
      const rejected = opts.rejected ?? (force ? s2.tokens?.access_token ?? null : null);
      if (!force && tokenUsable(s2.tokens)) return s2.tokens;
      const meta = s2.meta?.as ? s2.meta : await discover(wwwAuthenticate);
      meta.resource = resourceOf(meta);
      if (interactive && s2.tokens?.refresh_token && loginPublished() && refusalStands()) {
        const landed = usableTokens({ rejected });
        if (landed) return landed;
        return await interactiveFlow(meta, s2.tokens);
      }
      if (s2.tokens?.refresh_token) {
        let rechecks = 0;
        let waited = 0;
        for (; ; ) {
          try {
            return await refreshShared(meta, rejected, proactive, interactive);
          } catch (e) {
            if (!interactive) {
              if (e instanceof DeadGrantError) {
                throw new Error(
                  "authorization required (refresh grant dead, browser flow deferred)",
                  { cause: e }
                );
              }
              throw e;
            }
            if (e instanceof HoldOffError) {
              if (e.retryNow) throw e;
              const left2 = e.until === null ? Infinity : e.until - now();
              if (left2 + waited <= IN_CALL_WAIT_MS) {
                const pause = Math.max(left2, 0) + 100;
                waited += pause;
                debug(`${e.message} — sitting it out inside the call (${pause}ms)`);
                await sleep(pause);
                continue;
              }
              log(`${e.message} — offering the login beside the wait`);
              return await interactiveFlow(meta, s2.tokens, heldNote(e.until), false);
            }
            if (e instanceof DeadGrantError) {
              if (!e.expired && rechecks < DEAD_RECHECK_MS.length && !loginPublished()) {
                const pause = DEAD_RECHECK_MS[rechecks++] ?? 0;
                debug(`refresh refused (${e.message}) — knocking again in ${pause}ms`);
                await sleep(pause);
                continue;
              }
              log(`refresh grant is dead (${e.message}) — starting a fresh authorization`);
              return await interactiveFlow(meta, s2.tokens);
            }
            throw e;
          }
        }
      }
      if (!interactive)
        throw new Error(
          `authorization required (no tokens, browser flow deferred) — or give the bridge a personal access token (${envName("BRIDGE_TOKEN")}, or the file <auth-dir>/token)`
        );
      return await interactiveFlow(meta, s2.tokens);
    } finally {
      authInFlight.delete(grant);
    }
  })();
  authInFlight.set(grant, { promise, interactive });
  return promise;
}
var REFRESH_MARGIN_MS = 3 * 6e4;
function startTokenKeepalive() {
  if (CFG.pat) return;
  const tick = () => {
    const t = loadStore().tokens;
    if (!t?.refresh_token) return;
    const expiresAt = t.expires_at || 0;
    if (!expiresAt || expiresAt - now() >= REFRESH_MARGIN_MS) return;
    const hours = refreshHours(t);
    if (hours.nbf && now() < hours.nbf) {
      debug(
        `refresh token not in force for another ${Math.round((hours.nbf - now()) / 1e3)}s — waiting`
      );
      return;
    }
    if (hours.exp && now() >= hours.exp) {
      debug("the grant is past its own expiry — only a human can mend it now");
      return;
    }
    if (refusalStands()) {
      debug("the grant stands refused — the machine's control knock is not due yet");
      return;
    }
    ensureAuth(null, { force: true, interactive: false, proactive: true }).then(() => debug("background token refresh ok")).catch((e) => log(`background token refresh: ${errorMessage(e)}`));
  };
  tick();
  setInterval(tick, 6e4).unref();
}

// js/shared/seen.ts
import { appendFileSync as appendFileSync2, readFileSync as readFileSync10, renameSync as renameSync6, writeFileSync as writeFileSync7 } from "node:fs";

// js/shared/room-fields.ts
var obj = (v) => v && typeof v === "object" && !Array.isArray(v) ? v : {};
var str = (v) => typeof v === "string" ? v : typeof v === "number" || typeof v === "boolean" ? String(v) : "";
var after = (key2, prefix) => key2.startsWith(prefix) ? key2.slice(prefix.length) : key2;
var need = (v) => str(v) || "?";
var opt = (sep3, v) => {
  const x = str(v);
  return x ? sep3 + x : "";
};
var pick = (dict, key2) => Object.hasOwn(dict, key2) ? dict[key2] : void 0;
var mineOf = (frame2) => [str(frame2.to_standing_id), str(frame2.to_standing)].filter(Boolean);
function myRole(frame2, fields) {
  const ka = obj(fields.karta);
  const seq3 = str(ka.seq);
  if (!seq3 || seq3 !== str(frame2.karta_seq)) return false;
  const theirs = str(ka.realm);
  const mine = str(frame2.realm) || str(obj(frame2.room).realm);
  return !theirs || !mine || theirs === mine;
}
function inviteMine(frame2) {
  const fields = obj(obj(frame2.line).fields);
  const target = after(str(obj(frame2.line).key), "invite:");
  if (target && mineOf(frame2).includes(target)) return true;
  const seat2 = Object.keys(obj(fields.standing)).length > 0 || !!str(fields.standing);
  const roleId = str(obj(fields.karta).id) || (seat2 ? "" : target);
  return (!target || target === roleId) && myRole(frame2, fields);
}
function seatIs(frame2, ...named2) {
  const myId = str(frame2.to_standing_id);
  const myAddr = str(frame2.to_standing);
  if (!myId && !myAddr) return null;
  const id = named2.map((v) => str(obj(v).id)).find(Boolean);
  if (id && myId) return id === myId;
  const addr = named2.map((v) => addresseeOf(v)?.addr.filter((a) => a.startsWith("@"))[0]).find(Boolean);
  if (addr) return addr === myAddr;
  return id ? false : null;
}
function addresseeOf(v) {
  if (typeof v === "string") return v ? { addr: [v], label: v } : null;
  const o = obj(v);
  const handle = str(o.handle).replace(/^@/, "");
  const standing = str(o.standing) || (handle ? `@${handle}${str(o.name) ? `:${str(o.name)}` : ""}` : "");
  const id = str(o.id);
  const name2 = str(o.standing) ? str(o.name) : "";
  const label = name2 && standing ? `${name2} (${standing})` : standing || str(o.name) || id;
  const addr = [standing, id].filter(Boolean);
  return addr.length ? { addr, label } : null;
}

// js/shared/asks.ts
var ASK_KINDS = /* @__PURE__ */ new Set(["ask", "answer", "ack"]);
var INVITE_CAUSES = {
  ownerless: "inviteOwnerless",
  answer_waiting: "inviteAnswerWaiting"
};
var toOf = (fields) => obj(fields.to);
var byMe = (frame2) => {
  const mine = mineOf(frame2);
  const author = obj(obj(frame2.line).author);
  return [str(author.id), str(author.standing)].some((a) => a && mine.includes(a));
};
var askFromPerson = (frame2) => {
  const line = obj(frame2.line);
  const kind = str(line.kind);
  const asking = ASK_KINDS.has(kind) || kind === "progress" && !!str(obj(line.fields).withdraws);
  return asking && classifyOrigin(frame2) === "human";
};
function askedMine(frame2, fields) {
  if (byMe(frame2)) return false;
  return seatIs(frame2, toOf(fields).standing, frame2.addressee) === true;
}
function addressedMine(frame2) {
  if (frame2.addressee_left === true) return false;
  return seatIs(frame2, toOf(obj(obj(frame2.line).fields)), frame2.addressee) === true;
}
var quote = (s2) => s2 ? words(CASE_LINE).quote(s2) : "";
function formOf(fields) {
  const W4 = words(ASK);
  const form = str(fields.form);
  if (form === "yes_no") return W4.yesNo();
  if (form === "free") return W4.free();
  if (form !== "choice" || !Array.isArray(fields.options)) return "";
  const options = fields.options.map((o) => {
    const x = obj(o);
    const ctx = str(x.context);
    return `${str(x.id)} ${quote(str(x.label))}${ctx ? ` (${ctx})` : ""}`;
  }).join(", ");
  return W4.choice(need(options));
}
function askValues(kind, line, fields) {
  if (kind !== "ask")
    return { reply: [str(fields.choice), quote(str(line.done))].filter(Boolean).join("; ") };
  const W4 = words(ASK);
  const to = toOf(fields);
  const k = obj(to.karta);
  const place = addresseeOf(to.standing)?.label ?? "";
  const rec5 = obj(fields.recommendation);
  return {
    to: str(k.name) || (str(k.seq) ? `#${str(k.seq)}` : ""),
    to_place: place ? W4.place(need(place)) : "",
    form: formOf(fields),
    advice: str(rec5.option) || str(rec5.why) ? W4.advice(need(str(rec5.option) || "—"), opt(" — ", rec5.why)) : ""
  };
}
function askText(kind, cause, v) {
  const W4 = words(ASK);
  const invite = cause ? pick(INVITE_CAUSES, cause) : void 0;
  if (invite) return W4[invite](need(v.who), need(v.standing));
  if (kind === "progress" && str(v.withdraws))
    return W4.withdrawn(
      need(v.withdraws),
      need(v.key),
      need(v.done),
      need(v.verdict),
      need(v.author)
    );
  if (kind === "ask")
    return W4.ask(
      need(v.author),
      need(v.to),
      opt(" ", v.to_place),
      need(v.key),
      need(v.done),
      opt("; ", v.form),
      opt("; ", v.advice)
    );
  if (kind === "answer") return W4.answer(need(v.author), need(v.refers_to), need(v.reply));
  if (kind === "ack") return W4.ack(need(v.refers_to), opt(": ", v.reply), need(v.author));
  return void 0;
}

// js/shared/numbering.ts
var numberingOf = (frame2) => frame2.numbering === "case" ? "case" : "";
var numberedKey = (frame2, key2) => key2 && numberingOf(frame2) ? `case:${key2}` : key2;

// js/shared/askmemory.ts
var baseOf = (frame2) => numberedKey(
  frame2,
  `${mineOf(frame2)[0] ?? ""}|${str(obj(frame2.room).id) || str(obj(frame2.room).seq)}|${str(obj(frame2.line).key)}`
);
var lineOf = (frame2) => obj(frame2.line);
var kindOf = (frame2) => str(lineOf(frame2).kind);
var numOf = (frame2) => str(lineOf(frame2).entry_id ?? frame2.entry_id);
function openOn(store, frame2) {
  const base = `${baseOf(frame2)}#`;
  const out7 = [];
  for (const s2 of store.keys())
    if (s2.startsWith(base) && !store.has(`off:${s2}`)) out7.push(s2.slice(base.length));
  return out7;
}
var namedOf = (frame2) => {
  const kind = kindOf(frame2);
  if (kind === "progress") return str(obj(lineOf(frame2).fields).withdraws);
  if (kind === "answer") return str(lineOf(frame2).refers_to) || str(frame2.in_reply_to);
  return "";
};
var isOpen = (store, frame2, n) => {
  const k = `${baseOf(frame2)}#${n}`;
  return !!n && store.has(k) && !store.has(`off:${k}`);
};
function closesMine(store, frame2) {
  if (byMe(frame2) || !str(lineOf(frame2).key)) return "";
  const kind = kindOf(frame2);
  if (kind === "progress" || kind === "answer") {
    const n = namedOf(frame2);
    return isOpen(store, frame2, n) ? n : "";
  }
  if (kind !== "ask" || askedMine(frame2, obj(lineOf(frame2).fields))) return "";
  return openOn(store, frame2).at(-1) ?? "";
}
function noteAsk(store, frame2) {
  if (!str(lineOf(frame2).key)) return;
  const kind = kindOf(frame2);
  const fields = obj(lineOf(frame2).fields);
  const base = `${baseOf(frame2)}#`;
  if (kind === "ask" && askedMine(frame2, fields)) {
    const own = numOf(frame2);
    if (store.has(`${base}${own}`)) return;
    for (const n of openOn(store, frame2)) store.add(`off:${base}${n}`);
    store.add(`${base}${own}`);
    return;
  }
  if (kind === "progress" || kind === "answer" && !byMe(frame2)) {
    const n = namedOf(frame2);
    if (isOpen(store, frame2, n)) store.add(`off:${base}${n}`);
  } else if ((kind === "ack" || kind === "ask") && !byMe(frame2))
    for (const n of openOn(store, frame2)) store.add(`off:${base}${n}`);
}
var ASKS_KEPT = 512;
var kept = /* @__PURE__ */ new Set();
var processAsks = {
  has: (s2) => kept.has(s2),
  add: (s2) => {
    kept.add(s2);
    for (const old of kept) {
      if (kept.size <= ASKS_KEPT) break;
      kept.delete(old);
    }
  },
  keys: () => kept
};

// js/shared/room-kinds.ts
var wordSeats = (f) => [
  obj(obj(f.line).fields).to,
  obj(obj(obj(f.word).line).fields).to,
  f.addressee,
  obj(f.word).addressee
];
var NODE_OPS = {
  updated: "nodeUpdated",
  deleted: "nodeDeleted",
  undeleted: "nodeUndeleted"
};
var RULES = {
  said: "stack",
  body: "stack",
  closing: "interrupt",
  closed: "interrupt",
  objection: "interrupt",
  late_objection: "interrupt",
  invite: "mine",
  // Only the answer to the waiting seat interrupts (graph @nks/nks-dev, nodes #6655, #6868).
  ask: "batch",
  answer: "addressed",
  // An answer taken back (api, #7472): in_reply_to names the answer; it wakes the one it was given to.
  retract: "addressed",
  ack: "batch",
  progress: "batch",
  opened: "batch",
  joined: "batch",
  left: "batch",
  withdraw: "batch",
  node: "batch",
  link: "batch",
  // (graph @nks/nks-dev, node #4925)
  auto: "batch"
};
function authorOf(author) {
  const a = obj(author);
  const name2 = str(a.name);
  const standing = str(a.standing);
  if (name2) return standing ? `${name2} (${standing})` : name2;
  if (standing) return standing;
  return a.kind === "platform" ? words(CASE_LINE).platform() : "?";
}
function roomOf(v) {
  const r = obj(v);
  return str(r.seq) || str(r.id) || str(v);
}
function whoOf(fields) {
  const st = obj(fields.standing);
  const ka = obj(fields.karta);
  const name2 = str(st.name) || str(ka.name);
  const addr = str(st.standing);
  return name2 && addr ? `${name2} (${addr})` : name2 || addr;
}
function kindText(kind, v, f, pending2, aborted) {
  const W4 = words(ROOM);
  const n = (k) => need(v[k]);
  const lapsed = obj(obj(f.line).author).kind === "platform";
  if (pending2) return W4.saidPending(n("author"));
  if (aborted) return lapsed ? W4.bodyLapsed(n("refers_to")) : W4.bodyAborted(n("refers_to"));
  if (kind === "auto")
    return pick(words(ROOM_AUTO), str(v.code))?.(n("room")) ?? W4.auto(n("code"), n("room"));
  const ask3 = askText(kind, str(v.cause), v);
  if (ask3 !== void 0) return ask3;
  const reasoning = opt("; ", v.reasoning);
  const op = kind === "node" ? pick(NODE_OPS, str(v.op)) : void 0;
  if (op) return W4[op](n("seq"), n("name"), reasoning);
  switch (kind) {
    case "said":
      return W4.said(n("author"));
    case "body":
      return W4.body(n("refers_to"), n("author"));
    case "closing":
      return W4.closing(n("author"), n("ends_at"), str(v.evidence));
    case "closed":
      return W4.closed(n("reason"));
    case "objection":
      return W4.objection(n("author"), n("reason"));
    case "late_objection":
      return W4.lateObjection(n("author"));
    case "progress":
      return W4.progress(n("key"), n("done"), n("verdict"), opt(" — ", v.note), n("author"));
    case "opened":
      return W4.opened(n("author"));
    case "joined":
      return W4.joined(n("who"));
    case "left":
      return W4.left(n("who"), str(v.reason));
    case "invite":
      return W4.invite(n("author"), n("who"));
    case "withdraw":
      return W4.withdraw(n("author"));
    case "retract":
      return W4.retract(n("author"), n("refers_to"), v.after_ack === true);
    case "node":
      return W4.node(n("seq"), n("name"), n("realm"), reasoning);
    case "link":
      return W4.link(n("room"), n("rel"));
    default:
      return "";
  }
}
function roomKind(frame2) {
  if (!frame2 || typeof frame2 !== "object") return null;
  const f = frame2;
  const ek = f.event_kind;
  if (typeof ek !== "string" || !ek.startsWith("room.")) return null;
  const kind = ek.slice(5);
  const line = obj(f.line);
  const fields = obj(line.fields);
  const key2 = str(line.key);
  const node = obj(fields.node);
  const cause = kind === "invite" ? str(fields.cause) : "";
  const byWhom = authorOf(
    kind === "body" && Object.keys(obj(f.in_reply_to_from)).length ? f.in_reply_to_from : line.author
  );
  const values = {
    kind,
    cause,
    author: byWhom,
    key: key2,
    done: line.done,
    verdict: pick(words(VERDICT), str(line.verdict))?.() ?? line.verdict,
    note: line.note,
    ends_at: fields.ends_at,
    evidence: Array.isArray(fields.evidence) ? fields.evidence.map(str).join(", ") : "",
    entry_id: line.entry_id ?? f.entry_id,
    refers_to: str(line.refers_to) || str(f.in_reply_to) || str(obj(f.word).entry_id),
    reason: fields.reason,
    target: after(key2, "invite:"),
    // Observed live: the invite key carries the id, the invitee's name is in the line fields (standing/karta with name).
    // Joined and left — fields.standing (a timed-out leave is written by the platform, api 0.89.6), else the author;
    // a role call by cause — fields.karta (graph @nks/nks-dev, node #6870).
    who: kind === "joined" || kind === "left" ? whoOf({ standing: fields.standing }) || byWhom : (cause ? whoOf({ karta: fields.karta }) : whoOf(fields)) || after(key2, "invite:"),
    standing: str(fields.gone_standing) || addresseeOf(fields.gone_standing)?.label,
    ...ASK_KINDS.has(kind) ? askValues(kind, line, fields) : {},
    room: roomOf(fields.room) || after(key2, "link:"),
    rel: pick(words(ROOM_REL), str(fields.rel))?.() ?? fields.rel,
    code: fields.code,
    op: fields.op,
    seq: node.seq,
    name: node.name,
    realm: node.realm,
    // A node delta's reasoning is the record's body, not a field (graph @nks/nks-dev, node #6070).
    reasoning: kind === "node" ? line.done || f.body : void 0,
    withdraws: fields.withdraws,
    // Observed on the wire (#5893 §4.2, case №1010 [8]): line.fields.after_ack.
    after_ack: fields.after_ack === true
  };
  const W4 = words(ROOM);
  const rule = RULES[kind];
  const author = str(values.author);
  if (!rule)
    return {
      kind,
      rule: "batch",
      words: W4.unknown(need(kind)),
      author,
      phase: null,
      known: false
    };
  const word3 = kind === "said" || kind === "body";
  const withheld = word3 && f.body_withheld === true;
  const named2 = word3 ? wordSeats(f) : [];
  const to = word3 ? named2.map(addresseeOf).find(Boolean) ?? (withheld ? { addr: ["?"], label: "?" } : null) : null;
  if (to && (withheld || seatIs(f, ...named2) === false)) {
    const counts = kind === "said";
    const pair = JSON.stringify([roomOf(f.room), author, to.addr[0]]);
    const id = need(counts ? values.entry_id : values.refers_to);
    const by = need(values.author);
    const addressee = need(to.label);
    const run2 = (n) => n === 0 ? W4.asideBody(by, addressee, id) : n > 1 ? W4.asideRun(by, addressee, W4.messages(n), id) : W4.aside(by, addressee, id);
    const aside = { pair, counts, run: run2 };
    const words2 = run2(counts ? 1 : 0);
    return { kind, rule: "batch", words: words2, author, phase: null, known: true, aside };
  }
  const pending2 = kind === "said" && f.body_pending === true && !str(f.body) && !str(line.done);
  const aborted = kind === "body" && fields.aborted === true;
  let text2 = kindText(kind, values, f, pending2, aborted);
  if (kind === "closing") {
    const may = Array.isArray(fields.may_object) ? fields.may_object.map((m) => typeof m === "string" ? m : str(obj(m).id)) : [];
    const myId = str(f.to_standing_id);
    const mayI = !!myId && may.includes(myId);
    text2 += "; " + (mayI ? W4.closingMay(need(values.entry_id)) : W4.closingNot());
  }
  const stack = rule === "stack" ? f.stack === "defer" ? "batch" : "interrupt" : rule === "mine" ? inviteMine(f) ? "interrupt" : "batch" : rule === "addressed" ? addressedMine(f) ? "interrupt" : "batch" : rule;
  const phase = pending2 ? "pending" : aborted ? "aborted" : null;
  return { kind, rule: phase ? "batch" : stack, words: text2, author, phase, known: true };
}
var byKind = (frame2) => roomKind(frame2) !== null;
var stackOf = (frame2) => roomKind(frame2)?.rule ?? (frame2?.stack === "defer" ? "batch" : "interrupt");

// js/shared/seats.ts
function seatsOf(f, kind) {
  const to = obj(obj(obj(f.line).fields).to);
  if (kind === "said" || kind === "body") return wordSeats(f);
  return [
    kind === "ask" ? to.standing : ASK_KINDS.has(kind) || kind === "retract" ? to : null,
    f.addressee
  ];
}
function seatOf(frame2, kind) {
  const f = frame2;
  if (kind === "ask" && byMe(f)) return false;
  return seatIs(f, ...seatsOf(f, kind));
}
var named = (v) => typeof v === "string" ? !!v : Object.keys(obj(v)).length > 0;
function namesAddress(f, kind) {
  const fields = obj(obj(f.line).fields);
  const to = kind === "ask" ? obj(fields.to).standing : fields.to;
  if (named(to) || named(f.addressee)) return true;
  return (kind === "invite" || kind === "withdraw") && (named(fields.standing) || named(fields.karta));
}
var namedMine = (frame2, kind) => seatOf(frame2, kind) === true;

// js/shared/addressed.ts
var LOUD_KINDS = /* @__PURE__ */ new Set(["closing", "closed", "objection", "late_objection"]);
var addressedWords = /* @__PURE__ */ new Set();
var WORDS_KEPT = 512;
function wordKeyOf(frame2) {
  const f = frame2;
  const line = obj(f.line);
  const entry = roomKind(frame2)?.kind === "body" ? str(line.refers_to) || str(f.in_reply_to) || str(obj(f.word).entry_id) : str(line.entry_id ?? f.entry_id);
  return numberedKey(
    frame2,
    `${mineOf(f)[0] ?? ""}|${str(obj(f.room).id) || str(obj(f.room).seq)}|${entry}`
  );
}
var asideKeyOf = (frame2) => `aside:${wordKeyOf(frame2)}`;
function rememberWord(key2) {
  addressedWords.add(key2);
  for (const old of addressedWords) {
    if (addressedWords.size <= WORDS_KEPT) break;
    addressedWords.delete(old);
  }
}
var ASK_CLOSERS = /* @__PURE__ */ new Set(["ask", "answer", "ack", "progress"]);
var askDecided = /* @__PURE__ */ new Map();
function askMemory(f) {
  if (f.asks_decided === true) return "";
  const id = str(f.id) || wordKeyOf(f);
  const was = askDecided.get(id);
  if (was !== void 0) return was;
  const hit = closesMine(processAsks, f);
  noteAsk(processAsks, f);
  askDecided.set(id, hit);
  for (const old of askDecided.keys()) {
    if (askDecided.size <= WORDS_KEPT) break;
    askDecided.delete(old);
  }
  return hit;
}
function addressedToMine(frame2) {
  if (!frame2) return false;
  const f = frame2;
  const room = obj(f.room);
  if (!str(room.seq) && !str(room.id)) return true;
  if (!byKind(frame2)) return true;
  const line = obj(f.line);
  const fields = obj(line.fields);
  const rk = roomKind(frame2);
  if (rk?.aside) {
    if (f.body_pending === true) rememberWord(asideKeyOf(frame2));
    return false;
  }
  const closed = rk && ASK_CLOSERS.has(rk.kind) ? askMemory(f) : "";
  const seat2 = rk ? seatOf(frame2, rk.kind) : null;
  if (rk?.kind === "body") {
    const word3 = obj(f.word);
    if (f.addressed === false || addressedWords.has(asideKeyOf(frame2))) return false;
    if (f.addressed === true || seat2 === true || seat2 === null && str(obj(obj(word3.line).fields).kind) === "important" || addressedWords.has(wordKeyOf(frame2)))
      return true;
  } else if (
    // A word to me, a reply to my record without an address of its own (#5954, #6574),
    // marked important; a word in flight is remembered, since its body comes as a second
    // phase without these marks.
    seat2 === true || seat2 === null && (seatIs(f, f.in_reply_to_from) === true && !namesAddress(f, rk?.kind ?? "") || str(f.said) === "important" || str(fields.kind) === "important")
  ) {
    if (rk?.phase === "pending") rememberWord(wordKeyOf(frame2));
    return true;
  }
  if (rk?.kind === "ask" && askedMine(f, fields)) return true;
  if (closed && rk?.kind === "progress") return true;
  if (closed) f.closes_mine = closed;
  if (rk && ASK_CLOSERS.has(rk.kind) && f.addressed === true) return true;
  if (rk?.kind === "invite" || rk?.kind === "withdraw") return inviteMine(f);
  if (rk && LOUD_KINDS.has(rk.kind)) return true;
  if (rk && (ASK_KINDS.has(rk.kind) || rk.kind === "retract") || askFromPerson(f)) return false;
  return (frame2.origin ?? classifyOrigin(frame2, str(f.karta_seq) || void 0)) === "human";
}
function closedQuestion(frame2) {
  return addressedToMine(frame2) ? "" : frame2.closes_mine ?? "";
}

// js/shared/seen.ts
var SEEN_KEEP = 5e3;
var SEEN_SLACK = 1e3;
var evOf = (v) => typeof v === "number" || typeof v === "string" && v ? `ev:${v}` : "";
function eventKeyOf(frame2) {
  const via2 = frame2?.provenance?.via;
  if (via2 === "room") return evOf(frame2?.event_id);
  if (via2 !== "graph") return "";
  const body = frame2?.body;
  if (!body || typeof body !== "object" || Array.isArray(body)) return "";
  return evOf(body.event_id);
}
var asText = (frame2) => addressedToMine(frame2);
function deliveryKeys(frame2, named2 = false) {
  const id = typeof frame2?.id === "string" ? frame2.id : "";
  const ev = frame2 && asText(frame2) ? eventKeyOf(frame2) : "";
  const mark = ev && frame2?.stale === true ? `evs:${ev.slice(3)}` : ev;
  return [id, mark && (named2 ? `c${mark}` : mark)].filter(Boolean);
}
function eventIn(frame2, has) {
  const ev = frame2 ? eventKeyOf(frame2) : "";
  if (!ev || !frame2) return false;
  const n = ev.slice(3);
  const stale = frame2.stale === true;
  const keys = !asText(frame2) ? [ev, `evs:${n}`] : stale ? [ev, `evs:${n}`, `cev:${n}`, `cevs:${n}`] : [ev, `cev:${n}`];
  return keys.some(has);
}
var isTact = (frame2) => frame2?.provenance?.wake === "look_up";
var isLifeCheck = (frame2) => frame2?.provenance?.wake === "life_check";
function foldedTacts(all2) {
  const tacts = all2.filter((f) => isTact(f));
  const last = tacts.reduce((a, f) => a && tactAt([a]) > tactAt([f]) ? a : f, null);
  return new Set(tacts.filter((f) => f !== last));
}
var tactAt = (frames) => (frames ?? []).filter(isTact).map((f) => typeof f.received_at === "string" ? f.received_at : "").reduce((a, b) => b > a ? b : a, "");
var sameCopy = (a, b) => !!a && eventKeyOf(a) === eventKeyOf(b) && asText(a) === asText(b);
function splitBatch(all2, keep, has) {
  const folded = foldedTacts(all2);
  let kept3 = all2.filter((f) => !folded.has(f) && !eventIn(f, has));
  for (; ; ) {
    const shown = new Set(kept3.slice(0, keep));
    const marks = /* @__PURE__ */ new Set();
    const local = (k) => marks.has(k) || has(k);
    const texts = kept3.filter((f) => {
      if (!asText(f)) return true;
      if (eventIn(f, local)) return false;
      for (const k of deliveryKeys(f, !shown.has(f))) marks.add(k);
      return true;
    });
    const next = texts.filter((f) => asText(f) || !eventIn(f, local));
    if (next.length < kept3.length) {
      kept3 = next;
      continue;
    }
    const on = new Set(next.slice(0, keep));
    return {
      shown: next.slice(0, keep),
      kept: next,
      keys: all2.flatMap((f) => deliveryKeys(f, !on.has(f)))
    };
  }
}
function seenIds(seenPath) {
  try {
    return new Set(readFileSync10(seenPath, "utf8").split("\n").filter(Boolean));
  } catch {
    return /* @__PURE__ */ new Set();
  }
}
function noteSeen(seenPath, id, seen) {
  if (seen.has(id)) return;
  seen.add(id);
  try {
    appendFileSync2(seenPath, id + "\n");
    if (seen.size > SEEN_KEEP + SEEN_SLACK) compact(seenPath, seen);
  } catch {
  }
}
function compact(seenPath, seen) {
  const file = [...seenIds(seenPath)];
  const inFile = new Set(file);
  const tail2 = [...[...seen].filter((x) => !inFile.has(x)), ...file].slice(-SEEN_KEEP);
  const tmp = `${seenPath}.${process.pid}.tmp`;
  writeFileSync7(tmp, tail2.join("\n") + "\n");
  renameSync6(tmp, seenPath);
  seen.clear();
  for (const x of tail2) seen.add(x);
}

// js/bridge/askdisk.ts
import { appendFileSync as appendFileSync3, readFileSync as readFileSync11, renameSync as renameSync7, unlinkSync as unlinkSync6, writeFileSync as writeFileSync8 } from "node:fs";
var asksPathOf = (seenPath) => seenPath.replace(/\.seen$/, "") + ".asks";
var kept2 = () => Number(process.env[envName("BRIDGE_ASKS_KEPT")]) || 2048;
var DECIDED = /^(hit|closes):/;
var loaded = /* @__PURE__ */ new Map();
function note(m, k) {
  const at3 = k.indexOf("=");
  if (at3 > 0) m.index.set(k.slice(0, at3), k.slice(at3 + 1));
}
function load(path) {
  const m = { set: /* @__PURE__ */ new Set(), index: /* @__PURE__ */ new Map(), room: 0 };
  try {
    for (const k of readFileSync11(path, "utf8").split("\n").filter(Boolean)) {
      m.set.add(k);
      note(m, k);
    }
  } catch {
  }
  return m;
}
function trim(path, m) {
  const drop = (k) => {
    m.set.delete(k);
    const at3 = k.indexOf("=");
    if (at3 > 0) m.index.delete(k.slice(0, at3));
  };
  const decided = [...m.set].filter((k) => DECIDED.test(k));
  const closed = [...m.set].filter((k) => k.startsWith("off:"));
  const max = kept2();
  if (decided.length <= max && closed.length <= max) return;
  for (const k of decided.slice(0, Math.max(0, decided.length - max))) drop(k);
  for (const k of closed.slice(0, Math.max(0, closed.length - max))) {
    drop(k);
    drop(k.slice(4));
  }
  const tmp = `${path}.${process.pid}.tmp`;
  try {
    writeFileSync8(tmp, [...m.set].map((k) => `${k}
`).join(""));
    renameSync7(tmp, path);
  } catch {
    try {
      unlinkSync6(tmp);
    } catch {
    }
  }
}
function diskAsks(seenPath) {
  const path = asksPathOf(seenPath);
  let m = loaded.get(path);
  if (!m) loaded.set(path, m = load(path));
  const mem = m;
  return {
    has: (k) => mem.set.has(k),
    add: (k) => {
      if (mem.set.has(k)) return;
      mem.set.add(k);
      note(mem, k);
      try {
        appendFileSync3(path, `${k}
`);
      } catch {
      }
      if (++mem.room > kept2() / 4) {
        mem.room = 0;
        trim(path, mem);
      }
    },
    keys: () => mem.set,
    get: (k) => mem.index.get(k)
  };
}

// js/bridge/addressmark.ts
var markOf = (frame2) => `word:${wordKeyOf(frame2)}`;
function markAddressed(frame2, seenPath, seen) {
  const rk = roomKind(frame2);
  if (rk?.kind === "said" && rk.aside && frame2.body_pending === true) {
    noteSeen(seenPath, asideKeyOf(frame2), seen);
  } else if (rk?.kind === "said" && rk.phase === "pending") {
    if (addressedToMine(frame2)) noteSeen(seenPath, markOf(frame2), seen);
  } else if (rk?.kind === "body" && !rk.aside) {
    if (seen.has(asideKeyOf(frame2))) frame2.addressed = false;
    else if (seen.has(markOf(frame2)) || addressedToMine(frame2)) frame2.addressed = true;
  } else if (rk && (ASK_KINDS.has(rk.kind) || rk.kind === "progress")) {
    const id = typeof frame2.id === "string" ? frame2.id : "";
    const hit = `hit:${id}`;
    const store = diskAsks(seenPath);
    const n = id && store.get?.(`closes:${id}`) || closesMine(store, frame2);
    if (store.has(hit) || n && rk.kind === "progress") {
      frame2.addressed = true;
      if (id) store.add(hit);
    } else if (n && !namedMine(frame2, rk.kind)) {
      Object.assign(frame2, { addressed: false, closes_mine: n });
      if (id) store.add(`closes:${id}=${n}`);
    }
    noteAsk(store, frame2);
    frame2.asks_decided = true;
  }
}

// js/shared/clients.ts
var OPENCODE_CLIENT = CLIENTS.opencode;
var SURFACE_CLIENT = "export-surface";
var OWN_CLIENTS = /* @__PURE__ */ new Set([OPENCODE_CLIENT, SURFACE_CLIENT]);
var PI_CLIENT = CLIENTS.pi;
var NOTIFIED_CLIENTS = /* @__PURE__ */ new Set([PI_CLIENT, OPENCODE_CLIENT]);
var HARNESS_VERSION_ENV = envName("HARNESS_VERSION");
var SKILLS_ROOT_ENV = envName("SKILLS_ROOT");
var HOSTED_CLIENTS = /* @__PURE__ */ new Set([PI_CLIENT, OPENCODE_CLIENT]);

// js/shared/fields.ts
var FIELDS_CAPABILITY = STRUCTURED_CAPABILITY;
var FIELDS_CAPABILITIES = { experimental: { [FIELDS_CAPABILITY]: {} } };
var obj2 = (v) => v && typeof v === "object" && !Array.isArray(v) ? v : {};
var asksFields = (initParams) => FIELDS_CAPABILITY in obj2(obj2(obj2(initParams).capabilities).experimental);
function withFieldsAsked(initParams) {
  const p = obj2(initParams);
  const caps = obj2(p.capabilities);
  const exp = obj2(caps.experimental);
  if (FIELDS_CAPABILITY in exp) return p;
  return { ...p, capabilities: { ...caps, experimental: { ...exp, [FIELDS_CAPABILITY]: {} } } };
}

// js/bridge/repeat.ts
var OWN_CALL_PREFIX = `${ID_PREFIX}bridge-call-`;
var READ_TOOLS = new Set(["look", "orient", "search", "semantic_search"].map(tool));
var SAFE_ACTIONS = {
  [tool("channel")]: /* @__PURE__ */ new Set(["list"]),
  [tool("realm")]: /* @__PURE__ */ new Set(["list"])
};
function repeatable(msg) {
  if (msg?.id === void 0 || msg?.id === null) return true;
  if (msg.method === "initialize" || msg.method === "tools/list") return true;
  if (msg.method !== "tools/call") return false;
  const name2 = String(msg.params?.name ?? "");
  if (READ_TOOLS.has(name2)) return true;
  const action = String(msg.params?.arguments?.action ?? "");
  if (ownPlaceEnd(msg, name2, action)) return true;
  return !!SAFE_ACTIONS[name2]?.has(action);
}
function ownPlaceEnd(msg, name2, action) {
  return name2 === tool("channel") && (action === "revoke" || action === "close") && String(msg.id ?? "").startsWith(OWN_CALL_PREFIX);
}

// js/bridge/toolsync.ts
import { createHash as createHash6 } from "node:crypto";
var LIST_CHANGED = "notifications/tools/list_changed";
var T = scoped(() => ({
  served: null,
  // each harness session has its own list
  told: false,
  // list_changed said, and the harness has not reread yet
  inFlight: 0,
  // the harness's tools/list in flight (any page)
  listing: /* @__PURE__ */ new WeakSet(),
  // the harness's tools/list (first page) in flight
  heldBack: /* @__PURE__ */ new WeakSet(),
  // …in whose answer the server said list_changed
  live: /* @__PURE__ */ new WeakSet()
  // …answered to the harness with the server's live list
}));
function toolsPrint(result) {
  const tools = result?.tools;
  if (!Array.isArray(tools)) return null;
  const shape = tools.map((t) => [t.name ?? "", JSON.stringify(t.inputSchema ?? null)]).sort((a, b) => a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0);
  return createHash6("sha256").update(JSON.stringify(shape)).digest("hex");
}
function noteServedTools(result, liveFor) {
  const print = toolsPrint(result);
  if (!print) return;
  T.served = print;
  T.told = false;
  if (liveFor) T.live.add(liveFor);
}
var harnessListing = () => T.inFlight > 0;
function watchHarnessListing(msg, emit2) {
  T.inFlight++;
  const first2 = !msg.params?.cursor;
  if (first2) T.listing.add(msg);
  if (first2) T.told = false;
  return () => {
    T.inFlight--;
    if (T.heldBack.has(msg) && !T.live.has(msg))
      tell(emit2, "the server said its tool list changed, and no fresh list reached the harness");
  };
}
var isListChanged = (m) => m?.method === LIST_CHANGED && (m.id === void 0 || m.id === null);
function tell(emit2, why, again = false) {
  if (T.told && !again) return;
  T.told = true;
  log(`${why} — telling the harness (tools/list_changed)`);
  emit2({ jsonrpc: "2.0", method: LIST_CHANGED });
}
function heardListChanged(sent, emit2) {
  if (T.listing.has(sent)) return void T.heldBack.add(sent);
  tell(emit2, `the server said its tool list changed (answering ${sent?.method})`);
}
async function recheckTools(ask3, emit2) {
  if (!T.served) return;
  const fresh2 = toolsPrint((await ask3().catch(() => null))?.result);
  if (!fresh2 || fresh2 === T.served) return;
  T.served = fresh2;
  tell(emit2, "tool list changed under the re-opened session", true);
}

// js/bridge/names.ts
import { execFileSync } from "node:child_process";
import { realpathSync } from "node:fs";
import { hostname } from "node:os";
import { basename as basename2, dirname as dirname3, resolve as resolve4 } from "node:path";

// js/shared/satname.ts
var NAME_MAX = 48;
var SUB_RE = /\.sub-([1-9]\d*)$/;
var satelliteName = (base, n) => base.slice(0, NAME_MAX - `.sub-${n}`.length).replace(/[-._]+$/, "") + `.sub-${n}`;
function isSatelliteOf(base, name2) {
  const m = SUB_RE.exec(name2);
  return !!m && satelliteName(base, Number(m[1])) === name2;
}

// js/shared/seat.ts
var normKarta = (k) => String(k ?? "").trim().replace(/^#/, "");

// js/bridge/names.ts
var nw = () => words(NAMES);
var normName = (n) => typeof n === "string" ? n.trim() : "";
var NAME_RE = /^[a-z0-9][a-z0-9._-]*$/;
var sanitize = (s2) => s2.toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/^[-.]+|[-.]+$/g, "").slice(0, NAME_MAX);
function nameFault(name2) {
  if (name2.length > NAME_MAX) return nw().overLimit(name2.length);
  if (!NAME_RE.test(name2)) return /[A-Z]/.test(name2) ? nw().capitals() : nw().badSigns();
  return null;
}
var PART_MIN = 3;
var CUT_ORDER = ["repo", "host", "model"];
function fitName(parts) {
  const p = { ...parts };
  const join40 = () => [p.host, p.repo, p.model].filter(Boolean).join(".").replace(/[-.]+$/, "");
  const cut = [];
  for (const k of CUT_ORDER) {
    const over = join40().length - NAME_MAX;
    if (over <= 0) break;
    const keep = Math.max(k === "model" ? 1 : PART_MIN, p[k].length - over);
    if (keep >= p[k].length) continue;
    p[k] = p[k].slice(0, keep).replace(/[-.]+$/, "");
    cut.push(k);
  }
  return {
    name: join40().slice(0, NAME_MAX).replace(/[-.]+$/, ""),
    cut
  };
}
var git = (args, cwd = sessionCwd()) => {
  try {
    return execFileSync("git", args, {
      cwd,
      timeout: 2e3,
      stdio: ["ignore", "pipe", "ignore"]
    }).toString().trim();
  } catch {
    return "";
  }
};
var real = (p) => {
  try {
    return realpathSync(p);
  } catch {
    return p;
  }
};
function repoName(cwd = sessionCwd()) {
  const top = git(["rev-parse", "--show-toplevel"], cwd);
  const [gitDir, common] = git(["rev-parse", "--git-dir", "--git-common-dir"], cwd).split("\n");
  if (!gitDir || !common || real(resolve4(cwd, gitDir)) === real(resolve4(cwd, common)))
    return basename2(top || cwd);
  const shared = real(resolve4(cwd, common));
  if (basename2(shared) === ".git") return basename2(dirname3(shared));
  const origin2 = git(["remote", "get-url", "origin"], cwd).replace(/\/+$/, "");
  const fromOrigin = basename2(origin2.replace(/^.*:/, "/")).replace(/\.git$/, "");
  return fromOrigin || basename2(top || cwd);
}
function deriveParts(model, cwd = sessionCwd()) {
  const host = hostname().split(".")[0];
  const repo = repoName(cwd);
  const short2 = (model ?? "").trim().toLowerCase().replace(/^claude[-_]/, "");
  return { host: sanitize(host ?? ""), repo: sanitize(repo), model: sanitize(short2) };
}
var joinName = (p) => [p.host, p.repo, p.model].filter(Boolean).join(".");

// js/bridge/unnamed.ts
var SEAT_MOVES = /* @__PURE__ */ new Set(["connect", "mint", "register"]);
var HUMAN = /* @__PURE__ */ new Set(["me", "realm-owner"]);
function unnamedSeatRefusal(msg) {
  if (msg?.method !== "tools/call" || msg.params?.name !== tool("channel")) return null;
  const a = msg.params.arguments ?? {};
  const action = String(a.action);
  if (!SEAT_MOVES.has(action) || normName(a.name)) return null;
  if (envOf(envName("BRIDGE_OWNER_ROLE"))?.trim() === "1" && HUMAN.has(normKarta(a.karta)))
    return null;
  return {
    jsonrpc: "2.0",
    id: msg.id,
    result: { isError: true, content: [{ type: "text", text: words(UNNAMED).refused(action) }] }
  };
}

// js/bridge/transport.ts
var state = scoped(() => ({
  sessionId: null,
  protocolVersion: null,
  initParams: null,
  // params of the harness's initialize, for transparent replay
  reinitCounter: 0,
  // The standing this session registered, and the session it was confirmed in.
  // Why the bridge owns re-registration, what was observed to go wrong, and the
  // falsifier that closes it: graph @nks/nks-dev, nodes #3919 (the breakdown),
  // #3454 (the falsifier), #3800 (the header form the surface binds with).
  // The server correlates a writer BY THE MCP SESSION ID (its holder's word):
  // a new session is a different writer, and the surface's own self-repair has
  // nothing to repeat there, because its memory is keyed by that same id and is
  // collected with it. Sessions die silently in three ways — idle past the
  // threshold, eviction by the session ceiling, transport close — and the
  // bridge is the ONLY party that sees the change and still remembers the name
  // the agent derived for itself. So re-registering is the bridge's duty, and
  // it hangs on the change of id, never on a timer.
  standing: null,
  // {realm, karta, name} of the last register that succeeded
  // Places in OTHER graphs on the same channel (#5838): register on the channel
  // in another graph adds a place, and a write is signed by the place of its
  // own graph. `standing` stays the place the socket was taken for; these ride
  // it and are replayed with it after every session turnover.
  places: [],
  standingSession: null,
  // the session id that registration is known to hold in
  // The access token the session was opened with. A session is opened BY a
  // credential and dies with it (the surface's own word): once the token in the
  // store is no longer the one this session was opened with — expired, refreshed
  // after a 401, rotated by a sibling bridge — the old id is a dead letter, and a
  // server that opens a fresh session on it silently runs the call unattributed
  // before we learn the new id. So a changed token means: re-open first.
  sessionToken: null
}));
function standingHeader() {
  const s2 = state.standing;
  if (!s2?.realm || s2.karta == null || !s2.name) return null;
  const h = `${s2.realm} ${s2.karta} ${s2.name}`;
  if (!/^[\x21-\x7e]+ [\x21-\x7e]+ [\x21-\x7e]+$/.test(h)) return null;
  return h;
}
var currentAccessToken = () => CFG.pat ?? loadStore().tokens?.access_token ?? null;
async function* sseEvents(body) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    let m;
    while ((m = /\r?\n\r?\n/.exec(buf)) !== null) {
      const raw = buf.slice(0, m.index);
      buf = buf.slice(m.index + m[0].length);
      const data = raw.split(/\r?\n/).filter((l) => l.startsWith("data:")).map((l) => l.slice(5).replace(/^ /, "")).join("\n");
      if (data) yield data;
    }
  }
}
var TLS_REFUSALS = /* @__PURE__ */ new Set([
  "DEPTH_ZERO_SELF_SIGNED_CERT",
  "SELF_SIGNED_CERT_IN_CHAIN",
  "UNABLE_TO_VERIFY_LEAF_SIGNATURE",
  "UNABLE_TO_GET_ISSUER_CERT",
  "UNABLE_TO_GET_ISSUER_CERT_LOCALLY",
  "CERT_HAS_EXPIRED",
  "CERT_NOT_YET_VALID",
  "CERT_UNTRUSTED",
  "CERT_REVOKED",
  "ERR_TLS_CERT_ALTNAME_INVALID"
]);
var bearer = () => CFG.pat ?? loadStore().tokens?.access_token ?? null;
async function post2(msg, heard2) {
  const onMessage = (m) => isListChanged(m) ? heardListChanged(msg, emit) : heard2(m);
  const unnamed = unnamedSeatRefusal(msg);
  if (unnamed) return void onMessage(unnamed);
  const headers2 = {
    "content-type": "application/json",
    accept: "application/json, text/event-stream"
  };
  const locale = SERVER_LOCALE[lang()];
  if (locale) headers2["accept-language"] = locale;
  const token = bearer();
  if (token) headers2.authorization = `Bearer ${token}`;
  else if (loginPublished())
    throw new UpstreamError("unauthorized (login pending)", "auth", null, UpstreamError.NOT_SENT);
  const isInit = msg?.method === "initialize";
  if (isInit && state.sessionId) {
    log(`initialize under a held session id (${state.sessionId}) — sent without it`);
    state.sessionId = null;
    state.sessionToken = null;
  }
  const sentSession = state.sessionId;
  if (sentSession) headers2["mcp-session-id"] = sentSession;
  if (state.protocolVersion) headers2["mcp-protocol-version"] = state.protocolVersion;
  const boundByHeader = isInit ? standingHeader() : null;
  if (boundByHeader) headers2["x-nks-standing"] = boundByHeader;
  const sent = isInit ? { ...msg, params: withFieldsAsked(msg.params) } : msg;
  const send2 = () => fetch(CFG.serverUrl, {
    method: "POST",
    headers: headers2,
    body: JSON.stringify(sent),
    signal: AbortSignal.timeout(CFG.timeoutMs)
  });
  let res;
  try {
    res = await send2().catch((e) => {
      if (!closedUnder(e) || !repeatable(msg)) throw e;
      log(
        `upstream connection closed under ${msg?.method} before the answer — sending it once more`
      );
      return send2();
    });
  } catch (e) {
    const err = e;
    const timedOut = err.name === "TimeoutError";
    const code = errorCode(e);
    const message = errorMessage(e);
    const tls = TLS_REFUSALS.has(code ?? "");
    const reason = timedOut ? `no answer within ${CFG.timeoutMs}ms` : (code && !message.includes(code) ? `${message} (${code})` : message) + (tls ? " — the server's certificate is not trusted on this machine (a corporate TLS inspection?); give the bridge the organisation's CA in NODE_EXTRA_CA_CERTS" : "");
    const neverLeft = !timedOut && (tls || [
      "ECONNREFUSED",
      "ENOTFOUND",
      "EAI_AGAIN",
      "ERR_SOCKET_BAD_PORT",
      "ConnectionRefused"
    ].includes(code ?? ""));
    throw new UpstreamError(
      `upstream unreachable: ${reason}`,
      "network",
      null,
      neverLeft ? UpstreamError.NOT_SENT : UpstreamError.UNKNOWN,
      !timedOut && !tls
    );
  }
  noteServerDate(res);
  if (res.status === 401) {
    res.body?.cancel?.();
    throw new UpstreamError(
      res.headers.get("www-authenticate") || "unauthorized",
      "auth",
      token,
      UpstreamError.NOT_SENT
    );
  }
  if (res.status === 404 && sentSession) {
    res.body?.cancel?.();
    throw new UpstreamError("session expired upstream", "session", null, UpstreamError.NOT_SENT);
  }
  const sid = res.headers.get("mcp-session-id");
  if (sid) {
    if (sid !== state.sessionId && !isInit) {
      log(
        `upstream replaced the session mid-call (${state.sessionId} -> ${sid}) — this call may have gone unattributed`
      );
    }
    state.sessionId = sid;
    state.sessionToken = token;
  }
  if (res.status === 202 || res.status === 204) return;
  if (!res.ok) {
    const text3 = (await res.text().catch(() => "")).slice(0, 300);
    throw new UpstreamError(
      `upstream HTTP ${res.status}: ${text3}`,
      "http",
      null,
      res.status < 500 ? UpstreamError.NOT_SENT : UpstreamError.UNKNOWN
    );
  }
  const ctype = res.headers.get("content-type") || "";
  if (ctype.includes("text/event-stream")) {
    try {
      if (!res.body) return;
      for await (const data of sseEvents(res.body)) {
        try {
          onMessage(JSON.parse(data));
        } catch {
          debug(`unparseable SSE data: ${data.slice(0, 120)}`);
        }
      }
    } catch (e) {
      throw new UpstreamError(
        `upstream stream broke mid-response: ${errorMessage(e)}`,
        "network",
        null,
        UpstreamError.UNKNOWN,
        true
      );
    }
    return;
  }
  const text2 = await res.text();
  if (!text2.trim()) return;
  try {
    onMessage(JSON.parse(text2));
  } catch {
    throw new UpstreamError(`upstream sent unparseable JSON: ${text2.slice(0, 200)}`, "http");
  }
}
var reinit = scoped(() => ({ inFlight: null }));
var reinitHooks = [];
var onReinitialized = (hook) => {
  reinitHooks.push(hook);
};
async function reinitialize() {
  if (reinit.inFlight) return reinit.inFlight;
  reinit.inFlight = (async () => {
    try {
      if (!state.initParams) throw new UpstreamError("session lost before initialize", "session");
      log("upstream session lost — re-initializing transparently");
      state.sessionId = null;
      state.sessionToken = null;
      const id = `${ID_PREFIX}bridge-reinit-${++state.reinitCounter}`;
      let result = null;
      await post2({ jsonrpc: "2.0", id, method: "initialize", params: state.initParams }, (m) => {
        if (m.id === id) result = m;
      });
      const got = result;
      if (!got || got.error) {
        throw new UpstreamError(
          `re-initialize refused: ${JSON.stringify(got?.error ?? null)}`,
          "session"
        );
      }
      if (got.result?.protocolVersion) state.protocolVersion = got.result.protocolVersion;
      if (got.result) saveServerCache({ init: got.result });
      await post2({ jsonrpc: "2.0", method: "notifications/initialized" }, () => {
      });
      log(`session re-established (${state.sessionId || "no session id"})`);
      for (const hook of reinitHooks) void hook();
    } finally {
      reinit.inFlight = null;
    }
  })();
  return reinit.inFlight;
}

// js/bridge/client.ts
var clientInfo = () => state.initParams?.clientInfo;
function harnessName() {
  const info = clientInfo();
  return typeof info?.name === "string" ? info.name : "";
}
function harnessVersion() {
  const v = HOSTED_CLIENTS.has(harnessName()) ? envOf(HARNESS_VERSION_ENV) : clientInfo()?.version;
  return typeof v === "string" && v.trim() ? v.trim() : "unknown";
}
var notifiedClient = () => NOTIFIED_CLIENTS.has(harnessName());

// js/bridge/complete.ts
function stampOrigin(frame2) {
  if (!frame2 || frame2.type !== "message") return frame2;
  return { ...frame2, origin: classifyOrigin(frame2, state.standing?.karta) };
}

// js/bridge/door.ts
import { chmodSync as chmodSync2, mkdirSync as mkdirSync8, unlinkSync as unlinkSync10, utimesSync } from "node:fs";
import { createServer as createServer3 } from "node:net";
import { dirname as dirname5 } from "node:path";

// js/shared/keyfold.ts
var rec = (v) => v && typeof v === "object" ? v : {};
var idOf = (v) => typeof v === "number" || typeof v === "string" && v ? String(v) : "";
function superseded(frames) {
  const last = /* @__PURE__ */ new Map();
  const out7 = /* @__PURE__ */ new Set();
  frames.forEach((f, i) => {
    const r = f;
    const line = rec(r.line);
    const key2 = typeof line.key === "string" ? line.key : "";
    if (line.kind !== "progress" || !key2 || line.verdict === "bad" || addressedToMine(f)) return;
    const k = `${idOf(rec(r.room).id) || idOf(rec(r.room).seq)}|${key2}`;
    const e = Number(r.entry_id ?? line.entry_id);
    const at3 = Number.isFinite(e) ? e : i;
    const was = last.get(k);
    if (!was) return void last.set(k, { frame: f, at: at3 });
    if (at3 >= was.at) {
      out7.add(was.frame);
      last.set(k, { frame: f, at: at3 });
    } else out7.add(f);
  });
  return out7;
}

// js/shared/frame-text.ts
var W = () => words(ROOM);
var T2 = () => words(FRAME_TEXT);
var rec2 = (v) => v && typeof v === "object" ? v : {};
var idOf2 = (v) => typeof v === "number" || typeof v === "string" && v ? String(v) : "";
var ZACHIN = 40;
function casesOf(frames) {
  const by = /* @__PURE__ */ new Map();
  for (const f of frames) {
    const key2 = caseKey(f) || idOf2(f.id) || "?";
    const got = by.get(key2);
    if (got) got.push(f);
    else by.set(key2, [f]);
  }
  return [...by.values()];
}
function caseOf(frame2) {
  const f = frame2;
  const room = rec2(f.room);
  const n = idOf2(room.seq) || idOf2(room.id);
  if (!n) return null;
  const z = typeof room.zachin === "string" ? [...room.zachin.trim()] : [];
  const zachin = z.length > ZACHIN ? z.slice(0, ZACHIN).join("") + "…" : z.join("");
  const realm = idOf2(room.realm) || idOf2(f.realm);
  return { room: n, zachin, realm };
}
var caseKey = (frame2) => caseOf(frame2)?.room ?? "";
function caseHead(frame2, withZachin) {
  const c = caseOf(frame2);
  if (!c) return "";
  const no = W().case(need(c.room));
  return withZachin && c.zachin ? `${no} «${c.zachin}»` : no;
}
function whoOf2(frame2, withPlace) {
  const p = frame2.provenance ?? {};
  const origin2 = frame2.origin ?? classifyOrigin(frame2);
  if (origin2 === "platform") return W().whoPlatform();
  if (p.via === "graph" && p.from_karta_seq == null && !p.from_standing) return W().whoGraph();
  const place = withPlace && p.from_standing ? ` (${p.from_standing})` : "";
  if (origin2 === "human") return W().whoHuman(opt(" @", p.user)) + place;
  const karta = p.from_karta_seq;
  if (karta == null) return p.from_standing ?? "";
  return (origin2 === "sibling" ? W().whoSibling : W().whoRole)(need(karta)) + place;
}
function textOf(frame2) {
  if (roomKind(frame2)?.aside) return "";
  const b = frame2.body;
  return typeof b === "string" ? b : b === void 0 ? "" : JSON.stringify(b);
}
function tail(frame2, withReply) {
  const f = frame2;
  const parts = [];
  const to = idOf2(f.in_reply_to) || idOf2(frame2.provenance?.in_reply_to);
  if (withReply && to) parts.push(W().replyTo(need(to)));
  if (frame2.stale === true) parts.push(W().stale());
  if (typeof frame2.body_read === "string" && frame2.body_read !== "history")
    parts.push(W().bodyRead(need(frame2.body_read)));
  return parts.length ? `, ${parts.join(", ")}` : "";
}
function humanWordReply(frame2, origin2) {
  if (origin2 !== "human") return "";
  const p = rec2(frame2.provenance);
  const standing = idOf2(p.from_standing) || idOf2(p.from_standing_id);
  const id = idOf2(frame2.id);
  return standing && id ? T2().humanWordReply(standing, id) : "";
}
function frameToText(frame2, raw) {
  if (!frame2) return raw;
  const f = frame2;
  const origin2 = frame2.origin ?? classifyOrigin(frame2);
  const text2 = textOf(frame2);
  const c = caseOf(frame2);
  if (c) {
    if (!addressedToMine(frame2)) return caseCountLine([frame2]);
    const rk = roomKind(frame2);
    const line = rec2(f.line);
    const entry = idOf2(f.entry_id) || idOf2(line.entry_id);
    const words2 = rk ? rk.words : W().legacy(need(f.kind), typeof f.stack === "string" ? f.stack : "");
    const author = rk?.author && !words2.includes(rk.author) ? rk.author : "";
    const who = origin2 === "platform" ? "" : whoOf2(frame2, false);
    const by = [author, who].filter(Boolean).join(", ");
    const withReply = rk?.kind !== "body";
    const head = `${caseHead(frame2, true)}${entry ? ` [${entry}]` : ""} ${words2}${by ? ` — ${by}` : ""}${tail(frame2, withReply)}`;
    const lines2 = [head];
    if (text2 && !words2.includes(text2.trim())) lines2.push(text2);
    return lines2.join("\n");
  }
  const lines = [`${whoOf2(frame2, true) || "?"}${tail(frame2, true)}`];
  if (text2) lines.push(text2);
  const reply2 = humanWordReply(frame2, origin2);
  if (reply2) lines.push(reply2);
  if (isLifeCheck(frame2)) lines.push(T2().lifeCheckSeat(warnedSeat(frame2)), T2().lifeCheckReply());
  return lines.join("\n");
}
var warnedSeat = (frame2) => typeof frame2.to_standing === "string" ? frame2.to_standing.replace(/^.*:/, "") : "";
var BATCH_TEXT = 160;
function batchLine(frame2, run2, withZachin = true) {
  const f = frame2;
  const rk = roomKind(frame2);
  const head = caseHead(frame2, withZachin);
  const pre = head ? `${head} ` : "";
  if (rk?.aside) return pre + (run2 === void 0 ? rk.words : rk.aside.run(run2));
  const line = rec2(f.line);
  const e = f.entry_id ?? line.entry_id ?? f.id;
  const entry = typeof e === "number" || typeof e === "string" ? e : "?";
  const words2 = rk?.words ?? T2().frame(typeof f.id === "string" ? f.id : "?");
  const author = rk?.author && !words2.includes(rk.author) ? ` — ${rk.author}` : "";
  const flat = [...textOf(frame2).replace(/\s+/g, " ").trim()];
  const text2 = flat.length > BATCH_TEXT ? flat.slice(0, BATCH_TEXT).join("") + "…" : flat.join("");
  const dup = !!text2 && words2.includes(text2);
  return `${pre}[${entry}] ${words2}${author}${tail(frame2, rk?.kind !== "body")}${text2 && !dup ? `: ${text2}` : ""}`;
}
function foldAsides(frames) {
  const asides = frames.map((f) => roomKind(f)?.aside ?? null);
  const out7 = [];
  let n = 0;
  asides.forEach((a, i) => {
    if (!a) {
      n = 0;
      out7.push(1);
      return;
    }
    n = (i > 0 && asides[i - 1]?.pair === a.pair ? n : 0) + (a.counts ? 1 : 0);
    out7.push(asides[i + 1]?.pair === a.pair ? null : n);
  });
  return out7;
}
function closingOf(frame2) {
  const n = closedQuestion(frame2);
  if (!n) return "";
  const rk = roomKind(frame2);
  const to = rec2(rec2(rec2(rec2(frame2).line).fields).to);
  if (rk?.kind !== "ask") return T2().askAnswered(n, need(rk?.author));
  const seat2 = addresseeOf(to.standing)?.label || idOf2(rec2(to.karta).name);
  return T2().askMoved(n, need(seat2));
}
function caseCountLine(frames) {
  const c = frames.length ? caseOf(frames[0]) : null;
  if (!c) return "";
  const mineN = frames.filter((f) => addressedToMine(f)).length;
  const gone = superseded(frames).size;
  const head = caseHead(frames[0], true);
  const yours = mineN ? T2().yoursBelow() : T2().noneYours();
  const n = frames.length - gone;
  return T2().count(head, n, mineN) + (gone ? T2().supersededLines(gone) : "") + frames.map(closingOf).join("") + yours + batchPointer(frames) + ".";
}
function caseCountLines(frames) {
  return casesOf(frames).map(caseCountLine).filter(Boolean);
}
function batchHead(frames) {
  return caseCountLines(frames).join("\n");
}
function batchPointer(frames) {
  const since = /* @__PURE__ */ new Map();
  for (const frame2 of frames) {
    const f = frame2;
    const room = f.room ?? {};
    const line = f.line ?? {};
    const n = room.seq ?? room.id;
    const e = Number(f.entry_id ?? line.entry_id);
    if (typeof n !== "number" && typeof n !== "string" || !Number.isFinite(e)) continue;
    const realm = room.realm ?? f.realm;
    const args = (typeof realm === "string" && realm ? `realm="${realm}", ` : "") + `action="history", room=${typeof n === "number" ? String(n) : JSON.stringify(n)}`;
    since.set(args, Math.min(since.get(args) ?? e, e));
  }
  return T2().inFull([...since].map(([args, e]) => T2().caseHistory(args, e - 1)).join("; "));
}

// js/bridge/backlog.ts
var BACKLOG_MS = Number(process.env[envName("BRIDGE_BACKLOG_MS")]) || 1500;
var BACKLOG_KEEP = 20;
var BODY_CAP = 800;
var at = (f) => typeof f.received_at === "string" ? f.received_at : "";
var Backlog = class {
  /** Shows the first BACKLOG_KEEP, marks all as given (graph @nks/nks-dev, node #5831). */
  all = [];
  /** Direct words went out separately; the head only counts them. */
  direct = 0;
  pending = 0;
  timer = null;
  flush = null;
  /** The seat's marks: an event already in a turn is not repeated (seen.ts eventIn). */
  has;
  constructor(has) {
    this.has = has;
  }
  /** The frames the window holds (pulse.ts pending). */
  get frames() {
    return this.all;
  }
  /** An open window is not extended, only filled. */
  open(expected, emit2) {
    this.pending = Math.max(this.pending, expected);
    this.flush = emit2;
    if (this.timer) return;
    this.timer = setTimeout(() => this.close(), BACKLOG_MS).unref();
  }
  /** On releasing the standing: nothing ungiven is lost silently. */
  flushNow() {
    if (!this.timer) return;
    clearTimeout(this.timer);
    this.close();
  }
  /** On the owner's stop: what waited is not given, the stopped agent is not woken (#7439). */
  drop() {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    this.flush = null;
    this.pending = 0;
    this.direct = 0;
    return this.all.splice(0).length;
  }
  /**
   * false — no window, a direct word or a life check: each goes its own way whole.
   * A repeated id already in the window is not counted.
   */
  note(frame2) {
    if (!this.timer || isLifeCheck(frame2)) return false;
    if (isDirectWord(frame2)) {
      this.direct++;
      return false;
    }
    const id = typeof frame2.id === "string" ? frame2.id : "";
    if (id && this.all.some((f) => f.id === id)) return true;
    this.all.push(frame2);
    return true;
  }
  close() {
    this.timer = null;
    const all2 = this.all.splice(0);
    const { shown, kept: kept3, keys } = splitBatch(all2, BACKLOG_KEEP, this.has);
    const got = shown.sort((a, b) => at(a) < at(b) ? -1 : at(a) > at(b) ? 1 : 0);
    const count = kept3.length;
    const expected = this.pending;
    const direct = this.direct;
    this.direct = 0;
    this.pending = 0;
    const emit2 = this.flush;
    this.flush = null;
    if (!got.length || !emit2) return;
    const bodies = [
      ...caseCountLines(got),
      ...got.filter((f) => addressedToMine(f)).map((f) => {
        const t = frameToText(f, JSON.stringify(f));
        return [...t].length > BODY_CAP ? [...t].slice(0, BODY_CAP).join("") + "…" : t;
      })
    ];
    const head = words(BACKLOG).head(count, expected, got.length, direct);
    emit2({
      kind: "backlog",
      frames: got,
      marks: keys,
      pending: expected,
      text: `${head}

${bodies.join("\n\n")}`
    });
  }
};

// js/bridge/doorfiles.ts
import { lstatSync as lstatSync2, renameSync as renameSync8, unlinkSync as unlinkSync7, writeFileSync as writeFileSync9 } from "node:fs";
function stampOf(path) {
  try {
    const s2 = lstatSync2(path, { bigint: true });
    return `${s2.dev}:${s2.ino}:${s2.birthtimeNs}`;
  } catch {
    return null;
  }
}
function writeOwned(path, content) {
  const tmp = `${path}.${process.pid}.tmp`;
  writeFileSync9(tmp, content, { mode: 384 });
  try {
    renameSync8(tmp, path);
  } catch (e) {
    try {
      unlinkSync7(tmp);
    } catch {
    }
    throw e;
  }
  return stampOf(path);
}
function unlinkOwned(path, stamp) {
  if (!stamp || stampOf(path) !== stamp) return;
  try {
    unlinkSync7(path);
  } catch {
  }
}
function closeServerKeeping(path, stamp, close) {
  const now2 = stampOf(path);
  if (!now2 || now2 === stamp) {
    close();
    unlinkOwned(path, stamp);
    return;
  }
  const aside = `${path}.${process.pid}.aside`;
  try {
    renameSync8(path, aside);
  } catch {
    close();
    return;
  }
  try {
    close();
  } finally {
    try {
      renameSync8(aside, path);
    } catch {
    }
  }
}

// js/bridge/fanout.ts
import { statSync as statSync2 } from "node:fs";
var lastRead = /* @__PURE__ */ new Map();
function givenIds(seenPath) {
  let stamp;
  try {
    const st = statSync2(seenPath);
    stamp = `${st.ino}:${st.size}:${st.mtimeMs}`;
  } catch {
    lastRead.delete(seenPath);
    return /* @__PURE__ */ new Set();
  }
  const hit = lastRead.get(seenPath);
  if (hit?.stamp === stamp) return hit.ids;
  const ids = seenIds(seenPath);
  lastRead.set(seenPath, { stamp, ids });
  return ids;
}
function isDelivered(keys, seen, seenPath) {
  if (!keys.length) return false;
  if (keys.some((k) => seen.has(k))) return true;
  const given = givenIds(seenPath);
  return keys.some((k) => given.has(k));
}
var marksOf = (seen, seenPath) => (k) => isDelivered([k], seen, seenPath);
function redundantEvent(frame2, d) {
  const ev = frame2?.type === "message" ? eventKeyOf(frame2) : "";
  if (!ev || !frame2) return "";
  if (eventIn(frame2, marksOf(d.seen, d.seenPath))) return ev;
  if (d.ring.some((r) => sameCopy(r.frame, frame2))) return ev;
  if (frame2.stale === true) return d.stale.holdsCopy(frame2) ? ev : "";
  d.stale.dropCopies(frame2);
  return "";
}
function redundantCopy(frame2, d) {
  const ev = redundantEvent(frame2, d);
  const id = frame2?.id;
  if (ev)
    log(`frame ${typeof id === "string" ? id : "?"} carries ${ev} already offered — not raised`);
  return !!ev;
}

// js/bridge/holdrecord.ts
import { mkdirSync as mkdirSync7, readdirSync as readdirSync2, readFileSync as readFileSync12, unlinkSync as unlinkSync8, writeFileSync as writeFileSync10 } from "node:fs";
import { dirname as dirname4, join as join10 } from "node:path";
var holdFilePathFor = (key2) => holdFilePathOf(CFG.authDir, key2);
function keyOf(realm, karta, name2) {
  return `${name2 || "_"}--${karta}--${realm}`.replace(/[^A-Za-z0-9._-]+/g, "_").slice(0, 120);
}
function formerKeysIn(rec5, key2 = "") {
  const f = rec5?.formerKey;
  const all2 = Array.isArray(f) ? f : f ? [f] : [];
  return [...new Set(all2.filter((k) => typeof k === "string" && k && k !== key2))];
}
var HOLD_RECORD_MAX_AGE_MS = 6 * 60 * 60 * 1e3;
var eraOf = (r) => r.stoodAt ?? r.at ?? 0;
var S2 = scoped(() => /* @__PURE__ */ new Map());
function noteStoodAt(key2, at3) {
  if (typeof at3 === "number") S2.set(key2, at3);
}
var H = scoped(() => ({ session: null }));
function noteHarnessSession(id) {
  if (id) H.session = id;
}
var sessionOfBridge = () => H.session;
function onDisk(key2) {
  try {
    return JSON.parse(readFileSync12(holdFilePathFor(key2), "utf8"));
  } catch {
    return null;
  }
}
var B = scoped(() => /* @__PURE__ */ new Map());
function noteSeatBase(key2, base) {
  B.set(key2, base);
  if (CFG.satellite) return;
  try {
    const path = baseFilePathOf(CFG.authDir, key2);
    mkdirSync7(dirname4(path), { recursive: true, mode: 448 });
    writeFileSync10(path, base + "\n", { mode: 384 });
  } catch (e) {
    log(`seat base not written: ${e.message}`);
  }
}
var baseOnDisk = (key2) => {
  try {
    return readFileSync12(baseFilePathOf(CFG.authDir, key2), "utf8").trim() || null;
  } catch {
    return null;
  }
};
function seatBaseOf(key2) {
  const known2 = B.get(key2);
  if (known2) return known2;
  const base = readHoldRecord(key2, true)?.base ?? baseOnDisk(key2);
  if (base) B.set(key2, base);
  return base ?? null;
}
function writeHoldRecord(key2, rec5, paused = false, at3 = Date.now()) {
  if (CFG.satellite && !paused) return;
  try {
    const was = onDisk(key2);
    const session = H.session ?? rec5.session ?? (was?.url === rec5.url ? was.session : void 0);
    const left2 = rec5.left ?? was?.left === true;
    writeOwned(
      holdFilePathFor(key2),
      JSON.stringify({
        ...rec5,
        session: session ?? void 0,
        left: left2 || void 0,
        provisional: rec5.provisional ?? (was?.url === rec5.url && was.session === session ? was.provisional : void 0),
        base: B.get(key2) ?? rec5.base ?? was?.base ?? baseOnDisk(key2) ?? void 0,
        stoodAt: S2.get(key2) ?? rec5.stoodAt ?? was?.stoodAt,
        formerKey: rec5.formerKey ?? was?.formerKey,
        at: at3
      }) + "\n"
    );
  } catch (e) {
    log(`hold record not written: ${e.message}`);
  }
}
function restoreHoldRecord(key2, rec5) {
  if (CFG.satellite) return;
  try {
    writeOwned(holdFilePathFor(key2), JSON.stringify(rec5) + "\n");
  } catch (e) {
    log(`hold record not restored: ${e.message}`);
  }
}
function markLeft(key2, on) {
  const r = readHoldRecord(key2);
  if (r && r.left === true !== on) writeHoldRecord(key2, { ...r, left: on });
}
function readHoldRecord(key2, anyAge = false) {
  try {
    const r = JSON.parse(readFileSync12(holdFilePathFor(key2), "utf8"));
    if (!r || typeof r.url !== "string" || !r.realm || r.karta == null) return null;
    if (anyAge) return r;
    if (typeof r.at !== "number" || Date.now() - r.at > HOLD_RECORD_MAX_AGE_MS) {
      dropHoldRecord(key2);
      return null;
    }
    return r;
  } catch {
    return null;
  }
}
function formerKeysOf(key2) {
  return formerKeysIn(readHoldRecord(key2, true), key2);
}
var holdRecordsNamed = (name2) => holdRecordsWhere((r) => r.name === name2);
function holdRecordsWhere(keep) {
  const dir2 = dirname4(holdFilePathFor("_"));
  try {
    return readdirSync2(dir2).filter((f) => f.endsWith(".hold")).map((f) => {
      try {
        return JSON.parse(readFileSync12(join10(dir2, f), "utf8"));
      } catch {
        return null;
      }
    }).filter((r) => !!r && r.karta != null && keep(r));
  } catch {
    return [];
  }
}
function dropOwnHoldRecord(key2, url) {
  const r = readHoldRecord(key2, true);
  if (!r || !url || r.url === url) dropHoldRecord(key2);
}
function dropHoldRecord(key2) {
  try {
    unlinkSync8(holdFilePathFor(key2));
  } catch {
  }
}

// js/bridge/humanwords.ts
var HUMAN_WORDS_KEEP = 200;
var rec3 = (v) => v && typeof v === "object" ? v : {};
var idOf3 = (v) => typeof v === "number" || typeof v === "string" && v ? String(v) : "";
var entryOf = (frame2) => {
  const f = rec3(frame2);
  return idOf3(rec3(f.line).entry_id ?? f.entry_id);
};
var caseOf2 = (frame2) => {
  const room = rec3(rec3(frame2).room);
  return idOf3(room.id) || idOf3(room.seq);
};
var wordKey = (frame2, entry) => entry ? numberedKey(frame2, `${caseOf2(frame2)}|${entry}`) : "";
var isWordOf = (held2, body, word3) => !!word3 && wordKey(held2, entryOf(held2)) === wordKey(body, word3);
var HumanWords = class {
  words = /* @__PURE__ */ new Set();
  /** A human word in flight — by its own entry. */
  remember(said2) {
    const key2 = wordKey(said2, entryOf(said2));
    if (!key2) return;
    this.words.add(key2);
    const oldest = this.words.values().next();
    if (this.words.size > HUMAN_WORDS_KEEP && !oldest.done) this.words.delete(oldest.value);
  }
  /** true — the body carries a human word in flight (word — its entry in the body's case); forgotten. */
  forget(body, word3) {
    const key2 = wordKey(body, word3);
    return !!key2 && this.words.delete(key2);
  }
};

// js/bridge/roomstack.ts
var ROOM_BATCH_MS = Number(process.env[envName("BRIDGE_ROOM_BATCH_MS")]) || 6e4;
var ROOM_BATCH_CAP = 20;
var rec4 = (v) => v && typeof v === "object" ? v : {};
var RoomBatch = class {
  held = [];
  timer = null;
  emit = null;
  add(raw, frame2, emit2) {
    this.emit = emit2;
    this.held.push({ raw, frame: frame2 });
    if (this.held.length >= ROOM_BATCH_CAP) return this.flushNow();
    this.timer ??= setTimeout(() => this.flushNow(), ROOM_BATCH_MS).unref();
  }
  /** Human words in flight: their body is the human's word, not a batch frame. */
  humanWords = new HumanWords();
  /** Take a word in flight out of the pending batch once its body came. */
  dropWord(body, word3, dropped) {
    for (let i = this.held.length - 1; i >= 0; i--) {
      if (!isWordOf(this.held[i].frame, body, word3)) continue;
      dropped(this.held[i].frame);
      this.held.splice(i, 1);
    }
    if (!this.held.length && this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
  /** The frames the batch holds (pulse.ts pending). */
  get frames() {
    return this.held.map((h) => h.frame);
  }
  /** A batched frame is not handed out separately by the ring (door.ts). */
  holds(frame2) {
    return !!frame2 && this.held.some((h) => h.frame === frame2);
  }
  /** Flush now; `carrier` — the interrupting frame that follows as text (seen.ts splitBatch). */
  flushNow(carrier) {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    const got = this.held.splice(0);
    const emit2 = this.emit;
    if (!got.length || !emit2) return;
    const unit = [...got.map((h) => h.frame), ...carrier ? [carrier] : []];
    const kept3 = new Set(splitBatch(unit, Infinity, this.has).kept);
    const out7 = got.filter((h) => kept3.has(h.frame));
    if (out7.length) emitBatch(out7, emit2);
  }
  /** On the owner's stop: the pending batch is not given (#7439). */
  drop() {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    this.emit = null;
    return this.held.splice(0).length;
  }
  /** The seat's marks: an event already in the turn is not repeated (seen.ts eventIn). */
  has;
  constructor(has) {
    this.has = has;
  }
};
function emitBatch(got, emit2) {
  const of = got.length;
  const frames = got.map((h) => h.frame);
  const fold = foldAsides(frames);
  emit2({ kind: "note", text: batchHead(frames), batch: { at: 0, of } });
  got.forEach(
    (h, i) => emit2({
      kind: "frame",
      raw: h.raw,
      frame: h.frame,
      batch: {
        at: i + 1,
        of,
        ...fold[i] === null ? { folded: true } : roomKind(h.frame)?.aside ? { fold: fold[i] ?? 1 } : {}
      }
    })
  );
}
function countOnly(frame2) {
  return frame2?.type === "message" && !!byKind(frame2) && !addressedToMine(frame2);
}
function noteRoomKind(frame2) {
  const rk = roomKind(frame2);
  if (rk && !rk.known)
    log(`room frame ${String(frame2.id ?? "?")}: ${rk.words} — batched, not interrupting`);
}
function batchForWatchdogs(d, raw, frame2, emit2) {
  const rk = roomKind(frame2);
  const f = rec4(frame2);
  let human = (frame2.origin ?? classifyOrigin(frame2)) === "human" && !askFromPerson(frame2);
  if (rk?.kind === "said" && rk.phase === "pending" && human)
    d.roomBatch.humanWords.remember(frame2);
  if (rk?.kind === "body") {
    const word3 = idOf3(rec4(f.line).refers_to ?? f.in_reply_to);
    if (d.roomBatch.humanWords.forget(frame2, word3) && rk.phase !== "aborted") {
      human = true;
      frame2.origin = "human";
      d.roomBatch.dropWord(frame2, word3, (said2) => {
        for (const k of deliveryKeys(said2)) noteSeen(d.seenPath, k, d.seen);
      });
    }
  }
  if ((!human || rk?.phase || rk?.aside) && byKind(frame2) && (!addressedToMine(frame2) || stackOf(frame2) === "batch")) {
    d.roomBatch.add(raw, frame2, emit2);
    return true;
  }
  d.roomBatch.flushNow(frame2);
  return false;
}

// js/shared/stalebatch.ts
var STALE_BURST_KEEP = 20;
var BODY_CAP2 = 800;
function staleBatch(all2, has) {
  const { shown: frames, kept: kept3, keys } = splitBatch(all2, STALE_BURST_KEEP, has);
  const count = kept3.length;
  if (!count) return { text: "", keys };
  const bodies = [
    ...caseCountLines(frames),
    ...frames.filter((f) => addressedToMine(f)).map((f) => {
      const t = frameToText(f, JSON.stringify(f));
      return [...t].length > BODY_CAP2 ? [...t].slice(0, BODY_CAP2).join("") + "…" : t;
    })
  ];
  const head = words(STALE).head(count, frames.length);
  return { text: `${head}

${bodies.join("\n\n")}`, keys };
}

// js/bridge/stale.ts
var STALE_BURST_MS = 1500;
var StaleBurst = class {
  /** Every frame of the window; the batch shows the first STALE_BURST_KEEP, all are marked given (#5831). */
  burst = [];
  timer = null;
  /** The seat's marks: an event already in play is not repeated (seen.ts eventIn). */
  has;
  constructor(has) {
    this.has = has;
  }
  /** Add a stale frame; when the window ends `flush` gets one event. A repeated id is not a second frame. */
  note(frame2, flush) {
    const id = typeof frame2.id === "string" ? frame2.id : "";
    if (!id || !this.burst.some((f) => f.id === id)) this.burst.push(frame2);
    if (this.timer) return;
    this.timer = setTimeout(() => {
      this.timer = null;
      const all2 = this.burst.splice(0);
      if (!all2.length) return;
      const { text: text2, keys } = staleBatch(all2, this.has);
      if (!text2) return;
      flush({ kind: "stale", frames: all2, marks: keys, text: text2 });
    }, STALE_BURST_MS).unref();
  }
  /** The frames the window holds (pulse.ts pending). */
  get frames() {
    return this.burst;
  }
  /** Whether the pending batch holds a copy of this event of the same kind (fanout.ts). */
  holdsCopy(frame2) {
    return this.burst.some((f) => sameCopy(f, frame2));
  }
  /** Take stale copies of the same kind out of the batch — the live one wakes, the batch does not (fanout.ts). */
  dropCopies(frame2) {
    for (let i = this.burst.length - 1; i >= 0; i--)
      if (sameCopy(this.burst[i], frame2)) this.burst.splice(i, 1);
  }
  /** Forget the accumulated batch when the standing is released. */
  drop() {
    this.burst.length = 0;
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
  }
};

// js/bridge/sweep.ts
import { existsSync, readdirSync as readdirSync3, readFileSync as readFileSync13, statSync as statSync3, unlinkSync as unlinkSync9 } from "node:fs";
import { connect as connectLocal } from "node:net";
import { basename as basename3, join as join11 } from "node:path";
function localSocketAlive(sock) {
  return new Promise((resolve11) => {
    if (process.platform !== "win32" && !existsSync(sock)) return resolve11(false);
    const probe2 = connectLocal(sock);
    const done = (v) => {
      probe2.destroy();
      resolve11(v);
    };
    probe2.once("connect", () => done(true));
    probe2.once("error", () => done(false));
    probe2.setTimeout(1e3, () => done(false));
  });
}
var SEEN_FILE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1e3;
function sweepStale(authDir, mine) {
  const dir2 = standingsDirOf(authDir);
  if (!existsSync(dir2)) return;
  const mineHash = basename3(seenFilePathOf(authDir, mine), ".seen");
  for (const f of readdirSync3(dir2).filter((x) => x.endsWith(".seen"))) {
    const p = join11(dir2, f);
    const [keyHash, serverHash] = f.split(".");
    if (keyHash === mineHash || existsSync(join11(dir2, `${keyHash}.key`))) continue;
    try {
      if (serverHash === "seen" || Date.now() - statSync3(p).mtimeMs > SEEN_FILE_MAX_AGE_MS)
        unlinkSync9(p);
    } catch {
    }
  }
  for (const f of readdirSync3(dir2).filter((x) => x.endsWith(".asks"))) {
    const keyHash = f.split(".")[0];
    if (keyHash === mineHash || existsSync(join11(dir2, `${keyHash}.key`))) continue;
    if (existsSync(join11(dir2, `${basename3(f, ".asks")}.seen`))) continue;
    try {
      unlinkSync9(join11(dir2, f));
    } catch {
    }
  }
  for (const f of readdirSync3(dir2).filter((x) => x.endsWith(".hold"))) {
    if (existsSync(join11(dir2, `${basename3(f, ".hold")}.key`))) continue;
    try {
      const rec5 = JSON.parse(readFileSync13(join11(dir2, f), "utf8"));
      if (typeof rec5.at !== "number" || Date.now() - rec5.at > HOLD_RECORD_MAX_AGE_MS)
        unlinkSync9(join11(dir2, f));
    } catch {
      try {
        unlinkSync9(join11(dir2, f));
      } catch {
      }
    }
  }
  for (const f of readdirSync3(dir2).filter((x) => x.endsWith(".spool"))) {
    try {
      if (Date.now() - statSync3(join11(dir2, f)).mtimeMs > HOLD_RECORD_MAX_AGE_MS)
        unlinkSync9(join11(dir2, f));
    } catch {
    }
  }
  if (process.platform === "win32") return;
  for (const f of readdirSync3(dir2).filter((x) => x.endsWith(".key"))) {
    const keyFile = join11(dir2, f);
    let key2;
    try {
      key2 = readFileSync13(keyFile, "utf8").trim();
    } catch {
      continue;
    }
    if (!key2 || key2 === mine) continue;
    const sock = socketPathOf(authDir, key2);
    const drop = () => {
      for (const p of [keyFile, sock, seenFilePathOf(authDir, key2)]) {
        try {
          unlinkSync9(p);
        } catch {
        }
      }
    };
    if (!existsSync(sock)) {
      drop();
      continue;
    }
    const probe2 = connectLocal(sock);
    probe2.once("connect", () => probe2.destroy());
    probe2.once("error", drop);
    probe2.setTimeout(1e3, () => probe2.destroy());
  }
}

// js/bridge/door.ts
var RING = 20;
var ENV_KEY = "env";
var Door = class {
  key;
  clients = /* @__PURE__ */ new Set();
  ring = [];
  /** Delivered frames — the same memory the exit watchdog reads (../shared/seen.ts). */
  seen;
  /** Since when no local client listens; null — someone listens. */
  idleAt = Date.now();
  /** The bridge's memory plus the .seen file written by whoever delivered the frame. */
  marks = (k) => marksOf(this.seen, this.seenPath)(k);
  /** Stale and wake batches are per seat (#5838). */
  stale = new StaleBurst(this.marks);
  backlog = new Backlog(this.marks);
  /** Room batch for watchdogs, not notification clients (roomstack.ts, #5851). */
  roomBatch = new RoomBatch(this.marks);
  /** Platform seat id (hello standings[].standing_id): a frame finds its door by it. */
  standingId = null;
  /** Seat address @handle:name — from hello, or derived from the main seat's handle for a seat beside. */
  address = null;
  /** address derived by the bridge, not named by hello. */
  addressDerived = false;
  /** Why the local socket did not come up; null — up or still coming up. */
  listenError = null;
  server = null;
  freshen = null;
  /** Stamps of the .key and .sock this door laid (doorfiles.ts): close removes only those. */
  stamps = { key: null, sock: null };
  hooks;
  // Captured from the opening session's scope: the door may be closed from another scope (daemon exit).
  authDir;
  serverUrl;
  /**
   * The seat's earlier keys (holdcanon.ts): an earlier build's watchdog, alive across the
   * daemon change, attaches by such a key's socket path. No .key file: a watchdog without
   * a key would read two seats.
   */
  aliases;
  aliasServers = [];
  constructor(key2, hooks) {
    this.key = key2;
    this.aliases = key2 === ENV_KEY ? [] : formerKeysOf(key2);
    this.hooks = {
      onAttach: bindScope(hooks.onAttach),
      lateEvent: bindScope(hooks.lateEvent),
      onError: bindScope(hooks.onError)
    };
    this.authDir = CFG.authDir;
    this.serverUrl = CFG.serverUrl;
    this.seen = seenIds(this.seenPath);
  }
  /** A seat keeps its delivered memory per server beyond the bridge; the "env" standing's memory dies with it. */
  get persistent() {
    return this.key !== ENV_KEY;
  }
  get seenPath() {
    return seenFilePathOf(this.authDir, this.key, this.persistent ? this.serverUrl : "");
  }
  get socketPath() {
    return socketPathOf(this.authDir, this.key);
  }
  /** The socket at the path is this door's, not one a successor laid over it. */
  get ownsSocket() {
    return !!this.stamps.sock && stampOf(this.socketPath) === this.stamps.sock;
  }
  push(raw, frame2) {
    this.ring.push({ raw, frame: frame2 });
    if (this.ring.length > RING) this.ring.shift();
  }
  broadcast(ev) {
    const line = JSON.stringify(ev) + "\n";
    for (const c of this.clients) {
      try {
        c.write(line);
      } catch {
        this.clients.delete(c);
      }
    }
  }
  open() {
    const path = this.socketPath;
    const key2 = this.key;
    const authDir = this.authDir;
    mkdirSync8(standingsDirOf(authDir), { recursive: true, mode: 448 });
    if (process.platform !== "win32" && dirname5(path) === shortSocketDir()) {
      const bad = privateDirProblem(dirname5(path));
      if (bad) {
        this.listenError = bad;
        this.hooks.onError(words(DOOR).privateDir(bad));
        return;
      }
    }
    sweepStale(authDir, key2);
    this.stamps = { key: writeOwned(keyFilePathOf(authDir, key2), key2 + "\n"), sock: null };
    if (process.platform !== "win32") {
      try {
        unlinkSync10(path);
      } catch {
      }
    }
    const gone = (sock) => {
      this.clients.delete(sock);
      if (this.clients.size === 0) this.idleAt = Date.now();
    };
    const onClient = bindScope((sock) => {
      this.clients.add(sock);
      this.idleAt = null;
      sock.on("close", () => gone(sock));
      sock.on("error", () => gone(sock));
      this.hooks.onAttach();
      const folded = foldedTacts(this.ring.map((r) => r.frame));
      for (const f of folded) if (f.id) noteSeen(this.seenPath, String(f.id), this.seen);
      const waiting2 = this.ring.filter(
        ({ frame: frame2 }) => frame2?.type !== "message" || !folded.has(frame2) && !this.marks(String(frame2.id ?? "")) && !this.roomBatch.holds(frame2)
      );
      const msgs = waiting2.flatMap(({ frame: frame2 }) => frame2?.type === "message" ? [frame2] : []);
      const kept3 = new Set(splitBatch(msgs, Infinity, this.marks).kept);
      const backlog = waiting2.filter(({ frame: frame2 }) => frame2?.type !== "message" || kept3.has(frame2));
      sock.write(
        JSON.stringify({
          kind: "attached",
          key: key2,
          buffered: backlog.length,
          seen: this.seenPath
        }) + "\n"
      );
      const counts = backlog.filter((h) => countOnly(h.frame));
      const put = (ev) => void sock.write(JSON.stringify(ev) + "\n");
      if (counts.length) emitBatch(counts, put);
      for (const { raw, frame: frame2 } of backlog) {
        if (!countOnly(frame2)) put({ kind: "frame", raw, frame: frame2 });
      }
      const late2 = this.hooks.lateEvent();
      if (late2) sock.write(JSON.stringify(late2) + "\n");
    });
    const srv = createServer3(onClient);
    srv.on("error", (e) => {
      this.listenError = e.message;
      this.hooks.onError(words(DOOR).listenFailed(e.message));
    });
    srv.listen(
      path,
      bindScope(() => {
        if (process.platform !== "win32") {
          try {
            chmodSync2(path, 384);
          } catch {
          }
        }
        this.stamps.sock = stampOf(path);
        log(`standing socket held; local listeners attach at ${path}`);
        if (dirname5(path) === shortSocketDir()) {
          const touch = () => {
            const now2 = /* @__PURE__ */ new Date();
            const mine = stampOf(path) === this.stamps.sock;
            for (const p of mine ? [dirname5(path), path] : [dirname5(path)])
              try {
                utimesSync(p, now2, now2);
              } catch {
              }
          };
          this.freshen = setInterval(touch, 6 * 36e5);
          this.freshen.unref?.();
        }
      })
    );
    this.server = srv;
    for (const alias of this.aliases) this.listenAlias(socketPathOf(authDir, alias), onClient);
  }
  /** One more path to the same door: an earlier key's socket, clients and ring shared. */
  listenAlias(path, onClient) {
    if (process.platform !== "win32") {
      if (dirname5(path) === shortSocketDir() && privateDirProblem(dirname5(path))) return;
      try {
        unlinkSync10(path);
      } catch {
      }
    }
    const a = { path, srv: createServer3(onClient), stamp: null };
    a.srv.on("error", (e) => log(`earlier key's door ${path} not up: ${e.message}`));
    a.srv.listen(
      path,
      bindScope(() => {
        if (process.platform !== "win32") {
          try {
            chmodSync2(path, 384);
          } catch {
          }
        }
        a.stamp = stampOf(path);
      })
    );
    this.aliasServers.push(a);
  }
  flushBatches() {
    this.backlog.flushNow();
    this.roomBatch.flushNow();
  }
  /** The owner's stop (stophold.ts): unsent batches are dropped, not flushed; how many frames. */
  dropBatches() {
    return this.backlog.drop() + this.roomBatch.drop();
  }
  /**
   * Close the door: clients, server, key and socket files. Idempotent. A seat's
   * delivered memory stays: a new bridge gets the same queue again (#5831); sweep.ts
   * removes old files by age.
   */
  close() {
    this.flushBatches();
    this.stale.drop();
    for (const c of this.clients) {
      try {
        c.end();
      } catch {
      }
    }
    this.clients.clear();
    if (this.freshen) clearInterval(this.freshen);
    const srv = this.server;
    this.server = null;
    const shut = () => {
      try {
        srv?.close();
      } catch {
      }
    };
    if (process.platform === "win32" || !this.stamps.sock) shut();
    else closeServerKeeping(this.socketPath, this.stamps.sock, shut);
    for (const a of this.aliasServers.splice(0)) {
      const end = () => {
        try {
          a.srv.close();
        } catch {
        }
      };
      if (process.platform === "win32" || !a.stamp) end();
      else closeServerKeeping(a.path, a.stamp, end);
    }
    unlinkOwned(keyFilePathOf(this.authDir, this.key), this.stamps.key);
    this.stamps = { key: null, sock: null };
    if (!this.persistent) {
      try {
        unlinkSync10(this.seenPath);
      } catch {
      }
    }
    this.ring.length = 0;
    this.idleAt = null;
  }
};

// js/bridge/holdstate.ts
var H2 = scoped(() => ({
  /** session dir the place is taken from (stand cwd), kept in the hold record for cwd resume (resume.ts) */
  standCwd: null,
  holder: null,
  /** last service sign of a socket released by parkStanding; the record lifetime counts from it (holdkeep.ts) */
  heardAt: 0,
  /** door of the primary place, the one the socket was taken for */
  door: null,
  currentKey: null,
  currentUrl: null,
  currentStatusUrl: null,
  /** key of the place taken from this bridge by close 4000 */
  evictedKey: null,
  /** told to a client attaching later */
  evictedEvent: null,
  /** left the place: service socket closed, key and addresses kept (leave.ts) */
  parked: false,
  /** socket reopened on the same address without this opening's hello yet: another may have rotated it (deaf.ts) */
  unheard: false,
  /** key of a place whose socket was released but binding remembered, until hello proves hearing (deaf.ts) */
  deafKey: null,
  /** places of other graphs on the channel at the 4001: the server remembers the binding, no hearing (deaf.ts) */
  deadPlaces: [],
  attachHooks: [],
  helloWaiters: /* @__PURE__ */ new Set(),
  /** disk resumes in flight: a dead token during one is a stale record, not an alarm */
  resuming: 0,
  /** a return from disk brings the seats beside back: the handover spool waits for them (#7602) */
  spoolHeld: 0,
  spoolLater: null,
  /** live frames of a seat beside not back yet, judged after the spool once the return ends */
  liveLater: [],
  /** own revoke in flight (absorb.ts): close 4001 outruns the revoke answer */
  revokingOwn: false,
  /** own channel close in flight (absorb.ts): close 4001 outruns the answer, as with revoke (#6634) */
  closingOwn: false,
  /** keys of seats beside whose own revoke is in flight (absorb.ts): standing_ended outruns the answer */
  revokingBeside: /* @__PURE__ */ new Set(),
  /** the daemon goes down while this session's thin bridge lives and restores the place (daemon.ts, #6485) */
  handingOver: null,
  /** the last owner's stop of this session (stophold.ts, #7439): `n` counts stops, a move compares it before and after */
  stopped: { n: 0, key: "", text: "" },
  /** a stand call in flight since this stop count (standundo.ts): a stop meanwhile — its connect answers are not held */
  moveSince: null,
  /** seats a stand call in flight took or bound again (connect, register answered): a stop meanwhile takes them off */
  taken: null
}));
function noteTaken(a) {
  if (!H2.taken || a.action !== "connect" && a.action !== "register") return;
  const seat2 = {
    realm: String(a.realm ?? ""),
    karta: String(a.karta ?? ""),
    name: String(a.name ?? "")
  };
  if (!H2.taken.some((s2) => s2.realm === seat2.realm && s2.karta === seat2.karta && s2.name === seat2.name))
    H2.taken.push(seat2);
}
var stoppedSince = (before, key2) => H2.stopped.n !== before && H2.stopped.key === key2 ? H2.stopped.text : null;
var stopsNow = () => H2.stopped.n;
var stoppedDuring = (before) => H2.stopped.n !== before ? H2.stopped.text : null;
var stoppedInMove = () => H2.moveSince !== null && stoppedDuring(H2.moveSince) !== null;
var E = {
  next: null,
  stop: null,
  order: null,
  pulse: null
};
function whenPulsed(fn) {
  E.pulse = fn;
}
function whenOrdered(fn) {
  E.order = fn;
}
function whenEvicted(fn) {
  E.next = fn;
}
function whenStopped(fn) {
  E.stop = fn;
}
function noteResuming(delta) {
  H2.resuming += delta;
}
async function withSpoolHeld(fn) {
  H2.spoolHeld++;
  try {
    return await fn();
  } finally {
    if (--H2.spoolHeld === 0) {
      const later2 = [...H2.spoolLater ? [H2.spoolLater] : [], ...H2.liveLater];
      Object.assign(H2, { spoolLater: null, liveLater: [] });
      for (const fn2 of later2) fn2();
    }
  }
}
function drainWhenFree(drain) {
  if (H2.spoolHeld > 0) H2.spoolLater = drain;
  else drain();
}
function liveWhenFree(judge) {
  if (H2.spoolHeld === 0) return false;
  H2.liveLater.push(judge);
  return true;
}
function setRevokingOwn(v) {
  H2.revokingOwn = v;
}
function setClosingOwn(v) {
  H2.closingOwn = v;
}
function setRevokingBeside(key2, v) {
  if (v) H2.revokingBeside.add(key2);
  else H2.revokingBeside.delete(key2);
}
var handingOver = null;
function beginHandover(why) {
  handingOver = why;
}
function beginSessionHandover(why) {
  H2.handingOver = why;
}
var handoverReason = () => handingOver ?? H2.handingOver;
var handoverUnderway = () => handoverReason() !== null;

// js/bridge/muxprobe.ts
import * as diagnostics2 from "node:diagnostics_channel";
var HEADERS = "undici:request:headers";
var watched = /* @__PURE__ */ new Set();
var answered = /* @__PURE__ */ new Map();
var listening = false;
function listen() {
  if (listening) return;
  listening = true;
  diagnostics2.subscribe?.(HEADERS, (m) => {
    const r = m;
    const at3 = `${String(r?.request?.origin ?? "")}${String(r?.request?.path ?? "")}`;
    if (watched.has(at3)) answered.set(at3, Number(r?.response?.statusCode));
  });
}
function watchAnswer(wsUrl) {
  const at3 = wsUrl.replace(/^ws/, "http");
  listen();
  answered.delete(at3);
  watched.add(at3);
  return () => {
    watched.delete(at3);
    const status = answered.get(at3);
    answered.delete(at3);
    return status;
  };
}
async function askAnswer(wsUrl) {
  try {
    const r = await fetch(wsUrl.replace(/^ws/, "http"), { signal: AbortSignal.timeout(5e3) });
    void r.body?.cancel().catch(() => {
    });
    return r.status;
  } catch {
    return void 0;
  }
}
async function verdictOf(wsUrl, e) {
  if (e.status === 404 || e.status === 405)
    return { none: true, why: `the upgrade answered ${e.status}` };
  const plain = e.status === void 0 && !e.timedOut ? await askAnswer(wsUrl) : void 0;
  if (plain === 404) return { none: true, why: "the plain GET answered 404" };
  const seen = [e.timedOut ? "timeout" : `refused (${e.code})`, e.status, plain && `GET ${plain}`];
  return { none: false, why: `not reached (${seen.filter(Boolean).join(", ")})` };
}
var muxUrlOf = (socketUrl) => `${apiBase(socketUrl).replace(/^http/, "ws")}/channel/mux`;
function pauseOf(n) {
  const step = FLAP_PAUSES_MS[Math.min(n, FLAP_PAUSES_MS.length - 1)] ?? 6e4;
  return Math.round(step * (0.8 + 0.2 * Math.random()));
}

// js/bridge/muxtick.ts
var GAP_MS = Number(process.env[envName("PULSE_GAP_MS")]) || 3e4;
function createTicker(send2) {
  const waiting2 = /* @__PURE__ */ new Map();
  const losts = /* @__PURE__ */ new Map();
  const receipts = /* @__PURE__ */ new Map();
  let lastAt2 = 0;
  let timer = null;
  const keyOf2 = (e) => `${e.channel_id}
${e.standing_id ?? ""}`;
  function schedule() {
    if (timer || !waiting2.size) return;
    timer = setTimeout(tact, Math.max(0, lastAt2 + GAP_MS - Date.now()));
    timer.unref?.();
  }
  function tact() {
    timer = null;
    if (!waiting2.size) return;
    const entries2 = [...waiting2.values()];
    lastAt2 = Date.now();
    if (send2({ type: "tick", entries: entries2 })) confirm(entries2);
    schedule();
  }
  const ofChannel = (channel2) => [...waiting2].filter(([, e]) => e.channel_id === channel2);
  const forget = (k) => void (waiting2.delete(k), losts.delete(k), receipts.delete(k));
  function confirm(entries2) {
    const at3 = Date.now();
    for (const e of entries2) {
      const k = keyOf2(e);
      const receipt = receipts.get(k);
      forget(k);
      try {
        receipt?.(at3);
      } catch {
      }
    }
  }
  const take3 = (channel2) => ofChannel(channel2).map(([k, e]) => {
    const lost = losts.get(k);
    forget(k);
    return [e, lost];
  });
  return {
    put(e, lost, pulseSent) {
      const k = keyOf2(e);
      waiting2.set(k, { ...waiting2.get(k), ...e });
      if (lost) losts.set(k, lost);
      if (e.pulse) {
        receipts.delete(k);
        if (pulseSent) receipts.set(k, pulseSent);
      }
      schedule();
    },
    flushChannel(channel2) {
      const mine = ofChannel(channel2);
      if (!mine.length) return;
      const entries2 = mine.map(([, e]) => e);
      if (send2({ type: "tick", entries: entries2 })) confirm(entries2);
    },
    drop: (channel2) => void take3(channel2),
    take: take3
  };
}

// js/bridge/muxsub.ts
var SEEN_MAX = 1e3;
var EVERY = /* @__PURE__ */ Symbol("every seat");
var kindOf2 = (e) => "status" in e.fields ? "status" : "usage";
function holdEarly(s2, e) {
  const covered = (x) => kindOf2(x) === kindOf2(e) && (typeof e.scope !== "string" || x.scope === e.scope);
  s2.early = s2.early.filter((x) => !covered(x)).concat(e);
}
function seatsFor(s2, scope) {
  if (typeof scope === "string") return [scope];
  if (scope === EVERY && s2.standings.length) return s2.standings;
  if (s2.standings.length === 1) return s2.standings;
  return s2.seats <= 1 && !s2.standings.length ? [null] : [];
}
var entryOf2 = (channel2, id, fields) => ({
  channel_id: channel2,
  ...id ? { standing_id: id } : {},
  ...fields
});
function newSub(secret, o) {
  return {
    secret,
    o,
    ref: null,
    channel: null,
    sub: null,
    live: false,
    closed: false,
    standings: [],
    seats: 0,
    resubscribed: false,
    helloAt: 0,
    handing: null,
    fallback: null,
    heardAt: 0,
    tries: 0,
    retry: null,
    seen: /* @__PURE__ */ new Set(),
    early: []
  };
}
function firstSeen(s2, id) {
  if (s2.seen.has(id)) return false;
  s2.seen.add(id);
  if (s2.seen.size > SEEN_MAX) s2.seen.delete(s2.seen.values().next().value);
  return true;
}
function deliver(s2, f) {
  s2.heardAt = Date.now();
  const id = typeof f.id === "string" ? f.id : "";
  if (!id || firstSeen(s2, id)) {
    const seat2 = asSeatFrame(f);
    if (s2.handing) s2.handing.onFrame(seat2.raw);
    else s2.o.onFrame(seat2.raw, seat2.frame);
  }
  return typeof f.seq === "number";
}
function earlyLines(s2, channel2) {
  return s2.early.splice(0).flatMap(
    ({ scope, fields, lost }) => seatsFor(s2, scope).map((id) => [entryOf2(channel2, id, fields), lost])
  );
}
function asSeatFrame(f) {
  const { channel_id: _c, sub: _s, seq: _q, ref: _r, ...rest2 } = f;
  return { raw: JSON.stringify(rest2), frame: rest2 };
}
function secretOf(url) {
  try {
    const m = /\/channel\/(?:ws|status)\/([^/?#]+)$/.exec(new URL(url).pathname);
    return m ? decodeURIComponent(m[1]) : null;
  } catch {
    return null;
  }
}

// js/bridge/muxends.ts
var DEAD_SECRET = /* @__PURE__ */ new Set(["secret_invalid", "secret_dead"]);
var REVOKED = 4004;
var EXPIRED = 4002;
function refusedBy(e, s2, code) {
  if (s2.closed) return e.end(s2);
  if (DEAD_SECRET.has(code)) return e.end(s2, () => s2.o.onDeadToken(4002));
  if (code === "limit_subscriptions") return e.toSocket(s2);
  log(`dispatcher: subscription refused (${code}) — again later`);
  e.again(s2);
}
function closedBy(e, s2, code, reason) {
  if (s2.closed) return e.end(s2);
  if (s2.handing) return e.end(s2, () => s2.handing?.onGone(code));
  if (code === 4e3) return e.end(s2, () => (s2.o.onEvicted ?? s2.o.onDeadToken)(code));
  if (code === REVOKED) return e.end(s2, () => s2.o.onStopped(code, reason));
  if (code === EXPIRED) {
    log(`dispatcher: ${s2.channel} expired — subscribed again`);
    return e.again(s2);
  }
  log(`dispatcher: ${s2.channel} closed with ${code} (${reason}) — a server defect`);
  if (code === 1e3) {
    const lived = s2.helloAt > 0 && Date.now() - s2.helloAt >= GAP_MS;
    if (s2.resubscribed && !lived) return e.end(s2, () => s2.o.onDeadToken(code));
    Object.assign(s2, { resubscribed: true, helloAt: 0 });
  }
  e.again(s2);
}

// js/bridge/muxframe.ts
function routeFrame(raw, r) {
  let f = null;
  try {
    f = JSON.parse(raw);
  } catch {
  }
  if (!f || typeof f !== "object") return log("dispatcher: a frame that is not JSON — dropped");
  const ref = typeof f.ref === "string" ? f.ref : "";
  if (ref && (f.type === "hello" || f.type === "error")) {
    const asked = r.byRef.get(ref);
    r.byRef.delete(ref);
    if (!asked) return log(`dispatcher: ${f.type} for an unknown ref ${ref}`);
    return f.type === "hello" ? r.hello(asked, f) : r.refused(asked, String(f.code ?? ""));
  }
  const channel2 = typeof f.channel_id === "string" ? f.channel_id : "";
  if (!channel2) return log(`dispatcher: a ${String(f.type)} frame without a channel — dropped`);
  if (f.type === "error") return log(`dispatcher: ${channel2} refused a frame: ${String(f.code)}`);
  const s2 = r.byChannel.get(channel2);
  if (f.type === "channel_closed")
    return s2 ? r.closed(s2, Number(f.code), String(f.reason ?? "")) : void 0;
  if (!s2 || s2.closed) return log(`dispatcher: a frame of ${channel2} held by no session`);
  r.frame(s2, f, channel2);
}

// js/bridge/muxattempt.ts
var CONNECT_MS = 1e4;
function attempt(url, h) {
  const answer2 = watchAnswer(url);
  const sock = new WebSocket(url);
  let over = false;
  let opened = false;
  let timedOut = false;
  const end = (code) => {
    if (over) return;
    over = true;
    clearTimeout(limit);
    const status = answer2();
    try {
      sock.close();
    } catch {
    }
    h.onEnd({ code, status, timedOut, opened });
  };
  const limit = setTimeout(() => (timedOut = true, end(1006)), CONNECT_MS);
  sock.addEventListener("open", () => {
    clearTimeout(limit);
    if (over) return;
    opened = true;
    answer2();
    h.onOpen();
  });
  sock.addEventListener("ping", () => !over && h.onPing());
  sock.addEventListener("message", (e) => {
    if (!over) h.onMessage(typeof e.data === "string" ? e.data : "");
  });
  sock.addEventListener("error", () => setTimeout(() => end(1006), 500));
  sock.addEventListener("close", (e) => end(e.code));
  return { sock, end };
}

// js/bridge/muxlife.ts
import * as diagnostics3 from "node:diagnostics_channel";
function watchSilence(current2, hung) {
  let lastLife = 0;
  let pingMs = 0;
  let seesPings = false;
  let lastTick = 0;
  let timer = null;
  const ping = () => {
    lastLife = Date.now();
    seesPings = true;
  };
  diagnostics3.subscribe?.(PING_CHANNEL, (m) => {
    const from = m?.websocket;
    const ws = current2();
    if (ws && (from === void 0 || from === ws)) ping();
  });
  const stop = () => {
    if (timer) clearInterval(timer);
    timer = null;
  };
  return {
    life: () => void (lastLife = Date.now()),
    ping,
    arm(ms2) {
      if (!(ms2 > 0) || timer && ms2 === pingMs) return;
      stop();
      pingMs = ms2;
      const every = Math.max(pingMs, 250);
      lastTick = Date.now();
      timer = setInterval(() => {
        const now2 = Date.now();
        if (now2 - lastTick > 2 * every + 1e3) lastLife = now2;
        lastTick = now2;
        if (!current2() || !seesPings) return;
        const silent = now2 - lastLife;
        if (silent <= Math.max(SILENT_INTERVALS * pingMs + 1e3, SILENT_FLOOR_MS)) return;
        stop();
        hung(Math.round(silent / 1e3), pingMs / 1e3);
      }, every);
      timer.unref?.();
    },
    stop
  };
}

// js/bridge/muxlink.ts
var IDLE_MS = 1e3;
function createLink(url, h) {
  let mode = "probing";
  let now2 = null;
  let open = false;
  let asking = false;
  let tries = 0;
  let retry = null;
  let idler = null;
  const silence = watchSilence(
    () => open ? now2?.sock ?? null : null,
    (silentS, pingS) => {
      h.onHung(words(CHANNEL).hung(silentS, pingS));
      now2?.end(1006);
    }
  );
  const later2 = () => {
    if (!h.wanted() || retry) return;
    retry = setTimeout(() => {
      retry = null;
      connect6();
    }, pauseOf(tries++));
  };
  function ended(a, e) {
    if (now2 !== a) return;
    now2 = null;
    silence.stop();
    if (e.opened) {
      open = false;
      h.onDrop(e.code);
      return later2();
    }
    asking = true;
    void verdictOf(url, e).then((v) => {
      asking = false;
      if (v.none) return fallBack(v.why);
      log(`dispatcher ${url}: ${v.why}`);
      later2();
    });
  }
  function fallBack(why) {
    mode = "fallback";
    log(`dispatcher ${url}: ${why} — a socket per seat until the daemon restarts`);
    h.onFallback(why);
  }
  function connect6() {
    if (idler) clearTimeout(idler);
    idler = null;
    if (mode === "fallback" || now2 || retry || asking) return;
    try {
      const a = attempt(url, {
        onOpen: () => {
          if (now2 !== a) return a.end(1e3);
          [open, mode] = [true, "mux"];
          silence.life();
          h.onOpen();
        },
        onPing: () => silence.ping(),
        onMessage: (raw) => {
          if (now2 !== a) return;
          silence.life();
          h.onMessage(raw);
        },
        onEnd: (e) => ended(a, e)
      });
      now2 = a;
    } catch (e) {
      fallBack(`not opened: ${e.message}`);
    }
  }
  function shut() {
    idler = null;
    if (h.wanted()) return;
    if (retry) clearTimeout(retry);
    retry = null;
    const [a, was] = [now2, open];
    [now2, open] = [null, false];
    silence.stop();
    a?.end(1e3);
    if (was) h.onDrop(1e3);
  }
  return {
    get open() {
      return open;
    },
    get mode() {
      return mode;
    },
    connect: connect6,
    send(frame2) {
      try {
        return !!(open && now2) && (now2.sock.send(JSON.stringify(frame2)), true);
      } catch {
        return false;
      }
    },
    proven(pingMs) {
      tries = 0;
      silence.arm(pingMs);
    },
    idle() {
      if (idler || h.wanted()) return;
      idler = setTimeout(shut, IDLE_MS);
      idler.unref?.();
    }
  };
}

// js/bridge/muxtable.ts
function createTable() {
  const subs = /* @__PURE__ */ new Set();
  const active = () => [...subs].filter((s2) => !s2.closed && !s2.fallback);
  return {
    subs,
    byRef: /* @__PURE__ */ new Map(),
    byChannel: /* @__PURE__ */ new Map(),
    onSockets: /* @__PURE__ */ new Set(),
    active,
    liveOf: (secret) => active().find((s2) => s2.live && s2.secret === secret) ?? null,
    heldOf: (secret) => active().find((s2) => s2.secret === secret) ?? null,
    async settled(ms2) {
      for (const until = Date.now() + ms2; Date.now() < until; ) {
        if (![...subs].some((s2) => s2.closed)) return;
        await new Promise((r) => setTimeout(r, 20));
      }
    }
  };
}

// js/bridge/muxroute.ts
function createMux(url, onSocket) {
  const table = createTable();
  const { subs, byRef, byChannel, onSockets, active } = table;
  let refs = 0;
  const link = createLink(url, {
    wanted: () => active().length > 0,
    onOpen: () => active().forEach(subscribe4),
    onMessage: (raw) => routeFrame(raw, routes),
    onDrop,
    onHung: (text2) => active().forEach((s2) => (s2.o.onHung ?? s2.o.onNote)?.(text2)),
    onFallback: () => [...subs].forEach(toSocket)
  });
  const ticker = createTicker((tick) => link.send(tick));
  function subscribe4(s2) {
    if (s2.retry) clearTimeout(s2.retry);
    s2.retry = null;
    if (s2.closed || s2.fallback) return;
    if (!link.open) return link.connect();
    s2.ref = `r${++refs}`;
    byRef.set(s2.ref, s2);
    link.send({ type: "subscribe", secret: s2.secret, ref: s2.ref });
  }
  function toSocket(s2) {
    subs.delete(s2);
    if (s2.handing) return end(s2, () => s2.handing?.onGone(0));
    onSockets.add(s2.secret);
    if (s2.closed) return;
    s2.fallback = holdSocket(s2.o);
    onSocket?.(s2);
  }
  function end(s2, word3) {
    Object.assign(s2, { closed: true, live: false });
    subs.delete(s2);
    if (s2.channel && byChannel.get(s2.channel) === s2) byChannel.delete(s2.channel);
    if (s2.retry) clearTimeout(s2.retry);
    if (s2.channel) ticker.drop(s2.channel);
    word3?.();
    s2.handing = null;
    if (!active().length) link.idle();
  }
  function holdBack(s2) {
    if (!s2.channel) return;
    const url2 = statusUrl(s2.o.url);
    for (const [{ standing_id: id, status, usage: usage2 }, lost] of ticker.take(s2.channel)) {
      if (typeof status === "string") holdEarly(s2, { url: url2, scope: id ?? null, fields: { status } });
      if (usage2) holdEarly(s2, { url: url2, scope: id ?? null, fields: { usage: usage2 }, lost });
    }
  }
  function again(s2) {
    s2.live = false;
    holdBack(s2);
    s2.o.onDropped?.();
    s2.retry = setTimeout(() => subscribe4(s2), pauseOf(s2.tries++));
  }
  function onDrop() {
    byRef.clear();
    byChannel.clear();
    for (const s2 of [...subs]) {
      if (s2.handing) end(s2, () => s2.handing?.onGone(1006));
      else if (s2.closed) subs.delete(s2);
      else {
        if (s2.live) s2.o.onDropped?.();
        Object.assign(s2, { live: false, ref: null });
        holdBack(s2);
      }
    }
  }
  function hello(s2, f) {
    const channel2 = String(f.channel_id);
    Object.assign(s2, { channel: channel2, sub: String(f.sub), heardAt: Date.now() });
    byChannel.set(channel2, s2);
    if (s2.closed) return void link.send({ type: "unsubscribe", channel_id: channel2 });
    const named2 = f.standings ?? [];
    const standings = named2.map((x) => x.standing_id ?? "").filter(Boolean);
    Object.assign(s2, { live: true, tries: 0, standings, seats: named2.length, helloAt: Date.now() });
    for (const [e, lost] of earlyLines(s2, channel2)) ticker.put(e, lost);
    link.proven(Number(f.ping_interval_seconds) * 1e3);
    const seat2 = asSeatFrame(f);
    s2.o.onFrame(seat2.raw, seat2.frame);
  }
  function frame2(s2, f, channel2) {
    if (deliver(s2, f)) link.send({ type: "ack", channel_id: channel2, sub: f.sub, seq: f.seq });
  }
  const ends = { end, again, toSocket };
  const refused = (s2, code) => refusedBy(ends, s2, code);
  const closed = (s2, code, why) => closedBy(ends, s2, code, why);
  const routes = { byRef, byChannel, hello, refused, closed, frame: frame2 };
  return {
    link,
    ticker,
    add(s2) {
      onSockets.delete(s2.secret);
      subs.add(s2);
      subscribe4(s2);
    },
    release(s2) {
      if (s2.closed) return;
      s2.closed = true;
      if (s2.live && s2.channel) {
        ticker.flushChannel(s2.channel);
        link.send({ type: "unsubscribe", channel_id: s2.channel });
      }
      if (!s2.live && !(s2.ref && byRef.has(s2.ref))) end(s2);
      else if (!active().length) link.idle();
    },
    liveOf: table.liveOf,
    heldOf: table.heldOf,
    settled: table.settled,
    carries: (secret) => link.mode !== "fallback" && !onSockets.has(secret)
  };
}

// js/bridge/muxhold.ts
var muxes = /* @__PURE__ */ new Map();
var replay = null;
var onFellBack = (fn) => void (replay = fn);
function fell(s2) {
  const held2 = s2.early.splice(0);
  for (const e of held2)
    if (typeof e.fields.status === "string") void replay?.(e.url, e.fields.status, e.scope);
  for (const e of held2) e.lost?.();
}
function muxOf(url) {
  let m = muxes.get(url);
  if (!m) muxes.set(url, m = createMux(url, fell));
  return m;
}
function pulseFrom(m, s2, text2, sent) {
  if (!s2.live || !s2.channel) return false;
  let f;
  try {
    f = JSON.parse(text2);
  } catch {
    return false;
  }
  if (f?.type !== "pulse") return false;
  const { type: _t, ...pulse } = f;
  m.ticker.put({ channel_id: s2.channel, pulse }, void 0, sent);
  return true;
}
function holdChannel(o) {
  const secret = secretOf(o.url);
  const m = secret ? muxOf(muxUrlOf(o.url)) : null;
  if (!secret || !m || m.link.mode === "fallback") return holdSocket(o);
  const s2 = newSub(secret, o);
  m.add(s2);
  return {
    close: (reason) => s2.fallback ? s2.fallback.close(reason) : m.release(s2),
    handOff(onFrame, onGone) {
      if (s2.fallback) return s2.fallback.handOff(onFrame, onGone);
      if (s2.live && !s2.closed) return void (s2.handing = { onFrame, onGone });
      m.release(s2);
      onGone(0);
    },
    send: (text2, sent) => s2.fallback ? s2.fallback.send(text2, sent) : pulseFrom(m, s2, text2, sent),
    get alive() {
      return s2.fallback ? s2.fallback.alive : !s2.closed;
    },
    get heardAt() {
      return s2.fallback ? s2.fallback.heardAt : s2.heardAt;
    }
  };
}
var at2 = (url) => {
  const secret = url ? secretOf(url) : null;
  const m = url && secret ? muxes.get(muxUrlOf(url)) : void 0;
  return m && secret ? { m, secret } : null;
};
function tickFor(url, scope, fields, lost) {
  const h = at2(url);
  const s2 = h?.m.heldOf(h.secret);
  if (!h || !s2 || !h.m.carries(h.secret)) return false;
  if (!s2.live || !s2.channel) return holdEarly(s2, { url: url ?? "", scope, fields, lost }), true;
  const seats2 = seatsFor(s2, scope);
  for (const id of seats2) h.m.ticker.put(entryOf2(s2.channel, id, fields), lost);
  return seats2.length > 0;
}
var onDispatcher = (url) => {
  const h = at2(url);
  return !!h && h.m.carries(h.secret);
};
function leavingLine(url) {
  if (!onDispatcher(url)) return "post";
  return liveOnDispatcher(url) && tickFor(url, EVERY, { status: "" }) ? "tick" : "none";
}
var liveOnDispatcher = (url) => {
  const h = at2(url);
  return !!h && h.m.carries(h.secret) && !!h.m.liveOf(h.secret);
};
var released = (ms2) => Promise.all([...muxes.values()].map((m) => m.settled(ms2)));

// js/bridge/realms.ts
var aliases = scoped(() => /* @__PURE__ */ new Map());
var R = scoped(() => ({ listing: null }));
var CANON_RE = /@[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+/;
var trimmed = (r) => String(r ?? "").trim();
function canonRealm(r) {
  const t = trimmed(r);
  if (t.startsWith("@")) return t;
  return aliases.get(t) ?? t;
}
var resolvedRealm = (r) => canonRealm(r).startsWith("@");
function realmRelation(a, b) {
  const x = trimmed(a);
  const y = trimmed(b);
  if (x && x === y) return "same";
  if (!resolvedRealm(x) || !resolvedRealm(y)) return "unknown";
  return canonRealm(x) === canonRealm(y) ? "same" : "other";
}
var sameRealm = (a, b) => realmRelation(a, b) === "same";
var otherRealm = (a, b) => !!trimmed(a) && !!trimmed(b) && realmRelation(a, b) === "other";
var unknownRealm = (a, b) => !!trimmed(a) && !!trimmed(b) && realmRelation(a, b) === "unknown";
var unresolvedWord = (realm, held2) => words(REALMS).unresolved(trimmed(realm), held2.join(", "));
function learnRealm(alias, canonical) {
  const t = trimmed(alias);
  if (t && !t.startsWith("@") && CANON_RE.test(canonical)) aliases.set(t, canonical);
}
var LIST_LINE_RE = /^ {4}(@[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+) {2}(r\d+) {2}.* · /;
function learnRealmList(text2) {
  const slugs = /* @__PURE__ */ new Map();
  for (const line of text2.split("\n")) {
    const m = LIST_LINE_RE.exec(line);
    if (!m) continue;
    const [, c, short2] = m;
    learnRealm(short2, c);
    const slug = c.replace(/^@[^/]+\//, "");
    slugs.set(slug, [.../* @__PURE__ */ new Set([...slugs.get(slug) ?? [], c])]);
  }
  for (const [slug, cs] of slugs) if (cs.length === 1) learnRealm(slug, cs[0]);
}
function apiRealm(r) {
  const c = canonRealm(r);
  return c.startsWith("@") ? c : /^r(\d+)$/i.exec(c)?.[1] ?? c;
}
var OWN_REALM = "mind";
async function canonicalRealm(r, list3) {
  const t = trimmed(r);
  if (!t || t.startsWith("@") || t === OWN_REALM) return t;
  await resolveRealms([t], list3);
  return canonRealm(t);
}
async function resolveRealms(names2, list3) {
  const open = names2.map(trimmed).filter((t) => t && !resolvedRealm(t));
  if (!open.length) return true;
  R.listing ??= list3().then(
    (text2) => {
      if (text2) learnRealmList(text2);
      return !!text2;
    },
    () => false
  ).finally(() => {
    R.listing = null;
  });
  return R.listing;
}

// js/bridge/places.ts
var extras = scoped(() => /* @__PURE__ */ new Map());
var keyOfPlace = (s2) => keyOf(s2.realm, s2.karta, s2.name ?? "");
var extraPlaces = () => [...extras.values()];
var extraIn = (realm) => extraPlaces().find((p) => sameRealm(p.standing.realm, realm));
function extraOf(realm, karta, name2) {
  const p = extraIn(realm);
  return p && String(p.standing.karta) === normKarta(karta) && (p.standing.name ?? "") === normName(name2) ? p : void 0;
}
function rememberPlace(s2) {
  state.places = state.places.filter((p) => !sameRealm(p.realm, s2.realm));
  state.places.push(s2);
}
function writeRecord(p, ch, status) {
  const s2 = p.standing;
  writeHoldRecord(p.door.key, {
    realm: s2.realm,
    karta: s2.karta,
    name: s2.name ?? "",
    url: ch.url,
    statusUrl: ch.statusUrl,
    status: status ?? readHoldRecord(p.door.key)?.status,
    cwd: ch.cwd ?? readHoldRecord(p.door.key)?.cwd,
    client: harnessName(),
    key: p.door.key
  });
}
function deriveAddress(p, primaryAddress) {
  const handle = primaryAddress?.match(/^(.*):/)?.[1];
  if (!handle || !p.standing.name) return;
  p.door.address = `${handle}:${p.standing.name}`;
  p.door.addressDerived = true;
}
function addExtra(s2, ch, hooks, primaryAddress = null) {
  const key2 = keyOfPlace(s2);
  const have = extras.get(key2);
  if (have) return key2;
  for (const p of extraPlaces())
    if (sameRealm(p.standing.realm, s2.realm))
      dropExtra(p.door.key, words(PLACES).anotherSeat(), true);
  const door = new Door(key2, hooks);
  const place = { standing: s2, door };
  deriveAddress(place, primaryAddress);
  door.open();
  extras.set(key2, place);
  writeRecord(place, ch);
  standingLog(`held ${key2} beside the channel`);
  const seat2 = { realm: s2.realm, karta: String(s2.karta), name: s2.name ?? "" };
  for (const k of [key2, ...formerKeysOf(key2)]) besideWord({ kind: "beside", key: k, place: seat2 });
  return key2;
}
var besideWord = (data) => emit({
  jsonrpc: "2.0",
  method: "notifications/message",
  params: { level: "info", logger: LOGGERS.channel, data }
});
function repointExtras(ch) {
  for (const p of extraPlaces()) writeRecord(p, ch);
}
function rememberExtraStatus(key2, ch, text2) {
  const p = extras.get(key2);
  if (p) writeRecord(p, ch, text2 || "");
}
function dropExtra(key2, reason, forget, as) {
  const p = extras.get(key2);
  if (!p) return;
  extras.delete(key2);
  const former = formerKeysOf(key2);
  const handover = !forget && !as ? handoverReason() : null;
  if (handover) {
    p.door.broadcast({ kind: "handover", key: key2, text: handover });
    p.door.close();
    return standingLog(`handed over ${key2} beside the channel: ${handover}`);
  }
  if (as === "own") {
    p.door.flushBatches();
    p.door.broadcast({ kind: "released", key: key2, text: reason, own: true });
  } else if (as === "beside")
    p.door.broadcast({ kind: "released", key: key2, text: reason, beside: true });
  p.door.close();
  if (forget) {
    dropHoldRecord(key2);
    state.places = state.places.filter((s2) => keyOfPlace(s2) !== key2);
  }
  standingLog(`released ${key2}: ${reason}${forget ? " (record dropped)" : ""}`);
  if (!handoverReason())
    for (const k of [key2, ...former]) besideWord({ kind: "beside-gone", key: k, text: reason });
}
function dropAllExtras(reason, forget, own = false) {
  for (const k of [...extras.keys()]) dropExtra(k, reason, forget, own ? "own" : void 0);
  if (forget) state.places = [];
}
var nameOfAddress = (a) => typeof a === "string" ? a.replace(/^.*:/, "") : "";
var all = (primary) => [...primary ? [primary] : [], ...extraPlaces()];
var unresolved = (realm) => !canonRealm(realm).startsWith("@");
function learnFromHello(hello, primary) {
  const listed = Array.isArray(hello?.standings) ? hello.standings : [];
  for (const p of all(primary)) {
    const same2 = listed.filter(
      (e2) => nameOfAddress(e2.standing) === (p.standing.name ?? "") && (e2.karta_seq == null || String(e2.karta_seq) === String(p.standing.karta))
    );
    const mine = same2.filter((e2) => sameRealm(e2.realm, p.standing.realm));
    const e = mine.length === 1 ? mine[0] : unresolved(p.standing.realm) && same2.length === 1 ? same2[0] : null;
    if (!e) continue;
    if (e.realm && unresolved(p.standing.realm)) learnRealm(p.standing.realm, e.realm);
    if (typeof e.standing_id === "string" && e.standing_id) p.door.standingId = e.standing_id;
    if (typeof e.standing === "string" && e.standing) {
      p.door.address = e.standing;
      p.door.addressDerived = false;
    }
  }
}
function fitsOf(frame2, places) {
  const id = typeof frame2.to_standing_id === "string" ? frame2.to_standing_id : "";
  const byId = id ? places.find((p) => p.door.standingId === id) : void 0;
  if (byId) return [byId];
  const to = nameOfAddress(frame2.to_standing);
  if (!id && !to && frame2.realm == null && frame2.karta_seq == null) return null;
  const fits = places.filter(
    (p) => (frame2.realm == null || sameRealm(frame2.realm, p.standing.realm)) && (!to || to === (p.standing.name ?? "")) && (frame2.karta_seq == null || String(frame2.karta_seq) === String(p.standing.karta))
  );
  if (fits.length === 1 && id && !fits[0].door.standingId) fits[0].door.standingId = id;
  return fits;
}
function strayOf(frame2, primary) {
  if (frame2?.type !== "message" || fitsOf(frame2, all(primary))?.length !== 0) return null;
  const back = state.places.find((s2) => frame2.realm != null && sameRealm(s2.realm, frame2.realm));
  return back ? keyOfPlace(back) : `${String(frame2.to_standing ?? "—")}, ${words(PLACES).graph()} ${String(frame2.realm ?? "—")}`;
}
function routeFrame2(frame2, primary) {
  if (!frame2 || !extras.size) return { door: primary.door };
  const fits = fitsOf(frame2, all(primary));
  if (!fits) return { door: primary.door };
  if (fits.length === 1) return { door: fits[0].door };
  const id = typeof frame2.to_standing_id === "string" ? frame2.to_standing_id : "";
  return {
    door: primary.door,
    note: words(PLACES).unmatched(
      String(frame2.id ?? "?"),
      id || "—",
      frame2.to_standing ?? "—",
      frame2.realm ?? "—",
      fits.length > 0,
      primary.door.key
    )
  };
}

// js/bridge/spool.ts
import { appendFileSync as appendFileSync4, mkdirSync as mkdirSync9, readFileSync as readFileSync14, unlinkSync as unlinkSync11 } from "node:fs";
import { dirname as dirname6 } from "node:path";
var HANDOFF_MS = Number(process.env[envName("BRIDGE_DAEMON_HANDOFF_MS")]) || 12e3;
var DRAIN_MS = HANDOFF_MS + 5e3;
var DRAIN_TICK_MS = 200;
var SPOOL_LIVE_MS = DRAIN_MS;
function append(path, entry) {
  try {
    appendFileSync4(path, JSON.stringify(entry) + "\n", { mode: 384 });
  } catch (e) {
    const id = entry.frame === void 0 ? "" : `, frame ${String(parseFrame(entry.frame)?.id ?? "?")}`;
    log(`handover spool not written (${path}${id}): ${e.message}`);
  }
}
function openSpool(path) {
  try {
    mkdirSync9(dirname6(path), { recursive: true, mode: 448 });
  } catch {
  }
  append(path, { open: Date.now() });
}
var spoolFrame = (path, raw) => append(path, { frame: raw, at: Date.now() });
var closeSpool = (path) => append(path, { done: Date.now() });
var draining = /* @__PURE__ */ new Set();
function parseFrame(raw) {
  try {
    const f = JSON.parse(raw);
    return f && typeof f === "object" ? f : null;
  } catch {
    return null;
  }
}
function entries(path) {
  let text2;
  try {
    text2 = readFileSync14(path, "utf8");
  } catch {
    return null;
  }
  return text2.slice(0, text2.lastIndexOf("\n") + 1).split("\n").filter(Boolean).map((line) => {
    try {
      return JSON.parse(line);
    } catch {
      return {};
    }
  });
}
function aged(raw, at3) {
  const frame2 = parseFrame(raw);
  if (Date.now() - at3 <= SPOOL_LIVE_MS || frame2?.type !== "message") return [raw, frame2];
  const stale = { ...frame2, stale: true };
  return [JSON.stringify(stale), stale];
}
function drainSpool(path, feed) {
  if (draining.has(path)) return;
  const give = bindScope((raw, at3) => feed(...aged(raw, at3)));
  const until = Date.now() + DRAIN_MS;
  let taken2 = 0;
  let openedAt = 0;
  const tick = () => {
    const all2 = entries(path);
    if (!all2) return void draining.delete(path);
    const fresh2 = [];
    for (const e of all2.slice(taken2)) {
      if (e.open) openedAt = e.open;
      if (typeof e.frame === "string") fresh2.push([e.frame, e.at ?? openedAt]);
    }
    if (fresh2.length) log(`handover spool: ${fresh2.length} frame(s) of the outgoing daemon`);
    for (const [raw, at3] of fresh2) give(raw, at3);
    taken2 = all2.length;
    const opened = all2.filter((e) => e.open).length;
    const done = all2.filter((e) => e.done).length;
    if (done < opened && Date.now() < until) {
      setTimeout(tick, DRAIN_TICK_MS).unref?.();
      return;
    }
    draining.delete(path);
    try {
      unlinkSync11(path);
    } catch {
    }
  };
  draining.add(path);
  tick();
}

// js/bridge/statusturn.ts
var tails = /* @__PURE__ */ new Map();
function inTurn(url, fn, open = false) {
  const prev = tails.get(url) ?? (open ? Promise.resolve() : null);
  if (!prev) return fn();
  const next = prev.then(fn, fn);
  const tail2 = next.catch(() => {
  });
  tails.set(url, tail2);
  void tail2.then(() => {
    if (tails.get(url) === tail2) tails.delete(url);
  });
  return next;
}
function inTurnWithin(url, ms2, fn, late2) {
  const until = Date.now() + ms2;
  let timer;
  const expired = new Promise((resolve11) => {
    timer = setTimeout(() => resolve11(late2()), ms2);
    timer.unref?.();
  });
  return Promise.race([inTurn(url, () => fn(until)), expired]).finally(() => clearTimeout(timer));
}

// js/bridge/statuspost.ts
var TRIMMED = "trimmed_to_limit";
var LIMIT = 64;
var obj3 = (v) => v && typeof v === "object" ? v : {};
function trimToWord(text2, max) {
  const chars = [...text2];
  const head = chars.slice(0, max - 1).join("");
  const cut = chars[max - 1] === " " ? head.length : head.lastIndexOf(" ");
  return (cut > 0 ? head.slice(0, cut) : head).trimEnd() + "…";
}
function acceptedIn(body, sent) {
  let parsed = {};
  try {
    parsed = obj3(JSON.parse(body));
  } catch {
  }
  const warnings = Array.isArray(parsed.warnings) ? parsed.warnings : [];
  const w5 = obj3(warnings.find((x) => obj3(x).code === TRIMMED));
  const told = typeof parsed.doing === "string" ? parsed.doing : null;
  if (!w5.code) return told === null ? {} : { doing: told };
  const doing = told ?? trimToWord(sent, LIMIT);
  const message = typeof w5.message === "string" ? w5.message.trim() : "";
  return { doing, trimmed: { doing, message } };
}
function trimNudge(t) {
  if (t.message) return words(STATUS_POST).trimmedBy(t.message);
  return words(STATUS_POST).trimmed();
}
function byTick(url, text2, scope) {
  if (!tickFor(url, scope, { status: text2 })) return null;
  if ([...text2].length <= LIMIT) return { ok: true, body: "", doing: text2 };
  const doing = trimToWord(text2, LIMIT);
  return { ok: true, body: "", doing, trimmed: { doing, message: "" } };
}
async function publishStatusTo(url, text2, timeoutMs = 5e3, standingId = null) {
  const ticked = byTick(url, text2, standingId);
  if (ticked) return ticked;
  const w5 = words(STATUS_POST);
  if (onDispatcher(url))
    return { ok: false, body: liveOnDispatcher(url) ? w5.seatUnnamed() : w5.notSubscribed() };
  return inTurnWithin(
    url,
    timeoutMs,
    (until) => postStatus(url, text2, until, standingId),
    () => ({ ok: false, body: late() })
  );
}
var late = () => words(STATUS_POST).noAnswer(words(STATUS_POST).late());
async function postStatus(url, text2, until, standingId) {
  const left2 = until - Date.now();
  if (left2 <= 0) return { ok: false, body: late() };
  const signal = AbortSignal.timeout(left2);
  const post3 = () => fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(
      typeof standingId === "string" ? { text: text2, standing_id: standingId } : { text: text2 }
    ),
    signal
  });
  let res;
  try {
    res = await post3().catch((e) => {
      if (!closedUnder(e) || signal.aborted) throw e;
      return post3();
    });
  } catch (e) {
    return { ok: false, body: words(STATUS_POST).noAnswer(e.message) };
  }
  const body = (await res.text().catch(() => "")).trim();
  if (res.status === 404) return { ok: false, code: 404, body: words(STATUS_POST).gone(body) };
  if (!res.ok)
    return { ok: false, code: res.status, body: words(STATUS_POST).refused(res.status, body) };
  return { ok: true, body, ...acceptedIn(body, text2) };
}
onFellBack(
  (url, text2, standingId) => inTurn(url, () => postStatus(url, text2, Date.now() + 5e3, standingId), true).then((st) => {
    if (!st.ok) log(`busy line held for the dispatcher not posted: ${st.body}`);
  })
);

// js/bridge/handoff.ts
var pending = /* @__PURE__ */ new Set();
function keepUntilEvicted(holder, key2, statusUrl2) {
  const path = spoolFilePathOf(CFG.authDir, key2);
  const door = socketPathOf(CFG.authDir, key2);
  openSpool(path);
  let timer;
  let over = false;
  const done = new Promise((resolve11) => {
    const end = (why, after2) => {
      if (over) return;
      over = true;
      clearTimeout(timer);
      closeSpool(path);
      log(`place ${key2} handed over: ${why}`);
      void Promise.resolve(after2).then(() => resolve11());
    };
    timer = setTimeout(() => {
      const cleared = statusUrl2 ? clearBusy(key2, statusUrl2, door) : void 0;
      end(`no successor took the socket in ${HANDOFF_MS / 1e3}s — closed`, cleared);
      holder.close("the successor did not take the place");
    }, HANDOFF_MS);
    holder.handOff(
      (raw) => spoolFrame(path, raw),
      (code) => end(
        code === EVICTED_CODE ? "the successor took the socket (close 4000)" : `the socket closed (${code})`
      )
    );
  });
  pending.add(done);
}
async function clearBusy(key2, statusUrl2, door) {
  if (onDispatcher(statusUrl2))
    return log(`place ${key2}: busy line left — the dispatcher's channel`);
  if (await localSocketAlive(door)) {
    log(`place ${key2}: busy line left — the successor's door is up`);
    return;
  }
  const st = await publishStatusTo(statusUrl2, "", 3e3);
  log(`place ${key2}: ${st.ok ? "busy line cleared" : `busy line not cleared — ${st.body}`}`);
}
function letGo(holder, keepFor, reason, statusUrl2 = null) {
  if (holder && keepFor) return keepUntilEvicted(holder, keepFor, statusUrl2);
  if (holder?.alive) E.pulse?.("last", holder);
  holder?.close(reason);
}
function takeSpool(key2, primary, feed) {
  for (const k of [...formerKeysOf(key2), key2])
    drainSpool(spoolFilePathOf(CFG.authDir, k), (raw, frame2) => {
      const p = primary();
      if (!p || !sayStray(raw, frame2, p)) feed(raw, frame2);
    });
}
function sayStray(raw, frame2, p) {
  const to = strayOf(frame2, p);
  if (!to) return false;
  const text2 = words(HANDOFF).strayFrame(String(frame2?.id ?? "?"), to, p.door.key, raw);
  log(text2);
  const ev = { kind: "note", text: text2 };
  p.door.broadcast(ev);
  emit({
    jsonrpc: "2.0",
    method: "notifications/message",
    params: { level: "info", logger: LOGGERS.channel, data: ev }
  });
  return true;
}
function holdStray(raw, frame2, primary, feedAgain) {
  const p = primary();
  if (!p || !strayOf(frame2, p)) return false;
  return liveWhenFree(() => {
    const now2 = primary();
    if (now2 && !sayStray(raw, frame2, now2)) feedAgain();
  });
}
var handoffsSettled = () => Promise.all([...pending]).then(() => void 0);

// js/bridge/holdwords.ts
var holdWords = () => words(HOLD);
var deadWord = (code) => holdWords().dead(deadTokenAdvice(code));

// js/bridge/lifeseat.ts
function nameWarnedSeat(frame2, primary) {
  if (!frame2 || !isLifeCheck(frame2)) return;
  if (typeof frame2.to_standing === "string" && frame2.to_standing) return;
  const id = typeof frame2.to_standing_id === "string" ? frame2.to_standing_id : "";
  const seat2 = id ? [primary, ...extraPlaces()].find((p) => p.door.standingId === id) : void 0;
  if (seat2?.standing.name) frame2.to_standing = seat2.standing.name;
}
function routeNamed(frame2, primary) {
  nameWarnedSeat(frame2, primary);
  return routeFrame2(frame2, primary);
}

// js/bridge/seatorigin.ts
import { AsyncLocalStorage as AsyncLocalStorage2 } from "node:async_hooks";

// js/shared/serviceid.ts
var SERVICE_ID = `${ID_PREFIX}service-`;

// js/bridge/seatorigin.ts
var origin = new AsyncLocalStorage2();
var automaticSeat = () => origin.getStore() ?? true;
var withSeatOrigin = (automatic, work) => origin.run(automatic, work);
var withCallOrigin = (id, work) => withSeatOrigin(typeof id === "string" && id.startsWith(SERVICE_ID), work);

// js/bridge/seatproof.ts
function seatProof(key2) {
  const r = key2 ? readHoldRecord(key2, true) : null;
  if (!r) return {};
  return {
    key: key2 ?? void 0,
    place: { realm: r.realm, karta: String(r.karta), name: r.name },
    provisional: r.provisional === true && !!r.session && r.session === sessionOfBridge()
  };
}
var heldProof = (key2, place) => ({
  kind: "held",
  key: key2,
  ...place ? { place } : {},
  ...seatProof(key2),
  automatic: automaticSeat()
});

// js/bridge/hold.ts
function keyFor() {
  const s2 = state.standing;
  return s2 ? keyOf(s2.realm, s2.karta, s2.name ?? "") : ENV_KEY;
}
function noteStandCwd(cwd) {
  const prev = H2.standCwd;
  H2.standCwd = cwd;
  if (cwd && H2.currentKey && H2.currentUrl)
    rememberStatus(readHoldRecord(H2.currentKey)?.status ?? "");
  return prev;
}
var channel = () => H2.currentUrl ? { url: H2.currentUrl, statusUrl: H2.currentStatusUrl, cwd: H2.standCwd } : null;
function rememberStatus(text2, realm) {
  const s2 = state.standing;
  const ch = channel();
  if (!s2 || !H2.currentKey || !ch) return;
  const extra = realm ? extraIn(realm) : void 0;
  if (extra) return rememberExtraStatus(extra.door.key, ch, text2);
  writeHoldRecord(H2.currentKey, {
    realm: s2.realm,
    karta: s2.karta,
    name: s2.name ?? "",
    url: ch.url,
    statusUrl: H2.currentStatusUrl,
    status: text2 || void 0,
    cwd: H2.standCwd ?? readHoldRecord(H2.currentKey)?.cwd,
    client: harnessName(),
    key: H2.currentKey
  });
}
var holdsKey = (key2) => !!H2.holder?.alive && H2.currentKey === key2;
var ledKey = () => H2.currentKey;
var holdsChannel = () => !!H2.holder?.alive && !!H2.currentKey;
var localSocketPathOf = (key2) => socketPathOf(CFG.authDir, key2);
var doorHooks = {
  onAttach: () => {
    for (const fn of H2.attachHooks) fn();
  },
  lateEvent: () => H2.evictedKey ? H2.evictedEvent : null,
  onError: (text2) => {
    log(text2);
    notify("error", { kind: "note", text: text2 });
  }
};
var doors = () => [
  ...H2.door ? [H2.door] : [],
  ...extraPlaces().map((p) => p.door)
];
function isOwn(realm, karta, name2) {
  const s2 = state.standing;
  if (!H2.currentKey) return false;
  if (extraOf(realm, karta, name2)) return true;
  return !!s2 && (s2.realm === realm || sameRealm(s2.realm, realm)) && String(s2.karta) === String(karta) && (s2.name ?? "") === name2 && H2.currentKey === keyFor();
}
function holdsStanding(realm, karta, name2) {
  return !!H2.holder?.alive && !H2.unheard && isOwn(realm, karta, name2);
}
function wasEvicted(realm, karta, name2) {
  return !!H2.evictedKey && H2.evictedKey === H2.currentKey && isOwn(realm, karta, name2);
}
var hasStatusAddressFor = (realm, karta, name2) => !!H2.currentStatusUrl && !!H2.currentKey && isOwn(realm, karta, name2);
var heldPlaces = () => [
  ...H2.door && state.standing ? [{ key: H2.door.key, realm: state.standing.realm, primary: true }] : [],
  ...extraPlaces().map((p) => ({ key: p.door.key, realm: p.standing.realm, primary: false }))
];
var besideKeyIn = (realm) => extraIn(realm)?.door.key ?? null;
var isParked = (realm, karta, name2) => H2.parked && isOwn(realm, karta, name2);
function listenerIdleSince() {
  if (!H2.holder?.alive) return null;
  const ds = doors();
  if (!ds.length || ds.some((d) => d.clients.size > 0)) return null;
  return Math.max(...ds.map((d) => d.idleAt ?? 0));
}
function onListenerAttached(fn) {
  H2.attachHooks.push(fn);
}
var localListeners = () => doors().reduce((n, d) => n + d.clients.size, 0);
function awaitHello(timeoutMs) {
  const seen = H2.door?.ring.find((r) => r.frame?.type === "hello")?.frame ?? null;
  if (seen) return Promise.resolve(seen);
  return new Promise((resolve11) => {
    const done = (f) => {
      H2.helloWaiters.delete(done);
      resolve11(f);
    };
    H2.helloWaiters.add(done);
    setTimeout(() => done(null), timeoutMs).unref();
  });
}
var heldKey = (realm) => (realm ? besideKeyIn(realm) : null) ?? H2.currentKey;
function broadcast(ev) {
  for (const d of doors()) d.broadcast(ev);
}
function notify(level, data) {
  emit({
    jsonrpc: "2.0",
    method: "notifications/message",
    params: { level, logger: LOGGERS.channel, data }
  });
}
function addPlace(s2) {
  const ch = channel();
  const primary = state.standing;
  if (!H2.holder?.alive || !ch || !primary || !otherRealm(primary.realm, s2.realm)) return null;
  return addExtra(s2, ch, doorHooks, H2.door?.address ?? null);
}
var standingIdIn = (realm) => (extraIn(realm)?.door ?? H2.door)?.standingId ?? null;
function noteStandingId(realm, id) {
  const d = extraIn(realm)?.door ?? (state.standing && !otherRealm(realm, state.standing.realm) ? H2.door : null);
  if (d && id) d.standingId = id;
}
var held = () => H2.door && state.standing ? { standing: state.standing, door: H2.door } : null;
function releaseStanding(reason, forget = false, keepBeside = false, own = false, keepBusy = false) {
  if (forget && H2.currentKey) dropOwnHoldRecord(H2.currentKey, H2.currentUrl);
  if (!keepBeside) dropAllExtras(reason, forget, own);
  if (!H2.holder && !H2.door) return;
  H2.door?.flushBatches();
  const key2 = H2.currentKey ?? void 0;
  const handover = handoverReason();
  if (handover && !forget) {
    standingLog(`handed over ${H2.currentKey ?? "?"}: ${handover}`);
    broadcast({ kind: "handover", key: key2, text: handover });
  } else {
    standingLog(`released ${H2.currentKey ?? "?"}: ${reason}${forget ? " (record dropped)" : ""}`);
    const released2 = { kind: "released", key: key2, text: reason, ...own && { own } };
    broadcast(released2);
    notify("info", released2);
  }
  const busy = keepBusy ? null : H2.currentStatusUrl;
  letGo(H2.holder, handover && !forget ? key2 ?? null : null, reason, busy);
  H2.holder = null;
  for (const w5 of [...H2.helloWaiters]) w5(null);
  H2.door?.close();
  H2.door = null;
  Object.assign(H2, { parked: false, unheard: false, currentKey: null, currentUrl: null });
  Object.assign(H2, { currentStatusUrl: null, evictedKey: null, evictedEvent: null });
}
function holdStanding(url, statusUrl2) {
  const key2 = keyFor();
  if (url === H2.currentUrl && key2 === H2.currentKey && H2.holder?.alive) return key2;
  const same2 = !!H2.currentKey && H2.currentKey === key2;
  releaseStanding(holdWords().newSocket(), !!H2.currentKey && H2.currentKey !== key2, same2);
  const status = statusUrl2 || statusUrl(url);
  Object.assign(H2, { currentKey: key2, currentUrl: url, currentStatusUrl: status });
  H2.door = new Door(key2, doorHooks);
  H2.door.open();
  const s2 = state.standing;
  if (s2)
    writeHoldRecord(key2, {
      status: readHoldRecord(key2)?.status,
      realm: s2.realm,
      karta: s2.karta,
      name: s2.name ?? "",
      url,
      statusUrl: H2.currentStatusUrl,
      cwd: H2.standCwd ?? readHoldRecord(key2)?.cwd,
      client: harnessName(),
      key: key2,
      left: false
      // held again: the leave mark is cleared
    });
  const ch = channel();
  if (same2 && ch) repointExtras(ch);
  openHolder(url, key2);
  standingLog(`held ${key2}${H2.standCwd ? ` cwd=${H2.standCwd}` : ""}`);
  const place = s2 ? { realm: s2.realm, karta: String(s2.karta), name: s2.name ?? "" } : void 0;
  notify("info", heldProof(key2, place));
  return key2;
}
function parkStanding(reason) {
  if (!H2.holder?.alive || !H2.currentKey) return null;
  H2.heardAt = Math.max(H2.heardAt, H2.holder.heardAt);
  letGo(H2.holder, null, reason);
  H2.holder = null;
  Object.assign(H2, { parked: true, unheard: false });
  standingLog(`parked ${H2.currentKey}: ${reason}`);
  const text2 = holdWords().parked(reason);
  broadcast({ kind: "note", text: text2 });
  return H2.currentKey;
}
function expectHello() {
  H2.unheard = true;
  for (const d of doors())
    d.ring.splice(0, d.ring.length, ...d.ring.filter((r) => r.frame?.type !== "hello"));
}
function resumeStanding() {
  if (!H2.parked || !H2.currentUrl || !H2.currentKey) return false;
  H2.parked = false;
  expectHello();
  openHolder(H2.currentUrl, H2.currentKey);
  standingLog(`resumed ${H2.currentKey}: socket reopened on the same address`);
  return true;
}
function deliverTo(d, raw, frame2, full) {
  const seenPath = d.seenPath;
  const id = full?.type === "message" && typeof full.id === "string" ? full.id : "";
  if (redundantCopy(full, d)) return;
  if (full?.type === "message") markAddressed(full, seenPath, d.seen);
  const again = isDelivered(id ? [id] : [], d.seen, seenPath);
  if (full?.type === "message" && full.stale === true && !isDirectWord(full) && !isLifeCheck(full))
    return again ? log(`stale frame ${id} already delivered — dropped`) : d.stale.note(full, (ev2) => {
      if (notifiedClient()) for (const k of ev2.marks ?? []) noteSeen(seenPath, k, d.seen);
      d.broadcast(ev2);
      notify("info", keyed(d, ev2));
    });
  const text2 = full === frame2 && full?.addressed === void 0 ? raw : JSON.stringify(full);
  const hello = full?.type === "hello";
  for (const x of hello ? doors() : [d]) x.push(text2, full);
  if (hello) Object.assign(H2, { unheard: false, deafKey: null });
  if (hello) for (const w5 of [...H2.helloWaiters]) w5(full);
  const ev = { kind: "frame", raw: text2, frame: full };
  const msg = full?.type === "message" && !again ? full : null;
  if (msg) noteRoomKind(msg);
  const toBatch = (b) => (d.broadcast(b), notify("info", keyed(d, b)));
  if (msg && !notifiedClient() && batchForWatchdogs(d, text2, msg, toBatch)) return;
  if (!again) for (const x of hello ? doors() : [d]) x.broadcast(ev);
  if (full?.type === "status") return;
  if (again) return log(`frame ${id} came again — already delivered, not raised`);
  if (notifiedClient()) {
    const flushBacklog = (b) => {
      for (const k of b.marks ?? []) noteSeen(seenPath, k, d.seen);
      notify("info", keyed(d, b));
    };
    if (hello && Number(full.pending) > 0) d.backlog.open(Number(full.pending), flushBacklog);
    if (full?.type === "message") {
      if (full.origin === "platform" && !isLifeCheck(full)) d.backlog.open(0, flushBacklog);
      if (d.backlog.note(full)) return;
    }
    for (const k of deliveryKeys(full)) noteSeen(seenPath, k, d.seen);
  }
  notify("info", keyed(d, ev));
}
var keyed = (d, ev) => d === H2.door ? ev : { ...ev, key: d.key };
function forgetSeat(reason) {
  releaseStanding(reason, true, false, true);
  state.standing = null;
  state.standingSession = null;
}
function releasedAsOwn(what) {
  if (H2.revokingOwn) {
    log(
      `standing revoked by this session — released quietly, binding forgotten (${state.standing?.name ?? "unnamed"}; ${what} arrived before the answer)`
    );
    forgetSeat(holdWords().revokedOwn());
    return true;
  }
  if (H2.closingOwn) {
    log(`channel closed by this session — released quietly (${what} arrived before the answer)`);
    forgetSeat(holdWords().closedOwn());
    return true;
  }
  return false;
}
function openHolder(url, key2) {
  H2.holder = holdChannel(
    bindAll({
      url,
      onDropped: expectHello,
      onFrame: function onFrame(raw, frame2) {
        void Promise.resolve(stampOrigin(frame2)).then((full) => {
          if (full?.type === "standing_ended") return E.stop?.(key2, 0, "", full);
          if (E.order?.(url, full)) return;
          const primary = held();
          if (!primary) return H2.door ? deliverTo(H2.door, raw, frame2, full) : void 0;
          if (full?.type === "hello") learnFromHello(full, primary);
          if (holdStray(raw, full, held, () => onFrame(raw, frame2))) return;
          const { door: d, note: note4 } = routeNamed(full?.type === "hello" ? null : full, primary);
          if (note4) {
            log(note4);
            d.broadcast({ kind: "note", text: note4 });
          }
          deliverTo(d, raw, frame2, full);
          E.pulse?.(full?.type === "hello" ? "hello" : "frame");
          if (full?.type === "hello") drainWhenFree(() => takeSpool(key2, held, onFrame));
        });
      },
      onEvicted: (code) => {
        standingLog(`evicted ${key2}: close ${code}`);
        H2.evictedKey = key2;
        dropOwnHoldRecord(key2, url);
        E.next?.(key2, url, code);
      },
      onStopped: (code, reason) => {
        if (releasedAsOwn(`close ${code}`)) return;
        if (E.stop) E.stop(key2, code, reason);
        else forgetSeat(`close ${code}`);
      },
      onDeadToken: (code) => {
        if (H2.resuming > 0) {
          log(`hold record for ${key2} is dead at the platform (close ${code}) — dropped`);
          releaseStanding(holdWords().resumeFailed(), true);
          return;
        }
        const text2 = deadWord(code);
        log(text2);
        standingLog(`dead ${key2}: close ${code}`);
        const ev = { kind: "dead", code, text: text2 };
        broadcast(ev);
        notify("error", ev);
        Object.assign(H2, { deafKey: key2, deadPlaces: [...state.places] });
        releaseStanding(holdWords().tokenDead(), true);
      },
      onServiceAlive: (version) => {
        const text2 = holdWords().alive(version);
        log(text2);
        const ev = { kind: "alive", version, text: text2 };
        broadcast(ev);
        notify("warning", ev);
      },
      onNote: (text2) => {
        log(text2);
        broadcast({ kind: "note", text: text2 });
      },
      // Hang: a line waking the agent for the Monitor watchdog; pi and OpenCode show the human a notification that does not wake the agent (#5380).
      onHung: (text2) => {
        log(text2);
        broadcast({ kind: "note", text: text2 });
        notify("warning", { kind: "note", text: text2 });
      }
    })
  );
}

// js/bridge/status.ts
import { existsSync as existsSync7, readdirSync as readdirSync10, readFileSync as readFileSync23, statSync as statSync7 } from "node:fs";
import { isAbsolute, join as join20 } from "node:path";

// js/shared/busyargs.ts
var STATUS_ONLY_ARGS = /* @__PURE__ */ new Set([
  "realm",
  "karta",
  "name",
  "cwd",
  "status",
  "satellite_of"
]);
var unset = (v) => v == null || v === false || v === "";
var takingArgs = (args) => Object.keys(args).filter((k) => !STATUS_ONLY_ARGS.has(k) && !unset(args[k]));

// js/bridge/fields.ts
var LIVE_STATE = "active";
var isObj = (v) => !!v && typeof v === "object" && !Array.isArray(v);
var is = {
  str: (v) => v === void 0 || typeof v === "string",
  num: (v) => v === void 0 || typeof v === "number" && Number.isFinite(v),
  bool: (v) => v === void 0 || typeof v === "boolean",
  strOrNull: (v) => v === void 0 || v === null || typeof v === "string"
};
var SEAT_KEYS = {
  seat_id: is.str,
  karta_seq: is.num,
  karta_name: is.str,
  standing: is.str,
  listening: is.bool,
  state: is.str,
  pending: is.num,
  inbound: is.str,
  locale: is.str,
  satellite_of: is.strOrNull,
  realm: is.str,
  doing: is.str,
  opened: is.bool
};
var structuredOf = (reply2) => reply2?.result?.structuredContent;
var harnessAsksFields = () => asksFields(state.initParams);
function forHarness(reply2) {
  const r = reply2?.result;
  if (!r || !("structuredContent" in r) || harnessAsksFields()) return reply2;
  const { structuredContent: _, ...rest2 } = r;
  return { ...reply2, result: rest2 };
}
var incomplete = (sc) => isObj(sc) && (sc.incomplete === true || sc.dropped !== void 0 && sc.dropped !== 0);
var said = /* @__PURE__ */ new Set();
function fallback(what, sc) {
  const why = sc === void 0 ? "no field — the prose template" : incomplete(sc) ? "fields incomplete — the prose template" : "field off its form — the prose template";
  if (!said.has(`${what}|${why}`)) {
    said.add(`${what}|${why}`);
    log(`structuredContent ${what}: ${why}`);
  }
  return null;
}
var seat = (v) => isObj(v) && Object.entries(SEAT_KEYS).every(([k, ok]) => ok(v[k])) ? v : null;
function seats(sc, action) {
  const what = `${tool("channel")} ${action}`;
  if (!isObj(sc) || incomplete(sc) || sc.action !== action || !Array.isArray(sc.seats))
    return fallback(what, sc);
  const out7 = sc.seats.map(seat);
  return out7.every((s2) => s2) ? out7 : fallback(what, sc);
}
function boardField(sc) {
  const list3 = seats(sc, "list");
  if (!list3) return null;
  const folded = sc.folded;
  const whole = list3.every(
    (s2) => typeof s2.karta_seq === "number" && typeof s2.standing === "string" && s2.standing.startsWith("@") && typeof s2.listening === "boolean"
  );
  if (!whole || !is.num(folded)) return fallback(`${tool("channel")} list`, sc);
  return { seats: list3, folded: typeof folded === "number" ? folded : 0 };
}
function seatField(sc, action) {
  const list3 = seats(sc, action);
  if (!list3) return null;
  return list3.length === 1 ? list3[0] : fallback(`${tool("channel")} ${action}`, sc);
}

// js/bridge/board.ts
var fromField = (s2) => ({
  karta: String(s2.karta_seq),
  address: s2.standing ?? "",
  rest: "",
  incoming: s2.inbound ?? null,
  id: s2.seat_id ?? null,
  listening: s2.listening,
  undelivered: s2.pending ?? 0,
  // Liveness only from the api status; an unknown or missing value is not alive.
  alive: s2.state === LIVE_STATE
});
function readBoard(a) {
  const board = boardField(a.structured);
  if (board) {
    const entries3 = board.seats.map(fromField);
    const declared = board.folded > 0 ? entries3.length + board.folded : null;
    return { entries: entries3, recognized: true, declared };
  }
  const entries2 = parseBoard(a.text);
  const header = FORM.boardHeader.exec(a.text);
  const empty = FORM.boardEmpty.test(a.text);
  return {
    entries: entries2,
    recognized: !!header || empty || entries2.length > 0,
    declared: header?.[1] != null ? Number(header[1]) : null
  };
}
function parseBoard(text2) {
  const out7 = [];
  for (const line of text2.split("\n")) {
    const m = /^\s*#(\d+)\s.*?·\s(@\S+)\s—\s(.*)$/.exec(line);
    if (m) {
      out7.push({ karta: m[1], address: m[2], rest: m[3], incoming: null, id: null });
      continue;
    }
    const inc = /📥\s*(https?:\/\/\S+)/.exec(line);
    if (inc && out7.length) out7[out7.length - 1].incoming = inc[1];
    const id = /^\s*id\s+([0-9a-f][0-9a-f-]{7,})\s*$/i.exec(line);
    if (id && out7.length) out7[out7.length - 1].id = id[1];
  }
  return out7;
}
var nameOf = (address) => address.slice(address.indexOf(":") + 1);
var FORM = BOARD_FORM;
var listens = (e) => e.listening ?? FORM.listens.test(e.rest);
var alive = (e) => e.alive ?? FORM.alive.test(e.rest);
function undelivered(e) {
  if (e.undelivered != null) return e.undelivered;
  const m = FORM.undelivered.exec(e.rest);
  return m ? Number(m[1]) : 0;
}

// js/bridge/listen.ts
import { fileURLToPath as fileURLToPath2 } from "node:url";
function clientName() {
  const info = state.initParams?.clientInfo;
  return typeof info?.name === "string" ? info.name : "";
}
function listenBlock(realm) {
  const key2 = heldKey(realm);
  if (!key2) return null;
  return words(LISTEN).block(listenLine(key2));
}
function unheardListenBlock(realm) {
  const key2 = heldKey(realm);
  if (!key2 || NOTIFIED_CLIENTS.has(clientName())) return null;
  if ((doors().find((d) => d.key === key2)?.clients.size ?? 0) > 0) return null;
  return words(LISTEN).unheard(listenLine(key2));
}
function listenLine(key2) {
  const W4 = words(LISTEN);
  const self = fileURLToPath2(import.meta.url);
  const authArg = CFG.authDir === defaultAuthDir() ? "" : ` --auth-dir "${CFG.authDir}"`;
  const where = `${authArg} --lang ${lang()}`;
  const client = clientName();
  const monitor = W4.monitor(self, key2, where);
  const exit = W4.exit(self, key2, where);
  const codex = W4.codex(self, key2, where);
  return NOTIFIED_CLIENTS.has(client) ? W4.self(client === PI_CLIENT) : client === "claude-code" ? W4.claude(monitor, exit) : /codex/i.test(client) ? W4.codexLine(codex, exit) : W4.any(monitor, exit, codex);
}

// js/bridge/hearing.ts
import { readdirSync as readdirSync5, readFileSync as readFileSync16 } from "node:fs";
import { join as join13 } from "node:path";

// js/shared/canon.ts
import { realpathSync as realpathSync2 } from "node:fs";
import { sep } from "node:path";
function canonDir(p) {
  let real2 = p;
  try {
    real2 = realpathSync2.native(p);
  } catch {
  }
  while (real2.length > 1 && (real2.endsWith("/") || real2.endsWith(sep))) real2 = real2.slice(0, -1);
  return real2;
}
var sameDir = (a, b) => !!a && !!b && (a === b || canonDir(a) === canonDir(b));

// js/bridge/holdcanon.ts
import { existsSync as existsSync2, readdirSync as readdirSync4, readFileSync as readFileSync15, renameSync as renameSync9, unlinkSync as unlinkSync12 } from "node:fs";
import { basename as basename4, join as join12 } from "node:path";
var unsaid = scoped(() => /* @__PURE__ */ new Set());
var run = null;
var MEMORY = /\.(seen|asks|base)$/;
var bare = (r) => {
  const t = String(r ?? "").trim();
  return !!t && !t.startsWith("@") && t !== OWN_REALM;
};
var hashOf2 = (key2) => basename4(holdFilePathOf(CFG.authDir, key2), ".hold");
var live = (rec5) => !!rec5 && typeof rec5.url === "string" && !!rec5.realm && rec5.karta != null && typeof rec5.at === "number" && Date.now() - rec5.at <= HOLD_RECORD_MAX_AGE_MS;
function readAll(dir2) {
  const out7 = [];
  for (const f of readdirSync4(dir2).filter((x) => x.endsWith(".hold"))) {
    try {
      const rec5 = JSON.parse(readFileSync15(join12(dir2, f), "utf8"));
      if (live(rec5) && bare(rec5.realm)) out7.push({ file: join12(dir2, f), rec: rec5 });
    } catch {
    }
  }
  return out7;
}
function moveMemory(dir2, from, to) {
  const a = hashOf2(from);
  const b = hashOf2(to);
  for (const f of readdirSync4(dir2).filter((x) => x.startsWith(`${a}.`) && MEMORY.test(x))) {
    const dest = join12(dir2, b + f.slice(a.length));
    try {
      if (!existsSync2(dest)) renameSync9(join12(dir2, f), dest);
    } catch {
    }
  }
}
function move(dir2, file, rec5, canon2) {
  const from = keyOf(rec5.realm, rec5.karta, rec5.name);
  const to = keyOf(canon2, rec5.karta, rec5.name);
  const dest = holdFilePathOf(CFG.authDir, to);
  const formerKey = (kept3) => {
    const all2 = [.../* @__PURE__ */ new Set([...formerKeysIn(kept3, to), from, ...formerKeysIn(rec5, to)])];
    return all2.length === 1 ? all2[0] : all2;
  };
  try {
    if (!existsSync2(file)) return true;
    const there = existsSync2(dest) ? JSON.parse(readFileSync15(dest, "utf8")) : null;
    const next = there ? { ...there, formerKey: formerKey(there) } : { ...rec5, realm: canon2, key: to, formerKey: formerKey(null) };
    writeOwned(dest, JSON.stringify(next) + "\n");
    try {
      unlinkSync12(file);
    } catch (e) {
      if (e.code !== "ENOENT") throw e;
      return true;
    }
    moveMemory(dir2, from, to);
    log(`hold record ${from}: the graph ${rec5.realm} is ${canon2} — moved to ${to}`);
    return true;
  } catch (e) {
    log(`hold record ${from} not moved to ${to}: ${e.message}`);
    return false;
  }
}
function canonHoldRecords() {
  if (CFG.satellite) return Promise.resolve();
  run ??= moveAll().finally(() => {
    run = null;
  });
  return run;
}
async function moveAll() {
  const dir2 = standingsDirOf(CFG.authDir);
  if (!existsSync2(dir2)) return;
  const all2 = readAll(dir2);
  const open = [];
  for (const x of all2)
    if (!await localSocketAlive(
      socketPathOf(CFG.authDir, keyOf(x.rec.realm, x.rec.karta, x.rec.name))
    ))
      open.push(x);
  if (!open.length) return;
  const ask3 = open.map((x) => x.rec.realm).filter((r) => !unsaid.has(r) && !canonRealm(r).startsWith("@"));
  const answered2 = ask3.length ? await resolveRealms(ask3, realmList) : true;
  for (const { file, rec: rec5 } of open) {
    const canon2 = canonRealm(rec5.realm);
    if (canon2.startsWith("@")) move(dir2, file, rec5, canon2);
    else if (unsaid.has(rec5.realm)) continue;
    else if (answered2) {
      unsaid.add(rec5.realm);
      log(
        `hold record ${keyOf(rec5.realm, rec5.karta, rec5.name)}: the graph ${rec5.realm} is not in the graph list — left as it is; a bare name reaches only the own graph`
      );
    } else
      log(
        `hold record ${keyOf(rec5.realm, rec5.karta, rec5.name)}: the graph list did not answer — ${rec5.realm} left as it is, asked again at the next stand or return`
      );
  }
}

// js/bridge/hearing.ts
var isSentinel = (karta) => !/^\d+$/.test(karta);
function seatKarta(realm, karta, name2 = "") {
  const k = normKarta(karta);
  if (k !== "agent") return k;
  const r = String(realm ?? "").trim();
  const here = (x) => x === r || sameRealm(r, x);
  const led = [state.standing, ...state.places].find((p) => p && here(p.realm));
  if (led) return String(led.karta);
  const me = sessionOfBridge();
  const rec5 = me && name2 ? holdRecordsNamed(name2).find((x) => x.session === me && here(x.realm)) : null;
  return rec5 ? normKarta(rec5.karta) : k;
}
var unresolvedAgent = (karta, what) => karta !== "agent" ? null : words(HEARING).unresolvedAgent(what);
async function seatRealm(given) {
  const realm = typeof given === "string" ? given.trim() : "";
  if (!realm) return realm;
  await canonHoldRecords();
  await resolveAgainstLed(realm);
  return canonicalRealm(realm, realmList);
}
var ofSeat = (e, karta, name2) => (isSentinel(karta) || e.karta === karta) && nameOf(e.address) === name2;
function boardHearing(bd, karta, name2) {
  if (!bd?.recognized) return "unknown";
  const at3 = bd.entries.filter((e) => ofSeat(e, karta, name2));
  if (at3.some(listens)) return "other";
  const unread = bd.declared != null && bd.declared !== bd.entries.length;
  return unread && (at3.length === 0 || isSentinel(karta)) ? "unknown" : "free";
}
function keysNamed(realm, name2) {
  const dir2 = standingsDirOf(CFG.authDir);
  try {
    return readdirSync5(dir2).filter((f) => f.endsWith(".key")).map((f) => readFileSync16(join13(dir2, f), "utf8").trim()).filter((k) => {
      const m = /^.*?--(.+)--/.exec(k);
      return !!m && keyOf(realm, m[1], name2) === k;
    });
  } catch {
    return [];
  }
}
var unsignedHere = (rec5, cwd) => !rec5.session && !rec5.left && rec5.client === harnessName() && sameDir(rec5.cwd, cwd);
async function localHolder(key2, cwd) {
  if (!await localSocketAlive(localSocketPathOf(key2))) return null;
  if (doors().some((d) => d.key === key2 && d.ownsSocket)) return "self";
  const me = sessionOfBridge();
  const rec5 = me ? readHoldRecord(key2, true) : null;
  if (!rec5) return "other";
  return rec5.session === me || cwd != null && unsignedHere(rec5, cwd) ? "session" : "other";
}
async function heldLocally(realm, karta, name2, cwd) {
  let own = false;
  for (const key2 of isSentinel(karta) ? keysNamed(realm, name2) : [keyOf(realm, karta, name2)]) {
    const h = await localHolder(key2, cwd);
    if (h === "other") return "other";
    own ||= h === "session";
  }
  return own ? "session" : null;
}
async function askedHearing(realm, karta, name2, cwd = H2.standCwd ?? sessionCwd()) {
  const local = await heldLocally(realm, karta, name2, cwd);
  if (local === "other") return "other";
  if (local === "session") return "free";
  const b = await callTool(tool("channel"), { action: "list", realm }).catch(() => null);
  return boardHearing(b && !b.isError ? readBoard(b) : null, karta, name2);
}
async function rawSeatRefusal(msg) {
  if (msg?.method !== "tools/call" || msg.params?.name !== tool("channel")) return null;
  const a = msg.params.arguments ?? {};
  const action = String(a.action);
  if (!["connect", "mint", "register"].includes(action)) return null;
  const realm = typeof a.realm === "string" ? a.realm.trim() : "";
  const name2 = normName(a.name);
  const karta = seatKarta(realm, normKarta(a.karta) || "agent", name2);
  if (!realm) return null;
  const agent = unresolvedAgent(karta, action);
  if (agent) return agent;
  if (ledHere(realm, karta, name2)) return null;
  const hearing = await askedHearing(realm, karta, name2);
  if (hearing === "free") return null;
  const seat2 = keyOf(realm, karta, name2);
  const w5 = words(HEARING);
  const who = hearing === "other" ? w5.otherListens(seat2) : w5.unknownListens(seat2);
  return w5.rawSeatRefusal(who, action);
}
function ledHere(realm, karta, name2) {
  if (holdsStanding(realm, karta, name2)) return true;
  return ledKey() === keyOf(realm, karta, name2) && !H2.unheard && // back on the same address without hello — another may have turned it
  !wasEvicted(realm, karta, name2) && !isParked(realm, karta, name2);
}

// js/bridge/deaf.ts
var UNSIGNED = /* @__PURE__ */ new Set(["list", "leave", "close", "revoke", "?"]);
function signedRealm(msg) {
  if (msg?.method !== "tools/call" || msg.params?.name === tool("stand")) return null;
  const a = msg.params?.arguments ?? {};
  if (msg.params?.name === tool("channel") && UNSIGNED.has(String(a.action))) return null;
  return typeof a.realm === "string" ? a.realm : null;
}
function deafPlaces() {
  const s2 = state.standing;
  if (!s2) return [];
  const name2 = s2.name ?? "";
  if (isParked(s2.realm, s2.karta, name2) || H2.unheard) return [s2, ...state.places];
  const letGo2 = !ledKey() && H2.deafKey === keyOf(s2.realm, s2.karta, name2);
  return letGo2 ? [s2, ...state.places, ...H2.deadPlaces] : [];
}
function deafPlaceIn(realm) {
  if (typeof realm !== "string") return null;
  return deafPlaces().find((p) => !otherRealm(realm, p.realm)) ?? null;
}
async function deafSeatTaken(p = deafPlaces()[0] ?? null) {
  if (!p) return null;
  const name2 = p.name ?? "";
  const hearing = await askedHearing(p.realm, String(p.karta), name2);
  if (hearing === "free") return null;
  return hearing === "other" ? words(DEAF).takenByOther(name2) : words(DEAF).unknownHearing(name2);
}
async function deafRefusal(msg) {
  const realm = signedRealm(msg);
  if (H2.unheard && deafPlaceIn(realm)) await awaitHello(4e3);
  const p = deafPlaceIn(realm);
  const why = p ? await deafSeatTaken(p) : null;
  return why ? words(DEAF).refusal(why) : null;
}

// js/bridge/satellite.ts
import { randomBytes as randomBytes3 } from "node:crypto";
import {
  mkdirSync as mkdirSync10,
  readFileSync as readFileSync19,
  renameSync as renameSync10,
  rmSync,
  statSync as statSync6,
  unlinkSync as unlinkSync13,
  writeFileSync as writeFileSync11
} from "node:fs";
import { join as join17 } from "node:path";

// js/bridge/orderhalt.ts
var HALT_WAIT_MS = Number(process.env[envName("ORDER_HALT_MS")]) || 2e4;
var SILENT = "harness_silent";
var CODE = /^[a-z][a-z0-9_]{0,63}$/;
var waiting = /* @__PURE__ */ new Map();
var obj4 = (v) => v && typeof v === "object" && !Array.isArray(v) ? v : {};
var confirmsHalts = () => HALTS_CAPABILITY in obj4(obj4(obj4(state.initParams).capabilities).experimental);
function awaitHalt(order, ms2 = HALT_WAIT_MS) {
  return new Promise((resolve11) => {
    const t = setTimeout(() => done(SILENT), ms2);
    t.unref?.();
    const done = (code) => {
      clearTimeout(t);
      if (waiting.get(order) === done) waiting.delete(order);
      resolve11(code);
    };
    waiting.set(order, done);
  });
}
function localHalted(msg) {
  if (msg?.method !== method("halted")) return null;
  const p = obj4(msg.params);
  const order = typeof p.order === "string" ? p.order : "";
  const code = typeof p.code === "string" && CODE.test(p.code) ? p.code : "harness_refused";
  const done = waiting.get(order);
  done?.(p.ok === true ? null : code);
  return Promise.resolve({ jsonrpc: "2.0", id: msg.id, result: { taken: !!done } });
}

// js/bridge/skillwatch.ts
import { readdirSync as readdirSync7, statSync as statSync5 } from "node:fs";
import { join as join16 } from "node:path";

// js/shared/skilllock.ts
import { existsSync as existsSync3, readFileSync as readFileSync17, realpathSync as realpathSync3 } from "node:fs";
import { homedir as homedir5 } from "node:os";
import { basename as basename5, dirname as dirname7, join as join14, resolve as resolve5 } from "node:path";
var canon = (p) => {
  try {
    return realpathSync3(p);
  } catch {
    return resolve5(p);
  }
};
function lockPlaces(root, stateHome = process.env.XDG_STATE_HOME) {
  const places = [];
  if (stateHome && canon(root) === canon(join14(homedir5(), ".agents", "skills")))
    places.push(join14(stateHome, "skills", ".skill-lock.json"));
  places.push(join14(dirname7(root), ".skill-lock.json"));
  if (basename5(root) === "skills" && basename5(dirname7(root)) === ".agents")
    places.push(join14(dirname7(dirname7(root)), "skills-lock.json"));
  return places;
}
function skillLock(root, stateHome = process.env.XDG_STATE_HOME) {
  const place = lockPlaces(root, stateHome).find((p) => existsSync3(p));
  if (!place) return null;
  try {
    const lock = JSON.parse(readFileSync17(place, "utf8"));
    return lock.skills ?? {};
  } catch {
    return null;
  }
}

// js/bridge/skillset.ts
import { createHash as createHash7 } from "node:crypto";
import { existsSync as existsSync4, readdirSync as readdirSync6, readFileSync as readFileSync18, statSync as statSync4 } from "node:fs";
import { homedir as homedir6 } from "node:os";
import { dirname as dirname8, join as join15, resolve as resolve6 } from "node:path";
import { fileURLToPath as fileURLToPath3 } from "node:url";
var SET = SKILL_SET;
var BRIDGE_IN_SET = join15(BRIDGE_SKILL, "scripts", BRIDGE_FILE);
var env = (k) => envOf(k)?.trim() ?? "";
var R2 = scoped(() => ({ identity: "", root: null, missing: "" }));
function skillsRoot(self = currentScope().origin?.path || fileURLToPath3(import.meta.url)) {
  const plugin = env("CLAUDE_PLUGIN_ROOT");
  const explicit = env(SKILLS_ROOT_ENV);
  const identity = JSON.stringify([explicit, self, plugin]);
  if (identity !== R2.identity) {
    R2.identity = identity;
    R2.root = null;
  }
  const exists = (root) => existsSync4(join15(root, BRIDGE_IN_SET));
  if (!R2.root) {
    const candidates = [
      explicit && resolve6(explicit),
      resolve6(dirname8(self), "..", ".."),
      plugin && resolve6(plugin, "skills"),
      join15(homedir6(), ".agents", "skills")
    ];
    R2.root = candidates.find((c) => c && exists(c)) || null;
  }
  return R2.root && exists(R2.root) ? R2.root : null;
}
function skillsUnavailable() {
  if (skillsRoot() || !R2.root) return null;
  return existsSync4(R2.root) ? "bridge" : "root";
}
function skillsRefreshAllowed() {
  const self = currentScope().origin?.path || fileURLToPath3(import.meta.url);
  const root = skillsRoot(self);
  return !env("CLAUDE_PLUGIN_ROOT") && !self.includes("/plugins/cache/") && !(root && existsSync4(join15(root, "..", ".claude-plugin", "plugin.json")));
}
var sha8 = (h) => h.digest("hex").slice(0, 8);
function lockSet(root) {
  const skills = skillLock(root, env("XDG_STATE_HOME"));
  if (!skills) return { name: SET, stamp: null };
  const own = skills[BRIDGE_SKILL]?.source;
  const name2 = typeof own === "string" && own.trim() ? own.trim() : SET;
  const lines = Object.entries(skills).filter(([, s2]) => s2?.source === name2 && typeof s2.skillFolderHash === "string").map(([n, s2]) => `${n}:${String(s2?.skillFolderHash)}
`).sort();
  return { name: name2, stamp: lines.length ? sha8(createHash7("sha256").update(lines.join(""))) : null };
}
var isFileAt = (p) => {
  try {
    return statSync4(p).isFile();
  } catch {
    return false;
  }
};
function allFiles(dir2, at3 = "") {
  let entries2;
  try {
    entries2 = readdirSync6(join15(dir2, at3), { withFileTypes: true });
  } catch {
    return [];
  }
  return entries2.flatMap((e) => {
    const rel = at3 ? `${at3}/${e.name}` : e.name;
    if (e.isDirectory()) return allFiles(dir2, rel);
    return e.isFile() || e.isSymbolicLink() && isFileAt(join15(dir2, rel)) ? [rel] : [];
  }).sort();
}
function treeStamp(root, mask = SKILL_STAMP_MASK) {
  const [head, ...restParts] = mask.split("/");
  const rest2 = restParts.join("/");
  if (head !== "*" || !rest2 || rest2.includes("*") && rest2 !== "**")
    throw new Error(`unsupported skill stamp mask: ${mask}`);
  const h = createHash7("sha256");
  let n = 0;
  let names2;
  try {
    names2 = readdirSync6(root).sort();
  } catch {
    return null;
  }
  for (const name2 of names2) {
    const files = rest2 === "**" ? allFiles(join15(root, name2)) : [rest2];
    const bodies = [];
    for (const rel of files) {
      try {
        bodies.push([rel, readFileSync18(join15(root, name2, rel))]);
      } catch {
      }
    }
    if (!bodies.length) continue;
    h.update(`${name2}\0`);
    for (const [rel, body] of bodies) {
      if (rest2 === "**") h.update(`${rel}\0`);
      h.update(body);
    }
    h.update("\0");
    n++;
  }
  return n ? sha8(h) : null;
}
function skillsAttr() {
  const root = skillsRoot();
  const missing = !root ? R2.root || "unidentified" : "";
  if (missing !== R2.missing) {
    R2.missing = missing;
    if (missing) log(`installed skills root is missing: ${missing}; not selecting another set`);
  }
  if (!root) return { name: SET, version: "unknown" };
  let version = "unknown";
  try {
    version = versionIn(readFileSync18(join15(root, BRIDGE_IN_SET), "utf8")) ?? "unknown";
  } catch {
    log(`installed skills root is missing or unreadable: ${root}; not selecting another set`);
  }
  const lock = lockSet(root);
  const stamp = lock.stamp ?? treeStamp(root);
  return { name: lock.name, version, ...stamp ? { stamp } : {} };
}

// js/bridge/skillwatch.ts
var W2 = scoped(() => ({
  announced: /* @__PURE__ */ new Map(),
  checkedAt: 0,
  disk: "",
  installed: void 0,
  pending: false,
  missingSince: null,
  unsettled: false
}));
var key = (p) => `${p.realm ?? ""}|${normKarta(p.karta)}|${normName(p.name)}`;
var announcedSkills = (p) => W2.announced.get(key(p));
function installedSkills(p, fresh2 = false) {
  if (!skillsRefreshAllowed()) return skillsAttr();
  checkInstalled(fresh2);
  return W2.installed ?? announcedSkills(p) ?? skillsAttr();
}
function skillsNeedRegister(p) {
  if (!skillsRefreshAllowed()) return false;
  checkInstalled();
  if (W2.unsettled) return false;
  return JSON.stringify(announcedSkills(p)) !== JSON.stringify(W2.installed);
}
function noteSkills(p, skills) {
  const s2 = safeSkills(skills);
  if (s2) W2.announced.set(key(p), s2);
}
var modified = (path) => {
  try {
    const s2 = statSync5(path);
    return `${path}:${s2.mtimeMs}:${s2.size}`;
  } catch {
    return `${path}:missing`;
  }
};
function diskVersion() {
  const root = skillsRoot();
  if (!root) return "missing";
  const locks = lockPlaces(root, envOf("XDG_STATE_HOME"));
  let names2 = [];
  try {
    names2 = readdirSync7(root).sort();
  } catch {
  }
  return [
    root,
    ...locks,
    ...names2.flatMap((n) => [join16(root, n), join16(root, n, "SKILL.md")]),
    join16(root, BRIDGE_SKILL, "scripts", BRIDGE_FILE)
  ].map(modified).join("|");
}
function checkInstalled(fresh2 = false) {
  if (!skillsRefreshAllowed()) return;
  const gap = Number(process.env[envName("SKILLS_GAP_MS")]) || 6e4;
  const now2 = Date.now();
  if (!fresh2 && W2.checkedAt && now2 - W2.checkedAt < gap) return;
  W2.checkedAt = now2;
  const disk = diskVersion();
  const missing = skillsUnavailable();
  W2.missingSince = missing ? W2.missingSince ?? now2 : null;
  W2.unsettled = W2.missingSince !== null && now2 - W2.missingSince < gap;
  if (W2.unsettled) return;
  if (disk === W2.disk) return;
  W2.disk = disk;
  W2.installed = skillsAttr();
  W2.pending = true;
}
function skillsCheckDue() {
  checkInstalled();
  const due = W2.pending;
  W2.pending = false;
  return due;
}
function retrySkillsCheck() {
  W2.disk = "";
}

// js/bridge/placefields.ts
var P = scoped(() => ({
  model: "",
  /** Session usage (usage.ts, #6271): the last snapshot rides in every register. */
  usage: null,
  satelliteOf: "",
  satelliteOfId: "",
  localeWarned: false
}));
var extras2 = scoped(() => /* @__PURE__ */ new Map());
var placeKey = (p) => `${String(p.realm ?? "")}|${normKarta(p.karta)}|${normName(p.name)}`;
function rememberUsage(u) {
  P.usage = u;
}
function observedPlaceAttrs() {
  return { usage: P.usage, satellite_of: P.satelliteOf };
}
function noteSatelliteOf(address, id) {
  P.satelliteOf = address;
  P.satelliteOfId = CFG.satellite && id ? id : "";
}
function rememberModel(m) {
  if (typeof m === "string" && m.trim()) P.model = m.trim().replace(/^[^/]*\//, "");
}
function rememberStandModel(m) {
  if (CFG.satellite) P.model = "";
  rememberModel(m);
}
var satelliteWithoutModel = () => CFG.satellite && !P.model;
function stopAttrs(place, move2) {
  const ack = confirmsHalts() ? "confirmed" : "word";
  if (move2 !== "register") return { effect: "agent", ack };
  if (!H2.holder || !H2.currentKey || !H2.door) return null;
  if (extraIn(place.realm)) return { effect: "seat", ack };
  const prim = state.standing;
  if (!!prim && otherRealm(place.realm, prim.realm))
    return H2.holder.alive ? { effect: "seat", ack } : null;
  return { effect: "agent", ack };
}
function placeFields(place = {}, freshSkills = false, move2 = "register") {
  const harness = harnessName();
  const extra = extras2.get(placeKey(place)) ?? {};
  const { model, usage: usage2, satelliteOf, satelliteOfId } = P;
  const locale = SERVER_LOCALE[lang()];
  return {
    ...model ? { model } : {},
    // Seat language (#6080): asked only where the layer names a locale; otherwise the server default decides.
    ...locale ? { locale } : {},
    ...CFG.satellite && satelliteOfId ? { satellite_of: satelliteOfId } : {},
    attrs: {
      ...extra,
      build: { name: BRIDGE_NAME, version: VERSION, stamp: BUILD.split("+")[1] ?? "" },
      skills: installedSkills(place, freshSkills),
      ...harness ? { harness, harness_version: harnessVersion() } : {},
      ...satelliteOf ? { satellite_of: satelliteOf } : {},
      ...usage2 ? { usage: usage2 } : {},
      // The bridge's own word, over the agent's: no effect known — the key dropped (undefined).
      stop: stopAttrs(place, move2) ?? void 0
    }
  };
}
var PLACE_ACTIONS = /* @__PURE__ */ new Set(["connect", "mint", "register"]);
function noteLocaleEcho(args, text2, structured) {
  const asked = args.locale;
  if (typeof asked !== "string" || P.localeWarned) return;
  const action = String(args.action);
  const field = PLACE_ACTIONS.has(action) ? seatField(structured, action)?.locale : void 0;
  const echo = (field ?? /\blocale\b["']?\s*[:=]\s*["']?([a-z]{2})\b/i.exec(text2)?.[1])?.toLowerCase();
  if (!echo || echo === asked) return;
  P.localeWarned = true;
  log(`locale: asked ${asked}, the server answered ${echo} — its prose stays in ${echo}`);
}
function withPlaceFields(args) {
  if (!PLACE_ACTIONS.has(String(args.action))) return args;
  rememberModel(args.model);
  if (args.attrs && typeof args.attrs === "object" && !Array.isArray(args.attrs))
    extras2.set(placeKey(args), { ...args.attrs });
  return { ...args, ...placeFields(args, true, String(args.action)) };
}

// js/bridge/satellite.ts
var SATELLITE_TTL_S = Number(process.env[envName("BRIDGE_SATELLITE_TTL")]) || 300;
var sw = () => words(SATELLITE);
var claimDir = () => join17(CFG.authDir, "satellites");
var claimFile = (name2) => join17(claimDir(), `${name2.replace(/[^A-Za-z0-9._-]+/g, "_")}.claim`);
var claims = scoped(() => /* @__PURE__ */ new Set());
var allClaims = /* @__PURE__ */ new Map();
var releaseOnExit = false;
var LOCK_STALE_MS = 1e4;
var LOCK_WAIT_MS = 3e3;
function alive2(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (e) {
    return e.code === "EPERM";
  }
}
function claimName(name2) {
  const file = claimFile(name2);
  let pid = 0;
  try {
    pid = Number(readFileSync19(file, "utf8").trim());
  } catch {
  }
  const me = sessionPid();
  if (pid && pid !== me && alive2(pid)) return false;
  writeFileSync11(file, `${me}
`, { mode: 384 });
  if (!releaseOnExit) process.once("exit", releaseAllClaims);
  releaseOnExit = true;
  claims.add(file);
  allClaims.set(file, me);
  return true;
}
var dropClaim = (f, pid) => {
  try {
    if (Number(readFileSync19(f, "utf8").trim()) === pid) unlinkSync13(f);
  } catch {
  }
  allClaims.delete(f);
};
function releaseSatelliteClaims() {
  const me = sessionPid();
  for (const f of claims) dropClaim(f, me);
  claims.clear();
}
function releaseAllClaims() {
  for (const [f, pid] of [...allClaims]) dropClaim(f, pid);
}
var LOCK_OWNER = "owner";
function lockOwner(lock) {
  try {
    return readFileSync19(join17(lock, LOCK_OWNER), "utf8").trim();
  } catch {
    return null;
  }
}
function abandoned(lock, owner) {
  const pid = owner ? Number(owner.split(" ")[0]) : 0;
  if (pid && !alive2(pid)) return true;
  try {
    return Date.now() - statSync6(lock).mtimeMs > LOCK_STALE_MS;
  } catch {
    return false;
  }
}
function takeLock(lock, owner) {
  const away = `${lock}.${process.pid}-${randomBytes3(6).toString("hex")}`;
  try {
    renameSync10(lock, away);
  } catch {
    return null;
  }
  if (lockOwner(away) !== owner)
    return `the claims lock of another bridge was taken by mistake and is left as ${away}`;
  rmSync(away, { recursive: true, force: true });
  return null;
}
async function underClaimLock(fn) {
  const lock = join17(claimDir(), ".lock");
  const token = `${process.pid} ${randomBytes3(8).toString("hex")}`;
  let fault = null;
  try {
    mkdirSync10(claimDir(), { recursive: true, mode: 448 });
  } catch (e) {
    fault = e.message;
  }
  for (const end = Date.now() + LOCK_WAIT_MS; !fault; ) {
    try {
      mkdirSync10(lock);
    } catch (e) {
      if (e.code !== "EEXIST") fault = e.message;
      else if (Date.now() > end) fault = `the claims lock ${lock} is held too long`;
      else {
        const owner = lockOwner(lock);
        if (abandoned(lock, owner)) fault = takeLock(lock, owner);
        if (!fault) await new Promise((r) => setTimeout(r, 20));
      }
      continue;
    }
    try {
      writeFileSync11(join17(lock, LOCK_OWNER), `${token}
`, { mode: 384 });
    } catch (e) {
      fault = e.message;
      rmSync(lock, { recursive: true, force: true });
    }
    break;
  }
  if (fault) {
    log(`satellite claims unavailable — the board alone picks the name: ${fault}`);
    return [fn(() => true), fault];
  }
  let unwritten = null;
  let value;
  try {
    value = fn((name2) => {
      try {
        return claimName(name2);
      } catch (e) {
        unwritten = `claim not written: ${e.message}`;
        log(`satellite ${unwritten}`);
        return true;
      }
    });
  } catch (e) {
    if (lockOwner(lock) === token) takeLock(lock, token);
    throw e;
  }
  const lost = lockOwner(lock) === token ? takeLock(lock, token) : `the claims lock ${lock} is no longer ours — left as it is; another bridge may have picked at the same time`;
  if (lost) log(`satellite ${lost}`);
  return [value, unwritten ?? lost];
}
function pickSatellite(entries2, of, karta, led, claim = () => true) {
  const address = of.startsWith("@") && of.includes(":") ? of : null;
  const base = address ? nameOf(address) : of.replace(/^@/, "");
  const fault = base ? nameFault(base) : sw().empty();
  if (fault) return { ok: false, refusal: sw().notSeatName(of, fault) };
  const callers = entries2.filter(
    (e) => address ? e.address === address : nameOf(e.address) === base
  );
  if (!callers.length) return { ok: false, refusal: sw().noCaller(of) };
  const same2 = callers.length > 1 ? callers.filter((e) => e.karta === normKarta(karta)) : callers;
  if (same2.length !== 1) return { ok: false, refusal: sw().ambiguous(callers.length, base) };
  const caller = same2[0].address;
  const callerKarta = same2[0].karta;
  const callerId = same2[0].id;
  const notes = [];
  if (led && isSatelliteOf(base, led)) {
    const word3 = sw().alreadyHolds(led);
    log(word3);
    notes.push(word3);
    return { ok: true, name: led, caller, callerKarta, callerId, notes };
  }
  const taken2 = new Set(entries2.map((e) => nameOf(e.address)));
  for (let n = 1; n <= 99; n++) {
    const name2 = satelliteName(base, n);
    if (taken2.has(name2) || !claim(name2)) continue;
    if (!name2.startsWith(`${base}.`)) notes.push(sw().nameCut(base, n, NAME_MAX, name2));
    return { ok: true, name: name2, caller, callerKarta, callerId, notes };
  }
  return { ok: false, refusal: sw().allTaken(caller) };
}
async function satelliteGate(a, realm, karta, asked) {
  const of = typeof a.satellite_of === "string" ? a.satellite_of.trim() : "";
  const refuse2 = (refusal2) => ({ ok: false, refusal: refusal2 });
  if (CFG.satellite && !of) return refuse2(sw().needSatelliteOf());
  if (!of) return null;
  if (!CFG.satellite) return refuse2(sw().notSatellite());
  if (asked || a.take === true || typeof a.room === "string" && a.room.trim())
    return refuse2(sw().derivesName());
  const b = await callTool(tool("channel"), { action: "list", realm });
  if (b.isError) return refuse2(sw().boardUnread(short(b.text)));
  const s2 = state.standing;
  const led = s2 && !otherRealm(s2.realm, realm) ? s2.name ?? null : null;
  const { entries: entries2 } = readBoard(b);
  const [pick3, unsure] = await underClaimLock(
    (claim) => pickSatellite(entries2, of, karta, led, claim)
  );
  if (!pick3.ok) return pick3;
  if (unsure && pick3.name !== led) pick3.notes.push(sw().claimsUnsure(unsure, pick3.name));
  if (!pick3.callerId) {
    const k = await callTool(tool("channel"), { action: "list", realm, karta: pick3.callerKarta });
    if (!k.isError)
      pick3.callerId = readBoard(k).entries.find((e) => e.address === pick3.caller)?.id ?? null;
  }
  noteSatelliteOf(pick3.caller, pick3.callerId);
  pick3.notes.push(sw().seat(pick3.caller, normKarta(karta), SATELLITE_TTL_S));
  if (!pick3.callerId) pick3.notes.push(sw().noCallerId(pick3.caller));
  return pick3;
}
var ttlRefused = (a) => a.refusal?.rule ? a.refusal.rule === "ttl_out_of_range" : /ttl/i.test(a.text) || /(^|\D)4\d\d(\D|$)/.test(a.text);
var PLACE_ACTIONS2 = /* @__PURE__ */ new Set(["connect", "mint", "register", "revoke"]);
function satelliteChannelRefusal(args) {
  if (!CFG.satellite) return null;
  const action = String(args.action ?? "");
  if (!PLACE_ACTIONS2.has(action)) return null;
  const s2 = state.standing;
  const own = s2?.name ?? "";
  if (!s2 || !SUB_RE.test(own)) return sw().bypass(action);
  const sameRealm2 = !otherRealm(args.realm, s2.realm);
  const karta = normKarta(args.karta ?? s2.karta);
  const target = action === "revoke" ? args.channel != null ? null : String(args.standing ?? "") : String(args.name ?? "").trim();
  const mine = target != null && (target === own || target.endsWith(`:${own}`) || action === "revoke" && target === "mine");
  if (sameRealm2 && karta === normKarta(s2.karta) && mine) return null;
  return sw().onlyOwn(action, own, normKarta(s2.karta), s2.realm);
}
var satelliteListenWord = () => sw().listen(SATELLITE_TTL_S);

// js/bridge/statusaddr.ts
function statusAddress(realm) {
  if (!H2.currentStatusUrl || !H2.currentKey) return null;
  const extra = realm ? extraIn(realm) : void 0;
  const d = extra?.door ?? H2.door;
  return {
    url: H2.currentStatusUrl,
    key: d?.key ?? H2.currentKey,
    standingId: d?.standingId ?? null,
    place: d?.address ?? null,
    derived: d?.addressDerived ?? false,
    name: (extra?.standing ?? state.standing)?.name ?? ""
  };
}

// js/bridge/usagefields.ts
var SPENT = ["tokens", "input", "output", "cache_read", "cache_write"];
var num = (v) => typeof v === "number" && Number.isFinite(v) && v >= 0 ? Math.round(v) : void 0;
function usageOf(p) {
  const u = {};
  for (const k of SPENT) {
    const v = num(p[k]);
    if (v !== void 0) u[k] = v;
  }
  if (typeof p.model === "string" && p.model.trim()) u.model = p.model.trim().slice(0, 120);
  const context2 = num(p.context);
  const window = num(p.window);
  if (context2 !== void 0) u.context = context2;
  if (window) u.window = window;
  if (context2 !== void 0 && window) u.percent = Math.round(100 * context2 / window);
  return Object.keys(u).length ? { ...u, at: (/* @__PURE__ */ new Date()).toISOString() } : null;
}
function moved(a, b) {
  if (!a) return true;
  if (a.percent !== void 0 && b.percent !== void 0 && Math.abs(b.percent - a.percent) >= 5)
    return true;
  if (b.tokens !== void 0 && (a.tokens === void 0 || b.tokens >= a.tokens * 1.1 + 1))
    return true;
  return a.window !== b.window || b.model !== void 0 && a.model !== b.model;
}

// js/bridge/usage.ts
var MIN_GAP_MS = Number(process.env[envName("USAGE_GAP_MS")] || 6e4);
var FLUSH_CAP_MS = Number(process.env[envName("CASE_LEAVE_MS")]) || 1500;
var U = scoped(() => ({
  published: null,
  latest: null,
  at: 0
}));
var isUsageCall = (msg) => msg?.method === method("usage");
function usagePlace() {
  const s2 = state.standing;
  return s2 && !isParked(s2.realm, s2.karta, s2.name ?? "") ? s2 : null;
}
async function publish(place, u) {
  U.at = Date.now();
  const got = await replayRegister(place, false);
  const ok = !!got && !got.error && !got.result?.isError;
  if (ok) {
    if (u) U.published = u;
  } else
    log(
      `usage: register did not take the attrs this time — ${JSON.stringify(got?.error ?? got?.result ?? null).slice(0, 200)}`
    );
  return ok;
}
async function runUsage(msg) {
  const answer2 = (result) => ({
    jsonrpc: "2.0",
    id: msg.id,
    result
  });
  if (!HOSTED_CLIENTS.has(harnessName()))
    return answer2({
      pushed: false,
      usage: null,
      why: words(USAGE).notHosted()
    });
  const u = usageOf(msg.params ?? {});
  if (!u)
    return answer2({
      pushed: false,
      usage: null,
      why: words(USAGE).noNumbers()
    });
  const s2 = usagePlace();
  const gap = !!s2 && Date.now() - U.at >= MIN_GAP_MS;
  const bytes = Buffer.byteLength(JSON.stringify(u));
  if (bytes > USAGE_MAX) {
    log(`usage: ${bytes} bytes, over ${USAGE_MAX} — not sent, not kept`);
    if (gap && s2 && skillsNeedRegister(s2)) await publish(s2, null);
    return answer2({ pushed: false, usage: u, why: words(USAGE).tooLarge(USAGE_MAX) });
  }
  U.latest = u;
  rememberUsage(u);
  const tact = !!s2 && byTact(u);
  const due = gap && (!tact && moved(U.published, u) || !!s2 && skillsNeedRegister(s2));
  const registered = due && s2 ? await publish(s2, u) : false;
  return answer2({ pushed: tact || registered, usage: u });
}
var numbers = (u) => JSON.stringify({ ...u, at: null });
var USAGE_MAX = Math.min(Number(process.env[envName("USAGE_MAX_BYTES")]) || 2048, 2048);
function byTact(u) {
  const addr = statusAddress();
  if (!addr || !onDispatcher(addr.url)) return false;
  if (numbers(u) === numbers(U.published)) return true;
  if (!tickFor(
    addr.url,
    addr.standingId,
    { usage: { ...u } },
    bindScope(() => fellBack(u))
  ))
    return false;
  U.published = u;
  return true;
}
function fellBack(u) {
  if (U.published === u) U.published = null;
  const s2 = usagePlace();
  if (s2) void publish(s2, U.latest ?? u).catch(() => {
  });
}
async function flushUsage(place) {
  const u = U.latest;
  if (!place || !u || u === U.published && !skillsNeedRegister(place)) return;
  let timer;
  const cap = new Promise((r) => timer = setTimeout(() => r("cap"), FLUSH_CAP_MS));
  const sent = publish(place, u).catch((e) => {
    log(`usage: the last snapshot did not land before the place went — ${e.message}`);
    return false;
  });
  const got = await Promise.race([sent, cap]);
  clearTimeout(timer);
  if (got === "cap")
    log(`usage: the last snapshot exceeded ${FLUSH_CAP_MS} ms before the place went`);
}

// js/bridge/leave.ts
var DEAF_MS = Number(process.env[envName("BRIDGE_DEAF_MS")]) || 15 * 6e4;
var TICK_MS = Math.min(6e4, Math.max(200, Math.floor(DEAF_MS / 5)));
var clearedLine = (st) => st.ok ? words(LEAVE).cleared() : words(LEAVE).notCleared(st.body);
var deafWithoutListener = () => !notifiedClient();
var K = scoped(() => ({
  /** Busy line cleared by the leave — restored with the seat. */
  status: "",
  /** Busy lines of seats in other graphs cleared by the same leave — each to its seat (#5838). */
  beside: []
}));
async function leaveStanding(reason, byWord = false) {
  const W4 = words(LEAVE);
  if (byWord && CFG.satellite) return leaveSatellite(reason);
  const beside = heldPlaces().filter((p) => !p.primary).map((p) => ({ realm: p.realm, text: readHoldRecord(p.key)?.status ?? "" })).filter((k) => k.text);
  const leaving = heldPlaces().map((p) => p.key);
  if (leaving.length) await flushUsage(usagePlace());
  const status = publishedStatus();
  const url = statusAddress()?.url ?? null;
  const live2 = !!url && liveOnDispatcher(url);
  const kept3 = !live2 && !!url && onDispatcher(url);
  const early = live2 ? await publishStatus("", void 0, true) : null;
  const parked = parkStanding(reason);
  if (!parked) return W4.notHolding();
  K.beside = beside;
  K.status = status;
  const st = early ?? (kept3 ? null : await publishStatus("", void 0, true));
  if ((st?.ok ?? true) && K.status) rememberStatus(K.status);
  if (byWord) for (const k of leaving) markLeft(k, true);
  const line = st ? clearedLine(st) : W4.keptOnBoard();
  log(`left the standing: ${reason}; ${line}`);
  const which2 = leaving.length > 1 ? W4.seats(leaving.join(", ")) : W4.seat(parked);
  return byWord ? W4.leftByWord(which2, line) : W4.left(which2, line);
}
async function leaveSatellite(reason) {
  const W4 = words(LEAVE);
  const place = heldPlaces()[0]?.key;
  if (!place) return W4.notHolding();
  await flushUsage(usagePlace());
  const url = statusAddress()?.url ?? null;
  const kept3 = !!url && onDispatcher(url) && !liveOnDispatcher(url);
  const st = kept3 ? null : await publishStatus("", void 0, true);
  releaseStanding(`${reason}: ${W4.satelliteReleased()}`, true, false, true);
  releaseSatelliteClaims();
  const line = st ? clearedLine(st) : W4.keptOnBoard();
  log(`left the satellite place: ${reason}; ${line}`);
  return W4.leftSatellite(place, line);
}
function returnToStanding(how2) {
  if (!resumeStanding()) return false;
  for (const p of heldPlaces()) markLeft(p.key, false);
  const text2 = words(LEAVE).returned(how2, K.status);
  log(text2);
  if (K.status) {
    const line = K.status;
    K.status = "";
    void publishStatus(line).then((st) => {
      if (!st.ok) log(`busy line not restored after the return: ${st.body}`);
    });
  }
  for (const k of K.beside.splice(0))
    void publishStatus(k.text, k.realm).then((st) => {
      if (!st.ok) log(`busy line of ${k.realm} not restored after the return: ${st.body}`);
    });
  emit({
    jsonrpc: "2.0",
    method: "notifications/message",
    params: { level: "info", logger: LOGGERS.channel, data: { kind: "note", text: text2 } }
  });
  return true;
}
async function heardOnReturn() {
  if (!H2.unheard || await awaitHello(4e3)) return;
  const why = words(LEAVE).noHello();
  log(why);
  H2.deafKey = H2.currentKey;
  releaseStanding(why, false, false, true);
}
function startDeafnessWatch() {
  onListenerAttached(
    () => setTimeout(() => {
      if (localListeners() > 0) returnToStanding(words(LEAVE).watchdogAttached());
    }, 300).unref()
  );
  setInterval(() => {
    const since = listenerIdleSince();
    if (since == null || !deafWithoutListener()) return;
    if (Date.now() - since < DEAF_MS) return;
    const s2 = state.standing;
    if (!s2 || !holdsStanding(s2.realm, s2.karta, s2.name ?? "")) return;
    const min = Math.round(DEAF_MS / 6e4);
    void leaveStanding(words(LEAVE).nobodyListens(min));
  }, TICK_MS).unref();
}
function namesOwnSeat(standing) {
  const s2 = state.standing;
  if (!s2) return false;
  const address = H2.door?.address ?? null;
  if (standing === ledKey() || standing === address) return true;
  if (standing.startsWith("@")) return false;
  return !!s2.name && nameOf(standing) === s2.name;
}
function localLeave(msg) {
  if (msg?.method !== "tools/call" || msg?.params?.name !== tool("channel")) return null;
  if (msg.params?.arguments?.action !== "leave") return null;
  const realm = msg.params.arguments.realm;
  const answer2 = (text2, isError = false) => ({
    jsonrpc: "2.0",
    id: msg.id,
    result: { ...isError ? { isError: true } : {}, content: [{ type: "text", text: text2 }] }
  });
  return (async () => {
    const W4 = words(LEAVE);
    await resolveAgainstLed(realm);
    const unresolved2 = unresolvedRefusal(realm);
    if (unresolved2) return answer2(unresolved2, true);
    const beside = besideKeyIn(realm);
    if (beside)
      return answer2(W4.refusedBeside(beside, String(ledKey()), state.standing?.realm), true);
    if (state.standing && otherRealm(realm, state.standing.realm))
      return answer2(W4.refusedOther(String(realm), String(ledKey()), state.standing.realm), true);
    const named2 = msg.params.arguments.standing;
    if (typeof named2 === "string" && named2.trim() && !namesOwnSeat(named2.trim()))
      return answer2(W4.refusedNamed(named2.trim(), H2.door?.address ?? ledKey()), true);
    return answer2(await leaveStanding(W4.byDoerWord(), true));
  })();
}

// js/bridge/besideback.ts
import { existsSync as existsSync5, readdirSync as readdirSync8, readFileSync as readFileSync20 } from "node:fs";
import { join as join18 } from "node:path";
function besideRecords(url, primary) {
  const dir2 = standingsDirOf(CFG.authDir);
  if (!existsSync5(dir2)) return [];
  const out7 = [];
  for (const f of readdirSync8(dir2).filter((x) => x.endsWith(".hold"))) {
    try {
      const raw = JSON.parse(readFileSync20(join18(dir2, f), "utf8"));
      if (!raw || raw.url !== url || raw.client !== harnessName()) continue;
      if (sameRealm(primary.realm, raw.realm)) continue;
      const rec5 = readHoldRecord(keyOf(raw.realm, raw.karta, raw.name));
      if (rec5 && !rec5.left) out7.push(rec5);
    } catch {
    }
  }
  return out7;
}
async function resolveRecord(hello, rec5, primary) {
  if (resolvedRealm(rec5.realm)) return;
  const listed = Array.isArray(hello?.standings) ? hello.standings : [];
  const fits = listed.filter(
    (e) => typeof e.realm === "string" && !sameRealm(e.realm, primary.realm) && String(e.standing ?? "").replace(/^.*:/, "") === rec5.name && (e.karta_seq == null || String(e.karta_seq) === String(rec5.karta))
  );
  if (fits.length === 1 && resolvedRealm(primary.realm))
    learnRealm(rec5.realm, String(fits[0].realm));
  else await resolveAgainstLed(rec5.realm);
}
async function besideBack(url, primary) {
  if (CFG.satellite) return;
  const recs = besideRecords(url, primary);
  if (!recs.length) return;
  const hello = await awaitHello(0);
  for (const rec5 of recs) {
    const key2 = keyOf(rec5.realm, rec5.karta, rec5.name);
    await resolveRecord(hello, rec5, primary);
    if (!otherRealm(primary.realm, rec5.realm)) {
      log(`seat beside ${key2}: its graph is not known as another one — not registered`);
      continue;
    }
    const r = await callTool(tool("channel"), {
      action: "register",
      realm: rec5.realm,
      karta: rec5.karta,
      name: rec5.name,
      ...placeFields(rec5)
    });
    standingLog(r.isError ? `beside not resumed ${key2}` : `resumed-from-disk beside ${key2}`);
    log(
      `seat beside ${key2} with the main one: ${r.isError ? `not back — ${short(r.text)}` : "back"}`
    );
  }
}

// js/bridge/refusal.ts
function refusalOf(reply2) {
  const r = reply2?.result?._meta?.[serverProtocol.refusal];
  if (!isObj(r) || !is.str(r.rule) || !is.num(r.status)) return null;
  return {
    ...typeof r.rule === "string" ? { rule: r.rule } : {},
    ...typeof r.status === "number" ? { status: r.status } : {},
    ...isObj(r.data) ? { data: r.data } : {}
  };
}
var SEAT_GONE_RULES = /* @__PURE__ */ new Set([
  "standing_already_ended",
  "standing_not_found",
  "standing_not_held"
]);
var seatAlreadyOff = (r) => !!r && (!!r.rule && SEAT_GONE_RULES.has(r.rule) || r.status === 410 || r.status === 404 && !r.rule);
var standingsInRealm = (r) => {
  if (r?.rule !== "channel_already_stands_in_realm") return [];
  const list3 = r.data?.your_standings;
  return Array.isArray(list3) ? list3.flatMap(
    (s2) => isObj(s2) && typeof s2.name === "string" && s2.name ? [s2.name] : []
  ) : [];
};
var openedConcurrently = (reply2) => {
  const r = reply2?.result?.isError ? refusalOf(reply2) : null;
  return !!r && !r.rule && r.status === 409;
};

// js/bridge/caseexit.ts
var LEAVE_CAP_MS = Number(process.env[envName("CASE_LEAVE_MS")]) || 1500;
var joined = scoped(() => /* @__PURE__ */ new Map());
var roomNo = (room) => room.replace(/^[#\u2116]\s*/, "");
function noteCaseEntry(name2, args, reply2) {
  if (reply2.result?.isError || name2 !== tool("case")) return;
  const a = args ?? {};
  if (a.action !== "join" && a.action !== "leave") return;
  const room = typeof a.room === "string" ? a.room.trim() : "";
  if (!room || a.action === "join" && room.startsWith("-")) return;
  const realm = typeof a.realm === "string" ? a.realm : void 0;
  const no = roomNo(room);
  for (const [k, c] of joined)
    if (roomNo(c.room) === no && !otherRealm(c.realm, realm)) joined.delete(k);
  if (a.action === "join") joined.set(`${realm ? canonRealm(realm) : ""}#${no}`, { realm, room });
  keepRecordCases();
}
function keepRecordCases() {
  const key2 = H2.currentKey;
  if (!CFG.satellite || !key2 || !H2.currentUrl) return;
  const rec5 = readHoldRecord(key2, true);
  if (!rec5 || rec5.left || rec5.url !== H2.currentUrl || !rec5.cases) return;
  writeHoldRecord(key2, { ...rec5, cases: joinedCases() }, true);
}
var joinedCases = () => [...joined.values()];
function seedJoined(cases) {
  for (const c of cases ?? [])
    if (c?.room) joined.set(`${c.realm ? canonRealm(c.realm) : ""}#${roomNo(c.room)}`, c);
}
async function leaveJoinedCases() {
  if (!CFG.satellite || !joined.size) return;
  const cases = [...joined.values()];
  joined.clear();
  const leaves = cases.map(async (c) => {
    try {
      const r = await callTool(tool("case"), { action: "leave", ...c });
      log(
        r.isError ? `could not leave case ${c.room} at the run's end: ${r.text.slice(0, 120)}` : `left case ${c.room} at the run's end (#6573)`
      );
    } catch (e) {
      log(`could not leave case ${c.room} at the run's end: ${e.message}`);
    }
  });
  if (!await underCap(Promise.allSettled(leaves)))
    log(
      `case leave at the run's end exceeded ${LEAVE_CAP_MS} ms — the place goes, the rest lapse by term`
    );
}
var satellitePlaces = () => CFG.satellite ? [
  // An evicted (4000) seat belongs to its taker: revoking it would remove theirs.
  H2.evictedKey && H2.evictedKey === H2.currentKey ? null : state.standing,
  ...extraPlaces().map((p) => p.standing)
].filter((s2) => !!s2?.name) : [];
async function revokeSatellitePlaces(places) {
  const failed = new Set(places);
  const revoked = [];
  const revokes = places.map(
    (s2) => callTool(tool("channel"), { action: "revoke", realm: s2.realm, karta: s2.karta, standing: s2.name }).then((r) => {
      const how2 = revokeOutcome(r);
      if (how2 === "failed")
        return log(`place ${s2.name} NOT revoked at the run's end: ${r.text.slice(0, 120)}`);
      failed.delete(s2);
      if (how2 === "probably")
        return log(`${s2.name} probably revoked at the run's end: ${r.text.slice(0, 120)}`);
      revoked.push({ realm: canonRealm(s2.realm), karta: normKarta(s2.karta), name: s2.name ?? "" });
      log(`revoked ${s2.name} in ${s2.realm} at the run's end (#6593)`);
    }).catch((e) => log(`place ${s2.name} NOT revoked at the run's end: ${e.message}`))
  );
  if (places.length && !await underCap(Promise.allSettled(revokes)))
    log(
      `revoke at the run's end exceeded ${LEAVE_CAP_MS} ms — the place lapses by the channel's term`
    );
  return { failed: [...new Set([...failed].map((s2) => s2.name))], revoked: [...revoked] };
}
var revokeOutcome = (r) => {
  if (!r.isError) return "confirmed";
  if (r.refusal) return seatAlreadyOff(r.refusal) ? "confirmed" : "failed";
  return CASE_EXIT_CLOSED.test(r.text) ? "probably" : "failed";
};
async function underCap(work) {
  let timer;
  const cap = new Promise((r) => timer = setTimeout(() => r("cap"), LEAVE_CAP_MS));
  const got = await Promise.race([work, cap]);
  clearTimeout(timer);
  return got !== "cap";
}

// js/bridge/holdkeep.ts
function keepHoldRecord() {
  const s2 = state.standing;
  const key2 = H2.currentKey;
  if (!s2 || !key2 || !H2.currentUrl) return;
  const alive6 = !!H2.holder?.alive;
  const at3 = alive6 ? Date.now() : Math.max(H2.holder?.heardAt ?? 0, H2.heardAt);
  const ch = { url: H2.currentUrl, statusUrl: H2.currentStatusUrl, cwd: H2.standCwd };
  const was = readHoldRecord(key2, true);
  if (was && at3 > (was.at ?? 0))
    writeHoldRecord(
      key2,
      {
        ...was,
        realm: s2.realm,
        karta: s2.karta,
        name: s2.name ?? "",
        url: ch.url,
        statusUrl: ch.statusUrl,
        cwd: ch.cwd ?? was.cwd,
        client: harnessName(),
        key: key2
      },
      false,
      at3
    );
  if (!alive6) return;
  for (const p of extraPlaces()) {
    const r = readHoldRecord(p.door.key, true);
    if (r) rememberExtraStatus(p.door.key, { ...ch, cwd: ch.cwd ?? r.cwd }, r.status ?? "");
  }
}
function signHeldRecord() {
  refreshHeldRecord();
  const key2 = H2.currentKey;
  if (!key2 || !H2.holder?.alive || !sessionOfBridge()) return;
  for (const k of [key2, ...extraPlaces().map((p) => p.door.key)]) {
    const rec5 = readHoldRecord(k);
    if (rec5 && !rec5.session && rec5.url === H2.currentUrl) writeHoldRecord(k, rec5);
  }
}
function refreshHeldRecord() {
  const key2 = H2.currentKey;
  if (!key2 || !H2.holder?.alive || !H2.currentUrl) return;
  const rec5 = readHoldRecord(key2, true);
  if (!rec5 || rec5.left || rec5.url !== H2.currentUrl) return;
  if (typeof rec5.at === "number" && Date.now() - rec5.at < HOLD_RECORD_MAX_AGE_MS / 2) return;
  writeHoldRecord(key2, { ...rec5, cases: CFG.satellite ? joinedCases() : rec5.cases }, CFG.satellite);
}

// js/bridge/lostplaces.ts
function placeWord(msg) {
  if (msg.method !== "notifications/message" || msg.params?.logger !== LOGGERS.channel) return null;
  const data = msg.params?.data;
  const realm = typeof data?.place?.realm === "string" ? data.place.realm.trim() : "";
  return typeof data?.kind === "string" ? { kind: data.kind, key: typeof data.key === "string" ? data.key : void 0, realm } : null;
}
var harnessSession = null;
function seeSession(msg) {
  const s2 = msg.params?.session;
  if ((msg.method === method("resume") || msg.method === method("check")) && typeof s2 === "string")
    harnessSession = s2.trim() || harnessSession;
  return msg;
}
var THIN_RESUME_ID = `${ID_PREFIX}thin-resume-`;
var resumeParams = (key2) => harnessSession ? { key: key2, session: harnessSession } : { key: key2 };
var resumeCall = (key2, n) => ({
  jsonrpc: "2.0",
  id: `${THIN_RESUME_ID}${n}`,
  method: method("resume"),
  params: resumeParams(key2)
});
function lostPlaces(say2, log3) {
  const live2 = /* @__PURE__ */ new Map();
  const lost = /* @__PURE__ */ new Map();
  return {
    live: live2,
    /**
     * The seat is taken again (held, beside) — its refusal lifted. A satellite's loss is
     * lifted by any satellite seat of the same graph: the bridge picks the .sub-N name.
     */
    regained(k, realm) {
      live2.set(k, realm);
      for (const [lk, e] of lost)
        if (lk === k || e.satellite && sameRealm(e.realm, realm)) lost.delete(lk);
    },
    /** `stopped` — the owner took the seat off (#7439): `why` is the stop word, no retake advice. */
    lose(k, realm, why, satellite, stopped = false) {
      const text2 = stopped ? why : satellite ? words(LOST).satellite(k) : words(LOST).seat(k, realm, why);
      lost.set(k, { realm, satellite, text: text2 });
      live2.delete(k);
      log3(text2);
      say2({
        jsonrpc: "2.0",
        method: "notifications/message",
        params: {
          level: "warning",
          logger: LOGGERS.channel,
          data: { kind: stopped ? "stopped" : "lost", key: k, text: text2 }
        }
      });
    },
    /** The thin bridge decides by it whether to learn graph names. */
    lostCount() {
      return lost.size;
    },
    /**
     * Fold a seat word reaching the thin bridge; returns heldKey after it. held with
     * another key drops the old key from live, else the next break would call it lost.
     * released from the daemon session while the harness lives is a daemon ending
     * without successor, not the agent leaving: the key stays so the takeover resumes
     * the seat by its hold record. The agent's real leave goes through the thin
     * bridge's own leave; death and eviction come as dead and evicted.
     */
    seen(place, heldKey2, daemonSession) {
      if ((place?.kind === "held" || place?.kind === "beside") && place.key) {
        if (place.kind === "held") {
          if (heldKey2 && heldKey2 !== place.key) live2.delete(heldKey2);
          heldKey2 = place.key;
        }
        this.regained(place.key, place.realm);
      } else if (place?.kind === "beside-gone" && place.key) live2.delete(place.key);
      else if (place && ["released", "dead", "evicted", "stopped"].includes(place.kind) && (!place.key || place.key === heldKey2) && !(place.kind === "released" && daemonSession)) {
        if (heldKey2) live2.delete(heldKey2);
        heldKey2 = null;
      }
      return heldKey2;
    },
    /**
     * Refusal of a tool call for a lost seat; null — let it pass. Only calls into a
     * lost graph; an unresolved name is refused asking for the full address (#5838).
     * The refusal carries the call's graph, not the first loss found.
     */
    refusal(msg) {
      if (!lost.size || msg.method !== "tools/call" || msg.params?.name === tool("stand"))
        return null;
      const r = msg.params?.arguments?.realm;
      if (typeof r !== "string" || !r.trim()) return null;
      const hit = [...lost.entries()].find(([, e]) => realmRelation(r, e.realm) === "same");
      if (hit) return hit[1].text;
      if ([...live2.values()].some((x) => realmRelation(r, x) === "same")) return null;
      return [...lost.values()].some((e) => realmRelation(r, e.realm) === "unknown") ? unresolvedWord(r, [...live2.values()]) : null;
    }
  };
}
function realmListAsk() {
  const asked = /* @__PURE__ */ new Set();
  return {
    /** The list call when losses exist; null — no losses or a call already in flight. */
    ask(lostCount, id) {
      if (!lostCount || asked.size) return null;
      const call = {
        jsonrpc: "2.0",
        id: id(),
        method: "tools/call",
        params: { name: tool("realm"), arguments: { action: "list" } }
      };
      asked.add(JSON.stringify(call.id));
      return call;
    },
    /** The answer to the own list call: true — consumed. */
    reply(msg, log3) {
      if (msg.method !== void 0 || msg.id === void 0 || msg.id === null) return false;
      if (!asked.delete(JSON.stringify(msg.id))) return false;
      const content = msg.result?.content;
      const text2 = (Array.isArray(content) ? content : []).map((c) => String(c?.text ?? "")).join("\n");
      if (msg.error || msg.result?.isError)
        log3(
          `the realm list came back refused instead of the list — rN and slugs stay unresolved: ${text2 || msg.error?.message || "?"}`
        );
      learnRealmList(text2);
      return true;
    },
    /** No answer will come (link broke) — allow asking again. */
    forget() {
      asked.clear();
    }
  };
}

// js/bridge/resumepick.ts
import { existsSync as existsSync6, readdirSync as readdirSync9, readFileSync as readFileSync21 } from "node:fs";
import { join as join19 } from "node:path";
function recordsFor(sel) {
  const dir2 = standingsDirOf(CFG.authDir);
  if (!existsSync6(dir2))
    return { own: [], sameDir: [], legacy: [], left: [], neighbour: [], stale: [] };
  const mine = harnessName();
  const led = ledKey();
  const byKey = [];
  const byCwd = [];
  const sameDir2 = [];
  const legacy = [];
  const left2 = [];
  const neighbour = [];
  for (const f of readdirSync9(dir2).filter((x) => x.endsWith(".hold"))) {
    try {
      const rec5 = JSON.parse(readFileSync21(join19(dir2, f), "utf8"));
      if (!rec5 || rec5.client !== mine) continue;
      const key2 = keyOf(rec5.realm, rec5.karta, rec5.name);
      const keyed3 = !!sel.key && (key2 === sel.key || formerKeysIn(rec5).includes(sel.key));
      const inDir = sameDir(rec5.cwd, sel.cwd);
      const stoodBy = !!sel.session && rec5.session === sel.session;
      if (!keyed3 && !inDir && !stoodBy) continue;
      const fresh2 = readHoldRecord(key2);
      if (!fresh2) continue;
      if (inDir) sameDir2.push(key2);
      if (fresh2.left) {
        left2.push(key2);
        continue;
      }
      const stoodHere = key2 === led || !!sel.session && fresh2.session === sel.session;
      const theirs = !!sel.session && !!fresh2.session && fresh2.session !== sel.session;
      if (keyed3 && theirs) neighbour.push(key2);
      else if (keyed3) byKey.push(fresh2);
      else if (stoodHere) byCwd.push(fresh2);
      else if (!fresh2.session) legacy.push(fresh2);
    } catch {
    }
  }
  const stale = [];
  let keyed2 = byKey;
  let bySession = byCwd.sort((a, b) => (b.at ?? 0) - (a.at ?? 0));
  if (CFG.satellite) {
    const role = (r) => `${r.realm}\0${String(r.karta)}`;
    const latest = /* @__PURE__ */ new Map();
    for (const r of [...byKey, ...byCwd]) {
      const had = latest.get(role(r));
      if (!had || eraOf(r) > eraOf(had)) latest.set(role(r), r);
    }
    const kept3 = (r) => {
      const top = latest.get(role(r));
      if (top === r || eraOf(top) <= eraOf(r)) return true;
      stale.push({ name: r.name, fresher: top.name });
      return false;
    };
    keyed2 = byKey.filter(kept3);
    bySession = byCwd.filter(kept3).sort((a, b) => eraOf(b) - eraOf(a));
  }
  return {
    own: [...keyed2, ...bySession],
    sameDir: sameDir2,
    legacy,
    left: left2,
    neighbour,
    stale
  };
}

// js/bridge/resumewords.ts
var resumeWords = new Proxy({}, {
  get: (_, k) => words(RESUME)[k]
});

// js/bridge/pauserecord.ts
var P2 = scoped(() => ({
  kind: null,
  /** the pause answer for a repeated request (already paused, seat released) */
  answer: null,
  /** the address turned by the re-arm connect (a lost ceiling too) */
  turned: null,
  /** the address last written into the pause record */
  written: "",
  write: null,
  connect: null
}));
var suspended = () => P2.kind !== null;
var handoverPauseKey = () => P2.kind === "handover" ? P2.answer?.key ?? null : null;
function pauseForHandover(why) {
  if (P2.kind) return;
  const key2 = pauseRecord("handover");
  if (key2)
    log(
      `satellite paused for the daemon handover (${why}): ${key2}, cases ${P2.answer?.cases ?? 0} — place and cases kept`
    );
}
function pauseRecord(kind) {
  const s2 = state.standing;
  const { currentKey: key2, currentUrl: url, currentStatusUrl: statusUrl2 } = H2;
  if (!CFG.satellite || !s2?.name || !key2 || !url) return null;
  const write = () => {
    const at3 = P2.turned ?? { url, statusUrl: statusUrl2 };
    const cases = joinedCases();
    P2.written = at3.url;
    P2.answer = { key: key2, cases: cases.length };
    writeHoldRecord(
      key2,
      {
        realm: s2.realm,
        karta: s2.karta,
        name: s2.name ?? "",
        url: at3.url,
        statusUrl: at3.statusUrl,
        client: harnessName(),
        key: key2,
        session: sessionOfBridge() ?? void 0,
        cases
      },
      true
    );
  };
  P2.write = write;
  write();
  P2.kind = kind;
  return key2;
}

// js/bridge/suspend.ts
function localSuspend(msg) {
  if (msg?.method !== method("suspend")) return null;
  const answer2 = (result) => ({ jsonrpc: "2.0", id: msg.id, result });
  const s2 = state.standing;
  const drained = P2.kind === "handover";
  if (drained) P2.kind = "suspend";
  else if (P2.kind && P2.answer) return Promise.resolve(answer2({ suspended: true, ...P2.answer }));
  const key2 = drained ? P2.answer?.key ?? null : pauseRecord("suspend");
  if (!key2 || !s2)
    return Promise.resolve(
      answer2({
        suspended: false,
        word: words(SUSPEND).noSeat()
      })
    );
  return rearmForPause(s2, drained).then((rearmed) => {
    if (rearmed) P2.write?.();
    log(
      `satellite paused for a plugin reload${drained ? " in the daemon handover" : ""}: ${key2}, cases ${P2.answer?.cases ?? 0} — place and cases kept, idle window ${rearmed ? `${PAUSE_TTL_S} s` : "unchanged"}`
    );
    return answer2({ suspended: true, ...P2.answer });
  });
}
var PAUSE_TTL_S = Math.floor(HOLD_RECORD_MAX_AGE_MS / 1e3);
var REARM_CAP_MS = 1e3;
async function rearmForPause(s2, drained) {
  const name2 = s2.name ?? "";
  if (!drained && !parkStanding(words(SUSPEND).reason())) return false;
  const args = {
    action: "connect",
    realm: s2.realm,
    karta: s2.karta,
    name: name2,
    ...placeFields({ realm: s2.realm, karta: String(s2.karta), name: name2 }, false, "connect"),
    ttl_seconds: PAUSE_TTL_S
  };
  const connect6 = callTool(tool("channel"), args).then((r2) => {
    if (!r2.isError && H2.currentUrl) P2.turned = { url: H2.currentUrl, statusUrl: H2.currentStatusUrl };
    if (drained) {
      releaseStanding(words(SUSPEND).reason(), false, false, false, true);
      P2.write?.();
    }
    return r2;
  });
  P2.connect = connect6;
  const r = await Promise.race([connect6, sleep(REARM_CAP_MS).then(() => null)]);
  if (!r || r.isError)
    log(`satellite pause: idle window not re-armed — ${r?.text ?? "no answer yet"}`);
  return !!r && !r.isError && !!P2.turned;
}
var SETTLE_CAP_MS = 3e3;
async function pauseSettled() {
  if (!P2.kind) return;
  if (P2.connect) await Promise.race([P2.connect.catch(() => {
  }), sleep(SETTLE_CAP_MS)]);
  const turned = !!P2.turned && P2.turned.url !== P2.written;
  P2.write?.();
  if (turned)
    log(`satellite pause: the late re-arm turned the address — the pause record follows it`);
}
function afterResume(key2) {
  if (!CFG.satellite || !key2) return;
  const rec5 = readHoldRecord(key2);
  seedJoined(rec5?.cases);
  if (rec5 && H2.currentKey === key2 && H2.currentUrl)
    writeHoldRecord(
      key2,
      { ...rec5, url: H2.currentUrl, statusUrl: H2.currentStatusUrl, cases: joinedCases() },
      true
    );
}

// js/bridge/resume.ts
var RJ = scoped(() => ({ lapsed: false }));
function takeLapsed() {
  const was = RJ.lapsed;
  RJ.lapsed = false;
  return was;
}
async function busyBack(rec5) {
  if (!rec5.status) return "";
  const me = sessionOfBridge();
  if (!me || rec5.session !== me) {
    rememberStatus("");
    return resumeWords.busyForeign();
  }
  const st = await publishStatus(rec5.status);
  const kept3 = st.doing ?? rec5.status;
  return st.ok ? resumeWords.busyRestored(kept3) : resumeWords.busyNotRestored(short(st.body));
}
async function resumeFromDisk(realm, karta, name2) {
  const key2 = keyOf(realm, karta, name2);
  const rec5 = readHoldRecord(key2);
  if (!rec5) return null;
  if (holdsKey(key2)) return null;
  const led = ledKey();
  if (led && led !== key2) return null;
  if (await localSocketAlive(localSocketPathOf(key2))) return null;
  const prev = state.standing;
  state.standing = { realm, karta, name: name2 };
  const prevCwd = rec5.cwd ? noteStandCwd(rec5.cwd) : null;
  if (rec5.base) noteSeatBase(key2, rec5.base);
  noteStoodAt(key2, rec5.stoodAt ?? rec5.at);
  noteResuming(1);
  try {
    holdStanding(rec5.url, rec5.statusUrl);
    const hello = await awaitHello(4e3);
    if (hello && holdsKey(key2)) {
      const pending2 = Number(hello.pending) || 0;
      const busy = await busyBack(rec5);
      log(`standing resumed from disk (${key2}), pending ${pending2}`);
      standingLog(`resumed-from-disk ${key2}: pending ${pending2}`);
      return { word: resumeWords.fromDisk(pending2, busy), pending: pending2 };
    }
  } finally {
    noteResuming(-1);
  }
  const onDisk2 = readHoldRecord(key2);
  const kept3 = onDisk2 !== null;
  log(
    kept3 ? `hold record for ${key2}: no hello in time — record kept as it was, the place is not taken` : `hold record for ${key2} is stale — dropped, the place is taken anew`
  );
  releaseStanding(holdWords().resumeFailed());
  if (onDisk2?.url === rec5.url) restoreHoldRecord(key2, rec5);
  state.standing = prev;
  if (rec5.cwd) noteStandCwd(prevCwd);
  return null;
}
async function registerBack(rec5) {
  const r = await callTool(tool("channel"), {
    action: "register",
    realm: rec5.realm,
    karta: rec5.karta,
    name: rec5.name,
    ...placeFields(rec5)
  });
  if (r.isError) return resumeWords.registerRefused(short(r.text));
  await besideBack(rec5.url, rec5);
  return "register";
}
var T3 = { takeOwn: null };
function wireTakeOwn(fn) {
  T3.takeOwn = fn;
}
var legacyWord = (names2) => names2.map((n) => resumeWords.legacy(n)).join("; ");
async function freeLegacy(recs) {
  const free = [];
  for (const r of recs) {
    const key2 = keyOf(r.realm, r.karta, r.name);
    if (!holdsKey(key2) && await localSocketAlive(localSocketPathOf(key2))) continue;
    free.push(r.name);
  }
  return free;
}
function stoppedOutcome(before, key2) {
  const word3 = stoppedSince(before, key2);
  return word3 ? { resumed: false, key: key2, stopped: true, word: word3 } : null;
}
async function backToParked(key2, how2) {
  const before = stopsNow();
  if (!returnToStanding(how2)) return { resumed: false, key: key2, word: resumeWords.failed() };
  const hello = await awaitHello(4e3);
  const stop = stoppedOutcome(before, key2);
  if (stop) return stop;
  return {
    resumed: true,
    key: key2,
    pending: Number(hello?.pending) || 0,
    word: resumeWords.returnedParked(hello ? Number(hello.pending) || 0 : null),
    own: true
  };
}
async function resumeBy(sel, register = true, takeOwn = false) {
  await canonHoldRecords();
  const { own: recs, sameDir: sameDir2, legacy: legacyRecs, left: left2, neighbour, stale } = recordsFor(sel);
  const staleWords = stale.map((x) => resumeWords.staleKey(x.name, x.fresher));
  for (const w5 of staleWords) log(`resume: ${w5}`);
  const refused = stale.length ? { refused: stale.map((x) => x.name) } : {};
  if (!recs.length) {
    const legacy = await freeLegacy(legacyRecs);
    const said2 = [resumeWords.noRecord(sel.key, sel.cwd)];
    if (neighbour.length) said2.push(resumeWords.neighbourKey(neighbour.join(", ")));
    else if (sel.key) {
      said2.push(resumeWords.rejoin());
      RJ.lapsed = true;
    }
    const foreign = sameDir2.filter((k) => !left2.includes(k));
    if (foreign.length) said2.push(resumeWords.foreignDir(foreign.join(", ")));
    if (left2.length) said2.push(resumeWords.left(left2.join(", ")));
    if (legacy.length) said2.push(legacyWord(legacy));
    return {
      resumed: false,
      word: said2.join(" — "),
      ...legacy.length ? { legacy } : {}
    };
  }
  const led = ledKey();
  const skipped = [];
  const elsewhere = [];
  for (const rec5 of recs) {
    const key2 = keyOf(rec5.realm, rec5.karta, rec5.name);
    const before = stopsNow();
    if (holdsKey(key2))
      return { resumed: true, key: key2, pending: 0, word: resumeWords.alreadyHolding(), own: true };
    if (isParked(rec5.realm, rec5.karta, rec5.name)) return backToParked(key2, resumeWords.byRecord());
    if (led && led !== key2) {
      skipped.push(resumeWords.otherSeat(key2, led));
      continue;
    }
    const holder = await localHolder(key2, sel.cwd ?? sessionCwd());
    if (holder === "session" && takeOwn && !CFG.satellite && T3.takeOwn) {
      const said2 = await T3.takeOwn(rec5, sel.cwd);
      const stop = stoppedOutcome(before, key2);
      if (stop) return stop;
      const now2 = ledKey();
      if (now2 && holdsKey(now2)) {
        const hello = await awaitHello(4e3);
        const busy = now2 === key2 ? await busyBack(rec5) : "";
        return {
          resumed: true,
          key: now2,
          pending: Number(hello?.pending) || 0,
          word: busy ? said2.replace(/\.$/, "") + busy : said2,
          own: true
        };
      }
      skipped.push(resumeWords.ownNotTaken(key2, short(said2)));
      continue;
    }
    if (holder) {
      skipped.push(resumeWords.liveBridge(key2));
      elsewhere.push(key2);
      continue;
    }
    const me = sel.session ?? sessionOfBridge();
    const proven = !!me && rec5.session === me || key2 === led && !rec5.session;
    const { back, registered } = await withSpoolHeld(async () => {
      const b = await resumeFromDisk(rec5.realm, rec5.karta, rec5.name);
      return { back: b, registered: b && register ? await registerBack(rec5) : null };
    });
    if (!back) {
      const stop = stoppedOutcome(before, key2);
      if (stop) return stop;
      const kept3 = readHoldRecord(key2);
      skipped.push(kept3 ? resumeWords.noHello(key2) : resumeWords.stale(key2));
      if (!kept3) {
        skipped.push(resumeWords.rejoin());
        RJ.lapsed = true;
      }
      continue;
    }
    const lines = [back.word, ...registered ? [registered] : []];
    const others = [
      .../* @__PURE__ */ new Set([...recs.map((r) => keyOf(r.realm, r.karta, r.name)), ...sameDir2])
    ].filter((k) => k !== key2 && readHoldRecord(k) !== null);
    if (others.length) lines.push(resumeWords.othersInDir(others.join(", ")));
    if (!proven) lines.push(resumeWords.notYours());
    lines.push(...staleWords);
    return {
      resumed: true,
      key: key2,
      pending: back.pending,
      word: lines.join("; "),
      others,
      own: proven
    };
  }
  return {
    resumed: false,
    word: resumeWords.nothingToReturn([...staleWords, ...skipped].join("; ")),
    ...refused,
    ...elsewhere.length ? { elsewhere } : {}
  };
}
function holdFromEnv() {
  const url = envOf(envName("CHANNEL_SOCKET"))?.trim();
  if (url) holdStanding(url, envOf(envName("CHANNEL_STATUS"))?.trim() || null);
}
var reply = (msg, result) => {
  const r = result;
  return {
    jsonrpc: "2.0",
    id: msg.id,
    result: r && (r.resumed || r.holding) ? { ...r, ...seatProof(ledKey()) } : result
  };
};
var selectorOf = (msg) => ({
  key: typeof msg.params?.key === "string" && msg.params.key.trim() ? msg.params.key.trim() : void 0,
  cwd: typeof msg.params?.cwd === "string" && msg.params.cwd.trim() ? msg.params.cwd.trim() : void 0,
  session: typeof msg.params?.session === "string" && msg.params.session.trim() ? msg.params.session.trim() : void 0
});
function selectorFrom(msg) {
  const sel = selectorOf(msg);
  noteHarnessSession(sel.session);
  signHeldRecord();
  return sel;
}
var isResumeCall = (msg) => msg?.method === method("resume");
var isCheckCall = (msg) => msg?.method === method("check");
async function runResume(msg) {
  const sel = selectorFrom(msg);
  if (!sel.key && !sel.cwd) return reply(msg, { resumed: false, word: resumeWords.noKeyNoCwd() });
  const replay2 = typeof msg.id === "string" && msg.id.startsWith(THIN_RESUME_ID);
  const r = await resumeBy(sel, true, !replay2);
  if (r.resumed) afterResume(r.key);
  return reply(msg, r);
}
async function runCheck(msg) {
  const sel = selectorFrom(msg);
  const s2 = state.standing;
  const key2 = s2 ? keyOf(s2.realm, s2.karta, s2.name ?? "") : null;
  if (!s2 || !key2 || !holdsKey(key2)) {
    if (s2 && key2 && isParked(s2.realm, s2.karta, s2.name ?? "")) {
      if (readHoldRecord(key2)?.left)
        return reply(msg, {
          holding: false,
          resumed: false,
          key: key2,
          word: resumeWords.leftByWord(key2)
        });
      const r2 = await backToParked(key2, resumeWords.watchdogReason());
      return reply(msg, { holding: r2.resumed, ...r2 });
    }
    if (!sel.key && !sel.cwd)
      return reply(msg, {
        holding: false,
        resumed: false,
        word: resumeWords.noSeatNoKeyNoCwd()
      });
    const r = await resumeBy(sel);
    return reply(msg, { holding: r.resumed, ...r });
  }
  const board = await callTool(tool("channel"), { action: "list", realm: s2.realm });
  if (board.isError)
    return reply(msg, { holding: true, key: key2, word: resumeWords.boardUnread(short(board.text)) });
  const mine = readBoard(board).entries.find(
    (e) => e.karta === String(s2.karta) && nameOf(e.address) === (s2.name ?? "")
  );
  if (!mine) return reply(msg, { holding: true, key: key2, word: resumeWords.noSeatOnBoard() });
  const pending2 = undelivered(mine);
  const listening2 = listens(mine);
  if (listening2) {
    D.reopens = 0;
    return reply(msg, { holding: true, key: key2, listening: listening2, pending: pending2, word: resumeWords.listening() });
  }
  if (D.reopens >= REOPEN_LIMIT) {
    const text2 = resumeWords.gaveUp(key2, REOPEN_LIMIT);
    if (!D.said) {
      D.said = true;
      standingLog(`reopen ${key2}: gave up after ${REOPEN_LIMIT} — board still reads deaf`);
      emit({
        jsonrpc: "2.0",
        method: "notifications/message",
        params: { level: "warning", logger: LOGGERS.channel, data: { kind: "lost", text: text2 } }
      });
    }
    return reply(msg, {
      holding: true,
      key: key2,
      listening: listening2,
      pending: pending2,
      reopened: false,
      stuck: true,
      word: text2
    });
  }
  D.reopens++;
  standingLog(`reopen ${key2}: board reads deaf${pending2 ? ` with ${pending2} pending` : ""}`);
  const before = stopsNow();
  parkStanding(resumeWords.deafBoard());
  resumeStanding();
  const hello = await awaitHello(4e3);
  const stop = stoppedOutcome(before, key2);
  if (stop) return reply(msg, { holding: false, ...stop });
  return reply(msg, {
    holding: true,
    key: key2,
    listening: listening2,
    pending: pending2,
    reopened: !!hello,
    word: resumeWords.reopened(hello ? Number(hello.pending) || 0 : null)
  });
}
var D = scoped(() => ({ reopens: 0, said: false }));
var REOPEN_LIMIT = 2;

// js/bridge/separate.ts
var sep2 = () => words(SEPARATE);
var baseOf2 = (realm, karta, name2) => seatBaseOf(keyOf(realm, karta, name2)) ?? name2;
var suffixed = (base, n) => base.slice(0, NAME_MAX - `.${n}`.length).replace(/[-._]+$/, "") + `.${n}`;
async function ownByRecord(realm, karta, name2, cwd) {
  const key2 = keyOf(realm, karta, name2);
  const rec5 = readHoldRecord(key2);
  const me = sessionOfBridge();
  if (!rec5) return false;
  const mine = me ? rec5.session === me || unsignedHere(rec5, cwd) : !rec5.session && rec5.client === harnessName() && sameDir(rec5.cwd, cwd);
  return mine && !await localSocketAlive(localSocketPathOf(key2));
}
var isTaken = (h) => h === "live" || h === "record" || h === "board" || h === "taken";
async function holderOf(realm, karta, name2, hearing, cwd) {
  await heardOnReturn();
  if (holdsStanding(realm, karta, name2) || isParked(realm, karta, name2)) return "mine";
  if (wasEvicted(realm, karta, name2)) return "board";
  const key2 = keyOf(realm, karta, name2);
  if (ledKey() === key2) return "mine";
  const local = await localHolder(key2, cwd);
  if (local) return local === "self" ? "mine" : local === "session" ? "session" : "live";
  if (theirsByRecord(key2)) return "record";
  const h = hearing(name2);
  if (h === "unknown") return "unknown";
  return h === "other" && !await ownByRecord(realm, karta, name2, cwd) ? "board" : "free";
}
function theirsByRecord(key2) {
  const rec5 = readHoldRecord(key2);
  return !!rec5?.session && !rec5.left && rec5.session !== sessionOfBridge();
}
async function placeFor(realm, karta, base, hearing, cwd, taken2 = /* @__PURE__ */ new Set(), root = base) {
  const holder = async (name2) => taken2.has(name2) ? "taken" : await holderOf(realm, karta, name2, hearing, cwd);
  const first2 = await holder(base);
  if (first2 === "unknown") return { refusal: sep2().unknown(base) };
  if (!isTaken(first2)) {
    const own = first2 === "session";
    return { name: base, own, note: own ? sep2().ownSession(base) : null };
  }
  const kin = first2 === "taken" ? null : first2;
  for (let n = 2; n <= 99; n++) {
    const cand = suffixed(root, n);
    if (cand === base) continue;
    const h = await holder(cand);
    if (isTaken(h)) continue;
    if (h === "unknown") return { refusal: sep2().unknown(cand) };
    const own = h === "session";
    return { name: cand, own, kin, note: sep2().beside(base, cand, own, kin) };
  }
  return { refusal: sep2().noFree(base) };
}
async function seatFor(realm, karta, base, hearing, besideRealm, cwd, root = base) {
  const taken2 = /* @__PURE__ */ new Set();
  for (; ; ) {
    const choice = await placeFor(realm, karta, base, hearing, cwd, taken2, root);
    if ("refusal" in choice || choice.own || besideRealm) return { choice, resumed: null };
    const at3 = choice.name;
    if (hearing(at3) !== "other" || !await ownByRecord(realm, karta, at3, cwd))
      return { choice, resumed: null };
    const resumed = await resumeFromDisk(realm, karta, at3);
    if (resumed)
      return {
        choice: at3 === base ? choice : { ...choice, note: sep2().beside(base, at3, true, choice.kin ?? null) },
        resumed
      };
    taken2.add(at3);
  }
}

// js/bridge/taking.ts
import { mkdirSync as mkdirSync11, readFileSync as readFileSync22, unlinkSync as unlinkSync14, writeFileSync as writeFileSync12 } from "node:fs";
import { dirname as dirname9 } from "node:path";
var pathOf = (key2) => takingFilePathOf(CFG.authDir, key2);
var alive3 = (pid) => {
  try {
    process.kill(pid, 0);
    return true;
  } catch (e) {
    return e.code === "EPERM";
  }
};
function takerOf(key2) {
  try {
    const t = JSON.parse(readFileSync22(pathOf(key2), "utf8"));
    return typeof t.session === "string" && alive3(t.pid) ? t.session : null;
  } catch {
    return null;
  }
}
var OWN = scoped(() => /* @__PURE__ */ new Map());
var ownTaking = (key2) => OWN.get(key2) ?? null;
function writeIntent(key2) {
  const session = sessionOfBridge();
  if (!session || CFG.satellite) return () => {
  };
  const path = pathOf(key2);
  try {
    mkdirSync11(dirname9(path), { recursive: true, mode: 448 });
    writeFileSync12(path, JSON.stringify({ session, pid: process.pid }) + "\n", { mode: 384 });
  } catch {
    return () => {
    };
  }
  return () => {
    try {
      unlinkSync14(path);
    } catch {
    }
  };
}
function beginTaking(args) {
  const action = String(args.action);
  const realm = typeof args.realm === "string" ? args.realm.trim() : "";
  if (!realm || action !== "connect" && action !== "mint") return () => {
  };
  const name2 = normName(args.name);
  const key2 = keyOf(realm, seatKarta(realm, args.karta, name2), name2);
  let settle2 = () => {
  };
  const done = new Promise((res) => settle2 = res);
  OWN.set(key2, done);
  const unfile = writeIntent(key2);
  let ended = false;
  return () => {
    if (ended) return;
    ended = true;
    if (OWN.get(key2) === done) OWN.delete(key2);
    unfile();
    settle2();
  };
}
async function takingSeat(args, fn) {
  const end = beginTaking(args);
  try {
    return await fn();
  } finally {
    end();
  }
}

// js/bridge/evicted.ts
var LOOK_MS = 100;
var RETRY_MS = 2e3;
function announceEvicted(code, text2) {
  log(text2);
  const ev = { kind: "evicted", code, text: text2 };
  H2.evictedEvent = ev;
  broadcast(ev);
  notify("warning", ev);
}
async function takenBySession(key2, url) {
  const me = sessionOfBridge();
  const ours = (r) => me ? r.session === me : !!r.session && r.client === harnessName() && sameDir(r.cwd, H2.standCwd ?? void 0);
  const changed = () => {
    const r = readHoldRecord(key2, true);
    return r && r.url !== url ? ours(r) : null;
  };
  for (; ; ) {
    const got = changed();
    if (got !== null) return got;
    const taker = takerOf(key2);
    if (me ? taker !== me : !taker) return changed() ?? false;
    await new Promise((res) => setTimeout(res, LOOK_MS));
  }
}
async function standBeside(key2, s2, name2, beside, once = false) {
  let moved2 = false;
  let reopened = false;
  let retry = once;
  for (; ; ) {
    if (!moved2 && !wasEvicted(s2.realm, s2.karta, name2)) return null;
    try {
      return await beside(s2, H2.standCwd);
    } catch (e) {
      moved2 ||= ledKey() !== key2;
      if (e instanceof UpstreamError && e.kind === "session" && !reopened) {
        reopened = true;
        const back = await reinitialize().then(
          () => true,
          () => false
        );
        if (back) continue;
      }
      const why = e instanceof Error ? e.message : String(e);
      standingLog(`evicted ${key2}: standing beside failed (${why})${retry ? "" : " — one retry"}`);
      if (retry) return { ok: false, text: why };
      retry = true;
      await new Promise((res) => setTimeout(res, RETRY_MS));
    }
  }
}
async function yieldPlace(key2, url, code) {
  const own = ownTaking(key2);
  if (own) {
    await own;
    if (H2.currentUrl !== url) return;
  }
  const s2 = state.standing;
  const beside = B2.beside;
  if (await takenBySession(key2, url)) {
    if (ledKey() !== key2) return;
    standingLog(`evicted ${key2} by this session's new bridge — released quietly`);
    releaseStanding(holdWords().takenBySession(), false, false, true);
    return;
  }
  const name2 = s2?.name ?? "";
  if (CFG.satellite || !s2 || !name2 || !beside)
    return announceEvicted(code, holdWords().evicted(code));
  const base = baseOf2(s2.realm, s2.karta, name2);
  announceEvicted(code, holdWords().evictedBeside(code, name2, base));
  F.failed = null;
  await besideAndSay(key2, s2, name2, base, beside, [...state.places]);
}
async function besideAndSay(key2, s2, name2, base, beside, extras3, once = false) {
  const r = await standBeside(key2, s2, name2, beside, once);
  if (!r) return;
  const others = [];
  if (r.ok)
    for (const x of extras3) {
      const again = await beside(x, H2.standCwd).catch((e) => ({
        ok: false,
        text: e instanceof Error ? e.message : String(e)
      }));
      others.push(
        holdWords().besideOther(`${x.name ?? ""} (${x.realm})`, !!again?.ok, again?.text ?? "")
      );
    }
  F.failed = r.ok ? null : { key: key2, s: s2, name: name2, base, extras: extras3 };
  const text2 = [
    r.ok ? holdWords().besideDone(name2, r.text) : holdWords().besideFailed(name2, base, r.text),
    ...others
  ].join("\n");
  log(text2);
  standingLog(`evicted ${key2}: ${r.ok ? "stood beside" : "could not stand beside"}`);
  notify("warning", { kind: "resumed", text: text2 });
}
var F = scoped(() => ({
  failed: null,
  again: null,
  /** The post-eviction move in flight — a harness call awaits it. */
  pending: null
}));
async function standBesideAgain() {
  if (F.pending) await F.pending;
  const s2 = state.standing;
  if (!s2 || !wasEvicted(s2.realm, s2.karta, s2.name ?? "")) {
    F.failed = null;
    return false;
  }
  const f = F.failed;
  const beside = B2.beside;
  if (f && beside && !F.again)
    F.again = besideAndSay(f.key, f.s, f.name, f.base, beside, f.extras, true).finally(() => {
      F.again = null;
    });
  if (F.again) await F.again;
  return !!state.standing && wasEvicted(state.standing.realm, state.standing.karta, state.standing.name ?? "");
}
function evictedRefusal(msg) {
  const s2 = state.standing;
  if (!s2 || !wasEvicted(s2.realm, s2.karta, s2.name ?? "")) return null;
  const realm = signedRealm(msg);
  if (realm == null || [s2, ...state.places].every((p) => otherRealm(realm, p.realm))) return null;
  return holdWords().evictedRefusal(s2.name ?? "", baseOf2(s2.realm, s2.karta, s2.name ?? ""));
}
var B2 = { beside: null };
whenEvicted((key2, url, code) => {
  F.pending = yieldPlace(key2, url, code).finally(() => {
    F.pending = null;
  });
});
function wireEviction(beside) {
  B2.beside = beside;
}

// js/bridge/standing.ts
var SEAT_EXPIRED = () => words(STANDING).seatExpired();
function noteStanding(msg, reply2) {
  const a = msg?.params?.arguments;
  if (msg?.params?.name !== tool("channel") || a?.action !== "register") return;
  if (reply2?.error || reply2?.result?.isError) return;
  const place = rememberedPlace(a.realm, a.karta, a.name);
  noteSkills(place, a.attrs?.skills);
  const prim = state.standing;
  if (prim && otherRealm(prim.realm, place.realm)) {
    rememberPlace(place);
    addPlace(place);
  } else state.standing = place;
  noteStandingId(place.realm, standingIdOf(reply2));
  state.standingSession = state.sessionId;
  debug(`standing remembered: ${a.name ?? "(unnamed)"} at karta ${a.karta} in ${a.realm}`);
}
function rememberedPlace(realm, karta, name2) {
  const k = normKarta(karta);
  const prev = [state.standing, ...state.places].find((p) => p && !otherRealm(p.realm, realm));
  const n = typeof name2 === "string" ? normName(name2) : void 0;
  return {
    realm: String(realm ?? ""),
    karta: k === "agent" && prev ? String(prev.karta) : k,
    ...n !== void 0 ? { name: n } : {}
  };
}
var R3 = scoped(() => ({ inFlight: null }));
async function ensureStanding() {
  if (state.standing && await standBesideAgain()) return;
  return replayStanding();
}
function replayStanding() {
  if (!state.standing || !state.sessionId) return Promise.resolve();
  if (state.standingSession === state.sessionId) return Promise.resolve();
  if (R3.inFlight) return R3.inFlight;
  R3.inFlight = (async () => {
    try {
      const deaf = await deafSeatTaken();
      if (deaf) return log(`standing not re-registered: ${deaf}`);
      const got = await replayRegister(state.standing);
      if (got && !got.error && !got.result?.isError) {
        if (await replayBeside()) state.standingSession = state.sessionId;
        log(`standing re-registered on the new session (${state.standing?.name ?? "unnamed"})`);
      } else if (seatIsGone(got)) {
        log(`the standing's seat is gone, forgetting it: ${replyText(got).slice(0, 200)}`);
        state.standing = null;
        releaseStanding(SEAT_EXPIRED(), true);
      } else {
        log(
          `could not re-register the standing this time, will retry before the next call: ${replyText(got).slice(0, 200)}`
        );
      }
    } catch (e) {
      log(`re-registering the standing failed: ${errorMessage(e)}`);
    } finally {
      R3.inFlight = null;
    }
  })();
  return R3.inFlight;
}
async function replayRegister(place, freshSkills = false) {
  const got = await registerOnce(place, freshSkills);
  if (!openedConcurrently(got)) return got;
  log("register refused by a concurrent opening (409, no rule) — registering again once");
  return registerOnce(place, freshSkills);
}
async function registerOnce(place, freshSkills) {
  const id = `${ID_PREFIX}bridge-restanding-${++state.reinitCounter}`;
  let reply2 = null;
  const arguments_ = { ...place, ...placeFields(place ?? {}, freshSkills), action: "register" };
  await post2(
    {
      jsonrpc: "2.0",
      id,
      method: "tools/call",
      params: {
        name: tool("channel"),
        arguments: arguments_
      }
    },
    (m) => {
      if (m.id === id) {
        reply2 = m;
        if (!m.error && !m.result?.isError && place) noteSkills(place, arguments_.attrs.skills);
      }
    }
  );
  return reply2;
}
async function replayBeside() {
  let whole = true;
  for (const place of [...state.places]) {
    const deaf = deafPlaceIn(place.realm) ? await deafSeatTaken(place) : null;
    if (deaf) {
      log(`place ${keyOfPlace(place)} not re-registered: ${deaf}`);
      continue;
    }
    const got = await replayRegister(place);
    if (got && !got.error && !got.result?.isError) continue;
    const key2 = keyOfPlace(place);
    if (seatIsGone(got)) {
      log(
        `the place ${key2} is gone at the platform, forgetting it: ${replyText(got).slice(0, 200)}`
      );
      dropExtra(key2, SEAT_EXPIRED(), true);
      state.places = state.places.filter((p) => keyOfPlace(p) !== key2);
    } else {
      whole = false;
      log(`could not re-register ${key2} this time, will retry: ${replyText(got).slice(0, 200)}`);
    }
  }
  return whole;
}
function standingIdOf(reply2) {
  return seatField(structuredOf(reply2), "register")?.seat_id ?? FORM.seatId.exec(replyText(reply2))?.[1] ?? null;
}
var replyText = (reply2) => {
  if (!reply2) return "";
  if (reply2.error) return JSON.stringify(reply2.error);
  const content = reply2.result?.content;
  return Array.isArray(content) ? content.map((c) => c?.text ?? "").join("\n") : JSON.stringify(reply2.result ?? "");
};
var seatIsGone = (reply2) => {
  const rule = refusalOf(reply2)?.rule;
  if (rule) return rule === "standing_not_held";
  return SEAT_GONE_RE.test(replyText(reply2));
};
var UNATTRIBUTED_CODE = /write_unattributed\w*|session_not_registered/;
var UNATTRIBUTED_REFUSAL = UNATTRIBUTED_RE;
var isUnattributed = (reply2) => {
  if (!reply2) return false;
  const rule = refusalOf(reply2)?.rule;
  if (rule) return UNATTRIBUTED_CODE.test(rule);
  const text2 = replyText(reply2);
  if (UNATTRIBUTED_CODE.test(text2)) return true;
  return !!reply2.result?.isError && UNATTRIBUTED_REFUSAL.test(text2);
};

// js/bridge/absorb.ts
var SOCKET_RE = /wss:\/\/[^\s"'`<>)\]]+|ws:\/\/(?:127\.0\.0\.1|\[?::1\]?|localhost)(?::\d+)?\/[^\s"'`<>)\]]+/;
var STATUS_RE = /https?:\/\/[^\s"'`<>)\]]+\/channel\/status\/[^\s"'`<>)\]]+/;
var trim2 = (s2) => s2.replace(/[.,;:!?»"')\]]+$/, "");
var hideAddresses = (text2) => text2.replace(new RegExp(SOCKET_RE.source, "g"), words(ABSORB).socketHidden()).replace(new RegExp(STATUS_RE.source, "g"), words(ABSORB).statusHidden());
function absorbChannelReply(msg, reply2) {
  const a = msg?.params?.arguments;
  if (msg?.params?.name !== tool("channel")) return reply2;
  if (a?.action !== "connect" && a?.action !== "mint") return reply2;
  if (reply2?.error || reply2?.result?.isError) return reply2;
  if (stoppedInMove()) return reply2;
  const text2 = replyText(reply2);
  const socket = SOCKET_RE.exec(text2)?.[0];
  if (!socket) return reply2;
  const status = STATUS_RE.exec(text2)?.[0];
  if (a.realm && a.karta != null) {
    state.standing = rememberedPlace(a.realm, a.karta, a.name);
  }
  const s2 = state.standing;
  if (s2 && keyOf(s2.realm, s2.karta, s2.name ?? "") !== H2.currentKey)
    noteStoodAt(keyOf(s2.realm, s2.karta, s2.name ?? ""), Date.now());
  holdStanding(trim2(socket), status ? trim2(status) : statusUrl(trim2(socket)));
  const block = listenBlock() ?? "";
  const content = reply2.result?.content;
  if (Array.isArray(content)) {
    for (const c of content) if (typeof c?.text === "string") c.text = hideAddresses(c.text);
    content.push({ type: "text", text: block.trim() });
  }
  return reply2;
}
function revokesOwn(msg) {
  const a = msg?.params?.arguments;
  if (msg?.params?.name !== tool("channel") || a?.action !== "revoke") return false;
  const s2 = state.standing;
  if (!s2 || besideKeyIn(a.realm)) return false;
  return names(a, s2) && !otherRealm(a.realm, s2.realm);
}
function names(a, s2) {
  const asked = typeof a.standing === "string" ? a.standing.trim() : "";
  const own = asked === "" || asked === "mine" || asked === (s2.name ?? "") || asked.endsWith(`:${s2.name ?? ""}`);
  return own && normKarta(a.karta ?? s2.karta) === normKarta(s2.karta);
}
function expectOwnRevoke(msg) {
  if (revokesOwn(msg)) setRevokingOwn(true);
  if (closesOwn(msg)) setClosingOwn(true);
  const beside = revokesBeside(msg);
  if (beside) {
    besideRevokes.set(msg, beside);
    setRevokingBeside(beside, true);
  }
}
var besideRevokes = /* @__PURE__ */ new WeakMap();
function revokesBeside(msg) {
  const a = msg?.params?.arguments;
  if (msg?.params?.name !== tool("channel") || a?.action !== "revoke") return null;
  const beside = extraIn(a.realm);
  return beside && names(a, beside.standing) ? beside.door.key : null;
}
function settleBesideRevoke(msg) {
  const key2 = besideRevokes.get(msg);
  if (!key2) return;
  besideRevokes.delete(msg);
  setRevokingBeside(key2, false);
}
function closesOwn(msg) {
  const a = msg?.params?.arguments;
  if (msg?.params?.name !== tool("channel") || a?.action !== "close") return false;
  const s2 = state.standing;
  return !!s2 && (!otherRealm(a.realm, s2.realm) || !!besideKeyIn(a.realm));
}
function settleOwnRevoke(msg) {
  if (msg?.params?.name !== tool("channel")) return;
  const action = msg.params.arguments?.action;
  if (action === "revoke") setRevokingOwn(false);
  if (action === "close") setClosingOwn(false);
  settleBesideRevoke(msg);
}
function absorbCloseReply(msg, reply2) {
  if (msg?.params?.name !== tool("channel") || msg?.params?.arguments?.action !== "close")
    return reply2;
  setClosingOwn(false);
  if (reply2?.error || reply2?.result?.isError || !closesOwn(msg)) return reply2;
  releaseStanding(holdWords().closedOwn(), true, false, true);
  state.standing = null;
  state.standingSession = null;
  log("channel closed by this session — released quietly, binding forgotten");
  return reply2;
}
function absorbRevokeReply(msg, reply2) {
  if (msg?.params?.name !== tool("channel") || msg?.params?.arguments?.action !== "revoke")
    return reply2;
  setRevokingOwn(false);
  settleBesideRevoke(msg);
  const a = msg.params.arguments;
  if (reply2?.error || reply2?.result?.isError) {
    const held2 = extraPlaces().map((p) => p.door.key);
    const content = reply2.result?.content;
    if (revokesOwn(msg) && held2.length && Array.isArray(content))
      content.push({
        type: "text",
        text: words(ABSORB).mainSeatHeld(state.standing?.name, held2.join(", "))
      });
    return reply2;
  }
  const beside = extraIn(a.realm);
  if (beside && names(a, beside.standing)) {
    dropExtra(beside.door.key, holdWords().revokedOwn(), true, "own");
    return reply2;
  }
  if (!revokesOwn(msg)) return reply2;
  const name2 = state.standing?.name ?? "unnamed";
  releaseStanding(holdWords().revokedOwn(), true, false, true);
  state.standing = null;
  state.standingSession = null;
  log(`standing revoked by this session — released quietly, binding forgotten (${name2})`);
  return reply2;
}

// js/bridge/call.ts
function leadsOtherPlace(realm, karta, name2) {
  const led = ledKey();
  const prim = state.standing;
  if (!led || !prim) return null;
  const ex = extraIn(realm);
  const beside = ex?.door.key;
  const s2 = ex ? ex.standing : prim;
  if (!ex && otherRealm(realm, prim.realm)) return null;
  const k = normKarta(karta);
  const n = normName(name2);
  const sameKarta = k === "agent" || k === String(s2.karta);
  return sameKarta && n === (s2.name ?? "") ? null : beside ?? led;
}
async function realmList() {
  const r = await callTool(tool("realm"), { action: "list" });
  return r.isError ? null : r.text;
}
async function resolveAgainstLed(realm) {
  const prim = state.standing;
  if (!prim || !ledKey() || String(realm ?? "").trim() === prim.realm) return;
  await resolveRealms([realm, prim.realm, ...state.places.map((p) => p.realm)], realmList);
}
var heldRealms = () => [state.standing, ...state.places].filter((s2) => !!s2).map((s2) => canonRealm(s2?.realm));
function unresolvedRefusal(realm) {
  if (!ledKey() || !state.standing) return null;
  const held2 = [state.standing, ...state.places];
  return held2.some((s2) => unknownRealm(realm, s2.realm)) ? unresolvedWord(realm, heldRealms()) : null;
}
function otherPlaceWord(led, asked, sameName = false, hearing = "free") {
  const w5 = words(CALL);
  const same2 = sameName ? w5.sameNamePrefix() : "";
  const advice = hearing !== "free" ? same2 + w5.heardAdvice(hearing === "other", asked, led) : led === asked ? w5.sameKeysAdvice() : sameName ? w5.sameNameAdvice() : w5.takeOtherAdvice();
  const Advice = `${advice.charAt(0).toUpperCase()}${advice.slice(1)}`;
  return w5.otherPlace(led, asked, Advice);
}
function besideRefusal(realm, how2) {
  const prim = state.standing;
  const led = ledKey();
  if (!led || !prim || !otherRealm(realm, prim.realm)) return null;
  if (how2 === "stand" && holdsChannel()) return null;
  return how2 === "connect" ? words(CALL).besideConnect(led) : words(CALL).besideStand(led);
}
var refusal = (msg, text2) => ({
  jsonrpc: "2.0",
  id: msg.id,
  result: { isError: true, content: [{ type: "text", text: text2 }] }
});
function crossPlaceRefusal(msg) {
  if (msg?.method !== "tools/call" || msg.params?.name !== tool("channel")) return null;
  const a = msg.params.arguments ?? {};
  if (!["connect", "mint", "register"].includes(String(a.action))) return null;
  const realm = typeof a.realm === "string" ? a.realm.trim() : "";
  const unresolved2 = unresolvedRefusal(realm);
  if (unresolved2) return refusal(msg, unresolved2);
  if (a.action !== "register") {
    const word3 = besideRefusal(realm, "connect");
    if (word3) return refusal(msg, word3);
  }
  const karta = normKarta(a.karta ?? state.standing?.karta ?? "");
  const name2 = normName(a.name);
  const led = leadsOtherPlace(realm, karta, name2);
  if (!led) return null;
  const asked = keyOf(realm, karta, name2);
  const sameName = name2 === (state.standing?.name ?? "");
  return refusal(msg, otherPlaceWord(led, asked, sameName, "unknown"));
}
var seq = 0;
async function ask(name2, args) {
  const id = `${OWN_CALL_PREFIX}${++seq}`;
  const msg = {
    jsonrpc: "2.0",
    id,
    method: "tools/call",
    params: { name: name2, arguments: args }
  };
  let reply2 = null;
  await post2(msg, (m) => {
    if (m.id === id) reply2 = m;
  });
  return { msg, got: reply2 };
}
var callTool = (name2, args) => name2 === tool("channel") ? takingSeat(args, () => answer(name2, args)) : answer(name2, args);
async function answer(name2, args) {
  let { msg, got } = await ask(name2, args);
  if (name2 === tool("channel") && args.action === "register" && openedConcurrently(got))
    ({ msg, got } = await ask(name2, args));
  if (!got) return { text: words(CALL).noReply(), isError: true };
  const structured = structuredOf(got);
  const refusal2 = refusalOf(got);
  if (name2 === tool("channel")) {
    noteLocaleEcho(args, replyText(got), structured);
    if (!got.error && !got.result?.isError) noteTaken(args);
    if (args.action === "register") noteStanding(msg, got);
    if (args.action === "connect") got = absorbChannelReply(msg, got);
  }
  return {
    text: replyText(got),
    isError: !!got.error || !!got.result?.isError,
    ...structured !== void 0 ? { structured } : {},
    ...refusal2 ? { refusal: refusal2 } : {}
  };
}
var short = (s2, n = 300) => s2.length > n ? `${s2.slice(0, n)}…` : s2;
var Q = scoped(() => ({ chain: Promise.resolve() }));
function serialized(fn) {
  const p = Q.chain.then(fn, fn);
  Q.chain = p.then(
    () => void 0,
    () => void 0
  );
  return p;
}

// js/bridge/status.ts
var isDirectory = (p) => {
  try {
    return isAbsolute(p) && statSync7(p).isDirectory();
  } catch {
    return false;
  }
};
var replyTo = (msg) => (body, isError = false) => ({
  jsonrpc: "2.0",
  id: msg.id,
  result: { ...isError ? { isError: true } : {}, content: [{ type: "text", text: body }] }
});
async function statusWord(text2, realm) {
  const st = await publishStatus(text2, realm);
  if (!st.ok && !statusAddress()) return [await notHeldHere(realm), true];
  if (st.code === 404) return [`${st.body} ${TURNED_GUIDANCE()}`, true];
  if (st.ok) return [busyLine(text2, realm), false];
  return [st.body, true];
}
function busyLine(text2, realm) {
  const a = S3.accepted.get(statusAddress(realm)?.key ?? "");
  const line = a?.sent === text2 ? a.doing : text2;
  const nudge = a?.sent === text2 && a.trimmed ? `; ${trimNudge(a.trimmed)}` : "";
  return words(STATUS).busyLine(placeLabel(realm), line, nudge);
}
function placeLabel(realm) {
  const a = statusAddress(realm);
  if (a?.place) return a.derived ? words(STATUS).placeDerived(a.place) : a.place;
  return words(STATUS).placeUnnamed(a?.name ?? "");
}
function localStatus(msg) {
  if (msg?.method !== "tools/call" || msg?.params?.name !== tool("channel")) return null;
  const a = msg.params?.arguments;
  if (a?.action !== "status") return null;
  const text2 = typeof a.text === "string" ? a.text : "";
  const reply2 = replyTo(msg);
  const realm = typeof a.realm === "string" ? a.realm : "";
  return (async () => {
    await resolveAgainstLed(realm);
    return reply2(...await statusWord(text2, realm));
  })();
}
async function standStatusOnly(msg) {
  const a = msg.params?.arguments ?? {};
  if (typeof a.status !== "string") return { miss: null };
  const unset2 = (v) => v == null || v === false || v === "";
  const extra = takingArgs(a);
  const realm = typeof a.realm === "string" ? a.realm.trim() : "";
  if (!realm) return { miss: null };
  await resolveAgainstLed(realm);
  const held2 = ledIn(realm);
  if (!held2) return { miss: { why: "none" } };
  if (extra.length) return { miss: { why: "args", args: extra } };
  if (!unset2(a.karta) && normKarta(a.karta) !== String(held2.karta)) return { miss: null };
  const asked = normName(a.name);
  if (asked && asked !== (held2.name ?? ""))
    return { miss: { why: "name", asked, held: held2.name ?? "" } };
  const of = normName(a.satellite_of);
  const base = /^(.+)\.sub-[1-9]\d*$/.exec(held2.name ?? "")?.[1];
  if (of && !(base && nameOf(of).startsWith(base))) return { miss: { why: "satellite" }, of };
  const [r, k, n] = [held2.realm, held2.karta, held2.name ?? ""];
  const seat2 = { realm: r, karta: k, name: n };
  if (isParked(r, k, n)) return { miss: { why: "parked", seat: seat2 } };
  if (!hasStatusAddressFor(r, k, n)) return { miss: { why: "elsewhere", seat: seat2 } };
  const cwd = typeof a.cwd === "string" ? a.cwd.trim() : "";
  if (cwd) {
    if (cwd !== process.cwd() && !isDirectory(cwd)) return { miss: { why: "cwd", cwd } };
    noteStandCwd(cwd);
  }
  const [said2, isError] = await statusWord(a.status.trim(), realm);
  const heard2 = holdsStanding(r, k, n);
  const why = wasEvicted(r, k, n) ? words(STATUS).evictedWhy() : words(STATUS).reopeningWhy();
  const body = isError || heard2 ? said2 : `${said2}; ${why}`;
  const listen2 = isError || !heard2 ? null : unheardListenBlock(realm);
  return { reply: replyTo(msg)(listen2 ? `${body}
${listen2}` : body, isError) };
}
function ledIn(realm) {
  const prim = state.standing;
  return prim && (prim.realm === realm || sameRealm(prim.realm, realm)) ? prim : extraIn(realm)?.standing;
}
var S3 = scoped(() => ({
  lastPublished: "",
  /** The last accepted line per seat (address key): sent, landed (the answer's doing) and trim. */
  accepted: /* @__PURE__ */ new Map()
}));
var publishedStatus = () => S3.lastPublished;
async function publishStatus(text2, realm, everyPlace = false) {
  const addr = statusAddress(realm);
  if (!addr) {
    return { ok: false, body: words(STATUS).notHeld() };
  }
  if (!everyPlace && !addr.standingId && heldPlaces().length > 1)
    return { ok: false, body: words(STATUS).noSeatId(addr.key) };
  const st = await publishStatusTo(addr.url, text2, 5e3, everyPlace ? EVERY : addr.standingId);
  if (st.ok) {
    const kept3 = st.doing ?? text2;
    S3.accepted.set(addr.key, { sent: text2, doing: kept3, trimmed: st.trimmed });
    if (addr.key === statusAddress()?.key) S3.lastPublished = kept3;
    rememberStatus(kept3, realm);
  }
  return st;
}
var TAKE_PATH = () => words(STATUS).takePath();
var TURNED_GUIDANCE = () => words(STATUS).turnedGuidance();
var slugOf = (realm) => realm.replace(/^@[^/]+\//, "");
async function heldElsewhere(realm) {
  const dir2 = standingsDirOf(CFG.authDir);
  if (!existsSync7(dir2)) return [];
  const anyRealm = !realm || /^r\d+$/.test(realm);
  const out7 = [];
  for (const f of readdirSync10(dir2).filter((x) => x.endsWith(".hold"))) {
    try {
      const rec5 = JSON.parse(readFileSync23(join20(dir2, f), "utf8"));
      if (!rec5?.realm || rec5.karta == null) continue;
      if (!anyRealm && slugOf(String(rec5.realm)) !== slugOf(realm)) continue;
      const key2 = keyOf(rec5.realm, rec5.karta, rec5.name ?? "");
      if (await localSocketAlive(socketPathOf(CFG.authDir, key2))) out7.push({ ...rec5, key: key2 });
    } catch {
    }
  }
  return out7;
}
async function notHeldHere(realm) {
  const others = await heldElsewhere(realm);
  if (!others.length) return words(STATUS).notHeldNone();
  const list3 = others.map((r) => {
    const where = [
      r.cwd && words(STATUS).whereCwd(r.cwd),
      r.client && words(STATUS).whereClient(r.client)
    ].filter(Boolean);
    return where.length ? `${r.key} (${where.join(", ")})` : r.key;
  }).join("; ");
  return words(STATUS).notHeldList(list3);
}

// js/bridge/update.ts
import { spawn as spawn2 } from "node:child_process";
import { existsSync as existsSync8, lstatSync as lstatSync3, readFileSync as readFileSync25 } from "node:fs";
import { homedir as homedir7 } from "node:os";
import { dirname as dirname11, join as join22 } from "node:path";
import { fileURLToPath as fileURLToPath4 } from "node:url";

// js/bridge/releases.ts
import { mkdirSync as mkdirSync12, readFileSync as readFileSync24, renameSync as renameSync11, writeFileSync as writeFileSync13 } from "node:fs";
import { dirname as dirname10, join as join21 } from "node:path";
var rw = () => words(RELEASES);
var RELEASES_URL = process.env[envName("BRIDGE_RELEASES_URL")]?.trim() || `https://api.github.com/repos/${SKILL_SET}/releases/latest`;
var RELEASES_PAGE_URL = process.env[envName("BRIDGE_RELEASES_PAGE_URL")]?.trim() || (process.env[envName("BRIDGE_RELEASES_URL")]?.trim() ? null : `https://github.com/${SKILL_SET}/releases/latest`);
var TAG_TTL_MS = 60 * 60 * 1e3;
var releaseTagPath = () => join21(dirname10(homeBridgePath()), "release-tag.json");
function writeAtomic(path, bytes) {
  mkdirSync12(dirname10(path), { recursive: true, mode: 448 });
  const tmp = `${path}.tmp-${process.pid}`;
  writeFileSync13(tmp, bytes, { mode: 420 });
  renameSync11(tmp, path);
}
var RateLimitError = class extends Error {
  limit;
  resetAt;
  constructor(message, limit, resetAt) {
    super(message);
    this.limit = limit;
    this.resetAt = resetAt;
  }
};
function resetWord(resetAt) {
  const min = resetAt ? Math.max(0, Math.ceil((resetAt - Date.now()) / 6e4)) : 0;
  return resetAt ? rw().reset(new Date(resetAt).toISOString(), min) : rw().noReset();
}
function rateLimitWord(limit, resetAt) {
  const per = limit ? rw().perHour(limit) : rw().anyHourly();
  return rw().exhausted(per, resetWord(resetAt));
}
function rateLimitOf(res) {
  if (res.status !== 403 && res.status !== 429) return null;
  const remaining = res.headers.get("x-ratelimit-remaining");
  const retrySec = Number(res.headers.get("retry-after"));
  if (remaining === "0") {
    const limit = Number(res.headers.get("x-ratelimit-limit")) || null;
    const resetSec = Number(res.headers.get("x-ratelimit-reset"));
    const resetAt = resetSec > 0 ? resetSec * 1e3 : retrySec > 0 ? Date.now() + retrySec * 1e3 : null;
    return new RateLimitError(rateLimitWord(limit, resetAt), limit, resetAt);
  }
  if (retrySec > 0 || res.status === 429) {
    const resetAt = retrySec > 0 ? Date.now() + retrySec * 1e3 : null;
    return new RateLimitError(rw().secondary(resetWord(resetAt)), null, resetAt);
  }
  return null;
}
async function tagFromApi() {
  const res = await fetch(RELEASES_URL, {
    headers: { accept: "application/vnd.github+json", "user-agent": `${BRIDGE_NAME}/${VERSION}` },
    signal: AbortSignal.timeout(15e3)
  });
  const limited = rateLimitOf(res);
  if (limited) throw limited;
  if (!res.ok) throw new Error(rw().httpFrom(res.status, RELEASES_URL));
  const body = await res.json();
  return body.tag_name?.trim() || null;
}
async function tagFromPage(url) {
  const res = await fetch(url, {
    redirect: "manual",
    headers: { "user-agent": `${BRIDGE_NAME}/${VERSION}` },
    signal: AbortSignal.timeout(15e3)
  });
  const location = res.headers.get("location") ?? "";
  const m = /\/releases\/tag\/([^/?#]+)/.exec(location);
  if (res.status < 300 || res.status >= 400 || !m)
    throw new Error(rw().noTag(res.status, url, location));
  return decodeURIComponent(m[1]);
}
function readReleaseTag() {
  try {
    const c = JSON.parse(readFileSync24(releaseTagPath(), "utf8"));
    return c.source === RELEASES_URL ? c : null;
  } catch {
    return null;
  }
}
function writeReleaseTag(c) {
  try {
    writeAtomic(releaseTagPath(), JSON.stringify(c, null, 2));
  } catch {
  }
}
async function resolveTag(force) {
  const cached = readReleaseTag();
  const now2 = Date.now();
  if (!force && cached?.tag && now2 - cached.checked_at < TAG_TTL_MS) return cached.tag;
  const knownLimit = cached?.api_limited_until && now2 < cached.api_limited_until ? new RateLimitError(
    cached.api_limit ? rateLimitWord(cached.api_limit, cached.api_limited_until) : rw().recordedByOther(resetWord(cached.api_limited_until)),
    cached.api_limit ?? null,
    cached.api_limited_until
  ) : null;
  let apiErr = knownLimit;
  if (!knownLimit) {
    try {
      const tag = await tagFromApi();
      writeReleaseTag({ source: RELEASES_URL, checked_at: Date.now(), tag, via: "api" });
      return tag;
    } catch (e) {
      apiErr = e;
    }
  }
  const limit = apiErr instanceof RateLimitError ? apiErr : null;
  const limitFields = limit?.resetAt ? { api_limited_until: limit.resetAt, api_limit: limit.limit } : {};
  if (RELEASES_PAGE_URL) {
    try {
      const tag = await tagFromPage(RELEASES_PAGE_URL);
      log(rw().fromPage(String(apiErr?.message), tag));
      writeReleaseTag({
        source: RELEASES_URL,
        checked_at: Date.now(),
        tag,
        via: "page",
        ...limitFields
      });
      return tag;
    } catch (e) {
      const both = `${apiErr?.message}; ${rw().fallback()} — ${e.message}`;
      apiErr = limit ? new RateLimitError(both, limit.limit, limit.resetAt) : new Error(both);
    }
  }
  if (limit?.resetAt)
    writeReleaseTag({
      source: RELEASES_URL,
      checked_at: cached?.checked_at ?? 0,
      tag: cached?.tag ?? null,
      ...cached?.via ? { via: cached.via } : {},
      ...limitFields
    });
  throw apiErr;
}

// js/bridge/update.ts
var uw = () => words(UPDATE);
var RAW_URL = process.env[envName("BRIDGE_RAW_URL")]?.trim() || `https://raw.githubusercontent.com/${SKILL_SET}`;
var CHECK_INTERVAL_MS = 6 * 60 * 60 * 1e3;
var FAILED_RETRY_MS = 15 * 60 * 1e3;
var envMs = (name2, dflt) => {
  const v = Number(process.env[name2]);
  return process.env[name2]?.trim() && Number.isFinite(v) && v >= 0 ? v : dflt;
};
var RETRY_FLOOR_MS = envMs(envName("BRIDGE_RETRY_FLOOR_MS"), 6e4);
var RETRY_JITTER_MS = envMs(envName("BRIDGE_RETRY_JITTER_MS"), 6e4);
var updatesDisabled = () => !!process.env[envName("BRIDGE_NO_UPDATE")];
var selfPath = () => fileURLToPath4(import.meta.url);
var opencodePluginPath = () => join22(homedir7(), ".config", "opencode", "plugins", PLUGIN_COPY_FILE);
var setupPathOf = (authDir) => join22(authDir, "SETUP.md");
var latestPathOf = (authDir) => join22(authDir, "latest.json");
var isSymlink = (path) => {
  try {
    return lstatSync3(path).isSymbolicLink();
  } catch {
    return false;
  }
};
var readBytes = (path) => {
  try {
    return readFileSync25(path);
  } catch {
    return Buffer.alloc(0);
  }
};
var readText = (path) => readBytes(path).toString("utf8");
var versionOf = (path) => versionIn(readText(path));
function syncHome(self = selfPath()) {
  const out7 = { copied: [] };
  const home = homeBridgePath();
  let mine;
  try {
    mine = readFileSync25(self);
  } catch {
    return out7;
  }
  if (!versionIn(mine.toString("utf8"))) return out7;
  if (self === home) return out7;
  if (isSymlink(home)) return out7;
  const homeVersion = versionOf(home);
  const cmp = homeVersion ? compareVersions(VERSION, homeVersion) : 1;
  const healsDev = cmp === 0 && devBuildIn(readText(home)) && !mine.equals(readBytes(home));
  if ((cmp > 0 || healsDev) && releaseBuild()) {
    writeAtomic(home, mine);
    out7.copied.push(home);
    const plugin = opencodePluginPath();
    const packaged = join22(dirname11(self), PLUGIN_FILE);
    if (existsSync8(plugin) && existsSync8(packaged)) {
      const fresh2 = readFileSync25(packaged);
      if (!readFileSync25(plugin).equals(fresh2)) {
        writeAtomic(plugin, fresh2);
        out7.copied.push(plugin);
      }
    }
  } else if (cmp < 0 && homeVersion) {
    out7.reexec = home;
  }
  return out7;
}
function reexec(path, argv2) {
  log(uw().reexecNewer(versionOf(path) ?? "?", VERSION, path));
  const root = skillsRoot();
  const child = spawn2(process.execPath, [path, ...argv2], {
    stdio: "inherit",
    env: {
      ...process.env,
      [envName("BRIDGE_REEXEC")]: "1",
      ...root ? { [SKILLS_ROOT_ENV]: root } : {}
    }
  });
  for (const sig of ["SIGTERM", "SIGINT", "SIGHUP"]) {
    process.on(sig, () => child.kill(sig));
  }
  child.on("exit", (code, signal) => process.exit(code ?? (signal ? 1 : 0)));
  child.on("error", (e) => {
    log(uw().restartFailed(e.message));
    process.exit(1);
  });
}
function readLatest(authDir) {
  try {
    return JSON.parse(readFileSync25(latestPathOf(authDir), "utf8"));
  } catch {
    return null;
  }
}
async function fetchText(url) {
  const res = await fetch(url, {
    headers: {
      accept: "application/vnd.github+json, text/plain, */*",
      "user-agent": `${BRIDGE_NAME}/${VERSION}`
    },
    signal: AbortSignal.timeout(15e3)
  });
  if (!res.ok) throw new Error(words(RELEASES).httpFrom(res.status, url));
  return res.text();
}
async function downloadRelease(tag, version, authDir) {
  const written = [];
  const base = `${RAW_URL}/${tag}`;
  const bridge = await fetchText(`${base}/skills/${BRIDGE_SKILL}/scripts/${BRIDGE_FILE}`);
  const got = versionIn(bridge);
  if (got !== version) throw new Error(uw().versionMismatch(got ?? "?", version));
  const home = homeBridgePath();
  const current2 = versionOf(home);
  if (!isSymlink(home) && (!current2 || compareVersions(version, current2) > 0)) {
    writeAtomic(home, bridge);
    written.push(home);
  }
  const plugin = opencodePluginPath();
  if (existsSync8(plugin)) {
    const fresh2 = await fetchText(`${base}/skills/${BRIDGE_SKILL}/scripts/${PLUGIN_FILE}`);
    if (readFileSync25(plugin, "utf8") !== fresh2) {
      writeAtomic(plugin, fresh2);
      written.push(plugin);
    }
  }
  const setup = await fetchText(`${base}/SETUP.md`);
  writeAtomic(setupPathOf(authDir), setup);
  written.push(setupPathOf(authDir));
  return written;
}
function checkExpiresAt(latest) {
  if (!latest.error) return latest.checked_at + CHECK_INTERVAL_MS;
  if (latest.rate_limited_until) return latest.rate_limited_until;
  return latest.checked_at + FAILED_RETRY_MS;
}
async function checkLatest(authDir, force = false) {
  const cached = readLatest(authDir);
  if (!force && cached && Date.now() < checkExpiresAt(cached)) return cached;
  const latest = { checked_at: Date.now(), version: null, tag: null, downloaded: [] };
  try {
    const tag = await resolveTag(force);
    latest.tag = tag;
    latest.version = tag ? tag.replace(/^v/, "") : null;
    if (latest.version && compareVersions(latest.version, VERSION) > 0) {
      latest.downloaded = await downloadRelease(tag, latest.version, authDir);
    } else if (force && tag) {
      writeAtomic(setupPathOf(authDir), await fetchText(`${RAW_URL}/${tag}/SETUP.md`));
      latest.downloaded = [setupPathOf(authDir)];
    }
  } catch (e) {
    latest.error = e.message;
    if (e instanceof RateLimitError) {
      latest.rate_limited = true;
      if (e.resetAt) latest.rate_limited_until = e.resetAt;
    }
  }
  try {
    writeAtomic(latestPathOf(authDir), JSON.stringify(latest, null, 2));
  } catch {
  }
  return latest;
}
function staleNotice(latest, authDir) {
  if (!latest?.version || compareVersions(latest.version, VERSION) <= 0) return null;
  const self = String(process.argv[1]);
  const bridgeWord = latest.downloaded.some((p) => p === homeBridgePath()) ? uw().bridgeDownloaded() : latest.error ? uw().downloadFailed(latest.error, self) : isSymlink(homeBridgePath()) ? uw().homeSymlink() : versionOf(homeBridgePath()) && compareVersions(versionOf(homeBridgePath()), latest.version) >= 0 ? uw().bridgeAlreadyHome() : uw().bridgeNotHome(self);
  const m = skillMoves();
  return uw().stale(
    VERSION,
    latest.version,
    bridgeWord,
    m.claude,
    m.flat,
    m.pi,
    m.codex,
    setupPathOf(authDir)
  );
}
var skillMoves = () => ({
  claude: uw().moveClaude(),
  flat: uw().moveFlat(),
  pi: uw().movePi(),
  codex: uw().moveCodex()
});
var N = scoped(() => ({ pending: null }));
function takeNotice() {
  const n = N.pending;
  N.pending = null;
  return n;
}
function pendNotice(notice) {
  N.pending = notice;
}
function tellNotice(notice) {
  N.pending = notice;
  emit({
    jsonrpc: "2.0",
    method: "notifications/message",
    params: { level: "warning", logger: LOGGERS.bridge, data: { kind: "stale", text: notice } }
  });
}
function startFreshnessWatch(authDir, serverUrl, tell2 = tellNotice, onChecked = () => {
}) {
  if (updatesDisabled()) return;
  const explicit = !!process.env[envName("BRIDGE_RELEASES_URL")]?.trim();
  if (!explicit && !isProductionServer(serverUrl)) {
    log(
      `releases not watched: ${serverUrl} is not a production address — another instance is another delivery`
    );
    return;
  }
  let retry = null;
  let told = null;
  const spread = Math.floor(Math.random() * RETRY_JITTER_MS);
  const tick = async () => {
    const latest = await checkLatest(authDir);
    if (retry) clearTimeout(retry);
    retry = null;
    if (latest?.error) {
      const wait = Math.min(
        CHECK_INTERVAL_MS,
        Math.max(RETRY_FLOOR_MS, checkExpiresAt(latest) - Date.now() + 1e3) + spread
      );
      retry = setTimeout(() => void tick(), wait);
      retry.unref();
    }
    onChecked();
    const notice = staleNotice(latest, authDir);
    if (!notice) return;
    if (latest?.error && notice === told) return;
    told = notice;
    log(notice);
    tell2(notice);
  };
  const delay = Number(process.env[envName("BRIDGE_UPDATE_DELAY_MS")] ?? 2e3);
  setTimeout(() => void tick(), Number.isFinite(delay) ? delay : 2e3).unref();
  setInterval(() => void tick(), CHECK_INTERVAL_MS).unref();
}

// js/bridge/engine.ts
function proxyWord() {
  const env2 = process.env;
  const proxy = env2.HTTPS_PROXY || env2.https_proxy || env2.HTTP_PROXY || env2.http_proxy;
  if (!proxy || process.versions.bun) return null;
  const [major = 0, minor = 0] = process.versions.node.split(".").map(Number);
  const reads = major > 24 || major === 24 && minor >= 5;
  const flags = [...process.execArgv, ...(env2.NODE_OPTIONS ?? "").split(/\s+/)];
  const on = env2.NODE_USE_ENV_PROXY === "1" || flags.includes("--use-env-proxy");
  if (reads && on) return null;
  return reads ? "a proxy is set (HTTP(S)_PROXY), but Node reads it only under NODE_USE_ENV_PROXY=1 — add that variable to the bridge's env in the harness config; until then calls go around the proxy" : `a proxy is set (HTTP(S)_PROXY), but Node ${process.versions.node} does not read it at all — Node 24.5+ with NODE_USE_ENV_PROXY=1 or the Bun runtime does; until then calls go around the proxy`;
}
function installCrashWords() {
  process.on("uncaughtException", (e) => log(`uncaught: ${e?.stack || e}`));
  process.on(
    "unhandledRejection",
    (e) => log(`unhandled rejection: ${e?.stack || String(e)}`)
  );
}
function fullBridgeSigint(leave) {
  let interrupted = false;
  return () => {
    if (CFG.satellite && leave && !interrupted) {
      interrupted = true;
      void leave("SIGINT");
      return;
    }
    const addr = statusAddress();
    const line = addr && !interrupted ? leavingLine(addr.url) : "none";
    releaseStanding("SIGINT");
    if (interrupted) process.exit(0);
    interrupted = true;
    const clearing = addr && line === "post" ? publishStatusTo(addr.url, "", 2e3).catch(() => {
    }) : line === "tick" ? released(1e3) : null;
    if (!clearing && tokenRequestsInFlight.size === 0) process.exit(0);
    Promise.allSettled([...tokenRequestsInFlight, ...clearing ? [clearing] : []]).then(
      () => process.exit(0)
    );
  };
}
function startEngine(cfg, opts = {}) {
  setConfig(cfg);
  installAuthLockExitHook();
  installRefreshLockExitHook();
  log(
    `${BUILD} -> ${CFG.serverUrl} (timeout ${CFG.timeoutMs}ms, ${CFG.pat ? `personal access token from ${CFG.patSource}` : `auth in ${storePath()}`})`
  );
  const proxy = proxyWord();
  if (proxy) log(proxy);
  startTokenKeepalive();
  if (opts.freshness !== false) startFreshnessWatch(CFG.authDir, CFG.serverUrl);
}

// js/bridge/fallback.ts
import { mkdirSync as mkdirSync13, readdirSync as readdirSync11, readFileSync as readFileSync26, unlinkSync as unlinkSync15, writeFileSync as writeFileSync14 } from "node:fs";
import { join as join23, resolve as resolve7 } from "node:path";
var fallbackDir = (authDir) => join23(resolve7(authDir), "fallback");
var alive4 = (pid) => {
  try {
    process.kill(pid, 0);
    return true;
  } catch (e) {
    return e.code === "EPERM";
  }
};
function pruneFallbacks(authDir) {
  let names2 = [];
  try {
    names2 = readdirSync11(fallbackDir(authDir));
  } catch {
  }
  for (const n of names2) {
    const pid = parseInt(n, 10);
    if (Number.isInteger(pid) && !alive4(pid))
      try {
        unlinkSync15(join23(fallbackDir(authDir), n));
      } catch {
      }
  }
}
function markFallback(authDir, f) {
  const file = join23(fallbackDir(authDir), `${process.pid}.json`);
  try {
    mkdirSync13(fallbackDir(authDir), { recursive: true, mode: 448 });
    pruneFallbacks(authDir);
    const rec5 = { pid: process.pid, since: (/* @__PURE__ */ new Date()).toISOString(), ...f };
    writeFileSync14(file, JSON.stringify(rec5), { mode: 384 });
    process.once("exit", () => {
      try {
        unlinkSync15(file);
      } catch {
      }
    });
  } catch {
  }
}
function readFallbacks(authDir) {
  let names2;
  try {
    names2 = readdirSync11(fallbackDir(authDir));
  } catch {
    return [];
  }
  const out7 = [];
  for (const n of names2) {
    try {
      const f = JSON.parse(readFileSync26(join23(fallbackDir(authDir), n), "utf8"));
      if (Number.isInteger(f.pid) && alive4(f.pid)) out7.push(f);
    } catch {
    }
  }
  return out7;
}

// js/bridge/orchestra.ts
import { mkdirSync as mkdirSync15, readFileSync as readFileSync28, writeFileSync as writeFileSync16 } from "node:fs";
import { join as join25 } from "node:path";

// js/bridge/orchestra-tact.ts
import { mkdirSync as mkdirSync14, readFileSync as readFileSync27, writeFileSync as writeFileSync15 } from "node:fs";
import { join as join24 } from "node:path";

// js/bridge/realmindex.ts
function realmIndexOf(listed) {
  const byShort = /* @__PURE__ */ new Map();
  const bySlug = /* @__PURE__ */ new Map();
  for (const it of listed) {
    const x = it;
    if (typeof x.slug !== "string" || typeof x.owner_handle !== "string") continue;
    const canon2 = `@${x.owner_handle}/${x.slug}`;
    if (typeof x.short_id === "number") byShort.set(x.short_id, canon2);
    bySlug.set(x.slug, [...bySlug.get(x.slug) ?? [], canon2]);
  }
  return { byShort, bySlug };
}
function canonIn(index, name2) {
  const t = name2.trim();
  const n = /^r(\d+)$/i.exec(t);
  if (n) return index.byShort.get(Number(n[1])) ?? null;
  const hits = index.bySlug.get(t) ?? [];
  return hits.length === 1 ? hits[0] : null;
}

// js/bridge/orchestra-tact.ts
var w = () => words(ORCHESTRA);
var LIMIT2 = 200;
var TIMEOUT_MS = 1e4;
var cursorsFile = (authDir) => join24(seamRunDir(authDir), "orchestra-cursors.json");
function readTactState(authDir) {
  try {
    const f = JSON.parse(readFileSync27(cursorsFile(authDir), "utf8"));
    if (f && typeof f === "object" && f.realms && typeof f.realms === "object") return f;
  } catch {
  }
  return { realms: {} };
}
function tactStateOf(authDir) {
  return readTactState(authDir);
}
async function getJson(base, token, path) {
  const res = await fetch(`${base}${path}`, {
    headers: { authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(TIMEOUT_MS)
  });
  if (!res.ok) throw new Error(String(res.status));
  return res.json();
}
var itemsOf = (v) => {
  if (Array.isArray(v)) return v;
  const items = v?.items;
  return Array.isArray(items) ? items : null;
};
async function resolveRealms2(base, token, realms) {
  const isShort = (r) => /^r\d+$/i.test(r.trim());
  const short2 = realms.filter(isShort);
  if (!short2.length) return { realms: [...new Set(realms)] };
  if (!token) return { unresolved: short2[0], why: "no key to the server" };
  const listed = itemsOf(await getJson(base, token, `/realms?limit=${LIMIT2}`));
  if (!listed) return { unresolved: short2[0], why: "realm list is not a list" };
  const canonById = realmIndexOf(listed).byShort;
  const out7 = [];
  for (const r of realms) {
    if (!isShort(r)) {
      out7.push(r);
      continue;
    }
    const canon2 = canonById.get(Number(r.trim().slice(1)));
    if (!canon2) return { unresolved: r, why: "not in the realm list" };
    out7.push(canon2);
  }
  return { realms: [...new Set(out7)] };
}
async function readRealm(base, token, realm, since) {
  const invited = itemsOf(
    await getJson(base, token, `/realms/${encodeURIComponent(realm)}/invites`)
  );
  if (!invited) throw new Error("invites: not a list");
  const q = new URLSearchParams({ limit: String(LIMIT2) });
  if (since) q.set("since", since);
  const raised = await getJson(
    base,
    token,
    `/realms/${encodeURIComponent(realm)}/raised?${q}`
  );
  const tape = itemsOf(raised);
  if (!tape) throw new Error("raised: not a list");
  const cursor = typeof raised.cursor === "string" && raised.cursor ? raised.cursor : since ?? null;
  return { realm, invites: invited.length, signals: tape, cursor };
}
function causesOf(signals) {
  const counts = /* @__PURE__ */ new Map();
  for (const s2 of signals) {
    const cause = typeof s2.cause === "string" ? s2.cause : "?";
    counts.set(cause, (counts.get(cause) ?? 0) + 1);
  }
  return [...counts].map(([cause, n]) => `${cause} ${n}`).join(", ");
}
async function stepTact(authDir, base, token, realms, gone) {
  if (!base) return { ok: false, said: w().stepNoApi() };
  let boundary = [...new Set(realms)];
  if (boundary.some((r) => /^r\d+$/i.test(r.trim()))) {
    try {
      const resolved = await resolveRealms2(base, token, boundary);
      if ("unresolved" in resolved)
        return { ok: false, said: w().stepUnresolvedRealm(resolved.unresolved, resolved.why) };
      boundary = resolved.realms;
    } catch (e) {
      const first2 = boundary.find((r) => /^r\d+$/i.test(r.trim())) ?? "?";
      return { ok: false, said: w().stepUnresolvedRealm(first2, e.message) };
    }
  }
  const state2 = readTactState(authDir);
  const reads = [];
  for (const realm of boundary) {
    if (gone?.gone) return { ok: false, said: w().stepGone() };
    try {
      if (!token) throw new Error("no key to the server");
      reads.push(await readRealm(base, token, realm, state2.realms[realm]?.cursor ?? null));
    } catch (e) {
      return { ok: false, said: w().stepReadError(realm, e.message) };
    }
  }
  if (gone?.gone) return { ok: false, said: w().stepGone() };
  const at3 = (/* @__PURE__ */ new Date()).toISOString();
  for (const r of reads)
    state2.realms[r.realm] = {
      cursor: r.cursor,
      at: at3,
      invites: r.invites,
      signals: r.signals.length
    };
  try {
    mkdirSync14(seamRunDir(authDir), { recursive: true, mode: 448 });
    writeFileSync15(cursorsFile(authDir), JSON.stringify(state2) + "\n", { mode: 384 });
  } catch (e) {
    return { ok: false, said: w().doorError(e.message) };
  }
  return {
    ok: true,
    said: w().step(
      reads.map((r) => w().tactRealm(r.realm, r.invites, r.signals.length, causesOf(r.signals))).join("; ")
    )
  };
}

// js/bridge/orchestra.ts
var w2 = () => words(ORCHESTRA);
var ORCHESTRA_ENV = envName("ORCHESTRA");
var orchestraAdmitted = () => {
  const v = process.env[ORCHESTRA_ENV]?.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes";
};
var flagFile = (authDir) => join25(seamRunDir(authDir), "orchestra.json");
function readOrchestraFlag(authDir) {
  try {
    const f = JSON.parse(readFileSync28(flagFile(authDir), "utf8"));
    if (f.on !== true && f.on !== false) return null;
    if (!Array.isArray(f.realms) || f.realms.some((x) => typeof x !== "string")) return null;
    return { on: f.on, realms: f.realms };
  } catch {
    return null;
  }
}
function writeOrchestraFlag(authDir, flag) {
  mkdirSync15(seamRunDir(authDir), { recursive: true, mode: 448 });
  writeFileSync16(flagFile(authDir), JSON.stringify({ on: flag.on, realms: flag.realms }) + "\n", {
    mode: 384
  });
}
function orchestraServe(authDir, net) {
  return async (op, realms, gone) => {
    if (op === "on") {
      if (!orchestraAdmitted()) return { ok: false, said: w2().notAdmitted() };
      const short2 = realms.filter((r) => /^r\d+$/i.test(r.trim()));
      if (short2.length) return { ok: false, said: w2().onShortRealm(short2.join(", ")) };
      const prior = readOrchestraFlag(authDir);
      const named3 = [.../* @__PURE__ */ new Set([...prior?.on ? prior.realms : [], ...realms])];
      writeOrchestraFlag(authDir, { on: true, realms: named3 });
      return { ok: true, said: w2().on(named3.join(", ")) };
    }
    if (op === "off") {
      writeOrchestraFlag(authDir, { on: false, realms: [] });
      return { ok: true, said: w2().off() };
    }
    if (op === "step") {
      const flag2 = readOrchestraFlag(authDir);
      if (!flag2?.on) return { ok: true, said: w2().stepEmpty() };
      const n = net ?? {
        base: () => "",
        token: () => null,
        realms: () => []
      };
      const boundary = [.../* @__PURE__ */ new Set([...flag2.realms, ...n.realms?.() ?? []])];
      if (!boundary.length) return { ok: true, said: w2().stepEmpty() };
      return stepTact(authDir, n.base(), n.token(), boundary, gone);
    }
    const flag = readOrchestraFlag(authDir);
    const tact = tactStateOf(authDir);
    const lines = Object.entries(tact.realms).map(
      ([realm, t]) => w2().tactOut(realm, t.invites, t.signals, t.cursor ?? "", t.at)
    );
    const named2 = flag?.realms ?? [];
    const found = [...new Set(net?.realms?.() ?? [])].filter((r) => !named2.includes(r));
    return {
      ok: true,
      said: w2().status(!!flag?.on, named2.join(", "), found.join(", "), lines.join("; "))
    };
  };
}

// js/bridge/orchestra-door.ts
import { chmodSync as chmodSync3, unlinkSync as unlinkSync16 } from "node:fs";
import { connect as connect4, createServer as createServer4 } from "node:net";
var w3 = () => words(ORCHESTRA);
async function listenOrchestraDoor(authDir, serve) {
  const path = orchestraDoorPath(authDir);
  if (process.platform !== "win32") {
    try {
      unlinkSync16(path);
    } catch {
    }
  }
  const server = createServer4((socket) => {
    let buf = "";
    socket.on("error", () => {
    });
    socket.on("data", (chunk) => {
      buf += chunk;
      const nl = buf.indexOf("\n");
      if (nl < 0) return;
      const line = buf.slice(0, nl);
      buf = "";
      let msg = {};
      try {
        msg = JSON.parse(line);
      } catch {
      }
      const op = typeof msg.op === "string" ? msg.op : "";
      const realms = Array.isArray(msg.realms) ? msg.realms.filter((x) => typeof x === "string") : [];
      if (op !== "on" && op !== "off" && op !== "status" && op !== "step") {
        socket.end(JSON.stringify({ ok: false, said: w3().unknownOp(op) }) + "\n");
        return;
      }
      const gone = { gone: false };
      socket.on("close", () => {
        gone.gone = true;
      });
      void serve(op, realms, gone).then((a) => socket.end(JSON.stringify(a) + "\n")).catch(
        (e) => socket.end(JSON.stringify({ ok: false, said: w3().doorError(e.message) }) + "\n")
      );
    });
  });
  await new Promise((resolve11, reject) => {
    server.once("error", reject);
    server.listen(path, () => resolve11());
  });
  if (process.platform !== "win32") chmodSync3(path, 384);
  return server;
}
function orchestraAsk(authDir, op, realms, timeoutMs = 5e3) {
  return new Promise((resolve11) => {
    let settled2 = false;
    const done = (a) => {
      if (settled2) return;
      settled2 = true;
      socket.destroy();
      resolve11(a);
    };
    const socket = connect4(orchestraDoorPath(authDir, false));
    socket.setTimeout(timeoutMs, () => done({ ok: false, said: w3().doorSilent() }));
    socket.on("error", () => done({ ok: false, said: w3().noDaemon() }));
    socket.on("connect", () => socket.write(JSON.stringify({ op, realms }) + "\n"));
    let buf = "";
    socket.on("data", (c) => {
      buf += c;
      const nl = buf.indexOf("\n");
      if (nl < 0) return;
      try {
        done(JSON.parse(buf.slice(0, nl)));
      } catch {
        done({ ok: false, said: w3().doorSilent() });
      }
    });
  });
}

// js/bridge/runend.ts
var R4 = scoped(() => ({
  run: null,
  /** the run's seats and busy address while a handover pause lasts */
  held: null
}));
function closeRun(why, handover) {
  return R4.run ??= (async () => {
    const addr = statusAddress();
    const places = satellitePlaces();
    const paused = suspended();
    const closing = (!handover || CFG.satellite) && !paused;
    const spent = closing || paused ? usagePlace() : null;
    if (!CFG.satellite) keepHoldRecord();
    const line = addr && closing ? leavingLine(addr.url) : "none";
    releaseStanding(why, CFG.satellite && !paused, false, false, paused);
    if (paused) R4.held = { places, addr };
    await Promise.all([paused ? null : leaveJoinedCases(), flushUsage(spent)]);
    const end = paused ? { failed: [], revoked: [] } : await revokeSatellitePlaces(places);
    if (addr && line === "post") await publishStatusTo(addr.url, "", 3e3).catch(() => {
    });
    if (line === "tick") await released(1e3);
    return end;
  })();
}
async function endUnreturnedPause(bridgePid, waitMs) {
  const key2 = handoverPauseKey();
  const held2 = R4.held;
  if (!key2 || !held2) return;
  const until = Date.now() + waitMs;
  for (; ; ) {
    if (handoverPauseKey() !== key2 || !readHoldRecord(key2)) return;
    if (await localSocketAlive(localSocketPathOf(key2))) return;
    if (!ownPidAlive(bridgePid)) break;
    if (Date.now() > until) return log(`handover pause of ${key2}: the bridge lives on — kept`);
    await sleep(200);
  }
  log(`handover pause of ${key2}: the bridge left in the handover window — the run ends`);
  dropHoldRecord(key2);
  await leaveJoinedCases();
  const { failed } = await revokeSatellitePlaces(held2.places);
  if (failed.length) log(`handover pause of ${key2}: NOT revoked ${failed.join(", ")}`);
  if (held2.addr) await publishStatusTo(held2.addr.url, "", 3e3).catch(() => {
  });
}
function localEnd(msg) {
  if (msg?.method !== method("end")) return null;
  const answer2 = (result) => ({ jsonrpc: "2.0", id: msg.id, result });
  if (!CFG.satellite || suspended()) return Promise.resolve(answer2({ ended: false }));
  return closeRun(words(RUN_END).pluginEnd(), false).then(({ failed, revoked }) => answer2({ ended: true, failed, revoked })).catch((e) => answer2({ ended: false, word: e.message }));
}

// js/bridge/provisional.ts
import { randomBytes as randomBytes4 } from "node:crypto";

// js/bridge/standwords.ts
var sw2 = () => words(STAND);
function boardHeaders() {
  const own = words(BOARD_HEADER);
  return [
    own,
    LANGS.filter((l) => BOARD_HEADER[l] !== own).map((l) => BOARD_HEADER[l]).join(", ")
  ];
}
function missWord(m, of) {
  const w5 = words(STAND_MISS);
  switch (m.why) {
    case "none":
      return w5.none();
    case "args":
      return w5.args(m.args.join(", "));
    case "name":
      return w5.name(m.asked, m.held);
    case "satellite":
      return w5.satellite(of ?? "?");
    case "cwd":
      return w5.cwd(m.cwd);
    case "parked":
      return w5.parked();
    case "elsewhere":
      return w5.elsewhere();
  }
}
var needRealmKarta = (miss, of) => sw2().needRealmKarta(miss ? ` ${missWord(miss, of)}` : "");

// js/bridge/standmoves.ts
var mw = () => words(STAND_MOVES);
var standCall = (realm, karta, name2) => `${tool("stand")}(realm="${realm}", karta=${karta}${name2 ? `, name="${name2}"` : ""})`;
function ledIn2(realm) {
  const prim = state.standing;
  return prim && sameRealm(prim.realm, realm) ? prim : extraIn(realm)?.standing;
}
var STANDS_IN_REALM = "channel_already_stands_in_realm";
async function releasePrior(realm, prior) {
  const name2 = prior.name ?? "";
  const beside = extraOf(realm, prior.karta, name2)?.door.key;
  const args = { action: "revoke", realm, karta: String(prior.karta), standing: name2 };
  if (beside) setRevokingBeside(beside, true);
  const r = await callTool(tool("channel"), args).finally(() => {
    if (beside) setRevokingBeside(beside, false);
  });
  if (!r.isError) {
    if (beside) dropExtra(beside, holdWords().revokedOwn(), true, "own");
    return { ok: true, note: mw().priorReleased(name2) };
  }
  return { ok: false, note: mw().priorKept(name2, short(r.text, 160), revokeCall(realm, prior)) };
}
var revokeCall = (realm, s2) => `${tool("channel")}(action="revoke", realm="${realm}", karta="${s2.karta}", standing="${s2.name ?? ""}")`;
function besideHoldsMain(realm, prior, asked) {
  const prim = state.standing;
  if (!prim || !sameRealm(prim.realm, realm) || prim.name !== prior.name) return null;
  const beside = extraPlaces().map((p) => p.standing);
  if (!beside.length) return null;
  return mw().besideHoldsMain(
    prior.name ?? "",
    asked,
    beside.map((s2) => `${s2.name ?? ""} (${s2.realm})`).join(", "),
    beside.map((s2) => revokeCall(s2.realm, s2)).join("; "),
    standCall(realm, prior.karta, prior.name ?? "")
  );
}
var REISSUE_MAX_S = 15;
function reissueThrottled(r) {
  if (!r.isError) return null;
  const rule = r.refusal?.rule;
  const hit = rule === "socket_reissue_throttled" || !rule && r.refusal?.status === 429 || r.text.includes("socket_reissue_throttled");
  if (!hit) return null;
  const said2 = Number(/retry in (\d+)\s*s/i.exec(r.text)?.[1] ?? NaN);
  return Math.min(Math.max(Number.isFinite(said2) ? said2 : 10, 1), REISSUE_MAX_S);
}
async function awaitReissue(seconds2, held2, stopped) {
  for (const end = Date.now() + seconds2 * 1e3; Date.now() < end; ) {
    const stop2 = stopped();
    if (stop2 || held2()) return { own: !stop2, stop: stop2 };
    await new Promise((r) => setTimeout(r, 200));
  }
  const stop = stopped();
  return { own: !stop && held2(), stop };
}
async function throughReissue(c, again, seat2, stopsBefore) {
  const throttle = reissueThrottled(c);
  if (!throttle) return { c, own: false, note: null };
  const t0 = Date.now();
  const { own, stop } = await awaitReissue(
    throttle,
    () => holdsStanding(seat2.realm, seat2.karta, seat2.name),
    () => stoppedDuring(stopsBefore)
  );
  if (stop) return { c, own, note: null };
  const seconds2 = Math.round((Date.now() - t0) / 1e3);
  return { c: own ? c : await again(), own, note: mw().reissueWaited(seconds2, own) };
}
function yourStandingsMove(r, realm) {
  const names2 = standingsInRealm(r.refusal);
  if (!names2.length) return null;
  const call = names2.map((n) => `${tool("stand")}(realm="${realm}", karta, name="${n}")`);
  return { call: call.join("; "), name: names2.join(", ") };
}
function refusedWord(what, r, realm, afterConnect) {
  if (r.refusal?.rule === STANDS_IN_REALM || r.text.includes(STANDS_IN_REALM)) {
    const yours = yourStandingsMove(r, realm);
    const led = yours || afterConnect !== void 0 ? void 0 : ledIn2(realm);
    const call = yours?.call ?? (led ? standCall(realm, led.karta, led.name ?? "") : "");
    const board = `${tool("channel")}(action="list", realm="${realm}")`;
    const leave = `${tool("channel")}(action="revoke", realm="${realm}", karta, standing=<${yours?.name ?? led?.name ?? "name"}>)`;
    return mw().standsInRealm(realm, call, board, leave, !!yours);
  }
  return afterConnect ?? sw2().refused(what, short(r.text));
}

// js/bridge/provisional.ts
function name(base) {
  const suffix = `.root-${randomBytes4(6).toString("hex")}`;
  return (base || "root").slice(0, NAME_MAX - suffix.length).replace(/[.-]+$/, "") + suffix;
}
var takesProvisional = (msg) => msg.params?.arguments?.provisional === true && typeof msg.id === "string" && msg.id.startsWith(SERVICE_ID);
function replacesProvisional(realm, own) {
  const led = ledIn2(realm);
  if (own || !led?.name) return false;
  const rec5 = readHoldRecord(keyOf(led.realm, led.karta, led.name), true);
  return rec5?.provisional === true && !!sessionOfBridge() && rec5.session === sessionOfBridge();
}
function noteStood(own, realm, karta, name2) {
  const key2 = keyOf(realm, karta, name2);
  const rec5 = readHoldRecord(key2, true);
  if (rec5) writeHoldRecord(key2, { ...rec5, provisional: own });
}
function restore(rec5) {
  if (rec5.provisional !== true || !rec5.session || rec5.session !== sessionOfBridge()) return;
  const led = ledIn2(rec5.realm);
  if (led?.name === rec5.name && String(led.karta) === String(rec5.karta))
    noteStood(true, led.realm, String(led.karta), rec5.name);
}
var releasedNote = (replaced, freed, prior) => replaced && freed.ok ? words(STAND_MOVES).provisionalReplaced(prior) : freed.note;

// js/bridge/stand.ts
import { statSync as statSync8 } from "node:fs";
import { isAbsolute as isAbsolute2 } from "node:path";

// js/bridge/knock.ts
var knocks = scoped(() => /* @__PURE__ */ new Map());
var KNOCK_REPEAT_AFTER_MS = Number(process.env[envName("STAND_KNOCK_REPEAT_MS")]) || 12e4;
var KNOCK_LIMIT = 2;
function resetKnocks(realm, karta, name2) {
  for (const k of [...knocks.keys()])
    if (k.startsWith(`${realm}|${karta}|${name2}|`)) knocks.delete(k);
}
async function knock(k) {
  const { realm, karta, name: name2, room, roomKarta } = k;
  const key2 = `${realm}|${karta}|${name2}|${room}`;
  const prior = knocks.get(key2);
  const waited = prior ? Date.now() - prior.at : Infinity;
  if (prior && prior.count >= KNOCK_LIMIT) return sw2().knockTwice(room);
  if (prior && !k.again) return sw2().knockSent(room, waited, KNOCK_REPEAT_AFTER_MS);
  if (prior && waited < KNOCK_REPEAT_AFTER_MS)
    return sw2().knockEarly(room, waited, KNOCK_REPEAT_AFTER_MS);
  if (!roomKarta) return sw2().knockNoRole(room, realm);
  const s2 = await callTool(tool("channel"), {
    action: "send",
    realm,
    karta: roomKarta,
    standing: room,
    text: "join"
  });
  if (s2.isError) return sw2().knockRefused(room, short(s2.text));
  knocks.set(key2, { at: Date.now(), count: (prior?.count ?? 0) + 1 });
  return sw2().knockDone(room, !!prior, short(s2.text, 200));
}

// js/bridge/orderjournal.ts
import {
  mkdirSync as mkdirSync16,
  readdirSync as readdirSync12,
  readFileSync as readFileSync29,
  renameSync as renameSync12,
  unlinkSync as unlinkSync17,
  writeFileSync as writeFileSync17
} from "node:fs";
import { join as join26 } from "node:path";
var ANSWER_WINDOW_MS = 6e4;
var RESTARTED = "bridge_restarted";
var alive5 = (pid) => {
  if (pid === process.pid) return true;
  if (typeof pid !== "number") return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (e) {
    return e.code === "EPERM";
  }
};
var KEEP_MS = 24 * 36e5;
var dir = () => join26(CFG.authDir, "orders");
var SAFE = /^[A-Za-z0-9_-]{1,80}$/;
var fileOf = (id) => SAFE.test(id) ? join26(dir(), `${id}.json`) : null;
function readOrder(id) {
  const f = fileOf(id);
  if (!f) return null;
  try {
    return JSON.parse(readFileSync29(f, "utf8"));
  } catch {
    return null;
  }
}
function writeOrder(e) {
  const f = fileOf(e.id);
  if (!f) return false;
  try {
    mkdirSync16(dir(), { recursive: true, mode: 448 });
    const tmp = `${f}.tmp-${process.pid}`;
    writeFileSync17(tmp, JSON.stringify(e), { mode: 384 });
    renameSync12(tmp, f);
    return true;
  } catch {
    return false;
  }
}
var isTerminal = (s2) => s2 !== "accepted";
var settled = (id) => {
  const e = readOrder(id);
  return !!e && isTerminal(e.state);
};
var sincePath = () => join26(dir(), "since");
function readSince(base) {
  try {
    const n = JSON.parse(readFileSync29(sincePath(), "utf8"))[base];
    return typeof n === "number" && Number.isInteger(n) && n > 0 ? n : 0;
  } catch {
    return 0;
  }
}
function writeSince(base, seq3) {
  let all2 = {};
  try {
    all2 = JSON.parse(readFileSync29(sincePath(), "utf8"));
  } catch {
  }
  try {
    mkdirSync16(dir(), { recursive: true, mode: 448 });
    const tmp = `${sincePath()}.tmp-${process.pid}`;
    writeFileSync17(tmp, JSON.stringify({ ...all2, [base]: seq3 }), { mode: 384 });
    renameSync12(tmp, sincePath());
  } catch {
  }
}
function unanswered(now2 = Date.now()) {
  let names2;
  try {
    names2 = readdirSync12(dir()).filter((n) => n.endsWith(".json"));
  } catch {
    return { left: [], watching: false };
  }
  const out7 = [];
  let watching = false;
  for (const n of names2) {
    const e = readOrder(n.slice(0, -".json".length));
    if (!e) continue;
    if (e.acked && now2 - e.at > KEEP_MS) {
      try {
        unlinkSync17(join26(dir(), n));
      } catch {
      }
      continue;
    }
    if (!isTerminal(e.state) && !alive5(e.pid)) {
      const end = { ...e, state: "unknown", reason: RESTARTED, acked: false };
      if (writeOrder(end)) out7.push(end);
      continue;
    }
    if (!isTerminal(e.state) && e.pid !== process.pid)
      watching ||= now2 < (e.until ?? e.at + ANSWER_WINDOW_MS);
    if (isTerminal(e.state) && !e.acked) out7.push(e);
  }
  return { left: out7, watching };
}

// js/bridge/orderack.ts
function windowEnd(o, at3) {
  const issued = Date.parse(o.issued_at ?? "");
  const seconds2 = o.ack_window_seconds ?? 0;
  const span = seconds2 > 0 ? seconds2 * 1e3 : ANSWER_WINDOW_MS;
  return (Number.isFinite(issued) ? issued : at3) + span;
}
var TIMEOUT_MS2 = 5e3;
var RETRY_MS2 = (process.env[envName("ORDER_RETRY_MS")] || "1000,2000,5000,15000,30000,60000").split(",").map(Number).filter((n) => Number.isFinite(n) && n > 0);
function headers() {
  const h = { "content-type": "application/json" };
  const token = bearer();
  if (token) h.authorization = `Bearer ${token}`;
  return h;
}
async function sendAck(base, id, state2, reason) {
  try {
    const res = await fetch(`${base}/me/orders/${encodeURIComponent(id)}/ack`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({
        state: state2,
        ...reason ? { reason_code: reason } : {},
        client_id: `${id}-${state2}`
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS2)
    });
    const body = await res.text().catch(() => "");
    if (res.ok) return "taken";
    if ([404, 409, 422].includes(res.status)) {
      log(`stop order ${id}: answer ${state2} not taken (${res.status}) — ${body.slice(0, 160)}`);
      return "taken";
    }
    log(`stop order ${id}: answer ${state2} refused (${res.status}) — repeated later`);
  } catch (e) {
    log(
      `stop order ${id}: answer ${state2} did not reach the api (${e.message}) — repeated later`
    );
  }
  return "later";
}
async function answerOutcome(e) {
  if (await sendAck(e.base, e.id, e.state, e.reason) === "taken") markTaken(e.id);
  else repeatLater();
}
function markTaken(id) {
  const e = readOrder(id);
  if (e && !e.acked) writeOrder({ ...e, acked: true });
}
var P3 = scoped(() => ({ timer: null, step: 0 }));
function repeatLater(now2 = false) {
  if (P3.timer) {
    if (!now2) return;
    clearTimeout(P3.timer);
  }
  const pause = now2 ? 0 : RETRY_MS2[Math.min(P3.step, RETRY_MS2.length - 1)];
  P3.timer = setTimeout(() => {
    P3.timer = null;
    void (async () => {
      const { left: left2, watching } = unanswered();
      let open = watching;
      for (const e of left2) {
        if (await sendAck(e.base, e.id, e.state, e.reason) === "taken") markTaken(e.id);
        else open = true;
      }
      if (!open) return void (P3.step = 0);
      P3.step++;
      repeatLater();
    })();
  }, pause);
  P3.timer.unref?.();
}

// js/bridge/modelclear.ts
function clearingRegister(send2, realm) {
  let kept3 = null;
  const register = async () => {
    const r = await send2();
    if (!r.isError) kept3 = await clearSeatModel(realm);
    return r;
  };
  return { register, kept: () => kept3 };
}
async function clearSeatModel(realm) {
  if (!satelliteWithoutModel()) return null;
  const id = standingIdIn(realm);
  const url = H2.currentUrl;
  const fail2 = (why) => {
    log(`seat model in ${realm} not cleared: ${why}`);
    return why;
  };
  if (!id || !url) return fail2("no seat id or channel");
  try {
    const res = await fetch(`${apiBase(url)}/standings/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { ...headers(), "x-nks-realm": apiRealm(realm) },
      body: JSON.stringify({ model: null }),
      signal: AbortSignal.timeout(TIMEOUT_MS2)
    });
    if (res.ok) return null;
    const body = (await res.text().catch(() => "")).trim().slice(0, 160);
    return fail2(body ? `${res.status}: ${body}` : String(res.status));
  } catch (e) {
    return fail2(e.message);
  }
}

// js/bridge/owner.ts
var OWNER_ENV = envName("BRIDGE_OWNER_ROLE");
var HUMAN2 = /* @__PURE__ */ new Set(["me", "realm-owner"]);
var OWNERS_PAGE = 100;
var known = scoped(() => /* @__PURE__ */ new Map());
var word2 = (what) => words(OWNER).refused(what, OWNER_ENV);
async function ownerRefusal(realm, karta) {
  if (envOf(OWNER_ENV)?.trim() === "1") return null;
  const k = normKarta(karta);
  if (!k || k === "agent") return null;
  if (HUMAN2.has(k)) return word2(words(OWNER).human(k));
  if (!/^\d+$/.test(k)) return null;
  const key2 = `${String(realm ?? "")}|${k}`;
  let owner = known.get(key2);
  if (owner === void 0) {
    const r = await ownersOf(realm, k);
    if (typeof r === "string") return words(OWNER).unread(k, short(r, 160));
    owner = r;
    known.set(key2, owner);
  }
  return owner ? word2(`karta=#${k}`) : null;
}
async function ownersOf(realm, k) {
  const s2 = await callTool(tool("search"), {
    realm,
    q: "",
    node_type: "karta",
    manifested_as: "svatantra",
    limit: OWNERS_PAGE,
    include_description: false
  });
  if (s2.isError) return s2.text;
  const seqs = [...s2.text.matchAll(/\(#(\d+)[,)]/g)].map((m) => m[1]);
  if (seqs.length >= OWNERS_PAGE) return words(OWNER).incomplete();
  return seqs.includes(k);
}

// js/bridge/standagain.ts
async function formerSeat(realm, karta) {
  const cwd = sessionCwd();
  const me = sessionOfBridge();
  const client = harnessName();
  const recs = holdRecordsWhere(
    (r) => !!r.realm && r.cwd === cwd && (!karta || String(r.karta) === karta) && (!r.client || !client || r.client === client) && (!r.session || r.session === me)
  );
  await resolveRealms([realm, ...recs.map((r) => r.realm)], async () => {
    const r = await callTool(tool("realm"), { action: "list" });
    return r.isError ? null : r.text;
  });
  const best = recs.filter((r) => sameRealm(r.realm, realm)).sort((a, b) => (b.at ?? 0) - (a.at ?? 0))[0];
  return best ? { realm: best.realm, karta: best.karta, name: best.name } : null;
}
async function standAgainWord(realm, karta, miss) {
  if (!realm || !miss || !["none", "parked", "elsewhere"].includes(miss.why)) return "";
  const seat2 = "seat" in miss ? miss.seat : await formerSeat(realm, karta);
  const call = seat2 ? standCall(seat2.realm, seat2.karta, seat2.name ?? "") : "";
  return call ? ` ${words(STAND_MOVES).standAgain(call)}` : "";
}

// js/bridge/standundo.ts
var mw2 = () => words(STAND_MOVES);
var heldAddress = (realm, prior) => prior && holdsStanding(realm, prior.karta, prior.name ?? "") && H2.currentUrl ? { url: H2.currentUrl, statusUrl: H2.currentStatusUrl } : null;
async function connectInMove(before, seat2, again, first2) {
  const re = await throughReissue(await first2(), again, seat2, before);
  return { ...re, taken: !re.c.isError && !re.own ? seat2 : null };
}
async function dropTaken(seat2) {
  const { realm, karta, name: name2 } = seat2;
  const own = holdsStanding(realm, karta, name2);
  if (own) setRevokingOwn(true);
  const args = { action: "revoke", realm, karta: String(karta), standing: name2 };
  const r = await callTool(tool("channel"), args).finally(() => {
    if (own) setRevokingOwn(false);
  });
  if (r.isError && !own && H2.stopped.key === keyOf(realm, karta, name2)) return null;
  if (r.isError) return mw2().moveNotUndone(name2, short(r.text, 160), revokeCall(realm, seat2));
  if (own && holdsStanding(realm, karta, name2)) forgetSeat(holdWords().revokedOwn());
  return null;
}
async function stopGuard(msg, run2) {
  const before = stopsNow();
  const outer = { since: H2.moveSince, taken: H2.taken };
  H2.moveSince = outer.since ?? before;
  H2.taken = [];
  let reply2;
  let taken2;
  try {
    reply2 = await run2();
  } finally {
    taken2 = H2.taken ?? [];
    Object.assign(H2, { moveSince: outer.since, taken: outer.taken });
  }
  const stop = stoppedDuring(before);
  if (!stop) {
    outer.taken?.push(...taken2);
    return reply2;
  }
  const left2 = [];
  for (const seat2 of taken2) {
    const word3 = await dropTaken(seat2);
    if (word3) left2.push(word3);
  }
  forgetSeat(stop);
  const text2 = [stop, ...left2].join("\n");
  return {
    jsonrpc: "2.0",
    id: msg.id,
    result: { isError: true, content: [{ type: "text", text: text2 }] }
  };
}
async function registerRefused(r, realm, taken2, prior, addr) {
  const text2 = short(r.text);
  if (!taken2 || !prior) return refusedWord("register", r, realm, sw2().takenButRegister(text2));
  const refusal2 = refusedWord("register", r, realm, sw2().refused("register", text2));
  if (stoppedInMove()) return refusal2;
  const left2 = await dropTaken(taken2);
  if (left2) return `${refusal2}
${left2}`;
  if (stoppedInMove()) return refusal2;
  state.standing = { ...prior };
  if (addr) holdStanding(addr.url, addr.statusUrl);
  const back = await callTool(tool("channel"), {
    action: "register",
    ...prior,
    ...placeFields(prior, true)
  });
  const word3 = mw2().moveUndone(taken2.name, prior.name ?? "");
  return `${refusal2}
${back.isError ? `${word3} register: ${short(back.text, 160)}` : word3}`;
}

// js/bridge/standtool.ts
var STAND_TOOL_NAME = tool("stand");
var str2 = (description) => ({ type: "string", description });
var standTool = () => {
  const w5 = words(STAND_TOOL);
  return {
    name: STAND_TOOL_NAME,
    description: w5.description(),
    inputSchema: {
      type: "object",
      properties: {
        realm: str2(w5.realm()),
        karta: str2(w5.karta()),
        name: str2(w5.name()),
        room: str2(w5.room()),
        model: str2(w5.model()),
        mute_siblings: { type: "boolean", description: w5.muteSiblings() },
        take: { type: "boolean", description: w5.take() },
        room_karta: str2(w5.roomKarta()),
        repeat_knock: { type: "boolean", description: w5.repeatKnock() },
        satellite_of: str2(w5.satelliteOf()),
        status: str2(w5.status()),
        cwd: str2(w5.cwd())
      },
      required: ["realm"]
      // karta only takes a seat; busyness on a held seat goes without it (graph @nks/nks-dev, node #6509)
    }
  };
};

// js/bridge/stand.ts
var R5 = scoped(() => ({ again: false }));
var ledName = () => state.standing?.name ?? "";
var isDirectory2 = (p) => {
  try {
    return isAbsolute2(p) && statSync8(p).isDirectory();
  } catch {
    return false;
  }
};
var isStandCall = (msg) => msg?.method === "tools/call" && msg?.params?.name === tool("stand");
var runStand = (msg) => stopGuard(msg, () => standOnce(msg));
async function standOnce(msg) {
  const statusOnly = await standStatusOnly(msg);
  if ("reply" in statusOnly) return statusOnly.reply;
  const a = msg.params?.arguments ?? {};
  const auto = takesProvisional(msg);
  const stopsBefore = stopsNow();
  let realm = typeof a.realm === "string" ? a.realm.trim() : "";
  let karta = a.karta != null ? normKarta(a.karta) : "";
  const lines = [];
  const done = (isError = false) => ({
    jsonrpc: "2.0",
    id: msg.id,
    result: {
      ...isError ? { isError: true } : {},
      ...isError ? {} : { structuredContent: seatProof(heldKey(realm)) },
      content: [{ type: "text", text: lines.join("\n") }]
    }
  });
  if (!realm || !karta) {
    lines.push(
      needRealmKarta(statusOnly.miss, statusOnly.of) + await standAgainWord(realm, karta, statusOnly.miss)
    );
    return done(true);
  }
  const model = typeof a.model === "string" && a.model.trim() ? a.model : void 0;
  rememberStandModel(model);
  const cwd = typeof a.cwd === "string" && a.cwd.trim() ? a.cwd.trim() : sessionCwd();
  if (cwd !== sessionCwd() && !isDirectory2(cwd)) {
    lines.push(sw2().badCwd(cwd, !isAbsolute2(cwd)));
    return done(true);
  }
  const nameNotes = [];
  const asked = normName(a.name);
  if (asked) {
    const fault = nameFault(asked);
    if (fault) {
      lines.push(sw2().badName(asked, fault, NAME_MAX));
      return done(true);
    }
  }
  realm = await seatRealm(realm);
  const notOwner = await ownerRefusal(realm, karta);
  if (notOwner) return lines.push(notOwner), done(true);
  const gate = await satelliteGate(a, realm, karta, asked);
  if (gate && !gate.ok) {
    lines.push(gate.refusal);
    return done(true);
  }
  const sat = gate?.ok ? { name: gate.name, caller: gate.caller } : null;
  if (gate?.ok) nameNotes.push(...gate.notes);
  const parts = asked || sat ? null : deriveParts(model, cwd);
  const fitted = parts ? fitName(parts) : null;
  const derived = asked || sat ? "" : fitted?.name ?? "";
  let name2 = asked || sat?.name || (auto ? name(derived) : derived);
  const base = sat ? "" : name2;
  karta = seatKarta(realm, karta, name2);
  const led0 = state.standing && !otherRealm(state.standing.realm, realm) ? state.standing : null;
  const ledSuffix = !!base && !!led0 && String(led0.karta) === String(karta) && led0.name !== base && baseOf2(led0.realm, led0.karta, led0.name ?? "") === base;
  const besideTaken = ledSuffix && !!led0 && wasEvicted(led0.realm, led0.karta, led0.name ?? "");
  if (ledSuffix && !besideTaken && a.take !== true) name2 = led0?.name ?? name2;
  const ledThere = sat ? void 0 : ledIn2(realm);
  const replaces = replacesProvisional(realm, auto);
  const prior = (a.take === true || replaces) && ledThere?.name && (ledThere.name !== name2 || String(ledThere.karta) !== karta) ? { ...ledThere } : null;
  if (parts && fitted && fitted.cut.length) {
    const what = fitted.cut.map((k) => sw2().cutPart(k)).join(", ");
    nameNotes.push(sw2().nameCut(joinName(parts), NAME_MAX, name2, what));
  }
  if (!asked && !sat && !model) nameNotes.push(sw2().noModel());
  const room = typeof a.room === "string" && a.room.trim() ? a.room.trim() : null;
  const unresolved2 = unresolvedRefusal(realm) ?? unresolvedAgent(karta, "connect");
  if (unresolved2) return lines.push(unresolved2), done(true);
  const led = besideTaken ? null : leadsOtherPlace(realm, karta, name2);
  if (led && a.take !== true && !replaces) {
    const hearing2 = await askedHearing(realm, karta, name2, cwd);
    lines.push(otherPlaceWord(led, keyOf(realm, karta, name2), name2 === ledName(), hearing2));
    return done(true);
  }
  const noChannel = besideRefusal(realm, "stand");
  if (noChannel) {
    lines.push(noChannel);
    return done(true);
  }
  const holdsMain = prior ? besideHoldsMain(realm, prior, name2) : null;
  if (holdsMain) return lines.push(holdsMain), done(true);
  const prim = state.standing;
  const beside = !!prim && otherRealm(realm, prim.realm) && !holdsStanding(realm, karta, name2);
  noteStandCwd(cwd);
  const here = (move2 = "register") => placeFields({ realm, karta, name: name2 }, true, move2);
  const reg = () => callTool(tool("channel"), { action: "register", realm, karta, name: name2, ...here() });
  const { register, kept: modelKept } = clearingRegister(reg, realm);
  const board = await callTool(tool("channel"), { action: "list", realm });
  if (board.isError) {
    lines.push(sw2().boardUnread(short(board.text)));
    return done(true);
  }
  const bd = readBoard(board);
  const { entries: entries2, recognized, declared } = bd;
  let own = entries2.filter((e) => ofSeat(e, karta, name2));
  const unread = declared != null && declared !== entries2.length;
  const hearing = (n) => boardHearing(bd, karta, n);
  if (!recognized || own.length > 1 || hearing(name2) === "unknown" && a.take !== true) {
    lines.push(
      !recognized ? sw2().boardUnknown(short(board.text, 160), ...boardHeaders()) : own.length > 1 ? sw2().boardAmbiguous(own.length, name2, karta) : sw2().boardCount(declared ?? 0, entries2.length)
    );
    return done(true);
  }
  let ownSession = false;
  let byRecord = null;
  const root = !base ? "" : asked ? baseOf2(realm, karta, base) : base;
  if (base && (a.take !== true || beside) && name2 === base) {
    const seat2 = await seatFor(realm, karta, base, hearing, beside, cwd, root);
    const choice = seat2.choice;
    byRecord = seat2.resumed;
    if ("refusal" in choice) {
      lines.push(choice.refusal);
      return done(true);
    }
    name2 = choice.name;
    ownSession = choice.own;
    own = entries2.filter((e) => ofSeat(e, karta, name2));
    if (own.length > 1) {
      lines.push(sw2().boardAmbiguous(own.length, name2, karta));
      return done(true);
    }
    if (choice.note) nameNotes.push(choice.note);
  }
  if (base) noteSeatBase(keyOf(realm, karta, name2), root);
  const take3 = a.take === true || ownSession;
  const stem = name2.split(".").slice(0, 2).join(".");
  const branches = new Set(
    git(["branch", "--format=%(refname:short)"], cwd).split("\n").map((x) => sanitize(x.trim())).filter(Boolean)
  );
  const legacy = entries2.filter((e) => {
    if (sat) return false;
    if (e.karta !== karta || nameOf(e.address) === name2) return false;
    const own2 = nameOf(e.address);
    if (!own2.startsWith(`${stem}.`)) return false;
    const third = own2.slice(stem.length + 1);
    return branches.has(third) && alive(e);
  });
  for (const e of legacy) nameNotes.push(sw2().legacy(e.address, realm, karta));
  if (unread) lines.push(sw2().boardCountFound(declared ?? 0, entries2.length));
  const mine = own[0];
  let how2;
  let heardHere;
  const reopening = !sat && !holdsStanding(realm, karta, name2) && ledHere(realm, karta, name2);
  const listensElsewhere = !!mine && listens(mine) && !holdsStanding(realm, karta, name2) && !reopening;
  const fresh2 = !sat && !take3 && !reopening && !holdsStanding(realm, karta, name2) && !isParked(realm, karta, name2) && !theirsByRecord(keyOf(realm, karta, name2));
  const resumed = byRecord ?? (fresh2 && !listensElsewhere ? await resumeFromDisk(realm, karta, name2) : null);
  const stopped = stoppedSince(stopsBefore, keyOf(realm, karta, name2));
  if (stopped) {
    lines.push(stopped);
    return done(true);
  }
  const extra = [];
  let socketBefore = false;
  let priorKept = false;
  if (beside) {
    const freed = prior ? await releasePrior(realm, prior) : null;
    if (freed && !freed.ok) return lines.push(freed.note), done(true);
    if (freed) extra.push(sw2().note(freed.note));
    const r = await register();
    if (r.isError) {
      lines.push(refusedWord("register", r, realm));
      return done(true);
    }
    heardHere = holdsStanding(realm, karta, name2);
    if (heardHere && !standingIdIn(realm)) extra.push(sw2().noIdInRegister());
    how2 = sw2().howBeside(ledKey() ?? "");
  } else if (resumed) {
    const r = await register();
    if (r.isError) {
      lines.push(refusedWord("register", r, realm));
      return done(true);
    }
    heardHere = true;
    socketBefore = true;
    how2 = `${resumed.word}, register`;
  } else if (!take3 && isParked(realm, karta, name2) && returnToStanding(tool("stand"))) {
    await heardOnReturn();
    const stoppedBack = stoppedSince(stopsBefore, keyOf(realm, karta, name2));
    if (stoppedBack) {
      lines.push(stoppedBack);
      return done(true);
    }
    if (!holdsStanding(realm, karta, name2) && !R5.again) {
      R5.again = true;
      try {
        return await standOnce(msg);
      } finally {
        R5.again = false;
      }
    }
    const r = await register();
    if (r.isError) {
      lines.push(refusedWord("register", r, realm));
      return done(true);
    }
    heardHere = true;
    how2 = sw2().howReturned();
  } else if (!take3 && (holdsStanding(realm, karta, name2) || reopening)) {
    const r = await register();
    if (r.isError) {
      lines.push(refusedWord("register", r, realm));
      return done(true);
    }
    heardHere = true;
    socketBefore = true;
    how2 = sw2().howRegister();
  } else if (!take3 && listensElsewhere) {
    lines.push(sw2().otherHolder(mine?.address ?? name2));
    return done(true);
  } else {
    const args = { action: "connect", realm, karta, name: name2 };
    Object.assign(args, here("connect"));
    if (typeof a.mute_siblings === "boolean") args.mute_siblings = a.mute_siblings;
    if (sat) args.ttl_seconds = SATELLITE_TTL_S;
    const addr = heldAddress(realm, prior);
    const connect6 = () => callTool(tool("channel"), args);
    const re = await connectInMove(stopsBefore, { realm, karta, name: name2 }, connect6, async () => {
      const c0 = await connect6();
      if (!sat || !c0.isError || !ttlRefused(c0)) return c0;
      extra.push(sw2().ttlRefused(SATELLITE_TTL_S, short(c0.text, 120)));
      delete args.ttl_seconds;
      return connect6();
    });
    const { c, own: ownReopen, taken: taken2 } = re;
    if (re.note) extra.push(sw2().note(re.note));
    if (c.isError && !ownReopen) {
      lines.push(refusedWord("connect", c, realm));
      return done(true);
    }
    const r = await register();
    if (r.isError) {
      lines.push(await registerRefused(r, realm, taken2, prior, addr));
      return done(true);
    }
    resetKnocks(realm, karta, name2);
    heardHere = true;
    socketBefore = ownReopen;
    how2 = ownReopen ? sw2().howRegister() : ownSession ? sw2().howOwnSession() : sw2().howConnect(!!mine, listensElsewhere, a.take === true);
    if (takeLapsed()) extra.push(sw2().note(resumeWords.rejoin()));
    const freed = prior ? await releasePrior(realm, prior) : null;
    if (freed) extra.push(sw2().note(releasedNote(replaces, freed, prior?.name ?? "")));
    priorKept = !!freed && !freed.ok;
  }
  lines.push(
    sw2().head(mine?.address ?? name2, karta, realm, how2),
    ...nameNotes.map((n) => sw2().note(n)),
    ...extra,
    ...modelKept() ? [sw2().modelNotCleared(modelKept())] : []
  );
  const block = heardHere ? sat ? satelliteListenWord() : listenBlock(realm) : null;
  if (block) lines.push(block);
  else lines.push(heardHere ? sw2().noSocket() : sw2().noWatchdog());
  if (!heardHere) lines.push(sw2().besideNoDoor());
  else if (beside) lines.push(sw2().besideHeard());
  else if (socketBefore) lines.push(sw2().heldAlready());
  else {
    const hello = await awaitHello(4e3);
    lines.push(hello ? sw2().hello(String(hello.pending ?? 0)) : sw2().noHello());
  }
  const localFault = heardHere ? doors().find((d) => d.key === heldKey(realm))?.listenError ?? null : null;
  if (localFault) lines.push(sw2().noLocalSocket(localFault));
  if (room && !heardHere) {
    lines.push(sw2().knockNotHere(room));
  } else if (room) {
    const onBoard = entries2.find((e) => e.address === room);
    const roomKarta = onBoard?.karta ?? (typeof a.room_karta === "string" && a.room_karta.trim() ? a.room_karta.trim().replace(/^#/, "") : null);
    lines.push(
      await knock({ realm, karta, name: name2, room, roomKarta, again: a.repeat_knock === true })
    );
  }
  if (typeof a.status === "string" && a.status.trim() && !hasStatusAddressFor(realm, karta, name2)) {
    lines.push(sw2().statusElsewhere(TAKE_PATH()));
  } else if (typeof a.status === "string" && a.status.trim()) {
    const st = await publishStatus(a.status.trim(), realm);
    lines.push(
      st.ok ? busyLine(a.status.trim(), realm) : sw2().statusRefused(short(st.body), st.code === 404 ? ` ${TURNED_GUIDANCE()}` : "")
    );
  }
  const stale = staleNotice(readLatest(CFG.authDir), CFG.authDir);
  if (stale) lines.push(stale);
  if (!priorKept) noteStood(auto, realm, karta, name2);
  return done(priorKept);
}

// js/bridge/standwire.ts
async function standAs(id, place, cwd) {
  const { realm, karta, name: name2 } = place;
  const where = cwd && isDirectory2(cwd) ? { cwd } : {};
  const r = await withSeatOrigin(
    true,
    () => runStand({
      jsonrpc: "2.0",
      id,
      method: "tools/call",
      params: { name: tool("stand"), arguments: { realm, karta: String(karta), name: name2, ...where } }
    })
  );
  const text2 = (r.result?.content ?? []).map((c) => c.text ?? "");
  return { ok: !r.result?.isError, text: text2.join("\n") };
}
wireEviction(
  (place, cwd) => serialized(
    () => standAs(
      `${ID_PREFIX}bridge-evicted`,
      { ...place, name: baseOf2(place.realm, place.karta, place.name ?? "") },
      // the base the seat was chosen from (#6706)
      cwd
    )
  )
);
wireTakeOwn(async (rec5, cwd) => {
  const r = await standAs(`${ID_PREFIX}bridge-resume`, rec5, cwd);
  if (r.ok) restore(rec5);
  return r.text.split("\n")[0];
});

// js/bridge/stophold.ts
var WHO_BY_REASON = {
  "revoked:person": "person",
  "revoked:self": "self",
  "revoked:silent": "silent"
};
var whoOf3 = (reason) => WHO_BY_REASON[reason] ?? "other";
var stopWord = (name2, reason) => words(STOP).stopped(name2, whoOf3(reason));
function dropUnsent(key2, doors2) {
  const n = doors2.reduce((sum, d) => sum + (d?.dropBatches() ?? 0), 0);
  if (n) standingLog(`stopped ${key2}: ${n} undelivered frame(s) dropped, not given`);
}
function stopAgent(key2, how2, reason, order) {
  const text2 = stopWord(state.standing?.name ?? "", reason);
  log(text2);
  standingLog(`stopped ${key2}: ${how2}${reason ? ` (${reason})` : ""}`);
  dropUnsent(key2, [H2.door, ...extraPlaces().map((p) => p.door)]);
  H2.stopped = { n: H2.stopped.n + 1, key: key2, text: text2 };
  const ev = {
    kind: "stopped",
    key: key2,
    text: text2,
    ...reason ? { reason } : {},
    ...order ? { order } : {}
  };
  broadcast(ev);
  notify("error", ev);
  forgetSeat(text2);
}
function stopBeside(beside, reason) {
  const text2 = stopWord(beside.standing.name ?? "", reason);
  log(`${text2} — that seat beside is forgotten, the rest are held`);
  dropUnsent(beside.door.key, [beside.door]);
  dropExtra(beside.door.key, text2, true, "beside");
}
function stopSeatByOrder(id, by, order, to = {}) {
  const reason = by ? `revoked:${by}` : "";
  const seat2 = seatOf2(id, to);
  if (seat2 === "main" && H2.currentKey)
    stopAgent(H2.currentKey, `stop order ${order}`, reason, order);
  else if (seat2 && seat2 !== "main") stopBeside(seat2, reason);
  return seat2 === null ? null : seat2 === "main" ? "main" : "beside";
}
function seatOf2(id, to) {
  const beside = extraPlaces().find((p) => p.door.standingId === id);
  if (beside) return beside;
  return H2.door && H2.currentKey && namesMain(id, to) ? "main" : null;
}
var holdsSeat = (id, framed, to = {}) => framed ? seatOf2(id, to) !== null : H2.door?.standingId === id || extraPlaces().some((p) => p.door.standingId === id);
function seatEnded(key2, frame2) {
  const id = typeof frame2.standing_id === "string" ? frame2.standing_id : "";
  const reason = typeof frame2.by === "string" ? `revoked:${frame2.by}` : frame2.reason === "silent" ? "revoked:silent" : "";
  const beside = id ? extraPlaces().find((p) => p.door.standingId === id) : void 0;
  if (beside) {
    const own = H2.closingOwn ? holdWords().closedOwn() : H2.revokingBeside.has(beside.door.key) ? holdWords().revokedOwn() : null;
    if (own) {
      log(
        `seat beside ${beside.door.key} released quietly (standing_ended arrived before the answer)`
      );
      return dropExtra(beside.door.key, own, true, "own");
    }
    return stopBeside(beside, reason);
  }
  if (!namesMain(id, frame2))
    return log(`standing_ended for seat ${id || "unnamed"}, not one this bridge knows — ignored`);
  if (releasedAsOwn("standing_ended")) return;
  stopAgent(key2, "standing_ended", reason);
}
function namesMain(id, to) {
  const main = H2.door?.standingId;
  if (!id || main) return !!id && main === id;
  if (extraPlaces().length > 0) return false;
  const toId = typeof to.to_standing_id === "string" ? to.to_standing_id : "";
  const name2 = typeof to.to_standing === "string" ? to.to_standing.replace(/^.*:/, "") : "";
  return toId === id && (!name2 || name2 === (state.standing?.name ?? ""));
}
whenStopped(
  (key2, code, reason, ended) => ended ? seatEnded(key2, ended) : stopAgent(key2, `close ${code}`, reason)
);

// js/bridge/orderflight.ts
var WAIT_MS = Number(process.env[envName("BRIDGE_ORDER_WAIT_MS")]) || 4e3;
var F2 = scoped(() => ({ running: /* @__PURE__ */ new Map() }));
function fly(id, run2) {
  const f = { done: Promise.resolve(), end: null };
  const running = F2.running;
  f.done = run2(f).finally(() => running.delete(id));
  running.set(id, f);
  return f.done;
}
async function ordersSettled() {
  const running = F2.running;
  if (!running.size) return;
  await Promise.race([
    Promise.allSettled([...running.values()].map((f) => f.done)),
    sleep(WAIT_MS)
  ]);
  for (const [id, f] of running) {
    const known2 = readOrder(id);
    if (f.end && !(known2 && isTerminal(known2.state))) writeOrder(f.end);
    log(
      `stop order ${id}: the bridge ends before its answer — ${f.end ? "left in the journal" : "no outcome yet"}`
    );
  }
}

// js/bridge/orderread.ts
var PAGE = 200;
var MAX_PAGES = 50;
async function ordersPage(base, since) {
  try {
    const q = `open=true&limit=${PAGE}${since ? `&since=${since}` : ""}`;
    const res = await fetch(`${base}/me/orders?${q}`, {
      headers: headers(),
      signal: AbortSignal.timeout(TIMEOUT_MS2)
    });
    if (!res.ok) return null;
    const body = await res.json();
    const orders = (Array.isArray(body.items) ? body.items : []).map((x) => x).filter((x) => typeof x.id === "string" && typeof x.standing_id === "string").map((x) => ({
      id: x.id,
      standing_id: x.standing_id,
      ...typeof x.seq === "number" ? { seq: x.seq } : {},
      ...typeof x.reason_code === "string" ? { reason_code: x.reason_code } : {},
      ...typeof x.by === "string" ? { by: x.by } : {},
      ...typeof x.issued_at === "string" ? { issued_at: x.issued_at } : {},
      ...typeof x.ack_window_seconds === "number" ? { ack_window_seconds: x.ack_window_seconds } : {}
    }));
    const next = typeof body.next_since === "number" ? body.next_since : since;
    return { orders, next };
  } catch {
    return null;
  }
}
async function readOpenOrders(base, take3) {
  const start = readSince(base);
  const read = [];
  const running = [];
  let since = start;
  for (let n = 0; n < MAX_PAGES; n++) {
    const page = await ordersPage(base, since);
    if (!page?.orders.length) break;
    read.push(...page.orders);
    running.push(...take3(page.orders));
    if (page.next <= since) break;
    since = page.next;
  }
  await Promise.allSettled(running);
  let floor = start;
  for (const o of read) {
    if (typeof o.seq !== "number" || !settled(o.id)) break;
    floor = Math.max(floor, o.seq);
  }
  if (floor > start) writeSince(base, floor);
}

// js/bridge/stoporder.ts
var taken = /* @__PURE__ */ new Set();
var ACCEPT_CAP_MS = 2e3;
var str3 = (v) => typeof v === "string" ? v : "";
function orderOf(frame2) {
  const id = str3(frame2.order_id);
  const standing = str3(frame2.standing_id);
  if (!id || !standing) return null;
  const span = frame2.ack_window_seconds;
  return {
    id,
    standing_id: standing,
    reason_code: str3(frame2.reason_code),
    by: str3(frame2.by),
    issued_at: str3(frame2.issued_at),
    ...typeof span === "number" ? { ack_window_seconds: span } : {},
    ...str3(frame2.to_standing_id) ? { to_standing_id: str3(frame2.to_standing_id) } : {},
    ...str3(frame2.to_standing) ? { to_standing: str3(frame2.to_standing) } : {}
  };
}
function journalRefused(id, outcome) {
  const text2 = words(STOP).orderJournalRefused(id, outcome);
  log(text2);
  broadcast({ kind: "note", text: text2 });
  notify("warning", { kind: "note", text: text2 });
}
async function stopOf(o, entry) {
  const confirms = confirmsHalts();
  let seat2;
  try {
    seat2 = stopSeatByOrder(o.standing_id, o.by ?? "", o.id, o);
  } catch (e) {
    log(`stop order ${o.id}: the stop failed — ${e.message}`);
    return { ...entry, state: "failed", reason: "stop_failed" };
  }
  if (seat2 === null) return { ...entry, state: "unknown", reason: "seat_gone_before_stop" };
  if (seat2 === "beside") return { ...entry, state: "stopped", reason: "seat_beside" };
  if (!confirms) return { ...entry, state: "stopped", reason: "word_given" };
  const code = await awaitHalt(o.id);
  if (code === null) return { ...entry, state: "stopped", reason: "halt_confirmed" };
  log(`stop order ${o.id}: the harness's stop — ${code}`);
  return code === SILENT ? { ...entry, state: "unknown", reason: SILENT } : { ...entry, state: "failed", reason: code };
}
async function finish(end) {
  standingLog(
    `stop order ${end.id} for ${end.standing}: ${end.state}${end.reason ? ` (${end.reason})` : ""}`
  );
  if (writeOrder(end)) return answerOutcome(end);
  journalRefused(end.id, true);
  await sendAck(end.base, end.id, end.state, end.reason);
}
async function execute(o, base, framed) {
  const known2 = readOrder(o.id);
  if (known2 && isTerminal(known2.state)) {
    log(`stop order ${o.id} again — the same outcome ${known2.state}, no second stop`);
    return answerOutcome(known2);
  }
  if (taken.has(o.id) || !framed && !holdsSeat(o.standing_id, false)) return;
  taken.add(o.id);
  return fly(o.id, (f) => carry(o, base, f));
}
async function carry(o, base, f) {
  const at3 = Date.now();
  const entry = {
    id: o.id,
    standing: o.standing_id,
    state: "accepted",
    base,
    acked: false,
    at: at3,
    pid: process.pid,
    until: windowEnd(o, at3)
  };
  if (!holdsSeat(o.standing_id, true, o))
    return finish({ ...entry, state: "refused", reason: "seat_not_held" });
  const kept3 = writeOrder(entry);
  if (!kept3) journalRefused(o.id, false);
  const accepted = kept3 ? sendAck(base, o.id, "accepted") : null;
  if (accepted) await Promise.race([accepted, sleep(ACCEPT_CAP_MS)]);
  const end = f.end = await stopOf(o, entry);
  await accepted;
  await finish(end);
}
function onOrder(url, frame2) {
  const base = apiBase(url);
  if (frame2?.type === "hello") {
    repeatLater(true);
    void readOpenOrders(base, (orders) => orders.map((o2) => execute(o2, base, false)));
    return false;
  }
  if (frame2?.type !== "stop") return false;
  const o = orderOf(frame2);
  if (!o) log(`stop frame without order_id or standing_id — ignored, not given to the agent`);
  else void execute(o, base, true);
  return true;
}
whenOrdered(onOrder);

// js/bridge/session.ts
import { createInterface as createInterface2 } from "node:readline";

// js/bridge/audience.ts
function refusedAudience(upstream) {
  const head = `upstream refuses even a freshly obtained access token (${upstream}) — not an expiry; the token's audience/resource may not match what the server validates`;
  const s2 = loadStore();
  if (!s2.tokens?.by_code) {
    return `${head} (operator lever: ${envName("BRIDGE_RESOURCE")}), or the server's token validation is off`;
  }
  const resource = s2.meta ? resourceOf(s2.meta) : CFG.serverUrl;
  return `${head}: this grant came by sign-in by code through client ${s2.tokens.client_id ?? "?"}, so its audience is that client's default audience on the sign-in server, which must be ${resource} — a move for the operator of the sign-in server; ${envName("BRIDGE_RESOURCE")} does not reach a grant by code`;
}

// js/bridge/moment.ts
var statusLine = () => words(MOMENT).status();
var leaveLine = () => words(MOMENT).leave();
var WRITE_TOOL = new RegExp(`^${escapeRe(TOOL_PREFIX)}(add_[a-z_]+|batch)$`);
var FORMER_MOMENTS = Object.values(MOMENT).flatMap((w5) => w5.formerMoments());
function withoutFormerMoment(d) {
  for (let changed = true; changed; ) {
    changed = false;
    for (const line of FORMER_MOMENTS) {
      if (d.length <= line.length + 2) continue;
      if (d.startsWith(`${line}

`)) d = d.slice(line.length + 2);
      else if (d.endsWith(`

${line}`)) d = d.slice(0, d.length - line.length - 2);
      else continue;
      changed = true;
    }
  }
  return d;
}
function annotateToolList(reply2) {
  const tools = reply2?.result?.tools;
  if (!Array.isArray(tools)) return;
  const at3 = tools.findIndex((t) => t?.name === STAND_TOOL_NAME);
  if (at3 >= 0) tools[at3] = standTool();
  else tools.push(standTool());
  for (const t of tools) {
    if (t && typeof t.description === "string" && WRITE_TOOL.test(String(t.name)))
      t.description = withoutFormerMoment(t.description);
    if (!t || t.name !== tool("channel") || typeof t.description !== "string") continue;
    if (!t.description.includes(leaveLine())) t.description = `${leaveLine()}

${t.description}`;
    if (!t.description.includes(statusLine())) t.description = `${statusLine()}
${t.description}`;
  }
}

// js/bridge/narrow.ts
var PLACE_MOVES = /* @__PURE__ */ new Set(["mint", "connect", "sessions"]);
var PLACE_FIELDS = ["ttl_seconds", "mute_siblings"];
function clientName2() {
  const info = state.initParams?.clientInfo;
  return typeof info?.name === "string" ? info.name : "";
}
function toolSet() {
  return CFG.tools ? /* @__PURE__ */ new Set([...CFG.tools, STAND_TOOL_NAME]) : null;
}
var ownRealmList = (msg) => String(msg.id ?? "").startsWith(`${ID_PREFIX}thin-realms-`) && msg.params?.name === tool("realm") && String(msg.params?.arguments?.action ?? "") === "list";
function outsideSetRefusal(msg) {
  if (msg?.method !== "tools/call" || msg.id === void 0 || msg.id === null) return null;
  if (ownRealmList(msg)) return null;
  const set = toolSet();
  const name2 = String(msg.params?.name ?? "");
  if (!set || set.has(name2)) return null;
  const list3 = [...set].sort().join(", ");
  const text2 = words(NARROW).outsideSet(name2, list3);
  return {
    jsonrpc: "2.0",
    id: msg.id,
    result: { isError: true, content: [{ type: "text", text: text2 }] }
  };
}
function withoutPlaceMoves(text2) {
  return text2.replace(
    ACTION_LIST_RE,
    (_, head, list3) => head + list3.split("|").map((s2) => s2.trim()).filter((s2) => !PLACE_MOVES.has(s2)).join(" | ")
  );
}
function withoutSchema(t) {
  const { outputSchema: _, ...rest2 } = t;
  return rest2;
}
function channelForHarness(t) {
  const schema = t.inputSchema;
  const props = schema?.properties;
  if (!schema || !props) return t;
  const kept3 = {};
  for (const [k, v] of Object.entries(props)) if (!PLACE_FIELDS.includes(k)) kept3[k] = v;
  const action = kept3.action;
  if (action) {
    const a = { ...action };
    if (typeof a.description === "string") a.description = withoutPlaceMoves(a.description);
    if (Array.isArray(a.enum)) a.enum = a.enum.filter((x) => !PLACE_MOVES.has(String(x)));
    kept3.action = a;
  }
  const next = { ...schema, properties: kept3 };
  if (Array.isArray(schema.required))
    next.required = schema.required.filter((r) => !PLACE_FIELDS.includes(String(r)));
  return { ...t, inputSchema: next };
}
function narrowToolList(reply2) {
  const tools = reply2?.result?.tools;
  if (!Array.isArray(tools) || clientName2() === SURFACE_CLIENT) return reply2;
  const set = toolSet();
  const fields = harnessAsksFields();
  const shown = tools.filter((t) => !set || set.has(String(t?.name))).map((t) => t?.name === tool("channel") ? channelForHarness(t) : t).map((t) => fields || !t || !("outputSchema" in t) ? t : withoutSchema(t));
  return { ...reply2, result: { ...reply2.result, tools: shown } };
}

// js/bridge/pending.ts
function pendingFrames() {
  let n = 0;
  for (const d of doors()) {
    const counted = /* @__PURE__ */ new Set();
    const held2 = [
      ...d.ring.map((r) => r.frame),
      ...d.stale.frames,
      ...d.backlog.frames,
      ...d.roomBatch.frames
    ];
    for (const frame2 of held2) {
      const one = typeof frame2?.id === "string" ? frame2.id : frame2;
      if (frame2?.type !== "message" || counted.has(one)) continue;
      counted.add(one);
      if (!isDelivered(deliveryKeys(frame2), d.seen, d.seenPath)) n++;
    }
  }
  return n;
}

// js/bridge/work.ts
var W3 = scoped(() => ({ at: 0 }));
var heard = null;
function noteAgentWork(at3 = Date.now()) {
  W3.at = at3;
  heard?.();
}
function onAgentWork(fn) {
  heard = fn;
}
var lastAgentWork = () => W3.at;

// js/bridge/pulse.ts
var GAP_MS2 = Number(process.env[envName("PULSE_GAP_MS")]) || 3e4;
var STATES = /* @__PURE__ */ new Set(["idle", "busy", "interrupted", "failed", "unknown"]);
var MOMENTS = ["turn_at", "read_at", "act_at"];
var P4 = scoped(() => ({
  /** The harness's word: state and the moments it knows. */
  said: {},
  sent: null,
  offered: null,
  sentAt: 0,
  timer: null,
  tick: null
}));
var iso = (v) => typeof v === "string" && !Number.isNaN(Date.parse(v)) ? new Date(v).toISOString() : void 0;
function current() {
  const { state: state2, turn_at, read_at, act_at } = P4.said;
  const work = lastAgentWork();
  return {
    type: "pulse",
    state: state2 ?? "unknown",
    pending: pendingFrames(),
    ...turn_at ? { turn_at } : {},
    ...read_at ? { read_at } : {},
    ...act_at ? { act_at } : {},
    ...work ? { cycle_at: new Date(work).toISOString() } : {}
  };
}
var same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
function send(p, holder = H2.holder) {
  if (P4.timer) clearTimeout(P4.timer);
  P4.timer = null;
  const sent = bindScope((at3) => {
    P4.sent = p;
    P4.sentAt = at3;
  });
  if (holder?.send(JSON.stringify(p), sent)) P4.offered = p;
}
function consider(now2 = false) {
  if (!H2.holder?.alive || H2.unheard) return;
  const p = current();
  const mux = onDispatcher(H2.currentUrl);
  if (!now2 && same(mux ? P4.offered : P4.sent, p)) return;
  const wait = now2 || mux ? 0 : P4.sentAt + GAP_MS2 - Date.now();
  if (wait <= 0) return send(p);
  if (!P4.timer) {
    P4.timer = setTimeout(
      bindScope(() => {
        P4.timer = null;
        consider();
      }),
      wait
    );
    P4.timer.unref?.();
  }
}
function watch() {
  if (P4.tick) return;
  P4.tick = setInterval(
    bindScope(() => {
      if (H2.holder?.alive) return consider();
      if (H2.door) return;
      clearInterval(P4.tick ?? void 0);
      P4.tick = null;
    }),
    GAP_MS2
  );
  P4.tick.unref?.();
}
whenPulsed((why, holder) => {
  if (why === "hello") {
    P4.offered = null;
    watch();
    return consider(true);
  }
  if (why === "frame") return consider();
  const p = current();
  if (!same(onDispatcher(H2.currentUrl) ? P4.offered : P4.sent, p)) send(p, holder);
  if (P4.timer) clearTimeout(P4.timer);
  P4.timer = null;
});
onAgentWork(() => consider());
var sentPulse = () => P4.sent ? { ...P4.sent, sent_at: new Date(P4.sentAt).toISOString() } : null;
var isPulseCall = (msg) => msg?.method === method("pulse");
function runPulse(msg) {
  const answer2 = (result) => ({
    jsonrpc: "2.0",
    id: msg.id,
    result
  });
  if (!HOSTED_CLIENTS.has(harnessName())) return answer2({ taken: false, pulse: null });
  const p = msg.params ?? {};
  const said2 = { ...P4.said };
  if (typeof p.state === "string" && STATES.has(p.state)) said2.state = p.state;
  for (const k of MOMENTS) {
    const v = iso(p[k]);
    if (v && (!said2[k] || v > said2[k])) said2[k] = v;
  }
  P4.said = said2;
  try {
    consider();
  } catch (e) {
    log(`pulse: not considered — ${e.message}`);
  }
  return answer2({ taken: true, pulse: current() });
}

// js/bridge/skillrefresh.ts
var S4 = scoped(() => ({ refreshing: null }));
async function refreshSkills() {
  if (S4.refreshing) return S4.refreshing;
  S4.refreshing = serialized(async () => {
    const primary = state.standing;
    if (!primary || !state.sessionId || !skillsCheckDue()) return;
    for (const place of [primary, ...state.places]) {
      if (isParked(place.realm, place.karta, place.name ?? "")) continue;
      if (wasEvicted(place.realm, place.karta, place.name ?? "")) continue;
      if (!skillsNeedRegister(place)) continue;
      if (deafPlaceIn(place.realm) && await deafSeatTaken(place)) {
        retrySkillsCheck();
        continue;
      }
      const got = await replayRegister(place, false);
      if (seatIsGone(got)) {
        if (place === primary ? state.standing !== place : !state.places.includes(place)) continue;
        const why = words(STANDING).seatExpired();
        log(`skills refresh: place ${keyOfPlace(place)} is gone, forgetting it`);
        if (place === primary) {
          state.standing = null;
          releaseStanding(why, true);
          break;
        }
        const key2 = keyOfPlace(place);
        dropExtra(key2, why, true);
        state.places = state.places.filter((p) => keyOfPlace(p) !== key2);
      } else if (!got || got.error || got.result?.isError) retrySkillsCheck();
    }
  }).catch((e) => {
    retrySkillsCheck();
    log(`skills refresh failed: ${errorMessage(e)}`);
  }).finally(() => {
    S4.refreshing = null;
  });
  return S4.refreshing;
}

// js/bridge/standdelivery.ts
var standForHarness = async (msg, notice) => forHarness(notice(await serialized(() => withCallOrigin(msg.id, () => runStand(msg)))));
var resumeByOrigin = (msg) => serialized(
  () => withSeatOrigin(true, () => isResumeCall(msg) ? runResume(msg) : runCheck(msg))
);

// js/bridge/deliver.ts
function syntheticError(id, message, outcome = UpstreamError.UNKNOWN, holdOff = false) {
  const kind = holdOff === true ? "wait" : holdOff;
  const verdict = outcome === UpstreamError.NOT_SENT ? kind === "wait" ? (
    // Safe and not-yet are different axes, and an agent told only "safe" reads
    // it as "now": it retries into the same wall, then goes looking for a
    // defect in what only time repairs. The interval itself stays where it was
    // measured — in the reason above — so one refusal never carries two.
    "Nothing was applied and the grant is whole — this clears itself by waiting, not by fixing: wait out the interval named above before retrying."
  ) : kind === "knock" ? "Nothing was applied and the grant is whole — a benign transition, not a broken authorization: retry the call now. Only a refusal that returns means the hour is real — that one names its own wait." : kind === "dead" ? "Nothing was applied, and no retry and no wait will change that — only a human with a new token can." : kind === "human" ? (
    // The agent reads this; the human does not. A retry buys nothing
    // and a wait shortens nothing — only handing the link over does.
    "Nothing was applied, and only the human can move this: hand them the link above — the local one opens only on this machine; from another, the sign-in page with the code, where one is named — the login is already waiting for their click. Once they finish, retry the call."
  ) : "The call never reached the server, so nothing was applied — retry freely." : "The call went out and its answer was lost, so THE OUTCOME IS UNKNOWN — re-read the target before retrying: a blind retry can apply a second time, and a write with no version guard duplicates silently.";
  const tail2 = kind ? "The bridge stays up." : "The bridge stays up; if this repeats, the server side needs attention.";
  return {
    jsonrpc: "2.0",
    id,
    error: {
      code: -32001,
      // BUILD is here for the field report: the error is quoted verbatim, and
      // the build string is what dates the code that produced it.
      message: `${BRIDGE_NAME} ${BUILD}: ${message}. ${verdict} ${tail2}`
    }
  };
}
var NET_BACKOFF_MS = (process.env[envName("BRIDGE_NET_BACKOFF_MS")] || "1000,2000,4000").split(",").map(Number).filter((n) => Number.isFinite(n) && n >= 0);
onReinitialized(() => {
  if (harnessListing()) return;
  return recheckTools(async () => {
    const id = `${ID_PREFIX}bridge-tools-${++state.reinitCounter}`;
    let got = null;
    await post2({ jsonrpc: "2.0", id, method: "tools/list", params: {} }, (m) => {
      if (m.id === id) got = m;
    });
    const reply2 = got;
    if (!reply2?.result) return reply2;
    annotateToolList(reply2);
    saveServerCache({ tools: reply2.result });
    return narrowToolList(reply2);
  }, emit);
});
function isRead(msg) {
  if (msg?.method === "initialize" || msg?.method === "tools/list") return true;
  return msg?.method === "tools/call" && READ_TOOLS.has(String(msg.params?.name ?? ""));
}
function lastServerAnswer(msg) {
  const cache = loadServerCache();
  const result = msg?.method === "initialize" ? cache.init : msg?.method === "tools/list" && !msg.params?.cursor ? cache.tools : null;
  if (!result) return null;
  const reply2 = { jsonrpc: "2.0", id: msg.id, result };
  if (msg?.method !== "tools/list") return reply2;
  annotateToolList(reply2);
  const shown = narrowToolList(reply2);
  noteServedTools(shown.result);
  return shown;
}
function ownClient() {
  const info = state.initParams?.clientInfo;
  return typeof info?.name === "string" && OWN_CLIENTS.has(info.name);
}
function withNotice(reply2) {
  const content = reply2?.result?.content;
  if (!Array.isArray(content)) return reply2;
  const notice = takeNotice();
  if (notice && !content.some((c) => NOTICE_MARK.test(c?.text ?? ""))) {
    content.push({ type: "text", text: notice });
  }
  return reply2;
}
async function deliver2(msg) {
  const listed = msg?.method === "tools/list" ? watchHarnessListing(msg, emit) : null;
  try {
    await deliverOne(msg);
  } finally {
    listed?.();
    settleOwnRevoke(msg);
    if (msg.method === "tools/call") void refreshSkills();
  }
}
async function deliverOne(msg) {
  const local = localStatus(msg) ?? localLeave(msg) ?? localSuspend(msg) ?? localEnd(msg) ?? localHalted(msg);
  if (local) {
    emit(await local);
    return;
  }
  const isInit = msg?.method === "initialize";
  if (isInit) state.initParams = msg.params;
  const harness = !ownClient();
  const hasId = msg?.id !== void 0 && msg?.id !== null;
  let authRetried = false;
  let heldRetried = false;
  let sessionRetried = false;
  let netTries = 0;
  let outcome = UpstreamError.NOT_SENT;
  const note4 = (e) => {
    if (!(e instanceof UpstreamError) || e.outcome === UpstreamError.UNKNOWN) {
      outcome = UpstreamError.UNKNOWN;
    }
  };
  const isToolCall = msg?.method === "tools/call";
  const isStand = isStandCall(msg);
  let heldReply;
  let standingRetried = false;
  const forward = (reply2) => {
    let m = reply2;
    if (isInit && m.id === msg.id && m.result?.protocolVersion) {
      state.protocolVersion = m.result.protocolVersion;
    }
    if (m.id === msg.id) noteStanding(msg, m);
    if (m.id === msg.id && m.result && isInit) saveServerCache({ init: m.result });
    if (m.id === msg.id && msg.method === "tools/list") {
      annotateToolList(m);
      if (m.result && !msg.params?.cursor) saveServerCache({ tools: m.result });
      m = narrowToolList(m);
      if (!msg.params?.cursor) noteServedTools(m.result, msg);
    }
    if (isToolCall && hasId && m.id === msg.id) {
      heldReply = m;
      return;
    }
    emit(m);
  };
  let endTaking = null;
  for (; ; ) {
    try {
      if (!isInit && state.sessionId && state.sessionToken && currentAccessToken() !== state.sessionToken) {
        log(
          "the access token changed since the session was opened — re-initializing before the call"
        );
        await reinitialize();
      }
      if (!isInit && !state.sessionId && state.initParams) {
        log("no upstream session yet — initializing before the call");
        await reinitialize();
      }
      if (!isInit) await ensureStanding();
      const taken2 = hasId ? evictedRefusal(msg) ?? await deafRefusal(msg) : null;
      if (taken2) {
        emit({
          jsonrpc: "2.0",
          id: msg.id,
          result: { isError: true, content: [{ type: "text", text: taken2 }] }
        });
        return;
      }
      if (isStand) {
        emit(await standForHarness(msg, withNotice));
        return;
      }
      if (isResumeCall(msg) || isCheckCall(msg)) {
        emit(await resumeByOrigin(msg));
        return;
      }
      if (isUsageCall(msg)) {
        emit(await serialized(() => runUsage(msg)));
        return;
      }
      if (isPulseCall(msg)) {
        emit(runPulse(msg));
        return;
      }
      heldReply = null;
      const ch = msg.params?.arguments ?? {};
      const onChannel = hasId && msg.method === "tools/call" && msg.params?.name === tool("channel");
      const takes = onChannel && ["connect", "mint", "register"].includes(String(ch.action));
      if (takes && ch.realm != null) ch.realm = await seatRealm(ch.realm);
      else if (onChannel) await resolveAgainstLed(ch.realm);
      const satWord = hasId && msg.method === "tools/call" && msg.params?.name === tool("channel") ? satelliteChannelRefusal(msg.params.arguments ?? {}) : null;
      const cross = satWord ? {
        jsonrpc: "2.0",
        id: msg.id,
        result: { isError: true, content: [{ type: "text", text: satWord }] }
      } : hasId ? outsideSetRefusal(msg) ?? crossPlaceRefusal(msg) : null;
      if (cross) {
        emit(cross);
        return;
      }
      const notOwner = takes ? await ownerRefusal(ch.realm, ch.karta) ?? await rawSeatRefusal(msg) : null;
      if (notOwner) {
        emit({
          jsonrpc: "2.0",
          id: msg.id,
          result: { isError: true, content: [{ type: "text", text: notOwner }] }
        });
        return;
      }
      expectOwnRevoke(msg);
      if (msg.method === "tools/call" && msg.params?.name === tool("channel") && msg.params.arguments)
        msg.params.arguments = withPlaceFields(msg.params.arguments);
      endTaking = msg.params?.name === tool("channel") ? beginTaking(msg.params.arguments ?? {}) : null;
      await (takes ? withCallOrigin(msg.id, () => post2(msg, forward)) : post2(msg, forward));
      const held2 = heldReply;
      if (held2 && msg.params?.name === tool("channel") && msg.params.arguments)
        noteLocaleEcho(msg.params.arguments, replyText(held2), structuredOf(held2));
      if (held2) {
        if (state.standing && isUnattributed(held2)) {
          state.standingSession = null;
          const refused = !!held2.result?.isError;
          if (refused && !standingRetried) {
            standingRetried = true;
            log("the call ran unattributed — re-binding the standing and repeating it once");
            await ensureStanding();
            if (state.standingSession !== state.sessionId) await ensureStanding();
            if (state.standingSession === state.sessionId) {
              endTaking?.();
              continue;
            }
          } else {
            log(
              `a write went out unattributed (${replyText(held2).slice(0, 120)}) — the standing is re-bound before the next call`
            );
          }
        }
        noteCaseEntry(msg.params?.name, msg.params?.arguments, held2);
        const reply2 = absorbCloseReply(msg, absorbRevokeReply(msg, absorbChannelReply(msg, held2)));
        emit(forHarness(withNotice(reply2)));
      }
      endTaking?.();
      return;
    } catch (e) {
      endTaking?.();
      note4(e);
      if (e instanceof UpstreamError && e.kind === "network" && e.retryable && netTries < NET_BACKOFF_MS.length && (e.outcome === UpstreamError.NOT_SENT || isRead(msg))) {
        const pause = NET_BACKOFF_MS[netTries++];
        log(`${e.message} — knocking again in ${pause}ms (${netTries}/${NET_BACKOFF_MS.length})`);
        await new Promise((r) => setTimeout(r, pause));
        continue;
      }
      if (e instanceof UpstreamError && e.kind === "auth" && !authRetried) {
        authRetried = true;
        try {
          await ensureAuth(e.message, { force: true, rejected: e.presented });
          continue;
        } catch (authErr) {
          if (authErr instanceof HoldOffError && authErr.retryNow && !heldRetried) {
            heldRetried = true;
            authRetried = false;
            log(`${authErr.message} — repeating the call once`);
            await sleep(300);
            continue;
          }
          const standIn = hasId && harness ? lastServerAnswer(msg) : null;
          if (standIn) {
            log(`${msg.method} answered from the last server answer — ${errorMessage(authErr)}`);
            emit(standIn);
            return;
          }
          if (authErr instanceof TokenRefused) {
            if (hasId) emit(syntheticError(msg.id, authErr.message, outcome, "dead"));
            return;
          }
          if (authErr instanceof AuthPending) {
            if (hasId) emit(syntheticError(msg.id, authErr.message, outcome, "human"));
            return;
          }
          const held2 = authErr instanceof HoldOffError;
          const message = errorMessage(authErr);
          log(`${held2 ? "authorization holding off" : "authorization failed"}: ${message}`);
          if (hasId) {
            emit(
              syntheticError(
                msg.id,
                `${held2 ? "authorization holding off" : "authorization failed"}: ${message}`,
                outcome,
                held2 && (authErr.retryNow ? "knock" : "wait")
              )
            );
          }
          return;
        }
      }
      if (e instanceof UpstreamError && e.kind === "session" && !sessionRetried && !isInit) {
        sessionRetried = true;
        try {
          await reinitialize();
          continue;
        } catch (reErr) {
          if (hasId) {
            emit(
              syntheticError(msg.id, `session recovery failed: ${errorMessage(reErr)}`, outcome)
            );
          }
          return;
        }
      }
      if (e instanceof UpstreamError && (e.kind === "network" || e.kind === "auth" && harness) && hasId) {
        const cached = lastServerAnswer(msg);
        if (cached) {
          log(`${e.message} — ${msg.method} answered from the last server answer`);
          emit(cached);
          return;
        }
      }
      const reason = e instanceof UpstreamError ? e.kind === "auth" && authRetried ? refusedAudience(e.message) : e.message : `bridge internal error: ${errorMessage(e)}`;
      log(`request ${hasId ? msg.id : `(notification ${msg?.method})`} failed: ${reason}`);
      if (hasId) emit(syntheticError(msg.id, reason, outcome));
      return;
    }
  }
}

// js/bridge/session.ts
var HANDOVER_WAIT_MS = Number(process.env[envName("BRIDGE_HANDOVER_WAIT_MS")]) || 1e4;
var counter = 0;
function applyOrigin(origin2) {
  const cfg = readArgs(origin2.argv);
  if (origin2.patSha !== void 0 && patShaOf(cfg.pat) !== origin2.patSha)
    throw new Error(
      "this daemon signs in otherwise than the bridge asking (its personal token differs)"
    );
  setConfig(cfg);
}
function openSession(io, origin2, opts = {}) {
  if (!origin2) return openIn(io, null, null);
  const scope = newScope(
    opts.id ?? `s${++counter}`,
    { env: origin2.env, cwd: origin2.cwd, pid: origin2.pid, path: origin2.path ?? "" },
    isSessionEnvKey
  );
  scope.log = opts.log ?? null;
  return runIn(scope, () => {
    applyOrigin(origin2);
    return openIn(io, origin2, scope);
  });
}
function openIn(io, origin2, scope) {
  setSessionOutput(io.output);
  guardStream(io.output);
  holdFromEnv();
  repeatLater(true);
  if (!CFG.satellite) startDeafnessWatch();
  const rl = createInterface2({ input: io.input, terminal: false });
  const pending2 = /* @__PURE__ */ new Set();
  let handshake = null;
  rl.on(
    "line",
    bindScope((line) => {
      const trimmed2 = line.trim();
      if (!trimmed2) return;
      let msg;
      try {
        msg = JSON.parse(trimmed2);
      } catch {
        log(`unparseable line from harness: ${trimmed2.slice(0, 120)}`);
        return;
      }
      if (msg.method === "tools/call" && !String(msg.id ?? "").startsWith(ID_PREFIX))
        noteAgentWork();
      const run2 = () => deliver2(msg).catch((e) => log(`unexpected: ${e?.stack || errorMessage(e)}`));
      let p;
      if (msg.method === "initialize") {
        p = run2();
        handshake = p;
        p.finally(() => {
          if (handshake === p) handshake = null;
        });
      } else if (handshake) {
        const gate = handshake;
        p = gate.then(run2, run2);
      } else p = run2();
      pending2.add(p);
      p.finally(() => pending2.delete(p));
    })
  );
  let leaving = null;
  let markEnded;
  const ended = new Promise((resolve11) => markEnded = resolve11);
  const leave = bindScope(
    (why) => leaving ??= windDown(why).finally(markEnded)
  );
  const windDown = async (why) => {
    debug(`${why} — winding down`);
    const handover = !!origin2 && handoverUnderway();
    const paused = suspended();
    await Promise.all([
      closeRun(why, handover).catch((e) => log(`the run's end failed: ${e.message}`)),
      ordersSettled()
    ]);
    if (handover) await Promise.race([Promise.allSettled([...pending2]), sleep(HANDOVER_WAIT_MS)]);
    else await Promise.allSettled([...pending2, ...tokenRequestsInFlight]);
    if (paused) await pauseSettled();
    await flushStdout(io.output);
    if (origin2) {
      releaseSatelliteClaims();
      return;
    }
    const flow = clickPending();
    if (flow) {
      log(
        `${why}, but an authorization flow is pending — staying up for the human's click, at most ${Math.round(ORPHAN_FLOW_MS / 1e3)}s`
      );
      await Promise.race([flow.catch(() => {
      }), sleep(ORPHAN_FLOW_MS)]);
    }
    await Promise.allSettled([...tokenRequestsInFlight]);
    await flushStdout(io.output);
  };
  rl.on(
    "close",
    bindScope(() => void leave("stdin closed, the harness is gone"))
  );
  return { leave, ended, origin: origin2, scope, lastWork: bindScope(lastAgentWork) };
}

// js/bridge/snapshot.ts
function sessionSnapshot(local_id, engine, thin_pid, attached, build) {
  const inspect = () => {
    const installed = skillsAttr();
    const declared = state.standing ? announcedSkills(state.standing) : void 0;
    const differs = (skills) => !!skills && JSON.stringify(skills) !== JSON.stringify(installed);
    return {
      local_id,
      thin_pid,
      attached,
      build,
      skills: declared,
      installed_skills: installed,
      skills_mismatch: differs(declared),
      cwd: engine.origin?.cwd ?? "",
      server: CFG.serverUrl,
      ...H2.currentUrl ? { api: apiBase(H2.currentUrl) } : {},
      harness: harnessName(),
      harness_session: sessionOfBridge(),
      places: heldPlaces().map((p) => {
        const standing = p.primary ? state.standing : extraPlaces().find((x) => x.door.key === p.key)?.standing;
        const door = doors().find((d) => d.key === p.key);
        const attrs = observedPlaceAttrs();
        const last = engine.lastWork();
        return safePlace({
          name: standing?.name,
          realm: standing?.realm,
          karta: standing?.karta,
          primary: p.primary,
          standing_id: door?.standingId ?? void 0,
          address: door?.address ?? void 0,
          satellite_of: attrs.satellite_of,
          listening: !H2.unheard && holdsChannel() && (notifiedClient() ? attached : !!door?.clients.size),
          ...last ? { last_work_at: new Date(last).toISOString() } : {},
          usage: attrs.usage,
          pulse: sentPulse(),
          skills: standing ? announcedSkills(standing) : void 0,
          skills_mismatch: differs(standing ? announcedSkills(standing) : void 0)
        });
      })
    };
  };
  return engine.scope ? runIn(engine.scope, inspect) : inspect();
}

// js/bridge/daemon.ts
var ms = (name2, dflt) => {
  const v = Number(process.env[name2]);
  return process.env[name2]?.trim() && Number.isFinite(v) && v >= 0 ? v : dflt;
};
var LOG_MARK = new RegExp(`\\[${escapeRe(BRIDGE_NAME)} [^\\]]*\\] `);
var IDLE_MS2 = ms(envName("BRIDGE_DAEMON_IDLE_MS"), 6e4);
var HOME_CHECK_MS = ms(envName("BRIDGE_DAEMON_HOME_CHECK_MS"), 6e4);
var SUCCESSOR_WAIT_MS = ms(envName("BRIDGE_DAEMON_SUCCESSOR_WAIT_MS"), 2e4);
var GRACE_MS = ms(envName("BRIDGE_DAEMON_GRACE_MS"), 5e3);
var RETURN_WAIT_MS = ms(envName("BRIDGE_DAEMON_RETURN_WAIT_MS"), 3e4);
var JOURNAL_MAX = 256e3;
var DAEMON_BUSY_EXIT = 75;
var SELF = (() => {
  try {
    return fileURLToPath5(import.meta.url);
  } catch {
    return process.argv[1] ?? "";
  }
})();
var versionOfFile = (path) => {
  try {
    return versionIn(readFileSync30(path, "utf8"));
  } catch {
    return null;
  }
};
async function daemonMain(argv2) {
  const successor = argv2.includes("--successor");
  const cfg = parseArgs(argv2.filter((a) => a !== "--successor"));
  const authDir = cfg.authDir;
  const run2 = seamRunDir(authDir);
  const journalPath = join27(run2, "daemon.log");
  const journal = (line) => {
    try {
      mkdirSync17(run2, { recursive: true, mode: 448 });
      rotateJournal(journalPath, JOURNAL_MAX);
      const text2 = line.trimEnd().replace(LOG_MARK, "");
      appendFileSync5(
        journalPath,
        `${(/* @__PURE__ */ new Date()).toISOString()} pid=${process.pid} ${BUILD} ${text2}
`,
        { mode: 384 }
      );
    } catch {
    }
  };
  setProcessLog(journal);
  installCrashWords();
  if (!updatesDisabled()) {
    const sync = syncHome();
    for (const p of sync.copied) log(`home updated by this build: ${p}`);
    if (sync.reexec) {
      log(`the home copy is newer — the daemon rises from it: ${sync.reexec}`);
      spawnDaemon(sync.reexec, authDir, successor);
      process.exit(0);
    }
  }
  const sessions = /* @__PURE__ */ new Map();
  const engines = /* @__PURE__ */ new Map();
  const attached = /* @__PURE__ */ new Set();
  const bridgePids = /* @__PURE__ */ new Map();
  const bridgeBuilds = /* @__PURE__ */ new Map();
  const sockets = /* @__PURE__ */ new Set();
  const handed = /* @__PURE__ */ new Map();
  const answering = /* @__PURE__ */ new Set();
  let draining2 = false;
  let counter2 = 0;
  let lastNotice = null;
  let server = null;
  const idle = idleWatch(
    IDLE_MS2,
    () => draining2 || sessions.size > 0,
    () => {
      server?.close();
      process.exit(0);
    }
  );
  const armIdle = idle.arm;
  const handover = async (to, why) => {
    if (draining2) return;
    draining2 = true;
    idle.hold();
    log(`handing over to ${to}: ${why} — ${sessions.size} session(s)`);
    beginHandover(why);
    server?.close();
    for (const so of sockets) writeFrame(so, { t: "handover", why });
    spawnDaemon(to, authDir, true);
    const paused = [];
    for (const [id, e] of engines) {
      if (!e.scope) continue;
      handed.set(id, e.scope);
      const pid = bridgePids.get(id) ?? 0;
      if (!attached.has(id) && !ownPidAlive(pid)) continue;
      runIn(e.scope, () => pauseForHandover(why));
      paused.push([e.scope, pid]);
    }
    await Promise.allSettled([...sessions.values()].map((s2) => s2.end(`daemon handover: ${why}`)));
    await Promise.allSettled([...answering]);
    for (const so of sockets) so.end();
    await handoffsSettled();
    await Promise.allSettled([...answering]);
    await Promise.allSettled(
      paused.map(([scope, pid]) => runIn(scope, () => endUnreturnedPause(pid, RETURN_WAIT_MS)))
    );
    log("handed over — leaving");
    setTimeout(() => process.exit(0), 300);
  };
  const newer = (v) => !!v && compareVersions(v, VERSION) > 0;
  let homeSeen = "";
  const checkHome = () => {
    if (draining2 || updatesDisabled()) return;
    const home = homeBridgePath();
    let stamp;
    try {
      const st = statSync9(home);
      stamp = `${st.ino}:${st.size}:${st.mtimeMs}`;
    } catch {
      return;
    }
    if (stamp === homeSeen) return;
    homeSeen = stamp;
    const v = versionOfFile(home);
    if (newer(v)) void handover(home, `the home copy is v${v}, this daemon v${VERSION}`);
  };
  const newerBridge = (hello) => {
    if (updatesDisabled()) return;
    const theirs = /^v(\d+\.\d+\.\d+)/.exec(hello.build)?.[1] ?? null;
    if (!newer(theirs)) return;
    const home = homeBridgePath();
    const homeV = versionOfFile(home);
    const to = homeV && compareVersions(homeV, theirs) >= 0 ? home : hello.path;
    if (!to || !newer(versionOfFile(to))) return;
    setImmediate(() => void handover(to, `a thin bridge ${hello.build} is newer than this daemon`));
  };
  const host = {
    build: BUILD,
    path: SELF,
    log: (m) => log(m),
    count: () => sessions.size,
    snapshot: () => ({
      daemon: { pid: process.pid, build: BUILD, path: SELF },
      sessions: [...engines].map(
        ([id, e]) => sessionSnapshot(
          id,
          e,
          bridgePids.get(id) ?? 0,
          attached.has(id),
          bridgeBuilds.get(id) ?? ""
        )
      )
    }),
    draining: () => draining2,
    // A pause asked during handover becomes a harness pause (suspend.ts), not a refusal.
    answerDraining(id, msg) {
      const scope = handed.get(id);
      const p = scope ? runIn(scope, () => localSuspend(msg)) : null;
      if (scope && p) {
        const settled2 = p.then(() => runIn(scope, pauseSettled));
        answering.add(settled2);
        void settled2.finally(() => answering.delete(settled2)).catch(() => {
        });
      }
      return p;
    },
    find: (id) => sessions.get(id) ?? null,
    open(hello) {
      const id = `s${++counter2}-${process.pid}`;
      let engine = null;
      let s2;
      try {
        s2 = streamSeamSession(
          id,
          (io, logTo) => engine = openSession(
            io,
            {
              argv: hello.argv,
              env: hello.env ?? {},
              cwd: hello.cwd,
              pid: hello.pid,
              path: hello.path,
              patSha: hello.patSha ?? null
            },
            { id, log: logTo }
          ),
          (msg) => log(
            `session ${id}: said while no thin bridge was attached — lost: ${JSON.stringify(msg).slice(0, 160)}`
          ),
          (line) => journal(`[${id}] ${line}`)
        );
      } catch (e) {
        return errorMessage(e);
      }
      const opened = engine;
      const traced = {
        ...s2,
        deliver: (msg) => {
          if (process.env[envName("BRIDGE_DAEMON_TRACE")])
            journal(`[${id}] rpc ${msg.method ?? "reply"} ${JSON.stringify(msg.id ?? null)}`);
          s2.deliver(msg);
        },
        attach: (sink, logSink) => {
          if (sink) attached.add(id);
          else attached.delete(id);
          s2.attach(sink, logSink);
        },
        end: (why) => {
          attached.delete(id);
          bridgePids.delete(id);
          bridgeBuilds.delete(id);
          return s2.end(why).then(() => {
            if (sessions.get(id) !== traced) return;
            sessions.delete(id);
            engines.delete(id);
            log(`session ${id} ended: ${why}`);
            armIdle();
          });
        }
      };
      sessions.set(id, traced);
      bridgePids.set(id, hello.pid);
      bridgeBuilds.set(id, hello.build);
      if (opened) engines.set(id, opened);
      idle.hold();
      log(
        `session ${id} for pid ${hello.pid} (${hello.build}, ${hello.path}) argv=${JSON.stringify(hello.argv)}`
      );
      if (lastNotice && opened?.scope) {
        const notice = lastNotice;
        runIn(opened.scope, () => pendNotice(notice));
      }
      newerBridge(hello);
      return traced;
    }
  };
  const started = Date.now();
  for (; ; ) {
    try {
      server = await listenSeam(authDir, (socket) => {
        sockets.add(socket);
        socket.on("close", () => sockets.delete(socket));
        serveSeam(socket, host, GRACE_MS);
      });
      break;
    } catch (e) {
      const code = e.code;
      if (code === "EADDRINUSE" && successor && Date.now() - started < SUCCESSOR_WAIT_MS) {
        await new Promise((r) => setTimeout(r, 100));
        continue;
      }
      log(`the daemon does not rise: ${errorMessage(e)}`);
      process.exit(code === "EADDRINUSE" ? DAEMON_BUSY_EXIT : 3);
    }
  }
  log(`listening ${seamSocketPath(authDir)}${successor ? " (successor)" : ""}`);
  let door = null;
  try {
    door = await listenOrchestraDoor(
      authDir,
      orchestraServe(authDir, {
        base: () => {
          for (const e of engines.values()) {
            const url = e.scope ? runIn(e.scope, () => H2.currentUrl) : H2.currentUrl;
            if (url) return apiBase(url);
          }
          const records = holdRecordsWhere(() => true);
          const freshest = records.reduce(
            (best, r) => !best || eraOf(r) > eraOf(best) ? r : best,
            null
          );
          return freshest?.url ? apiBase(freshest.url) : "";
        },
        token: bearer,
        // The discovered half of the boundary (#8202, word [27] of №1260): realms of the
        // places the machine's live sessions stand on, plus whatever hold records on disk
        // are still live by age or departure. The record's spelling is kept as written —
        // a short rN resolves downstream by the realm list the same api serves, and a dead
        // record leaves by liveness, never by the form of its name.
        realms: () => {
          const found = /* @__PURE__ */ new Set();
          const ofSession = () => {
            const own = /* @__PURE__ */ new Set();
            if (state.standing?.realm) own.add(state.standing.realm);
            for (const x of extraPlaces()) if (x.standing?.realm) own.add(x.standing.realm);
            return [...own];
          };
          for (const e of engines.values()) {
            for (const r of e.scope ? runIn(e.scope, ofSession) : ofSession()) if (r) found.add(r);
          }
          for (const r of holdRecordsWhere(() => true))
            if (r.realm && r.at !== void 0 && r.left !== true && Date.now() - r.at < HOLD_RECORD_MAX_AGE_MS)
              found.add(r.realm);
          return [...found];
        }
      })
    );
  } catch (e) {
    log(`the orchestration door does not open: ${errorMessage(e)}`);
  }
  pruneFallbacks(authDir);
  startEngine(cfg, { freshness: false });
  startFreshnessWatch(
    authDir,
    cfg.serverUrl,
    (notice) => {
      lastNotice = notice;
      for (const e of engines.values()) if (e.scope) runIn(e.scope, () => tellNotice(notice));
    },
    checkHome
  );
  const homeTimer = setInterval(checkHome, HOME_CHECK_MS);
  homeTimer.unref();
  checkHome();
  armIdle();
  const stop = (sig) => {
    if (draining2) return;
    draining2 = true;
    log(`${sig} — ending ${sessions.size} session(s)`);
    server?.close();
    door?.close();
    for (const id of sessions.keys()) {
      if (!attached.has(id) && !ownPidAlive(bridgePids.get(id))) continue;
      const scope = engines.get(id)?.scope;
      if (scope) runIn(scope, () => beginSessionHandover(`daemon ${sig}`));
    }
    void Promise.allSettled([...sessions.values()].map((s2) => s2.end(sig))).then(() => {
      for (const so of sockets) so.destroy();
      return handoffsSettled();
    }).then(() => process.exit(0));
  };
  process.on("SIGTERM", () => stop("SIGTERM"));
  process.on("SIGINT", () => stop("SIGINT"));
}
function spawnDaemon(file, authDir, successor) {
  try {
    const child = spawn3(
      process.execPath,
      [file, "daemon", "--auth-dir", authDir, ...successor ? ["--successor"] : []],
      {
        detached: true,
        stdio: "ignore",
        cwd: seamRunDir(authDir),
        env: process.env,
        windowsHide: true
      }
    );
    child.on("error", (e) => log(`the successor did not start: ${e.message}`));
    child.unref();
  } catch (e) {
    log(`the successor did not start: ${errorMessage(e)}`);
  }
}

// js/bridge/thin.ts
import { createInterface as createInterface3 } from "node:readline";
import { PassThrough as PassThrough2 } from "node:stream";

// js/bridge/raise.ts
import { spawn as spawn4 } from "node:child_process";
import { readFileSync as readFileSync31 } from "node:fs";
import { fileURLToPath as fileURLToPath6 } from "node:url";
var RAISE_STALE_MS = 15e3;
var SELF2 = (() => {
  try {
    return fileURLToPath6(import.meta.url);
  } catch {
    return process.argv[1] ?? "";
  }
})();
function daemonEntry() {
  const named2 = process.env[envName("BRIDGE_DAEMON_ENTRY")]?.trim();
  if (named2) return named2;
  if (updatesDisabled()) return SELF2;
  const home = homeBridgePath();
  try {
    const v = versionIn(readFileSync31(home, "utf8"));
    if (home !== SELF2 && compareVersions(v, VERSION) > 0) return home;
  } catch {
  }
  return SELF2;
}
function raiseDaemon(authDir) {
  const lock = takeFileLock(seamRaiseLockPath(authDir), RAISE_STALE_MS);
  if (!lock.held) return lock.fault ? { kind: "fault", why: lock.fault } : { kind: "other" };
  const entry = daemonEntry();
  log(`no bridge daemon for ${authDir} — raising one: ${entry} daemon`);
  try {
    const child = spawn4(process.execPath, [entry, "daemon", "--auth-dir", authDir], {
      detached: true,
      stdio: "ignore",
      cwd: seamRunDir(authDir),
      env: daemonEnv(),
      windowsHide: true
    });
    child.unref();
    const failed = new Promise((r) => {
      child.once("error", (e) => r({ code: null, why: `the daemon did not start: ${e.message}` }));
      child.once(
        "exit",
        (code, sig) => r({ code, why: `the daemon exited at once (${sig ?? `code ${code}`})` })
      );
    });
    return { kind: "raising", release: lock.release, failed };
  } catch (e) {
    lock.release();
    return { kind: "fault", why: `the daemon did not start: ${e.message}` };
  }
}

// js/bridge/thin.ts
var ATTACH_MS = ms(envName("BRIDGE_DAEMON_WAIT_MS"), 5e3);
var REATTACH_MS = ms(envName("BRIDGE_DAEMON_REATTACH_MS"), 3e4);
var BYE_MS = ms(envName("BRIDGE_BYE_MS"), 5e3);
var HELLO_MS = 3e3;
var POLL_MS = 100;
var SUCCESSOR_MS = 2e4;
var BUSY_RETRY_MS = 2e3;
var GATE_MS = 2e4;
function daemonWanted() {
  if (process.env[DAEMON_ENV]?.trim() === "0") return false;
  const off = process.env[NO_DAEMON_ENV]?.trim();
  return !off || off === "0";
}
function thinMain(argv2) {
  const cfg = parseArgs(argv2);
  setConfig(cfg);
  const authDir = cfg.authDir;
  const patSha = patShaOf(cfg.pat);
  installCrashWords();
  let mode = "attaching";
  let link = null;
  let sessionId = null;
  let local = null;
  let initCopy = null;
  let initSent = false;
  let initializedSeen = false;
  let word3 = null;
  let leaving = null;
  let byeDone = null;
  let heldKey2 = null;
  let paused = false;
  let everAttached = false;
  let successorAwaited = 0;
  const queue2 = [];
  const flights = /* @__PURE__ */ new Map();
  const verdicted = /* @__PURE__ */ new Set();
  const replayIds = /* @__PURE__ */ new Set();
  const realmIds = realmListAsk();
  const cancelled = /* @__PURE__ */ new Set();
  let replays = 0;
  const key2 = (id) => JSON.stringify(id);
  const writeHarness = (m) => writeTo(process.stdout, JSON.stringify(m) + "\n");
  const toHarness = (msg) => {
    if (msg.method === void 0 && msg.id !== void 0 && msg.id !== null) {
      const k = key2(msg.id);
      if (realmIds.reply(msg, log)) {
        openGate(k);
        return;
      }
      if (replayIds.delete(k)) {
        const back = resuming.get(k);
        resuming.delete(k);
        if (back) {
          if (msg.result?.resumed !== true) {
            const why = String(msg.result?.word ?? msg.error?.message ?? "?");
            placeLost(back.key, back.realm, why, msg.result?.stopped === true);
          }
          besideJudge();
          askRealms();
        }
        openGate(k);
        return;
      }
      cancelled.delete(k);
      if (verdicted.delete(k)) {
        debug(`a late answer to ${k} dropped — the harness already has its verdict`);
        return;
      }
      const f = flights.get(k);
      flights.delete(k);
      if (f?.msg.method === method("suspend") && msg.result?.suspended === true) paused = true;
      if (word3 && f?.msg.method === "tools/call" && Array.isArray(msg.result?.content)) {
        msg.result.content.push({ type: "text", text: word3 });
        word3 = null;
      }
    }
    const place = placeWord(msg);
    heldKey2 = places.seen(place, heldKey2, mode === "daemon" && !leaving);
    writeHarness(msg);
  };
  const gate = /* @__PURE__ */ new Set();
  let gateTimer = null;
  const openGate = (k) => {
    if (k) gate.delete(k);
    else gate.clear();
    if (gate.size) return;
    if (gateTimer) clearTimeout(gateTimer);
    gateTimer = null;
    for (const m of queue2.splice(0)) dispatch2(m);
  };
  const closeGate = (k) => {
    gate.add(k);
    gateTimer ??= setTimeout(() => {
      gateTimer = null;
      if (!gate.size) return;
      log(
        `the new session did not answer the bridge's own calls in ${GATE_MS}ms — letting calls through`
      );
      openGate();
    }, GATE_MS);
  };
  const places = lostPlaces(writeHarness, log);
  const live2 = places.live;
  const resuming = /* @__PURE__ */ new Map();
  const placeLost = (k, realm, why, stopped = false) => {
    places.lose(k, realm, why, cfg.satellite && k === heldKey2, stopped);
    if (k === heldKey2) heldKey2 = null;
  };
  const besideDue = /* @__PURE__ */ new Map();
  const besideJudge = () => {
    for (const [k, realm] of besideDue)
      if (!live2.has(k)) placeLost(k, realm, words(THIN).besideNotBack());
    besideDue.clear();
  };
  const askRealms = () => {
    const m = realmIds.ask(places.lostCount(), () => `${ID_PREFIX}thin-realms-${++replays}`);
    if (!m) return;
    if (mode === "daemon" && link) toDaemon(link, m);
    else if (mode === "local") toLocal(m);
    else return;
    closeGate(key2(m.id));
  };
  const verdictAll = (why, acks, resend = false) => {
    const again = [];
    for (const [k, f] of flights) {
      if (resend && acks && !f.acked) {
        if (cancelled.delete(k)) flights.delete(k);
        else again.push(f.msg);
        continue;
      }
      writeHarness(syntheticError(f.id, why, !acks || f.acked ? UNKNOWN : NOT_SENT));
      verdicted.add(k);
      flights.delete(k);
    }
    return again;
  };
  const toDaemon = (l, msg) => {
    if (msg.method === "initialize") initSent = true;
    const f = msg.id !== void 0 && msg.id !== null ? flights.get(key2(msg.id)) : void 0;
    if (f && f.msg === msg) f.acked = false;
    l.send({ t: "rpc", msg });
  };
  const toLocal = (msg) => {
    if (msg.method === "initialize") initSent = true;
    local?.input.write(JSON.stringify(msg) + "\n");
  };
  const dispatch2 = (msg) => {
    const refusal2 = !gate.size && msg.id != null ? places.refusal(msg) : null;
    if (refusal2) {
      flights.delete(key2(msg.id));
      writeHarness({
        jsonrpc: "2.0",
        id: msg.id,
        result: { isError: true, content: [{ type: "text", text: refusal2 }] }
      });
    } else if (gate.size) queue2.push(msg);
    else if (mode === "daemon" && link) toDaemon(link, msg);
    else if (mode === "local") toLocal(msg);
    else queue2.push(msg);
  };
  const replay2 = (send2) => {
    if (!initCopy || !initSent) return;
    if (!queue2.some((m) => m.method === "initialize")) {
      const id = `${ID_PREFIX}thin-replay-${++replays}`;
      replayIds.add(key2(id));
      closeGate(key2(id));
      send2({ ...initCopy, id });
      if (initializedSeen) send2({ jsonrpc: "2.0", method: "notifications/initialized" });
    }
    const held2 = heldKey2 ? { key: heldKey2, realm: live2.get(heldKey2) ?? "" } : null;
    for (const [k, realm] of live2) if (k !== heldKey2) besideDue.set(k, realm);
    live2.clear();
    if (!held2 || paused) besideJudge();
    if (held2 && paused)
      log(`the session is new — its place ${held2.key} is paused and waits on its pause record`);
    else if (held2) {
      const call = resumeCall(held2.key, ++replays);
      replayIds.add(key2(call.id));
      resuming.set(key2(call.id), held2);
      closeGate(key2(call.id));
      log(`the session is new — bringing its place ${held2.key} back from the hold record`);
      send2(call);
    }
  };
  const goLocal = (reason) => {
    if (mode === "local" || leaving) return;
    log(`${reason} — going as the full bridge inside this process`);
    markFallback(authDir, { build: BUILD, cwd: process.cwd(), why: reason });
    word3 = `${BRIDGE_NAME} ${BUILD}: ${reason}; this bridge runs as the full bridge in its own process (the machine's daemon is the default; ${DAEMON_ENV}=0 runs the full bridge on purpose).`;
    const input = new PassThrough2();
    const output = new PassThrough2();
    startEngine(cfg);
    const session = openSession({ input, output });
    createInterface3({ input: output, terminal: false }).on("line", (line) => {
      if (!line.trim()) return;
      try {
        toHarness(JSON.parse(line));
      } catch {
      }
    });
    local = { session, input };
    mode = "local";
    replay2(toLocal);
    askRealms();
    for (const m of queue2.splice(0)) dispatch2(m);
  };
  const onWelcome = (l) => {
    if (leaving) return l.close();
    const w5 = l.welcome;
    const resumed = w5.resumed && !!sessionId && w5.session === sessionId;
    sessionId = w5.session;
    link = l;
    mode = "daemon";
    everAttached = true;
    log(
      `through the machine's bridge daemon ${w5.build} (pid ${w5.pid}), session ${sessionId}` + (resumed ? " — resumed" : "")
    );
    l.onFrame((f) => {
      if (f.t === "rpc") toHarness(f.msg);
      else if (f.t === "ack") {
        const fl = flights.get(key2(f.id));
        if (fl) fl.acked = true;
        cancelled.delete(key2(f.id));
      } else if (f.t === "log")
        writeTo(process.stderr, f.line.endsWith("\n") ? f.line : `${f.line}
`);
      else if (f.t === "handover") {
        successorAwaited = Date.now();
        log(
          `the machine's bridge daemon hands over to its successor (${f.why ?? "?"}) — waiting for it`
        );
      } else if (f.t === "bye-ok") byeDone?.();
    });
    l.onClose(() => {
      if (link !== l) return;
      link = null;
      if (leaving) return byeDone?.();
      lost(!!w5.ack);
    });
    if (!resumed) replay2((m) => toDaemon(l, m));
    askRealms();
    for (const m of queue2.splice(0)) dispatch2(m);
  };
  const lost = (acks) => {
    mode = "attaching";
    replayIds.clear();
    resuming.clear();
    realmIds.forget();
    gate.clear();
    if (gateTimer) clearTimeout(gateTimer);
    gateTimer = null;
    const inFlight = flights.size;
    const again = verdictAll(
      "the link to this machine's bridge daemon broke before the answer came back",
      acks,
      true
    );
    log(
      `the link to the machine's bridge daemon broke — ${inFlight} call(s) in flight: ${again.length} not taken by the daemon go again after the reattach, ${inFlight - again.length} get a verdict; reattaching`
    );
    queue2.unshift(...again);
    void attach2();
  };
  const attach2 = async () => {
    const unsafe = seamEntranceProblem(authDir);
    if (unsafe) return goLocal(`the daemon's entrance is not private (${unsafe})`);
    const socketPath = seamSocketPath(authDir);
    const wait = everAttached ? REATTACH_MS : ATTACH_MS;
    const deadline = Date.now() + wait;
    let raise = null;
    let raiseFailed = null;
    let raiseAgainAt = 0;
    try {
      for (; ; ) {
        if (leaving) return;
        try {
          const hello = helloFrame({ build: BUILD, path: SELF2, argv: argv2, session: sessionId, patSha });
          return onWelcome(await connectSeam(socketPath, hello, HELLO_MS));
        } catch (e) {
          if (!(e instanceof SeamError)) throw e;
          if (e.kind === "refused")
            return goLocal(`the machine's bridge daemon refused this bridge: ${e.message}`);
          const successorDue = !!successorAwaited && Date.now() - successorAwaited < SUCCESSOR_MS;
          if (e.kind === "absent" && !raise && !successorDue && Date.now() >= raiseAgainAt) {
            const r = raiseDaemon(authDir);
            raise = r;
            if (r.kind === "fault")
              return goLocal(`cannot raise the bridge daemon for ${authDir}: ${r.why}`);
            if (r.kind === "raising")
              void r.failed.then(({ code, why }) => {
                if (code !== DAEMON_BUSY_EXIT) return void (raiseFailed = why);
                r.release();
                if (raise === r) raise = null;
                raiseAgainAt = Date.now() + BUSY_RETRY_MS;
              });
          }
          if (raiseFailed) return goLocal(`no bridge daemon for ${authDir}: ${raiseFailed}`);
          if (Date.now() >= deadline)
            return goLocal(`no bridge daemon for ${authDir} answered in ${wait}ms (${e.message})`);
          await sleep(POLL_MS);
        }
      }
    } finally {
      if (raise?.kind === "raising") raise.release();
    }
  };
  const rl = createInterface3({ input: process.stdin, terminal: false });
  rl.on("line", (line) => {
    const trimmed2 = line.trim();
    if (!trimmed2) return;
    let msg;
    try {
      msg = JSON.parse(trimmed2);
    } catch {
      log(`unparseable line from harness: ${trimmed2.slice(0, 120)}`);
      return;
    }
    if (msg.method === "initialize") initCopy = msg;
    if (msg.method === "notifications/initialized") initializedSeen = true;
    if (msg.method === "notifications/cancelled") {
      const k = key2(msg.params?.requestId);
      const f = flights.get(k);
      if (f && !f.acked) {
        const i = queue2.indexOf(f.msg);
        if (i >= 0) {
          queue2.splice(i, 1);
          flights.delete(k);
        } else cancelled.add(k);
      }
    }
    if (msg.method && msg.id !== void 0 && msg.id !== null) {
      verdicted.delete(key2(msg.id));
      cancelled.delete(key2(msg.id));
      flights.set(key2(msg.id), { id: msg.id, msg, acked: false });
    }
    dispatch2(seeSession(msg));
  });
  const leave = (why) => leaving ??= windDown(why);
  const windDown = async (why) => {
    debug(`${why} — winding down`);
    let acks = false;
    if (mode === "local" && local) {
      await local.session.leave(why);
    } else if (link) {
      const l = link;
      acks = !!l.welcome.ack;
      await new Promise((resolve11) => {
        byeDone = resolve11;
        setTimeout(resolve11, BYE_MS).unref?.();
        l.send({ t: "bye", why });
      });
      l.close();
    } else acks = true;
    verdictAll("the bridge left before the machine's daemon answered", acks);
    await flushStdout(process.stdout);
    process.exit(0);
  };
  rl.on("close", () => void leave("stdin closed, the harness is gone"));
  process.on("SIGTERM", () => void leave("SIGTERM"));
  const localSigint = fullBridgeSigint(leave);
  let interrupted = false;
  process.on("SIGINT", () => {
    if (mode === "local") return localSigint();
    if (interrupted) process.exit(0);
    interrupted = true;
    void leave("SIGINT");
  });
  void attach2().catch((e) => goLocal(`the seam failed: ${e?.message ?? String(e)}`));
}

// js/bridge/main.ts
function bridgeMain(argv2) {
  guardStream(process.stdout);
  guardStream(process.stderr);
  if (daemonWanted()) {
    thinMain(argv2);
    return;
  }
  const cfg = parseArgs(argv2);
  markFallback(cfg.authDir, {
    build: BUILD,
    cwd: process.cwd(),
    why: `the daemon switch is off (${envName("BRIDGE_DAEMON")}=0 or ${envName("BRIDGE_NO_DAEMON")})`
  });
  startEngine(cfg);
  const session = openSession({ input: process.stdin, output: process.stdout });
  void session.ended.then(() => process.exit(0));
  process.on("SIGTERM", () => void session.leave("SIGTERM"));
  process.on("SIGINT", fullBridgeSigint(session.leave));
  installCrashWords();
}

// js/bridge/probe.ts
import { fileURLToPath as fileURLToPath7 } from "node:url";
var HELLO_MS2 = 3e3;
var SELF3 = (() => {
  try {
    return fileURLToPath7(import.meta.url);
  } catch {
    return process.argv[1] ?? "";
  }
})();
async function versionLines(args) {
  const lines = [BUILD];
  if (!daemonWanted()) return lines;
  const d = await probeDaemon(args);
  lines.push(
    d.ok ? `daemon ${d.build} (pid ${d.pid}, ${d.socket})` : d.unsafe ? `daemon: the entrance is not private (${d.why})` : `daemon: none answering at ${d.socket} (${d.why})`
  );
  return lines;
}
async function probeDaemon(args) {
  const i = args.indexOf("--auth-dir");
  const authDir = (i >= 0 ? args[i + 1] : void 0) || process.env[envName("BRIDGE_AUTH_DIR")] || defaultAuthDir();
  const unsafe = seamEntranceProblem(authDir);
  if (unsafe) return { ok: false, socket: "", why: unsafe, unsafe: true };
  const socket = seamSocketPath(authDir);
  try {
    const l = await connectSeam(
      socket,
      helloFrame({ build: BUILD, path: SELF3, argv: args, probe: true }),
      HELLO_MS2
    );
    l.close();
    const w5 = l.welcome;
    return { ok: true, socket, build: w5.build, pid: w5.pid, sessions: w5.sessions, path: w5.path };
  } catch (e) {
    return { ok: false, socket, why: e.message };
  }
}

// js/watchdog/codex.ts
import { existsSync as existsSync10 } from "node:fs";
import { homedir as homedir8 } from "node:os";
import { join as join29 } from "node:path";

// js/shared/appserver.ts
import { randomBytes as randomBytes5 } from "node:crypto";
import { request } from "node:http";
function frame(data) {
  const mask = randomBytes5(4);
  let head;
  if (data.length < 126) head = Buffer.from([129, 128 | data.length]);
  else if (data.length < 65536) {
    head = Buffer.alloc(4);
    head[0] = 129;
    head[1] = 128 | 126;
    head.writeUInt16BE(data.length, 2);
  } else {
    head = Buffer.alloc(10);
    head[0] = 129;
    head[1] = 128 | 127;
    head.writeBigUInt64BE(BigInt(data.length), 2);
  }
  const masked = Buffer.from(data.map((b, i) => b ^ mask[i % 4]));
  return Buffer.concat([head, mask, masked]);
}
function openDoor(socketPath, onMessage, onClose) {
  return new Promise((resolve11, reject) => {
    const req = request({
      socketPath,
      path: "/",
      method: "GET",
      headers: {
        Connection: "Upgrade",
        Upgrade: "websocket",
        "Sec-WebSocket-Version": "13",
        "Sec-WebSocket-Key": randomBytes5(16).toString("base64")
      }
    });
    req.on("upgrade", (_res, socket) => {
      let buf = Buffer.alloc(0);
      socket.on("data", (c) => {
        buf = Buffer.concat([buf, c]);
        for (; ; ) {
          if (buf.length < 2) return;
          const op = buf[0] & 15;
          let len = buf[1] & 127;
          let off = 2;
          if (len === 126) {
            if (buf.length < 4) return;
            len = buf.readUInt16BE(2);
            off = 4;
          } else if (len === 127) {
            if (buf.length < 10) return;
            len = Number(buf.readBigUInt64BE(2));
            off = 10;
          }
          if (buf.length < off + len) return;
          const payload = buf.subarray(off, off + len);
          buf = buf.subarray(off + len);
          if (op === 1) {
            try {
              onMessage(JSON.parse(payload.toString("utf8")));
            } catch {
            }
          } else if (op === 8) socket.end();
        }
      });
      socket.on("close", () => onClose(words(APPSERVER).socketClosed()));
      socket.on("error", (e) => onClose(e.message));
      resolve11({
        send: (msg) => socket.write(frame(Buffer.from(JSON.stringify(msg)))),
        close: () => socket.end()
      });
    });
    req.on("response", (res) => reject(new Error(words(APPSERVER).doorNotOpened(res.statusCode))));
    req.on("error", reject);
    req.end();
  });
}

// js/watchdog/client.ts
import { existsSync as existsSync9, readdirSync as readdirSync13, readFileSync as readFileSync32 } from "node:fs";
import { connect as connect5 } from "node:net";
import { join as join28 } from "node:path";

// js/watchdog/words.ts
var wd = () => words(WATCHDOG);
var doer = (text2) => wd().doer(text2);

// js/watchdog/client.ts
var ATTACH_WINDOW_MS = Number(process.env[envName("WATCHDOG_ATTACH_MS")]) || 6e4;
var RETRY_MS3 = 1e3;
var SILENT_MS = 2 ** 30;
function parseWatchdogArgs(argv2) {
  const out7 = { authDir: authDirFromEnv() };
  for (let i = 0; i < argv2.length; i++) {
    const a = argv2[i];
    if (a === "--auth-dir") out7.authDir = argv2[++i] ?? out7.authDir;
    else if (a === "--lang") setLang(argv2[++i]);
    else if (!a.startsWith("--") && !out7.key) out7.key = a;
  }
  return out7;
}
function resolveStanding(argv2) {
  const { key: key2, authDir } = parseWatchdogArgs(argv2);
  const dir2 = standingsDirOf(authDir);
  const pathFor = (k) => socketPathOf(authDir, k);
  if (key2) return { key: key2, path: pathFor(key2), authDir };
  const held2 = existsSync9(dir2) ? readdirSync13(dir2).filter((f) => f.endsWith(".key")).map((f) => {
    try {
      return readFileSync32(join28(dir2, f), "utf8").trim();
    } catch {
      return "";
    }
  }).filter(Boolean) : [];
  if (held2.length === 1) return { key: held2[0], path: pathFor(held2[0]), authDir };
  if (held2.length === 0) {
    return {
      error: wd().noHeld()
    };
  }
  return {
    error: wd().severalHeld(held2.join(", "))
  };
}
function adoptSeenPath(named2, current2, seen) {
  if (!named2 || named2 === current2) return current2;
  seen.clear();
  for (const x of seenIds(named2)) seen.add(x);
  return named2;
}
function staleOf(ev, has) {
  if (!ev.unshown) return staleBatch(ev.frames ?? [], has);
  const shown = (ev.frames ?? []).flatMap((f) => deliveryKeys(f));
  const named2 = ev.unshown.map((k) => /^evs?:/.test(k) ? `c${k}` : k);
  return { text: ev.text ?? "", keys: [...shown, ...named2] };
}
function heldHeads(groups, marks, carriers = []) {
  const own = new Set(carriers.flatMap((f) => deliveryKeys(f)));
  const has = (k) => marks(k) || own.has(k);
  return groups.map((g) => g.filter((f) => carriers.includes(f) || !eventIn(f, has))).filter((g) => g.length).map(batchHead);
}
function attach(path, o) {
  let startedAt = Date.now();
  let attached = false;
  let handover = false;
  let waitingBack = false;
  let ownRelease = false;
  let forgotten = false;
  function tryOnce() {
    const sock = connect5(path);
    let buf = "";
    sock.setEncoding("utf8");
    sock.on("connect", () => {
      attached = true;
      waitingBack = false;
    });
    sock.on("data", (chunk) => {
      buf += chunk;
      const lines = buf.split("\n");
      buf = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.trim()) continue;
        let ev;
        try {
          ev = JSON.parse(line);
        } catch {
          continue;
        }
        if (ev.kind === "frame" && ev.frame === void 0 && typeof ev.raw === "string") {
          try {
            ev.frame = JSON.parse(ev.raw);
          } catch {
            ev.frame = null;
          }
        }
        if (ev.kind === "handover") {
          handover = true;
          continue;
        }
        if (ev.kind === "released" && ev.own) ownRelease = true;
        if (ev.kind === "released" && ev.beside) forgotten = true;
        o.onEvent(ev);
      }
    });
    sock.on("error", () => {
    });
    sock.on("close", () => {
      if (attached && handover) {
        attached = false;
        handover = false;
        waitingBack = true;
        startedAt = Date.now();
        return void setTimeout(tryOnce, RETRY_MS3);
      }
      if (ownRelease) return;
      if (forgotten) return void setInterval(() => {
      }, SILENT_MS);
      if (attached) return o.onGone(wd().bridgeLetGo());
      if (Date.now() - startedAt > ATTACH_WINDOW_MS) {
        const s2 = ATTACH_WINDOW_MS / 1e3;
        return o.onGone(waitingBack ? wd().seatNotBack(s2, path) : wd().noSocket(path, s2));
      }
      setTimeout(tryOnce, RETRY_MS3);
    });
  }
  tryOnce();
}

// js/watchdog/codex.ts
var FLUSH_WAIT_MS = 5e3;
var note2 = (s2) => {
  process.stderr.write(s2 + "\n");
};
function codexDoorPath() {
  const home = process.env.CODEX_HOME?.trim() || join29(homedir8(), ".codex");
  return join29(home, "app-server-control", "app-server-control.sock");
}
function runWatchdogCodex(argv2) {
  parseWatchdogArgs(argv2);
  const threadId = process.env.CODEX_THREAD_ID?.trim();
  if (!threadId) {
    note2(wd().noThread());
    process.exit(2);
  }
  const socketPath = codexDoorPath();
  if (!existsSync10(socketPath)) {
    note2(wd().noDoor(socketPath));
    process.exit(2);
  }
  const target = resolveStanding(argv2);
  if ("error" in target) {
    note2(doer(target.error));
    process.exit(2);
  }
  let seenPath = seenFilePathOf(target.authDir, target.key);
  const seen = seenIds(seenPath);
  const waiting2 = /* @__PURE__ */ new Map();
  let door = null;
  let ready = null;
  let nextId = 1;
  let forgotten = false;
  function open() {
    if (ready) return ready;
    ready = openDoor(
      socketPath,
      (m) => {
        const ids = !m?.method && typeof m?.id === "number" ? waiting2.get(m.id) : void 0;
        if (!ids) return;
        waiting2.delete(m.id);
        settle2(m.id, !m.error);
        if (m.error) return note2(wd().threadRefused(m.error.message ?? wd().refusal()));
        note2(wd().framePut(threadId));
        for (const id of ids) noteSeen(seenPath, id, seen);
      },
      (why) => {
        door = null;
        ready = null;
        const lost = [...waiting2.values()].flat();
        const gone = [...waiting2.keys()];
        waiting2.clear();
        for (const r of gone) settle2(r, false);
        note2(wd().doorClosed(why, lost.join(", ")));
      }
    ).then((d) => {
      door = d;
      d.send({
        method: "initialize",
        id: nextId++,
        params: { clientInfo: { name: CLIENTS.watchdog, title: PRODUCT, version: "1" } }
      });
      d.send({ method: "initialized" });
      const back = again.splice(0);
      if (back.length && !forgotten) putStale(back);
      return d;
    });
    ready.catch((e) => {
      note2(wd().doorNotOpened(e.message));
      ready = null;
    });
    return ready;
  }
  const inFlight = /* @__PURE__ */ new Set();
  function deliver3(text2, ids = []) {
    if (forgotten) return Promise.resolve();
    const reqId = nextId++;
    waiting2.set(reqId, ids);
    const p = put(reqId, text2).finally(() => inFlight.delete(p));
    inFlight.add(p);
    return p;
  }
  async function put(reqId, text2) {
    try {
      const d = door ?? await open();
      if (forgotten) return void waiting2.delete(reqId);
      d.send({
        method: "turn/start",
        id: reqId,
        params: { threadId, input: [{ type: "text", text: text2 }], turnTrigger: LOGGERS.channel }
      });
      note2(wd().frameSent(threadId));
    } catch (e) {
      if (waiting2.delete(reqId)) settle2(reqId, false);
      note2(wd().frameNotPut(e.message));
    }
  }
  const heldBy = /* @__PURE__ */ new Map();
  const again = [];
  function holdOut(items) {
    return items.filter((h) => {
      if (eventIn(h.frame, (k) => seen.has(k))) return true;
      const r = [...waiting2].find(([, ids]) => eventIn(h.frame, (k) => ids.includes(k)))?.[0];
      if (r === void 0) return true;
      heldBy.set(r, [...heldBy.get(r) ?? [], h]);
      return false;
    });
  }
  function settle2(reqId, ok) {
    const held2 = heldBy.get(reqId) ?? [];
    heldBy.delete(reqId);
    if (ok) return held2.forEach((h) => h.ids.forEach((k) => noteSeen(seenPath, k, seen)));
    pend.unshift(...held2.filter((h) => !h.stale).map(({ frame: frame2, ids }) => ({ frame: frame2, ids })));
    const stale = held2.filter((h) => h.stale).map((h) => h.frame);
    if (!stale.length) return;
    if (door) putStale(stale);
    else again.push(...stale);
  }
  function putStale(frames, ev) {
    const rest2 = ev?.unshown ? frames : holdOut(frames.map((f) => ({ frame: f, ids: deliveryKeys(f), stale: true }))).map(
      (h) => h.frame
    );
    const b = staleOf({ ...ev ?? { kind: "stale" }, frames: rest2 }, (k) => seen.has(k));
    if (b.text) void deliver3(b.text, b.keys);
    else for (const k of b.keys) noteSeen(seenPath, k, seen);
  }
  let replay2 = 0;
  let pend = [];
  const withPend = (text2, ids, carrier) => {
    const got = holdOut(pend.map((p) => ({ ...p, stale: false })));
    pend = [];
    const head = heldHeads([got.map((g) => g.frame)], (k) => seen.has(k), carrier ? [carrier] : []);
    const keys = [...got.flatMap((g) => g.ids), ...ids];
    const lines = [...head, ...text2 ? [text2] : []];
    if (!lines.length) return void keys.forEach((k) => noteSeen(seenPath, k, seen));
    void deliver3(lines.join("\n"), keys);
  };
  attach(target.path, {
    onEvent: (ev) => {
      switch (ev.kind) {
        case "frame": {
          const fromRing = replay2 > 0;
          if (fromRing) replay2--;
          const type = ev.frame?.type;
          if (type !== "message") return note2(wd().notWakeup(type));
          if (fromRing && typeof ev.frame?.id !== "string") return note2(wd().noIdFromRing());
          if (typeof ev.frame?.id === "string" && seen.has(ev.frame.id))
            return note2(wd().alreadyPut(ev.frame.id));
          if (ev.batch && ev.frame && !addressedToMine(ev.frame)) {
            pend.push({ frame: ev.frame, ids: deliveryKeys(ev.frame) });
            pend.splice(0, Math.max(0, pend.length - 500));
            return;
          }
          withPend(frameToText(ev.frame, ev.raw ?? ""), deliveryKeys(ev.frame), ev.frame);
          break;
        }
        case "stale":
          putStale(ev.frames ?? [], ev);
          break;
        case "dead":
        case "evicted":
          note2(ev.text ?? wd().seatLost());
          void deliver3(ev.text ?? wd().codexLost()).then(() => process.exit(1));
          break;
        case "stopped":
          note2(ev.text ?? wd().seatLost());
          process.exit(0);
          break;
        case "alive":
          note2(ev.text ?? wd().aliveNote());
          void deliver3(ev.text ?? wd().codexAlive());
          break;
        case "attached":
          replay2 = ev.buffered ?? 0;
          seenPath = adoptSeenPath(ev.seen, seenPath, seen);
          note2(wd().listeningCodex(ev.key, threadId));
          break;
        case "released":
          note2(wd().bridgeReleasedSocket(ev.text ?? ""));
          if (ev.beside && !ev.own) {
            forgotten = true;
            pend = [];
            again.length = 0;
            break;
          }
          if (!ev.own) break;
          if (pend.length) withPend("", []);
          if (again.length) putStale(again.splice(0));
          setTimeout(() => {
            note2(wd().flushNotPut(FLUSH_WAIT_MS / 1e3));
            process.exit(1);
          }, FLUSH_WAIT_MS);
          void Promise.allSettled([...inFlight]).then(() => process.exit(0));
          break;
        default:
          note2(ev.text ?? ev.kind);
      }
    },
    onGone: (why) => {
      note2(doer(why));
      process.exit(1);
    }
  });
}

// js/watchdog/watchdog.ts
import { writeSync } from "node:fs";

// js/watchdog/replay.ts
var RingReplay = class {
  /** How many ring frames were printed as lines for the doer. */
  printed = 0;
  /** The ring's last hello, as a raw line. */
  hello = "";
  left = 0;
  release = null;
  /** A new attach: the attach-line gate opens when the ring is delivered or the time is up. */
  start(buffered, waitMs) {
    this.end();
    this.left = buffered;
    this.printed = 0;
    this.hello = "";
    let done = () => {
    };
    const ready = new Promise((r) => done = r);
    this.release = done;
    setTimeout(() => this.release === done && this.end(), waitMs);
    return ready;
  }
  /** A frame came: true if it is from the ring. */
  next() {
    if (this.left <= 0) return false;
    this.left--;
    return true;
  }
  /** An event is handled: once the ring is delivered, the gate opens. */
  settle() {
    if (this.release && this.left === 0) this.end();
  }
  /** Stop waiting for ring frames: the watchdog's last word does not stand behind the gate. */
  end() {
    this.left = 0;
    this.release?.();
    this.release = null;
  }
};

// js/watchdog/watchdog.ts
var LINE_MAX = 400;
function wrapLines(text2, max = LINE_MAX) {
  const out7 = [];
  for (const line of text2.split("\n")) {
    let rest2 = line;
    while ([...rest2].length > max) {
      const head = [...rest2].slice(0, max).join("");
      const cut = head.lastIndexOf(" ");
      const at3 = cut > max / 2 ? cut : head.length;
      out7.push(rest2.slice(0, at3).trimEnd());
      rest2 = rest2.slice(at3).trimStart();
    }
    out7.push(rest2);
  }
  return out7;
}
var ALONE_GAP_MS = Number(process.env[envName("WATCHDOG_ALONE_MS")]) || 300;
var RIDERS_MAX = 100;
var queue = Promise.resolve();
var lastAt = 0;
var lastAlone = false;
var REPLAY_WAIT_MS = 1e3;
var out2 = (lines, alone = false, after2, ready) => {
  queue = queue.then(async () => {
    await ready;
    const wait = lastAt && (alone || lastAlone) ? lastAt + ALONE_GAP_MS - Date.now() : 0;
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    const text2 = typeof lines === "function" ? lines() : lines;
    if (!text2.length) return after2?.();
    const failed = await new Promise(
      (r) => process.stdout.write(text2.join("\n") + "\n", (e) => r(!!e))
    );
    lastAt = Date.now();
    lastAlone = alone;
    if (!failed) after2?.();
  });
};
var log2 = (s2) => out2([s2]);
var loudExit = (s2, code) => {
  queue = queue.then(() => exitNow(s2, code));
};
var exitNow = (s2, code) => {
  try {
    writeSync(1, s2 + "\n");
    process.exit(code);
  } catch {
    process.stdout.write(s2 + "\n", () => process.exit(code));
    setTimeout(() => process.exit(code), 1e3).unref();
  }
};
function runWatchdog(argv2) {
  const target = resolveStanding(argv2);
  if ("error" in target) {
    writeSync(2, `${doer(target.error)}
`);
    process.exit(2);
  }
  let seenPath = seenFilePathOf(target.authDir, target.key);
  const seen = seenIds(seenPath);
  const queued = /* @__PURE__ */ new Set();
  const folded = [];
  const cases = /* @__PURE__ */ new Set();
  let head = false;
  let fresh2 = false;
  let batch = [];
  const riders = [];
  const riderMarks = [];
  const hold = () => {
    if (head) riders.push(batch);
    riders.splice(0, Math.max(0, riders.length - RIDERS_MAX));
    head = false;
  };
  let block = {
    lines: [],
    marks: [],
    carriers: []
  };
  const take3 = (carriers) => {
    const groups = [...riders.splice(0), ...head ? [batch] : []];
    head = false;
    return {
      lines: () => heldHeads(groups, (k) => seen.has(k), carriers),
      marks: riderMarks.splice(0)
    };
  };
  const ring = new RingReplay();
  const leave = (s2, code) => {
    ring.end();
    loudExit(s2, code);
  };
  attach(target.path, {
    onEvent: (ev) => {
      const fromRing = ev.kind === "frame" && ring.next();
      switch (ev.kind) {
        case "attached": {
          seenPath = adoptSeenPath(ev.seen, seenPath, seen);
          const ready = ring.start(ev.buffered ?? 0, REPLAY_WAIT_MS);
          const key2 = ev.key;
          out2(
            () => [
              wd().listening(key2, ring.printed ? wd().backfilled(wd().frames(ring.printed)) : ""),
              ...ring.hello ? [ring.hello] : []
            ],
            false,
            void 0,
            ready
          );
          break;
        }
        case "frame": {
          const f = ev.frame;
          if (fromRing && f?.type === "hello") {
            ring.hello = ev.raw ?? "";
            break;
          }
          if (f?.type !== "message") {
            log2(ev.raw ?? "");
            break;
          }
          const id = typeof f.id === "string" ? f.id : "";
          const again = !!id && (seen.has(id) || queued.has(id));
          if (id && !again) queued.add(id);
          const mark = () => {
            for (const k of deliveryKeys(f)) noteSeen(seenPath, k, seen);
            queued.delete(id);
          };
          if (ev.batch) {
            if (ev.batch.at === 1) {
              cases.clear();
              fresh2 = false;
              batch = [];
              block = { lines: [], marks: [], carriers: [] };
            }
            batch.push(f);
            if (!again) fresh2 = true;
            if (ev.batch.folded) {
              if (!again) folded.push(mark);
            } else {
              const within = folded.splice(0);
              const all2 = () => [...within, mark].forEach((m) => m());
              if (!addressedToMine(f)) riderMarks.push(all2);
              else if (again) all2();
              else {
                const first2 = !cases.has(caseKey(f));
                cases.add(caseKey(f));
                if (fromRing) ring.printed++;
                block.lines.push(...wrapLines(batchLine(f, ev.batch.fold, first2)));
                block.marks.push(all2);
                block.carriers.push(f);
              }
            }
            if (ev.batch.at < ev.batch.of) break;
            if (!fresh2) head = false;
            if (!block.lines.length) {
              hold();
              break;
            }
            const r = take3(block.carriers);
            const { lines, marks } = block;
            out2(
              () => [...r.lines(), ...lines],
              false,
              () => [...r.marks, ...marks].forEach((m) => m())
            );
            break;
          }
          if (!again) {
            if (fromRing) ring.printed++;
            const r = take3([f]);
            out2(r.lines, false, () => r.marks.forEach((m) => m()));
            out2(wrapLines(frameToText(f, ev.raw ?? "")), true, mark);
          }
          break;
        }
        case "note":
          if (ev.batch)
            head = true;
          else log2(ev.text ?? "");
          break;
        case "stale": {
          let keys = [];
          const lines = () => {
            const b = staleOf(ev, (k) => seen.has(k));
            keys = b.keys;
            return b.text ? wrapLines(b.text) : [];
          };
          out2(lines, false, () => {
            for (const k of keys) noteSeen(seenPath, k, seen);
          });
          break;
        }
        case "dead":
        case "evicted":
          leave(ev.text ?? wd().seatLost(), 1);
          break;
        case "stopped":
          leave(ev.text ?? wd().seatLost(), 0);
          break;
        case "alive":
          log2(ev.text ?? wd().aliveNote());
          break;
        case "released":
          if (ev.own) leave(wd().bridgeReleasedSocket(ev.text ?? ""), 0);
          else if (ev.beside) process.stderr.write(wd().bridgeReleasedSocket(ev.text ?? "") + "\n");
          else log2(wd().bridgeReleasedSocket(ev.text ?? ""));
          break;
      }
      ring.settle();
    },
    onGone: (why) => leave(doer(why), 1)
  });
}

// js/watchdog/watchdog-exit.ts
import { createHash as createHash8 } from "node:crypto";
import { writeSync as writeSync2 } from "node:fs";
function frameId(ev) {
  const id = ev.frame?.id;
  return typeof id === "string" && id ? id : `raw:${createHash8("sha256").update(ev.raw ?? "").digest("hex").slice(0, 16)}`;
}
var wake = (s2) => {
  writeSync2(1, s2 + "\n");
};
var note3 = (s2) => {
  writeSync2(2, s2 + "\n");
};
function runWatchdogExit(argv2) {
  const target = resolveStanding(argv2);
  if ("error" in target) {
    note3(doer(target.error));
    process.exit(2);
  }
  let seenPath = seenFilePathOf(target.authDir, target.key);
  const seen = seenIds(seenPath);
  let head = false;
  let fresh2 = false;
  let block = { lines: [], shown: [], ids: [] };
  const folded = [];
  const cases = /* @__PURE__ */ new Set();
  let batch = [];
  const riders = [];
  const riderIds = [];
  const hold = () => {
    if (head) riders.push(batch);
    riders.splice(0, Math.max(0, riders.length - 100));
    head = false;
  };
  attach(target.path, {
    onEvent: (ev) => {
      switch (ev.kind) {
        case "frame": {
          const type = ev.frame?.type;
          if (type !== "message") return note3(wd().notWakeup(type));
          const id = frameId(ev);
          const f = ev.frame ?? null;
          const has = (k) => seen.has(k);
          const deliver3 = (groups2, lines, shown, ids) => {
            for (const s2 of [...heldHeads(groups2, has, shown), ...lines]) wake(s2);
            const keys = [...riderIds.splice(0), ...ids, ...shown.flatMap((s2) => deliveryKeys(s2))];
            for (const k of keys) noteSeen(seenPath, k, seen);
            process.exit(0);
          };
          if (!ev.batch) {
            if (seen.has(id)) return note3(wd().seenEarlier(id));
            return deliver3(
              riders.splice(0),
              [f ? frameToText(f, ev.raw ?? "") : ev.raw ?? ""],
              f ? [f] : [],
              [id]
            );
          }
          if (ev.batch.at === 1) {
            batch = [];
            cases.clear();
            block = { lines: [], shown: [], ids: [] };
            fresh2 = false;
          }
          if (f) batch.push(f);
          if (seen.has(id)) note3(wd().seenEarlier(id));
          else {
            fresh2 = true;
            if (ev.batch.folded) folded.push(id);
            else if (!f || !addressedToMine(f)) riderIds.push(id, ...folded.splice(0));
            else {
              const first2 = !cases.has(caseKey(f));
              cases.add(caseKey(f));
              block.lines.push(batchLine(f, ev.batch.fold, first2));
              block.shown.push(f);
              block.ids.push(id, ...folded.splice(0));
            }
          }
          if (ev.batch.at < ev.batch.of) return;
          if (!fresh2) head = false;
          if (!block.lines.length) {
            hold();
            return note3(wd().unaddressed());
          }
          const groups = [...riders.splice(0), ...head ? [batch] : []];
          head = false;
          return deliver3(groups, block.lines, block.shown, block.ids);
        }
        case "stale":
          {
            const b = staleOf(ev, (k) => seen.has(k));
            if (b.text) note3(b.text);
            for (const k of b.keys) noteSeen(seenPath, k, seen);
          }
          break;
        case "dead":
        case "alive":
        case "evicted":
          note3(ev.text ?? wd().seatLost());
          process.exit(1);
          break;
        case "stopped":
          wake(ev.text ?? wd().seatLost());
          process.exit(0);
          break;
        case "attached":
          seenPath = adoptSeenPath(ev.seen, seenPath, seen);
          note3(wd().listening(ev.key));
          break;
        case "released":
          note3(wd().bridgeReleasedSocket(ev.text ?? ""));
          if (ev.own) process.exit(0);
          break;
        default:
          if (ev.kind === "note" && ev.batch) head = true;
          note3(ev.text ?? ev.kind);
      }
    },
    onGone: (why) => {
      note3(doer(why));
      process.exit(1);
    }
  });
}

// js/cli/doctor.ts
import { createHash as createHash9 } from "node:crypto";
import { existsSync as existsSync16, readFileSync as readFileSync37 } from "node:fs";
import { homedir as homedir15 } from "node:os";
import { dirname as dirname15, join as join35 } from "node:path";
import { fileURLToPath as fileURLToPath8 } from "node:url";

// js/cli/codexcache.ts
import { existsSync as existsSync11, readdirSync as readdirSync14 } from "node:fs";
import { join as join30 } from "node:path";

// js/cli/installnames.ts
var PRODUCT_PATTERN = escapeRe(PRODUCT);
var PRODUCT_RE = new RegExp(PRODUCT_PATTERN);
var PLUGIN_KEY_RE = new RegExp(`^${escapeRe(PLUGIN_NAME)}@`);
var BRIDGE_FILE_RE = new RegExp(escapeRe(BRIDGE_FILE));

// js/cli/codexcache.ts
var list2 = (d) => {
  try {
    return readdirSync14(d);
  } catch {
    return [];
  }
};
var isCopy = (d) => existsSync11(join30(d, ".codex-plugin", "plugin.json"));
function codexCopies(home) {
  const cache = join30(home, "plugins", "cache");
  const out7 = [];
  for (const market of list2(cache))
    for (const plugin of list2(join30(cache, market))) {
      if (!PRODUCT_RE.test(plugin)) continue;
      const dir2 = join30(cache, market, plugin);
      const versions = isCopy(dir2) ? [] : list2(dir2).filter((v) => isCopy(join30(dir2, v)));
      if (!versions.length) out7.push({ market, plugin, dir: dir2 });
      for (const v of versions) out7.push({ market, plugin, dir: join30(dir2, v) });
    }
  return out7;
}

// js/cli/doctornode.ts
import { accessSync, constants } from "node:fs";
import { homedir as homedir11 } from "node:os";
import { basename as basename8, dirname as dirname13, isAbsolute as isAbsolute4 } from "node:path";

// js/cli/subagents.ts
import { existsSync as existsSync12, readdirSync as readdirSync15, readFileSync as readFileSync33, statSync as statSync10 } from "node:fs";
import { homedir as homedir10 } from "node:os";
import { basename as basename7, delimiter, dirname as dirname12, isAbsolute as isAbsolute3, join as join31, resolve as resolve8 } from "node:path";

// js/cli/frontmatter.ts
function frontmatterText(file) {
  const body = file.charCodeAt(0) === 65279 ? file.slice(1) : file;
  const lines = body.split(/\r?\n/);
  if (lines[0]?.trim() !== "---") return null;
  const end = lines.findIndex((l, i) => i > 0 && l.trim() === "---");
  return end < 0 ? null : lines.slice(1, end).join("\n");
}
function parseScalar(raw) {
  const s2 = raw.trim();
  if (s2.startsWith("[") && s2.endsWith("]")) return splitFlow(s2.slice(1, -1)).map(parseScalar);
  if (s2.startsWith("{") && s2.endsWith("}")) {
    const out7 = {};
    for (const part of splitFlow(s2.slice(1, -1))) {
      const m = KEY.exec(part);
      if (m) out7[unquoteKey(m[1].trim())] = m[2] === void 0 ? null : parseScalar(m[2]);
    }
    return out7;
  }
  if (s2.startsWith('"')) {
    try {
      return JSON.parse(s2);
    } catch {
      return s2.slice(1, s2.lastIndexOf('"') > 0 ? s2.lastIndexOf('"') : void 0);
    }
  }
  if (s2.startsWith("'"))
    return s2.slice(1, s2.lastIndexOf("'") > 0 ? s2.lastIndexOf("'") : void 0).replace(/''/g, "'");
  return s2.replace(/\s+#.*$/, "");
}
function splitFlow(body) {
  const parts = [];
  let depth = 0;
  let quote2 = null;
  let cur = "";
  for (let i = 0; i < body.length; i++) {
    const c = body[i];
    if (quote2) {
      cur += c;
      if (c === "\\" && quote2 === '"') cur += body[++i] ?? "";
      else if (c === quote2) quote2 = null;
      continue;
    }
    if (c === '"' || c === "'") quote2 = c;
    else if (c === "[" || c === "{") depth++;
    else if (c === "]" || c === "}") depth--;
    else if (c === "," && depth === 0) {
      if (cur.trim()) parts.push(cur.trim());
      cur = "";
      continue;
    }
    cur += c;
  }
  if (cur.trim()) parts.push(cur.trim());
  return parts;
}
var KEY = /^("[^"]*"|'[^']*'|[^\s"'#{[-][^:]*?|-[^\s:][^:]*?)\s*:(?:\s+(.*))?$/;
var BLOCK_SCALAR = /^[|>][-+0-9]*$/;
var unquoteKey = (k) => k.startsWith('"') && k.endsWith('"') || k.startsWith("'") && k.endsWith("'") ? k.slice(1, -1) : k;
function parseFrontmatter(text2) {
  const lines = [];
  for (const raw of text2.split(/\r?\n/)) {
    if (!raw.trim() || /^\s*#/.test(raw)) continue;
    const indent = raw.length - raw.trimStart().length;
    lines.push({ indent, text: raw.trim() });
  }
  let i = 0;
  const isItem = (l) => l.text === "-" || l.text.startsWith("- ");
  const scalarAt = (raw, owner) => {
    const more = [];
    while (i < lines.length && lines[i].indent > owner) more.push(lines[i++].text);
    const head = raw.trim();
    if (BLOCK_SCALAR.test(head)) return more.join(head.startsWith("|") ? "\n" : " ");
    return more.length ? [head, ...more].join(" ") : parseScalar(head);
  };
  const block = (indent) => {
    const first2 = lines[i];
    if (!first2 || first2.indent < indent) return null;
    return isItem(first2) ? list3(first2.indent) : map(first2.indent);
  };
  const map = (indent) => {
    const outMap = {};
    while (i < lines.length && lines[i].indent === indent && !isItem(lines[i])) {
      const m = KEY.exec(lines[i].text);
      i++;
      if (!m) {
        while (i < lines.length && lines[i].indent > indent) i++;
        continue;
      }
      const key2 = unquoteKey(m[1].trim());
      if (m[2] !== void 0 && m[2].trim() !== "") outMap[key2] = scalarAt(m[2], indent);
      else {
        const next = lines[i];
        outMap[key2] = next && (next.indent > indent || next.indent === indent && isItem(next)) ? block(next.indent) : null;
      }
    }
    return outMap;
  };
  const list3 = (indent) => {
    const items = [];
    while (i < lines.length && lines[i].indent === indent && isItem(lines[i])) {
      const content = lines[i].text.slice(1).trimStart();
      if (!content) {
        i++;
        const next = lines[i];
        items.push(next && next.indent > indent ? block(next.indent) : null);
        continue;
      }
      if (KEY.test(content)) {
        lines[i] = { indent: indent + (lines[i].text.length - content.length), text: content };
        items.push(map(lines[i].indent));
        continue;
      }
      i++;
      items.push(scalarAt(content, indent));
    }
    return items;
  };
  const top = block(0);
  return top && typeof top === "object" && !Array.isArray(top) ? top : {};
}

// js/cli/satform.ts
import { homedir as homedir9 } from "node:os";
import { basename as basename6 } from "node:path";
var SATELLITE_ARGS = ["-e", SATELLITE_CODE, "--", "--satellite"];
var SHELLS = /* @__PURE__ */ new Set(["sh", "bash", "zsh", "dash"]);
var cmdBase = (c) => basename6(c.replace(/\\/g, "/")).replace(/\.exe$/i, "").toLowerCase();
var isToolList = (v) => !!v && v.split(",").some((s2) => s2.trim().length > 0);
function toolsTail(e) {
  const words2 = SHELLS.has(cmdBase(e.command)) ? (e.args[e.args.indexOf("-c") + 1] ?? "").split(/\s+/).map((w5) => w5.replace(/^["']|["']$/g, "")) : e.args;
  const at3 = words2.indexOf("--tools");
  const v = at3 >= 0 ? words2[at3 + 1] : void 0;
  return isToolList(v) ? ["--tools", v] : [];
}
function formOf2(e) {
  const base = cmdBase(e.command);
  if (base === "node" && (e.args[0] === "-e" || e.args[0] === "--eval")) {
    const sep3 = e.args.indexOf("--", 2);
    if (sep3 < 0) return e.args.slice(2).includes("--satellite") ? "eval-no-sep" : "session";
    const after2 = e.args.slice(sep3 + 1);
    const spliced = /process\.argv\.splice\(\s*1\s*,\s*0\s*,/.test(e.args[1] ?? "");
    if (!(spliced ? after2 : after2.slice(1)).includes("--satellite")) return "eval-session";
    const tail2 = after2.slice(1);
    const known2 = !tail2.length || tail2.length === 2 && tail2[0] === "--tools" && isToolList(tail2[1]);
    return e.args[1] === SATELLITE_CODE && after2[0] === "--satellite" && known2 ? "eval" : "eval-other";
  }
  if (SHELLS.has(base)) {
    const s2 = e.args[e.args.indexOf("-c") + 1] ?? "";
    return s2.includes("--satellite") ? "shell" : "session";
  }
  return e.args.includes("--satellite") ? "path" : "session";
}
var P5 = PRODUCT_PATTERN;
var HOME_DIR_RE = new RegExp(escapeRe(HOME_DIR));
var EVAL_PATH_RE = new RegExp(`['"\`]([^'"\`]*${P5}[^'"\`]*\\.mjs)['"\`]`);
var SHELL_PATH_RE = new RegExp(
  `"([^"]*${P5}[^"]*\\.mjs)"|'([^']*${P5}[^']*\\.mjs)'|(\\S*${P5}\\S*\\.mjs)`
);
var ARG_PATH_RE = new RegExp(`${P5}[^\\\\/]*\\.mjs$`, "i");
var expandHome = (p) => p.replace(/^~(?=[\\/])/, homedir9()).replace(/\$\{HOME\}|\$HOME|%USERPROFILE%|\$\{USERPROFILE\}|\$USERPROFILE/g, homedir9());
function bridgePathOf(e) {
  const base = cmdBase(e.command);
  if (base === "node" && (e.args[0] === "-e" || e.args[0] === "--eval")) {
    const code = e.args[1] ?? "";
    if (/homedir\(\)/.test(code) && HOME_DIR_RE.test(code)) return homeBridgePath();
    const m = EVAL_PATH_RE.exec(code);
    return m ? expandHome(m[1]) : null;
  }
  if (SHELLS.has(base)) {
    const s2 = e.args[e.args.indexOf("-c") + 1] ?? "";
    const m = SHELL_PATH_RE.exec(s2);
    const raw = m?.[1] ?? m?.[2] ?? m?.[3];
    return raw ? expandHome(raw) : null;
  }
  const arg = [e.command, ...e.args].find((a) => ARG_PATH_RE.test(a));
  return arg ? expandHome(arg) : null;
}
function readyEntry(name2, disallowed, tail2 = []) {
  return [
    "mcpServers:",
    `  - ${name2}:`,
    "      type: stdio",
    "      command: node",
    `      args: [${[...SATELLITE_ARGS, ...tail2].map((a) => JSON.stringify(a)).join(", ")}]`,
    `disallowedTools: ${disallowed.join(", ")}`
  ].join("\n");
}

// js/cli/satprobe.ts
import { spawn as spawn5 } from "node:child_process";
import { createInterface as createInterface4 } from "node:readline";
var sw3 = () => words(SAT_PROBE);
var PROBE_MS = Number(process.env[envName("DOCTOR_PROBE_MS")]) || 3e4;
var REQUEST_MS = 2e4;
var WIN_WAIT_MS = 4e4;
var loginAdvice = () => sw3().loginAdvice();
async function probeSatellite(label, e, cwd) {
  const lines = [];
  const findings = [];
  const env2 = {
    ...process.env,
    ...e.env,
    [envName("BRIDGE_NO_BROWSER")]: "1",
    [envName("BRIDGE_NO_UPDATE")]: "1",
    [envName("BRIDGE_ORPHAN_FLOW_MS")]: "1",
    [envName("BRIDGE_TIMEOUT")]: e.env[envName("BRIDGE_TIMEOUT")] ?? String(REQUEST_MS)
  };
  delete env2[envName("CHANNEL_SOCKET")];
  delete env2[envName("CHANNEL_STATUS")];
  const child = spawn5(e.command, e.args, { cwd, env: env2, stdio: ["pipe", "pipe", "pipe"] });
  child.stdin.on("error", () => {
  });
  let stderr = "";
  child.stderr.on("data", (c) => stderr = (stderr + c.toString()).slice(-4e3));
  const replies = /* @__PURE__ */ new Map();
  let wake2 = null;
  createInterface4({ input: child.stdout }).on("line", (l) => {
    try {
      const m = JSON.parse(l);
      if (typeof m.id === "number") replies.set(m.id, m);
    } catch {
    }
    wake2?.();
  });
  let exited = null;
  child.on("error", (err) => {
    exited = err.message;
    wake2?.();
  });
  child.on("exit", (code, sig) => {
    exited ??= sw3().exited(String(code ?? sig));
    wake2?.();
  });
  const deadline = Date.now() + PROBE_MS;
  const ask3 = async (id, method2, params) => {
    if (!exited)
      child.stdin.write(JSON.stringify({ jsonrpc: "2.0", id, method: method2, params }) + "\n", () => {
      });
    while (!replies.has(id) && !exited && Date.now() < deadline)
      await new Promise((res) => {
        wake2 = res;
        setTimeout(res, 200);
      });
    return replies.get(id) ?? null;
  };
  const tail2 = () => stderr.trim().split("\n").slice(-2).map((s2) => s2.slice(0, 300)).join(" | ");
  const init = await ask3(1, "initialize", {
    protocolVersion: "2025-06-18",
    capabilities: {},
    clientInfo: { name: CLIENTS.doctor, version: "1" }
  });
  const refusal2 = (what, raw) => {
    const msg = String(raw ?? "");
    return SAT_LOGIN_RE.test(msg) ? sw3().refusalLogin(label, what, loginAdvice()) : sw3().refusal(label, what, msg.slice(0, 300));
  };
  if (!init) {
    const why = exited ?? sw3().silent(Math.round(PROBE_MS / 1e3));
    const flag = /unknown argument: --tools/.test(stderr) ? "--tools" : SAT_OLD_FLAG_RE.test(stderr) ? "--satellite" : null;
    const old = flag ? sw3().oldFlag(flag) : sw3().runByHand();
    const stderrNote = tail2() ? `; stderr: ${tail2()}` : "";
    findings.push(sw3().noInit(label, why, stderrNote, old));
  } else if (init.error) {
    findings.push(refusal2("initialize", init.error.message));
  } else {
    child.stdin.write(
      JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }) + "\n",
      () => {
      }
    );
    const info = init.result?.serverInfo ?? {};
    const list3 = await ask3(2, "tools/list", {});
    const tools = list3?.result?.tools ?? [];
    const name2 = info.name ?? "?";
    const version = info.version ?? "?";
    if (!list3) findings.push(sw3().noList(label, name2, version, exited));
    else if (list3.error) findings.push(refusal2("tools/list", list3.error.message));
    else {
      lines.push(sw3().answered(label, name2, version, tools.length));
      for (const t of tools) {
        const bad = ["oneOf", "allOf", "anyOf"].filter((k) => t.inputSchema && k in t.inputSchema);
        if (bad.length) findings.push(sw3().schema(t.name, bad.join(", ")));
      }
    }
  }
  const gone = new Promise((res) => exited ? res() : child.once("exit", () => res()));
  const within = (ms2) => Promise.race([
    gone.then(() => true),
    new Promise((res) => setTimeout(() => res(false), ms2).unref())
  ]);
  child.stdin.end();
  if (process.platform === "win32") {
    if (!await within(WIN_WAIT_MS)) {
      child.kill();
      findings.push(sw3().winKilled(label, WIN_WAIT_MS / 1e3));
    }
    return { lines, findings };
  }
  if (!await within(1e4)) {
    child.kill("SIGTERM");
    if (!await within(REQUEST_MS + 1e4)) {
      child.kill("SIGKILL");
      const secs2 = Math.round((REQUEST_MS + 2e4) / 1e3);
      findings.push(sw3().sigKilled(label, secs2));
    }
  }
  return { lines, findings };
}

// js/cli/subwords.ts
var subWords = () => words(SUBAGENT);
var formWord = (form) => subWords().form(form);
var todo = () => subWords().todo();

// js/cli/subagents.ts
var PLATFORM_ENV = envName("DOCTOR_PLATFORM");
var platform = () => process.env[PLATFORM_ENV] || process.platform;
var BRIDGE_RE = new RegExp(
  `${escapeRe(BRIDGE_NAME)}|(^|[\\\\/"'\\s])${PRODUCT_PATTERN}[^\\\\/"'\\s]*\\.mjs`
);
var TEMPLATE_PARENTS = [
  `mcp__${BRIDGE_NAME}`,
  `mcp__plugin_${PLUGIN_NAME}_${PRODUCT}`,
  `mcp__${PRODUCT}`
];
var str4 = (v) => typeof v === "string" ? v : "";
function entriesOf(fm) {
  const raw = fm.mcpServers;
  const pairs = [];
  if (Array.isArray(raw)) {
    for (const item of raw) {
      if (typeof item === "string") pairs.push([item, null]);
      else if (item && typeof item === "object" && !Array.isArray(item))
        for (const [k, v] of Object.entries(item)) pairs.push([k, v]);
    }
  } else if (raw && typeof raw === "object") pairs.push(...Object.entries(raw));
  return pairs.map(([name2, v]) => {
    const spec = v && typeof v === "object" && !Array.isArray(v) ? v : {};
    const args = Array.isArray(spec.args) ? spec.args.map((a) => str4(a)) : [];
    const env2 = {};
    if (spec.env && typeof spec.env === "object" && !Array.isArray(spec.env))
      for (const [k, e] of Object.entries(spec.env)) env2[k] = str4(e);
    return { name: name2, ref: v === null, command: str4(spec.command), args, env: env2 };
  });
}
var listOf = (v) => Array.isArray(v) ? v.map((x) => str4(x).trim()).filter(Boolean) : str4(v).split(",").map((x) => x.trim()).filter(Boolean);
function agentFiles(dir2, scope) {
  if (!existsSync12(dir2)) return [];
  let names2;
  try {
    names2 = readdirSync15(dir2).filter((f) => f.endsWith(".md"));
  } catch {
    return [];
  }
  return names2.sort().map((f) => {
    const path = join31(dir2, f);
    let fm = {};
    try {
      const text2 = frontmatterText(readFileSync33(path, "utf8"));
      if (text2 !== null) fm = parseFrontmatter(text2);
    } catch {
    }
    return { path, agent: str4(fm.name) || basename7(f, ".md"), scope, fm };
  });
}
function projectRoot() {
  const home = resolve8(homedir10());
  let gitRoot = null;
  for (let d = process.cwd(); ; ) {
    if (resolve8(d) === home) break;
    if (existsSync12(join31(d, ".claude", "agents")) || existsSync12(join31(d, ".opencode", "agents")))
      return d;
    if (!gitRoot && existsSync12(join31(d, ".git"))) gitRoot = d;
    const up = dirname12(d);
    if (up === d) break;
    d = up;
  }
  return gitRoot ?? process.cwd();
}
function which(cmd, cwd) {
  if (isAbsolute3(cmd) || /[\\/]/.test(cmd)) {
    const p = resolve8(cwd, cmd);
    return existsSync12(p) ? p : null;
  }
  const exts = platform() === "win32" ? ["", ...(process.env.PATHEXT || ".COM;.EXE;.BAT;.CMD").split(";").filter(Boolean)] : [""];
  for (const dir2 of (process.env.PATH || "").split(delimiter).filter(Boolean)) {
    for (const ext of exts) {
      const p = join31(dir2, cmd + ext);
      try {
        if (statSync10(p).isFile()) return p;
      } catch {
      }
    }
  }
  return null;
}
function graphServer(url) {
  const norm = (u) => u.trim().replace(/\/+$/, "").toLowerCase();
  return isProductionServer(url) || norm(url) === norm(CFG.serverUrl);
}
function parentBridges(root) {
  const found = /* @__PURE__ */ new Set();
  const scan = (servers, prefix) => {
    if (!servers || typeof servers !== "object") return;
    for (const [n, v] of Object.entries(servers)) {
      const e = v ?? {};
      const hay = [e.command ?? "", ...e.args ?? []].join(" ");
      if (BRIDGE_RE.test(hay) && !hay.includes("--satellite")) found.add(prefix(n));
      else if (typeof e.url === "string" && graphServer(e.url)) found.add(prefix(n));
    }
  };
  const readJson2 = (p) => {
    try {
      return JSON.parse(readFileSync33(p, "utf8"));
    } catch {
      return null;
    }
  };
  const user = readJson2(join31(homedir10(), ".claude.json"));
  if (user) {
    scan(user.mcpServers, (n) => `mcp__${n}`);
    const projects = user.projects ?? {};
    const key2 = root.replace(/\\/g, "/");
    for (const [k, p] of Object.entries(projects))
      if (k.replace(/\\/g, "/") === key2) scan(p.mcpServers, (n) => `mcp__${n}`);
  }
  scan(readJson2(join31(root, ".mcp.json"))?.mcpServers, (n) => `mcp__${n}`);
  const registry = readJson2(join31(homedir10(), ".claude", "plugins", "installed_plugins.json"));
  const plugins = registry?.plugins ?? {};
  for (const [key2, installs] of Object.entries(plugins)) {
    const plugin = key2.split("@")[0];
    if (!PRODUCT_RE.test(plugin)) continue;
    for (const inst of installs)
      if (inst.installPath)
        scan(
          readJson2(join31(inst.installPath, ".mcp.json"))?.mcpServers,
          (n) => `mcp__plugin_${plugin}_${n}`
        );
  }
  return [...found];
}
function trustLine(root) {
  let cfg;
  try {
    cfg = JSON.parse(readFileSync33(join31(homedir10(), ".claude.json"), "utf8"));
  } catch {
    return null;
  }
  const keys = Object.entries(cfg.projects ?? {}).filter(([, p]) => p?.hasTrustDialogAccepted).map(([k]) => k.replace(/\\/g, "/").replace(/\/+$/, ""));
  const here = root.replace(/\\/g, "/").replace(/\/+$/, "");
  const chain = [];
  for (let d = here; ; ) {
    chain.push(d);
    const up = d.slice(0, d.lastIndexOf("/"));
    if (!up || up === d) break;
    d = up;
  }
  if (chain.some((d) => keys.includes(d))) return null;
  const near = keys.find((k) => chain.some((d) => d.toLowerCase() === k.toLowerCase()));
  if (near) return subWords().trustNear(near, here);
  return subWords().trustNone(here);
}
function hasGrant() {
  if (CFG.pat) return true;
  try {
    if (!existsSync12(storePath())) return false;
    const t = loadStore().tokens;
    return Boolean(t?.access_token || t?.refresh_token);
  } catch {
    return false;
  }
}
async function subagentsReport(out7) {
  const root = projectRoot();
  const userDir = join31(homedir10(), ".claude", "agents");
  const atHome = resolve8(root) === resolve8(homedir10());
  const project = atHome ? [] : agentFiles(join31(root, ".claude", "agents"), "project");
  const shadowed = new Set(project.map((f) => f.agent));
  const user = agentFiles(userDir, "user");
  const claude = [...project, ...user.filter((f) => !shadowed.has(f.agent))];
  const opencode = [
    ...agentFiles(join31(root, ".opencode", "agents"), "project"),
    ...agentFiles(join31(root, ".opencode", "agent"), "project")
  ];
  const osNote = process.env[PLATFORM_ENV] ? subWords().osJudged(platform()) : platform();
  out7(subWords().header(root, osNote));
  if (!claude.length && !opencode.length) {
    const dirs = `${join31(root, ".claude", "agents")}, ${userDir}, ${join31(root, ".opencode", "agents")}`;
    out7(subWords().noFiles(dirs));
    return;
  }
  for (const f of user.filter((f2) => shadowed.has(f2.agent))) out7(subWords().shadowed(f.path, f.agent));
  const parents = parentBridges(root);
  const required = parents.length ? parents : TEMPLATE_PARENTS;
  const byName = /* @__PURE__ */ new Map();
  const reports = [];
  for (const f of claude) {
    const lines = [];
    const expected = `${SUB_ENTRY_PREFIX}-${f.agent}`;
    const entries2 = entriesOf(f.fm);
    const ours = entries2.filter((e) => BRIDGE_RE.test([e.command, ...e.args].join(" ")));
    const sat = ours.filter((e) => formOf2(e) !== "session");
    let probeEntry = null;
    const own = sat.map((e) => `mcp__${e.name}`);
    const disallowed = listOf(f.fm.disallowedTools).map((d) => d.replace(/__\*$/, ""));
    const block = (name2, e) => subWords().withBlock(
      readyEntry(
        name2,
        [.../* @__PURE__ */ new Set([...disallowed, ...required])].filter((p) => p !== `mcp__${name2}`),
        e ? toolsTail(e) : []
      )
    );
    const canonical = (e) => ({
      name: subWords().proposed(e.name),
      ref: false,
      command: "node",
      args: [...SATELLITE_ARGS, ...toolsTail(e)],
      env: e.env
    });
    const refs = entries2.filter((e) => e.ref && PRODUCT_RE.test(e.name));
    for (const r of refs) lines.push(subWords().refEntry(r.name, block(expected)));
    if (!sat.length) {
      if (ours.length)
        lines.push(subWords().formEntry(ours[0].name, formWord("session"), block(expected, ours[0])));
      else if (!refs.length) lines.push(subWords().noEntry(block(expected)));
    }
    for (const e of sat) {
      byName.set(e.name, [...byName.get(e.name) ?? [], f.path]);
      if (e.name === SUB_ENTRY_PREFIX) lines.push(subWords().sharedName(f.agent));
      const name2 = e.name === SUB_ENTRY_PREFIX ? expected : e.name;
      const form = formOf2(e);
      if (form !== "eval") {
        lines.push(subWords().replaceEntry(e.name, formWord(form), block(name2, e)));
        if (!probeEntry && existsSync12(homeBridgePath())) probeEntry = canonical(e);
        continue;
      }
      if (!which(e.command, root)) {
        lines.push(subWords().noCommand(e.name, e.command));
        continue;
      }
      const bridge = bridgePathOf(e);
      if (bridge && !existsSync12(resolve8(root, bridge))) {
        lines.push(subWords().noBridge(bridge, homeBridgePath()));
        continue;
      }
      if (!probeEntry) probeEntry = e;
    }
    const need2 = required.filter((p) => !own.includes(p) && !disallowed.includes(p));
    if (sat.length && (need2.length || !disallowed.length)) {
      const fix2 = [.../* @__PURE__ */ new Set([...disallowed, ...required])].filter((p) => !own.includes(p)).join(", ");
      lines.push(subWords().callerBridges(need2.join(", "), fix2));
    }
    for (const o of own.filter((o2) => disallowed.includes(o2))) lines.push(subWords().ownRemoved(o));
    reports.push({ f, lines, probe: probeEntry, names: sat.map((e) => e.name) });
  }
  for (const [name2, files] of byName) {
    if (files.length < 2) continue;
    for (const r of reports.filter((r2) => files.includes(r2.f.path)))
      r.lines.push(subWords().nameShared(name2, files.length, files.join(", "), r.f.agent));
  }
  const grant = hasGrant();
  let noGrantSaid = false;
  const probed = /* @__PURE__ */ new Map();
  for (const r of reports) {
    const seen = [];
    if (r.probe && !grant) {
      r.lines.push(noGrantSaid ? subWords().noGrantAgain() : subWords().noGrant(loginAdvice()));
      noGrantSaid = true;
    } else if (r.probe) {
      const key2 = JSON.stringify([r.probe.command, r.probe.args, r.probe.env]);
      const first2 = probed.get(key2);
      if (first2) {
        if (first2.failed) r.lines.push(subWords().sameFailed(first2.label));
        else seen.push(subWords().sameProbe(first2.label));
      } else {
        const res = await probeSatellite(r.probe.name, r.probe, root);
        probed.set(key2, { label: r.probe.name, failed: res.findings.length > 0 });
        seen.push(...res.lines);
        r.lines.push(...res.findings);
      }
    }
    const where = r.f.scope === "user" ? subWords().userScope() : "";
    const named2 = r.names.length ? subWords().named(...r.names) : subWords().unnamed();
    out7(`  ${r.f.path}${where}: ${named2}${r.lines.length ? "" : subWords().fine()}`);
    for (const l of seen) out7(`    ${l}`);
    for (const l of r.lines) {
      const [head, ...rest2] = l.split("\n");
      out7(`    ${todo()} ${head}`);
      for (const b of rest2) out7(`      ${b}`);
    }
  }
  if (claude.length) {
    const t = trustLine(root);
    if (t && project.length) out7(`  ${todo()} ${t}`);
  }
  for (const f of opencode) {
    const keys = Object.keys(f.fm).filter((k) => k === "mcpServers" || k === "mcp");
    const keyNote = keys.length ? subWords().ocKeys(keys.join(", ")) : "";
    out7(subWords().ocAgent(f.path, keyNote));
  }
}

// js/cli/doctornode.ts
var hw = () => words(HARNESS);
var platform2 = () => process.env[envName("DOCTOR_PLATFORM")] || process.platform;
var SYSTEM_DIRS = {
  darwin: ["/usr/bin", "/bin", "/usr/sbin", "/sbin"],
  linux: ["/usr/local/bin", "/usr/bin", "/bin"]
};
var executable = (p) => {
  try {
    accessSync(p, constants.X_OK);
    return true;
  } catch {
    return false;
  }
};
var fix = (l, node) => hw().launchFix(l.harness, l.entry, node, homeBridgePath().replace(homedir11(), "$HOME"));
function launchReport(out7, launches2) {
  for (const l of launches2) {
    const cmd = l.command || "node";
    const found = which(cmd, process.cwd());
    if (!found || !executable(found)) {
      out7(`${todo()} ${hw().launchNotFound(l.who, cmd, isAbsolute4(cmd))}`);
      const own = /^node/i.test(basename8(process.execPath)) ? process.execPath : null;
      out7(fix(l, own));
      continue;
    }
    if (isAbsolute4(cmd)) {
      out7(hw().launchAbsolute(l.who, cmd));
      continue;
    }
    const dir2 = dirname13(found);
    const system = SYSTEM_DIRS[platform2()];
    if (!system || system.includes(dir2)) {
      out7(hw().launchFound(l.who, cmd, found));
      continue;
    }
    out7(hw().launchProfile(l.who, cmd, found, dir2));
    out7(fix(l, found));
  }
}
var openCodeRuntimeWord = () => hw().openCodeRuntime();

// js/cli/doctorpaths.ts
import { existsSync as existsSync13, readFileSync as readFileSync34 } from "node:fs";
import { homedir as homedir12 } from "node:os";
import { join as join32 } from "node:path";
var hw2 = () => words(HARNESS);
var readJson = (p) => {
  try {
    return JSON.parse(readFileSync34(p, "utf8"));
  } catch {
    return null;
  }
};
var httpEntries = (servers) => Object.entries(servers ?? {}).filter(([, v]) => typeof v?.url === "string" && graphServer(v.url)).map(([n, v]) => [n, String(v.url)]);
var say = (out7, where, name2, url, remove) => out7(`${todo()} ${hw2().secondPath(where, name2, url, remove)}`);
var CONNECTOR_RE = CONNECTOR_PATTERN;
function claudeCode(out7) {
  const file = join32(homedir12(), ".claude.json");
  const cfg = readJson(file);
  if (!cfg) return;
  for (const [n, url] of httpEntries(cfg.mcpServers))
    say(out7, `Claude Code (${file})`, n, url, `claude mcp remove "${n}" --scope user`);
  const projects = cfg.projects ?? {};
  for (const [dir2, p] of Object.entries(projects))
    for (const [n, url] of httpEntries(p?.mcpServers))
      say(
        out7,
        `Claude Code (${file}, ${dir2})`,
        n,
        url,
        `cd "${dir2}" && claude mcp remove "${n}" --scope local`
      );
  const mcp = join32(projectRoot(), ".mcp.json");
  for (const [n, url] of httpEntries(readJson(mcp)?.mcpServers))
    say(out7, `Claude Code (${mcp})`, n, url, hw2().deleteFrom(mcp));
  const ever = Array.isArray(cfg.claudeAiMcpEverConnected) ? cfg.claudeAiMcpEverConnected : [];
  for (const c of ever.map(String).filter((c2) => CONNECTOR_RE.test(c2)))
    out7(hw2().connector(c, file));
}
function codexHttp(text2) {
  const found = [];
  let section = null;
  for (const line of text2.split("\n")) {
    const head = /^\s*\[mcp_servers\.(?:"([^"]+)"|([^\]\s.]+))\]\s*$/.exec(line);
    if (head) section = head[1] ?? head[2] ?? null;
    else if (/^\s*\[/.test(line)) section = null;
    const url = /^\s*url\s*=\s*"([^"]+)"/.exec(line)?.[1];
    if (section && url && graphServer(url)) found.push([section, url]);
  }
  return found;
}
function secondPathReport(out7, codexHomes2) {
  claudeCode(out7);
  for (const home of codexHomes2) {
    const file = join32(home, "config.toml");
    if (!existsSync13(file)) continue;
    let text2;
    try {
      text2 = readFileSync34(file, "utf8");
    } catch {
      continue;
    }
    for (const [n, url] of codexHttp(text2))
      say(out7, `Codex (${file})`, n, url, `codex mcp remove "${n}"`);
  }
}

// js/cli/doctorskills.ts
import { existsSync as existsSync14, readFileSync as readFileSync35 } from "node:fs";
import { homedir as homedir13 } from "node:os";
import { join as join33, resolve as resolve9 } from "node:path";
var hw3 = () => words(HARNESS);
var IN_SET = join33(BRIDGE_SKILL, "scripts", BRIDGE_FILE);
function sets(codexHomes2) {
  const found = [];
  try {
    const reg = JSON.parse(
      readFileSync35(join33(homedir13(), ".claude", "plugins", "installed_plugins.json"), "utf8")
    );
    for (const [key2, installs] of Object.entries(reg.plugins ?? {}))
      if (PLUGIN_KEY_RE.test(key2)) {
        for (const i of installs)
          if (i.installPath) found.push([join33(i.installPath, "skills"), "claude"]);
      }
  } catch {
  }
  for (const home of codexHomes2)
    for (const c of codexCopies(home)) found.push([join33(c.dir, "skills"), "codex"]);
  found.push([join33(homedir13(), ".agents", "skills"), "flat"]);
  const own = skillsRoot();
  if (own) found.push([own, "other"]);
  const seen = /* @__PURE__ */ new Set();
  return found.filter(([root]) => {
    const key2 = resolve9(root);
    if (seen.has(key2) || !existsSync14(join33(root, IN_SET))) return false;
    seen.add(key2);
    return true;
  });
}
var how = (kind) => {
  const m = skillMoves();
  if (kind === "claude") return `Claude Code — ${m.claude}`;
  if (kind === "codex") return `Codex — ${m.codex}`;
  if (kind === "flat") return m.flat;
  return hw3().skillsOtherChannel(m.pi);
};
function skillsReport(out7, codexHomes2) {
  const latest = readLatest(CFG.authDir)?.version ?? null;
  const target = latest && compareVersions(latest, VERSION) > 0 ? latest : VERSION;
  const found = sets(codexHomes2);
  if (!found.length) out7(hw3().skillsNone());
  for (const [root, kind] of found) {
    let v = null;
    try {
      v = versionIn(readFileSync35(join33(root, IN_SET), "utf8"));
    } catch {
    }
    if (!v) out7(hw3().skillsUnreadable(root));
    else if (compareVersions(v, target) >= 0) out7(hw3().skillsCurrent(root, v));
    else {
      const below = compareVersions(v, VERSION) < 0;
      const why = below ? hw3().skillsBelowBridge(VERSION) : hw3().skillsBelowRelease(target);
      out7(`${todo()} ${hw3().skillsBehind(root, v, why, how(kind))}`);
    }
  }
}

// js/cli/opencode-config.ts
import { existsSync as existsSync15, readFileSync as readFileSync36 } from "node:fs";
import { homedir as homedir14 } from "node:os";
import { dirname as dirname14, join as join34 } from "node:path";
var BRIDGE_PART_RE = new RegExp(
  `(^|[\\\\/])${PRODUCT_PATTERN}[^\\\\/]*\\.mjs$|${escapeRe(BRIDGE_NAME)}`
);
var hw4 = () => words(HARNESS);
function openCodeMcpEntries(out7) {
  const dirFiles = (d) => [
    join34(d, "opencode.json"),
    join34(d, "opencode.jsonc"),
    join34(d, ".opencode", "opencode.json"),
    join34(d, ".opencode", "opencode.jsonc")
  ];
  const upwards = [];
  if (!process.env.OPENCODE_CONFIG_PROJECT_DISABLE)
    for (let d = process.cwd(); ; ) {
      upwards.push(...dirFiles(d));
      const up = dirname14(d);
      if (up === d) break;
      d = up;
    }
  const files = [
    ...process.env.OPENCODE_CONFIG ? [process.env.OPENCODE_CONFIG] : [],
    // Whether this directory belongs to the switchable project layer was not observed (#5559).
    ...process.env.OPENCODE_CONFIG_DIR ? dirFiles(process.env.OPENCODE_CONFIG_DIR) : [],
    ...dirFiles(join34(homedir14(), ".config", "opencode")),
    ...upwards
  ];
  const kindOf3 = (v) => {
    const e = v ?? {};
    const parts = [
      ...Array.isArray(e.command) ? e.command : e.command ? [e.command] : [],
      ...e.args ?? []
    ];
    if (parts.some((p) => BRIDGE_PART_RE.test(String(p)))) return "bridge";
    if (e.url && isProductionServer(e.url)) return "http";
    return null;
  };
  const parse = (text2) => {
    const STRING = '"(?:[^"\\\\]|\\\\.)*"';
    const noComments = text2.replace(
      new RegExp(`${STRING}|/\\*[\\s\\S]*?\\*/|//[^\\n]*`, "g"),
      (m) => m.startsWith('"') ? m : ""
    );
    const noTrailing = noComments.replace(
      new RegExp(`${STRING}|,(\\s*[}\\]])`, "g"),
      (m, tail2) => m.startsWith('"') ? m : tail2 ?? ""
    );
    return JSON.parse(noTrailing);
  };
  const bridgePath = (v) => {
    const e = v ?? {};
    const parts = [
      ...Array.isArray(e.command) ? e.command : e.command ? [e.command] : [],
      ...e.args ?? []
    ].map(String);
    return parts.find((p) => BRIDGE_PART_RE.test(p)) ?? parts.join(" ");
  };
  let unreadable = 0;
  const sources = [];
  for (const f of new Set(files)) {
    if (!existsSync15(f)) continue;
    try {
      sources.push([f, readFileSync36(f, "utf8")]);
    } catch {
      unreadable++;
      out7(hw4().ocUnreadable(f));
    }
  }
  if (process.env.OPENCODE_CONFIG_CONTENT)
    sources.unshift(["OPENCODE_CONFIG_CONTENT", process.env.OPENCODE_CONFIG_CONTENT]);
  let found = 0;
  for (const [file, text2] of sources) {
    try {
      const cfg = parse(text2);
      for (const [name2, v] of Object.entries(cfg.mcp ?? {})) {
        const kind = kindOf3(v);
        if (!kind) continue;
        found++;
        if (v.enabled === false) {
          out7(hw4().ocDisabled(name2, file));
          continue;
        }
        out7(kind === "bridge" ? hw4().ocBridge(name2, file, bridgePath(v)) : hw4().ocHttp(name2, file));
      }
    } catch {
      unreadable++;
      out7(hw4().ocUnreadable(file));
    }
  }
  if (!found) out7(hw4().ocNone(unreadable, process.cwd()));
}

// js/cli/doctor.ts
var out3 = (s2) => {
  process.stdout.write(s2 + "\n");
};
var dw = () => words(DOCTOR);
var hashOf3 = (buf) => createHash9("sha256").update(buf).digest("hex").slice(0, 8);
var seconds = (ms2) => `${Math.round(ms2 / 1e3)}s`;
var ENTRY = escapeRe(PLUGIN_NAME);
var CODEX_ENTRY_RE = new RegExp(
  `^\\s*\\[mcp_servers\\."?${ENTRY}"?\\]|^\\s*mcp_servers\\."?${ENTRY}"?\\s*=`,
  "m"
);
function homeCopyReport() {
  const home = homeBridgePath();
  let self = null;
  try {
    self = readFileSync37(fileURLToPath8(import.meta.url));
  } catch {
  }
  if (!existsSync16(home)) {
    out3(dw().homeNone(home));
    return;
  }
  const bytes = readFileSync37(home);
  if (self && bytes.equals(self)) {
    out3(dw().homeSame(home));
    return;
  }
  const v = versionIn(bytes.toString("utf8"));
  out3(
    dw().homeDiffers(home, v ?? "?", hashOf3(bytes), self ? fileURLToPath8(import.meta.url) : null)
  );
}
function serverSourceWord() {
  switch (CFG.serverSource) {
    case "argument":
      return dw().srcArgument();
    case "env":
      return dw().srcEnv();
    case "file":
      return dw().srcFile(serverChoicePath(CFG.authDir));
    default:
      return dw().srcDefault(serverChoicePath(CFG.authDir));
  }
}
var freshnessWord = (url) => isProductionServer(url) ? dw().freshProd() : dw().freshOther();
async function serverReport() {
  out3(dw().server(CFG.serverUrl, serverSourceWord()));
  out3(`  ${freshnessWord(CFG.serverUrl)}`);
  let res;
  try {
    res = await fetch(CFG.serverUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json, text/event-stream"
      },
      body: JSON.stringify({ jsonrpc: "2.0", id: "doctor", method: "ping" }),
      signal: AbortSignal.timeout(1e4)
    });
  } catch (e) {
    out3(dw().unreachable(errorMessage(e)));
    return;
  }
  res.body?.cancel?.();
  const www = res.headers.get("www-authenticate");
  const note4 = www ? dw().wantsOAuth() : res.status >= 400 && res.status < 500 ? dw().noTokenProbe() : "";
  out3(dw().answers(res.status, note4));
  try {
    const meta = await discoverMeta(www);
    out3(`  OAuth: token endpoint ${meta.as.token_endpoint}`);
    out3(`  resource: ${meta.resource}`);
  } catch (e) {
    out3(`  OAuth discovery: ${errorMessage(e)}`);
  }
}
async function patReport() {
  out3(dw().grantPat(String(CFG.patSource)));
  let res;
  try {
    res = await fetch(CFG.serverUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json, text/event-stream",
        authorization: `Bearer ${CFG.pat}`
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "doctor",
        method: "initialize",
        params: {
          protocolVersion: "2025-06-18",
          capabilities: {},
          clientInfo: { name: CLIENTS.doctor, version: "1" }
        }
      }),
      signal: AbortSignal.timeout(1e4)
    });
  } catch (e) {
    out3(dw().patCheckFailed(errorMessage(e)));
    return;
  }
  res.body?.cancel?.();
  if (res.status === 401) out3(dw().patRejected());
  else if (res.ok) out3(dw().patAccepted(res.status));
  else out3(dw().patOther(res.status));
  const path = storePath();
  if (existsSync16(path)) out3(dw().patStore(path));
}
function grantReport() {
  const path = storePath();
  out3(dw().grant(path));
  if (!existsSync16(path)) {
    out3(dw().noStore());
    return;
  }
  const store = loadStore();
  const t = store.tokens;
  if (!t?.access_token) {
    out3(dw().noTokens());
  } else {
    const usable = tokenUsable(t);
    const left2 = t.expires_at ? t.expires_at - now() : null;
    out3(dw().access(usable, left2, left2 !== null ? seconds(Math.abs(left2)) : ""));
    const hours = refreshHours(t);
    if (!t.refresh_token) out3(dw().refreshNone());
    else {
      const parts = [];
      if (hours.nbf)
        parts.push(
          now() < hours.nbf ? dw().refreshValidIn(seconds(hours.nbf - now())) : dw().refreshValid()
        );
      if (hours.exp)
        parts.push(
          now() >= hours.exp ? dw().refreshExpired() : dw().refreshExpiresIn(seconds(hours.exp - now()))
        );
      out3(dw().refresh(parts.join(", ")));
    }
  }
  if (store.client?.client_id) out3(`  client_id: ${store.client.client_id}`);
  const st = loadGrantState();
  if (st.refused_since)
    out3(dw().refusedSince(new Date(st.refused_since).toISOString(), st.reason ?? ""));
  for (const suffix of [".auth-pending", ".refreshing"]) {
    if (existsSync16(path + suffix)) out3(dw().lock(path + suffix));
  }
  const logPath = grantLogPath();
  if (existsSync16(logPath)) {
    const lines = readFileSync37(logPath, "utf8").trim().split("\n").slice(-3);
    out3(dw().grantLog());
    for (const l of lines) out3(`    ${l}`);
  }
}
function latestReport() {
  const latest = readLatest(CFG.authDir);
  if (!latest) {
    out3(dw().latestNotAsked());
    return;
  }
  const ago = Math.round((Date.now() - latest.checked_at) / 6e4);
  if (!latest.version) out3(dw().latestUnknown(latest.error, ago));
  else if (compareVersions(latest.version, VERSION) > 0)
    out3(dw().latestBehind(latest.version, VERSION, latest.downloaded.join(", "), ago));
  else out3(dw().latestCurrent(latest.version, ago));
}
function claudePluginReport() {
  const registry = join35(homedir15(), ".claude", "plugins", "installed_plugins.json");
  if (!existsSync16(registry)) return;
  try {
    const reg = JSON.parse(readFileSync37(registry, "utf8"));
    const mine = Object.entries(reg.plugins ?? {}).filter(([k]) => PLUGIN_KEY_RE.test(k));
    if (!mine.length) {
      out3(dw().pluginMissing(registry));
      return;
    }
    for (const [key2, installs] of mine) {
      for (const inst of installs) {
        const manifest = inst.installPath ? join35(inst.installPath, ".mcp.json") : "";
        let entry = dw().entryNotFound();
        if (manifest && existsSync16(manifest)) {
          try {
            const m = JSON.parse(readFileSync37(manifest, "utf8"));
            const hit = Object.entries(m.mcpServers ?? {}).find(
              ([, v]) => (v.args ?? []).some((a) => BRIDGE_FILE_RE.test(a))
            );
            if (hit) {
              entry = dw().entryFound(hit[0]);
              launches.push({
                who: `Claude Code ${key2}`,
                harness: "claude",
                command: hit[1].command ?? ""
              });
            }
          } catch {
            entry = dw().unreadable(manifest);
          }
        }
        out3(
          dw().pluginLine(
            key2,
            inst.version ?? "?",
            inst.scope ?? "?",
            entry,
            inst.installPath ?? ""
          )
        );
      }
    }
  } catch {
    out3(dw().claudeUnreadable(registry));
  }
}
function codexHomes() {
  const homes = [
    process.env.CODEX_HOME?.trim() || "",
    join35(homedir15(), ".codex"),
    ...process.platform === "darwin" ? [join35(homedir15(), "Library", "Application Support", "orca", "codex-runtime-home", "home")] : []
  ].filter(Boolean);
  return [...new Set(homes)].filter((h) => existsSync16(h));
}
function codexPluginReport(home) {
  const cache = join35(home, "plugins", "cache");
  if (!existsSync16(cache)) return;
  let found = 0;
  for (const { market, plugin, dir: dir2 } of codexCopies(home)) {
    const manifest = join35(dir2, ".codex-plugin", "plugin.json");
    let word3 = dw().codexNoManifest();
    if (existsSync16(manifest)) {
      try {
        const m = JSON.parse(readFileSync37(manifest, "utf8"));
        const hit = Object.values(m.mcpServers ?? {}).find(
          (v) => (v.args ?? []).some((a) => BRIDGE_FILE_RE.test(a))
        );
        word3 = dw().codexManifest(m.version ?? "?", !!hit);
        if (hit)
          launches.push({
            who: `Codex ${plugin}@${market}`,
            harness: "codex",
            command: hit.command ?? ""
          });
      } catch {
        word3 = dw().unreadable(manifest);
      }
    }
    found++;
    out3(dw().codexPlugin(plugin, market, word3, dir2));
  }
  if (!found) out3(dw().codexNoPlugin(cache));
}
var launches = [];
function harnessReport() {
  launches.length = 0;
  claudePluginReport();
  const claude = join35(homedir15(), ".claude.json");
  if (existsSync16(claude)) {
    try {
      const cfg = JSON.parse(readFileSync37(claude, "utf8"));
      const entries2 = Object.entries(cfg.mcpServers ?? {}).filter(
        ([, v]) => (v.args ?? []).some((a) => PRODUCT_RE.test(a))
      );
      if (entries2.length) {
        for (const [name2, v] of entries2) {
          out3(dw().claudeEntry(name2, v.command ?? "", (v.args ?? []).join(" ")));
          launches.push({
            who: `Claude Code «${name2}»`,
            harness: "claude",
            command: v.command ?? "",
            entry: name2
          });
        }
      } else out3(dw().claudeNoManual());
    } catch {
      out3(dw().claudeUnreadable(claude));
    }
  }
  const opencodeDir = join35(homedir15(), ".config", "opencode");
  if (existsSync16(opencodeDir)) {
    const copy = join35(opencodeDir, "plugins", PLUGIN_COPY_FILE);
    const packaged = join35(dirname15(fileURLToPath8(import.meta.url)), PLUGIN_FILE);
    if (!existsSync16(copy)) out3(dw().ocNoPlugin(copy));
    else if (!existsSync16(packaged)) out3(dw().ocNoPackaged(copy));
    else if (readFileSync37(copy).equals(readFileSync37(packaged))) out3(dw().ocSame(copy));
    else out3(dw().ocDiffers(copy, packaged));
    if (existsSync16(copy)) out3(openCodeRuntimeWord());
  }
  openCodeMcpEntries(out3);
  for (const codexHome of codexHomes()) {
    out3(dw().codexHome(codexHome));
    codexPluginReport(codexHome);
    const door = join35(codexHome, "app-server-control", "app-server-control.sock");
    if (existsSync16(door)) out3(dw().codexDoorOpen(door));
    else if (Buffer.byteLength(door) > 100) out3(dw().codexDoorNever());
    else out3(dw().codexDoorNone(door));
    const codex = join35(codexHome, "config.toml");
    if (existsSync16(codex)) {
      const text2 = readFileSync37(codex, "utf8");
      out3(dw().codexManual(CODEX_ENTRY_RE.test(text2)));
    }
  }
  launchReport(out3, launches);
  secondPathReport(out3, codexHomes());
}
async function daemonReport() {
  out3(daemonWanted() ? dw().daemonOn() : dw().daemonOff());
  out3(dw().daemonGrant(CFG.authDir));
  const fallbacks = readFallbacks(CFG.authDir);
  if (!fallbacks.length) out3(dw().fallbackNone());
  else {
    out3(dw().fallbackCount(fallbacks.length));
    for (const f of fallbacks) out3(dw().fallbackOne(f.pid, f.build, f.since, f.cwd, f.why));
  }
  if (!existsSync16(seamRunDir(CFG.authDir))) {
    out3(dw().daemonNeverUp(seamRunDir(CFG.authDir)));
    return;
  }
  const d = await probeDaemon(["--auth-dir", CFG.authDir]);
  if (d.ok) {
    out3(dw().daemonSocket(d.socket));
    out3(
      dw().daemonAnswers(
        d.pid,
        d.build,
        !d.build.startsWith(`v${VERSION}+`),
        VERSION,
        d.sessions,
        d.path
      )
    );
  } else if (d.unsafe) out3(dw().daemonUnsafe(d.why));
  else out3(dw().daemonSilent(d.socket, d.why));
}
async function runDoctor(argv2) {
  setConfig(parseArgs(argv2));
  out3(dw().title(BUILD));
  out3(dw().thisFile(fileURLToPath8(import.meta.url)));
  out3(`node: ${process.version}`);
  homeCopyReport();
  latestReport();
  await daemonReport();
  await serverReport();
  if (CFG.pat) await patReport();
  else grantReport();
  harnessReport();
  skillsReport(out3, codexHomes());
  await subagentsReport(out3);
}

// js/cli/orchestra.ts
var w4 = () => words(ORCHESTRA);
function take(args, flag) {
  const i = args.indexOf(flag);
  if (i < 0) return void 0;
  return args.splice(i, 2)[1];
}
async function runOrchestra(argv2) {
  const args = [...argv2];
  const lang2 = take(args, "--lang");
  setLang(lang2);
  const realms = [];
  for (let i = 0; i < args.length; i++)
    if (args[i] === "--realm" && args[i + 1] !== void 0) {
      realms.push(args[i + 1]);
      args.splice(i, 2);
      i--;
    }
  const authDir = take(args, "--auth-dir") || process.env[envName("BRIDGE_AUTH_DIR")] || defaultAuthDir();
  const op = args.find((a) => !a.startsWith("--"));
  const fail2 = (text2) => {
    process.stderr.write(`${text2}
`);
    process.exitCode = 1;
  };
  if (op !== "on" && op !== "off" && op !== "status" && op !== "step")
    return fail2(w4().usage().trimEnd());
  parseArgs(["--auth-dir", authDir, ...args.filter((a) => a !== op)]);
  const answer2 = await orchestraAsk(authDir, op, realms);
  if (!answer2.ok) return fail2(answer2.said);
  process.stdout.write(`${answer2.said}
`);
}

// js/cli/rituals.ts
import { mkdtempSync as mkdtempSync2, readdirSync as readdirSync16, realpathSync as realpathSync4, rmSync as rmSync3, statSync as statSync11 } from "node:fs";
import { tmpdir as tmpdir2 } from "node:os";
import { join as join38, resolve as resolve10 } from "node:path";

// js/cli/ritualprobe.ts
import { mkdtempSync, rmSync as rmSync2, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join as join37 } from "node:path";
import { pathToFileURL } from "node:url";

// js/cli/ritualcalls.ts
import { homedir as homedir16 } from "node:os";
import { join as join36 } from "node:path";
var memoryPath = join36(homedir16(), ".claude", "projects", "-probe", "memory", "MEMORY.md");
var pushed = "To github.com:o/r.git\n   1234567..89abcde  feat/x -> feat/x";
var seq2 = 0;
var fresh = (kind) => `${kind}-${++seq2}`;
var isPlain = (id) => id.startsWith("plain-");
var calls = (sessionID) => ({
  before: ["write", "edit"].map((tool2) => ({
    tool: tool2,
    sessionID,
    agent: "build",
    messageID: "msg",
    id: fresh(tool2),
    input: { filePath: memoryPath, content: "x" }
  })),
  plain: [
    {
      tool: "write",
      sessionID,
      agent: "build",
      messageID: "msg",
      id: fresh("plain"),
      input: { filePath: "README.md", content: "x" }
    }
  ],
  after: [
    ["git push -u origin feat/x", pushed],
    ["gh pr merge 12 --squash --delete-branch", ""]
  ].map(([command, content]) => ({
    tool: "bash",
    sessionID,
    agent: "build",
    messageID: "msg",
    id: fresh("bash"),
    status: "completed",
    input: { command },
    result: { content, metadata: { exit: 0 } }
  }))
});
var BROKEN = /* @__PURE__ */ new Set(["ReferenceError", "TypeError", "SyntaxError", "RangeError"]);
async function runHooks(hooks, sessionID) {
  const hit = [];
  const broken = [];
  const c = calls(sessionID);
  for (const [name2, inputs] of [
    ["execute.before", c.before],
    ["execute.before", c.plain],
    ["execute.after", c.after]
  ]) {
    for (const input of inputs) {
      const was = JSON.stringify(input);
      const what = `${name2} ${input.tool}${isPlain(input.id) ? " (not a memory path)" : ""}`;
      for (const fn of hooks[name2] ?? []) {
        try {
          await fn(input);
        } catch (e) {
          const err = e;
          const said2 = `${what}: throw (${err?.name ?? "?"}: ${String(err?.message ?? e)})`;
          hit.push(said2);
          if (BROKEN.has(err?.name) || isPlain(input.id) || name2 === "execute.after")
            broken.push(said2);
        }
      }
      if (JSON.stringify(input) !== was) hit.push(`${what}: changed`);
    }
  }
  return { hit, broken };
}

// js/cli/ritualprobe.ts
var SETTLE_MS = 200;
var SETUP_MS = 5e3;
var loose = (fields = {}) => new Proxy(fields, {
  get: (t, k) => k in t || typeof k === "symbol" || k === "then" ? t[k] : loose(async () => void 0)
});
var DOMAINS = new Set(
  "app location options agent aisdk command event experimental integration mcp model generate permission plugin provider reference rpc session shell skill storage tool vcs websearch worktree".split(
    " "
  )
);
var context = (fields) => new Proxy(fields, {
  get: (t, k) => k in t || typeof k === "symbol" || !DOMAINS.has(k) ? t[k] : loose(async () => void 0)
});
var baseline = new Set(Reflect.ownKeys(globalThis));
var dropPluginGlobals = () => {
  const g = globalThis;
  for (const k of Reflect.ownKeys(globalThis)) if (!baseline.has(k)) delete g[k];
};
var probes = 0;
var created = (sessionID, directory) => {
  const location = { directory };
  return {
    type: "session.created",
    location,
    data: { sessionID, projectID: `prj-${sessionID}`, location }
  };
};
var settle = (ms2 = SETTLE_MS) => new Promise((r) => setTimeout(r, ms2));
async function probeScope(file, own, foreign) {
  const aliasRoot = mkdtempSync(join37(tmpdir(), "ritual-scope-alias-"));
  try {
    const alias = join37(aliasRoot, "own");
    symlinkSync(own, alias, "dir");
    return await probeWith(file, own, alias, foreign);
  } finally {
    rmSync2(aliasRoot, { recursive: true, force: true });
  }
}
async function probeWith(file, own, alias, foreign) {
  dropPluginGlobals();
  const tag = ++probes;
  const who = ["mine", "twin", "theirs"];
  const id = Object.fromEntries(who.map((w5) => [w5, `${w5}@${tag}`]));
  const whoOf4 = (sessionID) => who.find((w5) => id[w5] === sessionID);
  const dirs = { mine: own, twin: alias, theirs: foreign };
  const writes = { mine: 0, twin: 0, theirs: 0 };
  const hooks = {};
  const reads = /* @__PURE__ */ new Set(["get", "list", "messages", "children", "status"]);
  const session = new Proxy(
    {},
    {
      get: (_, k) => {
        if (typeof k === "symbol" || k === "then") return void 0;
        if (k === "get")
          return async ({ sessionID } = {}) => {
            const who2 = whoOf4(sessionID);
            return who2 ? { id: sessionID, location: { directory: dirs[who2] } } : null;
          };
        if (reads.has(k)) return async () => [];
        return async (arg) => {
          const who2 = whoOf4(arg?.sessionID);
          if (who2) writes[who2] += 1;
        };
      }
    }
  );
  let subscribed = false;
  const ctx = context({
    location: { directory: alias },
    session,
    tool: loose({ hook: async (name2, fn) => void (hooks[name2] ??= []).push(fn) }),
    event: loose({
      subscribe: ({ signal } = {}) => {
        subscribed = true;
        return (async function* () {
          for (const w5 of who) yield created(id[w5], dirs[w5]);
          if (signal) await new Promise((r) => signal.addEventListener("abort", r));
        })();
      }
    })
  });
  const mod = await import(`${pathToFileURL(file).href}?scope=${Date.now()}`);
  const plugin = mod.default ?? Object.values(mod).find((v) => typeof v?.setup === "function");
  if (typeof plugin?.setup !== "function") throw new Error("no default export { setup }");
  let timer;
  const cleanup = await Promise.race([
    plugin.setup(ctx),
    new Promise(
      (_, no) => timer = setTimeout(
        () => no(new Error(`setup did not return in ${SETUP_MS} ms`)),
        SETUP_MS
      )
    )
  ]).finally(() => clearTimeout(timer));
  await settle();
  const onEvents = { ...writes };
  const mine = await runHooks(hooks, id.mine);
  await settle(50);
  if (typeof cleanup === "function") await cleanup();
  return {
    writes: onEvents,
    subscribed,
    broken: mine.broken,
    ownBefore: mine.hit.some(
      (h) => h.startsWith("execute.before write: throw") && !mine.broken.includes(h)
    ),
    ownAfter: mine.hit.includes("execute.after bash: changed")
  };
}

// js/cli/rituals.ts
var out4 = (s2) => {
  process.stdout.write(s2 + "\n");
};
var rw2 = () => words(RITUALS);
async function auditRepo(repo) {
  const own = realpathSync4(repo);
  const dir2 = join38(own, ".opencode", "plugins");
  let names2;
  try {
    names2 = readdirSync16(dir2).filter((n) => /\.(m?js|ts)$/.test(n));
  } catch {
    return [];
  }
  const foreign = realpathSync4(mkdtempSync2(join38(tmpdir2(), "ritual-scope-foreign-")));
  const verdicts = [];
  try {
    for (const name2 of names2.sort()) {
      const file = join38(dir2, name2);
      try {
        const scope = await probeScope(file, own, foreign);
        const hole = scope.writes.theirs > 0 || lostSpelling(scope) || mute(scope) || scope.broken.length > 0;
        verdicts.push({ file, hole, scope });
      } catch (e) {
        verdicts.push({ file, hole: true, error: String(e?.message ?? e) });
      }
    }
  } finally {
    rmSync3(foreign, { recursive: true, force: true });
  }
  return verdicts;
}
var lostSpelling = (s2) => s2.writes.mine > 0 !== s2.writes.twin > 0;
var mute = (s2) => s2.subscribed && s2.writes.mine + s2.writes.twin === 0;
function verdictLines(v) {
  const s2 = v.scope;
  if (v.error || !s2) return [rw2().notChecked(v.file, v.error)];
  if (!v.hole) {
    const quiet = s2.subscribed ? "" : rw2().noSubscription();
    return [`ok  ${v.file}${quiet}`];
  }
  const lines = [rw2().hole(v.file)];
  if (s2.writes.theirs > 0) lines.push(rw2().foreignWrites(s2.writes.theirs));
  if (lostSpelling(s2)) lines.push(rw2().lostSpelling(s2.writes.mine, s2.writes.twin));
  if (mute(s2)) lines.push(rw2().mute());
  if (s2.writes.theirs > 0 || lostSpelling(s2) || mute(s2))
    lines.push(`  ${rw2().fixScope(words(HOOKS_SECTION))}`);
  for (const h of s2.broken) lines.push(rw2().broken(h));
  if (s2.broken.length) lines.push(`  ${rw2().fixBroken(words(HOOKS_SECTION))}`);
  return lines;
}
var RITUALS_USAGE = () => rw2().usage();
var isDir = (p) => {
  try {
    return statSync11(p).isDirectory();
  } catch {
    return false;
  }
};
var refuse = (word3) => {
  process.stderr.write(`check-rituals: ${word3}
${RITUALS_USAGE()}
`);
  process.exitCode = 2;
};
async function runCheckRituals(argv2) {
  const end = argv2.indexOf("--");
  const head = end < 0 ? argv2 : argv2.slice(0, end);
  const tail2 = end < 0 ? [] : argv2.slice(end + 1);
  if (head.includes("--help") || head.includes("-h")) return out4(RITUALS_USAGE());
  const flag = head.find((a) => a.startsWith("-") && a !== "--json");
  if (flag) return refuse(rw2().unknownFlag(flag));
  const json = head.includes("--json");
  const repos = [...head.filter((a) => a !== "--json"), ...tail2].map((a) => resolve10(a));
  const missing = repos.find((r) => !isDir(r));
  if (missing) return refuse(rw2().noDir(missing));
  const verdicts = [];
  for (const repo of repos.length ? repos : [resolve10(".")])
    verdicts.push(...await auditRepo(repo));
  if (json) out4(JSON.stringify(verdicts));
  else if (verdicts.length === 0) out4(rw2().noPlugins());
  else for (const v of verdicts) for (const line of verdictLines(v)) out4(line);
  const code = verdicts.some((v) => v.hole) ? 1 : 0;
  process.stdout.write("", () => process.exit(code));
}

// js/cli/status.ts
import { existsSync as existsSync17 } from "node:fs";

// js/cli/statusdisk.ts
import { readdirSync as readdirSync17, readFileSync as readFileSync38 } from "node:fs";
import { join as join39 } from "node:path";
async function diskPlaces(authDir, sessions = []) {
  const dir2 = join39(authDir, "standings");
  let names2;
  try {
    names2 = readdirSync17(dir2).filter((n) => n.endsWith(".hold")).sort();
  } catch {
    return [];
  }
  const rows = await Promise.all(
    names2.map(async (n) => {
      try {
        const p = record(JSON.parse(readFileSync38(join39(dir2, n), "utf8")));
        if (!text(p.name) || !text(p.realm) || !["string", "number"].includes(typeof p.karta))
          return null;
        if (sessions.some(
          (s2) => s2.places.some(
            (held2) => held2.name === p.name && held2.realm === p.realm && String(held2.karta) === String(p.karta)
          )
        ))
          return null;
        return {
          name: text(p.name),
          realm: text(p.realm),
          karta: p.karta,
          left: p.left === true,
          kind: "record"
        };
      } catch {
        return null;
      }
    })
  );
  return rows.filter((p) => p !== null);
}
var fallbackSnapshot = (authDir) => readFallbacks(authDir).map((f) => ({ pid: f.pid, build: text(f.build), cwd: text(f.cwd) }));

// js/cli/status.ts
async function machine(authDir) {
  let daemon_error = "no answer";
  if (!existsSync17(authDir)) daemon_error = "missing directory";
  else if (!seamEntranceProblem(authDir, false)) {
    try {
      const link = await connectSeam(
        seamSocketPath(authDir, false),
        {
          ...helloFrame({ build: BUILD, path: "", argv: [], probe: true }),
          env: {},
          snapshot: true
        },
        3e3
      );
      const w5 = link.welcome;
      link.close();
      if (w5.snapshot) return { ...safeSnapshot(w5.snapshot), snapshot_available: true };
      return {
        daemon: safeSnapshot({ daemon: w5 }).daemon,
        sessions: [],
        snapshot_available: false,
        ...w5.snapshot_error === "snapshot failed" ? { snapshot_error: w5.snapshot_error } : {},
        ...typeof w5.sessions === "number" && Number.isInteger(w5.sessions) && w5.sessions >= 0 ? { session_count: w5.sessions } : {}
      };
    } catch (e) {
      if (e instanceof SeamError && e.kind === "refused")
        daemon_error = e.protocol !== void 0 && e.protocol !== SEAM_PROTOCOL ? "different protocol" : "refused";
    }
  }
  return { daemon: null, sessions: [], snapshot_available: false, daemon_error };
}
var printable = (v) => [...String(v)].map(
  (c) => c.charCodeAt(0) < 32 || c.charCodeAt(0) >= 127 && c.charCodeAt(0) <= 159 ? " " : c
).join("");
function formatSkills(label, skills) {
  return skills ? ` · ${label}=${printable(skills.name)} ${printable(skills.version)}${skills.stamp ? `+${printable(skills.stamp)}` : ""}` : "";
}
function render(s2) {
  const w5 = words(MACHINE_STATUS);
  const d = s2.daemon;
  const lines = [
    d ? `${w5.daemon()}: pid=${d.pid} ${printable(d.build)} ${printable(d.path)}` : s2.daemon_error === "missing directory" ? w5.missing() : s2.daemon_error === "different protocol" ? w5.protocol() : s2.daemon_error === "refused" ? w5.refused() : w5.absent()
  ];
  if (d && !s2.snapshot_available)
    lines.push(s2.snapshot_error ? w5.snapshotFailed() : w5.unavailable());
  if (d && !s2.snapshot_available && s2.session_count !== void 0)
    lines.push(`${w5.sessions()}: ${s2.session_count}`);
  if (!d || s2.snapshot_available) lines.push(`${w5.sessions()}: ${s2.sessions.length}`);
  for (const session of s2.sessions) {
    const stamp = formatSkills("skills", session.skills);
    const diskStamp = formatSkills("installed_skills", session.installed_skills);
    lines.push(
      `  ${printable(session.local_id)} pid=${session.thin_pid} ${session.attached ? w5.attached() : w5.detached()} ${printable(session.harness)} ${printable(session.harness_session ?? "-")} ${printable(session.build)} ${printable(session.cwd)}${stamp}${diskStamp}${session.skills_mismatch ? " · skills_mismatch" : ""}`
    );
    for (const p of session.places) {
      const declaration = formatSkills("skills", p.skills);
      const mode = p.satellite_of ? `${w5.satellite()} ${printable(p.satellite_of)}` : p.primary ? w5.primary() : w5.beside();
      lines.push(
        `    ${printable(p.name)} ${printable(p.realm)} #${printable(p.karta)} ${mode} · ${p.listening ? w5.listening() : w5.silent()} · ${w5.lastWork()}: ${printable(p.last_work_at ?? w5.unknown())}${p.usage ? ` · usage=${JSON.stringify(p.usage)}` : ""}${p.pulse ? ` · pulse=${JSON.stringify(p.pulse)}` : ""}${declaration}${p.skills_mismatch ? " · skills_mismatch" : ""}`
      );
    }
  }
  lines.push(`${w5.fallback()}: ${s2.fallback.length}`);
  for (const f of s2.fallback)
    lines.push(`  pid=${f.pid} ${printable(f.build)} ${printable(f.cwd)}`);
  lines.push(`${w5.disk()}: ${s2.disk_only.length}`);
  for (const p of s2.disk_only)
    lines.push(
      `  ${printable(p.name)} ${printable(p.realm)} #${printable(p.karta)} — ${w5.record()} · ${w5.left(p.left)}`
    );
  return lines.join("\n") + "\n";
}
async function runStatus(args) {
  const i = args.indexOf("--auth-dir");
  const authDir = (i >= 0 ? args[i + 1] : void 0) || process.env[envName("BRIDGE_AUTH_DIR")] || defaultAuthDir();
  setLang(args[args.indexOf("--lang") + 1]);
  const inspected = await machine(authDir);
  const snapshot = {
    ...inspected,
    fallback: fallbackSnapshot(authDir),
    disk_only: await diskPlaces(authDir, inspected.sessions)
  };
  process.stdout.write(
    args.includes("--json") ? JSON.stringify(snapshot, null, 2) + "\n" : render(snapshot)
  );
}

// js/cli/stop.ts
import { readFileSync as readFileSync39 } from "node:fs";

// js/cli/stopapi.ts
import { randomUUID } from "node:crypto";
var sw4 = () => words(STOP_CLI);
var TIMEOUT_MS3 = 1e4;
var sameServer = (a, b) => {
  const at3 = (u) => {
    const x = new URL(u);
    return `${x.origin}${x.pathname.replace(/\/+$/, "")}`;
  };
  try {
    return at3(a) === at3(b);
  } catch {
    return false;
  }
};
async function keyFor2(server) {
  if (CFG.pat) return { token: CFG.pat };
  if (!loadStore().tokens?.access_token) return { why: sw4().noKey(server) };
  try {
    return { token: (await ensureAuth(null, { interactive: false })).access_token };
  } catch (e) {
    return { why: sw4().signIn(server, errorMessage(e)) };
  }
}
async function ask2(url, method2, realm, token, body) {
  const res = await fetch(url, {
    method: method2,
    headers: {
      authorization: `Bearer ${token}`,
      "x-nks-realm": realm,
      ...body ? { "content-type": "application/json" } : {}
    },
    ...body ? { body: JSON.stringify(body) } : {},
    signal: AbortSignal.timeout(TIMEOUT_MS3)
  });
  return { status: res.status, text: (await res.text().catch(() => "")).slice(0, 300) };
}
async function realmForApi(base, token, realm) {
  const t = realm.trim();
  if (!t || t.startsWith("@") || t === OWN_REALM) return t;
  try {
    const res = await fetch(`${base}/realms?limit=200`, {
      headers: { authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(TIMEOUT_MS3)
    });
    const body = res.ok ? await res.json() : null;
    const listed = Array.isArray(body) ? body : body?.items;
    const canon2 = Array.isArray(listed) ? canonIn(realmIndexOf(listed), t) : null;
    if (canon2) return canon2;
  } catch {
  }
  return /^r\d+$/i.test(t) ? apiRealm(t) : null;
}
async function stopSeat(p, id, base, token) {
  const seat2 = `${p.name} (${p.realm})`;
  const at3 = `${base}/standings/${encodeURIComponent(id)}`;
  try {
    const realm = await realmForApi(base, token, p.realm);
    if (realm === null) return { ok: false, said: sw4().unnamedGraph(seat2, p.realm) };
    const order = await ask2(`${at3}/stop`, "POST", realm, token, {
      reason_code: "person_request",
      client_id: `stop-${randomUUID()}`
    });
    if (order.status >= 200 && order.status < 300) {
      let orderId = "";
      try {
        const o = JSON.parse(order.text);
        if (typeof o.id === "string") orderId = o.id;
      } catch {
      }
      return { ok: true, said: sw4().ordered(seat2, orderId) };
    }
    if (order.status === 410) return { ok: true, said: sw4().gone(seat2) };
    if (order.status === 401)
      return { ok: false, said: sw4().signIn(CFG.serverUrl, `401 ${order.text}`) };
    if (order.status !== 404)
      return { ok: false, said: sw4().refused(seat2, "stop", order.status, order.text) };
    const revoke = await ask2(at3, "DELETE", realm, token);
    if (revoke.status >= 200 && revoke.status < 300) return { ok: true, said: sw4().revoked(seat2) };
    if (revoke.status === 410) return { ok: true, said: sw4().gone(seat2) };
    return { ok: false, said: sw4().refused(seat2, "revoke", revoke.status, revoke.text) };
  } catch (e) {
    return { ok: false, said: sw4().unreachable(seat2, e.message) };
  }
}

// js/cli/stop.ts
var sw5 = () => words(STOP_CLI);
function take2(args, flag) {
  const i = args.indexOf(flag);
  if (i < 0) return void 0;
  return args.splice(i, 2)[1];
}
function pick2(sessions, target, realm) {
  const session = sessions.find((s2) => s2.local_id === target);
  const full = /^@[^:]+:/.test(target);
  const name2 = target.replace(/^@[^:]+:/, "");
  const found = session ? session.places.filter((p) => p.primary || session.places.length === 1).map((place) => ({ place, session })) : sessions.flatMap(
    (s2) => s2.places.filter((p) => p.name === name2).map((place) => ({ place, session: s2 }))
  );
  const inRealm = found.filter(
    ({ place: p }) => !realm || p.realm === realm || p.realm.endsWith(`/${realm}`)
  );
  const seats2 = full && !session ? inRealm.filter(({ place: p }) => p.address === target) : inRealm;
  if (!seats2.length && inRealm.length) {
    const known2 = inRealm.map(({ place: p }) => p.address).filter((x) => !!x);
    return known2.length ? sw5().otherOwner(target, known2.join(", ")) : sw5().noOwner(target);
  }
  if (!seats2.length) return sw5().notFound(target);
  if (seats2.length > 1)
    return sw5().ambiguous(target, seats2.map(({ place: p }) => `${p.name} (${p.realm})`).join(", "));
  return seats2[0];
}
function apiOf({ place: p, session }) {
  if (session.api) return session.api;
  try {
    const rec5 = JSON.parse(
      readFileSync39(holdFilePathOf(CFG.authDir, keyOf(p.realm, p.karta, p.name)), "utf8")
    );
    return typeof rec5.url === "string" && rec5.url ? apiBase(rec5.url) : null;
  } catch {
    return null;
  }
}
async function runStop(argv2) {
  const args = [...argv2];
  const lang2 = take2(args, "--lang");
  const configure = (cfg2) => {
    setConfig(cfg2);
    setLang(lang2);
  };
  setLang(lang2);
  const realm = take2(args, "--realm");
  const authDir = take2(args, "--auth-dir") || process.env[envName("BRIDGE_AUTH_DIR")] || defaultAuthDir();
  const target = args.find((a) => !a.startsWith("--"));
  const fail2 = (text2) => {
    process.stderr.write(`${text2}
`);
    process.exitCode = 1;
  };
  if (!target) return fail2(sw5().usage().trimEnd());
  const rest2 = args.filter((a) => a !== target);
  configure(parseArgs(["--auth-dir", authDir, ...rest2]));
  const snap = await machine(authDir);
  if (!snap.snapshot_available) return fail2(sw5().noDaemon());
  const seat2 = pick2(snap.sessions, target, realm);
  if (typeof seat2 === "string") return fail2(seat2);
  const p = seat2.place;
  if (!p.standing_id) return fail2(sw5().noId(p.name));
  const server = seat2.session.server;
  if (!server) return fail2(sw5().noServer(p.name));
  const base = apiOf(seat2);
  if (!base) return fail2(sw5().noRecord(p.name));
  const patServer = CFG.serverUrl;
  const cfg = parseArgs([server, "--auth-dir", authDir, ...rest2]);
  if (!sameServer(patServer, server)) {
    cfg.pat = null;
    cfg.patSource = null;
  }
  configure(cfg);
  const key2 = await keyFor2(server);
  if ("why" in key2) return fail2(key2.why);
  const out7 = await stopSeat(p, p.standing_id, base, key2.token);
  if (!out7.ok) return fail2(out7.said);
  process.stdout.write(`${out7.said}
`);
}

// js/cli/update.ts
var out5 = (s2) => {
  process.stdout.write(s2 + "\n");
};
var cw = () => words(CLI);
async function runUpdate(argv2) {
  setConfig(parseArgs(argv2));
  out5(cw().updateTitle(BUILD));
  out5(cw().updateServer(CFG.serverUrl, serverSourceWord(), freshnessWord(CFG.serverUrl)));
  const latest = await checkLatest(CFG.authDir, true);
  if (!latest || !latest.version) {
    out5(
      latest?.rate_limited ? cw().rateLimited(latest.error, !!latest.rate_limited_until) : cw().latestUnknown(latest?.error)
    );
    process.exitCode = 1;
    return;
  }
  const lag = cw().lag(compareVersions(latest.version, VERSION));
  out5(cw().latest(latest.version, latest.tag, VERSION, lag));
  if (latest.error) out5(cw().downloadFailed(latest.error));
  if (latest.downloaded.length) for (const p of latest.downloaded) out5(cw().placed(p));
  else out5(cw().nothingPlaced(homeBridgePath()));
  harnessReport();
  out5("");
  out5(cw().next());
  const setup = setupPathOf(CFG.authDir);
  const fetched = latest.downloaded.includes(setup);
  out5(cw().stepSkills(setup, fetched));
  out5(cw().stepRestart());
  out5(cw().stepDoctor());
}

// js/cli/use.ts
var out6 = (s2) => {
  process.stdout.write(s2 + "\n");
};
var cw2 = () => words(CLI);
function runUse(argv2) {
  let word3;
  const rest2 = [];
  for (let i = 0; i < argv2.length; i++) {
    const a = argv2[i] ?? "";
    if (a === "--auth-dir") rest2.push(a, argv2[++i] ?? "");
    else if (a.startsWith("--") || word3) rest2.push(a);
    else word3 = a;
  }
  setConfig(parseArgs(rest2));
  const url = word3 ? resolveServerChoice(word3) : null;
  if (!url) {
    out6(cw2().useNoAddress());
    process.exitCode = 2;
    return;
  }
  const path = writeServerChoice(CFG.authDir, url);
  setServerLang(url);
  out6(cw2().useWritten(url, path, freshnessWord(url)));
  out6(cw2().useEffect());
}

// js/cli/main.ts
var cw3 = () => words(CLI);
var usage = () => cw3().usage(BUILD, RITUALS_USAGE());
var argv = process.argv.slice(2);
var [first, ...rest] = argv;
var LONG_LIVED = /* @__PURE__ */ new Set([void 0, "bridge", "watchdog", "watchdog-exit", "watchdog-codex"]);
var longLived = LONG_LIVED.has(first) || first !== void 0 && !first.startsWith("--") && ![
  "doctor",
  "status",
  "stop",
  "orchestra",
  "update",
  "use",
  "check-rituals",
  "daemon",
  "version",
  "-h"
].includes(first);
if (longLived && !updatesDisabled() && !process.env[envName("BRIDGE_REEXEC")]) {
  const sync = syncHome();
  for (const p of sync.copied) process.stderr.write(cw3().homeUpdated(p));
  if (sync.reexec) reexec(sync.reexec, argv);
  else dispatch();
} else dispatch();
function dispatch() {
  switch (first) {
    case "status":
      void runStatus(rest);
      break;
    case "stop":
      void runStop(rest);
      break;
    case "orchestra":
      void runOrchestra(rest);
      break;
    case "watchdog":
      runWatchdog(rest);
      break;
    case "watchdog-exit":
      runWatchdogExit(rest);
      break;
    case "watchdog-codex":
      runWatchdogCodex(rest);
      break;
    case "doctor":
      void runDoctor(rest);
      break;
    case "update":
      void runUpdate(rest);
      break;
    case "use":
      runUse(rest);
      break;
    case "check-rituals":
      void runCheckRituals(rest);
      break;
    case "bridge":
      bridgeMain(rest);
      break;
    case "daemon":
      void daemonMain(rest);
      break;
    case "--version":
    case "version":
      void versionLines(rest).then((lines) => process.stdout.write(lines.join("\n") + "\n"));
      break;
    case "--help":
    case "-h":
      process.stdout.write(usage());
      break;
    default:
      bridgeMain(argv);
  }
}
