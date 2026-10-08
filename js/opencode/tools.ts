// The "tools" half — the server's tools through the bridge, each under its own name,
// and A BRIDGE PER SESSION (graph @nks/nks-dev, node #4283).
//
// The plugin speaks MCP stdio to the bridge itself and registers EVERY server tool via
// ctx.tool.transform under its own name: OpenCode's native `mcp` entry names a foreign
// tool <entry>.<tool> (observed on 2.0.9), and every skill phrase calling a tool by name
// would turn false.
//
// Each root session has its own bridge process: its connect holds its socket, its register
// binds its MCP session, its frames come to it. A child session (subagent) reads through
// its parent's bridge and gets its own bridge once it stands by its own call (#5154).
//
// The tool list is the transform's state: setup does not wait for the sign-in (the cached
// list at once, the status tool always); the server's list arrives in the background and
// replaces it through ctx.tool.reload().
import { LOGGERS, OPENCODE, PLUGIN } from "../delivery/index.ts";
import { Bridge, toParameters } from "../shared/bridge-client.ts";
import { words } from "../shared/lang.ts";
import { createAdopt } from "./adopt.ts";
import {
  authDir,
  buildsLine,
  findBridge,
  handshake,
  listTools,
  readCache,
  refreshToolList,
  retryPause,
  sleep,
  textOf,
  writeCache,
} from "./bridge-io.ts";
import { createChildren } from "./children.ts";
import { idleHalf, type ToolsHalf } from "./half.ts";
import { createHandoff } from "./handoff.ts";
import { hostEnvOf } from "./host.ts";
import { createKeeper } from "./keep.ts";
import { holdersOf } from "./keepalive.ts";
import { createLauncher } from "./launch.ts";
import { leadDoors } from "./leaddoors.ts";
import { createLeads } from "./leads.ts";
import { createLogin } from "./login.ts";
import { takeLostMarker, writeLostMarker } from "./marker.ts";
import { createMoves } from "./moves.ts";
import type { Context } from "./plugin.ts";
import { childWriteRefusal, createRunEnds, declaresAction } from "./runends.ts";
import { asSatellite, heldPlace, STAND_TOOL, standsBy } from "./satellite.ts";
import { IDLE_MS, REAP_MS, type Slot } from "./slot.ts";
import { statusLines, statusTool } from "./status.ts";

export type Say = (text: string, level: "info" | "warning" | "error") => void;

/* eslint-disable @typescript-eslint/no-explicit-any -- bridge answers come without a schema */

export type { Slot } from "./slot.ts";

const hhmm = (): string => new Date().toTimeString().slice(0, 5);

