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
var BRIDGE_SKILL = PRODUCT;
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
  const out2 = {};
  for (const k of Object.keys(o)) if (!KEYS.has(k)) say(`unknown key "${k}" ignored`);
  if (o.server !== void 0) {
    let url = null;
    try {
      url = typeof o.server === "string" ? new URL(o.server) : null;
    } catch {
    }
    if (url && (url.protocol === "https:" || url.protocol === "http:")) out2.server = url.href;
    else say(`"server" is not an http(s) URL — the build address ${BUILD_SERVER_URL} is used`);
  }
  if (o.tool_prefix !== void 0) {
    if (typeof o.tool_prefix === "string" && PREFIX_RE.test(o.tool_prefix))
      out2.tool_prefix = o.tool_prefix;
    else
      say(
        `"tool_prefix" must match ${PREFIX_RE} (e.g. "${BUILD_TOOL_PREFIX}") — the build prefix ${BUILD_TOOL_PREFIX} is used`
      );
  }
  return out2;
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
  /** The graph slot: the value starts with @owner/slug or rN. */
  graph: "Graph",
  /** The agent-role slot: the value starts with exactly one reference '#N "name"'. */
  role: "Agent role",
  /** The quotes around the name in the role reference: opening and closing (here the same character). */
  roleQuotes: ['"', '"']
};

// js/delivery/patterns/launch.ts
var LAUNCH_WORD = "verstak";
var word = LAUNCH_WORD.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
var LAUNCH_LINE = new RegExp(
  `^[ \\t]*${word}\\s+(\\S+)\\s+(\\S+)\\s+(?:case\\s+)?[№#]\\s?(\\d+)(?:[ \\t]+from[ \\t]+(@\\S+))?(?=\\s|$)`,
  "mu"
);

