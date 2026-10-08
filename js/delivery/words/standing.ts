// Standing binding (STANDING): the seat expired at the platform.
import type { Lang } from "../lang.ts";

export interface StandingWords {
  seatExpired: () => string;
}

export const STANDING: Readonly<Record<Lang, StandingWords>> = {
  en: { seatExpired: () => "the seat expired at the platform — register: no such seat" },
};
