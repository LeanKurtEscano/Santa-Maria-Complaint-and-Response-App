


/**
 * barangay-coordinates.ts
 *
 * Static coordinate map for known barangays.
 * Keys are normalised (trimmed, lowercase) barangay names so lookup is
 * case-insensitive and whitespace-tolerant.
 *
 * Usage:
 *   import { getBarangayCoords, DEFAULT_COORDS } from '@/constants/barangay-coordinates';
 *
 *   const coords = getBarangayCoords(barangayName) ?? DEFAULT_COORDS;
 */

export interface BarangayCoords {
  lat: number;
  lng: number;
}

// ── Coordinate table ──────────────────────────────────────────────────────────
// Add new barangays here as the app grows.
const BARANGAY_COORDS_MAP: Record<string, BarangayCoords> = {
  'barangay uno':  { lat: 14.4697286, lng: 121.4219659 },
  'barangay dos':  { lat: 14.4696455, lng: 121.4230174 },
  'barangay tres': { lat: 14.4715414, lng: 121.4258766 },
  'bagong pook':   { lat: 14.4719492, lng: 121.4293152 },
};

// ── Fallback — geographic centre of all four barangays ────────────────────────
export const DEFAULT_COORDS: BarangayCoords = {
  lat: 14.4707,
  lng: 121.4250,
};

// ── Lookup helper ─────────────────────────────────────────────────────────────
/**
 * Returns the coordinates for a given barangay name, or null if not found.
 * Matching is case-insensitive and trims surrounding whitespace.
 *
 * @example
 * getBarangayCoords('Barangay Uno')  // { lat: 14.4697286, lng: 121.4219659 }
 * getBarangayCoords('barangay uno')  // same
 * getBarangayCoords('Unknown')       // null
 */
export function getBarangayCoords(name: string): BarangayCoords | null {
  const key = name.trim().toLowerCase();
  return BARANGAY_COORDS_MAP[key] ?? null;
}