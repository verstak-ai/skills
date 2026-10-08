// The OpenCode plugin (OPENCODE): door, the tools half, the bridge state tool, slash
// commands, frame attachment.
import type { Lang } from "../lang.ts";

export interface OpencodeWords {
  channelDown: (message: string) => string;
  launchDown: (message: string) => string;
  noticeDown: (message: string) => string;
  commandsDown: (message: string) => string;
  noPermissionHooks: () => string;
  skillReadsDown: (message: string) => string;
  hearingLost: (hhmm: string, message: string) => string;
  fromCache: () => string;
  fromServer: () => string;
  cached: (n: number) => string;
  raised: (n: number) => string;
  died: (message: string) => string;
  builds: (bridge: string, plugin: string) => string;
  unreadable: () => string;
  serverChanged: (n: number) => string;
  idleShort: (idle: number, watch: number) => string;
  statusDescription: () => string;
  statusBridge: (path: string) => string;
  statusLoginPending: (open: string, elsewhere: string) => string;
  openInBrowser: (url: string) => string;
  finishInBrowser: () => string;
  statusLoginDone: () => string;
  statusLoginWaiting: () => string;
  statusTools: (n: number, source: string) => string;
  statusBridges: (live: number, sessions: number) => string;
  commandHead: (id: string) => string;
  commandsCount: (n: number) => string;
  frame: () => string;
  frameId: (id: string) => string;
  frameNoId: () => string;
  caseBatch: (n: number) => string;
  staleBatch: () => string;
  wakeBatch: (n: number) => string;
  resumedLabel: () => string;
  tact: () => string;
  tactWaits: () => string;
  tactWaitsFolded: () => string;
  childGone: (frame: string, id: string, text: string) => string;
  sessionClosed: (id: string, frame: string) => string;
  nowhere: (frame: string, text: string) => string;
  delivered: (frame: string, id: string) => string;
  notDelivered: (frame: string, id: string, message: string) => string;
  held: (key: string) => string;
  released: (key: string, text: string) => string;
}

export const OPENCODE: Readonly<Record<Lang, OpencodeWords>> = {
  en: {
    channelDown: (message) => `Verstak: the channel did not come up — ${message}`,
    launchDown: (message) => `Verstak: the launch line did not come up — ${message}`,
    noticeDown: (message) => `Verstak: the subagent turn note did not come up — ${message}`,
    commandsDown: (message) => `Verstak: the skill commands did not come up — ${message}`,
    noPermissionHooks: () =>
      "Verstak: this OpenCode has no permission hooks — files of the delivery's skills outside the working copy are read with an ask.",
    skillReadsDown: (message) =>
      `Verstak: reading the delivery's skill files did not open — ${message}`,
    hearingLost: (hhmm, message) =>
      `Verstak: hearing lost at ${hhmm} — the standing's bridge exited (${message}). ` +
      "The hearing watchdog raises the bridge and returns the seat from disk; if you will not wait — verstak_stand.",
    fromCache: () => "from the previous list",
    fromServer: () => "from the server",
    cached: (n) => `Verstak: tools from the previous list: ${n}; checking with the server.`,
    raised: (n) => `Verstak: the bridge is up, tools in the session: ${n} (from the server).`,
    died: (message) => `Verstak: the bridge died (${message}) — raising a new one.`,
    builds: (bridge, plugin) => `build: bridge ${bridge}, plugin ${plugin}`,
    unreadable: () => "unreadable",
    serverChanged: (n) => `Verstak: the server changed its tools — now ${n} in the session.`,
    idleShort: (idle, watch) =>
      `VERSTAK_BRIDGE_IDLE_MS (${idle}) is not longer than the hearing watchdog's tact (${watch}): a slot may be reaped before its seat returns`,
    statusDescription: () =>
      "State of the Verstak bridge in this OpenCode session: whether sign-in is done, the authorization address, how many verstak_* tools are up. " +
      "Call it when there are no verstak_* tools or they answer with a sign-in refusal.",
    statusBridge: (path) => `bridge: ${path}`,
    statusLoginPending: (open, elsewhere) =>
      `sign-in: NOT DONE — ${open}. ` +
      `The address is local: ${elsewhere} (the verstak skill, its establish-mcp method).`,
    openInBrowser: (url) => `open ${url} in a browser`,
    finishInBrowser: () => "finish the sign-in in the browser",
    statusLoginDone: () => "sign-in: done, the server answers",
    statusLoginWaiting: () => "sign-in: the bridge has not answered yet (handshake in progress)",
    statusTools: (n, source) => `verstak_* tools: ${n} (${source})`,
    statusBridges: (live, sessions) => `live bridges: ${live}, sessions with a bridge: ${sessions}`,
    commandHead: (id) =>
      `Load the skill \`${id}\` with the \`skill\` tool (id: \`${id}\`) and act strictly by it. ` +
      "The user typed this, not you; their words are below.\n\n",
    commandsCount: (n) => `Verstak: "/" commands from the delivery's skills: ${n}.`,
    frame: () => "frame",
    frameId: (id) => `frame ${id}`,
    frameNoId: () => "frame without id",
    caseBatch: (n) => `case batch (${n})`,
    staleBatch: () => "batch of stale frames",
    wakeBatch: (n) => `wake-up batch (${n})`,
    resumedLabel: () => "word about the returned seat",
    tact: () => "attention tact",
    tactWaits: () => "Verstak: the attention tact waits for the end of the session's turn",
    tactWaitsFolded: () =>
      "Verstak: the attention tact waits for the end of the session's turn — the previous waiting one is folded",
    childGone: (frame, id, text) =>
      `Verstak: ${frame} for the seat of child session ${id}, which no longer exists — not readdressing it to the root; ` +
      `the frame stays in the standing's history (verstak_channel history); the child session's seat is extra on a channel where the root stands on: whether to revoke it, decide knowing the cost (standing) —${text}`,
    sessionClosed: (id, frame) =>
      `Verstak: session ${id} is closed or archived — the ${frame} goes to the freshest one seen`,
    nowhere: (frame, text) =>
      `Verstak: ${frame} HAS NOWHERE TO GO — the plugin has seen no live root session; the frame stays in the standing's history — ` +
      text,
    delivered: (frame, id) => `Verstak: ${frame} delivered into session ${id}`,
    notDelivered: (frame, id, message) =>
      `Verstak: ${frame} was not delivered into session ${id}: ${message}`,
    held: (key) => `Verstak: the bridge holds the standing ${key}`,
    released: (key, text) => `Verstak: the bridge released the standing ${key} — ${text}`,
  },
};
