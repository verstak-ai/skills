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
import { REPO } from "./built.mjs";

const DIR = join(REPO, "js", "delivery", "words");
const FILES = readdirSync(DIR).filter((f) => f.endsWith(".ts"));
const FOREIGN = new RegExp("\\p{Script=Cyrillic}|is" + "kron", "iu");

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
