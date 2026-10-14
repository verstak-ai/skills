// A satellite's seat the harness named no model for (graph @nks/nks-dev, node #7591): register
// without model keeps the earlier one (#4032), so the bridge clears it by its own call —
// PATCH /standings/{id} {"model": null} with the key that opened the seat (api 0.123.0, #5083),
// the seat's graph in X-NKS-Realm, required by the api (#99).
import { apiBase } from "../shared/channel.ts";
import { type Answer } from "./call.ts";
import { standingIdIn } from "./hold.ts";
import { H } from "./holdstate.ts";
import { headers, TIMEOUT_MS } from "./orderack.ts";
import { satelliteWithoutModel } from "./placefields.ts";
import { canonRealm } from "./realms.ts";
import { log } from "./streams.ts";

/** A register that clears a model it is not given; kept() — the clearing refused, said aloud. */
export function clearingRegister(send: () => Promise<Answer>, realm: string) {
  let kept: string | null = null;
  const register = async (): Promise<Answer> => {
    const r = await send();
    if (!r.isError) kept = await clearSeatModel(realm);
    return r;
  };
  return { register, kept: () => kept };
}

/**
 * After a satellite's register: no model known — none on the seat. A failure does not fail
 * the stand: it is logged and returned as the outcome for the answer; null — cleared or nothing to clear.
 */
export async function clearSeatModel(realm: string): Promise<string | null> {
  if (!satelliteWithoutModel()) return null;
  const id = standingIdIn(realm);
  const url = H.currentUrl;
  const fail = (why: string): string => {
    log(`seat model in ${realm} not cleared: ${why}`);
    return why;
  };
  if (!id || !url) return fail("no seat id or channel");
  try {
    const res = await fetch(`${apiBase(url)}/standings/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { ...headers(), "x-nks-realm": canonRealm(realm) },
      body: JSON.stringify({ model: null }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (res.ok) return null;
    const body = (await res.text().catch(() => "")).trim().slice(0, 160);
    return fail(body ? `${res.status}: ${body}` : String(res.status));
  } catch (e) {
    return fail((e as Error).message);
  }
}
