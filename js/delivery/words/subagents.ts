// doctor's subagents section (SUBAGENT), the action-line label and the satellite entry
// forms; the entry code's reference is SATELLITE_CODE in product.ts.
import type { SatForm } from "../../cli/satform.ts";
import type { Lang } from "../lang.ts";

export interface SubagentWords {
  todo: () => string;
  form: (form: Exclude<SatForm, "eval">) => string;
  osJudged: (platform: string) => string;
  header: (root: string, os: string) => string;
  noFiles: (dirs: string) => string;
  shadowed: (path: string, agent: string) => string;
  withBlock: (ready: string) => string;
  proposed: (name: string) => string;
  refEntry: (name: string, block: string) => string;
  formEntry: (name: string, form: string, block: string) => string;
  noEntry: (block: string) => string;
  sharedName: (agent: string) => string;
  replaceEntry: (name: string, form: string, block: string) => string;
  noCommand: (name: string, command: string) => string;
  noBridge: (bridge: string, home: string) => string;
  callerBridges: (need: string, fix: string) => string;
  ownRemoved: (own: string) => string;
  nameShared: (name: string, count: number, files: string, agent: string) => string;
  noGrantAgain: () => string;
  noGrant: (advice: string) => string;
  sameFailed: (label: string) => string;
  sameProbe: (label: string) => string;
  userScope: () => string;
  named: (first: string, ...rest: string[]) => string;
  unnamed: () => string;
  fine: () => string;
  ocKeys: (keys: string) => string;
  ocAgent: (path: string, keyNote: string) => string;
  trustNear: (near: string, here: string) => string;
  trustNone: (here: string) => string;
}

export const SUBAGENT: Readonly<Record<Lang, SubagentWords>> = {
  en: {
    todo: () => "TODO:",
    form: (form) => {
      switch (form) {
        case "eval-no-sep":
          return '--satellite stands without `--` after the `node -e` code — node takes it for its own flag ("bad option") and will not start';
        case "eval-session":
          return "the bridge will not see --satellite in its argv (no `--` before it, or the bridge path is not put into argv[1]) and will stand as a session bridge, not a satellite";
        case "eval-other":
          return "the `node -e` code does not match the reference form — only that form, verified live, is accepted as working";
        case "shell":
          return "the form of the former contract (sh -c): Windows has no sh, and Claude Code does not expand variables in frontmatter args";
        case "path":
          return "the bridge path is written straight into args — a machine path in a shared file, absent on another machine";
        case "session":
          return "the entry calls the bridge without --satellite — the subagent would stand as a session bridge, not a satellite";
      }
    },
    osJudged: (platform) => `OS under judgment: ${platform}`,
    header: (root, os) => `subagents: project ${root} (${os})`,
    noFiles: (dirs) =>
      `  no agent files (${dirs}) — call doctor from the project directory if the subagents are there`,
    shadowed: (path, agent) =>
      `  ${path}: shadowed by the project file with the same name "${agent}" — Claude Code takes the project one`,
    withBlock: (ready) =>
      `with the block below instead of the former mcpServers and disallowedTools:\n${ready}`,
    proposed: (name) => `${name} (proposed form)`,
    refEntry: (name, block) =>
      `entry "${name}" is a reference to a server from the session config, not its own bridge per run → replace it with an inline entry, ${block}`,
    formEntry: (name, form, block) => `entry "${name}": ${form} → ${block}`,
    noEntry: (block) =>
      `no satellite bridge entry — the subagent has no graph tools → insert into the frontmatter ${block}`,
    sharedName: (agent) =>
      `the entry is named "verstak-sub" — the shared name of the former contract: a second file with it would run its runs through the same bridge process → rename the entry to verstak-sub-${agent}`,
    replaceEntry: (name, form, block) => `entry "${name}": ${form} → replace ${block}`,
    noCommand: (name, command) =>
      `the command of entry "${name}" "${command}" is not found on this machine (PATH) → install Node 22+ or add the node directory to PATH: Claude Code launches it via PATH`,
    noBridge: (bridge, home) =>
      `no bridge at the entry path: ${bridge} → install it (the establish-mcp skill places a home copy at ${home}), then repeat doctor`,
    callerBridges: (need, fix) =>
      `the caller's bridges are not removed (${need || "no disallowedTools"}) — the subagent would inherit their tools, and its writes would go out under the caller's seat → replace the line: disallowedTools: ${fix}`,
    ownRemoved: (own) =>
      `disallowedTools removes the entry's own bridge ${own} → remove ${own} from disallowedTools`,
    nameShared: (name, count, files, agent) =>
      `the entry name "${name}" is shared by ${count} file(s): ${files} — Claude Code keeps one connection per entry name, their runs would go through one bridge process, and the first to finish would put out the seat for the others → rename the entry in this file: verstak-sub-${agent}`,
    noGrantAgain: () =>
      "the satellite probe did not run — there is no graph login on this machine (the action is in the line above)",
    noGrant: (advice) =>
      `the satellite probe did not run — there is no graph login on this machine → ${advice}`,
    sameFailed: (label) =>
      `the probe of the same command as "${label}" failed — the action is above`,
    sameProbe: (label) => `probe: the same command as "${label}" above`,
    userScope: () => " (user)",
    named: (...names) => `entry "${names.join('", "')}"`,
    unnamed: () => "no satellite bridge entry",
    fine: () => " — fine",
    ocKeys: (keys) =>
      `; TODO: the key ${keys} is not read by OpenCode in an agent file → remove it`,
    ocAgent: (path, keyNote) =>
      `  ${path}: OpenCode — the delivery plugin gives the child session a satellite bridge (the OpenCode line above), no entry is needed in the file${keyNote}`,
    trustNear: (near, here) =>
      `folder trust was accepted for "${near}", but the project is opened as "${here}" — Claude Code compares the path letter for letter (C:/ and c:/ are different folders), and in an untrusted folder the frontmatter server does not start without a dialog → run claude in a terminal from this folder and accept the trust dialog, or open the folder with the same spelling of the path`,
    trustNone: (here) =>
      `trust for the folder "${here}" and its parents is not marked in ~/.claude.json — in an untrusted folder the frontmatter server does not start, and there is no dialog about it → run claude in this folder and accept the trust dialog`,
  },
};
