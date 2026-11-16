// The harnesses of one launcher description (graph @nks/nks-dev, nodes #10096, #10777): each
// offer's models, and the keys of the description's own adapter — dsh's under "bridge", exec of
// opencode under "orca". A harness of the other adapter stays a bare offer: its calls are refused
// (harness_adapter_mismatch), not the whole description.
import { parseExec } from "./exec-spec.ts";
import { parseDsh } from "./orchestra-dsh.ts";
import { type Adapter, HARNESS_ADAPTER, type HarnessOffer } from "./orchestra-launcher-types.ts";

const str = (v: unknown): v is string => typeof v === "string" && v.trim() !== "";

export function parseHarnesses(
  h: unknown,
  adapter: Adapter,
): { offers: Record<string, HarnessOffer> } | { code: string } {
  if (!h || typeof h !== "object" || Array.isArray(h)) return { code: "harnesses_missing" };
  const harnesses: Record<string, HarnessOffer> = {};
  for (const [name, o] of Object.entries(h as Record<string, unknown>)) {
    const x = (o ?? {}) as Record<string, unknown>;
    if (!Array.isArray(x.models) || !x.models.every(str)) return { code: "harness_invalid" };
    harnesses[name] = { models: (x.models as string[]).map((m) => m.trim()) };
    if (HARNESS_ADAPTER[name] && HARNESS_ADAPTER[name] !== adapter) continue;
    if (name === "dsh") {
      const dsh = parseDsh(x);
      if (!dsh) return { code: "dsh_invalid" };
      harnesses[name].dsh = dsh;
    } else if (Object.hasOwn(x, "exec")) {
      const exec = name === "opencode" ? parseExec(x.exec, harnesses[name].models) : null;
      if (!exec) return { code: "exec_invalid" };
      harnesses[name].exec = exec;
    }
  }
  return { offers: harnesses };
}

/** Why a harness this description offers is not raised by it; null — it is. */
export function harnessRefusal(adapter: Adapter, harness: string): string | null {
  const own = HARNESS_ADAPTER[harness];
  return !own ? "harness_unsupported" : own !== adapter ? "harness_adapter_mismatch" : null;
}
