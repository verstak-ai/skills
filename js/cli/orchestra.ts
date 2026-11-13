// `orchestra <on|off|status|step [--dry-run]|demands>`: the machine daemon's orchestration door
// daemon through its local door (graph @nks/nks-dev, nodes #7513, #7514, #8202). The daemon
// owns the flag and persists it next to the grant; without a daemon every op is refused with
// its cause. `on` needs the machine's consent — the daemon's own environment admits the
// orchestrator — and extends the named boundary with each `--realm`; `off` clears it;
// `status` reads what lies, cursors and last outcomes included; `step` reads both queues of
// every named graph from the daemon's cursor and moves the cursors only when all read;
// `step --dry-run` judges one tact and acts on nothing (bridge/orchestra-plan.ts).
import { parseArgs } from "../bridge/config.ts";
import { isOrchestraOp, orchestraAsk, type OrchestraOp } from "../bridge/orchestra-door.ts";
import { parseOnly } from "../bridge/orchestra-only.ts";
import { envName, ORCHESTRA, type OrchestraWords } from "../delivery/index.ts";
import { setLang, words } from "../shared/lang.ts";
import { defaultAuthDir } from "../shared/standings.ts";

const w = (): OrchestraWords => words(ORCHESTRA);
/** How long a manual tact is waited for — a ceiling for a daemon that never answers. */
const TACT_WAIT_MS = 15 * 60_000;

/** The flag's value, taken out of args. */
function take(args: string[], flag: string): string | undefined {
  const i = args.indexOf(flag);
  if (i < 0) return undefined;
  return args.splice(i, 2)[1];
}

/** Every value of a repeated flag, taken out of args. */
function takeAll(args: string[], flag: string): string[] {
  const out: string[] = [];
  for (let v = take(args, flag); v !== undefined; v = take(args, flag)) out.push(v);
  return out;
}

export async function runOrchestra(argv: string[]): Promise<void> {
  const args = [...argv];
  const lang = take(args, "--lang");
  setLang(lang);
  const onlyCount = args.filter((a) => a.startsWith("--only")).length;
  const only = take(args, "--only");
  const realms = takeAll(args, "--realm");
  const authDir =
    take(args, "--auth-dir") || process.env[envName("BRIDGE_AUTH_DIR")] || defaultAuthDir();
  // `on --launcher <name> [--model <id>]… [--limit N] [--host <name>]` describes the launcher in
  // mind unless one lies there already (bridge/orchestra-describe.ts).
  const launcher = take(args, "--launcher");
  const models = takeAll(args, "--model");
  const limit = take(args, "--limit");
  const host = take(args, "--host");
  const dry = args.indexOf("--dry-run");
  if (dry >= 0) args.splice(dry, 1);
  const named = args.find((a) => !a.startsWith("--"));
  const fail = (text: string): void => {
    process.stderr.write(`${text}\n`);
    process.exitCode = 1;
  };
  const describes = launcher !== undefined;
  const loose = models.length || limit !== undefined || host !== undefined;
  // `step --dry-run` is the door's own op: the same reading, judged and said, acting on nothing.
  if (
    !named ||
    named === "plan" ||
    !isOrchestraOp(named) ||
    (dry >= 0 && named !== "step") ||
    ((describes || loose) && named !== "on") ||
    (loose && !describes) ||
    (limit !== undefined && !/^\d+$/.test(limit)) ||
    (onlyCount > 0 &&
      (onlyCount !== 1 ||
        !parseOnly(only) ||
        named !== "step" ||
        realms.length !== 1 ||
        args.length !== 1))
  )
    return fail(w().usage().trimEnd());
  const op: OrchestraOp = dry >= 0 ? "plan" : named;
  parseArgs(["--auth-dir", authDir, ...args.filter((a) => a !== named)]);
  const slow = op === "demands" || describes;
  // A tact reads every graph, asks the server and mind and may launch for minutes, queued behind
  // the timer's own: a manual step and its dry run wait for the outcome, not the door's 5 s.
  const tact = op === "step" || op === "plan";
  const wait = tact
    ? Number(process.env[envName("ORCHESTRA_STEP_WAIT_MS")]) || TACT_WAIT_MS
    : slow
      ? 120_000
      : 5_000;
  // Typed at a terminal, `on` is the human's consent itself; an agent's shell runs it on pipes
  // and gives none (bridge/orchestra-flag.ts).
  const terminal = !!process.stdin.isTTY && !!process.stdout.isTTY;
  const consent =
    (op === "on" && terminal) ||
    (op === "step" && !!onlyCount && (terminal || process.env[envName("ORCHESTRA")] === "1"));
  const extra = {
    ...(onlyCount ? { only } : {}),
    ...(describes
      ? { launcher: { launcher, models, ...(limit ? { limit: Number(limit) } : {}), host } }
      : {}),
    ...(consent ? { consent } : {}),
  };
  const answer = await orchestraAsk(authDir, op, realms, wait, extra);
  if (answer.demands) {
    process.stdout.write(`${JSON.stringify(answer.demands)}\n`);
    if (!answer.ok) process.exitCode = 1;
    return;
  }
  if (!answer.ok) return fail(answer.said);
  process.stdout.write(`${answer.said}\n`);
}
