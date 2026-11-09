// The identity against which register is checked comes from our connect/held, not its claim.
import { scoped } from "../shared/scope.ts";
import { type SpawnIdentity, type SpawnReceipt } from "../shared/spawned-for.ts";
import { seatField } from "./fields.ts";
import { holdsStanding, standingIdIn } from "./hold.ts";
import { keyOf } from "./holdrecord.ts";

type Asked = { realm?: unknown; karta?: unknown; name?: unknown };
const key = (a: Asked): string => keyOf(String(a.realm), String(a.karta), String(a.name ?? ""));
const S = scoped(() => ({
  identities: new Map<string, SpawnIdentity>(),
  receipts: new Map<string, SpawnReceipt>(),
}));

export function noteClaimSeat(a: Asked, structured: unknown): void {
  const seat = seatField(structured, "connect");
  if (!seat) return;
  S.identities.set(key(a), {
    ...(seat.seat_id ? { seat_id: seat.seat_id } : {}),
    ...(seat.standing ? { standing: seat.standing } : {}),
    name: String(a.name ?? ""),
  });
}

export function claimIdentity(a: Asked): SpawnIdentity {
  const known = S.identities.get(key(a));
  if (known?.seat_id || known?.standing) return known;
  const id = holdsStanding(String(a.realm), String(a.karta), String(a.name ?? ""))
    ? standingIdIn(String(a.realm))
    : null;
  return id ? { seat_id: id, name: String(a.name ?? "") } : {};
}

export const noteClaimReceipt = (a: Asked, receipt: SpawnReceipt): void => {
  S.receipts.set(key(a), receipt);
};
export const claimReceipt = (a: Asked): SpawnReceipt | undefined => S.receipts.get(key(a));
