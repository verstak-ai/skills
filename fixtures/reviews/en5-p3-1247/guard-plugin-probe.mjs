// Observe the published template's before-hook without OpenCode or model calls.
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';

assert.ok(process.argv[2], 'pass the candidate worktree');
const root = resolve(process.argv[2]);
const text = readFileSync(join(root, 'skills/verstak/references/align-harness-surfaces.md'), 'utf8');
const source = text.match(/```js\n([\s\S]*?)\n```/)[1];
const plugin = (await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`)).default;
const scratch = mkdtempSync(join(tmpdir(), 'en-guard-p3-'));
let cleanup;
try {
  const hooks = new Map();
  cleanup = await plugin.setup({
    location: { directory: scratch },
    session: { get: async () => ({ location: { directory: scratch } }) },
    tool: { hook: async (name, callback) => { hooks.set(name, callback); } },
    event: { subscribe: async function* () {} },
  });
  const before = hooks.get('execute.before');
  assert.equal(typeof before, 'function');
  await assert.rejects(
    before({ tool: 'write', sessionID: 'guard-probe', input: { path: join(scratch, '.claude/projects/probe/memory/note.md') } }),
    (error) => {
      assert.match(error.message, /BLOCKED/);
      assert.match(error.message, /minding/);
      assert.doesNotMatch(error.message, /@[^\s"'`]*\/mind\b/);
      return true;
    },
  );
  await assert.doesNotReject(before({ tool: 'write', sessionID: 'guard-probe', input: { path: join(scratch, 'src/example.js') } }));
  console.log('PASS: template before-hook rejects memory, resolves repository path; refusal routes to minding without locator. No write tool or live harness called.');
} finally {
  cleanup?.();
  rmSync(scratch, { recursive: true, force: true });
}
