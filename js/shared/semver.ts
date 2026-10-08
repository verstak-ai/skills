// Delivery version comparison: three dot-separated numbers as release-please stamps
// them; tails like `-rc1` are dropped.
export function parseVersion(v: string | null | undefined): [number, number, number] | null {
  const m = /^v?(\d+)\.(\d+)\.(\d+)/.exec((v ?? "").trim());
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null;
}

/** >0 — a is newer; <0 — b is newer; 0 — equal or either unreadable. */
export function compareVersions(
  a: string | null | undefined,
  b: string | null | undefined,
): number {
  const pa = parseVersion(a);
  const pb = parseVersion(b);
  if (!pa || !pb) return 0;
  for (let i = 0; i < 3; i++) if (pa[i] !== pb[i]) return pa[i] - pb[i];
  return 0;
}
