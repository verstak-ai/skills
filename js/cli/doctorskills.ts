// The skill set lagging behind the bridge (graph @nks/nks-dev, node #4509, keys #6226):
// the set's version is the version of the bridge file inside it, and it differs from
// build.version exactly when the bridge updated and the set did not. The bridge does
// not update skills; the harness channel does, and its move is named.
import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";

import { CFG } from "../bridge/config.ts";
import { skillsRoot } from "../bridge/skillset.ts";
import { readLatest, skillMoves } from "../bridge/update.ts";
import { BRIDGE_FILE, BRIDGE_SKILL, HARNESS, type HarnessWords } from "../delivery/index.ts";
import { words } from "../shared/lang.ts";
import { compareVersions } from "../shared/semver.ts";
import { VERSION, versionIn } from "../shared/version.ts";
import { codexCopies } from "./codexcache.ts";
import { PLUGIN_KEY_RE } from "./installnames.ts";
import { todo } from "./subwords.ts";

type Out = (s: string) => void;
type Kind = "claude" | "codex" | "flat" | "other";

const hw = (): HarnessWords => words(HARNESS);

const IN_SET = join(BRIDGE_SKILL, "scripts", BRIDGE_FILE);

function sets(codexHomes: string[]): [string, Kind][] {
  const found: [string, Kind][] = [];
  try {
    const reg = JSON.parse(
      readFileSync(join(homedir(), ".claude", "plugins", "installed_plugins.json"), "utf8"),
    ) as { plugins?: Record<string, { installPath?: string }[]> };
    for (const [key, installs] of Object.entries(reg.plugins ?? {}))
      if (PLUGIN_KEY_RE.test(key))
        for (const i of installs)
          if (i.installPath) found.push([join(i.installPath, "skills"), "claude"]);
  } catch {}
  for (const home of codexHomes)
    for (const c of codexCopies(home)) found.push([join(c.dir, "skills"), "codex"]);
  found.push([join(homedir(), ".agents", "skills"), "flat"]);
  const own = skillsRoot();
  if (own) found.push([own, "other"]);
  const seen = new Set<string>();
  return found.filter(([root]) => {
    const key = resolve(root);
    if (seen.has(key) || !existsSync(join(root, IN_SET))) return false;
    seen.add(key);
    return true;
  });
}

// The same moves as the bridge's lag line (update.ts); a set outside the three
// channels (pi, a manual copy) is updated by the channel it was installed with.
const how = (kind: Kind): string => {
  const m = skillMoves();
  if (kind === "claude") return `Claude Code — ${m.claude}`;
  if (kind === "codex") return `Codex — ${m.codex}`;
  if (kind === "flat") return m.flat;
  return hw().skillsOtherChannel(m.pi);
};

/** Each delivery skill set on the machine against the bridge build and the known release. */
export function skillsReport(out: Out, codexHomes: string[]): void {
  const latest = readLatest(CFG.authDir)?.version ?? null;
  const target = latest && compareVersions(latest, VERSION) > 0 ? latest : VERSION;
  const found = sets(codexHomes);
  if (!found.length) out(hw().skillsNone());
  for (const [root, kind] of found) {
    let v: string | null = null;
    try {
      v = versionIn(readFileSync(join(root, IN_SET), "utf8"));
    } catch {}
    if (!v) out(hw().skillsUnreadable(root));
    else if (compareVersions(v, target) >= 0) out(hw().skillsCurrent(root, v));
    else {
      // Below the bridge: the method is older than the bridge; level with it but below the release: both lag.
      const below = compareVersions(v, VERSION) < 0;
      const why = below ? hw().skillsBelowBridge(VERSION) : hw().skillsBelowRelease(target);
      out(`${todo()} ${hw().skillsBehind(root, v, why, how(kind))}`);
    }
  }
}
