// The root autoseat's cover in this delivery's form (the core's shared/cover.ts with our
// COVER): one English form — the keys 'Graph' and 'Agent role', the role name in straight
// double quotes, the same character opening and closing — and align's stamp. The sibling
// delivery shares the English keys, so its stamp marks its cover as foreign (graph
// @nks/nks-dev, nodes #8497, #8508). This repository's own AGENTS.md is the live cover: it must
// seat the session as role #8498 in @nks/nks-dev (graph @nks/nks-dev, node #8498).
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

import { COVER } from "../delivery/index.ts";
import { sameSeat } from "../opencode/rootseat-by.ts";
import { formOf, frontMatter, readCover, seatOfPairs, stampOf } from "../shared/cover.ts";
import { REPO } from "./built.mjs";

const seat = (yaml) => seatOfPairs(frontMatter(`---\n${yaml}\n---\n# x\n`));
const en = (role, graph = "'@nks/nks-dev (r5)'") =>
  seat(`'Graph': ${graph}\n'Agent role': ${role}`);
const NKS_931 = { realm: "@nks/nks-dev", karta: "931" };
const NKS_8498 = { realm: "@nks/nks-dev", karta: "8498" };

test("the delivery's cover form: AGENTS.md, one en form — Graph, Agent role, straight double quotes", () => {
  assert.equal(COVER.file, "AGENTS.md");
  assert.deepEqual(Object.keys(COVER.forms), ["en"]);
  const { stamp, ...keys } = COVER.forms.en;
  assert.deepEqual(keys, {
    graph: "Graph",
    graphJoins: ["or", "and", "Or", "And", "OR", "AND"],
    role: "Agent role",
    roleQuotes: ['"', '"'],
  });
  assert.ok(stamp instanceof RegExp);
  assert.ok(COVER.stampShape instanceof RegExp);
});

// The working graph is the slot's first address; prose after it names no candidate, and only
// a second equal graph joined by a separator or a joining word is ambiguity (graph @nks/nks-dev,
// node #8066).
test("the graph slot: prose after the working graph is no candidate, an equal graph is", () => {
  const role = `'#931 "dev"'`;
  for (const graph of [
    "'@nks/nks-dev (r5) — methodology @alari/methodology (r4), @nks/feedback not used'",
    "'`@nks/nks-dev` (`r5`); methodology — `@alari/methodology` (`r4`)'",
  ])
    assert.deepEqual(en(role, graph), { realm: "@nks/nks-dev", karta: "931" }, graph);
  for (const graph of [
    "'@a/x or @b/y'",
    "'@a/x and @b/y'",
    "'@a/x OR @b/y'",
    "'@a/x And @b/y'",
    "'r5 or @a/x'",
    "'@a/x, @b/y'",
  ])
    assert.ok("why" in en(role, graph), graph);
});

test("this repository's AGENTS.md seats role #8498 in @nks/nks-dev, not #1506 or #931 from the same line", () => {
  assert.deepEqual(readCover(REPO), NKS_8498);
});

test("same quotes: the name runs to the first closing one, the rest is prose", () => {
  assert.deepEqual(en(`'#931 "dev" — see "notes" and #1506'`), NKS_931);
  assert.deepEqual(en(`"#931 \\"dev\\" — steward of #1506"`), NKS_931);
  assert.deepEqual(en(`'#931 "dev"'`, "'r5'"), { realm: "r5", karta: "931" });
});

test("no seat: two roles, a bare reference, a missing slot, two graphs, no front matter", () => {
  assert.ok("why" in en(`'#931 "a" or #844 "b"'`), "two roles");
  assert.ok("why" in en(`'developer #931'`), "no reference at the start");
  assert.ok("why" in en(`'#931 dev'`), "no quoted name");
  assert.ok("why" in en(`'#931 "dev"'`, "'@a/b or @c/d'"), "two graphs");
  assert.ok("why" in seat(`'Graph': '@nks/nks-dev'`), "no role slot");
  assert.match(seat(`'Graph': '@nks/nks-dev'`).why, /no 'Agent role' slot/);
  assert.equal(frontMatter("# no front matter\n"), null);
});

test("no cover file — no word at all", () => {
  assert.equal(readCover(join(REPO, "js", "delivery")), null);
});

