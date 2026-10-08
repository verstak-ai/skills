// The pi extension (PI): door, the tools half, the bridge's home copy.
import type { Lang } from "../lang.ts";

export interface PiWords {
  broken: (list: string) => string;
  channelPart: (message: string) => string;
  toolsPart: (message: string) => string;
  needLogin: (message: string) => string;
  notUp: (name: string) => string;
  calling: (name: string) => string;
  stillWaiting: (name: string, seconds: number) => string;
  serverChanged: (n: number) => string;
  server: () => string;
  raised: (server: string, version: string, n: number) => string;
  raisedSignedIn: (server: string, version: string, n: number) => string;
  launchNoBridge: (no: string) => string;
  stillRaising: () => string;
  versionUnreadable: () => string;
  homeNewer: (home: string, packaged: string) => string;
  noVersion: () => string;
  replacedSame: (version: string) => string;
  updated: (was: string, version: string) => string;
  replaceFailed: (was: string, version: string, message: string) => string;
}

export const PI: Readonly<Record<Lang, PiWords>> = {
  en: {
    broken: (list) => `Verstak: did not come up — ${list}`,
    channelPart: (message) => `channel: ${message}`,
    toolsPart: (message) => `tools: ${message}`,
    needLogin: (message) => `Verstak: sign-in needed — ${message}`,
    notUp: (name) => `${name}: the bridge is not up in this session`,
    calling: (name) => `Verstak: ${name}…`,
    stillWaiting: (name, seconds) => `Verstak: ${name} — still waiting, ${seconds} s`,
    serverChanged: (n) => `Verstak: the server changed its tools — ${n} registered in the session.`,
    server: () => "server",
    raised: (server, version, n) =>
      `Verstak: the bridge is up (${server} ${version}), tools in the session: ${n}.`,
    raisedSignedIn: (server, version, n) =>
      `Verstak: the bridge is up (${server} ${version}), tools in the session: ${n} — sign-in done.`,
    launchNoBridge: (no) =>
      `Verstak: launch line — the bridge is not up, did not enter case #${no}.`,
    stillRaising: () =>
      "Verstak: the bridge is still coming up — the verstak_* tools appear as soon as it answers.",
    versionUnreadable: () =>
      "Verstak: the delivery carries a bridge, but its version is unreadable — leaving the home copy alone.",
    homeNewer: (home, packaged) =>
      `Verstak: the home bridge is ${home}, the delivery's is ${packaged} — the home one is newer, leaving it alone.`,
    noVersion: () => "version unreadable",
    replacedSame: (version) =>
      `Verstak: the home bridge was replaced with the one the delivery brought — same version (${version}), different bytes. The grant is untouched.`,
    updated: (was, version) =>
      `Verstak: the home bridge was updated ${was} → ${version}. The grant is untouched, it lies beside it in separate files.`,
    replaceFailed: (was, version, message) =>
      `Verstak: the home bridge is ${was}, the delivery's is ${version}, replacing it failed (${message}). Working with what there is.`,
  },
};
