// Owned lifecycle only (#7513, #9256): OFF never reads invitations or raises agents.
import { mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { namedFetch } from "../shared/http.ts";
import { seamRunDir } from "../shared/seam-entrance.ts";
import { writeOwned } from "./doorfiles.ts";
import { foldTape } from "./orchestra-quench.ts";
import { readRuns, writeRuns } from "./orchestra-runs.ts";

export async function bindExecRaised(
  authDir: string,
  base: string,
  token: string,
  realms: string[],
): Promise<void> {
  const path = join(seamRunDir(authDir), "exec-raised-cursors.json");
  let cursors: Record<string, string | null> = {};
  try {
    const value: unknown = JSON.parse(readFileSync(path, "utf8"));
    if (
      !value ||
      typeof value !== "object" ||
      Array.isArray(value) ||
      Object.values(value).some((v) => v !== null && (typeof v !== "string" || !v))
    )
      throw new Error("exec_cursor_invalid");
    cursors = value as Record<string, string | null>;
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e;
  }
  const reads = await Promise.all(
    realms.map(async (realm) => {
      const q = new URLSearchParams({ limit: "200" });
      if (cursors[realm]) q.set("since", cursors[realm]);
      const res = await namedFetch(`${base}/realms/${encodeURIComponent(realm)}/raised?${q}`, {
        headers: { authorization: `Bearer ${token}` },
        redirect: "error",
        signal: AbortSignal.timeout(10_000),
      });
      if (!res.ok) throw new Error("exec_raised_unreadable");
      const value = (await res.json()) as { items?: unknown; cursor?: unknown };
      if (
        !Array.isArray(value?.items) ||
        value.items.some((v) => !v || typeof v !== "object" || Array.isArray(v)) ||
        (value.cursor !== undefined &&
          value.cursor !== null &&
          (typeof value.cursor !== "string" || !value.cursor))
      )
        throw new Error("exec_raised_invalid");
      return {
        realm,
        items: value.items as Record<string, unknown>[],
        cursor: value.cursor as string | null | undefined,
      };
    }),
  );
  const runs = readRuns(authDir);
  const owned = Object.fromEntries(Object.entries(runs).filter(([, run]) => run.exec || run.tree));
  // Registry fsync precedes cursor advancement; a failed write replays the page safely.
  for (const read of reads) foldTape(read.realm, read.items, owned);
  writeRuns(authDir, runs);
  for (const read of reads) if (read.cursor) cursors[read.realm] = read.cursor;
  mkdirSync(seamRunDir(authDir), { recursive: true, mode: 0o700 });
  writeOwned(path, JSON.stringify(cursors) + "\n");
}
