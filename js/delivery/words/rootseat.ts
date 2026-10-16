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
  /** The role slot's value names several roles. */
  manyRoles: (file: string, key: string, list: string) => string;
  /** Seated: place — the seat's name, realm and karta — from the cover. */
  seated: (place: string, karta: string, realm: string, file: string) => string;
  /** Not seated: why — the reason as a ready line. */
  notSeated: (why: string) => string;
  /** The bridge or the server refused the seating — the reason in its words. */
  refused: (text: string) => string;
  /** The session's own previous seat returned, but of another role or graph than the cover's. */
  ownOther: (place: string, karta: string, realm: string) => string;
  /** The cover's graph and the seat's graph could not be matched to one another. */
  uncompared: (cover: string, held: string) => string;
  /** The seating did not finish in time; the request goes without a seat. */
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
      `Verstak: the session holds seat ${place} — role #${karta} in ${realm}, per ${file}; no ${tool("stand")} needed.`,
    notSeated: (why) =>
      `Verstak: the session is not seated — ${why}; a seat comes by the human's word or ${tool("stand")}.`,
    refused: (text) => `seating failed: ${text}`,
    ownOther: (place, karta, realm) =>
      `the session's own previous seat ${place} returned in another role or graph (#${karta} in ${realm}) than the cover's`,
    uncompared: (cover, held) => `graph not compared: ${cover} in the cover, ${held} on the seat`,
    late: (seconds) => `seating did not finish in ${seconds} s, the request goes without a seat`,
    noBridge: () => "no bridge raised",
  },
};
