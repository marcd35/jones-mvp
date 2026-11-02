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
  rentOwedLimit: 975, // Three months at the fixed $325 lease rate
  rent: {
    locationId: 'rent-office',
    homeAmounts: { 'low-cost-housing': 325 },
    intervalWeeks: 4,
    garnishment: 18,
  },
  inflation: INFLATION,
  food: FOOD,
  clothing: CLOTHING,
};
