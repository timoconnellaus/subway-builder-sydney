import type { MapDef } from "../types";

// A simplified version of the Berlin S-Bahn + U-Bahn network: the Ringbahn, the east–west
// Stadtbahn, the north–south tunnel and the main U-Bahn lines, out to Spandau, Potsdam and BER.
// pop / jobs are rough thousands of residents and jobs in each station's catchment, on the same
// scale as the Sydney map. Section minutes are filled in from distance when omitted.
export const BERLIN: MapDef = {
  id: "berlin",
  name: "Berlin",
  bounds: { lon0: 13.02, lon1: 13.7, lat0: 52.62, lat1: 52.35 },
  hubs: ["alex", "zoo", "ber", "spandau"],
  // extra starting money for hubs with fewer passengers nearby
  hubBonus: { alex: 0, zoo: 1500, ber: 900, spandau: 300 },
  stations: [
    // Mitte and the Stadtbahn
    { id: "alex", name: "Alexanderplatz", lon: 13.412, lat: 52.521, pop: 25, jobs: 200, icon: "city", label: "r" },
    { id: "friedrich", name: "Friedrichstraße", lon: 13.388, lat: 52.52, pop: 15, jobs: 70, label: "t" },
    { id: "hbf", name: "Hauptbahnhof", lon: 13.369, lat: 52.525, pop: 15, jobs: 50, label: "t" },
    { id: "potsdamer", name: "Potsdamer Platz", lon: 13.376, lat: 52.509, pop: 10, jobs: 60, label: "b" },
    { id: "zoo", name: "Zoologischer Garten", lon: 13.333, lat: 52.507, pop: 30, jobs: 110, icon: "parramatta", label: "l" },
    { id: "ostbahnhof", name: "Ostbahnhof", lon: 13.435, lat: 52.51, pop: 30, jobs: 30, label: "r" },
    { id: "kotti", name: "Kottbusser Tor", lon: 13.418, lat: 52.499, pop: 55, jobs: 15, label: "b" },
    // north
    { id: "gesund", name: "Gesundbrunnen", lon: 13.388, lat: 52.549, pop: 45, jobs: 15, label: "l" },
    { id: "prenzlauer", name: "Prenzlauer Berg", lon: 13.427, lat: 52.545, pop: 55, jobs: 15, label: "r" },
    { id: "pankow", name: "Pankow", lon: 13.412, lat: 52.567, pop: 50, jobs: 12, label: "t" },
    { id: "weissensee", name: "Weißensee", lon: 13.465, lat: 52.553, pop: 40, jobs: 8, label: "r" },
    { id: "wittenau", name: "Wittenau", lon: 13.334, lat: 52.597, pop: 45, jobs: 8, label: "t" },
    { id: "tegel", name: "Tegel", lon: 13.285, lat: 52.588, pop: 40, jobs: 20, label: "l" },
    // west
    { id: "jungfernheide", name: "Jungfernheide", lon: 13.299, lat: 52.531, pop: 30, jobs: 20, label: "t" },
    { id: "siemensstadt", name: "Siemensstadt", lon: 13.254, lat: 52.537, pop: 25, jobs: 25, label: "t" },
    { id: "spandau", name: "Spandau", lon: 13.199, lat: 52.534, pop: 55, jobs: 25, icon: "liverpool", label: "l" },
    { id: "westkreuz", name: "Westkreuz", lon: 13.283, lat: 52.501, pop: 40, jobs: 15, label: "l" },
    { id: "olympia", name: "Olympiastadion", lon: 13.239, lat: 52.511, pop: 15, jobs: 8, label: "b" },
    // south-west
    { id: "steglitz", name: "Steglitz", lon: 13.32, lat: 52.456, pop: 55, jobs: 25, label: "r" },
    { id: "dahlem", name: "Dahlem", lon: 13.29, lat: 52.457, pop: 20, jobs: 25, label: "l" },
    { id: "zehlendorf", name: "Zehlendorf", lon: 13.259, lat: 52.431, pop: 45, jobs: 10, label: "b" },
    { id: "wannsee", name: "Wannsee", lon: 13.179, lat: 52.421, pop: 15, jobs: 8, label: "b" },
    { id: "potsdam", name: "Potsdam", lon: 13.067, lat: 52.392, pop: 55, jobs: 35, label: "b" },
    // south
    { id: "suedkreuz", name: "Südkreuz", lon: 13.365, lat: 52.476, pop: 35, jobs: 20, label: "l" },
    { id: "tempelhof", name: "Tempelhof", lon: 13.386, lat: 52.47, pop: 40, jobs: 15, label: "b" },
    { id: "mariendorf", name: "Mariendorf", lon: 13.388, lat: 52.439, pop: 45, jobs: 8, label: "l" },
    { id: "neukoelln", name: "Neukölln", lon: 13.442, lat: 52.469, pop: 60, jobs: 15, label: "l" },
    { id: "rudow", name: "Rudow", lon: 13.497, lat: 52.416, pop: 40, jobs: 6, label: "l" },
    { id: "ber", name: "Flughafen BER", lon: 13.513, lat: 52.366, pop: 2, jobs: 70, icon: "airport", label: "r" },
    // east and south-east
    { id: "ostkreuz", name: "Ostkreuz", lon: 13.469, lat: 52.503, pop: 40, jobs: 15, label: "b" },
    { id: "lichtenberg", name: "Lichtenberg", lon: 13.497, lat: 52.51, pop: 45, jobs: 15, label: "r" },
    { id: "marzahn", name: "Marzahn", lon: 13.543, lat: 52.544, pop: 60, jobs: 10, label: "t" },
    { id: "hellersdorf", name: "Hellersdorf", lon: 13.606, lat: 52.537, pop: 50, jobs: 8, label: "b" },
    { id: "schoeneweide", name: "Schöneweide", lon: 13.51, lat: 52.455, pop: 30, jobs: 20, label: "l" },
    { id: "adlershof", name: "Adlershof", lon: 13.541, lat: 52.435, pop: 20, jobs: 30, label: "r" },
    { id: "koepenick", name: "Köpenick", lon: 13.581, lat: 52.458, pop: 45, jobs: 12, label: "r" }
  ],
  sections: [
    // Stadtbahn, east to west
    { a: "ostkreuz", b: "ostbahnhof", landmark: "Stadtbahn, Warschauer Straße" },
    { a: "ostbahnhof", b: "alex", landmark: "Stadtbahn, Jannowitzbrücke" },
    { a: "alex", b: "friedrich", landmark: "Stadtbahn past Museum Island" },
    { a: "friedrich", b: "hbf", landmark: "Stadtbahn over the Spree" },
    { a: "hbf", b: "zoo", landmark: "Stadtbahn through the Tiergarten" },
    { a: "zoo", b: "westkreuz", landmark: "Stadtbahn, Charlottenburg" },
    { a: "westkreuz", b: "olympia", landmark: "S3 / S9, Heerstraße" },
    { a: "olympia", b: "spandau", landmark: "S3 / S9 over the Havel" },
    // north–south tunnel and the centre
    { a: "gesund", b: "friedrich", landmark: "North–south tunnel, Nordbahnhof" },
    { a: "friedrich", b: "potsdamer", landmark: "North–south tunnel, Brandenburg Gate" },
    { a: "potsdamer", b: "suedkreuz", landmark: "S2 / S25, Yorckstraße" },
    { a: "zoo", b: "potsdamer", landmark: "U2 via Wittenbergplatz" },
    { a: "alex", b: "kotti", landmark: "U8 under the Spree" },
    { a: "kotti", b: "potsdamer", landmark: "U1 / U2 via Gleisdreieck" },
    { a: "kotti", b: "neukoelln", landmark: "U8 via Hermannplatz" },
    { a: "alex", b: "lichtenberg", landmark: "U5 Karl-Marx-Allee" },
    // Ringbahn
    { a: "gesund", b: "prenzlauer", landmark: "Ringbahn, Schönhauser Allee" },
    { a: "prenzlauer", b: "ostkreuz", landmark: "Ringbahn, Storkower Straße" },
    { a: "ostkreuz", b: "neukoelln", landmark: "Ringbahn, Treptower Park" },
    { a: "neukoelln", b: "tempelhof", landmark: "Ringbahn" },
    { a: "tempelhof", b: "suedkreuz", landmark: "Ringbahn by Tempelhofer Feld" },
    { a: "suedkreuz", b: "westkreuz", landmark: "Ringbahn, Bundesplatz" },
    { a: "westkreuz", b: "jungfernheide", landmark: "Ringbahn, Westend" },
    { a: "jungfernheide", b: "gesund", landmark: "Ringbahn, Westhafen and Wedding" },
    // north
    { a: "gesund", b: "pankow", landmark: "S2 / S8, Bornholmer Straße" },
    { a: "alex", b: "pankow", landmark: "U2 Schönhauser Allee" },
    { a: "alex", b: "weissensee", landmark: "Tram M4" },
    { a: "hbf", b: "tegel", landmark: "TXL bus via Wedding" },
    { a: "tegel", b: "wittenau", landmark: "S25, Karl-Bonhoeffer" },
    { a: "wittenau", b: "gesund", landmark: "S1 / U8, Märkisches Viertel" },
    // west
    { a: "spandau", b: "siemensstadt", landmark: "U7 Rohrdamm" },
    { a: "siemensstadt", b: "jungfernheide", landmark: "U7 / Siemensbahn" },
    // south-west
    { a: "zoo", b: "steglitz", landmark: "U9 Bundesallee" },
    { a: "zoo", b: "dahlem", landmark: "U3 to the Freie Universität" },
    { a: "dahlem", b: "zehlendorf", landmark: "U3 to Krumme Lanke" },
    { a: "steglitz", b: "zehlendorf", landmark: "S1" },
    { a: "zehlendorf", b: "wannsee", landmark: "S1 by Schlachtensee" },
    { a: "westkreuz", b: "wannsee", landmark: "S7 through the Grunewald" },
    { a: "wannsee", b: "potsdam", landmark: "S7 past Griebnitzsee" },
    // south
    { a: "tempelhof", b: "mariendorf", landmark: "U6 Tempelhofer Damm" },
    { a: "mariendorf", b: "ber", landmark: "Dresdner Bahn / FEX, Lichtenrade" },
    { a: "neukoelln", b: "rudow", landmark: "U7 through Britz" },
    { a: "rudow", b: "ber", landmark: "U7 extension (planned)" },
    // east and south-east
    { a: "ostkreuz", b: "lichtenberg", landmark: "S5 / S7, Nöldnerplatz" },
    { a: "lichtenberg", b: "marzahn", landmark: "S7 Springpfuhl" },
    { a: "lichtenberg", b: "hellersdorf", landmark: "U5 Biesdorf" },
    { a: "neukoelln", b: "schoeneweide", landmark: "S45 / S46, Köllnische Heide" },
    { a: "ostkreuz", b: "schoeneweide", landmark: "S8 / S9, Baumschulenweg" },
    { a: "schoeneweide", b: "adlershof", landmark: "S8 / S9 / S45" },
    { a: "adlershof", b: "ber", landmark: "S9 to the airport, Altglienicke" },
    { a: "adlershof", b: "koepenick", landmark: "Tram 60 / 61" },
    { a: "ostkreuz", b: "koepenick", landmark: "S3 Karlshorst" }
  ],
  events: [
    { station: "olympia", title: "Hertha at the Olympiastadion", emoji: "⚽" },
    { station: "koepenick", title: "Union at the Alte Försterei", emoji: "⚽" },
    { station: "hbf", title: "Berlin Marathon", emoji: "🏃" },
    { station: "alex", title: "Festival of Lights", emoji: "✨" },
    { station: "friedrich", title: "New Year's Eve at the Brandenburg Gate", emoji: "🎆" },
    { station: "potsdamer", title: "Berlinale premieres", emoji: "🎬" },
    { station: "alex", title: "Christmas markets", emoji: "🎄" },
    { station: "kotti", title: "Karneval der Kulturen", emoji: "🎉" },
    { station: "ostbahnhof", title: "Alba game at the Uber Arena", emoji: "🏀" },
    { station: "tempelhof", title: "Festival on Tempelhofer Feld", emoji: "🪁" },
    { station: "prenzlauer", title: "Sunday karaoke in the Mauerpark", emoji: "🎤" },
    { station: "potsdam", title: "Sanssouci palace night", emoji: "🏰" }
  ],
  water: {
    ocean: [],
    ribbons: [
      // Spree, from the Müggelsee past Köpenick, Treptow and Museum Island to Spandau
      [
        [13.7, 52.43, 0.0015], [13.675, 52.437, 0.004], [13.645, 52.438, 0.006], [13.62, 52.443, 0.004], [13.6, 52.448, 0.0015],
        [13.578, 52.448, 0.0015], [13.555, 52.452, 0.0015], [13.525, 52.461, 0.0015], [13.5, 52.473, 0.0015], [13.48, 52.485, 0.0015],
        [13.462, 52.495, 0.0015], [13.447, 52.502, 0.0015], [13.43, 52.509, 0.0015], [13.415, 52.513, 0.0015], [13.402, 52.517, 0.0013],
        [13.392, 52.522, 0.0013], [13.38, 52.52, 0.0013], [13.37, 52.521, 0.0013], [13.358, 52.521, 0.0013], [13.345, 52.518, 0.0013],
        [13.332, 52.522, 0.0013], [13.318, 52.524, 0.0013], [13.302, 52.525, 0.0013], [13.288, 52.528, 0.0013], [13.268, 52.532, 0.0013],
        [13.245, 52.533, 0.0013], [13.222, 52.534, 0.0015], [13.21, 52.536, 0.0018]
      ],
      // Havel, from the Tegeler See south past Spandau and the Grunewald, widening at the
      // Wannsee, then through Potsdam to the Templiner See
      [
        [13.268, 52.6, 0.003], [13.255, 52.585, 0.005], [13.24, 52.572, 0.003], [13.225, 52.56, 0.002], [13.212, 52.548, 0.002],
        [13.21, 52.536, 0.002], [13.212, 52.522, 0.002], [13.205, 52.505, 0.0025], [13.2, 52.485, 0.0025], [13.195, 52.468, 0.003],
        [13.185, 52.452, 0.004], [13.175, 52.437, 0.005], [13.16, 52.428, 0.004], [13.135, 52.423, 0.003], [13.11, 52.418, 0.0025],
        [13.09, 52.412, 0.0025], [13.075, 52.404, 0.003], [13.06, 52.398, 0.0025], [13.045, 52.385, 0.003], [13.03, 52.372, 0.004]
      ],
      // Dahme, from south of Grünau up the Langer See to Köpenick
      [
        [13.62, 52.36, 0.002], [13.605, 52.385, 0.0025], [13.59, 52.405, 0.003], [13.578, 52.425, 0.0025], [13.578, 52.448, 0.0015]
      ],
      // Landwehrkanal, from the Oberbaum Bridge through Kreuzberg to the Tiergarten
      [
        [13.447, 52.502, 0.001], [13.43, 52.496, 0.001], [13.412, 52.495, 0.001], [13.39, 52.499, 0.001], [13.37, 52.502, 0.001],
        [13.35, 52.505, 0.001], [13.33, 52.512, 0.001], [13.318, 52.518, 0.001]
      ]
    ]
  }
};
