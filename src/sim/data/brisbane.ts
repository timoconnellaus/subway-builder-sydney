import type { MapDef } from "../types";

// A simplified version of Brisbane's Queensland Rail City network: the Ipswich and Springfield
// lines, Ferny Grove, the north out to Petrie and the Redcliffe Peninsula, Shorncliffe, the Airport
// and Doomben lines, Cleveland and Beenleigh, plus Cross River Rail and a couple of busway corridors.
// pop / jobs are rough thousands of residents and jobs in each station's catchment (same scale as Sydney).
// Section minutes are filled in from distance when omitted.
export const BRISBANE: MapDef = {
  id: "brisbane",
  name: "Brisbane",
  bounds: { lon0: 152.72, lon1: 153.33, lat0: -27.19, lat1: -27.75 },
  hubs: ["central", "airport", "ipswich", "beenleigh"],
  // extra starting money for hubs with fewer passengers nearby
  hubBonus: { central: 0, airport: 1500, ipswich: 1800, beenleigh: 900 },
  events: [
    { station: "milton", title: "Broncos at Suncorp Stadium", emoji: "🏉" },
    { station: "woolloongabba", title: "Lions at the Gabba", emoji: "🏉" },
    { station: "woolloongabba", title: "Test cricket at the Gabba", emoji: "🏏" },
    { station: "southbank", title: "Riverfire at South Bank", emoji: "🎆" },
    { station: "bowenhills", title: "The Ekka at the Showgrounds", emoji: "🎡" },
    { station: "boondall", title: "Concert at the Entertainment Centre", emoji: "🎤" },
    { station: "ascot", title: "Doomben Cup at the races", emoji: "🐎" },
    { station: "beenleigh", title: "Day trip to the Gold Coast", emoji: "🏄" },
    { station: "airport", title: "School holiday rush at the airport", emoji: "✈️" }
  ],
  stations: [
    // the city and inner suburbs
    { id: "central", name: "Central", lon: 153.026, lat: -27.466, pop: 20, jobs: 180, icon: "🐨", label: "t" },
    { id: "romast", name: "Roma Street", lon: 153.0185, lat: -27.4655, pop: 15, jobs: 60, label: "l" },
    { id: "albertst", name: "Albert Street", lon: 153.0265, lat: -27.4715, pop: 10, jobs: 70, label: "b" },
    { id: "southbank", name: "South Bank", lon: 153.0205, lat: -27.4785, pop: 20, jobs: 40, label: "l" },
    { id: "woolloongabba", name: "Woolloongabba", lon: 153.036, lat: -27.4855, pop: 30, jobs: 15, label: "r" },
    { id: "boggord", name: "Boggo Road", lon: 153.0305, lat: -27.4965, pop: 25, jobs: 30, label: "b" },
    { id: "fortitude", name: "Fortitude Valley", lon: 153.0335, lat: -27.4565, pop: 30, jobs: 40, label: "r" },
    { id: "bowenhills", name: "Bowen Hills", lon: 153.039, lat: -27.4465, pop: 20, jobs: 30, label: "r" },
    { id: "milton", name: "Milton", lon: 153.003, lat: -27.47, pop: 20, jobs: 25, label: "t" },
    { id: "toowong", name: "Toowong", lon: 152.9925, lat: -27.485, pop: 35, jobs: 25, label: "l" },
    { id: "indooroopilly", name: "Indooroopilly", lon: 152.9735, lat: -27.499, pop: 40, jobs: 30, label: "l" },
    // north-west
    { id: "alderley", name: "Alderley", lon: 153.001, lat: -27.4245, pop: 30, jobs: 8, label: "t" },
    { id: "mitchelton", name: "Mitchelton", lon: 152.9785, lat: -27.417, pop: 30, jobs: 10, label: "b" },
    { id: "fernygrove", name: "Ferny Grove", lon: 152.935, lat: -27.4, pop: 30, jobs: 6, label: "l" },
    // north and the bay
    { id: "eaglejunction", name: "Eagle Junction", lon: 153.0395, lat: -27.4205, pop: 25, jobs: 8, label: "l" },
    { id: "nundah", name: "Nundah", lon: 153.0605, lat: -27.4015, pop: 35, jobs: 12, label: "l" },
    { id: "northgate", name: "Northgate", lon: 153.071, lat: -27.39, pop: 25, jobs: 12, label: "r" },
    { id: "boondall", name: "Boondall", lon: 153.061, lat: -27.3525, pop: 30, jobs: 8, label: "r" },
    { id: "shorncliffe", name: "Shorncliffe", lon: 153.0815, lat: -27.3275, pop: 25, jobs: 4, label: "r" },
    { id: "zillmere", name: "Zillmere", lon: 153.04, lat: -27.36, pop: 35, jobs: 10, label: "l" },
    { id: "strathpine", name: "Strathpine", lon: 152.9895, lat: -27.3045, pop: 40, jobs: 15, label: "l" },
    { id: "petrie", name: "Petrie", lon: 152.978, lat: -27.2685, pop: 35, jobs: 12, label: "l" },
    { id: "mangohill", name: "Mango Hill", lon: 153.024, lat: -27.2435, pop: 35, jobs: 8, label: "t" },
    { id: "kipparing", name: "Kippa-Ring", lon: 153.084, lat: -27.2255, pop: 40, jobs: 12, label: "t" },
    // airport and Doomben
    { id: "airport", name: "Brisbane Airport", lon: 153.118, lat: -27.388, pop: 2, jobs: 60, icon: "airport", label: "r" },
    { id: "ascot", name: "Ascot", lon: 153.0635, lat: -27.4295, pop: 25, jobs: 12, label: "r" },
    // east to Redland Bay
    { id: "coorparoo", name: "Coorparoo", lon: 153.058, lat: -27.4945, pop: 35, jobs: 10, label: "b" },
    { id: "cannonhill", name: "Cannon Hill", lon: 153.0935, lat: -27.472, pop: 30, jobs: 15, label: "b" },
    { id: "wynnum", name: "Wynnum", lon: 153.1735, lat: -27.4425, pop: 30, jobs: 8, label: "l" },
    { id: "wellingtonpt", name: "Wellington Point", lon: 153.241, lat: -27.4845, pop: 25, jobs: 5, label: "b" },
    { id: "cleveland", name: "Cleveland", lon: 153.2895, lat: -27.5265, pop: 35, jobs: 12, label: "b" },
    // south to Logan
    { id: "yeerongpilly", name: "Yeerongpilly", lon: 153.0145, lat: -27.5275, pop: 25, jobs: 10, label: "r" },
    { id: "salisbury", name: "Salisbury", lon: 153.0315, lat: -27.553, pop: 30, jobs: 25, label: "l" },
    { id: "sunnybank", name: "Sunnybank", lon: 153.059, lat: -27.579, pop: 50, jobs: 20, label: "r" },
    { id: "woodridge", name: "Woodridge", lon: 153.1095, lat: -27.629, pop: 45, jobs: 12, label: "r" },
    { id: "loganlea", name: "Loganlea", lon: 153.135, lat: -27.672, pop: 40, jobs: 10, label: "r" },
    { id: "beenleigh", name: "Beenleigh", lon: 153.1995, lat: -27.7155, pop: 40, jobs: 15, icon: "liverpool", label: "t" },
    // west to Ipswich and Springfield
    { id: "corinda", name: "Corinda", lon: 152.98, lat: -27.539, pop: 30, jobs: 8, label: "l" },
    { id: "darra", name: "Darra", lon: 152.953, lat: -27.5665, pop: 30, jobs: 20, label: "r" },
    { id: "goodna", name: "Goodna", lon: 152.8985, lat: -27.6105, pop: 35, jobs: 8, label: "b" },
    { id: "ipswich", name: "Ipswich", lon: 152.7605, lat: -27.615, pop: 45, jobs: 30, icon: "parramatta", label: "t" },
    { id: "springfield", name: "Springfield Central", lon: 152.9035, lat: -27.681, pop: 40, jobs: 15, label: "b" }
  ],
  sections: [
    // the city: the main line, Cross River Rail and the Merivale Bridge
    { a: "romast", b: "central", landmark: "Central to Roma Street" },
    { a: "central", b: "fortitude", landmark: "Brunswick Street tunnels" },
    { a: "fortitude", b: "bowenhills", landmark: "Mayne junction" },
    { a: "central", b: "albertst", landmark: "Cross River Rail under Albert Street" },
    { a: "albertst", b: "woolloongabba", landmark: "Cross River Rail under the river" },
    { a: "woolloongabba", b: "boggord", landmark: "Cross River Rail" },
    { a: "romast", b: "southbank", landmark: "Merivale Bridge" },
    { a: "southbank", b: "boggord", landmark: "Beenleigh and Cleveland lines via Dutton Park" },
    { a: "southbank", b: "woolloongabba", landmark: "Brisbane Metro via the Mater" },
    // west to Ipswich and Springfield
    { a: "romast", b: "milton", landmark: "Ipswich line past Suncorp Stadium" },
    { a: "milton", b: "toowong", landmark: "Ipswich line" },
    { a: "toowong", b: "indooroopilly", landmark: "Ipswich line via Taringa" },
    { a: "indooroopilly", b: "boggord", landmark: "UQ busway via Eleanor Schonell Bridge" },
    { a: "indooroopilly", b: "corinda", landmark: "Ipswich line via Sherwood" },
    { a: "corinda", b: "darra", landmark: "Ipswich line via Oxley" },
    { a: "corinda", b: "yeerongpilly", landmark: "Tennyson freight line" },
    { a: "darra", b: "goodna", landmark: "Ipswich line via Wacol" },
    { a: "goodna", b: "ipswich", minutes: 16, landmark: "Ipswich line via Bundamba" },
    { a: "darra", b: "springfield", landmark: "Springfield line via Richlands" },
    { a: "ipswich", b: "springfield", landmark: "Ipswich to Springfield link via Ripley" },
    // south to Logan and the Gold Coast line
    { a: "boggord", b: "yeerongpilly", landmark: "Beenleigh line via Fairfield" },
    { a: "yeerongpilly", b: "salisbury", landmark: "Beenleigh line via Moorooka" },
    { a: "salisbury", b: "sunnybank", landmark: "Beenleigh line via Coopers Plains" },
    { a: "boggord", b: "sunnybank", landmark: "South East Busway" },
    { a: "sunnybank", b: "woodridge", landmark: "Beenleigh line via Kuraby" },
    { a: "woodridge", b: "loganlea", landmark: "Beenleigh line via Kingston" },
    { a: "loganlea", b: "beenleigh", landmark: "Beenleigh line via Edens Landing" },
    // east to Cleveland
    { a: "boggord", b: "coorparoo", landmark: "Cleveland line via Buranda" },
    { a: "coorparoo", b: "cannonhill", landmark: "Cleveland line via Norman Park" },
    { a: "cannonhill", b: "wynnum", landmark: "Cleveland line via Murarrie" },
    { a: "wynnum", b: "wellingtonpt", landmark: "Cleveland line via Manly" },
    { a: "wellingtonpt", b: "cleveland", landmark: "Cleveland line via Ormiston" },
    // north-west to Ferny Grove
    { a: "bowenhills", b: "alderley", landmark: "Ferny Grove line via Windsor" },
    { a: "alderley", b: "mitchelton", landmark: "Ferny Grove line" },
    { a: "mitchelton", b: "fernygrove", landmark: "Ferny Grove line via Keperra" },
    // north, Shorncliffe and the Redcliffe Peninsula
    { a: "bowenhills", b: "eaglejunction", landmark: "North Coast line via Albion" },
    { a: "eaglejunction", b: "nundah", landmark: "North Coast line" },
    { a: "nundah", b: "northgate", landmark: "North Coast line" },
    { a: "northgate", b: "boondall", landmark: "Shorncliffe line via Banyo" },
    { a: "boondall", b: "shorncliffe", landmark: "Shorncliffe line via Sandgate" },
    { a: "northgate", b: "zillmere", landmark: "North Coast line via Geebung" },
    { a: "zillmere", b: "strathpine", landmark: "North Coast line via Bald Hills" },
    { a: "strathpine", b: "petrie", landmark: "North Coast line via Lawnton" },
    { a: "petrie", b: "mangohill", landmark: "Redcliffe Peninsula line" },
    { a: "mangohill", b: "kipparing", landmark: "Redcliffe Peninsula line via Rothwell" },
    // the airport and the racecourses
    { a: "eaglejunction", b: "airport", landmark: "Airtrain via Toombul" },
    { a: "eaglejunction", b: "ascot", landmark: "Doomben line via Clayfield" },
    { a: "ascot", b: "cannonhill", landmark: "Hamilton to Bulimba ferry across the river" }
  ]
};

