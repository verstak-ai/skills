// A one-shot UUID/invite selector never rewrites a complete demands snapshot (#8202).
import { readDemands } from "./orchestra-demands.ts";
import type { OrchestraAnswer } from "./orchestra-door.ts";
import { readLaunchers } from "./orchestra-launchers.ts";
import { raiseRows } from "./orchestra-raise.ts";
import { roleRefusal } from "./orchestra-role.ts";
import { readRuns, runKey } from "./orchestra-runs.ts";
import { realmCanon } from "./orchestra-tact.ts";

export interface OnlyInvite {
  room: string;
  invite: number;
}
export function parseOnly(value: unknown): OnlyInvite | null {
  if (typeof value !== "string") return null;
  const match =
    /^([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})\/([1-9]\d*)$/i.exec(value);
  if (!match || !Number.isSafeInteger(Number(match[2]))) return null;
  return { room: match[1].toLowerCase(), invite: Number(match[2]) };
}
export function selectInvite(
  rows: Record<string, unknown>[],
  only: OnlyInvite,
): Record<string, unknown> | { code: string } {
  const matches = rows.filter(
    (r) => String(r.room).toLowerCase() === only.room && r.invite === only.invite,
  );
  return matches.length === 1
    ? matches[0]
    : { code: matches.length ? "only_invite_ambiguous" : "only_invite_missing" };
}
export async function selectedStep(
  authDir: string,
  base: string,
  token: string | null,
  mcp: string,
  realms: string[],
  boundary: string[],
  only: OnlyInvite,
  gone?: { gone: boolean },
): Promise<OrchestraAnswer> {
  const snapshot = await readDemands(base, token, realms, boundary, gone);
  if (!snapshot.complete || !token) return { ok: false, said: "only_snapshot_incomplete" };
  const row = selectInvite(snapshot.start, only);
  if ("code" in row) return { ok: false, said: String(row.code) };
  const runs = readRuns(authDir);
  const key = runKey(String(row.realm), String(row.room), Number(row.invite));
  if (runs[key]) return { ok: false, said: "only_invite_already_run" };
  const roleWhy = await roleRefusal(base, token, row);
  if (roleWhy) return { ok: false, said: roleWhy };
  const ls = await readLaunchers(mcp, token);
  // Only this row reaches raising; no folding, stop, expiry, cleanup, or cursor writes.
  const said = await raiseRows(
    authDir,
    [row],
    ls,
    runs,
    realmCanon(base, token),
    async () => null,
    gone,
  );
  const launched = readRuns(authDir)[key];
  return {
    ok: launched?.state === "launched" || launched?.state === "raised",
    said: said.join("; "),
  };
}
