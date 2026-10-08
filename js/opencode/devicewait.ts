// A sign-in code for another device (graph @nks/nks-dev, node #6570) lives minutes, while the
// handshake waits for the grant longer. The bridge keeps a code until its term ends and issues a
// new one only when the old expired: by itself — rewriting the sign-in record
// (`<store>.auth-pending`), or on a call — the code lands beside it (`….auth-pending.device`).
// The plugin asks the bridge again when either changed or the code's term passed.
import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";

import { OPENCODE_KEEP } from "../delivery/index.ts";
import { words } from "../shared/lang.ts";

const UNTIL = /valid until (\d{4}-\d\d-\d\d \d\d:\d\d:\d\d) UTC/;

/**
 * The sign-in page with a code and its term's end — as the bridge named them in its refusal;
 * none because the server has no code sign-in client — the bridge's word why.
 */
export function deviceOf(message: string): string | null {
  const link = /from another device: (\S+)/.exec(message)?.[1];
  if (!link) return /no sign-in by code: (.+?) — or give the bridge/.exec(message)?.[1] ?? null;
  const until = UNTIL.exec(message)?.[1];
  return until ? words(OPENCODE_KEEP).codeUntil(link, until) : link;
}

/** A fingerprint of the sign-in record and the code beside it; null — no record, the sign-in ended. */
function loginStamp(dir: string): string | null {
  try {
    const files = readdirSync(dir).filter(
      (f) => f.endsWith(".auth-pending") || f.endsWith(".auth-pending.device"),
    );
    if (!files.some((f) => f.endsWith(".auth-pending"))) return null;
    return files
      .map((f) => `${f}:${statSync(join(dir, f)).mtimeMs}`)
      .sort()
      .join("|");
  } catch {
    return null;
  }
}

/** The code watch of one refusal. The record gone — the sign-in ended: wait for the grant as before. */
export function codeWatch(dir: string, message: string): { moved: () => boolean } {
  const before = loginStamp(dir);
  const until = UNTIL.exec(message)?.[1];
  const end = until ? Date.parse(`${until.replace(" ", "T")}Z`) : NaN;
  return {
    moved: () => {
      const now = loginStamp(dir);
      if (now !== null && now !== before) return true;
      return now !== null && end <= Date.now();
    },
  };
}
