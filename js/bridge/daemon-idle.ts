// The machine daemon's idle window: it leaves after the last session; a pending
// login holds it at most as long as an orphaned bridge (graph @nks/nks-dev, nodes
// #6620, #4794).
import { pendingFlow } from "./oauth/flow.ts";
import { ORPHAN_FLOW_MS } from "./oauth/pacing.ts";
import { log } from "./streams.ts";

export interface IdleWatch {
  /** No sessions: restart the idle window. */
  arm: () => void;
  /** A session came or the daemon hands seats over: the window is off. */
  hold: () => void;
}

const secs = (ms: number): number => Math.round(ms / 1000);

export function idleWatch(idleMs: number, busy: () => boolean, leave: () => void): IdleWatch {
  let timer: ReturnType<typeof setTimeout> | null = null;
  // Timers of a former round stay silent after hold or arm.
  let round = 0;
  const hold = (): void => {
    round++;
    if (timer) clearTimeout(timer);
    timer = null;
  };
  const arm = (): void => {
    hold();
    if (busy()) return;
    const mine = round;
    timer = setTimeout(() => {
      timer = null;
      if (busy()) return;
      const flow = pendingFlow();
      if (!flow) {
        log(`no session for ${secs(idleMs)}s — the daemon leaves`);
        return leave();
      }
      // This process listens for the login callback: leaving now would lose the click.
      log(
        `idle, but an authorization flow is pending — staying for the human's click, at most ${secs(ORPHAN_FLOW_MS)}s`,
      );
      timer = setTimeout(() => {
        timer = null;
        if (round !== mine || busy()) return;
        log(
          `no session and the login unclicked for ${secs(ORPHAN_FLOW_MS)}s — the daemon leaves; the next bridge takes the login over on its link`,
        );
        leave();
      }, ORPHAN_FLOW_MS);
      void flow.finally(() => {
        if (round === mine) arm();
      });
    }, idleMs);
  };
  return { arm, hold };
}
