import { CLIENTS, envName } from "../delivery/index.ts";

// Own bridge clients that read a handshake refusal with a login link themselves and
// wait for the login, repeating the handshake: the OpenCode plugin and the surface
// export (`make surface`) (graph @nks/nks-dev, nodes #4664, #4790). Every other
// handshake is a harness's. The pi extension reads the refusal too but is left out
// on purpose (js/extension/tools.ts, node #4795).
export const OPENCODE_CLIENT = CLIENTS.opencode;
export const SURFACE_CLIENT = "export-surface"; // scripts/export-surface.mjs, literal: .mjs cannot import TS
export const OWN_CLIENTS: ReadonlySet<string> = new Set([OPENCODE_CLIENT, SURFACE_CLIENT]);

// Clients that get the standing frame as an MCP notification rather than through a
// local watchdog (graph @nks/nks-dev, node #4895).
export const PI_CLIENT = CLIENTS.pi;
export const NOTIFIED_CLIENTS: ReadonlySet<string> = new Set([PI_CLIENT, OPENCODE_CLIENT]);

// Host version for attrs.harness_version (graph @nks/nks-dev, node #6226): the plugin
// and the extension pass the host's version in this variable at launch.
export const HARNESS_VERSION_ENV = envName("HARNESS_VERSION");
// Skill set root for attrs.skills (#6226): a bridge outside the set learns it only from this variable.
export const SKILLS_ROOT_ENV = envName("SKILLS_ROOT");
// A set is recognised by the delivery bridge inside it (bridge/skillset.ts, opencode/skillread.ts, #6847).
export const HOSTED_CLIENTS: ReadonlySet<string> = new Set([PI_CLIENT, OPENCODE_CLIENT]);