// Moreton Bay and the Brisbane River, for drawing only.
BRISBANE.water = {
  ocean: [
    [153.4, -27.1], [153.12, -27.1], [153.105, -27.17], [153.11, -27.19], [153.125, -27.21], [153.122, -27.235],
    [153.105, -27.255], [153.088, -27.264], [153.072, -27.27], [153.066, -27.285], [153.07, -27.3], [153.08, -27.312],
    [153.092, -27.33], [153.102, -27.345], [153.125, -27.358], [153.15, -27.368], [153.17, -27.375], [153.192, -27.385],
    [153.186, -27.41], [153.183, -27.43], [153.19, -27.452], [153.2, -27.47], [153.22, -27.476], [153.24, -27.47],
    [153.252, -27.482], [153.268, -27.5], [153.29, -27.508], [153.302, -27.522], [153.298, -27.545], [153.31, -27.58],
    [153.33, -27.62], [153.4, -27.65]
  ],
  ribbons: [
    // Brisbane River, from Moggill past Indooroopilly, round St Lucia, through the city and
    // round Kangaroo Point and New Farm, out past Hamilton to the bay
    [
      [152.86, -27.578, 0.0015], [152.89, -27.57, 0.0016], [152.915, -27.556, 0.0017], [152.94, -27.538, 0.0018],
      [152.962, -27.524, 0.0018], [152.977, -27.512, 0.0019], [152.986, -27.506, 0.002], [152.993, -27.517, 0.002],
      [153.003, -27.527, 0.002], [153.014, -27.524, 0.002], [153.024, -27.51, 0.0021], [153.022, -27.497, 0.0021],
      [153.012, -27.494, 0.0021], [153.002, -27.487, 0.0022], [153.004, -27.478, 0.0022], [153.012, -27.473, 0.0023],
      [153.022, -27.472, 0.0024], [153.029, -27.478, 0.0024], [153.034, -27.471, 0.0025], [153.036, -27.463, 0.0025],
      [153.045, -27.459, 0.0026], [153.052, -27.468, 0.0027], [153.057, -27.458, 0.0028], [153.064, -27.446, 0.003],
      [153.08, -27.442, 0.0032], [153.1, -27.446, 0.0034], [153.12, -27.433, 0.0036], [153.14, -27.41, 0.004],
      [153.16, -27.39, 0.0045], [153.175, -27.378, 0.005]
    ]
  ]
};
