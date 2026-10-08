// Checking GitHub releases (RELEASES): API rate limit and reset, API and release page
// refusals, HTTP refusal.
import type { Lang } from "../lang.ts";

export interface ReleasesWords {
  reset: (iso: string, min: number) => string;
  noReset: () => string;
  perHour: (limit: number) => string;
  anyHourly: () => string;
  exhausted: (per: string, reset: string) => string;
  secondary: (reset: string) => string;
  recordedByOther: (reset: string) => string;
  httpFrom: (status: number, url: string) => string;
  noTag: (status: number, url: string, location: string) => string;
  fromPage: (apiError: string, tag: string) => string;
  fallback: () => string;
}

export const RELEASES: Readonly<Record<Lang, ReleasesWords>> = {
  en: {
    reset: (iso, min) => `reset ${iso} (in ${min} min)`,
    noReset: () => "GitHub did not name the reset time",
    perHour: (limit) => `${limit} requests an hour`,
    anyHourly: () => "an hourly limit",
    exhausted: (per, reset) =>
      `the anonymous GitHub API limit is exhausted: ${per} per the machine's external address, shared by all bridges and clients behind it; ${reset}`,
    secondary: (reset) =>
      `GitHub API secondary limit: too frequent requests from the machine's external address; ${reset}`,
    recordedByOther: (reset) =>
      `a GitHub API limit recorded by another bridge of the machine; ${reset}`,
    httpFrom: (status, url) => `HTTP ${status} from ${url}`,
    noTag: (status, url, location) =>
      `HTTP ${status} from ${url}${location ? ` → ${location}` : ""} — no tag`,
    fromPage: (apiError, tag) =>
      `releases: the API did not answer (${apiError}) — tag ${tag} from the releases page`,
    fallback: () => "fallback",
  },
};
