// A child its parent does not hear (case №147; graph @nks/nks-dev: OpenCode 2 surface, node #5048).
// A background subagent hangs on a permission request with no timeout: nobody answers in the
// background, and the parent gets no <subagent state=…> at all. The request is the event
// permission.asked (id, sessionID, action, resources; the parent comes from session.get), its
// removal — permission.replied (requestID). A child's turn interrupted not by a cancel, the child
// without a satellite seat, was unheard too: leads.ts hears only leads (#6550 item 4).
// The stream is the service's: ours is a session whose directory equals this instance's as a
// STRING, not after realpath — each spelling has its own instance, and only it knows whether the
// child is a lead. A word is claimed in a process-wide set under a delivery-neutral key, so two
// plugins of two deliveries in one OpenCode tell the parent once (#6815 item 7). Cost: a non-background child's word lands after the human's answer; a shutdown before session.get loses it.
/* eslint-disable @typescript-eslint/no-explicit-any -- SDK events and answers without a schema */
import { envName } from "../delivery/index.ts";
import { sleep } from "./bridge-io.ts";
import { homeOf } from "./host.ts";
import { W } from "./leadwords.ts";
import type { Context } from "./plugin.ts";

/** A request answered within this time (the human answered in the child's window) is not told. */
const WAIT_MS = Number(process.env[envName("PERMISSION_WAIT_MS")]) || 20_000;
/** At most this many resources in the word; each no longer than this. */
const RESOURCES = 3;
const RESOURCE_MAX = 160;

export interface WaitDoors {
  /** A synthetic into the parent's session — steer; wake — whether to wake an idle one. */
  tell(session: string, text: string, wake: boolean): Promise<void>;
  /** A lead subagent (satellite) — its interruptions are leads.ts's. */
  isLead(child: string): boolean;
}

/** Words told in this process by any delivery's plugin; the key is delivery-neutral on purpose. */
const toldInProcess = (): Set<string> =>
  ((globalThis as any).__bridgeChildWordsTold ??= new Set<string>());

export const askWord = (who: string, action: string, resources: string[]): string => {
  const cut = resources.slice(0, RESOURCES).map((r) => {
    const one = r.replace(/\s+/g, " ").trim();
    return one.length > RESOURCE_MAX ? `${one.slice(0, RESOURCE_MAX)}…` : one;
  });
  const n = resources.length - RESOURCES;
  const more = n > 0 ? W().more(n) : "";
  const what = cut.length ? `${action}: ${cut.join("; ")}${more}` : action;
  // The answer is only the human's, in the child's window; the parent cannot cancel the child's turn either.
  return W().ask(who, what);
};

export const interruptWord = (who: string, reason: string): string => W().interrupt(who, reason);

export function createWaits(ctx: Context, d: WaitDoors) {
  const home = homeOf(ctx);
  const answered = new Set<string>();
  const told = toldInProcess();
  const once = (key: string): boolean => {
    if (told.has(key)) return false;
    told.add(key);
    if (told.size > 1000) told.delete(told.values().next().value as string);
    return true;
  };
  let stopped = false;

  /** A hosted child of this instance's spelling: parent and name; a root, another spelling, unreadable — null. */
  async function childOf(
    sessionID: string,
    ev: any,
  ): Promise<{ parent: string; who: string } | null> {
    const res: any = await Promise.resolve()
      .then(() => ctx.session.get({ sessionID } as any))
      .catch(() => null);
    const s = res?.data ?? res;
    const parent: unknown = s?.parentID;
    if (typeof parent !== "string" || !parent) return null;
    const dir: unknown = s?.location?.directory ?? ev?.location?.directory;
    if (home && typeof dir === "string" && dir && dir !== home.directory) return null;
    const title = typeof s?.title === "string" ? s.title.trim() : "";
    return { parent, who: title ? `«${title}» (${sessionID})` : sessionID };
  }

  async function asked(ev: any): Promise<void> {
    const { id, sessionID, action, resources } = ev?.data ?? {};
    if (typeof id !== "string" || typeof sessionID !== "string" || told.has(id)) return;
    await sleep(WAIT_MS);
    if (stopped || answered.has(id)) return;
    const kid = await childOf(sessionID, ev);
    if (!kid || answered.has(id) || !once(id)) return;
    const list = Array.isArray(resources) ? resources.map(String) : [];
    await d.tell(kid.parent, askWord(kid.who, String(action ?? W().action()), list), true);
  }

  async function interrupted(ev: any): Promise<void> {
    const { sessionID, reason } = ev?.data ?? {};
    if (typeof sessionID !== "string" || typeof reason !== "string" || reason === "user") return;
    if (d.isLead(sessionID)) return;
    const kid = await childOf(sessionID, ev);
    const key = typeof ev?.id === "string" ? ev.id : `${sessionID}@${ev?.created ?? reason}`;
    if (!kid || stopped || d.isLead(sessionID) || !once(key)) return;
    await d.tell(kid.parent, interruptWord(kid.who, reason), false);
  }

  return {
    onEvent(ev: any): void {
      switch (ev?.type) {
        case "permission.asked":
          void asked(ev);
          return;
        case "permission.replied":
          if (typeof ev.data?.requestID !== "string") return;
          answered.add(ev.data.requestID);
          if (answered.size > 1000) answered.delete(answered.values().next().value as string);
          return;
        case "session.execution.interrupted":
          void interrupted(ev);
          return;
      }
    },
    stop(): void {
      stopped = true;
    },
  };
}

/* eslint-enable @typescript-eslint/no-explicit-any */
