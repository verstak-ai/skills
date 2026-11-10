// The orchestra subcommand: the bridge orchestrator leading agents (graph @nks/nks-dev, nodes
// #7513, #7514, #8202): the flag, the graph boundary and one tact — through the machine daemon's
// local entrance. The daemon owns the launches; the flag lies next to the grant and outlives a
// daemon restart.
import type { Lang } from "../lang.ts";
import { tool } from "../protocol.ts";

export interface OrchestraWords {
  usage: () => string;
  /** No daemon — the operation is refused with its reason, not in silence. */
  noDaemon: () => string;
  /** The entrance is silent: the daemon listens but did not answer in time. */
  doorSilent: () => string;
  /** The line is no known action of the entrance. */
  unknownOp: (op: string) => string;
  /** The entrance's service refused with an error — an answer to the caller, not silence. */
  doorError: (message: string) => string;
  /** The machine gave no consent: neither `on` typed at a terminal nor the daemon's environment. */
  notAdmitted: () => string;
  /** realms — the named boundary, comma-separated (may be empty). */
  on: (realms: string) => string;
  /** The short rN form does not ride the REST api — the boundary is not taken; name the full address. */
  onShortRealm: (realms: string) => string;
  off: () => string;
  /** tact — the lines of cursors and last tact outcomes joined by "; " (may be empty). */
  status: (on: boolean, realms: string, found: string, tact?: string) => string;
  /** The tact is empty: off, or the named boundary is empty — nothing to read. */
  stepEmpty: () => string;
  /** parts — the tact's per-graph lines, already joined by "; ". */
  step: (parts: string) => string;
  /** One graph of the tact: invitations, signals and their causes (the api's words for causes). */
  tactRealm: (realm: string, invites: number, signals: number, causes: string) => string;
  /** Why the tact is refused: a graph did not read; no cursor moved, no orders went out. */
  stepReadError: (realm: string, why: string) => string;
  /** A live seat's short form does not resolve through the realm list — the boundary is incomplete, the tact refused. */
  stepUnresolvedRealm: (realm: string, why: string) => string;
  /** The api address is unknown: no live channel and no hold records — the channel carries it, not the MCP server. */
  stepNoApi: () => string;
  /** The caller left before the tact ended: its refusal is already spoken — no cursor moved. */
  stepGone: () => string;
  /** The status line of a graph's last tact: outcome, cursor and when. */
  tactOut: (realm: string, invites: number, signals: number, cursor: string, at: string) => string;
  /** The status line of a repository's clone: cloning (running in the daemon's background), cloned or failed with its reason, and since when. */
  cloneOut: (repository: string, state: string, why: string, at: string) => string;
  /** lines — the tact's leading outcomes (raising and extinguishing) joined by "; ". */
  lead: (lines: string) => string;
  /** The outcome for one invitation: graph, case (id), the invitation's number in it and the outcome code (the api's and the bridge's words). */
  leadRow: (realm: string, room: string, invite: number, code: string) => string;
  /** The flag lies, but the machine has not admitted the orchestrator — nothing raised or extinguished. */
  leadNotAdmitted: () => string;
  /** The demands snapshot is incomplete — nothing is raised or extinguished by it. */
  leadIncomplete: (errors: string) => string;
  /** The launcher descriptions in mind did not read — nothing is raised. */
  leadNoLaunchers: (why: string) => string;
  /** A launcher description in mind is unfit — nothing is raised by it. */
  leadDescription: (what: string, code: string) => string;
  /** The account's orders did not read — a stop on demand goes unseen this tact. */
  leadOrdersUnread: (why: string) => string;
  /** The raised agent's brief, after the spawned_for line. */
  brief: (realm: string, karta: number, room: string, invite: number) => string;
  /** Dry run: rows — the per-invitation lines joined by newlines (may be empty). */
  plan: (rows: string) => string;
  /** Dry run: the invitation would be launched by this command. */
  planLaunch: (argv: string) => string;
  /** Dry run: the invitation would be refused with this code. */
  planRefuse: (code: string) => string;
  /** Dry run: the invitation is already in the registry in this state. */
  planAlready: (state: string) => string;
  /** Dry run: the checkout Orca would name at launch — not asked now. */
  planCheckout: (repository: string) => string;
  /** Dry run: had Orca no checkout, this address would be cloned into this directory. */
  planClone: (url: string, destination: string) => string;
  /** Dry run: had Orca no checkout, the clone would be refused with this code. */
  planNoClone: (code: string) => string;
  /** Dry run: the brief's place in argv. */
  planBrief: () => string;
  /** on --launcher: the description written in mind (seq — its node number, may be empty; holon — the holon of the work with agents, empty — the root). */
  describeWritten: (launcher: string, seq: string, holon: string) => string;
  /** on --launcher: the launcher name is longer than the description reading takes — the flag is not moved. */
  describeTooLong: (launcher: string, max: number) => string;
  /** on --launcher: this launcher's description already lies there — taken as it is. */
  describeTaken: (launcher: string, seq: string) => string;
  /** on --launcher: a new description is not written without models — the flag is not moved. */
  describeNoModel: (launcher: string) => string;
  /** on --launcher: the description did not read or write — the flag is not moved. */
  describeFailed: (launcher: string, why: string) => string;
  /** The name of the description's node in mind. */
  describeName: (launcher: string) => string;
  /** The reasoning of the description's write. */
  describeReason: () => string;
}

