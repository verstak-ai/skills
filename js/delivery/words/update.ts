// Delivery update (UPDATE): restart by the home copy, download refusal, the behind line,
// skill update moves per harness channel.
import type { Lang } from "../lang.ts";
import { BRIDGE_NAME, HOME_DIR } from "../product.ts";

export interface UpdateWords {
  reexecNewer: (homeVersion: string, version: string, path: string) => string;
  restartFailed: (error: string) => string;
  versionMismatch: (got: string, version: string) => string;
  bridgeDownloaded: () => string;
  downloadFailed: (error: string, self: string) => string;
  homeSymlink: () => string;
  bridgeAlreadyHome: () => string;
  bridgeNotHome: (self: string) => string;
  stale: (
    version: string,
    fresh: string,
    bridgeWord: string,
    claude: string,
    flat: string,
    pi: string,
    codex: string,
    setup: string,
  ) => string;
  moveClaude: () => string;
  moveFlat: () => string;
  movePi: () => string;
  moveCodex: () => string;
}

export const UPDATE: Readonly<Record<Lang, UpdateWords>> = {
  en: {
    reexecNewer: (homeVersion, version, path) =>
      `the home copy is newer than this build (v${homeVersion} > v${version}) — restarting with it: ${path}`,
    restartFailed: (error) => `restart failed: ${error}`,
    versionMismatch: (got, version) =>
      `the downloaded bridge names v${got}, the release — v${version}`,
    bridgeDownloaded: () =>
      `The fresh bridge is already downloaded into ~/${HOME_DIR} and comes up with a new session.`,
    downloadFailed: (error, self) =>
      `Downloading the fresh bridge failed (${error}); repeat: node "${self}" update.`,
    homeSymlink: () =>
      "The fresh bridge is not put home: home is a symlink to another copy, left alone; update that copy yourself.",
    bridgeAlreadyHome: () =>
      `The fresh bridge already lies in ~/${HOME_DIR} and comes up with a new session.`,
    bridgeNotHome: (self) =>
      `The fresh bridge is not put home; repeat: node "${self}" update (the bridge that answers is the one that updates home; in OpenCode's packaged delivery the bridge lives in the package and updates with it).`,
    stale: (version, fresh, bridgeWord, claude, flat, pi, codex, setup) =>
      `[${BRIDGE_NAME}] DELIVERY BEHIND: this bridge is v${version}, the fresh release is v${fresh}. ${bridgeWord} ` +
      `The harness channel updates the skills, and this must be TOLD TO THE USER: Claude Code — ${claude}; ` +
      `flat install — ${flat}; pi — ${pi}; Codex — ${codex}. ` +
      `The full order — the fresh installer ${setup} (update puts it); on the user's word "update" run it.`,
    moveClaude: () => "/plugin marketplace update verstak, then /reload-plugins",
    moveFlat: () =>
      "repeat npx skills add verstak-ai/skills --all --global (it brings new skills and refreshes standing ones: npx skills update --global walks only the lock file and brings none, a dropped skill is removed by hand — npx skills remove <name> --global)",
    movePi: () => "pi update git:github.com/verstak-ai/skills",
    moveCodex: () =>
      "codex plugin marketplace upgrade verstak, then codex plugin remove verstak@verstak and codex plugin add verstak@verstak",
  },
};
