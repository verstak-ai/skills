import type { ExecSpec } from "./exec-spec.ts";
import type { ClonePolicy } from "./orchestra-clone.ts";
import type { DshSpec } from "./orchestra-dsh.ts";

export type Adapter = "orca" | "bridge";
/** The adapter each known harness is raised by; a harness of the other one is refused. */
export const HARNESS_ADAPTER: Record<string, Adapter> = { opencode: "orca", dsh: "bridge" };

export interface HarnessOffer {
  models: string[];
  exec?: ExecSpec;
  /** The harness `dsh` of an adapter-bridge description: raised by the bridge itself (#10777). */
  dsh?: DshSpec;
}
export interface Launcher {
  launcher: string;
  /** Absent — legacy offers answer any machine; exec requires an explicit matching host. */
  host: string | null;
  /** "orca" — Orca raises opencode; "bridge" — the bridge raises dsh itself, no Orca (#10096). */
  adapter: Adapter;
  limit: number;
  harnesses: Record<string, HarnessOffer>;
  checkouts: Record<string, string>;
  /** `<graph>#<role>` → the checkout that role is raised in, whatever its cover's role. */
  homes?: Record<string, string>;
  /** Other accounts whose calls are own too: handles without "@" and account ids, lower case. */
  callers: string[];
  clone: ClonePolicy | null;
}
export interface Launchers {
  /** The key's account handle without "@", lower case; "" — the account has none (#11011). */
  account: string;
  /** The key's account id from the api's whoami; absent or "" — an older api. */
  accountId?: string;
  own: Map<string, Launcher>;
  elsewhere: Map<string, string>;
  /** nodes — the mind nodes a refusal is about (`#N`), when it names several: launcher_duplicate. */
  refused: { what: string; code: string; nodes?: string[] }[];
}
