// The plugin's side of a root's start (plugin.ts): the tool hook a root waiting for its cover's
// alignment looks through, and the one word a root's prompt gets of the seating and the invitation.
import { OPENCODE } from "../delivery/index.ts";
import { words } from "../shared/lang.ts";
import type { Context } from "./plugin.ts";
import type { RootSeats } from "./rootseat-doors.ts";
import type { Say } from "./tools.ts";

/**
 * After every tool call of a session (any tool writes AGENTS.md: write, edit, patch, shell) —
 * tool hook "execute.after", @opencode/plugin 2.0.4 — its root's wait, a subagent's call
 * included. No tool domain — the prompt alone rereads.
 */
export async function watchCover(
  ctx: Context,
  seats: RootSeats,
  say: Say,
  rootOf: (session: string) => Promise<string>,
): Promise<void> {
  try {
    const tool = (ctx as Partial<Pick<Context, "tool">>).tool;
    if (typeof tool?.hook === "function")
      await tool.hook("execute.after", async (ev) => {
        if (ev.sessionID) await seats.touched(await rootOf(String(ev.sessionID)));
      });
  } catch (e) {
    say(words(OPENCODE).realignDown((e as Error).message), "error");
  }
}

/**
 * A root's words of its start, in order: the seating's, then the invitation. One word: the
 * onboarding invitation already leads the alignment the cover's word asks for. An invitation
 * needs no cover, so no seat beside it; the seating's ceiling alone bounds both.
 */
export function startWords(
  seats: RootSeats,
  invitation: (session: string) => Promise<string | null>,
  closed: (session: string) => boolean,
) {
  return async (session: string): Promise<string[]> => {
    const [seat, invited] = await Promise.all([seats.word(session), invitation(session)]);
    const invite = invited && !closed(session) ? invited : null;
    const out = seat && !(invite && seats.aligning(session)) ? [seat] : [];
    return invite ? [...out, invite] : out;
  };
}
