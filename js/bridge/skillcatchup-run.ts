// Existing updater as argv, never shell or a second unpacker (#10122, @nks/nks-dev).
import { spawn } from "node:child_process";
import { homedir } from "node:os";

import { currentScope } from "../shared/scope.ts";
import { TOKEN_ENV } from "../shared/seam.ts";

export function runSkillUpdater(
  args: string[],
  timeout = 20000,
  allowed: () => boolean = () => true,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const env = { ...process.env, ...currentScope().origin?.env };
    delete env[TOKEN_ENV]; // the external installer has no use for the graph bearer
    const child = spawn("npx", args, {
      cwd: homedir(),
      env,
      detached: true,
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    });
    let output = "",
      expired = false;
    const collect = (data: Buffer): void => {
      output = (output + data.toString()).slice(-65536);
    };
    child.stdout.on("data", collect);
    child.stderr.resume(); // npm notices are not the CLI's version stdout
    const kill = (signal: NodeJS.Signals): void => {
      try {
        if (child.pid) process.kill(-child.pid, signal);
      } catch {
        /* already exited */
      }
    };
    const abort = (reason: string): void => {
      if (expired) return;
      expired = true;
      clearTimeout(timer);
      clearInterval(watch);
      kill("SIGTERM");
      // npm may exit before its child; keep this fence even after that parent's close.
      setTimeout(() => {
        kill("SIGKILL");
        reject(new Error(reason));
      }, 250);
    };
    const timer = setTimeout(() => abort("updater_timeout"), timeout);
    const watch = setInterval(() => {
      if (!allowed()) abort("updater_stopped");
    }, 100);
    child.once("error", () => {
      clearTimeout(timer);
      clearInterval(watch);
      reject(new Error("updater_unavailable"));
    });
    child.once("close", (code) => {
      if (expired) return;
      clearTimeout(timer);
      clearInterval(watch);
      if (code !== 0) reject(new Error(`updater_exit_${code ?? "signal"}`));
      else resolve(output.trim());
    });
  });
}
