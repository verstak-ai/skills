// How the stops' interrupts ended, across the process (graph @nks/nks-dev, nodes #7510, #4266).
// OpenCode loads an instance per location: a root's stop is confirmed by its instance, while a
// child in another folder is cut by that folder's instance (twins.ts sweepAll). So the outcome of
// each session's cut and the instances' child → parent maps lie, like the stops (halts.ts), in a
// registry on globalThis: the confirmation waits for the session and every descendant the
// process knows, whoever cuts them. A descendant no live instance cuts is waited for until the
// confirmation's cap (cuts.ts answerHalt); the bridge then answers the order unknown harness_silent.
// The cap and the waiting instance's stop take its waits out of the registry.
/* eslint-disable @typescript-eslint/no-explicit-any -- the process registry lives on globalThis */
import { GLOBAL_PREFIX } from "../delivery/index.ts";
import { descendantsOf } from "./halts.ts";

/** null — the turn is cut; a code — the interrupt was refused or is impossible. */
export type CutOutcome = string | null;

/** The session's cut outcome with the stop it answers for. */
const outcomes = (): Map<string, [string, CutOutcome]> =>
  ((globalThis as any)[`${GLOBAL_PREFIX}CutOutcomes`] ??= new Map<string, [string, CutOutcome]>());
const waiters = (): Map<string, Set<() => void>> =>
  ((globalThis as any)[`${GLOBAL_PREFIX}CutWaiters`] ??= new Map<string, Set<() => void>>());
/** The child → parent maps of the process's live instances. */
const lineages = (): Set<ReadonlyMap<string, string>> =>
  ((globalThis as any)[`${GLOBAL_PREFIX}Lineages`] ??= new Set<ReadonlyMap<string, string>>());

function wake(id: string): void {
  const set = waiters().get(id);
  waiters().delete(id);
  for (const w of set ?? []) w();
}

/** The session's cut for stop `gen` ended with `code`. */
export function settle(id: string, gen: string, code: CutOutcome): void {
  outcomes().set(id, [gen, code]);
  wake(id);
}

/** The session is gone or stands again: whoever waits reads it anew. */
export function forget(id: string): void {
  outcomes().delete(id);
  wake(id);
}

/**
 * The outcome of the session's cut for its current stop (`stopOf`); a session not stopped is cut.
 * `signal` aborted — the wait leaves the registry and never settles.
 */
export function outcomeOf(
  id: string,
  stopOf: (id: string) => string | null,
  signal?: AbortSignal,
): Promise<CutOutcome> {
  const gen = stopOf(id);
  const o = outcomes().get(id);
  if (gen === null) return Promise.resolve(null);
  if (o?.[0] === gen) return Promise.resolve(o[1]);
  return new Promise((done) => {
    if (signal?.aborted) return;
    const set = waiters().get(id) ?? new Set();
    const off = (): void => {
      const now = waiters().get(id);
      now?.delete(w);
      if (now?.size === 0) waiters().delete(id);
    };
    const w = (): void => {
      signal?.removeEventListener("abort", off);
      void outcomeOf(id, stopOf, signal).then(done);
    };
    signal?.addEventListener("abort", off, { once: true });
    set.add(w);
    waiters().set(id, set);
  });
}

/** An instance's child → parent map joins the process's lineage; the call returned takes it out. */
export function shareLineage(parents: ReadonlyMap<string, string>): () => void {
  lineages().add(parents);
  return () => void lineages().delete(parents);
}

/** The session's parent as any live instance of the process learnt it. */
export function processParent(session: string): string | undefined {
  for (const m of lineages()) {
    const p = m.get(session);
    if (p !== undefined) return p;
  }
  return undefined;
}

/** Every descendant of the session any live instance of the process knows. */
export const processDescendants = (session: string): string[] =>
  descendantsOf(
    session,
    [...lineages()].flatMap((m) => [...m]),
  );

/* eslint-enable @typescript-eslint/no-explicit-any */
