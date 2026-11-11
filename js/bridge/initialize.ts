// The harness's initialization, including its schema snapshot (#10121, graph @nks/nks-dev).
import { negotiateCounts } from "../shared/frame-format.ts";
import { annotateToolList } from "./moment.ts";
import { narrowToolList } from "./narrow.ts";
import { loadServerCache } from "./store.ts";
import { noteServedTools } from "./toolsync.ts";
import { state } from "./transport.ts";

export function initializeSession(params: unknown): void {
  const first = !state.initParams;
  state.initParams = negotiateCounts(params);
  // Hosted slots reuse the catalogue without tools/list. Snapshot only once:
  // a repeated initialize cannot revive cache after a surface invalidation.
  if (!first) return;
  const cached = { result: loadServerCache()?.tools };
  annotateToolList(cached);
  // Remember the catalogue for reopen checks even when this slot never listed.
  noteServedTools(narrowToolList(cached).result);
}
