// Refusal for a seat lost on a daemon change (LOST): a plain one and a satellite.
import type { Lang } from "../lang.ts";
import { tool } from "../protocol.ts";

export interface LostWords {
  satellite: (key: string) => string;
  seat: (key: string, realm: string, why: string) => string;
}

export const LOST: Readonly<Record<Lang, LostWords>> = {
  en: {
    satellite: (key) =>
      `Refused (bridge): the satellite's seat was lost in the machine daemon's change (${key}) — a satellite seat has no holding record, and writes would go unattributed; the call was not sent. Stand again: ${tool("stand")} with satellite_of.`,
    seat: (key, realm, why) =>
      `Refused (bridge): the seat ${key} (graph ${realm}) did not come back after the machine daemon's change (${why}) — writes would go unattributed; the call was not sent. Bring it back: ${tool("stand")} in that graph with the same name.`,
  },
};
