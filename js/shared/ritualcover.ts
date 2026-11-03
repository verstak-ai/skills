// What switches the delivery's rituals on in a repository (graph @nks/nks-dev, node #9319,
// section RITUALS; the cover — #9316): the delivery's block of the cover file at the repository
// root, read locally. The graph switches on the memory guard, the push and merge words and the
// early start word of an unfinished onboarding (#8018); the full start word needs the holon and
// the agent role too. The block's rituals field keeps each one it leaves out silent. The words speak the language of the file's body — the one whose section
// they name heads it — else the session's. A rituals plugin of the repository's own keeps the
// delivery's silent in OpenCode until the transition takes it off.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { COVER, LANGS, PREPARE, RITES } from "../delivery/index.ts";
import { type CoverKeys, stampOf } from "./cover.ts";
import { coverBlock, type Ritual, ritualsOf } from "./coverblock.ts";
import { type Lang, wordsIn } from "./lang.ts";
import { repoRoot } from "./reposigns.ts";

export interface RitualCover {
  root: string;
  graph: string;
  holon?: string;
  role?: string;
  lang?: Lang;
  /** The rituals the cover switches on; one off keeps silent (#9341). */
  on: ReadonlySet<Ritual>;
}

/** The language whose lifecycle section heads the text; none — undefined. */
export function bodyLang(text: string): Lang | undefined {
  const heads = text
    .split("\n")
    .filter((l) => /^#{1,6}\s/.test(l))
    .map((l) => l.replace(/^#+\s*/, "").toLowerCase());
  return LANGS.find((l) => heads.some((h) => h.startsWith(RITES[l].lifecycle().toLowerCase())));
}

/** The addresses of the cover of the repository holding dir; none, foreign or no graph — null. */
export function ritualCover(dir: string, cover: CoverKeys = COVER): RitualCover | null {
  const root = repoRoot(dir);
  if (!root) return null;
  let text: string;
  try {
    text = readFileSync(join(root, cover.file), "utf8");
  } catch {
    return null;
  }
  if (stampOf(text, cover) === "foreign") return null;
  const block = coverBlock(text, cover.root);
  const graph = block?.get("graph");
  if (!block || !graph) return null;
  const holon = block.get("holon") || undefined;
  const role = block.get("agent_role") || undefined;
  const lang = bodyLang(text);
  const { on } = ritualsOf(block);
  return { root, graph, ...(holon ? { holon } : {}), ...(role ? { role } : {}), lang, on };
}

/** The start word the cover calls for: full with graph, holon and agent role, else the early one. */
export function startWord(c: RitualCover): string {
  const { graph, holon, role, lang } = c;
  return holon && role
    ? wordsIn(PREPARE, lang).start({ graph, holon, role })
    : wordsIn(RITES, lang).early(graph);
}

/** A rituals plugin of the repository's own in its OpenCode plugins folder. */
export function ownRitualsPlugin(root: string): boolean {
  try {
    return readdirSync(join(root, ".opencode", "plugins")).some((f) => /ritual/i.test(f));
  } catch {
    return false;
  }
}