test("a short graph against a slug is no match on the role alone", () => {
  assert.equal(sameSeat({ name: "x", realm: "@nks/nks-dev", karta: "931" }, "r7", "931"), false);
  assert.equal(sameSeat({ name: "x", realm: "r5", karta: "931" }, "@nks/other", "931"), false);
  assert.equal(sameSeat({ name: "x", realm: "r5", karta: "931" }, "r7", "931"), false);
  assert.equal(sameSeat({ name: "x", realm: "r5", karta: "931" }, "r5", "931"), true);
  assert.equal(
    sameSeat({ name: "x", realm: "_nks_nks-dev", karta: "931" }, "@nks/nks-dev", "931"),
    false,
    "a sanitised slug is not the graph's address",
  );
});

// The sibling delivery's alignment command, built in two halves: its name stands nowhere in
// this repository's text. Its Russian words come as escapes for the same reason.
const SIBLING = "is" + "kronify";
const RU_CONTRACT = "\u043a\u043e\u043d\u0442\u0440\u0430\u043a\u0442";
const RU_STAMP = "\u0448\u0442\u0430\u043c\u043f";
const OWN = "*(verstak align: contract `5`, stamped `2026-10-22` — re-run when …)*";
const OWN_OLD = "*(verstakify: contract `2026-05-01` — re-run when …)*";
const FOREIGN_EN = `*(${SIBLING}: contract \`29\`, stamp \`2026-10-22\` — …)*`;
const FOREIGN_RU = `*(${SIBLING}: ${RU_CONTRACT} \`29\`, ${RU_STAMP} \`2026-10-22\` — …)*`;
const BODY = "---\n'Graph': '@tester/work (r1)'\n'Agent role': '#7 \"agent\"'\n---\n# agents\n";
const TESTER_7 = { realm: "@tester/work", karta: "7" };

test("the form's language is en; no form's keys — the reason names 'Graph'", () => {
  const of = (yaml) => formOf(frontMatter(`---\n${yaml}\n---\n`));
  assert.equal(of(`'Graph': 'r5'\n'Agent role': '#931 "dev"'`).lang, "en");
  assert.equal(of(`'Agent role': '#931 "dev"'`).lang, "en", "one key is enough for the form");
  const none = seat("Nature: library");
  assert.ok("why" in none && none.why.includes("'Graph'"), JSON.stringify(none));
});

test("stamp: ours in either generation, the sibling's in English or Russian, none — null", () => {
  assert.equal(stampOf(OWN), "own");
  assert.equal(stampOf(OWN_OLD), "own");
  assert.equal(stampOf(FOREIGN_EN), "foreign");
  assert.equal(stampOf(FOREIGN_RU), "foreign");
  assert.equal(stampOf("(otherkit: contract 3, stamp 2026-09-01)"), "foreign");
  assert.equal(stampOf("# agents\n"), null);
  assert.equal(stampOf(`${FOREIGN_EN}\n${OWN}\n`), "own", "our own stamp wins");
});

test("a stamp inside a prose line is no stamp", () => {
  const prose = `The rule follows the agreement (see ${SIBLING}: contract 29, stamp 2026-10-22).\n`;
  assert.equal(stampOf(prose), null);
  assert.equal(stampOf(`Their cover reads ${FOREIGN_EN}\n`), null);
});

// The three cases of the obligation's answer (graph @nks/nks-dev, node #8508).
test("cover under the shared English keys: no stamp — ours; the sibling's stamp — foreign; ours — seat", (t) => {
  const dir = mkdtempSync(join(tmpdir(), "cover-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const at = (text) => (writeFileSync(join(dir, "AGENTS.md"), text), readCover(dir));
  assert.deepEqual(at(BODY), TESTER_7, "no stamp — the keys decide");
  assert.deepEqual(
    at(`${BODY}\n${FOREIGN_EN}\n`),
    { foreign: true },
    "the sibling's English stamp",
  );
  assert.deepEqual(
    at(`${BODY}\n${FOREIGN_RU}\n`),
    { foreign: true },
    "the sibling's Russian stamp",
  );
  assert.deepEqual(at(`${BODY}\n${OWN}\n`), TESTER_7, "our stamp");
  assert.deepEqual(at(`${BODY}\n${OWN_OLD}\n`), TESTER_7, "our pre-contract stamp");
  assert.deepEqual(
    at(`${BODY}\nSee ${FOREIGN_EN} in their repository.\n`),
    TESTER_7,
    "the sibling's stamp inside prose",
  );
});
