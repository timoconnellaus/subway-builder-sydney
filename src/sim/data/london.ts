import type { MapDef } from "../types";

// A simplified version of the London Underground, Overground, Elizabeth line, DLR and National Rail.
// pop / jobs are rough thousands of residents and jobs in each station's catchment (same scale as Sydney).
// Section minutes are filled in from distance when omitted.
export const LONDON: MapDef = {
  id: "london",
  name: "London",
  bounds: { lon0: -0.5, lon1: 0.23, lat0: 51.65, lat1: 51.31 },
  hubs: ["bank", "canarywharf", "heathrow", "croydon"],
  // extra starting money; the Bank gets some too because the crowded City leaves it little room to grow
  hubBonus: { bank: 800, canarywharf: 500, heathrow: 1000, croydon: 1500 },
  events: [
    { station: "finsburypark", title: "Arsenal at the Emirates", emoji: "⚽" },
    { station: "tottenham", title: "Spurs at Tottenham Hotspur Stadium", emoji: "⚽" },
    { station: "stratford", title: "West Ham at the London Stadium", emoji: "⚽" },
    { station: "norwood", title: "Crystal Palace at Selhurst Park", emoji: "⚽" },
    { station: "wembley", title: "Cup final at Wembley", emoji: "🏟️" },
    { station: "wimbledon", title: "Wimbledon fortnight", emoji: "🎾" },
    { station: "richmond", title: "Six Nations at Twickenham", emoji: "🏉" },
    { station: "paddington", title: "Notting Hill Carnival", emoji: "🎉" },
    { station: "hammersmith", title: "The Boat Race", emoji: "🚣" },
    { station: "canarywharf", title: "Concert at the O2", emoji: "🎤" },
    { station: "cityairport", title: "Trade show at ExCeL", emoji: "📊" },
    { station: "camden", title: "Camden Market weekend", emoji: "🎸" }
  ],
  stations: [
    { id: "bank", name: "Bank", lon: -0.089, lat: 51.513, pop: 20, jobs: 200, icon: "city", label: "l" },
    { id: "liverpoolst", name: "Liverpool Street", lon: -0.082, lat: 51.518, pop: 20, jobs: 60, label: "t" },
    { id: "londonbridge", name: "London Bridge", lon: -0.086, lat: 51.505, pop: 20, jobs: 45, label: "b" },
    { id: "kingscross", name: "King's Cross", lon: -0.124, lat: 51.531, pop: 25, jobs: 45, label: "t" },
    { id: "oxfordcircus", name: "Oxford Circus", lon: -0.142, lat: 51.515, pop: 20, jobs: 90, label: "l" },
    { id: "waterloo", name: "Waterloo", lon: -0.113, lat: 51.503, pop: 15, jobs: 45, label: "l" },
    { id: "paddington", name: "Paddington", lon: -0.176, lat: 51.516, pop: 30, jobs: 30, label: "l" },
    { id: "victoria", name: "Victoria", lon: -0.144, lat: 51.496, pop: 25, jobs: 40, label: "b" },
    { id: "camden", name: "Camden Town", lon: -0.143, lat: 51.539, pop: 35, jobs: 15, label: "t" },
    { id: "islington", name: "Highbury & Islington", lon: -0.104, lat: 51.546, pop: 40, jobs: 12, label: "l" },
    { id: "finsburypark", name: "Finsbury Park", lon: -0.106, lat: 51.564, pop: 40, jobs: 8, label: "l" },
    { id: "tottenham", name: "Tottenham Hale", lon: -0.06, lat: 51.588, pop: 45, jobs: 10, label: "t" },
    { id: "walthamstow", name: "Walthamstow", lon: -0.02, lat: 51.583, pop: 50, jobs: 10 },
    { id: "hackney", name: "Hackney Central", lon: -0.056, lat: 51.547, pop: 45, jobs: 12 },
    { id: "whitechapel", name: "Whitechapel", lon: -0.061, lat: 51.514, pop: 40, jobs: 15, label: "t" },
    { id: "stratford", name: "Stratford", lon: -0.003, lat: 51.542, pop: 45, jobs: 35 },
    { id: "canadawater", name: "Canada Water", lon: -0.05, lat: 51.498, pop: 35, jobs: 10, label: "b" },
    { id: "canarywharf", name: "Canary Wharf", lon: -0.019, lat: 51.505, pop: 25, jobs: 125, icon: "parramatta", label: "t" },
    { id: "cityairport", name: "City Airport", lon: 0.049, lat: 51.504, pop: 15, jobs: 20, label: "t" },
    { id: "woolwich", name: "Woolwich", lon: 0.069, lat: 51.49, pop: 45, jobs: 12, label: "b" },
    { id: "lewisham", name: "Lewisham", lon: -0.014, lat: 51.465, pop: 45, jobs: 12 },
    { id: "newcross", name: "New Cross", lon: -0.04, lat: 51.475, pop: 40, jobs: 8, label: "l" },
    { id: "ilford", name: "Ilford", lon: 0.069, lat: 51.559, pop: 55, jobs: 15 },
    { id: "romford", name: "Romford", lon: 0.183, lat: 51.575, pop: 50, jobs: 20, label: "l" },
    { id: "bromley", name: "Bromley", lon: 0.017, lat: 51.4, pop: 50, jobs: 20 },
    { id: "norwood", name: "Norwood Junction", lon: -0.075, lat: 51.397, pop: 35, jobs: 6 },
    { id: "croydon", name: "Croydon", lon: -0.092, lat: 51.375, pop: 55, jobs: 50, icon: "liverpool", label: "b" },
    { id: "brixton", name: "Brixton", lon: -0.114, lat: 51.462, pop: 45, jobs: 12 },
    { id: "claphamjn", name: "Clapham Junction", lon: -0.17, lat: 51.464, pop: 40, jobs: 12, label: "l" },
    { id: "wimbledon", name: "Wimbledon", lon: -0.206, lat: 51.421, pop: 40, jobs: 18, label: "l" },
    { id: "hammersmith", name: "Hammersmith", lon: -0.224, lat: 51.492, pop: 40, jobs: 30, label: "b" },
    { id: "willesden", name: "Willesden Junction", lon: -0.244, lat: 51.532, pop: 35, jobs: 10, label: "t" },
    { id: "wembley", name: "Wembley Park", lon: -0.279, lat: 51.563, pop: 45, jobs: 15, label: "t" },
    { id: "ealing", name: "Ealing Broadway", lon: -0.302, lat: 51.515, pop: 50, jobs: 20, label: "t" },
    { id: "richmond", name: "Richmond", lon: -0.301, lat: 51.463, pop: 40, jobs: 12, label: "b" },
    { id: "southall", name: "Southall", lon: -0.378, lat: 51.506, pop: 45, jobs: 10, label: "t" },
    { id: "hounslow", name: "Hounslow", lon: -0.366, lat: 51.471, pop: 50, jobs: 12, label: "b" },
    { id: "heathrow", name: "Heathrow", lon: -0.454, lat: 51.471, pop: 2, jobs: 80, icon: "airport", label: "b" }
  ],
  sections: [
    // the City and West End
    { a: "bank", b: "liverpoolst", landmark: "Central line" },
    { a: "bank", b: "londonbridge", landmark: "Northern line under the Thames" },
    { a: "bank", b: "oxfordcircus", landmark: "Central line" },
    { a: "bank", b: "kingscross", landmark: "Northern line" },
    { a: "oxfordcircus", b: "paddington", landmark: "Elizabeth line" },
    { a: "oxfordcircus", b: "kingscross", landmark: "Victoria line" },
    { a: "oxfordcircus", b: "victoria", landmark: "Victoria line" },
    { a: "waterloo", b: "londonbridge", landmark: "Jubilee line" },
    // north
    { a: "kingscross", b: "camden", landmark: "Northern line" },
    { a: "kingscross", b: "islington", landmark: "Victoria line" },
    { a: "islington", b: "finsburypark", landmark: "Victoria line" },
    { a: "finsburypark", b: "tottenham", landmark: "Victoria line" },
    { a: "tottenham", b: "walthamstow", landmark: "Victoria line" },
    { a: "hackney", b: "liverpoolst", landmark: "Overground via Hackney Downs" },
    { a: "islington", b: "hackney", landmark: "North London line" },
    { a: "tottenham", b: "stratford", landmark: "Lea Valley line" },
    { a: "camden", b: "willesden", landmark: "North London line" },
    // east
    { a: "liverpoolst", b: "whitechapel", landmark: "Elizabeth line" },
    { a: "liverpoolst", b: "stratford", landmark: "Great Eastern main line" },
    { a: "whitechapel", b: "canarywharf", landmark: "Elizabeth line" },
    { a: "londonbridge", b: "canadawater", landmark: "Jubilee line" },
    { a: "canadawater", b: "canarywharf", landmark: "Jubilee line under the Thames" },
    { a: "canarywharf", b: "stratford", landmark: "Jubilee line" },
    { a: "canarywharf", b: "cityairport", landmark: "DLR past the Royal Docks" },
    { a: "cityairport", b: "woolwich", landmark: "DLR under the Thames" },
    { a: "stratford", b: "ilford", landmark: "Elizabeth line" },
    { a: "ilford", b: "romford", landmark: "Elizabeth line" },
    { a: "canarywharf", b: "lewisham", landmark: "DLR via Greenwich" },
    { a: "lewisham", b: "woolwich", landmark: "North Kent line" },
    // south
    { a: "londonbridge", b: "newcross", landmark: "Brighton main line" },
    { a: "newcross", b: "norwood", landmark: "East London line" },
    { a: "norwood", b: "croydon", landmark: "Brighton main line" },
    { a: "lewisham", b: "bromley", landmark: "Southeastern via Catford" },
    { a: "bromley", b: "brixton", landmark: "Chatham main line" },
    { a: "brixton", b: "victoria", landmark: "Victoria line" },
    { a: "claphamjn", b: "croydon", landmark: "Brighton main line" },
    { a: "victoria", b: "claphamjn", landmark: "Grosvenor Bridge" },
    { a: "waterloo", b: "claphamjn", landmark: "South Western main line" },
    { a: "claphamjn", b: "wimbledon", landmark: "South Western main line" },
    { a: "wimbledon", b: "croydon", landmark: "Tramlink" },
    // west
    { a: "claphamjn", b: "richmond", landmark: "Windsor line" },
    { a: "richmond", b: "hammersmith", landmark: "District line" },
    { a: "hammersmith", b: "victoria", landmark: "District line" },
    { a: "hammersmith", b: "hounslow", landmark: "Piccadilly line" },
    { a: "hounslow", b: "heathrow", landmark: "Piccadilly line" },
    { a: "paddington", b: "ealing", landmark: "Elizabeth line" },
    { a: "ealing", b: "southall", landmark: "Elizabeth line" },
    { a: "southall", b: "heathrow", landmark: "Elizabeth line to Heathrow" },
    { a: "willesden", b: "wembley", landmark: "Bakerloo line" },
    { a: "wembley", b: "oxfordcircus", landmark: "Jubilee line" },
  ]
};

