# The intake target — where forwarded text goes

A reference of **minding** (`Where in mind`); read it whole before writing a target and before searching for one.

The user forwards someone else's message — a post, a piece of news, a remark — and wants it let into a graph. Which graphs is theirs to say; their choice lies in personal mind as one record per target. The companion — in the conversation home or a messenger — and an agent at the terminal write and read it the same way.

**The record.** One phenomenon card per target graph under the holon of working with agents (none → create it, as a subject area by `Where in mind`). `attrs` carry only the filter keys:

```json
{"slice":"intake","realm":"@owner/slug","skill":"intake","model":"provider/id"}
```

- `realm` — the target graph's address, in full, with the owner's handle.
- `skill` — which skill lets the text in: the common **intake**, or the graph's own skill (as a chronicle has).
- `model` — the model of the background intake thread; no key → the conversation's model.

The name — the user's words about the graph; the body — their words on what belongs there and what doesn't. The values are their answers, never a guess: no skill named → `intake`; a model only when they named one. One card per `realm`: a target for the same graph already there → edit it, never a second. A target they gave up is released by its mode (`visarjana`), not deleted.

**Search.** `verstak_search(realm="mind", q="", attrs_filter="slice:intake")`, then each card by `verstak_look`. No targets → intake is still possible: ask where, and offer to remember the answer as this record.

**What leaves mind.** From the record outward — into the choice card, the background thread's assignment, a case — go only `realm`, `skill` and `model`; the body is seen by the user alone (**minding**, `Privacy`). A target grants no right to write into the graph: intake goes where whoever writes has grounds to act; none → say how to give them.
