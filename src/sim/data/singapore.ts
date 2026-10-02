import type { MapDef } from "../types";

// A simplified version of the Singapore MRT: the East–West, North–South, North East, Circle,
// Downtown and Thomson–East Coast lines, from Tuas across to Changi and up to Woodlands.
// pop / jobs are rough thousands, scaled down to match the Sydney map's totals.
// The crowded city centre is merged into a few stations (City Hall into Raffles Place,
// Marina Bay with the Gardens and Marina South). Section minutes are filled in from distance when omitted.
export const SINGAPORE: MapDef = {
  id: "singapore",
  name: "Singapore",
  bounds: { lon0: 103.6, lon1: 104.03, lat0: 1.475, lat1: 1.235 },
  hubs: ["raffles", "jurongeast", "changi", "woodlands"],
  // extra starting money for hubs with fewer passengers nearby
  hubBonus: { raffles: 0, jurongeast: 300, changi: 600, woodlands: 1200 },
  stations: [
    // city centre
    { id: "raffles", name: "Raffles Place", lon: 103.851, lat: 1.284, pop: 15, jobs: 200, icon: "🦁", label: "l" },
    { id: "outram", name: "Outram Park", lon: 103.839, lat: 1.28, pop: 30, jobs: 30, label: "l" },
    { id: "marinabay", name: "Marina Bay", lon: 103.863, lat: 1.274, pop: 10, jobs: 60, label: "b" },
    { id: "dhoby", name: "Dhoby Ghaut", lon: 103.846, lat: 1.299, pop: 15, jobs: 40, label: "l" },
    { id: "bugis", name: "Bugis", lon: 103.856, lat: 1.3, pop: 25, jobs: 35, label: "r" },
    { id: "orchard", name: "Orchard", lon: 103.832, lat: 1.304, pop: 20, jobs: 45, label: "l" },
    { id: "littleindia", name: "Little India", lon: 103.854, lat: 1.312, pop: 30, jobs: 15, label: "t" },
    { id: "kallang", name: "Kallang", lon: 103.873, lat: 1.306, pop: 30, jobs: 10, label: "r" },
    { id: "harbourfront", name: "HarbourFront", lon: 103.822, lat: 1.266, pop: 15, jobs: 25, label: "b" },
    // east
    { id: "payalebar", name: "Paya Lebar", lon: 103.892, lat: 1.318, pop: 35, jobs: 35, label: "t" },
    { id: "marineparade", name: "Marine Parade", lon: 103.906, lat: 1.303, pop: 45, jobs: 8, label: "b" },
    { id: "bedok", name: "Bedok", lon: 103.93, lat: 1.324, pop: 55, jobs: 10, label: "b" },
    { id: "tanahmerah", name: "Tanah Merah", lon: 103.946, lat: 1.327, pop: 30, jobs: 8, label: "b" },
    { id: "tampines", name: "Tampines", lon: 103.945, lat: 1.354, pop: 60, jobs: 25, label: "l" },
    { id: "pasirris", name: "Pasir Ris", lon: 103.949, lat: 1.373, pop: 45, jobs: 6, label: "t" },
    { id: "expo", name: "Expo", lon: 103.962, lat: 1.335, pop: 5, jobs: 20, label: "r" },
    { id: "changi", name: "Changi Airport", lon: 103.989, lat: 1.357, pop: 2, jobs: 80, icon: "airport", label: "r" },
    // north east
    { id: "serangoon", name: "Serangoon", lon: 103.873, lat: 1.35, pop: 45, jobs: 15, label: "r" },
    { id: "hougang", name: "Hougang", lon: 103.892, lat: 1.371, pop: 50, jobs: 8, label: "r" },
    { id: "punggol", name: "Punggol", lon: 103.902, lat: 1.402, pop: 60, jobs: 8, label: "r" },
    // north
    { id: "novena", name: "Novena", lon: 103.843, lat: 1.322, pop: 25, jobs: 30, label: "r" },
    { id: "toapayoh", name: "Toa Payoh", lon: 103.848, lat: 1.333, pop: 50, jobs: 15, label: "r" },
    { id: "bishan", name: "Bishan", lon: 103.848, lat: 1.351, pop: 40, jobs: 15, label: "r" },
    { id: "angmokio", name: "Ang Mo Kio", lon: 103.85, lat: 1.37, pop: 55, jobs: 15, label: "r" },
    { id: "lentor", name: "Lentor", lon: 103.836, lat: 1.385, pop: 30, jobs: 4, label: "l" },
    { id: "yishun", name: "Yishun", lon: 103.835, lat: 1.429, pop: 55, jobs: 10, label: "r" },
    { id: "woodlands", name: "Woodlands", lon: 103.786, lat: 1.437, pop: 55, jobs: 35, icon: "liverpool", label: "b" },
    // west
    { id: "choachukang", name: "Choa Chu Kang", lon: 103.745, lat: 1.385, pop: 55, jobs: 8, label: "l" },
    { id: "bukitpanjang", name: "Bukit Panjang", lon: 103.762, lat: 1.378, pop: 45, jobs: 8, label: "r" },
    { id: "bukitbatok", name: "Bukit Batok", lon: 103.75, lat: 1.349, pop: 45, jobs: 8, label: "r" },
    { id: "beautyworld", name: "Beauty World", lon: 103.776, lat: 1.341, pop: 35, jobs: 8, label: "r" },
    { id: "botanic", name: "Botanic Gardens", lon: 103.815, lat: 1.322, pop: 20, jobs: 12, label: "t" },
    { id: "buonavista", name: "Buona Vista", lon: 103.79, lat: 1.307, pop: 25, jobs: 40, label: "t" },
    { id: "kentridge", name: "Kent Ridge", lon: 103.785, lat: 1.293, pop: 20, jobs: 30, label: "b" },
    { id: "queenstown", name: "Queenstown", lon: 103.806, lat: 1.294, pop: 40, jobs: 10, label: "b" },
    { id: "clementi", name: "Clementi", lon: 103.765, lat: 1.315, pop: 45, jobs: 10, label: "b" },
    { id: "jurongeast", name: "Jurong East", lon: 103.742, lat: 1.333, pop: 45, jobs: 75, icon: "parramatta", label: "l" },
    { id: "boonlay", name: "Boon Lay", lon: 103.706, lat: 1.339, pop: 45, jobs: 20, label: "b" },
    { id: "tuas", name: "Tuas", lon: 103.637, lat: 1.341, pop: 3, jobs: 30, label: "b" }
  ],
  sections: [
    // East–West Line
    { a: "tuas", b: "boonlay", landmark: "East–West Line" },
    { a: "boonlay", b: "jurongeast", landmark: "East–West Line" },
    { a: "jurongeast", b: "clementi", landmark: "East–West Line" },
    { a: "clementi", b: "buonavista", landmark: "East–West Line" },
    { a: "buonavista", b: "queenstown", landmark: "East–West Line" },
    { a: "queenstown", b: "outram", landmark: "East–West Line" },
    { a: "outram", b: "raffles", landmark: "East–West Line" },
    { a: "raffles", b: "bugis", landmark: "East–West Line" },
    { a: "bugis", b: "kallang", landmark: "East–West Line" },
    { a: "kallang", b: "payalebar", landmark: "East–West & Circle Lines" },
    { a: "payalebar", b: "bedok", landmark: "East–West Line" },
    { a: "bedok", b: "tanahmerah", landmark: "East–West Line" },
    { a: "tanahmerah", b: "tampines", landmark: "East–West Line" },
    { a: "tampines", b: "pasirris", landmark: "East–West Line" },
    { a: "tanahmerah", b: "expo", landmark: "East–West Line, Changi branch" },
    { a: "expo", b: "changi", landmark: "East–West Line, Changi branch" },
    // North–South Line
    { a: "jurongeast", b: "bukitbatok", landmark: "North–South Line" },
    { a: "bukitbatok", b: "choachukang", landmark: "North–South Line" },
    { a: "choachukang", b: "woodlands", landmark: "North–South Line" },
    { a: "woodlands", b: "yishun", landmark: "North–South Line" },
    { a: "yishun", b: "angmokio", landmark: "North–South Line" },
    { a: "angmokio", b: "bishan", landmark: "North–South Line" },
    { a: "bishan", b: "toapayoh", landmark: "North–South Line" },
    { a: "toapayoh", b: "novena", landmark: "North–South Line" },
    { a: "novena", b: "orchard", landmark: "North–South Line" },
    { a: "orchard", b: "dhoby", landmark: "North–South Line" },
    { a: "dhoby", b: "raffles", landmark: "North–South Line" },
    { a: "raffles", b: "marinabay", landmark: "North–South Line" },
    // North East Line
    { a: "harbourfront", b: "outram", landmark: "North East Line" },
    { a: "outram", b: "dhoby", landmark: "North East Line" },
    { a: "dhoby", b: "littleindia", landmark: "North East Line" },
    { a: "littleindia", b: "serangoon", landmark: "North East Line" },
    { a: "serangoon", b: "hougang", landmark: "North East Line" },
    { a: "hougang", b: "punggol", landmark: "North East Line" },
    // Circle Line
    { a: "marinabay", b: "kallang", landmark: "Circle Line" },
    { a: "payalebar", b: "serangoon", landmark: "Circle Line" },
    { a: "serangoon", b: "bishan", landmark: "Circle Line" },
    { a: "bishan", b: "botanic", landmark: "Circle Line" },
    { a: "botanic", b: "buonavista", landmark: "Circle Line" },
    { a: "buonavista", b: "kentridge", landmark: "Circle Line" },
    { a: "kentridge", b: "harbourfront", landmark: "Circle Line" },
    // Downtown Line
    { a: "bukitpanjang", b: "beautyworld", landmark: "Downtown Line" },
    { a: "beautyworld", b: "botanic", landmark: "Downtown Line" },
    { a: "botanic", b: "littleindia", landmark: "Downtown Line" },
    { a: "bugis", b: "marinabay", landmark: "Downtown Line" },
    { a: "littleindia", b: "payalebar", landmark: "Downtown Line" },
    { a: "payalebar", b: "tampines", landmark: "Downtown Line" },
    // Thomson–East Coast Line
    { a: "woodlands", b: "lentor", landmark: "Thomson–East Coast Line" },
    { a: "lentor", b: "orchard", landmark: "Thomson–East Coast Line" },
    { a: "orchard", b: "outram", landmark: "Thomson–East Coast Line" },
    { a: "marinabay", b: "marineparade", landmark: "Thomson–East Coast Line" },
    { a: "marineparade", b: "bedok", landmark: "Thomson–East Coast Line" }
  ],
  events: [
    { station: "marinabay", title: "Singapore Grand Prix at Marina Bay", emoji: "🏎️" },
    { station: "marinabay", title: "Light show at Gardens by the Bay", emoji: "✨" },
    { station: "raffles", title: "National Day Parade at the Padang", emoji: "🇸🇬" },
    { station: "outram", title: "Chinese New Year in Chinatown", emoji: "🧧" },
    { station: "kallang", title: "Concert at the National Stadium", emoji: "🎤" },
    { station: "littleindia", title: "Deepavali in Little India", emoji: "🪔" },
    { station: "orchard", title: "Christmas lights on Orchard Road", emoji: "🎄" },
    { station: "harbourfront", title: "Holiday crowds heading to Sentosa", emoji: "🏖️" },
    { station: "changi", title: "School holiday rush at Changi", emoji: "✈️" },
    { station: "expo", title: "Big trade show at Singapore Expo", emoji: "💼" },
    { station: "payalebar", title: "Hari Raya bazaar at Geylang Serai", emoji: "🌙" },
    { station: "botanic", title: "Concert at the Botanic Gardens", emoji: "🎻" }
  ],
  water: {
    // Singapore Strait, from the Tuas coast round Sentosa and the Marina to Changi and Pasir Ris
    ocean: [
      [103.5, 1.1], [103.5, 1.3], [103.61, 1.31], [103.625, 1.3], [103.64, 1.285], [103.67, 1.275], [103.7, 1.29], [103.73, 1.285],
      [103.76, 1.275], [103.785, 1.27], [103.805, 1.264], [103.82, 1.258], [103.835, 1.262], [103.848, 1.27], [103.855, 1.265],
      [103.866, 1.262], [103.878, 1.27], [103.885, 1.285], [103.9, 1.295], [103.92, 1.302], [103.94, 1.308], [103.96, 1.316],
      [103.98, 1.322], [103.995, 1.33], [104.005, 1.345], [104.0, 1.375], [103.985, 1.388], [103.965, 1.385], [103.945, 1.386],
      [103.925, 1.398], [103.915, 1.413], [103.9, 1.42], [103.95, 1.43], [104.1, 1.43], [104.1, 1.1]
    ],
    ribbons: [
      // Johor Strait, from the Tuas Second Link round Woodlands to Seletar
      [[103.62, 1.345, 0.006], [103.64, 1.37, 0.006], [103.67, 1.405, 0.005], [103.7, 1.435, 0.005], [103.73, 1.448, 0.005],
        [103.76, 1.452, 0.004], [103.79, 1.455, 0.004], [103.815, 1.46, 0.004], [103.84, 1.462, 0.005], [103.865, 1.44, 0.006],
        [103.88, 1.425, 0.007], [103.9, 1.42, 0.008]],
      // Marina Bay and the Singapore River
      [[103.866, 1.268, 0.004], [103.862, 1.28, 0.004], [103.857, 1.285, 0.0025], [103.85, 1.288, 0.0012], [103.843, 1.289, 0.001],
        [103.835, 1.292, 0.0008]],
      // Kallang Basin and the Kallang River
      [[103.866, 1.288, 0.002], [103.868, 1.298, 0.003], [103.866, 1.307, 0.0018], [103.862, 1.318, 0.0012], [103.858, 1.33, 0.001]],
      // MacRitchie Reservoir
      [[103.808, 1.343, 0.003], [103.818, 1.344, 0.004], [103.827, 1.347, 0.003]],
      // Upper Seletar Reservoir
      [[103.78, 1.4, 0.002], [103.795, 1.405, 0.003], [103.81, 1.402, 0.002]],
      // Bedok Reservoir
      [[103.925, 1.341, 0.0015], [103.935, 1.342, 0.0015]]
    ]
  }
};
