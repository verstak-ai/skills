// Proven read-only calls, independent of retry safety (graph @nks/nks-dev, nodes #10121, #6361).
import { tool } from "../delivery/index.ts";

export const READ_TOOLS = new Set(["look", "orient", "search", "semantic_search"].map(tool));
export const READ_ACTIONS: Record<string, Set<string>> = {
  [tool("case")]: new Set(["read", "history", "mine", "at"]),
  [tool("channel")]: new Set(["list", "sessions", "history"]),
  [tool("realm")]: new Set(["list"]),
  [tool("org")]: new Set(["list", "get", "realms", "list_members", "list_grants"]),
  [tool("me")]: new Set(["whoami", "orgs", "kartas", "usage", "readiness"]),
  [tool("history")]: new Set(["realm", "node", "delta"]),
  [tool("admin")]: new Set([
    "list_members",
    "access",
    "search_users",
    "list_webhooks",
    "user_webhooks",
    "version",
  ]),
};

export const declaresAction = (schema: unknown): boolean => {
  const props = (schema as { properties?: unknown } | null)?.properties;
  return !!props && typeof props === "object" && Object.hasOwn(props, "action");
};

export const readsOnly = (name: string, args: Record<string, unknown>, asks: boolean): boolean => {
  const action = String(args.action ?? "");
  return READ_TOOLS.has(name) || (asks && action === "?") || !!READ_ACTIONS[name]?.has(action);
};
