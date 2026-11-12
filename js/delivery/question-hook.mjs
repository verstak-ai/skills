// The Claude Code plugin's refusal of AskUserQuestion (graph @nks/nks-dev, nodes #10397, #10020):
// the readable source of the PreToolUse command in hooks/hooks.json. Never imported: it runs as
// the script of `node -e`, self-standing, so a plugin without its built files still refuses.
// scripts/build-question-hook.mjs joins it into that command and puts the answer in for DENY -
// the deny object with QUESTIONS.claude; js/tests/question-refusal.test.mjs holds the two equal.
// Full-line comments only (the generator drops them); every statement ends in a semicolon.
//
// It refuses only in a repository that is ours as the door counts it: the core's repoSigns
// verdict aligned or partial (shared/reposigns.ts, shared/cover.ts, shared/coverblock.ts): our
// cover block, the older flat keys, our stamp lines, our start hook or rituals plugin; another
// delivery's cover without our hook is not ours. Elsewhere it prints nothing. The test holds
// this copy to repoSigns on every fixture.
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
    // The cover and the stamp (shared/cover.ts: stampOf, hasCover; COVER of the delivery).
    const text = read(path.join(root, "AGENTS.md"));
    let cover = false,
      stamp = false,
      foreign = false;
    if (text !== null) {
      const all = blocks(text),
        block = all.get("verstak");
      const own =
        (block && /^\d+$/.test(block.get("contract") ?? "") && !!block.get("stamp")) ||
        /\((?:verstak align:\s*contract\s*`?(\d+)`?\s*,\s*stamped|verstakify:\s*contract\b)/.test(
          text,
        );
      foreign =
        !own &&
        !block &&
        ([...all].some(([k, b]) => k !== "verstak" && b.has("contract")) ||
          /^[\s*_]*\((?!verstak align:|verstakify:)[^()\n]*?:\s*(?:contract|\u043a\u043e\u043d\u0442\u0440\u0430\u043a\u0442)\s*`?\d+/m.test(
            text,
          ));
      stamp = !!own;
      const flat = pairs(text);
      cover = !foreign && (!!block || (!!flat && (flat.has("Graph") || flat.has("Agent role"))));
    }
    // Our start hook in .claude/settings.json, or the OpenCode rituals plugin (REPO_SIGNS).
    let hooked = false;
    try {
      const starts = JSON.parse(read(path.join(root, ".claude/settings.json")) ?? "null")?.hooks
        ?.SessionStart;
      hooked =
        Array.isArray(starts) &&
        starts.some(
          (e) =>
            Array.isArray(e?.hooks) &&
            e.hooks.some(
              (h) =>
                typeof h?.command === "string" &&
                /\bverstak skill\b[^.]*\bStart section\b/.test(h.command),
            ),
        );
    } catch {}
    if (exists(path.join(root, ".opencode/plugins/verstak-rituals.js"))) hooked = true;
    if (foreign && !hooked) return;
    if (!(cover || stamp || hooked)) return;
    // eslint-disable-next-line no-undef
    process.stdout.write(JSON.stringify(DENY));
  });
