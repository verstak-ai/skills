// Whose seat is under a name and where to stand (graph @nks/nks-dev, nodes #5402, #5407, #6706).
import { SEPARATE, type SeparateWords } from "../delivery/index.ts";
import { sameDir } from "../shared/canon.ts";
import { words } from "../shared/lang.ts";
import { type AskedHearing } from "./call.ts";
import { harnessName } from "./client.ts";
import { localHolder } from "./hearing.ts";
import { holdsStanding, isParked, ledKey, localSocketPathOf, wasEvicted } from "./hold.ts";
import { keyOf, readHoldRecord, seatBaseOf, sessionOfBridge } from "./holdrecord.ts";
import { heardOnReturn } from "./leave.ts";
import { NAME_MAX } from "./names.ts";
import { resumeFromDisk } from "./resume.ts";
import { localSocketAlive } from "./sweep.ts";

const sep = (): SeparateWords => words(SEPARATE);

/** The base the bridge chose the seat from (graph @nks/nks-dev, node #6706); unknown — the name itself. */
export const baseOf = (realm: string, karta: string | number, name: string): string =>
  seatBaseOf(keyOf(realm, karta, name)) ?? name;

/** Seat name number n; over the limit, the base is cut from the end. */
export const suffixed = (base: string, n: number): string =>
  base.slice(0, NAME_MAX - `.${n}`.length).replace(/[-._]+$/, "") + `.${n}`;

/**
 * Own by the hold record: the same harness session stood there (a harness naming
 * no sessions — same client and cwd) and the seat's local socket does not answer
 * (graph @nks/nks-dev, node #6706).
 */
export async function ownByRecord(
  realm: string,
  karta: string | number,
  name: string,
  cwd: string,
): Promise<boolean> {
  const key = keyOf(realm, karta, name);
  const rec = readHoldRecord(key);
  const me = sessionOfBridge();
  if (!rec || (rec.session ?? null) !== me) return false;
  if (!me && (rec.client !== harnessName() || !sameDir(rec.cwd, cwd))) return false;
  return !(await localSocketAlive(localSocketPathOf(key)));
}

type Holder = "mine" | "session" | "taken" | "free" | "unknown";

/** What the board knows of the seat under a name (hearing.ts). */
export type BoardHearing = (name: string) => AskedHearing;

async function holderOf(
  realm: string,
  karta: string,
  name: string,
  hearing: BoardHearing,
  cwd: string,
): Promise<Holder> {
  // A parked seat stays mine while its address lives; a return would prove it otherwise (stand.ts).
  await heardOnReturn();
  if (holdsStanding(realm, karta, name) || isParked(realm, karta, name)) return "mine";
  if (wasEvicted(realm, karta, name)) return "taken";
  const key = keyOf(realm, karta, name);
  if (ledKey() === key) return "mine"; // own seat in the socket reopen window
  const local = await localHolder(key);
  if (local) return local === "self" ? "mine" : local === "session" ? "session" : "taken";
  // Another named session's record: its bridge returns the seat itself.
  if (theirsByRecord(key)) return "taken";
  // Board says listening and no live local holder: only this session's record proves it own.
  const h = hearing(name);
  if (h === "unknown") return "unknown";
  return h === "other" && !(await ownByRecord(realm, karta, name, cwd)) ? "taken" : "free";
}

/** A fresh, unreleased record of another named session (graph @nks/nks-dev, nodes #6706, #6702). */
export function theirsByRecord(key: string): boolean {
  const rec = readHoldRecord(key);
  return !!rec?.session && !rec.left && rec.session !== sessionOfBridge();
}

export type PlaceChoice = { name: string; own: boolean; note: string | null } | { refusal: string };

/**
 * Where to stand under base: base itself if free or own, otherwise the first free
 * or own `root.N`; all taken or unknown — a refusal. `taken` — names known taken.
 */
export async function placeFor(
  realm: string,
  karta: string,
  base: string,
  hearing: BoardHearing,
  cwd: string,
  taken: ReadonlySet<string> = new Set(),
  root = base,
): Promise<PlaceChoice> {
  const holder = async (name: string): Promise<Holder> =>
    taken.has(name) ? "taken" : await holderOf(realm, karta, name, hearing, cwd);
  const first = await holder(base);
  if (first === "unknown") return { refusal: sep().unknown(base) };
  if (first !== "taken") {
    const own = first === "session";
    return { name: base, own, note: own ? sep().ownSession(base) : null };
  }
  for (let n = 2; n <= 99; n++) {
    const cand = suffixed(root, n);
    if (cand === base) continue;
    const h = await holder(cand);
    if (h === "taken") continue;
    if (h === "unknown") return { refusal: sep().unknown(cand) };
    const own = h === "session";
    return { name: cand, own, note: sep().beside(base, cand, own) };
  }
  return { refusal: sep().noFree(base) };
}

export type Resumed = { word: string; pending: number };

/**
 * Seat choice with return by record (graph @nks/nks-dev, node #6706): a seat the
 * record proves own is resumed from disk with hearing; no hearing — it counts as
 * taken. A seat of another graph beside (`besideRealm`) is not resumed from disk.
 */
export async function seatFor(
  realm: string,
  karta: string,
  base: string,
  hearing: BoardHearing,
  besideRealm: boolean,
  cwd: string,
  root = base,
): Promise<{ choice: PlaceChoice; resumed: Resumed | null }> {
  const taken = new Set<string>();
  for (;;) {
    const choice = await placeFor(realm, karta, base, hearing, cwd, taken, root);
    if ("refusal" in choice || choice.own || besideRealm) return { choice, resumed: null };
    const at = choice.name;
    if (hearing(at) !== "other" || !(await ownByRecord(realm, karta, at, cwd)))
      return { choice, resumed: null };
    const resumed = await resumeFromDisk(realm, karta, at);
    if (resumed)
      return {
        choice: at === base ? choice : { ...choice, note: sep().beside(base, at, true) },
        resumed,
      };
    taken.add(at);
  }
}
