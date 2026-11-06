// A frame's text with nothing addressed to the seat (graph @nks/nks-dev, nodes #9345, #6574):
// case count lines only, each saying none of the records is the seat's, under a stale batch's
// head or none. Read back from the words the delivery writes them with (frame-text.ts,
// stalebatch.ts), whitespace aside: the watchdog wraps long lines (watchdog.ts wrapLines).
import { FRAME_MARK, FRAME_TEXT, LANGS, ROOM, STALE } from "../delivery/index.ts";

const flat = (s: string): string => s.replace(/\s+/g, "");
const esc = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
/** Placeholders the words are called with, then read back as patterns. */
const HEAD = "\u0001";
const ARGS = "\u0002";
const N = 1234567;
const NUM = new RegExp(String(N), "g");

function countLine(lang: (typeof LANGS)[number]): string {
  const T = FRAME_TEXT[lang];
  const call = esc(flat(T.caseHistory(ARGS, N)))
    .replace(ARGS, `[^()]*`)
    .replace(NUM, String.raw`-?\d+`);
  const cases = `(?:${call}(?:;${call})*|${esc(flat(T.myCases()))})`;
  const count = esc(flat(T.count(HEAD, N, 0)))
    .replace(HEAD, ".+?")
    .replace(NUM, String.raw`\d+`);
  return `${count}[^()]*?${esc(flat(T.noneYours()))}${esc(flat(T.inFull(ARGS))).replace(ARGS, cases)}\\.`;
}

const head = (lang: (typeof LANGS)[number]): string[] =>
  [false, true]
    .flatMap((legacy) => [STALE[lang].head(1, 1, legacy), STALE[lang].head(2, 1, legacy)])
    .map((h) => esc(flat(h)).replace(/\d+/g, String.raw`\d+`));

const LINE = `(?:${LANGS.map(countLine).join("|")})`;
const QUIET = new RegExp(`^(?:${LANGS.flatMap(head).join("|")})?(?:${LINE})+$`);

function compact(lang: (typeof LANGS)[number]): string {
  const T = FRAME_TEXT[lang];
  const caseHead = esc(flat(ROOM[lang].case(HEAD))).replace(HEAD, "[^«»():;]+") + "(?:«[^»]*»)?";
  const count = esc(flat(T.count(HEAD, N, 0)))
    .replace(HEAD, caseHead)
    .replace(NUM, String.raw`\d+`);
  const gone = esc(flat(T.supersededLines(N))).replace(NUM, String.raw`\d+`);
  const history = esc(flat(T.inFull(T.caseHistory(ARGS, N))))
    .replace(ARGS, "[^()]*")
    .replace(NUM, String.raw`-?\d+`);
  const template = esc(flat(T.inFull(T.caseHistory('realm=R, action="history", room=N', "S"))));
  const fallback = esc(flat(T.inFull("")));
  const cursor = String.raw`·realm="(?:[^"\\]|\\.)*",since=\d+`;
  const line = `${count}(?:${gone})?`;
  return `(?:${line}(?:${cursor})?;(?:${history}|${fallback})\\.|(?:${line}(?:${cursor})?){2,}(?:${template}|${fallback})\\.)`;
}

const COMPACT = new RegExp(
  `^(?:${LANGS.flatMap(head).join("|")})?(?:${LANGS.map(compact).join("|")})$`,
);

/** A frame's text (under the delivery's mark or not) that addresses nothing to the seat. */
export function quiet(text: string): boolean {
  const t = flat(text);
  const body = t.startsWith(FRAME_MARK) ? t.slice(FRAME_MARK.length) : t;
  return QUIET.test(body) || COMPACT.test(body);
}
