// The delivery's door into an OpenCode 2 session — ONE plugin, three halves
// (graph @nks/nks-dev, node #4266; OpenCode's shape — node #4283: the server holds many
// sessions, and each root session has its own bridge, hence its own standing).
//
//   • tools    — a bridge child process per root session (and per child session that
//                stood by its own call, node #5154), each server tool under its own name (tools.ts);
//   • channel  — frames of the standing the session's bridge holds enter it as a prompt (channel.ts);
//   • commands — every installed delivery skill with `slash: true` becomes a «/» command (commands.ts).
//
// Plugin surface of OpenCode 2: a module whose default export is an OBJECT {id, setup(ctx)};
// it needs no imports — the @opencode/plugin types are erased by the build.
import type { Plugin } from "@opencode/plugin";

import { LOGGERS, OPENCODE, PLUGIN, PRODUCT } from "../delivery/index.ts";
import { words } from "../shared/lang.ts";
import { withWord } from "../shared/launch.ts";
import { setupChannel } from "./channel.ts";
import { setupCommands } from "./commands.ts";
import { idleHalf } from "./half.ts";
import { homeOf } from "./host.ts";
import { createKeepAlive, keepaliveTitle } from "./keepalive.ts";
import { teller } from "./leaddoors.ts";
import { annotate } from "./notice.ts";
import { setupSkillReads } from "./skillread.ts";
import { type Say, setupTools } from "./tools.ts";
import { createTwins } from "./twins.ts";
import { createUsageFeed } from "./usage.ts";
import { createWaits } from "./waits.ts";

export type Context = Plugin.Context;

/* eslint-disable @typescript-eslint/no-explicit-any -- SDK events and answers without a schema */

