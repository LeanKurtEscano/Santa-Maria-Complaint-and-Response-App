// hooks/general/useComplaintCategories.ts
//
// ─── HOW TO SWITCH TO LIVE FETCHING ──────────────────────────────────────────
// 1. Import your category client:  import { categoryApiClient } from '@/lib/client/category';
// 2. Uncomment the "LIVE FETCH" queryFn below.
// 3. Comment out the "STATIC FALLBACK" queryFn.
// ─────────────────────────────────────────────────────────────────────────────

import { useQuery } from '@tanstack/react-query';
import { PRESET_TITLE_KEYS, PresetTitle } from '@/constants/localization/complaint-title-key';

interface CategoryRow {
  id: number;
  category_name: string; // e.g. "noise_disturbance" → complaint.preset.noise_disturbance
}

export function useComplaintCategories() {
  return useQuery<PresetTitle[]>({
    queryKey: ['complaint-categories'],

    // ─── STATIC FALLBACK (active) ─────────────────────────────────────────────
    queryFn: () => PRESET_TITLE_KEYS,
    // ─────────────────────────────────────────────────────────────────────────

    // ─── LIVE FETCH (uncomment when endpoint is ready) ────────────────────────
    // queryFn: async () => {
    //   const response = await categoryApiClient.get('/');
    //   return response.data.map((row: CategoryRow) => ({
    //     key: `complaint.preset.${row.category_name}`,
    //     category_id: row.id,
    //   }));
    // },
    // ─────────────────────────────────────────────────────────────────────────

    staleTime: Infinity, // categories rarely change — no background refetch needed
    // staleTime: 1000 * 60 * 5, // uncomment when live: refetch every 5 min
  });
}