// OpenCode's own subagent notice (graph @nks/nks-dev, node #6625) — the synthetic
// `<subagent sessionID="…" state="completed">` into the parent at the end of a child's TURN
// (and the same text as a non-background task's tool result). The plugin cannot intercept it,
// but the "context" hook sees it before the model reads it (system and messages are mutable):
// for a live lead named by such a notice the plugin adds a word to system that it is a turn.
/* eslint-disable @typescript-eslint/no-explicit-any -- message parts without a schema */
import { W } from "./leadwords.ts";

const COMPLETED = /<subagent sessionID=\\?"([^"\\]+)\\?" state=\\?"completed\\?"/g;

/** Texts of the message parts that may carry the notice: text and tool result. */
function* texts(messages: readonly any[]): Generator<string> {
  for (const m of messages)
    for (const part of Array.isArray(m?.content) ? m.content : []) {
      if (part?.type === "text" && typeof part.text === "string") yield part.text;
      else if (part?.type === "tool-result") yield JSON.stringify(part.result ?? "");
    }
}

/** A word in the request's system for every live lead whose turn OpenCode called "completed". */
export function annotate(
  req: { system: any[]; messages: readonly any[] },
  nameOf: (child: string) => string | null,
): void {
  const seen = new Set<string>();
  for (const text of texts(req.messages ?? []))
    for (const [, child] of text.matchAll(COMPLETED)) {
      if (!child || seen.has(child)) continue;
      seen.add(child);
      const name = nameOf(child);
      if (name) req.system.push({ type: "text", text: W().notice(child, name) });
    }
}

/* eslint-enable @typescript-eslint/no-explicit-any */
