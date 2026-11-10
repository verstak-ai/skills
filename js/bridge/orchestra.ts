// The daemon's orchestration: the flag and the named graph boundary (graph @nks/nks-dev,
// nodes #7513, #7514, #8202). The daemon is the owner of runs: the flag lives in its hand and
// persists next to the grant, so a restarted daemon keeps it. The door these ops ride is
// orchestra-door.ts; this file is what they mean. Enabling needs the machine's consent — the
// daemon's environment or `on` typed at a terminal (orchestra-flag.ts) — and without it the
// enabling is refused aloud, the flag untouched. The tact (`step`, and the daemon's own timer
// while leading) reads in orchestra-tact.ts and leads in orchestra-lead.ts; the run registry
// is orchestra-runs.ts.
import type { Server } from "node:net";

import { envName, ORCHESTRA, type OrchestraWords } from "../delivery/index.ts";
import { words } from "../shared/lang.ts";
import { readDemands } from "./orchestra-demands.ts";
import { ensureLauncher, launcherSpecOf } from "./orchestra-describe.ts";
import {
  listenOrchestraDoor,
  type OrchestraAnswer,
  type OrchestraServe,
} from "./orchestra-door.ts";
import {
  envAdmitted,
  orchestraAdmitted,
  readOrchestraFlag,
  writeOrchestraFlag,
} from "./orchestra-flag.ts";
import { leadAct } from "./orchestra-lead.ts";
import { planTact } from "./orchestra-plan.ts";
import { readClones } from "./orchestra-runs.ts";
import { stepTact, tactStateOf } from "./orchestra-tact.ts";

const w = (): OrchestraWords => words(ORCHESTRA);

/** The daemon's way to its server's api: the base beside the channel (shared/channel.ts
 * apiBase — live-verified: the mcp server url does not name the REST doors), "" when
 * unknown, discovered from the daemon's live sessions or the hold records on disk. */
export interface OrchestraNet {
  base: () => string;
  /** The daemon's key (PAT or the grant's access token, as the transport's bearer reads it). */
  token: () => string | null;
  /** The discovered half of the boundary: realms of the machine's live places (#8202). */
  realms?: () => string[];
  /** The mcp server url — the launcher descriptions are read there, in mind (#5042). */
  mcp?: () => string;
  /** The flag moved: the daemon re-reads whether it is held by leading. */
  changed?: () => void;
}

/** The daemon leads: the flag on and the machine's consent given — it stays and tacts. */
export const orchestraLeading = (authDir: string): boolean =>
  orchestraAdmitted(authDir) && readOrchestraFlag(authDir)?.on === true;

/** The orchestrator's own tact while leading (#7513). */
const TACT_MS = Number(process.env[envName("ORCHESTRA_TACT_MS")]) || 60_000;

/** The door, and the daemon's own tact while leading — no agent, no human in the loop (#7513). */
export async function openOrchestra(
  authDir: string,
  serve: OrchestraServe,
  paused: () => boolean,
  say: (line: string) => void,
): Promise<Server> {
  const door = await listenOrchestraDoor(authDir, serve);
  // A tact still running skips the timer's next one: no chain of tacts behind a slow one.
  let busy = false;
  setInterval(() => {
    if (busy || paused() || !orchestraLeading(authDir)) return;
    busy = true;
    void serve("step", [])
      .then(
        (a) => say(`orchestra tact: ${a.said.replace(/\n/g, " · ")}`),
        (e: Error) => say(`orchestra tact failed: ${e.message}`),
      )
      .finally(() => (busy = false));
  }, TACT_MS).unref();
  return door;
}

/**
 * The daemon's answers of the door's ops. `on` extends the named boundary — the human adds
 * graphs; `off` clears it; `status` reads what lies, cursors and last outcomes included;
 * `step` is one reading tact over the named boundary. The discovered half of the boundary
 * (the graphs of the machine's live agents) is not kept in the flag: the daemon reads it
 * from its sessions when it reads the queue — it arrives with the raising slice.
 */
