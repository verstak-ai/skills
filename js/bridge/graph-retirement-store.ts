// Persistent transport metadata (graph @nks/nks-dev, node #9904).
import { randomUUID } from "node:crypto";
import { readFileSync, renameSync, unlinkSync, writeFileSync } from "node:fs";

import { SEEN_KEEP } from "../shared/seen.ts";

export interface Retirement {
  identity: string;
  latestVersion: number | null;
  eventKey: string;
  retiredKeys: string[];
}

const eventKey = (v: unknown): v is string => typeof v === "string" && /^ev:[^\r\n]+$/.test(v);
const identity = (v: unknown): boolean => {
  if (typeof v !== "string") return false;
  try {
    const a = JSON.parse(v) as unknown;
    return (
      Array.isArray(a) &&
      a.length === 2 &&
      typeof a[0] === "string" &&
      !!a[0] &&
      Number.isSafeInteger(a[1]) &&
      a[1] > 0
    );
  } catch {
    return false;
  }
};

export function checkRetirements(entries: Retirement[]): void {
  const ids = new Set<string>();
  let keys = 0;
  for (const e of entries) {
    if (
      !e ||
      !identity(e.identity) ||
      ids.has(e.identity) ||
      !(
        e.latestVersion === null ||
        (typeof e.latestVersion === "number" && Number.isFinite(e.latestVersion))
      ) ||
      !eventKey(e.eventKey) ||
      !Array.isArray(e.retiredKeys) ||
      !e.retiredKeys.every(eventKey) ||
      new Set(e.retiredKeys).size !== e.retiredKeys.length ||
      e.retiredKeys.includes(e.eventKey)
    )
      throw new Error("invalid graph retirement entry");
    ids.add(e.identity);
    keys += 1 + e.retiredKeys.length;
  }
  if (keys > SEEN_KEEP) throw new Error("graph retirement key limit reached");
}

export function readRetirements(path: string): Retirement[] {
  let text: string;
  try {
    text = readFileSync(path, "utf8");
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw e;
  }
  const data = JSON.parse(text) as { version?: unknown; entries?: unknown };
  if (!data || data.version !== 1 || !Array.isArray(data.entries))
    throw new Error("unsupported graph retirement schema");
  const entries = data.entries as Retirement[];
  checkRetirements(entries);
  return entries;
}

/** One Door owns this seat's sidecar. Re-read before every change; no multi-machine lock. */
export function writeRetirements(path: string, entries: Retirement[]): void {
  checkRetirements(entries);
  const tmp = `${path}.${randomUUID()}.tmp`;
  try {
    writeFileSync(tmp, JSON.stringify({ version: 1, entries }) + "\n", { mode: 0o600, flag: "wx" });
    renameSync(tmp, path);
  } finally {
    try {
      unlinkSync(tmp);
    } catch {
      /* renamed, or write refused before creating it */
    }
  }
}
