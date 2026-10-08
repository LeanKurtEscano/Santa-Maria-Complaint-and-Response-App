import geojson from '@/data/sta_maria_barangays.json';

type Ring = number[][];
type Polygon = Ring[]; // [outer, ...holes]

interface Entry {
  key: string;
  name: string;
  area: number;
  bbox: [number, number, number, number]; // minLng, minLat, maxLng, maxLat
  polygons: Polygon[];
}

export interface DetectedBarangay {
  key: string;
  name: string;
}

const NUMERALS: Record<string, string> = {
  '1': '1', i: '1', uno: '1',
  '2': '2', ii: '2', dos: '2',
  '3': '3', iii: '3', tres: '3',
  '4': '4', iv: '4', cuatro: '4',
};

const ALIASES: Record<string, string> = {
  parang: 'parang ng buho',
  'juan santiago': 'santiago',
  'j santiago': 'santiago',
};

/** Normalises API names and GeoJSON names to one comparable key. */
export function canonicalBarangayName(raw: string): string {
  const base = (raw ?? '')
    .toLowerCase()
    .replace(/[.,()]/g, ' ')
    .replace(/-/g, ' ')
    .replace(/\b(barangay|brgy|poblacion|pob)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (NUMERALS[base]) return `pob ${NUMERALS[base]}`;
  return ALIASES[base] ?? base;
}

function inRing(lng: number, lat: number, ring: Ring): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

function inPolygon(lng: number, lat: number, poly: Polygon): boolean {
  if (!inRing(lng, lat, poly[0])) return false;
  for (let h = 1; h < poly.length; h++) {
    if (inRing(lng, lat, poly[h])) return false;
  }
  return true;
}

// Built once at module load, not per location update.
const ENTRIES: Entry[] = ((geojson as any).features as any[]).map((f) => {
  const g = f.geometry;
  const polygons: Polygon[] = g.type === 'MultiPolygon' ? g.coordinates : [g.coordinates];
  let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity;
  for (const poly of polygons) {
    for (const [lng, lat] of poly[0]) {
      if (lng < minLng) minLng = lng;
      if (lng > maxLng) maxLng = lng;
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
    }
  }
  return {
    key: canonicalBarangayName(f.properties.ADM4_EN),
    name: f.properties.ADM4_EN,
    area: f.properties.AREA_SQKM ?? Infinity,
    bbox: [minLng, minLat, maxLng, maxLat],
    polygons,
  } as Entry;
});

function contains(e: Entry, lat: number, lng: number): boolean {
  const [minLng, minLat, maxLng, maxLat] = e.bbox;
  if (lng < minLng || lng > maxLng || lat < minLat || lat > maxLat) return false;
  return e.polygons.some((p) => inPolygon(lng, lat, p));
}

const validCoords = (lat: number, lng: number) =>
  Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;

/** Returns the barangay containing the point, or null (outside Santa Maria / no match). */
export function findBarangayAt(lat: number, lng: number): DetectedBarangay | null {
  if (!validCoords(lat, lng)) return null;
  let best: Entry | null = null;
  for (const e of ENTRIES) {
    // if polygons ever overlap, the smaller (more specific) one wins
    if (contains(e, lat, lng) && (!best || e.area < best.area)) best = e;
  }
  return best ? { key: best.key, name: best.name } : null;
}

/** Used as a fallback to link an API barangay to a polygon by its own lat/lng. */
export function isPointInBarangay(key: string, lat: number, lng: number): boolean {
  if (!validCoords(lat, lng)) return false;
  return ENTRIES.some((e) => e.key === key && contains(e, lat, lng));
}