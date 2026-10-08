#!/usr/bin/env node
// Generate home/<name>/SKILL.md from skills/verstak/methods/<name>.md.
//
// The verstak.ai conversation home reads a flat catalogue (SKILLS_SUBDIR=home):
// <name>/SKILL.md with a `name` and a one-line `description`, and load_skill
// returns that one file — no door, no other method, no reference. So each copy
// gets frontmatter and has every pointer into the rest of the skill rewritten
// to a name or dropped. home/ sits outside skills/ so plugin auto-discovery
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
const homeDir = join(root, "home");

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
    ],
  },
  minding: {
    description:
      "The user's memory in the graph — the personal graph @handle/mind, recalled and written by reflex, not ritual. WRITE when a durable fact about the user surfaces and serves no single project: their own machines, expiries, people, cross-project lessons; never harness-local memory. A project's servers, pipeline and dated duties belong to that project's graph. RECALL when the user's own field is in play: 'do you remember', 'what do you know about me', 'what do I have', 'what's on my plate', 'where is it deployed', or a task needs such a fact. 'remember this' → write; 'set up my memory' → bootstrap. Needs the verstak_* tools.",
    rewrites: [
      ["(`references/minding-personal-realm.md` §1–2): created by the door when the user has no graph,", "(the verstak skill's personal-graph reference, §1–2): created at session start when the user has no graph,"],
      ["Shapes: `references/minding-personal-realm.md` — machines", "Shapes, in the verstak skill's personal-graph reference: machines"],
      [" (the door's `Survey` table, \"no project graph\")", ""],
    ],
  },
  widgets: {
    description:
      "Live widgets in the Verstak window instead of a retold list — only where the answer is drawn by that window. Triggers: 'show the graph's cases', 'which cases are open', 'cases on this node', 'the card for case #N', 'where does this case stand', 'who is working in the graph now', 'what are the agents busy with', 'what's in progress'. Places one of the widgets cases, case, agents as a fenced block labelled verstak with a realm parameter. Not in Claude Code, Telegram or any surface that shows the block as code.",
    rewrites: [],
  },
};

// Pointers the home loop cannot follow; none may survive the rewrites.
const DANGLING = [/methods\//, /references\//, /templates\//, /\bthe door\b/i, /\]\(/];

const errors = [];

function render(name, spec) {
  let body = readFileSync(join(methodsDir, `${name}.md`), "utf8");
  for (const [from, to] of spec.rewrites) {
    const count = body.split(from).length - 1;
    if (count !== 1) {
      errors.push(`methods/${name}.md: rewrite expected once, found ${count}: ${JSON.stringify(from)}`);
      continue;
    }
    body = body.replace(from, to);
  }
  // A method named by path becomes the bold name the door uses for it.
  body = body.replace(/`methods\/([a-z-]+)\.md`/g, "**$1**");
  body.split("\n").forEach((line, i) => {
    for (const re of DANGLING) {
      if (re.test(line)) errors.push(`methods/${name}.md:${i + 1}: pointer the home cannot follow (${re}): ${line.trim().slice(0, 120)}`);
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
