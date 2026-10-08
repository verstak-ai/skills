// Door into a Codex thread: app-server JSON-RPC over websocket on a unix socket
// (graph @nks/nks-dev, node #4286). Codex holds the daemon control socket
// `$CODEX_HOME/app-server-control/app-server-control.sock`; one JSON-RPC message per
// text frame, the jsonrpc header omitted on the wire. Framing is done here because
// Node's global WebSocket cannot use unix sockets.
import { randomBytes } from "node:crypto";
import { request } from "node:http";
import { type Socket } from "node:net";

import { APPSERVER } from "../delivery/index.ts";
import { words } from "./lang.ts";

/* eslint-disable @typescript-eslint/no-explicit-any -- app-server messages have no schema */

export interface Door {
  send(msg: any): void;
  close(): void;
}

function frame(data: Buffer): Buffer {
  const mask = randomBytes(4);
  let head: Buffer;
  if (data.length < 126) head = Buffer.from([0x81, 0x80 | data.length]);
  else if (data.length < 65536) {
    head = Buffer.alloc(4);
    head[0] = 0x81;
    head[1] = 0x80 | 126;
    head.writeUInt16BE(data.length, 2);
  } else {
    head = Buffer.alloc(10);
    head[0] = 0x81;
    head[1] = 0x80 | 127;
    head.writeBigUInt64BE(BigInt(data.length), 2);
  }
  const masked = Buffer.from(data.map((b, i) => b ^ mask[i % 4]));
  return Buffer.concat([head, mask, masked]);
}

/** Open the door: HTTP Upgrade on the unix socket, then websocket frames. */
export function openDoor(
  socketPath: string,
  onMessage: (msg: any) => void,
  onClose: (why: string) => void,
): Promise<Door> {
  return new Promise((resolve, reject) => {
    const req = request({
      socketPath,
      path: "/",
      method: "GET",
      headers: {
        Connection: "Upgrade",
        Upgrade: "websocket",
        "Sec-WebSocket-Version": "13",
        "Sec-WebSocket-Key": randomBytes(16).toString("base64"),
      },
    });
    req.on("upgrade", (_res, socket: Socket) => {
      let buf = Buffer.alloc(0);
      socket.on("data", (c: Buffer) => {
        buf = Buffer.concat([buf, c]);
        for (;;) {
          if (buf.length < 2) return;
          const op = buf[0] & 0x0f;
          let len = buf[1] & 0x7f;
          let off = 2;
          if (len === 126) {
            if (buf.length < 4) return;
            len = buf.readUInt16BE(2);
            off = 4;
          } else if (len === 127) {
            if (buf.length < 10) return;
            len = Number(buf.readBigUInt64BE(2));
            off = 10;
          }
          if (buf.length < off + len) return;
          const payload = buf.subarray(off, off + len);
          buf = buf.subarray(off + len);
          if (op === 1) {
            try {
              onMessage(JSON.parse(payload.toString("utf8")));
            } catch {
              /* not JSON — not ours */
            }
          } else if (op === 8) socket.end();
        }
      });
      socket.on("close", () => onClose(words(APPSERVER).socketClosed()));
      socket.on("error", (e) => onClose(e.message));
      resolve({
        send: (msg) => socket.write(frame(Buffer.from(JSON.stringify(msg)))),
        close: () => socket.end(),
      });
    });
    req.on("response", (res) => reject(new Error(words(APPSERVER).doorNotOpened(res.statusCode))));
    req.on("error", reject);
    req.end();
  });
}

/* eslint-enable @typescript-eslint/no-explicit-any */