export function orchestraServe(authDir: string, net?: OrchestraNet): OrchestraServe {
  // One tact at a time: the timer's and a caller's step never interleave their launches.
  let tacting: Promise<unknown> = Promise.resolve();
  const step = (gone?: { gone: boolean }): Promise<OrchestraAnswer> => {
    const next = tacting.then(() => stepOnce(gone));
    tacting = next.catch(() => {});
    return next;
  };
  const stepOnce = async (gone?: { gone: boolean }): Promise<OrchestraAnswer> => {
    const flag = readOrchestraFlag(authDir);
    if (!flag?.on) return { ok: true, said: w().stepEmpty() };
    const n = net ?? {
      base: (): string => "",
      token: (): string | null => null,
      realms: (): string[] => [],
    };
    const boundary = [...new Set([...flag.realms, ...(n.realms?.() ?? [])])];
    if (!boundary.length) return { ok: true, said: w().stepEmpty() };
    const base = n.base();
    const token = n.token();
    const act =
      base && token
        ? leadAct(authDir, base, token, n.mcp?.() ?? "", orchestraAdmitted(authDir))
        : undefined;
    return stepTact(authDir, base, token, boundary, gone, act);
  };
  return async (op, realms, gone, extra) => {
    if (op === "demands") {
      const flag = readOrchestraFlag(authDir);
      const boundary = [...new Set([...(flag?.realms ?? []), ...(net?.realms?.() ?? [])])];
      const demands = await readDemands(
        net?.base() ?? "",
        net?.token() ?? null,
        realms,
        boundary,
        gone,
      );
      return { ok: demands.complete, said: "", demands };
    }
    if (op === "on") {
      const prior = readOrchestraFlag(authDir);
      const terminal = extra?.consent === true;
      // A graph added to the boundary is enabling there: the same consent as `on` itself — the
      // consent lying in the flag only re-says what the human named (#7514).
      const widens = realms.some((r) => !(prior?.on ? prior.realms : []).includes(r));
      if (!envAdmitted() && !terminal && (!prior?.consent || widens))
        return { ok: false, said: w().notAdmitted() };
      // A short rN does not ride REST as is (live probe: 404 "Realm not found") — the door
      // refuses it aloud instead of storing a boundary the tact cannot walk (#8202).
      const short = realms.filter((r) => /^r\d+$/i.test(r.trim()));
      if (short.length) return { ok: false, said: w().onShortRealm(short.join(", ")) };
      // The launcher named with on is described first: a refusal leaves the flag unmoved.
      const spec = launcherSpecOf(extra?.launcher);
      let described = "";
      if (spec)
        try {
          described = await ensureLauncher(net?.mcp?.() ?? "", net?.token() ?? null, spec);
        } catch (e) {
          return { ok: false, said: (e as Error).message };
        }
      const named = [...new Set([...(prior?.on ? prior.realms : []), ...realms])];
      const consent = terminal
        ? { by: "terminal" as const, at: new Date().toISOString() }
        : prior?.consent;
      writeOrchestraFlag(authDir, { on: true, realms: named, ...(consent ? { consent } : {}) });
      net?.changed?.();
      return { ok: true, said: [described, w().on(named.join(", "))].filter(Boolean).join("\n") };
    }
    if (op === "off") {
      writeOrchestraFlag(authDir, { on: false, realms: [] });
      net?.changed?.();
      return { ok: true, said: w().off() };
    }
    if (op === "step") return step(gone);
    if (op === "plan") {
      const flag = readOrchestraFlag(authDir);
      // The machine's boundary as demands keeps it (#8202): a named graph narrows, never widens.
      const boundary = [...new Set([...(flag?.realms ?? []), ...(net?.realms?.() ?? [])])];
      return planTact(
        authDir,
        net?.base() ?? "",
        net?.token() ?? null,
        net?.mcp?.() ?? "",
        realms.length ? realms : boundary,
        boundary,
      );
    }
    const flag = readOrchestraFlag(authDir);
    const tact = tactStateOf(authDir);
    const lines = Object.entries(tact.realms).map(([realm, t]) =>
      w().tactOut(realm, t.invites, t.signals, t.cursor ?? "", t.at),
    );
    // A clone runs in the daemon's background — said here, never hidden (#10078, #8202).
    for (const [repo, c] of Object.entries(readClones(authDir)))
      lines.push(w().cloneOut(repo, c.state, c.why ?? "", c.at));
    if (tact.lead) lines.push(w().lead(tact.lead));
    // Both halves of the boundary are said aloud (#8202): the named one from the flag and
    // the discovered one — the graphs this machine's live places stand on.
    const named = flag?.realms ?? [];
    const found = [...new Set(net?.realms?.() ?? [])].filter((r) => !named.includes(r));
    return {
      ok: true,
      said: w().status(!!flag?.on, named.join(", "), found.join(", "), lines.join("; ")),
    };
  };
}
