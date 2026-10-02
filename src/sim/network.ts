import type { MapDef, SectionId, StationDef, StationId } from "./types";

export interface SectionInfo {
  id: SectionId;
  a: StationId;
  b: StationId;
  minutes: number;
  landmark?: string;
}

export interface Network {
  map: MapDef;
  stations: StationDef[];
  stationIndex: Record<StationId, number>;
  station: Record<StationId, StationDef>;
  sections: SectionInfo[];
  section: Record<SectionId, SectionInfo>;
  adj: Record<StationId, { to: StationId; section: SectionId }[]>;
  // origin-destination demand weights, normalised to sum to 1 (flattened n x n)
  od: number[];
}

export function haversineKm(lon1: number, lat1: number, lon2: number, lat2: number): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export function sectionId(a: StationId, b: StationId): SectionId {
  return a < b ? `${a}~${b}` : `${b}~${a}`;
}

const cache = new Map<string, Network>();

export function buildNetwork(map: MapDef): Network {
  const hit = cache.get(map.id);
  if (hit && hit.map === map) return hit;
  const stationIndex: Record<StationId, number> = {};
  const station: Record<StationId, StationDef> = {};
  map.stations.forEach((s, i) => {
    stationIndex[s.id] = i;
    station[s.id] = s;
  });
  const adj: Network["adj"] = {};
  map.stations.forEach((s) => (adj[s.id] = []));
  const sections: SectionInfo[] = map.sections.map((d) => {
    const A = station[d.a];
    const B = station[d.b];
    if (!A || !B) throw new Error(`Unknown station in section ${d.a}-${d.b}`);
    const km = haversineKm(A.lon, A.lat, B.lon, B.lat);
    // brisk game pace: about a minute per kilometre
    const minutes = d.minutes ?? Math.max(2, Math.round(km));
    const id = sectionId(d.a, d.b);
    adj[d.a].push({ to: d.b, section: id });
    adj[d.b].push({ to: d.a, section: id });
    return { id, a: d.a, b: d.b, minutes, landmark: d.landmark };
  });
  const section: Record<SectionId, SectionInfo> = {};
  sections.forEach((s) => (section[s.id] = s));

  // Gravity model: people living near i travel to jobs near j, falling off with distance.
  const n = map.stations.length;
  const od = new Array(n * n).fill(0);
  let total = 0;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i === j) continue;
      const A = map.stations[i];
      const B = map.stations[j];
      const km = haversineKm(A.lon, A.lat, B.lon, B.lat);
      const w = ((A.pop * B.jobs + B.pop * A.jobs) / 2) * Math.exp(-km / 14);
      od[i * n + j] = w;
      total += w;
    }
  }
  for (let k = 0; k < od.length; k++) od[k] /= total;

  const net: Network = { map, stations: map.stations, stationIndex, station, sections, section, adj, od };
  cache.set(map.id, net);
  return net;
}

export function sectionBetween(net: Network, a: StationId, b: StationId): SectionInfo | undefined {
  return net.section[sectionId(a, b)];
}
