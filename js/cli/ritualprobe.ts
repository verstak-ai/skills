// The scope run of an OpenCode ritual plugin (graph @nks/nks-dev, nodes #6686, #5048).
// One ctx.event.subscribe stream per OpenCode server: an instance sees session.created
// of every directory, and that scope is checked. ctx.tool.hook fires only for calls in
// the instance's directory, so hooks run in its own session and are judged only for
// breakage. The instance directory is given through a symlink and its own session
// comes twice, by the real path and by the instance's spelling — as /tmp and
// /private/tmp diverge live, where raw string comparison loses one of them.
import { mkdtempSync, rmSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

import { type Fn, runHooks, type Who } from "./ritualcalls.ts";

const SETTLE_MS = 200;
const SETUP_MS = 5000;

/** What the plugin did to sessions: writes on stream events and tool hook breakages. */
export interface Scope {
  /** Writes into a session on session.created. */
  writes: Record<Who, number>;
  /** The plugin subscribed to the event stream (ctx.event.subscribe). */
  subscribed: boolean;
  /** A tool hook broke in its own session: a code error, a throw on a plain write or after a call. */
  broken: string[];
  /** In its own session the guard threw on a write into the memory path. */
  ownBefore: boolean;
  /** The after-push hook appended to the result in its own session. */
  ownAfter: boolean;
}

// A ctx member the run did not set is a callable no-op; `then` is empty so that
// `await ctx.x` does not take the stub for a promise.
const loose = (fields: object = {}): object =>
  new Proxy(fields, {
    get: (t, k) =>
      k in t || typeof k === "symbol" || k === "then"
        ? (t as Record<PropertyKey, unknown>)[k]
        : loose(async () => undefined),
  });

// Context fields (@opencode/plugin 2.0.4, promise/plugin.d.ts) the run does not name are
// stubs; fields outside Context (ctx.directory etc.) are undefined, as live.
const DOMAINS = new Set(
  "app location options agent aisdk command event experimental integration mcp model generate permission plugin provider reference rpc session shell skill storage tool vcs websearch worktree".split(
    " ",
  ),
);
const context = (fields: object): object =>
  new Proxy(fields, {
    get: (t, k) =>
      k in t || typeof k === "symbol" || !DOMAINS.has(k)
        ? (t as Record<PropertyKey, unknown>)[k]
        : loose(async () => undefined),
  });

// A sample may keep "said once" on globalThis, shared by all instances of the process.
// The auditor runs plugins in one process: before each run what plugins added is removed,
// and session ids are the run's own.
const baseline = new Set(Reflect.ownKeys(globalThis));
const dropPluginGlobals = (): void => {
  const g = globalThis as Record<PropertyKey, unknown>;
  for (const k of Reflect.ownKeys(globalThis)) if (!baseline.has(k)) delete g[k];
};
let probes = 0;

const created = (sessionID: string, directory: string) => {
  const location = { directory };
  return {
    type: "session.created",
    location,
    data: { sessionID, projectID: `prj-${sessionID}`, location },
  };
};

const settle = (ms = SETTLE_MS) => new Promise((r) => setTimeout(r, ms));

/**
 * Loads the plugin with ctx.location a symlink to own and checks it against sessions
 * of own (both spellings) and foreign. The symlink directory is removed afterwards.
 */
export async function probeScope(file: string, own: string, foreign: string): Promise<Scope> {
  const aliasRoot = mkdtempSync(join(tmpdir(), "ritual-scope-alias-"));
  try {
    const alias = join(aliasRoot, "own");
    symlinkSync(own, alias, "dir");
    return await probeWith(file, own, alias, foreign);
  } finally {
    rmSync(aliasRoot, { recursive: true, force: true });
  }
}

async function probeWith(
  file: string,
  own: string,
  alias: string,
  foreign: string,
): Promise<Scope> {
  dropPluginGlobals();
  const tag = ++probes;
  const who: Who[] = ["mine", "twin", "theirs"];
  const id = Object.fromEntries(who.map((w) => [w, `${w}@${tag}`])) as Record<Who, string>;
  const whoOf = (sessionID?: string): Who | undefined => who.find((w) => id[w] === sessionID);
  const dirs: Record<Who, string> = { mine: own, twin: alias, theirs: foreign };
  const writes: Record<Who, number> = { mine: 0, twin: 0, theirs: 0 };
  const hooks: Record<string, Fn[]> = {};
  const reads = new Set(["get", "list", "messages", "children", "status"]);
  const session = new Proxy(
    {},
    {
      get: (_, k) => {
        if (typeof k === "symbol" || k === "then") return undefined;
        if (k === "get")
          return async ({ sessionID }: { sessionID?: string } = {}) => {
            const who = whoOf(sessionID);
            return who ? { id: sessionID, location: { directory: dirs[who] } } : null;
          };
        if (reads.has(k)) return async () => [];
        return async (arg?: { sessionID?: string }) => {
          const who = whoOf(arg?.sessionID);
          if (who) writes[who] += 1;
        };
      },
    },
  );
  let subscribed = false;
  const ctx = context({
    location: { directory: alias },
    session,
    tool: loose({ hook: async (name: string, fn: Fn) => void (hooks[name] ??= []).push(fn) }),
    event: loose({
      subscribe: ({ signal }: { signal?: AbortSignal } = {}) => {
        subscribed = true;
        return (async function* () {
          for (const w of who) yield created(id[w], dirs[w]);
          if (signal) await new Promise((r) => signal.addEventListener("abort", r));
        })();
      },
    }),
  });
  const mod = (await import(`${pathToFileURL(file).href}?scope=${Date.now()}`)) as Record<
    string,
    unknown
  >;
  const plugin = (mod.default ??
    Object.values(mod).find((v) => typeof (v as { setup?: unknown })?.setup === "function")) as
    { setup?: (c: object) => unknown } | undefined;
  if (typeof plugin?.setup !== "function") throw new Error("no default export { setup }");
  let timer: NodeJS.Timeout | undefined;
  const cleanup = await Promise.race([
    plugin.setup(ctx),
    new Promise(
      (_, no) =>
        (timer = setTimeout(
          () => no(new Error(`setup did not return in ${SETUP_MS} ms`)),
          SETUP_MS,
        )),
    ),
  ]).finally(() => clearTimeout(timer));
  await settle();
  const onEvents = { ...writes };
  const mine = await runHooks(hooks, id.mine);
  await settle(50);
  if (typeof cleanup === "function") await cleanup();
  return {
    writes: onEvents,
    subscribed,
    broken: mine.broken,
    ownBefore: mine.hit.some(
      (h) => h.startsWith("execute.before write: throw") && !mine.broken.includes(h),
    ),
    ownAfter: mine.hit.includes("execute.after bash: changed"),
  };
}
