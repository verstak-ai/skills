// The text contract of the minding method across the files that carry it (graph
// @nks/nks-dev, node #2109): each distinction is worded at the place an agent meets
// it, and the retired formulas it replaced are gone. Text presence only — it says
// nothing about whether an LLM reading the skill then acts differently; that needs
// observed runs. VERSTAK_MINDING_ROOT points it at another tree, such as an older
// commit's copies, to see it fail there.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

import { REPO } from "./built.mjs";

const ROOT = process.env.VERSTAK_MINDING_ROOT || REPO;

const FILES = {
  minding: "skills/verstak/methods/minding.md",
  reference: "skills/verstak/references/minding-personal-realm.md",
  door: "skills/verstak/SKILL.md",
  phrasebook: "skills/verstak/references/door-phrasebook.md",
  align: "skills/verstak/methods/align.md",
  home: "home/minding/SKILL.md",
};

// Each distinction, by a short phrase at its file.
const PRESENT = {
  minding: [
    '**Read or write it only once the `personal_mind` sign of `verstak_me(action="readiness")` shows this account\'s own graph present**',
    // personal vs project on the same topic
    "a working preference stays theirs even when its topic is development",
    "Subject and ownership pick the home, not the topic",
    // recall outcomes
    "a bounded search proves no absence",
    "not a miss, and no licence to write what may already be there",
    "one fact at two moments, not two options",
    // a replaced record is retired by its axis: no `supersedes` edge outside vimarshas
    "a record and the newer one that replaced it",
    "asked where only the user reads it",
    // relate → permissible move
    "## §1a Relate — what the hit changes now",
    "A recalled fact is a ground, not a sanction",
    "| **adapt** |",
    "| **don't apply** |",
    "| **ask one deciding question** |",
    "Authority before freshness.",
    "grants no new sanction, payment or right over someone else's rule",
    "a direct answer is a lawful end",
    // a miss or an unreachable source needs no existing record to relate
    "Unreachable, withdrawn, changed conditions and ambiguity are different outcomes",
    // writing rules
    "Kind and modes follow the judgement and the act, not the words",
    "honour it for this case and leave the stored one as it is",
    "One success shows it worked once, under those conditions",
    "read before you retry; a version conflict → reread",
    // privacy, by the act and by audience
    "would its reader learn the record from the act?",
    "The line holds from the first read: retrieving and sorting candidates",
    "Portable is not shared.",
    "Handing it to a team is a separate act of the user's",
    // reconcile
    "The full pass runs on request",
    "**Kinds of change**",
    "it is retired by its carrying axis, as for any replaced node — `methods/writing.md`, After writing",
    "a `grundsatz` (principle) only by the user's act",
    "it doesn't refute its earlier success under the old one",
    "Age alone ends no preference.",
    "release without inventing a lesson",
    // creation unasked, filling on request
    "Every user gets personal memory without being asked",
    "Filling (§3) and reconciling (§2) happen on request.",
    // the one slice read at a root session's start, and the label that puts a card in it
    // (graph @nks/nks-dev, node #8589)
    "except one slice: **working with agents**",
    "so a root session reads them at its start",
    'give it `attrs` `{"slice":"agents"}`',
    "an older such card without the label gets it in the same move",
    "Nothing personal goes into `AGENTS.md` or other project files.",
  ],
  reference: [
    "the user's own working preference, a development one too, is theirs and does go in",
    "one success there is one observation, not a method proven in general",
    "Created without asking",
    // a lesson's kind follows what it is; a binding principle only by the user's act
    "A lesson's kind follows what the yield is",
    "a method of the user's own → `vollzug`; an observed case → `sachverhalt`; a pattern taking shape → `bildung`",
    "a binding principle (`grundsatz`) only by the user's act",
    "no new lesson is owed",
    "A finished area is the other occasion.",
    'carries `attrs` `{"slice":"agents"}`',
    "used only once the `personal_mind` sign shows this account's own graph present",
  ],
  door: [
    "before writing it, **whose fact?**",
    "before asking the user, search their mind",
    "An aligned repo doesn't switch mind off",
    // a purely project request runs without mind beyond the start slice
    "purely technical work that needs nothing of the user doesn't read it beyond the start slice",
    // the start slice: a root session only, one read, below the project's rules
    "**The personal slice — only a root session talking to the user**",
    // a root session that finds personal memory missing provides it, unasked (graph @nks/nks-dev, node #4694)
    "`missing` → personal memory is provided here, unasked, by **minding**'s entry",
    "no read and no create, say so in a line",
    'verstak_search(realm="mind", q="", attrs_filter="slice:agents", limit=50)',
    // a bare `mind` read only once readiness shows this account's own (graph @nks/nks-dev, node #8661)
    "the `personal_mind` sign must be present for this account",
    "its `state` exactly `present` → one read",
    "`unknown` means the session's credential can't reach your own",
    "below this project's rules",
    "search their mind before asking them",
    "or their own way of working, development included → **minding**",
    "this repo's rule, from its rule-holder) → `AGENTS.md`",
    "a standing preference (a fork by whom it binds: this repo's rule or the user's own)",
  ],
  phrasebook: [
    "**A standing preference — one sign, whom it binds:**",
    "how this user wants to be worked with, wherever they are → minding",
    "Neither sign → keep it personal and ask; never write it to the repo on a guess",
    "a project rule kept in mind is only missed by other agents",
    '("always show me a plan first" and "keep replies short" stay here)',
  ],
  align: [
    "the user's own facts and working preferences → `methods/minding.md`; the project's rules and process → Step 1",
    // AGENTS.md says nothing of personal memory (graph @nks/nks-dev, node #8589)
    "**No personal memory in `AGENTS.md`** — no slot, no rule",
  ],
  home: [
    'so a root session reads them at its start: one `verstak_search(realm="mind", q="", attrs_filter="slice:agents", limit=50)`',
    "apply, adapt, don't apply, or ask one deciding question",
    "## §1a Relate — what the hit changes now",
    "it is retired by its carrying axis, as for any replaced node",
    "A lesson's kind follows what the yield is",
  ],
};

