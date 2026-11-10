// `orchestra on --launcher <name>` (case №4050 [85]–[86]; the description's form — #5042,
// orchestra-launchers.ts): the human switching on from the console describes the launcher in
// the same command. A description of that launcher already lying in mind — any host, even a
// broken one — is taken as it lies and never touched (a second one with the same launcher
// would switch both off); none — the daemon writes one under its own key, the account's mind,
// in the holon of the work with agents as minding lays it. A launcher readLaunchers would refuse
// for its length is refused here, aloud.
import { ORCHESTRA, type OrchestraWords } from "../delivery/index.ts";
import { tool } from "../delivery/index.ts";
import { words } from "../shared/lang.ts";
import { mcpSession } from "../shared/mcpsession.ts";
import { LAUNCHER_MAX, parseLauncher } from "./orchestra-launchers.ts";

const w = (): OrchestraWords => words(ORCHESTRA);

export interface LauncherSpec {
  launcher: string;
  models: string[];
  limit?: number;
  host?: string;
}

/** The spec as the door carried it; null — not one. */
export function launcherSpecOf(v: unknown): LauncherSpec | null {
  const x = (v ?? null) as Record<string, unknown> | null;
  if (!x || typeof x !== "object" || typeof x.launcher !== "string" || !x.launcher.trim())
    return null;
  const models = Array.isArray(x.models)
    ? x.models.filter((m): m is string => typeof m === "string" && m.trim() !== "")
    : [];
  return {
    launcher: x.launcher.trim(),
    models: models.map((m) => m.trim()),
    ...(Number.isSafeInteger(x.limit) ? { limit: x.limit as number } : {}),
    ...(typeof x.host === "string" && x.host.trim() ? { host: x.host.trim() } : {}),
  };
}

/**
 * The holon of the work with agents, as minding lays the description: the one holon of mind
 * that holds the human's slice:agents cards; none or several — "" (the description lies in
 * the root, and the outcome says so).
 */
async function agentsHolon(s: ReturnType<typeof mcpSession>): Promise<string> {
  const holons = await s.call(tool("search"), {
    realm: "mind",
    q: "",
    node_type: "holon",
    limit: 100,
  });
  const found: string[] = [];
  for (const seq of new Set([...holons.matchAll(/\(#(\d+), holon/g)].map((m) => m[1]))) {
    const cards = await s.call(tool("search"), {
      realm: "mind",
      q: "",
      context_holon: `#${seq}`,
      transitive: false,
      attrs_filter: "slice:agents",
      limit: 1,
    });
    if (/\(#\d+, /.test(cards)) found.push(`#${seq}`);
  }
  return found.length === 1 ? found[0] : "";
}

/** The outcome said to the human; a refusal throws its words — the flag is then not moved. */
export async function ensureLauncher(
  serverUrl: string,
  token: string | null,
  spec: LauncherSpec,
): Promise<string> {
  if (spec.launcher.length > LAUNCHER_MAX)
    throw new Error(w().describeTooLong(spec.launcher, LAUNCHER_MAX));
  if (!serverUrl || !token) throw new Error(w().describeFailed(spec.launcher, "no key"));
  const s = mcpSession(serverUrl, token, "orchestra");
  try {
    await s.open();
    const found = await s.call(tool("search"), {
      realm: "mind",
      q: "",
      attrs_filter: "slice:orchestra",
      limit: 50,
    });
    for (const seq of new Set([...found.matchAll(/\(#(\d+), /g)].map((m) => m[1]))) {
      const body = await s.call(tool("look"), { realm: "mind", node_id: `#${seq}`, raw: true });
      if (parseLauncher(body).launcher === spec.launcher)
        return w().describeTaken(spec.launcher, `#${seq}`);
    }
    if (!spec.models.length) throw new Error(w().describeNoModel(spec.launcher));
    if (spec.limit !== undefined && spec.limit < 0)
      throw new Error(w().describeFailed(spec.launcher, "limit"));
    const holon = await agentsHolon(s);
    const description = JSON.stringify({
      launcher: spec.launcher,
      ...(spec.host ? { host: spec.host } : {}),
      adapter: "orca",
      limit: spec.limit ?? 1,
      harnesses: { opencode: { models: spec.models } },
    });
    const made = await s.call(tool("add_phenomenon"), {
      realm: "mind",
      name: w().describeName(spec.launcher),
      given_as: "grundsatz",
      description,
      epistemic_mode: "pratyakshita",
      ontic_mode: "vartamana",
      volitive_mode: "adhimoksha",
      attrs: { slice: "orchestra" },
      ...(holon
        ? { arrows: [{ arrow_type: "context", target: holon, volitive_mode: "adhimoksha" }] }
        : {}),
      reasoning: w().describeReason(),
    });
    return w().describeWritten(spec.launcher, /\(#(\d+)/.exec(made)?.[1] ?? "", holon);
  } catch (e) {
    const m = (e as Error).message;
    throw new Error(m.includes(spec.launcher) ? m : w().describeFailed(spec.launcher, m), {
      cause: e,
    });
  } finally {
    await s.close();
  }
}
