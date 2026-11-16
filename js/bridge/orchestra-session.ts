// Process identity for direct orchestration reads (graph @nks/nks-dev, node #10798).
import { randomUUID } from "node:crypto";

export const ORCHESTRA_SESSION_HEADER = "X-NKS-Session-Id";
export const ORCHESTRA_SESSION_ID = randomUUID();
