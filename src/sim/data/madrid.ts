import type { MapDef } from "../types";

// A simplified version of the Madrid Metro + Cercanías network: the Line 6 circle, the Sol and
// Recoletos tunnels, Line 8 to Barajas, Line 10 and MetroSur out to Alcorcón, Móstoles and Getafe,
// and the Cercanías towards Alcalá de Henares and Alcobendas. Callao and Gran Vía share one stop.
// pop / jobs are rough thousands of residents and jobs in each station's catchment, on the same
// scale as the Sydney map. Section minutes are filled in from distance when omitted.
export const MADRID: MapDef = {
  id: "madrid",
  name: "Madrid",
  bounds: { lon0: -3.89, lon1: -3.36, lat0: 40.56, lat1: 40.28 },
  hubs: ["sol", "mostoles", "barajas", "alcobendas"],
  // extra starting money for hubs with fewer passengers nearby
  hubBonus: { sol: 0, mostoles: 700, barajas: 800, alcobendas: 1100 },
  stations: [
    // the centre
    { id: "sol", name: "Sol", lon: -3.7035, lat: 40.4168, pop: 20, jobs: 190, icon: "💃", label: "b" },
    { id: "granvia", name: "Gran Vía / Callao", lon: -3.7025, lat: 40.4202, pop: 20, jobs: 90, label: "t" },
    { id: "opera", name: "Ópera", lon: -3.711, lat: 40.418, pop: 20, jobs: 35, label: "l" },
    { id: "bilbao", name: "Bilbao", lon: -3.702, lat: 40.4292, pop: 45, jobs: 30, label: "l" },
    { id: "atocha", name: "Atocha", lon: -3.6908, lat: 40.4066, pop: 25, jobs: 60, label: "b" },
    { id: "retiro", name: "Retiro", lon: -3.6835, lat: 40.4185, pop: 20, jobs: 30, label: "b" },
    { id: "goya", name: "Goya", lon: -3.6778, lat: 40.4243, pop: 45, jobs: 50, label: "t" },
    // the Castellana and the north
    { id: "nuevosmin", name: "Nuevos Ministerios", lon: -3.6923, lat: 40.4462, pop: 25, jobs: 120, label: "l" },
    { id: "bernabeu", name: "Santiago Bernabéu", lon: -3.6925, lat: 40.453, pop: 25, jobs: 45, label: "l" },
    { id: "castilla", name: "Plaza de Castilla", lon: -3.6893, lat: 40.4665, pop: 30, jobs: 70, label: "l" },
    { id: "chamartin", name: "Chamartín", lon: -3.6823, lat: 40.4722, pop: 25, jobs: 35, label: "r" },
    { id: "fuencarral", name: "Fuencarral", lon: -3.6865, lat: 40.4955, pop: 50, jobs: 15, label: "l" },
    { id: "alcobendas", name: "Alcobendas", lon: -3.634, lat: 40.54, pop: 55, jobs: 45, icon: "liverpool", label: "r" },
    { id: "colombia", name: "Colombia", lon: -3.6766, lat: 40.4535, pop: 30, jobs: 25, label: "r" },
    // the Line 6 circle
    { id: "cuatrocaminos", name: "Cuatro Caminos", lon: -3.7036, lat: 40.4469, pop: 55, jobs: 20, label: "t" },
    { id: "moncloa", name: "Moncloa", lon: -3.7193, lat: 40.4351, pop: 30, jobs: 40, label: "l" },
    { id: "principepio", name: "Príncipe Pío", lon: -3.7205, lat: 40.421, pop: 25, jobs: 15, label: "l" },
    { id: "oporto", name: "Oporto", lon: -3.731, lat: 40.3885, pop: 60, jobs: 8, label: "l" },
    { id: "legazpi", name: "Legazpi", lon: -3.695, lat: 40.3913, pop: 45, jobs: 15, label: "b" },
    { id: "mendez", name: "Méndez Álvaro", lon: -3.6762, lat: 40.3953, pop: 30, jobs: 25, label: "r" },
    { id: "condecasal", name: "Conde de Casal", lon: -3.6693, lat: 40.4074, pop: 45, jobs: 10, label: "r" },
    { id: "manuelbecerra", name: "Manuel Becerra", lon: -3.6693, lat: 40.4285, pop: 45, jobs: 15, label: "r" },
    { id: "diegoleon", name: "Diego de León", lon: -3.6765, lat: 40.4342, pop: 35, jobs: 30, label: "l" },
    { id: "avamerica", name: "Avenida de América", lon: -3.6765, lat: 40.4385, pop: 30, jobs: 40, label: "r" },
    // east and the airport
    { id: "mardecristal", name: "Mar de Cristal", lon: -3.6398, lat: 40.4697, pop: 45, jobs: 20, label: "t" },
    { id: "ifema", name: "Feria de Madrid", lon: -3.617, lat: 40.4637, pop: 5, jobs: 35, label: "b" },
    { id: "barajas", name: "Barajas Airport", lon: -3.593, lat: 40.4688, pop: 2, jobs: 70, icon: "airport", label: "r" },
    { id: "pueblonuevo", name: "Pueblo Nuevo", lon: -3.6427, lat: 40.4355, pop: 60, jobs: 10, label: "b" },
    { id: "metropolitano", name: "Estadio Metropolitano", lon: -3.5996, lat: 40.4362, pop: 15, jobs: 10, label: "t" },
    { id: "vicalvaro", name: "Vicálvaro", lon: -3.611, lat: 40.404, pop: 45, jobs: 10, label: "b" },
    { id: "coslada", name: "Coslada", lon: -3.561, lat: 40.424, pop: 50, jobs: 25, label: "b" },
    { id: "torrejon", name: "Torrejón de Ardoz", lon: -3.4806, lat: 40.4572, pop: 50, jobs: 25, label: "t" },
    { id: "alcala", name: "Alcalá de Henares", lon: -3.3812, lat: 40.4893, pop: 60, jobs: 30, label: "l" },
    // south and south-west
    { id: "villaverde", name: "Villaverde Alto", lon: -3.7115, lat: 40.34, pop: 45, jobs: 20, label: "r" },
    { id: "getafe", name: "Getafe", lon: -3.7313, lat: 40.3077, pop: 55, jobs: 30, label: "b" },
    { id: "leganes", name: "Leganés", lon: -3.772, lat: 40.328, pop: 55, jobs: 20, label: "b" },
    { id: "casacampo", name: "Casa de Campo", lon: -3.7594, lat: 40.3966, pop: 10, jobs: 10, label: "l" },
    { id: "aluche", name: "Aluche", lon: -3.76, lat: 40.3858, pop: 60, jobs: 10, label: "r" },
    { id: "puertasur", name: "Puerta del Sur", lon: -3.8055, lat: 40.3455, pop: 20, jobs: 10, label: "b" },
    { id: "alcorcon", name: "Alcorcón", lon: -3.832, lat: 40.35, pop: 55, jobs: 20, label: "t" },
    { id: "mostoles", name: "Móstoles", lon: -3.8645, lat: 40.327, pop: 60, jobs: 25, icon: "parramatta", label: "b" }
  ],
  sections: [
    // the centre
    { a: "opera", b: "sol", landmark: "Line 2 under Calle Arenal" },
    { a: "sol", b: "granvia", landmark: "Lines 1 and 3 under Calle Preciados" },
    { a: "sol", b: "atocha", landmark: "Line 1 via Tirso de Molina" },
    { a: "sol", b: "legazpi", landmark: "Line 3 via Lavapiés and Embajadores" },
    { a: "granvia", b: "retiro", landmark: "Line 2 via Banco de España and Cibeles" },
    { a: "granvia", b: "bilbao", landmark: "Line 1 via Tribunal" },
    { a: "granvia", b: "moncloa", landmark: "Line 3 via Plaza de España and Argüelles" },
    { a: "opera", b: "principepio", landmark: "Ramal Ópera – Príncipe Pío" },
    { a: "bilbao", b: "cuatrocaminos", landmark: "Line 1 via Iglesia" },
    { a: "atocha", b: "nuevosmin", landmark: "Cercanías tunnel via Recoletos" },
    { a: "retiro", b: "goya", landmark: "Line 2 via Príncipe de Vergara" },
    { a: "atocha", b: "mendez", landmark: "Cercanías by the Atocha yards" },
    // the Line 6 circle
    { a: "nuevosmin", b: "cuatrocaminos", landmark: "Line 6 via Ríos Rosas" },
    { a: "cuatrocaminos", b: "moncloa", landmark: "Line 6 via Guzmán el Bueno" },
    { a: "moncloa", b: "principepio", landmark: "Line 6 via Argüelles" },
    { a: "principepio", b: "oporto", landmark: "Line 6 over the Manzanares" },
    { a: "oporto", b: "legazpi", landmark: "Line 6 via Usera" },
    { a: "legazpi", b: "mendez", landmark: "Line 6 via Arganzuela" },
    { a: "mendez", b: "condecasal", landmark: "Line 6 via Pacífico" },
    { a: "condecasal", b: "manuelbecerra", landmark: "Line 6 via O'Donnell" },
    { a: "manuelbecerra", b: "diegoleon", landmark: "Line 6 under Calle Francisco Silvela" },
    { a: "diegoleon", b: "avamerica", landmark: "Line 6" },
    { a: "avamerica", b: "nuevosmin", landmark: "Line 6 via República Argentina" },
    { a: "goya", b: "manuelbecerra", landmark: "Line 2 under Calle Alcalá" },
    { a: "goya", b: "diegoleon", landmark: "Line 4 via Lista" },
    // the Castellana and the north
    { a: "nuevosmin", b: "bernabeu", landmark: "Line 10 under the Castellana" },
    { a: "bernabeu", b: "castilla", landmark: "Line 10 via Cuzco" },
    { a: "castilla", b: "chamartin", landmark: "Lines 1 and 10" },
    { a: "castilla", b: "colombia", landmark: "Line 9 via Pío XII" },
    { a: "chamartin", b: "fuencarral", landmark: "Cercanías C4 past the Cuatro Torres" },
    { a: "fuencarral", b: "alcobendas", landmark: "Cercanías C4 via Cantoblanco" },
    // Line 8 to the airport, and the east
    { a: "nuevosmin", b: "colombia", landmark: "Line 8 via Cruz del Rayo" },
    { a: "colombia", b: "mardecristal", landmark: "Line 8 via Pinar del Rey" },
    { a: "mardecristal", b: "ifema", landmark: "Line 8 via Campo de las Naciones" },
    { a: "ifema", b: "barajas", landmark: "Line 8 to Terminals 1-2-3" },
    { a: "avamerica", b: "pueblonuevo", landmark: "Line 7 via Ascao" },
    { a: "pueblonuevo", b: "metropolitano", landmark: "Line 7 via Las Musas" },
    { a: "metropolitano", b: "coslada", landmark: "Line 7 MetroEste" },
    { a: "mendez", b: "vicalvaro", landmark: "Cercanías C2 / C7 via Vallecas" },
    { a: "vicalvaro", b: "coslada", landmark: "Cercanías C2 / C7" },
    { a: "coslada", b: "torrejon", landmark: "Cercanías C2 / C7 via San Fernando" },
    { a: "torrejon", b: "alcala", landmark: "Cercanías C2 / C7 along the Henares" },
    // south and south-west
    { a: "legazpi", b: "villaverde", landmark: "Line 3 via San Cristóbal" },
    { a: "villaverde", b: "getafe", landmark: "Cercanías C4 via El Casar" },
    { a: "getafe", b: "leganes", landmark: "MetroSur via El Carrascal" },
    { a: "leganes", b: "puertasur", landmark: "MetroSur via San Nicasio" },
    { a: "puertasur", b: "alcorcon", landmark: "MetroSur via Parque Lisboa" },
    { a: "alcorcon", b: "mostoles", landmark: "MetroSur via Universidad Rey Juan Carlos" },
    { a: "principepio", b: "casacampo", landmark: "Line 10 via Lago and Batán" },
    { a: "casacampo", b: "puertasur", landmark: "Line 10 via Cuatro Vientos" },
    { a: "casacampo", b: "aluche", landmark: "Line 5 via Campamento" },
    { a: "aluche", b: "oporto", landmark: "Line 5 via Carabanchel" },
    { a: "aluche", b: "alcorcon", landmark: "Cercanías C5 via Las Águilas" }
  ],
  events: [
    { station: "bernabeu", title: "Real Madrid at the Bernabéu", emoji: "⚽" },
    { station: "metropolitano", title: "Atlético at the Metropolitano", emoji: "⚽" },
    { station: "principepio", title: "San Isidro at the Pradera", emoji: "🎉" },
    { station: "goya", title: "Concert at the WiZink Center", emoji: "🎤" },
    { station: "granvia", title: "Orgullo parade", emoji: "🏳️‍🌈" },
    { station: "retiro", title: "Book fair in the Retiro", emoji: "📚" },
    { station: "sol", title: "New Year's grapes at Sol", emoji: "🍇" },
    { station: "ifema", title: "Mad Cool festival", emoji: "🎸" }
  ],
  water: {
    ocean: [],
    ribbons: [
      // Manzanares, from El Pardo south past Moncloa, Príncipe Pío and Madrid Río to Getafe
      [
        [-3.775, 40.515, 0.0008], [-3.762, 40.495, 0.0008], [-3.745, 40.475, 0.0008], [-3.735, 40.455, 0.0008], [-3.728, 40.44, 0.0008],
        [-3.724, 40.428, 0.0008], [-3.722, 40.415, 0.0008], [-3.718, 40.403, 0.0008], [-3.71, 40.395, 0.0008], [-3.7, 40.389, 0.0008],
        [-3.69, 40.382, 0.0008], [-3.68, 40.37, 0.0008], [-3.67, 40.355, 0.0008], [-3.655, 40.335, 0.0008], [-3.64, 40.315, 0.0008],
        [-3.625, 40.295, 0.0008]
      ]
    ]
  }
};
