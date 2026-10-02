import type { MapDef } from "../types";

// A simplified version of New York's subway, PATH, LIRR, Metro-North and NJ Transit network.
// pop / jobs are rough thousands of residents and jobs in each station's catchment, on the
// same scale as the Sydney map. Section minutes are filled in from distance when omitted.
export const NEW_YORK: MapDef = {
  id: "newyork",
  name: "New York",
  bounds: { lon0: -74.25, lon1: -73.72, lat0: 40.965, lat1: 40.55 },
  hubs: ["timessq", "newark", "jfk", "fordham"],
  // extra starting money for hubs with fewer passengers nearby
  hubBonus: { timessq: 300, newark: 600, jfk: 0, fordham: 400 },
  events: [
    { station: "timessq", title: "New Year's Eve in Times Square", emoji: "🎆" },
    { station: "yankee", title: "Yankees at Yankee Stadium", emoji: "⚾" },
    { station: "flushing", title: "US Open tennis", emoji: "🎾" },
    { station: "penn", title: "Knicks at Madison Square Garden", emoji: "🏀" },
    { station: "dtbklyn", title: "Nets at Barclays Center", emoji: "🏀" },
    { station: "secaucus", title: "Giants at MetLife Stadium", emoji: "🏈" },
    { station: "newark", title: "Devils at the Prudential Center", emoji: "🏒" },
    { station: "coney", title: "Nathan's Hot Dog Eating Contest", emoji: "🌭" },
    { station: "uws", title: "Macy's Thanksgiving Day Parade", emoji: "🎈" },
    { station: "stgeorge", title: "NYC Marathon start", emoji: "🏃" },
    { station: "harlem", title: "Amateur Night at the Apollo", emoji: "🎤" },
    { station: "rockaway", title: "Summer surf at Rockaway Beach", emoji: "🏖️" }
  ],
  stations: [
    // Manhattan
    { id: "timessq", name: "Times Square", lon: -73.986, lat: 40.756, pop: 20, jobs: 200, icon: "city", label: "r" },
    { id: "penn", name: "Penn Station", lon: -73.997, lat: 40.75, pop: 20, jobs: 90, label: "l" },
    { id: "unionsq", name: "Union Square", lon: -73.99, lat: 40.735, pop: 45, jobs: 55 },
    { id: "lowermanhattan", name: "Wall Street", lon: -74.008, lat: 40.709, pop: 30, jobs: 110, label: "l" },
    { id: "uws", name: "Upper West Side", lon: -73.982, lat: 40.779, pop: 55, jobs: 20, label: "l" },
    { id: "ues", name: "Upper East Side", lon: -73.955, lat: 40.779, pop: 55, jobs: 25 },
    { id: "harlem", name: "Harlem–125 St", lon: -73.945, lat: 40.807, pop: 55, jobs: 15, label: "l" },
    { id: "washheights", name: "Washington Heights", lon: -73.94, lat: 40.841, pop: 55, jobs: 12, label: "l" },
    // Bronx and Westchester
    { id: "yankee", name: "Yankee Stadium", lon: -73.926, lat: 40.828, pop: 40, jobs: 15 },
    { id: "fordham", name: "Fordham", lon: -73.89, lat: 40.861, pop: 55, jobs: 20, icon: "liverpool" },
    { id: "parkchester", name: "Parkchester", lon: -73.861, lat: 40.833, pop: 45, jobs: 8 },
    { id: "yonkers", name: "Yonkers", lon: -73.898, lat: 40.936, pop: 45, jobs: 15 },
    // Queens
    { id: "lic", name: "Long Island City", lon: -73.946, lat: 40.747, pop: 30, jobs: 45, label: "b" },
    { id: "astoria", name: "Astoria", lon: -73.918, lat: 40.77, pop: 50, jobs: 10 },
    { id: "jacksonhts", name: "Jackson Heights", lon: -73.891, lat: 40.747, pop: 55, jobs: 15, label: "b" },
    { id: "laguardia", name: "LaGuardia", lon: -73.874, lat: 40.777, pop: 2, jobs: 40, label: "t" },
    { id: "flushing", name: "Flushing", lon: -73.83, lat: 40.76, pop: 55, jobs: 30 },
    { id: "foresthills", name: "Forest Hills", lon: -73.845, lat: 40.721, pop: 40, jobs: 10 },
    { id: "jamaica", name: "Jamaica", lon: -73.808, lat: 40.7, pop: 45, jobs: 30 },
    { id: "jfk", name: "JFK Airport", lon: -73.79, lat: 40.646, pop: 2, jobs: 80, icon: "airport" },
    { id: "howardbeach", name: "Howard Beach", lon: -73.83, lat: 40.66, pop: 20, jobs: 5, label: "l" },
    { id: "rockaway", name: "Rockaway Beach", lon: -73.818, lat: 40.588, pop: 30, jobs: 5 },
    // Brooklyn
    { id: "dtbklyn", name: "Downtown Brooklyn", lon: -73.988, lat: 40.69, pop: 35, jobs: 70, label: "l" },
    { id: "williamsburg", name: "Williamsburg", lon: -73.957, lat: 40.717, pop: 50, jobs: 15 },
    { id: "bushwick", name: "Bushwick", lon: -73.912, lat: 40.7, pop: 50, jobs: 8 },
    { id: "crownhts", name: "Crown Heights", lon: -73.931, lat: 40.669, pop: 55, jobs: 10 },
    { id: "eastny", name: "East New York", lon: -73.895, lat: 40.677, pop: 50, jobs: 8, label: "b" },
    { id: "flatbush", name: "Flatbush", lon: -73.963, lat: 40.646, pop: 50, jobs: 10 },
    { id: "sunsetpark", name: "Sunset Park", lon: -74.004, lat: 40.655, pop: 45, jobs: 15, label: "l" },
    { id: "bayridge", name: "Bay Ridge", lon: -74.028, lat: 40.625, pop: 40, jobs: 8, label: "r" },
    { id: "coney", name: "Coney Island", lon: -73.981, lat: 40.578, pop: 30, jobs: 8, label: "t" },
    // New Jersey and Staten Island
    { id: "newark", name: "Newark", lon: -74.164, lat: 40.735, pop: 50, jobs: 100, icon: "parramatta" },
    { id: "ewr", name: "Newark Airport", lon: -74.177, lat: 40.705, pop: 2, jobs: 35, label: "b" },
    { id: "secaucus", name: "Secaucus", lon: -74.075, lat: 40.761, pop: 10, jobs: 15, label: "t" },
    { id: "journalsq", name: "Journal Square", lon: -74.063, lat: 40.733, pop: 50, jobs: 15, label: "l" },
    { id: "exchangepl", name: "Jersey City", lon: -74.033, lat: 40.716, pop: 30, jobs: 55, label: "l" },
    { id: "hoboken", name: "Hoboken", lon: -74.028, lat: 40.736, pop: 45, jobs: 20, label: "l" },
    { id: "stgeorge", name: "St. George", lon: -74.074, lat: 40.644, pop: 40, jobs: 10, label: "l" }
  ],
  sections: [
    // Manhattan
    { a: "timessq", b: "penn", landmark: "34 St–Herald Sq" },
    { a: "timessq", b: "unionsq", landmark: "N/Q/R/W Broadway" },
    { a: "unionsq", b: "lowermanhattan", landmark: "4/5 Lexington express" },
    { a: "timessq", b: "ues", landmark: "Shuttle + 4/5/6 Lexington Av" },
    { a: "timessq", b: "uws", landmark: "1/2/3 Broadway" },
    { a: "uws", b: "harlem", landmark: "A/B/C/D Central Park West" },
    { a: "ues", b: "harlem", landmark: "4/5/6 Lexington Av" },
    { a: "harlem", b: "washheights", landmark: "A train" },
    // Bronx and the bridges
    { a: "harlem", b: "yankee", landmark: "4 train over the Harlem River" },
    { a: "yankee", b: "fordham", landmark: "B/D Grand Concourse" },
    { a: "washheights", b: "yonkers", landmark: "Metro-North Hudson Line" },
    { a: "fordham", b: "yonkers", landmark: "Metro-North Harlem Line" },
    { a: "harlem", b: "parkchester", landmark: "6 train Pelham Line" },
    { a: "parkchester", b: "flushing", landmark: "Whitestone Bridge" },
    { a: "harlem", b: "astoria", landmark: "RFK Triborough Bridge" },
    // Queens
    { a: "timessq", b: "lic", landmark: "7 train Steinway Tunnel" },
    { a: "lic", b: "astoria", landmark: "N/W Astoria Line" },
    { a: "lic", b: "jacksonhts", landmark: "7 train Flushing Line" },
    { a: "jacksonhts", b: "flushing", landmark: "7 train Flushing Line" },
    { a: "jacksonhts", b: "foresthills", landmark: "E/F Queens Blvd" },
    { a: "foresthills", b: "jamaica", landmark: "E/F Queens Blvd" },
    { a: "astoria", b: "laguardia", landmark: "Q70 LaGuardia Link" },
    { a: "laguardia", b: "flushing", landmark: "Flushing Bay" },
    { a: "jamaica", b: "jfk", landmark: "AirTrain JFK" },
    { a: "jfk", b: "howardbeach", landmark: "AirTrain JFK" },
    { a: "howardbeach", b: "rockaway", landmark: "A train across Jamaica Bay" },
    { a: "howardbeach", b: "eastny", landmark: "A train Liberty Av" },
    { a: "jamaica", b: "eastny", landmark: "J/Z Jamaica Line" },
    // Brooklyn
    { a: "lowermanhattan", b: "dtbklyn", landmark: "Brooklyn Bridge" },
    { a: "unionsq", b: "williamsburg", landmark: "L train" },
    { a: "williamsburg", b: "bushwick", landmark: "L train" },
    { a: "bushwick", b: "eastny", landmark: "L train" },
    { a: "williamsburg", b: "lic", landmark: "G train" },
    { a: "dtbklyn", b: "crownhts", landmark: "3/4 Eastern Pkwy" },
    { a: "crownhts", b: "eastny", landmark: "LIRR Atlantic Branch" },
    { a: "dtbklyn", b: "flatbush", landmark: "B/Q Brighton Line" },
    { a: "flatbush", b: "coney", landmark: "B/Q Brighton Line" },
    { a: "dtbklyn", b: "sunsetpark", landmark: "D/N/R Fourth Av" },
    { a: "sunsetpark", b: "bayridge", landmark: "R train" },
    { a: "sunsetpark", b: "coney", landmark: "D train West End" },
    { a: "bayridge", b: "stgeorge", landmark: "Verrazzano-Narrows Bridge" },
    { a: "stgeorge", b: "lowermanhattan", landmark: "Staten Island Ferry" },
    // New Jersey
    { a: "penn", b: "secaucus", landmark: "North River Tunnels" },
    { a: "secaucus", b: "newark", landmark: "Northeast Corridor" },
    { a: "newark", b: "ewr", landmark: "AirTrain Newark" },
    { a: "newark", b: "journalsq", landmark: "PATH" },
    { a: "journalsq", b: "exchangepl", landmark: "PATH" },
    { a: "exchangepl", b: "lowermanhattan", landmark: "PATH to World Trade Center" },
    { a: "hoboken", b: "penn", landmark: "PATH Uptown Hudson Tubes" },
    { a: "hoboken", b: "exchangepl", landmark: "Hudson-Bergen Light Rail" }
  ]
};

