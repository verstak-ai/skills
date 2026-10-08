// Canonical directory path for comparison and hashing (graph @nks/nks-dev, node #5048):
// OpenCode gives the same directory as /private/tmp/… or /tmp/… (a symlink on macOS).
// Links resolved, trailing separator dropped; on failure the string as given.
import { realpathSync } from "node:fs";
import { sep } from "node:path";

export function canonDir(p: string): string {
  let real = p;
  try {
    real = realpathSync.native(p);
  } catch {
    /* no directory or no access — compare the string */
  }
  while (real.length > 1 && (real.endsWith("/") || real.endsWith(sep))) real = real.slice(0, -1);
  return real;
}

/** Whether this is the same directory; empty with empty is not. */
export const sameDir = (a: string | null | undefined, b: string | null | undefined): boolean =>
  !!a && !!b && (a === b || canonDir(a) === canonDir(b));
