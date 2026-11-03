// The turn's end on a watch in Claude Code, in our words (graph @nks/nks-dev, nodes #9345,
// #9342): the plugin's Stop hook (hooks/hooks.json → hooks/rituals.mjs) reads the transcript's
// last turn; a turn a watchdog's frame started, with no human word, that ended with text and laid
// no ask, say or send, is told to go on with TURN's wake word — once: stop_hook_active keeps it
// from repeating; the cover's rituals: field without `turn` keeps it silent. Stand-in transcripts
// (the entries' form is the sibling's, taken from real watch sessions); the reading itself is the
// core's, probed in the sibling's suite.
import assert from "node:assert/strict";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

import { tool, TURN } from "../delivery/index.ts";
import { claudeRaw, COVER, repo } from "./rites-kit.mjs";

const FOREIGN = new RegExp("\\p{Script=Cyrillic}|is" + "kron", "iu");
const CASE = `mcp__plugin_verstak_verstak__${tool("case")}`;

const said = (text, stop = "end_turn") => ({
  type: "assistant",
  message: { content: [{ type: "text", text }], stop_reason: stop },
});
const called = (id, name, input) => ({
  type: "assistant",
  message: { content: [{ type: "tool_use", id, name, input }], stop_reason: "tool_use" },
});
const result = (id, content, toolUseResult) => ({
  type: "user",
  message: { content: [{ type: "tool_result", tool_use_id: id, content }] },
  ...(toolUseResult ? { toolUseResult } : {}),
});
const human = (text) => ({ type: "user", origin: { kind: "human" }, message: { content: text } });
const notice = (task, event) => ({
  type: "user",
  origin: { kind: "task-notification" },
  message: {
    content: `<task-notification>\n<task-id>${task}</task-id>\n<summary>Monitor event</summary>\n<event>${event}</event>\n</task-notification>`,
  },
});
/** A session that armed its watchdog under Monitor (task bx1) and ended that turn. */
const armed = [
  human("stand watch"),
  called("tu1", "Monitor", {
    command: 'node "/h/verstak-bridge.mjs" watchdog k--931--r5',
    description: "watchdog",
    timeout_ms: 3600000,
  }),
  result("tu1", "Monitor started (task bx1, expires in 30m)", {
    taskId: "bx1",
    timeoutMs: 1800000,
    persistent: false,
  }),
  said("on watch"),
];

let n = 0;
function stop(entries, extra = {}, dir = repo({ agents: null })) {
  const transcript = join(dir, `t${n++}.jsonl`);
  writeFileSync(transcript, entries.map((e) => JSON.stringify(e)).join("\n") + "\n");
  return claudeRaw(dir, { hook_event_name: "Stop", transcript_path: transcript, ...extra });
}

test("a frame's turn ending with text and no word laid: our wake word, once", () => {
  const turn = [...armed, notice("bx1", "Case #5: word [3]"), said("Owner, a question: take it?")];
  const out = stop(turn);
  assert.equal(out?.decision, "block", JSON.stringify(out));
  assert.equal(out.reason, TURN.en.wake());
  assert.ok(out.reason.includes(`${tool("case")} ask/say`));
  assert.doesNotMatch(out.reason, FOREIGN);
  assert.equal(stop(turn, { stop_hook_active: true }), null, "the turn it woke is not woken again");
});

test("no wake word: the turn spoke, a human spoke, it ended on a call", () => {
  const frame = notice("bx1", "a frame");
  for (const action of ["ask", "say", "answer"])
    assert.equal(
      stop([...armed, frame, called("c", CASE, { action }), result("c", "ok"), said("done")]),
      null,
      action,
    );
  const send = called("s", `mcp__verstak__${tool("channel")}`, { action: "send" });
  assert.equal(stop([...armed, frame, send, result("s", "ok"), said("sent")]), null, "send");
  assert.equal(stop([...armed, human("how is it?"), said("fine")]), null, "a human's turn");
  const tail = [...armed, frame, called("r", "Read", { file_path: "x" })];
  assert.equal(stop(tail), null, "the turn ended on a call, not text");
});

test("the cover's rituals: field — without `turn` silent, with it or with no field it speaks", () => {
  const turn = [...armed, notice("bx1", "a frame"), said("to the console — take it?")];
  const field = (rituals) => COVER.replace("  stamp:", `  rituals:${rituals}\n  stamp:`);
  assert.equal(stop(turn, {}, repo({ agents: field(" start push") })), null, "start push");
  assert.equal(stop(turn, {}, repo({ agents: field(" start turn") }))?.decision, "block");
  assert.equal(stop(turn, {}, repo())?.decision, "block", "no field — every ritual");
});

// A quiet turn's end (#9345, core v7.30.1): a short line with no question is a receipt, not a word
// owed elsewhere; a long one or a question is woken.
test("no wake word for a short receipt; a question or a long report is woken", () => {
  const frame = notice("bx1", "Case #5: word [3]");
  assert.equal(stop([...armed, frame, said("received, waiting for CI")]), null, "a receipt");
  assert.equal(stop([...armed, frame, said("take it?")])?.decision, "block", "a question");
  const long = `Report: ${"done, checked. ".repeat(25)}`;
  assert.equal(stop([...armed, frame, said(long)])?.decision, "block", "past 280 characters");
});
