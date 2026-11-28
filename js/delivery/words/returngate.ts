// The words of the machine's return gate: a call whose turn at the gate is further than ~20 s away is not held and answers at once.
import type { Lang } from "../lang.ts";

export interface ReturnGateWords {
  /** `s` — the seat's remaining wait at the gate, whole seconds. */
  returning: (s: number) => string;
}

export const RETURN_GATE: Readonly<Record<Lang, ReturnGateWords>> = {
  en: {
    returning: (s) => `the seat is returning — the server was not touched, call again in ${s} s`,
  },
};
