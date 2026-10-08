// js/delivery/lang.ts
var LANGS = ["en"];
var DEFAULT_LANG = "en";
function langOfServer(_url) {
  return "en";
}

// js/delivery/patterns/launch.ts
var LAUNCH_WORD = "start";
var word = LAUNCH_WORD.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
var LAUNCH_LINE = new RegExp(
  `^[ \\t]*${word}\\s+(\\S+)\\s+(\\S+)\\s+(?:case\\s+)?[№#]\\s?(\\d+)(?:[ \\t]+from[ \\t]+(@\\S+))?(?=\\s|$)`,
  "imu"
);

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
var DEFAULT_SERVER_URL = SERVER_URLS[DEFAULT_LANG];

// js/delivery/protocol.ts
var TOOL_PREFIX = `${PRODUCT}_`;
var tool = (name) => `${TOOL_PREFIX}${name}`;
var method = (name) => `${PRODUCT}/${name}`;
var LOGGERS = { channel: `${PRODUCT}-channel`, bridge: BRIDGE_NAME };
var ID_PREFIX = `${PRODUCT}-`;
var FRAME_MARK = `[${PRODUCT}]`;
var STRUCTURED_CAPABILITY = `${PRODUCT}/structured`;

// js/delivery/version.ts
var VERSION = "2.10.1";
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

// js/delivery/words/bridge-client.ts
var BRIDGE_CLIENT = {
  en: {
    failedToStart: (message) => `the bridge failed to start: ${message}`,
    exited: (code, signal, why) => `the bridge exited (code=${code}, signal=${signal})${why}`,
    lastFromBridge: (lines) => `; last from the bridge: ${lines}`,
    aborted: () => "call aborted",
    noAnswer: (method2, ms, why) => `${method2}: no answer in ${ms} ms${why}`,
    noWrites: () => "the bridge does not accept writes",
    sessionClosed: () => "session closed",
    emptyAnswer: () => "(empty answer)"
  }
};

// js/delivery/words/frame-text.ts
var FRAME_TEXT = {
  en: {
    frame: (id) => `frame ${id}`,
    yoursBelow: () => ` — yours in the lines below; `,
    noneYours: () => ` — none of them yours; `,
    count: (head, n2, mine) => `${head}: ${n2} records, yours ${mine}`,
    supersededLines: (gone) => `, ${gone} superseded lines of a key`,
    inFull: (cases) => `in full — ${cases || `${tool("channel")}(action="history")`}`,
    caseHistory: (args, since) => `${tool("case")}(${args}, since=${since})`
  }
};
var CASE_LINE = {
  en: {
    platform: () => "platform",
    quote: (s) => `“${s}”`
  }
};

// js/delivery/words/launch.ts
var LAUNCH = {
  en: {
    notSeated: (why, no, join4) => `Verstak: launch line — not seated: ${why}. A subagent takes only a satellite of its launcher's seat: if the launcher holds one, repeat verstak_stand and enter case #${no}: ${join4}; if not, the launcher takes a seat and launches you again; until then the work goes without the graph, the result as a word to the launcher.`,
    ownSeat: () => "in a seat of its own",
    notEntered: (place, no, why) => `Verstak: seated ${place}; did not enter case #${no} — ${why}. The seat stays.`,
    entered: (place, no) => `Verstak: seated ${place}, entered case #${no} — retell the brief as your first message in the case.`
  }
};

// js/delivery/words/pi.ts
var PI = {
  en: {
    broken: (list) => `Verstak: did not come up — ${list}`,
    channelPart: (message) => `channel: ${message}`,
    toolsPart: (message) => `tools: ${message}`,
    needLogin: (message) => `Verstak: sign-in needed — ${message}`,
    notUp: (name) => `${name}: the bridge is not up in this session`,
    calling: (name) => `Verstak: ${name}…`,
    stillWaiting: (name, seconds) => `Verstak: ${name} — still waiting, ${seconds} s`,
    serverChanged: (n2) => `Verstak: the server changed its tools — ${n2} registered in the session.`,
    server: () => "server",
    raised: (server, version, n2) => `Verstak: the bridge is up (${server} ${version}), tools in the session: ${n2}.`,
    raisedSignedIn: (server, version, n2) => `Verstak: the bridge is up (${server} ${version}), tools in the session: ${n2} — sign-in done.`,
    launchNoBridge: (no) => `Verstak: launch line — the bridge is not up, did not enter case #${no}.`,
    stillRaising: () => "Verstak: the bridge is still coming up — the verstak_* tools appear as soon as it answers.",
    versionUnreadable: () => "Verstak: the delivery carries a bridge, but its version is unreadable — leaving the home copy alone.",
    homeNewer: (home, packaged) => `Verstak: the home bridge is ${home}, the delivery's is ${packaged} — the home one is newer, leaving it alone.`,
    noVersion: () => "version unreadable",
    replacedSame: (version) => `Verstak: the home bridge was replaced with the one the delivery brought — same version (${version}), different bytes. The grant is untouched.`,
    updated: (was, version) => `Verstak: the home bridge was updated ${was} → ${version}. The grant is untouched, it lies beside it in separate files.`,
    replaceFailed: (was, version, message) => `Verstak: the home bridge is ${was}, the delivery's is ${version}, replacing it failed (${message}). Working with what there is.`
  }
};

