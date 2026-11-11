// The installed skill set behind the bridge (SKILL_CATCHUP), said on a seat-taking and a return:
// why the bridge did not write the set itself, the channel's command, the reread after delivery;
// and the writer gate an unconfirmed catch-up leaves behind.
import type { Lang } from "../lang.ts";

type Reason = "patch" | "plugin" | "ownership" | "manifest";

export interface SkillCatchupWords {
  gate: (root: string, installed: string, target: string, path: string, reason?: string) => string;
  notice: (
    root: string,
    source: string,
    installed: string,
    target: string,
    reason: Reason,
    command: string,
  ) => string;
  failed: (
    root: string,
    installed: string,
    target: string,
    error: string,
    command: string,
  ) => string;
  updated: (
    root: string,
    installed: string,
    target: string,
    sha: string,
    stamp: string,
    removed: string[],
  ) => string;
}

const WHY: Readonly<Record<Reason, string>> = {
  patch: "behind by a patch only: a notice, no update",
  plugin: "the harness delivers its plugin itself",
  ownership: "that this delivery owns the set is not proven",
  // The core passes this one code for every own set it leaves alone: another harness, Windows,
  // updates disabled, a dev build, another server — so the word names the conditions, not one.
  manifest:
    "the bridge updates a set itself only for OpenCode, not on Windows, with updates not disabled, from a release build against the production server — one of these does not hold here",
};

export const SKILL_CATCHUP: Readonly<Record<Lang, SkillCatchupWords>> = {
  en: {
    gate: (root, installed, target, path, reason) =>
      `SKILLS DELIVERY BLOCKED: ${JSON.stringify(root)} is v${installed}, the bridge v${target}; a writer gate stands at ${JSON.stringify(path)}; ` +
      `${reason ? `${JSON.stringify(reason)}; ` : ""}the update is not confirmed. ` +
      "First confirm that the updater's process group for this HOME has stopped and that the gate is this catch-up's own. " +
      "Remove the gate only after a complete pinned reread (ref, source, stamp and the bytes of every file) — never on a fresh bridge version or exit 0 alone. " +
      "npx can outlive a bridge daemon killed with SIGKILL; repeating the seat-taking does not clear the gate. Never delete or bypass it automatically.",
    notice: (root, source, installed, target, reason, command) =>
      `SKILLS BEHIND: ${JSON.stringify(root)} (${JSON.stringify(source)}) v${installed} < bridge v${target}; ${WHY[reason]}; not updated. ` +
      `Next command: ${command}. After the update reread the verstak skill and the role's methods: a set on disk is not a loaded context.`,
    failed: (root, installed, target, error, command) =>
      `SKILLS BEHIND: ${JSON.stringify(root)} v${installed} < bridge v${target}; ${JSON.stringify(error)}; the update is not confirmed (if it got as far as writing, own files may be partly written). ` +
      `Next command: ${command}.`,
    updated: (root, installed, target, sha, stamp, removed) =>
      `SKILLS UPDATED: ${JSON.stringify(root)} v${installed} → v${target}, source SHA ${sha}, stamp ${stamp}; reread the verstak skill and the role's methods now. ` +
      `Names this release dropped (left on disk): ${JSON.stringify(removed)}. A set on disk is not a loaded context.`,
  },
};
