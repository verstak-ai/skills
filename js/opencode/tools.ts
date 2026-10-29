// The "tools" half — the server's tools through the bridge, each under its own name,
// and A BRIDGE PER SESSION (graph @nks/nks-dev, node #4283).
//
// The plugin speaks MCP stdio to the bridge itself and registers EVERY server tool via
// ctx.tool.transform under its own name: OpenCode's native `mcp` entry names a foreign
// tool <entry>.<tool> (observed on 2.0.9), and every skill phrase calling a tool by name
// would turn false.
//
// A root owns its bridge/socket/MCP session; a child borrows only reads until its stand (#5154).
//
// Tool transforms serve the cached list and status without waiting for sign-in.
// The server list replaces them in the background via ctx.tool.reload().
import { LOGGERS, OPENCODE, PLUGIN } from "../delivery/index.ts";
import { Bridge, toParameters } from "../shared/bridge-client.ts";
import { words } from "../shared/lang.ts";
import { createAdopt } from "./adopt.ts";
import {
  authDir,
  buildsLine,
  findBridge,
  readCache,
  refreshToolList,
  slotReady,
} from "./bridge-io.ts";
import { createChildren } from "./children.ts";
import { answerHalt } from "./cuts.ts";
import { listInBackground, waitListed } from "./firstlist.ts";
import { idleHalf, type ToolsHalf } from "./half.ts";
import { createHandoff } from "./handoff.ts";
import { hostEnvOf } from "./host.ts";
import { createKeeper } from "./keep.ts";
import { holdersOf } from "./keepalive.ts";
import { createLauncher } from "./launch.ts";
import { type Closed, leadDoors } from "./leaddoors.ts";
import { launcherSeat } from "./leadframes.ts";
import { createLeads } from "./leads.ts";
import { createLogin } from "./login.ts";
import { takeLostMarker } from "./marker.ts";
import { createModels } from "./models.ts";
import { createMoves } from "./moves.ts";
import type { Context } from "./plugin.ts";
import { revokeAsLauncher } from "./release.ts";
import type { HeldSeat } from "./rootseat-by.ts";
import { createSeatLife, explicitHeld } from "./rootseat-tools.ts";
import { childWriteRefusal, createRunEnds, declaresAction } from "./runends.ts";
import { asSatellite, STAND_TOOL, standsBy } from "./satellite.ts";
import { inSlot } from "./service.ts";
import { IDLE_MS, REAP_MS, type Slot } from "./slot.ts";
import { statusLines, statusTool } from "./status.ts";

export type Say = (text: string, level: "info" | "warning" | "error") => void;

/* eslint-disable @typescript-eslint/no-explicit-any -- bridge answers come without a schema */

export type { Slot } from "./slot.ts";

