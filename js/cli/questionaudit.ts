// Three independent questionnaire guard layers, for aligned repos (#10397).
import { copyFileSync, existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { dirname, join } from "node:path";

import { SELF } from "../bridge/raise.ts";
import { envName, PLUGIN_COPY_FILE, PLUGIN_FILE, QUESTIONS } from "../delivery/index.ts";
import { words } from "../shared/lang.ts";
import { ritualCover } from "../shared/ritualcover.ts";
import { PLUGIN_KEY_RE } from "./installnames.ts";
import { hasQuestionDeny, object, questionConfig } from "./preparequestions.ts";
import { probeScope } from "./ritualprobe.ts";
import type { Verdict } from "./rituals.ts";

function json(path: string): Record<string, unknown> | null {
  try {
    const v: unknown = JSON.parse(readFileSync(path, "utf8"));
    return object(v) ? v : null;
  } catch {
    return null;
  }
}

/** The hooks of this delivery's plugin as Claude Code installed it: from an ordinary shell
 * CLAUDE_PLUGIN_ROOT is unset and the home bridge copy has no plugin tree above it. */
function installed(): string | null {
  const reg = json(join(homedir(), ".claude", "plugins", "installed_plugins.json"))?.plugins;
  if (!object(reg)) return null;
  for (const [key, installs] of Object.entries(reg))
    if (PLUGIN_KEY_RE.test(key) && Array.isArray(installs))
      for (const i of installs) {
        const at = object(i) && typeof i.installPath === "string" ? i.installPath : "";
        if (at && existsSync(join(at, "hooks/hooks.json"))) return join(at, "hooks/hooks.json");
      }
  return null;
}

function manifest(): string | null {
  if (process.env.CLAUDE_PLUGIN_ROOT)
    return join(process.env.CLAUDE_PLUGIN_ROOT, "hooks/hooks.json");
  const reg = installed();
  if (reg) return reg;
  for (let dir = dirname(SELF); ;) {
    const path = join(dir, "hooks/hooks.json");
    if (existsSync(path)) return path;
    const up = dirname(dir);
    if (up === dir) return null;
    dir = up;
  }
}

export async function auditQuestions(root: string): Promise<Verdict[]> {
  if (!ritualCover(root)) return [];
  const W = words(QUESTIONS);
  const rows: Verdict[] = [];
  const row = (layer: string, file: string, pass: boolean, error: string): void => {
    const basis = layer === "question.plugin" ? W.pluginBasis() : W.fileBasis();
    rows.push({ layer, basis, file, hole: !pass, ...(pass ? {} : { error }) });
  };
  const text = readFileSync(join(root, "AGENTS.md"), "utf8");
  row(
    "question.instructions",
    join(root, "AGENTS.md"),
    /question/.test(text) && /AskUserQuestion/.test(text) && /\bask\b/.test(text),
    W.instructions(),
  );
  const cc = join(root, ".claude/settings.json");
  const permissions = json(cc)?.permissions;
  const denied =
    object(permissions) &&
    Array.isArray(permissions.deny) &&
    permissions.deny.includes("AskUserQuestion");
  const oc = questionConfig(root);
  const blocked = !oc.error && hasQuestionDeny(oc.cfg?.policies);
  row("question.project", cc, !!denied, W.claudeProject());
  row("question.project", oc.path, blocked, oc.error ?? W.manual(oc.path, "missing"));
  const path = manifest();
  const hooks = path ? json(path)?.hooks : null;
  const entries = object(hooks) ? hooks.PreToolUse : null;
  const hook =
    Array.isArray(entries) &&
    entries.some(
      (e) =>
        object(e) &&
        e.matcher === "AskUserQuestion" &&
        Array.isArray(e.hooks) &&
        e.hooks.some(
          (h) =>
            object(h) &&
            typeof h.command === "string" &&
            /permissionDecision:'deny'/.test(h.command),
        ),
    );
  row("question.plugin", path ?? W.claudeFile(), hook, W.claudePlugin());
  const file = [
    process.env.OPENCODE_CONFIG_DIR &&
      join(process.env.OPENCODE_CONFIG_DIR, "plugins", PLUGIN_COPY_FILE),
    join(dirname(SELF), PLUGIN_FILE),
    join(homedir(), ".config/opencode/plugins", PLUGIN_COPY_FILE),
  ].find((p): p is string => !!p && existsSync(p));
  let pass = false;
  let error = W.opencodeMissing();
  if (file) {
    const foreign = mkdtempSync(join(tmpdir(), "question-audit-"));
    const keys = ["HOME", envName("BRIDGE_AUTH_DIR"), envName("BRIDGE_PATH"), envName("ROOT_SEAT")];
    const before = keys.map((k) => process.env[k]);
    try {
      // The plugin under audit must never connect using the invoking agent's home or grant.
      for (const [i, value] of [foreign, foreign, join(foreign, "absent.mjs"), "0"].entries()) {
        const key = keys[i];
        if (key) process.env[key] = value;
      }
      // Audit the standalone bundle without its package's adjacent bridge.
      const isolatedPlugin = join(foreign, PLUGIN_FILE);
      copyFileSync(file, isolatedPlugin);
      const q = (await probeScope(isolatedPlugin, root, foreign)).questions;
      pass = q.removed && q.denied && q.caseAllowed;
      error = W.opencodeGuard();
    } catch (e) {
      error = String(e);
    } finally {
      keys.forEach((k, i) => {
        if (before[i] === undefined) delete process.env[k];
        else process.env[k] = before[i];
      });
      rmSync(foreign, { recursive: true, force: true });
    }
  }
  row("question.plugin", file ?? W.opencodeFile(), pass, error);
  return rows;
}
