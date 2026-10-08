// POST of the busyness line to a named status address — a leaf free of the holding:
// status.ts and handoff.ts both call it, and hold.ts → handoff.ts → status.ts → hold.ts
// would close a cycle.
import { STATUS_POST } from "../delivery/index.ts";
import { words } from "../shared/lang.ts";
import { closedUnder } from "./errors.ts";

/** The busyness POST's outcome; code — the surface's HTTP refusal code, when there was one. */
export interface StatusOutcome {
  ok: boolean;
  body: string;
  code?: number;
  /** The line the server took: the reply's doing; without it, on trimming, the one the rule derives. */
  doing?: string;
  /** Taken trimmed (warnings[] trimmed_to_limit). */
  trimmed?: StatusTrim;
}

/**
 * A line over the limit lands trimmed at a word, the full text in the seat's history
 * (graph @nks/nks-dev, nodes #6729, #6730): the POST answers 200 {doing, doing_at,
 * warnings?}, a warning is {code: trimmed_to_limit, message}.
 */
export interface StatusTrim {
  doing: string;
  message: string;
}

const TRIMMED = "trimmed_to_limit";
/** The api 0.108.0 line limit — only to derive the taken line when the reply does not name it. */
const LIMIT = 64;

type Obj = Record<string, unknown>;
const obj = (v: unknown): Obj => (v && typeof v === "object" ? (v as Obj) : {});

/**
 * The line as the server lays it — the fallback when the reply carries no doing
 * (a server before api 0.108.0): at a word, up to max chars with "…" (#6729).
 */
export function trimToWord(text: string, max: number): string {
  const chars = [...text];
  const head = chars.slice(0, max - 1).join("");
  // A space right after the head: the head ends on a whole word.
  const cut = chars[max - 1] === " " ? head.length : head.lastIndexOf(" ");
  return (cut > 0 ? head.slice(0, cut) : head).trimEnd() + "…";
}

/**
 * The taken line and the trimming from a successful reply's body. Without doing,
 * the sent line — or, under trimmed_to_limit, the derived one: the sent line is
 * never passed off as the taken one.
 */
function acceptedIn(body: string, sent: string): Pick<StatusOutcome, "doing" | "trimmed"> {
  let parsed: Obj = {};
  try {
    parsed = obj(JSON.parse(body));
  } catch {
    /* an older server: the body is not JSON */
  }
  const warnings = Array.isArray(parsed.warnings) ? parsed.warnings : [];
  const w = obj(warnings.find((x) => obj(x).code === TRIMMED));
  const told = typeof parsed.doing === "string" ? parsed.doing : null;
  if (!w.code) return told === null ? {} : { doing: told };
  const doing = told ?? trimToWord(sent, LIMIT);
  const message = typeof w.message === "string" ? w.message.trim() : "";
  return { doing, trimmed: { doing, message } };
}

/** The trimming nudge to the agent: the server's word, otherwise what was trimmed. */
export function trimNudge(t: StatusTrim): string {
  if (t.message) return words(STATUS_POST).trimmedBy(t.message);
  return words(STATUS_POST).trimmed();
}

/** The same POST to a named address — for the exit, when the standing is already released. */
export async function publishStatusTo(
  url: string,
  text: string,
  timeoutMs = 5000,
  standingId: string | null = null,
): Promise<StatusOutcome> {
  const signal = AbortSignal.timeout(timeoutMs);
  const post = (): Promise<Response> =>
    fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(standingId ? { text, standing_id: standingId } : { text }),
      signal,
    });
  let res: Response;
  try {
    // The line is set, not accumulated, so a repeat is harmless — one, and only on a
    // connection closed under the request; a surface reply is not repeated.
    res = await post().catch((e: unknown) => {
      if (!closedUnder(e) || signal.aborted) throw e;
      return post();
    });
  } catch (e) {
    return { ok: false, body: words(STATUS_POST).noAnswer((e as Error).message) };
  }
  const body = (await res.text().catch(() => "")).trim();
  if (res.status === 404) return { ok: false, code: 404, body: words(STATUS_POST).gone(body) };
  if (!res.ok)
    return { ok: false, code: res.status, body: words(STATUS_POST).refused(res.status, body) };
  return { ok: true, body, ...acceptedIn(body, text) };
}