// The Thames and the Lea, for drawing only: centreline points with half-width in degrees.
LONDON.water = {
  ocean: [],
  ribbons: [
    // Thames, from Staines down to Dagenham
    [
      [-0.51, 51.432, 0.0015], [-0.46, 51.415, 0.0015], [-0.42, 51.405, 0.0016], [-0.37, 51.4, 0.0017], [-0.34, 51.403, 0.0018],
      [-0.31, 51.41, 0.0018], [-0.313, 51.43, 0.0018], [-0.318, 51.447, 0.0018], [-0.306, 51.459, 0.002], [-0.29, 51.478, 0.002],
      [-0.27, 51.487, 0.002], [-0.25, 51.474, 0.0022], [-0.235, 51.482, 0.0022], [-0.228, 51.49, 0.0022], [-0.214, 51.472, 0.0022],
      [-0.195, 51.464, 0.0024], [-0.178, 51.474, 0.0025], [-0.163, 51.482, 0.0025], [-0.14, 51.485, 0.0026], [-0.124, 51.488, 0.0026],
      [-0.122, 51.5, 0.0026], [-0.116, 51.508, 0.0026], [-0.104, 51.51, 0.0027], [-0.088, 51.508, 0.0027], [-0.074, 51.505, 0.0028],
      [-0.058, 51.505, 0.003], [-0.043, 51.508, 0.003], [-0.032, 51.503, 0.003], [-0.028, 51.49, 0.003], [-0.012, 51.484, 0.003],
      [0.004, 51.49, 0.0032], [0.007, 51.502, 0.0032], [0.015, 51.507, 0.0032], [0.028, 51.5, 0.0034], [0.05, 51.497, 0.0035],
      [0.072, 51.496, 0.0036], [0.1, 51.506, 0.0038], [0.13, 51.511, 0.004], [0.165, 51.505, 0.004], [0.24, 51.49, 0.004]
    ],
    // River Lea
    [
      [-0.048, 51.62, 0.001], [-0.054, 51.59, 0.001], [-0.045, 51.567, 0.001], [-0.028, 51.55, 0.0011], [-0.013, 51.532, 0.0011],
      [-0.002, 51.516, 0.0012], [0.006, 51.508, 0.0014]
    ]
  ]
};
