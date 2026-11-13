// Flat NodeView read, observed on API 0.185.4; only adhikarin is executable (#5042).
import { namedFetch } from "../shared/http.ts";

export async function roleRefusal(
  base: string,
  token: string,
  row: Record<string, unknown>,
): Promise<string | null> {
  const seq = row.karta;
  if (!Number.isSafeInteger(seq) || Number(seq) <= 0 || typeof row.realm !== "string")
    return "role_unverified";
  try {
    const res = await namedFetch(`${base}/nodes/${seq}`, {
      headers: { authorization: `Bearer ${token}`, "x-nks-realm": row.realm },
      redirect: "error",
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return "role_unreadable";
    const node = (await res.json()) as {
      seq?: unknown;
      node_type?: unknown;
      is_active?: unknown;
      manifested_as?: unknown;
    };
    if (!node || node.seq !== seq) return "role_unverified";
    if (node.node_type !== "karta") return "role_not_karta";
    if (node.is_active !== true) return "role_inactive";
    if (node.manifested_as === "adhikarin") return null;
    if (node.manifested_as === "svatantra") return "human_role_not_executable";
    if (node.manifested_as === "pratibimba" || node.manifested_as === "agantuka")
      return "role_not_executable";
    return "role_kind_unknown";
  } catch {
    return "role_unreadable";
  }
}
