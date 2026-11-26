// Installed flat skills change without a new take (#7528, graph @nks/nks-dev).
import { STANDING } from "../delivery/index.ts";
import { words } from "../shared/lang.ts";
import { scoped } from "../shared/scope.ts";
import { serialized } from "./call.ts";
import { deafPlaceIn, deafSeatTaken } from "./deaf.ts";
import { endedSince } from "./endedseats.ts";
import { errorMessage } from "./errors.ts";
import { isParked, releaseStanding, wasEvicted } from "./hold.ts";
import { besideSeats, dropExtra, keyOfPlace } from "./places.ts";
import { registerMove } from "./ratelimit.ts";
import { retrySkillsCheck, skillsCheckDue, skillsNeedRegister } from "./skillwatch.ts";
import { replayRegister, seatIsGone } from "./standing.ts";
import { log } from "./streams.ts";
import { state } from "./transport.ts";

const S = scoped(() => ({ refreshing: null as Promise<void> | null }));
export async function refreshSkills(): Promise<void> {
  if (S.refreshing) return S.refreshing;
  S.refreshing = serialized(async () => {
    const primary = state.standing;
    if (!primary || !state.sessionId || !skillsCheckDue()) return;
    const move = registerMove("returns"); // one move over every seat: a stop ends it, one deadline (#7439)
    const seats = [{ place: primary, id: null as string | null }, ...besideSeats()];
    for (const { place, id } of seats) {
      if (move.stopped()) break;
      if (place !== primary && !state.places.includes(place)) continue; // forgotten meanwhile
      if (isParked(place.realm, place.karta, place.name ?? "")) continue;
      if (wasEvicted(place.realm, place.karta, place.name ?? "")) continue;
      if (!skillsNeedRegister(place)) continue;
      if (deafPlaceIn(place.realm) && (await deafSeatTaken(place))) {
        retrySkillsCheck();
        continue;
      }
      // Only the main seat waits out a 429; a seat beside ended in the move is skipped (#7439).
      const seat = place === primary ? undefined : { id, main: false };
      const got = await replayRegister(place, false, move, seat);
      if (move.stopped()) break;
      if (endedSince(id, move.since)) continue; // ended meanwhile: the rest go on
      if (seatIsGone(got)) {
        if (place === primary ? state.standing !== place : !state.places.includes(place)) continue;
        const why = words(STANDING).seatExpired();
        log(`skills refresh: place ${keyOfPlace(place)} is gone, forgetting it`);
        if (place === primary) {
          state.standing = null;
          releaseStanding(why, true);
          break;
        }
        const key = keyOfPlace(place);
        dropExtra(key, why, true);
        state.places = state.places.filter((p) => keyOfPlace(p) !== key);
      } else if (!got || got.error || got.result?.isError) retrySkillsCheck();
    }
  })
    .catch((e) => {
      retrySkillsCheck();
      log(`skills refresh failed: ${errorMessage(e)}`);
    })
    .finally(() => {
      S.refreshing = null;
    });
  return S.refreshing;
}
