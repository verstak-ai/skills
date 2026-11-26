// The dsh harness of the orchestrator (graph @nks/nks-dev, node #10777): no Orca — the bridge
// itself runs `dsh headless --json` in its own detached tree. The description's offer may name
// `bin` (the dsh binary, else `dsh` on the daemon's PATH) and `patch` (the delivery's profile
// patch, else the flat install's establish-mcp/references/dsh-profile.yml). dsh 0.2.2-rc.1 has
// no --model: the model `provider/model` rides a second patch overriding agent-default-model.
import {
  accessSync,
  constants,
  existsSync,
  mkdirSync,
  realpathSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { homedir } from "node:os";
import { delimiter, isAbsolute, join } from "node:path";

import { BRIDGE_SKILL, DSH_PROFILE } from "../delivery/index.ts";
import { seamRunDir } from "../shared/seam-entrance.ts";

export interface DshSpec {
  bin: string | null;
  patch: string | null;
}

const KEYS = ["models", "bin", "patch"];

/** The offer's own keys; null — a broken offer (the description refuses whole). */
export function parseDsh(offer: Record<string, unknown>): DshSpec | null {
  if (Object.keys(offer).some((k) => !KEYS.includes(k))) return null;
  const path = (v: unknown): string | null | undefined =>
    v === undefined ? null : typeof v === "string" && isAbsolute(v.trim()) ? v.trim() : undefined;
  const bin = path(offer.bin),
    patch = path(offer.patch);
  if (bin === undefined || patch === undefined) return null;
  return { bin, patch };
}

const runnable = (p: string): boolean => {
  try {
    accessSync(p, constants.X_OK);
    return statSync(p).isFile();
  } catch {
    return false;
  }
};

/** The binary and the patch as they lie on this machine, or the refusal's code. */
export function dshReady(
  spec: DshSpec,
): { bin: string; patch: string } | { code: "dsh_missing" | "dsh_patch_missing" } {
  const bin = spec.bin
    ? runnable(spec.bin)
      ? spec.bin
      : null
    : ((process.env.PATH ?? "")
        .split(delimiter)
        .filter(Boolean)
        .map((d) => join(d, "dsh"))
        .find(runnable) ?? null);
  if (!bin) return { code: "dsh_missing" };
  // The delivery's own profile when the description names none; a delivery without one requires it.
  const patch =
    spec.patch ??
    (DSH_PROFILE ? join(homedir(), ".agents", "skills", BRIDGE_SKILL, DSH_PROFILE) : null);
  if (!patch || !existsSync(patch) || !statSync(patch).isFile())
    return { code: "dsh_patch_missing" };
  return { bin, patch };
}

/** `provider/model` → the overlay of agent-default-model; anything else — null. */
export function modelPatch(model: string): string | null {
  const at = model.indexOf("/");
  if (at <= 0 || at === model.length - 1 || /[\r\n]/.test(model)) return null;
  return (
    "- id: agent-default-model\n  config:\n" +
    `    provider: ${JSON.stringify(model.slice(0, at))}\n` +
    `    model: ${JSON.stringify(model.slice(at + 1))}\n`
  );
}

/** The run's private files beside the registry, never in the agent's tree. */
export function dshFiles(authDir: string, operation: string) {
  const dir = join(seamRunDir(authDir), "dsh");
  return {
    dir,
    model: join(dir, `${operation}.model.yml`),
    events: join(dir, `${operation}.events.ndjson`),
    stderr: join(dir, `${operation}.stderr`),
  };
}

export function writeModelPatch(path: string, dir: string, text: string): void {
  mkdirSync(dir, { recursive: true, mode: 0o700 });
  writeFileSync(path, text, { mode: 0o600 });
}

/** The tree's shared git-dir as a physical path, else null (graph @nks/nks-dev, node #10777). */
export function sharedGitDir(commonDir: unknown): string | null {
  if (typeof commonDir !== "string" || !isAbsolute(commonDir)) return null;
  try {
    return realpathSync.native(commonDir);
  } catch {
    return null;
  }
}

/** `--patch` is dsh's launcher option, before the app's `--json` (observed live, case 5308). */
export const dshArgv = (
  patch: string,
  model: string,
  brief: string,
  session?: string,
  gitDir?: string | null,
): string[] => [
  "headless",
  "--patch",
  patch,
  "--patch",
  model,
  ...(session ? ["--session-id", session] : []),
  // workspace-write admits only the cwd; a linked tree commits into the shared git-dir (#10777).
  ...(gitDir ? ["--add-dir", gitDir] : []),
  "--json",
  brief,
];
