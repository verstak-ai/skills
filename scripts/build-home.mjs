#!/usr/bin/env node
// Generate the flat home/ catalogue from skills/verstak/: the door as
// home/verstak, every method but product-roadmap as home/<method>, and the
// references and templates those point to as home/<file stem>.
//
// The verstak.ai conversation home reads a flat catalogue (SKILLS_SUBDIR=home):
// <name>/SKILL.md with a `name` and a one-line `description`, and load_skill
// returns that one file by name — it reads no other file. So each copy gets
// frontmatter and every pointer into the rest of the skill becomes a name
// load_skill can open (`methods/X.md`, `references/X.md`, `templates/X.md` →
// **X**, a reference or template `X`, the door `verstak`), or is rewritten where the home has no such
// thing; every tool it names must be on the surface snapshot. home/ sits
// outside skills/ so plugin auto-discovery never ships it as a second set of
// skills.
//
// Usage: node scripts/build-home.mjs          write home/
//        node scripts/build-home.mjs --check  fail if home/ differs from source
//
// Every rewrite must match exactly once: a source edit that moves a pointer
// fails the build here instead of shipping a dangling one.
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const methodsDir = join(root, "skills", "verstak", "methods");
const referencesDir = join(root, "skills", "verstak", "references");
const homeDir = join(root, "home");
const surfaceTools = new Set(JSON.parse(readFileSync(join(root, "fixtures", "surface.json"), "utf8")).tools);
// The delivery's own status tool, as scripts/check-surface.mjs adds it.
surfaceTools.add("verstak_bridge");

// The companion's own skills (assistant, minding, onboarding) keep the reading
// inline instead of a hop to **entry**: the companion acts on them directly.
const READ_THE_GRAPH =
  "open the node with `verstak_look`, walk the arrow the question needs, and run `verstak_orient(focus=<node>, lens=…)` there for a pattern; answer from what they show — \"I don't see it\", never \"there is none\"";

