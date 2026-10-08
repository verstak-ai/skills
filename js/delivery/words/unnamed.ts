// Refusal to take a role's seat without a name (UNNAMED).
import type { Lang } from "../lang.ts";

export interface UnnamedWords {
  refused: (action: string) => string;
}

export const UNNAMED: Readonly<Record<Lang, UnnamedWords>> = {
  en: {
    refused: (action) =>
      `Refused (bridge): ${action} without a seat name — the bridge does not take a role seat with an empty name (its address would coincide with the user's seat, and nothing could take it off); the call was not sent. Name the seat explicitly: name (lower-case Latin letters, digits, ".", "_", "-"). The user's own unnamed seat is karta="me" with VERSTAK_BRIDGE_OWNER_ROLE=1 in the bridge's environment, set by the user.`,
  },
};
