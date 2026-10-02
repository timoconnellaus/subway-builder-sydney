import type { MapDef } from "../types";
import { SYDNEY, SYDNEY_WATER } from "./sydney";

// Greater Sydney: the classic map plus the Central Coast, Wollongong, the Blue Mountains,
// the Richmond line, Olympic Park and Leppington.
export const GREATER: MapDef = {
  id: "greater",
  name: "Greater Sydney",
  bounds: { lon0: 150.24, lon1: 151.48, lat0: -33.36, lat1: -34.5 },
  hubs: SYDNEY.hubs,
  hubBonus: SYDNEY.hubBonus,
  events: [
    ...SYDNEY.events!,
    { station: "katoomba", title: "Winter Magic festival in Katoomba", emoji: "❄️" },
    { station: "wollongong", title: "Dragons game at WIN Stadium", emoji: "🏉" },
    { station: "gosford", title: "Mariners game in Gosford", emoji: "⚽" }
  ],
  stations: [
    ...SYDNEY.stations,
    { id: "olympicpark", name: "Olympic Park", lon: 151.069, lat: -33.847, pop: 5, jobs: 30, label: "t" },
    { id: "leppington", name: "Leppington", lon: 150.808, lat: -33.954, pop: 35, jobs: 4, label: "l" },
    { id: "schofields", name: "Schofields", lon: 150.87, lat: -33.698, pop: 40, jobs: 5 },
    { id: "richmond", name: "Richmond", lon: 150.752, lat: -33.6, pop: 25, jobs: 8 },
    { id: "springwood", name: "Springwood", lon: 150.567, lat: -33.698, pop: 25, jobs: 5 },
    { id: "katoomba", name: "Katoomba", lon: 150.312, lat: -33.712, pop: 25, jobs: 10 },
    { id: "berowra", name: "Berowra", lon: 151.15, lat: -33.624, pop: 15, jobs: 3 },
    { id: "woywoy", name: "Woy Woy", lon: 151.324, lat: -33.486, pop: 30, jobs: 5, label: "l" },
    { id: "gosford", name: "Gosford", lon: 151.343, lat: -33.425, pop: 40, jobs: 25 },
    { id: "waterfall", name: "Waterfall", lon: 151.0, lat: -34.135, pop: 5, jobs: 1 },
    { id: "thirroul", name: "Thirroul", lon: 150.919, lat: -34.316, pop: 20, jobs: 4, label: "l" },
    { id: "wollongong", name: "Wollongong", lon: 150.894, lat: -34.426, pop: 60, jobs: 35, label: "l" }
  ],
  sections: [
    ...SYDNEY.sections,
    { a: "lidcombe", b: "olympicpark", landmark: "Olympic Park sprint" },
    { a: "glenfield", b: "leppington", landmark: "T5 Leppington Line" },
    { a: "blacktown", b: "schofields", landmark: "T1 Richmond branch" },
    { a: "schofields", b: "richmond", landmark: "T1 Richmond branch" },
    { a: "penrith", b: "springwood", landmark: "Blue Mountains Line" },
    { a: "springwood", b: "katoomba", landmark: "Blue Mountains Line" },
    { a: "hornsby", b: "berowra", landmark: "Central Coast Line" },
    { a: "berowra", b: "woywoy", landmark: "Hawkesbury River Bridge" },
    { a: "woywoy", b: "gosford", landmark: "Central Coast Line" },
    { a: "sutherland", b: "waterfall", landmark: "South Coast Line" },
    { a: "waterfall", b: "thirroul", landmark: "Illawarra escarpment" },
    { a: "thirroul", b: "wollongong", landmark: "South Coast Line" }
  ],
  water: {
    ocean: [
      [152.6, -32.8], [151.46, -32.8], [151.45, -33.42], [151.43, -33.47], [151.4, -33.51], [151.36, -33.54], [151.33, -33.56],
      [151.32, -33.6], [151.315, -33.66], [151.305, -33.7], ...SYDNEY_WATER.ocean.slice(4, 22),
      [151.168, -34.068], [151.12, -34.15], [151.06, -34.22], [151.0, -34.28], [150.95, -34.33], [150.925, -34.38], [150.91, -34.43],
      [150.89, -34.48], [150.87, -34.55], [150.85, -35.2], [152.6, -35.2]
    ],
    ribbons: [
      SYDNEY_WATER.harbour,
      SYDNEY_WATER.middleHarbour,
      ...SYDNEY_WATER.rivers,
      // Broken Bay and the Hawkesbury River
      [[151.33, -33.56, 0.012], [151.27, -33.555, 0.01], [151.22, -33.545, 0.006], [151.18, -33.535, 0.004], [151.12, -33.53, 0.003], [151.06, -33.52, 0.0025], [151.0, -33.51, 0.002], [150.94, -33.5, 0.0015]],
      // Brisbane Water up to Gosford
      [[151.315, -33.555, 0.006], [151.32, -33.51, 0.006], [151.33, -33.47, 0.005], [151.34, -33.44, 0.003]],
      // Pittwater
      [[151.31, -33.57, 0.006], [151.305, -33.61, 0.006], [151.3, -33.65, 0.003]],
      // Port Hacking
      [[151.165, -34.075, 0.006], [151.12, -34.07, 0.004], [151.08, -34.065, 0.002]],
      // Nepean River near Penrith
      [[150.68, -33.6, 0.0015], [150.675, -33.68, 0.0015], [150.68, -33.75, 0.0015], [150.69, -33.83, 0.0015]]
    ]
  }
};
