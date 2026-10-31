// A dead agent's seats after the death window (graph @nks/nks-dev, nodes #7493, #7621; case
// №677): the channel ends by its dead socket's own token — POST <api>/channel/ws/{token}/stop
// (case №675, api 0.124.0) ends every seat the channel carries, main and beside, except those
// another live channel holds, and only while {token} is still current: the check and the end in
// one transaction, so a holder who took the name in the window keeps it. Its 200 lists the seats
// really ended. An api without the stop falls back to the board's check and a revoke by name:
// there a holder taking the name between the check and the revoke loses its seat — the race
// this stop closes.
import { apiBase } from "../shared/channel.ts";
import { revokeOwnPlaces } from "./caseexit.ts";
import { dropConfirmed, seatKeyOf, stillOwn } from "./deadseat.ts";
import { dropOwnHoldRecord } from "./holdrecord.ts";
import { log } from "./streams.ts";
import { type Standing } from "./transport.ts";

/** The 404 rule of a token that is not current: reissued, the channel or the seat ended. */
const NOT_CURRENT = "ws_token_not_current";

export type Stop = "stopped" | "moved" | "absent" | "unknown";

/** errors[0].rule of a ProblemDetail body; null — no rule (or no JSON). */
function ruleOf(body: string): string | null {
  try {
    const rule = (JSON.parse(body) as { errors?: { rule?: unknown }[] })?.errors?.[0]?.rule;
    return typeof rule === "string" ? rule : null;
  } catch {
    return null;
  }
}

/** standing_id of each ended[] entry of a 200 {channel_id, ended_by, ended:[{standing_id, ended_at}]}. */
function endedOf(body: string): string[] {
  try {
    const ended = (JSON.parse(body) as { ended?: { standing_id?: unknown }[] })?.ended;
    return Array.isArray(ended)
      ? ended.map((e) => e?.standing_id).filter((id): id is string => typeof id === "string")
      : [];
  } catch {
    return [];
  }
}

/** The stop by the dead socket's token, read as stopped, moved (not ours), absent (old api) or unknown. */
export async function stopBySocket(
  socketUrl: string,
): Promise<{ how: Stop; why: string; ended: string[] }> {
  const token = new URL(socketUrl).pathname.split("/channel/ws/")[1];
  if (!token) return { how: "absent", why: "no token in the socket address", ended: [] };
  let res: Response;
  try {
    res = await fetch(`${apiBase(socketUrl)}/channel/ws/${token}/stop`, {
      method: "POST",
      signal: AbortSignal.timeout(5000),
    });
  } catch (e) {
    return { how: "unknown", why: (e as Error).message, ended: [] };
  }
  const body = (await res.text().catch(() => "")).trim();
  const why = `${res.status} ${body.slice(0, 120)}`;
  if (res.ok) return { how: "stopped", why, ended: endedOf(body) };
  if (res.status === 405) return { how: "absent", why, ended: [] };
  if (res.status !== 404) return { how: "unknown", why, ended: [] };
  const rule = ruleOf(body);
  return { how: rule === NOT_CURRENT ? "moved" : rule ? "unknown" : "absent", why, ended: [] };
}

/** The board's check and a revoke by name, the seats beside first (revokeOwnPlaces). */
async function closeByBoard(places: Standing[], status: string | null, say: () => void) {
  const own: Standing[] = [];
  for (const s of places) if (await stillOwn(s, status)) own.push(s);
  if (!own.length) return;
  say();
  dropConfirmed(own, (await revokeOwnPlaces(own)).revoked);
}

/**
 * A 200 of the stop, seat by seat: the answer — the seats its ended[] names, their hold records
 * dropped while still this channel's. A seat whose id no reply named (a connect's prose carries
 * none) is the one an ended id no known seat claims — when it is the only such seat.
 */
export function settleStopped(
  places: Standing[],
  socket: string,
  ids: Map<string, string | null>,
  ended: string[],
  why: string,
): Standing[] {
  const idOf = (s: Standing): string | null => ids.get(seatKeyOf(s)) ?? null;
  const unclaimed = ended.filter((id) => !places.some((s) => idOf(s) === id));
  const unnamed = places.filter((s) => !idOf(s));
  const done: Standing[] = [];
  for (const s of places) {
    const key = seatKeyOf(s);
    const id = idOf(s);
    if (id ? ended.includes(id) : unnamed.length === 1 && unclaimed.length > 0) {
      log(`${key} ended by its dead socket's token (${why})`);
      dropOwnHoldRecord(key, socket);
      done.push(s);
    } else if (id || unclaimed.length === 0)
      log(
        `${key}: not among the stop's ended seats — another live channel holds it; its hold record untouched`,
      );
    else
      log(
        `${key}: its seat id is not known — whether the stop ended it is not known; its hold record kept`,
      );
  }
  return done;
}

/** A 404 ws_token_not_current: another holder took the name or it ended — nothing closed. */
export function settleMoved(places: Standing[], main: Standing, socket: string): void {
  log(
    `${seatKeyOf(main)}: its dead socket's token is not current — another holder took it or it ended, not closed; only the channel's own hold records dropped`,
  );
  for (const s of places) dropOwnHoldRecord(seatKeyOf(s), socket);
}

/**
 * Closes the dead seats no live bridge of this machine holds again. `main` — the channel's main
 * seat among them with its dead socket's address, or null; `ids` — the platform ids of the seats
 * by key, as far as register, hello or connect named them. With `main` one stop by its token
 * ends the whole channel; a hold record goes only for a seat its ended[] names, and only if the
 * record is still this channel's (the same socket address). Without `main` or on an old api — by
 * the board.
 */
export async function closeDeadSeats(
  places: Standing[],
  main: { seat: Standing; socket: string } | null,
  status: string | null,
  ids: Map<string, string | null>,
): Promise<void> {
  const say = (): void =>
    log(`the agent's session ended without an announced absence — closing its seats (#7493)`);
  if (!main) return closeByBoard(places, status, say);
  const { how, why, ended } = await stopBySocket(main.socket);
  if (how === "stopped") {
    say();
    settleStopped(places, main.socket, ids, ended, why);
    return;
  }
  if (how === "moved") return settleMoved(places, main.seat, main.socket);
  if (how === "unknown")
    return log(
      `${seatKeyOf(main.seat)}: the stop by its token did not answer: ${why} — not closed, the seats go by the platform's term`,
    );
  log(
    `${seatKeyOf(main.seat)}: no stop by token on this api (${why}) — the board's check and a revoke by name`,
  );
  await closeByBoard(places, status, say);
}
