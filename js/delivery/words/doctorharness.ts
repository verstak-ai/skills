// doctor about harnesses (HARNESS): the PATH entry command, a second path around the
// bridge, skills behind, OpenCode mcp entries.
import type { Lang } from "../lang.ts";

export interface HarnessWords {
  launchFix: (
    harness: "claude" | "codex",
    entry: string | undefined,
    node: string | null,
    bridge: string,
  ) => string;
  launchNotFound: (who: string, cmd: string, absolute: boolean) => string;
  launchAbsolute: (who: string, cmd: string) => string;
  launchFound: (who: string, cmd: string, found: string) => string;
  launchProfile: (who: string, cmd: string, found: string, dir: string) => string;
  openCodeRuntime: () => string;
  secondPath: (where: string, name: string, url: string, remove: string) => string;
  deleteFrom: (file: string) => string;
  connector: (name: string, file: string) => string;
  skillsOtherChannel: (pi: string) => string;
  skillsNone: () => string;
  skillsUnreadable: (root: string) => string;
  skillsCurrent: (root: string, v: string) => string;
  skillsBelowBridge: (bridge: string) => string;
  skillsBelowRelease: (release: string) => string;
  skillsBehind: (root: string, v: string, why: string, how: string) => string;
  ocUnreadable: (file: string) => string;
  ocDisabled: (name: string, file: string) => string;
  ocBridge: (name: string, file: string, path: string) => string;
  ocHttp: (name: string, file: string) => string;
  ocNone: (unreadable: number, cwd: string) => string;
}

export const HARNESS: Readonly<Record<Lang, HarnessWords>> = {
  en: {
    launchFix: (harness, entry, node, bridge) => {
      const abs = node ?? "<absolute node path: command -v node>";
      const shell = "start the harness from a shell where node is found";
      const alt =
        harness === "codex"
          ? "the Codex plugin entry takes no absolute path, and a second entry beside it would make two bridges"
          : `or an entry with the absolute node path, independent of PATH: ${entry ? `claude mcp remove "${entry}" --scope user, then ` : ""}claude mcp add --scope user "${entry ?? "verstak-bridge"}" -- ${abs} "${bridge}"${entry ? "" : " — and disable the plugin entry plugin:verstak:verstak in /mcp so the bridge is one"}; the path is tied to this node install — change it, rewrite the entry`;
      return `    fix: ${shell}; ${alt}`;
    },
    launchNotFound: (who, cmd, absolute) =>
      `TODO: ${who}: the command "${cmd}" is not found${absolute ? "" : " in this shell's PATH"} or not executable — the harness will not raise the bridge (spawn ENOENT)`,
    launchAbsolute: (who, cmd) =>
      `${who}: the command ${cmd} is executable and independent of PATH`,
    launchFound: (who, cmd, found) => `${who}: "${cmd}" → ${found}`,
    launchProfile: (who, cmd, found, dir) =>
      `${who}: "${cmd}" → ${found} — in this shell's PATH; the directory ${dir} is put there by the shell profile or a version manager, and a harness started outside a shell (an app, a service) may not see it. The harness's PATH cannot be seen from here; if the harness says spawn ENOENT — the fix is on the next line`,
    openCodeRuntime: () =>
      "OpenCode: the plugin's bridge runs on OpenCode's own runtime — independent of node in PATH",
    secondPath: (where, name, url, remove) =>
      `TODO: ${where}: the entry "${name}" leads to ${url} directly over http, around the bridge — a second path to the same server: the tools double, and writes on this path go out without a seat. The one path to the graph is the bridge → remove it: ${remove}`,
    deleteFrom: (file) => `delete it from ${file}`,
    connector: (name, file) =>
      `Claude Code: the connector "${name}" is in the connection history (${file}, claudeAiMcpEverConnected; the line stays after removal) — claude.ai connectors come into every Claude Code session next to the bridge, and the connector's address is not on disk. If it is installed and leads to the graph server, it is a second path around the bridge → remove it in claude.ai (Settings → Connectors) or disable it in Claude Code (/mcp)`,
    skillsOtherChannel: (pi) =>
      `by the channel the set was installed with (pi — ${pi}; the order — SETUP.md, section "Update")`,
    skillsNone: () =>
      "skills: no delivery set found (the Claude Code plugin, the Codex plugin, ~/.agents/skills, VERSTAK_SKILLS_ROOT)",
    skillsUnreadable: (root) => `skills: ${root} — the set's version is unreadable`,
    skillsCurrent: (root, v) => `skills: ${root} — v${v}, not behind the bridge`,
    skillsBelowBridge: (bridge) =>
      `BEHIND the bridge v${bridge}: the method in the agent's context is older than the bridge`,
    skillsBelowRelease: (release) =>
      `BEHIND the release v${release}, level with the bridge: the whole delivery is behind (the bridge — the update subcommand)`,
    skillsBehind: (root, v, why, how) =>
      `TODO: skills: ${root} — v${v}, ${why} → update the set: ${how}; then a new session`,
    ocUnreadable: (file) => `OpenCode: ${file} is unreadable`,
    ocDisabled: (name, file) =>
      `OpenCode: the mcp entry "${name}" in ${file} leads to Verstak but is disabled — not in play`,
    ocBridge: (name, file, path) =>
      `OpenCode: the mcp entry "${name}" in ${file} calls ${path} — it looks like the delivery bridge. If it is, its tools are namespaced, and the bridge is shared by the service's sessions: the entry may go out under a neighbouring session's signature. Then remove it from this file by hand: opencode mcp has list, add, auth, logout — there is no remove command. The delivery surface is the plugin`,
    ocHttp: (name, file) =>
      `OpenCode: the mcp entry "${name}" in ${file} leads to Verstak directly over http, around the bridge — its tools are namespaced, it has no channel standing, and its writes go out without a seat. The one path to the graph is the bridge, brought by the delivery plugin. Remove it from this file by hand: opencode mcp has list, add, auth, logout — there is no remove command`,
    ocNone: (unreadable, cwd) =>
      `OpenCode: found no Verstak mcp entries${unreadable ? ` in what I read (${unreadable} file(s) could not be parsed — see the lines above)` : ""} — looked upward from ${cwd}, the global layer and variables; an entry in another tree is not checked by this, call doctor from the project directory`,
  },
};
