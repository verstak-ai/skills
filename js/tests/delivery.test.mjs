// The delivery layer's own contracts: one version, stamped in one place and mirrored
// by the plugin manifest; the channel mark in the build; the satellite entry code
// launching this delivery's home bridge; the server address and names it ships.
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

import { DEFAULT_LANG, langOfServer, LANGS } from "../delivery/lang.ts";
import {
  BRIDGE_FILE,
  BRIDGE_NAME,
  DEFAULT_SERVER_URL,
  HOME_BRIDGE_FILE,
  HOME_DIR,
  PRODUCT,
  SATELLITE_CODE,
} from "../delivery/product.ts";
import { FRAME_MARK, serverProtocol, STRUCTURED_CAPABILITY, tool } from "../delivery/protocol.ts";
import { versionIn } from "../shared/version.ts";
import { BUILT_BRIDGE, REPO } from "./built.mjs";

const SOURCE = "js/delivery/version.ts";
const read = (rel) => readFileSync(join(REPO, rel), "utf8");
const source = read(SOURCE);

function tsFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory()
      ? e.name === "node_modules"
        ? []
        : tsFiles(join(dir, e.name))
      : e.name.endsWith(".ts")
        ? [join(dir, e.name)]
        : [],
  );
}

test("release-please stamps the version in the delivery layer and nowhere else in js/", () => {
  const config = JSON.parse(read("release-please-config.json"));
  const generic = config.packages["."]["extra-files"]
    .filter((f) => f.path.startsWith("js/"))
    .map((f) => f.path);
  assert.deepEqual(generic, [SOURCE]);
  assert.match(source, /^export const VERSION = "\d+\.\d+\.\d+"; \/\/ x-release-please-version$/m);
  const stamped = tsFiles(join(REPO, "js")).filter((f) =>
    readFileSync(f, "utf8").includes("x-release-please-version"),
  );
  assert.deepEqual(stamped, [join(REPO, SOURCE)]);
});

test("the built bridge carries the plugin's version and the dev channel mark", () => {
  const version = /^export const VERSION = "([^"]+)"/m.exec(source)[1];
  const mark = /^export const CHANNEL_MARK: string = "([^"]+)";$/m.exec(source)[1];
  const name = /^export const BUILD_MARK = "([^"]+)";$/m.exec(source)[1];
  assert.equal(mark, `${name}:dev`);
  assert.equal(name, `${PRODUCT}-build`);
  assert.equal(version, JSON.parse(read(".claude-plugin/plugin.json")).version);
  const bridge = readFileSync(BUILT_BRIDGE, "utf8");
  assert.match(bridge, new RegExp(`^var VERSION = "${version.replaceAll(".", "\\.")}";`, "m"));
  assert.ok(bridge.includes(`"${mark}"`), `the dev bridge must carry ${mark}`);
});

test("versionIn reads this delivery's bridge and not another's", () => {
  const text = (mark) => `const VERSION = "9.9.9";\n${mark ? `var CHANNEL_MARK = "${mark}";` : ""}`;
  assert.equal(versionIn(text("other-build:release")), null, "another product's release");
  assert.equal(versionIn(text("other-build:dev")), null, "another product's dev build");
  assert.equal(versionIn(text(`${PRODUCT}-build:release`)), "9.9.9", "this product's release");
  assert.equal(versionIn(text(`${PRODUCT}-build:dev`)), "9.9.9", "this product's dev build");
  assert.equal(versionIn(text("")), "9.9.9", "the single-file bridge, released without a mark");
});

test("the satellite entry code launches this delivery's home bridge", () => {
  assert.ok(
    SATELLITE_CODE.includes(`homedir(),'${HOME_DIR}','${HOME_BRIDGE_FILE}')`),
    `SATELLITE_CODE must join ${HOME_DIR}/${HOME_BRIDGE_FILE}: ${SATELLITE_CODE}`,
  );
});

test("the names our skills write stay the bridge's names", () => {
  assert.equal(BRIDGE_NAME, "verstak-bridge");
  assert.equal(HOME_DIR, ".verstak-bridge");
  assert.equal(HOME_BRIDGE_FILE, "verstak-bridge.mjs");
  assert.equal(BRIDGE_FILE, "verstak-bridge.mjs");
  assert.equal(tool("stand"), "verstak_stand");
  assert.equal(DEFAULT_SERVER_URL, "https://mcp.verstak.ai/");
  assert.equal(STRUCTURED_CAPABILITY, "verstak/structured");
  assert.equal(serverProtocol.refusal, "verstak/refusal");
  assert.equal(FRAME_MARK, "[verstak]");
});

test("one language, whatever the server", () => {
  assert.deepEqual([...LANGS], ["en"]);
  assert.equal(DEFAULT_LANG, "en");
  for (const url of [DEFAULT_SERVER_URL, "https://example.org/mcp", "not a url"])
    assert.equal(langOfServer(url), "en");
});

test("the launch line has this delivery's own word: the sibling's line does not raise this plugin", async () => {
  const { LAUNCH_LINE, LAUNCH_WORD } = await import("../delivery/patterns/launch.ts");
  assert.notEqual(LAUNCH_WORD, "start", "the sibling delivery's launch word");
  assert.match(`${LAUNCH_WORD} @o/g #931 case #12 from @a:b`, LAUNCH_LINE);
  assert.doesNotMatch("start @o/g #931 case #12", LAUNCH_LINE);
  assert.doesNotMatch("Verstak review PR #143", LAUNCH_LINE);
  const spelled = [];
  for (const f of [
    "skills/verstak/SKILL.md",
    ...readdirSync(join(REPO, "skills/verstak/methods")).map((n) => `skills/verstak/methods/${n}`),
    ...readdirSync(join(REPO, "skills/verstak/references")).map(
      (n) => `skills/verstak/references/${n}`,
    ),
    ".claude/settings.json",
  ]) {
    for (const m of read(f).matchAll(
      /\b(\w+) (?:<graph>|graph|GRAPH) (?:<role>|role|ROLE) case #N/g,
    ))
      spelled.push(`${f}: ${m[1]}`);
  }
  assert.ok(spelled.length > 0);
  assert.deepEqual(
    spelled.filter((s) => !s.endsWith(`: ${LAUNCH_WORD}`)),
    [],
  );
});
