// A root's first prompt in a repository never aligned for the agent: one invitation, by the
// repository's own signs (shared/reposigns.ts) — local reads, no call, no seat.
import { ONBOARD_START } from "../delivery/index.ts";
import { words } from "../shared/lang.ts";
import { repoSigns } from "../shared/reposigns.ts";
import type { Context } from "./plugin.ts";

export function createOnboardStart(
  ctx: Context,
  child: (session: string) => boolean = () => false,
  halted: (session: string) => boolean = () => false,
) {
  const seen = new Set<string>();
  return {
    forget: (session: string): void => void seen.delete(session),
    async prompt(session: string): Promise<string | null> {
      if (seen.has(session) || child(session) || halted(session)) return null;
      try {
        const response = await ctx.session.get({ sessionID: session } as never);
        // Both SDK response shapes are in use. An unreadable session is not a root.
        const raw = response as unknown as {
          id?: string;
          parentID?: string;
          location?: { directory?: string };
          data?: unknown;
        };
        const info = (raw?.data ?? raw) as typeof raw;
        if (!info?.id || info.parentID || !info.location?.directory) return null;
        seen.add(session);
        const invite = repoSigns(info.location.directory, "opencode").verdict === "invite";
        return invite && !halted(session) ? words(ONBOARD_START).start() : null;
      } catch {
        return null;
      }
    },
  };
}
