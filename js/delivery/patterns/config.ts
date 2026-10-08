// The user's word choosing the server.
// TODO(sibling): the core reads both `ru` and `en` (bridge/config.ts); with one
// production address `ru` matches nothing until the core takes a list of choices.
export const SERVER_CHOICE = {
  ru: /(?!)/,
  en: /^(en|ai|english|verstak)$/i,
} as const;
