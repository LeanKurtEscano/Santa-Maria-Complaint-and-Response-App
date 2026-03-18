


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


const BARANGAY_COORDS_MAP: Record<string, BarangayCoords> = {
  // Poblacion (aliases included)
  'barangay uno': { lat: 14.4697286, lng: 121.4219659 },
  'poblacion uno': { lat: 14.4697286, lng: 121.4219659 },

  'barangay dos': { lat: 14.4696455, lng: 121.4230174 },
  'poblacion dos': { lat: 14.4696455, lng: 121.4230174 },

  'barangay tres': { lat: 14.4715414, lng: 121.4258766 },
  'poblacion tres': { lat: 14.4715414, lng: 121.4258766 },

  'barangay cuatro': { lat: 14.46988, lng: 121.42532 },
  'poblacion cuatro': { lat: 14.46988, lng: 121.42532 },

  // Main barangays
  'adia': { lat: 14.48775, lng: 121.43651 },
  'bagumbayan': { lat: 14.51118, lng: 121.43437 },
  'bagong pook': { lat: 14.4719492, lng: 121.4293152 },
  'bubukal': { lat: 14.4763, lng: 121.4122 },
  'cabooan': { lat: 14.45858, lng: 121.42937 },
  'calangay': { lat: 14.50987, lng: 121.40643 },
  'cambuja': { lat: 14.46733, lng: 121.40266 },
  'coralan': { lat: 14.49484, lng: 121.42043 },
  'cueva': { lat: 14.50589, lng: 121.45844 },
  'inayapan': { lat: 14.4781, lng: 121.4057 },

  'jose laurel sr.': { lat: 14.5264, lng: 121.4193 },
  'jose rizal': { lat: 14.46458, lng: 121.4232 },

  'macasipac': { lat: 14.5009, lng: 121.4409 },
  'masinao': { lat: 14.49213, lng: 121.43015 },
  'mataling-ting': { lat: 14.4986, lng: 121.3712 },

  // Parang variations
  'parang': { lat: 14.5282, lng: 121.4366 },
  'parang ng buho': { lat: 14.5282, lng: 121.4366 },

  'kayhakat': { lat: 14.4703, lng: 121.4176 },
  'pao-o': { lat: 14.54675, lng: 121.42122 },
  'tungkod': { lat: 14.49277, lng: 121.40682 },

  // Name variations
  'juan santiago': { lat: 14.56197, lng: 121.44386 },
  'j. santiago': { lat: 14.56197, lng: 121.44386 },

  'talangka': { lat: 14.47518, lng: 121.43902 },
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

function normalize(name: string) {
  return name
    .toLowerCase()
    .replace(/\./g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function getBarangayCoords(name: string): BarangayCoords | null {
  return BARANGAY_COORDS_MAP[normalize(name)] ?? null;
}