// `stop <seat|session id>`: a human puts down an agent of this machine by its seat (graph
// @nks/nks-dev, nodes #7518, #5085; the order's contract — case №669). The seat comes from the
// daemon's snapshot with its session's server and api (an older daemon's api — from the hold
// record); the key is that server's: the personal token or its grant, refreshed. A stop order
// first (api 0.122+); an api without the route (404) — the seat is revoked instead.
import { readFileSync } from "node:fs";

import { CFG, parseArgs, setConfig } from "../bridge/config.ts";
import { keyOf } from "../bridge/holdrecord.ts";
import { type Config } from "../bridge/types.ts";
import { envName, STOP_CLI, type StopCliWords } from "../delivery/index.ts";
import { apiBase } from "../shared/channel.ts";
import { setLang, words } from "../shared/lang.ts";
import { type PlaceSnapshot, type SessionSnapshot } from "../shared/snapshot.ts";
import { defaultAuthDir, holdFilePathOf } from "../shared/standings.ts";
import { machine } from "./status.ts";
import { keyFor, sameServer, stopSeat } from "./stopapi.ts";

const sw = (): StopCliWords => words(STOP_CLI);

/** The flag's value, taken out of args. */
function take(args: string[], flag: string): string | undefined {
  const i = args.indexOf(flag);
  if (i < 0) return undefined;
  return args.splice(i, 2)[1];
}

interface Seat {
  place: PlaceSnapshot;
  session: SessionSnapshot;
}

/** The seat the target names: a session id (its primary seat) or a seat name or address. */
function pick(
  sessions: SessionSnapshot[],
  target: string,
  realm: string | undefined,
): Seat | string {
  const session = sessions.find((s) => s.local_id === target);
  const full = /^@[^:]+:/.test(target);
  const name = target.replace(/^@[^:]+:/, "");
  const found: Seat[] = session
    ? session.places
        .filter((p) => p.primary || session.places.length === 1)
        .map((place) => ({ place, session }))
    : sessions.flatMap((s) =>
        s.places.filter((p) => p.name === name).map((place) => ({ place, session: s })),
      );
  const inRealm = found.filter(
    ({ place: p }) => !realm || p.realm === realm || p.realm.endsWith(`/${realm}`),
  );
  // A full address names the owner too: a seat of the same name under another handle is not it.
  const seats = full && !session ? inRealm.filter(({ place: p }) => p.address === target) : inRealm;
  if (!seats.length && inRealm.length) {
    const known = inRealm.map(({ place: p }) => p.address).filter((x): x is string => !!x);
    return known.length ? sw().otherOwner(target, known.join(", ")) : sw().noOwner(target);
  }
  if (!seats.length) return sw().notFound(target);
  if (seats.length > 1)
    return sw().ambiguous(target, seats.map(({ place: p }) => `${p.name} (${p.realm})`).join(", "));
  return seats[0];
}

/** The seat's api: the daemon's snapshot names it; an older daemon's — by the seat's hold record. */
function apiOf({ place: p, session }: Seat): string | null {
  if (session.api) return session.api;
  try {
    const rec = JSON.parse(
      readFileSync(holdFilePathOf(CFG.authDir, keyOf(p.realm, p.karta, p.name)), "utf8"),
    ) as { url?: unknown };
    return typeof rec.url === "string" && rec.url ? apiBase(rec.url) : null;
  } catch {
    return null;
  }
}

export async function runStop(argv: string[]): Promise<void> {
  const args = [...argv];
  const lang = take(args, "--lang");
  // An explicit --lang outranks the language the config takes by its server.
  const configure = (cfg: Config): void => {
    setConfig(cfg);
    setLang(lang);
  };
  setLang(lang);
  const realm = take(args, "--realm");
  const authDir =
    take(args, "--auth-dir") || process.env[envName("BRIDGE_AUTH_DIR")] || defaultAuthDir();
  const target = args.find((a) => !a.startsWith("--"));
  const fail = (text: string): void => {
    process.stderr.write(`${text}\n`);
    process.exitCode = 1;
  };
  if (!target) return fail(sw().usage().trimEnd());
  const rest = args.filter((a) => a !== target);
  configure(parseArgs(["--auth-dir", authDir, ...rest]));
  const snap = await machine(authDir);
  if (!snap.snapshot_available) return fail(sw().noDaemon());
  const seat = pick(snap.sessions, target, realm);
  if (typeof seat === "string") return fail(seat);
  const p = seat.place;
  if (!p.standing_id) return fail(sw().noId(p.name));
  // The key is the seat's server's, never the machine's choice: another server's seat gets its own.
  const server = seat.session.server;
  if (!server) return fail(sw().noServer(p.name));
  const base = apiOf(seat);
  if (!base) return fail(sw().noRecord(p.name));
  // The personal token belongs to the server its home names (variable or `server` file), not to
  // every server: for another server's seat it is taken out, that server's grant goes.
  const patServer = CFG.serverUrl;
  const cfg = parseArgs([server, "--auth-dir", authDir, ...rest]);
  if (!sameServer(patServer, server)) {
    cfg.pat = null;
    cfg.patSource = null;
  }
  configure(cfg);
  const key = await keyFor(server);
  if ("why" in key) return fail(key.why);
  const out = await stopSeat(p, p.standing_id, base, key.token);
  if (!out.ok) return fail(out.said);
  process.stdout.write(`${out.said}\n`);
}
