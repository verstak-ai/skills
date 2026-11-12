// Private, same-host receipt I/O. A torn write is ambiguity, never permission to retry.
import {
  closeSync,
  constants,
  fstatSync,
  fsyncSync,
  ftruncateSync,
  lstatSync,
  openSync,
  readFileSync,
  realpathSync,
  writeFileSync,
  writeSync,
} from "node:fs";
import { dirname, join } from "node:path";

function directory(path: string): void {
  const s = lstatSync(path);
  if (
    !s.isDirectory() ||
    s.isSymbolicLink() ||
    realpathSync(path) !== path ||
    s.uid !== process.getuid?.() ||
    (s.mode & 0o777) !== 0o700
  )
    throw new Error("attempt_directory_untrusted");
}
function fdOf(path: string, create = false): number {
  directory(dirname(path));
  if (path.slice(path.lastIndexOf("/") + 1) !== "receipt.json")
    throw new Error("attempt_path_invalid");
  const fd = openSync(
    path,
    constants.O_RDWR | constants.O_NOFOLLOW | (create ? constants.O_CREAT | constants.O_EXCL : 0),
    0o600,
  );
  const s = fstatSync(fd);
  if (
    !s.isFile() ||
    s.nlink !== 1 ||
    s.uid !== process.getuid?.() ||
    (s.mode & 0o777) !== 0o600 ||
    s.size > 128 * 1024
  ) {
    closeSync(fd);
    throw new Error("attempt_file_untrusted");
  }
  return fd;
}
function syncDirectory(path: string): void {
  const fd = openSync(dirname(path), constants.O_RDONLY | constants.O_NOFOLLOW);
  try {
    fsyncSync(fd);
  } finally {
    closeSync(fd);
  }
}
export function readAttemptFile(path: string): string {
  const fd = fdOf(path);
  try {
    return readFileSync(fd, "utf8");
  } finally {
    closeSync(fd);
  }
}
export function writeAttemptFile(
  path: string,
  value: string,
  create: boolean,
  check: (before: string) => void,
): void {
  const fd = fdOf(path, create);
  try {
    if (!create) check(readFileSync(fd, "utf8"));
    const bytes = Buffer.from(value);
    let offset = 0;
    while (offset < bytes.length)
      offset += writeSync(fd, bytes, offset, bytes.length - offset, offset);
    ftruncateSync(fd, bytes.length);
    fsyncSync(fd);
  } finally {
    closeSync(fd);
  }
  syncDirectory(path);
}
export function claimAttempt(path: string): void {
  directory(dirname(path));
  const fd = openSync(
    join(dirname(path), "prepare.lock"),
    constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW,
    0o600,
  );
  try {
    writeFileSync(fd, "claimed\n");
    fsyncSync(fd);
  } finally {
    closeSync(fd);
  }
  syncDirectory(path);
}
