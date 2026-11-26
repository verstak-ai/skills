// The bridge's own automatic reads of the board (graph @nks/nks-dev, nodes #11337, #11375, #11351):
// hearing not proven on a raw seat move or a deaf seat's rebind (hearing.ts), the watchdog's check
// of a seat whose hearing is not live (resume.ts), the death window's check of a seat
// (deadseat.ts). A machine's seats coming back together read it together — so each read is a
// return through the machine's return gate: one probe, then at most two in flight, each after its
// own delay; and, as every upstream call, through the down window (transport.ts post). They stay
// reads: replacing them is later work. Each read says itself in the journal — a live run counts
// them from the bridge's log too.
import { tool } from "../delivery/index.ts";
import { type Answer, callTool } from "./call.ts";
import { CFG } from "./config.ts";
import { throughGate } from "./returngate.ts";
import { log } from "./streams.ts";

/** The board of `realm` and `karta`, read as a return; `why` — the read's reason, for the journal. */
export function boardRead(realm: string, karta: string | number, why: string): Promise<Answer> {
  log(`board read (${why}): ${realm} role ${karta}`);
  return throughGate(CFG.serverUrl, () =>
    callTool(tool("channel"), { action: "list", realm, karta }),
  );
}
