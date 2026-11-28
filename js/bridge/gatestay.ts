// A session's stay at the machine's return gate (returngate.ts; graph @nks/nks-dev, node #11375):
// a call is not held there past ~20 s. The gate says where the session waits — for the probe's
// outcome, its drawn delay, a free slot — and how long it expects the rest to take; a call that
// awaits the session's return (notPast) counts only its own time at the gate. Expected past the
// limit on arrival, at a draw, or found past it while waiting — the call answers at once with
// the estimate, and the return goes on in its place in the queue.
import { envName } from "../delivery/index.ts";
import { scoped } from "../shared/scope.ts";

const LIMIT_MS = ((v: number): number => (Number.isFinite(v) && v > 0 ? v : 20_000))(
  Number(process.env[envName("BRIDGE_RETURN_LIMIT_MS")]),
);

/** A call not held at the gate: the rest of its wait is about `waitMs`; the return goes on without it. */
export class ReturnLater extends Error {
  waitMs: number;
  constructor(waitMs: number) {
    super(`the seat is returning — not sent, about ${waitMs} ms more at the gate`);
    this.waitMs = waitMs;
  }
}

interface Stay {
  /** The best estimate of the rest of the session's wait at the gate, ms. */
  left: () => number;
}

const S = scoped(() => ({
  stay: null as Stay | null,
  /** When the current stay began, and the time at the gate before it. */
  from: 0,
  spent: 0,
  asking: new Set<() => void>(),
}));

const atGate = (): number => S.spent + (S.stay ? Date.now() - S.from : 0);
const tell = (): void => {
  for (const ask of [...S.asking]) ask();
};

/** This session waits at the gate now, the rest estimated by `left`; the returned function ends the stay. */
export function stayAt(left: () => number): () => void {
  const now = Date.now();
  if (S.stay) S.spent += now - S.from;
  const me: Stay = { left };
  S.stay = me;
  S.from = now;
  tell();
  return () => {
    if (S.stay !== me) return;
    S.spent += Date.now() - S.from;
    S.stay = null;
    tell();
  };
}

/**
 * `work` (this session's return, or a read for this call) awaited by a call — until the call's
 * time at the gate, spent and expected, passes LIMIT_MS: then the call rejects at once with
 * ReturnLater, `gaveUp` is told, and the work goes on; the next call finds it returned or nearer.
 */
export function notPast<T>(work: Promise<T>, gaveUp?: () => void): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const me = S;
    const base = atGate();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const end = (): void => {
      me.asking.delete(ask);
      clearTimeout(timer);
    };
    const ask = (): void => {
      clearTimeout(timer);
      const s = me.stay;
      if (!s) return;
      const used = atGate() - base;
      const left = Math.max(0, Math.round(s.left()));
      if (used + left <= LIMIT_MS) {
        timer = setTimeout(ask, LIMIT_MS - used + 1); // found past it while waiting
        return;
      }
      end();
      gaveUp?.();
      reject(new ReturnLater(left));
    };
    me.asking.add(ask);
    ask();
    void work.then(resolve, reject).finally(end);
  });
}
