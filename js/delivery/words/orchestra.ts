// The orchestra subcommand: the bridge orchestrator leading agents (graph @nks/nks-dev, nodes
// #7513, #7514, #8202): the flag, the graph boundary and one tact — through the machine daemon's
// local entrance. The daemon owns the launches; the flag lies next to the grant and outlives a
// daemon restart.
import type { Lang } from "../lang.ts";

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
  /** The machine gave no consent: the daemon's environment does not admit the orchestrator. */
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
}

export const ORCHESTRA: Readonly<Record<Lang, OrchestraWords>> = {
  en: {
    usage: () =>
      "usage: orchestra <on|off|status|step> [--realm <graph>]… [--auth-dir <dir>] [--lang en]\n",
    noDaemon: () =>
      "the machine daemon is not running — the orchestrator lives by the daemon and its local entrance; raise a bridge (any harness session raises the daemon) and retry",
    doorSilent: () =>
      "the daemon's entrance did not answer in time — the daemon is alive but busy or older than orchestra; retry later",
    unknownOp: (op) => `orchestra: unknown op ${op}`,
    doorError: (message) => `the daemon's entrance answered with an error: ${message}`,
    notAdmitted: () =>
      "the machine has not admitted the orchestrator: the daemon's consent is the VERSTAK_ORCHESTRA=1 environment variable of its own process; without it raising agents is refused and the flag is not moved",
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
  },
};
