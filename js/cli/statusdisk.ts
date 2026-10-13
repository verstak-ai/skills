// Read-only local records: a file alone is not a live seat (#7494, graph @nks/nks-dev).
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { readFallbacks } from "../bridge/fallback.ts";
import { record, type SessionSnapshot, text } from "../shared/snapshot.ts";

export interface DiskPlace {
  name: string;
  realm: string;
  karta: string | number;
  left: boolean;
  kind: "record";
}
export interface FallbackSnapshot {
  pid: number;
  build: string;
  cwd: string;
}
export async function diskPlaces(
  authDir: string,
  sessions: SessionSnapshot[] = [],
): Promise<DiskPlace[]> {
  const dir = join(authDir, "standings");
  let names: string[];
  try {
    names = readdirSync(dir)
      .filter((n) => n.endsWith(".hold"))
      .sort();
  } catch {
    return [];
  }
  const rows = await Promise.all(
    names.map(async (n) => {
      try {
        const p = record(JSON.parse(readFileSync(join(dir, n), "utf8")));
        if (!text(p.name) || !text(p.realm) || !["string", "number"].includes(typeof p.karta))
          return null;
        if (
          sessions.some((s) =>
            s.places.some(
              (held) =>
                held.name === p.name &&
                held.realm === p.realm &&
                String(held.karta) === String(p.karta),
            ),
          )
        )
          return null;
        return {
          name: text(p.name),
          realm: text(p.realm),
          karta: p.karta as string | number,
          left: p.left === true,
          kind: "record" as const,
        };
      } catch {
        return null;
      }
    }),
  );
  return rows.filter((p): p is DiskPlace => p !== null);
}
export const fallbackSnapshot = (authDir: string): FallbackSnapshot[] =>
  readFallbacks(authDir).map((f) => ({ pid: f.pid, build: text(f.build), cwd: text(f.cwd) }));
