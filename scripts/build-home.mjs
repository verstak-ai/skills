#!/usr/bin/env node
// Generate home/<name>/SKILL.md from skills/verstak/methods/<name>.md.
//
// The verstak.ai conversation home reads a flat catalogue (SKILLS_SUBDIR=home):
// <name>/SKILL.md with a `name` and a one-line `description`, and load_skill
// returns that one file — no door, no other method, no reference. So each copy
// gets frontmatter and has every pointer into the rest of the skill rewritten
// to a name, inlined or dropped; every tool it names must be on the surface
// snapshot. home/ sits outside skills/ so plugin auto-discovery
// never ships it as a second set of skills.
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

// The home has no entry method: a route there becomes the reading itself.
const READ_THE_GRAPH =
  "open the node with `verstak_look`, walk the arrow the question needs, and run `verstak_orient(focus=<node>, lens=…)` there for a pattern; answer from what they show — \"I don't see it\", never \"there is none\"";

const SKILLS = {
  assistant: {
    slash: true,
    description:
      "The user's secretary across their cases: a summary of their cases when asked; the user's decisions and answers into cases verbatim, what matters in cases to the user verbatim with provenance; abandoned work checked and its role called. Triggers: 'what's on my plate', 'what's waiting on me', 'how are things', 'what's left', 'any questions for me?', 'what's up with case #N', 'who's doing what', 'what's on fire', 'what's new', 'where are we', 'did you say …?', 'tell them …', 'pass this on', 'what's hanging in my cases', 'tidy up abandoned cases', 'assistant'. Does not divide work or do the craft. Needs the verstak_* tools.",
    rewrites: [
      ["Case laws: the door, `Cross-cutting norms`.", "Case laws: join by invitation or share, `read` without joining to look inside, post only when the addressee will have something to read; a delivery doesn't oblige a reply."],
      ["Vocabulary: the door's `Answer` step — \"case\"", "Vocabulary: \"case\""],
      [" (the door, `Communication`)", ""],
      [" (the door, `One-off task`)", ""],
      ["that's the graph: `methods/entry.md`.", `that's the graph: ${READ_THE_GRAPH}.`],
    ],
  },
  minding: {
    description:
      "The user's memory in the graph — the personal graph @handle/mind, recalled and written by reflex, not ritual. WRITE when a durable fact about the user surfaces and serves no single project: their own machines, expiries, people, cross-project lessons; never harness-local memory. A project's servers, pipeline and dated duties belong to that project's graph. RECALL when the user's own field is in play: 'do you remember', 'what do you know about me', 'what do I have', 'what's on my plate', 'where is it deployed', or a task needs such a fact. 'remember this' → write; 'set up my memory' → bootstrap. Needs the verstak_* tools.",
    rewrites: [
      ["(`references/minding-personal-realm.md` §1–2): created by the door when the user has no graph,", "(Appendix, A1–A2): created at session start when the user has no graph,"],
      ["create the graph and role (reference §1–2)", "create the graph and role (A1–A2)"],
      ["or name the graph and hand over to `methods/entry.md`.", `or name the graph and read it there: ${READ_THE_GRAPH}.`],
      ["Shapes: `references/minding-personal-realm.md` — machines (§7), people (§2b), dated facts (§7), lessons (§8).", "Shapes, in the Appendix: machines (A7), people (A2b), dated facts (A7), lessons (A8)."],
      ["not a dossier (reference §2b)", "not a dossier (A2b)"],
      ["Fill the skeleton from the reference,", "Fill the skeleton from the Appendix (A1–A8, A10),"],
      [" (the door's `Survey` table, \"no project graph\")", ""],
    ],
    // The personal-graph skeleton the home loop needs to bootstrap and write
    // @handle/mind, inlined from its reference: the loop reads no other file.
    appendix: {
      file: "minding-personal-realm.md",
      heading: "## Appendix — the `@handle/mind` skeleton\n\nThe set of nodes §3 builds and §2 keeps true, so that one `verstak_orient(realm=\"@handle/mind\")` prints a routing answer with no lens: root holons, `attrs.key=true` landmarks, `ACTIVE BIANHUA`.",
      sections: ["1", "2", "2b", "3", "4", "5", "6", "7", "8", "10"],
      rewrites: [
        ["Created without asking (by the door, or by minding on `Realm not found`)", "Created without asking (at session start, or by this method on `Realm not found`)"],
        ["a disposable-class graph (§5)", "a disposable-class graph (A5)"],
        ["it is what keeps §1 cheap", "it is what keeps recall (§1) cheap"],
        ["Dated `sachverhalt` nodes (§7)", "Dated `sachverhalt` nodes (A7)"],
        ["before its form is released (`methods/minding.md`, §2)", "before its form is released (§2)"],
        ["a stored cross-graph agenda (`methods/minding.md`, §4)", "a stored cross-graph agenda (§4)"],
        ["are modelled (§2b)", "are modelled (A2b)"],
        ["Nothing leaves here either (`methods/minding.md`, \"Privacy\").", "Nothing leaves here either (Privacy, above)."],
      ],
    },
  },
  widgets: {
    description:
      "Live widgets in the Verstak window instead of a retold list — only where the answer is drawn by that window. Triggers: 'show the graph's cases', 'which cases are open', 'cases on this node', 'the card for case #N', 'where does this case stand', 'who is working in the graph now', 'what are the agents busy with', 'what's in progress'. Places one of the widgets cases, case, agents as a fenced block labelled verstak with a realm parameter. Not in Claude Code, Telegram or any surface that shows the block as code.",
    rewrites: [
      ["not a widget: `methods/entry.md`.", `not a widget: ${READ_THE_GRAPH}.`],
    ],
  },
};

