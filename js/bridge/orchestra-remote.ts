// SSH config is a machine source, not an alias spelling heuristic (#7517, #9968).
type Runner = (
  args: string[],
  timeout: number,
  command: "ssh",
) => Promise<{ code: number | string; out: string }>;
const HOST = /^[a-z0-9][a-z0-9.-]*$/i;

/** null: not SSH; code: an SSH identity could not be established. Never expose config output. */
export async function sshRepository(
  remote: string,
  run: Runner,
): Promise<string | { code: string } | null> {
  let host: string;
  let path: string;
  let user: string;
  let port = "";
  const url = remote.trim();
  if (/^ssh:\/\//i.test(url)) {
    try {
      const u = new URL(url);
      if (u.password || u.search || u.hash) return { code: "ssh_remote_invalid" };
      host = u.hostname;
      user = u.username;
      port = u.port;
      path = u.pathname.replace(/^\//, "");
    } catch {
      return { code: "ssh_remote_invalid" };
    }
  } else {
    if (/^[a-z][a-z0-9+.-]*:\/\//i.test(url)) return null;
    const m = /^(?:([^@/:]+)@)?([^/:]+):(.+)$/.exec(url);
    if (!m) return null;
    [, user = "", host, path] = m;
  }
  if (!HOST.test(host) || (user && !/^[a-z0-9._-]+$/i.test(user)) || !path || /[\s?#]/.test(path))
    return { code: "ssh_remote_invalid" };
  const args = ["-G", ...(port ? ["-p", port] : []), ...(user ? ["-l", user] : []), "--", host];
  const result = await run(args, 10_000, "ssh");
  if (result.code !== 0) return { code: "ssh_config_unreadable" };
  const names = [...result.out.matchAll(/^hostname\s+(\S+)\s*$/gim)].map((m) => m[1]);
  if (names.length !== 1 || !HOST.test(names[0])) return { code: "ssh_hostname_unverified" };
  return `${names[0].toLowerCase()}/${path.replace(/\/+$/, "").replace(/\.git$/, "")}`;
}
