import type { DataPack } from '@/types';
import { CLOTHING } from './clothing';
import { FOOD } from './food';
import { INFLATION } from './inflation';
import { GOALS, GOAL_POINTS_BUDGET } from './goals';
import { LAYOUT } from './layout';
import { JOBS, LOCATIONS } from './locations';
import { WALKING_COSTS } from './walking';

export const defaultPack: DataPack = {
  locations: LOCATIONS,
  jobs: JOBS,
  layout: LAYOUT,
  walkingCosts: WALKING_COSTS,
  homeLocationId: 'low-cost-housing',
  startingMoney: 200, // Observed in the original (AC-005)
  goalPointsBudget: GOAL_POINTS_BUDGET,
  goals: GOALS,
  rentOwedLimit: 300, // DEC-023: 3 months of rent; T-09 may tune
  inflation: INFLATION,
  food: FOOD,
  clothing: CLOTHING,
};
