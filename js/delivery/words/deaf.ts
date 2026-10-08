// A seat without hearing (DEAF): why a call is not signed by a seat another session may
// have taken; the reason comes as an argument.
import type { Lang } from "../lang.ts";

export interface DeafWords {
  takenByOther: (name: string) => string;
  unknownHearing: (name: string) => string;
  refusal: (why: string) => string;
}

export const DEAF: Readonly<Record<Lang, DeafWords>> = {
  en: {
    takenByOther: (name) =>
      `the seat ${name} has no hearing (left, or the token died), and the board reads it listening — another session may have taken it`,
    unknownHearing: (name) =>
      `the seat ${name} has no hearing (left, or the token died), and the bridge does not know whether another session listens on it`,
    refusal: (why) =>
      `Refused (bridge): ${why}; the call will not go under its signature — not sent. Stand again with verstak_stand: the bridge takes its own seat back by itself and stands beside another's on name.N with hearing.`,
  },
};
