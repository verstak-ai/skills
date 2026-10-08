// Child session bridges of the "tools" half (tools.ts): a bridge of its own per child standing
// (#5154, a satellite of the root's seat — #6002) and a lead subagent's return after a plugin
// reload (#6625; #6550, rule 3). A stopping plugin pauses the children's holding bridges (the
// suspend method, bridge/suspend.ts): seat, cases and busy line wait; the key, the root's seat,
// the errand case and the told turn go into the loss marker (keep.ts). The new instance raises
// the child's bridge as the same satellite and returns the seat by key, silently to the child;
// the parent is the session's parentID (leads.ts). Not returned — an end with a word to the parent.
import { envName, method } from "../delivery/index.ts";
import { sleep } from "./bridge-io.ts";
import type { Keeper } from "./keep.ts";
import type { Leads } from "./leaddoors.ts";
import { W } from "./leadwords.ts";
import type { LostEntry } from "./records.ts";
import type { Slot } from "./tools.ts";
import { handedOver } from "./twins.ts";

/** A child's seat return waits for the previous bridge's socket to go (its bye) up to BACK_MS; tries are for other failures. */
const BACK_MS = Number(process.env[envName("CHILD_BACK_MS")]) || 15_000;
const BACK_TRIES = 4;
const BACK_PAUSE_MS = Number(process.env[envName("CHILD_BACK_PAUSE_MS")]) || 1_000;
/** A child bridge's pause before the plugin stops — no longer than this. */
export const PAUSE_MS = 1_500;

export interface ChildDoors {
  slots: Map<string, Slot>;
  spawn(args: string[]): Slot;
  keeper: Keeper<Slot>;
  leads: Leads;
  exists(session: string): Promise<boolean>;
  /** A child's run is over: usage to the bridge, the bridge goes down (live), a write by the root's bridge is a refusal (#6361). */
  endRun(session: string, live?: boolean): void;
}

export function createChildren(d: ChildDoors) {
  const coming = new Map<string, Promise<unknown>>(); // marker children whose slot is still coming up
  /**
   * A child session's bridge for its own standing — one per session: a live one is returned,
   * a dead one replaced with its seat memory; get→set is synchronous, so two standing calls of
   * one batch take one bridge. back — a previous instance's marker record: memory from it, a silent return.
   */
  function childSlot(sessionID: string, parent?: Slot | null, back?: LostEntry): Slot {
    const have = d.slots.get(sessionID);
    if (have && !have.bridge.failure) return have;
    const was =
      have ?? (back && { satelliteOf: back.of, dir: back.dir, key: back.key, stood: true });
    // The root holds a seat — the child's bridge is its satellite (satellite.ts).
    const of = was?.satelliteOf ?? parent?.place ?? null;
    const own = d.spawn(of ? ["--satellite"] : []);
    own.satelliteOf = of;
    own.session = sessionID;
    own.child = true;
    own.dir = was?.dir ?? null;
    own.key = was?.key ?? null;
    d.slots.set(sessionID, own);
    // A dead child bridge's replacement returns its seat at once by key: the child's writes in that window would go authorless.
    if (was?.stood && own.key)
      own.resume = d.keeper
        .resume(own, sessionID, !!back, back ? BACK_MS : undefined)
        .finally(() => (own.resume = null));
    return own;
  }

  /** A previous instance's child: the same satellite, the seat by key; not returned — the end. */
  async function back(e: LostEntry): Promise<void> {
    // Not a satellite — not a lead (#6550 item 4): its run ended with the previous instance.
    if (!e.of) return d.endRun(e.session, false);
    d.leads.back(e.session, e);
    // A child's call that came before its slot waits for it (coming), not for the root's bridge.
    const ready = (async () => {
      // The session is unreadable — the child has ended: its write would go by the root's bridge (#6361).
      if (!(await d.exists(e.session)))
        return void (await d.leads.fail(e.session, W().reloadUnreadable()));
      if (!e.key) return void (await d.leads.fail(e.session, W().reloadNoKey()));
      return childSlot(e.session, null, e);
    })();
    coming.set(e.session, ready);
    const own = await ready.finally(() => coming.delete(e.session));
    if (!own) return;
    for (let i = 0; i < BACK_TRIES && !own.holding; i++) {
      if (i) {
        await sleep(BACK_PAUSE_MS);
        own.resume = d.keeper
          .resume(own, e.session, true, BACK_MS)
          .finally(() => (own.resume = null));
      }
      if ((await own.resume) === "elsewhere") break; // the previous bridge's socket did not go within the term
    }
    if (!own.holding) await d.leads.fail(e.session, W().reloadNotBack());
  }

  /** The plugin stops: the children's holding bridges pause, their seat and cases wait for the new instance. */
  async function pause(): Promise<void> {
    const held = [...d.slots.values()].filter(
      (s) => s.child && s.satelliteOf && s.holding && s.session,
    );
    for (const s of held) {
      const was = d.leads.snapshot(s.session as string);
      [s.room, s.noted, s.last] = [was.room, was.noted, was.last];
    }
    await Promise.all(
      held.map((s) =>
        s.bridge
          .request(method("suspend"), {}, { timeoutMs: PAUSE_MS, service: true })
          .catch(() => {}),
      ),
    );
  }

  /** A marker child's slot is coming up — wait for it (errors are not here). */
  const settled = async (session: string): Promise<unknown> => {
    await handedOver(session); // the child's satellite is still on its way from the previous folder (handoff.ts)
    return coming.get(session)?.catch(() => {});
  };

  return { childSlot, back, pause, settled };
}
