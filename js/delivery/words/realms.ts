// Refusal on an unresolved graph name (REALMS); the bridge's seats come as a ready string.
import type { Lang } from "../lang.ts";

export interface RealmsWords {
  unresolved: (realm: string, held: string) => string;
}

export const REALMS: Readonly<Record<Lang, RealmsWords>> = {
  en: {
    unresolved: (realm, held) =>
      `Refused (bridge): the bridge did not resolve the graph "${realm}" to @owner/slug (there is no list of graphs or the name is not in it) — whether it is the graph of the bridge's seats (${held}) is unknown, and guessing is not allowed. Repeat the call with the full graph address @owner/slug.`,
  },
};
