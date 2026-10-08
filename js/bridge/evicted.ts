// Seat taken by close 4000 (graph @nks/nks-dev, nodes #6706, #5402): a session never
// stays deaf silently. Taken by a new bridge of the same harness session — yield quietly;
// taken by another session — stand beside as name.N with hearing and say so.
import { scoped } from "../shared/scope.ts";
import { CFG } from "./config.ts";
import { signedRealm } from "./deaf.ts";
import { type ChannelEvent } from "./door.ts";
import { UpstreamError } from "./errors.ts";
import { broadcast, ledKey, notify, releaseStanding, wasEvicted } from "./hold.ts";
import { readHoldRecord, sessionOfBridge } from "./holdrecord.ts";
import { H, whenEvicted } from "./holdstate.ts";
import { holdWords } from "./holdwords.ts";
import { otherRealm } from "./realms.ts";
import { baseOf } from "./separate.ts";
import { standingLog } from "./store.ts";
import { log } from "./streams.ts";
import { ownTaking, takerOf } from "./taking.ts";
import { reinitialize, type Standing, state } from "./transport.ts";
import { type JsonRpcMessage } from "./types.ts";

/** Re-read interval of the new holder's intent and record while its connect is in flight. */
const LOOK_MS = 100;
/** Delay before retrying the seat beside after a network failure. */
const RETRY_MS = 2000;

export type StandBeside = (
  place: Standing,
  cwd: string | null,
) => Promise<{ ok: boolean; text: string } | null>;

/** The eviction word goes to watchdogs, the notification client and late attachers. */
function announceEvicted(code: number, text: string): void {
  log(text);
  const ev: ChannelEvent = { kind: "evicted", code, text };
  H.evictedEvent = ev;
  broadcast(ev);
  notify("warning", ev);
}

/**
 * Whether this session's new bridge took the seat — a hold record under the same key
 * with another url. While its connect is in flight (intent in taking.ts) wait for the
 * outcome: the intent is written before connect, so without it the taker is foreign.
 */
async function takenBySession(key: string, url: string): Promise<boolean> {
  const me = sessionOfBridge();
  if (!me) return false;
  const changed = (): boolean | null => {
    const r = readHoldRecord(key, true);
    return r && r.url !== url ? r.session === me : null;
  };
  for (;;) {
    const got = changed();
    if (got !== null) return got;
    if (takerOf(key) !== me) return changed() ?? false; // the record may land just before the intent is erased
    await new Promise((res) => setTimeout(res, LOOK_MS));
  }
}

/**
 * Stand beside: a network failure gets one delayed retry, then a failure with its word.
 * null — the seat stopped being evicted meanwhile.
 */
async function standBeside(
  key: string,
  s: Standing,
  name: string,
  beside: StandBeside,
  once = false,
): Promise<{ ok: boolean; text: string } | null> {
  // An attempt broken after the beside connect already moved the bridge off — the retry finishes it.
  let moved = false;
  let reopened = false;
  let retry = once;
  for (;;) {
    if (!moved && !wasEvicted(s.realm, s.karta, name)) return null;
    try {
      return await beside(s, H.standCwd);
    } catch (e) {
      moved ||= ledKey() !== key;
      // The server session died under the attempt — reopen and retry, not a network failure.
      if (e instanceof UpstreamError && e.kind === "session" && !reopened) {
        reopened = true;
        const back = await reinitialize().then(
          () => true,
          () => false,
        );
        if (back) continue;
      }
      const why = e instanceof Error ? e.message : String(e);
      standingLog(`evicted ${key}: standing beside failed (${why})${retry ? "" : " — one retry"}`);
      if (retry) return { ok: false, text: why };
      retry = true;
      await new Promise((res) => setTimeout(res, RETRY_MS));
    }
  }
}

