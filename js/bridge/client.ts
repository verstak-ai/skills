// Who shook hands with the bridge — the harness name from clientInfo.name (graph
// @nks/nks-dev, nodes #5047, #4895): it tells whether frames arrive as notifications
// (pi, OpenCode) or only via the local watchdog (Claude Code, Codex).
import { HARNESS_VERSION_ENV, HOSTED_CLIENTS, NOTIFIED_CLIENTS } from "../shared/clients.ts";
import { envOf } from "../shared/scope.ts";
import { state } from "./transport.ts";

const clientInfo = (): { name?: unknown; version?: unknown } | undefined =>
  (state.initParams as { clientInfo?: { name?: unknown; version?: unknown } } | null)?.clientInfo;

/** Empty until the handshake. */
export function harnessName(): string {
  const info = clientInfo();
  return typeof info?.name === "string" ? info.name : "";
}

/**
 * The host's version in its own words (graph @nks/nks-dev, node #6226): handshake
 * clientInfo.version, or the environment for hosted clients; else "unknown".
 */
export function harnessVersion(): string {
  const v = HOSTED_CLIENTS.has(harnessName())
    ? envOf(HARNESS_VERSION_ENV) // the session's environment, not the daemon's
    : clientInfo()?.version;
  return typeof v === "string" && v.trim() ? v.trim() : "unknown";
}

/** Frames reach this harness as MCP notifications, not via the local watchdog. */
export const notifiedClient = (): boolean => NOTIFIED_CLIENTS.has(harnessName());