const SKILLS = {
  assistant: {
    slash: true,
    description:
      "The user's secretary across their cases: a summary of their cases when asked; the user's decisions and answers into cases verbatim, what matters in cases to the user verbatim with provenance; one task for an agent placed as a case and what's in work read from cases; abandoned work checked and its role called. Triggers: 'what's on my plate', 'what's waiting on me', 'how are things', 'what's left', 'any questions for me?', 'what's up with case #N', 'who's doing what', 'what's on fire', 'what's new', 'where are we', 'did you say …?', 'tell them …', 'pass this on', 'what's hanging in my cases', 'tidy up abandoned cases', 'give an agent a task', 'assign to an agent', 'tell an agent to do …', 'what's in work', 'what did I assign', 'assistant'. Does not spread work across agents, raise agents or do the craft. Needs the verstak_* tools.",
    rewrites: [
      ["Case laws: the door, `Cross-cutting norms`.", "Case laws: join by invitation or share, `read` without joining to look inside, post only when the addressee will have something to read; a delivery doesn't oblige a reply."],
      ["Vocabulary: the door's `Answer` step — \"case\"", "Vocabulary: \"case\""],
      [" (the door, `Communication`)", ""],
      [" (the door, `One-off task`)", ""],
      [" (the door, `Ledger`)", ""],
      ["none → `verstak_stand(realm=<graph>, karta=<your role>)`, never a bare `register` (it opens no seat)", "none → say so: the runtime gives the companion its seat; never a bare `register` (it opens no seat)"],
      ["that's the graph: `methods/entry.md`.", `that's the graph: ${READ_THE_GRAPH}.`],
    ],
  },
  minding: {
    description:
      "The user's memory in the graph — personal mind addressed as realm mind, without a handle or stored pointer, recalled and written by reflex, not ritual. WRITE when a durable fact about the user surfaces and serves no single project: their own machines, expiries, people, opinions, their own way of working (on a development topic too), methods of their own; never harness-local memory. A project's servers, pipeline, dated duties and rules belong to that project's graph. RECALL when the user's own field is in play: 'do you remember', 'what do you know about me', 'what do I have', 'what's on my plate', 'where is it deployed', or a task needs such a fact — then weigh what it changes now: apply, adapt, don't apply, or ask one deciding question. 'remember this' → write; 'set up my memory' → bootstrap. Needs the verstak_* tools.",
    rewrites: [
      ["so a root session reads them at its start (the door, `Start`).", "so a root session reads them at its start: one `verstak_search(realm=\"mind\", q=\"\", attrs_filter=\"slice:agents\", limit=50)`."],
      ["the door's start slice, onboarding, align and this method use the single entry below — a root session that finds it `missing` provides it before reading, then `references/minding-personal-realm.md` §1–2", "onboarding and this method use the single entry below, then Appendix A1–A2"],
      ["permits creation (reference §1)", "permits creation (A1)"],
      ["or name the graph and hand over to `methods/entry.md`.", `or name the graph and read it there: ${READ_THE_GRAPH}.`],
      ["Shapes: `references/minding-personal-realm.md` — machines (§7), people (§2b), dated facts (§7), lessons (§8).", "Shapes, in the Appendix: machines (A7), people (A2b), dated facts (A7), lessons (A8)."],
      ["not a dossier (reference §2b)", "not a dossier (A2b)"],
      ["Fill the skeleton from the reference,", "Fill the skeleton from the Appendix (A1–A8, A10),"],
      [" (the door's `Survey` table, \"no project graph\")", ""],
    ],
    // The personal-graph skeleton the home loop needs to bootstrap and write
    // personal mind, inlined from its reference: the loop reads no other file.
    appendix: {
      file: "minding-personal-realm.md",
      heading: "## Appendix — the personal mind skeleton\n\nThe set of nodes §3 builds and §2 keeps true, so that one `verstak_orient(realm=\"mind\")` prints a routing answer with no lens: root holons, `attrs.key=true` landmarks, `ACTIVE BIANHUA`. Establish personal memory through the entry above before reading here.",
      sections: ["1", "2", "2b", "3", "4", "5", "6", "7", "7b", "8", "10"],
      rewrites: [
        ["a disposable-class graph (§5)", "a disposable-class graph (A5)"],
        ["it is what keeps §1 cheap", "it is what keeps recall (§1) cheap"],
        ["Dated `sachverhalt` nodes (§7)", "Dated `sachverhalt` nodes (A7)"],
        ["may yield nothing (`methods/minding.md`, §1b)", "may yield nothing (§1b)"],
        ["before its form is released (`methods/minding.md`, §2)", "before its form is released (§2)"],
        ["a stored cross-graph agenda (`methods/minding.md`, §4)", "a stored cross-graph agenda (§4)"],
        ["are modelled (§2b)", "are modelled (A2b)"],
        ["Nothing leaves here either (`methods/minding.md`, \"Privacy\").", "Nothing leaves here either (Privacy, above)."],
      ],
    },
  },
  onboarding: {
    description:
      "Lead a person with no working graph to working on their own, one step at a time: read the readiness signs from data, offer one step, do it with them, say the result and what it means, read again. Starts from the window's onboarding progress or the bot's button after sign-in, or on the person's word. Triggers: 'onboarding', 'start onboarding', 'help me get started', 'I don't know where to start', 'where do I begin', 'redo onboarding'. Not for a person who already works in their graph — help with their task instead. Needs the verstak_* tools.",
    rewrites: [
      ["from the door's Survey or from `methods/align.md`, without a separate call", "at session start or from the window's or bot's onboarding button, without a separate call"],
      ["help on the material that exists (`methods/entry.md`, then the method the task needs).", `help on the material that exists: ${READ_THE_GRAPH}.`],
      ["restore access (`methods/establish-mcp.md`) and read again", "say the read failed and read again"],
      ["; from then on the door's seat rule holds.", "."],
    ],
  },
  verstak: {
    source: "door",
    description:
      "The Verstak method's door: the five ways the method fails, session start, cross-cutting norms (what goes into the graph and what into a case, case laws, one-off tasks, waiting on an answer, the ledger, communication), the routes from a request to its method, the forks where agents go wrong, and the moments that call a method unasked. Load when a skill points to verstak and one of its sections, when a request fits no other skill, or when it is unclear which method a task needs. Needs the verstak_* tools.",
    rewrites: [
      ["→ **product-roadmap**", "→ product-roadmap, a plugin-only method this catalogue does not carry"],
      ["and read the file it names in full.", "and load the skill it names, in full."],
      ["# Verstak — the door\n", `# Verstak — the door\n\n> **In the conversation home.** The runtime gives you your seat: where a skill takes one (\`verstak_stand\`, \`register\`, a satellite), there is nothing to take — speak from the seat you have. Here there is no repository, shell or file access: align, code-work, establish-mcp's install and update, onboarding's harness branch and the Survey's repository checks describe what the user's own harness does — say so and offer the step there; never claim to run it.\n`],
      ["A **bold method name** is `methods/<name>.md` — read it, don't recall it.", "A **bold method name** is a skill of this catalogue — load it, don't recall it."],
    ],
  },
  align: {
    description:
      "Align a repository to the AGENTS.md contract: graph, focus holon and agent role, the AGENTS.md cover and its slots, the ritual hooks for each harness, delegation roles, the alignment case and its second round. Triggers: 'align this repo', 'verstak align', 'set up AGENTS.md', 'update AGENTS.md', 'bring this project up to standard'; an AGENTS.md missing, unstamped or below the contract. Needs the verstak_* tools.",
    rewrites: [["a roadmap teaser (`methods/product-roadmap.md`, quick mode)", "a roadmap teaser (the plugin's product-roadmap method, quick mode; not in this catalogue)"]],
  },
  architect: {
    description:
      "The system architect's post: the system's form across holons — contracts, schemes, lifecycles, reuse, integrity, architectural review, disputed questions of structure, decisions prepared for the owner. Triggers: 'architect', 'hold integrity', 'design it across holons', 'prep a decision', 'architectural review'; a change or tension crossing a holon boundary. Not for writing code. Needs the verstak_* tools.",
  },
  assembly: {
    description:
      "Assemble the graph: see the pattern over the field of inquiry and activity, name the transformations (bianhua) the system goes through and draw their map; check a transformation's telos. Triggers: 'assemble the graph', 'reassemble', 'what is really going on here', 'agenda', 'big picture', 'I'm drowning', 'is this transformation reached?', 'close the transformation'; many free vimarshas, a wall of top-level kriyas. Needs the verstak_* tools.",
  },
  autonomous: {
    description:
      "The agent's own watch cycle in an aligned repository: work only on a signal — the user's word, an agent's message, a vimarsha posed to the role, an event in reality — one piece of work to handover, dependants addressed, the next wake armed. Triggers: 'stand watch', 'you're on duty', 'work on your own', 'take it to merge'; an autonomous session start with an agent role in AGENTS.md. Needs the verstak_* tools.",
  },
  "code-work": {
    description:
      "Change code in a repository aligned to a graph: before the first edit, tests and CI, self-review before a push, the cold review tier, after a merge. Triggers: 'fix this', 'implement', 'build it', 'refactor', 'we've decided, do it', 'review the branch', 'merged', 'shipped', 'tidy after the merge'. Needs the verstak_* tools.",
  },
  collaborate: {
    description:
      "Hold your role's seat, listen and talk in cases: a seat that stops hearing or speaking, authorless writes, a cut frame, leaving a seat; work beyond your mandate, another agent's answer, the user's choice, two agents about to build one thing. Triggers: 'I can't be heard', 'writes have no author', 'ask the other agent', 'this isn't my area', 'escalate to the owner', 'don't both build it'. Needs the verstak_* tools.",
  },
  design: {
    description:
      "Design a system as a graph when a structural choice is open — competing paths, ownership, a boundary, a dependency direction — and record decisions when made. Triggers: 'design this', 'let's think it through', 'architecture', 'plan the system', 'what are the risks', 'we decided', 'persist this design'. Not for implementing a settled spec. Needs the verstak_* tools.",
  },
  entry: {
    description:
      "Read the graph before any answer about what is recorded: orient on the subject, open the node, walk its arrows, read by the question; answer from the graph, not from memory or code. Triggers: 'orient yourself', 'what does the graph say', 'what's going on', 'why did we decide', 'who owns this', 'we discussed', 'per my notes', 'what is a kriya', explain the method; about to say 'not recorded'; a search returned hits. Needs the verstak_* tools.",
  },
  "establish-mcp": {
    description:
      "The transport to the graph, only when it is missing: no verstak_* tools, or they fail on transport — not connected, an OAuth link, a dead token, silence; a first sign-in; switching instance; DELIVERY BEHIND in a reply; which bridge version is installed. Triggers: 'connect the graph', 'bring up the bridge', 'verstak tools unavailable', 'MCP won't connect', 'OAuth isn't going through', 'update the bridge'.",
  },
  feedback: {
    description:
      "Turn a session's experience of the method and its tools into something fixable: a rule that missed a case, a description that misstated the surface, a fix that worked for an unknown reason, a step with no sign of its own — recorded on the tool's node for its steward, after checking it isn't said already. Triggers: 'feedback', 'give feedback', 'record what didn't work', 'the skill let me down'. Needs the verstak_* tools.",
  },
  foreman: {
    description:
      "The tier between the user and their agents, on the user's appointment: the user's word into cases, decisions into the graph, work split across units and accepted back, stalled and empty posts found, escalations filtered and choices put to the user. Triggers: 'take the post', 'split this across the agents', 'run a crew', 'who's stuck', 'who else should we bring up', 'task the agents', 'accept the work', 'plan in waves'. Needs the verstak_* tools.",
  },
  inquiry: {
    description:
      "The life of a vimarsha and the field of inquiry: anchor, resolve, end by axis, accept as is, supersede, crystallize, attach to a transformation. Triggers: 'go through the vimarshas', 'what's open', 'close this question', 'keep this question', 'park this question', 'resolve the question', 'triage the questions'; an answer, merge or decision lands on a question; many hanging vimarshas; a session ends. Not posing a question (writing). Needs the verstak_* tools.",
  },
  intake: {
    description:
      "Let external text into the graph as a claim, never as a fact: an issue, docs, a README, a post, a news item, someone else's analysis, a transcript — mapped to node types, with provenance, deduplicated, anchored and checked; text headed for a case or another agent is checked against the graph first. Triggers: 'ingest this', 'seed the graph from these issues', 'add this issue', 'record this post', 'distribute this review across the cases'. Needs the verstak_* tools.",
    rewrites: [["`product-roadmap` composes this method", "the plugin's product-roadmap method, not in this catalogue, composes this method"]],
  },
  integrity: {
    description:
      "The wavefront of a change or a transformation: what it touches across holons. Triggers: 'integrate X with Y', 'integration spec', 'integration scope', 'cold review', 'who is affected', 'what breaks', 'check the transformation for integrity', 'is this backed by the graph', 'claim audit'; a change touching more than one thing or an integration surface. Needs the verstak_* tools.",
  },
  lead: {
    description:
      "Lead a case: set work in it, accept work claimed done, part two agents on one thing, agree a joint between two sides, split a case that gathers several subjects, hand the lead over, close the case when its subject is answered. Triggers: 'lead the case', 'you lead', 'close the case', 'hand over the lead'; you opened a case by a write or by talk. Leading gives no role's rights. Needs the verstak_* tools.",
  },
  "reality-audit": {
    description:
      "Witnessing by reality before saying verified, done, green or works: freeze the claims, name each one's canonical carrier and falsifier, climb the ladder to the first failure, one verdict per claim; scratch evidence stays provisional. Triggers: 'reality audit', 'does it really work', 'check the canonical artifact', 'tests passed'; after an owner correction or a failed falsifier; a non-zero exit code or mixed output. Needs the verstak_* tools.",
  },
  reconcile: {
    description:
      "Two-way reconciliation of code and graph at the end of a material task: what the work made true the graph says, what stopped being true it no longer does, comments that retell the graph go. Triggers: 'reconcile', 'check the code against the graph', 'tidy the graph', 'weave your area', 'pay the graph's debts', 'does the graph match the code', 'the graph lies about the code'. Needs the verstak_* tools.",
  },
  weaving: {
    description:
      "Complete an existing graph whose structure stands but whose meaning is incomplete: close lifecycles, sense on arrows, split kriyas with two actors, re-link after a phenomenon is distinguished. Triggers: 'weave', 'stitch', 'close the lifecycle', 'fix the tensions', 'links aren't drawn', 'where does this come from'; leaked, relay-gap or orphan tensions piling up; a stage done or decided and the graph behind. Needs the verstak_* tools.",
  },
  writing: {
    description:
      "Write a node into the graph — phenomenon, kriya, vimarsha, holon, role, transformation: search first, then the type, given_as, modes and arrows. Use always before verstak_add_*, a verstak_batch that creates nodes, or a verstak_update that rewrites a body, and when the node type or modes are unclear. Triggers: 'record this', 'write this down', 'add a node', 'create a kriya', 'put it in the graph'. Needs the verstak_* tools.",
  },
  "align-delegation": {
    source: "references",
    description:
      "Reference for the align, code-work and autonomous skills: the delegation doctrine and the subagent role files — the roles, their bodies and satellite entries, the brief and return contracts, the bridge checks. Load when one of those skills points here; not a task of its own.",
  },
  "align-harness-surfaces": {
    source: "references",
    description:
      "Reference for the align skill: where each harness reads instructions and fires automation — Claude Code, Codex, OpenCode, pi — and the ritual plugin template. Load when one of those skills points here; not a task of its own.",
  },
  "align-hooks": {
    source: "references",
    description:
      "Reference for the align skill: the exact Claude Code hook shapes to project and repair — start, push, merge, memory guard, with their samples. Load when one of those skills points here; not a task of its own.",
  },
  "align-superpowers-interop": {
    source: "references",
    description:
      "Reference for the align skill: the canonical template for interop with the superpowers workflow suite. Load when align points here; not a task of its own.",
  },
  "collaborate-channel": {
    source: "references",
    description:
      "Reference for the collaborate skill: the channel's mechanics — seats, sockets, frames, watchdogs, per-harness listening, reaching an unbound owner, the failure table. Load when the channel broke or a skill points here; not a task of its own.",
  },
  "door-menu": {
    source: "references",
    description:
      "Reference for the verstak skill: the empty invocation — the readiness ladder first, then orientation, then one question from what was seen. Load when the door points here; not a task of its own.",
  },
  "door-phrasebook": {
    source: "references",
    description:
      "Reference for the verstak skill: what users call the thing they need — the marker phrases that tell neighbouring methods apart when a request falls between routes or into none. Load when the door points here; not a task of its own.",
  },
  "writing-batch": {
    source: "references",
    description:
      "Reference for the writing skill: batch writes with verstak_batch — order, inline arrows, temp references. Load when writing points here; not a task of its own.",
  },
  "writing-given-as": {
    source: "references",
    description:
      "Reference for the writing skill: given_as — the decision tree, the nests and the arrow matrix. Load when writing points here; not a task of its own.",
  },
  "writing-modes": {
    source: "references",
    description:
      "Reference for the writing and reconcile skills: the three mode axes — self-check, patterns, cell words, moves. Load when a skill points here; not a task of its own.",
  },
  "agents-template": {
    source: "templates",
    description:
      "Template for the align skill: the AGENTS.md file align fills for a repository, verbatim inside a fence. Load when align points here; not a task of its own.",
  },
  "reality-template": {
    source: "templates",
    description:
      "Template for the align skill: the REALITY.md file align fills for a repository, verbatim inside a fence. Load when align points here; not a task of its own.",
  },
};

