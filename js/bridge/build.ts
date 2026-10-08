import { buildOf } from "../shared/version.ts";

// In the single-file output import.meta.url is the output itself, so the hash
// names the bytes that actually ran.
export const BUILD = buildOf(import.meta.url);
