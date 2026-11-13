// The Claude Code plugin's refusal of AskUserQuestion (graph @nks/nks-dev, nodes #10397, #10020):
// the readable source of the PreToolUse command in hooks/hooks.json. Never imported: it runs as
// the script of `node -e`, self-standing, so a plugin without its built files still refuses.
// scripts/build-question-hook.mjs makes the command: it defines the globals below from
// js/delivery (DENY, the deny answer with QUESTIONS.claude; the rest from COVER) and carries
// this text as an escaped string, so the command holds no character a shell reads inside double
// quotes; js/tests/question-refusal.test.mjs holds the command equal to what it makes.
// Line comments and the globals line are dropped from the command.
//
// It refuses only under our cover, the scope the OpenCode plugin's refusal keys on: AGENTS.md as
// the core's repoSigns reads its cover (shared/reposigns.ts, shared/cover.ts,
// shared/coverblock.ts): our cover block or the older flat keys, never another delivery's cover,
// which our stamp line alone does not make ours. Our stamp line alone, a start hook or a rituals
// plugin marks nothing. Elsewhere it prints nothing. The test holds this copy to that reader on
// every fixture.
/* global DENY, COVER_FILE, COVER_ROOT, FLAT_KEYS, OWN_STAMPS, OTHER_STAMP */
let input = "";
process.stdin
  .on("data", (chunk) => (input += chunk))
  .on("end", () => {
    const fs = require("fs"),
      path = require("path");
    const read = (file) => {
      try {
        return fs.readFileSync(file, "utf8");
      } catch {
        return null;
      }
    };
    const exists = (file) => {
      try {
        fs.statSync(file);
        return true;
      } catch {
        return false;
      }
    };
    // The repository: the nearest directory upward with a .git entry; none: silence.
    let root = process.cwd();
    try {
      const event = JSON.parse(input);
      if (typeof event.cwd === "string" && event.cwd) root = event.cwd;
    } catch {}
    for (root = path.resolve(root); !exists(path.join(root, ".git"));) {
      const up = path.dirname(root);
      if (up === root) return;
      root = up;
    }
    // The front matter's keys and blocks, read as shared/coverblock.ts reads them.
    const unquote = (v) => {
      const s = v.trim();
      if (s.length >= 2 && s[0] === "'" && s.endsWith("'"))
        return s.slice(1, -1).replace(/''/g, "'");
      if (s.length >= 2 && s[0] === '"' && s.endsWith('"')) {
        try {
          return String(JSON.parse(s));
        } catch {
          return s.slice(1, -1);
        }
      }
      return s;
    };
    const KEY = String.raw`('(?:[^']|'')*'|"(?:[^"\\]|\\.)*"|[^\s'"#][^:]*?)`;
    const PAIR = new RegExp(String.raw`^\s*${KEY}\s*:(?:\s+(.*))?$`);
    const TOP = new RegExp(String.raw`^${KEY}\s*:(?:\s+#.*)?\s*$`);
    const CHILD = new RegExp(String.raw`^\s+${KEY}\s*:(?:\s+(.*))?$`);
    const bare = (v) =>
      unquote(
        /^['"]/.test(v.trim())
          ? v.trim().replace(/^('(?:[^']|'')*'|"(?:[^"\\]|\\.)*")\s+#.*$/, "$1")
          : v.replace(/\s+#.*$/, ""),
      );
    const frontLines = (text) => {
      const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/);
      if (lines[0]?.trim() !== "---") return null;
      const end = lines.findIndex((l, i) => i > 0 && l.trim() === "---");
      return end < 0 ? null : lines.slice(1, end);
    };
    const blocks = (text) => {
      const out = new Map();
      let open = null;
      for (const line of frontLines(text) ?? []) {
        if (/^\s*(#|$)/.test(line)) continue;
        const top = TOP.exec(line),
          child = open && CHILD.exec(line);
        if (top) out.set(unquote(top[1]), (open = new Map()));
        else if (open && child) open.set(unquote(child[1]), bare(child[2] ?? ""));
        else open = null;
      }
      return out;
    };
    const pairs = (text) => {
      const lines = frontLines(text);
      if (!lines) return null;
      const out = new Map();
      let last = null;
      for (const line of lines) {
        const kv = PAIR.exec(line);
        if (kv) out.set((last = unquote(kv[1])), kv[2] ?? "");
        else if (last !== null && /^\s+[^\s#]/.test(line))
          out.set(last, out.get(last) + "\n" + line.trim());
      }
      return out;
    };
    // The cover, cancelled by another delivery's stamp (shared/cover.ts: stampOf, hasCover).
    const text = read(path.join(root, COVER_FILE));
    let cover = false;
    if (text !== null) {
      const all = blocks(text),
        block = all.get(COVER_ROOT);
      const own =
        (block && /^\d+$/.test(block.get("contract") ?? "") && !!block.get("stamp")) ||
        OWN_STAMPS.some((re) => re.test(text));
      const foreign =
        !own &&
        !block &&
        ([...all].some(([k, b]) => k !== COVER_ROOT && b.has("contract")) ||
          OTHER_STAMP.test(text));
      const flat = pairs(text);
      cover = !foreign && (!!block || (!!flat && FLAT_KEYS.some((k) => flat.has(k))));
    }
    if (!cover) return;
    process.stdout.write(JSON.stringify(DENY));
  });
