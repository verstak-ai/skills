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
import { COMPACTION } from "../delivery/words/compaction.ts";
import { FRAME_TEXT } from "../delivery/words/frame-text.ts";
import { HOLD } from "../delivery/words/hold.ts";
import { OPENCODE } from "../delivery/words/opencode.ts";
import { OPENCODE_KEEP } from "../delivery/words/opencode-keep.ts";
import { ORCHESTRA } from "../delivery/words/orchestra.ts";
import { PLUGIN } from "../delivery/words/plugin.ts";
import { REALMS } from "../delivery/words/realms.ts";
import { RESUME } from "../delivery/words/resume.ts";
import { ROOT_SEAT } from "../delivery/words/rootseat.ts";
import { SEPARATE } from "../delivery/words/separate.ts";
import { STALE } from "../delivery/words/stalebatch.ts";
import { STAND_TOOL } from "../delivery/words/standtool.ts";
import { STATUS } from "../delivery/words/status.ts";
import { STOP } from "../delivery/words/stop.ts";
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

// A question to this seat closed or re-asked by another seat's record (graph @nks/nks-dev,
// node #6867): who answered or whom it moved to, never the record's text.
test("a question to you closed or re-asked elsewhere names who, never the text", () => {
  assert.equal(
    FRAME_TEXT.en.askAnswered("3", "s.dev"),
    "; your question [3] is closed: answered by s.dev",
  );
  assert.equal(FRAME_TEXT.en.askMoved("3", "s.lead"), "; your question [3] is re-asked of s.lead");
});

// The life check (graph @nks/nks-dev, case #1046): the way to answer under the platform's text,
// the root's line about a warned child seat, and the stop for silence after it (#8121).
test("the life check names the way to answer, a child seat's release, and the stop for silence", () => {
  assert.equal(
    FRAME_TEXT.en.lifeCheckReply(),
    "Answer with an action: update your status — verstak_stand(realm, status=<what you are doing>) — or say a word in the case.",
  );
  assert.equal(FRAME_TEXT.en.lifeCheckSeat("s.sub-1"), "Seat warned: s.sub-1.");
  assert.equal(FRAME_TEXT.en.lifeCheckSeat(""), "Seat warned: the platform did not name the seat.");
  const child = OPENCODE.en.lifeCheckChild("s.sub-1", "931", "@x/dev");
  assert.match(child, /^Verstak: .*s\.sub-1/);
  assert.ok(
    child.includes(
      'verstak_channel(realm="@x/dev", action="revoke", standing="s.sub-1", karta=931)',
    ),
    child,
  );
  assert.doesNotMatch(child, /verstak_stand/, "the root's status saves no child's seat");
  assert.match(
    OPENCODE.en.lifeCheckChild("", "", ""),
    /realm="<graph>", action="revoke", standing="<seat name>", karta=<role>/,
  );
  assert.match(
    STOP.en.stopped("proba", "silent"),
    /taken off \(by the platform: no action of yours after the liveness wake-up\)/,
  );
});

