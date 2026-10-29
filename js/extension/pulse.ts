// A pi session's word on its turn for the seat's pulse (graph @nks/nks-dev, node #7529): busy on
// agent_start; at agent_end the turn's end (turn_at) and how it ended — the last answer's
// stopReason aborted is interrupted, error is failed, otherwise idle; read_at — a channel
// message entering the conversation (message_start of the channel's customType); act_at — tool
// execution and the assistant's output (tool_execution_*, message_update and message_end of the
// assistant). Each change goes to the bridge by the session's word line (shared/pulseword.ts);
// the bridge paces the socket (bridge/pulse.ts). The word is kept and goes again when a seat is
// taken or returned: a daemon swapped mid-turn starts empty.
/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

import { LOGGERS } from "../delivery/index.ts";
import { type Bridge } from "../shared/bridge-client.ts";
import { type TurnWord, wordLine } from "../shared/pulseword.ts";

function endOf(messages: readonly any[] | undefined): "idle" | "interrupted" | "failed" {
  const last = [...(messages ?? [])].reverse().find((m) => m?.role === "assistant");
  if (last?.stopReason === "aborted") return "interrupted";
  if (last?.stopReason === "error") return "failed";
  return "idle";
}

export interface PulseWord {
  /** Drops the word — a new session's bridge gets none of the old one's clocks. */
  reset: () => void;
  /** A seat taken or returned (held, resumed, hello — a new daemon among them): the word goes again. */
  seated: () => void;
  /** The session is over: nothing is left to go. */
  stop: () => void;
}

/** A channel event by which the bridge took or returned the seat. */
export const seatedBy = (ev: any): boolean =>
  ev?.kind === "held" ||
  ev?.kind === "attached" ||
  ev?.kind === "resumed" ||
  ev?.frame?.type === "hello";

/** Hangs the turn's hooks. */
export function setupPulse(pi: ExtensionAPI, live: () => Bridge | null): PulseWord {
  let line = wordLine(live);
  const tell = (change: TurnWord): void => line.tell(change);
  const at = (): string => new Date().toISOString();
  const acted = async (): Promise<void> => tell({ act_at: at() });
  const output = async (event: any): Promise<void> => {
    if (event?.message?.role === "assistant") tell({ act_at: at() });
  };
  pi.on("agent_start", async () => tell({ state: "busy" }));
  pi.on("agent_end", async (event) => tell({ state: endOf(event.messages), turn_at: at() }));
  pi.on("message_start", async (event) => {
    const m: any = event.message;
    if (m?.role === "custom" && m.customType === LOGGERS.channel) tell({ read_at: at() });
  });
  pi.on("tool_execution_start", acted);
  pi.on("tool_execution_update", acted);
  pi.on("tool_execution_end", acted);
  pi.on("message_update", output);
  pi.on("message_end", output);
  return {
    reset: () => {
      line.drop();
      line = wordLine(live);
    },
    seated: () => line.again(),
    stop: () => line.drop(),
  };
}

/* eslint-enable @typescript-eslint/no-explicit-any */