async function yieldPlace(key: string, url: string, code: number): Promise<void> {
  // Own connect of this seat in flight: 4000 overtook its answer — this bridge moved the url itself.
  const own = ownTaking(key);
  if (own) {
    await own;
    if (H.currentUrl !== url) return;
  }
  const s = state.standing;
  const beside = B.beside;
  if (await takenBySession(key, url)) {
    if (ledKey() !== key) return; // the bridge took another seat meanwhile
    standingLog(`evicted ${key} by this session's new bridge — released quietly`);
    releaseStanding(holdWords().takenBySession(), false, false, true);
    return;
  }
  // A satellite lives by its run and never stands beside; an unnamed seat has no base for name.N.
  const name = s?.name ?? "";
  if (CFG.satellite || !s || !name || !beside)
    return announceEvicted(code, holdWords().evicted(code));
  const base = baseOf(s.realm, s.karta, name); // a taken seat beside: next beside its base, not proba.2.2
  announceEvicted(code, holdWords().evictedBeside(code, name, base));
  F.failed = null;
  await besideAndSay(key, s, name, base, beside, [...state.places]);
}

/**
 * Stand beside and tell the session the outcome. Seats of other graphs on the taken
 * channel stand again on the new one. On failure the seat is remembered: the next
 * harness call retries before signing with the taken seat (standing.ts).
 */
async function besideAndSay(
  key: string,
  s: Standing,
  name: string,
  base: string,
  beside: StandBeside,
  extras: Standing[],
  once = false,
): Promise<void> {
  const r = await standBeside(key, s, name, beside, once);
  if (!r) return;
  const others: string[] = [];
  if (r.ok)
    for (const x of extras) {
      const again = await beside(x, H.standCwd).catch((e: unknown) => ({
        ok: false,
        text: e instanceof Error ? e.message : String(e),
      }));
      others.push(
        holdWords().besideOther(`${x.name ?? ""} (${x.realm})`, !!again?.ok, again?.text ?? ""),
      );
    }
  F.failed = r.ok ? null : { key, s, name, base, extras };
  const text = [
    r.ok ? holdWords().besideDone(name, r.text) : holdWords().besideFailed(name, base, r.text),
    ...others,
  ].join("\n");
  log(text);
  standingLog(`evicted ${key}: ${r.ok ? "stood beside" : "could not stand beside"}`);
  // Into the session as a "resumed" word (#5366): the plugin injects it as a prompt.
  notify("warning", { kind: "resumed", text });
}

/** What to retry after a failed stand-beside; one attempt in flight. */
const F = scoped(() => ({
  failed: null as {
    key: string;
    s: Standing;
    name: string;
    base: string;
    extras: Standing[];
  } | null,
  again: null as Promise<void> | null,
  /** The post-eviction move in flight — a harness call awaits it. */
  pending: null as Promise<void> | null,
}));

/**
 * Before a harness call, one more stand-beside attempt without delay. true — the taken
 * seat still leads and must not sign (#6706).
 */
export async function standBesideAgain(): Promise<boolean> {
  if (F.pending) await F.pending;
  const s = state.standing;
  if (!s || !wasEvicted(s.realm, s.karta, s.name ?? "")) {
    F.failed = null;
    return false;
  }
  const f = F.failed;
  const beside = B.beside;
  if (f && beside && !F.again)
    F.again = besideAndSay(f.key, f.s, f.name, f.base, beside, f.extras, true).finally(() => {
      F.again = null;
    });
  if (F.again) await F.again;
  return (
    !!state.standing &&
    wasEvicted(state.standing.realm, state.standing.karta, state.standing.name ?? "")
  );
}

/**
 * Refuse a harness call into the graph of any seat of the taken channel until the bridge
 * stands beside: the write would be signed by a deaf seat (#6706). Stand and unsigned moves pass.
 */
export function evictedRefusal(msg: JsonRpcMessage): string | null {
  const s = state.standing;
  if (!s || !wasEvicted(s.realm, s.karta, s.name ?? "")) return null;
  // Eviction closes the whole channel: seats of other graphs on it are deaf too.
  const realm = signedRealm(msg);
  if (realm == null || [s, ...state.places].every((p) => otherRealm(realm, p.realm))) return null;
  return holdWords().evictedRefusal(s.name ?? "", baseOf(s.realm, s.karta, s.name ?? ""));
}

/** The stand tool (stand.ts), injected to avoid an import cycle. */
const B: { beside: StandBeside | null } = { beside: null };
whenEvicted((key, url, code) => {
  F.pending = yieldPlace(key, url, code).finally(() => {
    F.pending = null;
  });
});
export function wireEviction(beside: StandBeside): void {
  B.beside = beside;
}
