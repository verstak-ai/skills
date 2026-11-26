// The call's own ownerless invite (graph @nks/nks-dev, node #10995): when the call's seat ends
// with the role's lines still open, the platform invites the role again — author null, payload
// {cause: "ownerless", gone_standing: <the ended seat>} (api holder #48; seen on LAB, live run
// of 8.14.0). Its pair {invite, room} is what the continuation registers with; the first pair
// was revoked with the seat. Another live seat already on it answers 409 spawned_for_claimed:
// the share went to someone else, and the call ends instead of sleeping again.
import { type CaseEntry, readCaseHistory } from "./orchestra-case-read.ts";
import { type Run, runKey } from "./orchestra-runs.ts";

type Row = Record<string, unknown>;

/** The platform's invite opened by the end of one of these seats. */
const ownerlessOf = (e: CaseEntry, seats: ReadonlySet<string>): boolean =>
  e.kind === "invite" &&
  !e.author_standing_id &&
  e.cause === "ownerless" &&
  !!e.gone_standing &&
  seats.has(e.gone_standing);

/**
 * The call's last ownerless invite in its journal: its number when nobody has come in on it,
 * claimed when another seat did. None — the continuation keeps the pair it has. An ownerless
 * invite one of the call's own seats came in on is spent: an earlier continuation's.
 */
export function ownInvite(
  entries: CaseEntry[],
  seats: readonly string[],
): { invite: number } | { claimed: number } | null {
  const own = new Set(seats);
  const found = entries.filter((e) => ownerlessOf(e, own)).at(-1);
  if (!found) return null;
  const joined = entries.filter((e) => e.kind === "joined" && e.in_reply_to === found.n);
  if (joined.some((e) => !!e.author_standing_id && !own.has(e.author_standing_id)))
    return { claimed: found.n };
  return joined.length ? null : { invite: found.n };
}

/** The share went to another seat: the code the call ends with. */
export const SHARE_CLAIMED = "dormant_share_claimed";

/**
 * Before a continuation: the journal from the call's invite names the pair it registers on —
 * the call's open ownerless invite, else the pair it had. Claimed by another seat — the code
 * the call ends with; the read's refusal rides out as thrown.
 */
export async function pairFor(
  base: string,
  token: string,
  r: Run,
): Promise<typeof SHARE_CLAIMED | null> {
  const { entries } = await readCaseHistory(base, token, r.room, Math.max(0, r.invite - 1));
  const own = ownInvite(entries, callSeats(r));
  if (own && "claimed" in own) return SHARE_CLAIMED;
  if (own) r.pair = own.invite;
  return null;
}

/** The run a seat signal's pair names: the call's own invite, or the ownerless invite its
 * continuation sits on. */
export const signalRun = (
  realm: string,
  room: string,
  invite: number,
  runs: Record<string, Run>,
): Run | null =>
  runs[runKey(realm, room.toLowerCase(), invite)] ??
  runs[runKey(realm, room, invite)] ??
  Object.values(runs).find(
    (r) => r.realm === realm && r.pair === invite && r.room.toLowerCase() === room.toLowerCase(),
  ) ??
  null;

/**
 * A sleeping call's tact page shows another seat coming in on an invite: when that invite is
 * the call's own ownerless one, the share went on without it — no waking word needed. The
 * invite may lie behind the cursor, so the journal is read again from the call's invite.
 */
export async function claimedOnPage(
  base: string,
  token: string,
  r: Run,
  page: CaseEntry[],
): Promise<boolean> {
  const seats = callSeats(r);
  const foreign = page.some(
    (e) =>
      e.kind === "joined" &&
      e.in_reply_to !== null &&
      !!e.author_standing_id &&
      !seats.includes(e.author_standing_id),
  );
  if (!foreign) return false;
  const { entries } = await readCaseHistory(base, token, r.room, Math.max(0, r.invite - 1));
  const own = ownInvite(entries, seats);
  return !!own && "claimed" in own;
}

/** The seats a sleeping call answers for: every id it had and the one it holds now. */
export const callSeats = (r: Run): string[] => [
  ...new Set([...(r.dormant?.seats ?? []), r.standing_id].filter((s): s is string => !!s)),
];

/**
 * An invite row the raising half must leave alone (#10995): the ownerless invite a sleeping
 * call's seat left behind is that call's share — its continuation registers on it; a fresh
 * agent raised for it would be a second holder of the same lines.
 */
export function dormantShare(source: Row, runs: Record<string, Run>): boolean {
  if (source.author || source.cause !== "ownerless" || typeof source.gone_standing !== "string")
    return false;
  const gone = source.gone_standing;
  return Object.values(runs).some(
    (r) =>
      r.realm === source.realm &&
      r.room === source.room &&
      !!r.dormant &&
      r.state !== "ended" &&
      r.state !== "refused" &&
      callSeats(r).includes(gone),
  );
}
