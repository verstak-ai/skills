// The launch basis in our names and words (the core's shared/spawned-for.ts and the stand tool;
// graph @nks/nks-dev, node #9959): the pair rides VERSTAK_SPAWNED_FOR or the stand tool's
// spawned_for, a malformed pair is refused in our words before any seat, and the stand tool
// describes the field in our words. The admission itself (register's echo, the initial prompt,
// rebinding) is the sibling's suite.
import assert from "node:assert/strict";
import { test } from "node:test";

import { standTool } from "../bridge/standtool.ts";
import { SPAWNED_FOR, SPAWNED_FOR_ENV, tool } from "../delivery/index.ts";
import { parseSpawn, spawnJson } from "../shared/spawned-for.ts";

const ROOM = "1035d984-7313-4699-9090-2baa2ae7cb49";

test("the pair rides our variable and parses to {invite, room}", () => {
  assert.equal(SPAWNED_FOR_ENV, "VERSTAK_SPAWNED_FOR");
  assert.deepEqual(spawnJson(`{"invite": 3, "room": "${ROOM.toUpperCase()}"}`), {
    invite: 3,
    room: ROOM,
  });
});

test("a malformed pair is refused in our words, never seating", () => {
  for (const bad of [
    "{}",
    `{"invite": 0, "room": "${ROOM}"}`,
    `{"invite": 3, "room": "no-uuid"}`,
    `{"invite": 3, "invite": 4, "room": "${ROOM}"}`,
    "not json",
  ])
    assert.throws(() => spawnJson(bad), { message: SPAWNED_FOR.en.invalid() }, bad);
  assert.throws(() => parseSpawn([1, ROOM]), { message: SPAWNED_FOR.en.invalid() });
  assert.match(SPAWNED_FOR.en.connect(), new RegExp(`Use ${tool("stand")}:`));
});

test("the stand tool offers spawned_for with our description and the strict pair", () => {
  const t = standTool();
  assert.equal(t.name, tool("stand"));
  const f = t.inputSchema.properties.spawned_for;
  assert.equal(f.description, SPAWNED_FOR.en.schema());
  assert.deepEqual(f.required, ["invite", "room"]);
  assert.equal(f.additionalProperties, false);
});

// A seat taken or already held by the pair is told to join its case before any work, through
// our case tool; the seat words carry the pair as given.
test("a taken or held seat is sent into its case by our case tool", () => {
  const join = `${tool("case")}(action="join", realm="@x/g", room="${ROOM}")`;
  const taken = SPAWNED_FOR.en.taken("@x/g", ROOM, 7);
  assert.ok(taken.includes(join), taken);
  assert.match(taken, /invitation 7 of case /, taken);
  const held = SPAWNED_FOR.en.held("@x:seat", "@x/g", ROOM, 7);
  assert.ok(held.includes(join), held);
  assert.match(held, /seat @x:seat for invitation 7/, held);
  assert.match(held, /no second seat/, held);
});
