// The server's child_ended on its way into the parent's prompt (graph @nks/nks-dev, node #11362;
// review №5823 round 2): a notice counts as the parent's word only once its body went into a
// prompt as is. One past the shown part of a stale or wake-up batch (its count only), or piled,
// is not in the turn: it stays pending for its session and rides the next prompt into it; until
// then the child's own end word is not suppressed (childended.ts serverEnded waits for it).
import { type Frame } from "../shared/channel.ts";
import { type ChildEnded, childEndedOf, heardEnd, toldBefore } from "./childended.ts";

/** Notices kept per session at most; the oldest goes first. */
const KEPT = 50;

type Pending = { n: ChildEnded; body: string };
/** By the session the notice came for ("" — no session named: the freshest root takes it). */
const pending = new Map<string, Pending[]>();

const keys = (id: string): string[] => [id, ""];

/**
 * A channel event — a frame, or a wake-up/stale batch of frames: each child_ended in it waits
 * to be laid. When it carries nothing but notices of ends the plugin already told the parent,
 * their seats — the event is not delivered then (a second turn); null — deliver as any.
 */
export function endToldAlready(
  session: string | null,
  ev: { frame?: Frame | null; frames?: Frame[] | null },
): string | null {
  const frames = ev.frames?.length ? ev.frames : ev.frame ? [ev.frame] : [];
  const found = frames.map((f) => [f, childEndedOf(f)] as const);
  if (!found.some(([, n]) => n)) return null;
  const told: string[] = [];
  for (const [f, n] of found) {
    if (!n) continue;
    if (toldBefore(n)) {
      told.push(n.standing ?? n.standing_id ?? "?");
      continue;
    }
    const body = typeof f.body === "string" ? f.body.trim() : "";
    if (!body)
      heardEnd(n); // no text of its own to carry: the notice itself is the word
    else {
      const list = pending.get(session ?? "") ?? [];
      list.push({ n, body });
      pending.set(session ?? "", list.slice(-KEPT));
    }
  }
  return told.length === frames.length ? told.join(", ") : null;
}

/** The prompt into session `id` with the pending notices its text does not carry yet, as is. */
export function rideEnds(id: string, text: string): string {
  const riding = keys(id)
    .flatMap((k) => pending.get(k) ?? [])
    .filter((p) => !text.includes(p.body))
    .map((p) => p.body);
  return riding.length ? `${text}\n\n${riding.join("\n\n")}` : text;
}

/** The prompt went into session `id`: the notices whose body it carries are laid. Its text. */
export function laidEnds(id: string, text: string): string {
  for (const k of keys(id)) {
    const list = pending.get(k);
    if (!list) continue;
    const left = list.filter((p) => {
      if (!text.includes(p.body)) return true;
      heardEnd(p.n);
      return false;
    });
    if (left.length) pending.set(k, left);
    else pending.delete(k);
  }
  return text;
}
