export interface Tokens {
  access_token: string;
  refresh_token?: string;
  expires_at?: number | null;
  refresh_not_before?: number | null;
  refresh_expires_at?: number | null;
  /** the client this grant was issued to — the one its refresh must present */
  client_id?: string;
  /** born of sign-in by code: the audience is that client's default, not the resource asked for */
  by_code?: boolean;
}

export interface Client {
  client_id: string;
  redirect_uri?: string;
  /** when this dynamic registration was made (server-corrected clock) */
  registered_at?: number;
}

export interface AsMetadata {
  authorization_endpoint: string;
  token_endpoint: string;
  registration_endpoint?: string;
  [k: string]: unknown;
}

export interface Meta {
  as: AsMetadata;
  resource: string;
  scope: string | null;
}

export interface Store {
  client?: Client | null;
  tokens?: Tokens | null;
  meta?: Meta | null;
  clock_skew_ms?: number;
  server_url?: string;
  updated_at?: string;
}

/** The machine's memory of a refused grant: since when, in whose words, when to knock again. */
export interface GrantState {
  refused_since?: number;
  refused_at?: number;
  reason?: string;
  early_refused_until?: number;
}

/* eslint-disable @typescript-eslint/no-explicit-any -- JSON-RPC payloads come without a schema */
export interface JsonRpcMessage {
  jsonrpc?: string;
  id?: string | number | null;
  method?: string;
  params?: any;
  result?: any;
  error?: any;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export interface Config {
  serverUrl: string;
  timeoutMs: number;
  authDir: string;
  clientName: string;
  noBrowser: boolean;
  debug: boolean;
  scope: string | null;
  resource: string | null;
  staticClientId: string | null;
  /** The device-code sign-in client (oauth/devicecode.ts); null — the default one. */
  deviceClientId: string | null;
  /** Device-code sign-in with no server client, by dynamic registration (oauth/devicecode.ts); explicit only. */
  deviceRegister: boolean;
  /** A personal access token: with it the bridge never goes to OAuth. */
  pat: string | null;
  /** Where the PAT came from — variable name or file path; for the human in refusals and doctor. */
  patSource: string | null;
  /** Where the server address came from: argument, env, the choice file beside the grant, or default. */
  serverSource: "argument" | "env" | "file" | "default";
  /** A satellite bridge (satellite.ts): a seat for a subagent run — no hold record, no hook, short ttl. */
  satellite: boolean;
  /** `--tools`: the tool set the harness sees (narrow.ts); null — the default set. */
  tools: Set<string> | null;
}
