// hooks/general/useComplaintCategories.ts
import { useQuery } from '@tanstack/react-query';
import { PRESET_TITLE_KEYS, PresetTitle } from '@/constants/localization/complaint-title-key';
import { categoryApiClient } from '@/lib/client/categoryComplaint';

interface CategoryRow {
  id: number;
  category_name: string;
}

export function useComplaintCategories() {
  return useQuery<PresetTitle[]>({
    queryKey: ['complaint-categories'],

    queryFn: async () => {
      try {
        const response = await categoryApiClient.get('/');
        const mapped: PresetTitle[] = response.data.map((row: CategoryRow) => ({
          key: `complaint.preset.${row.category_name}`,
          category_id: row.id,
        }));
        // Ensure OTHER_KEY is always last
        return mapped;
      } catch {
        // API failed — silently fall back to static presets
        return PRESET_TITLE_KEYS;
      }
    },

    staleTime: 1000 * 60 * 5, // refetch every 5 min
    placeholderData: PRESET_TITLE_KEYS, // show static immediately while fetching
  });
}