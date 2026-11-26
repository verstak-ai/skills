// The dormancy of a raised dsh run (graph @nks/nks-dev, node #10995): a clean exit — final
// completed, exit 0, a session in hand — with the call's case still open does not end the run.
// It sleeps: the tree and the dsh session stay, the slot frees, and the tact watches the case
// journal until a word wakes the continuation `dsh --session-id` (orchestra-dsh-run.ts) or the
// sleep ends — a closed case, a revoked seat, a stop order on the seat, the window. The seat's
// own stop at the exit is not touched: the sleep arms only where the run would end anyway.
import { ORCHESTRA } from "../delivery/index.ts";
import { words } from "../shared/lang.ts";
import { type CaseEntry, readCaseHistory, readCaseStatus } from "./orchestra-case-read.ts";
import { hasOpenShare } from "./orchestra-case-share.ts";
import {
  callSeats,
  claimedOnPage,
  ownInvite,
  pairFor,
  SHARE_CLAIMED,
} from "./orchestra-dsh-reinvite.ts";
import { launchDsh } from "./orchestra-dsh-run.ts";
import { entryCursor, wakesBy } from "./orchestra-dsh-wake.ts";
import type { Launchers } from "./orchestra-launcher-types.ts";
import { homeLine } from "./orchestra-raise-gates.ts";
import { resolveInvite } from "./orchestra-resolve.ts";
import { roleRefusal } from "./orchestra-role.ts";
import { readRuns, type Run, runIdentity } from "./orchestra-runs.ts";
import { DORMANT_WINDOW_MS } from "./orchestra-window.ts";

const w = () => words(ORCHESTRA);

/** The status word of a foreign stop's end: an open order was merely ordered, a closed one
 * says its outcome (#10995). */
const stopElsewhere = (state: string): string =>
  state === "issued" || state === "accepted" ? "stop_ordered_elsewhere" : `stop_${state}_elsewhere`;

/** A read refusal's row word: the holder says a 409 standing_required cannot come under
 * advance=false — its arrival is an api defect and is named as itself; everything else is a
 * plain transient (#10995 review 3). */
export const readErrorWhy = (e: unknown): string =>
  (e as Error).message === "api_defect_standing_required"
    ? "dormant_read_error:api_defect_standing_required"
    : "dormant_read_error";

/** A dsh exit that can sleep: final completed, exit 0, a session to continue. */
export const dshSleepable = (r: Run): boolean =>
  r.dsh?.final === "completed" && r.dsh.exit === "0" && !!r.dsh.session;

/**
 * Arm the sleep on a run whose end was already decided: the case must still be open, and the
 * journal is read whole once — the cursor takes its last number, the wake keeps the seat ids
 * (the row's own and every earlier one), the invite entry's role uuid and the seat's own asks.
 * True — the row sleeps; false — the end stands as it was decided. A failed read keeps the
 * end: nothing is slept on a guess. A graph outside the daemon's present `boundary` is not read
 * at all: its call ends as it was decided.
 */
