// Current named residues stay visible even when automatic raising is OFF (#7517, #8202).
import { ORCHESTRA } from "../delivery/index.ts";
import { words } from "../shared/lang.ts";
import type { OrchestraAnswer } from "./orchestra-door.ts";
import { readOrchestraFlag } from "./orchestra-flag.ts";
import { readClones, readRuns } from "./orchestra-runs.ts";
import { tactStateOf } from "./orchestra-tact.ts";

export function orchestraStatus(authDir: string, discovered: string[]): OrchestraAnswer {
  const w = words(ORCHESTRA),
    flag = readOrchestraFlag(authDir),
    tact = tactStateOf(authDir);
  const lines = Object.entries(tact.realms).map(([realm, t]) =>
    w.tactOut(realm, t.invites, t.signals, t.cursor ?? "", t.at),
  );
  for (const [repo, c] of Object.entries(readClones(authDir)))
    lines.push(w.cloneOut(repo, c.state, c.why ?? "", c.at));
  if (tact.lead) lines.push(w.lead(tact.lead));
  for (const r of Object.values(readRuns(authDir))) {
    if (!r.tree || r.tree.state === "removed") continue;
    if (r.tree.state === "ready" && r.state !== "ambiguity" && r.state !== "ended") continue;
    lines.push(
      w.leadRow(
        r.realm,
        r.room,
        r.invite,
        r.tree.why ??
          r.why ??
          (r.tree.state === "ready" && r.state === "ended"
            ? "tree_cleanup_pending"
            : `tree_${r.tree.state}_unverified`),
      ),
    );
  }
  const named = flag?.realms ?? [];
  const found = [...new Set(discovered)].filter((r) => !named.includes(r));
  return {
    ok: true,
    said: w.status(!!flag?.on, named.join(", "), found.join(", "), lines.join("; ")),
  };
}
