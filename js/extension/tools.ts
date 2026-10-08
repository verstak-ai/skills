// The "tools" half — the server's tools through the bridge.
//
// The extension speaks MCP stdio to the bridge itself and registers EVERY server tool under
// its own name. No proxy tool: the skills say "call <tool>", and a delivery hiding the tools
// behind one proxy call would make every such phrase false — what tools/list gives stands in
// the session.
//
// The parameter schema goes from the bridge WITHOUT conversion: pi hands `parameters` to the
// provider as is, its validator has a branch for plain JSON Schema, and a string enum already
// comes as `{"type":"string","enum":[…]}` — what pi-ai's StringEnum builds.
import { existsSync } from "node:fs";
import { dirname } from "node:path";

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

import { envName, LOGGERS, PI, PLUGIN } from "../delivery/index.ts";
import { Bridge, resultToContent, snippet, toParameters } from "../shared/bridge-client.ts";
import { HARNESS_VERSION_ENV, PI_CLIENT, SKILLS_ROOT_ENV } from "../shared/clients.ts";
import { FIELDS_CAPABILITIES } from "../shared/fields.ts";
import { words } from "../shared/lang.ts";
import { enterCase, type LaunchCall, parseLaunch, withWord } from "../shared/launch.ts";
import { findBridge, type Notify, packagedBridgePath, refreshHomeBridge } from "./home-copy.ts";
import { setupUsage } from "./usage.ts";

export type ChannelEventSink = (params: any) => void;

/** How long to wait for the bridge to come up BEFORE letting the session start go. */
const READY_WAIT_MS = Number(process.env[envName("MCP_READY_WAIT_MS")] || 20000);
/** The handshake's own ceiling. Generous: the first run takes the human to the browser. */
const HANDSHAKE_MS = Number(process.env[envName("MCP_HANDSHAKE_MS")] || 600000);
/** The "still waiting" tick of a long call. */
const TICK_MS = 15000;
/** The handshake retry tick while the bridge waits for the human's sign-in. */
const AUTH_POLL_MS = Number(process.env[envName("MCP_AUTH_POLL_MS")] || 3000);
/** The bridge's "sign-in needed" refusal: the bridge holds the published sign-in — do not put it down (#4795). */
const AUTH_PENDING = /authorization required/i;

const PROTOCOL = "2025-06-18";

/* eslint-disable @typescript-eslint/no-explicit-any -- bridge answers come without a schema */

/** A tool answer's text; a refusal (isError) is a throw with its words. */
function textOrThrow(name: string, result: any): string {
  const text = resultToContent(result)
    .map((c) => (c.type === "text" ? c.text : "[image]"))
    .join("\n");
  if (result?.isError) throw new Error(text || words(PLUGIN).refusalNoText(name));
  return text;
}

/**
 * What the bridge learns of the host only by environment (#6226): pi's version from the loader
 * (none given — none declared), and the set's root — the package the extension came with;
 * no package beside it — no root named.
 */
async function hostEnv(): Promise<Record<string, string>> {
  const env: Record<string, string> = {};
  try {
    const bridge = packagedBridgePath();
    if (existsSync(bridge)) env[SKILLS_ROOT_ENV] = dirname(dirname(dirname(bridge)));
  } catch {
    /* the loader gave no own path — no root named */
  }
  try {
    const { VERSION } = await import("@earendil-works/pi-coding-agent");
    if (typeof VERSION === "string" && VERSION.trim()) env[HARNESS_VERSION_ENV] = VERSION.trim();
  } catch {
    /* pi did not give its package — no version declared */
  }
  return env;
}

/** A tool call by the bridge — for the launch line: a service move, not the agent's work (#6510). */
const callVia =
  (b: Bridge): LaunchCall =>
  async (name, args) =>
    textOrThrow(name, await b.request("tools/call", { name, arguments: args }, { service: true }));

/**
 * The "tools" half: its own handlers, its own state, its own failure. `onChannel` — the channel
 * half's door: the child bridge's standing notifications go there.
 */
