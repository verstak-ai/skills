---
name: minding-launcher
description: "Reference for the minding skill: the user's launcher description in personal mind — its card, slice and JSON body, the questions that fill it, what of it may leave mind. Load when minding points here; not a task of its own."
---

# The launcher description — agents raised by themselves

A reference of **minding** (`Where in mind`); read it whole before writing a description.

The user wants agents launched without them — their machine and their choice: one phenomenon card under the holon of working with agents (none → create it, as a subject area by `Where in mind`), `attrs` `{"slice":"orchestra"}`, the body nothing but a JSON object, which the machine's bridge reads:

```json
{"launcher":"<launcher name>","host":"<machine name>","adapter":"orca","limit":2,"harnesses":{"opencode":{"models":["<model>"]}}}
```

The values are the user's answers, never a guess; ask in one message: what to call the launcher (a short word of at most 64 characters — roles will call agents by it); on which machine (`host` — the name `hostname` prints, case doesn't matter; without the key any machine of their account answers); which harnesses and models are allowed (the harness key is the Orca agent's name; only `opencode` is raised for now); how many agents at once (`limit` — required, an integer; "no limit" is no answer: ask for a number). `adapter` is always `"orca"`: a description without it, or without an integer `limit`, is refused by the bridge.

A `checkouts` map — `{"<repository>":"<absolute path>"}` — only when Orca doesn't find the project unambiguously (the refusal `no_checkout` or `ambiguous_checkout`). A `homes` map — `{"<graph>#<role number>":"<absolute path>"}`, the graph by its full address — only when they want a role raised in a copy whose cover names another role: the role is raised there whatever the cover's role, and its invitation needs no holon `repository` (a malformed map is refused as `homes_invalid`). `callers` — `["@handle", …]` — only when they named themselves whose invitations, besides their own account's, to raise. Cloning a repository Orca doesn't know — only when they allowed it themselves: `"clone":true`, `"clone_root":"<directory>"` (absolute or from `~`; the copy lands in `<clone_root>/<org>/<repo>`) and `"allow":["<host>/<org>", …]` — the organisations it may clone from (a malformed field is refused as `clone_invalid`, `clone_root_invalid` or `allow_invalid`, and nothing is raised by that description). The list is theirs, never yours: a cloned repository runs its own code with the machine's rights when an agent starts in it. The clone's git runs inside Orca with the machine's credentials, and the bridge can't stop it asking for more: a private repository the machine can't reach may open a git credential prompt or helper window — so `allow` lists only organisations the machine already reaches. One launcher, one description per machine: a second with the same `launcher` disables both — edit the first.

What of it leaves mind: only the chosen `launcher`, `harness` and `model`, into a role invitation (**minding**, `Privacy`); `callers`, `checkouts`, `homes`, the clone fields, `limit` and `host` stay here.

Written → lead on to switching on: **establish-mcp**, `The bridge orchestrator`. To the user in one line: an agent will be raised on a role's invitation into a case whose holon carries the `repository` attribute (without it no agent is raised, unless `homes` names the role's copy); what the invitation must be — `verstak`, `Case laws`, a role called in.
