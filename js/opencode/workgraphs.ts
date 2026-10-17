// Account-wide quiet: a known working graph or an answered but unsupported detector.
import { createHash, randomUUID } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, unlinkSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { DEFAULT_SERVER_URL, envName, GLOBAL_PREFIX } from "../delivery/index.ts";
import { authDir } from "./bridge-io.ts";

const TTL_MS = 15 * 60_000;
const hash = (text: string): string => createHash("sha256").update(text).digest("hex");
const read = (file: string): string => {
  try {
    return readFileSync(file, "utf8").trim();
  } catch {
    return "";
  }
};
export type SilenceReason = "work-graph" | "unsupported";
type Mark = { at: number; reason: SilenceReason };
const registry = (): Map<string, Mark | number> => {
  const root = globalThis as typeof globalThis & Record<string, unknown>;
  return (root[`${GLOBAL_PREFIX}WorkGraphs`] ??= new Map<string, Mark | number>()) as Map<
    string,
    Mark | number
  >;
};

/** Server + grant directory + credential fingerprint. A changed grant is a safe cache miss. */
function address(): { file: string; account: string; key: string } | null {
  try {
    const dir = resolve(authDir());
    const server = new URL(
      process.env[envName("BRIDGE_URL")]?.trim() || read(join(dir, "server")) || DEFAULT_SERVER_URL,
    );
    const identity = server.origin + server.pathname;
    let credential = process.env[envName("BRIDGE_TOKEN")]?.trim() || read(join(dir, "token"));
    if (!credential) {
      // Grant store's existing layout (bridge/store.ts): one file per origin+path.
      const suffix = createHash("sha256").update(identity).digest("base64url").slice(0, 10);
      const tokens = JSON.parse(read(join(dir, `${server.hostname}_${suffix}.json`))).tokens;
      if (
        !tokens ||
        typeof tokens !== "object" ||
        typeof tokens.access_token !== "string" ||
        !tokens.access_token
      )
        return null;
      credential = JSON.stringify(tokens);
    }
    const account = hash(credential);
    const file = join(dir, `opencode-work-graphs.${hash(identity).slice(0, 16)}.cache`);
    return { file, account, key: `${file}:${account}` };
  } catch {
    return null;
  }
}

const fresh = (at: unknown): at is number =>
  typeof at === "number" && at <= Date.now() && Date.now() - at < TTL_MS;

export function knownStartupSilence(): boolean {
  const a = address();
  if (!a) return false;
  const memory = registry().get(a.key);
  if (fresh(typeof memory === "number" ? memory : memory?.at)) return true;
  try {
    const mark = JSON.parse(read(a.file));
    if (mark.account !== a.account || !fresh(mark.at)) return false;
    const reason =
      mark.version === 1 && mark.has_work_graph === true
        ? "work-graph"
        : mark.version === 2
          ? mark.reason
          : null;
    if (reason !== "work-graph" && reason !== "unsupported") return false;
    registry().set(a.key, { at: mark.at, reason });
    return true;
  } catch {
    return false;
  }
}

/** True and transport-unknown are never retained; the marker carries no credentials or names. */
export function rememberStartupSilence(reason: SilenceReason = "work-graph"): void {
  const a = address();
  if (!a) return;
  const at = Date.now();
  registry().set(a.key, { at, reason });
  const tmp = `${a.file}.${process.pid}.${randomUUID()}.tmp`;
  try {
    mkdirSync(authDir(), { recursive: true, mode: 0o700 });
    writeFileSync(tmp, JSON.stringify({ version: 2, account: a.account, at, reason }), {
      mode: 0o600,
    });
    renameSync(tmp, a.file);
  } catch {
    try {
      unlinkSync(tmp);
    } catch {
      /* A cache refusal does not delay a prompt. */
    }
  }
}
