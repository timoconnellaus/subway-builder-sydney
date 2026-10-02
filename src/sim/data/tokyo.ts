import type { MapDef } from "../types";

// A simplified version of the real Tokyo network: JR East, Tokyo Metro and the private railways
// (Keikyu, Keio, Tokyu, Tobu), from Omiya down to Yokohama and across to Chiba.
// pop / jobs are rough thousands, scaled down to match the Sydney map's totals.
// Section minutes are filled in from distance when omitted.
export const TOKYO: MapDef = {
  id: "tokyo",
  name: "Tokyo",
  bounds: { lon0: 139.37, lon1: 140.16, lat0: 35.94, lat1: 35.43 },
  hubs: ["tokyo", "shinjuku", "haneda", "yokohama"],
  // extra starting money for hubs with fewer passengers nearby
  hubBonus: { tokyo: 0, shinjuku: 500, haneda: 800, yokohama: 1000 },
  stations: [
    // Yamanote loop (simplified)
    { id: "tokyo", name: "Tokyo", lon: 139.767, lat: 35.681, pop: 20, jobs: 200, icon: "city" },
    { id: "akihabara", name: "Akihabara", lon: 139.774, lat: 35.698, pop: 30, jobs: 35, label: "r" },
    { id: "ueno", name: "Ueno", lon: 139.777, lat: 35.713, pop: 30, jobs: 30, label: "t" },
    { id: "ikebukuro", name: "Ikebukuro", lon: 139.711, lat: 35.73, pop: 40, jobs: 50, label: "t" },
    { id: "shinjuku", name: "Shinjuku", lon: 139.7, lat: 35.69, pop: 35, jobs: 115, icon: "parramatta", label: "l" },
    { id: "shibuya", name: "Shibuya", lon: 139.702, lat: 35.658, pop: 30, jobs: 70, label: "l" },
    { id: "meguro", name: "Meguro", lon: 139.716, lat: 35.634, pop: 35, jobs: 20, label: "l" },
    { id: "shinagawa", name: "Shinagawa", lon: 139.74, lat: 35.628, pop: 25, jobs: 60, label: "b" },
    { id: "hamamatsucho", name: "Hamamatsucho", lon: 139.757, lat: 35.655, pop: 25, jobs: 50, label: "r" },
    // inner city
    { id: "iidabashi", name: "Iidabashi", lon: 139.745, lat: 35.702, pop: 40, jobs: 25, label: "t" },
    { id: "yotsuya", name: "Yotsuya", lon: 139.73, lat: 35.686, pop: 25, jobs: 30, label: "b" },
    { id: "roppongi", name: "Roppongi", lon: 139.731, lat: 35.663, pop: 35, jobs: 45, label: "l" },
    { id: "asakusa", name: "Asakusa", lon: 139.797, lat: 35.711, pop: 35, jobs: 15, label: "r" },
    { id: "kitasenju", name: "Kita-Senju", lon: 139.805, lat: 35.749, pop: 45, jobs: 12 },
    { id: "kinshicho", name: "Kinshicho", lon: 139.814, lat: 35.697, pop: 45, jobs: 15, label: "b" },
    // bayside
    { id: "tennozu", name: "Tennozu Isle", lon: 139.75, lat: 35.622, pop: 15, jobs: 15, label: "b" },
    { id: "odaiba", name: "Odaiba", lon: 139.776, lat: 35.627, pop: 15, jobs: 25, label: "r" },
    { id: "shinkiba", name: "Shin-Kiba", lon: 139.827, lat: 35.646, pop: 40, jobs: 15, label: "b" },
    { id: "maihama", name: "Maihama", lon: 139.884, lat: 35.636, pop: 20, jobs: 20, label: "b" },
    { id: "haneda", name: "Haneda Airport", lon: 139.785, lat: 35.549, pop: 2, jobs: 80, icon: "airport" },
    // south: Kawasaki and Yokohama
    { id: "kamata", name: "Kamata", lon: 139.716, lat: 35.562, pop: 50, jobs: 15, label: "l" },
    { id: "kawasaki", name: "Kawasaki", lon: 139.697, lat: 35.531, pop: 50, jobs: 30, label: "r" },
    { id: "yokohama", name: "Yokohama", lon: 139.622, lat: 35.466, pop: 50, jobs: 90, icon: "liverpool" },
    { id: "shinyokohama", name: "Shin-Yokohama", lon: 139.617, lat: 35.508, pop: 30, jobs: 25, label: "l" },
    { id: "musashikosugi", name: "Musashi-Kosugi", lon: 139.66, lat: 35.576, pop: 50, jobs: 15, label: "r" },
    { id: "jiyugaoka", name: "Jiyugaoka", lon: 139.669, lat: 35.607, pop: 40, jobs: 10, label: "r" },
    { id: "futako", name: "Futako-Tamagawa", lon: 139.627, lat: 35.612, pop: 40, jobs: 15, label: "l" },
    // west
    { id: "meidaimae", name: "Meidaimae", lon: 139.65, lat: 35.668, pop: 40, jobs: 8 },
    { id: "kichijoji", name: "Kichijoji", lon: 139.58, lat: 35.703, pop: 45, jobs: 15, label: "t" },
    { id: "chofu", name: "Chofu", lon: 139.544, lat: 35.652, pop: 40, jobs: 10, label: "b" },
    { id: "tachikawa", name: "Tachikawa", lon: 139.414, lat: 35.698, pop: 50, jobs: 25, label: "t" },
    // north: Saitama
    { id: "akabane", name: "Akabane", lon: 139.721, lat: 35.778, pop: 45, jobs: 10 },
    { id: "urawa", name: "Urawa", lon: 139.657, lat: 35.859, pop: 45, jobs: 15 },
    { id: "omiya", name: "Omiya", lon: 139.624, lat: 35.906, pop: 50, jobs: 35 },
    // east: Chiba
    { id: "matsudo", name: "Matsudo", lon: 139.903, lat: 35.784, pop: 50, jobs: 10 },
    { id: "funabashi", name: "Funabashi", lon: 139.985, lat: 35.702, pop: 55, jobs: 18 },
    { id: "chiba", name: "Chiba", lon: 140.123, lat: 35.613, pop: 50, jobs: 40, label: "l" }
  ],
  sections: [
    { a: "tokyo", b: "akihabara", landmark: "Yamanote Line" },
    { a: "akihabara", b: "ueno", landmark: "Yamanote Line" },
    { a: "ueno", b: "ikebukuro", landmark: "Yamanote Line" },
    { a: "ikebukuro", b: "shinjuku", landmark: "Yamanote Line" },
    { a: "shinjuku", b: "shibuya", landmark: "Yamanote Line" },
    { a: "shibuya", b: "meguro", landmark: "Yamanote Line" },
    { a: "meguro", b: "shinagawa", landmark: "Yamanote Line" },
    { a: "shinagawa", b: "hamamatsucho", landmark: "Yamanote Line" },
    { a: "hamamatsucho", b: "tokyo", landmark: "Yamanote Line" },
    { a: "tokyo", b: "iidabashi", landmark: "Tozai Line" },
    { a: "akihabara", b: "iidabashi", landmark: "Chuo-Sobu Line" },
    { a: "iidabashi", b: "yotsuya", landmark: "Chuo Line" },
    { a: "yotsuya", b: "shinjuku", landmark: "Chuo Line" },
    { a: "ikebukuro", b: "iidabashi", landmark: "Yurakucho Line" },
    { a: "tokyo", b: "roppongi", landmark: "Hibiya Line" },
    { a: "roppongi", b: "meguro", landmark: "Namboku Line" },
    { a: "shinjuku", b: "kichijoji", landmark: "Chuo Line" },
    { a: "kichijoji", b: "tachikawa", landmark: "Chuo Line" },
    { a: "shinjuku", b: "meidaimae", landmark: "Keio Line" },
    { a: "meidaimae", b: "chofu", landmark: "Keio Line" },
    { a: "chofu", b: "tachikawa", landmark: "Keio & Nambu Lines" },
    { a: "shibuya", b: "futako", landmark: "Den-en-toshi Line" },
    { a: "futako", b: "chofu", landmark: "Nambu Line" },
    { a: "futako", b: "musashikosugi", landmark: "Nambu Line" },
    { a: "shibuya", b: "jiyugaoka", landmark: "Toyoko Line" },
    { a: "jiyugaoka", b: "musashikosugi", landmark: "Toyoko Line" },
    { a: "musashikosugi", b: "shinagawa", landmark: "Yokosuka Line" },
    { a: "musashikosugi", b: "shinyokohama", landmark: "Tokyu Shin-Yokohama Line" },
    { a: "shinyokohama", b: "yokohama", landmark: "Yokohama Line" },
    { a: "shinagawa", b: "kamata", landmark: "Keikyu Line" },
    { a: "kamata", b: "kawasaki", landmark: "Keikyu Line" },
    { a: "kawasaki", b: "yokohama", landmark: "Tokaido Line" },
    { a: "kamata", b: "haneda", landmark: "Keikyu Airport Line" },
    { a: "haneda", b: "tennozu", landmark: "Tokyo Monorail" },
    { a: "tennozu", b: "hamamatsucho", landmark: "Tokyo Monorail" },
    { a: "tennozu", b: "odaiba", landmark: "Rinkai Line" },
    { a: "odaiba", b: "shinkiba", landmark: "Rinkai Line" },
    { a: "tokyo", b: "shinkiba", landmark: "Keiyo Line" },
    { a: "shinkiba", b: "maihama", landmark: "Keiyo Line" },
    { a: "maihama", b: "funabashi", landmark: "Keiyo Line" },
    { a: "funabashi", b: "chiba", landmark: "Sobu Line" },
    { a: "kinshicho", b: "funabashi", landmark: "Sobu Rapid Line" },
    { a: "akihabara", b: "kinshicho", landmark: "Sobu Line" },
    { a: "ueno", b: "asakusa", landmark: "Ginza Line" },
    { a: "asakusa", b: "kitasenju", landmark: "Tobu Skytree Line" },
    { a: "kitasenju", b: "matsudo", landmark: "Joban Line" },
    { a: "ueno", b: "akabane", landmark: "Keihin-Tohoku Line" },
    { a: "ikebukuro", b: "akabane", landmark: "Saikyo Line" },
    { a: "akabane", b: "urawa", landmark: "Keihin-Tohoku Line" },
    { a: "urawa", b: "omiya", landmark: "Keihin-Tohoku Line" }
  ],
  events: [
    { station: "iidabashi", title: "Giants at Tokyo Dome", emoji: "⚾" },
    { station: "asakusa", title: "Sumida River fireworks", emoji: "🎆" },
    { station: "ueno", title: "Cherry blossoms in Ueno Park", emoji: "🌸" },
    { station: "odaiba", title: "Comiket at Tokyo Big Sight", emoji: "📚" },
    { station: "shibuya", title: "Halloween in Shibuya", emoji: "🎃" },
    { station: "maihama", title: "Tokyo Disneyland parade", emoji: "🏰" },
    { station: "shinyokohama", title: "Final at Nissan Stadium", emoji: "🏉" },
    { station: "yokohama", title: "Lunar New Year in Chinatown", emoji: "🐉" },
    { station: "akihabara", title: "Anime festival in Akihabara", emoji: "🎮" },
    { station: "musashikosugi", title: "Frontale at Todoroki", emoji: "⚽" },
    { station: "omiya", title: "Concert at Saitama Super Arena", emoji: "🎤" }
  ],
  water: {
    // Tokyo Bay, from Yokohama round the reclaimed waterfront to Chiba
    ocean: [
      [139.65, 35.2], [139.66, 35.42], [139.645, 35.445], [139.66, 35.47], [139.7, 35.5], [139.74, 35.52], [139.77, 35.533],
      [139.805, 35.545], [139.795, 35.565], [139.775, 35.585], [139.762, 35.605], [139.765, 35.615], [139.79, 35.615],
      [139.81, 35.625], [139.835, 35.632], [139.86, 35.627], [139.895, 35.628], [139.93, 35.652], [139.97, 35.667],
      [140.005, 35.668], [140.04, 35.64], [140.07, 35.62], [140.1, 35.596], [140.12, 35.57], [140.1, 35.5], [140.05, 35.4],
      [140.0, 35.2]
    ],
    ribbons: [
      // Sumida River
      [[139.778, 35.648, 0.0018], [139.79, 35.68, 0.0016], [139.796, 35.7, 0.0015], [139.802, 35.72, 0.0014], [139.8, 35.74, 0.0013],
        [139.78, 35.755, 0.0012], [139.75, 35.765, 0.001]],
      // Arakawa
      [[139.845, 35.635, 0.003], [139.842, 35.66, 0.0028], [139.845, 35.7, 0.0026], [139.835, 35.73, 0.0024], [139.81, 35.762, 0.0022],
        [139.77, 35.772, 0.002], [139.73, 35.787, 0.0018], [139.69, 35.802, 0.0016], [139.65, 35.825, 0.0014], [139.6, 35.855, 0.0012],
        [139.55, 35.885, 0.001]],
      // Tama River, the Tokyo–Kanagawa border
      [[139.8, 35.538, 0.0032], [139.765, 35.545, 0.0028], [139.73, 35.552, 0.0026], [139.7, 35.56, 0.0024], [139.675, 35.59, 0.0022],
        [139.645, 35.603, 0.002], [139.6, 35.625, 0.0018], [139.55, 35.638, 0.0016], [139.5, 35.656, 0.0014], [139.45, 35.672, 0.0012],
        [139.4, 35.684, 0.001]],
      // Edo River, the Tokyo–Chiba border
      [[139.905, 35.638, 0.0022], [139.908, 35.67, 0.002], [139.903, 35.7, 0.0018], [139.893, 35.735, 0.0016], [139.887, 35.77, 0.0014],
        [139.875, 35.81, 0.0012], [139.86, 35.86, 0.001]]
    ]
  }
};