// Rough coastline and rivers, for drawing only.
NEW_YORK.water = {
  // Atlantic, Lower Bay and Raritan Bay
  ocean: [
    [-73.3, 40.3], [-73.3, 40.588], [-73.6, 40.585], [-73.75, 40.592], [-73.83, 40.579], [-73.88, 40.562], [-73.94, 40.553],
    [-73.935, 40.572], [-73.95, 40.578], [-73.98, 40.571], [-74.012, 40.574], [-74.005, 40.59], [-74.025, 40.603], [-74.04, 40.612],
    [-74.052, 40.603], [-74.07, 40.588], [-74.1, 40.568], [-74.13, 40.545], [-74.17, 40.52], [-74.22, 40.5], [-74.255, 40.497],
    [-74.27, 40.48], [-74.2, 40.45], [-74.1, 40.43], [-74.0, 40.45], [-74.0, 40.3]
  ],
  ribbons: [
    // Upper New York Bay, from the Narrows to the Battery
    [[-74.045, 40.605, 0.008], [-74.048, 40.625, 0.012], [-74.05, 40.645, 0.015], [-74.045, 40.668, 0.017], [-74.032, 40.688, 0.013], [-74.018, 40.698, 0.007]],
    // Hudson River
    [[-74.022, 40.699, 0.006], [-74.02, 40.72, 0.006], [-74.016, 40.74, 0.006], [-74.01, 40.76, 0.006], [-73.998, 40.78, 0.006], [-73.985, 40.8, 0.006],
      [-73.965, 40.83, 0.006], [-73.95, 40.855, 0.006], [-73.935, 40.88, 0.007], [-73.928, 40.9, 0.008], [-73.915, 40.94, 0.008], [-73.905, 40.99, 0.009]],
    // East River out to Long Island Sound
    [[-74.012, 40.698, 0.004], [-73.995, 40.704, 0.0035], [-73.98, 40.708, 0.004], [-73.972, 40.715, 0.004], [-73.97, 40.73, 0.004], [-73.966, 40.745, 0.004],
      [-73.958, 40.756, 0.004], [-73.947, 40.768, 0.004], [-73.937, 40.779, 0.004], [-73.925, 40.79, 0.004], [-73.9, 40.795, 0.005], [-73.87, 40.795, 0.006],
      [-73.84, 40.795, 0.008], [-73.8, 40.802, 0.012], [-73.76, 40.82, 0.016], [-73.7, 40.84, 0.02]],
    // Flushing Bay
    [[-73.86, 40.795, 0.006], [-73.852, 40.78, 0.005], [-73.845, 40.768, 0.003]],
    // Harlem River and Spuyten Duyvil
    [[-73.93, 40.792, 0.0025], [-73.932, 40.8, 0.0025], [-73.934, 40.815, 0.002], [-73.935, 40.83, 0.002], [-73.93, 40.845, 0.002], [-73.92, 40.86, 0.002],
      [-73.915, 40.872, 0.0018], [-73.925, 40.878, 0.0015], [-73.935, 40.88, 0.0015]],
    // Jamaica Bay
    [[-73.935, 40.572, 0.005], [-73.905, 40.595, 0.012], [-73.87, 40.612, 0.02], [-73.835, 40.624, 0.021], [-73.8, 40.622, 0.015], [-73.77, 40.618, 0.009], [-73.75, 40.615, 0.005]],
    // Kill Van Kull, Newark Bay and the Passaic River
    [[-74.05, 40.645, 0.003], [-74.08, 40.646, 0.003], [-74.11, 40.644, 0.003], [-74.14, 40.655, 0.006], [-74.14, 40.68, 0.008], [-74.13, 40.7, 0.006],
      [-74.135, 40.72, 0.002], [-74.155, 40.74, 0.0015], [-74.16, 40.76, 0.0015]],
    // Hackensack River
    [[-74.13, 40.7, 0.003], [-74.11, 40.73, 0.002], [-74.1, 40.76, 0.002], [-74.085, 40.8, 0.002]],
    // Arthur Kill
    [[-74.14, 40.655, 0.003], [-74.19, 40.64, 0.003], [-74.21, 40.6, 0.003], [-74.24, 40.55, 0.003], [-74.255, 40.5, 0.003]]
  ]
};