// js/delivery/words/plugin.ts
var PLUGIN = {
  en: {
    noBridge: (tried) => "Verstak: the bridge was not found — there will be no verstak_* tools in this session. Looked in: " + tried + ". Set VERSTAK_BRIDGE_PATH or install the bridge by the verstak skill's establish-mcp method.",
    bridgeLine: (line) => `Verstak/bridge: ${line}`,
    notRaised: (message) => `Verstak: the bridge did not come up — ${message}`,
    refusalNoText: (name) => `${name}: refusal without text`,
    relistFailed: (message) => `Verstak: the tool list was not reread after the change on the server — ${message}`,
    listening: () => "Verstak: the channel is listening",
    dead: (code) => `Verstak: the channel was closed with code ${code} — the token is dead. Call verstak_channel(action="connect"), then register with the same name: the bridge takes the new socket from the answer itself, no restart needed.`,
    evicted: (code) => `Verstak: the channel was closed with code ${code} — the seat was taken, another holder is listening. The bridge stands beside as name.N with hearing itself — its own seat, the other one is not taken over; the outcome comes next, verstak_stand with the same call tells the seat and the watchdog command. Evicting that session (take=true) — only on the user's word.`,
    alive: (version) => `Verstak: the socket keeps being cut while the service answers (${version}) — the bridge holds the seat and reopens less often; if it fails, ask about the token.`,
    note: (text) => `Verstak: ${text}`
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
    messages: (n2) => `${n2} ${n2 === 1 ? "message" : "messages"}`,
    body: (refersTo, author) => `text of message [${refersTo}] from ${author}`,
    bodyAborted: (refersTo) => `message [${refersTo}] cut off by its author`,
    bodyLapsed: (refersTo) => `message [${refersTo}] cut off by the platform on its deadline`,
    closing: (author, endsAt, evidence) => `the lead ${author} proposes to close the case by ${endsAt}${evidence ? `; evidence: ${evidence}` : ""}`,
    closingMay: (entryId) => `you may object — verstak_case(action="object", in_reply_to=${entryId}) (former name verstak_room)`,
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

// js/delivery/words/status.ts
var TAKE_PATH_EN = `verstak_stand with take=true — only on the user's word — moves the hearing and the status address here ONCE: the address stays with THIS bridge instance, and a watchdog raised after it does not carry it off — by design: the watchdog is a local client of the socket and makes no connect of its own. The former holder gets close 4000 (the evicted one need not take the seat back the same way — it gets a seat beside, name.N); connect does not touch the seat's incoming address and queue, what waited comes in hello (help: verstak_channel action="?", connect); after the move re-arm the watchdog with the command from the answer`;
var TWO_ENTRIES_EN = "If the seat is yours and a bridge of this same session holds it (the session has two verstak entries, the plugin's and the user's), call status with the same tool set you called verstak_stand with: no move is needed.";
var TURNED_EN = `${TWO_ENTRIES_EN} Otherwise ${TAKE_PATH_EN}.`;

// js/shared/lang.ts
import { readFileSync } from "node:fs";
import { join as join2 } from "node:path";

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
import { homedir } from "node:os";
import { join, resolve } from "node:path";
var defaultAuthDir = () => join(homedir(), HOME_DIR);
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
    const text = readFileSync(join2(authDirFromEnv(), "server"), "utf8").trim();
    if (text) return langOfServer(text);
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

// js/shared/room-fields.ts
var obj = (v) => v && typeof v === "object" && !Array.isArray(v) ? v : {};
var str = (v) => typeof v === "string" ? v : typeof v === "number" || typeof v === "boolean" ? String(v) : "";
var after = (key, prefix) => key.startsWith(prefix) ? key.slice(prefix.length) : key;
var need = (v) => str(v) || "?";
var opt = (sep, v) => {
  const x = str(v);
  return x ? sep + x : "";
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
  const W3 = words(ASK);
  const form = str(fields.form);
  if (form === "yes_no") return W3.yesNo();
  if (form === "free") return W3.free();
  if (form !== "choice" || !Array.isArray(fields.options)) return "";
  const options = fields.options.map((o) => {
    const x = obj(o);
    const ctx = str(x.context);
    return `${str(x.id)} ${quote(str(x.label))}${ctx ? ` (${ctx})` : ""}`;
  }).join(", ");
  return W3.choice(need(options));
}
function askValues(kind, line, fields) {
  if (kind !== "ask")
    return { reply: [str(fields.choice), quote(str(line.done))].filter(Boolean).join("; ") };
  const W3 = words(ASK);
  const to = toOf(fields);
  const k = obj(to.karta);
  const place = addresseeOf(to.standing)?.label ?? "";
  const rec3 = obj(fields.recommendation);
  return {
    to: str(k.name) || (str(k.seq) ? `#${str(k.seq)}` : ""),
    to_place: place ? W3.place(need(place)) : "",
    form: formOf(fields),
    advice: str(rec3.option) || str(rec3.why) ? W3.advice(need(str(rec3.option) || "—"), opt(" — ", rec3.why)) : ""
  };
}
function askText(kind, cause, v) {
  const W3 = words(ASK);
  const invite = cause ? pick(INVITE_CAUSES, cause) : void 0;
  if (invite) return W3[invite](need(v.who), need(v.standing));
  if (kind === "progress" && str(v.withdraws))
    return W3.withdrawn(
      need(v.withdraws),
      need(v.key),
      need(v.done),
      need(v.verdict),
      need(v.author)
    );
  if (kind === "ask")
    return W3.ask(
      need(v.author),
      need(v.to),
      opt(" ", v.to_place),
      need(v.key),
      need(v.done),
      opt("; ", v.form),
      opt("; ", v.advice)
    );
  if (kind === "answer") return W3.answer(need(v.author), need(v.refers_to), need(v.reply));
  if (kind === "ack") return W3.ack(need(v.refers_to), opt(": ", v.reply), need(v.author));
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
  const W3 = words(ROOM);
  const n2 = (k) => need(v[k]);
  const lapsed = obj(obj(f.line).author).kind === "platform";
  if (pending) return W3.saidPending(n2("author"));
  if (aborted) return lapsed ? W3.bodyLapsed(n2("refers_to")) : W3.bodyAborted(n2("refers_to"));
  if (kind === "auto")
    return pick(words(ROOM_AUTO), str(v.code))?.(n2("room")) ?? W3.auto(n2("code"), n2("room"));
  const ask = askText(kind, str(v.cause), v);
  if (ask !== void 0) return ask;
  const reasoning = opt("; ", v.reasoning);
  const op = kind === "node" ? pick(NODE_OPS, str(v.op)) : void 0;
  if (op) return W3[op](n2("seq"), n2("name"), reasoning);
  switch (kind) {
    case "said":
      return W3.said(n2("author"));
    case "body":
      return W3.body(n2("refers_to"), n2("author"));
    case "closing":
      return W3.closing(n2("author"), n2("ends_at"), str(v.evidence));
    case "closed":
      return W3.closed(n2("reason"));
    case "objection":
      return W3.objection(n2("author"), n2("reason"));
    case "late_objection":
      return W3.lateObjection(n2("author"));
    case "progress":
      return W3.progress(n2("key"), n2("done"), n2("verdict"), opt(" — ", v.note), n2("author"));
    case "opened":
      return W3.opened(n2("author"));
    case "joined":
      return W3.joined(n2("who"));
    case "left":
      return W3.left(n2("who"), str(v.reason));
    case "invite":
      return W3.invite(n2("author"), n2("who"));
    case "withdraw":
      return W3.withdraw(n2("author"));
    case "node":
      return W3.node(n2("seq"), n2("name"), n2("realm"), reasoning);
    case "link":
      return W3.link(n2("room"), n2("rel"));
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
    withdraws: fields.withdraws
  };
  const W3 = words(ROOM);
  const rule = RULES[kind];
  const author = str(values.author);
  if (!rule)
    return {
      kind,
      rule: "batch",
      words: W3.unknown(need(kind)),
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
    const run = (n2) => n2 === 0 ? W3.asideBody(by, addressee, id) : n2 > 1 ? W3.asideRun(by, addressee, W3.messages(n2), id) : W3.aside(by, addressee, id);
    const aside = { pair, counts, run };
    const words2 = run(counts ? 1 : 0);
    return { kind, rule: "batch", words: words2, author, phase: null, known: true, aside };
  }
  const pending = kind === "said" && f.body_pending === true && !str(f.body) && !str(line.done);
  const aborted = kind === "body" && fields.aborted === true;
  let text = kindText(kind, values, f, pending, aborted);
  if (kind === "closing") {
    const may = Array.isArray(fields.may_object) ? fields.may_object.map((m) => typeof m === "string" ? m : str(obj(m).id)) : [];
    const myId = str(f.to_standing_id);
    const mayI = !!myId && may.includes(myId);
    text += "; " + (mayI ? W3.closingMay(need(values.entry_id)) : W3.closingNot());
  }
  const stack = rule === "stack" ? f.stack === "defer" ? "batch" : "interrupt" : rule === "mine" ? mine.includes(str(values.target)) || myRole(f, fields) ? "interrupt" : "batch" : rule === "addressed" ? addressedMine(f) ? "interrupt" : "batch" : rule;
  const phase = pending ? "pending" : aborted ? "aborted" : null;
  return { kind, rule: phase ? "batch" : stack, words: text, author, phase, known: true };
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
  if (rk && ASK_KINDS.has(rk.kind) || askFromPerson(f)) return false;
  return (frame.origin ?? classifyOrigin(frame, str(f.karta_seq) || void 0)) === "human";
}

// js/shared/seen.ts
var evOf = (v) => typeof v === "number" || typeof v === "string" && v ? `ev:${v}` : "";
function eventKeyOf(frame) {
  const via = frame?.provenance?.via;
  if (via === "room") return evOf(frame?.event_id);
  if (via !== "graph") return "";
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

// js/shared/clients.ts
var OPENCODE_CLIENT = CLIENTS.opencode;
var PI_CLIENT = CLIENTS.pi;
var HARNESS_VERSION_ENV = envName("HARNESS_VERSION");
var SKILLS_ROOT_ENV = envName("SKILLS_ROOT");

// js/shared/fields.ts
var FIELDS_CAPABILITY = STRUCTURED_CAPABILITY;
var FIELDS_CAPABILITIES = { experimental: { [FIELDS_CAPABILITY]: {} } };

// js/shared/version.ts
import { createHash } from "node:crypto";
import { readFileSync as readFileSync2 } from "node:fs";
import { fileURLToPath } from "node:url";
var releaseBuildIn = (text) => text.includes(`"${[BUILD_MARK, "release"].join(":")}"`);
var devBuildIn = (text) => text.includes(`"${[BUILD_MARK, "dev"].join(":")}"`);
function buildOf(selfUrl) {
  try {
    const src = readFileSync2(fileURLToPath(selfUrl));
    return `v${VERSION}+${createHash("sha256").update(src).digest("hex").slice(0, 8)}`;
  } catch {
    return `v${VERSION}`;
  }
}
var MARK_LITERAL = /"([^"\s]+-build):(?:dev|release)"/g;
function versionIn(text) {
  for (const [, name] of text.matchAll(MARK_LITERAL)) if (name !== BUILD_MARK) return null;
  const m = /^(?:const|let|var)\s+VERSION\s*=\s*"([^"]+)"/m.exec(text);
  return m ? m[1] : null;
}

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
  const origin = frame.origin ?? classifyOrigin(frame);
  if (origin === "platform") return W().whoPlatform();
  if (p.via === "graph" && p.from_karta_seq == null && !p.from_standing) return W().whoGraph();
  const place = withPlace && p.from_standing ? ` (${p.from_standing})` : "";
  if (origin === "human") return W().whoHuman(opt(" @", p.user)) + place;
  const karta = p.from_karta_seq;
  if (karta == null) return p.from_standing ?? "";
  return (origin === "sibling" ? W().whoSibling : W().whoRole)(need(karta)) + place;
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
var markFrame = (text) => `${FRAME_MARK} ${text}`;
function frameToText(frame, raw) {
  if (!frame) return raw;
  const f = frame;
  const origin = frame.origin ?? classifyOrigin(frame);
  const text = textOf(frame);
  const c = caseOf(frame);
  if (c) {
    if (!addressedToMine(frame)) return caseCountLine([frame]);
    const rk = roomKind(frame);
    const line = rec2(f.line);
    const entry = idOf2(f.entry_id) || idOf2(line.entry_id);
    const words2 = rk ? rk.words : W().legacy(need(f.kind), typeof f.stack === "string" ? f.stack : "");
    const author = rk?.author && !words2.includes(rk.author) ? rk.author : "";
    const who = origin === "platform" ? "" : whoOf2(frame, false);
    const by = [author, who].filter(Boolean).join(", ");
    const withReply = rk?.kind !== "body";
    const head = `${caseHead(frame, true)}${entry ? ` [${entry}]` : ""} ${words2}${by ? ` — ${by}` : ""}${tail(frame, withReply)}`;
    const lines2 = [head];
    if (text && !words2.includes(text.trim())) lines2.push(text);
    return lines2.join("\n");
  }
  const lines = [`${whoOf2(frame, true) || "?"}${tail(frame, true)}`];
  if (text) lines.push(text);
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
  const words2 = rk?.words ?? T().frame(typeof f.id === "string" ? f.id : "?");
  const author = rk?.author && !words2.includes(rk.author) ? ` — ${rk.author}` : "";
  const flat = [...textOf(frame).replace(/\s+/g, " ").trim()];
  const text = flat.length > BATCH_TEXT ? flat.slice(0, BATCH_TEXT).join("") + "…" : flat.join("");
  const dup = !!text && words2.includes(text);
  return `${pre}[${entry}] ${words2}${author}${tail(frame, rk?.kind !== "body")}${text && !dup ? `: ${text}` : ""}`;
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

// js/bridge/backlog.ts
var BACKLOG_MS = Number(process.env[envName("BRIDGE_BACKLOG_MS")]) || 1500;

// js/bridge/roomstack.ts
var ROOM_BATCH_MS = Number(process.env[envName("BRIDGE_ROOM_BATCH_MS")]) || 6e4;

// js/bridge/holdrecord.ts
var HOLD_RECORD_MAX_AGE_MS = 6 * 60 * 60 * 1e3;
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
  /** own revoke in flight (absorb.ts): close 4001 outruns the revoke answer */
  revokingOwn: false,
  /** own channel close in flight (absorb.ts): close 4001 outruns the answer, as with revoke (#6634) */
  closingOwn: false,
  /** the daemon goes down while this session's thin bridge lives and restores the place (daemon.ts, #6485) */
  handingOver: null
}));

