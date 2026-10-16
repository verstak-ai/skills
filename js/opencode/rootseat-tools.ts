// Lifetime of service root seats: cancellation keeps only an in-flight bridge until revoke.
import { readFileSync } from "node:fs";

import { LOGGERS, PLUGIN, ROOT_SEAT, tool } from "../delivery/index.ts";
import { words } from "../shared/lang.ts";
import { holdFilePathOf } from "../shared/standings.ts";
import { textOf } from "./bridge-io.ts";
import { writeLostMarker } from "./marker.ts";
import type { Home } from "./records.ts";
import { seatBy, type SeatDoors } from "./rootseat-by.ts";
import { asSatellite, heldPlace, type Place, standsBy } from "./satellite.ts";
import type { Slot } from "./slot.ts";

interface Doors extends Pick<SeatDoors, "slotFor" | "awaitReady" | "callThrough" | "modelOf"> {
  stopped(): boolean;
  slots: Map<string, Slot>;
  authDir(): string;
  forgot(session: string): void;
  stood(slot: Slot): void;
  failed(word: string): void;
  held(session: string, slot: Slot): void;
}

export const explicitHeld = (slot: Slot) => ({
  logger: LOGGERS.channel,
  data: { kind: "held", key: slot.key, automatic: false },
});

export function createSeatLife(d: Doors) {
  const deleted = new Set<string>();
  const attempts = new Map<
    string,
    {
      cancelled: () => boolean;
      slot?: Slot;
      cancelledHere: boolean;
      failure?: string;
      onWire?: boolean;
      fresh?: boolean;
      owned?: { key: string; place: Place };
      explicit?: Promise<void>;
      closing?: Promise<void>;
      adopted?: boolean;
    }
  >();
  const epochs = new Map<string, number>();
  const cancelled = (s: string) =>
    d.stopped() ||
    deleted.has(s) ||
    attempts.get(s)?.cancelledHere === true ||
    attempts.get(s)?.cancelled() === true;
  const recorded = (slot: Slot, session: string) => {
    if (!slot.key) return null;
    try {
      const rec = JSON.parse(readFileSync(holdFilePathOf(d.authDir(), slot.key), "utf8"));
      return rec.session === session &&
        rec.key === slot.key &&
        typeof rec.realm === "string" &&
        typeof rec.name === "string"
        ? { name: rec.name, karta: String(rec.karta), realm: rec.realm }
        : null;
    } catch {
      return null;
    }
  };
  const cancel = (s: string) => {
    deleted.add(s);
    const a = attempts.get(s);
    if (a) a.cancelledHere = true;
  };
  const drop = (s: string, slot: Slot) => {
    d.forgot(s);
    if (d.slots.get(s) === slot) d.slots.delete(s);
  };
  return {
    guard(s: string, service = false) {
      if (d.stopped() || deleted.has(s) || (service && cancelled(s)))
        throw new Error(words(ROOT_SEAT).cancelled());
    },
    epoch: (s: string) => epochs.get(s) ?? 0,
    async explicit<T>(
      s: string,
      name: string,
      args: Record<string, unknown>,
      work: () => Promise<T>,
    ): Promise<T> {
      const taking = standsBy(name, args) && (name !== tool("stand") || !asSatellite(args, null));
      if (taking) await attempts.get(s)?.closing;
      const a = taking ? attempts.get(s) : undefined;
      let finish = () => {};
      if (a) {
        a.cancelledHere = true;
        const done = new Promise<void>((r) => {
          finish = r;
        });
        a.explicit = Promise.all([a.explicit, done]).then(() => {});
      }
      try {
        return await work();
      } finally {
        finish();
      }
    },
    answer(
      slot: Slot,
      name: string,
      result: unknown,
      service: boolean,
      taking: boolean,
      s: string,
      epoch: number,
    ) {
      const r = result as {
        isError?: boolean;
        structuredContent?: { provisional?: unknown; key?: unknown; place?: Partial<Place> };
      } | null;
      if (r?.isError)
        throw Object.assign(new Error(textOf(result) || words(PLUGIN).refusalNoText(name)), {
          result,
        });
      const sc = r?.structuredContent;
      if (taking && epoch === (epochs.get(s) ?? 0)) {
        if (!sc?.key || sc.key === slot.key) {
          d.stood(slot);
          slot.provisional = sc?.provisional === true;
        }
        if (!service && name === tool("stand")) {
          const a = attempts.get(s);
          if (a) a.adopted = true;
          d.held(s, slot); // also confirms an explicit stand by an older bridge
          epochs.set(s, epoch + 1);
        }
      }
      const place = heldPlace(sc) ?? slot.place;
      return {
        content: textOf(result),
        ...(service && name === tool("stand") && place
          ? {
              place,
              provisional: sc?.provisional === true,
              key: typeof sc?.key === "string" ? sc.key : undefined,
            }
          : {}),
      };
    },
    observe(
      slot: Slot,
      kind: string | null,
      data?: {
        key?: unknown;
        place?: Partial<Place>;
        provisional?: unknown;
        automatic?: unknown;
        frame?: { type?: string };
      },
    ) {
      // Holding follows the bridge's held/hello event, never a tool's apparent success.
      if (kind === "held" || kind === "attached" || data?.frame?.type === "hello") d.stood(slot);
      if ((kind === "held" || kind === "released") && typeof data?.key === "string")
        slot.key = data.key;
      if (kind === "held") {
        slot.place = heldPlace(data) ?? slot.place;
        slot.provisional = data?.provisional === true;
        if (data?.automatic === false && slot.session) {
          epochs.set(slot.session, (epochs.get(slot.session) ?? 0) + 1);
          const a = attempts.get(slot.session);
          if (a) a.adopted = true;
        }
      }
      if (kind === "released" || kind === "dead" || kind === "evicted" || kind === "stopped")
        slot.holding = false;
      if (kind === "stopped" && slot.session)
        epochs.set(slot.session, (epochs.get(slot.session) ?? 0) + 1);
      return kind === "held" && data?.automatic === true;
    },
    cancel,
    forget(s: string) {
      const slot = d.slots.get(s);
      if (!slot) return;
      const a = attempts.get(s);
      if (a) {
        a.cancelledHere = true;
        return;
      }
      slot.ownStop = true;
      slot.bridge.stop();
      drop(s, slot);
    },
    stopSlots(home: Home | null, spare: Slot | null) {
      const slots = [...d.slots.values()];
      const left = writeLostMarker(d.authDir(), slots, home);
      if (spare) {
        spare.ownStop = true;
        spare.bridge.stop();
      }
      for (const slot of slots) {
        if (slot.session && attempts.get(slot.session)?.onWire) continue;
        slot.ownStop = true;
        slot.bridge.stop();
      }
      d.slots.clear();
      return left;
    },
    half: {
      async seatRoot(s: string, realm: string, karta: string, isCancelled: () => boolean) {
        if (cancelled(s) || isCancelled()) return { cancelled: true } as const;
        const attempt: {
          cancelled: () => boolean;
          cancelledHere: boolean;
          slot?: Slot;
          failure?: string;
          onWire?: boolean;
          fresh?: boolean;
          owned?: { key: string; place: Place };
          explicit?: Promise<void>;
          closing?: Promise<void>;
          adopted?: boolean;
        } = {
          cancelled: isCancelled,
          cancelledHere: false,
          slot: undefined as Slot | undefined,
        };
        attempts.set(s, attempt);
        return seatBy(
          {
            slotFor: async (root) => {
              const slot = await d.slotFor(root);
              attempt.slot = slot;
              return slot;
            },
            awaitReady: d.awaitReady,
            callThrough: async (...args) => {
              attempt.onWire = true;
              attempt.fresh = true;
              try {
                const out = await d.callThrough(...args);
                if (out.provisional === true && out.key && out.place)
                  attempt.owned = { key: out.key, place: out.place };
                return out;
              } catch (e) {
                attempt.failure = (e as Error).message;
                throw e;
              } finally {
                attempt.onWire = false;
              }
            },
            modelOf: d.modelOf,
            cancelled,
            provisional: (slot) => slot.provisional === true,
            recorded,
          },
          s,
          realm,
          karta,
        );
      },
      cancelSeat: cancel,
      async releaseSeat(s: string) {
        const attempt = attempts.get(s);
        const slot = attempt?.slot;
        if (!slot) return;
        let last: Promise<void> | undefined;
        do {
          last = attempt?.explicit;
          await last;
        } while (attempt?.explicit !== last);
        const owned = attempt?.owned;
        if (
          !owned ||
          attempt?.adopted ||
          !slot.holding ||
          slot.key !== owned.key ||
          slot.provisional !== true
        ) {
          // Returned explicit places and a newer explicit stand are not this attempt's property.
          if (attempt?.fresh && !owned && !attempt.explicit && (slot.holding || attempt.failure))
            d.failed(
              words(ROOT_SEAT).cleanupFailed(
                slot.key ?? s,
                attempt.failure ?? words(ROOT_SEAT).unproven(),
              ),
            );
          if (d.stopped() || deleted.has(s) || (attempt?.fresh && !attempt.explicit)) {
            slot.ownStop = true;
            slot.bridge.stop();
            drop(s, slot);
          }
          return;
        }
        slot.ownStop = true;
        let finished = () => {};
        if (attempt)
          attempt.closing = new Promise<void>((r) => {
            finished = r;
          });
        try {
          const failure = attempts.get(s)?.failure;
          if (!slot.holding && failure) throw new Error(failure);
          if (slot.holding) {
            const p = owned.place;
            const result = await slot.bridge.request(
              "tools/call",
              {
                name: tool("channel"),
                arguments: { action: "revoke", realm: p.realm, karta: p.karta, standing: p.name },
              },
              { service: true, timeoutMs: 10_000 },
            );
            if (result?.isError) throw new Error(textOf(result));
          }
        } catch (e) {
          d.failed(words(ROOT_SEAT).cleanupFailed(slot.key ?? s, (e as Error).message));
        } finally {
          slot.bridge.stop();
          drop(s, slot);
          finished();
        }
      },
      finishSeat(s: string) {
        attempts.delete(s);
      },
    },
  };
}
