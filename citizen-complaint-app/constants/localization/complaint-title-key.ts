export const OTHER_KEY = 'complaint.preset.other';

export interface PresetTitle {
  key: string;
  category_id: number;
}

export const PRESET_TITLE_KEYS: PresetTitle[] = [
  { key: 'complaint.preset.noise_disturbance',    category_id: 18 },
  { key: 'complaint.preset.illegal_dumping',       category_id: 19 },
  { key: 'complaint.preset.road_damage',           category_id: 20 },
  { key: 'complaint.preset.street_light_outage',   category_id: 21 },
  { key: 'complaint.preset.flooding_drainage',     category_id: 22 },
  { key: 'complaint.preset.illegal_construction',  category_id: 23 },
  { key: 'complaint.preset.stray_animals',         category_id: 24 },
  { key: 'complaint.preset.public_intoxication',   category_id: 25 },
  { key: 'complaint.preset.illegal_vending',       category_id: 26 },
  { key: 'complaint.preset.water_supply_issue',    category_id: 27 },
  { key: 'complaint.preset.garbage_collection',    category_id: 28 },
  { key: 'complaint.preset.vandalism',             category_id: 29 },
  { key: OTHER_KEY,                                category_id: 30 },
];