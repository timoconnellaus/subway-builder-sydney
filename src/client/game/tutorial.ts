import type { LineView, Snapshot } from "../../sim";

// Guided first game. Each step has a check that looks at the latest snapshot; when it passes,
// the coach moves on. Steps also say which sections to pulse on the map.

export interface TutorialStep {
  title: string;
  text: string | ((s: Snapshot, you: string) => string);
  hint?: string[]; // section ids to pulse
  done(s: Snapshot, you: string): boolean;
}

const lineUsing = (s: Snapshot, you: string, a: string, b: string): LineView | undefined =>
  s.lines.find((l) => {
    if (l.owner !== you) return false;
    for (let i = 0; i < l.stations.length - 1; i++) {
      const x = l.stations[i];
      const y = l.stations[i + 1];
      if ((x === a && y === b) || (x === b && y === a)) return true;
    }
    return false;
  });

export const STEPS: TutorialStep[] = [
  {
    title: "Open your first track",
    text: "Tap the pulsing track between <b>Central</b> and <b>Redfern</b>, then press <b>Open</b>.",
    hint: ["central~redfern"],
    done: (s, you) => s.sections["central~redfern"]?.owner === you
  },
  {
    title: "Open some more",
    text: "Now open <b>Redfern – Ashfield</b> the same way.",
    hint: ["ashfield~redfern"],
    done: (s, you) => s.sections["ashfield~redfern"]?.owner === you
  },
  {
    title: "Run a line",
    text: "Press <b>New line</b>, tap <b>Central</b>, <b>Redfern</b> and <b>Ashfield</b>, then press <b>Create line</b>.",
    done: (s, you) => {
      // one line that runs Central – Redfern – Ashfield (either way round)
      const l = lineUsing(s, you, "central", "redfern");
      return !!l && l === lineUsing(s, you, "redfern", "ashfield");
    }
  },
  {
    title: "Add a train",
    text: "Tap your line in the panel and press <b>+</b> next to <b>Trains</b>. More trains means shorter waits.",
    done: (s, you) => s.lines.some((l) => l.owner === you && l.trains >= 2)
  },
  {
    title: "Earn some fares",
    text: "Watch the dots on the platforms: they're passengers. Each one pays your fare when they board. Earn <b>$150</b>.",
    done: (s, you) => (s.players.find((p) => p.id === you)?.income ?? 0) >= 150
  },
  {
    title: "Meet a rival",
    text: "<b>Western Rail</b> (blue) owns <b>Ashfield – Strathfield</b>. You can run trains on their track. Tap your line, press <b>Extend from Ashfield</b>, then tap <b>Strathfield</b>.",
    hint: ["ashfield~strathfield"],
    done: (s, you) => !!lineUsing(s, you, "ashfield", "strathfield")
  },
  {
    title: "Win their passengers",
    text: (s, you) => {
      const theirs = s.lines.find((l) => l.owner !== you);
      return `Passengers wait for a cheaper train if it's coming soon. Western Rail charges <b>$${(theirs?.fare ?? 2).toFixed(2)}</b>. Tap your line, make your fare <b>lower</b>, and run <b>3 or more trains</b>.`;
    },
    hint: ["ashfield~strathfield"],
    done: (s, you) => {
      const mine = lineUsing(s, you, "ashfield", "strathfield");
      const theirs = s.lines.find((l) => l.owner !== you);
      return !!mine && !!theirs && mine.fare < theirs.fare && mine.trains >= 3;
    }
  },
  {
    title: "Take the track",
    text: (s) =>
      `When nobody boards Western Rail's train on that section ${s.settings.emptyToCapture} times in a row, it's yours. Watch the dots on the track fill up…`,
    hint: ["ashfield~strathfield"],
    done: (s, you) => s.sections["ashfield~strathfield"]?.owner === you
  },
  {
    title: "You did it!",
    text: "That's the whole game: open track, run lines, and steal track with cheaper, more frequent trains. Own 60% of the network to win. Keep going, or head to the menu and play the bots.",
    done: () => false
  }
];
