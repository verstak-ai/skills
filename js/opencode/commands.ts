// The "commands" half — the delivery's skills in OpenCode's «/» palette.
//
// Every skill with `slash: true` in its frontmatter is typed by the human as /name. OpenCode 2
// drops that key and builds the palette only from commands, so the plugin registers a command
// per such skill: it loads the skill with the skill tool and hands the human's words over as is.
// The key is read from the SKILL.md itself, so the command set equals the installed set.
import { readFileSync } from "node:fs";

import { OPENCODE } from "../delivery/index.ts";
import { snippet } from "../shared/bridge-client.ts";
import { words } from "../shared/lang.ts";
import type { Context } from "./plugin.ts";
import { type Say } from "./tools.ts";

/* eslint-disable @typescript-eslint/no-explicit-any -- SDK answers without a schema */

export interface SkillCommand {
  id: string;
  description: string;
}

export interface CommandsHalf {
  /** Reread the skills and replay the commands (skill.updated). */
  refresh(): Promise<void>;
}

/** `slash: true` in the frontmatter — and only that; anything else is no command. */
export function slashOf(markdown: string): boolean {
  if (!markdown.startsWith("---")) return false;
  const end = markdown.indexOf("\n---", 3);
  if (end < 0) return false;
  const head = markdown.slice(3, end);
  return /^slash:\s*true\s*$/m.test(head);
}

/** The text the command puts into the session instead of the human's word. */
export function commandText(id: string, args: string): string {
  return words(OPENCODE).commandHead(id) + args.trim();
}

async function listSkills(ctx: Context): Promise<SkillCommand[]> {
  const res: any = await ctx.skill.list();
  const list: any[] = Array.isArray(res) ? res : (res?.data ?? []);
  const out: SkillCommand[] = [];
  for (const s of list) {
    const id = String(s?.id ?? "");
    const path = typeof s?.path === "string" ? s.path : null;
    if (!id || !path) continue;
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

export async function setupCommands(ctx: Context, say: Say): Promise<CommandsHalf> {
  const state = { commands: await listSkills(ctx) };
  await ctx.command.transform((editor) => {
    for (const { id, description } of state.commands) {
      editor.add({
        name: id,
        description,
        async execute({ sessionID, prompt, delivery }) {
          await ctx.session.prompt({
            ...(prompt as any),
            sessionID,
            text: commandText(id, String((prompt as any)?.text ?? "")),
            delivery,
          } as any);
        },
      });
    }
  });
  if (state.commands.length) say(words(OPENCODE).commandsCount(state.commands.length), "info");
  return {
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
