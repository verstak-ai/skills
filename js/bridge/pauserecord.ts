// A satellite's pause and its record (graph nks-dev: #6625; #6550): the pause keeps
// seat and cases for the bridge that resumes by the record key (resume.ts).
// `suspend` — the harness's word (suspend.ts); `handover` — a daemon handover while
// the thin bridge lives (daemon.ts), ended unreturned by runend.ts.
import { scoped } from "../shared/scope.ts";
import { joinedCases } from "./caseexit.ts";
import { harnessName } from "./client.ts";
import { CFG } from "./config.ts";
import { sessionOfBridge, writeHoldRecord } from "./holdrecord.ts";
import { H } from "./holdstate.ts";
import { log } from "./streams.ts";
import { state } from "./transport.ts";

export type PauseKind = "suspend" | "handover";

export const P = scoped(() => ({
  kind: null as PauseKind | null,
  /** the pause answer for a repeated request (already paused, seat released) */
  answer: null as { key: string; cases: number } | null,
  /** the address turned by the re-arm connect (a lost ceiling too) */
  turned: null as { url: string; statusUrl: string | null } | null,
  /** the address last written into the pause record */
  written: "",
  write: null as (() => void) | null,
  connect: null as Promise<unknown> | null,
}));

/** Paused: the bridge's end is not the run's end (session.ts). */
export const suspended = (): boolean => P.kind !== null;

/** The seat key of a handover pause, or null. */
export const handoverPauseKey = (): string | null =>
  P.kind === "handover" ? (P.answer?.key ?? null) : null;

/**
 * Daemon handover while the satellite bridge lives (daemon.ts): the socket is neither
 * parked nor re-armed — the handover holds it until the successor evicts it (handoff.ts).
 */
export function pauseForHandover(why: string): void {
  if (P.kind) return;
  const key = pauseRecord("handover");
  if (key)
    log(
      `satellite paused for the daemon handover (${why}): ${key}, cases ${P.answer?.cases ?? 0} — place and cases kept`,
    );
}

/** The satellite seat's pause record, address and cases fresh on each write. The key or null. */
export function pauseRecord(kind: PauseKind): string | null {
  const s = state.standing;
  const { currentKey: key, currentUrl: url, currentStatusUrl: statusUrl } = H;
  if (!CFG.satellite || !s?.name || !key || !url) return null;
  const write = () => {
    const at = P.turned ?? { url, statusUrl };
    const cases = joinedCases();
    P.written = at.url;
    P.answer = { key, cases: cases.length };
    writeHoldRecord(
      key,
      {
        realm: s.realm,
        karta: s.karta,
        name: s.name ?? "",
        url: at.url,
        statusUrl: at.statusUrl,
        client: harnessName(),
        key,
        session: sessionOfBridge() ?? undefined,
        cases,
      },
      true,
    );
  };
  P.write = write;
  write(); // the old address at once: a bridge killed mid re-arm leaves the record
  P.kind = kind;
  return key;
}
