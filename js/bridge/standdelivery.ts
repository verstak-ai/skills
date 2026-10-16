// Local standing replies obey the same harness capability gate as upstream tool replies.
import { serialized } from "./call.ts";
import { forHarness } from "./fields.ts";
import { isResumeCall, runCheck, runResume } from "./resume.ts";
import { withCallOrigin, withSeatOrigin } from "./seatorigin.ts";
import { runStand } from "./stand.ts";
import type { JsonRpcMessage } from "./types.ts";

export const standForHarness = async (
  msg: JsonRpcMessage,
  notice: (r: JsonRpcMessage) => JsonRpcMessage,
) => forHarness(notice(await serialized(() => withCallOrigin(msg.id, () => runStand(msg)))));
export const resumeByOrigin = (msg: JsonRpcMessage) =>
  serialized(() =>
    withSeatOrigin(true, () => (isResumeCall(msg) ? runResume(msg) : runCheck(msg))),
  );
