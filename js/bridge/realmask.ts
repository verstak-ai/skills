// What a graph name is, asked by the plugin (graph @nks/nks-dev, node #8191): a cover names
// the graph rN, a seat holds it as @owner/slug, and only the bridge knows they are one. The
// bridge's table answers without the network; a name it does not know costs one graph list.
// A name the list does not resolve comes back as given: the plugin keeps it uncompared.
import { method } from "../delivery/index.ts";
import { realmList } from "./call.ts";
import { canonicalRealm } from "./realms.ts";
import { type JsonRpcMessage } from "./types.ts";

/** `method("realm") {realm}` → `{realm}`: @owner/slug where known, else the name as given. */
export function localRealm(msg: JsonRpcMessage): Promise<JsonRpcMessage> | null {
  if (msg?.method !== method("realm")) return null;
  return canonicalRealm(msg.params?.realm, realmList).then((realm) => ({
    jsonrpc: "2.0",
    id: msg.id,
    result: { realm },
  }));
}
