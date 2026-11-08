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
      `Refused (bridge): the satellite seat was lost when the machine daemon changed (${key}) and has no hold record to return by; the call was not sent. Stand again: ${tool("stand")} with satellite_of.`,
    seat: (key, realm, why) =>
      `Refused (bridge): the seat ${key} (graph ${realm}) did not return after the machine daemon changed (${why}); the call was not sent. Bring it back: ${tool("stand")} in that graph with the same name.`,
  },
};
