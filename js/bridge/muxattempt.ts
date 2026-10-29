// One opening of the dispatcher connection (graph @nks/nks-dev, node #8620): the socket, its
// connect limit and the upgrade answer it failed with. It ends once, however it ended: the
// close event names the code, a runtime that gives only error gets a 1006 guess after a breath.
import { watchAnswer } from "./muxprobe.ts";

const CONNECT_MS = 10_000;

export interface AttemptEnd {
  code: number;
  /** The upgrade's HTTP status if the runtime published it; undefined — unknown. */
  status: number | undefined;
  timedOut: boolean;
  /** The connection was open before it ended. */
  opened: boolean;
}

export interface AttemptHooks {
  onOpen(): void;
  onMessage(raw: string): void;
  onPing(): void;
  onEnd(e: AttemptEnd): void;
}

export interface Attempt {
  readonly sock: WebSocket;
  /** End it now (a hung connection, an idle one): the end is reported as any other. */
  end(code: number): void;
}

export function attempt(url: string, h: AttemptHooks): Attempt {
  const answer = watchAnswer(url);
  const sock = new WebSocket(url);
  let over = false;
  let opened = false;
  let timedOut = false;
  const end = (code: number): void => {
    if (over) return;
    over = true;
    clearTimeout(limit);
    const status = answer();
    try {
      sock.close();
    } catch {
      /* already closed */
    }
    h.onEnd({ code, status, timedOut, opened });
  };
  const limit = setTimeout(() => ((timedOut = true), end(1006)), CONNECT_MS);
  sock.addEventListener("open", () => {
    clearTimeout(limit);
    if (over) return;
    opened = true;
    answer();
    h.onOpen();
  });
  sock.addEventListener("ping", () => !over && h.onPing());
  sock.addEventListener("message", (e: MessageEvent) => {
    if (!over) h.onMessage(typeof e.data === "string" ? e.data : "");
  });
  sock.addEventListener("error", () => setTimeout(() => end(1006), 500));
  sock.addEventListener("close", (e) => end((e as unknown as { code: number }).code));
  return { sock, end };
}
