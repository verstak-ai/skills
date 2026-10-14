// Stop orders in flight in this session (graph @nks/nks-dev, node #7510): the session's end
// waits for their outcomes, bounded — the harness kills a bridge that does not go. An outcome
// known but not answered by then stays in the journal: the next bridge's start answers it.
import { envName } from "../delivery/index.ts";
import { scoped } from "../shared/scope.ts";
import { isTerminal, type OrderEntry, readOrder, writeOrder } from "./orderjournal.ts";
import { sleep } from "./store.ts";
import { log } from "./streams.ts";

/** Below the harness's grace between closing the bridge and killing it (5 s in bridge-client.ts). */
const WAIT_MS = Number(process.env[envName("BRIDGE_ORDER_WAIT_MS")]) || 4000;

interface Flight {
  done: Promise<void>;
  /** the outcome once the stop is through, before it is answered */
  end: OrderEntry | null;
}

const F = scoped(() => ({ running: new Map<string, Flight>() }));

/** Run the order's handler as one in flight until it returns. */
export function fly(id: string, run: (f: Flight) => Promise<void>): Promise<void> {
  const f: Flight = { done: Promise.resolve(), end: null };
  const running = F.running;
  f.done = run(f).finally(() => running.delete(id));
  running.set(id, f);
  return f.done;
}

/** The session ends: wait for the orders in flight, at most WAIT_MS; what is left — on disk. */
export async function ordersSettled(): Promise<void> {
  const running = F.running;
  if (!running.size) return;
  await Promise.race([
    Promise.allSettled([...running.values()].map((f) => f.done)),
    sleep(WAIT_MS),
  ]);
  for (const [id, f] of running) {
    const known = readOrder(id);
    if (f.end && !(known && isTerminal(known.state))) writeOrder(f.end);
    log(
      `stop order ${id}: the bridge ends before its answer — ${f.end ? "left in the journal" : "no outcome yet"}`,
    );
  }
}
