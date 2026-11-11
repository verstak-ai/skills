// The shape of the delivery layer's dictionaries: every dictionary has exactly the
// languages in LANGS, the same keys in each, and every word is a function that,
// called with Latin placeholders, says nothing in another alphabet or another
// product's name.
import assert from "node:assert/strict";
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { pathToFileURL } from "node:url";

import { PREPARE, SECTIONS } from "../delivery/index.ts";
import { LANGS } from "../delivery/lang.ts";
import { BACKLOG } from "../delivery/words/backlog.ts";
import { CALL } from "../delivery/words/call.ts";
import { CHANNEL } from "../delivery/words/channel.ts";
import { COMPACTION } from "../delivery/words/compaction.ts";
import { FRAME_TEXT } from "../delivery/words/frame-text.ts";
import { HOLD } from "../delivery/words/hold.ts";
import { LAUNCH } from "../delivery/words/launch.ts";
import { LEAD } from "../delivery/words/leads.ts";
import { OPENCODE } from "../delivery/words/opencode.ts";
import { OPENCODE_KEEP } from "../delivery/words/opencode-keep.ts";
import { ORCHESTRA } from "../delivery/words/orchestra.ts";
import { PLUGIN } from "../delivery/words/plugin.ts";
import { REALMS } from "../delivery/words/realms.ts";
import { RESUME } from "../delivery/words/resume.ts";
import { ROOT_SEAT } from "../delivery/words/rootseat.ts";
import { SATELLITE } from "../delivery/words/satellite.ts";
import { SEPARATE } from "../delivery/words/separate.ts";
import { SKILL_CATCHUP } from "../delivery/words/skillcatchup.ts";
import { STALE } from "../delivery/words/stalebatch.ts";
import { STAND_TOOL } from "../delivery/words/standtool.ts";
import { STATUS } from "../delivery/words/status.ts";
import { STOP } from "../delivery/words/stop.ts";
import { TURN } from "../delivery/words/turn.ts";
import { UPDATE } from "../delivery/words/update.ts";
import { REPO } from "./built.mjs";

const DIR = join(REPO, "js", "delivery", "words");
const FILES = readdirSync(DIR).filter((f) => f.endsWith(".ts"));
const FOREIGN = new RegExp("\\p{Script=Cyrillic}|is" + "kron", "iu");

test("occupied-seat guidance evicts a holder only on the user's word, own name too", () => {
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
    assert.match(
      text,
      /only on the user's word; a seat on the board is no evidence its holder is alive/,
    );
    assert.match(text, /machine bridge with a daemon, otherwise by the platform's term/);
    assert.doesNotMatch(text, /silent 5 minutes|by yourself when/);
    assert.doesNotMatch(text, /human/);
  }
});

