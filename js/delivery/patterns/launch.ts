// The launch line with a case: "start <graph> <role> <case #N> [from <seat>]". Parsing is
// positional (a role is itself written "#N"): graph, role, then the case — "case #N" or a
// bare "#N"/"№N". The launch line is the first text line that starts with it: OpenCode
// puts its own line before a subagent's prompt.
// Groups: 1 graph, 2 role, 3 case number, 4 the launcher's seat.
// TODO(sibling): no product token yet — with two deliveries' OpenCode plugins loaded,
// both parse the same line.
export const LAUNCH_LINE =
  /^[ \t]*start\s+(\S+)\s+(\S+)\s+(?:case\s+)?[№#]\s?(\d+)(?:[ \t]+from[ \t]+(@\S+))?(?=\s|$)/imu;
