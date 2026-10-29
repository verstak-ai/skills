// A harness session's word on its turn to its bridge, for the seat's pulse (graph @nks/nks-dev,
// node #7529) — the OpenCode plugin's and the pi extension's one line. One request in flight at a
// time: changes told meanwhile fold into the waiting word — the latest, state and clocks together
// — which goes when the request returns. A refused word goes again after RETRY_MS unless a change
// tells it first; with no bridge it waits for the next change or again(). A dropped line sends
// nothing more, and the late outcome of its request touches nothing.
import { method } from "../delivery/index.ts";
import { type Bridge } from "./bridge-client.ts";

export interface TurnWord {
  state?: string;
  turn_at?: string;
  read_at?: string;
  act_at?: string;
}

export interface WordLine {
  /** The word as told so far. */
  word(): TurnWord;
  /** A change; one the bridge already has goes nowhere. */
  tell(change: TurnWord): void;
  /** The word goes again even unchanged: a seat taken or returned. */
  again(): void;
  /** The line is over. */
  drop(): void;
}

/** A word the bridge refused is told again this much later, unless a change tells it first. */
const RETRY_MS = 2_000;

export function wordLine(bridge: () => Bridge | null): WordLine {
  let word: TurnWord = {};
  let owed = false; // the bridge has not taken the current word
  let flying = false;
  let dropped = false;
  let retry: ReturnType<typeof setTimeout> | undefined;

  const flush = (): void => {
    if (dropped || flying || !owed) return;
    const b = bridge();
    if (!b) return;
    clearTimeout(retry);
    retry = undefined;
    owed = false;
    flying = true;
    const done = (taken: boolean): void => {
      if (dropped) return;
      flying = false;
      if (taken || owed) return flush();
      owed = true;
      retry = setTimeout(() => {
        retry = undefined;
        flush();
      }, RETRY_MS);
      retry.unref?.();
    };
    b.request(method("pulse"), word, { timeoutMs: 5_000 }).then(
      () => done(true),
      () => done(false),
    );
  };

  return {
    word: () => word,
    tell(change) {
      if (dropped) return;
      const next = { ...word, ...change };
      if (JSON.stringify(next) !== JSON.stringify(word)) {
        word = next;
        owed = true;
      }
      flush();
    },
    again() {
      if (dropped || !Object.keys(word).length) return;
      owed = true;
      flush();
    },
    drop() {
      dropped = true;
      clearTimeout(retry);
      retry = undefined;
    },
  };
}
