import type { MapDef } from "../types";

// A simplified version of the real Sydney Trains + Metro network.
// pop / jobs are rough thousands of residents and jobs in each station's catchment.
// Section minutes are filled in from distance when omitted.
export const SYDNEY: MapDef = {
  id: "sydney",
  name: "Sydney",
  bounds: { lon0: 150.66, lon1: 151.34, lat0: -33.655, lat1: -34.085 },
  hubs: ["central", "parramatta", "airport", "liverpool"],
  stations: [
    { id: "central", name: "Central", lon: 151.206, lat: -33.883, pop: 20, jobs: 300, icon: "city" },
    { id: "redfern", name: "Redfern", lon: 151.198, lat: -33.893, pop: 25, jobs: 30 },
    { id: "kingscross", name: "Kings Cross", lon: 151.222, lat: -33.875, pop: 30, jobs: 20 },
    { id: "bondijn", name: "Bondi Junction", lon: 151.25, lat: -33.891, pop: 35, jobs: 25 },
    { id: "randwick", name: "Randwick", lon: 151.241, lat: -33.914, pop: 45, jobs: 25 },
    { id: "northsydney", name: "North Sydney", lon: 151.207, lat: -33.84, pop: 20, jobs: 60 },
    { id: "chatswood", name: "Chatswood", lon: 151.181, lat: -33.797, pop: 35, jobs: 45 },
    { id: "macpark", name: "Macquarie Park", lon: 151.127, lat: -33.776, pop: 25, jobs: 60 },
    { id: "epping", name: "Epping", lon: 151.082, lat: -33.773, pop: 30, jobs: 10 },
    { id: "hornsby", name: "Hornsby", lon: 151.099, lat: -33.704, pop: 40, jobs: 15 },
    { id: "castlehill", name: "Castle Hill", lon: 151.003, lat: -33.731, pop: 50, jobs: 15 },
    { id: "rousehill", name: "Rouse Hill", lon: 150.915, lat: -33.682, pop: 45, jobs: 8 },
    { id: "rhodes", name: "Rhodes", lon: 151.087, lat: -33.83, pop: 25, jobs: 15 },
    { id: "strathfield", name: "Strathfield", lon: 151.094, lat: -33.872, pop: 35, jobs: 15 },
    { id: "ashfield", name: "Ashfield", lon: 151.125, lat: -33.888, pop: 35, jobs: 8 },
    { id: "lidcombe", name: "Lidcombe", lon: 151.047, lat: -33.864, pop: 30, jobs: 12 },
    { id: "granville", name: "Granville", lon: 151.012, lat: -33.832, pop: 30, jobs: 10 },
    { id: "parramatta", name: "Parramatta", lon: 151.005, lat: -33.817, pop: 40, jobs: 80, icon: "parramatta" },
    { id: "blacktown", name: "Blacktown", lon: 150.906, lat: -33.769, pop: 60, jobs: 20 },
    { id: "mtdruitt", name: "Mount Druitt", lon: 150.819, lat: -33.77, pop: 55, jobs: 10 },
    { id: "penrith", name: "Penrith", lon: 150.695, lat: -33.75, pop: 55, jobs: 25 },
    { id: "fairfield", name: "Fairfield", lon: 150.956, lat: -33.872, pop: 50, jobs: 12 },
    { id: "cabramatta", name: "Cabramatta", lon: 150.937, lat: -33.894, pop: 45, jobs: 8 },
    { id: "liverpool", name: "Liverpool", lon: 150.926, lat: -33.925, pop: 55, jobs: 30, icon: "liverpool" },
    { id: "glenfield", name: "Glenfield", lon: 150.893, lat: -33.971, pop: 25, jobs: 5 },
    { id: "campbelltown", name: "Campbelltown", lon: 150.817, lat: -34.064, pop: 55, jobs: 20 },
    { id: "bankstown", name: "Bankstown", lon: 151.035, lat: -33.918, pop: 50, jobs: 18 },
    { id: "campsie", name: "Campsie", lon: 151.103, lat: -33.91, pop: 40, jobs: 8 },
    { id: "sydenham", name: "Sydenham", lon: 151.167, lat: -33.915, pop: 20, jobs: 15 },
    { id: "mascot", name: "Mascot", lon: 151.187, lat: -33.923, pop: 30, jobs: 35 },
    { id: "airport", name: "Airport", lon: 151.178, lat: -33.937, pop: 2, jobs: 50, icon: "airport" },
    { id: "wollicreek", name: "Wolli Creek", lon: 151.155, lat: -33.928, pop: 25, jobs: 8 },
    { id: "rockdale", name: "Rockdale", lon: 151.137, lat: -33.952, pop: 40, jobs: 10 },
    { id: "hurstville", name: "Hurstville", lon: 151.102, lat: -33.967, pop: 45, jobs: 18 },
    { id: "sutherland", name: "Sutherland", lon: 151.057, lat: -34.031, pop: 40, jobs: 12 },
    { id: "cronulla", name: "Cronulla", lon: 151.152, lat: -34.056, pop: 30, jobs: 8 },
    { id: "revesby", name: "Revesby", lon: 151.015, lat: -33.952, pop: 35, jobs: 8 }
  ],
  sections: [
    { a: "central", b: "redfern", landmark: "Busiest track in Sydney" },
    { a: "central", b: "kingscross", landmark: "Eastern Suburbs Line" },
    { a: "kingscross", b: "bondijn", landmark: "Eastern Suburbs Line" },
    { a: "central", b: "randwick", landmark: "L2 Randwick Line" },
    { a: "central", b: "northsydney", landmark: "Harbour Bridge" },
    { a: "northsydney", b: "chatswood", landmark: "T1 North Shore Line" },
    { a: "chatswood", b: "macpark", landmark: "Metro North West" },
    { a: "macpark", b: "epping", landmark: "Metro North West" },
    { a: "chatswood", b: "hornsby", landmark: "T1 North Shore Line" },
    { a: "hornsby", b: "epping", landmark: "T9 Northern Line" },
    { a: "epping", b: "castlehill", landmark: "Metro North West" },
    { a: "castlehill", b: "rousehill", landmark: "Metro North West" },
    { a: "epping", b: "rhodes", landmark: "T9 Northern Line" },
    { a: "rhodes", b: "strathfield", landmark: "T9 Northern Line" },
    { a: "redfern", b: "ashfield", landmark: "T2 Inner West Line" },
    { a: "ashfield", b: "strathfield", landmark: "T2 Inner West Line" },
    { a: "strathfield", b: "lidcombe", landmark: "T1 Western Line" },
    { a: "lidcombe", b: "granville", landmark: "T1 Western Line" },
    { a: "granville", b: "parramatta", landmark: "T1 Western Line" },
    { a: "parramatta", b: "blacktown", landmark: "T1 Western Line" },
    { a: "blacktown", b: "mtdruitt", landmark: "T1 Western Line" },
    { a: "mtdruitt", b: "penrith", landmark: "T1 Western Line" },
    { a: "granville", b: "fairfield", landmark: "T2 Liverpool Line" },
    { a: "fairfield", b: "cabramatta", landmark: "T2 Liverpool Line" },
    { a: "cabramatta", b: "liverpool", landmark: "T2 Liverpool Line" },
    { a: "liverpool", b: "glenfield", landmark: "T8 Airport & South Line" },
    { a: "glenfield", b: "campbelltown", landmark: "T8 Airport & South Line" },
    { a: "lidcombe", b: "bankstown", landmark: "T3 Bankstown Line" },
    { a: "bankstown", b: "campsie", landmark: "T3 Bankstown Line" },
    { a: "campsie", b: "sydenham", landmark: "T3 Bankstown Line" },
    { a: "redfern", b: "sydenham", landmark: "T4 Illawarra Line" },
    { a: "central", b: "mascot", landmark: "T8 Airport Line" },
    { a: "mascot", b: "airport", landmark: "T8 Airport Line" },
    { a: "airport", b: "wollicreek", landmark: "T8 Airport Line" },
    { a: "sydenham", b: "wollicreek", landmark: "T4 Illawarra Line" },
    { a: "wollicreek", b: "rockdale", landmark: "T4 Illawarra Line" },
    { a: "rockdale", b: "hurstville", landmark: "T4 Illawarra Line" },
    { a: "hurstville", b: "sutherland", landmark: "T4 Illawarra Line" },
    { a: "sutherland", b: "cronulla", landmark: "T4 Cronulla branch" },
    { a: "wollicreek", b: "revesby", landmark: "T8 East Hills Line" },
    { a: "revesby", b: "glenfield", landmark: "T8 East Hills Line" },
    { a: "parramatta", b: "castlehill", landmark: "Imaginary Parramatta–Hills link" }
  ]
};

