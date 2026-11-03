// The delivery's session rituals in OpenCode (graph @nks/nks-dev, node #9319, section RITUALS):
// what a repository's rituals plugin did, carried by the plugin and switched on by the cover of
// the session's repository (shared/ritualcover.ts). A root's first prompt gets the start word,
// the early one while the cover names only the graph (#8018); a write into local project memory is refused (shared/memorypath.ts); a shell call that pushed
// or merged gets one more line (shared/ritualjudge.ts; a push to the trunk — the merge's, #8362); a kind the cover's rituals field leaves
// out keeps silent. A repository keeping a rituals plugin
// of its own hears only that one — the delivery keeps silent there until the transition.
import { PREPARE, RITES } from "../delivery/index.ts";
import { wordsIn } from "../shared/lang.ts";
import { inLocalMemory } from "../shared/memorypath.ts";
import { mergeHeads, ownRitualsPlugin, ritualCover, startWord } from "../shared/ritualcover.ts";
import { merged, pushedTo } from "../shared/ritualjudge.ts";
import { TURN_RITE } from "../shared/turnend.ts";
import { sessionDirectory } from "./host.ts";
import type { Context } from "./plugin.ts";

type Part = { type?: string; text?: string };
type Result = { content?: string | Part[]; metadata?: { exit?: unknown } };

// A folder gets an instance of the plugin per spelling (/tmp and /private/tmp): one line per
// call across the instances of the process, keyed by the call's id; a call without one — each.
const SAID_KEY = "__deliveryRitesSaid";
const said = ((globalThis as Record<string, unknown>)[SAID_KEY] ??=
  new Set<string>()) as Set<string>;
const once = (key: unknown): boolean =>
  typeof key !== "string" || (!said.has(key) && !!said.add(key));

/** The paths a writing call names: write and edit — path (filePath before); patch — its headers. */
function pathsOf(tool: string, input: unknown): string[] {
  const i = (input ?? {}) as { path?: unknown; filePath?: unknown; patchText?: unknown };
  if (tool === "patch" || tool === "apply_patch")
    return [
      ...String(i.patchText ?? "").matchAll(
        /^\*\*\* (?:(?:Add|Update|Delete) File|Move to): (.+)$/gm,
      ),
    ].map((m) => (m[1] ?? "").trim());
  return tool === "write" || tool === "edit" ? [String(i.path ?? i.filePath ?? "")] : [];
}

export function createRites(ctx: Context) {
  const loc = (ctx as { location?: { directory?: unknown } }).location;
  const own = typeof loc?.directory === "string" && loc.directory ? loc.directory : null;
  /** The session's directory and its cover where the delivery speaks; else null. */
  const coverOf = async (session: string) => {
    const dir = (await sessionDirectory(ctx, session)) ?? own;
    const cover = dir ? ritualCover(dir) : null;
    return dir && cover && !ownRitualsPlugin(cover.root) ? { dir, cover } : null;
  };
  const started = new Set<string>();
  return {
    forget: (session: string): void => void started.delete(session),
    /** The turn's end (turnend.ts): no cover — on, a frame proves the seat; else by its rituals field. */
    async turnOn(session: string): Promise<boolean> {
      const dir = (await sessionDirectory(ctx, session)) ?? own;
      const cover = dir ? ritualCover(dir) : null;
      return !cover || cover.on.has(TURN_RITE);
    },
    /** The start word for a root's first prompt, once per session. */
    async word(session: string): Promise<string | null> {
      if (started.has(session)) return null;
      started.add(session);
      const c = await coverOf(session);
      return c?.cover.on.has("start") ? startWord(c.cover) : null;
    },
    /** The guard before a writing call and the push and merge lines after a shell call. */
    async wire(): Promise<boolean> {
      const tool = (ctx as Partial<Pick<Context, "tool">>).tool;
      if (typeof tool?.hook !== "function") return false;
      await tool.hook("execute.before", async (t) => {
        const paths = pathsOf(t.tool, t.input);
        if (!paths.some(Boolean)) return;
        const c = await coverOf(String(t.sessionID));
        if (c?.cover.on.has("guard") && paths.some((p) => p && inLocalMemory(p, c.dir)))
          throw new Error(
            wordsIn(PREPARE, c.cover.lang).guard(c.cover.graph, c.cover.sections.persist ?? null),
          );
      });
      await tool.hook("execute.after", async (t) => {
        if (!["shell", "bash"].includes(t.tool) || t.status !== "completed") return;
        const result = t.result as unknown as Result;
        const content = result.content;
        const output =
          typeof content === "string"
            ? content
            : (content ?? []).map((p) => p.text ?? "").join("\n");
        const exit = typeof result.metadata?.exit === "number" ? result.metadata.exit : null;
        const call = {
          command: String((t.input as { command?: unknown })?.command ?? ""),
          output,
          exit,
        };
        const c = await coverOf(String(t.sessionID));
        if (!c) return;
        const W = wordsIn(RITES, c.cover.lang);
        const { on, holon, sections } = c.cover;
        const push = on.has("push") ? pushedTo(call, c.dir) : null;
        const note = [
          push === "branch" && W.push(sections.check),
          (push === "trunk" || (on.has("merge") && merged(call))) &&
            W.merge(holon, ...mergeHeads(sections, push === "trunk")),
        ]
          .filter(Boolean)
          .join("\n\n");
        if (!note || !once(t.id)) return;
        const next: Result = {
          ...result,
          content:
            typeof content === "string"
              ? `${content}\n\n${note}`
              : [...(content ?? []), { type: "text", text: note }],
        };
        t.result = next as unknown as typeof t.result;
      });
      return true;
    },
  };
}