export const ORCHESTRA: Readonly<Record<Lang, OrchestraWords>> = {
  en: {
    usage: () =>
      "usage: orchestra <on|off|status|step [--dry-run]|demands> [--realm <graph>]… [--auth-dir <dir>] [--lang en]\n" +
      "       orchestra on --launcher <name> [--model <id>]… [--limit N] [--host <machine>] — describes the launcher in mind unless one lies there\n",
    noDaemon: () =>
      "the machine daemon is not running — the orchestrator lives by the daemon and its local entrance; raise a bridge (any harness session raises the daemon) and retry",
    doorSilent: () =>
      "the daemon's entrance did not answer in time — the daemon is alive but busy or older than orchestra; retry later",
    unknownOp: (op) => `orchestra: unknown op ${op}`,
    doorError: (message) => `the daemon's entrance answered with an error: ${message}`,
    notAdmitted: () =>
      "the machine has not admitted the orchestrator: consent is the human's — this same orchestra on typed at a terminal, or VERSTAK_ORCHESTRA=1 in the daemon's environment; an agent's shell (no terminal) gives none, and the flag is not moved",
    on: (realms) =>
      `the orchestrator is on${realms ? `, named boundary: ${realms}` : " (the boundary is the graphs of the machine's live agents)"}; the flag lies next to the grant`,
    onShortRealm: (realms) =>
      `the boundary is not taken: ${realms} — the short rN form does not ride the REST doors of the api (live probe: 404 "Realm not found"); name the graph by its full address — the owner's handle/slug from the list of graphs`,
    off: () =>
      "the orchestrator is off; raised agents live out their own path — the switching off itself extinguishes none",
    status: (on, realms, found, tact) =>
      on
        ? `on; named boundary: ${realms || "—"}${found ? `; graphs of the machine's live agents: ${found}` : " (plus the graphs of the machine's live agents)"}${tact ? `; tact: ${tact}` : ""}`
        : `off${tact ? `; tact: ${tact}` : ""}`,
    stepEmpty: () =>
      "the tact is empty: the orchestrator is off or the boundary is empty — no named graphs and no live places on the machine",
    step: (parts) => `the tact passed: ${parts}`,
    tactRealm: (realm, invites, signals, causes) =>
      `${realm}: invites ${invites}, signals ${signals}${causes ? ` (${causes})` : ""}`,
    stepReadError: (realm, why) =>
      `the tact is refused whole: ${realm} did not read (${why}) — no cursor moved, no stop order went out`,
    stepUnresolvedRealm: (realm, why) =>
      `the tact is refused: ${realm} — a live place's graph is named by its short form and the realm list does not resolve it (${why}); the boundary is incomplete, no cursor moved`,
    stepNoApi: () =>
      "the tact is refused: the api address is unknown — the daemon holds no live channel and no hold records; the channel (the connect answer) carries the api address, not the mcp server",
    stepGone: () =>
      "the tact commits nothing: the caller left before its end — the refusal has already been spoken, no cursor moved",
    tactOut: (realm, invites, signals, cursor, at) =>
      `${realm}: invites ${invites}, signals ${signals}, cursor ${cursor || "—"} (${at})`,
    cloneOut: (repository, state, why, at) =>
      `clone of ${repository}: ${state}${why ? ` (${why})` : ""} (${at})`,
    lead: (lines) => `leading: ${lines}`,
    leadRow: (realm, room, invite, code) => `${realm} case ${room} invite ${invite}: ${code}`,
    leadNotAdmitted: () =>
      "the flag lies, but the machine has not admitted the orchestrator (orchestra on typed at a terminal, or VERSTAK_ORCHESTRA=1 in the daemon's environment) — no agent is raised or extinguished",
    leadIncomplete: (errors) =>
      `the demands snapshot is incomplete (${errors}) — nothing raised or extinguished by it`,
    leadNoLaunchers: (why) =>
      `the launcher descriptions in mind did not read (${why}) — nothing is raised`,
    leadDescription: (what, code) =>
      `the launcher description ${what} in mind: ${code} — nothing is raised by it`,
    leadOrdersUnread: (why) =>
      `the account's orders did not read (${why}) — the next tact sees a stop on demand of a raised seat`,
    brief: (realm, karta, room, invite) =>
      `You are already taken: the orchestrator raised you for invitation ${invite} of case ${room} in graph ${realm}, role #${karta}, and your seat stood by the first line. ` +
      `Do not register again. Before any work, join the case: ${tool("case")}(action="join", realm="${realm}", room="${room}"). ` +
      "Read the case's assignment and its acceptance criteria; do not invent a task.",
    plan: (rows) =>
      `dry run — nothing launched, ordered or moved (Orca not asked):${rows ? `\n${rows}` : " no invites"}`,
    planLaunch: (argv) => `would launch: ${argv}`,
    planRefuse: (code) => `would refuse: ${code}`,
    planAlready: (state) => `already in the registry: ${state}`,
    planCheckout: (repository) => `<orca checkout of ${repository}>`,
    planClone: (url, destination) =>
      `if Orca has no checkout — would clone ${url} into ${destination}`,
    planNoClone: (code) => `if Orca has no checkout — would not clone: ${code}`,
    planBrief: () => "<brief>",
    describeWritten: (launcher, seq, holon) =>
      `the description of launcher ${launcher} written in mind${seq ? ` (#${seq})` : ""}` +
      (holon
        ? ` under the holon of the work with agents ${holon}`
        : " at the root: no single holon of the work with agents (holding slice:agents cards) was found — move it under one when there is"),
    describeTooLong: (launcher, max) =>
      `launcher name ${launcher} is longer than ${max} characters — the bridge would not take such a description; name it shorter, the flag is not moved`,
    describeTaken: (launcher, seq) =>
      `launcher ${launcher}: the existing description is taken from mind (${seq}), untouched — edit it there`,
    describeNoModel: (launcher) =>
      `no description of launcher ${launcher} in mind, and none is written without --model — name the models (--model <id>, any number); the flag is not moved`,
    describeFailed: (launcher, why) =>
      `the description of launcher ${launcher} did not read or write (${why}) — the flag is not moved`,
    describeName: (launcher) => `🚀 Agent launcher ${launcher}`,
    describeReason: () => "the human switched raising on with orchestra on --launcher",
  },
};