// The door's contract number, which align, entry and the door read off the
// description, carried into the home description from the plugin's own; its
// align command is the plugin's, so it stays behind.
const CONTRACT = (() => {
  const m = /AGENTS\.md CONTRACT: \d+/.exec(readFileSync(join(root, "skills", "verstak", "SKILL.md"), "utf8"));
  if (!m) throw new Error("skills/verstak/SKILL.md: the description names no AGENTS.md CONTRACT");
  return m[0];
})();
SKILLS.verstak.description += ` ${CONTRACT}.`;

const SOURCE_DIR = {
  door: join(root, "skills", "verstak"),
  methods: methodsDir,
  references: referencesDir,
  templates: join(root, "skills", "verstak", "templates"),
};

function sourceFile(name, spec) {
  const source = spec.source ?? "methods";
  return source === "door" ? "SKILL.md" : `${name}.md`;
}

// Pointers the home loop cannot follow; none may survive the rewrites.
const DANGLING = [/methods\//, /references\//, /templates\//, /\bthe door\b/i, /\]\(/, /\*\*product-roadmap\*\*/, /\breference §/];

function rewriteOnce(body, rewrites, where) {
  for (const [from, to] of rewrites) {
    const count = body.split(from).length - 1;
    if (count !== 1) {
      errors.push(`${where}: rewrite expected once, found ${count}: ${JSON.stringify(from)}`);
      continue;
    }
    body = body.replace(from, () => to);
  }
  return body;
}

// The named `## N · Title` sections of a reference, demoted to `### AN · Title`.
function appendix(spec) {
  const where = `references/${spec.file}`;
  const text = readFileSync(join(referencesDir, spec.file), "utf8");
  const parts = text.split(/^(?=## )/m);
  const picked = spec.sections.map((n) => {
    const part = parts.find((p) => p.startsWith(`## ${n} · `));
    if (!part) errors.push(`${where}: section §${n} not found`);
    return part ? part.replace(/^## (\S+) · /, "### A$1 · ").trimEnd() : "";
  });
  return rewriteOnce([spec.heading, ...picked].join("\n\n"), spec.rewrites, where) + "\n";
}

const errors = [];

// Every name a pointer can resolve to: the stems of the door's files.
const STEMS = new Set(
  ["methods", "references", "templates"].flatMap((s) =>
    readdirSync(SOURCE_DIR[s]).filter((f) => f.endsWith(".md")).map((f) => f.slice(0, -3)),
  ),
);

// Applies fn to the text outside fenced blocks: a fence is a verbatim artifact
// (a hook, a role body align installs) and keeps its bytes.
function outsideFences(text, fn) {
  const parts = text.split(/^(?=[ \t]*(?:```|~~~))/m);
  let fenced = false;
  return parts
    .map((part) => {
      const opens = /^[ \t]*(?:```|~~~)/.test(part);
      if (!opens) return fenced ? part : fn(part);
      const [fenceLine, ...rest] = part.split("\n");
      const wasFenced = fenced;
      fenced = !fenced;
      if (wasFenced) return fenceLine + "\n" + fn(rest.join("\n")); // a closing fence; the rest is outside
      return part; // an opening fence and the fenced text up to the next fence line
    })
    .join("");
}

function render(name, spec) {
  const source = spec.source ?? "methods";
  const where = `${source === "door" ? "" : `${source}/`}${sourceFile(name, spec)}`;
  let text = readFileSync(join(SOURCE_DIR[source], sourceFile(name, spec)), "utf8");
  // The door's own frontmatter is the plugin's; the home gets its own below.
  if (source === "door") text = text.replace(/^---\n[\s\S]*?\n---\n+/, "");
  const front = ["---", `name: ${name}`];
  if (spec.slash) front.push("slash: true");
  front.push(`description: ${JSON.stringify(spec.description)}`, "---", "");
  // A template is the text of a file align writes into a repository, pointers
  // and all: it ships verbatim inside a fence, nothing rewritten.
  if (source === "templates") return front.join("\n") + "\n" + `~~~~markdown\n${text.trimEnd()}\n~~~~\n`;
  let body = rewriteOnce(text, spec.rewrites ?? [], where);
  if (spec.appendix) body = body.trimEnd() + "\n\n" + appendix(spec.appendix);
  // A file named by path becomes the name load_skill opens: a method its bold
  // name, as the door writes it (in code inside bold text, which bold can't
  // nest); a reference or a template its name in code. The door is `verstak`.
  body = outsideFences(body, (part) => {
    part = part.replace(/`methods\/([a-z-]+)\.md`/g, (m, x, at) => {
      const before = part.slice(part.lastIndexOf("\n", at) + 1, at);
      return (before.split("**").length - 1) % 2 ? `\`${x}\`` : `**${x}**`;
    });
    part = part.replace(/`(?:references|templates)\/([a-z-]+)\.md`/g, "`$1`");
    return source === "door" ? part : part.replace(/\b[Tt]he door\b/g, "`verstak`");
  });
  let fenced = false;
  body.split("\n").forEach((line, i) => {
    // A fenced block is a verbatim artifact (a hook, a file); its text is not a pointer.
    if (/^\s*(```|~~~)/.test(line)) fenced = !fenced;
    if (fenced) return;
    for (const re of DANGLING) {
      if (source === "door" && re.source === "\\bthe door\\b") continue;
      if (re.test(line)) errors.push(`home/${name}/SKILL.md body:${i + 1}: pointer the home cannot follow (${re}): ${line.trim().slice(0, 120)}`);
    }
    for (const [, named] of line.matchAll(/(?:\*\*|`)([a-z][a-z-]*)(?:\*\*|`)/g)) {
      if (STEMS.has(named) && !(named in SKILLS)) errors.push(`home/${name}/SKILL.md body:${i + 1}: ${named} is not in the home catalogue`);
    }
    for (const [tool] of line.matchAll(/\bverstak_[a-z_]+/g)) {
      if (!tool.endsWith("_") && !surfaceTools.has(tool)) errors.push(`home/${name}/SKILL.md body:${i + 1}: ${tool} is not on the surface (fixtures/surface.json)`);
    }
  });
  return front.join("\n") + "\n" + body;
}

const check = process.argv.includes("--check");
const outputs = Object.entries(SKILLS).map(([name, spec]) => [name, render(name, spec)]);

if (errors.length === 0) {
  if (check) {
    const present = existsSync(homeDir) ? readdirSync(homeDir) : [];
    for (const extra of present.filter((n) => !(n in SKILLS))) {
      errors.push(`home/${extra}: not generated from the skill — remove it or add it to scripts/build-home.mjs`);
    }
    for (const [name, text] of outputs) {
      const path = join(homeDir, name, "SKILL.md");
      if (!existsSync(path)) errors.push(`home/${name}/SKILL.md: missing (run 'make build')`);
      else if (readFileSync(path, "utf8") !== text) errors.push(`home/${name}/SKILL.md: differs from its source under skills/verstak/ (run 'make build' and commit)`);
    }
  } else {
    for (const [name, text] of outputs) {
      mkdirSync(join(homeDir, name), { recursive: true });
      writeFileSync(join(homeDir, name, "SKILL.md"), text);
    }
  }
}

if (errors.length) {
  for (const e of errors) console.error(`✗ ${e}`);
  process.exit(1);
}
console.log(check ? "✓ home/ in sync with skills/verstak/methods/" : `Built: ${outputs.map(([n]) => `home/${n}/SKILL.md`).join(" ")}`);