// js/bridge/realms.ts
var aliases = scoped(() => /* @__PURE__ */ new Map());
var R = scoped(() => ({ listing: null }));

// js/bridge/places.ts
var extras = scoped(() => /* @__PURE__ */ new Map());

// js/bridge/spool.ts
var HANDOFF_MS = Number(process.env[envName("BRIDGE_DAEMON_HANDOFF_MS")]) || 12e3;
var DRAIN_MS = HANDOFF_MS + 5e3;

// js/extension/channel.ts
var ASIDE_MS = Number(process.env[envName("PI_ASIDE_MS")]) || 3e3;
var TACT_POLL_MS = 1e3;
function setupChannel(pi) {
  const P = words(PLUGIN);
  let ctxRef = null;
  pi.on("session_start", async (_event, ctx) => {
    ctxRef = ctx;
  });
  pi.on("session_shutdown", async () => {
    ctxRef = null;
  });
  function loud(text, fatal = true) {
    if (ctxRef?.hasUI) ctxRef.ui.notify(text, fatal ? "error" : "warning");
    pi.sendMessage(
      { customType: LOGGERS.channel, content: markFrame(text), display: true, details: { fatal } },
      { triggerTurn: true, deliverAs: "steer" }
    );
  }
  const aside = [];
  let asideTimer = null;
  const marks = /* @__PURE__ */ new Set();
  function noteText(keys) {
    for (const k of keys ?? []) marks.add(k);
    for (const old of marks) if (marks.size > 500) marks.delete(old);
  }
  function flushAsides() {
    if (asideTimer) clearTimeout(asideTimer);
    asideTimer = null;
    const got = aside.splice(0).filter((f) => !eventIn(f, (k) => marks.has(k)));
    if (!got.length) return;
    pi.sendMessage(
      {
        customType: LOGGERS.channel,
        content: markFrame([batchHead(got), ...batchLines(got)].join("\n")),
        display: true,
        details: { count: got.map((f) => f.id ?? null) }
      },
      { triggerTurn: false, deliverAs: "nextTurn" }
    );
  }
  function sendBatch(ev) {
    pi.sendMessage(
      {
        customType: LOGGERS.channel,
        content: markFrame(ev.text ?? ""),
        display: true,
        details: ev.kind === "stale" ? { stale: true } : { backlog: true }
      },
      { triggerTurn: true, deliverAs: "steer" }
    );
  }
  let tact = null;
  let tactPoll = null;
  function releaseTact() {
    if (tactPoll) clearInterval(tactPoll);
    tactPoll = null;
    const t = tact;
    tact = null;
    if (t) sendBatch(t);
  }
  function olderTact(ev) {
    const at = tactAt(ev.frames);
    const was = tact ? tactAt(tact.frames) : "";
    return !!at && !!was && at < was;
  }
  function holdTact(ev) {
    if (olderTact(ev)) return;
    tact = ev;
    tactPoll ??= setInterval(() => {
      if (ctxRef?.isIdle?.() !== false) releaseTact();
    }, TACT_POLL_MS);
    tactPoll.unref?.();
  }
  pi.on("agent_end", async () => releaseTact());
  return (params) => {
    const ev = params?.data;
    if (!ev || typeof ev !== "object") return;
    switch (ev.kind) {
      case "frame": {
        const frame = ev.frame ?? null;
        const raw = ev.raw ?? "";
        if (frame?.type === "hello") {
          if (ctxRef?.hasUI) ctxRef.ui.setStatus?.(PRODUCT, P.listening());
          return;
        }
        if (frame?.type === "status") return;
        if (frame && (byKind(frame) || roomKind(frame)?.aside) && !addressedToMine(frame)) {
          aside.push(frame);
          asideTimer ??= setTimeout(flushAsides, ASIDE_MS);
          asideTimer.unref?.();
          return;
        }
        noteText(deliveryKeys(frame));
        flushAsides();
        const later = byKind(frame) && stackOf(frame) === "batch";
        pi.sendMessage(
          {
            customType: LOGGERS.channel,
            content: markFrame(frameToText(frame, raw)),
            display: true,
            details: frame ?? { raw }
          },
          { triggerTurn: true, deliverAs: later ? "followUp" : "steer" }
        );
        return;
      }
      case "dead":
        loud(P.dead(String(ev.code)));
        return;
      case "stale":
      case "backlog":
        noteText(ev.marks);
        if (!ev.text) return;
        if (onlyTacts(ev.frames) && ctxRef?.isIdle?.() === false) return holdTact(ev);
        if (ev.frames?.some(isTact) && !olderTact(ev)) tact = null;
        sendBatch(ev);
        return;
      case "evicted":
        loud(P.evicted(String(ev.code)));
        return;
      case "alive":
        loud(P.alive(ev.version ?? ""), false);
        return;
      case "note":
        if (ctxRef?.hasUI && ev.text) ctxRef.ui.notify(P.note(ev.text), "warning");
        return;
      case "attached":
      case "held":
      case "released":
      case "lost":
      case "resumed":
        return;
    }
  };
}