export async function setupTools(
  ctx: Context,
  say: Say,
  onChannel: (session: string | null, params: any, child?: boolean) => void,
  rootOf: (sessionID: string) => Promise<string>,
  flushUsage: (session: string) => Promise<void> = async () => {},
  closed: Closed = () => false,
  halted: (session: string | null, signal?: AbortSignal) => Promise<string | null> = async () =>
    null,
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
  const { shake, readyFor } = slotReady<Slot>(login);

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
        if (slot.ownStop) return; // cleanup's revoke is not a new owner stop or a word to a deleted session
        const kind = models.seen(slot, params?.data); // the graphs of its seats too (#7591)
        if (seats.observe(slot, kind, params?.data))
          params = { ...params, data: { ...params.data, automatic: true } };
        // Taken off by its owner (#7439): the hearing watchdog no longer raises this session's seat.
        if (kind === "stopped" && slot.session) keeper.forget(slot.session);
        // Only a satellite child is a lead (#6550 item 4); a child on a plain bridge is one run (children.ts).
        const lead = !!slot.child && !!slot.satelliteOf && !!slot.session;
        const session = slot.session as string;
        if (kind === "stopped") {
          // An ended lead gets no channel words — but a stop still interrupts its turn (channel.ts).
          relay(slot.session, params, !!slot.child);
          // A stop by an order: the bridge answers the order once the interrupt ended (cuts.ts),
          // and only then may a lead's end take its bridge down — the answer goes by that bridge.
          const answered = answerHalt(slot.bridge, params?.data, (signal) =>
            halted(slot.session, signal),
          );
          if (lead) void answered.then(() => leads.heard(session, kind, slot.place));
          return;
        }
        const over = lead && leads.heard(session, kind, slot.place);
        if (!over) relay(slot.session, params, !!slot.child);
      },
      (e) => {
        // A holding bridge exited against our will — a word into the session, not a log line (#5140).
        if (slot.ownStop || stopped || !slot.holding) return;
        slot.holding = false;
        const text = W.hearingLost(new Date().toTimeString().slice(0, 5), e.message);
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
  const models = createModels(ctx); // a satellite's seat names its session's model (#7591)
  const runEnds = createRunEnds(); // ended children: a write through a seat is a refusal aloud (#6361)
  // Lead subagents (#6625): the end is an explicit act, the outcome a synthetic message to the parent.
  const endChild = (c: string, out: ((s: string) => void) | null = forget) =>
    runEnds.end(c, slots.get(c)?.satelliteOf, out, leads.released(c), leads.goneWhy(c));
  const leads = createLeads(leadDoors(ctx, say, flushUsage, endChild, slots, closed));
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
  const seats = createSeatLife({
    stopped: () => stopped,
    slots,
    authDir,
    slotFor,
    awaitReady: (slot) => awaitReady(slot),
    callThrough,
    modelOf: (s) => models.of(s),
    failed: (word) => say(word, "error"),
    stood: (slot) => keeper.stood(slot),
    forgot: (s) => keeper.forget(s),
    held: (s, slot) => onChannel(s, explicitHeld(slot), !!slot.child),
  });
  // A previous instance stopped with a holding bridge (or a session moved here): keys to the
  // watchdog, seats back at once, each holding session a word about its own seats (#6626).
  const lost = takeLostMarker(authDir(), home);
  if (lost?.text) say(lost.text, "warning");
  if (lost) adopt.take(lost.entries);
  // A stopped instance takes no markers: a deferred move adoption would take the next instance's marker.
  const adoptNow = () => void (stopped || adopt.now());

  /**
   * A root session's bridge: the load's spare first, then its own; a dead one is replaced.
   * touch=false — the watchdog's look, not a call: the idle time is not refreshed.
   */
  async function slotFor(sessionID: string, touch = true): Promise<Slot> {
    seats.guard(sessionID);
    const root = await rootOf(sessionID);
    mv.guard(root, sessionID); // the root moved away — a child does not raise its bridge here
    // A child that stood as its own satellite goes by its own bridge (#5154); the root's is read-only to it (#6550 item 2).
    if (root !== sessionID && !slots.has(sessionID)) {
      adopt.now(); // a previous instance's marker laid after our load (adopt.ts)
      await children.settled(sessionID);
    }
    seats.guard(sessionID);
    const own = root !== sessionID ? slots.get(sessionID) : undefined;
    if (own) {
      // A dead child bridge is replaced by its own, not by the root's.
      const live = own.bridge.failure ? children.childSlot(sessionID) : own;
      if (touch) live.lastCall = Date.now();
      return live;
    }
    // A child moved to another directory (#6695): decided on every call, not by slot.
    const far = root !== sessionID && !slots.get(root)?.place ? await mv.farRoot(root) : null;
    seats.guard(sessionID);
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
    statusLines(path, builds, login, state, slots.size, spare ? 1 : 0);

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
          return seats.explicit(String(tool.sessionID), name, input ?? {}, async () => {
            // The launcher's revoke of its lead's seat ends the child, then goes to the platform
            // by the launcher's bridge (#6625, #7505); a child ended by a move is answered here (adopt.ts).
            const caller = String(tool.sessionID);
            const freed = await leads.release(caller, name, input ?? {});
            if (freed)
              return {
                content: await revokeAsLauncher(freed, input ?? {}, async (args) => {
                  const slot = await slotFor(caller);
                  slot.busy++;
                  try {
                    return await callThrough(slot, name, args, caller);
                  } finally {
                    slot.busy--;
                  }
                }),
              };
            const word = adopt.revoked(name, input ?? {});
            if (word) return { content: word };
            await children.settled(String(tool.sessionID)); // a marker's child: its slot is still coming up
            runEnds.guard(String(tool.sessionID), name, input ?? {}, asks); // not through the root's bridge (#6361)
            const slot = await slotFor(String(tool.sessionID));
            // A child through the root's bridge only reads; it stands by its own satellite in callThrough (#6550 item 2).
            if (slot.session !== caller && !standsBy(name, input ?? {})) {
              const no = childWriteRefusal(slot.place?.name ?? null, name, input ?? {}, asks);
              if (no) throw new Error(no);
            }
            // A call in flight keeps the bridge from the reaper; idle time counts from the call's end.
            slot.busy++;
            try {
              return await callThrough(slot, name, input, String(tool.sessionID));
            } finally {
              slot.busy--;
              slot.lastCall = Date.now();
            }
          });
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
  ): Promise<{ content: string; place?: HeldSeat; provisional?: boolean; key?: string }> {
    await awaitReady(slot);
    if (slot.resume) await slot.resume; // the seat is returning from disk — do not take it twice
    seats.guard(sessionID, service);
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
      seats.guard(sessionID, service);
    }
    const busy = name === STAND_TOOL && asSatellite(args, slot.satelliteOf, !!slot.place);
    if (name === STAND_TOOL) await models.name(args, sessionID, slot);
    // The bridge runs in OpenCode's cwd: the standing's repo comes from the session's directory (#5108).
    if (name === STAND_TOOL && !args.cwd) {
      const dir = (slot.dir ??= await directoryOf(slot.session ?? sessionID));
      if (dir) args.cwd = dir;
    }
    seats.guard(sessionID, service);
    const epoch = seats.epoch(sessionID);
    // The dispatched call is live-turn evidence even when its execution.started never reached
    // this instance (#1237): the leave said in it waits for the turn's end. A service move
    // (the launch line) is not the agent's work (#6510) — no mark.
    if (!service && slot.child && slot.satelliteOf && slot.session === sessionID)
      leads.dispatched(sessionID, name, args);
    const result = await slot.bridge.request("tools/call", { name, arguments: args }, { service });
    const out = seats.answer(
      slot,
      name,
      result,
      service,
      standsBy(name, args) && !busy,
      sessionID,
      epoch,
    );
    if (standsBy(name, args)) runEnds.clear(sessionID); // stood again — writes go by its own bridge
    // A child stood by its own bridge is a lead; leaving by the outcome is its end (#6625).
    if (slot.child && slot.satelliteOf && slot.session === sessionID)
      leads.called(sessionID, name, args, slot.place);
    return out;
  }
  const cold = !state.listed.length;
  if (!cold) say(W.cached(state.listed.length), "info");

  let missed = false;
  const firstListed = listInBackground({
    spawn,
    shake,
    spare: { get: () => spare, set: (s) => (spare = s) },
    stopped: () => stopped,
    state,
    reload: () => ctx.tool.reload(),
    say,
    missed: () => (missed = true),
  });

  if (lost) void keeper.resumeLost(lost.entries, lost.wordFor); // each one — about its own seats

  // The launch line with a case (launch.ts): the same call as execute, with its busy count.
  const launcher = createLauncher<Slot>({
    rootOf,
    childSlot(sessionID, root) {
      if (!slots.get(root)?.place)
        throw new Error(childWriteRefusal(null, STAND_TOOL, {}, false) ?? "");
      return children.childSlot(sessionID, slots.get(root)); // no root seat — a refusal (#6550 item 2)
    },
    call: (slot, name, args, sessionID) =>
      inSlot(slot, async () => (await callThrough(slot, name, args, sessionID, true)).content),
  });

  function forget(session: string): void {
    runEnds.clear(session); // a deleted session takes its run-end mark along
    launcher.forget(session);
    keeper.forget(session);
    seats.forget(session);
  }

  // No cached list: the first prompt would get no graph tools without the server's (firstlist.ts).
  if (cold) await waitListed(firstListed, () => login.pending || missed);

  return {
    launch: launcher.launch,
    ...seats.half,
    bridgeOf: (s) => [slots.get(s)].find((x) => x?.holding)?.bridge ?? null,
    forget(s) {
      seats.cancel(s);
      forget(s);
      runEnds.clear(s, true); // no session — no final mark either
    },
    onEvent: (ev) => [models, leads].forEach((x) => x.onEvent(ev)),
    leadOf: (s) => leads.nameOf(s),
    ended: (s) => leads.ended(s),
    launcherOf: (s) => launcherSeat(leads.upOf(s), slots, slots.get(s)?.satelliteOf?.name),
    holders: () => holdersOf(slots.values()),
    owns: (s) => slots.has(s),
    held: (r) => [slots.get(r)].find((x) => x?.holding && x.place && !x.bridge.failure) ?? null,
    adopt: adoptNow,
    // A satellite child moved alone goes as its own satellite to the new folder (handoff.ts, #6695).
    moved: (s, to) =>
      handoff(s, to, home) ||
      mv.moved({ say, slots, rootOf, forget, slotFor, adopt: adoptNow, away: leads.away }, s, to),
    children: () =>
      [...slots.values()].flatMap((x) => (x.child && x.holding && x.session ? [x.session] : [])),
    halt(child) {
      const slot = slots.get(child);
      if (!slot?.child || !slot.holding) return;
      slot.holding = false;
      keeper.forget(child);
      // A lead ends as by the launcher's revoke — its bridge takes the seat off; any other child's bridge goes down with it.
      if (!(slot.satelliteOf && leads.heard(child, "stopped", slot.place))) forget(child);
    },
    async stop() {
      stopped = true;
      clearInterval(reaper);
      keeper.stop();
      await children.pause(); // a reload is not a child's end (#6625): its seat and cases wait
      const left = seats.stopSlots(home, spare);
      spare = null;
      return left; // to the directory's twin — wake this spelling's instance (twins.ts)
    },
  };
}

/* eslint-enable @typescript-eslint/no-explicit-any */
