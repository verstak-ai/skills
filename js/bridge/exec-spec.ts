// Explicit OpenCode exec contract, never inferred from a model token (#9967).
export interface ModelRef {
  providerID: string;
  id: string;
  variant?: string;
}
export interface ExecSpec {
  server: string;
  modelRefs: Record<string, ModelRef>;
}
const object = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);
const text = (v: unknown): v is string =>
  typeof v === "string" &&
  v.length > 0 &&
  v === v.trim() &&
  ![...v].some((c) => c.charCodeAt(0) < 32 || c.charCodeAt(0) === 127);

export function parseExec(v: unknown, models: string[]): ExecSpec | null {
  if (!object(v) || Object.keys(v).some((k) => !["server", "modelRefs"].includes(k))) return null;
  if (!text(v.server) || !object(v.modelRefs)) return null;
  try {
    const u = new URL(v.server);
    if (
      u.protocol !== "http:" ||
      !["127.0.0.1", "[::1]"].includes(u.hostname) ||
      u.username ||
      u.password ||
      u.search ||
      u.hash ||
      u.pathname !== "/"
    )
      return null;
  } catch {
    return null;
  }
  const refs: Record<string, ModelRef> = {};
  for (const [token, ref] of Object.entries(v.modelRefs)) {
    if (!models.includes(token) || !object(ref)) return null;
    if (Object.keys(ref).some((k) => !["providerID", "id", "variant"].includes(k))) return null;
    if (!text(ref.providerID) || !text(ref.id) || (ref.variant !== undefined && !text(ref.variant)))
      return null;
    Object.defineProperty(refs, token, {
      enumerable: true,
      value: {
        providerID: ref.providerID,
        id: ref.id,
        ...(ref.variant === undefined ? {} : { variant: ref.variant }),
      },
    });
  }
  if (!models.every((m) => Object.hasOwn(refs, m))) return null;
  return { server: v.server, modelRefs: refs };
}
