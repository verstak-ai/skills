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
  [
    "owned mind uses the API link",
    "mind",
    "Take the `personal_mind` item's `artifact.ref` verbatim",
  ],
  ["foreign mind is no fallback", "mind", "Someone else's accessible `mind` never substitutes"],
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
  ["home carries the ownership fork", "home", "Someone else's accessible `mind` never substitutes"],
];

for (const [name, key, clause] of cases) {
  test(`personal entry text: ${name}`, () => {
    assert.ok(texts[key].includes(clause), `${files[key]}: ${clause}`);
  });
  test(`negative control: deleting ${name} is detected`, () => {
    assert.ok(texts[key].includes(clause), "control needs the original clause");
    assert.equal(texts[key].replaceAll(clause, "").includes(clause), false);
  });
}

const stale = /@<?handle>?\/mind|\*\*stub at|\b(?:features\.)?items\[key=personal_mind\]/;
test("sources and home carry no constructed address, redirect recipe or assumed envelope", () => {
  for (const [key, text] of Object.entries(texts)) assert.doesNotMatch(text, stale, key);
});
test("negative controls reject the old address and redirect recipe", () => {
  for (const recipe of ['realm="@handle/mind"', "leave a **stub at the personal address"])
    assert.match(texts.mind + recipe, stale);
});
