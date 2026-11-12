// Runs ONLY inside the Orca terminal's environment; never imports the daemon's auth (#9969).
import { execFile } from "node:child_process";
import { realpathSync } from "node:fs";
import { hostname } from "node:os";

import { claimAttempt, type ExecReceipt, readReceipt, saveReceipt } from "./exec-receipt.ts";
import { parseExec } from "./exec-spec.ts";

export const shellQuote = (s: string): string => `'${s.replaceAll("'", "'\\''")}'`;
export type ApiCall = (
  server: string,
  method: string,
  path: string,
  body?: unknown,
) => Promise<unknown>;
export const execApi: ApiCall = (server, method, path, body) =>
  new Promise((resolve, reject) => {
    execFile(
      "opencode",
      [
        "api",
        "--server",
        server,
        method,
        path,
        ...(body === undefined ? [] : ["--data", JSON.stringify(body)]),
      ],
      { timeout: 30_000, maxBuffer: 1024 * 1024, windowsHide: true },
      (err, stdout) => {
        if (err) {
          reject(new Error("exec_api_failed_or_unknown"));
          return;
        }
        try {
          resolve(JSON.parse(stdout));
        } catch {
          reject(new Error("exec_api_unreadable"));
        }
      },
    );
  });
const data = (v: unknown): Record<string, unknown> =>
  (v as { data?: Record<string, unknown> })?.data ?? {};
function checkSession(v: unknown, r: ExecReceipt): void {
  const s = data(v),
    model = s.model as ExecReceipt["model"],
    location = s.location as { directory?: string };
  if (
    s.id !== r.session ||
    (s.parentID !== undefined && s.parentID !== null) ||
    model?.providerID !== r.model.providerID ||
    model?.id !== r.model.id ||
    model?.variant !== (r.model.variant ?? "default") ||
    location?.directory !== r.location
  )
    throw new Error("exec_session_mismatch");
}
export async function prepareExec(path: string, api: ApiCall = execApi): Promise<string[]> {
  const r = readReceipt(path);
  if (r.phase !== "planned") throw new Error("attempt_already_started");
  claimAttempt(path);
  try {
    if (
      !parseExec({ server: r.server, modelRefs: { own: r.model } }, ["own"]) ||
      realpathSync(r.location) !== r.location ||
      !["darwin", "linux"].includes(process.platform)
    )
      throw new Error("exec_context_invalid");
    const info = (await api(r.server, "get", "/api/info")) as {
      version?: string;
      hostname?: string;
    };
    if (info.version !== "2.2.7" || info.hostname?.toLowerCase() !== hostname().toLowerCase())
      throw new Error("exec_server_unverified");
    r.phase = "create-sent";
    saveReceipt(path, r);
    const made = data(
      await api(r.server, "post", "/api/session", {
        model: r.model,
        location: { directory: r.location },
      }),
    );
    if (typeof made.id !== "string" || !/^ses_[A-Za-z0-9]+$/.test(made.id))
      throw new Error("exec_session_unreadable");
    r.session = made.id;
    r.phase = "session-created";
    saveReceipt(path, r);
    checkSession(await api(r.server, "get", `/api/session/${r.session}`), r);
    const context = (
      (await api(r.server, "get", `/api/session/${r.session}/context`)) as { data?: unknown }
    ).data;
    if (!Array.isArray(context) || context.length !== 0) throw new Error("exec_session_not_empty");
    r.phase = "prompt-sent";
    saveReceipt(path, r);
    // HTTP admission: graph @nks/nks-dev #10461; acceptance is not native claim/join.
    const accepted = data(
      await api(r.server, "post", `/api/session/${r.session}/prompt`, { text: r.prompt }),
    );
    if (accepted.sessionID !== r.session || typeof accepted.id !== "string")
      throw new Error("exec_prompt_unconfirmed");
    checkSession(await api(r.server, "get", `/api/session/${r.session}`), r);
    r.phase = "ready";
    saveReceipt(path, r);
    return ["opencode", "--server", r.server, "--session", r.session, r.location];
  } catch (e) {
    r.phase = "ambiguity";
    try {
      saveReceipt(path, r);
    } catch {
      /* Torn or unavailable receipt is itself ambiguity. */
    }
    throw e;
  }
}
export async function runExecPrepare(args: string[]): Promise<void> {
  delete process.env.BUN_BE_BUN;
  if (args.length !== 2 || args[0] !== "--receipt") {
    process.exitCode = 2;
    return;
  }
  try {
    process.stdout.write(`exec ${(await prepareExec(args[1])).map(shellQuote).join(" ")}`);
  } catch {
    process.stderr.write("exec_prepare_refused_or_ambiguous\n");
    process.exitCode = 1;
  }
}
