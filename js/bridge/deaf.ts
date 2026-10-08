// A seat without hearing: no record goes under it until the board says nobody else
// listens on it (graph @nks/nks-dev, node #6706). The seat goes deaf when the bridge
// left it (leave), dropped its socket (dead token 4001, reopen without hello) or
// reopens it at the same address without hello (another holder may have turned it:
// the server answers 404). The socket is shared by the channel's seats, so the main
// seat and the seats of other graphs go deaf together. Right after leaving, the board
// may still read the bridge's own closed socket as listening. A taken seat (4000)
// is evicted.ts.
import { DEAF, tool } from "../delivery/index.ts";
import { words } from "../shared/lang.ts";
import { askedHearing } from "./hearing.ts";
import { awaitHello, isParked, ledKey } from "./hold.ts";
import { keyOf } from "./holdrecord.ts";
import { H } from "./holdstate.ts";
import { otherRealm } from "./realms.ts";
import { state } from "./transport.ts";
import { type JsonRpcMessage } from "./types.ts";

type Place = { realm: string; karta: string | number; name?: string };

/** Channel actions that sign no records. */
const UNSIGNED = new Set(["list", "leave", "close", "revoke", "?"]);

/** The graph a harness call would sign with a channel seat; null when it signs nothing. */
export function signedRealm(msg: JsonRpcMessage): string | null {
  if (msg?.method !== "tools/call" || msg.params?.name === tool("stand")) return null;
  const a = msg.params?.arguments ?? {};
  if (msg.params?.name === tool("channel") && UNSIGNED.has(String(a.action))) return null;
  return typeof a.realm === "string" ? a.realm : null;
}

/** Channel seats whose socket is gone or reopening without hello; empty while hearing. */
function deafPlaces(): Place[] {
  const s = state.standing;
  if (!s) return [];
  const name = s.name ?? "";
  if (isParked(s.realm, s.karta, name) || H.unheard) return [s, ...state.places];
  const letGo = !ledKey() && H.deafKey === keyOf(s.realm, s.karta, name);
  return letGo ? [s, ...state.places, ...H.deadPlaces] : [];
}

/** The deaf channel seat a call into this graph would sign with; otherwise null. */
export function deafPlaceIn(realm: unknown): Place | null {
  if (typeof realm !== "string") return null;
  return deafPlaces().find((p) => !otherRealm(realm, p.realm)) ?? null;
}

/** Why a deaf seat must not sign (another session may hold it); null when it is free. */
export async function deafSeatTaken(
  p: Place | null = deafPlaces()[0] ?? null,
): Promise<string | null> {
  if (!p) return null;
  const name = p.name ?? "";
  const hearing = await askedHearing(p.realm, String(p.karta), name);
  if (hearing === "free") return null;
  return hearing === "other" ? words(DEAF).takenByOther(name) : words(DEAF).unknownHearing(name);
}

/** A harness call into the graph of a deaf seat another session may hold is refused aloud. */
export async function deafRefusal(msg: JsonRpcMessage): Promise<string | null> {
  const realm = signedRealm(msg);
  if (H.unheard && deafPlaceIn(realm)) await awaitHello(4000); // own reopening: wait for its hello
  const p = deafPlaceIn(realm);
  const why = p ? await deafSeatTaken(p) : null;
  return why ? words(DEAF).refusal(why) : null;
}
