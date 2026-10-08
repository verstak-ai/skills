// Session language (graph @nks/nks-dev, nodes #6080, #6075): the set of languages,
// the default and the server-address rule come from the delivery layer.
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { DEFAULT_LANG, envName, type Lang, langOfServer, LANGS } from "../delivery/index.ts";
import { envOf, scoped } from "./scope.ts";
import { authDirFromEnv } from "./standings.ts";

export type { Lang };

const isLang = (v: string | undefined): v is Lang => (LANGS as readonly string[]).includes(v ?? "");

/** The language named by the BRIDGE_LANG variable; otherwise null. */
export function forcedLang(): Lang | null {
  const v = envOf(envName("BRIDGE_LANG"))?.trim().toLowerCase();
  return isLang(v) ? v : null;
}

/** Without a server address in hand: the variable, then BRIDGE_URL, then the `server` file by the grant. */
function resolve(): Lang {
  const forced = forcedLang();
  if (forced) return forced;
  const fromEnv = envOf(envName("BRIDGE_URL"))?.trim();
  if (fromEnv) return langOfServer(fromEnv);
  try {
    const text = readFileSync(join(authDirFromEnv(), "server"), "utf8").trim();
    if (text) return langOfServer(text);
  } catch {
    /* no file */
  }
  return DEFAULT_LANG;
}

// Per session (shared/scope.ts): the daemon holds sessions of bridges to different servers.
const S = scoped(() => ({ current: null as Lang | null }));

export function setServerLang(serverUrl: string): void {
  S.current = forcedLang() ?? langOfServer(serverUrl);
}

/** The watchdog takes the language from the bridge's `--lang` flag. */
export function setLang(l: string | undefined): void {
  if (isLang(l)) S.current = l;
}

export const lang = (): Lang => (S.current ??= resolve());

/** The entry of a layer dictionary in the session language. */
export const words = <T>(dict: Readonly<Record<Lang, T>>): T => dict[lang()];
