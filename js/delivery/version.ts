// The delivery's version — one number for all of it: skills, bridge, watchdogs,
// extension. release-please stamps it when the release PR merges (the annotation below,
// the file in extra-files); never by hand. js/build.mjs reads the channel mark from here
// and replaces it literally in the release build.
export const VERSION = "3.0.1"; // x-release-please-version

/** Name of the channel mark: other copies are told by `"<name>:release"` and `"<name>:dev"` in their text. */
export const BUILD_MARK = "verstak-build";

/**
 * This build's channel mark — `BUILD_MARK` and `:dev`; the release build writes `:release`.
 * The line's form is a contract: js/build.mjs finds it by a regular expression.
 */
export const CHANNEL_MARK: string = "verstak-build:dev";
