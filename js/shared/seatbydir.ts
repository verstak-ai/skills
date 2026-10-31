// The seat a harness's bridge holds for a session directory, read from the hold records on disk
// (graph @nks/nks-dev, nodes #5061, #7320) — without the bridge. Only an unambiguous answer:
// exactly one live, not released seat of that harness taken from that directory; none or
// several — null, never a guess.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { sameDir } from "./canon.ts";
import { HOLD_RECORD_MAX_AGE_MS, standingsDirOf } from "./standings.ts";

export interface DirSeat {
  realm: string;
  karta: string;
  name: string;
}

export function seatByDir(
  authDir: string,
  cwd: string,
  client: string,
  now = Date.now(),
): DirSeat | null {
  const seats = new Map<string, DirSeat>();
  let files: string[];
  try {
    files = readdirSync(standingsDirOf(authDir)).filter((f) => f.endsWith(".hold"));
  } catch {
    return null;
  }
  for (const f of files) {
    try {
      const r = JSON.parse(readFileSync(join(standingsDirOf(authDir), f), "utf8")) as Record<
        string,
        unknown
      >;
      if (r?.client !== client || r.left === true || !sameDir(r.cwd as string, cwd)) continue;
      if (typeof r.at !== "number" || now - r.at > HOLD_RECORD_MAX_AGE_MS) continue;
      if (typeof r.realm !== "string" || !r.realm || r.karta == null) continue;
      if (typeof r.name !== "string" || !r.name) continue;
      const seat = { realm: r.realm, karta: String(r.karta), name: r.name };
      seats.set(`${seat.realm}\0${seat.karta}\0${seat.name}`, seat);
    } catch {
      /* foreign or broken file */
    }
  }
  return seats.size === 1 ? [...seats.values()][0] : null;
}
