// The stdio bridge cannot see prompts. Only the initial user prompt supplies this fallback.
// Session-local, never the server process's environment (graph @nks/nks-dev, #9959).
import { SPAWNED_FOR, tool } from "../delivery/index.ts";
import { words } from "../shared/lang.ts";
import { mergeSpawn, parseSpawn, spawnReceipt } from "../shared/spawned-for.ts";
import { spawnAdmission, type SpawnStart } from "./spawn-admission.ts";

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
      if (
        r?.isError ||
        !spawnReceipt(r?.structuredContent, parseSpawn(args.spawned_for), { name })
      ) {
        const error = new Error(words(SPAWNED_FOR).echo());
        if (entry) entry.error = error;
        throw error;
      }
      if (entry) entry.claimed = true;
    },
    prompt: spawnAdmission(starts, readContext),
    apply(session: string, name: string, args: Record<string, unknown>) {
      const entry = starts.get(session);
      if (entry?.error) throw entry.error;
      if (!(
        name === tool("stand") ||
        (name === tool("channel") && ["connect", "register", "mint"].includes(String(args.action)))
      ))
        return;
      if (entry?.pending) throw new Error(words(SPAWNED_FOR).initial());
      const target = `${String(args.realm)}#${String(args.karta).replace(/^#/, "")}`;
      const explicit = Object.hasOwn(args, "spawned_for")
        ? parseSpawn(args.spawned_for)
        : undefined;
      const pair = mergeSpawn(
        explicit,
        !entry?.target || entry.target === target ? entry?.pair : undefined,
      );
      if (!pair) return;
      if (entry && !entry.target) entry.target = target;
      args.spawned_for = pair;
    },
    forget(session: string) {
      starts.delete(session);
    },
  };
}
