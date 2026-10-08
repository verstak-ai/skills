// Languages of the delivery: the set, the default and the server-address rule. The
// session state and the word choice live in the core (shared/lang.ts). Verstak speaks
// English only, so every dictionary in words/ carries just `en`.

/** Languages the delivery speaks; every dictionary in words/ carries each of them. */
export const LANGS = ["en"] as const;
export type Lang = (typeof LANGS)[number];

/** The language when neither the variable nor the server address names one. */
export const DEFAULT_LANG: Lang = "en";

/** The language of a server address: one language, whatever the address. */
export function langOfServer(_url: string): Lang {
  return "en";
}
