// The pi extension: one extension with two independent halves — tools (the bridge
// as a child process, each server tool registered under its own name, tools.ts)
// and the channel (frames of the standing the bridge holds enter the running turn,
// channel.ts). The socket and the secret stay in the bridge; the extension only
// sees MCP notifications.
//
// pi treats every .ts/.js file directly under extensions/ as a separate extension,
// so the sources are bundled into one output file.
//
// The factory starts nothing live: pi calls it in runs with no session at all.
// The bridge and timers live from session_start to session_shutdown only.
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

import { PI } from "../delivery/index.ts";
import { words } from "../shared/lang.ts";
import { setupChannel } from "./channel.ts";
import { setupBridge } from "./tools.ts";

export default function (pi: ExtensionAPI) {
  // Each half is set up under its own try: a failed registration of one must not
  // take the other, or the session, down with it.
  const broken: string[] = [];

  // Reported in the session, not the log: in rpc mode stdout carries the protocol.
  pi.on("session_start", async (_event, ctx) => {
    if (!broken.length || !ctx.hasUI) return;
    ctx.ui.notify(words(PI).broken(broken.join("; ")), "error");
  });

  // The channel goes first: it hands out the door through which the tools half
  // passes bridge notifications. If it fails, the door stays a stub.
  let onChannel: (params: unknown) => void = () => {};
  try {
    onChannel = setupChannel(pi);
  } catch (e) {
    broken.push(words(PI).channelPart(e instanceof Error ? e.message : String(e)));
  }
  try {
    setupBridge(pi, (params) => onChannel(params));
  } catch (e) {
    broken.push(words(PI).toolsPart(e instanceof Error ? e.message : String(e)));
  }
}