// Formulas the shipped text carried before (main bfd5a6c1, then this change before its
// review), each contradicting the method; none may come back in any of the files.
const RETIRED = [
  "A miss is an answer",
  "a miss offered as a write",
  "Two areas claim the question → ask in one line naming both",
  "on a new graph, machine or job, or when the map is visibly behind",
  "ones affecting how development runs go to AGENTS.md or the project graph",
  "preferences affecting how development runs or what it produces — AGENTS.md or the project graph",
  "process → `AGENTS.md` or the project graph; how to talk to the user → minding",
  '"always show a plan" → `AGENTS.md` or the project graph',
  "`methods/minding.md`; preferences → Step 1",
  "people, cross-project lessons; never harness-local memory",
  "owner_word",
  // retired by review of this change
  "A one-off request doesn't silently rewrite a standing preference — ask which it is",
  "**Not a fork:** a standing preference",
  "a standing preference (an instruction, not a fork)",
  // a `supersedes` edge between personal records (it joins only vimarshas), and a
  // lesson's kind fixed to a principle or a pattern (main 74dfa965)
  "a record and the one that `supersedes` it",
  "a new record `supersedes` the old",
  "A lesson is a `grundsatz` (a principle that now binds) or a `bildung` (a pattern taking shape)",
  "else a `grundsatz` (principle) or `bildung` (a pattern taking shape)",
  // personal memory as an AGENTS.md slot, and recall keyed to need with no start slice
  // (main 7f22d9a)
  "- **Cross-project memory** — template default",
  "(`methods/align.md`, Step 1, Cross-project memory)",
  "Both key to the **question, not the session**: an aligned repository",
  // a bare `mind` taken as always the account's own, with no readiness gate (main bd7f390)
  "the platform resolves it to the current account's personal graph",
  "it resolves to the current account's personal graph",
];

function read(root) {
  return Object.fromEntries(
    Object.entries(FILES).map(([key, path]) => [key, readFileSync(join(root, path), "utf8")]),
  );
}

function missing(texts) {
  return Object.entries(PRESENT).flatMap(([key, phrases]) =>
    phrases
      .filter((p) => !texts[key].includes(p))
      .map((p) => `${FILES[key]}: missing ${JSON.stringify(p)}`),
  );
}

function stale(texts) {
  return Object.entries(texts).flatMap(([key, text]) =>
    RETIRED.filter((p) => text.includes(p)).map(
      (p) => `${FILES[key]}: retired ${JSON.stringify(p)}`,
    ),
  );
}

const shipped = read(ROOT);

test("every minding distinction is worded at its file", () => {
  assert.deepEqual(missing(shipped), []);
});

test("no retired minding formula is left in the shipped files", () => {
  assert.deepEqual(stale(shipped), []);
});

// A fixture made of the new wording alone: independent of the shipped files, so the
// checks themselves are shown to pass it and to fail each kind of breakage.
const GREEN = Object.fromEntries(
  Object.keys(FILES).map((key) => [key, (PRESENT[key] || []).join("\n")]),
);

test("the check accepts text made of the new wording alone (synthetic fixture)", () => {
  assert.deepEqual(missing(GREEN), []);
  assert.deepEqual(stale(GREEN), []);
});

test("the check rejects a retired formula put back (synthetic fixture)", () => {
  const fixture = {
    ...GREEN,
    minding: GREEN.minding + '\n**A miss is an answer** ("that isn\'t in memory").\n',
  };
  assert.deepEqual(stale(fixture), [`${FILES.minding}: retired "A miss is an answer"`]);
});

test("the check rejects a `supersedes` edge between records put back (synthetic fixture)", () => {
  const fixture = {
    ...GREEN,
    minding:
      GREEN.minding +
      "\na **supersession** (a new record `supersedes` the old, which stays readable);\n",
  };
  assert.deepEqual(stale(fixture), [
    `${FILES.minding}: retired "a new record \`supersedes\` the old"`,
  ]);
});

test("the check rejects a distinction taken out (synthetic fixture)", () => {
  const fixture = {
    ...GREEN,
    door: GREEN.door.replace("before asking the user, search their mind", ""),
  };
  assert.deepEqual(missing(fixture), [
    `${FILES.door}: missing "before asking the user, search their mind"`,
  ]);
});
