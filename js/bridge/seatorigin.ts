// The origin of a standing transition belongs to its call, not to another pending request.
import { AsyncLocalStorage } from "node:async_hooks";

import { SERVICE_ID } from "../shared/serviceid.ts";

const origin = new AsyncLocalStorage<boolean>();
export const automaticSeat = (): boolean => origin.getStore() ?? true;
export const withSeatOrigin = <T>(automatic: boolean, work: () => T): T =>
  origin.run(automatic, work);
export const withCallOrigin = <T>(id: unknown, work: () => T): T =>
  withSeatOrigin(typeof id === "string" && id.startsWith(SERVICE_ID), work);
