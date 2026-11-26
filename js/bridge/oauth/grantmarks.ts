// What the machine knows about the grant on disk beyond its tokens, kept in the
// grant state so it outlives the process: a verdict the server gave where
// nothing moved (graph @nks/nks-dev, node #11291), and a rotation whose answer
// was lost on the wire (graph @nks/nks-dev, node #11292). Both name the refresh
// token they are about by its print; a grant that lands clears the state, and
// the print keeps any other grant clear of them.
import { AnswerCut } from "../errors.ts";
import { b64url, grantLog, loadGrantState, saveGrantState, sha256 } from "../store.ts";
import { type Tokens } from "../types.ts";

const printOf = (t: Tokens): string => b64url(sha256(t.refresh_token ?? "")).slice(0, 16);
const about = (print: string | undefined, t: Tokens | null | undefined): boolean =>
  !!print && !!t?.refresh_token && printOf(t) === print;

/** The server judged this refresh token dead at an endpoint discovery still names. */
export function noteDead(t: Tokens): void {
  saveGrantState({ dead_refresh: printOf(t), lost_refresh: undefined, lost_at: undefined });
}

export const judgedDead = (t: Tokens | null | undefined): boolean =>
  about(loadGrantState().dead_refresh, t);

// The request went out and no answer came back: the connection closed under it,
// or it ran out its deadline. The server may have rotated the grant, and the new
// pair exists nowhere but in that lost answer — the old refresh token lives on
// only within the server's grace for it, whose width the bridge does not know.
// A refusal before the request went out (ECONNREFUSED, ENOTFOUND) is not this.
// Nor is it only the wire: a 200 whose body was cut or carries no token is the same.
const LOST = new Set(["UND_ERR_SOCKET", "ECONNRESET", "EPIPE", "UND_ERR_HEADERS_TIMEOUT"]);
export function answerLost(e: unknown): boolean {
  const err = e as { name?: string; code?: string; cause?: { code?: string; name?: string } };
  return (
    e instanceof AnswerCut ||
    err?.name === "TimeoutError" ||
    err?.cause?.name === "TimeoutError" ||
    LOST.has(err?.code ?? "") ||
    LOST.has(err?.cause?.code ?? "")
  );
}

/** The rotation of `t` is of unknown outcome: present the same refresh again at once. */
export function noteLost(t: Tokens, why: string): void {
  const st = loadGrantState();
  const first = !about(st.lost_refresh, t);
  saveGrantState({ lost_refresh: printOf(t), lost_at: first ? Date.now() : st.lost_at });
  if (first) {
    grantLog(
      `refresh answer lost (${why}) — rotation outcome unknown; the same refresh goes out again as soon as the token endpoint answers`,
    );
  }
}

export const lostRotation = (t: Tokens | null | undefined): boolean =>
  about(loadGrantState().lost_refresh, t);

/** The server answered this refresh token: its outcome is known. */
export function forgetLost(): void {
  if (loadGrantState().lost_refresh)
    saveGrantState({ lost_refresh: undefined, lost_at: undefined });
}
