// The plugin's first tool list (tools.ts): its first bridge lists the server's tools in the
// background, with no ceiling — a new handshake or bridge while the plugin lives — and setup
// waits for that list, capped, when there is no cached one (graph @nks/nks-dev, node #8742).
/* eslint-disable @typescript-eslint/no-explicit-any -- bridge answers come without a schema */
import { OPENCODE } from "../delivery/index.ts";
import { words } from "../shared/lang.ts";
import { listTools, retryPause, sleep, writeCache } from "./bridge-io.ts";
import { type Slot } from "./slot.ts";

type Say = (text: string, level: "info" | "warning" | "error") => void;

/** How long setup waits for the server's first tool list when there is no cached one. */
export const COLD_LIST_MS = 10_000;

export interface FirstListOptions {
  spawn: () => Slot;
  shake: (slot: Slot) => void;
  spare: { get: () => Slot | null; set: (slot: Slot | null) => void };
  stopped: () => boolean;
  state: { listed: any[]; source: string; serverSeen: boolean };
  reload: () => Promise<void>;
  say: Say;
  /** The first list failed — the bridge died or the server refused; the retries go on. */
  missed: () => void;
}

/** Lists the server's tools on the plugin's first bridge; resolves on the first list or the stop. */
export async function listInBackground(o: FirstListOptions): Promise<void> {
  const W = words(OPENCODE);
  let first = o.spawn();
  o.spare.set(first);
  let [misses, deaths] = [0, 0]; // deaths in a row: the replacement pause grows, no spawn storm
  for (;;) {
    if (o.stopped()) return;
    try {
      await first.ready;
      const list = await listTools(first.bridge);
      o.state.serverSeen = true;
      const same = JSON.stringify(list) === JSON.stringify(o.state.listed);
      o.state.listed = list;
      o.state.source = W.fromServer();
      writeCache(list);
      if (!same) await o.reload();
      o.say(W.raised(list.length), "info");
      return;
    } catch (e) {
      if (o.stopped()) return;
      o.missed();
      if (first.bridge.failure) {
        // The list's bridge died, or was handed to a session and released by it (then silently).
        if (first.session === null) o.say(W.died((e as Error).message), "warning");
        if (o.spare.get() === first) o.spare.set(null);
        first = o.spare.get() ?? o.spawn();
        o.spare.set(first);
        await sleep(retryPause(deaths++));
      } else {
        await sleep(retryPause(misses++)); // a pause before the retry
        o.shake(first);
      }
    }
  }
}

/**
 * Waits for `listed`, capped: OpenCode builds the first prompt's catalog right after setup and
 * the server's list comes about half a second later. `enough` ends the wait at once — a sign-in
 * the human must do or a failed first list (the status tool names why; the tools come after it).
 * No server and no failure from the bridge — the cap is the price: the first prompt waits for it.
 */
export async function waitListed(
  listed: Promise<void>,
  enough: () => boolean,
  cap = COLD_LIST_MS,
): Promise<void> {
  let done = false;
  void listed.then(() => (done = true));
  const until = Date.now() + cap;
  while (!done && !enough() && Date.now() < until) await sleep(50);
}
