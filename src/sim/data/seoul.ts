import type { MapDef } from "../types";

// A simplified version of the Seoul Metropolitan Subway: the Line 2 loop, the main radial lines
// (1, 3, 4, 5, 7, 9), AREX out to Gimpo and Incheon Airport, and Line 1 / Shinbundang to Suwon.
// pop / jobs are rough thousands, scaled down to match the Sydney map's totals.
// Section minutes are filled in from distance when omitted.
export const SEOUL: MapDef = {
  id: "seoul",
  name: "Seoul",
  bounds: { lon0: 126.43, lon1: 127.16, lat0: 37.76, lat1: 37.24 },
  hubs: ["seoul", "gangnam", "gimpoair", "suwon"],
  // extra starting money for hubs with fewer passengers nearby
  hubBonus: { seoul: 0, gangnam: 400, gimpoair: 500, suwon: 1300 },
  stations: [
    // the old city
    { id: "seoul", name: "Seoul Station", lon: 126.972, lat: 37.555, pop: 20, jobs: 150, icon: "🐯", label: "b" },
    { id: "cityhall", name: "City Hall", lon: 126.977, lat: 37.566, pop: 10, jobs: 120, label: "l" },
    { id: "euljiro", name: "Euljiro 3-ga", lon: 126.992, lat: 37.566, pop: 20, jobs: 70, label: "t" },
    { id: "ddp", name: "Dongdaemun History & Culture Park", lon: 127.008, lat: 37.565, pop: 30, jobs: 50, label: "b" },
    { id: "hyehwa", name: "Hyehwa", lon: 127.002, lat: 37.582, pop: 35, jobs: 20, label: "l" },
    { id: "yongsan", name: "Yongsan", lon: 126.965, lat: 37.53, pop: 30, jobs: 40, label: "r" },
    { id: "gongdeok", name: "Gongdeok", lon: 126.951, lat: 37.543, pop: 35, jobs: 30, label: "l" },
    { id: "hongik", name: "Hongik Univ", lon: 126.924, lat: 37.557, pop: 45, jobs: 25, label: "t" },
    { id: "dmc", name: "Digital Media City", lon: 126.9, lat: 37.577, pop: 35, jobs: 30, label: "t" },
    // north and east
    { id: "cheongnyangni", name: "Cheongnyangni", lon: 127.047, lat: 37.58, pop: 40, jobs: 20, label: "r" },
    { id: "seokgye", name: "Seokgye", lon: 127.066, lat: 37.615, pop: 45, jobs: 10, label: "r" },
    { id: "nowon", name: "Nowon", lon: 127.061, lat: 37.655, pop: 60, jobs: 10, label: "r" },
    { id: "dobongsan", name: "Dobongsan", lon: 127.046, lat: 37.689, pop: 30, jobs: 6, label: "l" },
    { id: "uijeongbu", name: "Uijeongbu", lon: 127.046, lat: 37.738, pop: 50, jobs: 15, label: "r" },
    { id: "wangsimni", name: "Wangsimni", lon: 127.037, lat: 37.561, pop: 40, jobs: 20, label: "t" },
    { id: "konkuk", name: "Konkuk Univ", lon: 127.07, lat: 37.54, pop: 45, jobs: 20, label: "r" },
    { id: "olympicpark", name: "Olympic Park", lon: 127.124, lat: 37.516, pop: 40, jobs: 8, label: "r" },
    // Gangnam and the south-east
    { id: "jamsil", name: "Jamsil", lon: 127.1, lat: 37.513, pop: 50, jobs: 40, label: "b" },
    { id: "samseong", name: "Samseong", lon: 127.063, lat: 37.509, pop: 20, jobs: 80, label: "b" },
    { id: "gangnam", name: "Gangnam", lon: 127.028, lat: 37.498, pop: 35, jobs: 115, icon: "parramatta", label: "r" },
    { id: "apgujeong", name: "Apgujeong", lon: 127.028, lat: 37.527, pop: 30, jobs: 30, label: "r" },
    { id: "expressbus", name: "Express Bus Terminal", lon: 127.005, lat: 37.505, pop: 35, jobs: 30, label: "l" },
    { id: "pangyo", name: "Pangyo", lon: 127.111, lat: 37.395, pop: 40, jobs: 60, label: "r" },
    // south
    { id: "sadang", name: "Sadang", lon: 126.982, lat: 37.477, pop: 50, jobs: 15, label: "b" },
    { id: "gwacheon", name: "Gwacheon", lon: 126.987, lat: 37.433, pop: 25, jobs: 20, label: "r" },
    { id: "geumjeong", name: "Geumjeong", lon: 126.943, lat: 37.372, pop: 40, jobs: 10, label: "r" },
    { id: "anyang", name: "Anyang", lon: 126.922, lat: 37.401, pop: 50, jobs: 20, label: "l" },
    { id: "suwon", name: "Suwon", lon: 127.0, lat: 37.266, pop: 60, jobs: 40, icon: "liverpool", label: "r" },
    // south-west and Yeouido
    { id: "sillim", name: "Sillim", lon: 126.93, lat: 37.484, pop: 60, jobs: 10, label: "b" },
    { id: "sindorim", name: "Sindorim", lon: 126.891, lat: 37.509, pop: 40, jobs: 25, label: "b" },
    { id: "yeongdeungpo", name: "Yeongdeungpo", lon: 126.907, lat: 37.516, pop: 30, jobs: 30, label: "r" },
    { id: "yeouido", name: "Yeouido", lon: 126.924, lat: 37.522, pop: 15, jobs: 90, label: "t" },
    { id: "noryangjin", name: "Noryangjin", lon: 126.942, lat: 37.514, pop: 35, jobs: 15, label: "b" },
    { id: "kkachisan", name: "Kkachisan", lon: 126.864, lat: 37.532, pop: 55, jobs: 10, label: "t" },
    // west, Gimpo and Incheon
    { id: "gimpoair", name: "Gimpo Airport", lon: 126.802, lat: 37.562, pop: 3, jobs: 40, icon: "airport", label: "b" },
    { id: "gyeyang", name: "Gyeyang", lon: 126.736, lat: 37.571, pop: 40, jobs: 8, label: "t" },
    { id: "cheongna", name: "Cheongna", lon: 126.625, lat: 37.556, pop: 35, jobs: 10, label: "t" },
    { id: "incheonair", name: "Incheon Airport", lon: 126.452, lat: 37.449, pop: 2, jobs: 70, label: "b" },
    { id: "bucheon", name: "Bucheon", lon: 126.783, lat: 37.484, pop: 55, jobs: 15, label: "b" },
    { id: "bupyeong", name: "Bupyeong", lon: 126.724, lat: 37.49, pop: 55, jobs: 20, label: "l" }
  ],
  sections: [
    // Line 2 loop, clockwise from City Hall
    { a: "cityhall", b: "euljiro", landmark: "Line 2 under Euljiro" },
    { a: "euljiro", b: "ddp", landmark: "Line 2, Euljiro 4-ga" },
    { a: "ddp", b: "wangsimni", landmark: "Line 2 / Line 5 via Sindang" },
    { a: "wangsimni", b: "konkuk", landmark: "Line 2 by Seoul Forest and Seongsu" },
    { a: "konkuk", b: "jamsil", landmark: "Line 2 over the Han at Jamsil" },
    { a: "jamsil", b: "samseong", landmark: "Line 2 by the Sports Complex" },
    { a: "samseong", b: "gangnam", landmark: "Line 2 under Teheran-ro" },
    { a: "gangnam", b: "sadang", landmark: "Line 2 via Seocho and Bangbae" },
    { a: "sadang", b: "sillim", landmark: "Line 2 by Seoul National Univ" },
    { a: "sillim", b: "sindorim", landmark: "Line 2 via Guro Digital Complex and Daerim" },
    { a: "sindorim", b: "hongik", landmark: "Line 2 over the Dangsan Bridge and Hapjeong" },
    { a: "hongik", b: "cityhall", landmark: "Line 2 via Sinchon, Ewha and Chungjeongno" },
    { a: "sindorim", b: "kkachisan", landmark: "Line 2 Sinjeong branch" },
    // Line 1
    { a: "seoul", b: "cityhall", landmark: "Line 1 by Namdaemun" },
    { a: "seoul", b: "yongsan", landmark: "Line 1 via Namyeong" },
    { a: "yongsan", b: "noryangjin", landmark: "Line 1 over the Hangang Railway Bridge" },
    { a: "noryangjin", b: "yeongdeungpo", landmark: "Line 1 via Daebang and Singil" },
    { a: "yeongdeungpo", b: "sindorim", landmark: "Line 1, Mullae" },
    { a: "sindorim", b: "anyang", landmark: "Line 1 via Guro, Gasan and Seoksu" },
    { a: "anyang", b: "geumjeong", landmark: "Line 1, Myeonghak" },
    { a: "geumjeong", b: "suwon", landmark: "Line 1 via Uiwang and Sungkyunkwan" },
    { a: "sindorim", b: "bucheon", landmark: "Line 1 via Oryu-dong and Yeokgok" },
    { a: "bucheon", b: "bupyeong", landmark: "Line 1, Songnae" },
    { a: "ddp", b: "cheongnyangni", landmark: "Line 1 via Dongdaemun and Jegi-dong" },
    { a: "cheongnyangni", b: "seokgye", landmark: "Line 1 via Hoegi and Kwangwoon Univ" },
    { a: "seokgye", b: "nowon", landmark: "Line 1 / Line 7 via Wolgye and Chang-dong" },
    { a: "nowon", b: "dobongsan", landmark: "Line 7 via Madeul and Suraksan" },
    { a: "dobongsan", b: "uijeongbu", landmark: "Line 1 via Mangwolsa" },
    // Line 4
    { a: "seoul", b: "euljiro", landmark: "Line 4 via Myeongdong and Chungmuro" },
    { a: "ddp", b: "hyehwa", landmark: "Line 4 by the Naksan walls" },
    { a: "hyehwa", b: "nowon", landmark: "Line 4 via Mia and Suyu" },
    { a: "yongsan", b: "sadang", landmark: "Line 4 via Ichon and Dongjak" },
    { a: "sadang", b: "gwacheon", landmark: "Line 4 by Seoul Grand Park" },
    { a: "gwacheon", b: "geumjeong", landmark: "Line 4 via Indeogwon and Pyeongchon" },
    // Line 3 and Line 7
    { a: "euljiro", b: "apgujeong", landmark: "Line 3 via Yaksu and the Dongho Bridge" },
    { a: "apgujeong", b: "expressbus", landmark: "Line 3 via Sinsa and Jamwon" },
    { a: "expressbus", b: "sadang", landmark: "Line 7 via Naebang and Isu" },
    { a: "seokgye", b: "konkuk", landmark: "Line 7 via Taereung and Junggok" },
    // Line 5
    { a: "konkuk", b: "olympicpark", landmark: "Line 5 via Gwangnaru and Cheonho" },
    { a: "gimpoair", b: "kkachisan", landmark: "Line 5 via Songjeong and Hwagok" },
    { a: "kkachisan", b: "yeouido", landmark: "Line 5 via Mokdong and Omokgyo" },
    { a: "yeouido", b: "gongdeok", landmark: "Line 5 under the Han via Mapo" },
    // Line 8 and Line 9
    { a: "jamsil", b: "olympicpark", landmark: "Line 8 / Line 9, Mongchontoseong" },
    { a: "yeouido", b: "noryangjin", landmark: "Line 9 via Saetgang" },
    { a: "noryangjin", b: "expressbus", landmark: "Line 9 via Dongjak and Gubanpo" },
    // AREX and Incheon
    { a: "seoul", b: "gongdeok", landmark: "AREX / Gyeongui Line" },
    { a: "gongdeok", b: "hongik", landmark: "AREX under Mapo" },
    { a: "hongik", b: "dmc", landmark: "AREX / Gyeongui Line, Gajwa" },
    { a: "dmc", b: "gimpoair", landmark: "AREX past Magok" },
    { a: "gimpoair", b: "gyeyang", landmark: "AREX over the Gulpocheon" },
    { a: "gyeyang", b: "cheongna", landmark: "AREX via Geomam" },
    { a: "cheongna", b: "incheonair", landmark: "AREX over the Yeongjong Bridge" },
    { a: "bupyeong", b: "gyeyang", landmark: "Incheon Line 1 via Jakjeon" },
    // Shinbundang
    { a: "gangnam", b: "pangyo", landmark: "Shinbundang Line via Yangjae and Cheonggyesan" },
    { a: "pangyo", b: "suwon", landmark: "Shinbundang to Gwanggyo, Suwon" }
  ],
  events: [
    { station: "jamsil", title: "LG Twins v Doosan Bears at Jamsil", emoji: "⚾" },
    { station: "olympicpark", title: "K-pop concert at Olympic Park", emoji: "🎤" },
    { station: "jamsil", title: "Lotte World Tower fireworks", emoji: "🎆" },
    { station: "cityhall", title: "Festival in Gwanghwamun Square", emoji: "🏮" },
    { station: "yeouido", title: "Hangang summer festival at Yeouido", emoji: "🌊" },
    { station: "wangsimni", title: "Picnic concert in Seoul Forest", emoji: "🌳" },
    { station: "dmc", title: "FC Seoul at the World Cup Stadium", emoji: "⚽" },
    { station: "ddp", title: "Seoul Fashion Week at DDP", emoji: "👗" }
  ],
  water: {
    // the Yellow Sea round Yeongjong Island and the Incheon coast
    ocean: [
      [126.3, 37.8], [126.52, 37.8], [126.56, 37.7], [126.6, 37.6], [126.6, 37.55], [126.55, 37.53], [126.52, 37.5],
      [126.48, 37.5], [126.42, 37.48], [126.4, 37.45], [126.42, 37.42], [126.47, 37.415], [126.52, 37.43], [126.56, 37.47],
      [126.58, 37.47], [126.62, 37.45], [126.62, 37.38], [126.6, 37.2], [126.3, 37.2]
    ],
    ribbons: [
      // Han River, from the estuary past Gimpo, round Yeouido and through the city to Gangdong
      [[126.6, 37.71, 0.006], [126.65, 37.69, 0.006], [126.7, 37.66, 0.0055], [126.76, 37.62, 0.005], [126.8, 37.595, 0.005],
        [126.84, 37.578, 0.0048], [126.87, 37.565, 0.0046], [126.895, 37.548, 0.0045], [126.915, 37.535, 0.0045],
        [126.94, 37.527, 0.0045], [126.965, 37.518, 0.0045], [126.99, 37.513, 0.0045], [127.015, 37.522, 0.0045],
        [127.03, 37.532, 0.0042], [127.05, 37.54, 0.0042], [127.065, 37.533, 0.0042], [127.08, 37.523, 0.0042],
        [127.1, 37.524, 0.004], [127.115, 37.535, 0.004], [127.13, 37.548, 0.004], [127.16, 37.565, 0.004]]
    ]
  }
};
