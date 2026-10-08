// Refusal to take the owner's role (主) without the user's word (OWNER); the word's variable
// comes as an argument.
import type { Lang } from "../lang.ts";

export interface OwnerWords {
  refused: (what: string, env: string) => string;
  human: (karta: string) => string;
  unread: (seq: string, why: string) => string;
  incomplete: () => string;
}

export const OWNER: Readonly<Record<Lang, OwnerWords>> = {
  en: {
    refused: (what, env) =>
      `Refused (bridge): ${what} is the owner's role (主). An agent does not take it without the user's word; ` +
      `the user's word is the setting ${env}=1 in the bridge's environment, set by the user. ` +
      "Stand in your own role (karta) — the one the user or AGENTS.md named as the agent's.",
    human: (karta) => `karta="${karta}" is the user's own role`,
    unread: (seq, why) =>
      `Refused (bridge): the type of role #${seq} could not be read (${why}) — the owner's role is not taken unchecked; retry.`,
    incomplete: () => "the list of the owner's roles is incomplete",
  },
};
