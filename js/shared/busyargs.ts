// Which stand call the bridge runs as busy-only (graph @nks/nks-dev, node #6509):
// one truth for the bridge (bridge/status.ts) and the OpenCode plugin
// (opencode/satellite.ts). Any other set argument means taking the seat.

/** Arguments of a busy-only call; satellite_of and cwd are filled in by the OpenCode plugin. */
export const STATUS_ONLY_ARGS: ReadonlySet<string> = new Set([
  "realm",
  "karta",
  "name",
  "cwd",
  "status",
  "satellite_of",
]);

const unset = (v: unknown): boolean => v == null || v === false || v === "";

/** Set arguments outside the busy-only list — they take the full seat-taking path. */
export const takingArgs = (args: Record<string, unknown>): string[] =>
  Object.keys(args).filter((k) => !STATUS_ONLY_ARGS.has(k) && !unset(args[k]));
