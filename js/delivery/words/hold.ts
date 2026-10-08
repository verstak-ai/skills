// The socket holder (HOLD); dead-token advice comes as an argument.
import type { Lang } from "../lang.ts";

export interface HoldWords {
  newSocket: () => string;
  revokedOwn: () => string;
  closedOwn: () => string;
  resumeFailed: () => string;
  tokenDead: () => string;
  parked: (reason: string) => string;
  evicted: (code: number) => string;
  evictedBeside: (code: number, name: string, base: string) => string;
  besideDone: (name: string, said: string) => string;
  besideFailed: (name: string, base: string, said: string) => string;
  evictedRefusal: (name: string, base: string) => string;
  besideOther: (place: string, ok: boolean, said: string) => string;
  takenBySession: () => string;
  dead: (advice: string) => string;
  alive: (version: string) => string;
}

export const HOLD: Readonly<Record<Lang, HoldWords>> = {
  en: {
    newSocket: () => "new socket",
    revokedOwn: () => "revoked by this session",
    closedOwn: () =>
      "the channel was closed by this session's own close — the seat is released, the token is alive; to stand again — verstak_stand",
    resumeFailed: () => "resume from disk failed",
    tokenDead: () => "token dead",
    parked: (reason) =>
      `the bridge left the seat (${reason}) — socket closed, seat intact; to return use the watchdog or verstak_stand`,
    evicted: (code) =>
      `DOER: close ${code} — the seat was taken, another holder is listening; ` +
      "the bridge sends no writes into this graph until you stand on your own seat — they would go under its signature; to listen here, verstak_stand without name stands beside on name.N; to retake the seat (take=true) — only on the user's word",
    evictedBeside: (code, name, base) =>
      `DOER: close ${code} — the seat ${name} was taken, another holder is listening; not taking it over and not signing with it — standing beside as ${base}.N with hearing myself; the outcome comes next, verstak_stand with the same call tells the seat and the watchdog command; evicting that session (take=true) — only on the user's word`,
    besideDone: (name, said) =>
      `Verstak: the seat ${name} was taken (4000) — the bridge stood beside on its own seat with hearing. ${said}`,
    besideFailed: (name, base, said) =>
      `Verstak: the seat ${name} was taken (4000), and the bridge could not stand beside — no hearing: ${said} The move — verstak_stand with name=${base} without take: the bridge stands beside as ${base}.N with hearing.`,
    evictedRefusal: (name, base) =>
      `Refused (bridge): the seat ${name} was taken (4000), another holder listens on it, and the bridge could not stand beside yet — the write would go under its signature; the call was not sent. The move — verstak_stand with name=${base} without take: the bridge stands beside as ${base}.N with hearing; then repeat the call.`,
    besideOther: (place, ok, said) =>
      ok
        ? `The seat of another graph ${place} was on the taken channel — it stands again on the new one. ${said}`
        : `The seat of another graph ${place} was on the taken channel and did not stand again — no hearing there: ${said} The move — verstak_stand in that graph with the same name.`,
    takenBySession: () =>
      "a new bridge of this same session took the seat — this instance lets the socket go, the hearing is the new one's",
    dead: (advice) => `DOER: ${advice}`,
    alive: (version) =>
      `DOER: the socket keeps being cut while the service answers (${version}) — holding the seat, reopening less often; ` +
      "if it fails, ask about the token",
  },
};
