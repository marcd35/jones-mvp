import type { WalkingCostTable } from '@/types';

// DEC-025: percent of a 12-hour Week by ring distance. Distances 4 and 5 are
// not measured yet; lookup interpolates them. Distances beyond the last
// measured point cost the same as it.
export const WALKING_COSTS: WalkingCostTable = {
  1: 3.9,
  2: 5.5,
  3: 7.7,
  6: 11.6,
  7: 11.6,
};
