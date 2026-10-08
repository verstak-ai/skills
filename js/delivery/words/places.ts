// Channel seats in other graphs (PLACES): a graph's seat change, a frame with no matched
// seat.
import type { Lang } from "../lang.ts";

export interface PlacesWords {
  anotherSeat: () => string;
  graph: () => string;
  unmatched: (
    frame: string,
    standingId: string,
    to: string,
    realm: string,
    several: boolean,
    key: string,
  ) => string;
}

export const PLACES: Readonly<Record<Lang, PlacesWords>> = {
  en: {
    anotherSeat: () => "another seat of the graph",
    graph: () => "graph",
    unmatched: (frame, standingId, to, realm, several, key) =>
      `DOER: frame ${frame} (to_standing_id ${standingId}, ${to}, graph ${realm}) ` +
      `matches no seat of the bridge (${several ? "several fit" : "none fits"}) — given to the main seat ${key}; check the frame's address.`,
  },
};
