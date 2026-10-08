// A door's .key and .sock share paths per key with a successor bridge of the same seat:
// a door removes only files whose stamp (dev, inode, birth time) it took itself, so a
// yielding bridge never deletes its successor's door (graph @nks/nks-dev, node #6706).
import { lstatSync, renameSync, unlinkSync, writeFileSync } from "node:fs";

/** File stamp at the path; null when absent. Rename and touch keep it. */
export function stampOf(path: string): string | null {
  try {
    const s = lstatSync(path, { bigint: true });
    return `${s.dev}:${s.ino}:${s.birthtimeNs}`;
  } catch {
    return null;
  }
}

/** Write via rename (own inode even over another's file) and return the stamp. */
export function writeOwned(path: string, content: string): string | null {
  const tmp = `${path}.${process.pid}.tmp`;
  writeFileSync(tmp, content, { mode: 0o600 });
  try {
    renameSync(tmp, path);
  } catch (e) {
    try {
      unlinkSync(tmp);
    } catch {}
    throw e;
  }
  return stampOf(path);
}

/** Unlink only if the file at the path carries this stamp. */
export function unlinkOwned(path: string, stamp: string | null): void {
  if (!stamp || stampOf(path) !== stamp) return;
  try {
    unlinkSync(path);
  } catch {}
}

/**
 * Close a socket server without removing another's socket at the same path: libuv
 * unlinks the bound path on close, so a foreign socket is moved aside and back.
 */
export function closeServerKeeping(path: string, stamp: string | null, close: () => void): void {
  const now = stampOf(path);
  if (!now || now === stamp) {
    close();
    unlinkOwned(path, stamp);
    return;
  }
  const aside = `${path}.${process.pid}.aside`;
  try {
    renameSync(path, aside);
  } catch {
    close();
    return;
  }
  try {
    close();
  } finally {
    try {
      renameSync(aside, path);
    } catch {}
  }
}
