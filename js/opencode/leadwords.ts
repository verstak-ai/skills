// Words about lead subagents (leads.ts; graph @nks/nks-dev, node #6625) live in the delivery
// layer; this accessor gives them in the session language.
import { LEAD, type LeadWords } from "../delivery/index.ts";
import { words } from "../shared/lang.ts";

/** The outcome is the child's last text; a longer one is cut at the tail. */
const SUMMARY_MAX = 4000;

export const W = (): LeadWords => words(LEAD);

/** The word lands before the child's bridge ends its run: a failed seat release is unrevokedWord. */
export const endWord = (who: string, why: string, last: string, kept?: string | null): string => {
  const said = last.length > SUMMARY_MAX ? `${last.slice(0, SUMMARY_MAX)}…` : last;
  return W().end(who, why, kept ? W().endKept(who, kept) : W().endPlain(), said);
};

/** A correction to the outcome, not a second end: failed — seats the child's bridge could not revoke; null — unknown. */
export const unrevokedWord = (who: string, failed: string[] | null): string =>
  failed === null
    ? W().unrevokedUnknown(who)
    : W().unrevoked(who, failed.join(", "), String(failed[0]));

export const awayWord = (who: string, last: string): string =>
  W().away(who, last.slice(0, SUMMARY_MAX));
