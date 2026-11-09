// Every HTTP request of the bridge and the CLI names its sender, so the API log tells
// the bridge apart from other clients (graph @nks/nks-dev, node #9972): one point,
// the name from the delivery layer.
import { BRIDGE_NAME } from "../delivery/index.ts";
import { VERSION } from "./version.ts";

export const USER_AGENT = `${BRIDGE_NAME}/${VERSION}`;

/** `fetch` with the delivery's user-agent; a header of the caller with that name loses. */
export function namedFetch(input: string | URL, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  headers.set("user-agent", USER_AGENT);
  return fetch(input, { ...init, headers });
}

/** `WebSocket` whose upgrade request carries the same user-agent (undici and Bun take headers). */
export function namedSocket(url: string): WebSocket {
  return new WebSocket(url, { headers: { "user-agent": USER_AGENT } });
}
