import type { Server } from "node:net";

import { envName } from "../delivery/index.ts";
import { listenOrchestraDoor, type OrchestraServe } from "./orchestra-door.ts";

const TACT_MS = Number(process.env[envName("ORCHESTRA_TACT_MS")]) || 60_000;
export async function openOrchestraWatch(
  authDir: string,
  serve: OrchestraServe,
  paused: () => boolean,
  say: (line: string) => void,
  active: () => boolean,
): Promise<Server> {
  const door = await listenOrchestraDoor(authDir, serve);
  let busy = false;
  setInterval(() => {
    if (busy || paused() || !active()) return;
    busy = true;
    void serve("step", [])
      .then(
        (a) => say(`orchestra tact: ${a.said.replace(/\n/g, " · ")}`),
        (e: Error) => say(`orchestra tact failed: ${e.message}`),
      )
      .finally(() => (busy = false));
  }, TACT_MS).unref();
  return door;
}
