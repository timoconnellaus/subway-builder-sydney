import type { MapDef } from "../types";

// A simplified version of Melbourne's Metro Trains network, the City Loop and Metro Tunnel,
// a couple of tram corridors and the planned Suburban Rail Loop and airport line.
// pop / jobs are rough thousands of residents and jobs in each station's catchment (same scale as Sydney).
// Section minutes are filled in from distance when omitted.
export const MELBOURNE: MapDef = {
  id: "melbourne",
  name: "Melbourne",
  bounds: { lon0: 144.63, lon1: 145.26, lat0: -37.58, lat1: -38.165 },
  hubs: ["flinders", "boxhill", "airport", "dandenong"],
  // extra starting money for hubs with fewer passengers nearby
  hubBonus: { flinders: 0, boxhill: 1200, airport: 1800, dandenong: 1600 },
  events: [
    { station: "richmond", title: "AFL Grand Final at the MCG", emoji: "🏉" },
    { station: "richmond", title: "Australian Open at Melbourne Park", emoji: "🎾" },
    { station: "flemington", title: "Melbourne Cup at Flemington", emoji: "🐎" },
    { station: "flemington", title: "The Royal Melbourne Show", emoji: "🎡" },
    { station: "stkilda", title: "Grand Prix at Albert Park", emoji: "🏎️" },
    { station: "flinders", title: "Moomba on the Yarra", emoji: "🎉" },
    { station: "southerncross", title: "Footy at Marvel Stadium", emoji: "🏉" },
    { station: "sandringham", title: "Hot day at Brighton Beach", emoji: "🏖️" },
    { station: "airport", title: "Holiday rush at Tullamarine", emoji: "✈️" },
    { station: "melbcentral", title: "Comedy Festival in the city", emoji: "🎭" },
    { station: "boxhill", title: "Lunar New Year in Box Hill", emoji: "🏮" }
  ],
  stations: [
    // the city
    { id: "flinders", name: "Flinders Street", lon: 144.967, lat: -37.818, pop: 20, jobs: 200, icon: "🏏", label: "b" },
    { id: "southerncross", name: "Southern Cross", lon: 144.952, lat: -37.818, pop: 15, jobs: 45, label: "l" },
    { id: "melbcentral", name: "Melbourne Central", lon: 144.963, lat: -37.81, pop: 25, jobs: 50, label: "t" },
    { id: "parliament", name: "Parliament", lon: 144.973, lat: -37.811, pop: 15, jobs: 35 },
    { id: "richmond", name: "Richmond", lon: 144.99, lat: -37.824, pop: 30, jobs: 25 },
    { id: "northmelb", name: "North Melbourne", lon: 144.942, lat: -37.807, pop: 25, jobs: 15, label: "l" },
    { id: "parkville", name: "Parkville", lon: 144.958, lat: -37.799, pop: 20, jobs: 40, label: "t" },
    { id: "southyarra", name: "South Yarra", lon: 144.992, lat: -37.838, pop: 40, jobs: 20 },
    // south and the bayside
    { id: "stkilda", name: "St Kilda", lon: 144.976, lat: -37.864, pop: 40, jobs: 12, label: "l" },
    { id: "elsternwick", name: "Elsternwick", lon: 145.0, lat: -37.884, pop: 30, jobs: 8, label: "l" },
    { id: "brighton", name: "Brighton", lon: 144.996, lat: -37.916, pop: 35, jobs: 8, label: "l" },
    { id: "sandringham", name: "Sandringham", lon: 145.005, lat: -37.95, pop: 25, jobs: 5, label: "l" },
    { id: "caulfield", name: "Caulfield", lon: 145.023, lat: -37.877, pop: 30, jobs: 15 },
    { id: "moorabbin", name: "Moorabbin", lon: 145.037, lat: -37.934, pop: 35, jobs: 12, label: "l" },
    { id: "cheltenham", name: "Cheltenham", lon: 145.054, lat: -37.967, pop: 40, jobs: 12, label: "l" },
    { id: "mordialloc", name: "Mordialloc", lon: 145.087, lat: -38.006, pop: 35, jobs: 8 },
    { id: "frankston", name: "Frankston", lon: 145.126, lat: -38.143, pop: 50, jobs: 25 },
    // south-east
    { id: "oakleigh", name: "Oakleigh", lon: 145.089, lat: -37.9, pop: 35, jobs: 12, label: "b" },
    { id: "clayton", name: "Clayton", lon: 145.12, lat: -37.924, pop: 30, jobs: 30, label: "b" },
    { id: "dandenong", name: "Dandenong", lon: 145.209, lat: -37.99, pop: 55, jobs: 40, icon: "liverpool", label: "b" },
    { id: "gleniris", name: "Glen Iris", lon: 145.05, lat: -37.859, pop: 35, jobs: 6, label: "b" },
    { id: "glenwaverley", name: "Glen Waverley", lon: 145.165, lat: -37.879, pop: 40, jobs: 15 },
    // east
    { id: "camberwell", name: "Camberwell", lon: 145.059, lat: -37.826, pop: 35, jobs: 12, label: "b" },
    { id: "boxhill", name: "Box Hill", lon: 145.122, lat: -37.819, pop: 45, jobs: 100, icon: "parramatta", label: "b" },
    { id: "ringwood", name: "Ringwood", lon: 145.229, lat: -37.816, pop: 45, jobs: 20, label: "b" },
    { id: "doncaster", name: "Doncaster", lon: 145.126, lat: -37.786, pop: 40, jobs: 15, label: "t" },
    // north
    { id: "cliftonhill", name: "Clifton Hill", lon: 144.995, lat: -37.789, pop: 35, jobs: 12 },
    { id: "preston", name: "Preston", lon: 145.003, lat: -37.744, pop: 45, jobs: 10 },
    { id: "reservoir", name: "Reservoir", lon: 145.007, lat: -37.717, pop: 40, jobs: 8, label: "t" },
    { id: "heidelberg", name: "Heidelberg", lon: 145.067, lat: -37.757, pop: 35, jobs: 25 },
    { id: "brunswick", name: "Brunswick", lon: 144.96, lat: -37.767, pop: 45, jobs: 12, label: "l" },
    { id: "fawkner", name: "Fawkner", lon: 144.96, lat: -37.714, pop: 35, jobs: 5, label: "t" },
    { id: "essendon", name: "Essendon", lon: 144.916, lat: -37.756, pop: 45, jobs: 12, label: "l" },
    { id: "broadmeadows", name: "Broadmeadows", lon: 144.92, lat: -37.682, pop: 40, jobs: 15 },
    { id: "craigieburn", name: "Craigieburn", lon: 144.943, lat: -37.602, pop: 50, jobs: 8 },
    { id: "airport", name: "Melbourne Airport", lon: 144.843, lat: -37.669, pop: 2, jobs: 80, icon: "airport", label: "l" },
    // west
    { id: "flemington", name: "Flemington", lon: 144.909, lat: -37.788, pop: 25, jobs: 8, label: "t" },
    { id: "footscray", name: "Footscray", lon: 144.903, lat: -37.801, pop: 45, jobs: 25, label: "b" },
    { id: "sunshine", name: "Sunshine", lon: 144.833, lat: -37.788, pop: 50, jobs: 25, label: "l" },
    { id: "newport", name: "Newport", lon: 144.883, lat: -37.843, pop: 30, jobs: 8, label: "b" },
    { id: "laverton", name: "Laverton", lon: 144.77, lat: -37.863, pop: 40, jobs: 12, label: "b" },
    { id: "werribee", name: "Werribee", lon: 144.661, lat: -37.9, pop: 50, jobs: 20, label: "b" }
  ],
  sections: [
    // the city: the Loop, the viaduct and the Metro Tunnel
    { a: "flinders", b: "southerncross", landmark: "Flinders Street viaduct" },
    { a: "southerncross", b: "melbcentral", landmark: "City Loop via Flagstaff" },
    { a: "melbcentral", b: "parliament", landmark: "City Loop" },
    { a: "parliament", b: "richmond", landmark: "City Loop" },
    { a: "flinders", b: "richmond", landmark: "Flinders Street to Richmond past the MCG" },
    { a: "southerncross", b: "northmelb", landmark: "North Melbourne flyover" },
    { a: "northmelb", b: "parkville", landmark: "Metro Tunnel" },
    { a: "parkville", b: "melbcentral", landmark: "Metro Tunnel via State Library" },
    { a: "flinders", b: "southyarra", landmark: "Metro Tunnel via Town Hall and Anzac" },
    { a: "flinders", b: "stkilda", landmark: "St Kilda Road trams" },
    { a: "richmond", b: "southyarra", landmark: "Frankston line" },
    // south and the bayside
    { a: "southyarra", b: "caulfield", landmark: "Frankston line" },
    { a: "caulfield", b: "moorabbin", landmark: "Frankston line" },
    { a: "moorabbin", b: "cheltenham", landmark: "Frankston line" },
    { a: "cheltenham", b: "mordialloc", landmark: "Frankston line" },
    { a: "mordialloc", b: "frankston", minutes: 15, landmark: "Frankston line along the bay" },
    { a: "southyarra", b: "elsternwick", landmark: "Sandringham line" },
    { a: "elsternwick", b: "brighton", landmark: "Sandringham line" },
    { a: "brighton", b: "sandringham", landmark: "Sandringham line" },
    // south-east
    { a: "caulfield", b: "oakleigh", landmark: "Pakenham and Cranbourne lines" },
    { a: "oakleigh", b: "clayton", landmark: "Pakenham and Cranbourne lines" },
    { a: "clayton", b: "dandenong", landmark: "Pakenham and Cranbourne lines" },
    { a: "cheltenham", b: "clayton", landmark: "Suburban Rail Loop East" },
    { a: "clayton", b: "glenwaverley", landmark: "Suburban Rail Loop East via Monash" },
    { a: "glenwaverley", b: "boxhill", landmark: "Suburban Rail Loop East via Burwood" },
    { a: "richmond", b: "gleniris", landmark: "Glen Waverley line" },
    { a: "gleniris", b: "glenwaverley", landmark: "Glen Waverley line" },
    // east
    { a: "richmond", b: "camberwell", landmark: "Lilydale and Belgrave lines" },
    { a: "camberwell", b: "boxhill", landmark: "Lilydale and Belgrave lines" },
    { a: "boxhill", b: "ringwood", landmark: "Lilydale and Belgrave lines" },
    { a: "boxhill", b: "doncaster", landmark: "Suburban Rail Loop North" },
    { a: "doncaster", b: "heidelberg", landmark: "Suburban Rail Loop North" },
    // north
    { a: "parliament", b: "cliftonhill", landmark: "Hurstbridge and Mernda lines" },
    { a: "cliftonhill", b: "heidelberg", landmark: "Hurstbridge line" },
    { a: "cliftonhill", b: "preston", landmark: "Mernda line" },
    { a: "preston", b: "reservoir", landmark: "Mernda line" },
    { a: "heidelberg", b: "reservoir", landmark: "Suburban Rail Loop North via La Trobe" },
    { a: "reservoir", b: "fawkner", landmark: "Suburban Rail Loop North" },
    { a: "fawkner", b: "broadmeadows", landmark: "Suburban Rail Loop North" },
    { a: "broadmeadows", b: "airport", landmark: "Suburban Rail Loop North" },
    { a: "northmelb", b: "brunswick", landmark: "Upfield line" },
    { a: "brunswick", b: "fawkner", landmark: "Upfield line" },
    { a: "northmelb", b: "essendon", landmark: "Craigieburn line" },
    { a: "essendon", b: "broadmeadows", landmark: "Craigieburn line" },
    { a: "broadmeadows", b: "craigieburn", landmark: "Craigieburn line" },
    // west
    { a: "northmelb", b: "flemington", landmark: "Flemington Racecourse line" },
    { a: "northmelb", b: "footscray", landmark: "Sunbury and Werribee lines" },
    { a: "footscray", b: "sunshine", landmark: "Sunbury line" },
    { a: "sunshine", b: "airport", minutes: 13, landmark: "Melbourne Airport Rail" },
    { a: "footscray", b: "newport", landmark: "Werribee line" },
    { a: "newport", b: "laverton", landmark: "Werribee line" },
    { a: "laverton", b: "werribee", landmark: "Werribee line" }
  ]
};

