import type { GoalDef, GoalId, GoalPoints, Player } from '@/types';

// The target a Goal sets for the points spent on it (UNK-005: from the data
// table; placeholders until T-15).
export const goalTarget = (def: GoalDef, points: number): number =>
  Math.ceil(points * def.perPoint);

export const goalTargetText = (def: GoalDef, points: number): string =>
  `${def.prefix}${goalTarget(def, points).toLocaleString('en-US')}${def.suffix}`;

// How far the Player has got on a Goal, or null when nothing measures it yet.
// Only wealth has a measure; happiness, education and career arrive in T-10
// to T-12. Until then a Goal with points on it can never be met.
export const goalMeasure = (id: GoalId, player: Player): number | null => {
  switch (id) {
    case 'wealth':
      return player.money; // Cash only; goods count once they exist (T-12)
    default:
      return null;
  }
};

// A Goal with 0 points is met (there is nothing to reach). A Goal with points
// is met when its measure reaches the target; with no measure it is not met.
export const isGoalMet = (def: GoalDef, player: Player): boolean => {
  const points = player.goals[def.id];
  if (points === 0) return true;
  const measure = goalMeasure(def.id, player);
  return measure !== null && measure >= goalTarget(def, points);
};

export const allGoalsMet = (goals: GoalDef[], player: Player): boolean =>
  goals.every((def) => isGoalMet(def, player));

export const totalGoalPoints = (points: GoalPoints): number =>
  Object.values(points).reduce((sum, p) => sum + p, 0);

// The most points one Goal can take without the sum passing the budget.
export const clampGoalPoints = (
  points: GoalPoints,
  id: GoalId,
  wanted: number,
  budget: number,
): number => {
  if (!Number.isFinite(wanted)) return points[id];
  const room = budget - (totalGoalPoints(points) - points[id]);
  return Math.max(0, Math.min(Math.round(wanted), room));
};
