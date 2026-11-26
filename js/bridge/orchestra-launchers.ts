// The human's launcher descriptions (graph @nks/nks-dev, nodes #5042, #4920, #10096; decision of
// case №4050): which orchestrator answers which `launcher` value of a role invite — adapter orca
// (Orca raises opencode) or bridge (the bridge raises dsh, no Orca) — with what harnesses
// and models, how many raised at once; checkouts come from Orca, an optional map overrides, and
// an optional homes map raises a graph's role in a checkout whose cover names another (#10598). They
// live in the human's own graph "mind" as nodes with attribute slice:orchestra, body — one JSON
// object; the daemon reads them under its own key, whose account (the "me" tool's whoami: its id
// line, else its handle) is the one whose calls are own — another account's only when the description
// lists it (@handle or account id) in callers. A description naming another host is someone
// else's; one without a host answers any leading machine; a broken one raises nothing, aloud.
import { hostname } from "node:os";
import { isAbsolute } from "node:path";

import { tool } from "../delivery/index.ts";
import { mcpSession } from "../shared/mcpsession.ts";
import { nodeBody } from "./node-body.ts";
import { readAccount, UUID } from "./orchestra-account.ts";
import { parseClone } from "./orchestra-clone.ts";
import { parseHarnesses } from "./orchestra-harnesses.ts";
import type { Adapter, Launcher, Launchers } from "./orchestra-launcher-types.ts";
import { throughGate } from "./returngate.ts";
import { throughWindow } from "./windowfetch.ts";
export type { HarnessOffer, Launcher, Launchers } from "./orchestra-launcher-types.ts";

const SLICE = "slice:orchestra";
const LIMIT = 50;
const HANDLE = /^@[^\s:@/]+$/;
/** A launcher longer than this is no description: an attrs value's ceiling. */
export const LAUNCHER_MAX = 64;

const str = (v: unknown): v is string => typeof v === "string" && v.trim() !== "";

/** One body as the human wrote it; a code when it cannot stand. */
export function parseLauncher(raw: string): Launcher | { code: string; launcher?: string } {
  let v: unknown;
  try {
    const at = raw.indexOf("{");
    v = JSON.parse(raw.slice(at, raw.lastIndexOf("}") + 1));
  } catch {
    return { code: "description_not_json" };
  }
  const d = (v ?? {}) as Record<string, unknown>;
  if (!str(d.launcher) || d.launcher.length > LAUNCHER_MAX) return { code: "launcher_missing" };
  const launcher = d.launcher.trim();
  if (d.host !== undefined && d.host !== null && !str(d.host))
    return { code: "host_invalid", launcher };
  if (d.adapter !== "orca" && d.adapter !== "bridge")
    return { code: "adapter_unsupported", launcher };
  const adapter: Adapter = d.adapter;
  if (!Number.isSafeInteger(d.limit) || (d.limit as number) < 0)
    return { code: "limit_missing", launcher };
  const parsed = parseHarnesses(d.harnesses, adapter);
  if ("code" in parsed) return { code: parsed.code, launcher };
  const harnesses = parsed.offers;
  const checkouts: Record<string, string> = {};
  const c = d.checkouts ?? {};
  if (typeof c !== "object" || Array.isArray(c)) return { code: "checkouts_invalid", launcher };
  for (const [repo, path] of Object.entries(c as Record<string, unknown>)) {
    if (!str(path) || !isAbsolute(path)) return { code: "checkouts_invalid", launcher };
    checkouts[repo] = path;
  }
  const homes: Record<string, string> = {};
  const m = d.homes ?? {};
  if (typeof m !== "object" || Array.isArray(m)) return { code: "homes_invalid", launcher };
  for (const [role, path] of Object.entries(m as Record<string, unknown>)) {
    if (!/^\S+#[1-9]\d*$/.test(role) || !str(path) || !isAbsolute(path))
      return { code: "homes_invalid", launcher };
    homes[role] = path;
  }
  // A caller is an account: @handle or its id — an account without a handle has only the id (#11011).
  const callers = d.callers ?? [];
  if (
    !Array.isArray(callers) ||
    !callers.every((h) => str(h) && (HANDLE.test(h.trim()) || UUID.test(h.trim())))
  )
    return { code: "callers_invalid", launcher };
  const clone = parseClone(d);
  if (clone && "code" in clone) return { code: clone.code, launcher };
  return {
    launcher,
    host: str(d.host) ? d.host.trim() : null,
    adapter,
    limit: d.limit as number,
    harnesses,
    checkouts,
    homes,
    callers: (callers as string[]).map((h) => h.trim().replace(/^@/, "").toLowerCase()),
    clone,
  };
}

/** The descriptions as they lie in mind; a failed read throws — the tact raises nothing. */
export async function readLaunchers(serverUrl: string, token: string): Promise<Launchers> {
  const s = mcpSession(serverUrl, token, "orchestra", throughWindow); // the down window (#11375)
  const out: Launchers = { account: "", own: new Map(), elsewhere: new Map(), refused: [] };
  const here = hostname().toLowerCase();
  try {
    await throughGate(serverUrl, () => s.open(), "open"); // every upstream initialize (#11375)
    const account = await readAccount(s);
    out.account = account.handle;
    out.accountId = account.id;
    const found = await s.call(tool("search"), {
      realm: "mind",
      q: "",
      attrs_filter: SLICE,
      limit: LIMIT,
    });
    const seqs = [...new Set([...found.matchAll(/\(#(\d+), /g)].map((m) => m[1]))];
    const mine: Launcher[] = [];
    // The mind node of each description of this machine: a duplicate names them all.
    const nodeOf = new Map<Launcher, string>();
    for (const seq of seqs) {
      const body = await nodeBody(s.call, tool("look"), "mind", seq);
      const l = parseLauncher(body);
      if ("code" in l) {
        out.refused.push({ what: l.launcher ?? `#${seq}`, code: l.code });
        continue;
      }
      // Host names are case-insensitive: the human writes what the machine shows, in any case.
      if (l.host === null || l.host.toLowerCase() === here) {
        mine.push(l);
        nodeOf.set(l, `#${seq}`);
      } else out.elsewhere.set(l.launcher, l.host);
    }
    for (const l of mine) {
      const same = mine.filter((x) => x.launcher === l.launcher);
      if (same.length > 1) {
        if (!out.refused.some((r) => r.what === l.launcher))
          out.refused.push({
            what: l.launcher,
            code: "launcher_duplicate",
            nodes: same.map((x) => nodeOf.get(x) ?? "?"),
          });
        continue;
      }
      out.own.set(l.launcher, l);
    }
    return out;
  } finally {
    await s.close();
  }
}
