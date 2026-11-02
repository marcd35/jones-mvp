import type { GoalDef } from '@/types';

// DEC-009: the Player splits the Goal points budget across four Goals.
// Observed in the original: 200 points, four sliders at the middle.
export const GOAL_POINTS_BUDGET = 200;

// UNK-005 is open: how Goal points map to a target is not known. Every
// `perPoint` below is a PLACEHOLDER until the balance pass (T-15); the target
// is points x perPoint, rounded up. The wealth rate makes the default 50
// points a $2000 target, the design doc's default ("Accumulate $2000").
export const GOALS: GoalDef[] = [
  {
    id: 'wealth',
    label: 'Wealth',
    defaultPoints: 50,
    perPoint: 40,
    prefix: '$',
    suffix: '',
  },
  {
    id: 'happiness',
    label: 'Happiness',
    defaultPoints: 50,
    perPoint: 1,
    prefix: '',
    suffix: ' happiness',
  },
  {
    id: 'education',
    label: 'Education',
    defaultPoints: 50,
    perPoint: 0.04,
    prefix: 'Education level ',
    suffix: '',
  },
  {
    id: 'career',
    label: 'Career',
    defaultPoints: 50,
    perPoint: 0.04,
    prefix: 'Career level ',
    suffix: '',
  },
];
