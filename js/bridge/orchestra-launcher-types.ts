import type { ExecSpec } from "./exec-spec.ts";
import type { ClonePolicy } from "./orchestra-clone.ts";

export interface HarnessOffer {
  models: string[];
  exec?: ExecSpec;
}
export interface Launcher {
  launcher: string;
  /** Absent — legacy offers answer any machine; exec requires an explicit matching host. */
  host: string | null;
  adapter: "orca";
  limit: number;
  harnesses: Record<string, HarnessOffer>;
  checkouts: Record<string, string>;
  callers: string[];
  clone: ClonePolicy | null;
}
export interface Launchers {
  account: string;
  own: Map<string, Launcher>;
  elsewhere: Map<string, string>;
  refused: { what: string; code: string }[];
}