async function setup(ctx: Context): Promise<() => Promise<void>> {
  const W = words(OPENCODE);
  // A server plugin has no toast: a word to the human is the service's stderr (channel.ts prompts the agent).
  const say: Say = (text, level) => {
    process.stderr.write(`[${PRODUCT}${level === "info" ? "" : "/" + level}] ${text}\n`);
  };

  // Root sessions seen and when: a subagent shares its parent's bridge (root by the parentID chain),
  // and an ownerless bridge's frame goes to the freshest one seen — the v2 context lists no sessions.
  const roots = new Map<string, string>();
  const seen = new Map<string, number>();
  async function rootOf(sessionID: string): Promise<string> {
    const known = roots.get(sessionID);
    if (known) {
      seen.set(known, Date.now());
      return known;
    }
    let root = sessionID;
    try {
      const visited = new Set<string>();
      for (;;) {
        visited.add(root);
        const res: any = await ctx.session.get({ sessionID: root } as any);
        const parent: string | undefined = res?.parentID ?? res?.data?.parentID;
        if (!parent || visited.has(parent)) break;
        root = parent;
      }
    } catch {
      // Unreadable now (not on disk yet at session.created): its own root for now, not cached (#4283).
      seen.set(root, Date.now());
      return root;
    }
    roots.set(sessionID, root);
    seen.set(root, Date.now());
    return root;
  }
  function freshestRoot(): string | null {
    let best: string | null = null;
    let at = -1;
    for (const [id, t] of seen) {
      if (t <= at) continue;
      best = id;
      at = t;
    }
    return best;
  }

  // Each half under its own try: a failed one takes neither the other nor the plugin's load.
  let onChannel: (session: string | null, params: unknown, child?: boolean) => void = () => {};
  let ch: ReturnType<typeof setupChannel> | null = null;
  try {
    const c0 = setupChannel(ctx, say, freshestRoot);
    ch = c0;
    onChannel = (s, p, c) => c0.onEvent(s, p, c);
  } catch (e) {
    say(W.channelDown((e as Error).message), "error");
  }

  let half = idleHalf();
  // Usage comes up after the tools (it needs the session's bridge); a subagent's end flushes it first.
  let flushUsage = (_s: string): Promise<void> => Promise.resolve();
  try {
    half = await setupTools(ctx, say, onChannel, rootOf, (s) => flushUsage(s));
  } catch (e) {
    say(words(PLUGIN).notRaised((e as Error).message), "error");
  }

  // The launch line with a case (launch.ts): the prompt hook waits for the standing and the entry.
  try {
    await ctx.session.hook("prompt", async (p) => {
      const word = await half.launch(String(p.sessionID), p.prompt.text);
      if (word) p.prompt.text = withWord(p.prompt.text, word);
      // Counts of records that woke no turn ride the prompt that starts one (#6574); the root's only into the root.
      const sid = String(p.sessionID);
      const counts = (await rootOf(sid)) === sid ? ch?.ride(sid) : null;
      if (counts) p.prompt.text = `${p.prompt.text}\n\n${counts}`;
    });
  } catch (e) {
    say(W.launchDown((e as Error).message), "error");
  }

  // OpenCode's «completed» at the end of a lead subagent's turn — a word to the model that it is a turn (notice.ts).
  try {
    for (const hook of ["context", "compaction"] as const)
      await ctx.session.hook(hook, (req) => annotate(req, (s) => half.leadOf(s)));
  } catch (e) {
    say(W.noticeDown((e as Error).message), "error");
  }

  let commands: Awaited<ReturnType<typeof setupCommands>> = { refresh: async () => {} };
  try {
    commands = await setupCommands(ctx, say);
  } catch (e) {
    say(W.commandsDown((e as Error).message), "error");
  }

  // Files of a delivery skill outside the working copy are read without an ask (skillread.ts, #6847).
  try {
    if (!(await setupSkillReads(ctx))) say(W.noPermissionHooks(), "warning");
  } catch (e) {
    say(W.skillReadsDown((e as Error).message), "error");
  }

  // Usage goes into the attrs of the session's own seat (usage.ts, #6401).
  const usage = createUsageFeed({
    listModels: () => (ctx as any).model.list(),
    bridgeOf: (s) => half.bridgeOf(s),
  });
  flushUsage = (s) => usage.flush(s);
  // A directory unloads after 60 min without durable events — a held seat keeps it (keepalive.ts).
  const keepalive = createKeepAlive(ctx, {
    holders: () => half.holders(),
    owns: (s) => half.owns(s),
    say: (t, level) => say(t, level ?? "warning"),
  });
  // A child waiting on a permission or interrupted not by a cancel — a word to the parent (waits.ts),
  // told once per process across deliveries (#6815 item 7).
  const waits = createWaits(ctx, {
    tell: teller(ctx, say),
    isLead: (s) => half.leadOf(s) !== null,
  });
  const controller = new AbortController();
  void (async () => {
    try {
      for await (const event of ctx.event.subscribe({ signal: controller.signal })) {
        const ev: any = event;
        const id: string | undefined = ev?.data?.sessionID;
        half.onEvent(ev); // a lead subagent's turn, text and deletion (leads.ts)
        keepalive.onEvent(ev);
        waits.onEvent(ev);
        switch (ev?.type) {
          case "session.deleted":
            if (!id) break;
            roots.delete(id);
            seen.delete(id);
            ch?.gone(id);
            void usage.flush(id).finally(() => {
              usage.forget(id);
              half.forget(id);
            });
            break;
          case "session.created": {
            // data.parentID is the parent, not the root: a grandchild takes its parent's root.
            if (!id) break;
            if (ev.data?.title === keepaliveTitle()) break; // the keepalive service session is no activity
            const parent = ev.data?.parentID;
            if (typeof parent === "string")
              void rootOf(parent).then((root) => {
                roots.set(id, root);
                seen.set(root, Date.now());
              });
            else void rootOf(id);
            break;
          }
          // Moved to another folder (#6550 item 3): the seat goes to the instance of its new location.
          case "session.moved": {
            const loc = ev.data?.location;
            const to =
              typeof loc?.directory === "string"
                ? { directory: loc.directory, workspace: loc.workspaceID ?? null }
                : null;
            if (id) half.moved(id, to);
            break;
          }
          case "skill.updated":
            void commands.refresh();
            break;
          case "session.inbox.delivered":
          case "session.inbox.cancelled":
            if (id && typeof ev.data?.inboxID === "string") ch?.taken(id, ev.data.inboxID);
            break;
          case "session.idle":
            if (id) ch?.taken(id);
            break;
          // Whether a turn is busy — the attention tact waits for its end (channel.ts, #6569); retry is a turn too.
          case "session.status":
            if (id && typeof ev.data?.status?.type === "string")
              ch?.status(id, ev.data.status.type !== "idle");
            break;
          // A turn's end is not a subagent's end (#6625): only a pending usage snapshot here.
          case "session.execution.succeeded":
          case "session.execution.failed":
            if (id) void usage.flush(id);
            break;
          default:
            usage.onEvent(ev);
        }
      }
    } catch {
      /* the event stream closed with the plugin */
    }
  })();

  // An instance of another spelling of the same directory wakes this one unloaded with a seat (twins.ts).
  const twins = createTwins(ctx, homeOf(ctx), {
    say,
    lost: (s, text) => onChannel(s, { logger: LOGGERS.channel, data: { kind: "lost", text } }),
    holds: (r) => half.held(r),
    adopt: () => half.adopt(),
  });

  // The stop waits for the subagents' bridges to pause (children.ts): a reload is not their end.
  return async () => {
    twins.leave();
    controller.abort();
    keepalive.stop();
    waits.stop();
    usage.stop();
    ch?.stop();
    twins.left((await half.stop()) || []);
  };
}

/* eslint-enable @typescript-eslint/no-explicit-any */

export default { id: PRODUCT, setup };
