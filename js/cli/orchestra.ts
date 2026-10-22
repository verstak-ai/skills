// `orchestra <on|off|status|step>`: the orchestrator flag and one reading tact of the machine
// daemon through its local door (graph @nks/nks-dev, nodes #7513, #7514, #8202). The daemon
// owns the flag and persists it next to the grant; without a daemon every op is refused with
// its cause. `on` needs the machine's consent — the daemon's own environment admits the
// orchestrator — and extends the named boundary with each `--realm`; `off` clears it;
// `status` reads what lies, cursors and last outcomes included; `step` reads both queues of
// every named graph from the daemon's cursor and moves the cursors only when all read.
import { parseArgs } from "../bridge/config.ts";
import { orchestraAsk, type OrchestraOp } from "../bridge/orchestra-door.ts";
import { envName, ORCHESTRA, type OrchestraWords } from "../delivery/index.ts";
import { setLang, words } from "../shared/lang.ts";
import { defaultAuthDir } from "../shared/standings.ts";

const w = (): OrchestraWords => words(ORCHESTRA);

/** The flag's value, taken out of args. */
function take(args: string[], flag: string): string | undefined {
  const i = args.indexOf(flag);
  if (i < 0) return undefined;
  return args.splice(i, 2)[1];
}

export async function runOrchestra(argv: string[]): Promise<void> {
  const args = [...argv];
  const lang = take(args, "--lang");
  setLang(lang);
  const realms: string[] = [];
  for (let i = 0; i < args.length; i++)
    if (args[i] === "--realm" && args[i + 1] !== undefined) {
      realms.push(args[i + 1]);
      args.splice(i, 2);
      i--;
    }
  const authDir =
    take(args, "--auth-dir") || process.env[envName("BRIDGE_AUTH_DIR")] || defaultAuthDir();
  const op = args.find((a) => !a.startsWith("--")) as OrchestraOp | undefined;
  const fail = (text: string): void => {
    process.stderr.write(`${text}\n`);
    process.exitCode = 1;
  };
  if (op !== "on" && op !== "off" && op !== "status" && op !== "step")
    return fail(w().usage().trimEnd());
  parseArgs(["--auth-dir", authDir, ...args.filter((a) => a !== op)]);
  const answer = await orchestraAsk(authDir, op, realms);
  if (!answer.ok) return fail(answer.said);
  process.stdout.write(`${answer.said}\n`);
}
