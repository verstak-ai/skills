// The launch basis's refusals (SPAWNED_FOR; graph @nks/nks-dev, node #9959): a malformed pair, a
// register that does not echo it, a prompt not proven initial, a seat not proven fresh, a raw
// connect carrying it, a seat not yet rebound, the schema's description, and the words to a seat
// taken or already held by the pair.
import type { Lang } from "../lang.ts";
import { tool } from "../protocol.ts";

export interface SpawnedForWords {
  invalid: () => string;
  echo: () => string;
  initial: () => string;
  kept: (seat: string) => string;
  connect: () => string;
  unbound: () => string;
  schema: () => string;
  /** Register confirmed the pair: the session joins the case before any work. */
  taken: (realm: string, room: string, invite: number) => string;
  /** The session already stands on a seat for this pair: no second seat, join the case. */
  held: (place: string, realm: string, room: string, invite: number) => string;
}

export const SPAWNED_FOR: Readonly<Record<Lang, SpawnedForWords>> = {
  en: {
    invalid: () =>
      "spawned_for requires {invite: positive safe integer, room: UUID}; invalid JSON, a duplicate key or conflicting sources. Do not take a seat.",
    echo: () =>
      "Register did not confirm the same spawned_for pair. The launch is not confirmed; do not start work.",
    initial: () =>
      "spawned_for: an empty prior session context did not prove this is the initial prompt. The history is nonempty, unavailable or of an unknown shape; no seat was taken.",
    kept: (seat: string) =>
      `spawned_for: this attempt did not prove seat ${seat} fresh; the previous seat is not revoked. The seat may remain.`,
    connect: () =>
      `Raw channel connect does not accept spawned_for. Use ${tool("stand")}: connect without the field, then register with the pair. No seat was taken.`,
    unbound: () =>
      "spawned_for: the taken seat is not yet bound to this session again after a passing refusal; the bridge retries before the next call. This call did not run; another seat or a call without the pair does not replace it.",
    schema: () =>
      "The launch basis: the invitation's number within its case and the case's UUID. Register must confirm the same pair; a refusal is not bypassed with another name or take.",
    taken: (realm, room, invite) =>
      `You were taken for invitation ${invite} of case ${room} in graph ${realm}: register confirmed the pair. Before any work, join that case — ${tool("case")}(action="join", realm="${realm}", room="${room}") — and read its assignment; not joined — do not work, and say why.`,
    held: (place, realm, room, invite) =>
      `This session already stands on seat ${place} for invitation ${invite} of case ${room}: the pair is confirmed, no second seat is registered. Join the case — ${tool("case")}(action="join", realm="${realm}", room="${room}") — before any work.`,
  },
};