export async function goDormant(
  base: string,
  token: string,
  r: Run,
  boundary?: string[],
): Promise<boolean> {
  if (!dshSleepable(r) || r.tree?.state !== "ready") return false;
  if (boundary && !boundary.includes(r.realm)) return false;
  // A foreign stop, once read, is sticky (#10995 review 5): no sleep arms under it — the
  // row's end stands whatever the case says.
  if (r.foreign_stop) return false;
  const seats = callSeats(r);
  const sleepOnError = (e: unknown): boolean => {
    // A transient refusal names neither open nor closed: only a definitive closed|abandoned
    // may end the run. The row sleeps on the invite floor with the error named, the tree
    // stays, the tact retries the read — and the window counts this sleep like any other.
    // The wake caches are left unset: the tact establishes them from the invite itself
    // before its first judgement (#10995 review 2).
    r.state = "dormant";
    r.why = readErrorWhy(e);
    r.dormant = {
      since: new Date().toISOString(),
      cursor: Math.max(r.invite, r.dormant?.cursor ?? 0),
      seats,
      share_pending: true,
    };
    return true;
  };
  let read: { entries: CaseEntry[]; cursor: number };
  try {
    if ((await readCaseStatus(base, token, r.room)) !== "open") return false;
    read = await readCaseHistory(base, token, r.room);
  } catch (e) {
    if (r.foreign_stop) return false;
    return sleepOnError(e);
  }
  if (r.foreign_stop) return false;
  // The seat walked out of the case by itself: a left with reason leave after the call's
  // last joined is the agent's own farewell, and a leave does not end the standing (#4929) —
  // our stop after it may even answer stopped. No sleep either way; our own exit stop's left
  // is revoked, never leave, and never blocks (#10995 review 2).
  const lastJoined = Math.max(
    0,
    ...read.entries
      .filter(
        (e) =>
          e.kind === "joined" && !!e.author_standing_id && seats.includes(e.author_standing_id),
      )
      .map((e) => e.n),
  );
  if (
    read.entries.some(
      (e) =>
        e.kind === "left" &&
        e.reason === "leave" &&
        !!e.author_standing_id &&
        seats.includes(e.author_standing_id) &&
        e.n > lastJoined,
    )
  ) {
    r.why = "dormant_seat_left";
    return false;
  }
  // The call's ownerless invite already holds another live seat — the platform's 409
  // spawned_for_claimed to a continuation on it: the share went on without this call.
  const own = ownInvite(read.entries, seats);
  if (own && "claimed" in own) {
    r.why = SHARE_CLAIMED;
    return false;
  }
  // The cursor lands on the seat's own last word that is not a left: a said that came after
  // the agent's last move but before this read must still wake — a spurious wake is cheaper
  // than a lost word — and the technical left of our own exit stop never serves as the
  // cursor (#10995 review). No word of the call's seats — the invite's number is the floor,
  // and the cursor never walks back.
  const seatLast = [...read.entries]
    .reverse()
    .find(
      (e) => e.author_standing_id && seats.includes(e.author_standing_id) && e.kind !== "left",
    )?.n;
  const asks: Record<string, string> = {};
  for (const e of read.entries)
    if (e.kind === "ask" && e.author_standing_id && seats.includes(e.author_standing_id))
      asks[e.n] = e.author_standing_id;
  const karta = read.entries.find((e) => e.n === r.invite)?.to_karta_node_id;
  try {
    if (!hasOpenShare(read.entries, seats, karta ?? r.dormant?.karta)) return false;
  } catch (e) {
    return sleepOnError(e);
  }
  // A waking word before the seat's last word whose body has not landed holds the cursor
  // before it: its later body is the same number, and a cursor past it would drop the word.
  const role = karta ?? r.dormant?.karta;
  const { cursor, seen } = entryCursor(
    read.entries,
    wakesBy(new Set(seats), role, asks, read.entries),
    seatLast ?? 0,
    Math.max(r.invite, r.dormant?.cursor ?? 0),
  );
  r.state = "dormant";
  r.dormant = {
    since: new Date().toISOString(),
    cursor,
    seats,
    ...(karta ? { karta } : {}),
    asks,
    ...(seen.length ? { seen } : {}),
  };
  return true;
}

/** The tact's ended dsh rows sleep too (#10995) — except a stop ordered elsewhere, which is a
 * wind-down: its end stays an end. Called where a tact settles stops into ends synchronously.
 * A graph outside the daemon's present boundary is not read at all (goDormant). */
export async function dormantFromEnds(
  base: string,
  token: string,
  runs: Record<string, Run>,
  boundary?: string[],
): Promise<void> {
  for (const r of Object.values(runs))
    if (r.state === "ended" && !r.foreign_stop && r.tree?.state === "ready")
      await goDormant(base, token, r, boundary);
}

/** What a journal entry means for the sleep: the platform's addressing wakes — a said or an
 * ask to a standing id the call's seat had, an ask or an invite to the invited role's karta
 * uuid, an answer to the seat's own ask; a left of the seat with reason revoked ends it. */
type Verdict = { wake: CaseEntry } | { end: string; cursor: number } | { cursor: number };

