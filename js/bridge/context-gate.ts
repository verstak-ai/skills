// Recovery after an observed fill collapse (graph @nks/nks-dev, node #10121).
import { CONTEXT_GATE, tool } from "../delivery/index.ts";
import { words } from "../shared/lang.ts";
import { scoped } from "../shared/scope.ts";
import { readsOnly } from "../shared/toolreads.ts";
import {
  beginRecovery,
  currentRecovery as current,
  finishRecovery,
  recoveryFault,
  recoverySeat as seat,
} from "./context-state.ts";
import { sameRealm } from "./realms.ts";
import { emit } from "./streams.ts";
import { toolDeclaresAction } from "./toolsync.ts";
import type { JsonRpcMessage } from "./types.ts";
import { usagePlace } from "./usage.ts";

interface Fill {
  context: number;
  window: number;
  model: string;
  seat: string;
}
const S = scoped(() => ({ last: null as Fill | null }));
const positive = (n: unknown): n is number => typeof n === "number" && Number.isFinite(n) && n > 0;

/** Mark a collapse locally; the door skill alone is required to release it (context-state.ts). */
export async function observeContext(p: Record<string, unknown>): Promise<void> {
  if (!Object.hasOwn(p, "context")) return;
  const own = seat();
  const previous = S.last;
  const next =
    own && positive(p.context) && positive(p.window) && typeof p.model === "string" && p.model
      ? { context: p.context, window: p.window, model: p.model, seat: own }
      : null;
  S.last = next;
  current();
  if (
    !next ||
    !previous ||
    previous.seat !== next.seat ||
    previous.model !== next.model ||
    previous.window !== next.window ||
    next.context > previous.context / 2
  )
    return;
  beginRecovery(next.seat);
}

/** begin/end are observations by the harness, not a model-facing MCP tool. */
export async function observeSkill(p: unknown): Promise<void> {
  const r = current();
  if (!r || !p || typeof p !== "object") return;
  const v = p as Record<string, unknown>;
  if (typeof v.id !== "string" || typeof v.skill !== "string") return;
  if (v.phase === "begin") {
    if (current() !== r) return;
    if (r.calls.size < 128 && !r.calls.has(v.id)) r.calls.set(v.id, v.skill);
    return;
  }
  const skill = r.calls.get(v.id);
  r.calls.delete(v.id);
  if (v.phase !== "end" || v.ok !== true || skill !== v.skill) return;
  if (!r.required?.has(skill)) return;
  r.loaded.add(skill);
  if (r.required && [...r.required].every((s) => r.loaded.has(s))) finishRecovery(r);
}

const answer = (msg: JsonRpcMessage, text: string, isError = false): JsonRpcMessage => ({
  jsonrpc: "2.0",
  id: msg.id,
  result: { ...(isError ? { isError: true } : {}), content: [{ type: "text", text }] },
});
const refusalReason = (): string => {
  const fault = recoveryFault();
  return fault ? words(CONTEXT_GATE).storage(fault) : words(CONTEXT_GATE).refused;
};

/** Local confirmation uses known realm aliases and never registers or resolves over the network. */
export function contextCall(msg: JsonRpcMessage): Promise<JsonRpcMessage> | null {
  if (msg.method !== "tools/call") return null;
  const name = String(msg.params?.name ?? "");
  const args = msg.params?.arguments ?? {};
  const r = current();
  if (name === tool("stand") && args.context_restored === true) {
    const place = usagePlace();
    const own = seat();
    return (async () => {
      const valid =
        place &&
        own &&
        Object.keys(args).every((k) =>
          ["realm", "karta", "name", "context_restored"].includes(k),
        ) &&
        (args.karta === undefined ||
          String(args.karta).replace(/^#/, "") === String(place.karta).replace(/^#/, "")) &&
        (args.name === undefined || args.name === place.name) &&
        args.realm !== undefined &&
        sameRealm(args.realm, place.realm);
      if (!valid || seat() !== own || current() !== r) return answer(msg, refusalReason(), true);
      try {
        if (r) finishRecovery(r);
      } catch (e) {
        return answer(msg, words(CONTEXT_GATE).storage((e as Error).message), true);
      }
      return answer(msg, words(CONTEXT_GATE).confirmed);
    })();
  }
  if (!r || readsOnly(name, args, toolDeclaresAction(name))) return null;
  return Promise.resolve(answer(msg, refusalReason(), true));
}

/** Recheck after asynchronous admission, immediately before dispatch as well. */
export async function refuseContext(msg: JsonRpcMessage): Promise<boolean> {
  const denied = contextCall(msg);
  if (!denied) return false;
  emit(await denied);
  return true;
}
