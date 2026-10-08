import { createServer, type ServerResponse } from "node:http";

import { CALLBACK } from "../../delivery/index.ts";
import { words } from "../../shared/lang.ts";
import { errorMessage } from "../errors.ts";
import { log } from "../streams.ts";

// How long the human's browser is held while the code is exchanged. Long enough
// for a round trip to the token endpoint, short enough that a wedged exchange
// gives them a line to read instead of a spinner.
const PAGE_HOLD_MS = 20_000;

export interface Callback {
  port: number;
  /** What the human is told, once the exchange has actually answered. */
  report: (failure: string | null) => void;
  close: () => void;
  waitForCode: (expectedState: string, timeoutMs?: number) => Promise<string>;
  /** What /login answers to the holder of `key`: the sign-in page, minted as the link is opened. */
  serveLogin: (key: string, mint: () => Promise<string>) => void;
}

interface Arrival {
  code: string | null;
  state: string | null;
  err: string | null;
}

// Bind the loopback listener that catches the redirect carrying ?code=…&state=…
// Binding comes FIRST and is what claims the flow: a bound port is a fact any
// other process can check, unlike a file that outlives the process that wrote it.
// The page this server draws is the ONLY report the human gets: they clicked,
// they read a line, they close the tab and go. So the line must say what
// actually happened, and the code arriving is not yet the grant existing — the
// exchange still has to run. A page that says "authenticated" the moment the
// redirect lands sends the human away from the one screen that could have told
// them it failed; witnessed in the field, twice in a row, with an empty store.
// So the browser is held until the exchange answers, and `report` is what
// answers it — under a hold short enough that a wedged exchange leaves a tab
// with an honest "still running", never a spinner forever.
export function bindCallback(port: number): Promise<Callback> {
  return new Promise((resolve, reject) => {
    let handOff: ((v: Arrival) => void) | null = null; // set once someone is waiting for the code
    let received: Arrival | null = null; // …or hold what arrived before they asked
    let browser: ServerResponse | null = null; // the redirect's response, held open for the verdict
    let mint: (() => Promise<string>) | null = null; // what the login link sends the human to
    let loginKey = ""; // the link's own key: the port is open to every local user
    const deliver = (v: Arrival) => {
      if (handOff) handOff(v);
      else received = v;
    };
    const esc = (s: unknown) =>
      String(s).replace(
        /[<>&"]/g,
        (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" })[c] as string,
      );
    const tellBrowser = (line: string) => {
      if (!browser) return;
      const res = browser;
      browser = null;
      try {
        res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
        res.end(`<h3>${line}</h3>`);
      } catch {
        /* the human closed the tab; the flow is unaffected */
      }
    };

    const server = createServer((req, res) => {
      const u = new URL(req.url ?? "/", `http://127.0.0.1:${port}`);
      if (u.pathname === "/login" && mint && loginKey && u.searchParams.get("k") === loginKey) {
        // The link the human was given: the sign-in page is minted now, under a
        // registration the server knows at this very moment (#4794).
        mint().then(
          (to) => {
            res.writeHead(302, { location: to, "cache-control": "no-store" });
            res.end();
          },
          (e: unknown) => {
            res.writeHead(502, { "content-type": "text/html; charset=utf-8" });
            res.end(words(CALLBACK).loginUnreachable(esc(errorMessage(e))));
          },
        );
        return;
      }
      if (u.pathname !== "/callback") {
        res.writeHead(404);
        res.end();
        return;
      }
      const err = u.searchParams.get("error");
      // A human who is not sure the first click landed clicks again — and the
      // held response is exactly what makes them unsure. Hand the older tab a
      // line of its own rather than silently dropping its response: an
      // abandoned one spins until the browser gives up on it.
      if (browser) tellBrowser(words(CALLBACK).anotherTab());
      browser = res;
      if (err) tellBrowser(words(CALLBACK).refused(esc(err)));
      else setTimeout(() => tellBrowser(words(CALLBACK).stillRunning()), PAGE_HOLD_MS).unref();
      deliver({ code: u.searchParams.get("code"), state: u.searchParams.get("state"), err });
    });

    server.once("error", reject); // EADDRINUSE: someone else owns the flow
    server.listen(port, "127.0.0.1", () => {
      server.removeListener("error", reject);
      server.on("error", (e) => log(`callback server: ${e.message}`));
      resolve({
        port,
        report: (failure) =>
          tellBrowser(
            failure ? words(CALLBACK).failed(esc(failure)) : words(CALLBACK).authenticated(),
          ),
        close: () => {
          tellBrowser(words(CALLBACK).abandoned());
          server.close();
        },
        serveLogin: (key, fn) => {
          loginKey = key;
          mint = fn;
        },
        // No deadline by default: the login lives as long as the bridge holding
        // it, so a human who comes back to the tab late still lands it (graph
        // @nks/nks-dev, node #4721). A bridge left by its harness bounds the wait itself.
        waitForCode: (expectedState, timeoutMs = 0) =>
          new Promise<string>((res, rej) => {
            const timer =
              timeoutMs > 0
                ? setTimeout(
                    () => rej(new Error("timed out waiting for the browser authorization")),
                    timeoutMs,
                  )
                : null;
            // An arrival that is not this login's — a leftover tab of a login
            // that is over, or any page poking the port — is answered in its own
            // browser and does not end the login: only a refusal with the
            // login's own state does (#4794).
            const settle = (v: Arrival): boolean => {
              if (v.state !== expectedState) {
                tellBrowser(words(CALLBACK).loginOver());
                return false;
              }
              if (timer) clearTimeout(timer);
              handOff = null;
              if (v.err) rej(new Error(`authorization refused: ${v.err}`));
              else if (!v.code) rej(new Error("callback missing code"));
              else res(v.code);
              return true;
            };
            if (received && settle(received)) return;
            received = null;
            handOff = settle;
          }),
      });
    });
  });
}
