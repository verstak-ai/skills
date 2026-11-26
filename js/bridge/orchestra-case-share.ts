// The call's open share at a clean exit, from the case's journal (#10995).
import type { CaseEntry } from "./orchestra-case-read.ts";

export function hasOpenShare(entries: CaseEntry[], seats: string[], karta?: string): boolean {
  const own = new Set(seats);
  const progress = new Map<string, CaseEntry>();
  for (const e of entries) {
    if (e.kind !== "progress" || !e.author_standing_id || !own.has(e.author_standing_id)) continue;
    if (!e.key || !e.verdict) throw new Error("invalid_progress_line");
    const previous = progress.get(e.key);
    if (!previous || previous.n < e.n) progress.set(e.key, e);
  }
  if ([...progress.values()].some((e) => e.verdict === "partial")) return true;
  for (const e of entries) {
    if (e.kind === "ask") {
      const toUs =
        (!!e.to_standing_id && own.has(e.to_standing_id)) ||
        (!!karta && e.to_karta_node_id === karta);
      const fromUs = !!e.author_standing_id && own.has(e.author_standing_id);
      if (
        toUs &&
        !entries.some(
          (a) =>
            a.kind === "answer" &&
            a.in_reply_to === e.n &&
            !!a.author_standing_id &&
            own.has(a.author_standing_id),
        )
      )
        return true;
      if (fromUs && !entries.some((a) => a.kind === "answer" && a.in_reply_to === e.n)) return true;
    }
    if (
      e.kind === "invite" &&
      e.to_standing_id &&
      own.has(e.to_standing_id) &&
      !entries.some((a) => a.kind === "joined" && a.in_reply_to === e.n)
    )
      return true;
  }
  return false;
}
