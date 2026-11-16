// One in-memory offer resolution for actual and dry tacts (#5042, #10096).
import { harnessRefusal } from "./orchestra-harnesses.ts";
import { accountOf, type Launcher, type Launchers } from "./orchestra-launchers.ts";
import { homeOf } from "./orchestra-raise-gates.ts";
import { LIVE, type Run } from "./orchestra-runs.ts";

type Row = Record<string, unknown>;
const text = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v.trim() : null);
const missing = (v: unknown): boolean => v === null || v === undefined;
/** A harness the description's own adapter raises (#10096): opencode under orca, dsh under bridge. */
const fits = (l: Launcher, h: string): boolean => harnessRefusal(l.adapter, h) === null;

export function resolveInvite(
  source: Row,
  ls: Launchers,
  runs: Record<string, Run>,
): { row: Row; own: Launcher } | { code: string } {
  const caller = accountOf(source.author);
  if (!caller || !ls.account) return { code: "caller_unknown" };
  const allowed = (l: Launcher): boolean => caller === ls.account || l.callers.includes(caller);
  const launcher = text(source.launcher);
  let own: Launcher | undefined;
  if (!missing(source.launcher)) {
    own = launcher ? ls.own.get(launcher) : undefined;
    if (!own) {
      const broken = ls.refused.find((r) => r.what === launcher);
      return {
        code:
          broken?.code ??
          (launcher && ls.elsewhere.has(launcher) ? "host_elsewhere" : "launcher_unknown"),
      };
    }
    if (!allowed(own)) return { code: "caller_not_allowed" };
  } else {
    const local = [...ls.own.values()];
    const admitted = local.filter(allowed);
    if (!admitted.length) return { code: local.length ? "caller_not_allowed" : "launcher_missing" };
    const candidates = admitted.filter((l) => {
      const harnesses = missing(source.harness)
        ? Object.keys(l.harnesses)
        : [text(source.harness) ?? ""];
      return harnesses.some(
        (h) =>
          fits(l, h) &&
          l.harnesses[h] &&
          l.harnesses[h].models.length > 0 &&
          (missing(source.model) || l.harnesses[h].models.includes(text(source.model) ?? "")),
      );
    });
    // A single description can still explain an explicit invalid offer precisely; never replace it.
    if (!candidates.length && admitted.length === 1) own = admitted[0];
    else if (!candidates.length) {
      const named = text(source.harness) ?? "";
      const offering = admitted.find((l) => l.harnesses[named]);
      const fitting = admitted.some((l) => l.harnesses[named] && fits(l, named));
      return {
        code:
          !missing(source.harness) && !offering
            ? "harness_not_offered"
            : offering && !fitting
              ? (harnessRefusal(offering.adapter, named) ?? "harness_unsupported")
              : !missing(source.model)
                ? "model_not_offered"
                : "launcher_missing",
      };
    } else if (candidates.length > 1) return { code: "launcher_ambiguous" };
    else own = candidates[0];
  }
  const harnesses = Object.keys(own.harnesses).filter((h) => fits(own, h));
  if (missing(source.harness) && harnesses.length !== 1)
    return { code: harnesses.length ? "harness_ambiguous" : "harness_missing" };
  const harness = missing(source.harness) ? harnesses[0] : (text(source.harness) ?? "");
  const offer = own.harnesses[harness];
  if (!offer) return { code: "harness_not_offered" };
  const refused = harnessRefusal(own.adapter, harness);
  if (refused) return { code: refused };
  const models = [...new Set(offer.models)];
  if (missing(source.model) && models.length !== 1)
    return { code: models.length ? "model_ambiguous" : "model_missing" };
  const model = missing(source.model) ? models[0] : (text(source.model) ?? "");
  if (!models.includes(model)) return { code: "model_not_offered" };
  // A role with a home in the description is raised there: the call needs no repository (#10598).
  if (!text(source.repository) && !homeOf(own, String(source.realm), Number(source.karta)))
    return { code: own.clone ? "clone_refused (no_repository)" : "no_checkout" };
  const live = Object.values(runs).filter(
    (r) => r.launcher === own.launcher && LIVE.includes(r.state),
  ).length;
  if (live >= own.limit) return { code: "limit_reached" };
  return { own, row: { ...source, launcher: own.launcher, harness, model } };
}
