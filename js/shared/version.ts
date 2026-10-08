// Between releases a build is told apart by the hash of the bytes of the file
// asking, so edited copies and stale rebuilds name what actually ran.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { BUILD_MARK, CHANNEL_MARK, VERSION } from "../delivery/index.ts";

export { VERSION };

/** This build is a release: the only kind the machine's home trusts as a newer bridge (graph @nks/nks-dev, node #6650). */
export const releaseBuild = (): boolean => CHANNEL_MARK.endsWith(":release");
/** Another copy's text is a release build. The mark is assembled at runtime so its letters appear in an output only when the release build stamped them. */
export const releaseBuildIn = (text: string): boolean =>
  text.includes(`"${[BUILD_MARK, "release"].join(":")}"`);
/** Another copy's text is an explicit dev build. A copy without a mark (releases before 7.2.8) is neither. */
export const devBuildIn = (text: string): boolean =>
  text.includes(`"${[BUILD_MARK, "dev"].join(":")}"`);

/** Build string `vX.Y.Z+hash` for the file whose `import.meta.url` is passed. */
export function buildOf(selfUrl: string): string {
  try {
    const src = readFileSync(fileURLToPath(selfUrl));
    return `v${VERSION}+${createHash("sha256").update(src).digest("hex").slice(0, 8)}`;
  } catch {
    return `v${VERSION}`;
  }
}

/** Build string of another copy by its file: version from its text, hash of its bytes; null when unreadable. */
export function buildOfFile(path: string): string | null {
  try {
    const src = readFileSync(path);
    const v = versionIn(src.toString("utf8")) ?? "?";
    return `v${v}+${createHash("sha256").update(src).digest("hex").slice(0, 8)}`;
  } catch {
    return null;
  }
}

/** A channel mark literal in a copy's text: `"<name>-build:dev"` or `"<name>-build:release"`. */
const MARK_LITERAL = /"([^"\s]+-build):(?:dev|release)"/g;

/**
 * Version declared in another copy's text, read as a string without running it;
 * null when unreadable or when the copy is another delivery's bridge (its channel
 * mark names another build). A copy without a mark (old releases) is read as before.
 */
export function versionIn(text: string): string | null {
  for (const [, name] of text.matchAll(MARK_LITERAL)) if (name !== BUILD_MARK) return null;
  const m = /^(?:const|let|var)\s+VERSION\s*=\s*"([^"]+)"/m.exec(text);
  return m ? m[1] : null;
}
