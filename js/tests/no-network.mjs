// Loaded into every process the suite spawns (NODE_OPTIONS --import): fetch and TCP
// connect reach only loopback and unix sockets, so no test ever touches a production
// address. A blocked attempt fails like a refused connection and is appended to the file
// named by BRIDGE_TEST_NET_LOG, where the suite reads it.
import { appendFileSync } from "node:fs";
import { Socket } from "node:net";

const LOOPBACK = new Set(["127.0.0.1", "localhost", "::1", "[::1]"]);
const LOG = process.env.BRIDGE_TEST_NET_LOG;

const blocked = (where) => {
  if (LOG) appendFileSync(LOG, `${process.pid} ${where}\n`);
  return new Error(`test network guard: ${where} is not loopback`);
};

const realFetch = globalThis.fetch;
globalThis.fetch = (input, init) => {
  const href = typeof input === "string" ? input : (input?.href ?? input?.url ?? String(input));
  let host;
  try {
    host = new URL(href).hostname;
  } catch {
    return realFetch(input, init);
  }
  return LOOPBACK.has(host) ? realFetch(input, init) : Promise.reject(blocked(href));
};

const realConnect = Socket.prototype.connect;
Socket.prototype.connect = function (...args) {
  const first = Array.isArray(args[0]) ? args[0][0] : args[0];
  const opts = first && typeof first === "object" ? first : null;
  const path = opts ? opts.path : typeof first === "string" && !/^\d+$/.test(first) ? first : null;
  const host = opts
    ? (opts.host ?? "localhost")
    : typeof args[1] === "string"
      ? args[1]
      : "localhost";
  if (path || LOOPBACK.has(host)) return realConnect.apply(this, args);
  const err = blocked(`tcp ${host}:${opts?.port ?? first}`);
  process.nextTick(() => this.destroy(err));
  return this;
};
