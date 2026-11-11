// The stand answer carries only a checked claim receipt (#9959).
import { type SpawnedFor } from "../shared/spawned-for.ts";
import { claimReceipt } from "./claimseat.ts";
import { heldKey } from "./hold.ts";
import { seatProof } from "./seatproof.ts";
import { skillCatchupNotice } from "./skillcatchup.ts";
import { type JsonRpcMessage } from "./types.ts";

export async function standAnswer(
  msg: JsonRpcMessage,
  lines: string[],
  realm: string,
  basis: SpawnedFor | undefined,
  isError: boolean,
  fresh = false,
): Promise<JsonRpcMessage> {
  const proof = seatProof(heldKey(realm));
  const receipt = basis ? claimReceipt(proof.place ?? {}) : undefined;
  const notice = isError ? null : await skillCatchupNotice();
  return {
    jsonrpc: "2.0",
    id: msg.id,
    result: {
      ...(isError ? { isError: true } : {}),
      ...(isError
        ? {}
        : {
            structuredContent: {
              ...proof,
              fresh,
              ...(basis ? { action: "register", seats: receipt ? [receipt] : [] } : {}),
            },
          }),
      content: [{ type: "text", text: [...(notice ? [notice] : []), ...lines].join("\n") }],
    },
  };
}
