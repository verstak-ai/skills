// Busy line trim nudge and status address refusals (STATUS_POST).
import type { Lang } from "../lang.ts";

export interface StatusPostWords {
  trimmedBy: (message: string) => string;
  trimmed: () => string;
  noAnswer: (error: string) => string;
  gone: (body: string) => string;
  refused: (status: number, body: string) => string;
}

export const STATUS_POST: Readonly<Record<Lang, StatusPostWords>> = {
  en: {
    trimmedBy: (message) => `the server trimmed the line: ${message}`,
    trimmed: () =>
      "the server trimmed the line; the full text is in the seat's history, rename it shorter",
    noAnswer: (error) => `Refused (bridge): the status address did not answer — ${error}`,
    gone: (body) =>
      `Refused (404) by the surface: ${body || "no body"} — this seat address no longer addresses: another holder's connect may have turned it, or another instance of the same session's bridge may have held it. Whose it is now, the bridge cannot know from here.`,
    refused: (status, body) => `Refused (${status}) by the surface: ${body || "no body"}`,
  },
};
