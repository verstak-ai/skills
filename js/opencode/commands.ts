// The "commands" half — the delivery's skills in OpenCode's «/» palette.
//
// Every skill with `slash: true` in its frontmatter is typed by the human as /name. OpenCode 2
// drops that key and builds the palette only from commands, so the plugin registers a command
// per such skill: it loads the skill with the skill tool and hands the human's words over as is.
// The key is read from the SKILL.md itself, so the command set equals the delivery's installed set.
import { randomUUID } from "node:crypto";
import { readFileSync, realpathSync } from "node:fs";
import { dirname } from "node:path";

import { BRIDGE_SKILL, OPENCODE, PRODUCT } from "../delivery/index.ts";
import { snippet } from "../shared/bridge-client.ts";
import { words } from "../shared/lang.ts";
import { skillLock } from "../shared/skilllock.ts";
import type { Context } from "./plugin.ts";
import { bridgeRoot } from "./skillread.ts";
import { type Say } from "./tools.ts";

/* eslint-disable @typescript-eslint/no-explicit-any -- SDK answers without a schema */

export interface SkillCommand {
  id: string;
  description: string;
}

export interface CommandsHalf {
  /** Reread the skills and replay the commands (skill.updated). */
  refresh(): Promise<void>;
  /** Only the command's admitted prompt takes its header, never a context already in flight. */
  word(session: string, metadata: Record<string, unknown> | undefined): string | null;
  forget(session: string): void;
  stop(): void;
}

/** `slash: true` in the frontmatter — and only that; anything else is no command. */
export function slashOf(markdown: string): boolean {
  if (!markdown.startsWith("---")) return false;
  const end = markdown.indexOf("\n---", 3);
  if (end < 0) return false;
  const head = markdown.slice(3, end);
  return /^slash:\s*true\s*$/m.test(head);
}

const canon = (p: string): string | null => {
  try {
    return realpathSync(p);
  } catch {
    return null;
  }
};

/**
 * The delivery's own skills among the listed (#6815 item 5): those in a root whose bridge
 * skill carries this delivery's bridge file; where the root's install lock names the bridge
 * skill's source, only the skills of that source. Another delivery's root lists none here.
 */
export function skillCommands(list: any[]): SkillCommand[] {
  const roots = new Map<string, string | null>();
  for (const s of list) {
    const root = bridgeRoot(s);
    const c = root ? canon(root) : null;
    if (!c) continue;
    const source = skillLock(c)?.[BRIDGE_SKILL]?.source;
    roots.set(c, typeof source === "string" ? source : null);
  }
  const out: SkillCommand[] = [];
  for (const s of list) {
    const id = String(s?.id ?? "");
    const path = typeof s?.path === "string" ? s.path : null;
    if (!id || !path) continue;
    const root = canon(dirname(dirname(path)));
    if (!root || !roots.has(root)) continue;
    const source = roots.get(root);
    if (source && skillLock(root)?.[id]?.source !== source) continue;
    let text: string;
    try {
      text = readFileSync(path, "utf8");
    } catch {
      continue;
    }
    if (!slashOf(text)) continue;
    out.push({ id, description: snippet(String(s?.description ?? "")) });
  }
  return out.sort((a, b) => a.id.localeCompare(b.id));
}

async function listSkills(ctx: Context): Promise<SkillCommand[]> {
  const res: any = await ctx.skill.list();
  return skillCommands(Array.isArray(res) ? res : (res?.data ?? []));
}

export async function setupCommands(ctx: Context, say: Say): Promise<CommandsHalf> {
  const state = { commands: await listSkills(ctx) };
  const key = `${PRODUCT}:command`;
  const pending = new Map<string, { session: string; word: string }>();
  await ctx.command.transform((editor) => {
    for (const { id, description } of state.commands) {
      editor.add({
        name: id,
        description,
        async execute({ sessionID, prompt, delivery }) {
          const nonce = randomUUID();
          pending.set(nonce, {
            session: sessionID,
            word: words(OPENCODE).commandHead(id),
          });
          try {
            await ctx.session.prompt({
              ...(prompt as any),
              sessionID,
              text: String((prompt as any)?.text ?? ""),
              metadata: { ...(prompt as any)?.metadata, [key]: nonce },
              delivery,
            } as any);
          } catch (e) {
            pending.delete(nonce);
            throw e;
          }
        },
      });
    }
  });
  if (state.commands.length) say(words(OPENCODE).commandsCount(state.commands.length), "info");
  return {
    word(session, metadata) {
      const nonce = metadata?.[key];
      if (typeof nonce !== "string") return null;
      const entry = pending.get(nonce);
      if (!entry || entry.session !== session) return null;
      pending.delete(nonce);
      return entry.word;
    },
    forget(session) {
      for (const [nonce, entry] of pending) if (entry.session === session) pending.delete(nonce);
    },
    stop: () => pending.clear(),
    async refresh() {
      const next = await listSkills(ctx);
      const same =
        next.length === state.commands.length &&
        next.every((c, i) => c.id === state.commands[i]?.id);
      state.commands = next;
      if (!same) await ctx.command.reload();
    },
  };
}

/* eslint-enable @typescript-eslint/no-explicit-any */
