import { envName } from "../delivery/index.ts";
import { now } from "./clock.ts";
import { CFG } from "./config.ts";
import { DeadGrantError, errorMessage, HoldOffError, TokenRefused } from "./errors.ts";
import { discover, resourceOf } from "./oauth/discovery.ts";
import { interactiveFlow, loginPublished } from "./oauth/flow.ts";
import { DEAD_RECHECK_MS, IN_CALL_WAIT_MS } from "./oauth/pacing.ts";
import { refreshShared, refusalStands } from "./oauth/refresh.ts";
import { loadStore, sleep, storePath } from "./store.ts";
import { debug, log } from "./streams.ts";
import { refreshHours, tokenUsable, usableTokens } from "./tokens.ts";
import { type Tokens } from "./types.ts";

export interface AuthOptions {
  /** ignore the cached access token (after an upstream 401) */
  force?: boolean;
  /** the token upstream actually refused, when the caller knows */
  rejected?: string | null;
  /** false forbids the browser (background keepalive) */
  interactive?: boolean;
  /** a top-up the caller does not actually need yet */
  proactive?: boolean;
}

// One token round per grant (the server's store), not per session: daemon sessions share it.
const authInFlight = new Map<string, { promise: Promise<Tokens>; interactive: boolean }>();

// What a long hold says beside the login: the grant is intact and would come
// back by itself — information, never an instruction to wait (graph @nks/nks-dev, node #4794).
function heldNote(until: number | null): string {
  if (until === null) return "the grant itself is whole";
  const minutes = Math.max(1, Math.round((until - now()) / 60_000));
  return `the grant itself is whole and comes back on its own in about ${minutes} min`;
}

// Returns fresh-enough tokens. Order: cached access token -> silent refresh ->
// (only if allowed) the browser flow. No answer ever tells a human to come back
// later (graph @nks/nks-dev, node #4794): a hold shorter than a call is slept through
// here and a longer one is answered with the login; a refused grant is knocked
// again, briefly, before a human is called in.
export async function ensureAuth(
  wwwAuthenticate: string | null,
  opts: AuthOptions = {},
): Promise<Tokens> {
  const { force = false, interactive = true, proactive = false } = opts;
  if (CFG.pat) {
    // A PAT is the whole grant: there is nothing to refresh and nobody to send
    // to a browser. Being here at all means the server refused it.
    throw new TokenRefused(
      `the personal access token from ${CFG.patSource} is refused by the server — revoked, ` +
        `expired or without rights to this graph; mint a new one on the graph's token page and ` +
        `put it in ${CFG.patSource}`,
    );
  }
  const grant = storePath();
  const flight = authInFlight.get(grant);
  if (flight) {
    // A background (non-interactive) attempt must not stand in for a caller
    // that is allowed to open the browser: await it, and if it could not
    // finish the job, run our own interactive round.
    if (!interactive || flight.interactive) return flight.promise;
    await flight.promise.catch(() => {});
    const again = authInFlight.get(grant);
    if (again) return again.promise; // someone else already restarted it
    const s = loadStore();
    if (tokenUsable(s.tokens)) return s.tokens;
  }
  const promise = (async () => {
    try {
      const s = loadStore();
      // force says the token we came with is no answer — upstream refused it
      // (401) or the keepalive found it about to expire. WHICH token that was
      // is what makes a sibling's newer one recognisable as progress, so a
      // caller that knows says so; only the keepalive, replacing whatever is on
      // disk, may take the store's word for it.
      const rejected = opts.rejected ?? (force ? (s.tokens?.access_token ?? null) : null);
      if (!force && tokenUsable(s.tokens)) return s.tokens;
      const meta = s.meta?.as ? s.meta : await discover(wwwAuthenticate);
      // Discovery runs once and its result is cached in the store, so an
      // override set later would never be seen — and the operator setting one
      // is, by definition, doing it AFTER a flow already ran and produced the
      // wrong audience. Apply it here, where the value is used, not only where
      // it is discovered.
      meta.resource = resourceOf(meta);
      if (interactive && s.tokens?.refresh_token && loginPublished() && refusalStands()) {
        // A login is out and the machine judged the grant dead moments ago:
        // the verdict is in, so the call joins the login rather than knock on
        // the grant again — one knock per stretch, not one per call.
        const landed = usableTokens({ rejected });
        if (landed) return landed;
        return await interactiveFlow(meta, s.tokens);
      }
      if (s.tokens?.refresh_token) {
        let rechecks = 0;
        let waited = 0;
        for (;;) {
          try {
            return await refreshShared(meta, rejected, proactive, interactive);
          } catch (e) {
            if (!interactive) {
              // The background opens no browser and sits out nothing: its knock
              // did not land, and the next tick or a caller's own call tries again.
              if (e instanceof DeadGrantError) {
                throw new Error(
                  "authorization required (refresh grant dead, browser flow deferred)",
                  { cause: e },
                );
              }
              throw e;
            }
            if (e instanceof HoldOffError) {
              // The first early refusal goes back to the caller, which repeats
              // the whole call once itself: that repeat is what was witnessed
              // succeeding in the field.
              if (e.retryNow) throw e;
              const left = e.until === null ? Infinity : e.until - now();
              if (left + waited <= IN_CALL_WAIT_MS) {
                const pause = Math.max(left, 0) + 100;
                waited += pause;
                debug(`${e.message} — sitting it out inside the call (${pause}ms)`);
                await sleep(pause);
                continue;
              }
              log(`${e.message} — offering the login beside the wait`);
              // A link, not a tab: the grant comes back by itself.
              return await interactiveFlow(meta, s.tokens, heldNote(e.until), false);
            }
            if (e instanceof DeadGrantError) {
              // A server mid-restart words a live grant's death the same way, so
              // knock again ourselves before a human is called in — unless the
              // grant's own hour has passed, or a login is already out: then the
              // verdict is already in.
              if (!e.expired && rechecks < DEAD_RECHECK_MS.length && !loginPublished()) {
                const pause = DEAD_RECHECK_MS[rechecks++] ?? 0;
                debug(`refresh refused (${e.message}) — knocking again in ${pause}ms`);
                await sleep(pause);
                continue;
              }
              log(`refresh grant is dead (${e.message}) — starting a fresh authorization`);
              return await interactiveFlow(meta, s.tokens);
            }
            throw e;
          }
        }
      }
      if (!interactive)
        throw new Error(
          `authorization required (no tokens, browser flow deferred) — or give the bridge a personal access token (${envName("BRIDGE_TOKEN")}, or the file <auth-dir>/token)`,
        );
      return await interactiveFlow(meta, s.tokens);
    } finally {
      authInFlight.delete(grant);
    }
  })();
  authInFlight.set(grant, { promise, interactive });
  return promise;
}

