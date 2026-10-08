// The verstak_stand tool description and its parameters (STAND_TOOL).
import type { Lang } from "../lang.ts";

export interface StandToolWords {
  description: () => string;
  realm: () => string;
  karta: () => string;
  name: () => string;
  room: () => string;
  model: () => string;
  muteSiblings: () => string;
  take: () => string;
  roomKarta: () => string;
  repeatKnock: () => string;
  satelliteOf: () => string;
  status: () => string;
  cwd: () => string;
}

export const STAND_TOOL: Readonly<Record<Lang, StandToolWords>> = {
  en: {
    description: () =>
      "[bridge] Take a standing in one call: the bridge reads the board, derives the name (machine.repo.model), takes the seat " +
      "(connect and register; only register if this bridge already holds the socket), arms the role's inbox hook with its own incoming " +
      "address, with room knocks a join frame into the user's seat by the full address from the wire (a repeat — only repeat_knock=true, once, no sooner than 2 minutes) and returns " +
      "the name, the watchdog command, the number of waiting frames, the hook state and the knock receipt. A seat in another graph stands beside on the same channel " +
      "(register): the session hears all its graphs, and a write in each is signed by that graph's seat. Then — start the watchdog " +
      "with the command from the reply and wait. It is also the busyness move: on a seat this bridge already holds, a call with realm and status (karta and name — the same or omitted; with model, room or take it is a seat-taking and a check) " +
      'only sets the busyness line — no board, connect, register, hook or knock; an empty status clears; the former verstak_channel(action="status") is kept for compatibility. ' +
      "The bridge executes the tool; if it is not in the session, the tools go past the bridge or the bridge is an old build (doctor will say), stand by the verstak skill's collaborate method.",
    realm: () => "Graph address: @owner/slug or rN.",
    karta: () =>
      "The agent's role (#N from AGENTS.md or the launch line). Needed to take a seat; for busyness on a held seat it may be omitted.",
    name: () =>
      "Your own half of the standing's name; without it machine.repo.model is derived — the model from the model parameter.",
    room: () =>
      "The user's seat address @handle:name (the user's window gives it); the bridge knocks a join there to stand beside the user.",
    model: () =>
      "The model the agent runs on (id or name, for example claude-opus-5 or opus-5) — the third part of the derived name; without it the name is machine.repo.",
    muteSiblings: () => "Do not hear the echo of other standings of the same role.",
    take: () =>
      "A deliberate move: to displace a live holder of ANOTHER session — only on the user's word (without take a name, derived or explicit, that another session holds stands beside on name.N with hearing; the bridge takes back by itself a seat a former bridge of this same harness session holds — no take needed); or to change this bridge's seat in a graph (one seat per bridge in a graph: another role or another name without take is a refusal aloud, the former seat stays on the board without hearing). A seat in another graph does not need take — it stands beside.",
    roomKarta: () =>
      "The role of the user whose seat it is (#N) if the seat is not on the board; usually the role of the user who sent the seat address.",
    repeatKnock: () =>
      "A deliberate repeat of the knock at the same user seat: allowed once and no sooner than 2 minutes after the first; without it a repeated call sends no second join.",
    satelliteOf: () =>
      "Only for a subagent's satellite bridge (the bridge entry with --satellite in the agent file): the caller's seat @handle:name from the brief. The bridge stands beside as the satellite seat <caller's name>.sub-N (the first free N), with the role from karta (the brief names it, the caller's role is not inherited), without a role inbox hook; the seat lives for the run. name, take and room are not passed with it.",
    status: () =>
      "The seat's busyness, up to 64 characters: on taking — the first line; on a seat this bridge already holds — the main way to update busyness (the call sets only it); an empty string clears.",
    cwd: () =>
      "The harness session's directory, an existing absolute path — the repo for the name is derived from it (git toplevel, in a linked worktree — of the main copy, otherwise its basename) and branches are read when looking for seats of the former name, when the bridge is not started from the working copy; the OpenCode plugin supplies it itself. Without it — the bridge's cwd; a nonexistent or relative one is a refusal aloud.",
  },
};
