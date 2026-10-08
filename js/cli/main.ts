// One executable for the bridge, the watchdogs, the daemon and diagnostics;
// subcommands are listed by --help. No subcommand, or anything that is not one,
// runs the bridge, so a harness config entry stays valid whatever the copy is named.
import { BUILD } from "../bridge/build.ts";
import { daemonMain } from "../bridge/daemon.ts";
import { bridgeMain } from "../bridge/main.ts";
import { versionLines } from "../bridge/probe.ts";
import { reexec, syncHome, updatesDisabled } from "../bridge/update.ts";
import { CLI, type CliWords, envName } from "../delivery/index.ts";
import { words } from "../shared/lang.ts";
import { runWatchdogCodex } from "../watchdog/codex.ts";
import { runWatchdog } from "../watchdog/watchdog.ts";
import { runWatchdogExit } from "../watchdog/watchdog-exit.ts";
import { runDoctor } from "./doctor.ts";
import { RITUALS_USAGE, runCheckRituals } from "./rituals.ts";
import { runUpdate } from "./update.ts";
import { runUse } from "./use.ts";

const cw = (): CliWords => words(CLI);

const usage = (): string => cw().usage(BUILD, RITUALS_USAGE());

const argv = process.argv.slice(2);
const [first, ...rest] = argv;

// Only long-lived runs (bridge, watchdogs) align the home copy first (bridge/update.ts):
// doctor and update speak of the file that was launched, and the daemon aligns itself,
// rising as a successor rather than a wrapper.
const LONG_LIVED = new Set([undefined, "bridge", "watchdog", "watchdog-exit", "watchdog-codex"]);
const longLived =
  LONG_LIVED.has(first) ||
  (first !== undefined &&
    !first.startsWith("--") &&
    !["doctor", "update", "use", "check-rituals", "daemon", "version", "-h"].includes(first));
if (longLived && !updatesDisabled() && !process.env[envName("BRIDGE_REEXEC")]) {
  const sync = syncHome();
  for (const p of sync.copied) process.stderr.write(cw().homeUpdated(p));
  if (sync.reexec) reexec(sync.reexec, argv);
  else dispatch();
} else dispatch();

function dispatch(): void {
  switch (first) {
    case "watchdog":
      runWatchdog(rest);
      break;
    case "watchdog-exit":
      runWatchdogExit(rest);
      break;
    case "watchdog-codex":
      runWatchdogCodex(rest);
      break;
    case "doctor":
      void runDoctor(rest);
      break;
    case "update":
      void runUpdate(rest);
      break;
    case "use":
      runUse(rest);
      break;
    case "check-rituals":
      void runCheckRituals(rest);
      break;
    case "bridge":
      bridgeMain(rest);
      break;
    case "daemon":
      void daemonMain(rest);
      break;
    case "--version":
    case "version":
      // With the thin bridge (the default) the daemon's build follows on a second line.
      void versionLines(rest).then((lines) => process.stdout.write(lines.join("\n") + "\n"));
      break;
    case "--help":
    case "-h":
      process.stdout.write(usage());
      break;
    default:
      bridgeMain(argv);
  }
}
