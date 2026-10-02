import { SYDNEY } from "./data/sydney";
import { sectionId } from "./network";
import { Session } from "./session";

// The guided first game: you at Central against "Western Rail", a sleepy rival that owns the
// T1 Western Line out to Ashfield and runs one train on it. Easy to undercut and capture.
export function createTutorial(name: string): Session {
  const s = Session.create(
    SYDNEY,
    [
      { id: "P1", name, color: "red", hub: SYDNEY.hubs[0] },
      { id: "P2", name: "Western Rail", color: "blue", hub: SYDNEY.hubs[1] }
    ],
    { roundMinutes: 3600, events: 0, winShare: 1, emptyToCapture: 2 }
  );
  const st = s.state;
  const western = ["parramatta", "granville", "lidcombe", "strathfield", "ashfield"];
  for (let i = 0; i < western.length - 1; i++) st.sections[sectionId(western[i], western[i + 1])].owner = "P2";
  st.netVersion++;
  st.players[1].money = 100000;
  s.command("P2", { type: "createLine", stations: western });
  return s;
}
