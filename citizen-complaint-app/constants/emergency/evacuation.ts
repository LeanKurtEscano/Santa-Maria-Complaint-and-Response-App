export interface EvacuationCenter {
  id: string;
  /** Plain name — not translated, stored as-is */
  name: string;
  latitude: number;
  longitude: number;
  // address is intentionally omitted — always derived live from useReverseGeocode
}

export const EVACUATION_CENTERS: EvacuationCenter[] = [
  {
    id: 'santa_maria_town_plaza',
    name: 'Santa Maria Town Plaza',
    latitude: 14.47001,
    longitude: 121.42324,
  },
  // Add more centers here — they will appear automatically on the screen.
];