export function setupBridge(pi: ExtensionAPI, onChannel: ChannelEventSink): void {
  const W = words(PI);
  const P = words(PLUGIN);
  let bridge: Bridge | null = null;
  // Tools dropped from the active set by list_changed — for the whole extension: pi does not
  // re-enable a known name, so a tool back with a new bridge is enabled here.
  const offByUs = new Set<string>();
  const known = new Set<string>(); // every name the extension registered in this pi
  let notify: Notify = () => {};
  // The session's voice: without UI there is nobody to tell, and that is a reason to refuse the bridge swap (refreshHomeBridge).
  let canSpeak = false;

  /** The seat the bridge holds — from its "held" word; the launch line names it. */
  let heldName: string | null = null;
  /** The bridge came up as a satellite (`--satellite`) — for a launch line with the launcher's seat. */
  let satellite = false;

  async function raise(args: string[] = []): Promise<void> {
    // Before the search: a delivery bridge newer than the home one is updated, aloud — before raising.
    refreshHomeBridge(notify, canSpeak);
    const found = findBridge();
    if (!found.path) {
      notify(P.noBridge(found.tried.join(", ")), "error");
      return;
    }

    const env = await hostEnv();
    const b = new Bridge(
      found.path,
      (line) => notify(P.bridgeLine(line), "info"),
      (method, params) => {
        // Standing frames come as the standard notification with the channel logger.
        if (method === "notifications/message" && params?.logger === LOGGERS.channel) {
          const name = params?.data?.kind === "held" ? params?.data?.place?.name : null;
          if (typeof name === "string" && name) heldName = name;
          onChannel(params);
        }
        // The server changed its tools under the bridge's reopened session: reread and register (#5406).
        if (method === "notifications/tools/list_changed") void relist(b);
      },
      undefined,
      args,
    );
    bridge = b;
    satellite = args.includes("--satellite");
    b.start(env);

    // "Sign-in needed" is no failure: the bridge published the sign-in and listens on its port;
    // putting it down would send the human's click to a refused connection (#4795, #4712). The
    // extension tells the link and repeats the handshake until the grant lands — matched by the
    // refusal's word, not the code. Said once per sign-in and code (#6570).
    let toldLogin = false;
    let toldLinks = "";
    const deadline = Date.now() + HANDSHAKE_MS;
    const untilAuthed = async <T>(ask: () => Promise<T>): Promise<T> => {
      for (;;) {
        try {
          return await ask();
        } catch (e) {
          const message = e instanceof Error ? e.message : String(e);
          if (!AUTH_PENDING.test(message) || bridge !== b || Date.now() + AUTH_POLL_MS > deadline)
            throw e;
          const links = [/open in a browser: (\S+)/, /from another device: (\S+)/]
            .map((re) => re.exec(message)?.[1] ?? "")
            .join(" ");
          if (!toldLogin || links !== toldLinks) {
            toldLogin = true;
            toldLinks = links;
            notify(W.needLogin(message), "warning");
          }
          await new Promise((r) => setTimeout(r, AUTH_POLL_MS));
        }
      }
    };
    const init = await untilAuthed(() =>
      b.request(
        "initialize",
        {
          protocolVersion: PROTOCOL,
          capabilities: FIELDS_CAPABILITIES, // answer fields — for this client too (#6637)
          clientInfo: { name: PI_CLIENT, version: "1" },
        },
        { timeoutMs: HANDSHAKE_MS },
      ),
    );
    if (bridge !== b) return b.stop(); // the session changed while we waited
    b.notify("notifications/initialized");

    // tools/list is paged: the server may give a cursor.
    const tools: any[] = [];
    let cursor: string | undefined;
    do {
      const page = await untilAuthed(() =>
        b.request("tools/list", cursor ? { cursor } : {}, {
          timeoutMs: HANDSHAKE_MS,
        }),
      );
      for (const t of page?.tools ?? []) tools.push(t);
      cursor = page?.nextCursor;
    } while (cursor);
    if (bridge !== b) return b.stop();

    // Registering the list: first at start, again on the bridge's list_changed (#5406); pi keeps a
    // tool by name — a repeat replaces it; a tool the server dropped leaves the active set.
    function registerAll(list: any[]): void {
      for (const t of list) known.add(String(t.name));
      for (const tool of list) {
        const name = String(tool.name);
        pi.registerTool({
          name,
          label: name,
          description: String(tool.description ?? ""),
          promptSnippet: snippet(String(tool.description ?? "")),
          parameters: toParameters(tool.inputSchema) as any,
          async execute(_toolCallId, params, signal, onUpdate, _c) {
            const live = bridge;
            if (!live) throw new Error(W.notUp(name));
            const started = Date.now();
            onUpdate?.({ content: [{ type: "text", text: W.calling(name) }], details: {} });
            const tick = setInterval(() => {
              onUpdate?.({
                content: [
                  {
                    type: "text",
                    text: W.stillWaiting(name, Math.round((Date.now() - started) / 1000)),
                  },
                ],
                details: {},
              });
            }, TICK_MS);
            tick.unref?.();
            try {
              const result = await live.request(
                "tools/call",
                { name, arguments: params ?? {} },
                { signal }, // no ceiling: the first call may go to the human's browser
              );
              // A tool's refusal is a throw — only it sets isError.
              if (result?.isError) textOrThrow(name, result);
              const content = resultToContent(result);
              return {
                content,
                details: { tool: name, structuredContent: result?.structuredContent },
              };
            } finally {
              clearInterval(tick);
            }
          },
        });
      }
    }

    async function relist(from: Bridge): Promise<void> {
      if (bridge !== from) return;
      try {
        const fresh: any[] = [];
        let next: string | undefined;
        do {
          const page = await from.request("tools/list", next ? { cursor: next } : {}, {
            timeoutMs: HANDSHAKE_MS,
          });
          for (const t of page?.tools ?? []) fresh.push(t);
          next = page?.nextCursor;
        } while (next);
        if (bridge !== from) return;
        const kept = new Set(fresh.map((t) => String(t.name)));
        const dropped = tools.map((t) => String(t.name)).filter((n) => !kept.has(n));
        registerAll(fresh);
        // pi does not re-activate a name it knows: a returning tool is enabled explicitly, a dropped one removed.
        const back = [...offByUs].filter((n) => kept.has(n));
        for (const n of dropped) offByUs.add(n);
        for (const n of back) offByUs.delete(n);
        if (dropped.length || back.length)
          pi.setActiveTools([
            ...new Set([...pi.getActiveTools().filter((n) => !dropped.includes(n)), ...back]),
          ]);
        tools.splice(0, tools.length, ...fresh);
        notify(W.serverChanged(fresh.length), "info");
      } catch (e) {
        if (bridge !== from) return; // the bridge already changed — its refusal is no word for the new session
        notify(P.relistFailed((e as Error).message), "warning");
      }
    }

    // A new bridge — a new list: known but missing names leave the active set, returning ones are enabled.
    const listed = new Set(tools.map((t) => String(t.name)));
    const gone = [...known].filter((n) => !listed.has(n));
    const returned = [...offByUs].filter((n) => listed.has(n));
    registerAll(tools);
    for (const n of gone) offByUs.add(n);
    for (const n of returned) offByUs.delete(n);
    if (gone.length || returned.length)
      pi.setActiveTools([
        ...new Set([...pi.getActiveTools().filter((n) => !gone.includes(n)), ...returned]),
      ]);

    const server = init?.serverInfo;
    const raised = toldLogin ? W.raisedSignedIn : W.raised;
    notify(raised(server?.name ?? W.server(), server?.version ?? "", tools.length), "info");
  }

  /** Raising the session's bridge — the launch line waits for it before calling tools. */
  let raising: Promise<void> = Promise.resolve();
  const raiseLoud = (args: string[] = []): Promise<void> =>
    raise(args).catch((e: Error) => {
      notify(P.notRaised(e.message), "error");
      bridge?.stop();
      bridge = null;
    });
  /** The session's first prompt has passed — the launch line runs only in it. */
  let prompted = false;

  // The launch line with a case (shared/launch.ts): the first prompt stands and enters the case
  // before the model's turn. The launcher's seat — the "from <seat>" tail, else the SATELLITE_OF
  // variable: the bridge comes up again as a satellite and stands beside it; no seat — its own.
  pi.on("input", async (event) => {
    if (prompted) return { action: "continue" };
    prompted = true;
    const l = parseLaunch(event.text);
    if (!l) return { action: "continue" };
    const of = l.of ?? (process.env[envName("SATELLITE_OF")]?.trim() || null);
    if (of && !satellite) {
      bridge?.stop();
      bridge = null;
      raising = raiseLoud(["--satellite"]);
    }
    await raising;
    const live = bridge;
    const word = live
      ? await enterCase(l, callVia(live), of, () => heldName)
      : W.launchNoBridge(String(l.no));
    return { action: "transform", text: withWord(event.text, word) };
  });

  pi.on("session_start", async (_event, ctx) => {
    notify = ctx.hasUI ? (t, l) => ctx.ui.notify(t, l ?? "info") : () => {};
    canSpeak = Boolean(ctx.hasUI);
    bridge?.stop();
    bridge = null;
    prompted = false;
    heldName = null;

    const work = raiseLoud();
    raising = work;

    // A bounded wait: the fast path fits in seconds; a long OAuth does not hold the session hostage.
    let done = false;
    void work.then(() => {
      done = true;
    });
    await Promise.race([
      work,
      new Promise<void>((r) => {
        const t = setTimeout(() => {
          if (!done) notify(W.stillRaising(), "info");
          r();
        }, READY_WAIT_MS);
        t.unref?.();
      }),
    ]);
  });

  // Session usage — to the bridge while it holds a seat (usage.ts, #6271).
  setupUsage(pi, () => (heldName ? bridge : null));

  pi.on("session_shutdown", async () => {
    // Idempotent: pi calls this on paths where nothing came up too.
    bridge?.stop();
    bridge = null;
  });
}

/* eslint-enable @typescript-eslint/no-explicit-any */
