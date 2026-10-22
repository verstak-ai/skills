// The project cover a root session seats itself by and the alignment signs read (the core's
// shared/cover.ts, shared/reposigns.ts): the file in the session's directory and the keys of its
// flat YAML front matter, as align writes them (skills/verstak/templates/agents-template.md).
// The keys come as forms by the repository's language (graph @nks/nks-dev, node #8497); verstak
// speaks English only, so it has one form. A sibling delivery names its own keys, and they are
// not listed here.

export const COVER = {
  /** The cover file in the session's directory. */
  file: "AGENTS.md",
  /** The cover's forms by the repository's language: the one whose keys stand in the front matter is read. */
  forms: {
    en: {
      /** The graph slot: the value starts with a full graph address (the owner's handle/slug) or rN. */
      graph: "Graph",
      /**
       * The words that list equal working graphs in the graph slot ("@a/x or @b/y" is ambiguous); a
       * graph after prose (a pointer to the methodology, "not used") is not a working one.
       */
      graphJoins: ["or", "and", "Or", "And", "OR", "AND"],
      /** The agent-role slot: the value starts with exactly one reference '#N "name"'. */
      role: "Agent role",
      /** The quotes around the name in the role reference: opening and closing (here the same character). */
      roleQuotes: ['"', '"'],
      /**
       * Align's stamp in the cover file: "(verstak align: contract N, stamped …"; before the
       * contract counter it read "(verstakify: contract DATE".
       */
      stamp: /\((?:verstak align:\s*contract\s*`?\d+`?\s*,\s*stamped|verstakify:\s*contract\b)/,
    },
  },
  /**
   * Another delivery's alignment stamp: a line starting "(<who>: contract N" — or the Russian
   * word for contract, escaped below, for no Cyrillic stands in this repository — where who is
   * not verstak's own ("verstak align:", the older "verstakify:"). Such a stamp without our
   * own is another delivery's cover, even under the shared English keys; the same bracket inside
   * a prose line is no stamp.
   */
  stampShape:
    /^[\s*_]*\((?!verstak align:|verstakify:)[^()\n]*?:\s*(?:contract|\u043a\u043e\u043d\u0442\u0440\u0430\u043a\u0442)\s*`?\d+/m,
} as const;
