// The error code of an Orca CLI answer (graph @nks/nks-dev, node #9966): a refusal prints indented
// JSON {ok: false, error: {code}} on stdout and exits non-zero; only the code is kept.

/** The error code of the client's answer, or null; nothing else of it is kept. The answer is
 * the whole stdout, indented over many lines (#9966); a line before it that is no JSON is
 * passed over — the answer is the last object opened at a line's start that parses to the end. */
export function answerCode(out: string): string | null {
  for (let at = out.length; at > 0;) {
    at = out.lastIndexOf("\n{", at - 1);
    const from = at < 0 ? 0 : at + 1;
    try {
      const code = (JSON.parse(out.slice(from)) as { error?: { code?: unknown } }).error?.code;
      return typeof code === "string" ? code : null;
    } catch {
      if (from === 0) return null;
    }
  }
  return null;
}

/** A refusal code fit for a reason word: snake case, short — anything else is not kept. */
export const safeCode = (code: string | null): string | null =>
  code !== null && /^[a-z0-9_]{1,48}$/.test(code) ? code : null;
