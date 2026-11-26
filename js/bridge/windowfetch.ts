// The machine's down window for a request of the bridge's own that does not go through
// transport.ts `post` (graph @nks/nks-dev, nodes #7700, #11375): the orchestrator's short MCP
// session (shared/mcpsession.ts) — its initialize, calls, close. The same admit as `post`: while
// the window stands nothing leaves and the request answers «not sent» with the window's wait;
// after it, the first knock is the machine's one probe. Its outcome steps or closes the window as
// `post`'s does: a connection never established or a 502/503/504 (with the server's Retry-After)
// opens or steps it, any other answer closes it. No upstream request of the daemon bypasses it.
import {
  admit,
  answered,
  DOWN_HTTP,
  downHttp,
  failed,
  NEVER_LEFT,
  retryAfterMs,
} from "./downwindow.ts";
import { DownError, errorCode, errorMessage, UpstreamError } from "./errors.ts";

/** `send` through the machine's down window. */
export async function throughWindow(send: () => Promise<Response>): Promise<Response> {
  const gate = admit();
  if (gate.refused) throw new DownError(null, UpstreamError.NOT_SENT, false, gate.waitMs);
  let res: Response;
  try {
    res = await send();
  } catch (e) {
    if (!NEVER_LEFT.has(errorCode(e) ?? "")) {
      gate.knock.release(); // a timeout or a connection shut under it says nothing of the server
      throw e;
    }
    const why = `upstream unreachable: ${errorMessage(e)}`;
    throw new DownError(why, UpstreamError.NOT_SENT, true, failed(gate.knock, 0));
  }
  if (DOWN_HTTP.has(res.status)) {
    const body = await res.text().catch(() => "");
    const pause = retryAfterMs(res.headers.get("retry-after"), body);
    throw downHttp(gate.knock, res.status, body.slice(0, 300), pause);
  }
  answered(gate.knock);
  return res;
}
