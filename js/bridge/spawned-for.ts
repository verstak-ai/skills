// Per-session launch basis; never read the daemon process's launch environment (#9959).
import { SPAWNED_FOR_ENV } from "../delivery/index.ts";
import { envOf, scoped } from "../shared/scope.ts";
import { mergeSpawn, parseSpawn, type SpawnedFor, spawnJson } from "../shared/spawned-for.ts";
import { CFG } from "./config.ts";
import { canonRealm } from "./realms.ts";

const S = scoped(() => ({
  target: null as string | null,
  pair: undefined as SpawnedFor | undefined,
  refused: null as string | null,
}));
export const refuseClaim = (text: string): void => {
  S.refused = text;
};
export const claimRefusal = (): string | null => S.refused;
const targetOf = (a: { realm?: unknown; karta?: unknown }): string =>
  `${canonRealm(a.realm)}#${String(a.karta).replace(/^#/, "")}`;

/** Call before any taking path, including status/automatic resume. */
export function launchBasis(a: Record<string, unknown>): SpawnedFor | undefined {
  const target = targetOf(a);
  const explicit = Object.hasOwn(a, "spawned_for") ? parseSpawn(a.spawned_for) : undefined;
  // A satellite inherits its launcher's environment, so the pair there is the launcher's.
  const env = CFG.satellite ? undefined : envOf(SPAWNED_FOR_ENV);
  const inherited = S.target === null || S.target === target;
  const pair = mergeSpawn(
    explicit,
    inherited && env !== undefined ? spawnJson(env) : undefined,
    S.target === target ? S.pair : undefined,
  );
  return pair;
}

export function rememberBasis(a: Record<string, unknown>, pair: SpawnedFor | undefined): void {
  if (pair && S.target === null) {
    S.target = targetOf(a);
    S.pair = pair;
  }
}

/** Replay only to the exact graph/role, never to another seat's scope. */
export function registeredBasis(a: { realm?: unknown; karta?: unknown }): Record<string, unknown> {
  return S.target === targetOf(a) && S.pair ? { spawned_for: S.pair } : {};
}
