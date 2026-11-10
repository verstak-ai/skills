# The launcher description — agents raised by themselves

A reference of **minding** (`Where in mind`); read it whole before writing a description.

The user wants agents launched without them — their machine and their choice: one phenomenon card under the holon of working with agents (none → create it, as a subject area by `Where in mind`), `attrs` `{"slice":"orchestra"}`, the body nothing but a JSON object, which the machine's bridge reads:

```json
{"launcher":"<launcher name>","host":"<machine name>","adapter":"orca","limit":2,"harnesses":{"opencode":{"models":["<model>"]}}}
```

The values are the user's answers, never a guess; ask in one message: what to call the launcher (a short word of at most 64 characters — roles will call agents by it); on which machine (`host` — the name `hostname` prints, case doesn't matter; without the key any machine of their account answers); which harnesses and models are allowed (the harness key is the Orca agent's name; only `opencode` is raised for now); how many agents at once (`limit` — required, an integer; "no limit" is no answer: ask for a number). `adapter` is always `"orca"`: a description without it, or without an integer `limit`, is refused by the bridge. A `checkouts` map — `{"<repository>":"<absolute path>"}` — only when Orca doesn't find the project unambiguously (the refusal `no_checkout` or `ambiguous_checkout`). `callers` — `["@handle", …]` — only when they named themselves whose invitations, besides their own account's, to raise. One launcher, one description per machine: a second with the same `launcher` disables both — edit the first.

What of it leaves mind: only the chosen `launcher`, `harness` and `model`, into a role invitation (**minding**, `Privacy`); `callers`, `checkouts`, `limit` and `host` stay here.

Written → lead on to switching on: **establish-mcp**, `The bridge orchestrator`. To the user in one line: an agent will be raised on a role's invitation into a case whose holon carries the `repository` attribute (without it no agent is raised); what the invitation must be — the door, `Case laws`, a role called in.