// Pointers the home loop cannot follow; none may survive the rewrites.
const DANGLING = [/methods\//, /references\//, /templates\//, /\bthe door\b/i, /\]\(/, /\*\*entry\*\*/, /\breference §/];

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

function render(name, spec) {
  let body = rewriteOnce(readFileSync(join(methodsDir, `${name}.md`), "utf8"), spec.rewrites, `methods/${name}.md`);
  if (spec.appendix) body = body.trimEnd() + "\n\n" + appendix(spec.appendix);
  // A method named by path becomes the bold name the door uses for it.
  body = body.replace(/`methods\/([a-z-]+)\.md`/g, "**$1**");
  body.split("\n").forEach((line, i) => {
    for (const re of DANGLING) {
      if (re.test(line)) errors.push(`home/${name}/SKILL.md body:${i + 1}: pointer the home cannot follow (${re}): ${line.trim().slice(0, 120)}`);
    }
    for (const [tool] of line.matchAll(/\bverstak_[a-z_]+/g)) {
      if (!surfaceTools.has(tool)) errors.push(`home/${name}/SKILL.md body:${i + 1}: ${tool} is not on the surface (fixtures/surface.json)`);
    }
  });
  const front = ["---", `name: ${name}`];
  if (spec.slash) front.push("slash: true");
  front.push(`description: ${JSON.stringify(spec.description)}`, "---", "");
  return front.join("\n") + "\n" + body;
}

const check = process.argv.includes("--check");
const outputs = Object.entries(SKILLS).map(([name, spec]) => [name, render(name, spec)]);

if (errors.length === 0) {
  if (check) {
    const present = existsSync(homeDir) ? readdirSync(homeDir) : [];
    for (const extra of present.filter((n) => !(n in SKILLS))) {
      errors.push(`home/${extra}: not generated from a method — remove it or add it to scripts/build-home.mjs`);
    }
    for (const [name, text] of outputs) {
      const path = join(homeDir, name, "SKILL.md");
      if (!existsSync(path)) errors.push(`home/${name}/SKILL.md: missing (run 'make build')`);
      else if (readFileSync(path, "utf8") !== text) errors.push(`home/${name}/SKILL.md: differs from skills/verstak/methods/${name}.md (run 'make build' and commit)`);
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
