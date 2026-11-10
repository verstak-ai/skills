// The daemon's orchestration door (graph @nks/nks-dev, nodes #7513, #8202): one request line,
// one answer line, NDJSON over a private socket next to the seam (seam-entrance.ts). The door
// is transport only — what an op means lives in orchestra.ts (the flag and its semantics; the
// tact's reading in orchestra-tact.ts); the daemon wires the two together. It rides the living
// daemon and keeps no lock of its own: a stale socket of a dead daemon is removed before this
// one listens, as the seam does. The run registry arrives with the raising slice and rides
// this door too.
import { chmodSync, unlinkSync } from "node:fs";
import { connect, createServer, type Server, type Socket } from "node:net";

import { ORCHESTRA, type OrchestraWords } from "../delivery/index.ts";
import { words } from "../shared/lang.ts";
import { orchestraDoorPath } from "../shared/seam-entrance.ts";
import type { Demands } from "./orchestra-demands.ts";

const w = (): OrchestraWords => words(ORCHESTRA);

export type OrchestraOp = "on" | "off" | "status" | "step" | "plan" | "demands";
const OPS: readonly string[] = ["on", "off", "status", "step", "plan", "demands"];
export const isOrchestraOp = (op: string): op is OrchestraOp => OPS.includes(op);
export interface OrchestraAnswer {
  ok: boolean;
  said: string;
  demands?: Demands;
}
/** What the door calls: the daemon's answer of one op (orchestra.ts serves it).
 * gone.gone: the caller left before the answer — a tact must not commit after its refusal (#8202). */
export type OrchestraServe = (
  op: OrchestraOp,
  realms: string[],
  gone?: { gone: boolean },
  extra?: OrchestraExtra,
) => Promise<OrchestraAnswer>;
/** What `on` may carry beside the realms: the launcher to describe (orchestra-describe.ts) and
 * the consent of a human at a terminal (orchestra-flag.ts). */
export interface OrchestraExtra {
  launcher?: unknown;
  consent?: boolean;
}

/**
 * The daemon's local entrance. A connection is one request line `{op, realms}` and one answer
 * line `{ok, said}`; anything else is answered and closed, never left hanging.
 */
export async function listenOrchestraDoor(authDir: string, serve: OrchestraServe): Promise<Server> {
  const path = orchestraDoorPath(authDir);
  if (process.platform !== "win32") {
    try {
      unlinkSync(path); // a dead daemon's door
    } catch {}
  }
  const server = createServer((socket: Socket) => {
    let buf = "";
    socket.on("error", () => {});
    socket.on("data", (chunk) => {
      buf += chunk;
      const nl = buf.indexOf("\n");
      if (nl < 0) return;
      const line = buf.slice(0, nl);
      buf = "";
      let msg: { op?: unknown; realms?: unknown; launcher?: unknown; consent?: unknown } = {};
      try {
        msg = JSON.parse(line) as typeof msg;
      } catch {
        /* answered below as an unknown op */
      }
      const op = typeof msg.op === "string" ? msg.op : "";
      const realms = Array.isArray(msg.realms)
        ? msg.realms.filter((x): x is string => typeof x === "string")
        : [];
      if (!isOrchestraOp(op)) {
        socket.end(JSON.stringify({ ok: false, said: w().unknownOp(op) }) + "\n");
        return;
      }
      // The caller's leaving is visible here before the answer: a tact that outlives its
      // caller must not commit — the client's refusal was final (#8202, №1317 [19]).
      const gone = { gone: false };
      socket.on("close", () => {
        gone.gone = true;
      });
      void serve(op, realms, gone, { launcher: msg.launcher, consent: msg.consent === true })
        .then((a) => socket.end(JSON.stringify(a) + "\n"))
        .catch((e: Error) =>
          socket.end(JSON.stringify({ ok: false, said: w().doorError(e.message) }) + "\n"),
        );
    });
  });
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(path, () => resolve());
  });
  if (process.platform !== "win32") chmodSync(path, 0o600);
  return server;
}

/** The client of the door: one ask, one answer; no daemon — the refusal with its cause. */
export function orchestraAsk(
  authDir: string,
  op: OrchestraOp,
  realms: string[],
  timeoutMs = 5_000,
  extra: OrchestraExtra = {},
): Promise<OrchestraAnswer> {
  return new Promise((resolve) => {
    let settled = false;
    const done = (a: OrchestraAnswer): void => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve(a);
    };
    const socket = connect(orchestraDoorPath(authDir, false));
    socket.setTimeout(timeoutMs, () => done({ ok: false, said: w().doorSilent() }));
    socket.on("error", () => done({ ok: false, said: w().noDaemon() }));
    socket.on("connect", () => socket.write(JSON.stringify({ op, realms, ...extra }) + "\n"));
    let buf = "";
    socket.on("data", (c) => {
      buf += c;
      const nl = buf.indexOf("\n");
      if (nl < 0) return;
      try {
        done(JSON.parse(buf.slice(0, nl)) as OrchestraAnswer);
      } catch {
        done({ ok: false, said: w().doorSilent() });
      }
    });
  });
}
