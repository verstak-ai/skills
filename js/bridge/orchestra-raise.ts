// The raising half of the tact (graph @nks/nks-dev, nodes #5042, #7517, #9968–#9970, #4920;
// decisions of case №4050): a start row of a complete demands snapshot is raised only when its
// invite's author is the daemon's own account or one the launcher's description names in
// callers (№4050 [22]–[23]), its attrs name one of this machine's launchers, a harness the launcher offers and the
// adapter knows (its name is Orca's --agent), and a model the launcher allows; the checkout is
// the description's own for that repository, else exactly one ready local Orca setup of the
// project whose remote is the invite's repository (#4518), and its cover names the call's graph
// and role — the raised root seats itself by it (№4050 [56]); no checkout and a description
// that allows it — Orca clones the repository in the background, a later tact raises it
// (orchestra-clone.ts, #10078). Anything
// else is an outcome said aloud, nothing launched. The invite is taken by the raised agent's own registration with
// spawned_for (its first brief line) — not here; the registry row is written before the launch,
// so a crash never launches twice.
import { existsSync, statSync } from "node:fs";

import { ORCHESTRA, type OrchestraWords } from "../delivery/index.ts";
import { readCover } from "../shared/cover.ts";
import { words } from "../shared/lang.ts";
import { cloneFound, cloneTaken, cloneTurn, specOf } from "./orchestra-cloning.ts";
import { accountOf, type Launcher, type Launchers } from "./orchestra-launchers.ts";
import {
  type CheckoutOf,
  launchArgv,
  orcaCheckouts,
  orcaLaunch,
  orcaReady,
} from "./orchestra-orca.ts";
import { LIVE, type Run, runKey, writeRuns } from "./orchestra-runs.ts";

const w = (): OrchestraWords => words(ORCHESTRA);
/** Harnesses whose launch carries spawned_for in the first brief line (the OpenCode plugin). */
const ADAPTER_HARNESSES = new Set(["opencode"]);

type Row = Record<string, unknown>;
const text = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v.trim() : null);

/** Why this row is not raised here, or null. Another host's launcher is said with the host it
 * names — a host matching no machine would otherwise raise nowhere in silence. */
export function refusal(row: Row, ls: Launchers, runs: Record<string, Run>): string | null {
  const launcher = text(row.launcher);
  if (!launcher) return "launcher_missing";
  const own = ls.own.get(launcher);
  if (!own) {
    const broken = ls.refused.find((r) => r.what === launcher);
    if (broken) return broken.code;
    const host = ls.elsewhere.get(launcher);
    return host ? `host_elsewhere (${host})` : "launcher_unknown";
  }
  const caller = accountOf(row.author);
  if (!caller) return "caller_unknown";
  if (caller !== ls.account && !own.callers.includes(caller)) return "caller_not_allowed";
  const harness = text(row.harness);
  if (!harness) return "harness_missing";
  const offer = own.harnesses[harness];
  if (!offer) return "harness_not_offered";
  if (!ADAPTER_HARNESSES.has(harness)) return "harness_unsupported";
  const model = text(row.model);
  if (!model) return "model_missing";
  if (!offer.models.includes(model)) return "model_not_offered";
  if (!text(row.repository)) return own.clone ? "clone_refused (no_repository)" : "no_checkout";
  const live = Object.values(runs).filter(
    (r) => r.launcher === launcher && LIVE.includes(r.state),
  ).length;
  if (live >= own.limit) return "limit_reached";
  return null;
}

/** The checkout: the description's own key first, else Orca's single ready local setup. */
export function checkoutFor(
  own: Launcher,
  repository: string,
  orca: CheckoutOf,
): string | { code: string } {
  const named = own.checkouts[repository];
  const got = named ? { path: named } : orca(repository);
  if ("code" in got) return got;
  if (!existsSync(got.path) || !statSync(got.path).isDirectory())
    return { code: "checkout_absent" };
  return got.path;
}

/** The raised root seats itself only by its checkout's cover (opencode/rootseat.ts): without one
 * naming the call's graph and role the harness can neither stand nor be stopped (№4050 [56]).
 * A short rN of the cover goes by the realm list. */
