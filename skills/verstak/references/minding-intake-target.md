# The intake target — where forwarded text goes

A reference of **minding** (`Where in mind`); read it whole before writing a target and before searching for one.

The user forwards someone else's message — a post, a piece of news, a remark — and wants it let into a graph. Which graphs is theirs to say; their choice lies in personal mind as one record per target. The companion — in the conversation home or a messenger — and an agent at the terminal write and read it the same way.

**The record.** One phenomenon card per target graph under the holon of working with agents (none → create it, as a subject area by `Where in mind`). It is its own card, never the graph's live-graph card (the `ding` with `attrs.key` and `address`): that one routes questions to the graph, this one admits forwarded text into it; a graph may have both, and refining the live-graph card leaves no target the search finds. `attrs` carry only these keys:

```json
{"slice":"intake","realm":"@owner/slug","skill":"intake","model":"provider/id","way":"mind#N"}
```

- `realm` — the target graph's address, in full, with the owner's handle.
- `skill` — which skill lets the text in: the common **intake**, or the graph's own skill (as a chronicle has).
- `model` — the model of the background intake thread; no key → the conversation's model.
- `way` — optional: a pointer to the description of how text is let into this graph — the user's own way in their personal mind (`mind#N`) or a method node in the target graph (`#N`). It never travels in an assignment: whoever lets the text in — a background thread included — finds the target's card themselves, with their own access (`verstak_search(realm="mind", q="", attrs_filter="slice:intake;realm:<the target's realm>")`), reads the description it points to, and follows it where it says more precisely than the common skill; no key → the skill alone.

The name — the user's words about the graph; the body — their words on what belongs there and what doesn't. The values are their answers, never a guess: no skill named → `intake`; a model only when they named one. One card per `realm`: a target for the same graph already there → edit it, never a second. A target they gave up is released by its mode (`visarjana`), not deleted.

**Search.** `verstak_search(realm="mind", q="", attrs_filter="slice:intake", volitive_mode="chanda,adhimoksha,upeksha")`, then each card by `verstak_look`; the mode filter keeps released targets off, so a target the user gave up is never offered again. No targets → intake is still possible: ask where, and offer to remember the answer as this record.

**What leaves mind.** From the record outward — into the choice offered to the user and the intake's assignment — go only `realm`, `skill` and `model`; the body is read only by the user and the agent working for them (**minding**, `Privacy`). A target grants no right to write into the graph: intake goes where whoever writes has grounds to act; none → say how to give them.