function judge(entries: CaseEntry[], from: number, r: Run): Verdict {
  const seats = new Set(r.dormant?.seats ?? []);
  const karta = r.dormant?.karta;
  const wakes = wakesBy(seats, karta, r.dormant?.asks ?? {}, entries);
  // Words the live agent had before the sleep, behind a word still waiting for its body.
  const seen = new Set(r.dormant?.seen ?? []);
  let cursor = from;
  let wake: CaseEntry | undefined;
  let pending: number | undefined;
  let end: { code: string; n: number } | undefined;
  for (const e of entries) {
    // A number at or behind the cursor replaces its predecessor — it never wakes twice.
    if (e.n <= from) continue;
    if (e.aborted) {
      cursor = Math.max(cursor, e.n);
      continue;
    }
    if (e.kind === "closed") {
      end ??= { code: "dormant_case_closed", n: e.n };
      continue;
    }
    if (e.kind === "left" && e.author_standing_id && seats.has(e.author_standing_id)) {
      // By reason, not by order (#10995 review 2): our own exit stop's left is revoked — a
      // late trace with no live seat to end; the agent's own farewell is leave.
      if (e.reason === "leave") end ??= { code: "dormant_seat_left", n: e.n };
      cursor = Math.max(cursor, e.n);
      continue;
    }
    // The call's own words never wake it: the seat speaking is the live agent's business.
    if (e.author_standing_id && seats.has(e.author_standing_id)) {
      cursor = Math.max(cursor, e.n);
      continue;
    }
    if (wakes(e) && !seen.has(e.n)) {
      if (e.body_pending) pending ??= e.n;
      else if (!wake && pending === undefined) wake = e;
      continue;
    }
    cursor = Math.max(cursor, e.n);
  }
  // The read is decided whole: an end anywhere on it beats an earlier waking word — nothing
  // continues a sleep whose own page says it is over (#10995 review).
  if (end) return { end: end.code, cursor: end.n };
  if (wake) return { wake };
  return { cursor: pending === undefined ? cursor : Math.min(cursor, pending - 1) };
}

/**
 * One tact over the dormant rows (#10995): each case is read from its cursor after its status.
 * A waking word launches the continuation on the slept session — the cursor lands on the waking
 * entry; while the continuation lives, the journal is not read (the row is no longer dormant).
 * The launcher's slot taken or gone holds the cursor where it lay. A closed case, a revoked
 * seat, a passed window ends the sleep, and the ordinary tree cleanup takes the tree. A failed
 * read leaves the cursor standing and names itself in the row.
 */
