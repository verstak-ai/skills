// The delivery layer: the core (js/) takes everything that tells this delivery
// apart through this one path. Order is by file path: language, server prose forms
// (patterns/), product name, protocol, version, words (words/).
export { DEFAULT_LANG, type Lang, langOfServer, LANGS } from "./lang.ts";
export { BOARD_FORM, BOARD_HEADER } from "./patterns/board.ts";
export { CASE_EXIT_CLOSED } from "./patterns/caseexit.ts";
export { ACTION_LIST_RE, SEAT_GONE_RE, UNATTRIBUTED_RE } from "./patterns/channel.ts";
export { SERVER_CHOICE } from "./patterns/config.ts";
export { NOTICE_MARK } from "./patterns/deliver.ts";
export { LAUNCH_LINE } from "./patterns/launch.ts";
export { SAT_LOGIN_RE, SAT_OLD_FLAG_RE } from "./patterns/satprobe.ts";
export {
  BRIDGE_FILE,
  BRIDGE_NAME,
  BRIDGE_SKILL,
  CLIENTS,
  CONNECTOR_PATTERN,
  DEFAULT_SERVER_URL,
  ENV_PREFIX,
  envName,
  GLOBAL_PREFIX,
  HOME_BRIDGE_FILE,
  HOME_DIR,
  HOOKS_SECTION,
  PLUGIN_COPY_FILE,
  PLUGIN_FILE,
  PLUGIN_NAME,
  PRODUCT,
  RUNTIME_PREFIX,
  SATELLITE_CODE,
  SERVER_URLS,
  SKILL_SET,
  SKILL_STAMP_FILE,
  SUB_ENTRY_PREFIX,
} from "./product.ts";
export { ID_PREFIX, LOGGERS, method, SERVER_PROTOCOL, tool, TOOL_PREFIX } from "./protocol.ts";
export { BUILD_MARK, CHANNEL_MARK, VERSION } from "./version.ts";
export { ABSORB, type AbsorbWords } from "./words/absorb.ts";
export { APPSERVER, type AppServerWords } from "./words/appserver.ts";
export { ASK, type AskWords } from "./words/asks.ts";
export { BACKLOG, type BacklogWords } from "./words/backlog.ts";
export { BRIDGE_CLIENT, type BridgeClientWords } from "./words/bridge-client.ts";
export { CALL, type CallWords } from "./words/call.ts";
export { CHANNEL, type ChannelWords } from "./words/channel.ts";
export { CLI, type CliWords } from "./words/cli.ts";
export { DEAF, type DeafWords } from "./words/deaf.ts";
export { DOCTOR, type DoctorWords } from "./words/doctor.ts";
export { HARNESS, type HarnessWords } from "./words/doctorharness.ts";
export { DOOR, type DoorWords } from "./words/door.ts";
export {
  CASE_LINE,
  type CaseLineWords,
  FRAME_TEXT,
  type FrameTextWords,
} from "./words/frame-text.ts";
export { HANDOFF, type HandoffWords } from "./words/handoff.ts";
export { HEARING, type HearingWords } from "./words/hearing.ts";
export { HOLD, type HoldWords } from "./words/hold.ts";
export { HOOK, type HookWords } from "./words/hook.ts";
export { LAUNCH, type LaunchWords } from "./words/launch.ts";
export { LEAD, type LeadWords } from "./words/leads.ts";
export { LEAVE, type LeaveWords } from "./words/leave.ts";
export { LISTEN, type ListenWords } from "./words/listen.ts";
export { LOST, type LostWords } from "./words/lostplaces.ts";
export { MOMENT, type MomentWords } from "./words/moment.ts";
export { NAMES, type NameWords } from "./words/names.ts";
export { NARROW, type NarrowWords } from "./words/narrow.ts";
export {
  CALLBACK,
  type CallbackWords,
  DEVICE_CLIENT,
  type DeviceClientWords,
} from "./words/oauth.ts";
export { OPENCODE, type OpencodeWords } from "./words/opencode.ts";
export { OPENCODE_KEEP, type OpencodeKeepWords } from "./words/opencode-keep.ts";
export { OWNER, type OwnerWords } from "./words/owner.ts";
export { PI, type PiWords } from "./words/pi.ts";
export { PLACES, type PlacesWords } from "./words/places.ts";
export { PLUGIN, type PluginWords } from "./words/plugin.ts";
export { REALMS, type RealmsWords } from "./words/realms.ts";
export { RELEASES, type ReleasesWords } from "./words/releases.ts";
export { RESUME, type ResumeWords } from "./words/resume.ts";
export { RITUALS, type RitualWords } from "./words/rituals.ts";
export {
  ROOM,
  ROOM_AUTO,
  ROOM_REL,
  type RoomAutoWords,
  type RoomRelWords,
  type RoomWords,
  VERDICT,
  type VerdictWords,
} from "./words/rooms.ts";
export { RUN_END, type RunEndWords } from "./words/runend.ts";
export { SATELLITE, type SatelliteWords } from "./words/satellite.ts";
export { SAT_PROBE, type SatProbeWords } from "./words/satprobe.ts";
export { SEPARATE, type SeparateWords } from "./words/separate.ts";
export { STALE, type StaleWords } from "./words/stalebatch.ts";
export { STAND, type StandWords } from "./words/stand.ts";
export { STANDING, type StandingWords } from "./words/standing.ts";
export { STANDINGS, type StandingsWords } from "./words/standings.ts";
export { STAND_MISS, type StandMissWords } from "./words/standmiss.ts";
export { STAND_TOOL, type StandToolWords } from "./words/standtool.ts";
export { STATUS, type StatusWords } from "./words/status.ts";
export { STATUS_POST, type StatusPostWords } from "./words/statuspost.ts";
export { SUBAGENT, type SubagentWords } from "./words/subagents.ts";
export { SUSPEND, type SuspendWords } from "./words/suspend.ts";
export { THIN, type ThinWords } from "./words/thin.ts";
export { UNNAMED, type UnnamedWords } from "./words/unnamed.ts";
export { UPDATE, type UpdateWords } from "./words/update.ts";
export { USAGE, type UsageWords } from "./words/usage.ts";
export { WATCHDOG, type WatchdogWords } from "./words/watchdog.ts";
