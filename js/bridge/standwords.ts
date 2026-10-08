// Words of the stand tool's answer in the session language (graph @nks/nks-dev, node #6080).
import { STAND, STAND_MISS, type StandWords } from "../delivery/index.ts";
import { words } from "../shared/lang.ts";
import type { StatusMiss } from "./status.ts";

export const sw = (): StandWords => words(STAND);

/** Why a status call without karta did not become a busy line alone — the one real reason. */
function missWord(m: StatusMiss, of?: string): string {
  const w = words(STAND_MISS);
  switch (m.why) {
    case "none":
      return w.none();
    case "args":
      return w.args(m.args.join(", "));
    case "name":
      return w.name(m.asked, m.held);
    case "satellite":
      return w.satellite(of ?? "?");
    case "cwd":
      return w.cwd(m.cwd);
    case "parked":
      return w.parked();
    case "elsewhere":
      return w.elsewhere();
  }
}

/** miss — why a status call without karta was not a busy line (status.ts); null — no status. */
export const needRealmKarta = (miss: StatusMiss | null, of?: string): string =>
  sw().needRealmKarta(miss ? ` ${missWord(miss, of)}` : "");
