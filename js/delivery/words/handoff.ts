// Socket handoff to the daemon's successor (HANDOFF): a spooled frame for a seat beside
// that did not return.
import type { Lang } from "../lang.ts";

export interface HandoffWords {
  strayFrame: (id: string, to: string, key: string, raw: string) => string;
}

export const HANDOFF: Readonly<Record<Lang, HandoffWords>> = {
  en: {
    strayFrame: (id, to, key, raw) =>
      `DOER: frame ${id} from the daemon-change spool is addressed to the seat ${to}, ` +
      `which has not returned — not a frame of the seat ${key}; to bring the seat back — verstak_stand in its graph. Frame: ${raw}`,
  },
};
