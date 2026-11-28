// The server's word about the standing header a session was opened with (graph
// @nks/nks-dev, node #11403): a surface that binds a session by that header says so
// in its initialize answer, and the bridge does not register again on the return.
import { STANDING_CAPABILITY } from "../delivery/index.ts";
import { type JsonRpcMessage } from "./types.ts";

/**
 * The initialize answer says the session is bound by the standing header it carried: the
 * server's sign with `bound: true` and `opened` not true. False for every other shape —
 * `bound: false`, a sign with `opened: true`, the missing key of a server older than the sign.
 */
export const boundByHandshake = (answer: JsonRpcMessage): boolean => {
  const sign = (answer?.result?.capabilities?.experimental ?? {})[STANDING_CAPABILITY];
  return sign?.bound === true && sign.opened !== true;
};
