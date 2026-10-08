// Bridge state per session, not per process: the machine daemon holds many sessions
// in one process, each in its own AsyncLocalStorage scope; a full bridge is a process
// with one session in the process scope.
//
// Stateful modules hold state through scoped(), created lazily in the calling scope.
// The scope follows promise and timer chains by itself; an event handler hung inside
// a session and called from outside must be wrapped in bindScope, or it would see the
// process scope.
import { AsyncLocalStorage } from "node:async_hooks";

/** Where the session comes from — the harness's bridge as launched (seam handshake). */
export interface ScopeOrigin {
  /** The harness bridge's environment — session keys only (shared/seam.ts isSessionEnvKey). */
  env: Record<string, string>;
  cwd: string;
  pid: number;
  /** The harness bridge's file: the skill set is found by it (skillset.ts). */
  path: string;
}

export interface Scope {
  readonly id: string;
  /** null — the process scope. */
  readonly origin: ScopeOrigin | null;
  /** Environment keys that belong to the session in this scope (the rest — to the process). */
  readonly sessionKey: (k: string) => boolean;
  readonly slots: Map<object, unknown>;
  /** Where this scope's log goes; null — the process stderr (or the daemon journal). */
  log: ((line: string) => void) | null;
}

const als = new AsyncLocalStorage<Scope>();
const PROCESS: Scope = {
  id: "process",
  origin: null,
  sessionKey: () => false,
  slots: new Map(),
  log: null,
};

export const currentScope = (): Scope => als.getStore() ?? PROCESS;
export const processScope = (): Scope => PROCESS;
/** Inside a session scope (daemon), not the process scope. */
export const inSessionScope = (): boolean => !!als.getStore()?.origin;

export function newScope(
  id: string,
  origin: ScopeOrigin,
  sessionKey: (k: string) => boolean,
): Scope {
  return { id, origin, sessionKey, slots: new Map(), log: null };
}

export const runIn = <T>(scope: Scope, fn: () => T): T => als.run(scope, fn);

/** A handler called from outside the scope runs in the scope where it was hung. */
export function bindScope<A extends unknown[], R>(fn: (...a: A) => R): (...a: A) => R {
  const s = als.getStore();
  return s ? (...a: A) => als.run(s, () => fn(...a)) : fn;
}

/** bindScope over every handler of an options object. */
export const bindAll = <T extends object>(o: T): T =>
  Object.fromEntries(
    Object.entries(o).map(([k, v]) => [
      k,
      typeof v === "function" ? bindScope(v as (...a: unknown[]) => unknown) : v,
    ]),
  ) as T;

/**
 * A value per scope: an object (or Map, Set) created by init on first access from the
 * scope. The proxy serves the current scope's value, so a module writes `S.x` and
 * `map.get(k)` as with a module variable.
 */
export function scoped<T extends object>(init: () => T): T {
  const key = {};
  const own = (): T => {
    const slots = currentScope().slots;
    let v = slots.get(key) as T | undefined;
    if (v === undefined) {
      v = init();
      slots.set(key, v);
    }
    return v;
  };
  return new Proxy({} as T, {
    get: (_, k) => {
      const t = own();
      const v = Reflect.get(t, k, t) as unknown;
      return typeof v === "function" ? (v as (...a: unknown[]) => unknown).bind(t) : v;
    },
    set: (_, k, v) => Reflect.set(own(), k, v),
    has: (_, k) => Reflect.has(own(), k),
    deleteProperty: (_, k) => Reflect.deleteProperty(own(), k),
    ownKeys: () => Reflect.ownKeys(own()),
    getOwnPropertyDescriptor: (_, k) => {
      const d = Reflect.getOwnPropertyDescriptor(own(), k);
      if (d) d.configurable = true;
      return d;
    },
  });
}

/** An environment variable as the scope sees it: a session key comes from the harness bridge's environment. */
export function envOf(k: string): string | undefined {
  const s = currentScope();
  if (s.origin && s.sessionKey(k)) return s.origin.env[k];
  return process.env[k];
}

/** pid of the session's owner: the harness bridge, not the daemon. */
export const sessionPid = (): number => currentScope().origin?.pid ?? process.pid;
/** Directory the harness launched the bridge from. */
export const sessionCwd = (): string => currentScope().origin?.cwd ?? process.cwd();
