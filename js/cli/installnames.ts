// Recognisers of this delivery's installs on the machine, built from the delivery
// layer's names: doctor finds its plugins, entries and bridge files by them.
import { BRIDGE_FILE, PLUGIN_NAME, PRODUCT } from "../delivery/index.ts";
import { escapeRe } from "../shared/regex.ts";

/** The product name, escaped for a regular expression. */
export const PRODUCT_PATTERN = escapeRe(PRODUCT);
/** The product name anywhere in a string: plugin directories, args, entry names. */
export const PRODUCT_RE = new RegExp(PRODUCT_PATTERN);
/** A Claude Code or Codex plugin key of this delivery: `<plugin>@<marketplace>`. */
export const PLUGIN_KEY_RE = new RegExp(`^${escapeRe(PLUGIN_NAME)}@`);
/** The delivery's bridge file named in an argument. */
export const BRIDGE_FILE_RE = new RegExp(escapeRe(BRIDGE_FILE));
