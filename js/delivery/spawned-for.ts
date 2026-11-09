// The launch basis (graph @nks/nks-dev, node #9959): the environment variable a launcher passes
// the {invite, room} pair in and its schema on the stand tool; the refusals' words are
// words/spawned-for.ts. The core parses the pair (shared/spawned-for.ts) and holds a seat only
// when register echoes it.
import { envName } from "./product.ts";

export const SPAWNED_FOR_ENV = envName("SPAWNED_FOR");

export const spawnedForSchema = (description: string) => ({
  type: "object",
  description,
  additionalProperties: false,
  properties: {
    invite: { type: "integer", minimum: 1, maximum: Number.MAX_SAFE_INTEGER },
    room: { type: "string", format: "uuid" },
  },
  required: ["invite", "room"],
});
