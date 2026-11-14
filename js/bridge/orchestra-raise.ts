// Raising half of the tact (#7517, #9968–#9970): unchanged shared gates before either adapter.
import { ORCHESTRA, type OrchestraWords } from "../delivery/index.ts";
import { words } from "../shared/lang.ts";
import { execRuntime } from "./exec-launch.ts";
import { execHost } from "./exec-preflight.ts";
import { cloneFound, cloneTaken, cloneTurn, specOf } from "./orchestra-cloning.ts";
import type { Launchers } from "./orchestra-launchers.ts";
import { type CheckoutOf, orcaCheckouts, orcaReady } from "./orchestra-orca.ts";
import { checkoutFor, coverRefusal, homeOf } from "./orchestra-raise-gates.ts";
import { resolveInvite } from "./orchestra-resolve.ts";
import { type Run, runKey } from "./orchestra-runs.ts";
import { startRun } from "./orchestra-start.ts";

export { checkoutFor, coverRefusal } from "./orchestra-raise-gates.ts";
const w = (): OrchestraWords => words(ORCHESTRA);
type Row = Record<string, unknown>;

export async function raiseRows(
  authDir: string,
  start: Row[],
  ls: Launchers,
  runs: Record<string, Run>,
  canon: (name: string) => Promise<string | null>,
  role: (row: Row) => Promise<string | null>,
  gone?: { gone: boolean },
): Promise<string[]> {
  const said: string[] = [];
  let ready: string | null | undefined;
  let orca: CheckoutOf | string | undefined;
  for (const source of start) {
    if (gone?.gone) break;
    const realm = String(source.realm),
      room = String(source.room),
      invite = Number(source.invite);
    const key = runKey(realm, room, invite);
    if (runs[key]) continue;
    const roleWhy = await role(source);
    if (roleWhy) {
      said.push(w().leadRow(realm, room, invite, roleWhy));
      continue;
    }
    const resolved = resolveInvite(source, ls, runs);
    if ("code" in resolved) {
      said.push(w().leadRow(realm, room, invite, resolved.code));
      continue;
    }
    const { row, own } = resolved;
    ready =
      ready === undefined ? await orcaReady((version) => said.push(`Orca ${version}`)) : ready;
    if (ready) {
      said.push(w().leadRow(realm, room, invite, ready));
      continue;
    }
    if (own.harnesses[String(row.harness).trim()].exec && !execHost(own.host)) {
      said.push(w().leadRow(realm, room, invite, "exec_host_unverified"));
      continue;
    }
    // Exec must refuse a remote/unknown runtime before cloning as well as before create.
    if (own.harnesses[String(row.harness).trim()].exec && !(await execRuntime())) {
      said.push(w().leadRow(realm, room, invite, "exec_runtime_unverified"));
      continue;
    }
    const repository = String(row.repository ?? "").trim();
    const home = homeOf(own, realm, Number(row.karta));
    orca = orca === undefined ? await orcaCheckouts() : orca;
    const find = (): ReturnType<typeof checkoutFor> =>
      checkoutFor(
        own,
        repository,
        typeof orca === "string" ? () => ({ code: orca as string }) : orca!,
        home,
      );
    let worktree = find();
    if (!home && typeof worktree !== "string" && worktree.code === "no_checkout" && own.clone) {
      const spec = specOf(own);
      const turn = await cloneTurn(authDir, own.clone, spec, repository, gone);
      if (turn === "gone") break;
      if (turn !== "cloned") {
        said.push(w().leadRow(realm, room, invite, turn));
        continue;
      }
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
    cloneFound(authDir, repository);
    const uncovered = await coverRefusal(worktree, realm, Number(row.karta), canon, !!home);
    if (uncovered) {
      said.push(w().leadRow(realm, room, invite, uncovered));
      continue;
    }
    if (gone?.gone) break;
    said.push(
      w().leadRow(
        realm,
        room,
        invite,
        await startRun(authDir, row, own, repository, worktree, runs, key, canon, gone),
      ),
    );
  }
  return said;
}
