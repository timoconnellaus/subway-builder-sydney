import type { MapDef } from "../types";

// A simplified version of Hong Kong's MTR: the Island, South Island, Tsuen Wan, Kwun Tong,
// Tseung Kwan O, Tung Chung / Airport Express, East Rail and Tuen Ma lines, plus a few links.
// pop / jobs are rough thousands of residents and jobs in each station's catchment, scaled down
// to the same scale as the Sydney map. Section minutes are filled in from distance when omitted.
export const HONG_KONG: MapDef = {
  id: "hongkong",
  name: "Hong Kong",
  bounds: { lon0: 113.875, lon1: 114.3, lat0: 22.55, lat1: 22.22 },
  hubs: ["central", "kwuntong", "airport", "shatin"],
  // extra starting money for hubs with fewer passengers nearby
  hubBonus: { central: 0, kwuntong: 600, airport: 1600, shatin: 1600 },
  events: [
    { station: "kaitak", title: "Rugby Sevens at Kai Tak Stadium", emoji: "🏉" },
    { station: "causewaybay", title: "Night races at Happy Valley", emoji: "🐎" },
    { station: "causewaybay", title: "Mid-Autumn lanterns in Victoria Park", emoji: "🏮" },
    { station: "tst", title: "Chinese New Year fireworks over the harbour", emoji: "🎆" },
    { station: "wongtaisin", title: "Lunar New Year at Wong Tai Sin Temple", emoji: "🧧" },
    { station: "shatin", title: "Dragon Boat races on the Shing Mun River", emoji: "🐉" },
    { station: "disney", title: "Fireworks at Hong Kong Disneyland", emoji: "🏰" },
    { station: "oceanpark", title: "Halloween Fest at Ocean Park", emoji: "🎃" },
    { station: "airport", title: "Golden Week rush at the airport", emoji: "✈️" },
    { station: "ngongping", title: "Buddha's Birthday at the Big Buddha", emoji: "🛕" },
    { station: "central", title: "Art Basel Hong Kong", emoji: "🎨" }
  ],
  stations: [
    // Hong Kong Island
    { id: "central", name: "Central", lon: 114.158, lat: 22.282, pop: 15, jobs: 200, icon: "city", label: "l" },
    { id: "kennedytown", name: "Kennedy Town", lon: 114.128, lat: 22.281, pop: 45, jobs: 15, label: "t" },
    { id: "causewaybay", name: "Causeway Bay", lon: 114.184, lat: 22.28, pop: 40, jobs: 60, label: "b" },
    { id: "northpoint", name: "North Point", lon: 114.2, lat: 22.289, pop: 55, jobs: 15, label: "l" },
    { id: "taikoo", name: "Tai Koo", lon: 114.216, lat: 22.285, pop: 50, jobs: 35, label: "b" },
    { id: "chaiwan", name: "Chai Wan", lon: 114.237, lat: 22.265, pop: 55, jobs: 12 },
    { id: "oceanpark", name: "Ocean Park", lon: 114.174, lat: 22.249, pop: 10, jobs: 15 },
    { id: "southhorizons", name: "South Horizons", lon: 114.149, lat: 22.243, pop: 50, jobs: 12, label: "l" },
    // Kowloon
    { id: "tst", name: "Tsim Sha Tsui", lon: 114.172, lat: 22.297, pop: 25, jobs: 70, label: "b" },
    { id: "kowloon", name: "Kowloon", lon: 114.159, lat: 22.306, pop: 20, jobs: 35, label: "l" },
    { id: "hunghom", name: "Hung Hom", lon: 114.185, lat: 22.306, pop: 40, jobs: 25 },
    { id: "mongkok", name: "Mong Kok", lon: 114.17, lat: 22.32, pop: 55, jobs: 40 },
    { id: "shamshuipo", name: "Sham Shui Po", lon: 114.156, lat: 22.331, pop: 55, jobs: 15, label: "b" },
    { id: "meifoo", name: "Mei Foo", lon: 114.138, lat: 22.338, pop: 45, jobs: 10, label: "b" },
    { id: "kowloontong", name: "Kowloon Tong", lon: 114.176, lat: 22.337, pop: 25, jobs: 20, label: "l" },
    { id: "wongtaisin", name: "Wong Tai Sin", lon: 114.194, lat: 22.342, pop: 50, jobs: 10, label: "t" },
    { id: "kaitak", name: "Kai Tak", lon: 114.197, lat: 22.328, pop: 25, jobs: 15, label: "b" },
    { id: "kowloonbay", name: "Kowloon Bay", lon: 114.214, lat: 22.323, pop: 45, jobs: 45, label: "t" },
    { id: "kwuntong", name: "Kwun Tong", lon: 114.226, lat: 22.312, pop: 45, jobs: 100, icon: "parramatta" },
    { id: "yautong", name: "Yau Tong", lon: 114.238, lat: 22.298, pop: 45, jobs: 8, label: "b" },
    { id: "tko", name: "Tseung Kwan O", lon: 114.26, lat: 22.309, pop: 55, jobs: 12, label: "t" },
    { id: "lohas", name: "LOHAS Park", lon: 114.27, lat: 22.295, pop: 35, jobs: 8 },
    // New Territories
    { id: "laiking", name: "Lai King", lon: 114.126, lat: 22.348, pop: 40, jobs: 25 },
    { id: "tsuenwan", name: "Tsuen Wan", lon: 114.117, lat: 22.373, pop: 60, jobs: 30, label: "t" },
    { id: "tsingyi", name: "Tsing Yi", lon: 114.107, lat: 22.358, pop: 45, jobs: 15, label: "l" },
    { id: "shatin", name: "Sha Tin", lon: 114.186, lat: 22.381, pop: 60, jobs: 60, icon: "liverpool", label: "l" },
    { id: "university", name: "University", lon: 114.21, lat: 22.414, pop: 15, jobs: 15, label: "l" },
    { id: "maonshan", name: "Ma On Shan", lon: 114.231, lat: 22.425, pop: 55, jobs: 8 },
    { id: "taipo", name: "Tai Po", lon: 114.165, lat: 22.445, pop: 55, jobs: 12 },
    { id: "sheungshui", name: "Sheung Shui", lon: 114.128, lat: 22.501, pop: 55, jobs: 15 },
    { id: "lowu", name: "Lo Wu", lon: 114.113, lat: 22.528, pop: 2, jobs: 30, label: "t" },
    { id: "lokmachau", name: "Lok Ma Chau", lon: 114.066, lat: 22.515, pop: 5, jobs: 20, label: "l" },
    { id: "kamsheung", name: "Kam Sheung Road", lon: 114.063, lat: 22.435, pop: 15, jobs: 5, label: "b" },
    { id: "yuenlong", name: "Yuen Long", lon: 114.035, lat: 22.446, pop: 55, jobs: 20, label: "t" },
    { id: "tinshuiwai", name: "Tin Shui Wai", lon: 114.004, lat: 22.448, pop: 55, jobs: 8, label: "l" },
    { id: "tuenmun", name: "Tuen Mun", lon: 113.973, lat: 22.395, pop: 56, jobs: 20, label: "l" },
    // Lantau
    { id: "sunnybay", name: "Sunny Bay", lon: 114.029, lat: 22.332, pop: 2, jobs: 5, label: "t" },
    { id: "disney", name: "Disneyland", lon: 114.045, lat: 22.316, pop: 1, jobs: 15, label: "b" },
    { id: "tungchung", name: "Tung Chung", lon: 113.941, lat: 22.289, pop: 35, jobs: 10, label: "b" },
    { id: "airport", name: "HKIA Airport", lon: 113.936, lat: 22.316, pop: 2, jobs: 90, icon: "airport", label: "t" },
    { id: "ngongping", name: "Ngong Ping", lon: 113.909, lat: 22.256, pop: 1, jobs: 5, label: "b" }
  ],
  sections: [
    // Island and South Island lines
    { a: "kennedytown", b: "central", landmark: "Island Line (Sheung Wan)" },
    { a: "central", b: "causewaybay", landmark: "Island Line (Wan Chai)" },
    { a: "causewaybay", b: "northpoint", landmark: "Island Line (Tin Hau)" },
    { a: "northpoint", b: "taikoo", landmark: "Island Line (Quarry Bay)" },
    { a: "taikoo", b: "chaiwan", landmark: "Island Line (Shau Kei Wan)" },
    { a: "central", b: "oceanpark", landmark: "South Island Line (Admiralty)" },
    { a: "oceanpark", b: "southhorizons", landmark: "South Island Line (Wong Chuk Hang)" },
    { a: "southhorizons", b: "kennedytown", landmark: "South Island Line West (proposed)" },
    // Harbour crossings
    { a: "central", b: "tst", landmark: "Tsuen Wan Line under the harbour" },
    { a: "central", b: "kowloon", landmark: "Airport Express under the harbour" },
    { a: "causewaybay", b: "hunghom", landmark: "Cross-Harbour Tunnel" },
    { a: "taikoo", b: "yautong", landmark: "Eastern Harbour Crossing" },
    // Kowloon
    { a: "tst", b: "mongkok", landmark: "Tsuen Wan Line (Nathan Road)" },
    { a: "mongkok", b: "shamshuipo", landmark: "Tsuen Wan Line (Prince Edward)" },
    { a: "shamshuipo", b: "meifoo", landmark: "Tsuen Wan Line (Cheung Sha Wan)" },
    { a: "meifoo", b: "laiking", landmark: "Tsuen Wan Line" },
    { a: "laiking", b: "tsuenwan", landmark: "Tsuen Wan Line (Kwai Fong)" },
    { a: "tst", b: "kowloon", landmark: "Tuen Ma Line (Austin)" },
    { a: "tst", b: "hunghom", landmark: "Tuen Ma Line (East Tsim Sha Tsui)" },
    { a: "kowloon", b: "shamshuipo", landmark: "Tung Chung Line (Olympic, Nam Cheong)" },
    { a: "hunghom", b: "mongkok", landmark: "Kwun Tong Line (Ho Man Tin)" },
    { a: "hunghom", b: "kaitak", landmark: "Tuen Ma Line (To Kwa Wan)" },
    { a: "mongkok", b: "kowloontong", landmark: "Kwun Tong Line (Shek Kip Mei)" },
    { a: "kowloontong", b: "wongtaisin", landmark: "Kwun Tong Line (Lok Fu)" },
    { a: "kaitak", b: "wongtaisin", landmark: "Tuen Ma Line (Diamond Hill)" },
    { a: "wongtaisin", b: "kowloonbay", landmark: "Kwun Tong Line (Choi Hung)" },
    { a: "kowloonbay", b: "kwuntong", landmark: "Kwun Tong Line (Ngau Tau Kok)" },
    { a: "kwuntong", b: "yautong", landmark: "Kwun Tong Line (Lam Tin)" },
    { a: "yautong", b: "tko", landmark: "Tseung Kwan O Line (Tiu Keng Leng)" },
    { a: "tko", b: "lohas", landmark: "Tseung Kwan O Line" },
    // East Rail and the Ma On Shan arm
    { a: "kowloontong", b: "shatin", landmark: "East Rail Line (Beacon Hill Tunnel)" },
    { a: "wongtaisin", b: "shatin", landmark: "Tuen Ma Line (Hin Keng)" },
    { a: "shatin", b: "maonshan", landmark: "Tuen Ma Line (Ma On Shan)" },
    { a: "shatin", b: "university", landmark: "East Rail Line (Fo Tan)" },
    { a: "university", b: "taipo", landmark: "East Rail Line along Tolo Harbour" },
    { a: "taipo", b: "sheungshui", landmark: "East Rail Line (Fanling)" },
    { a: "sheungshui", b: "lowu", landmark: "East Rail Line to the border" },
    { a: "sheungshui", b: "lokmachau", landmark: "East Rail Lok Ma Chau spur" },
    // North-west New Territories
    { a: "lokmachau", b: "kamsheung", landmark: "Northern Link" },
    { a: "tsuenwan", b: "kamsheung", landmark: "Tuen Ma Line (Tai Lam Tunnel)" },
    { a: "kamsheung", b: "yuenlong", landmark: "Tuen Ma Line" },
    { a: "yuenlong", b: "tinshuiwai", landmark: "Tuen Ma Line (Long Ping)" },
    { a: "tinshuiwai", b: "tuenmun", landmark: "Tuen Ma Line (Siu Hong)" },
    // Lantau and the airport
    { a: "laiking", b: "tsingyi", landmark: "Tung Chung Line over Rambler Channel" },
    { a: "kowloon", b: "tsingyi", landmark: "Airport Express (Stonecutters Bridge)" },
    { a: "tsingyi", b: "sunnybay", landmark: "Tsing Ma Bridge" },
    { a: "sunnybay", b: "disney", landmark: "Disneyland Resort Line" },
    { a: "sunnybay", b: "tungchung", landmark: "Tung Chung Line" },
    { a: "sunnybay", b: "airport", landmark: "Airport Express (North Lantau)" },
    { a: "tungchung", b: "airport", landmark: "Airport Road" },
    { a: "tuenmun", b: "airport", landmark: "Tuen Mun–Chek Lap Kok Link" },
    { a: "tungchung", b: "ngongping", landmark: "Ngong Ping 360 cable car" }
  ]
};

