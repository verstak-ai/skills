// The machine survey of the status command (graph @nks/nks-dev, nodes #7494, #7495).
import type { Lang } from "../lang.ts";

export interface MachineStatusWords {
  daemon: () => string;
  absent: () => string;
  unavailable: () => string;
  missing: () => string;
  protocol: () => string;
  refused: () => string;
  snapshotFailed: () => string;
  sessions: () => string;
  fallback: () => string;
  disk: () => string;
  record: () => string;
  left: (left: boolean) => string;
  attached: () => string;
  detached: () => string;
  primary: () => string;
  beside: () => string;
  satellite: () => string;
  listening: () => string;
  silent: () => string;
  lastWork: () => string;
  unknown: () => string;
}
export const MACHINE_STATUS: Readonly<Record<Lang, MachineStatusWords>> = {
  en: {
    daemon: () => "daemon",
    absent: () => "daemon: no answer",
    unavailable: () => "session snapshot unavailable: older daemon build",
    missing: () => "daemon: directory does not exist",
    protocol: () => "daemon: different protocol",
    refused: () => "daemon: refused",
    snapshotFailed: () => "session snapshot unavailable: snapshot failed",
    sessions: () => "Sessions",
    fallback: () => "Bridges outside the daemon",
    disk: () => "Disk records outside the daemon snapshot",
    record: () => "record, liveness unknown",
    left: (left) => (left ? "left" : "not left"),
    attached: () => "attached",
    detached: () => "detached",
    primary: () => "primary",
    beside: () => "beside",
    satellite: () => "satellite",
    listening: () => "listening",
    silent: () => "not listening",
    lastWork: () => "last graph call",
    unknown: () => "not observed",
  },
};
