import { envName } from "../delivery/index.ts";
import { CFG } from "./config.ts";
import { resourceOf } from "./oauth/discovery.ts";
import { loadStore } from "./store.ts";

// A SECOND 401 — after a refresh already replaced the token — is never an
// expiry: the server is refusing tokens as such, and retries cannot fix that.
// Name the one likely defect (audience/resource mismatch) and its lever, or the
// report that reaches us says only "unauthorized". A grant by code has another
// lever: Rauthy mints it without the resource asked for, with the client's
// default audience (graph @nks/nks-dev, node #6619), so only the client's operator moves it.
export function refusedAudience(upstream: string): string {
  const head =
    `upstream refuses even a freshly obtained access token (${upstream}) — not an expiry; ` +
    `the token's audience/resource may not match what the server validates`;
  const s = loadStore();
  if (!s.tokens?.by_code) {
    return `${head} (operator lever: ${envName("BRIDGE_RESOURCE")}), or the server's token validation is off`;
  }
  const resource = s.meta ? resourceOf(s.meta) : CFG.serverUrl;
  return (
    `${head}: this grant came by sign-in by code through client ${s.tokens.client_id ?? "?"}, ` +
    `so its audience is that client's default audience on the sign-in server, which must be ` +
    `${resource} — a move for the operator of the sign-in server; ${envName("BRIDGE_RESOURCE")} ` +
    `does not reach a grant by code`
  );
}
