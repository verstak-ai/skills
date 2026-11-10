// The stdio bridge cannot see prompts. Only the initial user prompt supplies this fallback.
// Session-local, never the server process's environment (graph @nks/nks-dev, #9959).
import { SPAWNED_FOR, tool } from "../delivery/index.ts";
import { words } from "../shared/lang.ts";
import { mergeSpawn, parseSpawn, sameSpawn, spawnReceipt } from "../shared/spawned-for.ts";
import { spawnAdmission, type SpawnStart } from "./spawn-admission.ts";

const targetOf = (args: Record<string, unknown>): string =>
  `${String(args.realm)}#${String(args.karta).replace(/^#/, "")}`;

// A stand that does more than register: it must reach the bridge even on a held seat.
const STAND_ACTS = ["status", "room", "room_karta", "take", "mute_siblings", "repeat_knock"];

const takenWord = (e: SpawnStart | undefined): string | null =>
  e?.pair && e.claimed && e.realm && !e.told
    ? words(SPAWNED_FOR).taken(e.realm, e.pair.room, e.pair.invite)
    : null;

export function createSpawnStarts(readContext: (session: string) => Promise<unknown>) {
  const starts = new Map<string, SpawnStart>();
  return {
    has(session: string) {
      return !!starts.get(session)?.pair;
    },
    async cleanup(session: string, release: () => Promise<void>) {
      const entry = starts.get(session);
      if (!entry?.conflict) return;
      await (entry.cleanup ??= Promise.resolve(entry.start)
        .catch(() => {})
        .then(release));
    },
    start(session: string, run: () => Promise<string[]>) {
      const entry = starts.get(session);
      if (!entry?.pair || entry.claimed) return run();
      return (entry.start ??= Promise.resolve().then(run));
    },
    guard(session: string) {
      const e = starts.get(session);
      if (e?.error) throw e.error;
      if (e?.pair && !e.claimed) throw new Error(words(SPAWNED_FOR).echo());
    },
    verify(session: string, args: Record<string, unknown>, result: unknown) {
      if (!args.spawned_for) return;
      const r = result as {
        isError?: boolean;
        structuredContent?: { place?: { name?: string } };
      } | null;
      const entry = starts.get(session);
      const name =
        r?.structuredContent?.place?.name ??
        (typeof args.name === "string" ? args.name : undefined);
      const receipt = r?.isError
        ? null
        : spawnReceipt(r?.structuredContent, parseSpawn(args.spawned_for), { name });
      if (!receipt) {
        const error = new Error(words(SPAWNED_FOR).echo());
        // After the confirmed claim a failed registration again refuses this call only (№4050 [55]).
        if (entry && !entry.claimed) entry.error = error;
        throw error;
      }
      if (entry && !entry.claimed) {
        entry.claimed = true;
        entry.place = receipt.standing;
        entry.target ??= targetOf(args);
        // No graph named — no word, never one naming «undefined».
        entry.realm = typeof args.realm === "string" && args.realm ? args.realm : undefined;
      }
    },
    /** After the confirmed claim, until delivered: the case the seat was taken for — join it before work. */
    taken(session: string): string | null {
      return takenWord(starts.get(session));
    },
    /** The word went into a model request: told, not before — a lost request leaves it for the next. */
    delivered(session: string, sent: readonly string[]) {
      const e = starts.get(session);
      const word = takenWord(e);
      if (e && word && sent.includes(word)) e.told = true;
    },
    prompt: spawnAdmission(starts, readContext),
    /**
     * The pair onto a taking call; a word instead of the call when this session's seat already
     * holds that pair (`holding` — its bridge still holds a seat): no second registration.
     */
    apply(
      session: string,
      name: string,
      args: Record<string, unknown>,
      holding = true,
    ): string | undefined {
      const entry = starts.get(session);
      if (entry?.error) throw entry.error;
      if (!(
        name === tool("stand") ||
        (name === tool("channel") && ["connect", "register", "mint"].includes(String(args.action)))
      ))
        return;
      if (entry?.pending) throw new Error(words(SPAWNED_FOR).initial());
      const target = targetOf(args);
      const explicit = Object.hasOwn(args, "spawned_for")
        ? parseSpawn(args.spawned_for)
        : undefined;
      const pair = mergeSpawn(
        explicit,
        !entry?.target || entry.target === target ? entry?.pair : undefined,
      );
      if (!pair) return;
      if (holding && entry?.claimed && entry.place && entry.pair && sameSpawn(pair, entry.pair)) {
        if (name === tool("stand") && STAND_ACTS.some((k) => Object.hasOwn(args, k))) return;
        return words(SPAWNED_FOR).held(
          entry.place,
          entry.realm ?? String(args.realm),
          pair.room,
          pair.invite,
        );
      }
      if (entry && !entry.target) entry.target = target;
      args.spawned_for = pair;
    },
    forget(session: string) {
      starts.delete(session);
    },
  };
}