// Rough coastline and harbour, for drawing only.
export const SYDNEY_WATER = {
  ocean: [
    [151.4, -33.6], [151.3, -33.6], [151.305, -33.7], [151.3, -33.76], [151.292, -33.8], [151.302, -33.818], [151.29, -33.836],
    [151.282, -33.86], [151.282, -33.893], [151.262, -33.925], [151.258, -33.96], [151.238, -33.985], [151.215, -33.975], [151.195, -33.958],
    [151.17, -33.966], [151.135, -33.99], [151.155, -34.01], [151.2, -34.002], [151.228, -34.01], [151.195, -34.035], [151.168, -34.068],
    [151.15, -34.1], [151.4, -34.1]
  ] as [number, number][],
  // centreline points with half-width in degrees
  harbour: [
    [151.3, -33.828, 0.01], [151.265, -33.845, 0.008], [151.235, -33.852, 0.007], [151.212, -33.856, 0.0045], [151.19, -33.849, 0.0042],
    [151.165, -33.843, 0.004], [151.135, -33.838, 0.0035], [151.105, -33.836, 0.003], [151.075, -33.83, 0.0025], [151.05, -33.826, 0.002], [151.03, -33.822, 0.0012]
  ] as [number, number, number][],
  middleHarbour: [[151.262, -33.84, 0.005], [151.25, -33.815, 0.004], [151.238, -33.795, 0.003], [151.228, -33.778, 0.0018]] as [number, number, number][]
};
