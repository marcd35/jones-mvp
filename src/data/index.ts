import type { DataPack } from '@/types';
import { LAYOUT } from './layout';
import { JOBS, LOCATIONS } from './locations';
import { WALKING_COSTS } from './walking';

export const defaultPack: DataPack = {
  locations: LOCATIONS,
  jobs: JOBS,
  layout: LAYOUT,
  walkingCosts: WALKING_COSTS,
  homeLocationId: 'low-cost-housing',
};
