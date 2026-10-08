// The user's word choosing the server: one word per delivery language, naming that
// language's production address (SERVER_URLS); in any session language.
import type { Lang } from "../lang.ts";

export const SERVER_CHOICE: Readonly<Record<Lang, RegExp>> = {
  en: /^(en|ai|english|verstak)$/i,
};
