// Launch line with a case (graph @nks/nks-dev, node #6078): an agent whose first prompt
// starts with the launch line stands and enters the case before the model's first turn —
// done by the harness (OpenCode plugin, pi extension), not by skill text. The "from
// <seat>" tail names the launcher's seat where the harness does not know the parent (pi).
// The line's pattern is the delivery layer's (LAUNCH_LINE).
import { LAUNCH, LAUNCH_LINE, tool } from "../delivery/index.ts";
import { words } from "./lang.ts";

/** What the launch line names: graph, role, case and maybe the launcher's seat. */
export interface Launch {
  realm: string;
  karta: string;
  /** Case number — digits, no sign. */
  no: string;
  /** Launcher's seat (@handle:name) from the "from" tail; no tail — null. */
  of: string | null;
}

const LINE = LAUNCH_LINE;

/** The launch line with a case among the text's lines; none — null. */
export function parseLaunch(text: string): Launch | null {
  const [, realm, karta, no, of] = LINE.exec(text) ?? [];
  return realm && karta && no ? { realm, karta, no, of: of ?? null } : null;
}

/** The harness's word goes right after the launch line — the first thing the model reads after it. */
export function withWord(text: string, word: string): string {
  const m = LINE.exec(text);
  if (!m) return `${text}\n${word}`;
  const nl = text.indexOf("\n", m.index);
  return nl < 0 ? `${text}\n${word}` : `${text.slice(0, nl)}\n${word}${text.slice(nl)}`;
}

/** A tool call on the agent's behalf; a refusal throws with its words. */
export type LaunchCall = (name: string, args: Record<string, unknown>) => Promise<string>;

/**
 * Stand and enter the case: stand (with satellite_of when the launcher's seat is named),
 * then case join with room "#N" — the api does not take "№" yet. The answer is a word
 * into the session; a failed join does not drop the seat.
 */
export async function enterCase(
  l: Launch,
  call: LaunchCall,
  satelliteOf: string | null,
  placeName: () => string | null | undefined,
): Promise<string> {
  const W = words(LAUNCH);
  const room = `#${l.no}`;
  const stand: Record<string, unknown> = { realm: l.realm, karta: l.karta };
  if (satelliteOf) stand.satellite_of = satelliteOf;
  try {
    await call(tool("stand"), stand);
  } catch (e) {
    const why = (e as Error).message;
    const join = `${tool("case")}(action="join", room="${room}")`;
    // A subagent stands only as a satellite of the launcher's seat (#6550 item 2).
    return W.notSeated(why, l.no, join);
  }
  const place = placeName() || W.ownSeat();
  try {
    await call(tool("case"), { action: "join", realm: l.realm, room });
  } catch (e) {
    return W.notEntered(place, l.no, (e as Error).message);
  }
  return W.entered(place, l.no);
}
