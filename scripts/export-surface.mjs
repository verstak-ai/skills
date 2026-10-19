#!/usr/bin/env node
// Regenerate fixtures/surface.json — the committed snapshot of the verstak tool
// surface that `make check-surface` lints the corpus against.
//
// Two sources, one snapshot shape:
//   node scripts/export-surface.mjs --asset FILE [server-url]
//     the versioned source: the surface-verstak-en.json asset nks-mcp publishes on
//     each release tag verstak-v<version> ({serverInfo, protocolVersion, tools}, the
//     raw tools/list); `make surface-asset V=<version>` downloads it and runs this.
//   node scripts/export-surface.mjs [server-url]
//     the fallback: the live server's tools/list (needs network + an authorized grant),
//     spoken to through the delivery's own bridge
//     (skills/verstak/scripts/verstak-bridge.mjs), so auth, refresh and liveness are
//     the bridge's problem, not this script's.
//
// Either list then passes the bridge's own harness layer, imported from its source
// (js/bridge/moment.ts annotateToolList, js/bridge/narrow.ts narrowToolList; needs
// `make deps` for esbuild): the stand tool in, the channel's seat moves out — the
// snapshot is the surface a harness sees.
import { spawn } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const argv = process.argv.slice(2);
const assetAt = argv.indexOf("--asset");
const asset = assetAt >= 0 ? argv.splice(assetAt, 2)[1] : null;
if (assetAt >= 0 && !asset) throw new Error("--asset needs a file");
const serverUrl = argv[0] || "https://mcp.verstak.ai/";

/** The raw list from the tagged asset: {server, protocolVersion, tools}. */
function fromAsset(file) {
  const a = JSON.parse(readFileSync(file, "utf8"));
  if (!a?.serverInfo?.version || !Array.isArray(a.tools))
    throw new Error(`${file}: not a surface asset (serverInfo.version, tools[])`);
  return { server: a.serverInfo, protocolVersion: a.protocolVersion ?? null, tools: a.tools };
}

/** The raw list from the live server, through the bundled bridge. */
async function fromLive(url) {
  const bridge = join(root, "skills/verstak/scripts/verstak-bridge.mjs");
  const child = spawn("node", [bridge, url], { stdio: ["pipe", "pipe", "inherit"] });
  const replies = new Map();
  let buf = "";
  child.stdout.on("data", (d) => {
    buf += d;
    let i;
    while ((i = buf.indexOf("\n")) !== -1) {
      const line = buf.slice(0, i); buf = buf.slice(i + 1);
      try { const m = JSON.parse(line); if (m.id !== undefined) replies.set(m.id, m); } catch {}
    }
  });
  const send = (m) => child.stdin.write(JSON.stringify(m) + "\n");
  const wait = async (id, ms = 120_000) => {
    const t0 = Date.now();
    while (Date.now() - t0 < ms) {
      if (replies.has(id)) return replies.get(id);
      await new Promise((r) => setTimeout(r, 100));
    }
    throw new Error(`no reply for ${id}`);
  };

  // clientInfo.name "export-surface" is the bridge's SURFACE_CLIENT (js/shared/clients.ts):
  // it gets the raw list, unnarrowed, and waits out a login instead of a cached answer.
  send({ jsonrpc: "2.0", id: 1, method: "initialize", params: {
    protocolVersion: "2025-06-18", capabilities: {},
    clientInfo: { name: "export-surface", version: "0" } } });
  const init = await wait(1);
  if (init.error) throw new Error(`initialize failed: ${JSON.stringify(init.error)}`);
  send({ jsonrpc: "2.0", method: "notifications/initialized" });

  const tools = [];
  let cursor;
  let id = 2;
  do {
    send({ jsonrpc: "2.0", id, method: "tools/list", params: cursor ? { cursor } : {} });
    const res = await wait(id++);
    if (res.error) throw new Error(`tools/list failed: ${JSON.stringify(res.error)}`);
    tools.push(...res.result.tools);
    cursor = res.result.nextCursor;
  } while (cursor);
  child.stdin.end();
  return {
    server: init.result?.serverInfo ?? null,
    protocolVersion: init.result?.protocolVersion ?? null,
    tools,
  };
}

/** The bridge's harness layer, bundled from its TS source by the build's own esbuild. */
async function bridgeLayer() {
  const esbuild = createRequire(join(root, "js/package.json"))("esbuild");
  const r = await esbuild.build({
    stdin: {
      contents: 'export { annotateToolList } from "./moment.ts";\nexport { narrowToolList } from "./narrow.ts";\n',
      resolveDir: join(root, "js/bridge"),
      loader: "ts",
    },
    bundle: true, write: false, platform: "node", format: "esm", target: "node22", logLevel: "silent",
  });
  const dir = mkdtempSync(join(tmpdir(), "export-surface-"));
  try {
    const file = join(dir, "layer.mjs");
    writeFileSync(file, r.outputFiles[0].text);
    return await import(pathToFileURL(file).href);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

const raw = asset ? fromAsset(asset) : await fromLive(serverUrl);
const { annotateToolList, narrowToolList } = await bridgeLayer();
const reply = { jsonrpc: "2.0", id: 0, result: { tools: structuredClone(raw.tools) } };
annotateToolList(reply);
const tools = narrowToolList(reply).result.tools;

// Merge every enum-carrying property across all tool input schemas: one
// vocabulary per property name (union — a property may legitimately differ in
// subsets per tool; the lint asks membership, not exactness).
const enums = {};
const walk = (schema, name) => {
  if (!schema || typeof schema !== "object") return;
  if (Array.isArray(schema.enum) && name) {
    enums[name] = [...new Set([...(enums[name] || []), ...schema.enum])].sort();
  }
  for (const [k, v] of Object.entries(schema.properties || {})) walk(v, k);
  if (schema.items) walk(schema.items, name);
  for (const sub of ["anyOf", "oneOf", "allOf"]) (schema[sub] || []).forEach((v) => walk(v, name));
};
for (const t of tools) walk(t.inputSchema, null);

// Each tool's top-level argument names, as the harness sees them.
const params = Object.fromEntries(
  tools
    .map((t) => [t.name, Object.keys(t.inputSchema?.properties || {}).sort()])
    .sort(([a], [b]) => a.localeCompare(b)),
);

const surface = {
  server: raw.server,
  protocolVersion: raw.protocolVersion,
  resource: serverUrl.replace(/\/$/, ""),
  tools: tools.map((t) => t.name).sort(),
  enums,
  params,
};
const out = join(root, "fixtures/surface.json");
writeFileSync(out, JSON.stringify(surface, null, 2) + "\n");
console.log(`wrote ${out} (${asset ? `asset ${asset}` : `live ${serverUrl}`}, server ${raw.server?.version}): ${surface.tools.length} tools, ${Object.keys(enums).length} enum vocabularies, ${Object.keys(params).length} parameter lists`);
