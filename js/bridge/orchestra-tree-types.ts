// Own detached trees belong to an exact invite and durable creation intent (#7517).
export interface TreeIdentity {
  gitDir: string;
  pathDev: number;
  pathIno: number;
  gitDev: number;
  gitIno: number;
  commonDev: number;
  commonIno: number;
}
export interface RunTree {
  operation: string;
  source: string;
  path: string;
  commonDir: string;
  baseOID: string;
  realm: string;
  room: string;
  invite: number;
  state: "creating" | "ready" | "ambiguity" | "retained" | "removing" | "removed";
  identity?: TreeIdentity;
  incarnation?: string;
  exit?: string;
  why?: string;
}
