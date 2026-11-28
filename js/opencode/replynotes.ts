// The plugin's own word about its transport — the hearing watchdog's (keep.ts), a seat its
// spelling twin lost unloaded (twins.ts), a root seated past the prompt's term (rootseat.ts) —
// opens no turn (graph @nks/nks-dev, nodes #11359, #11362): it waits for the session's next
// completed tool call and rides its reply, as the rituals' notes ride a shell reply (rites.ts).
// The waiting words are the process's (globalThis): a twin's word reaches the session through
// whichever instance serves its tools.
/* eslint-disable @typescript-eslint/no-explicit-any -- the process registry on globalThis */
import { GLOBAL_PREFIX } from "../delivery/index.ts";
import type { Context } from "./plugin.ts";

type Part = { type: string; text?: string };
type Result = { content?: string | readonly Part[] };

/** Words a session waits with, at most this many: the newest stay. */
const KEPT = 5;

const waiting = (): Map<string, string[]> =>
  ((globalThis as any)[`${GLOBAL_PREFIX}ReplyNotes`] ??= new Map<string, string[]>());

/** A word for session `session`'s next tool reply; the same word waiting is not doubled. */
export function putNote(session: string, text: string): void {
  const got = (waiting().get(session) ?? []).filter((t) => t !== text);
  waiting().set(session, [...got, text].slice(-KEPT));
}

/** The plugin's own word: a line in the log and the session's next tool reply, never a turn. */
export const toldAside =
  (say: (text: string, level: "warning") => void) =>
  (session: string, text: string): void => {
    say(text, "warning");
    putNote(session, text);
  };

const wired = new WeakSet<object>();

/** The tool hook "execute.after" of this instance hands the session's waiting words, once per ctx. */
export async function wireNotes(ctx: Context): Promise<void> {
  const tool = (ctx as Partial<Pick<Context, "tool">>).tool;
  if (wired.has(ctx) || typeof tool?.hook !== "function") return;
  wired.add(ctx);
  await tool.hook("execute.after", (t) => {
    const session = String(t.sessionID);
    const words = waiting().get(session);
    if (!words?.length || t.status !== "completed") return;
    waiting().delete(session);
    const note = words.join("\n\n");
    const result = t.result as unknown as Result;
    const content = result.content;
    const next: Result = {
      ...result,
      content:
        typeof content === "string"
          ? content
            ? `${content}\n\n${note}`
            : note
          : [...(content ?? []), { type: "text", text: note }],
    };
    t.result = next as unknown as typeof t.result;
  });
}
/* eslint-enable @typescript-eslint/no-explicit-any */