// Rough coastline, for drawing only. One sea outline: the mainland coast, Lantau joined on at
// Ma Wan, and Hong Kong Island cut out through Lei Yue Mun so Victoria Harbour runs between.
HONG_KONG.water = {
  ocean: [
    // Pearl River estuary and Deep Bay
    [113.7, 22.6], [113.8, 22.6], [113.86, 22.52], [113.9, 22.49], [113.94, 22.5], [113.98, 22.515], [114.02, 22.52],
    [114.04, 22.505], [114.03, 22.49], [114.0, 22.475], [113.982, 22.468], [113.962, 22.445],
    // Tuen Mun coast to Ting Kau
    [113.94, 22.42], [113.905, 22.405], [113.925, 22.385], [113.958, 22.373], [113.975, 22.37], [113.99, 22.365],
    [114.02, 22.367], [114.055, 22.364], [114.075, 22.362],
    // Ma Wan, then round Lantau: north shore west, south shore east
    [114.062, 22.354], [114.045, 22.345], [114.025, 22.341], [114.005, 22.336], [113.98, 22.325], [113.958, 22.31],
    [113.955, 22.33], [113.93, 22.334], [113.895, 22.327], [113.884, 22.31], [113.89, 22.297], [113.87, 22.29],
    [113.85, 22.272], [113.838, 22.255], [113.83, 22.21], [113.85, 22.203], [113.89, 22.218], [113.93, 22.225],
    [113.97, 22.234], [114.0, 22.22], [114.025, 22.24], [114.005, 22.265], [114.022, 22.29], [114.04, 22.3],
    [114.057, 22.305], [114.063, 22.325], [114.07, 22.343],
    // Tsing Yi and West Kowloon
    [114.088, 22.348], [114.097, 22.335], [114.112, 22.329], [114.132, 22.323], [114.145, 22.318], [114.151, 22.31],
    [114.153, 22.3], [114.16, 22.294],
    // Tsim Sha Tsui, Hung Hom and the old Kai Tak runway
    [114.17, 22.293], [114.178, 22.294], [114.188, 22.298], [114.192, 22.31], [114.196, 22.317], [114.213, 22.299],
    [114.217, 22.302], [114.205, 22.317], [114.21, 22.318], [114.218, 22.309], [114.226, 22.302], [114.232, 22.295],
    // Lei Yue Mun, then round Hong Kong Island: harbour shore west, south side east
    [114.237, 22.292], [114.237, 22.286], [114.229, 22.284], [114.218, 22.29], [114.205, 22.296], [114.192, 22.289],
    [114.182, 22.286], [114.17, 22.286], [114.16, 22.288], [114.148, 22.29], [114.13, 22.286], [114.115, 22.284],
    [114.108, 22.275], [114.122, 22.262], [114.134, 22.25], [114.138, 22.238], [114.15, 22.231], [114.162, 22.237],
    [114.172, 22.237], [114.185, 22.243], [114.196, 22.235], [114.205, 22.22], [114.213, 22.205], [114.222, 22.228],
    [114.235, 22.218], [114.254, 22.207], [114.252, 22.24], [114.257, 22.26], [114.247, 22.268], [114.245, 22.279],
    [114.237, 22.286], [114.237, 22.292],
    // Junk Bay and Clear Water Bay
    [114.243, 22.294], [114.25, 22.302], [114.257, 22.302], [114.264, 22.3], [114.264, 22.29], [114.272, 22.28],
    [114.29, 22.27], [114.4, 22.3], [114.4, 22.05], [113.7, 22.05]
  ],
  ribbons: [
    // Victoria Harbour, from the Sulphur Channel to Lei Yue Mun
    [[114.105, 22.29, 0.004], [114.13, 22.292, 0.003], [114.155, 22.292, 0.0025], [114.175, 22.29, 0.0025], [114.2, 22.299, 0.003],
      [114.222, 22.296, 0.003], [114.237, 22.289, 0.0018], [114.245, 22.285, 0.003]],
    // Rambler Channel, between Tsing Yi and Kwai Chung
    [[114.118, 22.328, 0.002], [114.117, 22.345, 0.0018], [114.113, 22.362, 0.0015], [114.1, 22.366, 0.0015], [114.085, 22.363, 0.002]],
    // Tolo Harbour
    [[114.33, 22.48, 0.01], [114.29, 22.46, 0.008], [114.255, 22.44, 0.007], [114.232, 22.437, 0.005], [114.21, 22.433, 0.004],
      [114.19, 22.438, 0.003], [114.178, 22.441, 0.0015]],
    // Shing Mun River through Sha Tin
    [[114.175, 22.372, 0.0012], [114.195, 22.377, 0.0013], [114.21, 22.388, 0.0015], [114.217, 22.405, 0.002], [114.222, 22.425, 0.003]],
    // Shenzhen River along the border
    [[114.035, 22.507, 0.0012], [114.065, 22.522, 0.001], [114.09, 22.53, 0.0009], [114.113, 22.535, 0.0008], [114.135, 22.545, 0.0007]]
  ]
};
