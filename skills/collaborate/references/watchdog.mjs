#!/usr/bin/env node
// node watchdog.mjs <socket-url>   — channel watchdog, no dependencies, Node 22+.
//
// Holds a doer's channel socket open and delivers every frame: prints each one
// on stdout, reopens on close, and tells a dead token from a rolling deploy.
// In Claude Code run it under Monitor with persistent: true — every printed
// line then arrives as an event in the doer's turn. On a harness without a
// built-in watcher, adapt per references/channel.md: exit on the first message
// frame instead of printing it (background output is pull-only there).
//
// Battle notes live in channel.md next to this file: why the attempt is timed
// from construction (never from onopen), why the pause never grows, and why
// three fast drops ask the version endpoint before blaming the token.
const url = process.argv[2], version = new URL(url).origin.replace('wss:', 'https:') + '/api/version';
let fastDrops = 0;
const log = (s) => process.stdout.write(s + '\n');
const serviceUp = () => fetch(version, { signal: AbortSignal.timeout(5000) })
  .then((r) => (r.ok ? r.json() : null)).catch(() => null);

function open() {
  const startedAt = Date.now();           // at construction, NOT in onopen — see channel.md
  const ws = new WebSocket(url);
  ws.addEventListener('message', (e) => log(typeof e.data === 'string' ? e.data : '[binary]'));
  ws.addEventListener('error', () => {}); // a close always follows
  ws.addEventListener('close', async (e) => {
    if ([4000, 4001, 4002].includes(e.code)) {
      return log(`WAKE: closed ${e.code} — token dead, call connect (mint on 4001)`); // and exit
    }
    fastDrops = Date.now() - startedAt < 5000 ? fastDrops + 1 : 0;
    if (fastDrops >= 3) {
      const up = await serviceUp();
      if (up) return log(`WAKE: drops while the service answers (${up.version}) — ask about the token`);
      log('service not answering — deployment rolling, holding the same token');
      fastDrops = 1;                      // an outage must not escalate into a token question
    }
    setTimeout(open, e.code === 4003 ? 3000 : 2000);
  });
}
open();
