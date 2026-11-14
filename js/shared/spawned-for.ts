// Launch identity, not a case number (graph @nks/nks-dev, #9959, #6576).
import { SPAWN_LINE, SPAWNED_FOR } from "../delivery/index.ts";
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
  return spawnLine(text, false).pair;
}

/** The pair, and on the launch's first line only the role it was raised for (#10598): the
 * register takes the pair alone. */
function spawnLine(text: string, role: boolean): { pair: SpawnedFor; karta?: number } {
  try {
    const keys = [...text.matchAll(/("(?:\\.|[^"\\])*")\s*:/g)].map(
      (m) => JSON.parse(m[1]) as string,
    );
    if (keys.length !== new Set(keys).size) return invalid();
    const v = JSON.parse(text) as Record<string, unknown>;
    if (!role || !v || typeof v !== "object" || !Object.hasOwn(v, "karta"))
      return { pair: parseSpawn(v) };
    const { karta, ...pair } = v;
    if (!Number.isSafeInteger(karta) || Number(karta) <= 0) return invalid();
    return { pair: parseSpawn(pair), karta: karta as number };
  } catch {
    return invalid();
  }
}

export function mergeSpawn(...values: (SpawnedFor | undefined)[]): SpawnedFor | undefined {
  const pairs = values.filter((v): v is SpawnedFor => v !== undefined);
  if (pairs.some((v) => !sameSpawn(v, pairs[0]))) return invalid();
  return pairs[0];
}

export interface FirstLineSpawn {
  pair: SpawnedFor;
  /** The prompt without its pair line: the session's own words (#9959). */
  rest: string;
  /** The role the launch was raised for in its home, not the cover's (#10598). */
  karta?: number;
}

/**
 * The pair of an initial prompt's first line (#9959 v16): the JSON object is the whole line —
 * the two-line form any sender may use — or the line's start with the brief after it through a
 * space, the one-line form the orchestrator submits (#9969): a multi-line --prompt the
 * terminal turns into a paste that is never sent. The object's end is found balanced, quoted
 * strings and escapes respected; no object, glued text, an empty same-line remainder, invalid
 * JSON or a repeated key is the invalid refusal. The rest is what the session keeps.
 */
export function firstLineSpawn(text: string): FirstLineSpawn | undefined {
  const first = text.split(/\r?\n/, 1)[0];
  // Only this delivery's mark: another delivery's plugin in the same harness leaves it be.
  if (!first.startsWith(SPAWN_LINE)) return undefined;
  const body = first.slice(SPAWN_LINE.length);
  const at = body.indexOf("{");
  if (at < 0 || body.slice(0, at).trim() !== "") return invalid();
  let end = -1;
  let depth = 0;
  let quoted = false;
  let escaped = false;
  for (let i = at; i < body.length; i++) {
    const ch = body[i];
    if (escaped) escaped = false;
    else if (quoted && ch === "\\") escaped = true;
    else if (quoted) quoted = ch !== '"';
    else if (ch === '"') quoted = true;
    else if (ch === "{") depth++;
    else if (ch === "}" && --depth === 0) {
      end = i;
      break;
    }
  }
  if (end < 0) return invalid();
  const { pair, karta } = spawnLine(body.slice(at, end + 1), true);
  const role = karta === undefined ? {} : { karta };
  const below = ((): string => {
    if (text.length === first.length) return "";
    // The separator split(/\r?\n/) consumed: \n, or \r\n.
    return text.slice(first.length + (text.charCodeAt(first.length) === 10 ? 1 : 2));
  })();
  const after = body.slice(end + 1);
  if (after === "") return { pair, rest: below, ...role };
  if (after[0] !== " " && after[0] !== "\t") return invalid();
  const brief = after.replace(/^[ \t]+/, "");
  if (!brief) return invalid();
  return { pair, rest: below ? `${brief}\n${below}` : brief, ...role };
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
  // A channel the machine shares lists all its seats: the name must pick exactly one (#8640).
  if (!identity.seat_id && !identity.standing && !identity.name) return null;
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
