// Session seats as the thin bridge sees them (thin.ts) and their loss on a daemon
// change: a lost seat is refused for every tool call into its graph except stand,
// until retaken; graphs are compared canonically (realms.ts), an unresolved name
// is refused asking for the full address (#5838). Another owner of the same slug is
// another graph. Seats are key → graph as the agent named it: the main one by `held`,
// others by `beside` (`beside-gone` drops one); a lost seat also gets a `lost` notice.
import { LOGGERS, LOST, method, tool } from "../delivery/index.ts";
import { words } from "../shared/lang.ts";
import { learnRealmList, realmRelation, sameRealm, unresolvedWord } from "./realms.ts";
import { type JsonRpcMessage } from "./types.ts";

/** The session's word about a seat it holds or released (hold.ts, places.ts). */
export function placeWord(
  msg: JsonRpcMessage,
): { kind: string; key?: string; realm: string } | null {
  if (msg.method !== "notifications/message" || msg.params?.logger !== LOGGERS.channel) return null;
  const data = msg.params?.data as
    { kind?: unknown; key?: unknown; place?: { realm?: unknown } } | undefined;
  const realm = typeof data?.place?.realm === "string" ? data.place.realm.trim() : "";
  return typeof data?.kind === "string"
    ? { kind: data.kind, key: typeof data.key === "string" ? data.key : undefined, realm }
    : null;
}

/**
 * The harness session the plugin names to the bridge (resume, check methods): the thin
 * bridge keeps it and carries it into the seat's return in a new daemon session — without
 * it the hold record would land unsigned and the session would take its own seat for
 * another's (graph @nks/nks-dev, node #6702).
 */
let harnessSession: string | null = null;
/** Remember the harness session from its call; the call passes as is. */
export function seeSession(msg: JsonRpcMessage): JsonRpcMessage {
  const s = msg.params?.session;
  if ((msg.method === method("resume") || msg.method === method("check")) && typeof s === "string")
    harnessSession = s.trim() || harnessSession;
  return msg;
}
/** The return params in a new daemon session: the key and the named harness session. */
export const resumeParams = (key: string): { key: string; session?: string } =>
  harnessSession ? { key, session: harnessSession } : { key };

export function lostPlaces(say: (m: JsonRpcMessage) => void, log: (m: string) => void) {
  const live = new Map<string, string>();
  const lost = new Map<string, { realm: string; satellite: boolean; text: string }>();
  return {
    live,
    /**
     * The seat is taken again (held, beside) — its refusal lifted. A satellite's loss is
     * lifted by any satellite seat of the same graph: the bridge picks the .sub-N name.
     */
    regained(k: string, realm: string): void {
      live.set(k, realm);
      for (const [lk, e] of lost)
        if (lk === k || (e.satellite && sameRealm(e.realm, realm))) lost.delete(lk);
    },
    lose(k: string, realm: string, why: string, satellite: boolean): void {
      const text = satellite ? words(LOST).satellite(k) : words(LOST).seat(k, realm, why);
      lost.set(k, { realm, satellite, text });
      live.delete(k);
      log(text);
      say({
        jsonrpc: "2.0",
        method: "notifications/message",
        params: {
          level: "warning",
          logger: LOGGERS.channel,
          data: { kind: "lost", key: k, text },
        },
      });
    },
    /** The thin bridge decides by it whether to learn graph names. */
    lostCount(): number {
      return lost.size;
    },
    /**
     * Fold a seat word reaching the thin bridge; returns heldKey after it. held with
     * another key drops the old key from live, else the next break would call it lost.
     * released from the daemon session while the harness lives is a daemon ending
     * without successor, not the agent leaving: the key stays so the takeover resumes
     * the seat by its hold record. The agent's real leave goes through the thin
     * bridge's own leave; death and eviction come as dead and evicted.
     */
    seen(
      place: { kind: string; key?: string; realm: string } | null,
      heldKey: string | null,
      daemonSession: boolean,
    ): string | null {
      if ((place?.kind === "held" || place?.kind === "beside") && place.key) {
        if (place.kind === "held") {
          if (heldKey && heldKey !== place.key) live.delete(heldKey);
          heldKey = place.key;
        }
        this.regained(place.key, place.realm);
      } else if (place?.kind === "beside-gone" && place.key) live.delete(place.key);
      else if (
        place &&
        ["released", "dead", "evicted"].includes(place.kind) &&
        (!place.key || place.key === heldKey) &&
        !(place.kind === "released" && daemonSession)
      ) {
        if (heldKey) live.delete(heldKey);
        heldKey = null;
      }
      return heldKey;
    },
    /**
     * Refusal of a tool call for a lost seat; null — let it pass. Only calls into a
     * lost graph; an unresolved name is refused asking for the full address (#5838).
     * The refusal carries the call's graph, not the first loss found.
     */
    refusal(msg: JsonRpcMessage): string | null {
      if (!lost.size || msg.method !== "tools/call" || msg.params?.name === tool("stand"))
        return null;
      const r = msg.params?.arguments?.realm;
      if (typeof r !== "string" || !r.trim()) return null; // a call without a graph is free
      const hit = [...lost.entries()].find(([, e]) => realmRelation(r, e.realm) === "same");
      if (hit) return hit[1].text;
      // A graph the bridge holds is free; a surely different graph too.
      if ([...live.values()].some((x) => realmRelation(r, x) === "same")) return null;
      return [...lost.values()].some((e) => realmRelation(r, e.realm) === "unknown")
        ? unresolvedWord(r, [...live.values()])
        : null;
    },
  };
}

/**
 * The thin bridge's own realm list calls: without the list every unresolved name
 * is refused. Asked with the bridge's own id when losses exist: at takeover at once, or
 * when a resume answer reveals a loss; a refusal instead of the list goes loudly to log.
 */
export function realmListAsk() {
  const asked = new Set<string>(); // JSON.stringify(id) of own calls awaiting an answer
  return {
    /** The list call when losses exist; null — no losses or a call already in flight. */
    ask(lostCount: number, id: () => string): JsonRpcMessage | null {
      if (!lostCount || asked.size) return null;
      const call: JsonRpcMessage = {
        jsonrpc: "2.0",
        id: id(),
        method: "tools/call",
        params: { name: tool("realm"), arguments: { action: "list" } },
      };
      asked.add(JSON.stringify(call.id));
      return call;
    },
    /** The answer to the own list call: true — consumed. */
    reply(msg: JsonRpcMessage, log: (m: string) => void): boolean {
      if (msg.method !== undefined || msg.id === undefined || msg.id === null) return false;
      if (!asked.delete(JSON.stringify(msg.id))) return false;
      const content = msg.result?.content;
      const text = (Array.isArray(content) ? content : [])
        .map((c) => String(c?.text ?? ""))
        .join("\n");
      if (msg.error || msg.result?.isError)
        log(
          `the realm list came back refused instead of the list — rN and slugs stay unresolved: ` +
            `${text || msg.error?.message || "?"}`,
        );
      learnRealmList(text);
      return true;
    },
    /** No answer will come (link broke) — allow asking again. */
    forget(): void {
      asked.clear();
    },
  };
}
