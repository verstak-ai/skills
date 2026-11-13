// Where the OpenCode plugin refuses the blocking question tool (graph @nks/nks-dev, node #10397):
// "repo" — only in a repository under our cover, "all" — everywhere. Ours is "repo": outside
// our cover the plugin leaves `question` and the permission decision alone (node #10020).
export const QUESTION_SCOPE: "all" | "repo" = "repo";
