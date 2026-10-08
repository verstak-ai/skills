// An agent file's frontmatter: the YAML subset such files are written in — maps, block
// lists (including `- name:` with a map under it), flow lists and maps, double- and
// single-quoted strings, plain scalars including multi-line ones (`|`, `>`, deeper
// continuation). doctor needs mcpServers and disallowedTools as the projection writes
// them and a human edits them; what is not read stays a string, nothing is guessed.

export type YamlValue = string | YamlValue[] | { [key: string]: YamlValue } | null;

interface Line {
  indent: number;
  text: string;
}

/** The text between the first two `---` lines; null without frontmatter. */
export function frontmatterText(file: string): string | null {
  const body = file.charCodeAt(0) === 0xfeff ? file.slice(1) : file; // Windows Notepad BOM
  const lines = body.split(/\r?\n/);
  if (lines[0]?.trim() !== "---") return null;
  const end = lines.findIndex((l, i) => i > 0 && l.trim() === "---");
  return end < 0 ? null : lines.slice(1, end).join("\n");
}

/** A scalar, flow list or flow map: the value on the line after `key:`. */
export function parseScalar(raw: string): YamlValue {
  const s = raw.trim();
  if (s.startsWith("[") && s.endsWith("]")) return splitFlow(s.slice(1, -1)).map(parseScalar);
  if (s.startsWith("{") && s.endsWith("}")) {
    const out: Record<string, YamlValue> = {};
    for (const part of splitFlow(s.slice(1, -1))) {
      const m = KEY.exec(part);
      if (m) out[unquoteKey(m[1].trim())] = m[2] === undefined ? null : parseScalar(m[2]);
    }
    return out;
  }
  if (s.startsWith('"')) {
    try {
      return JSON.parse(s) as string;
    } catch {
      return s.slice(1, s.lastIndexOf('"') > 0 ? s.lastIndexOf('"') : undefined);
    }
  }
  if (s.startsWith("'"))
    return s.slice(1, s.lastIndexOf("'") > 0 ? s.lastIndexOf("'") : undefined).replace(/''/g, "'");
  return s.replace(/\s+#.*$/, "");
}

// Flow list commas count only outside quotes and nested brackets.
function splitFlow(body: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let quote: string | null = null;
  let cur = "";
  for (let i = 0; i < body.length; i++) {
    const c = body[i];
    if (quote) {
      cur += c;
      if (c === "\\" && quote === '"') cur += body[++i] ?? "";
      else if (c === quote) quote = null;
      continue;
    }
    if (c === '"' || c === "'") quote = c;
    else if (c === "[" || c === "{") depth++;
    else if (c === "]" || c === "}") depth--;
    else if (c === "," && depth === 0) {
      if (cur.trim()) parts.push(cur.trim());
      cur = "";
      continue;
    }
    cur += c;
  }
  if (cur.trim()) parts.push(cur.trim());
  return parts;
}

const KEY = /^("[^"]*"|'[^']*'|[^\s"'#{[-][^:]*?|-[^\s:][^:]*?)\s*:(?:\s+(.*))?$/;
const BLOCK_SCALAR = /^[|>][-+0-9]*$/;

const unquoteKey = (k: string): string =>
  (k.startsWith('"') && k.endsWith('"')) || (k.startsWith("'") && k.endsWith("'"))
    ? k.slice(1, -1)
    : k;

/** The parsed frontmatter: the top-level map. */
export function parseFrontmatter(text: string): Record<string, YamlValue> {
  const lines: Line[] = [];
  for (const raw of text.split(/\r?\n/)) {
    if (!raw.trim() || /^\s*#/.test(raw)) continue;
    const indent = raw.length - raw.trimStart().length;
    lines.push({ indent, text: raw.trim() });
  }
  let i = 0;
  const isItem = (l: Line) => l.text === "-" || l.text.startsWith("- ");

  // Lines deeper than the value's owner are a block scalar body (`|`, `>`) or a plain
  // scalar's continuation, not new keys.
  const scalarAt = (raw: string, owner: number): YamlValue => {
    const more: string[] = [];
    while (i < lines.length && lines[i].indent > owner) more.push(lines[i++].text);
    const head = raw.trim();
    if (BLOCK_SCALAR.test(head)) return more.join(head.startsWith("|") ? "\n" : " ");
    return more.length ? [head, ...more].join(" ") : parseScalar(head);
  };

  const block = (indent: number): YamlValue => {
    const first = lines[i];
    if (!first || first.indent < indent) return null;
    return isItem(first) ? list(first.indent) : map(first.indent);
  };

  const map = (indent: number): Record<string, YamlValue> => {
    const outMap: Record<string, YamlValue> = {};
    while (i < lines.length && lines[i].indent === indent && !isItem(lines[i])) {
      const m = KEY.exec(lines[i].text);
      i++;
      if (!m) {
        while (i < lines.length && lines[i].indent > indent) i++; // skip the unread part whole
        continue;
      }
      const key = unquoteKey(m[1].trim());
      if (m[2] !== undefined && m[2].trim() !== "") outMap[key] = scalarAt(m[2], indent);
      else {
        const next = lines[i];
        // `key:` with a list under it at the same indent is valid YAML.
        outMap[key] =
          next && (next.indent > indent || (next.indent === indent && isItem(next)))
            ? block(next.indent)
            : null;
      }
    }
    return outMap;
  };

  const list = (indent: number): YamlValue[] => {
    const items: YamlValue[] = [];
    while (i < lines.length && lines[i].indent === indent && isItem(lines[i])) {
      const content = lines[i].text.slice(1).trimStart();
      if (!content) {
        i++;
        const next = lines[i];
        items.push(next && next.indent > indent ? block(next.indent) : null);
        continue;
      }
      if (KEY.test(content)) {
        // `- key: …` opens a map whose other keys stand at the content's indent.
        lines[i] = { indent: indent + (lines[i].text.length - content.length), text: content };
        items.push(map(lines[i].indent));
        continue;
      }
      i++;
      items.push(scalarAt(content, indent));
    }
    return items;
  };

  const top = block(0);
  return top && typeof top === "object" && !Array.isArray(top) ? top : {};
}
