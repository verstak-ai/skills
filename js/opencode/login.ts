// The human's sign-in in the browser — shared by all the plugin's bridges (tools.ts): said once
// per sign-in, and a call waiting for the handshake is let go the moment the bridge asked for a
// sign-in — the human is not waited for inside a call, the address goes back as the answer.
import { OPENCODE, OPENCODE_KEEP } from "../delivery/index.ts";
import { words } from "../shared/lang.ts";
import type { Say } from "./tools.ts";

export interface Login {
  /** The bridge waits for the human's sign-in. */
  readonly pending: boolean;
  /** The sign-in address the bridge named. */
  readonly url: string | null;
  /** The sign-in page with a code — the same sign-in from another device, if the bridge named it. */
  readonly device: string | null;
  /** The bridge asked for a sign-in (handshake): waiters are let go, the human gets a word, one per sign-in. */
  on(url: string | null, device?: string | null): void;
  /** The handshake passed — the sign-in is over. */
  done(): void;
  /** The handshake raced against the sign-in: a requested sign-in is the call's refusal with the address. */
  race(ready: () => Promise<void>): Promise<void>;
}

/**
 * How to sign in not from the OpenCode machine: the page with a code, if the server gives one,
 * otherwise a tunnel or a token. `device` without an address — the bridge's word why there is no code.
 */
export function elsewhere(device: string | null): string {
  const W = words(OPENCODE_KEEP);
  return device && /^https?:/.test(device)
    ? W.elsewhereDevice(device)
    : W.elsewhereTunnel(device ?? "");
}

export function createLogin(say: Say): Login {
  const W = words(OPENCODE_KEEP);
  // The sign-in ended or the bridge opened a new one (another link) — it is said again.
  let pending = false;
  let url: string | null = null;
  let device: string | null = null;
  const waiters = new Set<() => void>();
  /** The sign-in promise and its removal — a call that ended otherwise leaves no waiter behind. */
  function started(): { promise: Promise<void>; cancel: () => void } {
    if (pending) return { promise: Promise.resolve(), cancel() {} };
    let waiter: () => void = () => {};
    const promise = new Promise<void>((r) => (waiter = r));
    waiters.add(waiter);
    return { promise, cancel: () => waiters.delete(waiter) };
  }
  function error(): Error {
    const O = words(OPENCODE);
    return new Error(
      W.needLoginError(url ? O.openInBrowser(url) : O.finishInBrowser(), elsewhere(device)),
    );
  }
  return {
    get pending() {
      return pending;
    },
    get url() {
      return url;
    },
    get device() {
      return device;
    },
    on(next, nextDevice = null) {
      for (const w of waiters) w();
      waiters.clear();
      if (pending && next === url && nextDevice === device) return;
      pending = true;
      url = next;
      device = nextDevice;
      say(
        W.needLogin(next ? W.openAndFinish(next) : W.finishItInBrowser(), elsewhere(device)),
        "warning",
      );
    },
    done() {
      pending = false;
      url = null;
      device = null;
    },
    async race(ready) {
      if (pending) throw error();
      const login = started();
      try {
        await Promise.race([
          ready(),
          login.promise.then(() => {
            throw error();
          }),
        ]);
      } finally {
        login.cancel();
      }
    },
  };
}
