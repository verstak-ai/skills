// The loss marker (graph @nks/nks-dev: #5140, #6626): a plugin stopped with holding bridges
// writes whom it held; the next instance returns those seats (keep.ts). One instance per
// OpenCode location, a session's tools go through its location's instance, and a delivery
// update reloads them all at once: the file carries the location's tag and only one's own are
// taken — a foreign one would return the seat by this bridge while the session's busy line goes
// by its own instance's bridge, which holds no seat. An older build's untagged file is read by
// all, each taking its own directory's records; its term removes it.
import { createHash } from "node:crypto";
import { mkdirSync, readdirSync, readFileSync, statSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { OPENCODE_KEEP } from "../delivery/index.ts";
import { words } from "../shared/lang.ts";
import { holdFilePathOf } from "../shared/standings.ts";
import type { KeptSlot } from "./keep.ts";
import { processStart } from "./procstart.ts";
import { entryOf, type Home, type LostEntry } from "./records.ts";

type Lost = { at: string; entries: LostEntry[] };
type Held = KeptSlot & { place?: { name: string } | null; moved?: boolean };

const PREFIX = "opencode-lost";
/** The term of an older build's file and of a move record: instances come up in seconds. */
const LEGACY_MS = 2 * 60_000;
/** Slack for the second precision of `ps -o lstart`: a start in the marker's write second is its author. */
const START_SLACK_MS = 1000;

const hash = (s: string) => createHash("sha256").update(s).digest("hex").slice(0, 12);
/**
 * The location tag in the file name; an instance without a location — "any". The directory's
 * spelling as it came, not canonical: OpenCode 2.0.24 keeps an instance per spelling (#5048, case №147).
 */
const tagOf = (home: Home | null): string =>
  home ? hash(`${home.directory}\0${home.workspace ?? ""}`) : "any";
/** The tag of a file `opencode-lost.@<tag>.…`; null — an older build's file. */
const tagIn = (f: string): string | null => /^opencode-lost\.@([^.]+)\./.exec(f)?.[1] ?? null;
/**
 * A file of another live OpenCode server: a machine may run several, each loading the plugin for
 * the same folder (observed 7.2.1→7.2.2, #6626). The author is told by the process start under the
 * pid against the marker's write, not by the file's age (#147 [100]): started earlier — the live
 * author, its marker; later — the pid reused; no process or no start known — take it.
 */
const otherLive = (f: string, path: string): boolean => {
  const pid = Number(/\.(\d+)\.[^.]+\.json$/.exec(f)?.[1]);
  if (!pid || pid === process.pid) return false;
  const started = processStart(pid);
  if (started === null) return false;
  try {
    return started <= statSync(path).mtimeMs + START_SLACK_MS;
  } catch {
    return false;
  }
};

/** The era of the seat from its hold record (the bridge writes it; a pause comes before the marker). */
function stoodAtOf(authDir: string, key: string): number | undefined {
  try {
    const at = JSON.parse(readFileSync(holdFilePathOf(authDir, key), "utf8"))?.stoodAt;
    return typeof at === "number" ? at : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Holding bridges to disk, whom they held: a plugin stop or a session's move to another folder
 * (home — its location). Returns what was written; the file did not land — empty.
 */
export function writeLostMarker(
  authDir: string,
  slots: Iterable<Held>,
  home: Home | null,
): LostEntry[] {
  const entries = [...slots]
    .filter((s) => s.holding && s.session)
    .map((s) =>
      entryOf({
        ...s,
        session: s.session as string,
        of: s.satelliteOf,
        name: s.place?.name,
        stoodAt: s.key ? stoodAtOf(authDir, s.key) : undefined,
      }),
    );
  if (!entries.length) return [];
  try {
    mkdirSync(authDir, { recursive: true, mode: 0o700 });
    const lost: Lost = { at: new Date().toISOString(), entries };
    const rand = Math.random().toString(36).slice(2, 8);
    const name = `${PREFIX}.@${tagOf(home)}.${process.pid}.${rand}.json`;
    writeFileSync(join(authDir, name), JSON.stringify(lost), { mode: 0o600 });
    return entries;
  } catch {
    return []; // the marker is a word, not an obligation
  }
}

/**
 * Whether this location's marker lies untaken (twins.ts: did its instance come up).
 * Another live server's marker of the same directory does not count: takeLostMarker skips it.
 */
export function markerWaits(authDir: string, home: Home | null): boolean {
  try {
    return readdirSync(authDir).some(
      (f) => f.startsWith(`${PREFIX}.@${tagOf(home)}.`) && !otherLive(f, join(authDir, f)),
    );
  } catch {
    return false;
  }
}

/** The file's records this instance takes; an own-tag file is removed, an older build's by its term. */
function readOwn(path: string, tag: string | null, home: Home | null): Lost | null {
  const drop = () => {
    try {
      unlinkSync(path);
    } catch {
      /* removed by another instance */
    }
  };
  let lost: Lost | null = null;
  try {
    const text = readFileSync(path, "utf8");
    if (tag !== null) drop(); // remove first, then parse: a broken file would lie forever otherwise
    lost = JSON.parse(text) as Lost;
  } catch {
    /* removed by another or broken — no word */
  }
  if (tag === null && !(Date.now() - Date.parse(lost?.at ?? "") < LEGACY_MS)) drop();
  if (!lost) return null;
  // An older build wrote untagged: its own record is a record of its own directory.
  const mine = (e: LostEntry) => tag !== null || !home || !e.dir || e.dir === home.directory;
  return { at: lost.at, entries: (lost.entries ?? []).filter(mine) };
}

/** Previous instances' markers of this location, read and removed: the word about lost hearing and the seats' keys. */
export function takeLostMarker(
  authDir: string,
  home: Home | null,
): { text: string | null; entries: LostEntry[]; wordFor: (s: string) => string | null } | null {
  const entries: LostEntry[] = [];
  let at = "";
  let files: string[];
  try {
    files = readdirSync(authDir).filter((f) => f.startsWith(PREFIX) && f.endsWith(".json"));
  } catch {
    return null;
  }
  const mine = tagOf(home);
  const read: { tagged: boolean; lost: Lost }[] = [];
  for (const f of files) {
    const tag = tagIn(f);
    if (tag !== null && tag !== mine) continue; // another location's marker — its instance's
    if (otherLive(f, join(authDir, f))) continue; // another live server's marker — its instance's
    const lost = readOwn(join(authDir, f), tag, home);
    if (lost) read.push({ tagged: tag !== null, lost });
  }
  // Own-tag files first: a session's record from an older build's file does not override them.
  // Then the latest era: a gone twin server's marker lies until this location's next load or a
  // call of a child without its slot here (adopt.now), and its record of a session that stood on
  // another seat here since must not override that seat. The era is when the session stood on the
  // seat (the entry's stoodAt), not when the marker was written; an older build's entry without it
  // — its marker's `at`.
  const eraOf = (e: LostEntry, lost: Lost) => e.stoodAt ?? (Date.parse(lost.at) || 0);
  const best = new Map<string, { tagged: boolean; era: number; e: LostEntry; lost: Lost }>();
  for (const { tagged, lost } of read) {
    // A move not taken by the new folder's instance at once is stale: the session went on.
    const stale = !(Date.now() - Date.parse(lost.at ?? "") < LEGACY_MS);
    for (const e of lost.entries ?? []) {
      if (!e?.session || (e.moved && stale)) continue;
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
  // The word is for roots not moved: children's seats return silently (children.ts), a move is no loss.
  // Each session only about its own seats: a foreign key in its word would call it to return a foreign seat.
  const word = (of: LostEntry[]): string | null => {
    const where = of
      .filter((e) => !e.child && !e.moved)
      .map((e) => e.key ?? e.dir ?? e.session)
      .join(", ");
    return where ? words(OPENCODE_KEEP).lostWord(hhmm, where) : null;
  };
  return {
    text: word(entries), // the log gets all
    entries,
    wordFor: (s) => word(entries.filter((e) => e.session === s)),
  };
}
