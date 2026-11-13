// A same-host durable attempt; no credential material crosses this boundary (#9967).
import { randomUUID } from "node:crypto";
import { mkdirSync, realpathSync } from "node:fs";
import { dirname, join } from "node:path";

import { seamRunDir } from "../shared/seam-entrance.ts";
import { readAttemptFile, writeAttemptFile } from "./exec-attempt-io.ts";
import type { ModelRef } from "./exec-spec.ts";
import type { Run } from "./orchestra-runs.ts";
export { claimAttempt } from "./exec-attempt-io.ts";

export interface ExecReceipt {
  schema: 1;
  attempt: string;
  identity: string;
  phase: "planned" | "create-sent" | "session-created" | "prompt-sent" | "ready" | "ambiguity";
  server: string;
  model: ModelRef;
  location: string;
  prompt: string;
  session?: string;
}
export const execIdentity = (r: Run): string =>
  JSON.stringify([
    r.realm,
    r.room,
    r.invite,
    r.karta,
    r.launcher,
    r.harness,
    r.model,
    r.repository,
    r.worktree,
    r.at,
    r.exec?.attempt,
    r.exec?.server,
    r.exec?.model,
  ]);
const phases = ["planned", "create-sent", "session-created", "prompt-sent", "ready", "ambiguity"];

function validate(v: ExecReceipt): void {
  if (
    !v ||
    v.schema !== 1 ||
    !/^[a-f0-9-]{36}$/.test(v.attempt) ||
    typeof v.identity !== "string" ||
    !phases.includes(v.phase) ||
    typeof v.prompt !== "string" ||
    typeof v.location !== "string" ||
    typeof v.server !== "string" ||
    !v.model ||
    typeof v.model.id !== "string" ||
    typeof v.model.providerID !== "string" ||
    (!["planned", "create-sent", "ambiguity"].includes(v.phase) &&
      !/^ses_[A-Za-z0-9]+$/.test(v.session ?? "")) ||
    Object.keys(v).some(
      (k) =>
        ![
          "schema",
          "attempt",
          "identity",
          "phase",
          "server",
          "model",
          "location",
          "prompt",
          "session",
        ].includes(k),
    )
  )
    throw new Error("attempt_schema_invalid");
}
export function readReceipt(path: string): ExecReceipt {
  const v = JSON.parse(readAttemptFile(path)) as ExecReceipt;
  validate(v);
  if (dirname(path).split("/").at(-1) !== `exec-${v.attempt}`)
    throw new Error("attempt_path_invalid");
  return v;
}
export function saveReceipt(path: string, v: ExecReceipt, create = false): void {
  validate(v);
  writeAttemptFile(path, JSON.stringify(v), create, (raw) => {
    const before = JSON.parse(raw) as ExecReceipt;
    validate(before);
    if (
      ["ready", "ambiguity"].includes(before.phase) ||
      (v.phase !== "ambiguity" && phases.indexOf(v.phase) !== phases.indexOf(before.phase) + 1) ||
      before.attempt !== v.attempt ||
      before.identity !== v.identity ||
      before.server !== v.server ||
      before.location !== v.location ||
      before.prompt !== v.prompt ||
      JSON.stringify(before.model) !== JSON.stringify(v.model) ||
      (before.session !== undefined && before.session !== v.session)
    )
      throw new Error("attempt_transition_invalid");
  });
}
export function newAttempt(
  authDir: string,
  r: Run,
  server: string,
  model: ModelRef,
  prompt: string,
): void {
  const parent = realpathSync(seamRunDir(authDir));
  const attempt = randomUUID();
  const dir = join(parent, `exec-${attempt}`);
  mkdirSync(dir, { mode: 0o700 });
  r.exec = { attempt, receipt: join(dir, "receipt.json"), server, model };
  saveReceipt(
    r.exec.receipt,
    {
      schema: 1,
      attempt,
      identity: execIdentity(r),
      phase: "planned",
      server,
      model,
      location: r.worktree,
      prompt,
    },
    true,
  );
}
export function receiptFor(r: Run, authDir: string): ExecReceipt {
  if (!r.exec || dirname(r.exec.receipt).split("/").at(-1) !== `exec-${r.exec.attempt}`)
    throw new Error("attempt_path_invalid");
  if (dirname(dirname(r.exec.receipt)) !== realpathSync(seamRunDir(authDir)))
    throw new Error("attempt_path_outside_registry");
  const v = readReceipt(r.exec.receipt);
  if (
    v.attempt !== r.exec.attempt ||
    v.identity !== execIdentity(r) ||
    v.server !== r.exec.server ||
    v.location !== r.worktree ||
    JSON.stringify(v.model) !== JSON.stringify(r.exec.model)
  )
    throw new Error("attempt_identity_changed");
  return v;
}
