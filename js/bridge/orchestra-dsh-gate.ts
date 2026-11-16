// The gates of a dsh call before its tree (#10777): the binary and the patch on this machine,
// the model's form, the checkout — the description's checkouts or homes only, since Orca is
// never asked for a dsh call — and its cover.
import { dshReady, type DshSpec, modelPatch } from "./orchestra-dsh.ts";
import type { Launcher } from "./orchestra-launchers.ts";
import { checkoutFor, coverRefusal, homeOf } from "./orchestra-raise-gates.ts";

type Row = Record<string, unknown>;

export async function dshCheckout(
  own: Launcher,
  spec: DshSpec,
  row: Row,
  canon: (name: string) => Promise<string | null>,
): Promise<{ worktree: string; repository: string } | { code: string }> {
  const got = dshReady(spec);
  if ("code" in got) return got;
  if (!modelPatch(String(row.model).trim())) return { code: "dsh_model_invalid" };
  const realm = String(row.realm),
    karta = Number(row.karta);
  const repository = String(row.repository ?? "").trim();
  const home = homeOf(own, realm, karta);
  const worktree = checkoutFor(own, repository, () => ({ code: "no_checkout" }), home);
  if (typeof worktree !== "string") return worktree;
  const uncovered = await coverRefusal(worktree, realm, karta, canon, !!home);
  return uncovered ? { code: uncovered } : { worktree, repository };
}
