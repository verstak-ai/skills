// The shape of the delivery layer's dictionaries: every dictionary has exactly the
// languages in LANGS, the same keys in each, and every word is a function that,
// called with Latin placeholders, says nothing in another alphabet or another
// product's name.
import assert from "node:assert/strict";
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { pathToFileURL } from "node:url";

import { LANGS } from "../delivery/lang.ts";
import { BACKLOG } from "../delivery/words/backlog.ts";
import { CALL } from "../delivery/words/call.ts";
import { CHANNEL } from "../delivery/words/channel.ts";
import { FRAME_TEXT } from "../delivery/words/frame-text.ts";
import { HOLD } from "../delivery/words/hold.ts";
import { OPENCODE } from "../delivery/words/opencode.ts";
import { OPENCODE_KEEP } from "../delivery/words/opencode-keep.ts";
import { PLUGIN } from "../delivery/words/plugin.ts";
import { RESUME } from "../delivery/words/resume.ts";
import { SEPARATE } from "../delivery/words/separate.ts";
import { STALE } from "../delivery/words/stalebatch.ts";
import { STATUS } from "../delivery/words/status.ts";
import { REPO } from "./built.mjs";

const DIR = join(REPO, "js", "delivery", "words");
const FILES = readdirSync(DIR).filter((f) => f.endsWith(".ts"));
const FOREIGN = new RegExp("\\p{Script=Cyrillic}|is" + "kron", "iu");

test("occupied-seat guidance distinguishes own-name recovery from foreign-seat takeover", () => {
  const messages = [
    CALL.en.heardAdvice(true, "asked", "led"),
    HOLD.en.evicted(4000),
    HOLD.en.evictedBeside(4000, "name", "base"),
    PLUGIN.en.evicted(4000),
    RESUME.en.gaveUp("seat", 3),
    SEPARATE.en.beside("base", "base.2", false, null),
    STATUS.en.evictedWhy(),
    STATUS.en.takePath(),
    STATUS.en.turnedGuidance(),
    STATUS.en.notHeldNone(),
    STATUS.en.notHeldList("seat"),
  ];
  for (const text of messages) {
    assert.match(text, /your own name \(the same role, the same account\)/);
    assert.match(text, /silent 5 minutes.*verstak_channel send/);
    assert.match(text, /another's \(another role or account\) — only on the user's word/);
    assert.doesNotMatch(text, /human/);
  }
});

test("proven own-seat recovery needs no foreign-seat warning", () => {
  const text = OPENCODE_KEEP.en.resumedOwn("@owner:seat");
  assert.match(text, /Verstak:.*@owner:seat.*your own/);
  assert.doesNotMatch(text, /someone else|verstak_channel|verstak_stand/);
});

test("failed same-session takeover retains the seat and refusal reason", () => {
  assert.equal(
    RESUME.en.ownNotTaken("@owner:seat", "refused"),
    "@owner:seat: a former bridge of this session holds it, taking it failed — refused",
  );
  assert.match(OPENCODE_KEEP.en.elsewhere("@owner:seat"), /serving this session now/);
});

test("a seat returning from disk is waited for; the stand tool is named only for a failed return", () => {
  const notBack = OPENCODE_KEEP.en.notBack("@owner:seat", "why");
  assert.match(
    notBack,
    /wait for its word; if it did not return on the retry either — verstak_stand\./,
  );
  assert.doesNotMatch(notBack, /will not wait/);
  const lost = OPENCODE_KEEP.en.lostWord("12:00", "where");
  assert.match(lost, /— wait, the waiting frames come as a batch;/);
  assert.match(lost, /call verstak_stand only if the hearing watchdog says the return failed\./);
  assert.doesNotMatch(lost, /If it did not return/);
});

test("rejoin joins the waiting cases by room, without checking mine first", () => {
  const text = RESUME.en.rejoin();
  assert.match(
    text,
    /join again the cases that wait for you: verstak_case\(action="join", room="#N"\)/,
  );
  assert.doesNotMatch(text, /mine/);
});

test("left-out and lost frames point at the seat's cases, never the channel log the server drops", () => {
  const pointers = [
    FRAME_TEXT.en.inFull(""),
    BACKLOG.en.head(30, 30, 20, 1),
    STALE.en.head(25, 20),
    CHANNEL.en.hung(90, 30),
  ];
  for (const text of pointers) {
    assert.match(text, /verstak_case\(action="mine"\), then read each/);
    assert.doesNotMatch(text, /verstak_channel/);
  }
  assert.match(CHANNEL.en.hung(90, 30), /a direct word — ask for it again/);
  for (const text of [
    OPENCODE.en.childGone("f", "c", " t"),
    OPENCODE.en.childEnded("f", "c", "t"),
  ]) {
    assert.match(text, /a case record stays in the case \(verstak_case history\)/);
    assert.doesNotMatch(text, /verstak_channel/);
  }
});

test("the delivery layer has word dictionaries", () => {
  assert.ok(FILES.length > 0, `no dictionaries under ${DIR}`);
});

for (const file of FILES) {
  test(`${file}: every dictionary carries exactly LANGS, the same keys, and only functions`, async () => {
    const mod = await import(pathToFileURL(join(DIR, file)).href);
    const dicts = Object.entries(mod);
    assert.ok(dicts.length > 0, `${file} exports no dictionary`);
    for (const [name, dict] of dicts) {
      assert.deepEqual(
        Object.keys(dict).sort(),
        [...LANGS].sort(),
        `${file} ${name}: languages are not exactly LANGS`,
      );
      const [first, ...rest] = LANGS;
      const keys = Object.keys(dict[first]).sort();
      assert.ok(keys.length > 0, `${file} ${name}.${first} is empty`);
      for (const l of rest)
        assert.deepEqual(
          Object.keys(dict[l]).sort(),
          keys,
          `${file} ${name}: ${l} keys differ from ${first}`,
        );
      for (const l of LANGS)
        for (const k of keys) {
          const fn = dict[l][k];
          assert.equal(typeof fn, "function", `${file} ${name}.${l}.${k} is not a function`);
          const out = String(fn(...Array.from({ length: fn.length }, (_, i) => `x${i}`)));
          assert.doesNotMatch(out, FOREIGN, `${file} ${name}.${l}.${k}: ${out}`);
        }
    }
  });
}