// The role after compaction and a root without a cover that aligns in the same session (the
// core's opencode/compaction.ts, rootseat-again.ts): the words name this delivery's door and
// its align method, never the sibling's skill names.
test("a compacted session is told its role and the door; a root without a cover is told to align", () => {
  const keep = COMPACTION.en.keep("931", "s.dev", "@x/dev");
  assert.match(
    keep,
    /^Verstak: the summary of this compaction must keep .*role #931 in graph @x\/dev, its seat s\.dev/,
  );
  assert.match(keep, /the live cases — by number and what each waits for/);
  assert.match(keep, /reload the verstak skill and the role's methods as the first move/);
  const back = COMPACTION.en.back("#931", "s.dev", "@x/dev");
  assert.match(
    back,
    /^Verstak: the context was compacted\. You are role #931 in graph @x\/dev; the bridge holds seat s\.dev\./,
  );
  assert.match(
    back,
    /load the verstak skill and the methods its door names for the role — only those/,
  );
  assert.match(COMPACTION.en.back("undefined", "s", "r5"), /You are role <role> in graph r5/);
  assert.match(COMPACTION.en.returned("ses_1"), /^Verstak: .*session ses_1$/);
  assert.equal(ROOT_SEAT.en.noFile("AGENTS.md"), "there is no AGENTS.md");
  const realign = ROOT_SEAT.en.realign("there is no AGENTS.md", "AGENTS.md");
  assert.match(realign, /^Verstak: the session is not seated — there is no AGENTS\.md\. /);
  assert.match(realign, /Align the repository by the verstak skill's align method/);
  assert.match(realign, /do not guess the graph or the role/);
  assert.match(realign, /Seating repeats by itself once the cover AGENTS\.md is unambiguous\.$/);
  assert.doesNotMatch(realign, FOREIGN);
  assert.doesNotMatch(realign, /verstak_stand/, "an unaligned root is aligned, not seated by hand");
  assert.match(
    OPENCODE.en.realignDown("boom"),
    /^Verstak: .*seating after alignment waits for a prompt — boom$/,
  );
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

// A graph address is the full address with the owner's real handle or rN; a bare name resolves
// only to the caller's own graph (graph @nks/nks-dev, nodes #8200, #8677). The placeholder
// "owner" taken for a handle mints handles like owner-3 (nodes #8521, #8540): no word teaches
// @owner/slug as the address.
test("the graph-address words name the full address from the listing, never the @owner placeholder", () => {
  const realm = STAND_TOOL.en.realm();
  assert.doesNotMatch(realm, /^Graph address: slug,/, realm);
  assert.match(realm, /the full address from verstak_realm\(action="list"\)/, realm);
  assert.match(realm, /\brN\b/, realm);
  assert.match(realm, /a bare name only for a graph of your own/, realm);
  const unresolved = REALMS.en.unresolved("dev", "@x/dev");
  assert.match(unresolved, /did not resolve the graph "dev" to a full address/, unresolved);
  assert.match(unresolved, /or not once/, unresolved);
  assert.match(unresolved, /full graph address from verstak_realm\(action="list"\)\.$/, unresolved);
  const short = ORCHESTRA.en.onShortRealm("r5");
  assert.match(short, /full address — the owner's handle\/slug from the list of graphs/, short);
  const noGraph = ROOT_SEAT.en.noGraph("AGENTS.md", "Graph");
  assert.equal(noGraph, "'Graph' in AGENTS.md does not start with a full graph address or rN");
});

test("no delivery word teaches the @owner placeholder as a graph address", async () => {
  const hits = [];
  for (const file of FILES) {
    const mod = await import(pathToFileURL(join(DIR, file)).href);
    for (const [name, dict] of Object.entries(mod))
      for (const l of LANGS)
        for (const [k, fn] of Object.entries(dict[l] ?? {})) {
          if (typeof fn !== "function") continue;
          const out = String(fn(...Array.from({ length: fn.length }, (_, i) => `x${i}`)));
          if (/@owner\b/.test(out)) hits.push(`${file} ${name}.${l}.${k}: ${out}`);
        }
  }
  assert.deepEqual(hits, []);
});

// The server drops the channel log (graph @nks/nks-dev, node #7636): no word of the
// bridge or its plugins points there — the seat's cases carry what was lost or left out.
test("no delivery word points at the channel log the server drops", async () => {
  const LOG = /channel\(action="history"|channel"?\)? history|(standing|seat)'s history/;
  const hits = [];
  for (const file of FILES) {
    const mod = await import(pathToFileURL(join(DIR, file)).href);
    for (const [name, dict] of Object.entries(mod))
      for (const l of LANGS)
        for (const [k, fn] of Object.entries(dict[l] ?? {})) {
          if (typeof fn !== "function") continue;
          const out = String(fn(...Array.from({ length: fn.length }, (_, i) => `x${i}`)));
          if (LOG.test(out)) hits.push(`${file} ${name}.${l}.${k}: ${out}`);
        }
  }
  assert.deepEqual(hits, []);
});

// The reply line under a person's direct word (graph @nks/nks-dev, node #9128): the
// sibling core prints it from this word, so it must name our channel tool and carry
// the person's seat and the word's id.
test("a person's direct word gets a full reply line in our words, or names what is missing", () => {
  assert.equal(
    FRAME_TEXT.en.humanWordReply("@person/graph", "1226", "@person:window", "word-9"),
    'reply: verstak_channel(action="send", realm=@person/graph, karta=1226, standing=@person:window, in_reply_to=word-9, text=…)',
  );
  assert.equal(
    FRAME_TEXT.en.noReplyAddress({ realm: false, karta: true, standing: true, id: false }),
    "no address to reply: missing the person's role, the person's seat",
  );
});
