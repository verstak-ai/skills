// The register's 429 rate_limited wait (graph @nks/nks-dev, node #10801), one value for both
// sides of the wait: the bridge waits out the source's Retry-After inside a seat return
// (../bridge/ratelimit.ts), and a plugin's resume/check request waits for that return's
// answer (../opencode/keep.ts). A client cap shorter than the bridge's wait cuts a lawful
// return off before it ends.

/**
 * The register move's deadline: no Retry-After wait of the move ends later than this many
 * seconds after the move began — only the move's main seat waits (the seats beside do not),
 * and the time of cut waits and of the calls counts too.
 */
export const RATE_LIMIT_WAIT_S = 60;

/** Room above the wait for the return's own steps: register, hello, the seats beside. */
const RESUME_MARGIN_S = 15;

/** A plugin's cap on the bridge's answer to resume/check: the whole wait plus the margin. */
export const RESUME_ANSWER_MS = (RATE_LIMIT_WAIT_S + RESUME_MARGIN_S) * 1000;
