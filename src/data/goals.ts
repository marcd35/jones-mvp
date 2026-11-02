import type { GoalDef } from '@/types';

// DEC-009: the Player splits the Goal points budget across four Goals.
// Observed in the original: 200 points, four sliders at the middle.
export const GOAL_POINTS_BUDGET = 200;

// UNK-005 is open: how Goal points map to a target is not known. Every
// `perPoint` below is a PLACEHOLDER until the balance pass (T-15); the target
// is points x perPoint, rounded up.
//
// Default split: 50 points on wealth (a $2000 target, as in the original) and
// none on the rest; the other 150 points start unspent. Happiness, education
// and career have no measure yet, so a Goal with points on any of them can
// never be met and a spread default could not be won. T-10 to T-12 add those
// measures; they should restore a spread default (the original was 50 on each
// Goal).
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
    defaultPoints: 0,
    perPoint: 1,
    prefix: '',
    suffix: ' happiness',
  },
  {
    id: 'education',
    label: 'Education',
    defaultPoints: 0,
    perPoint: 0.04,
    prefix: 'Education level ',
    suffix: '',
  },
  {
    id: 'career',
    label: 'Career',
    defaultPoints: 0,
    perPoint: 0.04,
    prefix: 'Career level ',
    suffix: '',
  },
];
