// The prompt hook precedes durable admission. Emptiness is read, never inferred from reload.
import { FRAME_MARK, SPAWNED_FOR } from "../delivery/index.ts";
import { words } from "../shared/lang.ts";
import { firstLineSpawn, mergeSpawn, type SpawnedFor } from "../shared/spawned-for.ts";

export interface SpawnStart {
  pair?: SpawnedFor;
  /** The role the launch was raised for in its home: the root seats it, not the cover's. */
  karta?: number;
  target?: string;
  error?: Error;
  conflict?: boolean;
  claimed?: boolean;
  /** The graph register confirmed the pair in; the taken word is told once (#10043). */
  realm?: string;
  /** The seat register confirmed the pair for: a stand again with it is answered by this seat. */
  place?: string;
  told?: boolean;
  pending?: Promise<void>;
  ids?: Set<string>;
  start?: Promise<string[]>;
  cleanup?: Promise<void>;
}

export function spawnAdmission(
  starts: Map<string, SpawnStart>,
  readContext: (s: string) => Promise<unknown>,
) {
  return async (session: string, text: string, message: string): Promise<string> => {
    if (text.startsWith(FRAME_MARK)) return text;
    const spawn = firstLineSpawn(text);
    const pair = spawn?.pair;
    let entry = starts.get(session);
    if (!pair) {
      await entry?.pending?.catch(() => {});
      if (!starts.has(session)) starts.set(session, {});
      return text;
    }
    const initialError = () => new Error(words(SPAWNED_FOR).initial());
    if (entry?.error) throw entry.error;
    if (entry && !entry.pair) throw initialError();
    // The session keeps the prompt without its pair line: the lines below, or the same
    // line's remainder in the one-line form (#9959 v16, #9969 v12).
    const stripped = () => (spawn ? spawn.rest : text);
    const compare = (own: SpawnStart) => {
      try {
        mergeSpawn(own.pair, pair);
        if (own.karta !== spawn?.karta) throw new Error(words(SPAWNED_FOR).invalid());
      } catch (e) {
        own.conflict = true;
        own.error = e as Error;
        throw e;
      }
    };
    if (entry?.pending || entry?.ids?.has(message)) {
      compare(entry);
      await entry.pending;
      if (entry.error) throw entry.error;
      entry.ids?.add(message);
      return stripped();
    }
    const fresh = !entry;
    entry ??= {
      pair,
      ...(spawn.karta === undefined ? {} : { karta: spawn.karta }),
      ids: new Set(),
    };
    const own = entry;
    starts.set(session, own);
    const proof = Promise.resolve().then(async () => {
      let previous: unknown;
      try {
        previous = await readContext(session);
      } catch {
        throw initialError();
      }
      if (!Array.isArray(previous) || previous.length !== 0) throw initialError();
      compare(own);
      if (own.error) throw own.error;
    });
    own.pending = proof;
    try {
      await proof;
      own.ids?.add(message);
      return stripped();
    } catch (e) {
      if (fresh && !own.error && starts.get(session) === own) starts.delete(session);
      throw e;
    } finally {
      if (own.pending === proof) own.pending = undefined;
    }
  };
}
