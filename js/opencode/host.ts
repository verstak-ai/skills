// What the plugin's host — OpenCode itself — says about itself and the session, for the
// "tools" half (tools.ts). Only a type comes from plugin.ts — no runtime import cycle.
import { GLOBAL_PREFIX, OPENCODE } from "../delivery/index.ts";
import { HARNESS_VERSION_ENV, SKILLS_ROOT_ENV } from "../shared/clients.ts";
import { words } from "../shared/lang.ts";
import { clientOf, closeClient } from "./client.ts";
import type { Context } from "./plugin.ts";
import type { Home } from "./records.ts";
import { bridgeRoot } from "./skillread.ts";

/**
 * What the bridge learns of the host only by environment (#6226): OpenCode's own version (the
 * handshake's client is this plugin, not the host), and the set's root — where OpenCode loaded
 * the bridge skill with the bridge in scripts/ (bridgeRoot in skillread.ts); none — not named.
 */
export async function hostEnvOf(ctx: Context): Promise<Record<string, string>> {
  const env: Record<string, string> = {};
  const v = (ctx as { app?: { version?: unknown } | null }).app?.version;
  if (typeof v === "string" && v.trim()) env[HARNESS_VERSION_ENV] = v.trim();
  try {
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any -- the host's answer has no schema */
    const res: any = await ctx.skill.list();
    const list: unknown[] = Array.isArray(res) ? res : (res?.data ?? []);
    const root = list.map(bridgeRoot).find((r) => r !== null);
    if (root) env[SKILLS_ROOT_ENV] = root;
  } catch {
    /* the skill list was not read — the bridge finds the set itself or says "unknown" */
  }
  return env;
}

/**
 * Whether the host's session.update takes `archived` — OpenCode 2.2 on (graph @nks/nks-dev,
 * node #9257); the plugin has no exit of the TUI on any version.
 */
export function archives(ctx: Context): boolean {
  const v = (ctx as { app?: { version?: unknown } | null }).app?.version;
  const m = typeof v === "string" ? /^(\d+)\.(\d+)/.exec(v) : null;
  return !!m && (Number(m[1]) > 2 || (Number(m[1]) === 2 && Number(m[2]) >= 2));
}

/** The session still exists and accepts channel words, rather than being archived. */
export async function accepting(ctx: Context, id: string): Promise<boolean> {
  try {
    const info = await ctx.session.get({ sessionID: id } as never);
    const shape = info as unknown as {
      time?: { archived?: number };
      data?: { time?: { archived?: number } };
    };
    return !(shape?.time?.archived ?? shape?.data?.time?.archived);
  } catch {
    return false;
  }
}

/** A cancellation window before signalling the bound client; the terminal ack still waits. */
const CLOSE_AFTER_MS = 1_000;

/**
 * The stopped session archived (`on`) or taken out of the archive (#9256) — archived, not
 * removed: the human reads what the agent got to. A root session's client is closed as well
 * (client.ts); archive refusal or unobserved exit refuses the full stop, never a false success.
 */
export function archiver(
  ctx: Context,
  tell: (text: string) => void,
): (id: string, on: boolean, active?: () => boolean) => Promise<void> {
  const W = words(OPENCODE);
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any -- update takes `archived` from 2.2 on */
  const session = ctx.session as any;
  // Location instances share the update queue: a new stand cannot unarchive before an older
  // instance's in-flight archive finishes, nor let that old instance signal the client later.
  type Book = { turns: Map<string, number>; updating: Map<string, Promise<unknown>> };
  const global = globalThis as unknown as Record<string, Book | undefined>;
  const { turns, updating } = (global[`${GLOBAL_PREFIX}ArchiveQueue`] ??= {
    turns: new Map<string, number>(),
    updating: new Map<string, Promise<unknown>>(),
  });
  return async (id, on, active = () => true) => {
    const turn = (turns.get(id) ?? 0) + 1;
    turns.set(id, turn);
    const current = (): boolean => turns.get(id) === turn && active();
    if (!archives(ctx) || typeof session.update !== "function") {
      if (!on) return;
      tell(W.sessionLeftOpen(id, "archive_missing"));
      throw new Error("archive_missing");
    }
    // A stand queues its unarchive after the old in-flight update, never before it.
    const update = (updating.get(id) ?? Promise.resolve())
      .catch(() => {})
      .then(async () => {
        if (!current()) return;
        await session.update({ sessionID: id, archived: on });
      });
    updating.set(id, update);
    try {
      await update;
    } catch {
      tell(W.sessionLeftOpen(id, "archive_refused"));
      throw new Error("archive_refused");
    } finally {
      if (updating.get(id) === update) updating.delete(id);
    }
    if (!on || !current()) return;
    const res = await session.get({ sessionID: id }).catch(() => null);
    const info = res?.data ?? res;
    if (!info?.time?.archived) throw new Error("archive_unconfirmed");
    const root = !info.parentID;
    if (!current()) return;
    const client = root ? clientOf(id) : null;
    if (!root) return;
    if (client === null) {
      tell(W.sessionLeftOpen(id, null));
      throw new Error("client_unbound");
    }
    await new Promise((r) => setTimeout(r, CLOSE_AFTER_MS));
    if (!current()) return;
    const closed = await closeClient(client, current);
    if (!current()) return;
    tell(
      closed ? W.clientClosed(id, client.pid) : W.sessionLeftOpen(id, "client_exit_unconfirmed"),
    );
    if (!closed) throw new Error("client_exit_unconfirmed");
  };
}

/** This plugin instance's location — ctx.location (@opencode/plugin 2.0.4); the loss marker is tagged by it (marker.ts). */
export function homeOf(ctx: Context): Home | null {
  const loc = (ctx as { location?: { directory?: unknown; workspaceID?: unknown } }).location;
  if (typeof loc?.directory !== "string" || !loc.directory) return null;
  const workspace = typeof loc.workspaceID === "string" ? loc.workspaceID : null;
  return { directory: loc.directory, workspace };
}

/** The session's directory — the working copy of its turn (location.directory); none — empty, the bridge uses its cwd. */
export async function sessionDirectory(ctx: Context, sessionID: string): Promise<string | null> {
  try {
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any -- the host's answer has no schema */
    const res: any = await ctx.session.get({ sessionID } as any);
    const dir = res?.location?.directory ?? res?.data?.location?.directory;
    return typeof dir === "string" && dir.trim() ? dir : null;
  } catch {
    return null;
  }
}
