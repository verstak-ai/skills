// The sections of a repository's AGENTS.md the ritual words cite (the core's shared/sections.ts,
// graph @nks/nks-dev, node #9351): a heading is recognised by its kind and cited as it stands —
// the words never invent a template heading. The first heading of the kind wins.

export const SECTIONS = {
  /** The stage self-check — the push word. */
  check: (h: string): boolean => /self-check|self-review/i.test(h),
  /** The session lifecycle — the merge word, beside the merge section. */
  lifecycle: (h: string): boolean => /lifecycle/i.test(h),
  /** The after-merge acts — the merge word. */
  merge: (h: string): boolean => (/merge/i.test(h) && /graph/i.test(h)) || /every merge/i.test(h),
  /** A push to the trunk — the merge word on a push to main or master, before the merge heading. */
  trunk: (h: string): boolean => /push/i.test(h) && /main|master|trunk/i.test(h),
  /** The persistence rules — the memory guard's refusal. */
  persist: (h: string): boolean => /persistence/i.test(h),
} as const;
