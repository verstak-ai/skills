// Project-local question denial, independent of cover rituals (#10397).
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

import { QUESTIONS } from "../delivery/index.ts";
import { parseJsonc } from "../shared/jsonc.ts";
import { words } from "../shared/lang.ts";

export const QUESTION_POLICY = { action: "tool.use", resource: "question:*", effect: "deny" };

export function object(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

/** Refuse an opaque shape instead of replacing foreign configuration. */
export function denyClaudeQuestion(settings: Record<string, unknown>): boolean {
  if (settings.permissions !== undefined && !object(settings.permissions))
    throw new Error(words(QUESTIONS).permissions());
  const p = (settings.permissions ?? {}) as Record<string, unknown>;
  if (p.deny !== undefined && (!Array.isArray(p.deny) || p.deny.some((v) => typeof v !== "string")))
    throw new Error(words(QUESTIONS).denyArray());
  const deny = (p.deny ?? []) as string[];
  if (deny.includes("AskUserQuestion")) return false;
  settings.permissions = { ...p, deny: [...deny, "AskUserQuestion"] };
  return true;
}

export function hasQuestionDeny(policies: unknown): boolean {
  return (
    Array.isArray(policies) &&
    policies.some(
      (p) =>
        object(p) && p.action === "tool.use" && p.resource === "question:*" && p.effect === "deny",
    )
  );
}

/** Read the unambiguous project layer; JSONC is accepted but never rewritten. */
export function questionConfig(root: string): {
  path: string;
  cfg?: Record<string, unknown>;
  error?: string;
  jsonc: boolean;
} {
  const path = join(root, ".opencode", "opencode.json");
  const jsoncPath = `${path}c`;
  const jsonc = existsSync(jsoncPath);
  const file = jsonc ? jsoncPath : path;
  const fail = (reason: "both" | "parse" | "shape" | "missing") => ({
    path: file,
    jsonc,
    error: words(QUESTIONS).manual(file, reason),
  });
  if (jsonc && existsSync(path)) return fail("both");
  try {
    const cfg: unknown = existsSync(file) ? parseJsonc(readFileSync(file, "utf8")) : {};
    if (!object(cfg) || (cfg.policies !== undefined && !Array.isArray(cfg.policies)))
      return fail("shape");
    if (jsonc && !hasQuestionDeny(cfg.policies)) return fail("missing");
    return { path: file, cfg, jsonc };
  } catch {
    return fail("parse");
  }
}

/** Separate highest project layer: never rewrite JSONC or a user's global config. */
export function prepareQuestionPolicy(root: string, write = true): string | null {
  const { path, cfg, error, jsonc } = questionConfig(root);
  if (error) return error;
  if (!cfg || jsonc || hasQuestionDeny(cfg.policies)) return null;
  try {
    const policies = (cfg.policies ?? []) as unknown[];
    cfg.policies = [...policies, QUESTION_POLICY];
    cfg.$schema ??= "https://opencode.ai/config.json";
    if (!write) return null;
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, `${JSON.stringify(cfg, null, 2)}\n`);
    return null;
  } catch {
    return words(QUESTIONS).manual(path, "parse");
  }
}
