// Local stop receipts shared by plugin and bridge (#9256). A phase is not a terminal success.
const ARCHIVE_CODES = ["archive_missing", "archive_refused", "archive_unconfirmed"];
const PHASES = new Set(["client_unbound", ...ARCHIVE_CODES.map((c) => `interrupt_confirmed_${c}`)]);
export const isHaltPhase = (code: string | null): boolean => code !== null && PHASES.has(code);
export const archivePhase = (code: string): string =>
  ARCHIVE_CODES.includes(code) ? `interrupt_confirmed_${code}` : code;
