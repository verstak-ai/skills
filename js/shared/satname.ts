// Satellite seat name (graph @nks/nks-dev, node #6002) — one rule for the bridge that
// picks it (bridge/satellite.ts) and the OpenCode plugin that recognises it
// (opencode/satellite.ts): the caller's seat name, cut from the end, then `.sub-<N>`.

/** Server limit on a standing name (observed by a 400 refusal). */
export const NAME_MAX = 48;

export const SUB_RE = /\.sub-([1-9]\d*)$/;

/** Satellite name number n; the base is cut from the end to fit the limit. */
export const satelliteName = (base: string, n: number): string =>
  base.slice(0, NAME_MAX - `.sub-${n}`.length).replace(/[-._]+$/, "") + `.sub-${n}`;

/** Whether name is a satellite of this base (any number). */
export function isSatelliteOf(base: string, name: string): boolean {
  const m = SUB_RE.exec(name);
  return !!m && satelliteName(base, Number(m[1])) === name;
}
