// A connect answered after the end of a run that keeps its seats — an announced absence, a
// daemon handover, a satellite's pause (graph @nks/nks-dev, nodes #7493, #6649, #6625; case
// №677): no socket opens in the ended session. The seat goes into its hold record as if held
// before the end, and the returning session takes it back by the record (resume.ts).
import { harnessName } from "./client.ts";
import { keyOf, readHoldRecord, writeHoldRecord } from "./holdrecord.ts";
import { H } from "./holdstate.ts";
import { P, suspended } from "./pauserecord.ts";
import { log } from "./streams.ts";
import { type Standing } from "./transport.ts";

/** Keep the late-answered seat for the return: its address in the hold or pause record. */
export function holdLate(seat: Standing, url: string, statusUrl: string | null): void {
  const key = keyOf(seat.realm, seat.karta, seat.name ?? "");
  if (suspended()) {
    // The pause record follows the address the late re-arm turned (suspend.ts).
    P.turned = { url, statusUrl };
    P.write?.();
  } else {
    const was = readHoldRecord(key, true);
    writeHoldRecord(key, {
      status: was?.status,
      realm: seat.realm,
      karta: seat.karta,
      name: seat.name ?? "",
      url,
      statusUrl,
      cwd: H.standCwd ?? was?.cwd,
      client: harnessName(),
      key,
      left: false,
    });
  }
  log(
    `${key}: connect answered after the run's end — no socket opened, the seat waits in its hold record`,
  );
}