// Port Phillip Bay, the Yarra and the Maribyrnong, for drawing only.
MELBOURNE.water = {
  ocean: [
    [144.5, -38.02], [144.58, -37.995], [144.64, -37.975], [144.69, -37.962], [144.73, -37.935], [144.77, -37.908], [144.8, -37.89],
    [144.84, -37.876], [144.875, -37.869], [144.895, -37.872], [144.905, -37.862], [144.915, -37.847], [144.932, -37.844],
    [144.955, -37.852], [144.971, -37.869], [144.981, -37.89], [144.986, -37.915], [144.994, -37.94], [145.0, -37.96],
    [145.025, -37.983], [145.055, -37.998], [145.08, -38.012], [145.1, -38.04], [145.112, -38.08], [145.118, -38.12],
    [145.112, -38.155], [145.085, -38.19], [145.05, -38.25], [144.95, -38.4], [144.5, -38.4]
  ],
  ribbons: [
    // Yarra, from Warrandyte way down past the city to the bay
    [
      [145.16, -37.735, 0.0015], [145.12, -37.748, 0.0016], [145.09, -37.752, 0.0018], [145.07, -37.768, 0.002], [145.055, -37.785, 0.002],
      [145.035, -37.792, 0.002], [145.015, -37.795, 0.002], [145.0, -37.806, 0.0021], [145.008, -37.825, 0.0022], [144.995, -37.832, 0.0024],
      [144.98, -37.825, 0.0025], [144.965, -37.821, 0.0026], [144.95, -37.822, 0.0028], [144.93, -37.823, 0.003], [144.912, -37.828, 0.0034],
      [144.906, -37.84, 0.0038], [144.912, -37.855, 0.004]
    ],
    // Maribyrnong, from Keilor round the racecourse to the Yarra
    [
      [144.81, -37.7, 0.0015], [144.835, -37.73, 0.0017], [144.865, -37.752, 0.002], [144.885, -37.768, 0.002], [144.899, -37.782, 0.0022],
      [144.906, -37.792, 0.0024], [144.914, -37.806, 0.0026], [144.914, -37.818, 0.0028], [144.912, -37.828, 0.003]
    ]
  ]
};
