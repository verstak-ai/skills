// Session-scoped machine inventory (graph @nks/nks-dev, nodes #7495, #6478).
import { apiBase } from "../shared/channel.ts";
import { runIn } from "../shared/scope.ts";
import { safePlace, type SessionSnapshot } from "../shared/snapshot.ts";
import { harnessName, notifiedClient } from "./client.ts";
import { CFG } from "./config.ts";
import { doors, heldPlaces, holdsChannel } from "./hold.ts";
import { sessionOfBridge } from "./holdrecord.ts";
import { H } from "./holdstate.ts";
import { observedPlaceAttrs } from "./placefields.ts";
import { extraPlaces } from "./places.ts";
import { sentPulse } from "./pulse.ts";
import { type BridgeSession } from "./session.ts";
import { skillsAttr } from "./skillset.ts";
import { announcedSkills } from "./skillwatch.ts";
import { state } from "./transport.ts";

export function sessionSnapshot(
  local_id: string,
  engine: BridgeSession,
  thin_pid: number,
  attached: boolean,
  build: string,
): SessionSnapshot {
  const inspect = (): SessionSnapshot => {
    const installed = skillsAttr();
    const declared = state.standing ? announcedSkills(state.standing) : undefined;
    const differs = (skills: typeof declared): boolean =>
      !!skills && JSON.stringify(skills) !== JSON.stringify(installed);
    return {
      local_id,
      thin_pid,
      attached,
      build,
      skills: declared,
      installed_skills: installed,
      skills_mismatch: differs(declared),
      cwd: engine.origin?.cwd ?? "",
      server: CFG.serverUrl,
      ...(H.currentUrl ? { api: apiBase(H.currentUrl) } : {}),
      harness: harnessName(),
      harness_session: sessionOfBridge(),
      places: heldPlaces().map((p) => {
        const standing = p.primary
          ? state.standing
          : extraPlaces().find((x) => x.door.key === p.key)?.standing;
        const door = doors().find((d) => d.key === p.key);
        const attrs = observedPlaceAttrs();
        const last = engine.lastWork();
        return safePlace({
          name: standing?.name,
          realm: standing?.realm,
          karta: standing?.karta,
          primary: p.primary,
          standing_id: door?.standingId ?? undefined,
          address: door?.address ?? undefined,
          satellite_of: attrs.satellite_of,
          listening:
            !H.unheard && holdsChannel() && (notifiedClient() ? attached : !!door?.clients.size),
          ...(last ? { last_work_at: new Date(last).toISOString() } : {}),
          usage: attrs.usage,
          pulse: sentPulse(),
          skills: standing ? announcedSkills(standing) : undefined,
          skills_mismatch: differs(standing ? announcedSkills(standing) : undefined),
        });
      }),
    };
  };
  return engine.scope ? runIn(engine.scope, inspect) : inspect();
}
