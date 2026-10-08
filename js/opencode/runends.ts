// Ended child sessions (graph @nks/nks-dev, nodes #6361, #6625): the child's bridge went down
// with its satellite seat — by its explicit end (leads.ts) or a previous instance's stop — and
// without a mark its next call would go by the root's bridge: a write signed with the
// launcher's seat, a case leave taking the launcher out. The mark lives in the plugin's memory
// until a new stand call or the session's deletion.
import { tool } from "../delivery/index.ts";
import { W } from "./leadwords.ts";
import { type Place, STAND_TOOL } from "./satellite.ts";

/** Tools an ended child runs by the root's bridge in full: they only read. */
const READ_TOOLS = new Set(["look", "orient", "search", "semantic_search"].map(tool));

/**
 * Reading actions of tools that also write: they sign nothing and go by the root's bridge.
 * The others, like graph and case writes, are refused. A history invert counts as writing.
 * Actions — by the surface's tool descriptions (fixtures/surface.json, action).
 */
const CASE_READS = new Set(["read", "history", "mine", "at"]);
const READ_ACTIONS: Record<string, Set<string>> = {
  [tool("case")]: CASE_READS,
  [tool("room")]: CASE_READS, // the case tool's former name
  [tool("channel")]: new Set(["list", "sessions", "history"]),
  [tool("realm")]: new Set(["list"]),
  [tool("org")]: new Set(["list", "get", "realms", "list_members", "list_grants"]),
  [tool("me")]: new Set(["whoami", "orgs", "kartas", "usage"]),
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

/** The tool declares an action argument in its schema (inputSchema from tools/list). */
export const declaresAction = (inputSchema: unknown): boolean => {
  const props = (inputSchema as { properties?: unknown } | null)?.properties;
  return !!props && typeof props === "object" && Object.hasOwn(props, "action");
};

/**
 * The call only reads: it signs nothing and may go by the root's bridge. action="?" is help only
 * for a tool that declared action (asks): others drop the extra argument and run the call.
 */
export const readsOnly = (name: string, args: Record<string, unknown>, asks: boolean): boolean => {
  const action = String(args.action ?? "");
  return READ_TOOLS.has(name) || (asks && action === "?") || !!READ_ACTIONS[name]?.has(action);
};

/** A child's read by the root's bridge: a case history with keep_cursor, or it would move the ROOT's cursor. */
const asChildRead = (name: string, args: Record<string, unknown>): void => {
  if ((name === tool("case") || name === tool("room")) && args.action === "history")
    args.keep_cursor = true;
};

/**
 * Reads of the human's identity are not graph reads (#6550, rule 6): a session without its own
 * confirmed seat does not get them as its own by the root's bridge. "?" is help only with asks.
 */
const IDENTITY: Record<string, Set<string> | "all"> = {
  [tool("me")]: "all",
  [tool("admin")]: new Set(["search_users", "access", "list_members", "user_webhooks"]),
  // The human's organizations and membership — by the tool's description, all its reads.
  [tool("org")]: new Set(["list", "get", "realms", "list_members", "list_grants"]),
};
function identityRefusal(
  name: string,
  args: Record<string, unknown>,
  asks: boolean,
): string | null {
  const action = String(args.action ?? "");
  const of = IDENTITY[name];
  if (!of || (asks && action === "?")) return null;
  if (of !== "all" && !of.has(action)) return null;
  return W().identity(name, action);
}

/**
 * A subagent speaks only by its satellite (#6550, rule 2): its write by the root's bridge is
 * always a refusal; reads go by the root's bridge without moving its cursor, except identity
 * reads (rule 6). of — the root's seat, if it holds one.
 */
export function childWriteRefusal(
  of: string | null,
  name: string,
  args: Record<string, unknown>,
  asks: boolean,
): string | null {
  const notYours = identityRefusal(name, args, asks);
  if (notYours) return notYours;
  if (readsOnly(name, args, asks)) {
    asChildRead(name, args);
    return null;
  }
  return of ? W().writeUnderParent(name, of) : W().writeNoParent();
}

export interface RunEnds {
  /**
   * The child ended: forget puts the bridge down, then the session is marked; of — the root's seat;
   * final — released by the launcher; why — its own refusal word. forget null — the bridge still
   * ends its run: until it goes down any write, standing too, is a refusal.
   */
  end(
    session: string,
    of: Place | null | undefined,
    forget: ((s: string) => void) | null,
    final?: boolean,
    why?: string,
  ): void;
  /** The child stood again — the mark is lifted; a launcher's release only by the session's deletion (gone). */
  clear(session: string, gone?: boolean): void;
  /** Throws a refusal aloud if an ended child's call does not only read; asks — the tool declares action. */
  guard(session: string, name: string, args: Record<string, unknown>, asks: boolean): void;
}

export function createRunEnds(): RunEnds {
  const ended = new Map<string, Place | null>();
  const released = new Set<string>(); // the launcher's revoke is final (#6625): no standing again
  const whys = new Map<string, string>();
  const sealed = new Set<string>(); // ended, the bridge not down yet
  return {
    end(session, of, forget, final = false, why) {
      if (forget) forget(session);
      else sealed.add(session);
      ended.set(session, of ?? null);
      if (final) released.add(session);
      if (why) whys.set(session, why);
    },
    clear(session, gone = false) {
      sealed.delete(session);
      if (gone) released.delete(session);
      if (!released.has(session)) ended.delete(session);
      if (!ended.has(session)) whys.delete(session);
    },
    guard(session, name, args, asks) {
      const final = released.has(session);
      if (
        (final || sealed.has(session)) &&
        !READ_TOOLS.has(name) &&
        !READ_ACTIONS[name]?.has(String(args.action ?? ""))
      )
        throw new Error(
          W().finalRefusal(
            whys.get(session) ?? (final ? W().releasedChild() : W().endedChild()),
            name,
          ),
        );
      if (!ended.has(session) || name === STAND_TOOL || READ_TOOLS.has(name)) return;
      const action = String(args.action ?? "");
      if ((asks && action === "?") || READ_ACTIONS[name]?.has(action)) return;
      const of = ended.get(session)?.name ?? W().launcherSeat();
      throw new Error(
        W().endedRefusal(whys.get(session) ?? W().endedSatellite(), name, action, of),
      );
    },
  };
}
