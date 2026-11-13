// The daemon's orchestration: the flag and the named graph boundary (graph @nks/nks-dev,
// nodes #7513, #7514, #8202). The daemon is the owner of runs: the flag lives in its hand and
// persists next to the grant, so a restarted daemon keeps it. The door these ops ride is
// orchestra-door.ts; this file is what they mean. Enabling needs the machine's consent — the
// daemon's environment or `on` typed at a terminal (orchestra-flag.ts) — and without it the
// enabling is refused aloud, the flag untouched. The tact (`step`, and the daemon's own timer
// while leading) reads in orchestra-tact.ts and leads in orchestra-lead.ts; the run registry
// is orchestra-runs.ts.
import type { Server } from "node:net";

import { ORCHESTRA, type OrchestraWords } from "../delivery/index.ts";
import { words } from "../shared/lang.ts";
import { execPending, observeExec } from "./exec-exit.ts";
import { readDemands } from "./orchestra-demands.ts";
import { type OrchestraAnswer, type OrchestraServe } from "./orchestra-door.ts";
import { envAdmitted, orchestraAdmitted, readOrchestraFlag } from "./orchestra-flag.ts";
import { leadAct } from "./orchestra-lead.ts";
import { parseOnly, selectedStep } from "./orchestra-only.ts";
import { planTact } from "./orchestra-plan.ts";
import { orchestraStatus } from "./orchestra-status.ts";
import { switchOrchestra } from "./orchestra-switch.ts";
import { stepTact } from "./orchestra-tact.ts";
import { openOrchestraWatch } from "./orchestra-watch.ts";

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

/** Keep the daemon for consented raising OR an owned exec lifecycle; step still checks the flag. */
export const orchestraLeading = (authDir: string): boolean =>
  execPending(authDir) || (orchestraAdmitted(authDir) && readOrchestraFlag(authDir)?.on === true);

/** The door, and the daemon's own tact while leading — no agent, no human in the loop (#7513). */
export async function openOrchestra(
  authDir: string,
  serve: OrchestraServe,
  paused: () => boolean,
  say: (line: string) => void,
): Promise<Server> {
  return openOrchestraWatch(
    authDir,
    serve,
    paused,
    say,
    () => orchestraAdmitted(authDir) && readOrchestraFlag(authDir)?.on === true,
  );
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
  // A previously launched client's lifecycle survives `off`; this grants no raising consent.
  let observing = false;
  setInterval(() => {
    if (observing || !execPending(authDir)) return;
    observing = true;
    const next = tacting.then(() => observeExec(authDir, net?.base() ?? "", net?.token() ?? null));
    tacting = next.catch(() => {});
    void next
      .catch(() => process.stderr.write("exec_observer_failed\n"))
      .finally(() => {
        observing = false;
      });
  }, 5_000).unref();
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
    const only = extra?.only === undefined ? undefined : parseOnly(extra.only);
    if (only === null || (only && ((op !== "step" && op !== "plan") || realms.length !== 1)))
      return { ok: false, said: "only_requires_step_UUID/invite_and_one_realm" };
    if (only && op === "step") {
      const next = tacting.then(async () => {
        const flag = readOrchestraFlag(authDir);
        if (!(extra?.consent === true || envAdmitted() || (flag?.on && orchestraAdmitted(authDir))))
          return { ok: false, said: "only_not_admitted" };
        const boundary = [...new Set([...(flag?.realms ?? []), ...(net?.realms?.() ?? [])])];
        return selectedStep(
          authDir,
          net?.base() ?? "",
          net?.token() ?? null,
          net?.mcp?.() ?? "",
          realms,
          boundary,
          only,
          gone,
        );
      });
      tacting = next.catch(() => {});
      return next;
    }
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
    if (op === "on" || op === "off") return switchOrchestra(authDir, net, op, realms, extra);
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
        only,
      );
    }
    return orchestraStatus(authDir, net?.realms?.() ?? []);
  };
}
