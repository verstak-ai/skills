// The OpenCode plugin (OPENCODE): door, the tools half, the bridge state tool, slash
// commands, frame attachment.
import type { Lang } from "../lang.ts";
import { tool, TOOL_PREFIX } from "../protocol.ts";

export interface OpencodeWords {
  channelDown: (message: string) => string;
  launchDown: (message: string) => string;
  noticeDown: (message: string) => string;
  /** The tool hook did not come up: a root with a defective cover reseats only on a prompt. */
  realignDown: (message: string) => string;
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
  /** The life check's label in the log (channel.ts). */
  lifeCheck: () => string;
  /**
   * The root's line about a child session's seat the platform warned: the child is not woken.
   * Empty name, role or graph — a placeholder.
   */
  lifeCheckChild: (name: string, karta: string, realm: string) => string;
  childGone: (frame: string, id: string, text: string) => string;
  /** text — the start of the frame. */
  childEnded: (frame: string, id: string, text: string) => string;
  sessionClosed: (id: string, frame: string) => string;
  nowhere: (frame: string, text: string) => string;
  halted: (frame: string, id: string) => string;
  /** The pulse (#7529): the session holds so many frames laid and not taken by its turn yet. */
  pulseOverflow: (id: string, waiting: number) => string;
  haltUnwritten: (id: string, message: string) => string;
  /** kept — the record could not be rewritten as lifted either. */
  haltUnlifted: (id: string, message: string, kept: boolean) => string;
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
    realignDown: (message) =>
      `Verstak: watching the cover after tool calls did not come up; seating after alignment waits for a prompt — ${message}`,
    commandsDown: (message) => `Verstak: the skill commands did not come up — ${message}`,
    noPermissionHooks: () =>
      "Verstak: this OpenCode has no permission hooks — files of the delivery's skills outside the working copy are read with an ask.",
    skillReadsDown: (message) =>
      `Verstak: reading the delivery's skill files did not open — ${message}`,
    hearingLost: (hhmm, message) =>
      `Verstak: hearing lost at ${hhmm} — the standing's bridge exited (${message}). ` +
      `The hearing watchdog raises the bridge and returns the seat from disk; if you will not wait — ${tool("stand")}.`,
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
      `State of the Verstak bridge in this OpenCode session: whether sign-in is done, the authorization address, how many ${TOOL_PREFIX}* tools are up. ` +
      `Call it when there are no ${TOOL_PREFIX}* tools or they answer with a sign-in refusal.`,
    statusBridge: (path) => `bridge: ${path}`,
    statusLoginPending: (open, elsewhere) =>
      `sign-in: NOT DONE — ${open}. ` +
      `The address is local: ${elsewhere} (the verstak skill, its establish-mcp method).`,
    openInBrowser: (url) => `open ${url} in a browser`,
    finishInBrowser: () => "finish the sign-in in the browser",
    statusLoginDone: () => "sign-in: done, the server answers",
    statusLoginWaiting: () => "sign-in: the bridge has not answered yet (handshake in progress)",
    statusTools: (n, source) => `${TOOL_PREFIX}* tools: ${n} (${source})`,
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
    lifeCheck: () => "life check",
    lifeCheckChild: (name, karta, realm) =>
      `Verstak: the platform warned the subagent's seat ${name || "<seat name>"} that it will be put out unless it acts: ` +
      `still working — it answers with its own move; ended — release the seat: ${tool("channel")}(realm="${realm || "<graph>"}", ` +
      `action="revoke", standing="${name || "<seat name>"}", karta=${karta || "<role>"}).`,
    childGone: (frame, id, text) =>
      `Verstak: ${frame} for the seat of child session ${id}, which no longer exists — not readdressing it to the root; ` +
      `a case record stays in the case (${tool("case")} history), a direct word did not reach the root; the child session's seat is extra on a channel where the root stands on: whether to revoke it, decide knowing the cost (standing) —${text}`,
    childEnded: (frame, id, text) =>
      `Verstak: ${frame} not delivered — the subagent of session ${id} has ended, its session is not woken any more; a case record stays in the case (${tool("case")} history) — ${text}`,
    sessionClosed: (id, frame) =>
      `Verstak: session ${id} is closed or archived — the ${frame} goes to the freshest one seen`,
    nowhere: (frame, text) =>
      `Verstak: ${frame} HAS NOWHERE TO GO — the plugin has seen no live root session; a case record stays in the case (${tool("case")} history), a direct word did not arrive — ` +
      text,
    halted: (frame, id) =>
      `Verstak: ${frame} not delivered — session ${id} was stopped by taking its seat off; it is not woken until it takes a seat again explicitly`,
    pulseOverflow: (id, waiting) =>
      `Verstak: ${waiting} frames laid into session ${id} wait for its turn — OpenCode does not take them; the pulse keeps them all`,
    haltUnwritten: (id, message) =>
      `Verstak: the stop of session ${id} was not written to disk (${message}) — only the live plugin instances of this process keep the ban, it will not survive a reload`,
    haltUnlifted: (id, message, kept) =>
      `Verstak: session ${id} holds a seat again and its ban is lifted, but the stop's record on disk was not removed (${message}) — ` +
      (kept
        ? "rewriting it as lifted failed too: after a plugin reload the session will count as stopped again"
        : "it is rewritten as lifted"),
    delivered: (frame, id) => `Verstak: ${frame} delivered into session ${id}`,
    notDelivered: (frame, id, message) =>
      `Verstak: ${frame} was not delivered into session ${id}: ${message}`,
    held: (key) => `Verstak: the bridge holds the standing ${key}`,
    released: (key, text) => `Verstak: the bridge released the standing ${key} — ${text}`,
  },
};
