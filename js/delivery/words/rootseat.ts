// The root autoseat's words by the project cover (the core's opencode/rootseat.ts,
// shared/cover.ts): one line to the model before the first request — seated, or why not. No
// cover file — no word at all: the project is not aligned.
import type { Lang } from "../lang.ts";
import { tool } from "../protocol.ts";

export interface RootSeatWords {
  // Why the cover named no seat; file and key are the names from patterns/cover.ts.
  noFrontmatter: (file: string) => string;
  noKey: (file: string, key: string) => string;
  /** The slot's value starts with neither @owner/slug nor rN. */
  noGraph: (file: string, key: string) => string;
  /** The graph slot's value names several distinct graphs. */
  manyGraphs: (file: string, key: string, list: string) => string;
  /** The role slot's value does not start with a reference; ref — its form in the delivery's quotes. */
  noRoleRef: (file: string, key: string, ref: string) => string;
  /** The role slot's value holds several role references. */
  manyRoles: (file: string, key: string, list: string) => string;
  /** Seated on a provisional seat: place — the seat's name, realm and karta — from the cover. */
  seated: (place: string, karta: string, realm: string, file: string) => string;
  /** Seated on the session's own seat returned from disk — not provisional. */
  ownSeated: (place: string, karta: string, realm: string, file: string) => string;
  /** The instance or session was stopped: the seating is cancelled. */
  cancelled: () => string;
  /** A cancelled seating whose seat could not be revoked. */
  cleanupFailed: (place: string, why: string) => string;
  /** The bridge did not prove this attempt took the provisional seat. */
  unproven: () => string;
  /** Not seated: why — the reason as a ready line. */
  notSeated: (why: string) => string;
  /** The bridge or the server refused the seating — the reason in its words. */
  refused: (text: string) => string;
  /** The session holds a seat of another role or graph than the cover's. */
  ownOther: (place: string, karta: string, realm: string) => string;
  /** The session holds a seat whose graph could not be compared with the cover's. */
  heldUncompared: (place: string, karta: string, held: string, cover: string) => string;
  /** The held seat's graph is unknown. */
  unknownRealm: () => string;
  /** The graph could not be compared: cover against the seat. */
  uncompared: (cover: string, held: string) => string;
  /** The seating missed its deadline; the request goes without a seat. */
  late: (seconds: number) => string;
  /** The plugin has no bridge. */
  noBridge: () => string;
}

export const ROOT_SEAT: Readonly<Record<Lang, RootSeatWords>> = {
  en: {
    noFrontmatter: (file) => `${file} carries no YAML front matter`,
    noKey: (file, key) => `the front matter of ${file} has no '${key}' slot`,
    noGraph: (file, key) => `'${key}' in ${file} does not start with @owner/slug or rN`,
    manyGraphs: (file, key, list) => `'${key}' in ${file} names several graphs: ${list}`,
    noRoleRef: (file, key, ref) => `'${key}' in ${file} does not start with a ${ref} reference`,
    manyRoles: (file, key, list) => `'${key}' in ${file} names several roles: ${list}`,
    seated: (place, karta, realm, file) =>
      `Verstak: the session holds seat ${place} — role #${karta} in ${realm}, per ${file}; writes are signed by this seat. For a watch (room/model) or your own name, call ${tool("stand")} — it replaces a provisional seat without take.`,
    /** Seated on the session's own seat returned from disk — not provisional. */
    ownSeated: (place, karta, realm, file) =>
      `Verstak: the session holds its own seat ${place} — role #${karta} in ${realm}, per ${file}; writes are signed by it. A different name requires ${tool("stand")} with take.`,
    cancelled: () => "The instance or session is stopped; no new seating is allowed.",
    cleanupFailed: (place, why) =>
      `Cancelled seating ${place}: could not revoke the seat (${why}); the bridge is closing, the seat may remain until the server's idle expiry.`,
    unproven: () =>
      "the bridge did not prove this attempt took a provisional seat; revoke is not authorized",
    notSeated: (why) =>
      `Verstak: the session is not seated — ${why}; a seat comes by the human's word or ${tool("stand")}.`,
    refused: (text) => `seating failed: ${text}`,
    ownOther: (place, karta, realm) =>
      `Verstak: the session holds seat ${place} — role #${karta} in ${realm}; its role or graph differs from the cover. To change seats, use ${tool("stand")} with take or explicitly revoke the held seat.`,
    /** The session holds a seat whose graph could not be compared with the cover's. */
    heldUncompared: (place, karta, held, cover) =>
      `Verstak: the session holds seat ${place} — role #${karta}, ${held}; its graph is not compared with ${cover} in the cover. To change seats, use ${tool("stand")} with take or explicitly revoke the held seat.`,
    unknownRealm: () => "graph unknown (hold record unavailable)",
    uncompared: (cover, held) => `graph not compared: ${cover} in the cover, ${held} on the seat`,
    late: (seconds) => `seating did not finish in ${seconds} s, the request goes without a seat`,
    noBridge: () => "no bridge raised",
  },
};
