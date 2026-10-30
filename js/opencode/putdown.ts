// A root session's bridge put down by the plugin says why first (graph @nks/nks-dev, node #7493):
// `end` — the session was deleted, the agent ended: the bridge revokes its own seats at once;
// `away` — a planned restart (a reload, a move to another folder): the seat waits for the same
// session. A bridge gone without a word is the agent's death — the daemon closes its seat
// after the window.
import { method, OPENCODE, PRODUCT } from "../delivery/index.ts";
import { words } from "../shared/lang.ts";
import type { Slot } from "./slot.ts";

export type PutDown = "end" | "away";

/** `end` waits for the revokes of the main seat and those beside; `away` is a mark only. */
const SAY_MS: Record<PutDown, number> = { end: 8_000, away: 1_000 };

type Ended = { ended?: boolean; failed?: string[]; probably?: string[]; word?: string } | null;

/**
 * What an `end` left on the board, aloud — the bridge keeps the hold record and repeats the
 * revoke after the death window (runend.ts); null — all revoked.
 */
function unrevoked(got: Ended): string | null {
  if (got?.ended && !got.failed?.length) return null;
  return got?.failed?.length ? got.failed.join(", ") : (got?.word ?? "—");
}

/** Seats gone only by the revoke reply's prose — not confirmed, their hold records kept (caseexit.ts). */
const unconfirmed = (got: Ended): string | null =>
  got?.ended && got.probably?.length ? got.probably.join(", ") : null;

/**
 * The word to a root's bridge, then its stop; a child's bridge just stops. Both go to any
 * root's bridge — a first connect in flight has no seat here yet, and the bridge itself knows
 * whether a seat waits or answers late (case №677, №2264).
 */
export async function putDown(slot: Slot, word: PutDown | null): Promise<void> {
  if (word && !slot.child) {
    // Without a seat known here an unanswered `end` says nothing: there may be none to revoke.
    const seated = slot.holding || !!slot.key;
    const got = await slot.bridge
      .request(method(word), {}, { timeoutMs: SAY_MS[word], service: true })
      .catch((e: Error) => (seated ? { ended: false, word: e.message } : null));
    const left = word === "end" && got ? unrevoked(got) : null;
    const maybe = word === "end" ? unconfirmed(got) : null;
    if (left) process.stderr.write(`[${PRODUCT}/warning] ${words(OPENCODE).endUnrevoked(left)}\n`);
    if (maybe)
      process.stderr.write(`[${PRODUCT}/warning] ${words(OPENCODE).endUnconfirmed(maybe)}\n`);
  }
  slot.bridge.stop();
}
