// The orchestrator's flag next to the grant and the machine's consent (graph @nks/nks-dev,
// nodes #7507, #7514; case №4050 [85]–[90]). Consent is the human's, not an agent's: either
// the ORCHESTRA variable (envName) in the daemon's own environment, or `orchestra on` typed at a terminal —
// the CLI says so only when its stdin and stdout are a terminal, which an agent's shell tool
// (pipes) is not. The daemon keeps that consent in the flag, takes it at once without a
// restart, and `off` drops it with the flag. A process of the same account can still fake a
// terminal or write the door itself — a bypass, as editing the profile and restarting is.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { envName } from "../delivery/index.ts";
import { seamRunDir } from "../shared/seam-entrance.ts";

export const ORCHESTRA_ENV = envName("ORCHESTRA");
/** The consent of the daemon's own environment. */
export const envAdmitted = (): boolean => {
  const v = process.env[ORCHESTRA_ENV]?.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes";
};

export interface OrchestraFlag {
  on: boolean;
  realms: string[];
  /** Given by `on` typed at a terminal; gone with `off`. */
  consent?: { by: "terminal"; at: string };
}
const flagFile = (authDir: string): string => join(seamRunDir(authDir), "orchestra.json");

/** The flag as it lies next to the grant; null — none lies (a daemon never wrote one). */
export function readOrchestraFlag(authDir: string): OrchestraFlag | null {
  try {
    const f = JSON.parse(readFileSync(flagFile(authDir), "utf8")) as {
      on?: unknown;
      realms?: unknown;
      consent?: { by?: unknown; at?: unknown } | null;
    };
    if (f.on !== true && f.on !== false) return null;
    if (!Array.isArray(f.realms) || f.realms.some((x) => typeof x !== "string")) return null;
    const c = f.consent;
    const consent =
      f.on && c?.by === "terminal" && typeof c.at === "string"
        ? { by: "terminal" as const, at: c.at }
        : undefined;
    return { on: f.on, realms: f.realms as string[], ...(consent ? { consent } : {}) };
  } catch {
    return null;
  }
}

export function writeOrchestraFlag(authDir: string, flag: OrchestraFlag): void {
  mkdirSync(seamRunDir(authDir), { recursive: true, mode: 0o700 });
  const { on, realms, consent } = flag;
  writeFileSync(
    flagFile(authDir),
    JSON.stringify({ on, realms, ...(consent ? { consent } : {}) }) + "\n",
    {
      mode: 0o600,
    },
  );
}

/** The machine admits the orchestrator: its environment, or the consent lying in the flag. */
export const orchestraAdmitted = (authDir: string): boolean =>
  envAdmitted() || !!readOrchestraFlag(authDir)?.consent;