// js/extension/tools.ts
import { existsSync } from "node:fs";
import { dirname as dirname2 } from "node:path";

// js/shared/bridge-client.ts
import { spawn } from "node:child_process";
import { basename } from "node:path";
var W2 = () => words(BRIDGE_CLIENT);
function bridgeRuntime() {
  const own = process.env[envName("NODE")]?.trim();
  if (own) return { bin: own, env: process.env };
  if (process.versions?.bun)
    return { bin: process.execPath, env: { ...process.env, BUN_BE_BUN: "1" } };
  if (!/^node/i.test(basename(process.execPath))) return { bin: "node", env: process.env };
  return { bin: process.execPath, env: process.env };
}
var SERVICE_ID = `${ID_PREFIX}service-`;
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
    proc.on("exit", (code, signal) => this.die(new Error(W2().exited(code, signal, this.why()))));
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
      const settle = (fn) => (v) => {
        if (timer) clearTimeout(timer);
        opts.signal?.removeEventListener("abort", onAbort);
        fn(v);
      };
      const resolve4 = settle(res);
      const reject = settle(rej);
      function onAbort() {
        reject(new Error(W2().aborted()));
      }
      this.pending.set(id, { resolve: resolve4, reject });
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

// js/shared/launch.ts
var LINE = LAUNCH_LINE;
function parseLaunch(text) {
  const [, realm, karta, no, of] = LINE.exec(text) ?? [];
  return realm && karta && no ? { realm, karta, no, of: of ?? null } : null;
}
function withWord(text, word2) {
  const m = LINE.exec(text);
  if (!m) return `${text}
${word2}`;
  const nl = text.indexOf("\n", m.index);
  return nl < 0 ? `${text}
${word2}` : `${text.slice(0, nl)}
${word2}${text.slice(nl)}`;
}
async function enterCase(l, call, satelliteOf, placeName) {
  const W3 = words(LAUNCH);
  const room = `#${l.no}`;
  const stand = { realm: l.realm, karta: l.karta };
  if (satelliteOf) stand.satellite_of = satelliteOf;
  try {
    await call(tool("stand"), stand);
  } catch (e) {
    const why = e.message;
    const join4 = `${tool("case")}(action="join", room="${room}")`;
    return W3.notSeated(why, l.no, join4);
  }
  const place = placeName() || W3.ownSeat();
  try {
    await call(tool("case"), { action: "join", realm: l.realm, room });
  } catch (e) {
    return W3.notEntered(place, l.no, e.message);
  }
  return W3.entered(place, l.no);
}

