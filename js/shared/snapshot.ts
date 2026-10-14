// Machine status wire and allowlist (graph @nks/nks-dev, node #7494).
export interface PlaceSnapshot {
  name: string;
  realm: string;
  karta: string | number;
  primary: boolean;
  /** The platform's seat id (hello, register) — the `stop` subcommand addresses the seat by it. */
  standing_id?: string;
  /** The seat's address @handle:name — `stop @handle:name` checks the owner by it. */
  address?: string;
  satellite_of?: string;
  listening: boolean;
  last_work_at?: string;
  usage?: Record<string, string | number>;
  /** The last pulse the seat's socket carried (graph @nks/nks-dev, node #7529), with sent_at. */
  pulse?: Record<string, string | number>;
  /** Last skills this bridge sent with a successful reply, not a readback of server attrs. */
  skills?: { name: string; version: string; stamp?: string };
  skills_mismatch?: boolean;
}
export interface SessionSnapshot {
  local_id: string;
  thin_pid: number;
  attached: boolean;
  harness: string;
  harness_session: string | null;
  cwd: string;
  build: string;
  /** The session's server and its seats' api (the socket's origin): `stop` keys and addresses a seat by them. */
  server?: string;
  api?: string;
  /** Last skills this bridge sent with a successful reply; other writers are not observed. */
  skills?: { name: string; version: string; stamp?: string };
  installed_skills?: { name: string; version: string; stamp?: string };
  skills_mismatch?: boolean;
  places: PlaceSnapshot[];
}
export interface MachineSnapshot {
  daemon: { pid: number; build: string; path: string };
  sessions: SessionSnapshot[];
}
export const record = (v: unknown): Record<string, unknown> =>
  v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
export const text = (v: unknown): string => (typeof v === "string" ? v : "");
const number = (v: unknown): number => (typeof v === "number" && Number.isFinite(v) ? v : 0);
const list = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

export function safeSkills(v: unknown): SessionSnapshot["skills"] {
  const s = record(v);
  if (typeof s.name !== "string" || typeof s.version !== "string") return undefined;
  return {
    name: s.name,
    version: s.version,
    ...(typeof s.stamp === "string" ? { stamp: s.stamp } : {}),
  };
}

export function safeUsage(v: unknown): Record<string, string | number> | undefined {
  const raw = record(v);
  const out: Record<string, string | number> = {};
  for (const k of [
    "tokens",
    "input",
    "output",
    "cache_read",
    "cache_write",
    "context",
    "window",
    "percent",
  ])
    if (typeof raw[k] === "number" && Number.isFinite(raw[k])) out[k] = raw[k];
  for (const k of ["model", "at"]) if (typeof raw[k] === "string") out[k] = raw[k];
  return Object.keys(out).length ? out : undefined;
}
export function safePulse(v: unknown): Record<string, string | number> | undefined {
  const raw = record(v);
  if (typeof raw.state !== "string") return undefined;
  const out: Record<string, string | number> = { state: raw.state };
  if (typeof raw.pending === "number" && Number.isFinite(raw.pending)) out.pending = raw.pending;
  for (const k of ["turn_at", "read_at", "cycle_at", "sent_at"])
    if (typeof raw[k] === "string") out[k] = raw[k];
  return out;
}
export function safePlace(v: unknown): PlaceSnapshot {
  const p = record(v);
  const usage = safeUsage(p.usage);
  const pulse = safePulse(p.pulse);
  const skills = safeSkills(p.skills);
  return {
    name: text(p.name),
    realm: text(p.realm),
    karta: typeof p.karta === "number" ? number(p.karta) : text(p.karta),
    primary: p.primary === true,
    listening: p.listening === true,
    ...(typeof p.standing_id === "string" ? { standing_id: p.standing_id } : {}),
    ...(typeof p.address === "string" && p.address ? { address: p.address } : {}),
    ...(typeof p.satellite_of === "string" ? { satellite_of: p.satellite_of } : {}),
    ...(typeof p.last_work_at === "string" ? { last_work_at: p.last_work_at } : {}),
    ...(usage ? { usage } : {}),
    ...(pulse ? { pulse } : {}),
    ...(skills ? { skills } : {}),
    ...(typeof p.skills_mismatch === "boolean" ? { skills_mismatch: p.skills_mismatch } : {}),
  };
}
/** Apply at both ends: never spread wire, disk, attrs or origin into output. */
export function safeSnapshot(v: unknown): MachineSnapshot {
  const raw = record(v);
  const d = record(raw.daemon);
  return {
    daemon: { pid: number(d.pid), build: text(d.build), path: text(d.path) },
    sessions: list(raw.sessions).map((v) => {
      const s = record(v);
      const skills = safeSkills(s.skills);
      const installed = safeSkills(s.installed_skills);
      return {
        local_id: text(s.local_id),
        thin_pid: number(s.thin_pid),
        attached: s.attached === true,
        harness: text(s.harness),
        harness_session: typeof s.harness_session === "string" ? s.harness_session : null,
        cwd: text(s.cwd),
        build: text(s.build),
        ...(typeof s.server === "string" && s.server ? { server: s.server } : {}),
        ...(typeof s.api === "string" && s.api ? { api: s.api } : {}),
        ...(skills ? { skills } : {}),
        ...(installed ? { installed_skills: installed } : {}),
        ...(typeof s.skills_mismatch === "boolean" ? { skills_mismatch: s.skills_mismatch } : {}),
        places: list(s.places).map(safePlace),
      };
    }),
  };
}
