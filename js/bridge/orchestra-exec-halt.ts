// A native exec launch's session on the shared OpenCode server, halted by the daemon the way the
// plugin halts a session on a confirmed stop (graph @nks/nks-dev, #9256, #11099; the plugin's
// cut and archive — opencode/cuts.ts, opencode/host.ts): its turn interrupted without resume,
// the session archived, and the archive read back — only the read-back confirms. The calls go
// through `opencode api` against the run's own server, as the launch's preparation does. The
// forms are the ones OpenCode 2.2.7 answered (isolated serve, API-only session, #11099):
// interrupt — bare `{"interrupted":false}`; PATCH archived — 204, no output; read-back —
// `{"data":{"id",…,"time":{…,"archived":<ms>}}}`.
import { type ApiCall, execApi } from "./exec-prepare.ts";

/** null — halted and archived, read back; otherwise the step that did not confirm. */
export async function haltExecSession(
  server: string,
  session: string,
  api: ApiCall = execApi,
): Promise<string | null> {
  const path = `/api/session/${encodeURIComponent(session)}`;
  try {
    const cut = (await api(server, "post", `${path}/interrupt?resume=false`)) as {
      interrupted?: unknown;
    } | null;
    if (typeof cut?.interrupted !== "boolean") return "session_interrupt_unconfirmed";
    if ((await api(server, "patch", path, { archived: true })) !== undefined)
      return "session_archive_unconfirmed";
    const s = (await api(server, "get", path)) as {
      data?: { id?: unknown; time?: { archived?: unknown } };
    } | null;
    return s?.data?.id === session && typeof s.data.time?.archived === "number"
      ? null
      : "session_archive_unconfirmed";
  } catch {
    return "session_halt_unknown";
  }
}
