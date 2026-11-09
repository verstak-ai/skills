// Read-only support diagnosis of the delivery's cover (#9786, graph @nks/nks-dev).
// Unknown is not the minimum supported version; no finding changes hooks or a stamp.
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { CONTRACT_SUPPORT, CONTRACT_WORDS, COVER } from "../delivery/index.ts";
import { type CoverKeys, formOf, stampOf } from "./cover.ts";
import { coverBlock, frontMatter, repeatedKeys } from "./coverblock.ts";
import { type Lang, wordsIn } from "./lang.ts";
import { repoRoot } from "./reposigns.ts";

export type CoverContract =
  { kind: "known"; contract: number } | { kind: "foreign" | "missing" | "invalid" | "ambiguous" };

/** The existing block and flat stamp forms are the only sources of a contract number. */
export function contractOf(text: string, cover: CoverKeys = COVER): CoverContract {
  if (stampOf(text, cover) === "foreign") return { kind: "foreign" };
  if (repeatedKeys(text).length) return { kind: "ambiguous" };
  const block = coverBlock(text, cover.root);
  const pairs = frontMatter(text);
  const stamps = Object.values(cover.forms).flatMap((f) => {
    const re = f.contractStamp ?? f.stamp;
    return [...text.matchAll(new RegExp(re.source, `${re.flags.replace("g", "")}g`))].map(
      (m) => m[1],
    );
  });
  if (pairs) {
    const form = formOf(pairs, cover);
    const count = Object.values(cover.forms).filter(
      (f) => pairs.has(f.graph) || pairs.has(f.role),
    ).length;
    if (("why" in form && count > 1) || (block && count > 0)) return { kind: "ambiguous" };
  }
  const values = [...(block?.has("contract") ? [block.get("contract")] : []), ...stamps];
  if (!values.length) return { kind: "missing" };
  if (values.length > 1) return { kind: "ambiguous" };
  const value = values[0] ?? "";
  const n = Number(value);
  return /^\d+$/.test(value) && Number.isSafeInteger(n)
    ? { kind: "known", contract: n }
    : { kind: "invalid" };
}

/** One warning at an explicit entry, never from per-tool or frame handlers. */
export function contractWarning(c: CoverContract, lang?: Lang): string | null {
  return c.kind === "known" && c.contract < CONTRACT_SUPPORT.minimum
    ? wordsIn(CONTRACT_WORDS, lang).unsupported(c.contract, CONTRACT_SUPPORT.target)
    : null;
}

export function repoContractWarning(dir: string, lang?: Lang): string | null {
  const root = repoRoot(dir);
  if (!root) return null;
  try {
    return contractWarning(contractOf(readFileSync(join(root, COVER.file), "utf8")), lang);
  } catch {
    return null;
  }
}
