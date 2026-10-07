# Batch writes (`verstak_batch`) — order, inline arrows, `temp:N`

Read by the `writing` method (`methods/writing.md`, "Operational") before creating several nodes in one delta.

**Read the factory schemas first.** Every create in a batch is validated against its `verstak_add_*` schema; with deferred tools the batch loads without them, and guessing costs one 422 per round trip. The first create of an unfamiliar type goes as a single call; no multi-paragraph bodies in a megabatch.

Order: phenomena, then kriyas, then cross-cutting arrows. `temp:N` refers to the node created by operation N (0-based), only an **earlier** one.

## The inline arrow form

Same as `arrow_link`, the new node the implicit source: `{arrow_type, target, sense?, direction?, quantifier?, attrs?, <modes>}`. Required: `arrow_type`, `target` and **`volitive_mode`** (not inherited). `direction: "from"` makes the new node the target. Unknown keys (old `edge_type`) are rejected.

- **Inline** — arrows leaving the new node (`vimarsha_of`, `context`, `ahara`/`utpatti`/`actor`).
- **`arrow_link` with `temp:N`** — arrows between batch nodes or into a new node.

**A kriya's `ahara`/`utpatti` stay inline:** the factory checks each `add_kriya` by its own inline `arrows`; a trailing `arrow_link` fails it. Trailing links are for `next` and `upadhi`. On `verstak_add_bianhua`, `anga=` / `anantara_after=`, never `arrows`.

## Mutating operations

`arrow_update`, `arrow_delete`, `arrow_reconnect`, `update_node`, `delete_node`, `restore_node`, `restore_edge` need `params.basis_version`; a stale one rejects the delta. One `reasoning` per delta. Any failure writes nothing.