export async function coverRefusal(
  worktree: string,
  realm: string,
  karta: number,
  canon: (name: string) => Promise<string | null>,
): Promise<string | null> {
  const c = readCover(worktree);
  if (!c || "why" in c || "foreign" in c) return "checkout_uncovered";
  if (Number(c.karta) !== karta) return "checkout_other_seat";
  const graph = /^r\d+$/i.test(c.realm) ? await canon(c.realm) : c.realm;
  if (!graph) return "checkout_cover_unresolved";
  return graph === realm ? null : "checkout_other_seat";
}

/** Raise what the snapshot asks of this machine; the outcomes as words, one per row said. */
export async function raiseRows(
  authDir: string,
  start: Row[],
  ls: Launchers,
  runs: Record<string, Run>,
  canon: (name: string) => Promise<string | null>,
  gone?: { gone: boolean },
): Promise<string[]> {
  const said: string[] = [];
  let ready: string | null | undefined;
  let orca: CheckoutOf | string | undefined;
  for (const row of start) {
    // The caller left (#8202): no launch after its refusal was spoken.
    if (gone?.gone) break;
    const realm = String(row.realm);
    const room = String(row.room);
    const invite = Number(row.invite);
    const key = runKey(realm, room, invite);
    if (runs[key]) continue;
    const why = refusal(row, ls, runs);
    if (why) {
      said.push(w().leadRow(realm, room, invite, why));
      continue;
    }
    ready = ready === undefined ? await orcaReady() : ready;
    if (ready) {
      said.push(w().leadRow(realm, room, invite, ready));
      continue;
    }
    const own = ls.own.get(String(row.launcher).trim())!;
    const repository = String(row.repository).trim();
    orca = orca === undefined ? await orcaCheckouts() : orca;
    const find = (): ReturnType<typeof checkoutFor> =>
      checkoutFor(
        own,
        repository,
        typeof orca === "string" ? () => ({ code: orca as string }) : orca!,
      );
    let worktree = find();
    if (typeof worktree !== "string" && worktree.code === "no_checkout" && own.clone) {
      const spec = specOf(own);
      const turn = await cloneTurn(authDir, own.clone, spec, repository, gone);
      if (turn === "gone") break;
      if (turn !== "cloned") {
        said.push(w().leadRow(realm, room, invite, turn));
        continue;
      }
      // Orca's projects changed: read again; a clone it did not register, or Orca unreadable
      // now, is said and kept as clone_unregistered.
      orca = await orcaCheckouts();
      worktree = find();
      const lost =
        typeof orca === "string" ||
        (typeof worktree !== "string" && worktree.code === "no_checkout");
      const why = cloneTaken(authDir, repository, spec, !lost);
      if (why) worktree = { code: why };
    }
    if (typeof worktree !== "string") {
      said.push(w().leadRow(realm, room, invite, worktree.code));
      continue;
    }
    // Orca's runtime may finish a clone its client gave up on: the checkout lifts the row.
    cloneFound(authDir, repository);
    const uncovered = await coverRefusal(worktree, realm, Number(row.karta), canon);
    if (uncovered) {
      said.push(w().leadRow(realm, room, invite, uncovered));
      continue;
    }
    if (gone?.gone) break;
    const run: Run = {
      realm,
      room,
      invite,
      karta: Number(row.karta),
      launcher: own.launcher,
      harness: String(row.harness).trim(),
      model: String(row.model).trim(),
      repository,
      worktree,
      state: "launched",
      at: new Date().toISOString(),
    };
    runs[key] = run;
    writeRuns(authDir, runs);
    // The first line is the launch basis the plugin reads (shared/spawned-for.ts firstLineSpawn).
    const prompt =
      `spawned_for: ${JSON.stringify({ invite, room })}\n` +
      w().brief(realm, run.karta, room, invite);
    const got = await orcaLaunch(launchArgv(run.harness, run.worktree, run.model, prompt));
    if (got.handle) run.terminal = got.handle;
    if (got.runtime) run.runtime = got.runtime;
    if (got.outcome === "failed") {
      run.state = "refused";
      run.why = got.why;
    } else if (got.why) run.why = got.why;
    writeRuns(authDir, runs);
    said.push(
      w().leadRow(
        realm,
        room,
        invite,
        got.outcome === "failed" ? got.why! : `launched${got.why ? ` (${got.why})` : ""}`,
      ),
    );
  }
  return said;
}
