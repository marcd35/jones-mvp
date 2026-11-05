import type { DataPack, GoalDef, GoalId, GoalPoints, Player } from '@/types';
import { ownedGoodsHappiness } from './household-goods';
import { scalePrice } from './inflation';

// What a Goal measure reads besides the Player: the pack and this Week's price
// level, which values owned goods.
export interface GoalContext {
  pack: DataPack;
  priceLevel: number;
}

// The target a positive allocation sets, from the Goal's data table
// (UNK-005, approved in T-15a #44).
export const goalTarget = (def: GoalDef, points: number): number => {
  const rule = def.target;
  switch (rule.kind) {
    case 'per-point':
      return points * rule.amount;
    case 'points-per-unit':
      return Math.ceil(points / rule.pointsPerUnit);
    case 'bands':
      return (
        rule.bands.find((band) => points <= band.maxPoints) ??
        rule.bands[rule.bands.length - 1]
      ).target;
  }
};

export const goalTargetText = (def: GoalDef, points: number): string =>
  `${def.prefix}${goalTarget(def, points).toLocaleString('en-US')}${def.suffix}`;

// Cash plus owned household goods at this Week's listed price, minus rent owed.
export const netWorth = (
  player: Player,
  pack: DataPack,
  priceLevel: number,
): number => {
  const owned = new Set(player.ownedGoods);
  const goods = pack.householdGoods.goods.reduce(
    (total, good) =>
      total + (owned.has(good.id) ? scalePrice(good.basePrice, priceLevel) : 0),
    0,
  );
  return player.money + goods - player.owedRent;
};

// How far the Player has got on a Goal (#44).
export const goalMeasure = (
  id: GoalId,
  player: Player,
  { pack, priceLevel }: GoalContext,
): number => {
  switch (id) {
    case 'wealth':
      return netWorth(player, pack, priceLevel);
    case 'happiness':
      // Owned goods only: no decay, nothing from food, clothes, cash or job.
      return ownedGoodsHappiness(pack, player.ownedGoods);
    case 'education':
      return player.educationLevel; // The highest completed level
    case 'career':
      return player.highestRung; // Kept across job changes
  }
};

// A Goal with 0 points is met (there is nothing to reach). A Goal with points
// is met when its measure reaches the target.
export const isGoalMet = (
  def: GoalDef,
  player: Player,
  context: GoalContext,
): boolean => {
  const points = player.goals[def.id];
  if (points === 0) return true;
  return goalMeasure(def.id, player, context) >= goalTarget(def, points);
};

export const allGoalsMet = (
  goals: GoalDef[],
  player: Player,
  context: GoalContext,
): boolean => goals.every((def) => isGoalMet(def, player, context));

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
