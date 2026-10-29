// POSTs to one status address in turn after a fall back from the dispatcher (graph @nks/nks-dev,
// node #8620): the lines held for hello open the turn, a fresh line waits behind them, so an
// older line never lands after a newer one. With no turn open a POST goes at once, as before.
const tails = new Map<string, Promise<unknown>>();

/** `fn` in the turn of `url`; `open` — start one if none is (the held lines). */
export function inTurn<T>(url: string, fn: () => Promise<T>, open = false): Promise<T> {
  const prev = tails.get(url) ?? (open ? Promise.resolve() : null);
  if (!prev) return fn();
  const next = prev.then(fn, fn);
  const tail = next.catch(() => {});
  tails.set(url, tail);
  void tail.then(() => {
    if (tails.get(url) === tail) tails.delete(url);
  });
  return next;
}

/**
 * `fn` in the turn of `url` within `ms` counted from now, the wait included — a leave keeps its
 * own cap whatever waits ahead (`fn` gets the deadline and must not send past it); past the
 * limit — `late()`, at once.
 */
export function inTurnWithin<T>(
  url: string,
  ms: number,
  fn: (until: number) => Promise<T>,
  late: () => T,
): Promise<T> {
  const until = Date.now() + ms;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const expired = new Promise<T>((resolve) => {
    timer = setTimeout(() => resolve(late()), ms);
    timer.unref?.();
  });
  return Promise.race([inTurn(url, () => fn(until)), expired]).finally(() => clearTimeout(timer));
}
