// A serving bridge explicitly reports whether it can replace this provisional seat (#7972).
// Consumers must not infer that capability by reading a record an older daemon may ignore.
import { readHoldRecord, sessionOfBridge } from "./holdrecord.ts";
import { automaticSeat } from "./seatorigin.ts";

export function seatProof(key: string | null): {
  place?: { realm: string; karta: string; name: string };
  provisional?: boolean;
  key?: string;
} {
  const r = key ? readHoldRecord(key, true) : null;
  if (!r) return {};
  return {
    key: key ?? undefined,
    place: { realm: r.realm, karta: String(r.karta), name: r.name },
    provisional: r.provisional === true && !!r.session && r.session === sessionOfBridge(),
  };
}

export const heldProof = (key: string, place?: { realm: string; karta: string; name: string }) => ({
  kind: "held" as const,
  key,
  ...(place ? { place } : {}),
  ...seatProof(key),
  automatic: automaticSeat(),
});
