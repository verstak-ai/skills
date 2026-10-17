// Read-only account evidence for the first prompt. Unknown never invites.
import { tool } from "../delivery/index.ts";

type ObjectValue = Record<string, unknown>;
const object = (v: unknown): ObjectValue | null =>
  v !== null && typeof v === "object" && !Array.isArray(v) ? (v as ObjectValue) : null;
const textOf = (v: ObjectValue): string =>
  Array.isArray(v.content) ? v.content.map((c) => object(c)?.text ?? "").join("\n") : "";

/** Fields win over prose. JSON prose also supports MCPs without structuredContent. */
function payload(v: ObjectValue): unknown {
  if ("structuredContent" in v) return v.structuredContent;
  try {
    return JSON.parse(textOf(v));
  } catch {
    return null;
  }
}

/** nks-mcp #466: only the declared data contract, never realm-list prose. */
function emptyList(v: ObjectValue): boolean | null {
  const fields = object(v.structuredContent);
  if (!fields || fields.action !== "list" || !Array.isArray(fields.realms)) return null;
  if (fields.incomplete === true || (fields.dropped !== undefined && fields.dropped !== 0))
    return null;
  let working = false;
  for (const value of fields.realms) {
    const row = object(value);
    if (
      !row ||
      typeof row.ref !== "string" ||
      !/^@[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(row.ref) ||
      typeof row.short !== "string" ||
      !/^r\d+$/.test(row.short) ||
      typeof row.owner !== "string" ||
      !row.owner ||
      (row.owner_kind !== "user" && row.owner_kind !== "org")
    )
      return null;
    if (row.owner_kind !== "user" || row.ref.split("/")[1] !== "mind") working = true;
  }
  return !working;
}

export type OnboardCall = (
  name: string,
  args: ObjectValue,
  signal: AbortSignal,
) => Promise<unknown>;

export type WizardDecision = boolean | "unsupported" | null;

/** Bridge-local failures and a not-yet-available tool can be retried; a server refusal is answered. */
const answeredError = (e: unknown): boolean => {
  const code = object(e)?.code;
  return typeof code === "number" && code < 0 && code !== -32001 && code !== -32601;
};

export async function wizardDue(call: OnboardCall, signal: AbortSignal): Promise<WizardDecision> {
  try {
    const result = object(await call(tool("me"), { action: "readiness" }, signal));
    if (result && !result.isError) {
      const due = object(payload(result))?.wizard_due;
      if (typeof due === "boolean") return due;
    }
  } catch {
    /* Old MCPs have no readiness. A complete list can still witness absence. */
  }
  signal.throwIfAborted();
  try {
    const result = object(await call(tool("realm"), { action: "list" }, signal));
    if (!result) return null;
    const due = !result.isError ? emptyList(result) : null;
    return due ?? "unsupported";
  } catch (e) {
    return answeredError(e) ? "unsupported" : null;
  }
}
