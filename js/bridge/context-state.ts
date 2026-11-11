// Scoped recovery state, reconciled with its saved mark (graph @nks/nks-dev, node #10121).
import { scoped } from "../shared/scope.ts";
import {
  clearContextMark,
  type ContextMark,
  newContextMark,
  readContextMark,
  writeContextMark,
} from "./context-store.ts";
import { holdsStanding } from "./hold.ts";
import { usagePlace } from "./usage.ts";

export interface Recovery {
  mark: ContextMark;
  required: Set<string> | null;
  loaded: Set<string>;
  calls: Map<string, string>;
}
const S = scoped(() => ({ pending: null as Recovery | null, fault: null as string | null }));
const fresh = (mark: ContextMark): Recovery => ({
  mark,
  required: null,
  loaded: new Set(),
  calls: new Map(),
});
export const recoverySeat = (): string | null => {
  const p = usagePlace();
  return p && holdsStanding(p.realm, p.karta, p.name ?? "")
    ? JSON.stringify([p.realm, p.karta, p.name])
    : null;
};
export const recoveryFault = (): string | null => S.fault;

/** A known mark never becomes readiness because its file vanished or failed to write. */
export function currentRecovery(): Recovery | null {
  const own = recoverySeat();
  if (!own) return null;
  try {
    const disk = readContextMark(own);
    if (disk?.pending) {
      if (S.pending?.mark.generation !== disk.generation) S.pending = fresh(disk);
    } else if (S.pending) {
      if (disk?.generation === S.pending.mark.generation && !disk.pending) S.pending = null;
      else {
        if (S.pending.mark.seat !== own) S.pending = fresh(newContextMark(own));
        writeContextMark(S.pending.mark);
      }
    }
    S.fault = null;
  } catch (e) {
    S.fault = (e as Error).message;
    S.pending = fresh(S.pending?.mark.seat === own ? S.pending.mark : newContextMark(own));
  }
  return S.pending;
}

export function beginRecovery(own: string): Recovery {
  const r = fresh(newContextMark(own));
  S.pending = r;
  try {
    writeContextMark(r.mark);
    S.fault = null;
  } catch (e) {
    S.fault = (e as Error).message;
    throw e;
  }
  return r;
}

/** A generation is cleared only after its generation-specific proof is written. */
export function finishRecovery(r: Recovery): void {
  try {
    if (currentRecovery() !== r || S.fault)
      throw new Error(S.fault ?? "context recovery generation changed");
    clearContextMark(r.mark);
    S.pending = null;
  } catch (e) {
    S.fault = (e as Error).message;
    throw e;
  }
}
