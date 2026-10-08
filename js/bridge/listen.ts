// The bridge block in the connect and stand answers: one listen line for the own
// harness (graph nks-dev: #5047).
import { fileURLToPath } from "node:url";

import { LISTEN } from "../delivery/index.ts";
import { NOTIFIED_CLIENTS, PI_CLIENT } from "../shared/clients.ts";
import { lang, words } from "../shared/lang.ts";
import { defaultAuthDir } from "../shared/standings.ts";
import { CFG } from "./config.ts";
import { doors, heldKey } from "./hold.ts";
import { state } from "./transport.ts";

/** Handshake client name — tells the bridge the harness (graph nks-dev: #5047). */
function clientName(): string {
  const info = (state.initParams as { clientInfo?: { name?: unknown } } | null)?.clientInfo;
  return typeof info?.name === "string" ? info.name : "";
}

/** The bridge block with the listen command — one line for the own harness, all for an unknown one (#5047). */
export function listenBlock(realm?: string): string | null {
  const key = heldKey(realm); // the seat of this graph on the channel (#5838); no graph — the main one
  if (!key) return null;
  return words(LISTEN).block(listenLine(key));
}

/** The listen line when no watchdog is attached to this graph's seat and the harness needs one; else null. */
export function unheardListenBlock(realm?: string): string | null {
  const key = heldKey(realm);
  if (!key || NOTIFIED_CLIENTS.has(clientName())) return null;
  if ((doors().find((d) => d.key === key)?.clients.size ?? 0) > 0) return null;
  return words(LISTEN).unheard(listenLine(key));
}

function listenLine(key: string): string {
  const W = words(LISTEN);
  const self = fileURLToPath(import.meta.url);
  // The watchdog derives the socket dir like the bridge: tell it where when not default.
  const authArg = CFG.authDir === defaultAuthDir() ? "" : ` --auth-dir "${CFG.authDir}"`;
  // The watchdog does not know the server address, so the bridge names the language.
  const where = `${authArg} --lang ${lang()}`;
  const client = clientName();
  const monitor = W.monitor(self, key, where);
  const exit = W.exit(self, key, where);
  const codex = W.codex(self, key, where);
  // claude-code observed in the Claude Code handshake; Codex by substring, its handshake not observed.
  return NOTIFIED_CLIENTS.has(client)
    ? W.self(client === PI_CLIENT)
    : client === "claude-code"
      ? W.claude(monitor, exit)
      : /codex/i.test(client)
        ? W.codexLine(codex, exit)
        : W.any(monitor, exit, codex);
}
