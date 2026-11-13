// Shared OpenCode JSONC reader: preserve string literals in both passes (#10397).
export function parseJsonc(text: string): unknown {
  const STRING = '"(?:[^"\\\\]|\\\\.)*"';
  const noComments = text.replace(new RegExp(`${STRING}|/\\*[\\s\\S]*?\\*/|//[^\\n]*`, "g"), (m) =>
    m.startsWith('"') ? m : "",
  );
  const noTrailing = noComments.replace(
    new RegExp(`${STRING}|,(\\s*[}\\]])`, "g"),
    (m, tail: string | undefined) => (m.startsWith('"') ? m : (tail ?? "")),
  );
  return JSON.parse(noTrailing) as unknown;
}
