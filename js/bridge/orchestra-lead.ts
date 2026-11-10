// The leading half of one tact (graph @nks/nks-dev, nodes #7513, #5042, #9957; decisions of
// case №4050): fold the raised tape into the registry, read the complete demands snapshot, settle
// closed stops (our own and someone else's stop on demand of our seat — orchestra-foreign.ts),
// extinguish empty compositions of our own launches, raise what the human's
// launcher descriptions answer. An incomplete snapshot acts on nothing; without the machine's
// consent nothing is raised or extinguished.
import { ORCHESTRA, type OrchestraWords } from "../delivery/index.ts";
import { words } from "../shared/lang.ts";
import type { OpenOrder } from "./demand-rows.ts";
import { readDemands } from "./orchestra-demands.ts";
import { foreignStops } from "./orchestra-foreign.ts";
import { readLaunchers } from "./orchestra-launchers.ts";
import { closeEnded, expireLaunches, foldTape, quench, settleStops } from "./orchestra-quench.ts";
import { raiseRows } from "./orchestra-raise.ts";
import { readRuns, writeRuns } from "./orchestra-runs.ts";
import { readTape, realmCanon, type TactAct, type TactRead } from "./orchestra-tact.ts";

const w = (): OrchestraWords => words(ORCHESTRA);

export function leadAct(
  authDir: string,
  base: string,
  token: string,
  mcpUrl: string,
  admitted: boolean,
): TactAct {
  // Without consent the tape is not folded, so its cursors hold: the signals of our own
  // launches wait for the consent's return instead of being lost (#7514, #8202).
  return async (reads, boundary, gone) =>
    admitted
      ? { said: await lead(reads, boundary, gone) }
      : { said: [w().leadNotAdmitted()], hold: true };
  async function lead(
    reads: TactRead[],
    boundary: string[],
    gone?: { gone: boolean },
  ): Promise<string[]> {
    const runs = readRuns(authDir);
    for (const r of reads) foldTape(r.realm, r.signals as Record<string, unknown>[], runs);
    const said: string[] = [];
    try {
      const owned: OpenOrder[] = [];
      const demands = await readDemands(base, token, boundary, boundary, undefined, owned);
      if (!demands.complete) {
        said.push(
          w().leadIncomplete(demands.errors.map((e) => `${e.source}:${e.code}`).join(", ")),
        );
        return said;
      }
      // An order put between the open-orders read above and this one is absent from `owned`:
      // the run it marks stopping now waits for the next tact's read (review of №4050 [105]).
      const foreign = await foreignStops(authDir, base, token, runs);
      said.push(...foreign.said);
      said.push(...(await expireLaunches(runs, gone)));
      said.push(...settleStops(runs, owned, foreign.fresh));
      const cursorOf = (realm: string): string | null =>
        reads.find((r) => r.realm === realm)?.cursor ?? null;
      said.push(
        ...(await quench(
          base,
          token,
          runs,
          (realm) => readTape(base, token, realm, cursorOf(realm)),
          gone,
        )),
      );
      said.push(...(await closeEnded(runs, gone)));
      if (gone?.gone) return said;
      let launchers;
      try {
        launchers = await readLaunchers(mcpUrl, token);
      } catch (e) {
        said.push(w().leadNoLaunchers((e as Error).message));
        return said;
      }
      for (const r of launchers.refused) said.push(w().leadDescription(r.what, r.code));
      const canon = realmCanon(base, token);
      said.push(...(await raiseRows(authDir, demands.start, launchers, runs, canon, gone)));
      return said;
    } finally {
      writeRuns(authDir, runs);
    }
  }
}