// js/extension/home-copy.ts
import {
  accessSync,
  chmodSync,
  constants,
  readFileSync as readFileSync3,
  renameSync,
  unlinkSync,
  writeFileSync
} from "node:fs";
import { dirname, resolve as resolve3 } from "node:path";
import { fileURLToPath as fileURLToPath2 } from "node:url";

// js/shared/home.ts
import { homedir as homedir2 } from "node:os";
import { join as join3 } from "node:path";
var homeBridgePath = () => join3(homedir2(), HOME_DIR, HOME_BRIDGE_FILE);

// js/extension/home-copy.ts
var BRIDGE_PATH_ENV = envName("BRIDGE_PATH");
function newer(a, b) {
  const pa = a.split(".").map(Number), pb = b.split(".").map(Number);
  if (pa.length !== 3 || pb.length !== 3 || [...pa, ...pb].some((n2) => !Number.isInteger(n2)))
    return 0;
  for (let i = 0; i < 3; i++) if (pa[i] !== pb[i]) return pa[i] > pb[i] ? 1 : -1;
  return 0;
}
function packagedBridgePath() {
  return resolve3(
    dirname(fileURLToPath2(import.meta.url)),
    "..",
    "skills",
    BRIDGE_SKILL,
    "scripts",
    BRIDGE_FILE
  );
}
function refreshHomeBridge(notify, canSpeak) {
  if (process.env[BRIDGE_PATH_ENV]?.trim()) return;
  if (!canSpeak) return;
  const W3 = words(PI);
  let packagedPath;
  try {
    packagedPath = packagedBridgePath();
  } catch {
    return;
  }
  const homePath = homeBridgePath();
  let packaged;
  try {
    packaged = readFileSync3(packagedPath);
  } catch {
    return;
  }
  const vPackaged = versionIn(packaged.toString("utf8"));
  if (!vPackaged) {
    notify(W3.versionUnreadable(), "warning");
    return;
  }
  if (!releaseBuildIn(packaged.toString("utf8"))) return;
  let home;
  try {
    home = readFileSync3(homePath);
  } catch {
    return;
  }
  if (home.equals(packaged)) return;
  const vHome = versionIn(home.toString("utf8"));
  if (vHome && newer(vHome, vPackaged) > 0) {
    notify(W3.homeNewer(vHome, vPackaged), "warning");
    return;
  }
  if (vHome === vPackaged && !devBuildIn(home.toString("utf8"))) return;
  const was = vHome ?? W3.noVersion();
  const tmp = `${homePath}.tmp-${process.pid}`;
  try {
    writeFileSync(tmp, packaged);
    chmodSync(tmp, 493);
    renameSync(tmp, homePath);
    notify(vHome === vPackaged ? W3.replacedSame(vPackaged) : W3.updated(was, vPackaged), "info");
  } catch (e) {
    try {
      unlinkSync(tmp);
    } catch {
    }
    notify(W3.replaceFailed(was, vPackaged, e.message), "warning");
  }
}
function findBridge() {
  const tried = [];
  const push = (p) => {
    if (!p) return;
    tried.push(p);
  };
  const named = process.env[BRIDGE_PATH_ENV]?.trim();
  push(named ? resolve3(named) : null);
  try {
    push(packagedBridgePath());
  } catch {
  }
  push(homeBridgePath());
  for (const candidate of tried) {
    try {
      accessSync(candidate, constants.R_OK);
      return { path: candidate, tried };
    } catch {
    }
  }
  return { path: null, tried };
}

