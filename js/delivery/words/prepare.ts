// The prepare subcommand: the repository made ready by the bridge without a model (graph
// @nks/nks-dev, node #9319; the cover's form — #9316). The refusals, the REALITY.md stub, the
// start hook and the memory guard's message (their samples: skills/verstak/references/
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
  guard: (graph: string) => string;
  /** keys — the cover's keys named twice, for cover.repeat. */
  left: (item: PrepareLeft, keys?: string) => string;
  /** The label of a text answer's line: done, already there, left to the model. */
  head: (kind: "done" | "kept" | "left") => string;
}

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
      `Load the verstak skill first (/verstak) and read its Start section before any other action. Addresses from the AGENTS.md cover: graph ${graph}${holon ? `, focus holon #${holon}` : ""}${role ? `, agent role #${role}` : ""}.`,
    guard: (graph) =>
      `BLOCKED: local agent memory is forbidden entirely, not by category (AGENTS.md, Persistence). Route the fact: repo conventions / code facts → AGENTS.md; project state, this repo's servers and dated duties → the project graph ${graph}; a user-scoped fact no project owns → personal mind through the minding method of the verstak skill. This dir stays frozen at its prohibition stub.`,
    left: (item, keys) =>
      ({
        "cover.repeat": `the key ${keys} stands twice in the front matter of AGENTS.md; strict YAML refuses it and AGENTS.md is untouched: keep one value and run prepare again`,
        "cover.graph":
          'no graph named: --graph rN (verstak_realm(action="list"); align, Round 1, step 1)',
        "cover.holon":
          "no holon named: --holon N, the repository's holon found by its repository attr or created (align, Round 1, step 2)",
        "cover.agent_role":
          "no agent role named: --agent-role N, the holon's steward (verstak_search with steward_of) or created (align, Round 1, step 3)",
        "cover.contract": "no contract named: --contract N in the run's last call (align, Step 7)",
        "cover.flat":
          "an older flat cover stands beside the block: move its judgment slots into Project and drop the flat keys (align, From contract 9)",
        "CLAUDE.md":
          "CLAUDE.md is a file of its own, not a pointer: merge its content into AGENTS.md and replace it with the pointer (align, Step 7)",
        "hook.start":
          "the start hook waits for the graph, holon and agent role in the cover: run prepare again with --graph, --holon, --agent-role",
        "hook.guard":
          "the memory guard waits for a graph in the cover: run prepare again with --graph",
        "hook.push": "the push hook: align, Step 4, by references/align-hooks.md",
        "hook.merge": "the merge hook: align, Step 4, by references/align-hooks.md",
        "opencode.rituals":
          "the repository has OpenCode: the rituals plugin by align, Step 4 (references/align-harness-surfaces.md)",
      })[item],
    head: (kind) => ({ done: "done", kept: "already there", left: "for the model" })[kind],
  },
};
