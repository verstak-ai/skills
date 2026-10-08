// The role inbox hook step in the standing answer (HOOK); the trimmed tool answer and the
// channel's graph come as arguments.
import type { Lang } from "../lang.ts";

export interface HookWords {
  sub: () => string;
  wakesMe: () => string;
  unrecognized: (text: string) => string;
  otherHolder: () => string;
  noAddress: (channelRealm: string) => string;
  noSchema: (noAddress: string) => string;
  noChannelParam: (noAddress: string) => string;
  channelFailed: (text: string) => string;
  channelArmed: (text: string) => string;
  noIncoming: () => string;
  failed: (text: string) => string;
  armed: (text: string) => string;
}

const EN = "Role inbox hook";

export const HOOK: Readonly<Record<Lang, HookWords>> = {
  en: {
    sub: () =>
      `${EN}: not armed for a separate seat — the main seat listens to the role's mail, cases deliver their own.`,
    wakesMe: () => `${EN}: in place and wakes this standing.`,
    unrecognized: (text) => `${EN}: the hook list is not recognized — left alone (${text}).`,
    otherHolder: () => `${EN}: not armed — another holder has the hearing.`,
    noAddress: (channelRealm) =>
      `this graph's seat has no incoming address of its own (the address is the channel's, opened in graph ${channelRealm})`,
    noSchema: (noAddress) =>
      `${EN}: not armed — ${noAddress}, and the verstak_admin schema could not be read (tools/list did not answer or has no verstak_admin) — whether it declares channel is unknown; no blind hook on the channel (channel=self) — repeat verstak_stand for this graph.`,
    noChannelParam: (noAddress) =>
      `${EN}: not armed — ${noAddress}, and verstak_admin(action="add_webhook") on this surface declares no channel parameter; nothing to arm a channel hook (channel=self) with — this graph's role mail does not come over the socket.`,
    channelFailed: (text) => `${EN}: not armed on the channel (channel=self) — ${text}`,
    channelArmed: (text) =>
      `${EN}: armed on the channel (channel=self) — this graph's role mail goes into the same socket to this graph's seat (${text}).`,
    noIncoming: () => `${EN}: not armed — the standing's incoming address did not read.`,
    failed: (text) => `${EN}: not armed — ${text}`,
    armed: (text) => `${EN}: armed on the seat's incoming address (${text}).`,
  },
};
