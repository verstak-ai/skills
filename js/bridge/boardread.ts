// The bridge's own automatic reads of the board (graph @nks/nks-dev, nodes #11337, #11375, #11351):
// hearing not proven on a raw seat move or a deaf seat's rebind (hearing.ts), the watchdog's check
// of a seat whose hearing is not live (resume.ts), the death window's check of a seat
// (deadseat.ts). A machine's seats coming back together read it together — so each read is a
// return through the machine's return gate: one probe, then at most two in flight, each after its
// own delay (a session already come back reads as its return's tail, #11413); and, as every
// upstream call, through the down window (transport.ts post). A read for a call in hand (a deaf
// seat's refusal, a raw seat move, the stand) is not held at the gate past ~20 s (gatestay.ts):
// the call answers at once, and the read, its caller gone, sends nothing when its turn comes.
// They stay reads: replacing them is later work. Each read says itself in the journal — a live
// run counts them from the bridge's log too.
import { tool } from "../delivery/index.ts";
import { type Answer, callTool } from "./call.ts";
import { notPast } from "./gatestay.ts";
import { log } from "./streams.ts";
import { throughReturn } from "./transport.ts";

/**
 * The board of `realm` and `karta`, read as a return; `why` — the read's reason, for the journal.
 * `call` — a call in hand waits for it: bounded, a far place rejects with ReturnLater.
 */
export function boardRead(
  realm: string,
  karta: string | number,
  why: string,
  call = false,
): Promise<Answer> {
  log(`board read (${why}): ${realm} role ${karta}`);
  let gone = false;
  const read = (): Promise<Answer> => {
    if (!gone) return callTool(tool("channel"), { action: "list", realm, karta });
    log(`board read (${why}) not sent: its call was answered meanwhile`);
    return Promise.resolve({ isError: true, text: "board read not sent: its call was answered" });
  };
  const gated = throughReturn(read);
  return call ? notPast(gated, () => void (gone = true)) : gated;
}
