// `orchestra step --dry-run` (graph @nks/nks-dev, nodes #8202, #5042; case №4050 [85]): one
// tact read and judged as the leading tact would — the same demands snapshot, the human's
// launcher descriptions, the registry — and said row by row: launched with this argv, or
// refused with this code. Nothing acts: no orca call (a checkout Orca would name at launch is
// said as such, the cover of a checkout the description maps is read), no cursor, registry
// or orders cursor written, no stop order. Neither the flag nor the machine's consent is
// needed: it is the look before switching on.
import { ORCHESTRA, type OrchestraWords } from "../delivery/index.ts";
import { words } from "../shared/lang.ts";
import { readDemands } from "./orchestra-demands.ts";
import type { OrchestraAnswer } from "./orchestra-door.ts";
import { type Launchers, readLaunchers } from "./orchestra-launchers.ts";
import { launchArgv } from "./orchestra-orca.ts";
import { checkoutFor, coverRefusal, refusal } from "./orchestra-raise.ts";
import { readRuns, runKey } from "./orchestra-runs.ts";
import { realmCanon } from "./orchestra-tact.ts";

const w = (): OrchestraWords => words(ORCHESTRA);
const ORCA = "orca";

export async function planTact(
  authDir: string,
  base: string,
  token: string | null,
  mcpUrl: string,
  requested: string[],
  boundary: string[],
): Promise<OrchestraAnswer> {
  if (!base || !token) return { ok: false, said: w().stepNoApi() };
  if (!requested.length) return { ok: true, said: w().stepEmpty() };
  const canon = realmCanon(base, token);
  const realms: string[] = [];
  for (const r of requested) {
    const c = /^r\d+$/i.test(r.trim()) ? await canon(r) : r;
    if (!c) return { ok: false, said: w().stepUnresolvedRealm(r, "not in the realm list") };
    realms.push(c);
  }
  const demands = await readDemands(base, token, realms, boundary);
  if (!demands.complete)
    return {
      ok: false,
      said: w().leadIncomplete(demands.errors.map((e) => `${e.source}:${e.code}`).join(", ")),
    };
  let ls: Launchers;
  try {
    ls = await readLaunchers(mcpUrl, token);
  } catch (e) {
    return { ok: false, said: w().leadNoLaunchers((e as Error).message) };
  }
  // A copy: the launches judged here take their limit slots in it, never on disk.
  const runs = structuredClone(readRuns(authDir));
  const rows = ls.refused.map((r) => w().leadDescription(r.what, r.code));
  for (const row of demands.start) {
    const realm = String(row.realm);
    const room = String(row.room);
    const invite = Number(row.invite);
    const say = (what: string): number => rows.push(w().leadRow(realm, room, invite, what));
    const key = runKey(realm, room, invite);
    const had = runs[key];
    if (had) {
      say(w().planAlready(had.state));
      continue;
    }
    const why = refusal(row, ls, runs);
    const own = ls.own.get(String(row.launcher).trim());
    if (why || !own) {
      say(w().planRefuse(why ?? "launcher_unknown"));
      continue;
    }
    const repository = String(row.repository).trim();
    const got = checkoutFor(own, repository, () => ({ code: ORCA }));
    let worktree: string;
    if (typeof got === "string") {
      const uncovered = await coverRefusal(got, realm, Number(row.karta), canon);
      if (uncovered) {
        say(w().planRefuse(uncovered));
        continue;
      }
      worktree = got;
    } else if (got.code === ORCA) worktree = w().planCheckout(repository);
    else {
      say(w().planRefuse(got.code));
      continue;
    }
    const harness = String(row.harness).trim();
    const model = String(row.model).trim();
    runs[key] = {
      realm,
      room,
      invite,
      karta: Number(row.karta),
      launcher: own.launcher,
      harness,
      model,
      repository,
      worktree,
      state: "launched",
      at: new Date().toISOString(),
    };
    say(w().planLaunch([ORCA, ...launchArgv(harness, worktree, model, w().planBrief())].join(" ")));
  }
  return { ok: true, said: w().plan(rows.join("\n")) };
}
