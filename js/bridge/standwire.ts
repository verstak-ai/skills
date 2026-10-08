// Bridge moves that stand by the same stand tool as the agent (stand.ts), wired from
// here to where they are needed: importing stand.ts directly would close an import loop.
//   • a seat was taken (evicted.ts, #6706) — stand beside on name.N;
//   • a return of a seat whose socket a former bridge of this same session holds
//     (resume.ts, #6702) — take it by the stand tool's judgement, without take.
import { ID_PREFIX, tool } from "../delivery/index.ts";
import { serialized } from "./call.ts";
import { wireEviction } from "./evicted.ts";
import { wireTakeOwn } from "./resume.ts";
import { baseOf } from "./separate.ts";
import { isDirectory, runStand } from "./stand.ts";

/** The stand tool by seat name from inside the bridge, without take: the outcome and text. */
async function standAs(
  id: string,
  place: { realm: string; karta: string | number; name: string },
  cwd: string | null | undefined,
): Promise<{ ok: boolean; text: string }> {
  const { realm, karta, name } = place;
  const where = cwd && isDirectory(cwd) ? { cwd } : {};
  const r = await runStand({
    jsonrpc: "2.0",
    id,
    method: "tools/call",
    params: { name: tool("stand"), arguments: { realm, karta: String(karta), name, ...where } },
  });
  const text = ((r.result?.content ?? []) as { text?: string }[]).map((c) => c.text ?? "");
  return { ok: !r.result?.isError, text: text.join("\n") };
}

wireEviction((place, cwd) =>
  serialized(() =>
    standAs(
      `${ID_PREFIX}bridge-evicted`,
      { ...place, name: baseOf(place.realm, place.karta, place.name ?? "") }, // the base the seat was chosen from (#6706)
      cwd,
    ),
  ),
);

// A return already runs under serialized (deliver.ts): a second serialized would wait on itself.
wireTakeOwn(
  async (rec, cwd) => (await standAs(`${ID_PREFIX}bridge-resume`, rec, cwd)).text.split("\n")[0],
);
