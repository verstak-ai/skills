// Shared by stand admission and its busy-only path; no relative directory can name a seat.
import { statSync } from "node:fs";
import { isAbsolute } from "node:path";

export const isDirectory = (p: string): boolean => {
  try {
    return isAbsolute(p) && statSync(p).isDirectory();
  } catch {
    return false;
  }
};
