// `orchestra step --dry-run` (graph @nks/nks-dev, nodes #8202, #5042; case №4050 [85]): one
// tact read and judged as the leading tact would — the same demands snapshot, the human's
// launcher descriptions, the registry — and said row by row: launched with this argv, or
// refused with this code. Nothing acts: no orca call (a checkout Orca would name at launch is
// said as such, the cover of a checkout the description maps is read), no cursor, registry
// or orders cursor written, no stop order. Neither the flag nor the machine's consent is
// needed: it is the look before switching on.
import { ORCHESTRA, type OrchestraWords } from "../delivery/index.ts";
import { words } from "../shared/lang.ts";
import { cloneTarget } from "./orchestra-clone.ts";
import { runtimeOver, specOf } from "./orchestra-cloning.ts";
import { readDemands } from "./orchestra-demands.ts";
import type { OrchestraAnswer } from "./orchestra-door.ts";
import { type Launchers, readLaunchers } from "./orchestra-launchers.ts";
import { type OnlyInvite, selectInvite } from "./orchestra-only.ts";
import { launchArgv } from "./orchestra-orca.ts";
import { checkoutFor, coverRefusal } from "./orchestra-raise.ts";
import { resolveInvite } from "./orchestra-resolve.ts";
import { roleRefusal } from "./orchestra-role.ts";
import { readClones, readRuns, runKey } from "./orchestra-runs.ts";
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
  only?: OnlyInvite,
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
  const selected = only ? selectInvite(demands.start, only) : null;
  if (selected && "code" in selected) return { ok: false, said: String(selected.code) };
  let ls: Launchers;
  try {
    ls = await readLaunchers(mcpUrl, token);
  } catch (e) {
    return { ok: false, said: w().leadNoLaunchers((e as Error).message) };
  }
  // A copy: the launches judged here take their limit slots in it, never on disk.
  const runs = structuredClone(readRuns(authDir));
  const clones = readClones(authDir);
  const rows = ls.refused.map((r) => w().leadDescription(r.what, r.code));
  for (const source of selected ? [selected] : demands.start) {
    let row = source;
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
    const roleWhy = await roleRefusal(base, token, row);
    if (roleWhy) {
      say(w().planRefuse(roleWhy));
      continue;
    }
    const resolved = resolveInvite(row, ls, runs);
    if ("code" in resolved) {
      say(w().planRefuse(resolved.code));
      continue;
    }
    row = resolved.row;
    const own = resolved.own;
    const repository = String(row.repository).trim();
    const got = checkoutFor(own, repository, () => ({ code: ORCA }));
    if (typeof got === "string") {
      const uncovered = await coverRefusal(got, realm, Number(row.karta), canon);
      if (uncovered) {
        say(w().planRefuse(uncovered));
        continue;
      }
    } else if (got.code === ORCA) {
      // Whether Orca knows the repository is not asked. One rule: the checkout Orca would name
      // is judged as there — the only case the tact launches in (it looks for a checkout before
      // any clone, even after a failed one), so the call takes its limit slot; what comes
      // without that checkout — clone, refusal, the clone in flight — is said as conditional.
      if (own.clone) {
        const kept = clones[repository];
        const c = cloneTarget(own.clone, repository);
        if (kept && runtimeOver(kept)) say(w().planNoClone("clone_failed (clone_timeout)"));
        else if (kept?.state === "cloning") say(w().planNoClone("cloning"));
        else if (kept?.state === "failed" && kept.spec === specOf(own))
          say(w().planNoClone(`clone_failed_before (${kept.why})`));
        else if ("code" in c) say(w().planNoClone(c.code));
        else say(w().planClone(c.url, c.destination));
      }
    } else {
      say(w().planRefuse(got.code));
      continue;
    }
    const worktree = `<own detached tree of ${repository}>`;
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
    if (own.harnesses[harness].exec) {
      say(
        w().planLaunch(
          [
            ORCA,
            "terminal",
            "create",
            "--worktree",
            `path:${worktree}`,
            "--command",
            "<runtime-local prepare; API create/prompt; exec opencode --server --session>",
            "(exec_preflight_required)",
          ].join(" "),
        ),
      );
    } else
      say(
        w().planLaunch([ORCA, ...launchArgv(harness, worktree, model, w().planBrief())].join(" ")),
      );
  }
  return { ok: true, said: w().plan(rows.join("\n")) };
}
