// Enabling policy is independent of observing a client already launched (#7514).
import { ORCHESTRA } from "../delivery/index.ts";
import { words } from "../shared/lang.ts";
import type { OrchestraNet } from "./orchestra.ts";
import { ensureLauncher, launcherSpecOf } from "./orchestra-describe.ts";
import type { OrchestraAnswer, OrchestraExtra } from "./orchestra-door.ts";
import { envAdmitted, readOrchestraFlag, writeOrchestraFlag } from "./orchestra-flag.ts";

export async function switchOrchestra(
  authDir: string,
  net: OrchestraNet | undefined,
  op: "on" | "off",
  realms: string[],
  extra?: OrchestraExtra,
): Promise<OrchestraAnswer> {
  const w = words(ORCHESTRA);
  if (op === "off") {
    writeOrchestraFlag(authDir, { on: false, realms: [] });
    net?.changed?.();
    return { ok: true, said: w.off() };
  }
  const prior = readOrchestraFlag(authDir);
  const terminal = extra?.consent === true;
  const widens = realms.some((r) => !(prior?.on ? prior.realms : []).includes(r));
  if (!envAdmitted() && !terminal && (!prior?.consent || widens))
    return { ok: false, said: w.notAdmitted() };
  const short = realms.filter((r) => /^r\d+$/i.test(r.trim()));
  if (short.length) return { ok: false, said: w.onShortRealm(short.join(", ")) };
  const spec = launcherSpecOf(extra?.launcher);
  let described = "";
  if (spec)
    try {
      described = await ensureLauncher(net?.mcp?.() ?? "", net?.token() ?? null, spec);
    } catch (e) {
      return { ok: false, said: (e as Error).message };
    }
  const named = [...new Set([...(prior?.on ? prior.realms : []), ...realms])];
  const consent = terminal
    ? { by: "terminal" as const, at: new Date().toISOString() }
    : prior?.consent;
  writeOrchestraFlag(authDir, { on: true, realms: named, ...(consent ? { consent } : {}) });
  net?.changed?.();
  return { ok: true, said: [described, w.on(named.join(", "))].filter(Boolean).join("\n") };
}
