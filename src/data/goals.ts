import type { GoalDef } from '@/types';

// DEC-009: the Player splits the Goal points budget across four Goals.
// Observed in the original: 200 points, four sliders at the middle.
export const GOAL_POINTS_BUDGET = 200;

// UNK-005: the author-approved target tables (T-15a, #44). Each positive
// allocation, in 5-point steps, sets the target below; 0 points is already met.
// - Wealth: $40 of net worth per point.
// - Happiness: points / 4, rounded up, in happiness points.
// - Education: level 1 at 5-100 points, level 2 at 105-200.
// - Career: points / 25, rounded up, as a job rung.
//
// Default split: 50 points on each Goal, as in the original.
export const GOALS: GoalDef[] = [
  {
    id: 'wealth',
    label: 'Wealth',
    defaultPoints: 50,
    target: { kind: 'per-point', amount: 40 },
    prefix: '$',
    suffix: '',
  },
  {
    id: 'happiness',
    label: 'Happiness',
    defaultPoints: 50,
    target: { kind: 'points-per-unit', pointsPerUnit: 4 },
    prefix: '',
    suffix: ' happiness',
  },
  {
    id: 'education',
    label: 'Education',
    defaultPoints: 50,
    target: {
      kind: 'bands',
      bands: [
        { maxPoints: 100, target: 1 },
        { maxPoints: 200, target: 2 },
      ],
    },
    prefix: 'Education level ',
    suffix: '',
  },
  {
    id: 'career',
    label: 'Career',
    defaultPoints: 50,
    target: { kind: 'points-per-unit', pointsPerUnit: 25 },
    prefix: 'Career rung ',
    suffix: '',
  },
];
