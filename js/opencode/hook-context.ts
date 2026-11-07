// One-shot words belong to an admitted user id, not to its text or the next request
// (graph @nks/nks-dev, nodes #9341, #9867). Compaction grants checkpoint aliases,
// but never consumes this buffer or trusts a keepID on an admitted prompt.
interface Message {
  role: unknown;
  id?: unknown;
  metadata?: unknown;
  content?: unknown;
}
const record = (x: unknown): x is Record<string, unknown> => typeof x === "object" && x !== null;
function checkpoint(m: Message): string | null {
  if (!record(m.metadata) || typeof m.metadata.keepID !== "string") return null;
  if (!Array.isArray(m.content) || m.content.length !== 1) return null;
  const part: unknown = m.content[0];
  return record(part) &&
    part.type === "text" &&
    typeof part.text === "string" &&
    part.text.startsWith("<conversation-checkpoint>\n") &&
    part.text.endsWith("</conversation-checkpoint>")
    ? m.metadata.keepID
    : null;
}
export function createHookContext(closed: (session: string) => boolean) {
  const pending = new Map<string, Map<string, string[]>>();
  const riding = new Map<string, Set<string>>();
  const generations = new Map<string, object>();
  const forgotten = new Set<string>();
  const preparedIDs = new Map<string, Set<string>>();
  const aliases = new Map<string, Set<string>>();
  let stopped = false;
  const clear = (s: string): void => {
    pending.delete(s);
    riding.delete(s);
    preparedIDs.delete(s);
    aliases.delete(s);
    generations.delete(s);
  };
  const allowed = (s: string): boolean => !stopped && !forgotten.has(s) && !closed(s);

  return {
    sweep(): void {
      // A failed compaction drops the generation but keeps direct words and prepared IDs.
      for (const s of preparedIDs.keys()) if (closed(s)) clear(s);
    },
    prepare(s: string, message: string) {
      if (allowed(s)) {
        const ids = preparedIDs.get(s) ?? new Set<string>();
        ids.add(message);
        preparedIDs.set(s, ids);
      } else clear(s);
      // Identity tokens avoid ABA when a cleared session prepares again; no tombstone
      // counter needs to survive the lifecycle just to reject an old async closure.
      const generation = generations.get(s) ?? {};
      if (allowed(s)) generations.set(s, generation);
      const current = (): boolean => {
        if (!allowed(s)) {
          clear(s);
          return false;
        }
        return generations.get(s) === generation;
      };
      return {
        put(text: string | null | undefined): void {
          if (!text || !current()) return;
          const byMessage = pending.get(s) ?? new Map<string, string[]>();
          byMessage.set(message, [...(byMessage.get(message) ?? []), text]);
          pending.set(s, byMessage);
        },
        ride(): void {
          if (!current()) return;
          const ids = riding.get(s) ?? new Set<string>();
          ids.add(message);
          riding.set(s, ids);
        },
      };
    },
    compact(s: string): void {
      if (!allowed(s)) {
        clear(s);
        return;
      }
      aliases.set(s, new Set([...(pending.get(s)?.keys() ?? []), ...(riding.get(s) ?? [])]));
    },
    failed(s: string): void {
      aliases.delete(s);
      // An async prepare from before the failed compaction cannot repopulate its grant.
      generations.delete(s);
    },
    take(s: string, messages: readonly Message[]) {
      const result = { words: [] as string[], ride: false };
      if (!allowed(s)) {
        clear(s);
        return result;
      }
      const ids = new Set<string>();
      for (const m of messages) {
        if (m.role !== "user" || typeof m.id !== "string") continue;
        ids.add(m.id);
        const alias = !preparedIDs.get(s)?.has(m.id) ? checkpoint(m) : null;
        if (alias && aliases.get(s)?.has(alias)) ids.add(alias);
      }
      const queued = pending.get(s);
      const riders = riding.get(s);
      for (const id of ids) {
        result.words.push(...(queued?.get(id) ?? []));
        queued?.delete(id);
        if (riders?.delete(id)) result.ride = true;
        aliases.get(s)?.delete(id);
      }
      if (!queued?.size) pending.delete(s);
      if (!riders?.size) riding.delete(s);
      return result;
    },
    forget(s: string): void {
      forgotten.add(s);
      clear(s);
    },
    moved(s: string): void {
      clear(s);
    },
    stop(): void {
      stopped = true;
      pending.clear();
      riding.clear();
      preparedIDs.clear();
      aliases.clear();
      generations.clear();
    },
  };
}
