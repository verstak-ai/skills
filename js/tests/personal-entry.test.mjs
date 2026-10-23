// Text contract, not an API or model run (graph @nks/nks-dev, node #8200).
// Every negative control removes a safety distinction from the actual carrier.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

import { REPO } from "./built.mjs";

const root = process.env.VERSTAK_MINDING_ROOT || REPO;
const files = {
  mind: "skills/verstak/methods/minding.md",
  reference: "skills/verstak/references/minding-personal-realm.md",
  onboarding: "skills/verstak/methods/onboarding.md",
  home: "home/minding/SKILL.md",
};
const texts = Object.fromEntries(
  Object.entries(files).map(([key, path]) => [key, readFileSync(join(root, path), "utf8")]),
);
const cases = [
  ["the address is always mind", "mind", "**The personal graph's address is always `mind`**"],
  [
    "no handle, no built or stored address",
    "mind",
    "never ask for a handle, build a full address or store one",
  ],
  ["the reference addresses mind the same way", "reference", "The address is always `mind`"],
  [
    "onboarding addresses mind the same way",
    "onboarding",
    "The personal graph's address is always `mind`",
  ],
  ["refusal is not absence", "mind", "An access or transport failure proves no absence"],
  ["missing role is not missing realm", "reference", "missing roles alone mean the graph exists"],
  [
    "repeat create rereads after conflict",
    "reference",
    "On a conflict (409), timeout or uncertain outcome, reread readiness before retrying",
  ],
  ["repeat role provisioning reuses", "reference", "reuse one that fits, never create a second"],
  [
    "no persistent locator",
    "mind",
    "never read or write special properties/attrs on profiles, graphs or nodes, config, agent memory or a redirect stub to find mind",
  ],
  [
    "no progress marker",
    "onboarding",
    "Never read or write profile, graph or node markers to assert progress",
  ],
  [
    "structural facts need no receipt",
    "onboarding",
    "Structural signs need existence and the appropriate ownership or user binding, not an additional receipt",
  ],
  [
    "another member cannot confer progress",
    "onboarding",
    "another person's role or receipt does not count for the current person",
  ],
  [
    "persona is not a progress predicate",
    "onboarding",
    "The companion's runtime `persona` is not an onboarding predicate",
  ],
  [
    "operational persona is preserved",
    "reference",
    "This attribute distinguishes the operational companion role for assistant receive/loop",
  ],
  [
    "cleanup requires provenance",
    "reference",
    "Only a record demonstrated by its creation history to be a locator or progress marker is a cleanup candidate",
  ],
  ["home carries the address rule", "home", "**The personal graph's address is always `mind`**"],
];

function checkClause(text, key, clause) {
  assert.ok(text.includes(clause), `${files[key]}: ${clause}`);
}

for (const [name, key, clause] of cases) {
  test(`personal entry text: ${name}`, () => {
    checkClause(texts[key], key, clause);
  });
  test(`negative control: deleting ${name} is detected`, () => {
    checkClause(texts[key], key, clause);
    assert.throws(() => checkClause(texts[key].replaceAll(clause, ""), key, clause), {
      code: "ERR_ASSERTION",
      message: `${files[key]}: ${clause}`,
    });
  });
}

// The personal graph is addressed as `mind` itself (graph @nks/nks-dev, node #2109): no
// placeholder standing for a looked-up link, no link recipe, no "someone else's mind" fork.
const stale =
  /@<?handle>?\/mind|\*\*stub at|\b(?:features\.)?items\[key=personal_mind\]|<personal graph>|artifact\.ref|foreign `?mind|Someone else's accessible `mind`/;
function checkRecipes(text, key) {
  assert.doesNotMatch(text, stale, key);
}
test("sources and home carry no constructed address, redirect recipe or assumed envelope", () => {
  for (const [key, text] of Object.entries(texts)) checkRecipes(text, key);
});
test("negative controls reject the old address and redirect recipe", () => {
  checkRecipes(texts.mind, "mind");
  for (const recipe of [
    'realm="@handle/mind"',
    "leave a **stub at the personal address",
    "features.items[key=personal_mind]",
    "verstak_orient(realm=<personal graph>)",
    "Take the `personal_mind` item's `artifact.ref` verbatim",
    "Never fall back to a foreign mind.",
    "Someone else's accessible `mind` never substitutes",
  ])
    assert.throws(() => checkRecipes(texts.mind + recipe, "mind"), { code: "ERR_ASSERTION" });
});
