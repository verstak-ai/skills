// The prepare subcommand: the repository made ready by the bridge without a model (graph
// @nks/nks-dev, node #9319; the cover's form — #9316). The refusals, the REALITY.md stub, the
// start word (the delivery's start ritual, #9341) and the memory guard's message (their samples: skills/verstak/references/
// align-hooks.md, held byte for byte by js/tests/prepare.test.mjs), and what is left to the model.
import type { Lang } from "../lang.ts";

/** The cover's addresses the start hook names; the graph always. */
export interface PrepareAddr {
  graph: string;
  holon?: string;
  role?: string;
}

/** What is left to the model, by the answer item's key. */
export type PrepareLeft =
  | "cover.graph"
  | "cover.holon"
  | "cover.agent_role"
  | "cover.contract"
  | "cover.flat"
  | "cover.repeat"
  | "cover.rituals"
  | "CLAUDE.md"
  | "hook.start"
  | "hook.guard"
  | "hook.push"
  | "hook.merge"
  | "opencode.rituals";

export interface PrepareWords {
  usage: () => string;
  badArg: (flag: string, value: string) => string;
  notRepo: (dir: string) => string;
  foreign: (file: string) => string;
  unparsed: (file: string) => string;
  /** The whole REALITY.md stub; caseNo — the alignment case's number, when named. */
  reality: (caseNo?: string) => string;
  /** The start hook's text; the core puts it in echo '…', escaping apostrophes. */
  start: (a: PrepareAddr) => string;
  /** The memory guard's message; graph — the cover's rN (no full address without the network). */
  /** section — the repository's own persistence heading as it stands; null — none found, none cited. */
  guard: (graph: string, section?: string | null) => string;
  /** keys — the cover's keys named twice (cover.repeat) or its unknown rituals (cover.rituals). */
  left: (item: PrepareLeft, keys?: string) => string;
  /** A script-form hook prepare could not tell as this kind: none of its own is put beside it. */
  unread: (item: PrepareLeft, hook: string) => string;
  /** The label of a text answer's line: done, already there, left to the model. */
  head: (kind: "done" | "kept" | "left") => string;
}

// A ritual the repository holds as its own while the delivery carries it: taking it off is the
// transition to align contract 11 (graph @nks/nks-dev, nodes #9341, #9319); branches of other
// kinds in the same script stay.
const RITE = (what: string): string =>
  `the repository's own ${what} in .claude/settings.json — the delivery carries the rituals and keeps silent beside its own: take it off once the delivery's replacement is verified, never by the contract's number, and in a script with branches of other kinds only this one's branch (align, Step 4, the transition)`;

export const PREPARE: Readonly<Record<Lang, PrepareWords>> = {
  en: {
    usage: () =>
      "usage: prepare [--dir <repo>] [--graph rN] [--holon N] [--agent-role N] [--contract N] [--stamp YYYY-MM-DD] [--case N] [--json]\n",
    badArg: (flag, value) => `${flag}: "${value}" is not the right form; see prepare --help`,
    notRepo: (dir) => `${dir} is not a git repository: nothing to prepare, nothing written`,
    foreign: (file) =>
      `${file} carries another delivery's cover: switching deliveries is the person's call, nothing written`,
    unparsed: (file) => `${file} does not parse: nothing written`,
    reality: (caseNo) =>
      `# Reality — what a claim is checked against\n\nCarriers not yet established${caseNo ? `; alignment case #${caseNo}` : ""}. Until they are, behavioural claims are not accepted.\n`,
    start: ({ graph, holon, role }) =>
      `Load the verstak skill (/verstak) and run its Start section before anything else. Cover: graph ${graph}${holon ? `, holon #${holon}` : ""}${role ? `, role #${role}` : ""}.`,
    guard: (graph, section = "Persistence") =>
      `BLOCKED: local agent memory is forbidden entirely, not by category (AGENTS.md${section ? `, ${section}` : ""}). Route the fact: repo conventions / code facts → AGENTS.md; project state, this repo's servers and dated duties → the project graph ${graph}; a user-scoped fact no project owns → personal mind through the minding method of the verstak skill. This dir stays frozen: nothing is written here.`,
    left: (item, keys) =>
      ({
        "cover.repeat": `the key ${keys} stands twice in the front matter of AGENTS.md; strict YAML refuses it and AGENTS.md is untouched: keep one value and run prepare again`,
        "cover.rituals": `the delivery knows no ritual ${keys} in the cover's rituals: field, so it switches nothing on; its rituals: start push merge guard turn. Fix the name or drop it`,
        "cover.graph":
          'no graph named: --graph rN (verstak_realm(action="list"); align, Round 1, step 1)',
        "cover.holon":
          "no holon named: --holon N, the repository's holon found by its repository attr or created (align, Round 1, step 2)",
        "cover.agent_role":
          "no agent role named: --agent-role N, the holon's steward (verstak_search with steward_of) or created (align, Round 1, step 3)",
        "cover.contract": "no contract named: --contract N in the run's last call (align, Step 7)",
        "cover.flat":
          "an older flat cover stands beside the block: move its judgment slots into Project and drop the flat keys (align, An older cover)",
        "CLAUDE.md":
          "CLAUDE.md is a file of its own, not a pointer: merge its content into AGENTS.md and replace it with the pointer (align, Step 7)",
        "hook.start": RITE("start hook"),
        "hook.guard":
          "the memory guard waits for a graph in the cover: run prepare again with --graph",
        "hook.push": RITE("push hook"),
        "hook.merge": RITE("merge hook"),
        "opencode.rituals":
          "the repository's own rituals plugin in .opencode/plugins — the delivery carries the rituals and keeps silent beside it: take it off once the delivery's replacement is verified, never by the contract's number, and if it carries branches of other kinds (a merge gate and the like) take off only start, push, merge and the memory guard and keep the rest in a file whose name lacks \"ritual\" (align, Step 4, the transition)",
      })[item],
    unread: (item, hook) =>
      item === "hook.guard"
        ? `"${hook}" stands, and prepare could not tell whether it is the memory guard — none of its own was put beside it: read the script; if it is, do nothing; if not, add it by align's Step 4 (references/align-hooks.md)`
        : `"${hook}" stands, and prepare could not tell whether it is the start hook: read the script; if it is, take it off once the delivery's replacement is verified (the delivery carries the start and keeps silent beside its own); if not, do nothing`,
    head: (kind) => ({ done: "done", kept: "already there", left: "for the model" })[kind],
  },
};
