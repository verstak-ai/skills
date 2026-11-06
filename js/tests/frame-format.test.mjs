// Core v7.33 line (graph @nks/nks-dev, nodes #9654, #9674): compact counts only for a reader that
// declares the compact-counts capability, version 1, per session — the sibling's probe, word-free.
import assert from "node:assert/strict";
import { test } from "node:test";

import { compactCounts, negotiateCounts } from "../shared/frame-format.ts";
import { newScope, runIn } from "../shared/scope.ts";

test("compact counts require the exact reader capability, not a newer client version", () => {
  for (const support of [
    undefined,
    null,
    true,
    {},
    { version: "1" },
    { version: 0 },
    { version: 2 },
  ]) {
    negotiateCounts({
      clientInfo: { version: "99.0.0" },
      capabilities: { experimental: { "compact-counts": support } },
    });
    assert.equal(compactCounts(), false);
  }
  negotiateCounts({ capabilities: { experimental: { "compact-counts": { version: 1 } } } });
  assert.equal(compactCounts(), true);
  negotiateCounts(null);
  assert.equal(compactCounts(), false, "a new unproved handshake resets the format");
});

test("a daemon's reader formats belong to their sessions", () => {
  const origin = { env: {}, cwd: "/", pid: 1, path: "probe" };
  const old = newScope("old", origin, () => false);
  const fresh = newScope("fresh", origin, () => false);
  runIn(old, () => {
    negotiateCounts({});
    runIn(fresh, () => {
      negotiateCounts({ capabilities: { experimental: { "compact-counts": { version: 1 } } } });
      assert.equal(compactCounts(), true);
    });
    assert.equal(compactCounts(), false);
  });
  runIn(fresh, () => assert.equal(compactCounts(), true));
});
