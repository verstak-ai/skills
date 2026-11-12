// Project-local question denial, independent of cover rituals (#10397).
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

export const QUESTION_POLICY = { action: "tool.use", resource: "question:*", effect: "deny" };

export function object(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

/** Refuse an opaque shape instead of replacing foreign configuration. */
export function denyClaudeQuestion(settings: Record<string, unknown>): boolean {
  if (settings.permissions !== undefined && !object(settings.permissions))
    throw new Error("permissions must be an object");
  const p = (settings.permissions ?? {}) as Record<string, unknown>;
  if (p.deny !== undefined && (!Array.isArray(p.deny) || p.deny.some((v) => typeof v !== "string")))
    throw new Error("permissions.deny must be a string array");
  const deny = (p.deny ?? []) as string[];
  if (deny.includes("AskUserQuestion")) return false;
  settings.permissions = { ...p, deny: [...deny, "AskUserQuestion"] };
  return true;
}

/** Separate highest project layer: never rewrite JSONC or a user's global config. */
export function prepareQuestionPolicy(root: string, write = true): string | null {
  const path = join(root, ".opencode", "opencode.json");
  try {
    // Two files at the same precedence are ambiguous: leave both for the model.
    if (existsSync(join(root, ".opencode", "opencode.jsonc"))) return path;
    const cfg: unknown = existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : {};
    if (!object(cfg) || (cfg.policies !== undefined && !Array.isArray(cfg.policies))) return path;
    const policies = (cfg.policies ?? []) as unknown[];
    if (
      policies.some(
        (p) =>
          object(p) &&
          p.action === "tool.use" &&
          p.resource === "question:*" &&
          p.effect === "deny",
      )
    )
      return null;
    cfg.policies = [...policies, QUESTION_POLICY];
    cfg.$schema ??= "https://opencode.ai/config.json";
    if (!write) return null;
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, `${JSON.stringify(cfg, null, 2)}\n`);
    return null;
  } catch {
    return path;
  }
}
