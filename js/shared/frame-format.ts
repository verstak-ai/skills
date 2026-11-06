// Reader support, per bridge session (graph @nks/nks-dev, nodes #9345, #9674).
import { scoped } from "./scope.ts";

export const COMPACT_COUNTS_CAPABILITY = "compact-counts";
export const COMPACT_COUNTS = { [COMPACT_COUNTS_CAPABILITY]: { version: 1 } };
const format = scoped(() => ({ compact: true }));

export const compactCounts = (): boolean => format.compact;
export const setCompactCounts = (compact: boolean): void => {
  format.compact = compact;
};

/** Unknown readers are not upgraded by the daemon's own version. */
export function negotiateCounts<T>(params: T): T {
  const p = params as { capabilities?: { experimental?: Record<string, unknown> } } | null;
  const support = p?.capabilities?.experimental?.[COMPACT_COUNTS_CAPABILITY];
  setCompactCounts(
    !!support && typeof support === "object" && "version" in support && support.version === 1,
  );
  return params;
}