// js/extension/usage.ts
var n = (v) => typeof v === "number" && Number.isFinite(v) ? v : 0;
function spent(entries) {
  const s = { input: 0, output: 0, cache_read: 0, cache_write: 0 };
  for (const e of entries) {
    const u = e?.type === "message" && e.message?.role === "assistant" ? e.message.usage : null;
    if (!u) continue;
    s.input += n(u.input);
    s.output += n(u.output);
    s.cache_read += n(u.cacheRead);
    s.cache_write += n(u.cacheWrite);
  }
  return { tokens: s.input + s.output + s.cache_write, ...s };
}
function setupUsage(pi, live) {
  pi.on("turn_end", async (_event, ctx) => {
    const bridge = live();
    if (!bridge) return;
    const c = ctx.getContextUsage?.();
    const p = spent(
      ctx.sessionManager?.getEntries?.() ?? []
    );
    const model = ctx.model?.id;
    if (typeof model === "string" && model) p.model = model;
    if (typeof c?.tokens === "number") p.context = c.tokens;
    if (n(c?.contextWindow)) p.window = c.contextWindow;
    await bridge.request(method("usage"), p, { timeoutMs: 1e4 }).catch(() => {
    });
  });
}

// js/extension/tools.ts
var READY_WAIT_MS = Number(process.env[envName("MCP_READY_WAIT_MS")] || 2e4);
var HANDSHAKE_MS = Number(process.env[envName("MCP_HANDSHAKE_MS")] || 6e5);
var TICK_MS = 15e3;
var AUTH_POLL_MS = Number(process.env[envName("MCP_AUTH_POLL_MS")] || 3e3);
var AUTH_PENDING = /authorization required/i;
var PROTOCOL = "2025-06-18";
function textOrThrow(name, result) {
  const text = resultToContent(result).map((c) => c.type === "text" ? c.text : "[image]").join("\n");
  if (result?.isError) throw new Error(text || words(PLUGIN).refusalNoText(name));
  return text;
}
async function hostEnv() {
  const env = {};
  try {
    const bridge = packagedBridgePath();
    if (existsSync(bridge)) env[SKILLS_ROOT_ENV] = dirname2(dirname2(dirname2(bridge)));
  } catch {
  }
  try {
    const { VERSION: VERSION2 } = await import("@earendil-works/pi-coding-agent");
    if (typeof VERSION2 === "string" && VERSION2.trim()) env[HARNESS_VERSION_ENV] = VERSION2.trim();
  } catch {
  }
  return env;
}
var callVia = (b) => async (name, args) => textOrThrow(name, await b.request("tools/call", { name, arguments: args }, { service: true }));
function setupBridge(pi, onChannel) {
  const W3 = words(PI);
  const P = words(PLUGIN);
  let bridge = null;
  const offByUs = /* @__PURE__ */ new Set();
  const known = /* @__PURE__ */ new Set();
  let notify = () => {
  };
  let canSpeak = false;
  let heldName = null;
  let satellite = false;
  async function raise(args = []) {
    refreshHomeBridge(notify, canSpeak);
    const found = findBridge();
    if (!found.path) {
      notify(P.noBridge(found.tried.join(", ")), "error");
      return;
    }
    const env = await hostEnv();
    const b = new Bridge(
      found.path,
      (line) => notify(P.bridgeLine(line), "info"),
      (method2, params) => {
        if (method2 === "notifications/message" && params?.logger === LOGGERS.channel) {
          const name = params?.data?.kind === "held" ? params?.data?.place?.name : null;
          if (typeof name === "string" && name) heldName = name;
          onChannel(params);
        }
        if (method2 === "notifications/tools/list_changed") void relist(b);
      },
      void 0,
      args
    );
    bridge = b;
    satellite = args.includes("--satellite");
    b.start(env);
    let toldLogin = false;
    let toldLinks = "";
    const deadline = Date.now() + HANDSHAKE_MS;
    const untilAuthed = async (ask) => {
      for (; ; ) {
        try {
          return await ask();
        } catch (e) {
          const message = e instanceof Error ? e.message : String(e);
          if (!AUTH_PENDING.test(message) || bridge !== b || Date.now() + AUTH_POLL_MS > deadline)
            throw e;
          const links = [/open in a browser: (\S+)/, /from another device: (\S+)/].map((re) => re.exec(message)?.[1] ?? "").join(" ");
          if (!toldLogin || links !== toldLinks) {
            toldLogin = true;
            toldLinks = links;
            notify(W3.needLogin(message), "warning");
          }
          await new Promise((r) => setTimeout(r, AUTH_POLL_MS));
        }
      }
    };
    const init = await untilAuthed(
      () => b.request(
        "initialize",
        {
          protocolVersion: PROTOCOL,
          capabilities: FIELDS_CAPABILITIES,
          // answer fields — for this client too (#6637)
          clientInfo: { name: PI_CLIENT, version: "1" }
        },
        { timeoutMs: HANDSHAKE_MS }
      )
    );
    if (bridge !== b) return b.stop();
    b.notify("notifications/initialized");
    const tools = [];
    let cursor;
    do {
      const page = await untilAuthed(
        () => b.request("tools/list", cursor ? { cursor } : {}, {
          timeoutMs: HANDSHAKE_MS
        })
      );
      for (const t of page?.tools ?? []) tools.push(t);
      cursor = page?.nextCursor;
    } while (cursor);
    if (bridge !== b) return b.stop();
    function registerAll(list) {
      for (const t of list) known.add(String(t.name));
      for (const tool2 of list) {
        const name = String(tool2.name);
        pi.registerTool({
          name,
          label: name,
          description: String(tool2.description ?? ""),
          promptSnippet: snippet(String(tool2.description ?? "")),
          parameters: toParameters(tool2.inputSchema),
          async execute(_toolCallId, params, signal, onUpdate, _c) {
            const live = bridge;
            if (!live) throw new Error(W3.notUp(name));
            const started = Date.now();
            onUpdate?.({ content: [{ type: "text", text: W3.calling(name) }], details: {} });
            const tick = setInterval(() => {
              onUpdate?.({
                content: [
                  {
                    type: "text",
                    text: W3.stillWaiting(name, Math.round((Date.now() - started) / 1e3))
                  }
                ],
                details: {}
              });
            }, TICK_MS);
            tick.unref?.();
            try {
              const result = await live.request(
                "tools/call",
                { name, arguments: params ?? {} },
                { signal }
                // no ceiling: the first call may go to the human's browser
              );
              if (result?.isError) textOrThrow(name, result);
              const content = resultToContent(result);
              return {
                content,
                details: { tool: name, structuredContent: result?.structuredContent }
              };
            } finally {
              clearInterval(tick);
            }
          }
        });
      }
    }
    async function relist(from) {
      if (bridge !== from) return;
      try {
        const fresh = [];
        let next;
        do {
          const page = await from.request("tools/list", next ? { cursor: next } : {}, {
            timeoutMs: HANDSHAKE_MS
          });
          for (const t of page?.tools ?? []) fresh.push(t);
          next = page?.nextCursor;
        } while (next);
        if (bridge !== from) return;
        const kept2 = new Set(fresh.map((t) => String(t.name)));
        const dropped = tools.map((t) => String(t.name)).filter((n2) => !kept2.has(n2));
        registerAll(fresh);
        const back = [...offByUs].filter((n2) => kept2.has(n2));
        for (const n2 of dropped) offByUs.add(n2);
        for (const n2 of back) offByUs.delete(n2);
        if (dropped.length || back.length)
          pi.setActiveTools([
            .../* @__PURE__ */ new Set([...pi.getActiveTools().filter((n2) => !dropped.includes(n2)), ...back])
          ]);
        tools.splice(0, tools.length, ...fresh);
        notify(W3.serverChanged(fresh.length), "info");
      } catch (e) {
        if (bridge !== from) return;
        notify(P.relistFailed(e.message), "warning");
      }
    }
    const listed = new Set(tools.map((t) => String(t.name)));
    const gone = [...known].filter((n2) => !listed.has(n2));
    const returned = [...offByUs].filter((n2) => listed.has(n2));
    registerAll(tools);
    for (const n2 of gone) offByUs.add(n2);
    for (const n2 of returned) offByUs.delete(n2);
    if (gone.length || returned.length)
      pi.setActiveTools([
        .../* @__PURE__ */ new Set([...pi.getActiveTools().filter((n2) => !gone.includes(n2)), ...returned])
      ]);
    const server = init?.serverInfo;
    const raised = toldLogin ? W3.raisedSignedIn : W3.raised;
    notify(raised(server?.name ?? W3.server(), server?.version ?? "", tools.length), "info");
  }
  let raising = Promise.resolve();
  const raiseLoud = (args = []) => raise(args).catch((e) => {
    notify(P.notRaised(e.message), "error");
    bridge?.stop();
    bridge = null;
  });
  let prompted = false;
  pi.on("input", async (event) => {
    if (prompted) return { action: "continue" };
    prompted = true;
    const l = parseLaunch(event.text);
    if (!l) return { action: "continue" };
    const of = l.of ?? (process.env[envName("SATELLITE_OF")]?.trim() || null);
    if (of && !satellite) {
      bridge?.stop();
      bridge = null;
      raising = raiseLoud(["--satellite"]);
    }
    await raising;
    const live = bridge;
    const word2 = live ? await enterCase(l, callVia(live), of, () => heldName) : W3.launchNoBridge(String(l.no));
    return { action: "transform", text: withWord(event.text, word2) };
  });
  pi.on("session_start", async (_event, ctx) => {
    notify = ctx.hasUI ? (t, l) => ctx.ui.notify(t, l ?? "info") : () => {
    };
    canSpeak = Boolean(ctx.hasUI);
    bridge?.stop();
    bridge = null;
    prompted = false;
    heldName = null;
    const work = raiseLoud();
    raising = work;
    let done = false;
    void work.then(() => {
      done = true;
    });
    await Promise.race([
      work,
      new Promise((r) => {
        const t = setTimeout(() => {
          if (!done) notify(W3.stillRaising(), "info");
          r();
        }, READY_WAIT_MS);
        t.unref?.();
      })
    ]);
  });
  setupUsage(pi, () => heldName ? bridge : null);
  pi.on("session_shutdown", async () => {
    bridge?.stop();
    bridge = null;
  });
}

// js/extension/main.ts
function main_default(pi) {
  const broken = [];
  pi.on("session_start", async (_event, ctx) => {
    if (!broken.length || !ctx.hasUI) return;
    ctx.ui.notify(words(PI).broken(broken.join("; ")), "error");
  });
  let onChannel = () => {
  };
  try {
    onChannel = setupChannel(pi);
  } catch (e) {
    broken.push(words(PI).channelPart(e instanceof Error ? e.message : String(e)));
  }
  try {
    setupBridge(pi, (params) => onChannel(params));
  } catch (e) {
    broken.push(words(PI).toolsPart(e instanceof Error ? e.message : String(e)));
  }
}
export {
  main_default as default
};
