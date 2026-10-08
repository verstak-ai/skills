// use: a lasting choice of the server address on this machine (graph @nks/nks-dev,
// node #5040): `ru`, `en` or the full URL of another instance. Written as a file next
// to the grant; the bridge reads it when both the argument and the environment are
// empty, so the choice reaches plugin entries that carry no arguments. The grant is
// per host: a new address means a new login.
import {
  CFG,
  parseArgs,
  resolveServerChoice,
  setConfig,
  writeServerChoice,
} from "../bridge/config.ts";
import { CLI, type CliWords } from "../delivery/index.ts";
import { setServerLang, words } from "../shared/lang.ts";
import { freshnessWord } from "./doctor.ts";

const out = (s: string): void => {
  process.stdout.write(s + "\n");
};

const cw = (): CliWords => words(CLI);

export function runUse(argv: string[]): void {
  let word: string | undefined;
  const rest: string[] = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i] ?? "";
    if (a === "--auth-dir") rest.push(a, argv[++i] ?? "");
    else if (a.startsWith("--") || word) rest.push(a);
    else word = a;
  }
  setConfig(parseArgs(rest));
  const url = word ? resolveServerChoice(word) : null;
  if (!url) {
    out(cw().useNoAddress());
    process.exitCode = 2;
    return;
  }
  const path = writeServerChoice(CFG.authDir, url);
  setServerLang(url); // the answer is in the language of the new choice
  out(cw().useWritten(url, path, freshnessWord(url)));
  out(cw().useEffect());
}
