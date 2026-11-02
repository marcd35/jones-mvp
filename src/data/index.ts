import type { DataPack } from '@/types';
import { CLOTHING } from './clothing';
import { EDUCATION } from './education';
import { FOOD } from './food';
import { HOUSEHOLD_GOODS } from './household-goods';
import { INFLATION } from './inflation';
import { NEWSPAPER } from './newspaper';
import { GOALS, GOAL_POINTS_BUDGET } from './goals';
import { LAYOUT } from './layout';
import { JOBS, LOCATIONS } from './locations';
import { WALKING_COSTS } from './walking';

export const defaultPack: DataPack = {
  locations: LOCATIONS,
  jobs: JOBS,
  education: EDUCATION,
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
  newspaper: NEWSPAPER,
  food: FOOD,
  householdGoods: HOUSEHOLD_GOODS,
  clothing: CLOTHING,
};
