// The root autoseat's cover in this delivery's form (the core's shared/cover.ts with our
// COVER): the keys 'Graph' and 'Agent role', the role name in straight double quotes,
// the same character opening and closing. This repository's own AGENTS.md is the live
// cover: it must seat the session as role #931 in @nks/nks-dev (graph @nks/nks-dev,
// node #931).
import assert from "node:assert/strict";
import { join } from "node:path";
import { test } from "node:test";

import { COVER } from "../delivery/index.ts";
import { frontMatter, readCover, seatOfPairs } from "../shared/cover.ts";
import { REPO } from "./built.mjs";

const seat = (yaml) => seatOfPairs(frontMatter(`---\n${yaml}\n---\n# x\n`));
const en = (role, graph = "'@nks/nks-dev (r5)'") =>
  seat(`'Graph': ${graph}\n'Agent role': ${role}`);
const NKS_931 = { realm: "@nks/nks-dev", karta: "931" };

test("the delivery's cover form: AGENTS.md, Graph, Agent role, straight double quotes", () => {
  assert.deepEqual(COVER, {
    file: "AGENTS.md",
    graph: "Graph",
    role: "Agent role",
    roleQuotes: ['"', '"'],
  });
});

test("this repository's AGENTS.md seats role #931 in @nks/nks-dev, not #1506 from the same line", () => {
  assert.deepEqual(readCover(REPO), NKS_931);
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
