// Launch identity, not a case number (graph @nks/nks-dev, #9959, #6576).
import { SPAWNED_FOR } from "../delivery/index.ts";
import { words } from "./lang.ts";

export interface SpawnedFor {
  invite: number;
  room: string;
}
export const sameSpawn = (a: SpawnedFor, b: SpawnedFor): boolean =>
  a.invite === b.invite && a.room === b.room;
const invalid = (): never => {
  throw new Error(words(SPAWNED_FOR).invalid());
};

export function parseSpawn(value: unknown): SpawnedFor {
  if (!value || typeof value !== "object" || Array.isArray(value)) return invalid();
  const a = value as Record<string, unknown>;
  if (
    Object.keys(a).length !== 2 ||
    !Number.isSafeInteger(a.invite) ||
    Number(a.invite) <= 0 ||
    typeof a.room !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(a.room)
  )
    return invalid();
  return { invite: a.invite as number, room: a.room.toLowerCase() };
}

export function spawnJson(text: string): SpawnedFor {
  try {
    const keys = [...text.matchAll(/("(?:\\.|[^"\\])*")\s*:/g)].map(
      (m) => JSON.parse(m[1]) as string,
    );
    if (keys.length !== new Set(keys).size) return invalid();
    return parseSpawn(JSON.parse(text));
  } catch {
    return invalid();
  }
}

export function mergeSpawn(...values: (SpawnedFor | undefined)[]): SpawnedFor | undefined {
  const pairs = values.filter((v): v is SpawnedFor => v !== undefined);
  if (pairs.some((v) => !sameSpawn(v, pairs[0]))) return invalid();
  return pairs[0];
}

export function firstLineSpawn(text: string): SpawnedFor | undefined {
  const first = text.split(/\r?\n/, 1)[0];
  return first.startsWith("spawned_for:")
    ? spawnJson(first.slice("spawned_for:".length))
    : undefined;
}

export interface SpawnIdentity {
  seat_id?: string;
  standing?: string;
  name?: string;
}
export interface SpawnReceipt {
  seat_id: string;
  standing: string;
  spawned_for: SpawnedFor;
}

/** MCP 0.139 register receipt: select identity first, then compare the pair (#9959). */
export function spawnReceipt(
  structured: unknown,
  expected: SpawnedFor,
  identity: SpawnIdentity,
): SpawnReceipt | null {
  if (!structured || typeof structured !== "object") return null;
  const s = structured as Record<string, unknown>;
  if (
    s.action !== "register" ||
    s.incomplete === true ||
    (s.dropped !== undefined && s.dropped !== 0) ||
    !Array.isArray(s.seats)
  )
    return null;
  if (!identity.seat_id && !identity.standing && (!identity.name || s.seats.length !== 1))
    return null;
  const seats = s.seats as Record<string, unknown>[];
  if (
    seats.some(
      (v) =>
        !v ||
        typeof v !== "object" ||
        typeof v.seat_id !== "string" ||
        !v.seat_id ||
        typeof v.standing !== "string" ||
        !/^@[^:]+:.+$/.test(v.standing),
    )
  )
    return null;
  const matches = seats.filter((v) => {
    if (identity.seat_id) return v.seat_id === identity.seat_id;
    if (identity.standing) return v.standing === identity.standing;
    return (v.standing as string).slice((v.standing as string).indexOf(":") + 1) === identity.name;
  });
  if (matches.length !== 1) return null;
  const v = matches[0];
  if (identity.standing && v.standing !== identity.standing) return null;
  if (
    identity.name &&
    (v.standing as string).slice((v.standing as string).indexOf(":") + 1) !== identity.name
  )
    return null;
  try {
    const pair = parseSpawn(v.spawned_for);
    return sameSpawn(pair, expected)
      ? { seat_id: v.seat_id as string, standing: v.standing as string, spawned_for: pair }
      : null;
  } catch {
    return null;
  }
}
