// The human's launcher descriptions (graph @nks/nks-dev, nodes #5042, #4920; decision of case
// №4050): which orchestrator answers which `launcher` value of a role invite, with what harnesses
// and models, how many raised at once; checkouts come from Orca, an optional map overrides. They
// live in the human's own graph "mind" as nodes with attribute slice:orchestra, body — one JSON
// object; the daemon reads them under its own key, whose account (the "me" tool's whoami) is the one
// whose calls are own — another account's only when the description lists it in callers. A description naming another host is someone
// else's; one without a host answers any leading machine; a broken one raises nothing, aloud.
import { hostname } from "node:os";
import { isAbsolute } from "node:path";

import { tool } from "../delivery/index.ts";
import { mcpSession } from "../shared/mcpsession.ts";
import { type ClonePolicy, parseClone } from "./orchestra-clone.ts";

/** The harness's name is Orca's --agent value itself (case №4050 [8]). */
export interface HarnessOffer {
  models: string[];
}
export interface Launcher {
  launcher: string;
  /** Absent — the description answers any machine of the account leading with this launcher. */
  host: string | null;
  adapter: "orca";
  limit: number;
  harnesses: Record<string, HarnessOffer>;
  /** Optional: overrides Orca's own project setups for its keys. */
  checkouts: Record<string, string>;
  /** Optional: other accounts (handles, lower case, no @) whose calls this launcher answers. */
  callers: string[];
  /** Optional: clone a repository Orca does not know (orchestra-clone.ts); null — never. */
  clone: ClonePolicy | null;
}
export interface Launchers {
  /** The account the daemon's key belongs to (handle, lower case, no @) — its calls are own. */
  account: string;
  /** This machine's launchers by their selector. */
  own: Map<string, Launcher>;
  /** Selectors described for other hosts: the host named — said aloud, for a host that names
   * no machine raises nowhere. */
  elsewhere: Map<string, string>;
  /** Descriptions that raise nothing: the selector (or node) and the code. */
  refused: { what: string; code: string }[];
}

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
  if (d.adapter !== "orca") return { code: "adapter_unsupported", launcher };
  if (!Number.isSafeInteger(d.limit) || (d.limit as number) < 0)
    return { code: "limit_missing", launcher };
  const harnesses: Record<string, HarnessOffer> = {};
  const h = d.harnesses;
  if (!h || typeof h !== "object" || Array.isArray(h))
    return { code: "harnesses_missing", launcher };
  for (const [name, o] of Object.entries(h as Record<string, unknown>)) {
    const x = (o ?? {}) as Record<string, unknown>;
    if (!Array.isArray(x.models) || !x.models.every(str))
      return { code: "harness_invalid", launcher };
    harnesses[name] = { models: (x.models as string[]).map((m) => m.trim()) };
  }
  const checkouts: Record<string, string> = {};
  const c = d.checkouts ?? {};
  if (typeof c !== "object" || Array.isArray(c)) return { code: "checkouts_invalid", launcher };
  for (const [repo, path] of Object.entries(c as Record<string, unknown>)) {
    if (!str(path) || !isAbsolute(path)) return { code: "checkouts_invalid", launcher };
    checkouts[repo] = path;
  }
  const callers = d.callers ?? [];
  if (!Array.isArray(callers) || !callers.every((h) => str(h) && HANDLE.test(h.trim())))
    return { code: "callers_invalid", launcher };
  const clone = parseClone(d);
  if (clone && "code" in clone) return { code: clone.code, launcher };
  return {
    launcher,
    host: str(d.host) ? d.host.trim() : null,
    adapter: "orca",
    limit: d.limit as number,
    harnesses,
    checkouts,
    callers: (callers as string[]).map((h) => h.trim().slice(1).toLowerCase()),
    clone,
  };
}

/** The account of a seat address @handle or @handle:name, lower case; anything else — null. */
export function accountOf(address: unknown): string | null {
  if (typeof address !== "string") return null;
  const m = /^@([^\s:@/]+)(?::\S*)?$/.exec(address.trim());
  return m ? m[1].toLowerCase() : null;
}

/** The descriptions as they lie in mind; a failed read throws — the tact raises nothing. */
export async function readLaunchers(serverUrl: string, token: string): Promise<Launchers> {
  const s = mcpSession(serverUrl, token, "orchestra");
  const out: Launchers = { account: "", own: new Map(), elsewhere: new Map(), refused: [] };
  const here = hostname().toLowerCase();
  try {
    await s.open();
    // The key's own identity, as the server names it: «… handle @name …» (live 09.11.2026).
    const me = await s.call(tool("me"), { action: "whoami" });
    const handle = /\bhandle @([^\s:@/()·]+)/.exec(me)?.[1];
    if (!handle) throw new Error("account_unknown");
    out.account = handle.toLowerCase();
    const found = await s.call(tool("search"), {
      realm: "mind",
      q: "",
      attrs_filter: SLICE,
      limit: LIMIT,
    });
    const seqs = [...new Set([...found.matchAll(/\(#(\d+), /g)].map((m) => m[1]))];
    const mine: Launcher[] = [];
    for (const seq of seqs) {
      const body = await s.call(tool("look"), { realm: "mind", node_id: `#${seq}`, raw: true });
      const l = parseLauncher(body);
      if ("code" in l) {
        out.refused.push({ what: l.launcher ?? `#${seq}`, code: l.code });
        continue;
      }
      // Host names are case-insensitive: the human writes what the machine shows, in any case.
      if (l.host === null || l.host.toLowerCase() === here) mine.push(l);
      else out.elsewhere.set(l.launcher, l.host);
    }
    for (const l of mine) {
      if (mine.filter((x) => x.launcher === l.launcher).length > 1) {
        if (!out.refused.some((r) => r.what === l.launcher))
          out.refused.push({ what: l.launcher, code: "launcher_duplicate" });
        continue;
      }
      out.own.set(l.launcher, l);
    }
    return out;
  } finally {
    await s.close();
  }
}
