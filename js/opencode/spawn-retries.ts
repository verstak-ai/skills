// A launch whose register does not confirm its pair is tried a bounded number of times
// (graph @nks/nks-dev, #10782, layer 1 of #10788). The harness may open session after session
// with the same launch line, each one seating a root through a fresh bridge; the tally is the
// instance's, by pair, across sessions. A try is counted when a session is admitted, before its
// pause — so sessions opened at once cannot all pass the bound — and each waits its own place
// in a pause that doubles up to a ceiling. Past the last try the pair is refused without a
// bridge — still after the ceiling, so a harness that retries at once does not spin — and the
// give-up is said once. A new launch comes by a new invitation, never by this pair again (#7523).
import { envName, SPAWNED_FOR } from "../delivery/index.ts";
import { words } from "../shared/lang.ts";
import type { SpawnedFor } from "../shared/spawned-for.ts";

export const SPAWN_TRIES = 5;
/** The first pause; the variable is for probes. */
const baseMs = (): number => Number(process.env[envName("SPAWN_RETRY_MS")] || 5_000);
const ceilingMs = (): number => baseMs() * 12;
const pause = (ms: number): Promise<void> =>
  ms > 0 ? new Promise((r) => setTimeout(r, ms).unref?.()) : Promise.resolve();
const keyOf = (p: SpawnedFor): string => `${p.room}#${p.invite}`;

export function createSpawnRetries(loud: (word: string) => void) {
  const tally = new Map<string, { tries: number; at: number; said: boolean }>();
  const gaveUp = (p: SpawnedFor) => words(SPAWNED_FOR).gaveUp(SPAWN_TRIES, p.room, p.invite);
  return {
    /** Before a seating with this pair: the try is taken, then its pause; past the bound — the refusal. */
    async before(p: SpawnedFor): Promise<void> {
      const t = tally.get(keyOf(p)) ?? { tries: 0, at: 0, said: false };
      tally.set(keyOf(p), t);
      if (t.tries >= SPAWN_TRIES) {
        if (!t.said) loud(gaveUp(p));
        t.said = true;
        await pause(ceilingMs());
        throw new Error(gaveUp(p));
      }
      const n = t.tries++;
      const wait = n ? Math.min(baseMs() * 2 ** (n - 1), ceilingMs()) : 0;
      const start = Math.max(t.at + wait, Date.now());
      t.at = start;
      await pause(start - Date.now());
    },
    /** A seating with this pair ended unconfirmed: the next pause counts from its end. */
    failed(p: SpawnedFor): void {
      const t = tally.get(keyOf(p));
      if (t) t.at = Math.max(t.at, Date.now());
    },
    confirmed(p: SpawnedFor): void {
      tally.delete(keyOf(p));
    },
  };
}
