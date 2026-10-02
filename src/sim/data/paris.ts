import type { MapDef } from "../types";

// A simplified version of the Paris Métro + RER + Transilien network across Île-de-France.
// pop / jobs are rough thousands of residents and jobs in each station's catchment, on the same
// scale as the Sydney map. Section minutes are filled in from distance when omitted.
export const PARIS: MapDef = {
  id: "paris",
  name: "Paris",
  bounds: { lon0: 2.03, lon1: 2.82, lat0: 49.06, lat1: 48.6 },
  hubs: ["chatelet", "ladefense", "orly", "marne"],
  // extra starting money for hubs with fewer passengers nearby
  hubBonus: { chatelet: 0, ladefense: 900, orly: 800, marne: 1100 },
  stations: [
    // central Paris
    { id: "chatelet", name: "Châtelet–Les Halles", lon: 2.347, lat: 48.862, pop: 25, jobs: 200, icon: "city", label: "b" },
    { id: "concorde", name: "Concorde", lon: 2.321, lat: 48.866, pop: 10, jobs: 60, label: "b" },
    { id: "etoile", name: "Étoile", lon: 2.295, lat: 48.874, pop: 30, jobs: 50, label: "t" },
    { id: "stlazare", name: "Saint-Lazare", lon: 2.325, lat: 48.876, pop: 20, jobs: 60, label: "t" },
    { id: "gdn", name: "Gare du Nord", lon: 2.355, lat: 48.881, pop: 40, jobs: 35, label: "r" },
    { id: "gdl", name: "Gare de Lyon", lon: 2.373, lat: 48.845, pop: 35, jobs: 45, label: "b" },
    { id: "nation", name: "Nation", lon: 2.396, lat: 48.848, pop: 50, jobs: 15, label: "t" },
    { id: "montparnasse", name: "Montparnasse", lon: 2.321, lat: 48.842, pop: 45, jobs: 40, label: "l" },
    { id: "toureiffel", name: "Champ de Mars", lon: 2.29, lat: 48.856, pop: 30, jobs: 25, label: "l" },
    { id: "placeditalie", name: "Place d'Italie", lon: 2.356, lat: 48.831, pop: 50, jobs: 15, label: "r" },
    // west and north-west
    { id: "ladefense", name: "La Défense", lon: 2.239, lat: 48.892, pop: 25, jobs: 130, icon: "parramatta", label: "t" },
    { id: "rueil", name: "Rueil-Malmaison", lon: 2.175, lat: 48.875, pop: 40, jobs: 15, label: "b" },
    { id: "stgermain", name: "Saint-Germain-en-Laye", lon: 2.094, lat: 48.898, pop: 40, jobs: 12, label: "t" },
    { id: "sartrouville", name: "Sartrouville", lon: 2.159, lat: 48.938, pop: 45, jobs: 8, label: "l" },
    { id: "cergy", name: "Cergy", lon: 2.079, lat: 49.036, pop: 50, jobs: 25 },
    { id: "argenteuil", name: "Argenteuil", lon: 2.249, lat: 48.947, pop: 55, jobs: 15, label: "t" },
    { id: "boulogne", name: "Boulogne", lon: 2.239, lat: 48.84, pop: 55, jobs: 30, label: "l" },
    { id: "versailles", name: "Versailles", lon: 2.135, lat: 48.795, pop: 45, jobs: 25, label: "l" },
    // north and north-east
    { id: "saintdenis", name: "Saint-Denis", lon: 2.358, lat: 48.918, pop: 50, jobs: 30, label: "l" },
    { id: "lebourget", name: "Le Bourget", lon: 2.426, lat: 48.931, pop: 30, jobs: 20, label: "t" },
    { id: "aulnay", name: "Aulnay-sous-Bois", lon: 2.495, lat: 48.932, pop: 50, jobs: 12, label: "r" },
    { id: "cdg", name: "Charles de Gaulle", lon: 2.571, lat: 49.004, pop: 2, jobs: 85 },
    // east
    { id: "noisylesec", name: "Noisy-le-Sec", lon: 2.458, lat: 48.891, pop: 40, jobs: 10, label: "b" },
    { id: "chelles", name: "Chelles", lon: 2.586, lat: 48.875, pop: 40, jobs: 8, label: "t" },
    { id: "vincennes", name: "Vincennes", lon: 2.433, lat: 48.847, pop: 45, jobs: 12, label: "t" },
    { id: "noisychamps", name: "Noisy-Champs", lon: 2.582, lat: 48.843, pop: 40, jobs: 20, label: "b" },
    { id: "torcy", name: "Torcy", lon: 2.651, lat: 48.85, pop: 35, jobs: 12, label: "b" },
    { id: "marne", name: "Marne-la-Vallée", lon: 2.783, lat: 48.87, pop: 25, jobs: 45, icon: "liverpool", label: "b" },
    // south
    { id: "creteil", name: "Créteil", lon: 2.459, lat: 48.78, pop: 55, jobs: 30 },
    { id: "villejuif", name: "Villejuif", lon: 2.348, lat: 48.795, pop: 50, jobs: 25, label: "l" },
    { id: "choisy", name: "Choisy-le-Roi", lon: 2.409, lat: 48.763, pop: 40, jobs: 10 },
    { id: "juvisy", name: "Juvisy", lon: 2.383, lat: 48.69, pop: 35, jobs: 10 },
    { id: "orly", name: "Orly", lon: 2.359, lat: 48.728, pop: 2, jobs: 75, icon: "airport", label: "l" },
    { id: "antony", name: "Antony", lon: 2.301, lat: 48.755, pop: 45, jobs: 10, label: "l" },
    { id: "massy", name: "Massy", lon: 2.258, lat: 48.725, pop: 40, jobs: 20, label: "b" },
    { id: "saclay", name: "Paris-Saclay", lon: 2.17, lat: 48.712, pop: 15, jobs: 40, label: "b" },
    { id: "evry", name: "Évry", lon: 2.437, lat: 48.627, pop: 50, jobs: 30 }
  ],
  sections: [
    // central
    { a: "chatelet", b: "concorde", landmark: "Métro 1 under the Louvre" },
    { a: "concorde", b: "etoile", landmark: "Champs-Élysées" },
    { a: "concorde", b: "stlazare", landmark: "Métro 14" },
    { a: "chatelet", b: "gdn", landmark: "RER B/D, busiest tunnel in Europe" },
    { a: "gdn", b: "stlazare", landmark: "RER E" },
    { a: "chatelet", b: "gdl", landmark: "RER A" },
    { a: "gdl", b: "nation", landmark: "RER A" },
    { a: "chatelet", b: "montparnasse", landmark: "Métro 4, Seine crossing" },
    { a: "chatelet", b: "placeditalie", landmark: "Métro 7, Seine crossing" },
    { a: "montparnasse", b: "placeditalie", landmark: "Métro 6" },
    { a: "etoile", b: "toureiffel", landmark: "Métro 6 over the Seine" },
    { a: "toureiffel", b: "boulogne", landmark: "Métro 9 / RER C" },
    // west
    { a: "etoile", b: "ladefense", landmark: "RER A, Pont de Neuilly" },
    { a: "stlazare", b: "ladefense", landmark: "Transilien L" },
    { a: "ladefense", b: "rueil", landmark: "RER A" },
    { a: "rueil", b: "stgermain", landmark: "RER A, Le Vésinet" },
    { a: "ladefense", b: "sartrouville", landmark: "RER A Cergy branch" },
    { a: "sartrouville", b: "cergy", landmark: "RER A Cergy branch" },
    { a: "stlazare", b: "argenteuil", landmark: "Transilien J" },
    { a: "argenteuil", b: "sartrouville", landmark: "Seine crossing at Bezons" },
    { a: "boulogne", b: "versailles", landmark: "Transilien N, Meudon woods" },
    { a: "versailles", b: "stgermain", landmark: "Tram T13" },
    // north and east
    { a: "gdn", b: "saintdenis", landmark: "RER D, Stade de France" },
    { a: "gdn", b: "lebourget", landmark: "RER B" },
    { a: "lebourget", b: "aulnay", landmark: "RER B" },
    { a: "aulnay", b: "cdg", landmark: "RER B to the airport" },
    { a: "saintdenis", b: "noisylesec", landmark: "Tram T1" },
    { a: "gdn", b: "noisylesec", landmark: "RER E, Pantin" },
    { a: "noisylesec", b: "chelles", landmark: "RER E" },
    { a: "aulnay", b: "chelles", landmark: "Ligne 16" },
    { a: "chelles", b: "noisychamps", landmark: "Ligne 16, Marne crossing" },
    { a: "nation", b: "vincennes", landmark: "RER A" },
    { a: "vincennes", b: "noisychamps", landmark: "RER A, Marne crossing" },
    { a: "noisychamps", b: "torcy", landmark: "RER A" },
    { a: "torcy", b: "marne", landmark: "RER A to Disneyland" },
    { a: "cdg", b: "marne", minutes: 12, landmark: "TGV Interconnexion" },
    // south
    { a: "boulogne", b: "villejuif", landmark: "Ligne 15 Sud" },
    { a: "placeditalie", b: "villejuif", landmark: "Métro 7" },
    { a: "villejuif", b: "creteil", landmark: "Ligne 15 Sud, Seine crossing" },
    { a: "creteil", b: "noisychamps", landmark: "Ligne 15 Sud, Champigny" },
    { a: "gdl", b: "choisy", landmark: "RER C along the Seine" },
    { a: "choisy", b: "juvisy", landmark: "RER C" },
    { a: "choisy", b: "orly", landmark: "Tram T9" },
    { a: "villejuif", b: "orly", landmark: "Métro 14" },
    { a: "orly", b: "antony", landmark: "Orlyval" },
    { a: "antony", b: "montparnasse", landmark: "RER B, Denfert-Rochereau" },
    { a: "antony", b: "massy", landmark: "RER B" },
    { a: "massy", b: "versailles", landmark: "RER C" },
    { a: "massy", b: "saclay", landmark: "Ligne 18" },
    { a: "juvisy", b: "evry", landmark: "RER D" }
  ],
  events: [
    { station: "saintdenis", title: "Stade de France rugby", emoji: "🏉" },
    { station: "boulogne", title: "PSG at Parc des Princes", emoji: "⚽" },
    { station: "boulogne", title: "Roland-Garros", emoji: "🎾" },
    { station: "toureiffel", title: "Bastille Day fireworks", emoji: "🎆" },
    { station: "marne", title: "Disneyland parade", emoji: "🏰" },
    { station: "versailles", title: "Versailles fountain show", emoji: "⛲" },
    { station: "concorde", title: "Tour de France finish", emoji: "🚴" },
    { station: "lebourget", title: "Paris Air Show", emoji: "✈️" },
    { station: "ladefense", title: "Concert at La Défense Arena", emoji: "🎤" },
    { station: "chatelet", title: "Fête de la Musique", emoji: "🎶" },
    { station: "etoile", title: "Paris Marathon", emoji: "🏃" }
  ],
  water: {
    ocean: [],
    ribbons: [
      // Seine, from Évry downstream through Paris, round the Boulogne and Gennevilliers loops,
      // past Saint-Germain and out north-west towards Conflans and Poissy
      [
        [2.47, 48.59, 0.002], [2.452, 48.62, 0.002], [2.425, 48.655, 0.002], [2.398, 48.68, 0.002], [2.402, 48.71, 0.002],
        [2.414, 48.745, 0.002], [2.42, 48.78, 0.002], [2.415, 48.81, 0.002], [2.398, 48.828, 0.002], [2.378, 48.84, 0.002],
        [2.362, 48.849, 0.002], [2.348, 48.855, 0.0018], [2.335, 48.859, 0.0018], [2.318, 48.864, 0.0018], [2.3, 48.862, 0.0018],
        [2.287, 48.857, 0.002], [2.275, 48.848, 0.002], [2.262, 48.837, 0.002], [2.248, 48.826, 0.002], [2.232, 48.826, 0.002],
        [2.222, 48.84, 0.002], [2.228, 48.86, 0.002], [2.243, 48.878, 0.002], [2.262, 48.893, 0.002], [2.285, 48.905, 0.002],
        [2.31, 48.913, 0.002], [2.335, 48.925, 0.002], [2.342, 48.935, 0.002], [2.322, 48.937, 0.002], [2.29, 48.932, 0.002],
        [2.262, 48.935, 0.002], [2.232, 48.932, 0.002], [2.205, 48.918, 0.002], [2.18, 48.898, 0.002], [2.158, 48.888, 0.002],
        [2.132, 48.888, 0.002], [2.11, 48.9, 0.002], [2.112, 48.922, 0.002], [2.135, 48.945, 0.002], [2.155, 48.962, 0.002],
        [2.148, 48.985, 0.002], [2.12, 48.995, 0.002], [2.095, 48.993, 0.002], [2.07, 48.97, 0.002], [2.05, 48.945, 0.002],
        [2.035, 48.925, 0.002], [2.0, 48.91, 0.002]
      ],
      // Marne, from Chessy west past Torcy and round the Saint-Maur loop to Charenton
      [
        [2.84, 48.885, 0.0012], [2.79, 48.882, 0.0012], [2.75, 48.878, 0.0012], [2.71, 48.873, 0.0012], [2.67, 48.862, 0.0012],
        [2.63, 48.855, 0.0012], [2.6, 48.852, 0.0012], [2.565, 48.86, 0.0012], [2.535, 48.858, 0.0012], [2.518, 48.842, 0.0012],
        [2.5, 48.828, 0.0012], [2.478, 48.82, 0.0012], [2.49, 48.8, 0.0012], [2.475, 48.789, 0.0012], [2.452, 48.795, 0.0012],
        [2.44, 48.812, 0.0012], [2.425, 48.818, 0.0012], [2.413, 48.815, 0.0012]
      ],
      // Oise, through the Cergy loop to its confluence with the Seine at Conflans
      [
        [2.11, 49.07, 0.0012], [2.09, 49.05, 0.0012], [2.065, 49.045, 0.0012], [2.045, 49.03, 0.0012], [2.06, 49.015, 0.0012],
        [2.08, 49.005, 0.0012], [2.095, 48.993, 0.0012]
      ]
    ]
  }
};
