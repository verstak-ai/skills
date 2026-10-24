// The stop subcommand: the human takes an agent's seat off from the machine (graph @nks/nks-dev,
// nodes #7518, #5085; the order contract — case #669): a stop order, on an older api — a seat revoke.
import type { Lang } from "../lang.ts";
import { tool } from "../protocol.ts";

export interface StopCliWords {
  usage: () => string;
  noDaemon: () => string;
  notFound: (target: string) => string;
  /** list — the candidates, comma-separated. */
  ambiguous: (target: string, list: string) => string;
  /** A full address named another owner; list — the addresses of this machine's seats of that name. */
  otherOwner: (target: string, list: string) => string;
  /** A full address, and the snapshot knows no addresses of seats of that name — the owner cannot be checked. */
  noOwner: (target: string) => string;
  noId: (seat: string) => string;
  noRecord: (seat: string) => string;
  noServer: (seat: string) => string;
  noKey: (server: string) => string;
  /** The seat's server grant did not refresh or was refused: sign in again, another key is never sent. */
  signIn: (server: string, why: string) => string;
  ordered: (seat: string, order: string) => string;
  revoked: (seat: string) => string;
  gone: (seat: string) => string;
  refused: (seat: string, how: string, status: number, body: string) => string;
  unreachable: (seat: string, why: string) => string;
  /** The seat's graph is a bare name the api's graph list did not resolve: nothing to address. */
  unnamedGraph: (seat: string, realm: string) => string;
}

export const STOP_CLI: Readonly<Record<Lang, StopCliWords>> = {
  en: {
    usage: () => "usage: stop <seat|session id> [--realm <graph>] [--auth-dir <dir>] [--lang en]\n",
    noDaemon: () =>
      `the machine daemon gave no snapshot — no live seats are seen; a seat a bridge holds past the daemon is revoked by its session (${tool("channel")} action=revoke)`,
    notFound: (target) =>
      `the machine daemon has neither a session nor a seat «${target}» — status prints the names and session ids`,
    ambiguous: (target, list) =>
      `«${target}» names several seats: ${list} — narrow it by --realm or name the session id`,
    otherOwner: (target, list) =>
      `this machine has no seat ${target}: the seat of that name here is ${list}, another owner's; stop takes off only this machine's seats by their address, nothing is sent`,
    noOwner: (target) =>
      `the owner of the seat ${target} cannot be checked: the daemon named no address of the seats of that name (not known yet or an older build) — nothing is sent; name the session id from status`,
    noId: (seat) =>
      `the bridge does not know the id of the seat ${seat} yet (hello did not name it) — the order has no address; repeat later`,
    noRecord: (seat) =>
      `there is no hold record of the seat ${seat} on disk — the seat's api address is unknown`,
    noServer: (seat) =>
      `the daemon did not name the server of the seat ${seat} (a build older than stop) — no key can be chosen; update the delivery: update`,
    noKey: (server) =>
      `no account key for the server ${server} — neither a personal token nor an OAuth grant in the grant directory; sign in — the verstak skill's establish-mcp method`,
    signIn: (server, why) =>
      `SIGN IN AGAIN: the grant of the server ${server} did not refresh (${why}) — another server's key is never sent to the seat; sign in — the verstak skill's establish-mcp method, then repeat stop`,
    ordered: (seat, order) =>
      `a stop order is issued to the seat ${seat}${order ? ` (order ${order})` : ""}: the bridge puts the agent down and answers the outcome; whether the seat went — status`,
    revoked: (seat) =>
      `the api has no stop order (404 of the route) — the seat ${seat} is revoked: the agent goes down on the socket's close`,
    gone: (seat) => `the seat ${seat} is already ended (410)`,
    refused: (seat, how, status, body) => `seat ${seat}: ${how} refused (${status}) — ${body}`,
    unreachable: (seat, why) => `seat ${seat}: the api did not answer — ${why}`,
    unnamedGraph: (seat, realm) =>
      `seat ${seat}: the graph "${realm}" names no owner and the api's graph list did not resolve it — nothing is sent; repeat stop once the list answers`,
  },
};