// js/delivery/patterns/mine.ts
var MINE_ROW = /^\s*[№#]\s*\d+\s/;
var MINE_NONE = /^\s*No cases(?=[\s:.,;]|$)/;

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
  rituals: ".opencode/plugins/verstak-rituals.js",
  /**
   * Align's stamp in the cover file: "(verstak align: contract N, stamped …"; before the
   * contract counter it read "(verstakify: contract DATE".
   */
  stamp: /\((?:verstak align:\s*contract\s*`?\d+`?\s*,\s*stamped|verstakify:\s*contract\b)/
};

// js/delivery/protocol.ts
var tool = (name) => `${TOOL_PREFIX}${name}`;
var method = (name) => `${PRODUCT}/${name}`;
var LOGGERS = { channel: `${PRODUCT}-channel`, bridge: BRIDGE_NAME };
var ID_PREFIX = `${PRODUCT}-`;
var FRAME_MARK = `[${PRODUCT}]`;
var STRUCTURED_CAPABILITY = `${PRODUCT}/structured`;
var HALTS_CAPABILITY = `${PRODUCT}/halts`;
var serverProtocol = {
  refusal: "verstak/refusal"
};

// js/delivery/version.ts
var VERSION = "3.11.0";
var BUILD_MARK = "verstak-build";

// js/delivery/words/asks.ts
var ASK = {
  en: {
    ask: (author, to, toPlace, key, done, form, advice) => `${author} asks the role ${to}${toPlace} [${key}]: “${done}”${form}${advice}`,
    place: (place) => `(seat ${place})`,
    yesNo: () => "answer: yes or no (yes | no)",
    free: () => "answer in your own words",
    choice: (options) => `options: ${options}`,
    advice: (option, why) => `recommended: ${option}${why}`,
    answer: (author, refersTo, reply) => `${author} answers [${refersTo}]: ${reply}`,
    ack: (refersTo, reply, author) => `answer [${refersTo}] accepted${reply} · ${author}`,
    withdrawn: (withdraws, key, done, verdict, author) => `question [${withdraws}] withdrawn: [${key}] [${done}] = ${verdict} · ${author}`,
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
    count: (head, n2, mine) => `${head}: ${n2} records, yours ${mine}`,
    supersededLines: (gone) => `, ${gone} superseded lines of a key`,
    inFull: (cases) => `in full — ${cases || FRAME_TEXT.en.myCases()}`,
    caseHistory: (args, since) => `${tool("case")}(${args}, since=${since})`
  }
};
var CASE_LINE = {
  en: {
    platform: () => "platform",
    quote: (s) => `“${s}”`
  }
};

// js/delivery/words/bridge-client.ts
var BRIDGE_CLIENT = {
  en: {
    failedToStart: (message) => `the bridge failed to start: ${message}`,
    exited: (code2, signal, why) => `the bridge exited (code=${code2}, signal=${signal})${why}`,
    lastFromBridge: (lines) => `; last from the bridge: ${lines}`,
    aborted: () => "call aborted",
    noAnswer: (method2, ms, why) => `${method2}: no answer in ${ms} ms${why}`,
    noWrites: () => "the bridge does not accept writes",
    sessionClosed: () => "session closed",
    emptyAnswer: () => "(empty answer)"
  }
};

// js/delivery/words/take.ts
var TAKE = {
  en: {
    rule: () => `your own name (the same role, the same account) — by yourself when the holder stays silent 5 minutes to a probe by word (${tool("channel")} send); another's (another role or account) — only on the user's word`
  }
};

// js/delivery/words/launch.ts
var LAUNCH = {
  en: {
    notSeated: (why, no, join14) => `Verstak: launch line — not seated: ${why}. A subagent takes only a satellite of its launcher's seat: if the launcher holds one, repeat ${tool("stand")} and enter case #${no}: ${join14}; if not, the launcher takes a seat and launches you again; until then the work goes without the graph, the result as a word to the launcher.`,
    ownSeat: () => "in a seat of its own",
    notEntered: (place, no, why) => `Verstak: seated ${place}; did not enter case #${no} — ${why}. The seat stays.`,
    entered: (place, no) => `Verstak: seated ${place}, entered case #${no} — retell the brief as your first message in the case.`
  }
};

// js/delivery/words/leads.ts
var act = (action) => action ? ` (${action})` : "";
var keptEn = (who, place) => `child ${who} stood not as a satellite (${place}) — the seat is not revoked, the bridge is not down`;
var LEAD = {
  en: {
    cascade: (who) => `Verstak: the turn of subagent ${who} was cut by the cancel of your turn — it has not ended: it holds its seat and cases and waits for frames of its case. To go on — a word into its case; to release it — ${tool("channel")}(action="revoke", standing="${who}").`,
    placeEvicted: () => "its satellite seat was evicted by another holder",
    placeClosed: () => "its satellite seat was revoked not through the launcher or closed by the platform (4001)",
    placeEvictedRefusal: () => "its satellite seat was evicted by another holder",
    placeClosedRefusal: () => "its satellite seat was revoked or closed by the platform (4001)",
    cut: (shown2, total) => `
[report truncated: ${shown2} of ${total} characters shown — incomplete here, whole in its case]`,
    end: (who, why, done, said) => `Verstak: subagent ${who} ENDED — ${why}. This is the end of the errand, not a turn: ${done}Its final report follows — testimony, not acceptance evidence; the case and the carrier hold the grounds and limits:
${said || "(it left no text — see its case)"}`,
    endKept: (who, kept2) => `${keptEn(who, kept2)}; to revoke it — ${tool("channel")}(action="revoke", standing="${kept2}"), only on the user's word. `,
    endPlain: () => "the subagent's bridge goes down: it leaves its cases, its seat is revoked (if it is not, I will say so separately). ",
    keptLine: keptEn,
    keptSaid: (who, place) => `Verstak: ${keptEn(who, place)}`,
    unrevokedUnknown: (who) => `Verstak: the bridge of subagent ${who} is down; whether it revoked its seat it did not answer: if it is left on the board — revoke it with ${tool("channel")}(action="revoke").`,
    unrevoked: (who, places, first) => `Verstak: subagent ${who}'s seat was not revoked (network): ${places} — revoke it with ${tool("channel")}(action="revoke", standing="${first}").`,
    turn: (place) => `Verstak: subagent ${place} handed over a turn, not the errand — it goes on and waits for frames of its case; the outcome lands here at its end. To release it earlier — ${tool("channel")}(action="revoke", standing="${place}").`,
    notice: (child, place) => `Verstak: the OpenCode notice <subagent sessionID="${child}" state="completed"> is the end of a TURN of subagent ${place}, not of the errand: it is a lead, stands on its own seat and waits for frames of its case. Do not count it finished — the outcome lands here with the word "ENDED" at its end. To release it earlier — ${tool("channel")}(action="revoke", standing="${place}").`,
    release: (who) => `Verstak: subagent ${who} is released — its bridge is down, it is out of its cases, its seat is revoked on the platform; the outcome landed here as a synthetic message.`,
    unreleased: (who, why) => `Verstak: subagent ${who} has ended and its bridge is down, but its seat is NOT revoked — the platform answered: ${why}. It hangs on the board: repeat ${tool("channel")}(action="revoke", standing="${who}", karta) or tell the user.`,
    away: (who, last) => `Verstak: subagent ${who} was taken down by the parent's move to another folder — the errand here ended not by its outcome, there will be no "ENDED": its bridge goes down: it leaves its cases, its seat is revoked; its session stayed in the previous folder. Its last word:
${last || "(it left no text — see its case)"}`,
    lost: (who, why) => `Verstak: subagent ${who} is taken down — ${why}. The seat without a bridge goes with the channel's term, its cases with the seat's term; there is no outcome, its turn is in its session.`,
    tellDone: (sessionID) => `Verstak: the word about the subagent was delivered into session ${sessionID}`,
    tellFailed: (sessionID, message) => `Verstak: the word about the subagent was not delivered into ${sessionID}: ${message}`,
    sessionOf: (child) => `of session ${child}`,
    noParent: (text2) => `${text2}
(the plugin does not know the parent — nobody to give the outcome to)`,
    noLiveAncestor: (text2) => `${text2}
(the parent and every ancestor are ended or stopped — the word went into no session, it is here)`,
    endUnwritten: (sessionID, message) => `Verstak: the end of the subagent of session ${sessionID} was not written to disk (${message}) — only this process's live plugin instances keep it, a reload will lose it`,
    endUnlifted: (sessionID, message) => `Verstak: the subagent of session ${sessionID} stood again, but the record of its end was not removed from disk (${message}) — after a plugin reload it will count as ended again`,
    notDown: (who, message) => `Verstak: the bridge of subagent ${who} was not put down after the outcome — ${message}`,
    leftSeat: () => "left its seat by the outcome",
    leftCases: () => "left its cases by the outcome",
    leftCase: (room) => `left case #${room} by the outcome`,
    lastUnknown: (who, room, why) => `Verstak: subagent ${who} left case #${room}, but whether it was its last case the platform did not say (${why}) — the errand has NOT ended, its bridge and seat live. If it is over — release it: ${tool("channel")}(action="revoke", standing="${who}").`,
    releasedByLauncher: () => "released on the launcher's word",
    deleted: () => "the subagent's session was deleted",
    reloadUnreadable: () => "plugin reload, the subagent's session is unreadable",
    reloadNoKey: () => "plugin reload, no seat key",
    reloadNotBack: () => "plugin reload, the satellite seat did not return by its key",
    reloadStale: (names2) => `plugin reload: the outdated seat ${names2} was not taken — the subagent's session has a fresher seat, and it did not return`,
    identity: (name, action) => `Refused (plugin): ${name}${act(action)} is the user's identity, and the child session has no seat of its own: it does not get it through the root's bridge. The graph and cases can be read; who you are — ask the launcher.`,
    writeUnderParent: (name, of) => `Refused (plugin): a child session writes only with its own satellite seat — ${name} would go under the parent's seat ${of}. Stand: ${tool("stand")}(realm, karta, satellite_of="${of}"), then repeat; reading works as is.`,
    writeNoParent: () => "Refused (plugin): a child session writes only with its own satellite seat, and the parent's seat is unknown — the root holds no seat. It cannot have a seat of its own; reading works as is, writing — by a word to the launcher.",
    finalRefusal: (why, name) => `Refused (plugin): ${why} — the errand is over, the seat is revoked; ${name} goes neither with its seat nor with the launcher's, and standing again is not possible.`,
    releasedChild: () => "the launcher released this child session",
    endedChild: () => "this child session has ended",
    endedSatellite: () => "this child session has ended, its satellite seat is released",
    launcherSeat: () => "<the launcher's seat>",
    endedRefusal: (why, name, action, of) => `Refused (plugin): ${why} — ${name}${act(action)} would go with the launcher's bridge and seat. Stand again: ${tool("stand")}(realm, karta, satellite_of="${of}"), then repeat the call.`,
    ask: (who, what) => `Verstak: subagent ${who} is waiting for a permission: ${what}. Only the user can answer this request — in the window of the subagent's session ${who}. You cannot answer it, and no message to the subagent unblocks it. Tell the user what is waiting and where: only they can answer or cancel the subagent's turn.`,
    more: (n2) => ` and ${n2} more`,
    action: () => "action",
    interrupt: (who, reason2) => `Verstak: the turn of subagent ${who} was interrupted (${reason2}).`
  }
};

// js/delivery/words/onboardstart.ts
var ONBOARD_START = {
  en: {
    start: () => "Verstak: this repository is not yet aligned for the agent — load the verstak skill and run its onboarding method before anything else; it creates nothing without the person's word."
  }
};

// js/delivery/words/opencode.ts
var OPENCODE = {
  en: {
    channelDown: (message) => `Verstak: the channel did not come up — ${message}`,
    launchDown: (message) => `Verstak: the launch line did not come up — ${message}`,
    noticeDown: (message) => `Verstak: the subagent turn note did not come up — ${message}`,
    commandsDown: (message) => `Verstak: the skill commands did not come up — ${message}`,
    noPermissionHooks: () => "Verstak: this OpenCode has no permission hooks — files of the delivery's skills outside the working copy are read with an ask.",
    skillReadsDown: (message) => `Verstak: reading the delivery's skill files did not open — ${message}`,
    hearingLost: (hhmm, message) => `Verstak: hearing lost at ${hhmm} — the standing's bridge exited (${message}). The hearing watchdog raises the bridge and returns the seat from disk; if you will not wait — ${tool("stand")}.`,
    fromCache: () => "from the previous list",
    fromServer: () => "from the server",
    cached: (n2) => `Verstak: tools from the previous list: ${n2}; checking with the server.`,
    raised: (n2) => `Verstak: the bridge is up, tools in the session: ${n2} (from the server).`,
    died: (message) => `Verstak: the bridge died (${message}) — raising a new one.`,
    builds: (bridge, plugin) => `build: bridge ${bridge}, plugin ${plugin}`,
    unreadable: () => "unreadable",
    serverChanged: (n2) => `Verstak: the server changed its tools — now ${n2} in the session.`,
    idleShort: (idle, watch) => `VERSTAK_BRIDGE_IDLE_MS (${idle}) is not longer than the hearing watchdog's tact (${watch}): a slot may be reaped before its seat returns`,
    statusDescription: () => `State of the Verstak bridge in this OpenCode session: whether sign-in is done, the authorization address, how many ${TOOL_PREFIX}* tools are up. Call it when there are no ${TOOL_PREFIX}* tools or they answer with a sign-in refusal.`,
    statusBridge: (path) => `bridge: ${path}`,
    statusLoginPending: (open, elsewhere2) => `sign-in: NOT DONE — ${open}. The address is local: ${elsewhere2} (the verstak skill, its establish-mcp method).`,
    openInBrowser: (url) => `open ${url} in a browser`,
    finishInBrowser: () => "finish the sign-in in the browser",
    statusLoginDone: () => "sign-in: done, the server answers",
    statusLoginWaiting: () => "sign-in: the bridge has not answered yet (handshake in progress)",
    statusTools: (n2, source) => `${TOOL_PREFIX}* tools: ${n2} (${source})`,
    statusBridges: (live, sessions) => `live bridges: ${live}, sessions with a bridge: ${sessions}`,
    commandHead: (id) => `Load the skill \`${id}\` with the \`skill\` tool (id: \`${id}\`) and act strictly by it. The user typed this, not you; their words are below.

`,
    commandsCount: (n2) => `Verstak: "/" commands from the delivery's skills: ${n2}.`,
    frame: () => "frame",
    frameId: (id) => `frame ${id}`,
    frameNoId: () => "frame without id",
    caseBatch: (n2) => `case batch (${n2})`,
    staleBatch: () => "batch of stale frames",
    wakeBatch: (n2) => `wake-up batch (${n2})`,
    resumedLabel: () => "word about the returned seat",
    tact: () => "attention tact",
    tactWaits: () => "Verstak: the attention tact waits for the end of the session's turn",
    tactWaitsFolded: () => "Verstak: the attention tact waits for the end of the session's turn — the previous waiting one is folded",
    childGone: (frame, id, text2) => `Verstak: ${frame} for the seat of child session ${id}, which no longer exists — not readdressing it to the root; a case record stays in the case (${tool("case")} history), a direct word did not reach the root; the child session's seat is extra on a channel where the root stands on: whether to revoke it, decide knowing the cost (standing) —${text2}`,
    childEnded: (frame, id, text2) => `Verstak: ${frame} not delivered — the subagent of session ${id} has ended, its session is not woken any more; a case record stays in the case (${tool("case")} history) — ${text2}`,
    sessionClosed: (id, frame) => `Verstak: session ${id} is closed or archived — the ${frame} goes to the freshest one seen`,
    nowhere: (frame, text2) => `Verstak: ${frame} HAS NOWHERE TO GO — the plugin has seen no live root session; a case record stays in the case (${tool("case")} history), a direct word did not arrive — ` + text2,
    halted: (frame, id) => `Verstak: ${frame} not delivered — session ${id} was stopped by taking its seat off; it is not woken until it takes a seat again explicitly`,
    pulseOverflow: (id, waiting) => `Verstak: ${waiting} frames laid into session ${id} wait for its turn — OpenCode does not take them; the pulse keeps them all`,
    haltUnwritten: (id, message) => `Verstak: the stop of session ${id} was not written to disk (${message}) — only the live plugin instances of this process keep the ban, it will not survive a reload`,
    haltUnlifted: (id, message, kept2) => `Verstak: session ${id} holds a seat again and its ban is lifted, but the stop's record on disk was not removed (${message}) — ` + (kept2 ? "rewriting it as lifted failed too: after a plugin reload the session will count as stopped again" : "it is rewritten as lifted"),
    delivered: (frame, id) => `Verstak: ${frame} delivered into session ${id}`,
    notDelivered: (frame, id, message) => `Verstak: ${frame} was not delivered into session ${id}: ${message}`,
    held: (key) => `Verstak: the bridge holds the standing ${key}`,
    released: (key, text2) => `Verstak: the bridge released the standing ${key} — ${text2}`
  }
};

// js/delivery/words/opencode-keep.ts
var OPENCODE_KEEP = {
  en: {
    resumed: (key) => `Verstak: the bridge came up and returned the seat ${key} itself — by its own holding record (the session's directory or the previous seat's key), without your move. Check the name against the one derived for this session: if it is someone else's, release it with ${tool("channel")}(action="leave") (the channel stays; the platform rejects a revoke of the seat that founded the channel) and take your own with one ${tool("stand")}; a write that already went out on this move — check it by its author in the node's history: a word under someone else's name lands on another seat, and the bridge answers with success.`,
    resumedOwn: (key) => `Verstak: the bridge came up and returned the seat ${key} itself — your own, this session stood on it; without your move.`,
    elsewhere: (keys) => `Verstak: returning the seat ${keys} from disk failed — its socket is held by another live bridge, not the one serving this session now: hearing and the busy line here hold no seat. Call ${tool("stand")} with this name, no take needed: the seat of this same session's previous bridge the bridge returns itself, it does not touch another session's seat and stands beside on name.N with hearing.`,
    notBack: (place, why) => `Verstak: the seat ${place} did not return from disk: ${why}. The seat is returning: the hearing watchdog retries the return once — wait for its word; if it did not return on the retry either — ${tool("stand")}.`,
    noKeyNoDir: () => "neither a seat key nor a session directory",
    noAnswer: () => "the bridge did not answer",
    legacy: (word2) => `Verstak: ${word2}.`,
    sessionResumed: (root, word2) => `Verstak: session ${root} — ${word2}`,
    resumeFailed: (root, message) => `Verstak: returning the seat of session ${root} failed — ${message}`,
    retryFailed: (place, why) => `Verstak: the seat ${place} did not return on the watchdog's retry either: ${why}. The watchdog no longer raises it by itself — take the seat with ${tool("stand")}.`,
    noWhy: () => "the bridge did not say why",
    watchResumed: (root, word2) => `Verstak: the hearing watchdog returned the seat of session ${root} — ${word2}`,
    watchReopened: (root, word2) => `Verstak: the hearing watchdog reopened the socket of session ${root} — ${word2}`,
    watchFailed: (root, message) => `Verstak: the hearing watchdog of session ${root} — ${message}`,
    keepaliveTitle: () => "verstak: the directory holds a seat",
    noRemove: (title) => `Verstak: the OpenCode sessions context has no remove — keepalive service sessions "${title}" are not removed and pile up as children of the seat; the keepalive goes on`,
    cap: (max, title) => `Verstak: more than ${max} keepalive service sessions are not removed — no longer retrying the oldest, remove the children "${title}" by hand`,
    notCreated: (message) => `Verstak: the directory was not kept alive — the service session was not created: ${message}`,
    noId: (answer, title) => `Verstak: the directory was kept alive, but the service session's id was not parsed from the create answer (${answer}) — it stays a child session of the seat "${title}", remove it by hand`,
    notRemoved: (id) => `Verstak: the directory was kept alive, the service session ${id} was not removed — retrying on the next tact`,
    tickFailed: (message) => `Verstak: the directory keepalive tact failed — ${message}`,
    lostWord: (hhmm, where) => `Verstak: hearing was lost at ${hhmm} — the plugin was stopped (restart, directory eviction) with a holding bridge: ${where}. The seat returns from disk by itself — wait, the waiting frames come as a batch; call ${tool("stand")} only if the hearing watchdog says the return failed.`,
    movedWhy: (name) => `this child session's errand ended with the parent's move to another folder: its seat${name ? ` ${name}` : ""} is revoked, the bridge is down; a write from here would go under the parent's seat`,
    revokedMoved: (name) => `Verstak: ${name} is a subagent ended by the parent's move: the previous instance put its bridge down and revoked its seat, the outcome reached the parent as the word "moved"; no revoke is needed and none was sent.`,
    twinUp: (dir) => `Verstak: the instance of directory ${dir} was raised again — it returned the seat`,
    markerUntaken: (seconds) => `nobody took the marker of its seats within ${seconds} s`,
    unloaded: (dir, named, why) => `Verstak: directory ${dir} was unloaded with a seat (${named}) and not raised — ${why}`,
    thisSession: () => "of this session",
    seatLost: (key, dir, why) => `Verstak: the seat ${key} was released — the plugin instance of directory ${dir} was unloaded and did not come up (${why}). Return the seat: ${tool("stand")}.`,
    movedAway: (session, dir) => `Verstak: session ${session} was moved to ${dir} — releasing its seat to that folder's instance`,
    takenFromNew: (session) => `Verstak: the seat of session ${session} was taken from its new folder — it was moved`,
    parentMoved: () => "Refused (plugin): this session's parent was moved to another folder — its errand ended with the move, the parent's bridge is not raised here, and it has no seat of its own; this session's work goes on without the graph, or by a word to the launcher.",
    farRefusal: () => "Refused (plugin): this child session was moved to a different directory than its parent, and the parent's seat is held by no plugin instance of this OpenCode process — the parent is in another process or holds no seat. No standing as a satellite from here; reading works as is, writing — by a word to the launcher.",
    elsewhereDevice: (device) => `from another device (a phone will do) — ${device}; or a personal token in ~/.verstak-bridge/token`,
    elsewhereTunnel: (why) => (why ? `${why}; ` : "") + "from another machine — ssh -L <port>:127.0.0.1:<port>, or a personal token in ~/.verstak-bridge/token",
    needLoginError: (open, elsewhere2) => `Verstak: sign-in to the graph is needed — ${open} and repeat the call. The address is local to the OpenCode machine: ${elsewhere2} (the verstak skill, its establish-mcp method).`,
    openAndFinish: (url) => `open ${url} and finish it`,
    finishItInBrowser: () => "finish it in the browser",
    needLogin: (open, elsewhere2) => `Verstak: sign-in needed — ${open}; the address is local: ${elsewhere2}. The ${TOOL_PREFIX}* tools come up by themselves after sign-in.`,
    codeUntil: (link, until) => `${link} (the code is valid until ${until} UTC)`
  }
};

// js/delivery/words/plugin.ts
var PLUGIN = {
  en: {
    noBridge: (tried) => `Verstak: the bridge was not found — there will be no ${TOOL_PREFIX}* tools in this session. Looked in: ` + tried + ". Set VERSTAK_BRIDGE_PATH or install the bridge by the verstak skill's establish-mcp method.",
    bridgeLine: (line) => `Verstak/bridge: ${line}`,
    notRaised: (message) => `Verstak: the bridge did not come up — ${message}`,
    refusalNoText: (name) => `${name}: refusal without text`,
    relistFailed: (message) => `Verstak: the tool list was not reread after the change on the server — ${message}`,
    listening: () => "Verstak: the channel is listening",
    dead: (code2) => String(code2) === "4002" ? `Verstak: the channel was closed with code 4002 — the seat went out after idling. To return it — ${tool("stand")} with the same name.` : `Verstak: the channel was closed with code ${code2} — the token is dead. Call ${tool("channel")}(action="connect"), then register with the same name: the bridge takes the new socket from the answer itself, no restart needed.`,
    stopped: (text2) => `Verstak: ${text2}`,
    stoppedTurn: (stopped) => `${stopped}. This word stands while the seat is taken off; if the user tells you to stand again — stand by an explicit ${tool("stand")} call, and the word goes.`,
    stoppedAny: () => "Verstak: the seat was taken off — you are stopped: end the work, do not take the seat",
    evicted: (code2) => `Verstak: the channel was closed with code ${code2} — the seat was taken, another holder is listening. The bridge stands beside as name.N with hearing itself — its own seat, the other one is not taken over; the outcome comes next, ${tool("stand")} with the same call tells the seat and the watchdog command. Evicting that session (take=true): ${TAKE.en.rule()}.`,
    alive: (version) => `Verstak: the socket keeps being cut while the service answers (${version}) — the bridge holds the seat and reopens less often; if it fails, ask about the token.`,
    note: (text2) => `Verstak: ${text2}`
  }
};

// js/delivery/words/resume.ts
var via = tool("stand");

// js/delivery/words/rooms.ts
var ROOM = {
  en: {
    said: (author) => `message from ${author}`,
    saidPending: (author) => `message from ${author} in flight — the text follows`,
    aside: (author, addressee, word2) => `${author} → ${addressee}: message [${word2}]`,
    asideRun: (author, addressee, count, word2) => `${author} → ${addressee}: ${count} (last [${word2}])`,
    asideBody: (author, addressee, word2) => `${author} → ${addressee}: text of message [${word2}]`,
    messages: (n2) => `${n2} ${n2 === 1 ? "message" : "messages"}`,
    body: (refersTo, author) => `text of message [${refersTo}] from ${author}`,
    bodyAborted: (refersTo) => `message [${refersTo}] cut off by its author`,
    bodyLapsed: (refersTo) => `message [${refersTo}] cut off by the platform on its deadline`,
    closing: (author, endsAt, evidence) => `the lead ${author} proposes to close the case by ${endsAt}${evidence ? `; evidence: ${evidence}` : ""}`,
    closingMay: (entryId) => `you may object — ${tool("case")}(action="object", in_reply_to=${entryId})`,
    closingNot: () => "the objection is not yours to make",
    closed: (reason2) => `case closed: ${reason2}`,
    objection: (author, reason2) => `${author} objects to closing: ${reason2}`,
    lateObjection: (author) => `${author} objected after the close`,
    progress: (key, done, verdict, note, author) => `[${key}] [${done}] = ${verdict}${note} · ${author}`,
    opened: (author) => `case opened by ${author}`,
    joined: (who) => `entered ${who}`,
    left: (who, reason2) => `left ${who}${reason2 ? `; reason: ${reason2}` : ""}`,
    invite: (author, who) => `${author} invites ${who} to the case`,
    withdraw: (author) => `invitation withdrawn by ${author}`,
    retract: (author, answer, afterAck) => `answer [${answer}] retracted${afterAck ? " after acceptance" : ""} by ${author}`,
    node: (seq, name, realm, reasoning) => `node #${seq} ${name} (${realm}) in the case${reasoning}`,
    nodeUpdated: (seq, name, reasoning) => `node #${seq} ${name} updated${reasoning}`,
    nodeDeleted: (seq, name, reasoning) => `node #${seq} ${name} deleted${reasoning}`,
    nodeUndeleted: (seq, name, reasoning) => `node #${seq} ${name} restored${reasoning}`,
    link: (room, rel) => `case linked to case #${room} (${rel})`,
    auto: (code2, room) => `platform record ${code2} about case #${room}`,
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

// js/delivery/words/rootseat.ts
var ROOT_SEAT = {
  en: {
    noFrontmatter: (file) => `${file} carries no YAML front matter`,
    noKey: (file, key) => `the front matter of ${file} has no '${key}' slot`,
    noGraph: (file, key) => `'${key}' in ${file} does not start with @owner/slug or rN`,
    manyGraphs: (file, key, list) => `'${key}' in ${file} names several graphs: ${list}`,
    noRoleRef: (file, key, ref) => `'${key}' in ${file} does not start with a ${ref} reference`,
    manyRoles: (file, key, list) => `'${key}' in ${file} names several roles: ${list}`,
    seated: (place, karta, realm, file) => `Verstak: the session holds seat ${place} — role #${karta} in ${realm}, per ${file}; writes are signed by this seat. For a watch (room/model) or your own name, call ${tool("stand")} — it replaces a provisional seat without take.`,
    /** Seated on the session's own seat returned from disk — not provisional. */
    ownSeated: (place, karta, realm, file) => `Verstak: the session holds its own seat ${place} — role #${karta} in ${realm}, per ${file}; writes are signed by it. A different name requires ${tool("stand")} with take.`,
    cancelled: () => "The instance or session is stopped; no new seating is allowed.",
    cleanupFailed: (place, why) => `Cancelled seating ${place}: could not revoke the seat (${why}); the bridge is closing, the seat may remain until the server's idle expiry.`,
    unproven: () => "the bridge did not prove this attempt took a provisional seat; revoke is not authorized",
    notSeated: (why) => `Verstak: the session is not seated — ${why}; a seat comes by the human's word or ${tool("stand")}.`,
    refused: (text2) => `seating failed: ${text2}`,
    ownOther: (place, karta, realm) => `Verstak: the session holds seat ${place} — role #${karta} in ${realm}; its role or graph differs from the cover. To change seats, use ${tool("stand")} with take or explicitly revoke the held seat.`,
    /** The session holds a seat whose graph could not be compared with the cover's. */
    heldUncompared: (place, karta, held, cover) => `Verstak: the session holds seat ${place} — role #${karta}, ${held}; its graph is not compared with ${cover} in the cover. To change seats, use ${tool("stand")} with take or explicitly revoke the held seat.`,
    unknownRealm: () => "graph unknown (hold record unavailable)",
    uncompared: (cover, held) => `graph not compared: ${cover} in the cover, ${held} on the seat`,
    late: (seconds) => `seating did not finish in ${seconds} s, the request goes without a seat`,
    noBridge: () => "no bridge raised"
  }
};

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
import { createHash } from "node:crypto";
import { homedir as homedir2 } from "node:os";
import { join as join2, resolve } from "node:path";
var defaultAuthDir = () => join2(homedir2(), HOME_DIR);
var authDirFromEnv = () => envOf(envName("BRIDGE_AUTH_DIR"))?.trim() || defaultAuthDir();
var standingsDirOf = (authDir2) => join2(authDir2, "standings");
var hashOf = (key) => createHash("sha256").update(key).digest("hex").slice(0, 16);
var holdFilePathOf = (authDir2, key) => join2(standingsDirOf(authDir2), `${hashOf(key)}.hold`);

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

// js/shared/channel.ts
var SILENT_FLOOR_MS = Number(process.env[envName("CHANNEL_SILENT_FLOOR_MS")]) || 6e4;
var FLAP_PAUSES_MS = (process.env[envName("CHANNEL_FLAP_MS")] || "5000,10000,20000,40000,60000").split(",").map(Number).filter((n2) => Number.isFinite(n2) && n2 > 0);
function classifyOrigin(frame, myKarta) {
  const p = frame.provenance ?? {};
  const noAuthor = p.via === "room" && p.from_karta_seq == null && !p.from_standing;
  if (p.via === "platform" || p.auth === "none" || p.auth === "platform" || noAuthor)
    return "platform";
  if (p.as_person === true) return "human";
  if (p.from_karta_seq != null && p.user_karta_seq != null && p.from_karta_seq === p.user_karta_seq)
    return "human";
  if (myKarta != null && p.from_karta_seq != null && String(p.from_karta_seq) === String(myKarta))
    return "sibling";
  return "peer";
}
function isDirectWord(frame) {
  if (frame?.type !== "message") return false;
  const f = frame;
  if (f.room || typeof f.event_kind === "string" && f.event_kind.startsWith("room."))
    return false;
  const p = frame.provenance ?? {};
  if (p.via === "graph" || p.via === "room") return false;
  const origin2 = frame.origin ?? classifyOrigin(frame);
  if (origin2 === "platform") return false;
  return origin2 === "human" || !!p.from_standing || p.from_karta_seq != null;
}

// js/shared/room-fields.ts
var obj = (v) => v && typeof v === "object" && !Array.isArray(v) ? v : {};
var str = (v) => typeof v === "string" ? v : typeof v === "number" || typeof v === "boolean" ? String(v) : "";
var after = (key, prefix) => key.startsWith(prefix) ? key.slice(prefix.length) : key;
var need = (v) => str(v) || "?";
var opt = (sep2, v) => {
  const x = str(v);
  return x ? sep2 + x : "";
};
var pick = (dict, key) => Object.hasOwn(dict, key) ? dict[key] : void 0;
var mineOf = (frame) => [str(frame.to_standing_id), str(frame.to_standing)].filter(Boolean);
function myRole(frame, fields) {
  const ka = obj(fields.karta);
  const seq = str(ka.seq);
  if (!seq || seq !== str(frame.karta_seq)) return false;
  const theirs = str(ka.realm);
  const mine = str(frame.realm) || str(obj(frame.room).realm);
  return !theirs || !mine || theirs === mine;
}
function addresseeOf(v) {
  if (typeof v === "string") return v ? { addr: [v], label: v } : null;
  const o = obj(v);
  const handle = str(o.handle).replace(/^@/, "");
  const standing = str(o.standing) || (handle ? `@${handle}${str(o.name) ? `:${str(o.name)}` : ""}` : "");
  const id = str(o.id);
  const name = str(o.standing) ? str(o.name) : "";
  const label = name && standing ? `${name} (${standing})` : standing || str(o.name) || id;
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
var byMe = (frame) => {
  const mine = mineOf(frame);
  const author = obj(obj(frame.line).author);
  return [str(author.id), str(author.standing)].some((a) => a && mine.includes(a));
};
var askFromPerson = (frame) => {
  const line = obj(frame.line);
  const kind = str(line.kind);
  const asking = ASK_KINDS.has(kind) || kind === "progress" && !!str(obj(line.fields).withdraws);
  return asking && classifyOrigin(frame) === "human";
};
var handleOf = (address) => /^@([^:]+):/.exec(address)?.[1] ?? "";
function askedMine(frame, fields) {
  const mine = mineOf(frame);
  if (byMe(frame)) return false;
  const to = toOf(fields);
  const place = addresseeOf(to.standing);
  if (place?.addr.some((a) => mine.includes(a))) return true;
  if (!myRole(frame, { karta: to.karta })) return false;
  if (!place) return true;
  const theirs = handleOf(str(obj(to.standing).standing) || str(to.standing));
  return !!theirs && theirs === handleOf(str(frame.to_standing));
}
function addressedMine(frame) {
  if (frame.addressee_left === true) return false;
  const to = addresseeOf(frame.addressee) ?? addresseeOf(toOf(obj(obj(frame.line).fields)));
  const mine = mineOf(frame);
  return !!to && to.addr.some((a) => mine.includes(a));
}
var quote = (s) => s ? words(CASE_LINE).quote(s) : "";
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
  const rec3 = obj(fields.recommendation);
  return {
    to: str(k.name) || (str(k.seq) ? `#${str(k.seq)}` : ""),
    to_place: place ? W4.place(need(place)) : "",
    form: formOf(fields),
    advice: str(rec3.option) || str(rec3.why) ? W4.advice(need(str(rec3.option) || "—"), opt(" — ", rec3.why)) : ""
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
var numberingOf = (frame) => frame.numbering === "case" ? "case" : "";
var numberedKey = (frame, key) => key && numberingOf(frame) ? `case:${key}` : key;

// js/shared/askmemory.ts
var baseOf = (frame) => numberedKey(
  frame,
  `${mineOf(frame)[0] ?? ""}|${str(obj(frame.room).id) || str(obj(frame.room).seq)}|${str(obj(frame.line).key)}`
);
var lineOf = (frame) => obj(frame.line);
var kindOf = (frame) => str(lineOf(frame).kind);
var numOf = (frame) => str(lineOf(frame).entry_id ?? frame.entry_id);
function openOn(store, frame) {
  const base = `${baseOf(frame)}#`;
  const out2 = [];
  for (const s of store.keys())
    if (s.startsWith(base) && !store.has(`off:${s}`)) out2.push(s.slice(base.length));
  return out2;
}
var namedOf = (frame) => {
  const kind = kindOf(frame);
  if (kind === "progress") return str(obj(lineOf(frame).fields).withdraws);
  if (kind === "answer") return str(lineOf(frame).refers_to) || str(frame.in_reply_to);
  return "";
};
var isOpen = (store, frame, n2) => {
  const k = `${baseOf(frame)}#${n2}`;
  return !!n2 && store.has(k) && !store.has(`off:${k}`);
};
function closesMine(store, frame) {
  if (byMe(frame) || !str(lineOf(frame).key)) return false;
  const kind = kindOf(frame);
  if (kind === "progress" || kind === "answer") return isOpen(store, frame, namedOf(frame));
  return kind === "ask" && !askedMine(frame, obj(lineOf(frame).fields)) && openOn(store, frame).length > 0;
}
function noteAsk(store, frame) {
  if (!str(lineOf(frame).key)) return;
  const kind = kindOf(frame);
  const fields = obj(lineOf(frame).fields);
  const base = `${baseOf(frame)}#`;
  if (kind === "ask" && askedMine(frame, fields)) {
    const own = numOf(frame);
    if (store.has(`${base}${own}`)) return;
    for (const n2 of openOn(store, frame)) store.add(`off:${base}${n2}`);
    store.add(`${base}${own}`);
    return;
  }
  if (kind === "progress" || kind === "answer" && !byMe(frame)) {
    const n2 = namedOf(frame);
    if (isOpen(store, frame, n2)) store.add(`off:${base}${n2}`);
  } else if ((kind === "ack" || kind === "ask") && !byMe(frame))
    for (const n2 of openOn(store, frame)) store.add(`off:${base}${n2}`);
}
var ASKS_KEPT = 512;
var kept = /* @__PURE__ */ new Set();
var processAsks = {
  has: (s) => kept.has(s),
  add: (s) => {
    kept.add(s);
    for (const old of kept) {
      if (kept.size <= ASKS_KEPT) break;
      kept.delete(old);
    }
  },
  keys: () => kept
};

// js/shared/room-kinds.ts
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
  const name = str(a.name);
  const standing = str(a.standing);
  if (name) return standing ? `${name} (${standing})` : name;
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
  const name = str(st.name) || str(ka.name);
  const addr = str(st.standing);
  return name && addr ? `${name} (${addr})` : name || addr;
}
function kindText(kind, v, f, pending, aborted) {
  const W4 = words(ROOM);
  const n2 = (k) => need(v[k]);
  const lapsed = obj(obj(f.line).author).kind === "platform";
  if (pending) return W4.saidPending(n2("author"));
  if (aborted) return lapsed ? W4.bodyLapsed(n2("refers_to")) : W4.bodyAborted(n2("refers_to"));
  if (kind === "auto")
    return pick(words(ROOM_AUTO), str(v.code))?.(n2("room")) ?? W4.auto(n2("code"), n2("room"));
  const ask = askText(kind, str(v.cause), v);
  if (ask !== void 0) return ask;
  const reasoning = opt("; ", v.reasoning);
  const op = kind === "node" ? pick(NODE_OPS, str(v.op)) : void 0;
  if (op) return W4[op](n2("seq"), n2("name"), reasoning);
  switch (kind) {
    case "said":
      return W4.said(n2("author"));
    case "body":
      return W4.body(n2("refers_to"), n2("author"));
    case "closing":
      return W4.closing(n2("author"), n2("ends_at"), str(v.evidence));
    case "closed":
      return W4.closed(n2("reason"));
    case "objection":
      return W4.objection(n2("author"), n2("reason"));
    case "late_objection":
      return W4.lateObjection(n2("author"));
    case "progress":
      return W4.progress(n2("key"), n2("done"), n2("verdict"), opt(" — ", v.note), n2("author"));
    case "opened":
      return W4.opened(n2("author"));
    case "joined":
      return W4.joined(n2("who"));
    case "left":
      return W4.left(n2("who"), str(v.reason));
    case "invite":
      return W4.invite(n2("author"), n2("who"));
    case "withdraw":
      return W4.withdraw(n2("author"));
    case "retract":
      return W4.retract(n2("author"), n2("refers_to"), v.after_ack === true);
    case "node":
      return W4.node(n2("seq"), n2("name"), n2("realm"), reasoning);
    case "link":
      return W4.link(n2("room"), n2("rel"));
    default:
      return "";
  }
}
function roomKind(frame) {
  if (!frame || typeof frame !== "object") return null;
  const f = frame;
  const ek = f.event_kind;
  if (typeof ek !== "string" || !ek.startsWith("room.")) return null;
  const kind = ek.slice(5);
  const line = obj(f.line);
  const fields = obj(line.fields);
  const key = str(line.key);
  const mine = mineOf(f);
  const node = obj(fields.node);
  const cause = kind === "invite" ? str(fields.cause) : "";
  const byWhom = authorOf(
    kind === "body" && Object.keys(obj(f.in_reply_to_from)).length ? f.in_reply_to_from : line.author
  );
  const values = {
    kind,
    cause,
    author: byWhom,
    key,
    done: line.done,
    verdict: pick(words(VERDICT), str(line.verdict))?.() ?? line.verdict,
    note: line.note,
    ends_at: fields.ends_at,
    evidence: Array.isArray(fields.evidence) ? fields.evidence.map(str).join(", ") : "",
    entry_id: line.entry_id ?? f.entry_id,
    refers_to: str(line.refers_to) || str(f.in_reply_to) || str(obj(f.word).entry_id),
    reason: fields.reason,
    target: after(key, "invite:"),
    // Observed live: the invite key carries the id, the invitee's name is in the line fields (standing/karta with name).
    // Joined and left — fields.standing (a timed-out leave is written by the platform, api 0.89.6), else the author;
    // a role call by cause — fields.karta (graph @nks/nks-dev, node #6870).
    who: kind === "joined" || kind === "left" ? whoOf({ standing: fields.standing }) || byWhom : (cause ? whoOf({ karta: fields.karta }) : whoOf(fields)) || after(key, "invite:"),
    standing: str(fields.gone_standing) || addresseeOf(fields.gone_standing)?.label,
    ...ASK_KINDS.has(kind) ? askValues(kind, line, fields) : {},
    room: roomOf(fields.room) || after(key, "link:"),
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
  const word2 = kind === "said" || kind === "body";
  const withheld = word2 && f.body_withheld === true;
  const to = word2 ? addresseeOf(f.addressee) ?? (withheld ? { addr: ["?"], label: "?" } : null) : null;
  const addresseeLeft = f.addressee_left === true || fields.addressee_left === true;
  if (to && !addresseeLeft && (withheld || mine.length && !to.addr.some((a) => mine.includes(a)))) {
    const counts = kind === "said";
    const pair = JSON.stringify([roomOf(f.room), author, to.addr[0]]);
    const id = need(counts ? values.entry_id : values.refers_to);
    const by = need(values.author);
    const addressee = need(to.label);
    const run = (n2) => n2 === 0 ? W4.asideBody(by, addressee, id) : n2 > 1 ? W4.asideRun(by, addressee, W4.messages(n2), id) : W4.aside(by, addressee, id);
    const aside = { pair, counts, run };
    const words3 = run(counts ? 1 : 0);
    return { kind, rule: "batch", words: words3, author, phase: null, known: true, aside };
  }
  const pending = kind === "said" && f.body_pending === true && !str(f.body) && !str(line.done);
  const aborted = kind === "body" && fields.aborted === true;
  let text2 = kindText(kind, values, f, pending, aborted);
  if (kind === "closing") {
    const may = Array.isArray(fields.may_object) ? fields.may_object.map((m) => typeof m === "string" ? m : str(obj(m).id)) : [];
    const myId = str(f.to_standing_id);
    const mayI = !!myId && may.includes(myId);
    text2 += "; " + (mayI ? W4.closingMay(need(values.entry_id)) : W4.closingNot());
  }
  const stack = rule === "stack" ? f.stack === "defer" ? "batch" : "interrupt" : rule === "mine" ? mine.includes(str(values.target)) || myRole(f, fields) ? "interrupt" : "batch" : rule === "addressed" ? addressedMine(f) ? "interrupt" : "batch" : rule;
  const phase = pending ? "pending" : aborted ? "aborted" : null;
  return { kind, rule: phase ? "batch" : stack, words: text2, author, phase, known: true };
}
var byKind = (frame) => roomKind(frame) !== null;
var stackOf = (frame) => roomKind(frame)?.rule ?? (frame?.stack === "defer" ? "batch" : "interrupt");

// js/shared/addressed.ts
var LOUD_KINDS = /* @__PURE__ */ new Set(["closing", "closed", "objection", "late_objection"]);
var addressedWords = /* @__PURE__ */ new Set();
var WORDS_KEPT = 512;
function wordKeyOf(frame) {
  const f = frame;
  const line = obj(f.line);
  const entry = roomKind(frame)?.kind === "body" ? str(line.refers_to) || str(f.in_reply_to) || str(obj(f.word).entry_id) : str(line.entry_id ?? f.entry_id);
  return numberedKey(
    frame,
    `${mineOf(f)[0] ?? ""}|${str(obj(f.room).id) || str(obj(f.room).seq)}|${entry}`
  );
}
function rememberWord(key) {
  addressedWords.add(key);
  for (const old of addressedWords) {
    if (addressedWords.size <= WORDS_KEPT) break;
    addressedWords.delete(old);
  }
}
var ASK_CLOSERS = /* @__PURE__ */ new Set(["ask", "answer", "ack", "progress"]);
var askDecided = /* @__PURE__ */ new Map();
function askMemory(f) {
  if (f.asks_decided === true) return false;
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
function addressedToMine(frame) {
  if (!frame) return false;
  const f = frame;
  const room = obj(f.room);
  if (!str(room.seq) && !str(room.id)) return true;
  if (!byKind(frame)) return true;
  const line = obj(f.line);
  const fields = obj(line.fields);
  const rk = roomKind(frame);
  if (rk?.aside) return false;
  const closesAsk = !!rk && ASK_CLOSERS.has(rk.kind) && askMemory(f);
  const mine = mineOf(f);
  const hit = (v) => {
    const a = addresseeOf(v);
    return !!a && mine.length > 0 && a.addr.some((x) => mine.includes(x));
  };
  if (rk?.kind === "body") {
    const word2 = obj(f.word);
    if (f.addressed === true || hit(f.addressee) || str(obj(obj(word2.line).fields).kind) === "important" || addressedWords.has(wordKeyOf(frame)))
      return true;
  } else if (
    // A word to me, a reply to my record (#5954), marked important; a word in flight
    // is remembered, since its body comes as a second phase without these marks.
    hit(f.addressee) || hit(f.in_reply_to_from) || str(f.said) === "important" || str(fields.kind) === "important"
  ) {
    if (rk?.phase === "pending") rememberWord(wordKeyOf(frame));
    return true;
  }
  if (rk?.kind === "ask" && askedMine(f, fields)) return true;
  if (closesAsk || rk && ASK_CLOSERS.has(rk.kind) && f.addressed === true) return true;
  if (rk?.kind === "invite" || rk?.kind === "withdraw") {
    if (mine.includes(after(str(line.key), "invite:"))) return true;
    if (rk.kind === "invite" && myRole(f, fields)) return true;
  }
  if (rk && LOUD_KINDS.has(rk.kind)) return true;
  if (rk && (ASK_KINDS.has(rk.kind) || rk.kind === "retract") || askFromPerson(f)) return false;
  return (frame.origin ?? classifyOrigin(frame, str(f.karta_seq) || void 0)) === "human";
}

// js/shared/keyfold.ts
var rec = (v) => v && typeof v === "object" ? v : {};
var idOf = (v) => typeof v === "number" || typeof v === "string" && v ? String(v) : "";
function superseded(frames) {
  const last = /* @__PURE__ */ new Map();
  const out2 = /* @__PURE__ */ new Set();
  frames.forEach((f, i) => {
    const r = f;
    const line = rec(r.line);
    const key = typeof line.key === "string" ? line.key : "";
    if (line.kind !== "progress" || !key || line.verdict === "bad" || addressedToMine(f)) return;
    const k = `${idOf(rec(r.room).id) || idOf(rec(r.room).seq)}|${key}`;
    const e = Number(r.entry_id ?? line.entry_id);
    const at = Number.isFinite(e) ? e : i;
    const was = last.get(k);
    if (!was) return void last.set(k, { frame: f, at });
    if (at >= was.at) {
      out2.add(was.frame);
      last.set(k, { frame: f, at });
    } else out2.add(f);
  });
  return out2;
}

// js/shared/frame-text.ts
var W = () => words(ROOM);
var T = () => words(FRAME_TEXT);
var rec2 = (v) => v && typeof v === "object" ? v : {};
var idOf2 = (v) => typeof v === "number" || typeof v === "string" && v ? String(v) : "";
var ZACHIN = 40;
function casesOf(frames) {
  const by = /* @__PURE__ */ new Map();
  for (const f of frames) {
    const key = caseKey(f) || idOf2(f.id) || "?";
    const got = by.get(key);
    if (got) got.push(f);
    else by.set(key, [f]);
  }
  return [...by.values()];
}
function caseOf(frame) {
  const f = frame;
  const room = rec2(f.room);
  const n2 = idOf2(room.seq) || idOf2(room.id);
  if (!n2) return null;
  const z = typeof room.zachin === "string" ? [...room.zachin.trim()] : [];
  const zachin = z.length > ZACHIN ? z.slice(0, ZACHIN).join("") + "…" : z.join("");
  const realm = idOf2(room.realm) || idOf2(f.realm);
  return { room: n2, zachin, realm };
}
var caseKey = (frame) => caseOf(frame)?.room ?? "";
function caseHead(frame, withZachin) {
  const c = caseOf(frame);
  if (!c) return "";
  const no = W().case(need(c.room));
  return withZachin && c.zachin ? `${no} «${c.zachin}»` : no;
}
function whoOf2(frame, withPlace) {
  const p = frame.provenance ?? {};
  const origin2 = frame.origin ?? classifyOrigin(frame);
  if (origin2 === "platform") return W().whoPlatform();
  if (p.via === "graph" && p.from_karta_seq == null && !p.from_standing) return W().whoGraph();
  const place = withPlace && p.from_standing ? ` (${p.from_standing})` : "";
  if (origin2 === "human") return W().whoHuman(opt(" @", p.user)) + place;
  const karta = p.from_karta_seq;
  if (karta == null) return p.from_standing ?? "";
  return (origin2 === "sibling" ? W().whoSibling : W().whoRole)(need(karta)) + place;
}
function textOf(frame) {
  if (roomKind(frame)?.aside) return "";
  const b = frame.body;
  return typeof b === "string" ? b : b === void 0 ? "" : JSON.stringify(b);
}
function tail(frame, withReply) {
  const f = frame;
  const parts = [];
  const to = idOf2(f.in_reply_to) || idOf2(frame.provenance?.in_reply_to);
  if (withReply && to) parts.push(W().replyTo(need(to)));
  if (frame.stale === true) parts.push(W().stale());
  if (typeof frame.body_read === "string" && frame.body_read !== "history")
    parts.push(W().bodyRead(need(frame.body_read)));
  return parts.length ? `, ${parts.join(", ")}` : "";
}
var markFrame = (text2) => `${FRAME_MARK} ${text2}`;
function frameToText(frame, raw) {
  if (!frame) return raw;
  const f = frame;
  const origin2 = frame.origin ?? classifyOrigin(frame);
  const text2 = textOf(frame);
  const c = caseOf(frame);
  if (c) {
    if (!addressedToMine(frame)) return caseCountLine([frame]);
    const rk = roomKind(frame);
    const line = rec2(f.line);
    const entry = idOf2(f.entry_id) || idOf2(line.entry_id);
    const words3 = rk ? rk.words : W().legacy(need(f.kind), typeof f.stack === "string" ? f.stack : "");
    const author = rk?.author && !words3.includes(rk.author) ? rk.author : "";
    const who = origin2 === "platform" ? "" : whoOf2(frame, false);
    const by = [author, who].filter(Boolean).join(", ");
    const withReply = rk?.kind !== "body";
    const head = `${caseHead(frame, true)}${entry ? ` [${entry}]` : ""} ${words3}${by ? ` — ${by}` : ""}${tail(frame, withReply)}`;
    const lines2 = [head];
    if (text2 && !words3.includes(text2.trim())) lines2.push(text2);
    return lines2.join("\n");
  }
  const lines = [`${whoOf2(frame, true) || "?"}${tail(frame, true)}`];
  if (text2) lines.push(text2);
  return lines.join("\n");
}
var BATCH_TEXT = 160;
function batchLine(frame, run, withZachin = true) {
  const f = frame;
  const rk = roomKind(frame);
  const head = caseHead(frame, withZachin);
  const pre = head ? `${head} ` : "";
  if (rk?.aside) return pre + (run === void 0 ? rk.words : rk.aside.run(run));
  const line = rec2(f.line);
  const e = f.entry_id ?? line.entry_id ?? f.id;
  const entry = typeof e === "number" || typeof e === "string" ? e : "?";
  const words3 = rk?.words ?? T().frame(typeof f.id === "string" ? f.id : "?");
  const author = rk?.author && !words3.includes(rk.author) ? ` — ${rk.author}` : "";
  const flat = [...textOf(frame).replace(/\s+/g, " ").trim()];
  const text2 = flat.length > BATCH_TEXT ? flat.slice(0, BATCH_TEXT).join("") + "…" : flat.join("");
  const dup = !!text2 && words3.includes(text2);
  return `${pre}[${entry}] ${words3}${author}${tail(frame, rk?.kind !== "body")}${text2 && !dup ? `: ${text2}` : ""}`;
}
function batchLines(frames) {
  const seen = /* @__PURE__ */ new Set();
  return frames.flatMap((f) => {
    if (!addressedToMine(f)) return [];
    const key = caseKey(f);
    const first = !seen.has(key);
    seen.add(key);
    return [batchLine(f, void 0, first)];
  });
}
function caseCountLine(frames) {
  const c = frames.length ? caseOf(frames[0]) : null;
  if (!c) return "";
  const mineN = frames.filter((f) => addressedToMine(f)).length;
  const gone = superseded(frames).size;
  const head = caseHead(frames[0], true);
  const yours = mineN ? T().yoursBelow() : T().noneYours();
  const n2 = frames.length - gone;
  return T().count(head, n2, mineN) + (gone ? T().supersededLines(gone) : "") + yours + batchPointer(frames) + ".";
}
function caseCountLines(frames) {
  return casesOf(frames).map(caseCountLine).filter(Boolean);
}
function batchHead(frames) {
  return caseCountLines(frames).join("\n");
}
function batchPointer(frames) {
  const since = /* @__PURE__ */ new Map();
  for (const frame of frames) {
    const f = frame;
    const room = f.room ?? {};
    const line = f.line ?? {};
    const n2 = room.seq ?? room.id;
    const e = Number(f.entry_id ?? line.entry_id);
    if (typeof n2 !== "number" && typeof n2 !== "string" || !Number.isFinite(e)) continue;
    const realm = room.realm ?? f.realm;
    const args = (typeof realm === "string" && realm ? `realm="${realm}", ` : "") + `action="history", room=${typeof n2 === "number" ? String(n2) : JSON.stringify(n2)}`;
    since.set(args, Math.min(since.get(args) ?? e, e));
  }
  return T().inFull([...since].map(([args, e]) => T().caseHistory(args, e - 1)).join("; "));
}

// js/shared/launch.ts
var LINE = LAUNCH_LINE;
function parseLaunch(text2) {
  const [, realm, karta, no, of] = LINE.exec(text2) ?? [];
  return realm && karta && no ? { realm, karta, no, of: of ?? null } : null;
}
function withWord(text2, word2) {
  const m = LINE.exec(text2);
  if (!m) return `${text2}
${word2}`;
  const nl = text2.indexOf("\n", m.index);
  return nl < 0 ? `${text2}
${word2}` : `${text2.slice(0, nl)}
${word2}${text2.slice(nl)}`;
}
async function enterCase(l, call, satelliteOf, placeName) {
  const W4 = words(LAUNCH);
  const room = `#${l.no}`;
  const stand = { realm: l.realm, karta: l.karta };
  if (satelliteOf) stand.satellite_of = satelliteOf;
  try {
    await call(tool("stand"), stand);
  } catch (e) {
    const why = e.message;
    const join14 = `${tool("case")}(action="join", room="${room}")`;
    return W4.notSeated(why, l.no, join14);
  }
  const place = placeName() || W4.ownSeat();
  try {
    await call(tool("case"), { action: "join", realm: l.realm, room });
  } catch (e) {
    return W4.notEntered(place, l.no, e.message);
  }
  return W4.entered(place, l.no);
}

// js/opencode/bridge-io.ts
import {
  accessSync,
  constants,
  mkdirSync,
  readdirSync as readdirSync2,
  readFileSync as readFileSync4,
  statSync as statSync2,
  writeFileSync
} from "node:fs";
import { homedir as homedir4 } from "node:os";
import { join as join6, resolve as resolve3 } from "node:path";

// js/shared/bridge-client.ts
import { spawn } from "node:child_process";
import { basename } from "node:path";

// js/shared/serviceid.ts
var SERVICE_ID = `${ID_PREFIX}service-`;

// js/shared/bridge-client.ts
var W2 = () => words(BRIDGE_CLIENT);
function bridgeRuntime() {
  const own = process.env[envName("NODE")]?.trim();
  if (own) return { bin: own, env: process.env };
  if (process.versions?.bun)
    return { bin: process.execPath, env: { ...process.env, BUN_BE_BUN: "1" } };
  if (!/^node/i.test(basename(process.execPath))) return { bin: "node", env: process.env };
  return { bin: process.execPath, env: process.env };
}
var STOP_GRACE_MS = 5e3;
var Bridge = class {
  proc = null;
  buf = "";
  nextId = 1;
  pending = /* @__PURE__ */ new Map();
  tail = [];
  dead = null;
  bin;
  onLog;
  onNotification;
  onDie;
  args;
  constructor(bin, onLog, onNotification = () => {
  }, onDie = () => {
  }, args = []) {
    this.bin = bin;
    this.onLog = onLog;
    this.onNotification = onNotification;
    this.onDie = onDie;
    this.args = args;
  }
  /** The bridge exited or failed to start — calls to it are refused with this. */
  get failure() {
    return this.dead;
  }
  /** env — over the runtime's: host version for attrs.harness_version (#6226). */
  start(env = {}) {
    const rt = bridgeRuntime();
    const proc = spawn(rt.bin, [this.bin, ...this.args], {
      stdio: ["pipe", "pipe", "pipe"],
      env: { ...rt.env, ...env }
    });
    this.proc = proc;
    proc.stdout?.setEncoding("utf8");
    proc.stdout?.on("data", (chunk) => this.feed(chunk));
    proc.stderr?.setEncoding("utf8");
    let errBuf = "";
    proc.stderr?.on("data", (chunk) => {
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
    proc.on("error", (e) => this.die(new Error(W2().failedToStart(e.message))));
    proc.on("exit", (code2, signal) => this.die(new Error(W2().exited(code2, signal, this.why()))));
  }
  why() {
    return this.tail.length ? W2().lastFromBridge(this.tail.slice(-3).join(" | ")) : "";
  }
  die(e) {
    if (this.dead) return;
    this.dead = e;
    for (const [, p] of this.pending) p.reject(e);
    this.pending.clear();
    try {
      this.onDie(e);
    } catch {
    }
  }
  feed(chunk) {
    this.buf += chunk;
    const lines = this.buf.split("\n");
    this.buf = lines.pop() ?? "";
    for (const line of lines) {
      const trimmed = line.replace(/\r$/, "").trim();
      if (!trimmed) continue;
      let msg;
      try {
        msg = JSON.parse(trimmed);
      } catch {
        continue;
      }
      const service = typeof msg?.id === "string" && msg.id.startsWith(SERVICE_ID);
      if (typeof msg?.id !== "number" && !service) {
        if (typeof msg?.method === "string") this.onNotification(msg.method, msg.params);
        continue;
      }
      const waiter = this.pending.get(msg.id);
      if (!waiter) continue;
      this.pending.delete(msg.id);
      if (msg.error)
        waiter.reject(
          Object.assign(new Error(msg.error.message || JSON.stringify(msg.error)), {
            code: msg.error.code
          })
        );
      else waiter.resolve(msg.result);
    }
  }
  notify(method2, params) {
    if (this.dead || !this.proc?.stdin?.writable) return;
    this.proc.stdin.write(JSON.stringify({ jsonrpc: "2.0", method: method2, params }) + "\n");
  }
  request(method2, params, opts = {}) {
    if (this.dead) return Promise.reject(this.dead);
    const id = opts.service ? `${SERVICE_ID}${this.nextId++}` : this.nextId++;
    return new Promise((res, rej) => {
      let timer = null;
      const settle2 = (fn) => (v) => {
        if (timer) clearTimeout(timer);
        opts.signal?.removeEventListener("abort", onAbort);
        fn(v);
      };
      const resolve7 = settle2(res);
      const reject = settle2(rej);
      function onAbort() {
        reject(new Error(W2().aborted()));
      }
      this.pending.set(id, { resolve: resolve7, reject });
      if (opts.signal) {
        if (opts.signal.aborted) return onAbort();
        opts.signal.addEventListener("abort", onAbort, { once: true });
      }
      const ms = opts.timeoutMs;
      if (ms) {
        timer = setTimeout(() => {
          this.pending.delete(id);
          reject(new Error(W2().noAnswer(method2, ms, this.why())));
        }, ms);
        timer.unref?.();
      }
      if (!this.proc?.stdin?.writable) return reject(new Error(W2().noWrites()));
      this.proc.stdin.write(JSON.stringify({ jsonrpc: "2.0", id, method: method2, params }) + "\n");
    });
  }
  stop() {
    this.die(new Error(W2().sessionClosed()));
    const proc = this.proc;
    this.proc = null;
    if (!proc || proc.killed || proc.exitCode !== null) return;
    try {
      proc.stdin?.end();
      proc.kill("SIGTERM");
      const hard = setTimeout(() => {
        try {
          proc.kill("SIGKILL");
        } catch {
        }
      }, STOP_GRACE_MS);
      hard.unref?.();
      proc.on("exit", () => clearTimeout(hard));
    } catch {
    }
  }
};
function toParameters(inputSchema) {
  const schema = inputSchema && typeof inputSchema === "object" ? { ...inputSchema } : { type: "object", properties: {} };
  delete schema.$schema;
  if (!schema.type) schema.type = "object";
  if (schema.type === "object" && !schema.properties) schema.properties = {};
  return schema;
}
function snippet(description) {
  const first = (description || "").split("\n").find((l) => l.trim()) ?? "";
  const cut = first.trim().split(/(?<=[.。!?])\s/)[0] ?? first.trim();
  return cut.length > 160 ? cut.slice(0, 157) + "…" : cut;
}
function resultToContent(result) {
  const blocks = Array.isArray(result?.content) ? result.content : [];
  const out2 = blocks.map((b) => {
    if (b?.type === "text") return { type: "text", text: String(b.text ?? "") };
    if (b?.type === "image" && b.data) {
      return {
        type: "image",
        data: String(b.data),
        mimeType: String(b.mimeType ?? "image/png")
      };
    }
    return { type: "text", text: JSON.stringify(b) };
  });
  if (out2.length) return out2;
  const structured = result?.structuredContent;
  return [
    {
      type: "text",
      text: structured ? JSON.stringify(structured) : W2().emptyAnswer()
    }
  ];
}

// js/shared/clients.ts
var OPENCODE_CLIENT = CLIENTS.opencode;
var PI_CLIENT = CLIENTS.pi;
var HARNESS_VERSION_ENV = envName("HARNESS_VERSION");
var SKILLS_ROOT_ENV = envName("SKILLS_ROOT");

// js/shared/fields.ts
var FIELDS_CAPABILITY = STRUCTURED_CAPABILITY;
var FIELDS_CAPABILITIES = { experimental: { [FIELDS_CAPABILITY]: {} } };

// js/shared/home.ts
import { homedir as homedir3 } from "node:os";
import { join as join4 } from "node:path";
var homeBridgePath = () => join4(homedir3(), HOME_DIR, HOME_BRIDGE_FILE);

// js/shared/version.ts
import { createHash as createHash2 } from "node:crypto";
import { readFileSync as readFileSync3 } from "node:fs";
import { fileURLToPath } from "node:url";
function buildOf(selfUrl) {
  try {
    const src = readFileSync3(fileURLToPath(selfUrl));
    return `v${VERSION}+${createHash2("sha256").update(src).digest("hex").slice(0, 8)}`;
  } catch {
    return `v${VERSION}`;
  }
}
function buildOfFile(path) {
  try {
    const src = readFileSync3(path);
    const v = versionIn(src.toString("utf8")) ?? "?";
    return `v${v}+${createHash2("sha256").update(src).digest("hex").slice(0, 8)}`;
  } catch {
    return null;
  }
}
var MARK_LITERAL = /"([^"\s]+-build):(?:dev|release)"/g;
function versionIn(text2) {
  for (const [, name] of text2.matchAll(MARK_LITERAL)) if (name !== BUILD_MARK) return null;
  const m = /^(?:const|let|var)\s+VERSION\s*=\s*"([^"]+)"/m.exec(text2);
  return m ? m[1] : null;
}

// js/opencode/devicewait.ts
import { readdirSync, statSync } from "node:fs";
import { join as join5 } from "node:path";
var UNTIL = /valid until (\d{4}-\d\d-\d\d \d\d:\d\d:\d\d) UTC/;
function deviceOf(message) {
  const link = /from another device: (\S+)/.exec(message)?.[1];
  if (!link) return /no sign-in by code: (.+?) — or give the bridge/.exec(message)?.[1] ?? null;
  const until = UNTIL.exec(message)?.[1];
  return until ? words(OPENCODE_KEEP).codeUntil(link, until) : link;
}
function loginStamp(dir) {
  try {
    const files = readdirSync(dir).filter(
      (f) => f.endsWith(".auth-pending") || f.endsWith(".auth-pending.device")
    );
    if (!files.some((f) => f.endsWith(".auth-pending"))) return null;
    return files.map((f) => `${f}:${statSync(join5(dir, f)).mtimeMs}`).sort().join("|");
  } catch {
    return null;
  }
}
function codeWatch(dir, message) {
  const before = loginStamp(dir);
  const until = UNTIL.exec(message)?.[1];
  const end = until ? Date.parse(`${until.replace(" ", "T")}Z`) : NaN;
  return {
    moved: () => {
      const now2 = loginStamp(dir);
      if (now2 !== null && now2 !== before) return true;
      return now2 !== null && end <= Date.now();
    }
  };
}

// js/opencode/bridge-io.ts
var HANDSHAKE_MS = Number(process.env[envName("MCP_HANDSHAKE_MS")] || 6e5);
var AUTH_POLL_MS = Number(process.env[envName("MCP_AUTH_POLL_MS")] || 2e3);
var retryPause = (n2) => Math.min(AUTH_POLL_MS * 2 ** n2, 6e4);
var AUTH_PENDING = /authorization required/i;
var PROTOCOL = "2025-06-18";
function findBridge() {
  const tried = [];
  const env = process.env[envName("BRIDGE_PATH")]?.trim();
  if (env) tried.push(resolve3(env));
  tried.push(homeBridgePath());
  for (const candidate of tried) {
    try {
      accessSync(candidate, constants.R_OK);
      return { path: candidate, tried };
    } catch {
    }
  }
  return { path: null, tried };
}
function buildsLine(bridgePath, pluginUrl) {
  const W4 = words(OPENCODE);
  return W4.builds(buildOfFile(bridgePath) ?? W4.unreadable(), buildOf(pluginUrl));
}
function authDir() {
  return process.env[envName("BRIDGE_AUTH_DIR")] || join6(homedir4(), HOME_DIR);
}
function cachePath() {
  return join6(authDir(), "opencode-tools.json");
}
function grantStamp() {
  const dir = authDir();
  try {
    return readdirSync2(dir).filter((f) => f.endsWith(".json") && f !== "opencode-tools.json").map((f) => `${f}:${statSync2(join6(dir, f)).mtimeMs}`).sort().join("|");
  } catch {
    return "";
  }
}
var sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function readCache() {
  try {
    const list = JSON.parse(readFileSync4(cachePath(), "utf8"));
    return Array.isArray(list) && list.length ? list : null;
  } catch {
    return null;
  }
}
function writeCache(tools) {
  try {
    mkdirSync(join6(cachePath(), ".."), { recursive: true, mode: 448 });
    writeFileSync(cachePath(), JSON.stringify(tools), { mode: 384 });
  } catch {
  }
}
function loginUrlOf(message) {
  return /open in a browser: (\S+)/.exec(message)?.[1] ?? null;
}
async function handshake(b, onLogin, onReady) {
  const deadline = Date.now() + HANDSHAKE_MS;
  for (; ; ) {
    const stamp = grantStamp();
    try {
      await b.request(
        "initialize",
        {
          protocolVersion: PROTOCOL,
          // answer fields — for this client too (#6637); the stop's interrupt is confirmed (#7519)
          capabilities: {
            experimental: { ...FIELDS_CAPABILITIES.experimental, [HALTS_CAPABILITY]: {} }
          },
          clientInfo: { name: OPENCODE_CLIENT, version: "1" }
        },
        { timeoutMs: Math.max(1, deadline - Date.now()) }
      );
      break;
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      if (!AUTH_PENDING.test(message)) throw e;
      onLogin(loginUrlOf(message), deviceOf(message));
      const code2 = codeWatch(authDir(), message);
      while (grantStamp() === stamp) {
        if (Date.now() + AUTH_POLL_MS > deadline) throw e;
        await sleep(AUTH_POLL_MS);
        if (code2.moved()) break;
      }
    }
  }
  onReady();
  b.notify("notifications/initialized");
}
function slotReady(login) {
  const shake = (slot) => {
    slot.ready = handshake(slot.bridge, login.on, login.done);
    slot.ready.catch(() => {
    });
  };
  const readyFor = async (slot) => {
    try {
      await slot.ready;
    } catch {
      shake(slot);
      await slot.ready;
    }
  };
  return { shake, readyFor };
}
async function listTools(b) {
  const tools = [];
  let cursor;
  do {
    const page = await b.request("tools/list", cursor ? { cursor } : {}, {
      timeoutMs: HANDSHAKE_MS
    });
    for (const t of page?.tools ?? []) tools.push(t);
    cursor = page?.nextCursor;
  } while (cursor);
  return tools;
}
function textOf2(result) {
  return resultToContent(result).map((c) => c.type === "text" ? c.text : "[image]").join("\n");
}
async function refreshToolList(b, state2, reload, say, live) {
  try {
    const list = await listTools(b);
    if (!live() || JSON.stringify(list) === JSON.stringify(state2.listed)) return;
    state2.listed = list;
    state2.source = words(OPENCODE).fromServer();
    writeCache(list);
    await reload();
    say(words(OPENCODE).serverChanged(list.length), "info");
  } catch (e) {
    if (!live()) return;
    say(words(PLUGIN).relistFailed(e.message), "warning");
  }
}

// js/shared/seen.ts
var evOf = (v) => typeof v === "number" || typeof v === "string" && v ? `ev:${v}` : "";
function eventKeyOf(frame) {
  const via2 = frame?.provenance?.via;
  if (via2 === "room") return evOf(frame?.event_id);
  if (via2 !== "graph") return "";
  const body = frame?.body;
  if (!body || typeof body !== "object" || Array.isArray(body)) return "";
  return evOf(body.event_id);
}
var asText = (frame) => addressedToMine(frame);
function deliveryKeys(frame, named = false) {
  const id = typeof frame?.id === "string" ? frame.id : "";
  const ev = frame && asText(frame) ? eventKeyOf(frame) : "";
  const mark = ev && frame?.stale === true ? `evs:${ev.slice(3)}` : ev;
  return [id, mark && (named ? `c${mark}` : mark)].filter(Boolean);
}
function eventIn(frame, has) {
  const ev = frame ? eventKeyOf(frame) : "";
  if (!ev || !frame) return false;
  const n2 = ev.slice(3);
  const stale = frame.stale === true;
  const keys = !asText(frame) ? [ev, `evs:${n2}`] : stale ? [ev, `evs:${n2}`, `cev:${n2}`, `cevs:${n2}`] : [ev, `cev:${n2}`];
  return keys.some(has);
}
var isTact = (frame) => frame?.provenance?.wake === "look_up";
var tactAt = (frames) => (frames ?? []).filter(isTact).map((f) => typeof f.received_at === "string" ? f.received_at : "").reduce((a, b) => b > a ? b : a, "");
var onlyTacts = (frames) => !!frames?.length && frames.every(isTact);

// js/bridge/build.ts
var BUILD = buildOf(import.meta.url);

// js/bridge/streams.ts
var out = scoped(() => ({ stream: null }));

// js/bridge/config.ts
var PRODUCTION_URLS = new Set(LANGS.map((l) => strip(SERVER_URLS[l])));
function strip(url) {
  return url.replace(/\/+$/, "");
}
var cfgSlot = scoped(() => ({ cfg: null }));
var CFG = new Proxy({}, {
  get: (_, k) => cfgSlot.cfg ? Reflect.get(cfgSlot.cfg, k) : void 0,
  has: (_, k) => !!cfgSlot.cfg && Reflect.has(cfgSlot.cfg, k)
});

// js/bridge/oauth/discovery.ts
var REGISTRATION_REUSE_MS = 45 * 6e4;

// js/bridge/oauth/pacing.ts
var pauses = (v, fallback) => (v || fallback).split(",").map(Number).filter((n2) => Number.isFinite(n2) && n2 >= 0);
var DEAD_RECHECK_MS = pauses(process.env[envName("BRIDGE_DEAD_RECHECK_MS")], "1000,2000");
var IN_CALL_WAIT_MS = Number(process.env[envName("BRIDGE_IN_CALL_WAIT_MS")]) || 1e4;
var ORPHAN_FLOW_MS = Number(process.env[envName("BRIDGE_ORPHAN_FLOW_MS")]) || 5 * 6e4;

// js/bridge/oauth/device.ts
var SLOW_DOWN_MS = Number(process.env[envName("BRIDGE_DEVICE_SLOW_DOWN_MS")]) || 5e3;
var REISSUE_PAUSE_MS = Number(process.env[envName("BRIDGE_DEVICE_REISSUE_MS")]) || 3e4;
var never = new Promise(() => {
});

// js/bridge/oauth/flow.ts
var CLAIM_WAIT_MS = Number(process.env[envName("BRIDGE_CLAIM_WAIT_MS")]) || 15e3;
var LANDED_POLL_MS = Number(process.env[envName("BRIDGE_LANDED_POLL_MS")]) || 2e3;
var RELEASE_GAP_MS = Number(process.env[envName("BRIDGE_RELEASE_GAP_MS")]) || 0;

// js/bridge/repeat.ts
var OWN_CALL_PREFIX = `${ID_PREFIX}bridge-call-`;
var READ_TOOLS = new Set(["look", "orient", "search", "semantic_search"].map(tool));
var SAFE_ACTIONS = {
  [tool("channel")]: /* @__PURE__ */ new Set(["list"]),
  [tool("realm")]: /* @__PURE__ */ new Set(["list"])
};

// js/bridge/toolsync.ts
var T2 = scoped(() => ({
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

// js/shared/satname.ts
var NAME_MAX = 48;
var SUB_RE = /\.sub-([1-9]\d*)$/;
var satelliteName = (base, n2) => base.slice(0, NAME_MAX - `.sub-${n2}`.length).replace(/[-._]+$/, "") + `.sub-${n2}`;
function isSatelliteOf(base, name) {
  const m = SUB_RE.exec(name);
  return !!m && satelliteName(base, Number(m[1])) === name;
}

// js/shared/seat.ts
var normKarta = (k) => String(k ?? "").trim().replace(/^#/, "");
function sameSeat(a, b) {
  const realm = String(a.realm ?? "").trim();
  const name = String(a.name ?? "").trim();
  return realm.startsWith("@") && realm === String(b.realm ?? "").trim() && normKarta(a.karta) === normKarta(b.karta) && !!name && name === String(b.name ?? "").trim();
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
var reinit = scoped(() => ({ inFlight: null }));

// js/bridge/backlog.ts
var BACKLOG_MS = Number(process.env[envName("BRIDGE_BACKLOG_MS")]) || 1500;

// js/bridge/roomstack.ts
var ROOM_BATCH_MS = Number(process.env[envName("BRIDGE_ROOM_BATCH_MS")]) || 6e4;

// js/bridge/holdrecord.ts
var HOLD_RECORD_MAX_AGE_MS = 6 * 60 * 60 * 1e3;
var S2 = scoped(() => /* @__PURE__ */ new Map());
var H = scoped(() => ({ session: null }));
var B = scoped(() => /* @__PURE__ */ new Map());

// js/bridge/sweep.ts
var SEEN_FILE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1e3;

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

// js/bridge/realms.ts
var aliases = scoped(() => /* @__PURE__ */ new Map());
var R = scoped(() => ({ listing: null }));

// js/bridge/places.ts
var extras = scoped(() => /* @__PURE__ */ new Map());

// js/bridge/spool.ts
var HANDOFF_MS = Number(process.env[envName("BRIDGE_DAEMON_HANDOFF_MS")]) || 12e3;
var DRAIN_MS = HANDOFF_MS + 5e3;

// js/bridge/seatorigin.ts
import { AsyncLocalStorage as AsyncLocalStorage2 } from "node:async_hooks";
var origin = new AsyncLocalStorage2();

// js/opencode/halts.ts
import { createHash as createHash3, randomUUID } from "node:crypto";
import { mkdirSync as mkdirSync2, readFileSync as readFileSync5, unlinkSync, writeFileSync as writeFileSync2 } from "node:fs";
import { join as join7 } from "node:path";
var PREFIX = "opencode-stopped";
var fileOf = (dir, session) => join7(dir, `${PREFIX}.${createHash3("sha256").update(session).digest("hex").slice(0, 16)}.json`);
var stops = () => globalThis[`${GLOBAL_PREFIX}Halts`] ??= /* @__PURE__ */ new Set();
var lifted = () => globalThis[`${GLOBAL_PREFIX}LiftedAt`] ??= /* @__PURE__ */ new Map();
var ids = () => globalThis[`${GLOBAL_PREFIX}StopIds`] ??= /* @__PURE__ */ new Map();
var words2 = () => globalThis[`${GLOBAL_PREFIX}StopWords`] ??= /* @__PURE__ */ new Map();
var code = (e) => e.code;
function recorded(file, since) {
  try {
    const r = JSON.parse(readFileSync5(file, "utf8"));
    if (r.lifted || since !== void 0 && Date.parse(r.at ?? "") <= since) return null;
    return { id: r.id ?? r.at ?? "?", word: r.word };
  } catch (e) {
    return code(e) === "ENOENT" ? null : { id: "?" };
  }
}
function createHalts(parentOf2, dir, unwritten, unlifted) {
  const marked = (s) => stops().has(s) ? { id: ids().get(s) ?? "?", word: words2().get(s) } : recorded(fileOf(dir(), s), lifted().get(s));
  const drop2 = (s) => {
    stops().delete(s);
    ids().delete(s);
    words2().delete(s);
    lifted().set(s, Date.now());
    const file = fileOf(dir(), s);
    try {
      unlinkSync(file);
    } catch (e) {
      if (code(e) === "ENOENT") return;
      let kept2 = false;
      try {
        const record = JSON.stringify({ session: s, lifted: (/* @__PURE__ */ new Date()).toISOString() });
        writeFileSync2(file, record, { mode: 384 });
      } catch {
        kept2 = true;
      }
      unlifted(s, e.message, kept2);
    }
  };
  function stopOf(session) {
    const found = [];
    const seen = /* @__PURE__ */ new Set();
    for (let s = session; s && !seen.has(s); s = parentOf2(s)) {
      const m = marked(s);
      if (m) found.push(m.id);
      seen.add(s);
    }
    return found.length ? found.join(" ") : null;
  }
  return {
    stop(session, word2) {
      const id = randomUUID();
      stops().add(session);
      ids().set(session, id);
      words2().set(session, word2);
      lifted().delete(session);
      try {
        mkdirSync2(dir(), { recursive: true, mode: 448 });
        const record = JSON.stringify({ session, at: (/* @__PURE__ */ new Date()).toISOString(), id, word: word2 });
        writeFileSync2(fileOf(dir(), session), record, { mode: 384 });
      } catch (e) {
        unwritten(session, e.message);
      }
    },
    held: (session) => void (session && drop2(session)),
    gone: drop2,
    halted: (session) => stopOf(session) !== null,
    stopOf,
    wordOf(session, general) {
      const m = marked(session);
      return m ? m.word === void 0 ? general : m.word : null;
    }
  };
}
function descendantsOf(session, parents) {
  const all = [...parents];
  const found = [];
  const seen = /* @__PURE__ */ new Set([session]);
  for (let i = -1; i < found.length; i++) {
    const of = i < 0 ? session : found[i];
    for (const [child, parent] of all)
      if (parent === of && !seen.has(child)) {
        seen.add(child);
        found.push(child);
      }
  }
  return found;
}

// js/opencode/cutwait.ts
var outcomes = () => globalThis[`${GLOBAL_PREFIX}CutOutcomes`] ??= /* @__PURE__ */ new Map();
var waiters = () => globalThis[`${GLOBAL_PREFIX}CutWaiters`] ??= /* @__PURE__ */ new Map();
var lineages = () => globalThis[`${GLOBAL_PREFIX}Lineages`] ??= /* @__PURE__ */ new Set();
function wake(id) {
  const set = waiters().get(id);
  waiters().delete(id);
  for (const w of set ?? []) w();
}
function settle(id, gen, code2) {
  outcomes().set(id, [gen, code2]);
  wake(id);
}
function forget(id) {
  outcomes().delete(id);
  wake(id);
}
function outcomeOf(id, stopOf, signal) {
  const gen = stopOf(id);
  const o = outcomes().get(id);
  if (gen === null) return Promise.resolve(null);
  if (o?.[0] === gen) return Promise.resolve(o[1]);
  return new Promise((done) => {
    if (signal?.aborted) return;
    const set = waiters().get(id) ?? /* @__PURE__ */ new Set();
    const off = () => {
      const now2 = waiters().get(id);
      now2?.delete(w);
      if (now2?.size === 0) waiters().delete(id);
    };
    const w = () => {
      signal?.removeEventListener("abort", off);
      void outcomeOf(id, stopOf, signal).then(done);
    };
    signal?.addEventListener("abort", off, { once: true });
    set.add(w);
    waiters().set(id, set);
  });
}
function shareLineage(parents) {
  lineages().add(parents);
  return () => void lineages().delete(parents);
}
function processParent(session) {
  for (const m of lineages()) {
    const p = m.get(session);
    if (p !== void 0) return p;
  }
  return void 0;
}
var processDescendants = (session) => descendantsOf(
  session,
  [...lineages()].flatMap((m) => [...m])
);

// js/opencode/cuts.ts
var HALTED_MS = 1e4;
var ANSWER_CAP_MS = Number(process.env[envName("OPENCODE_HALT_CAP_MS")]) || 3e4;
function answerHalt(bridge, ev, outcome2) {
  const order = ev?.order;
  if (typeof order !== "string") return Promise.resolve();
  const capped = new AbortController();
  const answered = outcome2(capped.signal).then(
    (code2) => bridge?.request(
      method("halted"),
      { order, ok: code2 === null, ...code2 ? { code: code2 } : {} },
      { timeoutMs: HALTED_MS, service: true }
    ).then(
      () => {
      },
      () => {
      }
    )
  );
  let t;
  const cap = new Promise((done) => {
    t = setTimeout(done, ANSWER_CAP_MS);
    t.unref?.();
  });
  return Promise.race([answered, cap]).finally(() => {
    clearTimeout(t);
    capped.abort();
  });
}
var CUT_TRIES = 3;
var CUT_RETRY_MS = 500;
function createCuts(d) {
  const cutDone = /* @__PURE__ */ new Map();
  const cutting = /* @__PURE__ */ new Map();
  const cutFails = /* @__PURE__ */ new Map();
  const retries = /* @__PURE__ */ new Set();
  const waits = /* @__PURE__ */ new Set();
  function cut(id) {
    const gen = d.stopOf(id);
    if (gen === null || cutDone.get(id) === gen || cutting.get(id) === gen) return;
    d.dropped(id);
    if (cutting.has(id)) return;
    const settle2 = (code2) => {
      cutDone.set(id, gen);
      settle(id, gen, code2);
    };
    if (!d.canInterrupt()) return settle2("interrupt_missing");
    cutting.set(id, gen);
    void Promise.resolve().then(() => d.interrupt(id)).then(
      () => {
        if (d.stopOf(id) !== gen) return;
        settle2(null);
        cutFails.delete(id);
      },
      (e) => {
        if (d.stopOf(id) !== gen) return;
        const was = cutFails.get(id);
        const n2 = (was?.[0] === gen ? was[1] : 0) + 1;
        cutFails.set(id, [gen, n2]);
        d.refused(id, e.message, n2 >= CUT_TRIES);
        if (n2 >= CUT_TRIES) return settle2("interrupt_refused");
        const t = setTimeout(() => {
          retries.delete(t);
          if (d.halted(id)) cut(id);
        }, CUT_RETRY_MS);
        t.unref?.();
        retries.add(t);
      }
    ).finally(() => {
      cutting.delete(id);
      if (d.stopOf(id) !== gen) cut(id);
    });
  }
  return {
    cut,
    /**
     * The first refusal among the sessions' cuts, whoever cuts them, once all ended; null — all
     * cut. `ids` is read again once the known ones answered: a session it names anew (a child
     * born during the wait) is waited for too, until the set stands still. `signal` or this
     * instance's stop drops the wait.
     */
    async outcome(ids2, signal) {
      const own = new AbortController();
      const off = () => {
        waits.delete(own);
        own.abort();
      };
      waits.add(own);
      signal?.addEventListener("abort", off, { once: true });
      if (signal?.aborted) off();
      try {
        const asked = /* @__PURE__ */ new Set();
        let first = null;
        for (let next = ids2(); next.length; next = ids2().filter((id) => !asked.has(id))) {
          for (const id of next) asked.add(id);
          const all = await Promise.all(next.map((id) => outcomeOf(id, d.stopOf, own.signal)));
          first ??= all.find((c) => c !== null) ?? null;
        }
        return first;
      } finally {
        waits.delete(own);
        signal?.removeEventListener("abort", off);
      }
    },
    /** The session is gone or stands again: its marks go, whoever waits reads it anew. */
    forget(id) {
      cutDone.delete(id);
      cutFails.delete(id);
      forget(id);
    },
    stop() {
      for (const t of retries) clearTimeout(t);
      retries.clear();
      for (const w of waits) w.abort();
      waits.clear();
    }
  };
}

// js/opencode/leadframes.ts
var NO_LEADS = { ended: () => false, launcherOf: () => null };
function launcherSeat(up, slots, satelliteOf) {
  if (!up) return null;
  const parent = slots.get(up.id);
  if (parent?.child) return parent.place?.name ?? null;
  return up.root ? satelliteOf ?? null : null;
}
function fromLauncher(frame, launcher) {
  if (!launcher || !addressedToMine(frame) || roomKind(frame)?.phase) return false;
  const f = frame;
  const by = String(
    f.provenance?.from_standing ?? f.line?.author?.standing ?? ""
  );
  return by === launcher || by.endsWith(`:${launcher}`);
}

// js/opencode/marker.ts
import { createHash as createHash4 } from "node:crypto";
import { mkdirSync as mkdirSync3, readdirSync as readdirSync3, readFileSync as readFileSync7, statSync as statSync3, unlinkSync as unlinkSync2, writeFileSync as writeFileSync3 } from "node:fs";
import { join as join8 } from "node:path";

// js/opencode/procstart.ts
import { execFileSync } from "node:child_process";
import { readFileSync as readFileSync6 } from "node:fs";
var CLK_TCK = 100;
function linuxStart(pid) {
  const stat = readFileSync6(`/proc/${pid}/stat`, "utf8");
  const fields = stat.slice(stat.lastIndexOf(")") + 2).split(" ");
  const ticks = Number(fields[19]);
  const btime = Number(/^btime (\d+)$/m.exec(readFileSync6("/proc/stat", "utf8"))?.[1]);
  return Number.isFinite(ticks) && btime ? (btime + ticks / CLK_TCK) * 1e3 : null;
}
function psStart(pid) {
  const out2 = execFileSync("ps", ["-o", "lstart=", "-p", String(pid)], {
    encoding: "utf8",
    env: { ...process.env, LC_ALL: "C" },
    stdio: ["ignore", "pipe", "ignore"],
    timeout: 2e3
  }).trim();
  const at = Date.parse(out2);
  return Number.isNaN(at) ? null : at;
}
function processStart(pid) {
  try {
    return process.platform === "linux" ? linuxStart(pid) : psStart(pid);
  } catch {
    return null;
  }
}

// js/opencode/records.ts
var entryOf = (e) => ({
  session: e.session,
  dir: e.dir ?? null,
  key: e.key ?? null,
  child: !!e.child,
  ...typeof e.stoodAt === "number" ? { stoodAt: e.stoodAt } : {},
  ...e.moved ? { moved: true } : {},
  ...e.child ? {
    of: e.of ?? null,
    ...e.noted ? { noted: true } : {},
    ...e.name ? { name: e.name } : {},
    ...e.last ? { last: e.last } : {}
  } : {}
});

// js/opencode/marker.ts
var PREFIX2 = "opencode-lost";
var LEGACY_MS = 2 * 6e4;
var START_SLACK_MS = 1e3;
var hash = (s) => createHash4("sha256").update(s).digest("hex").slice(0, 12);
var tagOf = (home) => home ? hash(`${home.directory}\0${home.workspace ?? ""}`) : "any";
var tagIn = (f) => /^opencode-lost\.@([^.]+)\./.exec(f)?.[1] ?? null;
var otherLive = (f, path) => {
  const pid = Number(/\.(\d+)\.[^.]+\.json$/.exec(f)?.[1]);
  if (!pid || pid === process.pid) return false;
  const started = processStart(pid);
  if (started === null) return false;
  try {
    return started <= statSync3(path).mtimeMs + START_SLACK_MS;
  } catch {
    return false;
  }
};
function stoodAtOf(authDir2, key) {
  try {
    const at = JSON.parse(readFileSync7(holdFilePathOf(authDir2, key), "utf8"))?.stoodAt;
    return typeof at === "number" ? at : void 0;
  } catch {
    return void 0;
  }
}
function writeLostMarker(authDir2, slots, home) {
  const entries = [...slots].filter((s) => s.holding && s.session).map(
    (s) => entryOf({
      ...s,
      session: s.session,
      of: s.satelliteOf,
      name: s.place?.name,
      stoodAt: s.key ? stoodAtOf(authDir2, s.key) : void 0
    })
  );
  if (!entries.length) return [];
  try {
    mkdirSync3(authDir2, { recursive: true, mode: 448 });
    const lost = { at: (/* @__PURE__ */ new Date()).toISOString(), entries };
    const rand = Math.random().toString(36).slice(2, 8);
    const name = `${PREFIX2}.@${tagOf(home)}.${process.pid}.${rand}.json`;
    writeFileSync3(join8(authDir2, name), JSON.stringify(lost), { mode: 384 });
    return entries;
  } catch {
    return [];
  }
}
function markerWaits(authDir2, home) {
  try {
    return readdirSync3(authDir2).some(
      (f) => f.startsWith(`${PREFIX2}.@${tagOf(home)}.`) && !otherLive(f, join8(authDir2, f))
    );
  } catch {
    return false;
  }
}
function readOwn(path, tag, home) {
  const drop2 = () => {
    try {
      unlinkSync2(path);
    } catch {
    }
  };
  let lost = null;
  try {
    const text2 = readFileSync7(path, "utf8");
    if (tag !== null) drop2();
    lost = JSON.parse(text2);
  } catch {
  }
  if (tag === null && !(Date.now() - Date.parse(lost?.at ?? "") < LEGACY_MS)) drop2();
  if (!lost) return null;
  const mine = (e) => tag !== null || !home || !e.dir || e.dir === home.directory;
  return { at: lost.at, entries: (lost.entries ?? []).filter(mine) };
}
function takeLostMarker(authDir2, home) {
  const entries = [];
  let at = "";
  let files;
  try {
    files = readdirSync3(authDir2).filter((f) => f.startsWith(PREFIX2) && f.endsWith(".json"));
  } catch {
    return null;
  }
  const mine = tagOf(home);
  const read = [];
  for (const f of files) {
    const tag = tagIn(f);
    if (tag !== null && tag !== mine) continue;
    if (otherLive(f, join8(authDir2, f))) continue;
    const lost = readOwn(join8(authDir2, f), tag, home);
    if (lost) read.push({ tagged: tag !== null, lost });
  }
  const eraOf = (e, lost) => e.stoodAt ?? (Date.parse(lost.at) || 0);
  const best = /* @__PURE__ */ new Map();
  for (const { tagged, lost } of read) {
    const stale = !(Date.now() - Date.parse(lost.at ?? "") < LEGACY_MS);
    for (const e of lost.entries ?? []) {
      if (!e?.session || e.moved && stale) continue;
      const era = eraOf(e, lost);
      const had = best.get(e.session);
      if (had && (Number(had.tagged) - Number(tagged) || had.era - era) >= 0) continue;
      best.set(e.session, { tagged, era, e, lost });
    }
  }
  for (const { e, lost } of best.values()) {
    if (lost.at > at) at = lost.at;
    entries.push(entryOf(e));
  }
  if (!entries.length) return null;
  const when = new Date(at);
  const hhmm = Number.isNaN(when.getTime()) ? at : when.toTimeString().slice(0, 5);
  const word2 = (of) => {
    const where = of.filter((e) => !e.child && !e.moved).map((e) => e.key ?? e.dir ?? e.session).join(", ");
    return where ? words(OPENCODE_KEEP).lostWord(hhmm, where) : null;
  };
  return {
    text: word2(entries),
    // the log gets all
    entries,
    wordFor: (s) => word2(entries.filter((e) => e.session === s))
  };
}

// js/opencode/adopt.ts
function createAdopt(d) {
  const moved = /* @__PURE__ */ new Map();
  function take(entries) {
    d.keeper.hint(entries);
    for (const e of entries) {
      if (!e.child || !e.session) continue;
      if (!e.moved) void d.back(e);
      else {
        if (e.name) moved.set(e.name, e.session);
        d.endKid(e.session, e.of ?? null, words(OPENCODE_KEEP).movedWhy(e.name ?? ""));
      }
    }
  }
  return {
    take,
    /**
     * A marker laid after this instance loaded — take it: a session moved here into a live
     * instance, or a previous one's stop that ended after our load.
     */
    now() {
      const lost = takeLostMarker(d.authDir(), d.home);
      if (!lost) return;
      take(lost.entries);
      void d.keeper.resumeLost(lost.entries, lost.wordFor);
    },
    /** A revoke of a child ended by the parent's move: the plugin's answer instead of a call. */
    revoked(name, args) {
      const s = String(args.standing ?? "").trim();
      if (name !== tool("channel") || args.action !== "revoke" || !s) return null;
      for (const n2 of moved.keys())
        if (s === n2 || s.endsWith(`:${n2}`)) return words(OPENCODE_KEEP).revokedMoved(n2);
      return null;
    }
  };
}

// js/opencode/leadwords.ts
var SUMMARY_MAX = 4e3;
var W3 = () => words(LEAD);
var shown = (last) => last.length > SUMMARY_MAX ? `${last.slice(0, SUMMARY_MAX)}${W3().cut(SUMMARY_MAX, last.length)}` : last;
var endWord = (who, why, last, kept2) => W3().end(who, why, kept2 ? W3().endKept(who, kept2) : W3().endPlain(), shown(last));
var unrevokedWord = (who, failed) => failed === null ? W3().unrevokedUnknown(who) : W3().unrevoked(who, failed.join(", "), String(failed[0]));
var awayWord = (who, last) => W3().away(who, shown(last));

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

// js/opencode/twins.ts
var WAKE_MS = Number(process.env[envName("WAKE_MS")]) || 15e3;
var PAUSE_MS = Math.min(1e3, WAKE_MS / 5);
var registry = () => globalThis[`${GLOBAL_PREFIX}Twins`] ??= /* @__PURE__ */ new Set();
var handing = () => globalThis[`${GLOBAL_PREFIX}Handing`] ??= /* @__PURE__ */ new Map();
function handOver(session, p) {
  handing().set(session, p);
  void p.finally(() => handing().get(session) === p && handing().delete(session));
}
var handedOver = (session) => handing().get(session);
function adoptIn(to) {
  for (const t of registry()) if (t.home && sameSpelling(t.home, to)) t.adopt();
}
function sweepAll() {
  for (const t of registry()) t.sweep();
}
function heldInProcess(root) {
  for (const t of registry()) {
    const s = t.holds(root);
    if (s) return s;
  }
  return null;
}
var folderOf = (h) => `${canonDir(h.directory)}\0${h.workspace ?? ""}`;
var sameSpelling = (a, b) => a.directory === b.directory && (a.workspace ?? null) === (b.workspace ?? null);
var sleep3 = (ms) => new Promise((r) => setTimeout(r, ms));
function createTwins(ctx, home, d) {
  const W4 = words(OPENCODE_KEEP);
  let gone = false;
  const me = {
    home,
    wake: (h, e) => void wake2(h, e),
    holds: (r) => d.holds(r),
    adopt: () => d.adopt(),
    sweep: () => d.sweep()
  };
  registry().add(me);
  async function wake2(h, entries) {
    const roots = entries.filter((e) => !e.child && !e.moved && e.session);
    await sleep3(PAUSE_MS);
    if (gone || !roots.length) return;
    const up = [...registry()].some((t) => t.home && sameSpelling(t.home, h));
    if (up || !markerWaits(authDir(), h)) return;
    let why = "";
    for (const e of roots) {
      try {
        const args = { sessionID: e.session, directory: h.directory, delivery: "queue" };
        await ctx.session.move(args);
        why = "";
        break;
      } catch (err) {
        why = err.message;
      }
    }
    if (!why) {
      await sleep3(WAKE_MS);
      if (!markerWaits(authDir(), h)) {
        d.say(W4.twinUp(h.directory), "info");
        return;
      }
      why = W4.markerUntaken(Math.round(WAKE_MS / 1e3));
    }
    if (gone) return;
    const named = roots.map((e) => e.key ?? e.session).join(", ");
    d.say(W4.unloaded(h.directory, named, why), "error");
    for (const e of roots)
      d.lost(e.session, W4.seatLost(e.key ?? W4.thisSession(), h.directory, why));
  }
  return {
    /** The instance stops — out of the registry, nobody to wake it and no need. */
    leave() {
      gone = true;
      registry().delete(me);
    },
    /** A stop with seats entries (the marker landed): a live twin wakes this spelling. */
    left(entries) {
      if (!home || !entries.length) return;
      const live = [...registry()].filter((t) => t.home);
      if (live.some((t) => sameSpelling(t.home, home))) return;
      live.find((t) => folderOf(t.home) === folderOf(home))?.wake(home, entries);
    }
  };
}

// js/opencode/children.ts
var BACK_MS = Number(process.env[envName("CHILD_BACK_MS")]) || 15e3;
var BACK_TRIES = 4;
var BACK_PAUSE_MS = Number(process.env[envName("CHILD_BACK_PAUSE_MS")]) || 1e3;
var PAUSE_MS2 = 1500;
function createChildren(d) {
  const coming = /* @__PURE__ */ new Map();
  function childSlot(sessionID, parent, back2) {
    const have = d.slots.get(sessionID);
    if (have && !have.bridge.failure) return have;
    const was = have ?? (back2 && { satelliteOf: back2.of, dir: back2.dir, key: back2.key, stood: true });
    const of = was?.satelliteOf ?? parent?.place ?? null;
    const own = d.spawn(of ? ["--satellite"] : []);
    own.satelliteOf = of;
    own.session = sessionID;
    own.child = true;
    own.dir = was?.dir ?? null;
    own.key = was?.key ?? null;
    d.slots.set(sessionID, own);
    if (was?.stood && own.key)
      own.resume = d.keeper.resume(own, sessionID, !!back2, back2 ? BACK_MS : void 0).finally(() => own.resume = null);
    return own;
  }
  async function back(e) {
    if (!e.of) return d.endRun(e.session, false);
    d.leads.back(e.session, e);
    const ready = (async () => {
      if (!await d.exists(e.session))
        return void await d.leads.fail(e.session, W3().reloadUnreadable());
      if (!e.key) return void await d.leads.fail(e.session, W3().reloadNoKey());
      return childSlot(e.session, null, e);
    })();
    coming.set(e.session, ready);
    const own = await ready.finally(() => coming.delete(e.session));
    if (!own) return;
    for (let i = 0; i < BACK_TRIES && !own.holding; i++) {
      if (i) {
        await sleep(BACK_PAUSE_MS);
        own.resume = d.keeper.resume(own, e.session, true, BACK_MS).finally(() => own.resume = null);
      }
      if (await own.resume === "elsewhere") break;
    }
    if (!own.holding)
      await d.leads.fail(
        e.session,
        own.refused?.length ? W3().reloadStale(own.refused.join(", ")) : W3().reloadNotBack()
      );
  }
  async function pause2() {
    const held = [...d.slots.values()].filter(
      (s) => s.child && s.satelliteOf && s.holding && s.session
    );
    for (const s of held) {
      const was = d.leads.snapshot(s.session);
      [s.noted, s.last] = [was.noted, was.last];
    }
    await Promise.all(
      held.map(
        (s) => s.bridge.request(method("suspend"), {}, { timeoutMs: PAUSE_MS2, service: true }).catch(() => {
        })
      )
    );
  }
  const settled = async (session) => {
    await handedOver(session);
    return coming.get(session)?.catch(() => {
    });
  };
  return { childSlot, back, pause: pause2, settled };
}

// js/opencode/half.ts
var idleHalf = () => ({
  forget() {
  },
  onEvent() {
  },
  launch: async () => null,
  seatRoot: async () => ({ error: words(ROOT_SEAT).noBridge() }),
  cancelSeat() {
  },
  releaseSeat: async () => {
  },
  finishSeat() {
  },
  stop() {
  },
  bridgeOf: () => null,
  leadOf: () => null,
  ended: () => false,
  launcherOf: () => null,
  holders: () => [],
  owns: () => false,
  held: () => null,
  adopt() {
  },
  moved() {
  },
  children: () => [],
  halt() {
  }
});

// js/opencode/handoff.ts
var createHandoff = (d) => (session, to, home) => {
  const s = d.slots.get(session);
  if (!s?.child || !s.satelliteOf || !s.holding) return false;
  if (!home || !to?.directory || to.directory === home.directory) return false;
  const was = d.leads.handoff(session);
  [s.noted, s.last] = [was.noted, was.last];
  handOver(
    session,
    s.bridge.request(method("suspend"), {}, { timeoutMs: PAUSE_MS2, service: true }).catch(() => {
    }).then(() => {
      writeLostMarker(authDir(), [s], to);
      d.forget(session);
      adoptIn(to);
    })
  );
  return true;
};

// js/opencode/skillread.ts
import { existsSync as existsSync2, lstatSync, readdirSync as readdirSync4, realpathSync as realpathSync3 } from "node:fs";
import { homedir as homedir6 } from "node:os";
import { basename as basename3, dirname as dirname2, isAbsolute, join as join10, relative, resolve as resolve5 } from "node:path";

// js/shared/skilllock.ts
import { existsSync, readFileSync as readFileSync8, realpathSync as realpathSync2 } from "node:fs";
import { homedir as homedir5 } from "node:os";
import { basename as basename2, dirname, join as join9, resolve as resolve4 } from "node:path";
var canon = (p) => {
  try {
    return realpathSync2(p);
  } catch {
    return resolve4(p);
  }
};
function lockPlaces(root, stateHome = process.env.XDG_STATE_HOME) {
  const places = [];
  if (stateHome && canon(root) === canon(join9(homedir5(), ".agents", "skills")))
    places.push(join9(stateHome, "skills", ".skill-lock.json"));
  places.push(join9(dirname(root), ".skill-lock.json"));
  if (basename2(root) === "skills" && basename2(dirname(root)) === ".agents")
    places.push(join9(dirname(dirname(root)), "skills-lock.json"));
  return places;
}
var hasSkillLock = (root, stateHome = process.env.XDG_STATE_HOME) => lockPlaces(root, stateHome).some((p) => existsSync(p));
function skillLock(root, stateHome = process.env.XDG_STATE_HOME) {
  const place = lockPlaces(root, stateHome).find((p) => existsSync(p));
  if (!place) return null;
  try {
    const lock = JSON.parse(readFileSync8(place, "utf8"));
    return lock.skills ?? {};
  } catch {
    return null;
  }
}

// js/opencode/skillread.ts
var READERS = /* @__PURE__ */ new Set(["read", "glob", "grep"]);
var CALLS = 256;
var WALK = 4096;
var canon2 = (p) => {
  try {
    return realpathSync3(p);
  } catch {
    return null;
  }
};
var absent = (p) => {
  try {
    return lstatSync(p, { throwIfNoEntry: false }) === void 0;
  } catch {
    return false;
  }
};
function canonReach(p) {
  const tail2 = [];
  let at = p;
  for (; ; ) {
    const c = canon2(at);
    if (c) return tail2.length ? join10(c, ...tail2.reverse()) : c;
    if (!absent(at)) return null;
    const name = basename3(at);
    const up = dirname2(at);
    if (up === at || name === "." || name === "..") return null;
    tail2.push(name);
    at = up;
  }
}
function resourceDir(resource) {
  const dir = resource.replace(/[\\/]\*$/, "");
  return /[*?[\]{}]/.test(dir) ? null : dir;
}
function within(p, root) {
  const rel = relative(root, p);
  return rel === "" || !rel.startsWith("..") && !isAbsolute(rel);
}
function bridgeRoot(s) {
  const path = typeof s?.path === "string" ? s.path : null;
  if (s?.id !== BRIDGE_SKILL || !path || !isAbsolute(path)) return null;
  const dir = dirname2(path);
  if (basename3(dir) !== BRIDGE_SKILL || !existsSync2(join10(dir, "scripts", BRIDGE_FILE))) return null;
  return dirname2(dir);
}
async function skillDirs(ctx) {
  const res = await ctx.skill.list();
  const list = Array.isArray(res) ? res : res?.data ?? [];
  const listed = [];
  for (const s of list) {
    const path = typeof s?.path === "string" ? s.path : null;
    if (!path || !isAbsolute(path)) continue;
    const dir = canon2(dirname2(path));
    const id = String(s?.id ?? "");
    if (dir && basename3(dir) === id) listed.push({ id, dir });
  }
  const sets = /* @__PURE__ */ new Map();
  const lockless = /* @__PURE__ */ new Set();
  for (const s of list) {
    const root = bridgeRoot(s);
    const c = root ? canon2(root) : null;
    if (!c) continue;
    sets.set(c, skillLock(c));
    if (!hasSkillLock(c)) lockless.add(c);
  }
  return listed.filter(({ id, dir }) => {
    const lock = sets.get(dirname2(dir));
    if (!lock) return id === BRIDGE_SKILL && lockless.has(dirname2(dir));
    const source = lock[BRIDGE_SKILL]?.source;
    return typeof source === "string" && lock[id]?.source === source;
  }).map(({ dir }) => dir);
}
function leadsOut(dir) {
  const stack = [dir];
  let seen = 0;
  while (stack.length) {
    const d = stack.pop();
    let entries;
    try {
      entries = readdirSync4(d, { withFileTypes: true });
    } catch {
      return true;
    }
    for (const e of entries) {
      if (++seen > WALK) return true;
      const p = join10(d, e.name);
      if (e.isSymbolicLink()) {
        const c = canon2(p);
        if (!c || !within(c, dir)) return true;
      } else if (e.isDirectory()) stack.push(p);
    }
  }
  return false;
}
function absolute(p, base) {
  if (p === "~" || p.startsWith("~/")) return join10(homedir6(), p.slice(1));
  if (isAbsolute(p)) return p;
  return base ? resolve5(base, p) : null;
}
var dotted = (p) => p.split(/[\\/]/).some((s) => s === "." || s === "..");
function reached(call, resources, base) {
  const out2 = [];
  for (const r of resources) {
    const dir = resourceDir(String(r));
    if (!dir || dotted(dir)) return null;
    out2.push(dir);
  }
  const input = call.input ?? {};
  for (const key of ["path", "filePath"]) {
    const p = input[key];
    if (p === void 0) continue;
    const abs = typeof p === "string" && !(isAbsolute(p) && dotted(p)) ? absolute(p, base) : null;
    if (!abs) return null;
    out2.push(abs);
  }
  for (const key of ["pattern", "include"]) {
    if (call.tool === "grep" && key === "pattern") continue;
    const pat = input[key];
    if (pat === void 0) continue;
    if (typeof pat !== "string" || isAbsolute(pat) || pat.startsWith("~") || pat.includes(".."))
      return null;
  }
  return out2.length ? out2 : null;
}
async function setupSkillReads(ctx) {
  const { permission, tool: tool2 } = ctx;
  if (typeof permission?.hook !== "function" || typeof tool2?.hook !== "function") return false;
  const calls = /* @__PURE__ */ new Map();
  await tool2.hook("execute.before", (t) => {
    if (typeof t?.id !== "string" || typeof t?.tool !== "string") return;
    const was = calls.get(t.id);
    const clash = was && (was.tool !== t.tool || was.session !== t.sessionID);
    const input = READERS.has(t.tool) ? t.input : void 0;
    calls.set(t.id, { tool: clash ? "" : t.tool, input, session: t.sessionID });
    while (calls.size > CALLS) calls.delete(calls.keys().next().value);
  });
  const loc = ctx.location;
  const base = typeof loc?.directory === "string" && loc.directory ? loc.directory : null;
  const lifts = async (e) => {
    if (e?.action !== "external_directory" || e.effect !== "ask") return false;
    const id = e.source?.type === "tool" ? e.source.id : null;
    const call = typeof id === "string" ? calls.get(id) : void 0;
    if (!call || !READERS.has(call.tool) || typeof e.sessionID !== "string") return false;
    if (e.sessionID !== call.session) return false;
    const paths = reached(call, Array.isArray(e.resources) ? e.resources : [], base);
    if (!paths) return false;
    const roots = await skillDirs(ctx);
    const walked = /* @__PURE__ */ new Set();
    for (const p of paths) {
      const c = canonReach(p);
      const root = c ? roots.find((r) => within(c, r)) : void 0;
      if (!root) return false;
      walked.add(root);
    }
    return call.tool === "read" || ![...walked].some(leadsOut);
  };
  await permission.hook("evaluate", async (e) => {
    try {
      if (await lifts(e)) e.effect = "allow";
    } catch {
    }
  });
  return true;
}

// js/opencode/host.ts
async function hostEnvOf(ctx) {
  const env = {};
  const v = ctx.app?.version;
  if (typeof v === "string" && v.trim()) env[HARNESS_VERSION_ENV] = v.trim();
  try {
    const res = await ctx.skill.list();
    const list = Array.isArray(res) ? res : res?.data ?? [];
    const root = list.map(bridgeRoot).find((r) => r !== null);
    if (root) env[SKILLS_ROOT_ENV] = root;
  } catch {
  }
  return env;
}
function homeOf(ctx) {
  const loc = ctx.location;
  if (typeof loc?.directory !== "string" || !loc.directory) return null;
  const workspace = typeof loc.workspaceID === "string" ? loc.workspaceID : null;
  return { directory: loc.directory, workspace };
}
async function sessionDirectory(ctx, sessionID) {
  try {
    const res = await ctx.session.get({ sessionID });
    const dir = res?.location?.directory ?? res?.data?.location?.directory;
    return typeof dir === "string" && dir.trim() ? dir : null;
  } catch {
    return null;
  }
}

// js/opencode/keep.ts
var WATCH_MS = Number(process.env[envName("BRIDGE_WATCH_MS")] || 5 * 6e4);
var PATIENCE_MS = Number(process.env[envName("RESUME_PATIENCE_MS")] || 1e4);
var STEP_MS = 500;
function resumedWord(key, own = false) {
  return own ? words(OPENCODE_KEEP).resumedOwn(key) : words(OPENCODE_KEEP).resumed(key);
}
var elsewhereWord = (keys) => words(OPENCODE_KEEP).elsewhere(keys.join(", "));
function createKeeper(doors) {
  const W4 = words(OPENCODE_KEEP);
  const roots = /* @__PURE__ */ new Set();
  const hints = /* @__PURE__ */ new Map();
  const marked = /* @__PURE__ */ new Map();
  const retrying = /* @__PURE__ */ new Map();
  let stopped = false;
  function notBack(root, mark, why) {
    const place = mark.key ?? mark.dir ?? root;
    roots.add(root);
    retrying.set(root, place);
    doors.tell(root, W4.notBack(place, why));
  }
  function stoppedRoot(root, word2) {
    roots.delete(root);
    retrying.delete(root);
    doors.say(typeof word2 === "string" ? word2 : W4.noWhy(), "warning");
    return "none";
  }
  function selector(slot) {
    const session = slot.session ? { session: slot.session } : {};
    if (slot.child) return slot.key ? { key: slot.key, ...session } : session;
    const key = slot.key ?? (slot.session ? hints.get(slot.session) : void 0);
    return { ...key ? { key } : {}, ...slot.dir ? { cwd: slot.dir } : {}, ...session };
  }
  async function resume(slot, root, quiet = false, patience = PATIENCE_MS) {
    const until = Date.now() + patience;
    for (; ; ) {
      const final = Date.now() + STEP_MS > until;
      const r = await once(slot, root, quiet, final);
      if (r !== "elsewhere" || final || stopped) return r;
      await sleep(STEP_MS);
    }
  }
  async function once(slot, root, quiet, final) {
    const mark = slot.child ? void 0 : marked.get(root);
    try {
      await doors.ready(slot);
      slot.dir ??= mark?.dir ?? await doors.directoryOf(root);
      if (stopped) return "none";
      if (!slot.dir && !slot.key || slot.child && !slot.key) {
        marked.delete(root);
        if (mark) notBack(root, mark, W4.noKeyNoDir());
        return "none";
      }
      const r = await slot.bridge.request(method("resume"), selector(slot), {
        timeoutMs: 3e4
      });
      const elsewhere2 = Array.isArray(r?.elsewhere) && r.elsewhere.length ? r.elsewhere : null;
      if (slot.child && Array.isArray(r?.refused) && r.refused.length) slot.refused = r.refused;
      if (!r?.resumed && elsewhere2 && !final) return "elsewhere";
      marked.delete(root);
      if (r?.stopped) return stoppedRoot(root, r.word);
      if (!r?.resumed) {
        if (mark) notBack(root, mark, typeof r?.word === "string" ? r.word : W4.noAnswer());
        else if (elsewhere2) {
          if (!quiet) doors.tell(root, elsewhereWord(elsewhere2), slot.child);
        } else if (Array.isArray(r?.legacy) && r.legacy.length && typeof r.word === "string")
          doors.tell(root, W4.legacy(r.word), slot.child);
        return elsewhere2 ? "elsewhere" : "none";
      }
      slot.holding = true;
      slot.stood = true;
      slot.provisional = r.provisional === true;
      if (typeof r.key === "string") slot.key = r.key;
      roots.add(root);
      doors.say(W4.sessionResumed(root, r.word), "info");
      if (typeof r.key === "string" && !quiet)
        doors.tell(root, resumedWord(r.key, r.own === true), slot.child);
      return "held";
    } catch (e) {
      marked.delete(root);
      doors.say(W4.resumeFailed(root, e.message), "warning");
      if (mark && !stopped) notBack(root, mark, e.message);
      return "none";
    }
  }
  async function check(root) {
    const slot = await doors.slotFor(root, false);
    if (slot.resume) await slot.resume;
    if (!slot.dir) slot.dir = await doors.directoryOf(root);
    await doors.ready(slot);
    const r = await slot.bridge.request(method("check"), selector(slot), {
      timeoutMs: 3e4
    });
    if (typeof r?.key === "string") slot.key = r.key;
    slot.provisional = r?.provisional === true;
    if (r?.stopped) {
      slot.holding = false;
      return void stoppedRoot(root, r.word);
    }
    if (r?.holding) slot.holding = true;
    else if (r?.holding === false) {
      slot.holding = false;
      roots.delete(root);
      const place = retrying.get(root);
      if (place && !r?.resumed)
        doors.tell(root, W4.retryFailed(place, r?.word ?? W4.noWhy()), slot.child);
    }
    retrying.delete(root);
    if (r?.resumed) {
      doors.say(W4.watchResumed(root, r.word), "info");
      if (typeof r.key === "string")
        doors.tell(root, resumedWord(r.key, r.own === true), slot.child);
    } else if (r?.reopened) doors.say(W4.watchReopened(root, r.word), "warning");
    else if (r?.stuck) doors.say(r.word, "error");
  }
  const timer = setInterval(() => {
    if (stopped) return;
    for (const root of roots)
      void check(root).catch((e) => doors.say(W4.watchFailed(root, e.message), "warning"));
  }, WATCH_MS);
  timer.unref?.();
  return {
    hint(entries) {
      for (const e of entries) {
        if (!e.session || e.child) continue;
        if (e.key) hints.set(e.session, e.key);
        marked.set(e.session, e);
      }
    },
    async resumeLost(entries, wordFor) {
      const seen = /* @__PURE__ */ new Set();
      for (const e of entries) {
        if (stopped) break;
        if (e.child || !e.session || seen.has(e.session)) continue;
        seen.add(e.session);
        if (!await doors.exists(e.session)) continue;
        const word2 = wordFor(e.session);
        if (word2) doors.lost(e.session, word2);
        await doors.slotFor(e.session, false);
      }
    },
    resume,
    stood(slot) {
      slot.holding = true;
      slot.stood = true;
      if (slot.session) roots.add(slot.session);
    },
    forget(root) {
      roots.delete(root);
      retrying.delete(root);
    },
    stop() {
      stopped = true;
      clearInterval(timer);
    }
  };
}

// js/opencode/keepalive.ts
var EVERY_MS = (() => {
  const v = process.env[envName("KEEPALIVE_MS")];
  return v === void 0 || v === "" ? 50 * 6e4 : Number(v) || 0;
})();
var DURABLE = /^session\.(execution\.(started|succeeded|failed|interrupted)|(step|text|reasoning|compaction)\.(started|ended|failed)|tool\.(called|success|failed|input\.(started|ended))|shell\.(started|ended)|skill\.activated|instructions\.updated|message\.content\.updated|usage\.recorded|retry\.scheduled)$/;
var LEFTOVER_MAX = 20;
var keepaliveTitle = () => words(OPENCODE_KEEP).keepaliveTitle();
var holdersOf = (slots) => [...slots].filter((x) => x.holding && x.session).sort((a, b) => Number(!!a.child) - Number(!!b.child)).map((x) => x.session);
function createKeepAlive(ctx, d) {
  if (EVERY_MS <= 0) return { onEvent() {
  }, stop() {
  } };
  const W4 = words(OPENCODE_KEEP);
  const title = keepaliveTitle();
  let last = Date.now();
  let busy = false;
  const leftover = /* @__PURE__ */ new Set();
  let noRemoveSaid = false;
  let capSaid = false;
  async function removeOnce(id) {
    const fn = ctx.session.remove;
    if (typeof fn !== "function") {
      if (!noRemoveSaid) d.say(W4.noRemove(title), "error");
      noRemoveSaid = true;
      return false;
    }
    try {
      await fn.call(ctx.session, { sessionID: id });
      return true;
    } catch {
      return false;
    }
  }
  function remember(id) {
    leftover.add(id);
    if (leftover.size <= LEFTOVER_MAX) return;
    const oldest = leftover.values().next().value;
    leftover.delete(oldest);
    if (!capSaid) d.say(W4.cap(LEFTOVER_MAX, title), "error");
    capSaid = true;
  }
  async function touch(session) {
    let s;
    try {
      s = await ctx.session.create({ parentID: session, title });
    } catch (e) {
      d.say(W4.notCreated(e.message));
      return null;
    }
    const id = s?.id ?? s?.data?.id;
    if (typeof id === "string") return id;
    d.say(W4.noId(JSON.stringify(s ?? null).slice(0, 160), title), "error");
    return null;
  }
  async function tidy(fresh) {
    for (const id of [...leftover]) if (await removeOnce(id)) leftover.delete(id);
    if (!fresh) return;
    if (await removeOnce(fresh) || await removeOnce(fresh)) return;
    remember(fresh);
    if (!noRemoveSaid) d.say(W4.notRemoved(fresh));
  }
  async function tick() {
    let fresh = null;
    const held = Date.now() - last >= EVERY_MS ? d.holders() : [];
    if (held.length) {
      last = Date.now();
      fresh = await touch(held[0]);
    }
    await tidy(fresh);
  }
  const timer = setInterval(
    () => {
      if (busy) return;
      busy = true;
      void tick().catch((e) => d.say(W4.tickFailed(e.message))).finally(() => busy = false);
    },
    Math.max(50, Math.min(6e4, EVERY_MS / 5))
  );
  timer.unref?.();
  return {
    onEvent(ev) {
      const s = ev?.data?.sessionID;
      if (typeof s === "string" && ev?.location && DURABLE.test(String(ev?.type)) && d.owns(s))
        last = Date.now();
    },
    stop: () => clearInterval(timer)
  };
}

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

// js/opencode/satellite.ts
var STAND_TOOL2 = tool("stand");
function standsBy(name, args) {
  if (name === STAND_TOOL2) return true;
  return name === tool("channel") && ["connect", "mint", "register"].includes(String(args.action));
}
var busyOnly = (args) => typeof args.status === "string" && takingArgs(args).length === 0;
function ownPlace(slot) {
  const p = slot?.child ? slot.place : null;
  if (!p?.name) return null;
  const of = slot?.satelliteOf?.name;
  return of && isSatelliteOf(of, p.name) ? null : p.name;
}
function heldPlace(data) {
  const p = data?.place;
  if (typeof p?.name !== "string" || !p.name) return null;
  return { realm: String(p.realm), karta: String(p.karta), name: p.name };
}
function asSatellite(args, of, leads = false) {
  const busy = busyOnly(args);
  if (!of) return busy;
  args.satellite_of ??= of.name;
  if (!(leads && busy) && (args.karta == null || args.karta === "")) args.karta = of.karta;
  return busy;
}

// js/opencode/launch.ts
function createLauncher(d) {
  const prompted = /* @__PURE__ */ new Set();
  return {
    forget: (id) => void prompted.delete(id),
    async launch(sessionID, text2) {
      if (prompted.has(sessionID)) return null;
      prompted.add(sessionID);
      const l = parseLaunch(text2);
      if (!l) return null;
      const root = await d.rootOf(sessionID);
      if (root === sessionID) return null;
      let slot = null;
      return enterCase(
        l,
        (name, args) => d.call(slot ??= d.childSlot(sessionID, root), name, args, sessionID),
        null,
        () => slot?.place?.name
      );
    }
  };
}

// js/opencode/casesleft.ts
var MINE_MS = 1e4;
async function casesLeft(bridge, realm) {
  if (!bridge) throw new Error("no bridge");
  const args = { action: "mine", relation: "participant", ...realm ? { realm } : {} };
  const got = await bridge.request(
    "tools/call",
    { name: tool("case"), arguments: args },
    { timeoutMs: MINE_MS, service: true }
  );
  const text2 = textOf2(got);
  if (got?.isError) throw new Error(text2.slice(0, 200) || "refused");
  const rows = text2.split("\n").filter((l) => MINE_ROW.test(l)).length;
  if (rows) return rows;
  if (MINE_NONE.test(text2)) return 0;
  throw new Error(`unread answer: ${text2.slice(0, 120)}`);
}

// js/opencode/leadends.ts
import { createHash as createHash5 } from "node:crypto";
import { mkdirSync as mkdirSync4, readFileSync as readFileSync9, unlinkSync as unlinkSync3, writeFileSync as writeFileSync4 } from "node:fs";
import { join as join11 } from "node:path";
var fileOf2 = (dir, session) => join11(
  dir,
  `opencode-ended.${createHash5("sha256").update(session).digest("hex").slice(0, 16)}.json`
);
var ended = () => globalThis[`${GLOBAL_PREFIX}Ended`] ??= /* @__PURE__ */ new Set();
var lifted2 = () => globalThis[`${GLOBAL_PREFIX}EndLiftedAt`] ??= /* @__PURE__ */ new Map();
function recorded2(file, since) {
  try {
    const r = JSON.parse(readFileSync9(file, "utf8"));
    return !r.lifted && !(since !== void 0 && Date.parse(r.at ?? "") <= since);
  } catch (e) {
    return e.code !== "ENOENT";
  }
}
function createEnds(dir, unwritten, unlifted) {
  return {
    end(session) {
      ended().add(session);
      lifted2().delete(session);
      try {
        mkdirSync4(dir(), { recursive: true, mode: 448 });
        const record = JSON.stringify({ session, at: (/* @__PURE__ */ new Date()).toISOString() });
        writeFileSync4(fileOf2(dir(), session), record, { mode: 384 });
      } catch (e) {
        unwritten(session, e.message);
      }
    },
    lift(session) {
      ended().delete(session);
      lifted2().set(session, Date.now());
      const file = fileOf2(dir(), session);
      try {
        unlinkSync3(file);
      } catch (e) {
        if (e.code === "ENOENT") return;
        try {
          writeFileSync4(file, JSON.stringify({ session, lifted: (/* @__PURE__ */ new Date()).toISOString() }), {
            mode: 384
          });
        } catch {
          unlifted(session, e.message);
        }
      }
    },
    has: (session) => ended().has(session) || recorded2(fileOf2(dir(), session), lifted2().get(session))
  };
}

// js/opencode/leaddoors.ts
var END_MS = 5e3;
function leadDoors(ctx, say, flush, end, slots, closed = () => false) {
  return {
    say,
    ownPlace: (child) => ownPlace(slots.get(child)),
    async close(child) {
      await flush(child).catch(() => {
      });
      const got = await slots.get(child)?.bridge.request(method("end"), {}, { timeoutMs: END_MS, service: true }).catch(() => null);
      if (!got?.ended) return null;
      const revoked = (got.revoked ?? []).filter((k) => typeof k?.name === "string");
      return { failed: got.failed ?? [], revoked };
    },
    sits: (child, realm) => casesLeft(slots.get(child)?.bridge, realm),
    seal: (child) => end(child, null),
    async end(child) {
      end(child);
    },
    parentOf: (child) => parentOf(ctx, child),
    tell: teller(ctx, say, closed),
    ends: createEnds(
      authDir,
      (s, message) => say(W3().endUnwritten(s, message), "warning"),
      (s, message) => say(W3().endUnlifted(s, message), "warning")
    )
  };
}
async function parentOf(ctx, child) {
  const s = await ctx.session.get({ sessionID: child });
  return s?.parentID ?? s?.data?.parentID ?? null;
}
function teller(ctx, say, closed = () => false) {
  return async (sessionID, text2, wake2) => {
    const s = ctx.session;
    const delivery = "steer";
    for (const seen = /* @__PURE__ */ new Set(); closed(sessionID); wake2 = false) {
      seen.add(sessionID);
      const up = await parentOf(ctx, sessionID).catch(() => null);
      if (!up || seen.has(up)) return say(W3().noLiveAncestor(text2), "warning");
      sessionID = up;
    }
    text2 = markFrame(text2);
    try {
      if (typeof s.synthetic === "function")
        await s.synthetic({ sessionID, text: text2, delivery, resume: wake2 });
      else await s.prompt({ sessionID, text: text2, delivery, resume: wake2 });
      say(W3().tellDone(sessionID), "info");
    } catch (e) {
      say(W3().tellFailed(sessionID, e.message), "error");
    }
  };
}

// js/opencode/cascade.ts
var WINDOW_MS = Number(process.env[envName("CASCADE_MS")]) || 3e3;
function createCascade() {
  const cut = /* @__PURE__ */ new Map();
  return {
    note(ev) {
      const s = ev?.data?.sessionID;
      if (ev?.type !== "session.execution.interrupted" || ev.data?.reason !== "user") return;
      if (typeof s !== "string") return;
      const now2 = Date.now();
      for (const [k, at] of cut) if (now2 - at > 2 * WINDOW_MS) cut.delete(k);
      cut.set(s, now2);
    },
    async byParent(parent, t) {
      const p = await parent.catch(() => null);
      if (!p) return false;
      const near = () => {
        const at = cut.get(p);
        return at !== void 0 && Math.abs(at - t) <= WINDOW_MS;
      };
      while (!near() && Date.now() - t < WINDOW_MS) await sleep(50);
      return near();
    }
  };
}

// js/opencode/leads.ts
var roomNo = (room) => String(room ?? "").replace(/^\s*[#№]\s*|\s+$/g, "");
var names = (place, child, s) => s === child || !!place?.name && (s === place.name || s.endsWith(`:${place.name}`));
function createLeads(d) {
  const leads = /* @__PURE__ */ new Map();
  const gone = /* @__PURE__ */ new Map();
  const over = d.ends;
  const cascade = createCascade();
  const who = (l, child) => l.place?.name ?? W3().sessionOf(child);
  const parentOf2 = (child) => d.parentOf(child).catch(() => null);
  async function finish(child, why, ended2 = true, wake2 = true, kind = "end", own = false) {
    const l = leads.get(child);
    if (!l) return null;
    leads.delete(child);
    over.end(child);
    const kept2 = ended2 && kind === "end" ? d.ownPlace(child) : null;
    if (kept2) d.say(W3().keptSaid(who(l, child), kept2), "warning");
    if (ended2 && !kept2) d.seal(child);
    const parent = await l.parent;
    const last = (l.last ?? "").trim();
    const tell = async (text2, wakes) => {
      if (parent) await d.tell(parent, text2, wakes);
      else d.say(W3().noParent(text2), "warning");
    };
    await tell(
      kind === "lost" ? W3().lost(who(l, child), why) : kind === "away" ? awayWord(who(l, child), last) : endWord(who(l, child), why, last, kept2),
      wake2
    );
    if (!ended2 || kept2) return null;
    const run = await d.close(child).catch(() => null);
    await d.end(child).catch((e) => d.say(W3().notDown(who(l, child), e.message), "warning"));
    const failed = run?.failed ?? null;
    if (kind !== "lost" && !own && (failed === null || failed.length))
      await tell(unrevokedWord(who(l, child), failed), false);
    return run;
  }
  function leave(child, l, why) {
    l.leaving = why;
    if (!l.running) void finish(child, why);
  }
  async function lastLeave(child, l, room, realm) {
    const at = l.moves;
    const left = await d.sits(child, realm).catch((e) => e);
    if (leads.get(child) !== l || l.moves !== at || l.leaving) return;
    if (left === 0) return leave(child, l, W3().leftCase(room));
    if (typeof left === "number") return;
    const text2 = W3().lastUnknown(who(l, child), room, left.message);
    const parent = await l.parent;
    if (parent) await d.tell(parent, text2, false);
    else d.say(W3().noParent(text2), "warning");
  }
  function stood(child, lift = true) {
    let l = leads.get(child);
    if (!l) {
      const n2 = { parent: parentOf2(child), moves: 0 };
      void n2.parent.then(async (p) => {
        if (p) n2.up = { id: p, root: !await parentOf2(p) };
      });
      l = n2;
    }
    leads.set(child, l);
    if (lift) over.lift(child);
    return l;
  }
  function touch(l, place) {
    if (!l) return false;
    if (place) l.place = place;
    return true;
  }
  return {
    called(child, name, args, place) {
      if (gone.has(child)) return;
      const l = standsBy(name, args) ? stood(child) : leads.get(child);
      if (!touch(l, place)) return;
      const room = name === tool("case") ? roomNo(args.room) : null;
      if (room !== null && (args.action === "join" || args.action === "leave")) l.moves++;
      if (args.action !== "leave") return;
      if (name === tool("channel")) leave(child, l, W3().leftSeat());
      else if (room === "") leave(child, l, W3().leftCases());
      else if (room)
        void lastLeave(child, l, room, String(args.realm ?? "").trim() || l.place?.realm || "");
    },
    async release(caller, name, args) {
      const s = String(args.standing ?? "").trim();
      if (name !== tool("channel") || args.action !== "revoke" || !s) return null;
      for (const [child, l] of leads) {
        if (!names(l.place, child, s) || await l.parent !== caller) continue;
        if (d.ownPlace(child)) return null;
        gone.set(child, void 0);
        const place = l.place ?? null;
        const run = await finish(child, W3().releasedByLauncher(), true, true, "end", true);
        const seat = place && {
          realm: String(args.realm ?? "").trim() || place.realm,
          karta: args.karta == null ? place.karta : String(args.karta),
          name: place.name
        };
        const off = !!seat && !!run?.revoked.some((k) => sameSeat(k, seat));
        return { word: W3().release(who(l, child)), place, off };
      }
      return null;
    },
    ended: (child) => gone.has(child) || !!leads.get(child)?.leaving || over.has(child),
    released: (child) => gone.has(child),
    goneWhy: (child) => gone.get(child),
    heard(child, kind, place) {
      const down = kind === "evicted" || kind === "dead" || kind === "stopped";
      if (down && leads.has(child) && !d.ownPlace(child)) {
        const evicted = kind === "evicted";
        gone.set(child, evicted ? W3().placeEvictedRefusal() : W3().placeClosedRefusal());
        void finish(child, evicted ? W3().placeEvicted() : W3().placeClosed(), true, false);
        return true;
      }
      if (gone.has(child)) return true;
      if (kind === "held") {
        touch(stood(child), place);
        return false;
      }
      if (over.has(child)) return true;
      if (kind === "frame") touch(leads.get(child), place);
      return false;
    },
    back(child, was) {
      const l = stood(child, false);
      if (was.noted) l.noted = true;
      if (was.last) l.last ??= was.last;
      if (was.name && was.of) l.place ??= { ...was.of, name: was.name };
    },
    fail: async (child, why) => void await finish(child, why, true, false, "lost"),
    away: async (child) => void await finish(child, "", true, false, "away"),
    snapshot: (child) => {
      const l = leads.get(child);
      return { noted: !!l?.noted, last: l?.last };
    },
    handoff(child) {
      const l = leads.get(child);
      leads.delete(child);
      return { noted: !!l?.noted, last: l?.last };
    },
    nameOf: (child) => leads.get(child)?.place?.name ?? (leads.has(child) ? child : null),
    upOf: (child) => leads.get(child)?.up ?? null,
    onEvent(ev) {
      cascade.note(ev);
      const child = ev?.data?.sessionID;
      const l = typeof child === "string" ? leads.get(child) : void 0;
      if (ev?.type === "session.deleted" && typeof child === "string" && !l) over.lift(child);
      if (!l || typeof child !== "string") return;
      switch (ev.type) {
        case "session.execution.started":
          l.running = true;
          return;
        case "session.text.ended":
          if (typeof ev.data?.text === "string" && ev.data.text.trim()) l.last = ev.data.text;
          return;
        case "session.execution.interrupted":
          l.running = false;
          if (l.leaving) return void finish(child, l.leaving);
          if (ev.data?.reason !== "user") return;
          void cascade.byParent(l.parent, Date.now()).then(async (byParent) => {
            const p = byParent && leads.has(child) ? await l.parent : null;
            if (p) await d.tell(p, W3().cascade(who(l, child)), false);
          });
          return;
        case "session.execution.succeeded":
        case "session.execution.failed":
          l.running = false;
          if (l.leaving) return void finish(child, l.leaving);
          if (l.noted) return;
          l.noted = true;
          void l.parent.then(async (p) => {
            if (p && leads.has(child)) await d.tell(p, W3().turn(l.place?.name ?? child), false);
          });
          return;
        case "session.deleted":
          void finish(child, W3().deleted(), false);
          return over.lift(child);
      }
    }
  };
}

// js/opencode/login.ts
function elsewhere(device) {
  const W4 = words(OPENCODE_KEEP);
  return device && /^https?:/.test(device) ? W4.elsewhereDevice(device) : W4.elsewhereTunnel(device ?? "");
}
function createLogin(say) {
  const W4 = words(OPENCODE_KEEP);
  let pending = false;
  let url = null;
  let device = null;
  const waiters2 = /* @__PURE__ */ new Set();
  function started() {
    if (pending) return { promise: Promise.resolve(), cancel() {
    } };
    let waiter = () => {
    };
    const promise = new Promise((r) => waiter = r);
    waiters2.add(waiter);
    return { promise, cancel: () => waiters2.delete(waiter) };
  }
  function error() {
    const O = words(OPENCODE);
    return new Error(
      W4.needLoginError(url ? O.openInBrowser(url) : O.finishInBrowser(), elsewhere(device))
    );
  }
  return {
    get pending() {
      return pending;
    },
    get url() {
      return url;
    },
    get device() {
      return device;
    },
    on(next, nextDevice = null) {
      for (const w of waiters2) w();
      waiters2.clear();
      if (pending && next === url && nextDevice === device) return;
      pending = true;
      url = next;
      device = nextDevice;
      say(
        W4.needLogin(next ? W4.openAndFinish(next) : W4.finishItInBrowser(), elsewhere(device)),
        "warning"
      );
    },
    done() {
      pending = false;
      url = null;
      device = null;
    },
    async race(ready) {
      if (pending) throw error();
      const login = started();
      try {
        await Promise.race([
          ready(),
          login.promise.then(() => {
            throw error();
          })
        ]);
      } finally {
        login.cancel();
      }
    }
  };
}

// js/shared/seatmodel.ts
function withHarnessModel(args, model, heldRealms) {
  if (!args.satellite_of) return args;
  const { model: _said, ...own } = args;
  const realm = typeof own.realm === "string" ? own.realm.trim() : "";
  const holds = !!realm && heldRealms.includes(realm);
  const busy = holds && typeof own.status === "string" && takingArgs(own).length === 0;
  return model && !busy ? { ...own, model } : own;
}
function createSeatRealms() {
  const seats = /* @__PURE__ */ new Map();
  let main = null;
  return {
    see(data) {
      const d = data ?? {};
      const key = typeof d.key === "string" && d.key ? d.key : null;
      const realm = typeof d.place?.realm === "string" ? d.place.realm.trim() : "";
      if ((d.kind === "held" || d.kind === "beside") && key && realm) {
        if (d.kind === "held") {
          if (main && main !== key) seats.delete(main);
          main = key;
        }
        seats.set(key, realm);
      } else if (typeof d.kind === "string" && ["beside-gone", "released", "stopped", "dead", "evicted"].includes(d.kind)) {
        if (key) seats.delete(key);
        else if (d.kind !== "beside-gone") seats.clear();
      }
    },
    realms: () => [...new Set(seats.values())],
    clear: () => {
      seats.clear();
      main = null;
    }
  };
}

// js/opencode/models.ts
var idOf4 = (m) => typeof m?.id === "string" && m.id.trim() ? m.id.trim() : null;
function createModels(ctx) {
  const stepped = /* @__PURE__ */ new Map();
  const seats = /* @__PURE__ */ new WeakMap();
  const seatsOf = (of2) => {
    const s = seats.get(of2) ?? createSeatRealms();
    seats.set(of2, s);
    return s;
  };
  async function of(session) {
    const step = stepped.get(session);
    if (step) return step;
    try {
      const res = await ctx.session.get({ sessionID: session });
      return idOf4(res?.model ?? res?.data?.model);
    } catch {
      return null;
    }
  }
  return {
    onEvent(ev) {
      const session = ev?.data?.sessionID;
      if (typeof session !== "string") return;
      if (ev.type === "session.deleted") stepped.delete(session);
      const id = ev.type === "session.step.started" ? idOf4(ev.data?.model) : null;
      if (id) stepped.set(session, id);
    },
    seen(bridge, data) {
      seatsOf(bridge).see(data);
      return data?.kind;
    },
    of,
    async name(args, session, bridge) {
      if (!args.satellite_of) return;
      const next = withHarnessModel(args, await of(session), seatsOf(bridge).realms());
      delete args.model;
      Object.assign(args, next);
    }
  };
}

// js/opencode/moves.ts
var ADOPT_MS = Number(process.env[envName("MOVE_ADOPT_MS")]) || 1e3;
function createMoves(ctx) {
  const W4 = words(OPENCODE_KEEP);
  const home = homeOf(ctx);
  const directoryOf = (sessionID) => sessionDirectory(ctx, sessionID);
  const exists2 = (sessionID) => Promise.resolve().then(() => ctx.session.get({ sessionID })).then(
    () => true,
    () => false
  );
  const ours = async (sessionID) => {
    if (!await exists2(sessionID)) return false;
    const dir = home ? await directoryOf(sessionID) : null;
    return !home || !dir || dir === home.directory;
  };
  const left = /* @__PURE__ */ new Set();
  function moved(d, s, to) {
    if (!home || !to?.directory || d.slots.get(s)?.child) return;
    if (to.directory !== home.directory) {
      const root = d.slots.get(s);
      if (!root) return;
      const of = root.place?.name;
      const kids = [...d.slots.values()].filter((k) => k.child && of && k.satelliteOf?.name === of);
      const away = [{ ...root, dir: to.directory }, ...kids].map((x) => ({ ...x, moved: true }));
      writeLostMarker(authDir(), away, to);
      d.say(W4.movedAway(s, to.directory), "info");
      left.add(s);
      for (const k of kids) if (k.session) void d.away(k.session);
      return d.forget(s);
    }
    left.delete(s);
    void d.rootOf(s).then((root) => root === s ? d.slotFor(s, false) : null);
    setTimeout(() => d.adopt(), ADOPT_MS).unref?.();
  }
  function relay(on, say) {
    return (s, params, child) => {
      if (params?.data?.kind !== "evicted" || !home || !s || child) return on(s, params, child);
      void ours(s).then((mine) => mine ? on(s, params, child) : say(W4.takenFromNew(s), "info"));
    };
  }
  function guard(root, session) {
    if (root === session || !left.has(root)) return;
    throw new Error(W4.parentMoved());
  }
  async function farRoot(root) {
    const held = heldInProcess(root);
    if (held) return held;
    const dir = home ? await directoryOf(root) : null;
    return home && dir && dir !== home.directory ? "foreign" : null;
  }
  const farRefusal = async (root) => root && await farRoot(root) === "foreign" ? W4.farRefusal() : null;
  return { home, directoryOf, exists: exists2, ours, moved, relay, guard, farRoot, farRefusal };
}

// js/bridge/fields.ts
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

// js/bridge/refusal.ts
function refusalOf(reply) {
  const r = reply?.result?._meta?.[serverProtocol.refusal];
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

// js/opencode/release.ts
var seatGone = (e) => seatAlreadyOff(refusalOf({ result: e.result }));
var reason = (message) => (message.split("\n").find((s) => s.trim()) ?? "").replace(/\b\w+\([^()]*\)/g, "…").trim();
async function revokeAsLauncher(freed, args, call) {
  if (freed.off) return freed.word;
  const p = freed.place;
  const full = {
    ...args,
    ...args.realm == null && p?.realm ? { realm: p.realm } : {},
    ...args.karta == null && p?.karta ? { karta: p.karta } : {}
  };
  try {
    await call(full);
    return freed.word;
  } catch (e) {
    if (seatGone(e)) return freed.word;
    const why = reason(e.message);
    throw new Error(W3().unreleased(p?.name ?? String(args.standing ?? ""), why), { cause: e });
  }
}

// js/opencode/rootseat-tools.ts
import { readFileSync as readFileSync10 } from "node:fs";

// js/opencode/rootseat-by.ts
function heldSeat(d, slot, session) {
  if (slot.place) return { ...slot.place };
  const rec3 = d.recorded?.(slot, session);
  if (rec3) return rec3;
  const [name = "", karta = ""] = (slot.key ?? "").split("--");
  return { name, karta, realm: "" };
}
var short = (t) => /^r\d+$/.test(t.trim());
var canonical = (t) => /^@[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(t);
var slug = (t) => /^[A-Za-z0-9_.-]+$/.test(t) && !short(t);
function sameSeat2(seat, realm, karta) {
  if (seat.karta.trim().replace(/^#/, "") !== karta.trim().replace(/^#/, "")) return false;
  const [x, y] = [seat.realm.trim(), realm.trim()];
  if (short(x) || short(y)) return short(x) && short(y) && x === y;
  if (canonical(x) && canonical(y)) return x === y;
  if (canonical(x) && slug(y)) return x.slice(x.indexOf("/") + 1) === y;
  if (slug(x) && canonical(y)) return x === y.slice(y.indexOf("/") + 1);
  return slug(x) && slug(y) && x === y;
}
function outcome(d, slot, session, realm, karta, provisional) {
  const own = heldSeat(d, slot, session);
  if (!own.realm || short(own.realm) !== short(realm)) return { other: own, uncompared: realm };
  return sameSeat2(own, realm, karta) ? { place: own.name, realm: own.realm, provisional } : { other: own };
}
async function seatBy(d, root, realm, karta) {
  try {
    const cancelled = () => d.cancelled?.(root) === true;
    if (cancelled()) return { cancelled: true };
    const slot = await d.slotFor(root);
    slot.busy++;
    try {
      await d.awaitReady(slot);
      if (slot.resume) await slot.resume;
      if (cancelled()) return { cancelled: true };
      const provisional = () => d.provisional?.(slot, root) === true;
      if (slot.holding) return outcome(d, slot, root, realm, karta, provisional());
      const model = await d.modelOf(root);
      if (cancelled()) return { cancelled: true };
      const args = { realm, karta, provisional: true, ...model ? { model } : {} };
      const out2 = await d.callThrough(slot, STAND_TOOL2, args, root, true);
      if (cancelled()) return { cancelled: true };
      if (!slot.holding) return { error: out2.content || words(PLUGIN).refusalNoText(STAND_TOOL2) };
      return outcome(
        d,
        slot,
        root,
        short(realm) && out2.place ? out2.place.realm : realm,
        karta,
        out2.provisional === true
      );
    } finally {
      slot.busy--;
      slot.lastCall = Date.now();
    }
  } catch (e) {
    return { error: e.message };
  }
}

// js/opencode/rootseat-tools.ts
var explicitHeld = (slot) => ({
  logger: LOGGERS.channel,
  data: { kind: "held", key: slot.key, automatic: false }
});
function createSeatLife(d) {
  const deleted = /* @__PURE__ */ new Set();
  const attempts = /* @__PURE__ */ new Map();
  const epochs = /* @__PURE__ */ new Map();
  const cancelled = (s) => d.stopped() || deleted.has(s) || attempts.get(s)?.cancelledHere === true || attempts.get(s)?.cancelled() === true;
  const recorded3 = (slot, session) => {
    if (!slot.key) return null;
    try {
      const rec3 = JSON.parse(readFileSync10(holdFilePathOf(d.authDir(), slot.key), "utf8"));
      return rec3.session === session && rec3.key === slot.key && typeof rec3.realm === "string" && typeof rec3.name === "string" ? { name: rec3.name, karta: String(rec3.karta), realm: rec3.realm } : null;
    } catch {
      return null;
    }
  };
  const cancel = (s) => {
    deleted.add(s);
    const a = attempts.get(s);
    if (a) a.cancelledHere = true;
  };
  const drop2 = (s, slot) => {
    d.forgot(s);
    if (d.slots.get(s) === slot) d.slots.delete(s);
  };
  return {
    guard(s, service = false) {
      if (d.stopped() || deleted.has(s) || service && cancelled(s))
        throw new Error(words(ROOT_SEAT).cancelled());
    },
    epoch: (s) => epochs.get(s) ?? 0,
    async explicit(s, name, args, work) {
      const taking = standsBy(name, args) && (name !== tool("stand") || !asSatellite(args, null));
      if (taking) await attempts.get(s)?.closing;
      const a = taking ? attempts.get(s) : void 0;
      let finish = () => {
      };
      if (a) {
        a.cancelledHere = true;
        const done = new Promise((r) => {
          finish = r;
        });
        a.explicit = Promise.all([a.explicit, done]).then(() => {
        });
      }
      try {
        return await work();
      } finally {
        finish();
      }
    },
    answer(slot, name, result, service, taking, s, epoch) {
      const r = result;
      if (r?.isError)
        throw Object.assign(new Error(textOf2(result) || words(PLUGIN).refusalNoText(name)), {
          result
        });
      const sc = r?.structuredContent;
      if (taking && epoch === (epochs.get(s) ?? 0)) {
        if (!sc?.key || sc.key === slot.key) {
          d.stood(slot);
          slot.provisional = sc?.provisional === true;
        }
        if (!service && name === tool("stand")) {
          const a = attempts.get(s);
          if (a) a.adopted = true;
          d.held(s, slot);
          epochs.set(s, epoch + 1);
        }
      }
      const place = heldPlace(sc) ?? slot.place;
      return {
        content: textOf2(result),
        ...service && name === tool("stand") && place ? {
          place,
          provisional: sc?.provisional === true,
          key: typeof sc?.key === "string" ? sc.key : void 0
        } : {}
      };
    },
    observe(slot, kind, data) {
      if (kind === "held" || kind === "attached" || data?.frame?.type === "hello") d.stood(slot);
      if ((kind === "held" || kind === "released") && typeof data?.key === "string")
        slot.key = data.key;
      if (kind === "held") {
        slot.place = heldPlace(data) ?? slot.place;
        slot.provisional = data?.provisional === true;
        if (data?.automatic === false && slot.session) {
          epochs.set(slot.session, (epochs.get(slot.session) ?? 0) + 1);
          const a = attempts.get(slot.session);
          if (a) a.adopted = true;
        }
      }
      if (kind === "released" || kind === "dead" || kind === "evicted" || kind === "stopped")
        slot.holding = false;
      if (kind === "stopped" && slot.session)
        epochs.set(slot.session, (epochs.get(slot.session) ?? 0) + 1);
      return kind === "held" && data?.automatic === true;
    },
    cancel,
    forget(s) {
      const slot = d.slots.get(s);
      if (!slot) return;
      const a = attempts.get(s);
      if (a) {
        a.cancelledHere = true;
        return;
      }
      slot.ownStop = true;
      slot.bridge.stop();
      drop2(s, slot);
    },
    stopSlots(home, spare) {
      const slots = [...d.slots.values()];
      const left = writeLostMarker(d.authDir(), slots, home);
      if (spare) {
        spare.ownStop = true;
        spare.bridge.stop();
      }
      for (const slot of slots) {
        if (slot.session && attempts.get(slot.session)?.onWire) continue;
        slot.ownStop = true;
        slot.bridge.stop();
      }
      d.slots.clear();
      return left;
    },
    half: {
      async seatRoot(s, realm, karta, isCancelled) {
        if (cancelled(s) || isCancelled()) return { cancelled: true };
        const attempt = {
          cancelled: isCancelled,
          cancelledHere: false,
          slot: void 0
        };
        attempts.set(s, attempt);
        return seatBy(
          {
            slotFor: async (root) => {
              const slot = await d.slotFor(root);
              attempt.slot = slot;
              return slot;
            },
            awaitReady: d.awaitReady,
            callThrough: async (...args) => {
              attempt.onWire = true;
              attempt.fresh = true;
              try {
                const out2 = await d.callThrough(...args);
                if (out2.provisional === true && out2.key && out2.place)
                  attempt.owned = { key: out2.key, place: out2.place };
                return out2;
              } catch (e) {
                attempt.failure = e.message;
                throw e;
              } finally {
                attempt.onWire = false;
              }
            },
            modelOf: d.modelOf,
            cancelled,
            provisional: (slot) => slot.provisional === true,
            recorded: recorded3
          },
          s,
          realm,
          karta
        );
      },
      cancelSeat: cancel,
      async releaseSeat(s) {
        const attempt = attempts.get(s);
        const slot = attempt?.slot;
        if (!slot) return;
        let last;
        do {
          last = attempt?.explicit;
          await last;
        } while (attempt?.explicit !== last);
        const owned = attempt?.owned;
        if (!owned || attempt?.adopted || !slot.holding || slot.key !== owned.key || slot.provisional !== true) {
          if (attempt?.fresh && !owned && !attempt.explicit && (slot.holding || attempt.failure))
            d.failed(
              words(ROOT_SEAT).cleanupFailed(
                slot.key ?? s,
                attempt.failure ?? words(ROOT_SEAT).unproven()
              )
            );
          if (d.stopped() || deleted.has(s) || attempt?.fresh && !attempt.explicit) {
            slot.ownStop = true;
            slot.bridge.stop();
            drop2(s, slot);
          }
          return;
        }
        slot.ownStop = true;
        let finished = () => {
        };
        if (attempt)
          attempt.closing = new Promise((r) => {
            finished = r;
          });
        try {
          const failure = attempts.get(s)?.failure;
          if (!slot.holding && failure) throw new Error(failure);
          if (slot.holding) {
            const p = owned.place;
            const result = await slot.bridge.request(
              "tools/call",
              {
                name: tool("channel"),
                arguments: { action: "revoke", realm: p.realm, karta: p.karta, standing: p.name }
              },
              { service: true, timeoutMs: 1e4 }
            );
            if (result?.isError) throw new Error(textOf2(result));
          }
        } catch (e) {
          d.failed(words(ROOT_SEAT).cleanupFailed(slot.key ?? s, e.message));
        } finally {
          slot.bridge.stop();
          drop2(s, slot);
          finished();
        }
      },
      finishSeat(s) {
        attempts.delete(s);
      }
    }
  };
}

// js/opencode/runends.ts
var READ_TOOLS2 = new Set(["look", "orient", "search", "semantic_search"].map(tool));
var CASE_READS = /* @__PURE__ */ new Set(["read", "history", "mine", "at"]);
var READ_ACTIONS = {
  [tool("case")]: CASE_READS,
  [tool("channel")]: /* @__PURE__ */ new Set(["list", "sessions", "history"]),
  [tool("realm")]: /* @__PURE__ */ new Set(["list"]),
  [tool("org")]: /* @__PURE__ */ new Set(["list", "get", "realms", "list_members", "list_grants"]),
  [tool("me")]: /* @__PURE__ */ new Set(["whoami", "orgs", "kartas", "usage"]),
  [tool("history")]: /* @__PURE__ */ new Set(["realm", "node", "delta"]),
  [tool("admin")]: /* @__PURE__ */ new Set([
    "list_members",
    "access",
    "search_users",
    "list_webhooks",
    "user_webhooks",
    "version"
  ])
};
var declaresAction = (inputSchema) => {
  const props = inputSchema?.properties;
  return !!props && typeof props === "object" && Object.hasOwn(props, "action");
};
var readsOnly = (name, args, asks) => {
  const action = String(args.action ?? "");
  return READ_TOOLS2.has(name) || asks && action === "?" || !!READ_ACTIONS[name]?.has(action);
};
var asChildRead = (name, args) => {
  if (name === tool("case") && args.action === "history") args.keep_cursor = true;
};
var IDENTITY = {
  [tool("me")]: "all",
  [tool("admin")]: /* @__PURE__ */ new Set(["search_users", "access", "list_members", "user_webhooks"]),
  // The human's organizations and membership — by the tool's description, all its reads.
  [tool("org")]: /* @__PURE__ */ new Set(["list", "get", "realms", "list_members", "list_grants"])
};
function identityRefusal(name, args, asks) {
  const action = String(args.action ?? "");
  const of = IDENTITY[name];
  if (!of || asks && action === "?") return null;
  if (of !== "all" && !of.has(action)) return null;
  return W3().identity(name, action);
}
function childWriteRefusal(of, name, args, asks) {
  const notYours = identityRefusal(name, args, asks);
  if (notYours) return notYours;
  if (readsOnly(name, args, asks)) {
    asChildRead(name, args);
    return null;
  }
  return of ? W3().writeUnderParent(name, of) : W3().writeNoParent();
}
function createRunEnds() {
  const ended2 = /* @__PURE__ */ new Map();
  const released = /* @__PURE__ */ new Set();
  const whys = /* @__PURE__ */ new Map();
  const sealed = /* @__PURE__ */ new Set();
  return {
    end(session, of, forget2, final = false, why) {
      if (forget2) forget2(session);
      else sealed.add(session);
      ended2.set(session, of ?? null);
      if (final) released.add(session);
      if (why) whys.set(session, why);
    },
    clear(session, gone = false) {
      sealed.delete(session);
      if (gone) released.delete(session);
      if (!released.has(session)) ended2.delete(session);
      if (!ended2.has(session)) whys.delete(session);
    },
    guard(session, name, args, asks) {
      const final = released.has(session);
      if ((final || sealed.has(session)) && !READ_TOOLS2.has(name) && !READ_ACTIONS[name]?.has(String(args.action ?? "")))
        throw new Error(
          W3().finalRefusal(
            whys.get(session) ?? (final ? W3().releasedChild() : W3().endedChild()),
            name
          )
        );
      if (!ended2.has(session) || name === STAND_TOOL2 || READ_TOOLS2.has(name)) return;
      const action = String(args.action ?? "");
      if (asks && action === "?" || READ_ACTIONS[name]?.has(action)) return;
      const of = ended2.get(session)?.name ?? W3().launcherSeat();
      throw new Error(
        W3().endedRefusal(whys.get(session) ?? W3().endedSatellite(), name, action, of)
      );
    }
  };
}

// js/opencode/service.ts
async function inSlot(slot, call) {
  slot.busy++;
  try {
    return await call();
  } finally {
    slot.busy--;
    slot.lastCall = Date.now();
  }
}

// js/opencode/slot.ts
var IDLE_MS = Number(process.env[envName("BRIDGE_IDLE_MS")] || 30 * 6e4);
if (IDLE_MS <= WATCH_MS)
  process.stderr.write(`[${PRODUCT}/warning] ${words(OPENCODE).idleShort(IDLE_MS, WATCH_MS)}
`);
var REAP_MS = Number(process.env[envName("BRIDGE_REAP_MS")] || 6e4);

// js/opencode/status.ts
var STATUS_TOOL = tool("bridge");
var statusTool = (text2) => ({
  name: STATUS_TOOL,
  description: words(OPENCODE).statusDescription(),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- the SDK's input schema has no type
  input: { type: "object", properties: {}, additionalProperties: false },
  async execute() {
    return { content: text2() };
  }
});
function statusLines(path, builds, login, state2, sessions, spare) {
  const W4 = words(OPENCODE);
  return [
    W4.statusBridge(path),
    builds,
    login.pending ? W4.statusLoginPending(
      login.url ? W4.openInBrowser(login.url) : W4.finishInBrowser(),
      elsewhere(login.device)
    ) : state2.serverSeen ? W4.statusLoginDone() : W4.statusLoginWaiting(),
    W4.statusTools(state2.listed.length, state2.source),
    W4.statusBridges(sessions + spare, sessions)
  ].join("\n");
}

// js/opencode/tools.ts
async function setupTools(ctx, say, onChannel, rootOf, flushUsage = async () => {
}, closed = () => false, halted = async () => null) {
  const W4 = words(OPENCODE);
  const P = words(PLUGIN);
  const found = findBridge();
  if (!found.path) {
    say(P.noBridge(found.tried.join(", ")), "error");
    return idleHalf();
  }
  const path = found.path;
  const builds = buildsLine(path, import.meta.url);
  const hostEnv = await hostEnvOf(ctx);
  const slots = /* @__PURE__ */ new Map();
  const unasked = /* @__PURE__ */ new WeakSet();
  let spare = null;
  let stopped = false;
  const login = createLogin(say);
  const { shake, readyFor } = slotReady(login);
  function spawn2(args = []) {
    const slot = {
      bridge: null,
      ready: Promise.resolve(),
      session: null,
      holding: false,
      stood: false,
      dir: null,
      key: null,
      resume: null,
      lastCall: Date.now(),
      busy: 0,
      ownStop: false
    };
    slot.bridge = new Bridge(
      path,
      (line) => say(P.bridgeLine(line), "info"),
      (method2, params) => {
        if (method2 === "notifications/tools/list_changed") return void relist(slot.bridge);
        if (method2 !== "notifications/message" || params?.logger !== LOGGERS.channel) return;
        if (slot.ownStop) return;
        const kind = models.seen(slot, params?.data);
        if (seats.observe(slot, kind, params?.data))
          params = { ...params, data: { ...params.data, automatic: true } };
        if (kind === "stopped" && slot.session) keeper.forget(slot.session);
        const lead = !!slot.child && !!slot.satelliteOf && !!slot.session;
        const session = slot.session;
        if (kind === "stopped") {
          relay(slot.session, params, !!slot.child);
          const answered = answerHalt(
            slot.bridge,
            params?.data,
            (signal) => halted(slot.session, signal)
          );
          if (lead) void answered.then(() => leads.heard(session, kind, slot.place));
          return;
        }
        const over = lead && leads.heard(session, kind, slot.place);
        if (!over) relay(slot.session, params, !!slot.child);
      },
      (e) => {
        if (slot.ownStop || stopped || !slot.holding) return;
        slot.holding = false;
        const text2 = W4.hearingLost((/* @__PURE__ */ new Date()).toTimeString().slice(0, 5), e.message);
        const lost2 = { logger: LOGGERS.channel, data: { kind: "lost", text: text2 } };
        onChannel(slot.session, lost2, !!slot.child);
      },
      args
    );
    slot.bridge.start(hostEnv);
    shake(slot);
    return slot;
  }
  const mv = createMoves(ctx);
  const { home, directoryOf, exists: exists2, ours } = mv;
  const relay = mv.relay(onChannel, say);
  const models = createModels(ctx);
  const runEnds = createRunEnds();
  const endChild = (c, out2 = forget2) => runEnds.end(c, slots.get(c)?.satelliteOf, out2, leads.released(c), leads.goneWhy(c));
  const leads = createLeads(leadDoors(ctx, say, flushUsage, endChild, slots, closed));
  const keeper = createKeeper({
    say,
    tell: (root, text2, child) => onChannel(root, { logger: LOGGERS.channel, data: { kind: "resumed", text: text2 } }, !!child),
    lost: (root, text2) => onChannel(root, { logger: LOGGERS.channel, data: { kind: "lost", text: text2 } }),
    slotFor: (root, touch) => slotFor(root, touch),
    ready: readyFor,
    directoryOf,
    exists: ours
  });
  const nothing2 = () => {
  };
  const endRun = (s, live = true) => live ? void flushUsage(s).finally(() => runEnds.end(s, null, forget2)) : runEnds.end(s, null, nothing2);
  const children = createChildren({ slots, spawn: spawn2, keeper, leads, exists: exists2, endRun });
  const handoff = createHandoff({ slots, leads, forget: forget2 });
  const adopt = createAdopt({
    keeper,
    authDir,
    home,
    back: (e) => children.back(e),
    endKid: (s, of, why) => runEnds.end(s, of, nothing2, false, why)
  });
  const seats = createSeatLife({
    stopped: () => stopped,
    slots,
    authDir,
    slotFor,
    awaitReady: (slot) => awaitReady(slot),
    callThrough,
    modelOf: (s) => models.of(s),
    failed: (word2) => say(word2, "error"),
    stood: (slot) => keeper.stood(slot),
    forgot: (s) => keeper.forget(s),
    held: (s, slot) => onChannel(s, explicitHeld(slot), !!slot.child)
  });
  const lost = takeLostMarker(authDir(), home);
  if (lost?.text) say(lost.text, "warning");
  if (lost) adopt.take(lost.entries);
  const adoptNow = () => void (stopped || adopt.now());
  async function slotFor(sessionID, touch = true) {
    seats.guard(sessionID);
    const root = await rootOf(sessionID);
    mv.guard(root, sessionID);
    if (root !== sessionID && !slots.has(sessionID)) {
      adopt.now();
      await children.settled(sessionID);
    }
    seats.guard(sessionID);
    const own = root !== sessionID ? slots.get(sessionID) : void 0;
    if (own) {
      const live = own.bridge.failure ? children.childSlot(sessionID) : own;
      if (touch) live.lastCall = Date.now();
      return live;
    }
    const far = root !== sessionID && !slots.get(root)?.place ? await mv.farRoot(root) : null;
    seats.guard(sessionID);
    if (far && far !== "foreign") return far;
    let slot = slots.get(root);
    let dead;
    if (slot?.bridge.failure) {
      dead = slot;
      slots.delete(root);
      slot = void 0;
    }
    if (!slot) {
      slot = spare && !spare.bridge.failure ? spare : spawn2();
      spare = null;
      slot.session = root;
      slot.dir = dead?.dir ?? slot.dir;
      slot.key = dead?.key ?? slot.key;
      slots.set(root, slot);
      unasked.add(slot);
    }
    const s = slot;
    if (far !== "foreign" && unasked.delete(s))
      s.resume = keeper.resume(s, root).finally(() => s.resume = null);
    if (touch) slot.lastCall = Date.now();
    return slot;
  }
  const reaper = setInterval(() => {
    const now2 = Date.now();
    for (const [session, slot] of slots) {
      if (slot.holding || slot.busy > 0 || now2 - slot.lastCall < IDLE_MS) continue;
      slot.ownStop = true;
      slot.bridge.stop();
      slots.delete(session);
    }
    if (spare && !spare.holding && now2 - spare.lastCall >= IDLE_MS && state2.serverSeen) {
      spare.ownStop = true;
      spare.bridge.stop();
      spare = null;
    }
  }, REAP_MS);
  reaper.unref?.();
  const state2 = {
    listed: readCache() ?? [],
    source: W4.fromCache(),
    serverSeen: false
  };
  const relist = (b) => b && refreshToolList(
    b,
    state2,
    () => ctx.tool.reload(),
    say,
    () => !stopped
  );
  const statusText = () => statusLines(path, builds, login, state2, slots.size, spare ? 1 : 0);
  await ctx.tool.transform((editor) => {
    editor.add(statusTool(statusText));
    for (const t of state2.listed) {
      const name = String(t.name);
      const asks = declaresAction(t.inputSchema);
      editor.add({
        name,
        description: String(t.description ?? ""),
        input: toParameters(t.inputSchema),
        async execute(input, tool2) {
          return seats.explicit(String(tool2.sessionID), name, input ?? {}, async () => {
            const caller = String(tool2.sessionID);
            const freed = await leads.release(caller, name, input ?? {});
            if (freed)
              return {
                content: await revokeAsLauncher(freed, input ?? {}, async (args) => {
                  const slot2 = await slotFor(caller);
                  slot2.busy++;
                  try {
                    return await callThrough(slot2, name, args, caller);
                  } finally {
                    slot2.busy--;
                  }
                })
              };
            const word2 = adopt.revoked(name, input ?? {});
            if (word2) return { content: word2 };
            await children.settled(String(tool2.sessionID));
            runEnds.guard(String(tool2.sessionID), name, input ?? {}, asks);
            const slot = await slotFor(String(tool2.sessionID));
            if (slot.session !== caller && !standsBy(name, input ?? {})) {
              const no = childWriteRefusal(slot.place?.name ?? null, name, input ?? {}, asks);
              if (no) throw new Error(no);
            }
            slot.busy++;
            try {
              return await callThrough(slot, name, input, String(tool2.sessionID));
            } finally {
              slot.busy--;
              slot.lastCall = Date.now();
            }
          });
        }
      });
    }
  });
  const awaitReady = (slot) => login.race(() => readyFor(slot));
  async function callThrough(slot, name, input, sessionID, service = false) {
    await awaitReady(slot);
    if (slot.resume) await slot.resume;
    seats.guard(sessionID, service);
    const args = { ...input ?? {} };
    if (standsBy(name, args) && slot.session !== sessionID) {
      if (!slot.place)
        throw new Error(
          await mv.farRefusal(slot.session) ?? childWriteRefusal(null, name, args, false) ?? ""
        );
      slot = children.childSlot(sessionID, slot);
      await awaitReady(slot);
      seats.guard(sessionID, service);
    }
    const busy = name === STAND_TOOL2 && asSatellite(args, slot.satelliteOf, !!slot.place);
    if (name === STAND_TOOL2) await models.name(args, sessionID, slot);
    if (name === STAND_TOOL2 && !args.cwd) {
      const dir = slot.dir ??= await directoryOf(slot.session ?? sessionID);
      if (dir) args.cwd = dir;
    }
    seats.guard(sessionID, service);
    const epoch = seats.epoch(sessionID);
    const result = await slot.bridge.request("tools/call", { name, arguments: args }, { service });
    const out2 = seats.answer(
      slot,
      name,
      result,
      service,
      standsBy(name, args) && !busy,
      sessionID,
      epoch
    );
    if (standsBy(name, args)) runEnds.clear(sessionID);
    if (slot.child && slot.satelliteOf && slot.session === sessionID)
      leads.called(sessionID, name, args, slot.place);
    return out2;
  }
  if (state2.listed.length) say(W4.cached(state2.listed.length), "info");
  spare = spawn2();
  let first = spare;
  let [misses, deaths] = [0, 0];
  void (async () => {
    for (; ; ) {
      if (stopped) return;
      try {
        await first.ready;
        const list = await listTools(first.bridge);
        state2.serverSeen = true;
        const same = JSON.stringify(list) === JSON.stringify(state2.listed);
        state2.listed = list;
        state2.source = W4.fromServer();
        writeCache(list);
        if (!same) await ctx.tool.reload();
        say(W4.raised(list.length), "info");
        return;
      } catch (e) {
        if (stopped) return;
        if (first.bridge.failure) {
          if (first.session === null) say(W4.died(e.message), "warning");
          if (spare === first) spare = null;
          first = spare ?? spawn2();
          spare = first;
          await sleep(retryPause(deaths++));
        } else {
          await sleep(retryPause(misses++));
          shake(first);
        }
      }
    }
  })();
  if (lost) void keeper.resumeLost(lost.entries, lost.wordFor);
  const launcher = createLauncher({
    rootOf,
    childSlot(sessionID, root) {
      if (!slots.get(root)?.place)
        throw new Error(childWriteRefusal(null, STAND_TOOL2, {}, false) ?? "");
      return children.childSlot(sessionID, slots.get(root));
    },
    call: (slot, name, args, sessionID) => inSlot(slot, async () => (await callThrough(slot, name, args, sessionID, true)).content)
  });
  function forget2(session) {
    runEnds.clear(session);
    launcher.forget(session);
    keeper.forget(session);
    seats.forget(session);
  }
  return {
    launch: launcher.launch,
    ...seats.half,
    bridgeOf: (s) => [slots.get(s)].find((x) => x?.holding)?.bridge ?? null,
    forget(s) {
      seats.cancel(s);
      forget2(s);
      runEnds.clear(s, true);
    },
    onEvent: (ev) => [models, leads].forEach((x) => x.onEvent(ev)),
    leadOf: (s) => leads.nameOf(s),
    ended: (s) => leads.ended(s),
    launcherOf: (s) => launcherSeat(leads.upOf(s), slots, slots.get(s)?.satelliteOf?.name),
    holders: () => holdersOf(slots.values()),
    owns: (s) => slots.has(s),
    held: (r) => [slots.get(r)].find((x) => x?.holding && x.place && !x.bridge.failure) ?? null,
    adopt: adoptNow,
    // A satellite child moved alone goes as its own satellite to the new folder (handoff.ts, #6695).
    moved: (s, to) => handoff(s, to, home) || mv.moved({ say, slots, rootOf, forget: forget2, slotFor, adopt: adoptNow, away: leads.away }, s, to),
    children: () => [...slots.values()].flatMap((x) => x.child && x.holding && x.session ? [x.session] : []),
    halt(child) {
      const slot = slots.get(child);
      if (!slot?.child || !slot.holding) return;
      slot.holding = false;
      keeper.forget(child);
      if (!(slot.satelliteOf && leads.heard(child, "stopped", slot.place))) forget2(child);
    },
    async stop() {
      stopped = true;
      clearInterval(reaper);
      keeper.stop();
      await children.pause();
      const left = seats.stopSlots(home, spare);
      spare = null;
      return left;
    }
  };
}

// js/opencode/tacts.ts
var WAKE_HOLD_MS = Number(process.env[envName("OPENCODE_WAKE_HOLD_MS")]) || 6 * 36e5;
function setupTacts(send, takenEarly, freshestRoot, say) {
  const W4 = words(OPENCODE);
  const busy = /* @__PURE__ */ new Set();
  const queued = /* @__PURE__ */ new Map();
  const held = /* @__PURE__ */ new Map();
  const occupied = (id) => {
    for (const [k, q] of queued) if (q.at + WAKE_HOLD_MS <= Date.now()) queued.delete(k);
    return busy.has(id) || [...queued.values()].some((q) => q.session === id);
  };
  function put(session, child, ev, what) {
    void send(session, ev.text ?? "", what, child).then((got) => {
      if (!got?.inbox || takenEarly.delete(got.inbox)) return;
      queued.set(got.inbox, { session: got.session, at: Date.now() });
      for (const k of queued.keys()) if (queued.size > 100) queued.delete(k);
    });
  }
  function release(id) {
    const t = held.get(id);
    if (!t) return;
    held.delete(id);
    clearTimeout(t.timer);
    put(t.session, t.child, t.ev, W4.tact());
  }
  return {
    offer(session, child, ev, what) {
      const id = session ?? freshestRoot();
      if (!id || !ev.frames?.some(isTact)) return false;
      const prev = held.get(id);
      const at = tactAt(ev.frames);
      const was = prev ? tactAt(prev.ev.frames) : "";
      const older = !!at && !!was && at < was;
      if (!onlyTacts(ev.frames) || !occupied(id)) {
        if (prev && !older) {
          clearTimeout(prev.timer);
          held.delete(id);
        }
        put(session, child, ev, what);
        return true;
      }
      if (older) return true;
      const timer = prev?.timer ?? setTimeout(() => release(id), WAKE_HOLD_MS);
      timer.unref?.();
      held.set(id, { session, child, ev, timer });
      say(prev ? W4.tactWaitsFolded() : W4.tactWaits(), "info");
      return true;
    },
    busy(session) {
      busy.add(session);
      for (const s of busy) if (busy.size > 100) busy.delete(s);
    },
    taken(session, inbox) {
      if (inbox) return void (queued.delete(inbox) && this.busy(session));
      busy.delete(session);
      for (const [k, q] of queued) if (q.session === session) queued.delete(k);
      release(session);
    },
    gone(session) {
      busy.delete(session);
      clearTimeout(held.get(session)?.timer);
      held.delete(session);
    },
    stop() {
      for (const id of [...held.keys()]) release(id);
    }
  };
}

// js/opencode/channel.ts
var CASE_BATCH_MS = Number(process.env[envName("OPENCODE_BATCH_MS")]) || 5e3;
var CASE_BATCH_CAP = 20;
var PENDING_MAX_MS = Number(process.env[envName("OPENCODE_PENDING_MS")]) || 12e4;
function toPile(frame) {
  if (!frame || frame.type !== "message" || isDirectWord(frame)) return false;
  const rk = roomKind(frame);
  if ((frame.origin ?? classifyOrigin(frame)) === "human" && !rk?.phase && !rk?.aside && !askFromPerson(frame))
    return false;
  return !addressedToMine(frame) || stackOf(frame) === "batch";
}
var RIDERS_MAX = 500;
var MARKS_KEPT = 500;
function setupChannel(ctx, say, freshestRoot, parents = /* @__PURE__ */ new Map(), onStop = () => {
}, leads = NO_LEADS, prompted = () => {
}) {
  const W4 = words(OPENCODE);
  const P = words(PLUGIN);
  const unshare = shareLineage(parents);
  const halts = createHalts(
    (s) => parents.get(s) ?? processParent(s),
    authDir,
    (id, message) => say(W4.haltUnwritten(id, message), "warning"),
    (id, message, kept2) => say(W4.haltUnlifted(id, message, kept2), "warning")
  );
  async function accepting(id) {
    try {
      const info = await ctx.session.get({ sessionID: id });
      return !(info?.time?.archived ?? info?.data?.time?.archived);
    } catch {
      return false;
    }
  }
  async function deliver(session2, text2, frame = W4.frame(), delivery = "steer", child = false) {
    let id = session2;
    if (child && (!id || !await accepting(id))) {
      say(W4.childGone(frame, id ?? "?", text2.slice(0, 120)), "error");
      return null;
    }
    if (id && !await accepting(id)) {
      say(W4.sessionClosed(id, frame), "warning");
      id = null;
    }
    id ??= freshestRoot();
    if (id && id !== session2 && !await accepting(id)) id = null;
    if (!id) {
      say(W4.nowhere(frame, text2.slice(0, 120)), "error");
      return null;
    }
    if (halts.halted(id)) {
      say(W4.halted(frame, id), "warning");
      return null;
    }
    if (child && leads.ended(id)) {
      say(W4.childEnded(frame, id, text2.slice(0, 120)), "info");
      return null;
    }
    try {
      const r = await ctx.session.prompt({ sessionID: id, text: markFrame(text2), delivery });
      say(W4.delivered(frame, id), "info");
      const inbox = r?.id ?? r?.data?.id;
      const got = { session: id, inbox: typeof inbox === "string" ? inbox : null };
      prompted(got.session, got.inbox, delivery);
      return got;
    } catch (e) {
      say(W4.notDelivered(frame, id, e.message), "error");
      return null;
    }
  }
  const piles = /* @__PURE__ */ new Map();
  const takenEarly = /* @__PURE__ */ new Set();
  const tacts = setupTacts(
    (session2, text2, what, child) => deliver(session2, text2, what, "queue", child),
    takenEarly,
    freshestRoot,
    say
  );
  const tact = tacts.offer;
  function schedule(p) {
    if (p.timer) clearTimeout(p.timer);
    const wait = p.pending ? Math.max(0, p.pending.at + PENDING_MAX_MS - Date.now()) : CASE_BATCH_MS;
    p.timer = setTimeout(() => {
      p.timer = null;
      p.pending = null;
      flush(p);
    }, wait);
    p.timer.unref?.();
  }
  function flush(p) {
    if (p.timer) clearTimeout(p.timer);
    p.timer = null;
    const frames = fresh(p, p.held.splice(0));
    if (!frames.length) return;
    if (!frames.some((f) => addressedToMine(f))) {
      p.riders.push(...frames);
      p.riders.splice(0, Math.max(0, p.riders.length - RIDERS_MAX));
      return;
    }
    const at = Date.now();
    p.pending = { session: "", inbox: null, at };
    const text2 = [
      batchHead([...fresh(p, p.riders.splice(0)), ...frames]),
      ...batchLines(frames)
    ].join("\n");
    void deliver(p.session, text2, W4.caseBatch(frames.length), "queue", p.child).then((got) => {
      const inbox = got?.inbox && !takenEarly.delete(got.inbox) ? got.inbox : null;
      p.pending = got && inbox ? { session: got.session, inbox, at } : null;
      if (p.held.length) schedule(p);
    });
  }
  function pile(session2, child, frame) {
    if (session2 && halts.halted(session2)) {
      const what = frame.id != null ? W4.frameId(String(frame.id)) : W4.frameNoId();
      return say(W4.halted(what, session2), "warning");
    }
    const key = `${child ? "child" : "root"}:${session2 ?? ""}`;
    let p = piles.get(key);
    if (!p)
      piles.set(
        key,
        p = {
          session: session2,
          child,
          held: [],
          riders: [],
          timer: null,
          pending: null,
          marks: /* @__PURE__ */ new Set()
        }
      );
    if (frame.id && p.held.some((f) => f.id === frame.id)) return;
    p.held.push(frame);
    if (!p.pending && p.held.length >= CASE_BATCH_CAP) return flush(p);
    if (!p.timer) schedule(p);
  }
  function noteOwn(p, keys) {
    if (!p) return;
    for (const k of keys ?? []) p.marks.add(k);
    for (const old of p.marks) if (p.marks.size > MARKS_KEPT) p.marks.delete(old);
  }
  const fresh = (p, fs) => fs.filter((f) => !eventIn(f, (k) => p.marks.has(k)));
  function riding(ps) {
    const got = ps.flatMap((p) => fresh(p, p.riders.splice(0)));
    return got.length ? [batchHead(got)] : [];
  }
  function loud(session2, text2, child = false) {
    say(text2, "error");
    void deliver(session2, text2, W4.frame(), "steer", child);
  }
  function batch(session2, child, ev, what) {
    noteOwn(piles.get(`${child ? "child" : "root"}:${session2 ?? ""}`), ev.marks);
    if (!ev.text) return;
    if (launcherWordIn(session2, child, ev.frames))
      void deliver(session2, ev.text, what, "steer", child);
    else if (!tact(session2, child, ev, what)) void deliver(session2, ev.text, what, "queue", child);
  }
  const launcherWordIn = (session2, child, frames) => {
    const launcher = child ? leads.launcherOf(session2 ?? "") : null;
    return !!frames?.some((f) => fromLauncher(f, launcher));
  };
  function dropPile(key) {
    const p = piles.get(key);
    if (p?.timer) clearTimeout(p.timer);
    piles.delete(key);
  }
  const session = () => ctx.session;
  const cuts = createCuts({
    stopOf: (id) => halts.stopOf(id),
    halted: (id) => halts.halted(id),
    canInterrupt: () => typeof session().interrupt === "function",
    interrupt: (id) => session().interrupt({ sessionID: id, resume: false }),
    dropped: (id) => {
      for (const k of ["child", "root"]) dropPile(`${k}:${id}`);
      tacts.gone(id);
    },
    refused: (id, why, last) => say(W4.notDelivered(W4.frame(), id, why), last ? "error" : "warning")
  });
  const cut = cuts.cut;
  function stopped(session2, text2, child) {
    say(text2, "error");
    dropPile(`${child ? "child" : "root"}:${session2 ?? ""}`);
    if (!session2) return;
    halts.stop(session2, child ? null : text2);
    cut(session2);
    for (const d of descendantsOf(session2, parents)) cut(d);
    onStop(session2);
  }
  return {
    status(session2, on) {
      if (on) tacts.busy(session2);
      else this.taken(session2);
    },
    gone(session2) {
      tacts.gone(session2);
      halts.gone(session2);
      cuts.forget(session2);
    },
    // Each reading cuts the descendants this instance serves, a child born during the wait too;
    // other instances cut theirs by the same stops (plugin.ts sweep).
    halted(session2, signal) {
      return cuts.outcome(() => {
        if (!session2) return [];
        this.halt(session2);
        return [session2, ...processDescendants(session2)];
      }, signal);
    },
    halt(session2) {
      if (!halts.halted(session2)) return false;
      cut(session2);
      for (const d of descendantsOf(session2, parents)) cut(d);
      return true;
    },
    taken(session2, inbox) {
      tacts.taken(session2, inbox);
      let matched = false;
      for (const p of piles.values()) {
        if (!p.pending || (inbox ? p.pending.inbox !== inbox : p.pending.session !== session2))
          continue;
        matched = true;
        p.pending = null;
        flush(p);
      }
      if (inbox && !matched) {
        takenEarly.add(inbox);
        for (const old of takenEarly) if (takenEarly.size > 100) takenEarly.delete(old);
      }
    },
    stop() {
      unshare();
      tacts.stop();
      cuts.stop();
      for (const p of piles.values()) {
        p.pending = null;
        flush(p);
      }
    },
    ride(session2) {
      if (halts.halted(session2)) return null;
      const own = [...piles.values()].filter(
        (p) => !p.child && (p.session === session2 || !p.session && freshestRoot() === session2)
      );
      return riding(own).join("\n") || null;
    },
    stopWord(session2) {
      const word2 = halts.wordOf(session2, P.stoppedAny());
      return word2 === null ? null : markFrame(P.stoppedTurn(word2));
    },
    onEvent(session2, params, child = false) {
      const ev = params?.data;
      if (!ev || typeof ev !== "object") return;
      switch (ev.kind) {
        case "frame": {
          const frame = ev.frame ?? null;
          if (frame?.type === "hello") return say(P.listening(), "info");
          if (frame?.type === "status") return;
          const steers = !!frame && launcherWordIn(session2, child, [frame]);
          if (frame && !steers && toPile(frame)) return pile(session2, child, frame);
          const own = piles.get(`${child ? "child" : "root"}:${session2 ?? ""}`);
          noteOwn(own, deliveryKeys(frame));
          void deliver(
            session2,
            [...riding(own ? [own] : []), frameToText(frame, ev.raw ?? "")].join("\n"),
            frame?.id != null ? W4.frameId(String(frame.id)) : W4.frameNoId(),
            "steer",
            child
          );
          return;
        }
        // A child's bridge word goes only to it (child): it is not the root's (#6625).
        case "dead":
          loud(session2, P.dead(String(ev.code)), child);
          return;
        case "stopped":
          stopped(session2, P.stopped(ev.text ?? ""), child);
          return;
        case "stale":
          return batch(session2, child, ev, W4.staleBatch());
        case "backlog":
          return batch(session2, child, ev, W4.wakeBatch(ev.frames?.length ?? 0));
        case "lost":
          if (ev.text) loud(session2, ev.text, child);
          return;
        case "resumed":
          if (ev.text) {
            say(ev.text, "warning");
            void deliver(session2, ev.text, W4.resumedLabel(), "steer", child);
          }
          return;
        case "held":
          if (params?.data?.automatic === false) {
            halts.held(session2);
            for (const s of session2 ? [session2, ...descendantsOf(session2, parents)] : []) {
              cuts.forget(s);
            }
          }
          say(W4.held(ev.key ?? ""), "info");
          return;
        case "released":
          say(W4.released(ev.key ?? "", ev.text ?? ""), "warning");
          return;
        case "evicted":
          loud(session2, P.evicted(String(ev.code)), child);
          return;
        case "alive":
          loud(session2, P.alive(ev.version ?? ""), child);
          return;
        case "note":
          if (ev.text) say(P.note(ev.text), "warning");
          return;
        default:
          return;
      }
    }
  };
}

// js/opencode/commands.ts
import { readFileSync as readFileSync11, realpathSync as realpathSync4 } from "node:fs";
import { dirname as dirname3 } from "node:path";
function slashOf(markdown) {
  if (!markdown.startsWith("---")) return false;
  const end = markdown.indexOf("\n---", 3);
  if (end < 0) return false;
  const head = markdown.slice(3, end);
  return /^slash:\s*true\s*$/m.test(head);
}
function commandText(id, args) {
  return words(OPENCODE).commandHead(id) + args.trim();
}
var canon3 = (p) => {
  try {
    return realpathSync4(p);
  } catch {
    return null;
  }
};
function skillCommands(list) {
  const roots = /* @__PURE__ */ new Map();
  for (const s of list) {
    const root = bridgeRoot(s);
    const c = root ? canon3(root) : null;
    if (!c) continue;
    const source = skillLock(c)?.[BRIDGE_SKILL]?.source;
    roots.set(c, typeof source === "string" ? source : null);
  }
  const out2 = [];
  for (const s of list) {
    const id = String(s?.id ?? "");
    const path = typeof s?.path === "string" ? s.path : null;
    if (!id || !path) continue;
    const root = canon3(dirname3(dirname3(path)));
    if (!root || !roots.has(root)) continue;
    const source = roots.get(root);
    if (source && skillLock(root)?.[id]?.source !== source) continue;
    let text2;
    try {
      text2 = readFileSync11(path, "utf8");
    } catch {
      continue;
    }
    if (!slashOf(text2)) continue;
    out2.push({ id, description: snippet(String(s?.description ?? "")) });
  }
  return out2.sort((a, b) => a.id.localeCompare(b.id));
}
async function listSkills(ctx) {
  const res = await ctx.skill.list();
  return skillCommands(Array.isArray(res) ? res : res?.data ?? []);
}
async function setupCommands(ctx, say) {
  const state2 = { commands: await listSkills(ctx) };
  await ctx.command.transform((editor) => {
    for (const { id, description } of state2.commands) {
      editor.add({
        name: id,
        description,
        async execute({ sessionID, prompt, delivery }) {
          await ctx.session.prompt({
            ...prompt,
            sessionID,
            text: commandText(id, String(prompt?.text ?? "")),
            delivery
          });
        }
      });
    }
  });
  if (state2.commands.length) say(words(OPENCODE).commandsCount(state2.commands.length), "info");
  return {
    async refresh() {
      const next = await listSkills(ctx);
      const same = next.length === state2.commands.length && next.every((c, i) => c.id === state2.commands[i]?.id);
      state2.commands = next;
      if (!same) await ctx.command.reload();
    }
  };
}

// js/opencode/notice.ts
var COMPLETED = /<subagent sessionID=\\?"([^"\\]+)\\?" state=\\?"completed\\?"/g;
function* texts(messages) {
  for (const m of messages)
    for (const part of Array.isArray(m?.content) ? m.content : []) {
      if (part?.type === "text" && typeof part.text === "string") yield part.text;
      else if (part?.type === "tool-result") yield JSON.stringify(part.result ?? "");
    }
}
function annotate(req, nameOf) {
  const seen = /* @__PURE__ */ new Set();
  for (const text2 of texts(req.messages ?? []))
    for (const [, child] of text2.matchAll(COMPLETED)) {
      if (!child || seen.has(child)) continue;
      seen.add(child);
      const name = nameOf(child);
      if (name) req.system.push({ type: "text", text: W3().notice(child, name) });
    }
}

// js/shared/reposigns.ts
import { readFileSync as readFileSync13, statSync as statSync4 } from "node:fs";
import { dirname as dirname4, join as join13, resolve as resolve6 } from "node:path";

// js/shared/cover.ts
import { readFileSync as readFileSync12 } from "node:fs";
import { join as join12 } from "node:path";
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
  const pairs = /* @__PURE__ */ new Map();
  for (const line of lines.slice(1, end)) {
    const kv = /^\s*('(?:[^']|'')*'|"(?:[^"\\]|\\.)*"|[^\s'"#][^:]*?)\s*:(?:\s+(.*))?$/.exec(line);
    if (kv) pairs.set(unquote(kv[1]), unquote(kv[2] ?? ""));
  }
  return pairs;
}
var LEAD2 = /^[\s`'"<]*/;
var SLUG = /(?:^|[\s(`'",;])(@[\w.-]+\/[\w.-]+)/g;
var SHORT = /(?:^|[\s(`'",;])(r\d+)(?=$|[\s)`'",;.:])/g;
var esc = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
var roleRef = (q, flags = "") => new RegExp(
  `${flags.includes("g") ? "" : "^"}#(\\d+)\\s*${esc(q[0])}[\\s\\S]*?${esc(q[1])}`,
  flags
);
var distinct = (re, v) => [
  ...new Set([...v.matchAll(re)].map((m) => m[1]))
];
function seatOfPairs(pairs, keys = COVER) {
  const W4 = words(ROOT_SEAT);
  const graph = pairs.get(keys.graph)?.trim();
  if (!graph) return { why: W4.noKey(keys.file, keys.graph) };
  const role = pairs.get(keys.role)?.trim();
  if (!role) return { why: W4.noKey(keys.file, keys.role) };
  const g = graph.replace(LEAD2, "");
  if (!/^(?:@[\w.-]+\/[\w.-]+|r\d+)(?=$|[\s)`'",;.:])/.test(g))
    return { why: W4.noGraph(keys.file, keys.graph) };
  const slugs = distinct(SLUG, ` ${g}`);
  const shorts = distinct(SHORT, ` ${g}`);
  if (slugs.length > 1 || shorts.length > 1)
    return { why: W4.manyGraphs(keys.file, keys.graph, [...slugs, ...shorts].join(", ")) };
  const r = role.replace(LEAD2, "");
  const roles = distinct(roleRef(keys.roleQuotes, "g"), r);
  if (roles.length > 1)
    return { why: W4.manyRoles(keys.file, keys.role, roles.map((n2) => `#${n2}`).join(", ")) };
  const first = roleRef(keys.roleQuotes).exec(r);
  if (!first)
    return {
      why: W4.noRoleRef(keys.file, keys.role, `#N ${keys.roleQuotes[0]}…${keys.roleQuotes[1]}`)
    };
  return { realm: slugs[0] ?? shorts[0], karta: first[1] };
}
function readCover(dir, keys = COVER) {
  let text2;
  try {
    text2 = readFileSync12(join12(dir, keys.file), "utf8");
  } catch {
    return null;
  }
  const pairs = frontMatter(text2);
  if (!pairs) return { why: words(ROOT_SEAT).noFrontmatter(keys.file) };
  return seatOfPairs(pairs, keys);
}

// js/shared/reposigns.ts
var exists = (path) => {
  try {
    statSync4(path);
    return true;
  } catch {
    return false;
  }
};
var text = (path) => {
  try {
    return readFileSync13(path, "utf8");
  } catch {
    return null;
  }
};
function repoRoot(dir) {
  let at = resolve6(dir);
  for (; ; ) {
    if (exists(join13(at, ".git"))) return at;
    const up = dirname4(at);
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
  const agents = text(join13(root, cover.file));
  const pairs = agents === null ? null : frontMatter(agents);
  const signs = {
    cover: !!pairs && (pairs.has(cover.graph) || pairs.has(cover.role)),
    stamp: agents !== null && keys.stamp.test(agents),
    hooks: {
      "claude-code": startHook(text(join13(root, keys.settings)), keys.startMark),
      opencode: exists(join13(root, keys.rituals))
    }
  };
  const any = signs.cover || signs.stamp || signs.hooks["claude-code"] || signs.hooks.opencode;
  const complete = signs.cover && signs.stamp && (harness === null || signs.hooks[harness]);
  const verdict = !any ? "invite" : complete ? "aligned" : "partial";
  return { root, ...signs, verdict };
}

// js/opencode/onboardstart.ts
function createOnboardStart(ctx, child = () => false, halted = () => false) {
  const seen = /* @__PURE__ */ new Set();
  return {
    forget: (session) => void seen.delete(session),
    async prompt(session) {
      if (seen.has(session) || child(session) || halted(session)) return null;
      try {
        const response = await ctx.session.get({ sessionID: session });
        const raw = response;
        const info = raw?.data ?? raw;
        if (!info?.id || info.parentID || !info.location?.directory) return null;
        seen.add(session);
        const invite = repoSigns(info.location.directory, "opencode").verdict === "invite";
        return invite && !halted(session) ? words(ONBOARD_START).start() : null;
      } catch {
        return null;
      }
    }
  };
}

// js/opencode/inbox.ts
var TAKEN_MAX = 100;
var CANCELLED_MAX = 100;
var QUEUED_MAX = 100;
var add = (m, session, inbox, max = Infinity) => {
  const ids2 = m.get(session) ?? /* @__PURE__ */ new Set();
  m.set(session, ids2.add(inbox));
  if (ids2.size > max) ids2.delete(ids2.values().next().value);
  return ids2.size;
};
var drop = (m, session, inbox) => {
  const ids2 = m.get(session);
  if (!ids2?.delete(inbox)) return false;
  if (!ids2.size) m.delete(session);
  return true;
};
function createInboxBook(overflow) {
  const queued = /* @__PURE__ */ new Map();
  const taken = /* @__PURE__ */ new Map();
  const cancelled = /* @__PURE__ */ new Map();
  const books = [queued, taken, cancelled];
  return {
    delivered(session, inbox) {
      if (drop(queued, session, inbox)) return true;
      add(taken, session, inbox, TAKEN_MAX);
      return false;
    },
    cancelled(session, inbox) {
      if (!drop(queued, session, inbox)) add(cancelled, session, inbox, CANCELLED_MAX);
    },
    prompted(session, inbox) {
      if (drop(taken, session, inbox)) return true;
      if (drop(cancelled, session, inbox)) return false;
      const waiting = add(queued, session, inbox);
      if (waiting === QUEUED_MAX + 1) overflow?.(session, waiting);
      return false;
    },
    forget(session) {
      for (const m of books) m.delete(session);
    },
    clear() {
      for (const m of books) m.clear();
    }
  };
}

// js/opencode/pulse.ts
var ENDS = /* @__PURE__ */ new Map([
  ["session.execution.succeeded", "idle"],
  ["session.execution.failed", "failed"],
  ["session.execution.interrupted", "interrupted"]
]);
var RETRY_MS = 2e3;
function createPulseFeed(opts) {
  const words3 = /* @__PURE__ */ new Map();
  const inboxes = createInboxBook(opts.overflow);
  const unsent = /* @__PURE__ */ new Set();
  const retries = /* @__PURE__ */ new Map();
  let stopped = false;
  const tell = (session, change) => {
    if (stopped) return;
    const was = words3.get(session) ?? {};
    const now2 = { ...was, ...change };
    if (JSON.stringify(now2) === JSON.stringify(was) && !unsent.has(session)) return;
    words3.set(session, now2);
    const bridge = opts.bridgeOf(session);
    if (!bridge) return void unsent.add(session);
    unsent.delete(session);
    void bridge.request(method("pulse"), now2, { timeoutMs: 5e3 }).catch(() => {
      if (stopped || words3.get(session) !== now2) return;
      unsent.add(session);
      if (retries.has(session)) return;
      const t = setTimeout(() => {
        retries.delete(session);
        if (unsent.has(session)) tell(session, {});
      }, RETRY_MS);
      t.unref?.();
      retries.set(session, t);
    });
  };
  const at = () => (/* @__PURE__ */ new Date()).toISOString();
  const ended2 = (session, to) => {
    const was = words3.get(session)?.state;
    if (to !== "idle" || was === "busy") return tell(session, { state: to, turn_at: at() });
    if (was === void 0) tell(session, { state: "idle" });
    else if (unsent.has(session)) tell(session, {});
  };
  const unretry = (session) => {
    clearTimeout(retries.get(session));
    retries.delete(session);
  };
  return {
    onEvent(ev) {
      const session = ev?.data?.sessionID;
      if (typeof session !== "string") return;
      const type = ev?.type;
      const end = ENDS.get(type);
      if (end) return ended2(session, end);
      switch (type) {
        case "session.execution.started":
          return tell(session, { state: "busy" });
        case "session.status": {
          const s = ev.data?.status?.type;
          if (typeof s !== "string") return;
          if (s === "idle") ended2(session, "idle");
          else tell(session, { state: "busy" });
          return;
        }
        case "session.idle":
          return ended2(session, "idle");
        case "session.inbox.delivered": {
          const inbox = ev.data?.inboxID;
          if (typeof inbox === "string" && inboxes.delivered(session, inbox))
            tell(session, { read_at: at() });
          return;
        }
        case "session.inbox.cancelled": {
          const inbox = ev.data?.inboxID;
          if (typeof inbox === "string") inboxes.cancelled(session, inbox);
          return;
        }
      }
    },
    prompted(session, inbox) {
      if (inbox && inboxes.prompted(session, inbox)) tell(session, { read_at: at() });
    },
    seated(session) {
      if (!words3.has(session)) return;
      unsent.add(session);
      tell(session, {});
    },
    forget(session) {
      words3.delete(session);
      unsent.delete(session);
      unretry(session);
      inboxes.forget(session);
    },
    stop() {
      stopped = true;
      for (const session of [...retries.keys()]) unretry(session);
      words3.clear();
      inboxes.clear();
    }
  };
}

// js/opencode/rootseat.ts
var rootSeatMs = () => Number(process.env[envName("ROOT_SEAT_MS")] || 15e3);
var rootSeatEnabled = () => process.env[envName("ROOT_SEAT")] !== "0";
var ceilingMs = () => rootSeatMs() + Math.min(rootSeatMs(), 5e3);
var pause = (ms) => new Promise((r) => setTimeout(r, ms).unref?.());
var oneLine = (text2) => {
  const t = text2.replace(/\s+/g, " ").trim();
  return t.length > 300 ? `${t.slice(0, 299)}…` : t;
};
function createRootSeats(d) {
  const W4 = words(ROOT_SEAT);
  const seatings = /* @__PURE__ */ new Map();
  const dead = /* @__PURE__ */ new Set();
  const told = /* @__PURE__ */ new Set();
  let stopped = false;
  let line = Promise.resolve();
  function start(session) {
    const known = seatings.get(session);
    if (known) return known;
    const no = (word2) => ({ word: word2, seated: false });
    const t = {
      abort: new AbortController(),
      done: false,
      begun: false,
      promise: Promise.resolve(no(null))
    };
    const cancelled = () => stopped || t.abort.signal.aborted || d.halted(session);
    seatings.set(session, t);
    const p = (async () => {
      const where = await d.directoryOf(session);
      if (cancelled() || !where) return no(null);
      const cover = readCover(where);
      if (cover === null) return no(null);
      if ("why" in cover) return no(W4.notSeated(cover.why));
      const before = line;
      const turn = before.then(() => {
        if (cancelled()) return { cancelled: true };
        t.begun = true;
        return d.seat(session, cover.realm, cover.karta, cancelled);
      });
      line = before.then(() => Promise.race([turn, pause(ceilingMs())])).catch(() => {
      });
      const r = await turn;
      if (cancelled() || "cancelled" in r) {
        if (t.begun) await d.release(session);
        return no(null);
      }
      if ("error" in r) return no(W4.notSeated(W4.refused(oneLine(r.error))));
      if ("other" in r)
        return {
          word: r.uncompared ? W4.heldUncompared(
            r.other.name,
            r.other.karta,
            r.other.realm || W4.unknownRealm(),
            r.uncompared
          ) : W4.ownOther(r.other.name, r.other.karta, r.other.realm || W4.unknownRealm()),
          seated: true
        };
      return {
        word: (r.provisional === true ? W4.seated : W4.ownSeated)(
          r.place,
          cover.karta,
          r.realm ?? cover.realm,
          COVER.file
        ),
        seated: true
      };
    })().catch(async (e) => {
      if (cancelled()) {
        if (t.begun) await d.release(session);
        return no(null);
      }
      return no(W4.notSeated(W4.refused(oneLine(e.message))));
    }).finally(() => {
      t.done = true;
      if (t.begun) d.finished(session);
    });
    t.promise = p;
    return t;
  }
  return {
    async word(session) {
      if (!rootSeatEnabled() || stopped || dead.has(session)) return null;
      if (told.has(session)) return null;
      told.add(session);
      if (d.halted(session)) return null;
      const ms = rootSeatMs();
      const late = W4.notSeated(W4.late(Math.round(ms / 100) / 10));
      const seating = start(session);
      const aborted = new Promise(
        (r) => seating.abort.signal.addEventListener("abort", () => r(null), { once: true })
      );
      const first = await Promise.race([seating.promise, pause(ms).then(() => null), aborted]);
      if (stopped || dead.has(session) || seating.abort.signal.aborted || d.halted(session))
        return null;
      if (first) return first.word;
      void seating.promise.then((t) => {
        if (!stopped && !dead.has(session) && !d.halted(session) && t.seated && t.word && seatings.get(session) === seating)
          d.tell(session, t.word);
      });
      return late;
    },
    forget(session) {
      dead.add(session);
      d.cancel(session);
      seatings.get(session)?.abort.abort();
    },
    stop() {
      stopped = true;
      for (const [s, t] of seatings)
        if (!t.done) {
          d.cancel(s);
          t.abort.abort();
        }
    }
  };
}

// js/opencode/usage.ts
var DEBOUNCE_MS = Number(process.env[envName("USAGE_DEBOUNCE_MS")] || 1e4);
var n = (v) => typeof v === "number" && Number.isFinite(v) ? v : 0;
var spent = (t) => n(t?.input) + n(t?.output) + n(t?.reasoning) + n(t?.cache?.write);
var inWindow = (t) => n(t?.input) + n(t?.cache?.read) + n(t?.cache?.write);
var kinds = (t) => ({
  input: n(t?.input),
  output: n(t?.output) + n(t?.reasoning),
  cache_read: n(t?.cache?.read),
  cache_write: n(t?.cache?.write)
});
function createUsageFeed(opts) {
  const bySession = /* @__PURE__ */ new Map();
  const timers = /* @__PURE__ */ new Map();
  const windows = /* @__PURE__ */ new Map();
  let listed = null;
  const loadWindows = () => listed ??= (async () => {
    try {
      const out2 = await opts.listModels();
      const list = Array.isArray(out2) ? out2 : out2?.data ?? out2?.models ?? [];
      for (const m of list) {
        const ctx = n(m?.limit?.context);
        const id = m?.id ?? m?.modelID;
        const prov = m?.providerID ?? m?.provider?.id;
        if (ctx && id) windows.set(`${prov ?? ""}/${id}`, ctx);
      }
    } catch {
      listed = null;
    }
  })();
  const inFlight = /* @__PURE__ */ new Map();
  const send = async (session, timeoutMs) => {
    const u = bySession.get(session);
    if (!u) return;
    const { ref, ...p } = u;
    if (ref && windows.has(ref)) p.window = windows.get(ref);
    await opts.bridgeOf(session)?.request(method("usage"), p, { timeoutMs }).catch(() => {
    });
  };
  const flush = (session, timeoutMs = 1e4) => {
    clearTimeout(timers.get(session));
    timers.delete(session);
    const p = (inFlight.get(session) ?? Promise.resolve()).then(() => send(session, timeoutMs));
    inFlight.set(session, p);
    void p.finally(() => {
      if (inFlight.get(session) === p) inFlight.delete(session);
    });
    return p;
  };
  const schedule = (session) => {
    if (!timers.has(session)) {
      const t = setTimeout(() => void flush(session), DEBOUNCE_MS);
      t.unref?.();
      timers.set(session, t);
    }
  };
  return {
    onEvent(ev) {
      const session = ev?.data?.sessionID;
      if (typeof session !== "string") return;
      const u = bySession.get(session) ?? {};
      switch (ev?.type) {
        case "session.step.started": {
          const m = ev.data?.model;
          if (m?.id) {
            u.ref = `${m.providerID ?? ""}/${m.id}`;
            u.model = String(m.id);
          }
          void loadWindows();
          break;
        }
        case "session.step.ended":
          if (!ev.data?.tokens) return;
          u.context = inWindow(ev.data.tokens);
          break;
        case "session.usage.updated":
          if (!ev.data?.tokens) return;
          Object.assign(u, { tokens: spent(ev.data.tokens), ...kinds(ev.data.tokens) });
          break;
        default:
          return;
      }
      bySession.set(session, u);
      schedule(session);
    },
    // No pending snapshot — wait for the one in flight: the bridge does not leave the seat before its answer.
    flush: (session) => timers.has(session) ? flush(session, 3e3) : inFlight.get(session) ?? Promise.resolve(),
    forget(session) {
      clearTimeout(timers.get(session));
      timers.delete(session);
      bySession.delete(session);
    },
    stop() {
      for (const t of timers.values()) clearTimeout(t);
      timers.clear();
      bySession.clear();
    }
  };
}

// js/opencode/waits.ts
var WAIT_MS = Number(process.env[envName("PERMISSION_WAIT_MS")]) || 2e4;
var RESOURCES = 3;
var RESOURCE_MAX = 160;
var toldInProcess = () => globalThis[`${GLOBAL_PREFIX}ChildWordsTold`] ??= /* @__PURE__ */ new Set();
var askWord = (who, action, resources) => {
  const cut = resources.slice(0, RESOURCES).map((r) => {
    const one = r.replace(/\s+/g, " ").trim();
    return one.length > RESOURCE_MAX ? `${one.slice(0, RESOURCE_MAX)}…` : one;
  });
  const n2 = resources.length - RESOURCES;
  const more = n2 > 0 ? W3().more(n2) : "";
  const what = cut.length ? `${action}: ${cut.join("; ")}${more}` : action;
  return W3().ask(who, what);
};
var interruptWord = (who, reason2) => W3().interrupt(who, reason2);
function createWaits(ctx, d) {
  const home = homeOf(ctx);
  const answered = /* @__PURE__ */ new Set();
  const told = toldInProcess();
  const once = (key) => {
    if (told.has(key)) return false;
    told.add(key);
    if (told.size > 1e3) told.delete(told.values().next().value);
    return true;
  };
  let stopped = false;
  async function childOf(sessionID, ev) {
    const res = await Promise.resolve().then(() => ctx.session.get({ sessionID })).catch(() => null);
    const s = res?.data ?? res;
    const parent = s?.parentID;
    if (typeof parent !== "string" || !parent) return null;
    const dir = s?.location?.directory ?? ev?.location?.directory;
    if (home && typeof dir === "string" && dir && dir !== home.directory) return null;
    const title = typeof s?.title === "string" ? s.title.trim() : "";
    return { parent, who: title ? `«${title}» (${sessionID})` : sessionID };
  }
  async function asked(ev) {
    const { id, sessionID, action, resources } = ev?.data ?? {};
    if (typeof id !== "string" || typeof sessionID !== "string" || told.has(id)) return;
    await sleep(WAIT_MS);
    if (stopped || answered.has(id)) return;
    const kid = await childOf(sessionID, ev);
    if (!kid || answered.has(id) || !once(id)) return;
    const list = Array.isArray(resources) ? resources.map(String) : [];
    await d.tell(kid.parent, askWord(kid.who, String(action ?? W3().action()), list), true);
  }
  async function interrupted(ev) {
    const { sessionID, reason: reason2 } = ev?.data ?? {};
    if (typeof sessionID !== "string" || typeof reason2 !== "string" || reason2 === "user") return;
    if (d.isLead(sessionID)) return;
    const kid = await childOf(sessionID, ev);
    const key = typeof ev?.id === "string" ? ev.id : `${sessionID}@${ev?.created ?? reason2}`;
    if (!kid || stopped || d.isLead(sessionID) || !once(key)) return;
    await d.tell(kid.parent, interruptWord(kid.who, reason2), false);
  }
  return {
    onEvent(ev) {
      switch (ev?.type) {
        case "permission.asked":
          void asked(ev);
          return;
        case "permission.replied":
          if (typeof ev.data?.requestID !== "string") return;
          answered.add(ev.data.requestID);
          if (answered.size > 1e3) answered.delete(answered.values().next().value);
          return;
        case "session.execution.interrupted":
          void interrupted(ev);
          return;
      }
    },
    stop() {
      stopped = true;
    }
  };
}

// js/opencode/plugin.ts
var SWEEP_MS = 5e3;
var CHANNEL_DOWN = "channel_down";
var nothing = () => {
};
async function setup(ctx) {
  const W4 = words(OPENCODE);
  const say = (text2, level) => {
    process.stderr.write(`[${PRODUCT}${level === "info" ? "" : "/" + level}] ${text2}
`);
  };
  const roots = /* @__PURE__ */ new Map();
  const seen = /* @__PURE__ */ new Map();
  const parents = /* @__PURE__ */ new Map();
  async function rootOf(sessionID) {
    const known = roots.get(sessionID);
    if (known) {
      seen.set(known, Date.now());
      return known;
    }
    let root = sessionID;
    try {
      const visited = /* @__PURE__ */ new Set();
      for (; ; ) {
        visited.add(root);
        const res = await ctx.session.get({ sessionID: root });
        const parent = res?.parentID ?? res?.data?.parentID;
        if (!parent || visited.has(parent)) break;
        parents.set(root, parent);
        root = parent;
      }
    } catch {
      seen.set(root, Date.now());
      return root;
    }
    roots.set(sessionID, root);
    seen.set(root, Date.now());
    return root;
  }
  function freshestRoot() {
    let best = null;
    let at = -1;
    for (const [id, t] of seen) {
      if (t <= at) continue;
      best = id;
      at = t;
    }
    return best;
  }
  let onChannel = () => {
  };
  let ch = null;
  const pulse = createPulseFeed({
    bridgeOf: (s) => half.bridgeOf(s),
    overflow: (s, n2) => say(W4.pulseOverflow(s, n2), "warning")
  });
  try {
    const c0 = setupChannel(
      ctx,
      say,
      freshestRoot,
      parents,
      () => sweepAll(),
      { ended: (s) => half.ended(s), launcherOf: (s) => half.launcherOf(s) },
      pulse.prompted
    );
    ch = c0;
    onChannel = (s, p, c) => c0.onEvent(s, p, c);
  } catch (e) {
    say(W4.channelDown(e.message), "error");
  }
  let half = idleHalf();
  const stops2 = createHalts((s) => parents.get(s), authDir, nothing, nothing);
  const closed = (s) => half.ended(s) || stops2.halted(s);
  let flushUsage = (_s) => Promise.resolve();
  const heard = (s, p, c) => {
    onChannel(s, p, c);
    const kind = p?.data?.kind;
    if (s && (kind === "held" || kind === "attached" || kind === "resumed" || p?.data?.frame?.type === "hello"))
      pulse.seated(s);
  };
  try {
    half = await setupTools(
      ctx,
      say,
      heard,
      rootOf,
      (s) => flushUsage(s),
      closed,
      // No channel half — no interrupt: the order's stop is refused, not reported executed.
      (s, signal) => ch ? ch.halted(s, signal) : Promise.resolve(CHANNEL_DOWN)
    );
  } catch (e) {
    say(words(PLUGIN).notRaised(e.message), "error");
  }
  const rootSeats = createRootSeats({
    directoryOf: (s) => sessionDirectory(ctx, s),
    halted: (s) => !ch || stops2.halted(s),
    seat: (s, realm, karta, cancelled) => half.seatRoot(s, realm, karta, cancelled),
    cancel: (s) => half.cancelSeat(s),
    release: (s) => half.releaseSeat(s),
    finished: (s) => half.finishSeat(s),
    tell: (s, text2) => heard(s, { logger: LOGGERS.channel, data: { kind: "resumed", text: text2 } })
  });
  const onboard = createOnboardStart(
    ctx,
    (s) => parents.has(s) || roots.has(s) && roots.get(s) !== s,
    closed
  );
  try {
    await ctx.session.hook("prompt", async (p) => {
      const sid = String(p.sessionID);
      const root = await rootOf(sid) === sid;
      const word2 = await half.launch(sid, p.prompt.text);
      if (word2) p.prompt.text = withWord(p.prompt.text, word2);
      const [seat, invitation] = root ? await Promise.all([rootSeats.word(sid), onboard.prompt(sid)]) : [null, null];
      if (seat) p.prompt.text = withWord(p.prompt.text, seat);
      if (invitation && !closed(sid)) p.prompt.text = withWord(p.prompt.text, invitation);
      const counts = root ? ch?.ride(sid) : null;
      if (counts) p.prompt.text = `${p.prompt.text}

${markFrame(counts)}`;
    });
  } catch (e) {
    say(W4.launchDown(e.message), "error");
  }
  try {
    for (const hook of ["context", "compaction"])
      await ctx.session.hook(hook, (req) => {
        annotate(req, (s) => half.leadOf(s));
        const stop = hook === "context" ? ch?.stopWord(String(req.sessionID)) : null;
        if (stop) req.system.push({ type: "text", text: stop });
      });
  } catch (e) {
    say(W4.noticeDown(e.message), "error");
  }
  let commands = { refresh: async () => {
  } };
  try {
    commands = await setupCommands(ctx, say);
  } catch (e) {
    say(W4.commandsDown(e.message), "error");
  }
  try {
    if (!await setupSkillReads(ctx)) say(W4.noPermissionHooks(), "warning");
  } catch (e) {
    say(W4.skillReadsDown(e.message), "error");
  }
  const usage = createUsageFeed({
    listModels: () => ctx.model.list(),
    bridgeOf: (s) => half.bridgeOf(s)
  });
  flushUsage = (s) => usage.flush(s);
  const keepalive = createKeepAlive(ctx, {
    holders: () => half.holders(),
    owns: (s) => half.owns(s),
    say: (t, level) => say(t, level ?? "warning")
  });
  const waits = createWaits(ctx, {
    tell: teller(ctx, say, closed),
    isLead: (s) => half.leadOf(s) !== null
  });
  const controller = new AbortController();
  void (async () => {
    try {
      for await (const event of ctx.event.subscribe({ signal: controller.signal })) {
        const ev = event;
        const id = ev?.data?.sessionID;
        half.onEvent(ev);
        keepalive.onEvent(ev);
        waits.onEvent(ev);
        pulse.onEvent(ev);
        switch (ev?.type) {
          case "session.deleted":
            if (!id) break;
            pulse.forget(id);
            rootSeats.forget(id);
            onboard.forget(id);
            roots.delete(id);
            seen.delete(id);
            parents.delete(id);
            ch?.gone(id);
            void usage.flush(id).finally(() => {
              usage.forget(id);
              half.forget(id);
            });
            break;
          case "session.created": {
            if (!id) break;
            if (ev.data?.title === keepaliveTitle()) break;
            const parent = ev.data?.parentID;
            if (typeof parent === "string") {
              parents.set(id, parent);
              void rootOf(parent).then((root) => {
                roots.set(id, root);
                seen.set(root, Date.now());
              });
            } else {
              void rootOf(id);
            }
            break;
          }
          // Moved to another folder (#6550 item 3): the seat goes to the instance of its new location.
          case "session.moved": {
            const loc = ev.data?.location;
            const to = typeof loc?.directory === "string" ? { directory: loc.directory, workspace: loc.workspaceID ?? null } : null;
            if (id) half.moved(id, to);
            break;
          }
          case "skill.updated":
            void commands.refresh();
            break;
          case "session.inbox.delivered":
          case "session.inbox.cancelled":
            if (id && typeof ev.data?.inboxID === "string") ch?.taken(id, ev.data.inboxID);
            break;
          case "session.idle":
            if (id) ch?.taken(id);
            break;
          // Whether a turn is busy — the attention tact waits for its end (channel.ts, #6569); retry is a turn too.
          case "session.status":
            if (id && typeof ev.data?.status?.type === "string")
              ch?.status(id, ev.data.status.type !== "idle");
            break;
          // A turn's end is not a subagent's end (#6625): only a pending usage snapshot here.
          case "session.execution.succeeded":
          case "session.execution.failed":
            if (id) void usage.flush(id);
            break;
          default:
            usage.onEvent(ev);
        }
      }
    } catch {
    }
  })();
  async function sweep() {
    for (const s of half.children()) {
      if (!parents.has(s)) await rootOf(s);
      if (ch?.halt(s)) half.halt(s);
    }
    for (const s of parents.keys()) ch?.halt(s);
  }
  const sweeper = setInterval(() => void sweep(), SWEEP_MS);
  sweeper.unref?.();
  const twins = createTwins(ctx, homeOf(ctx), {
    say,
    lost: (s, text2) => onChannel(s, { logger: LOGGERS.channel, data: { kind: "lost", text: text2 } }),
    holds: (r) => half.held(r),
    adopt: () => half.adopt(),
    sweep: () => void sweep()
  });
  return async () => {
    rootSeats.stop();
    clearInterval(sweeper);
    twins.leave();
    controller.abort();
    keepalive.stop();
    waits.stop();
    usage.stop();
    pulse.stop();
    ch?.stop();
    twins.left(await half.stop() || []);
  };
}
var plugin_default = { id: PRODUCT, setup };
export {
  plugin_default as default
};
