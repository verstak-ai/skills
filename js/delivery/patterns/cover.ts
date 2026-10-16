// The project cover a root session seats itself by (the core's shared/cover.ts): the file
// in the session's directory and the keys of its flat YAML front matter, as align writes
// them (skills/verstak/templates/agents-template.md). The keys are the delivery's own: a
// sibling delivery with another cover template names its own.

export const COVER = {
  /** The cover file in the session's directory. */
  file: "AGENTS.md",
  /** The graph slot: the value starts with @owner/slug or rN. */
  graph: "Graph",
  /** The agent-role slot: the value starts with exactly one reference '#N "name"'. */
  role: "Agent role",
  /** The quotes around the name in the role reference: opening and closing (here the same character). */
  roleQuotes: ['"', '"'] as const,
} as const;
