// Seat fields named on every take and register (graph nks-dev: #5174, #6226): model —
// the agent's model without the vendor prefix; attrs — the build marker {name, version,
// stamp}, the installed skill set by the same triple, the harness and the host version, and
// what a stop order for the seat does (stop: {effect, ack}).
// attrs are replaced whole by the server, so the bridge always sends its full set:
// a partial write would erase its own build marker.
import { BRIDGE_NAME, SERVER_LOCALE } from "../delivery/index.ts";
import { lang } from "../shared/lang.ts";
import { scoped } from "../shared/scope.ts";
import { VERSION } from "../shared/version.ts";
import { BUILD } from "./build.ts";
import { harnessName, harnessVersion } from "./client.ts";
import { CFG } from "./config.ts";
import { seatField } from "./fields.ts";
import { normKarta, normName } from "./names.ts";
import { confirmsHalts } from "./orderhalt.ts";
import { extraOf } from "./places.ts";
import { otherRealm } from "./realms.ts";
import { installedSkills } from "./skillwatch.ts";
import { log } from "./streams.ts";
import { state } from "./transport.ts";

// Per session (shared/scope.ts): the machine daemon holds seats of different sessions.
const P = scoped(() => ({
  model: "",
  /** Session usage (usage.ts, #6271): the last snapshot rides in every register. */
  usage: null as object | null,
  satelliteOf: "",
  satelliteOfId: "",
  localeWarned: false,
}));
// The agent's own attrs, per the seat they were named for: they ride in its repeated
// registers and never move to another seat.
const extras = scoped(() => new Map<string, Record<string, unknown>>());
type Place = { realm?: unknown; karta?: unknown; name?: unknown };
// Normalized like the binding: #931 and 931 alike, the name trimmed.
const placeKey = (p: Place): string =>
  `${String(p.realm ?? "")}|${normKarta(p.karta)}|${normName(p.name)}`;

export function rememberUsage(u: object): void {
  P.usage = u;
}

/** Read-only snapshot fields; inspecting a place never checks the installed set. */
export function observedPlaceAttrs(): { usage: object | null; satellite_of: string } {
  return { usage: P.usage, satellite_of: P.satelliteOf };
}

/**
 * The caller's seat of a satellite bridge (satellite.ts): the address rides in attrs,
 * the id in the satellite_of field of connect, mint and register (#6064); never outside satellite mode.
 */
export function noteSatelliteOf(address: string, id: string | null): void {
  P.satelliteOf = address;
  P.satelliteOfId = CFG.satellite && id ? id : "";
}

/** The model from the stand call, without the vendor prefix. */
export function rememberModel(m: unknown): void {
  if (typeof m === "string" && m.trim()) P.model = m.trim().replace(/^[^/]*\//, "");
}

/**
 * The model of a stand call. A satellite's is the harness's (#7591): none named means none
 * known, so the earlier one goes rather than being published again; the own seat keeps it.
 */
export function rememberStandModel(m: unknown): void {
  if (CFG.satellite) P.model = "";
  rememberModel(m);
}

/** A satellite's seat with no model known: register alone keeps the earlier one (modelclear.ts). */
export const satelliteWithoutModel = (): boolean => CFG.satellite && !P.model;

/**
 * What a stop order for this seat does (stoporder.ts): "agent" — the session's main seat, its
 * stop stops the agent; "seat" — a seat beside on the held channel (another graph than the main
 * one, as stand.ts and call.ts tell it), it goes alone — a satellite's too.
 * ack — whether stopped is the harness's confirmed stop or the bridge's word given (orderhalt.ts).
 */
function stopAttrs(place: Place): { effect: "agent" | "seat"; ack: "confirmed" | "word" } {
  const prim = state.standing;
  // A seat already held beside stays one even when the main binding is lost (#5168). A
  // satellite's first seat is its own main one; its seat of another graph is beside it.
  const beside =
    (!!prim && otherRealm(place.realm, prim.realm)) ||
    !!extraOf(place.realm, place.karta, place.name);
  return { effect: beside ? "seat" : "agent", ack: confirmsHalts() ? "confirmed" : "word" };
}

/** Seat fields for connect and register: always the full set. */
export function placeFields(
  place: Place = {},
  freshSkills = false,
): {
  model?: string;
  satellite_of?: string;
  locale?: string;
  attrs: Record<string, unknown>;
} {
  const harness = harnessName();
  const extra = extras.get(placeKey(place)) ?? {};
  const { model, usage, satelliteOf, satelliteOfId } = P;
  const locale = SERVER_LOCALE[lang()];
  return {
    ...(model ? { model } : {}),
    // Seat language (#6080): asked only where the layer names a locale; otherwise the server default decides.
    ...(locale ? { locale } : {}),
    ...(CFG.satellite && satelliteOfId ? { satellite_of: satelliteOfId } : {}),
    attrs: {
      ...extra,
      build: { name: BRIDGE_NAME, version: VERSION, stamp: BUILD.split("+")[1] ?? "" },
      skills: installedSkills(place, freshSkills),
      ...(harness ? { harness, harness_version: harnessVersion() } : {}),
      ...(satelliteOf ? { satellite_of: satelliteOf } : {}),
      ...(usage ? { usage } : {}),
      stop: stopAttrs(place),
    },
  };
}

const PLACE_ACTIONS = new Set(["connect", "mint", "register"]);

/**
 * The locale echo of connect/register: differing from the asked one — one log line per
 * session; no echo — an old api. The structured field (fields.ts) beats the prose.
 */
export function noteLocaleEcho(
  args: Record<string, unknown>,
  text: string,
  structured?: unknown,
): void {
  const asked = args.locale;
  if (typeof asked !== "string" || P.localeWarned) return;
  const action = String(args.action);
  // Only seat answers carry the field; other actions are judged by prose.
  const field = PLACE_ACTIONS.has(action) ? seatField(structured, action)?.locale : undefined;
  const echo = (
    field ?? /\blocale\b["']?\s*[:=]\s*["']?([a-z]{2})\b/i.exec(text)?.[1]
  )?.toLowerCase();
  if (!echo || echo === asked) return;
  P.localeWarned = true;
  log(`locale: asked ${asked}, the server answered ${echo} — its prose stays in ${echo}`);
}

/**
 * connect/mint/register called by the agent itself carry the same fields; its model and
 * attrs are kept, the build marker is written over them.
 */
export function withPlaceFields(args: Record<string, unknown>): Record<string, unknown> {
  if (!PLACE_ACTIONS.has(String(args.action))) return args;
  rememberModel(args.model);
  if (args.attrs && typeof args.attrs === "object" && !Array.isArray(args.attrs))
    extras.set(placeKey(args), { ...(args.attrs as Record<string, unknown>) });
  return { ...args, ...placeFields(args, true) };
}