// Keep the grant alive even when the harness makes no MCP calls: refresh the
// access token shortly before expiry, rotating the refresh token with it, so
// an idle session never decays into a dead grant and a surprise browser trip.
//
// The margin is a wish, not a right: a refresh token held back until the access
// token is nearly spent (nbf) cannot be used early however much time the margin
// would like. Asking anyway buys nothing and spends a refusal, so the keepalive
// waits for the later of the two hours.
const REFRESH_MARGIN_MS = 3 * 60_000;

export function startTokenKeepalive(): void {
  if (CFG.pat) return; // a PAT has no hour to keep
  const tick = () => {
    const t = loadStore().tokens;
    if (!t?.refresh_token) return;
    const expiresAt = t.expires_at || 0;
    if (!expiresAt || expiresAt - now() >= REFRESH_MARGIN_MS) return;
    const hours = refreshHours(t);
    if (hours.nbf && now() < hours.nbf) {
      debug(
        `refresh token not in force for another ${Math.round((hours.nbf - now()) / 1000)}s — waiting`,
      );
      return;
    }
    if (hours.exp && now() >= hours.exp) {
      debug("the grant is past its own expiry — only a human can mend it now");
      return; // spending refusals on a grant whose hour has passed teaches nobody anything
    }
    if (refusalStands()) {
      debug("the grant stands refused — the machine's control knock is not due yet");
      return;
    }
    ensureAuth(null, { force: true, interactive: false, proactive: true })
      .then(() => debug("background token refresh ok"))
      .catch((e) => log(`background token refresh: ${errorMessage(e)}`));
  };
  tick(); // an already-expired store refreshes on startup, before the first call
  setInterval(tick, 60_000).unref();
}