test("a lead's failed turn is not its end, and a deleted session's unrevoked seat is said", () => {
  const failed = LEAD.en.failed("s.sub-1", LEAD.en.noError());
  assert.match(
    failed,
    /^Verstak: the turn of subagent s\.sub-1 failed — OpenCode named no error\. /,
  );
  assert.match(failed, /It has not ended: it holds its seat and cases/);
  assert.match(failed, /verstak_channel\(action="revoke", standing="s\.sub-1"\)/);
  assert.match(failed, /tell the user;/);
  assert.match(
    OPENCODE.en.endUnrevoked("a, b"),
    /^Verstak: the session is deleted but its seat is not revoked \(a, b\)/,
  );
  assert.match(OPENCODE.en.endUnconfirmed("a"), /its seat's revoke is not confirmed \(a\)/);
  assert.doesNotMatch(OPENCODE_KEEP.en.parentMoved(), /errand ended/);
  assert.equal(
    OPENCODE.en.sessionLeftOpen("ses_1", null),
    "Verstak: session ses_1 is stopped but its window is left open — the plugin finds no client of this session; close it in OpenCode",
  );
  assert.match(
    OPENCODE.en.sessionLeftOpen("ses_1", "archive refused"),
    /left open — archive refused; close it/,
  );
  assert.equal(
    OPENCODE.en.clientClosed("ses_1", 42),
    "Verstak: session ses_1 is stopped, its client closed (pid 42)",
  );
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
  const pointers = [FRAME_TEXT.en.inFull(""), STALE.en.head(25, 20, true), CHANNEL.en.hung(90, 30)];
  for (const text of pointers) {
    assert.match(text, /verstak_case\(action="mine"\), then read each/);
    assert.doesNotMatch(text, /verstak_channel/);
  }
  assert.match(CHANNEL.en.hung(90, 30), /a direct word — ask for it again/);
  // Compact counts (core v7.33 line, graph @nks/nks-dev, node #9654): the head is numbers only.
  assert.equal(
    BACKLOG.en.head(30, 30, 20, 0),
    "Wake-up: 30 frames (waiting in the queue: 30), the first 20 here, 10 left out.",
  );
  assert.equal(STALE.en.head(25, 20), "Stale frames: 25, the first 20 here, 5 left out.");
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
test("after a compaction the personal slice comes back with the seat's answer, and writing is loaded", () => {
  assert.match(
    COMPACTION.en.back("#931", "s.dev", "@x/dev"),
    /The user's personal slice comes back with the seat's answer \(the door's Start\)/,
  );
  // No seat is known for `bare`: no seat's answer will bring the slice, so it is read here.
  assert.match(COMPACTION.en.bare(), /With no seat, read the user's personal slice yourself/);
  assert.doesNotMatch(COMPACTION.en.bare(), /seat's answer/);
  // The core spends the role word only once the whole system block is in place (sibling 7.38.1).
  assert.match(
    COMPACTION.en.returned("s1"),
    /into the system of the current request of session s1/,
  );
  for (const w of [COMPACTION.en.back("#931", "s.dev", "@x/dev"), COMPACTION.en.bare()]) {
    assert.match(w, /the methods its door names for the role \(only those\) and writing/);
    assert.match(w, /a standing word of theirs on how agents work that only the summary holds/);
    assert.match(w, /from where they said it, .*never from the summary alone/);
  }
});

test("a compacted session is told its role and the door; a root without a cover is told to align", () => {
  const keep = COMPACTION.en.keep("931", "s.dev", "@x/dev");
  assert.match(keep, /^Verstak: this summary keeps role #931 in @x\/dev, seat s\.dev/);
  assert.match(keep, /the live cases \(number, what each waits for\)/);
  assert.match(keep, /the user's standing words on how agents work verbatim/);
  assert.match(keep, /reload the verstak skill and the role's methods first/);
  const back = COMPACTION.en.back("#931", "s.dev", "@x/dev");
  assert.match(
    back,
    /^Verstak: context compacted\. Role #931 in @x\/dev, seat s\.dev \(the bridge holds it\)\./,
  );
  assert.match(back, /re-read in the graph what you lean on \(entry, Recalling\)\.$/);
  assert.match(COMPACTION.en.back("undefined", "s", "r5"), /Role <role> in r5/);
  const bare = COMPACTION.en.bare();
  assert.match(bare, /^Verstak: context compacted\. First load the verstak skill/);
  assert.match(bare, /\(entry, Recalling\)\.$/);
  assert.doesNotMatch(bare, /role #|seat /);
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

test("the memory guard cites the repository's own persistence heading, or none", () => {
  assert.match(PREPARE.en.guard("r5"), /\(AGENTS\.md, Persistence\)\. Route the fact/);
  assert.match(PREPARE.en.guard("r5", "Persistence rules"), /\(AGENTS\.md, Persistence rules\)\./);
  assert.match(PREPARE.en.guard("r5", null), /\(AGENTS\.md\)\. Route the fact/);
});

test("the memory guard claims no stub: the directory takes no file (align contract 12)", () => {
  assert.doesNotMatch(PREPARE.en.guard("r5"), /stub/);
});

test("the section kinds read English headings: our template's Persistence, a trunk push", () => {
  assert.ok(SECTIONS.persist("Persistence"));
  assert.ok(SECTIONS.trunk("Push to main"));
  assert.ok(!SECTIONS.persist("Project"));
});

// From core v7.34.1 the "/" command's head rides the request's system context alone, not glued
// before the person's text (graph @nks/nks-dev, node #9867): it names the command, never "below".
test("a / command's head stands alone in the system: it names the command, claims no text below", () => {
  const head = OPENCODE.en.commandHead("verstak");
  assert.match(head, /^The user ran \/verstak: load the skill `verstak` with the `skill` tool/);
  assert.doesNotMatch(head, /below|typed this/);
});

// The human's rules given into the turn (the core's shared/mindslice.ts; graph @nks/nks-dev,
// nodes #9817, #9818): every word starts with the mark the core finds the block by, names our
// tools, and says the block is personal.
test("the mind slice words carry one mark, our tool names and the personal clause", async () => {
  const { MIND_SLICE } = await import("../delivery/words/mindslice.ts");
  const W = MIND_SLICE.en;
  const mark = W.mark();
  for (const w of [W.head(2), W.empty(), W.absent(), W.unknown(), W.unread("refused")])
    assert.ok(w.startsWith(mark), w);
  assert.match(
    W.head(2),
    /cite a rule in a case only when it describes that case; it never goes into a brief, the project's graph or commits/,
  );
  assert.match(
    W.foot(true, 100),
    /verstak_look\(realm="mind".*verstak_search\(realm="mind".*offset=100\)/,
  );
  assert.doesNotMatch(W.foot(false, 100), /first page/);
  for (const call of W.foot(true, 100).match(/\w+_(?:look|search)\(/g) ?? [])
    assert.ok(call.startsWith("verstak_"), call);
});

// The server prose the core reads the slice from (patterns/mind.ts; graph @nks/nks-dev, node
// #9817): readiness's personal_mind sign and a search row, as the English LAB verstak server
// printed them (case #3255, 2026-11-06), plus a row with a fragment.
test("the mind patterns read the readiness sign and a search row", async () => {
  const { MIND_MISSING, MIND_PRESENT, MIND_ROW } = await import("../delivery/patterns/mind.ts");
  const ready =
    "Readiness of @lab-en (English Lab Person)\n  personal_mind «Personal memory» — present · scope: person · ready: yes\n";
  assert.ok(MIND_PRESENT.test(ready));
  assert.ok(!MIND_MISSING.test(ready));
  assert.ok(MIND_MISSING.test("  personal_mind «Personal memory» — missing · lacks: mind_realm"));
  const row = MIND_ROW.exec(
    "  🗺️ A short plan first (#3, phenomenon, Pt/Va/Ad, v1) — Before a task, a plan",
  );
  assert.deepEqual(row?.slice(1), ["🗺️ A short plan first", "3", "Before a task, a plan"]);
  const seen = MIND_ROW.exec(
    "  🗺️ A short plan before starting a task (#3, phenomenon, Pm/Va/Ad, v1)",
  );
  assert.deepEqual(seen?.slice(1, 3), ["🗺️ A short plan before starting a task", "3"]);
  assert.equal(MIND_ROW.exec("Found 1 nodes:"), null);
});

// The ledger rule (case #4238): movement goes as a line on the work's key, a say only to a named
// doer; the case server is to refuse a say with neither to nor in_reply_to where a person sits.
test("the launch and wake words send movement to a line, a word only addressed", () => {
  const entered = LAUNCH.en.entered("@a:b", "5");
  assert.match(entered, /partial/);
  assert.match(entered, /`to` the assigner/);
  assert.doesNotMatch(entered, /first message/);
  assert.match(entered, /a take card to you → answer it/);
  const listen = SATELLITE.en.listen(60);
  assert.match(listen, /partial line/);
  assert.match(listen, /a take card to you → answer it/);
  assert.match(listen, /`to` the assigner/);
  assert.doesNotMatch(listen, /first message/);
  const wake = TURN.en.wake();
  assert.match(wake, /line on its key/);
  assert.match(wake, /say `to`/);
  assert.doesNotMatch(wake, /ask\/say/);
});

// The marketplace is verstak-ai (.claude-plugin/marketplace.json, SETUP.md); SKILLS BEHIND and
// DELIVERY BEHIND print these as the next command (case #4475).
test("the plugin update commands name the verstak-ai marketplace, as SETUP.md does", () => {
  assert.equal(
    UPDATE.en.moveClaude(),
    "/plugin marketplace update verstak-ai, then /reload-plugins",
  );
  assert.equal(
    UPDATE.en.moveCodex(),
    "codex plugin marketplace upgrade verstak-ai, then codex plugin remove verstak@verstak-ai and codex plugin add verstak@verstak-ai",
  );
});

// The core passes "manifest" for every own set it does not update itself: another harness,
// Windows, updates disabled, a dev build, another server (js/bridge/skillcatchup.ts).
test("the catch-up notice gives the conditions of the automatic update, not an unproven manifest", () => {
  const w = SKILL_CATCHUP.en.notice("/r", "verstak-ai/skills", "1.0.0", "2.0.0", "manifest", "c");
  assert.doesNotMatch(w, /pinned file list|ownership/);
  for (const sign of [/OpenCode/, /Windows/, /release build/, /production server/, /disabled/])
    assert.match(w, sign);
});

test("a failed catch-up says partial files only where the update got as far as writing", () => {
  const w = SKILL_CATCHUP.en.failed("/r", "1.0.0", "2.0.0", "manifest", "c");
  assert.match(w, /if it got as far as writing/);
});

test("the write gate's refusal sends a role with no skills line to the explicit confirmation", async () => {
  const { CONTEXT_GATE } = await import("../delivery/context-gate.ts");
  const w = CONTEXT_GATE.en.refused;
  assert.match(w, /no `skills:` line/);
  assert.doesNotMatch(w, /If the loads are not observable/);
});
