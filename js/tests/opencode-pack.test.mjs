// The OpenCode npm archive (scripts/pack-opencode.mjs) over the committed outputs: three
// files under package/, the manifest as the release publishes it, both scripts byte for
// byte the committed release build. Packs into a temporary directory, never dist/.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { test } from "node:test";

import { REPO } from "./built.mjs";

const VERSION = /^export const VERSION = "([^"]+)";/m.exec(
  readFileSync(join(REPO, "js/delivery/version.ts"), "utf8"),
)[1];

test("the OpenCode archive carries exactly the manifest, the plugin and the bridge", (t) => {
  const out = mkdtempSync(join(tmpdir(), "verstak-pack-"));
  t.after(() => rmSync(out, { recursive: true, force: true }));
  const script = join(REPO, "scripts/pack-opencode.mjs");
  assert.ok(existsSync(script), "scripts/pack-opencode.mjs exists");
  const r = spawnSync(process.execPath, [script, "--out", out], { encoding: "utf8" });
  assert.equal(r.status, 0, r.stderr);
  const tgz = r.stdout.trim().split("\n").pop();
  assert.equal(basename(tgz), `verstak-opencode-${VERSION}.tgz`);
  assert.ok(existsSync(tgz));

  const list = spawnSync("tar", ["tzf", tgz], { encoding: "utf8" });
  assert.equal(list.status, 0, list.stderr);
  assert.deepEqual(list.stdout.trim().split("\n").sort(), [
    "package/index.js",
    "package/package.json",
    "package/verstak-bridge.mjs",
  ]);

  const x = join(out, "x");
  mkdirSync(x);
  const unpack = spawnSync("tar", ["xzf", tgz, "-C", x], { encoding: "utf8" });
  assert.equal(unpack.status, 0, unpack.stderr);
  const manifest = JSON.parse(readFileSync(join(x, "package/package.json"), "utf8"));
  assert.deepEqual(manifest, {
    name: "@verstak/opencode",
    version: VERSION,
    type: "module",
    main: "./index.js",
    exports: { ".": "./index.js" },
    files: ["index.js", "verstak-bridge.mjs"],
    repository: { type: "git", url: "git+https://github.com/verstak-ai/skills.git" },
  });
  for (const key of ["scripts", "dependencies", "devDependencies", "optionalDependencies"])
    assert.equal(key in manifest, false, key);
  assert.ok(
    readFileSync(join(x, "package/index.js")).equals(
      readFileSync(join(REPO, "skills/verstak/scripts/opencode-plugin.js")),
    ),
    "index.js is the committed opencode-plugin.js",
  );
  assert.ok(
    readFileSync(join(x, "package/verstak-bridge.mjs")).equals(
      readFileSync(join(REPO, "skills/verstak/scripts/verstak-bridge.mjs")),
    ),
    "verstak-bridge.mjs is the committed bridge",
  );
});
