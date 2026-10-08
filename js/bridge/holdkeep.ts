// Hold record when a session leaves an unreleased seat (graph @nks/nks-dev, nodes #5067, #6649).
import { harnessName } from "./client.ts";
import { readHoldRecord, sessionOfBridge, writeHoldRecord } from "./holdrecord.ts";
import { H } from "./holdstate.ts";
import { extraPlaces, rememberExtraStatus } from "./places.ts";
import { state } from "./transport.ts";

/**
 * Refreshes `at` of an existing hold record when the session leaves: the record's term
 * counts from the socket's last life, and an erased record is not revived.
 * Counted from the last write, a seat held past the term without a new busy line would
 * leave with an expired record; a dead socket stamps its last life, not now.
 */
export function keepHoldRecord(): void {
  const s = state.standing;
  const key = H.currentKey;
  if (!s || !key || !H.currentUrl) return;
  const alive = !!H.holder?.alive;
  const at = alive ? Date.now() : Math.max(H.holder?.heardAt ?? 0, H.heardAt);
  const ch = { url: H.currentUrl, statusUrl: H.currentStatusUrl, cwd: H.standCwd };
  const was = readHoldRecord(key, true);
  if (was && at > (was.at ?? 0))
    writeHoldRecord(
      key,
      {
        ...was,
        realm: s.realm,
        karta: s.karta,
        name: s.name ?? "",
        url: ch.url,
        statusUrl: ch.statusUrl,
        cwd: ch.cwd ?? was.cwd,
        client: harnessName(),
        key,
      },
      false,
      at,
    );
  if (!alive) return; // only a live socket refreshes the extra seats
  for (const p of extraPlaces()) {
    const r = readHoldRecord(p.door.key, true);
    if (r) rememberExtraStatus(p.door.key, { ...ch, cwd: ch.cwd ?? r.cwd }, r.status ?? "");
  }
}

/**
 * A session is named to a bridge that already holds a seat (a return from disk before the
 * plugin's word): the records of the held seats, main and beside, carry it at once — an
 * unsigned record under a live holder reads as a seat any named session of the harness may
 * take as its own (graph @nks/nks-dev, node #6702).
 */
export function signHeldRecord(): void {
  const key = H.currentKey;
  if (!key || !H.holder?.alive || !sessionOfBridge()) return;
  for (const k of [key, ...extraPlaces().map((p) => p.door.key)]) {
    const rec = readHoldRecord(k); // seats beside in other graphs share the channel and its url
    if (rec && !rec.session && rec.url === H.currentUrl) writeHoldRecord(k, rec);
  }
}
