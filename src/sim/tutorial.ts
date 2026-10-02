import { SYDNEY } from "./data/sydney";
import { Session } from "./session";

// The guided first game: you at Central against "Western Rail", a sleepy rival that owns the
// T1 Western Line out to Ashfield and runs one train on it. Easy to undercut and capture.
export function createTutorial(name: string): Session {
  const s = Session.create(
    SYDNEY,
    [
      { id: "P1", name, color: "red", hub: "central" },
      { id: "P2", name: "Western Rail", color: "blue", hub: "parramatta" }
    ],
    { roundMinutes: 3600, events: 0, winShare: 1, emptyToCapture: 2 }
  );
  const st = s.state;
  for (const sec of ["granville~parramatta", "granville~lidcombe", "lidcombe~strathfield", "ashfield~strathfield"]) st.sections[sec].owner = "P2";
  st.netVersion++;
  st.players[1].money = 100000;
  s.command("P2", { type: "createLine", stations: ["parramatta", "granville", "lidcombe", "strathfield", "ashfield"] });
  return s;
}