export async function stepDormant(
  authDir: string,
  base: string,
  token: string,
  runs: Record<string, Run>,
  ls: Launchers,
  gone?: { gone: boolean },
  now = Date.now(),
  launch: typeof launchDsh = launchDsh,
  boundary?: string[],
): Promise<string[]> {
  const out: string[] = [];
  for (const [key, r] of Object.entries(runs)) {
    if (r.state !== "dormant" || !r.dsh || !r.dormant) continue;
    if (boundary && !boundary.includes(r.realm)) continue;
    if (gone?.gone) break;
    // The sticky foreign stop ends the sleep before anything else: no read, no wake, no
    // window — the row ends by the field alone (#10995 review 5).
    if (r.foreign_stop) {
      r.state = "ended";
      r.why = stopElsewhere(r.foreign_stop.state);
      out.push(w().leadRow(r.realm, r.room, r.invite, r.why));
      continue;
    }
    let sleep = r.dormant;
    if (now - Date.parse(sleep.since) > DORMANT_WINDOW_MS) {
      r.state = "ended";
      r.why = "dormant_window";
      out.push(w().leadRow(r.realm, r.room, r.invite, r.why));
      continue;
    }
    let entries: CaseEntry[];
    let claimed: boolean;
    try {
      if ((await readCaseStatus(base, token, r.room)) !== "open") {
        r.state = "ended";
        r.why = "dormant_case_closed";
        out.push(w().leadRow(r.realm, r.room, r.invite, r.why));
        continue;
      }
      if (sleep.share_pending) {
        const history = await readCaseHistory(base, token, r.room);
        const karta = history.entries.find((e) => e.n === r.invite)?.to_karta_node_id;
        if (!hasOpenShare(history.entries, sleep.seats ?? [], karta ?? sleep.karta)) {
          r.state = "ended";
          r.why = "dormant_no_open_share";
          out.push(w().leadRow(r.realm, r.room, r.invite, r.why));
          continue;
        }
        sleep = { ...sleep, share_pending: false };
        r.dormant = sleep;
      }
      // A sleep armed on a transient refusal carries no wake caches: one read from the invite
      // itself re-establishes them — the role's uuid from the invite entry, the seat's own
      // asks — before the judgement, which always starts at the cursor and never walks it
      // down (#10995 review 2).
      const unestablished = r.dormant.asks === undefined;
      entries = (
        await readCaseHistory(
          base,
          token,
          r.room,
          unestablished ? Math.max(0, r.invite - 1) : (sleep.cursor ?? 0),
        )
      ).entries;
      if (unestablished) {
        const seats = new Set(sleep.seats ?? []);
        const asks: Record<string, string> = {};
        for (const e of entries)
          if (e.kind === "ask" && e.author_standing_id && seats.has(e.author_standing_id))
            asks[e.n] = e.author_standing_id;
        const karta = entries.find((e) => e.n === r.invite)?.to_karta_node_id;
        r.dormant = { ...sleep, ...(karta ? { karta } : {}), asks };
        delete r.why;
      }
      claimed = await claimedOnPage(base, token, r, entries);
    } catch (e) {
      r.why = readErrorWhy(e);
      out.push(w().leadRow(r.realm, r.room, r.invite, `${r.why} (${(e as Error).message})`));
      continue;
    }
    // Another seat came in on the call's ownerless invite: the share is carried, the sleep ends
    // on the page alone, waking word or not (PR review, #10995).
    if (claimed) {
      r.state = "ended";
      r.why = SHARE_CLAIMED;
      out.push(w().leadRow(r.realm, r.room, r.invite, r.why));
      continue;
    }
    const verdict = judge(entries, sleep.cursor ?? 0, r);
    if ("wake" in verdict) {
      // The reads above awaited: the row may have moved under them — another writer ended it,
      // re-armed it, or the caller left. Nothing launches and the cursor stands where it lay
      // (#10995 review 2).
      const latest = readRuns(authDir)[key];
      if (
        gone?.gone ||
        !latest ||
        latest.state !== "dormant" ||
        !!latest.foreign_stop ||
        !!r.foreign_stop ||
        runIdentity(latest) !== runIdentity(r)
      ) {
        out.push(w().leadRow(r.realm, r.room, r.invite, "dormant_wake_superseded"));
        continue;
      }
      if (!r.author) {
        try {
          const history = await readCaseHistory(base, token, r.room, Math.max(0, r.invite - 1));
          r.author =
            history.entries.find((e) => e.n === r.invite && e.kind === "invite")?.author ??
            undefined;
        } catch (e) {
          r.why = readErrorWhy(e);
          out.push(w().leadRow(r.realm, r.room, r.invite, r.why));
          continue;
        }
      }
      let claimed: string | null;
      try {
        claimed = await pairFor(base, token, r);
      } catch (e) {
        r.why = readErrorWhy(e);
        out.push(w().leadRow(r.realm, r.room, r.invite, r.why));
        continue;
      }
      const current = readRuns(authDir)[key];
      if (
        gone?.gone ||
        !current ||
        current.state !== "dormant" ||
        current.foreign_stop ||
        r.foreign_stop ||
        runIdentity(current) !== runIdentity(r)
      ) {
        out.push(w().leadRow(r.realm, r.room, r.invite, "dormant_wake_superseded"));
        continue;
      }
      if (claimed) {
        r.state = "ended";
        r.why = claimed;
        out.push(w().leadRow(r.realm, r.room, r.invite, claimed));
        continue;
      }
      const roleWhy = await roleRefusal(base, token, { ...r });
      const afterRole = readRuns(authDir)[key];
      if (
        gone?.gone ||
        !afterRole ||
        afterRole.state !== "dormant" ||
        afterRole.foreign_stop ||
        r.foreign_stop ||
        runIdentity(afterRole) !== runIdentity(r)
      ) {
        out.push(w().leadRow(r.realm, r.room, r.invite, "dormant_wake_superseded"));
        continue;
      }
      if (roleWhy) {
        r.state = "ended";
        r.why = roleWhy;
        out.push(w().leadRow(r.realm, r.room, r.invite, roleWhy));
        continue;
      }
      const resolved = resolveInvite({ ...r }, ls, runs);
      if ("code" in resolved) {
        r.why = resolved.code;
        if (resolved.code !== "limit_reached") r.state = "ended";
        out.push(w().leadRow(r.realm, r.room, r.invite, r.why));
        continue;
      }
      const spec = resolved.own.harnesses[r.harness].dsh;
      if (!spec) {
        r.state = "ended";
        r.why = "harness_not_offered";
        out.push(w().leadRow(r.realm, r.room, r.invite, r.why));
        continue;
      }
      const task = homeLine(resolved.own, r) + w().dshContinue(r.room, verdict.wake.n);
      const why = await launch(authDir, runs, key, spec, task);
      // The cursor lands on the waking entry only when the continuation truly launched: a
      // refused one keeps the sleep, and the same word is tried again next tact (#10995).
      if (why === "launched") r.dormant = { ...r.dormant, cursor: verdict.wake.n };
      out.push(w().leadRow(r.realm, r.room, r.invite, `dormant_woken_${verdict.wake.n}, ${why}`));
      continue;
    }
    if ("end" in verdict) {
      r.state = "ended";
      r.why = verdict.end;
      r.dormant = { ...r.dormant, cursor: verdict.cursor };
      out.push(w().leadRow(r.realm, r.room, r.invite, r.why));
      continue;
    }
    r.dormant = { ...r.dormant, cursor: verdict.cursor };
  }
  return out;
}
