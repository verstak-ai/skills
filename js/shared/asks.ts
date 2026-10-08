// Question kinds in a case — ask, answer, ack (graph @nks/nks-dev, nodes #6866,
// #6867, #6870; the bridge's share — #6868): who is asked, who gets the answer
// and the acceptance, and their words. The stacking rule stays in room-kinds.ts.
import { ASK, CASE_LINE } from "../delivery/index.ts";
import { classifyOrigin, type Frame } from "./channel.ts";
import { words } from "./lang.ts";
import { addresseeOf, mineOf, myRole, need, obj, opt, pick, type Rec, str } from "./room-fields.ts";

export const ASK_KINDS = new Set(["ask", "answer", "ack"]);

/** Cause of a platform invite of a role → its word. */
const INVITE_CAUSES = {
  ownerless: "inviteOwnerless",
  answer_waiting: "inviteAnswerWaiting",
} as const;

/** fields.to (#6867): for ask {karta, standing?}; for answer and ack the waiting seat itself. */
const toOf = (fields: Rec): Rec => obj(fields.to);

/** The line was written by my own seat — an echo. */
export const byMe = (frame: Rec): boolean => {
  const mine = mineOf(frame);
  const author = obj(obj(frame.line).author);
  return [str(author.id), str(author.standing)].some((a) => a && mine.includes(a));
};

/**
 * A question line from a person's seat is split by addressing, not by the
 * "person's word always whole" rule (#6867).
 */
export const askFromPerson = (frame: Rec): boolean => {
  const line = obj(frame.line);
  const kind = str(line.kind);
  const asking = ASK_KINDS.has(kind) || (kind === "progress" && !!str(obj(line.fields).withdraws));
  return asking && classifyOrigin(frame as Frame) === "human";
};

const handleOf = (address: string): string => /^@([^:]+):/.exec(address)?.[1] ?? "";

/**
 * Asked to me: to.standing is my seat; otherwise to.karta is my role and a named
 * seat, if any, belongs to my account (#6867).
 */
export function askedMine(frame: Rec, fields: Rec): boolean {
  const mine = mineOf(frame);
  if (byMe(frame)) return false;
  const to = toOf(fields);
  const place = addresseeOf(to.standing);
  if (place?.addr.some((a) => mine.includes(a))) return true;
  if (!myRole(frame, { karta: to.karta })) return false;
  if (!place) return true;
  const theirs = handleOf(str(obj(to.standing).standing) || str(to.standing));
  return !!theirs && theirs === handleOf(str(frame.to_standing));
}

/** Answer or acceptance to me: the addressee (addressee, else fields.to) is my seat and has not left. */
export function addressedMine(frame: Rec): boolean {
  if (frame.addressee_left === true) return false;
  const to = addresseeOf(frame.addressee) ?? addresseeOf(toOf(obj(obj(frame.line).fields)));
  const mine = mineOf(frame);
  return !!to && to.addr.some((a) => mine.includes(a));
}

const quote = (s: string): string => (s ? words(CASE_LINE).quote(s) : "");

function formOf(fields: Rec): string {
  const W = words(ASK);
  const form = str(fields.form);
  if (form === "yes_no") return W.yesNo();
  if (form === "free") return W.free();
  if (form !== "choice" || !Array.isArray(fields.options)) return "";
  const options = fields.options
    .map((o) => {
      const x = obj(o);
      const ctx = str(x.context);
      return `${str(x.id)} ${quote(str(x.label))}${ctx ? ` (${ctx})` : ""}`;
    })
    .join(", ");
  return W.choice(need(options));
}

/** Values of the question words: addressee, form, advice for ask; the reply for answer and ack. */
export function askValues(kind: string, line: Rec, fields: Rec): Rec {
  if (kind !== "ask")
    return { reply: [str(fields.choice), quote(str(line.done))].filter(Boolean).join("; ") };
  const W = words(ASK);
  const to = toOf(fields);
  const k = obj(to.karta);
  const place = addresseeOf(to.standing)?.label ?? "";
  const rec = obj(fields.recommendation);
  return {
    to: str(k.name) || (str(k.seq) ? `#${str(k.seq)}` : ""),
    to_place: place ? W.place(need(place)) : "",
    form: formOf(fields),
    advice:
      str(rec.option) || str(rec.why)
        ? W.advice(need(str(rec.option) || "—"), opt(" — ", rec.why))
        : "",
  };
}

/**
 * The word of a question line, if it is one: a platform invite of a role by
 * cause, a withdrawal (progress with fields.withdraws), ask, answer, ack.
 */
export function askText(kind: string, cause: string, v: Rec): string | undefined {
  const W = words(ASK);
  const invite = cause ? pick(INVITE_CAUSES, cause) : undefined;
  if (invite) return W[invite](need(v.who), need(v.standing));
  if (kind === "progress" && str(v.withdraws))
    return W.withdrawn(
      need(v.withdraws),
      need(v.key),
      need(v.done),
      need(v.verdict),
      need(v.author),
    );
  if (kind === "ask")
    return W.ask(
      need(v.author),
      need(v.to),
      opt(" ", v.to_place),
      need(v.key),
      need(v.done),
      opt("; ", v.form),
      opt("; ", v.advice),
    );
  if (kind === "answer") return W.answer(need(v.author), need(v.refers_to), need(v.reply));
  if (kind === "ack") return W.ack(need(v.refers_to), opt(": ", v.reply), need(v.author));
  return undefined;
}
