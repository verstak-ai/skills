// `prepare`: the repository made ready for the agent in one call, without a model (graph
// @nks/nks-dev, node #9319; the cover's form — #9316). The cover, the stubs and the guard are
// written where they are missing, never over what stands; a repeat changes nothing. The holon
// and the role the cover lacks are read from the graph by origin when the bridge has a key
// (preparegraph.ts, #9325); without one — no network, as before.
// The answer names what was done, what already stood and what is left to the model; the exit code
// says the same: 0 — nothing left, 3 — something left, 1 — refused and nothing written, 2 — usage.
import { COVER, PREPARE, type PrepareLeft } from "../delivery/index.ts";
import { coverBlock, type CoverData, ritualsOf } from "../shared/coverblock.ts";
import { repoContractWarning } from "../shared/covercontract.ts";
import { setLang, words } from "../shared/lang.ts";
import {
  checkOpencode,
  coverText,
  repoRoot,
  repositoryOf,
  writeAgents,
  writeClaude,
  writeReality,
} from "./preparefiles.ts";
import { fromGraph } from "./preparegraph.ts";
import { type Outcome, prepareHooks } from "./preparehooks.ts";

const FORMS: Record<string, RegExp> = {
  "--dir": /./,
  "--graph": /^r\d+$/,
  "--holon": /^\d+$/,
  "--agent-role": /^\d+$/,
  "--contract": /^\d+$/,
  "--stamp": /^\d{4}-\d{2}-\d{2}$/,
  "--case": /^\d+$/,
  "--lang": /^(en|ru)$/,
};

type Args = { json: boolean; help: boolean; flags: Record<string, string> };

/** The flags and their values; a wrong form or an unknown flag — the words why. */
function parse(argv: string[]): Args | { bad: string } {
  const a: Args = { json: false, help: false, flags: {} };
  for (let i = 0; i < argv.length; i++) {
    const f = argv[i] as string;
    if (f === "--json") a.json = true;
    else if (f === "--help" || f === "-h") a.help = true;
    else {
      const v = argv[++i] ?? "";
      const form = FORMS[f];
      if (!form || !form.test(v)) return { bad: f };
      a.flags[f] = v;
    }
  }
  return a;
}

function say(json: boolean, code: number, body: Record<string, unknown>): void {
  const W = words(PREPARE);
  if (json) process.stdout.write(`${JSON.stringify(body)}\n`);
  else if (typeof body.refused === "string") process.stderr.write(`${body.refused}\n`);
  else {
    const left = (body.left ?? []) as { item: string; why: string }[];
    const lines = [
      ...((body.warnings ?? []) as string[]),
      ...((body.done ?? []) as string[]).map((x) => `+ ${W.head("done")}: ${x}`),
      ...((body.kept ?? []) as string[]).map((x) => `= ${W.head("kept")}: ${x}`),
      ...left.map((x) => `- ${W.head("left")}: ${x.item} — ${x.why}`),
    ];
    process.stdout.write(`${lines.join("\n")}\n`);
  }
  process.exitCode = code;
}

export async function runPrepare(argv: string[]): Promise<void> {
  const lang = argv.indexOf("--lang");
  setLang(lang >= 0 ? argv[lang + 1] : undefined);
  let W = words(PREPARE);
  const json = argv.includes("--json");
  const a = parse(argv);
  if ("bad" in a) {
    const i = argv.indexOf(a.bad);
    return say(json, 2, { refused: `${W.badArg(a.bad, argv[i + 1] ?? "")}\n${W.usage()}` });
  }
  if (a.help) return void process.stdout.write(W.usage());
  const f = a.flags;
  const dir = f["--dir"] ?? process.cwd();
  const root = repoRoot(dir);
  if (!root) return say(json, 1, { refused: W.notRepo(dir) });
  const warning = repoContractWarning(root);

  const given: CoverData = {
    graph: f["--graph"],
    holon: f["--holon"],
    agent_role: f["--agent-role"],
    contract: f["--contract"],
    stamp: f["--contract"] ? (f["--stamp"] ?? new Date().toISOString().slice(0, 10)) : f["--stamp"],
  };
  let cover = coverText(root, given);
  if ("why" in cover) return say(json, 1, { refused: cover.why });
  // Addresses the cover lacks, from the graph by origin (#9325): none found — the model's way.
  const repository = repositoryOf(root);
  const { graph, holon, agent_role } = cover.data;
  const derived =
    graph && repository && (!holon || !agent_role) && !cover.repeated.length
      ? await fromGraph(String(graph), repository, holon ? String(holon) : undefined)
      : {};
  setLang(lang >= 0 ? argv[lang + 1] : undefined); // the server's config set its own language
  W = words(PREPARE);
  if (derived.holon || derived.agent_role) {
    cover = coverText(root, { ...given, ...derived, ...(agent_role ? { agent_role } : {}) });
    if ("why" in cover) return say(json, 1, { refused: cover.why });
  }

  const out: Outcome = { done: [], kept: [], left: [] };
  const d = cover.data;
  const addr = d.graph
    ? {
        graph: String(d.graph),
        ...(d.holon ? { holon: String(d.holon) } : {}),
        ...(d.agent_role ? { role: String(d.agent_role) } : {}),
      }
    : null;
  const { on } = ritualsOf(coverBlock(cover.text, COVER.root));
  const unparsed = prepareHooks(root, addr, out, on, !!warning);
  if (unparsed) return say(json, 1, { refused: W.unparsed(unparsed) });
  writeAgents(cover, out);
  writeReality(root, f["--case"], out);
  writeClaude(root, out);
  checkOpencode(root, out);

  const listed = (ks?: string[]) => ks?.map((k) => `'${k}'`).join(", ");
  const left = out.left.map((item: PrepareLeft) => {
    const hook = out.named?.[item];
    const keys = listed(item === "cover.rituals" ? out.rituals : out.repeated);
    return { item, why: hook ? W.unread(item, hook) : W.left(item, keys) };
  });
  say(json, left.length ? 3 : 0, {
    repo: root,
    repository,
    derived,
    cover: d,
    ...(warning ? { warnings: [warning] } : {}),
    done: out.done,
    kept: out.kept,
    left,
  });
}
