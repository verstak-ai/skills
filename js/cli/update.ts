// update: the latest release into the home on demand — the bridge, the OpenCode plugin
// (if installed), SETUP.md beside them — and a report of what to do next. Skills are
// not updated here: the harness channel places them, the order is in the fresh SETUP.md.
import { BUILD } from "../bridge/build.ts";
import { parseArgs, setConfig } from "../bridge/config.ts";
import { CFG } from "../bridge/config.ts";
import { checkLatest, setupPathOf } from "../bridge/update.ts";
import { CLI, type CliWords } from "../delivery/index.ts";
import { homeBridgePath } from "../shared/home.ts";
import { words } from "../shared/lang.ts";
import { compareVersions } from "../shared/semver.ts";
import { VERSION } from "../shared/version.ts";
import { freshnessWord, harnessReport, serverSourceWord } from "./doctor.ts";

const out = (s: string): void => {
  process.stdout.write(s + "\n");
};

const cw = (): CliWords => words(CLI);

export async function runUpdate(argv: string[]): Promise<void> {
  setConfig(parseArgs(argv));
  out(cw().updateTitle(BUILD));
  out(cw().updateServer(CFG.serverUrl, serverSourceWord(), freshnessWord(CFG.serverUrl)));
  const latest = await checkLatest(CFG.authDir, true);
  if (!latest || !latest.version) {
    out(
      latest?.rate_limited
        ? cw().rateLimited(latest.error, !!latest.rate_limited_until)
        : cw().latestUnknown(latest?.error),
    );
    process.exitCode = 1;
    return;
  }
  const lag = cw().lag(compareVersions(latest.version, VERSION));
  out(cw().latest(latest.version, latest.tag, VERSION, lag));
  if (latest.error) out(cw().downloadFailed(latest.error));
  if (latest.downloaded.length) for (const p of latest.downloaded) out(cw().placed(p));
  else out(cw().nothingPlaced(homeBridgePath()));
  harnessReport();
  out("");
  out(cw().next());
  const setup = setupPathOf(CFG.authDir);
  const fetched = latest.downloaded.includes(setup);
  out(cw().stepSkills(setup, fetched));
  out(cw().stepRestart());
  out(cw().stepDoctor());
}
