// The loopback sign-in browser page (CALLBACK, arguments already HTML-escaped) and
// sign-in-by-code refusals (DEVICE_CLIENT).
import type { Lang } from "../lang.ts";

export interface CallbackWords {
  loginUnreachable: (error: string) => string;
  anotherTab: () => string;
  refused: (err: string) => string;
  stillRunning: () => string;
  failed: (failure: string) => string;
  authenticated: () => string;
  abandoned: () => string;
  loginOver: () => string;
}

const CALLBACK_EN: CallbackWords = {
  loginUnreachable: (error) =>
    `<h3>verstak-bridge: the sign-in page could not be reached (${error}) — reload this page.</h3>`,
  anotherTab: () => "verstak-bridge: another tab is finishing this login — you can close this one.",
  refused: (err) => `verstak-bridge: authorization failed (${err})`,
  stillRunning: () =>
    "verstak-bridge: the code arrived and the exchange is still running — watch the agent.",
  failed: (failure) =>
    `verstak-bridge: authorization failed (${failure}) — nothing was stored; the agent has the details.`,
  authenticated: () => "verstak-bridge: authenticated — you can close this tab.",
  abandoned: () => "verstak-bridge: the login was abandoned — nothing was stored.",
  loginOver: () =>
    "verstak-bridge: this page belongs to a login that is over — open the link the agent gave you.",
};

export const CALLBACK: Readonly<Record<Lang, CallbackWords>> = { en: CALLBACK_EN };

export interface DeviceClientWords {
  bareRefusal: (id: string, status: number | undefined) => string;
  namedRefused: (id: string, word: string) => string;
  unset: (id: string) => string;
}

export const DEVICE_CLIENT: Readonly<Record<Lang, DeviceClientWords>> = {
  en: {
    bareRefusal: (id, status) =>
      `the sign-in server refused a sign-in code to the client ${id}: ${status} with no word why — a move for the operator of the sign-in server`,
    namedRefused: (id, word) =>
      `the sign-in server refused the client ${id} named by VERSTAK_BRIDGE_DEVICE_CLIENT (${word}) — fix the variable or the client on the server`,
    unset: (id) =>
      `sign-in by code is not set up on this server: there is no client ${id} — a move for the operator of the sign-in server`,
  },
};
