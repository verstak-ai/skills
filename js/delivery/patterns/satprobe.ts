// Prose parsed by doctor's satellite-bridge probe.

/** A server refusal that a login stands behind. */
export const SAT_LOGIN_RE = /\/login\b|oauth|authoriz|sign.?in|log.?in|\b401\b/i;
/** stderr of a bridge that does not know the satellite flag. */
export const SAT_OLD_FLAG_RE = /satellite|unknown (flag|option)/i;
