import { envName } from "../delivery/index.ts";
import type { Run } from "./orchestra-runs.ts";

export const RAISE_WINDOW_MS =
  Number(process.env[envName("ORCHESTRA_RAISE_WINDOW_MS")]) || 15 * 60_000;
export const stopLapsed = (r: Run, now = Date.now()): boolean =>
  now - Date.parse(r.stopping_at ?? r.at) > RAISE_WINDOW_MS;
