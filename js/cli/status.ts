// Sessionless, read-only machine inspection (graph @nks/nks-dev, node #7495).
import { existsSync } from "node:fs";

import { BUILD } from "../bridge/build.ts";
import { envName, MACHINE_STATUS } from "../delivery/index.ts";
import { setLang, words } from "../shared/lang.ts";
import { connectSeam, helloFrame, SEAM_PROTOCOL, SeamError } from "../shared/seam.ts";
import { seamEntranceProblem, seamSocketPath } from "../shared/seam-entrance.ts";
import { type MachineSnapshot, safeSnapshot } from "../shared/snapshot.ts";
import { defaultAuthDir } from "../shared/standings.ts";
import {
  type DiskPlace,
  diskPlaces,
  type FallbackSnapshot,
  fallbackSnapshot,
} from "./statusdisk.ts";

interface StatusSnapshot {
  daemon: MachineSnapshot["daemon"] | null;
  sessions: MachineSnapshot["sessions"];
  snapshot_available: boolean;
  snapshot_error?: "snapshot failed";
  session_count?: number;
  daemon_error?: "missing directory" | "no answer" | "different protocol" | "refused";
  fallback: FallbackSnapshot[];
  disk_only: DiskPlace[];
}
export async function machine(
  authDir: string,
): Promise<Omit<StatusSnapshot, "fallback" | "disk_only">> {
  let daemon_error: StatusSnapshot["daemon_error"] = "no answer";
  if (!existsSync(authDir)) daemon_error = "missing directory";
  else if (!seamEntranceProblem(authDir, false)) {
    try {
      const link = await connectSeam(
        seamSocketPath(authDir, false),
        {
          ...helloFrame({ build: BUILD, path: "", argv: [], probe: true }),
          env: {},
          snapshot: true,
        },
        3000,
      );
      const w = link.welcome;
      link.close();
      if (w.snapshot) return { ...safeSnapshot(w.snapshot), snapshot_available: true };
      return {
        daemon: safeSnapshot({ daemon: w }).daemon,
        sessions: [],
        snapshot_available: false,
        ...(w.snapshot_error === "snapshot failed" ? { snapshot_error: w.snapshot_error } : {}),
        ...(typeof w.sessions === "number" && Number.isInteger(w.sessions) && w.sessions >= 0
          ? { session_count: w.sessions }
          : {}),
      };
    } catch (e) {
      // Only categorical reasons: wire errors can contain private addresses.
      if (e instanceof SeamError && e.kind === "refused")
        daemon_error =
          e.protocol !== undefined && e.protocol !== SEAM_PROTOCOL
            ? "different protocol"
            : "refused";
    }
  }
  return { daemon: null, sessions: [], snapshot_available: false, daemon_error };
}
const printable = (v: string | number): string =>
  [...String(v)]
    .map((c) =>
      c.charCodeAt(0) < 32 || (c.charCodeAt(0) >= 127 && c.charCodeAt(0) <= 159) ? " " : c,
    )
    .join("");
function formatSkills(
  label: string,
  skills: MachineSnapshot["sessions"][number]["skills"],
): string {
  return skills
    ? ` · ${label}=${printable(skills.name)} ${printable(skills.version)}${skills.stamp ? `+${printable(skills.stamp)}` : ""}`
    : "";
}
function render(s: StatusSnapshot): string {
  const w = words(MACHINE_STATUS);
  const d = s.daemon;
  const lines = [
    d
      ? `${w.daemon()}: pid=${d.pid} ${printable(d.build)} ${printable(d.path)}`
      : s.daemon_error === "missing directory"
        ? w.missing()
        : s.daemon_error === "different protocol"
          ? w.protocol()
          : s.daemon_error === "refused"
            ? w.refused()
            : w.absent(),
  ];
  if (d && !s.snapshot_available)
    lines.push(s.snapshot_error ? w.snapshotFailed() : w.unavailable());
  if (d && !s.snapshot_available && s.session_count !== undefined)
    lines.push(`${w.sessions()}: ${s.session_count}`);
  if (!d || s.snapshot_available) lines.push(`${w.sessions()}: ${s.sessions.length}`);
  for (const session of s.sessions) {
    const stamp = formatSkills("skills", session.skills);
    const diskStamp = formatSkills("installed_skills", session.installed_skills);
    lines.push(
      `  ${printable(session.local_id)} pid=${session.thin_pid} ${session.attached ? w.attached() : w.detached()} ${printable(session.harness)} ${printable(session.harness_session ?? "-")} ${printable(session.build)} ${printable(session.cwd)}${stamp}${diskStamp}${session.skills_mismatch ? " · skills_mismatch" : ""}`,
    );
    for (const p of session.places) {
      const declaration = formatSkills("skills", p.skills);
      const mode = p.satellite_of
        ? `${w.satellite()} ${printable(p.satellite_of)}`
        : p.primary
          ? w.primary()
          : w.beside();
      lines.push(
        `    ${printable(p.name)} ${printable(p.realm)} #${printable(p.karta)} ${mode} · ${p.listening ? w.listening() : w.silent()} · ${w.lastWork()}: ${printable(p.last_work_at ?? w.unknown())}${p.usage ? ` · usage=${JSON.stringify(p.usage)}` : ""}${p.pulse ? ` · pulse=${JSON.stringify(p.pulse)}` : ""}${declaration}${p.skills_mismatch ? " · skills_mismatch" : ""}`,
      );
    }
  }
  lines.push(`${w.fallback()}: ${s.fallback.length}`);
  for (const f of s.fallback)
    lines.push(`  pid=${f.pid} ${printable(f.build)} ${printable(f.cwd)}`);
  lines.push(`${w.disk()}: ${s.disk_only.length}`);
  for (const p of s.disk_only)
    lines.push(
      `  ${printable(p.name)} ${printable(p.realm)} #${printable(p.karta)} — ${w.record()} · ${w.left(p.left)}`,
    );
  return lines.join("\n") + "\n";
}
export async function runStatus(args: string[]): Promise<void> {
  const i = args.indexOf("--auth-dir");
  const authDir =
    (i >= 0 ? args[i + 1] : undefined) ||
    process.env[envName("BRIDGE_AUTH_DIR")] ||
    defaultAuthDir();
  setLang(args[args.indexOf("--lang") + 1]);
  const inspected = await machine(authDir);
  const snapshot = {
    ...inspected,
    fallback: fallbackSnapshot(authDir),
    disk_only: await diskPlaces(authDir, inspected.sessions),
  };
  process.stdout.write(
    args.includes("--json") ? JSON.stringify(snapshot, null, 2) + "\n" : render(snapshot),
  );
}