export async function setupTools(
  ctx: Context,
  say: Say,
  onChannel: (session: string | null, params: any, child?: boolean) => void,
  rootOf: (sessionID: string) => Promise<string>,
  flushUsage: (session: string) => Promise<void> = async () => {},
): Promise<ToolsHalf> {
  const W = words(OPENCODE);
  const P = words(PLUGIN);
  const found = findBridge();
  if (!found.path) {
    say(P.noBridge(found.tried.join(", ")), "error");
    return idleHalf();
  }
  const path = found.path;
  const builds = buildsLine(path, import.meta.url);
  const hostEnv = await hostEnvOf(ctx); // OpenCode's version and the set's root — once per plugin

  const slots = new Map<string, Slot>();
  const unasked = new WeakSet<Slot>(); // a root's slot that has not asked for its seat from disk yet
  let spare: Slot | null = null;
  let stopped = false;

  // The human in the browser — one sign-in for all the plugin's bridges (login.ts).
  const login = createLogin(say);

  function spawn(args: string[] = []): Slot {
    const slot: Slot = {
      bridge: null as unknown as Bridge,
      ready: Promise.resolve(),
      session: null,
      holding: false,
      stood: false,
      dir: null,
      key: null,
      resume: null,
      lastCall: Date.now(),
      busy: 0,
      ownStop: false,
    };
    slot.bridge = new Bridge(
      path,
      (line) => say(P.bridgeLine(line), "info"),
      (method, params) => {
        if (method === "notifications/tools/list_changed") return void relist(slot.bridge); // #5406
        if (method !== "notifications/message" || params?.logger !== LOGGERS.channel) return;
        const kind = params?.data?.kind;
        // holding follows an observed event — the bridge's "held" word and hello (#5140).
        if (kind === "held" || kind === "attached" || params?.data?.frame?.type === "hello")
          keeper.stood(slot);
        if ((kind === "held" || kind === "released") && typeof params?.data?.key === "string")
          slot.key = params.data.key; // the seat's key — the exact address of the record to return
        if (kind === "held") slot.place = heldPlace(params?.data) ?? slot.place; // #6002
        if (kind === "released" || kind === "dead" || kind === "evicted") slot.holding = false;
        // Only a satellite child is a lead (#6550 item 4); a child on a plain bridge is one run (children.ts).
        const over =
          !!slot.child &&
          !!slot.satelliteOf &&
          !!slot.session &&
          leads.heard(slot.session, kind, slot.place);
        if (!over) relay(slot.session, params, !!slot.child); // an ended lead gets no channel words
      },
      (e) => {
        // A holding bridge exited against our will — a word into the session, not a log line (#5140).
        if (slot.ownStop || stopped || !slot.holding) return;
        slot.holding = false;
        const text = W.hearingLost(hhmm(), e.message);
        const lost = { logger: LOGGERS.channel, data: { kind: "lost", text } };
        onChannel(slot.session, lost, !!slot.child); // a child's hearing — a word only to it (#6625)
      },
      args,
    );
    slot.bridge.start(hostEnv);
    shake(slot);
    return slot;
  }

  // The instance's location: a moved session calls its tools through its new folder's instance (moves.ts).
  const mv = createMoves(ctx);
  const { home, directoryOf, exists, ours } = mv;
  const relay = mv.relay(onChannel, say);
  const runEnds = createRunEnds(); // ended children: a write through a seat is a refusal aloud (#6361)
  // Lead subagents (#6625): the end is an explicit act, the outcome a synthetic message to the parent.
  const endChild = (c: string, out: ((s: string) => void) | null = forget) =>
    runEnds.end(c, slots.get(c)?.satelliteOf, out, leads.released(c), leads.goneWhy(c));
  const leads = createLeads(leadDoors(ctx, say, flushUsage, endChild, slots));
  const keeper = createKeeper({
    say,
    tell: (root, text, child) =>
      onChannel(root, { logger: LOGGERS.channel, data: { kind: "resumed", text } }, !!child),
    lost: (root, text) =>
      onChannel(root, { logger: LOGGERS.channel, data: { kind: "lost", text } }),
    slotFor: (root, touch) => slotFor(root, touch),
    ready: readyFor,
    directoryOf,
    exists: ours,
  });
  // A child of a previous instance has no slot here: nothing to put down (forget is called before setup ends).
  const nothing = () => {};
  const endRun = (s: string, live = true) =>
    live
      ? void flushUsage(s).finally(() => runEnds.end(s, null, forget))
      : runEnds.end(s, null, nothing);
  const children = createChildren({ slots, spawn, keeper, leads, exists, endRun });
  const handoff = createHandoff({ slots, leads, forget }); // a satellite child moved alone (#6695)
  const adopt = createAdopt({
    keeper,
    authDir,
    home,
    back: (e) => children.back(e),
    endKid: (s, of, why) => runEnds.end(s, of, nothing, false, why),
  });
  // A previous instance stopped with a holding bridge (or a session moved here): keys to the
  // watchdog, seats back at once, each holding session a word about its own seats (#6626).
  const lost = takeLostMarker(authDir(), home);
  if (lost?.text) say(lost.text, "warning");
  if (lost) adopt.take(lost.entries);
  // A stopped instance takes no markers: a deferred move adoption would take the next instance's marker.
  const adoptNow = () => void (stopped || adopt.now());

  function shake(slot: Slot): void {
    slot.ready = handshake(slot.bridge, login.on, login.done);
    slot.ready.catch(() => {});
  }

  /** The slot's handshake; a failed one is repeated at once, once. */
  async function readyFor(slot: Slot): Promise<void> {
    try {
      await slot.ready;
    } catch {
      shake(slot);
      await slot.ready;
    }
  }

  /**
   * A root session's bridge: the load's spare first, then its own; a dead one is replaced.
   * touch=false — the watchdog's look, not a call: the idle time is not refreshed.
   */
  async function slotFor(sessionID: string, touch = true): Promise<Slot> {
    const root = await rootOf(sessionID);
    mv.guard(root, sessionID); // the root moved away — a child does not raise its bridge here
    // A child that stood as its own satellite goes by its own bridge (#5154); the root's is read-only to it (#6550 item 2).
    if (root !== sessionID && !slots.has(sessionID)) {
      adopt.now(); // a previous instance's marker laid after our load (adopt.ts)
      await children.settled(sessionID);
    }
    const own = root !== sessionID ? slots.get(sessionID) : undefined;
    if (own) {
      // A dead child bridge is replaced by its own, not by the root's.
      const live = own.bridge.failure ? children.childSlot(sessionID) : own;
      if (touch) live.lastCall = Date.now();
      return live;
    }
    // A child moved to another directory (#6695): decided on every call, not by slot.
    const far = root !== sessionID && !slots.get(root)?.place ? await mv.farRoot(root) : null;
    if (far && far !== "foreign") return far;
    let slot = slots.get(root);
    let dead: Slot | undefined;
    if (slot?.bridge.failure) {
      dead = slot;
      slots.delete(root);
      slot = undefined;
    }
    if (!slot) {
      slot = spare && !spare.bridge.failure ? spare : spawn();
      spare = null;
      slot.session = root;
      // The dead bridge's directory and seat key pass to its replacement: the return goes by key.
      slot.dir = dead?.dir ?? slot.dir;
      slot.key = dead?.key ?? slot.key;
      slots.set(root, slot);
      unasked.add(slot);
    }
    // A previous instance's seat returns from disk by the session's directory before the first call; never for a foreign root.
    const s = slot;
    if (far !== "foreign" && unasked.delete(s))
      s.resume = keeper.resume(s, root).finally(() => (s.resume = null));
    if (touch) slot.lastCall = Date.now();
    return slot;
  }

  // A silent session's bridge without a standing does not live forever: `opencode run` breeds sessions.
  const reaper = setInterval(() => {
    const now = Date.now();
    for (const [session, slot] of slots) {
      if (slot.holding || slot.busy > 0 || now - slot.lastCall < IDLE_MS) continue;
      slot.ownStop = true;
      slot.bridge.stop();
      slots.delete(session);
    }
    if (spare && !spare.holding && now - spare.lastCall >= IDLE_MS && state.serverSeen) {
      spare.ownStop = true;
      spare.bridge.stop();
      spare = null;
    }
  }, REAP_MS);
  reaper.unref?.();

  const state = {
    listed: readCache() ?? ([] as any[]),
    source: W.fromCache(),
    serverSeen: false,
  };

  const relist = (b: Bridge | null) =>
    b &&
    refreshToolList(
      b,
      state,
      () => ctx.tool.reload(),
      say,
      () => !stopped,
    );
  const statusText = (): string =>
    statusLines(
      path,
      builds,
      { loginPending: login.pending, loginUrl: login.url, loginDevice: login.device },
      state,
      slots.size,
      spare ? 1 : 0,
    );

  await ctx.tool.transform((editor) => {
    editor.add(statusTool(statusText));
    for (const t of state.listed) {
      const name = String(t.name);
      const asks = declaresAction(t.inputSchema); // "?" is help only for a tool with action
      editor.add({
        name,
        description: String(t.description ?? ""),
        input: toParameters(t.inputSchema),
        async execute(input, tool) {
          // The launcher's revoke of its lead's seat is ended by the plugin (#6625); so is a child ended by a move (adopt.ts).
          const word =
            (await leads.release(String(tool.sessionID), name, input ?? {})) ??
            adopt.revoked(name, input ?? {});
          if (word) return { content: word };
          await children.settled(String(tool.sessionID)); // a marker's child: its slot is still coming up
          runEnds.guard(String(tool.sessionID), name, input ?? {}, asks); // not through the root's bridge (#6361)
          const slot = await slotFor(String(tool.sessionID));
          // A child through the root's bridge only reads; it stands by its own satellite in callThrough (#6550 item 2).
          const no =
            slot.session !== tool.sessionID && !standsBy(name, input ?? {})
              ? childWriteRefusal(slot.place?.name ?? null, name, input ?? {}, asks)
              : null;
          if (no) throw new Error(no);
          // A call in flight keeps the bridge from the reaper; idle time counts from the call's end.
          slot.busy++;
          try {
            return await callThrough(slot, name, input, String(tool.sessionID));
          } finally {
            slot.busy--;
            slot.lastCall = Date.now();
          }
        },
      });
    }
  });

  /** The slot's handshake raced against the sign-in: the call does not wait for the human, the address is the answer. */
  const awaitReady = (slot: Slot): Promise<void> => login.race(() => readyFor(slot));

  /** One tool call through the slot's bridge. */
  async function callThrough(
    slot: Slot,
    name: string,
    input: any,
    sessionID: string,
    service = false, // the launch line is a service move, not the agent's work (#6510)
  ): Promise<{ content: string }> {
    await awaitReady(slot);
    if (slot.resume) await slot.resume; // the seat is returning from disk — do not take it twice
    // No ceiling: the v2 execute context carries no abort signal.
    const args: Record<string, unknown> = { ...(input ?? {}) };
    // One seat per bridge: a child standing by its own call gets its own bridge (#5154).
    if (standsBy(name, args) && slot.session !== sessionID) {
      // The parent's seat is unknown — a refusal (#6550 item 2).
      if (!slot.place)
        throw new Error(
          (await mv.farRefusal(slot.session)) ?? childWriteRefusal(null, name, args, false) ?? "",
        );
      slot = children.childSlot(sessionID, slot);
      await awaitReady(slot); // a fresh child bridge may ask for a sign-in too
    }
    const busy = name === STAND_TOOL && asSatellite(args, slot.satelliteOf, !!slot.place);
    // The bridge runs in OpenCode's cwd: the standing's repo comes from the session's directory (#5108).
    if (name === STAND_TOOL && !args.cwd) {
      const dir = (slot.dir ??= await directoryOf(slot.session ?? sessionID));
      if (dir) args.cwd = dir;
    }
    const result = await slot.bridge.request("tools/call", { name, arguments: args }, { service });
    // A tool's refusal is a throw — so OpenCode shows it as a refusal.
    if (result?.isError) throw new Error(textOf(result) || P.refusalNoText(name));
    // The tool's answer is an observed holding event; an answer to a busy line alone is not (#6509).
    if (standsBy(name, args) && !busy) keeper.stood(slot);
    if (standsBy(name, args)) runEnds.clear(sessionID); // stood again — writes go by its own bridge
    // A child stood by its own bridge is a lead; leaving by the outcome is its end (#6625).
    if (slot.child && slot.satelliteOf && slot.session === sessionID)
      leads.called(sessionID, name, args, slot.place);
    return { content: textOf(result) };
  }
  if (state.listed.length) say(W.cached(state.listed.length), "info");

  // The first bridge is for the tool list, in the background with no ceiling: a new handshake or bridge while the plugin lives.
  spare = spawn();
  let first = spare;
  let [misses, deaths] = [0, 0]; // deaths in a row: the replacement pause grows, no spawn storm
  void (async () => {
    for (;;) {
      if (stopped) return;
      try {
        await first.ready;
        const list = await listTools(first.bridge);
        state.serverSeen = true;
        const same = JSON.stringify(list) === JSON.stringify(state.listed);
        state.listed = list;
        state.source = W.fromServer();
        writeCache(list);
        if (!same) await ctx.tool.reload();
        say(W.raised(list.length), "info");
        return;
      } catch (e) {
        if (stopped) return;
        if (first.bridge.failure) {
          // The list's bridge died, or was handed to a session and released by it (then silently).
          if (first.session === null) say(W.died((e as Error).message), "warning");
          if (spare === first) spare = null;
          first = spare ?? spawn();
          spare = first;
          await sleep(retryPause(deaths++));
        } else {
          await sleep(retryPause(misses++)); // a pause before the retry
          shake(first);
        }
      }
    }
  })();

  if (lost) void keeper.resumeLost(lost.entries, lost.wordFor); // each one — about its own seats

  // The launch line with a case (launch.ts): the same call as execute, with its busy count.
  const launcher = createLauncher<Slot>({
    rootOf,
    childSlot(sessionID, root) {
      if (!slots.get(root)?.place)
        throw new Error(childWriteRefusal(null, STAND_TOOL, {}, false) ?? "");
      return children.childSlot(sessionID, slots.get(root)); // no root seat — a refusal (#6550 item 2)
    },
    async call(slot, name, args, sessionID) {
      slot.busy++;
      try {
        return (await callThrough(slot, name, args, sessionID, true)).content;
      } finally {
        slot.busy--;
        slot.lastCall = Date.now();
      }
    },
  });

  function forget(session: string): void {
    runEnds.clear(session); // a deleted session takes its run-end mark along
    launcher.forget(session);
    keeper.forget(session);
    const slot = slots.get(session);
    if (!slot) return;
    slots.delete(session);
    slot.ownStop = true;
    slot.bridge.stop(); // the bridge's shutdown releases the standing: key, socket, busy line
  }

  return {
    launch: launcher.launch,
    bridgeOf: (s) => [slots.get(s)].find((x) => x?.holding)?.bridge ?? null,
    forget(s) {
      forget(s);
      runEnds.clear(s, true); // no session — no final mark either
    },
    onEvent: (ev) => leads.onEvent(ev),
    leadOf: (s) => leads.nameOf(s),
    holders: () => holdersOf(slots.values()),
    owns: (s) => slots.has(s),
    held: (r) => [slots.get(r)].find((x) => x?.holding && x.place && !x.bridge.failure) ?? null,
    adopt: adoptNow,
    // A satellite child moved alone goes as its own satellite to the new folder (handoff.ts, #6695).
    moved: (s, to) =>
      handoff(s, to, home) ||
      mv.moved({ say, slots, rootOf, forget, slotFor, adopt: adoptNow, away: leads.away }, s, to),
    async stop() {
      stopped = true;
      clearInterval(reaper);
      keeper.stop();
      await children.pause(); // a reload is not a child's end (#6625): its seat and cases wait
      // A stop with holding bridges goes to disk: the next instance tells of the loss.
      const left = writeLostMarker(authDir(), slots.values(), home);
      if (spare) spare.ownStop = true;
      spare?.bridge.stop();
      spare = null;
      for (const slot of slots.values()) {
        slot.ownStop = true;
        slot.bridge.stop();
      }
      slots.clear();
      return left; // to the directory's twin — wake this spelling's instance (twins.ts)
    },
  };
}

/* eslint-enable @typescript-eslint/no-explicit-any */
