// The root autoseat's cover in this delivery's form (the core's shared/cover.ts with our
// COVER): the keys 'Graph' and 'Agent role', the role name in straight double quotes,
// the same character opening and closing. This repository's own AGENTS.md is the live
// cover: it must seat the session as role #8498 in @nks/nks-dev (graph @nks/nks-dev,
// node #8498).
import assert from "node:assert/strict";
import { join } from "node:path";
import { test } from "node:test";

import { COVER } from "../delivery/index.ts";
import { sameSeat } from "../opencode/rootseat-by.ts";
import { frontMatter, readCover, seatOfPairs } from "../shared/cover.ts";
import { REPO } from "./built.mjs";

const seat = (yaml) => seatOfPairs(frontMatter(`---\n${yaml}\n---\n# x\n`));
const en = (role, graph = "'@nks/nks-dev (r5)'") =>
  seat(`'Graph': ${graph}\n'Agent role': ${role}`);
const NKS_931 = { realm: "@nks/nks-dev", karta: "931" };
const NKS_8498 = { realm: "@nks/nks-dev", karta: "8498" };

test("the delivery's cover form: AGENTS.md, Graph, Agent role, straight double quotes", () => {
  assert.deepEqual(COVER, {
    file: "AGENTS.md",
    graph: "Graph",
    graphJoins: ["or", "and", "Or", "And", "OR", "AND"],
    role: "Agent role",
    roleQuotes: ['"', '"'],
  });
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
