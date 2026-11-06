// The turn's end on a watch stays silent after a wake-up that only counts others' records
// (graph @nks/nks-dev, nodes #9345, #9674): the core's quietframe.ts reads those frames back
// from OUR English words (frame-text.ts, stalebatch.ts, ROOM). A rewording here that breaks
// the read-back fails this suite, not a live watch. Frames in the wire's shape, as the
// sibling's room-frames.mjs builds them.
import assert from "node:assert/strict";
import { test } from "node:test";

import { batchHead, caseCountLines, frameToText } from "../shared/frame-text.ts";
import { setLang } from "../shared/lang.ts";
import { quiet } from "../shared/quietframe.ts";
import { staleBatch } from "../shared/stalebatch.ts";

const ME = "@tester:proba";
const ROOM = { id: "r-1", seq: 7, zachin: "Bench", realm: "nks-dev", status: "open" };
const OTHER = {
  kind: "standing",
  standing: "@aleksei:probe",
  name: "Aleksei",
  karta: { seq: 48, name: "Architect" },
};
const HUMAN = {
  kind: "standing",
  standing: "@dmitry:phone",
  name: "Dmitry",
  karta: { seq: 1226, name: "Owner" },
};

function frame(kind, { entry_id, author = OTHER, line = {}, body = "", envelope = {} } = {}) {
  return {
    ...envelope,
    type: "message",
    id: `room-msg-${entry_id}`,
    room: { ...ROOM },
    entry_id,
    event_kind: `room.${kind}`,
    to_standing: ME,
    line: { entry_id, at: "2026-09-23T10:00:00Z", kind, key: kind, author, fields: {}, ...line },
    body,
    provenance: {
      from_standing: author.standing,
      from_karta_seq: author.karta.seq,
      auth: "pat",
      via: "room",
    },
  };
}

const reply = () => ({
  ...frame("answer", {
    entry_id: 778,
    author: HUMAN,
    line: { refers_to: 762, done: "Feeds", fields: { to: { standing: ME } } },
    envelope: { addressee: ME, in_reply_to: 762 },
    body: "Feeds",
  }),
  provenance: {
    via: "room",
    auth: "pat",
    from_person: true,
    user: "alari",
    from_standing: HUMAN.standing,
  },
});

test("compact counts in our words stay quiet; an addressed record never does", () => {
  setLang("en");
  const a = frame("progress", { entry_id: 4 });
  const b = { ...a, room: { ...a.room, seq: 8 }, entry_id: 12 };
  for (const frames of [[a], [a, b]]) {
    const render = batchHead(frames);
    assert(quiet(render), render);
  }
  for (const frames of [[reply()], [reply(), b], [a, reply()], [a, b, reply()]]) {
    const render = batchHead(frames);
    assert(!quiet(render), render);
  }
  assert(!quiet(`${batchHead([a, b])}\n${frameToText(reply(), "")}`));
});

test("a clipped stale batch of count-only records stays quiet in our words", () => {
  setLang("en");
  const frames = Array.from({ length: 21 }, (_, i) => frame("progress", { entry_id: i + 1 }));
  const text = staleBatch(frames, () => false).text;
  assert(quiet(text), text);
  const b = { ...frames[0], room: { ...frames[0].room, seq: 8 } };
  assert(quiet(caseCountLines([frames[0], b], true).join("\n")));
});

// Frames already queued carry the words they were written with, so the read-back is pinned to
// those words verbatim: STALE.head's `legacy` sentence (never rendered now) and the count line.
// Rewording the count line in js/delivery/words breaks this test (seen red); the head is not
// pinned by it — the core's case-name wildcard absorbs any prefix (asked of the core's owner).
const OLD_HEAD =
  'Stale frames: 1 — taken while the seat was not listening, or the service repeating after a session rebuild; those addressed to the seat as text, the rest by count; in full — by the case lines below, the rest — verstak_case(action="mine"), then read each.';
const OLD_LINE =
  '#7 «Bench»: 1 records, yours 0 — none of them yours; in full — verstak_case(realm="nks-dev", action="history", room=7, since=0).';

test("queued count-only frames in the words they were written with stay quiet", () => {
  assert(quiet(OLD_LINE), OLD_LINE);
  assert(quiet(`${OLD_HEAD}\n${OLD_LINE}`), OLD_HEAD);
});
