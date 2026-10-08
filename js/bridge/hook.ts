// Role inbox hook in the stand tool, so that a posed_to inquiry arrives over the same
// socket (graph @nks/nks-dev, node #5838). The main graph's seat is woken by its own
// incoming address; a seat of another graph on the same channel has none — the address
// (hook_token) belongs to the channel and its graph, so the role hook there goes on the
// channel with body {"channel":"self"}, delivered inside the service to that graph's
// role seats. channel is passed only if the admin tool schema declares it.
import { HOOK, tool } from "../delivery/index.ts";
import { words } from "../shared/lang.ts";
import { callTool as call, short } from "./call.ts";
import { adminParamNames, readRoleHooks } from "./hooklist.ts";

export interface HookPlace {
  realm: string;
  karta: string;
  name: string;
  /** The seat's incoming address — only for the seat of the graph where the channel is open. */
  incoming: string | null;
  heardHere: boolean;
  /** A separate seat name.N — no role hook for it. */
  sub: boolean;
  /** A seat of another graph on this bridge's channel. */
  beside: boolean;
  /** The graph where the channel is open (main seat) — for the word about the address. */
  channelRealm: string;
}

/** The role inbox hook step; returns a line of the stand answer. */
export async function armRoleHook(p: HookPlace): Promise<string> {
  const { realm, karta, name } = p;
  const hooks = await readRoleHooks(realm, karta, name);
  const { recognized, wakesMe } = hooks;
  const w = words(HOOK);
  if (p.sub) return w.sub();
  if (wakesMe) return w.wakesMe();
  if (!recognized) return w.unrecognized(short(hooks.text, 120));
  if (!p.heardHere) return w.otherHolder();
  if (p.beside) {
    const params = await adminParamNames();
    const noAddress = w.noAddress(p.channelRealm);
    if (!params) return w.noSchema(noAddress);
    if (!params.has("channel")) return w.noChannelParam(noAddress);
    const h = await call(tool("admin"), {
      action: "add_webhook",
      realm,
      node_id: karta,
      channel: "self",
    });
    return h.isError ? w.channelFailed(short(h.text)) : w.channelArmed(short(h.text, 120));
  }
  if (!p.incoming) return w.noIncoming();
  const h = await call(tool("admin"), {
    action: "add_webhook",
    realm,
    node_id: karta,
    // No ttl_seconds: 0 lifts the term only in update_webhook; on add it is rejected (graph @nks/nks-dev, node #5380).
    url: p.incoming,
  });
  return h.isError ? w.failed(short(h.text)) : w.armed(short(h.text, 120));
}
