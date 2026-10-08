// Hold record when a session leaves an unreleased seat (graph @nks/nks-dev, nodes #5067, #6649).
import { harnessName } from "./client.ts";
import { readHoldRecord, writeHoldRecord } from "./holdrecord.ts";
import { H } from "./holdstate.ts";
import { extraPlaces, rememberExtraStatus } from "./places.ts";
import { state } from "./transport.ts";

/**
 * Refreshes `at` of an existing hold record when the session leaves: the record's term
 * counts from the socket's last life, and an erased record is not revived.
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
