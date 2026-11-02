import type { ClothingRules, Player } from '@/types';

type Clothes = Player['clothes'];

// How the Player's clothes stand (AC-008).
export type ClothesState = 'none' | 'good' | 'warning' | 'worn';

export const clothesState = (
  rules: ClothingRules,
  clothes: Clothes,
): ClothesState => {
  if (!clothes) return 'none';
  if (clothes.weeksWorn >= rules.wearOutWeeks) return 'worn';
  return rules.wearOutWeeks - clothes.weeksWorn <= rules.warnWeeks
    ? 'warning'
    : 'good';
};

export const tierOf = (rules: ClothingRules, clothes: Clothes) =>
  rules.tiers.find((t) => t.id === clothes?.tierId);

// Weeks of wear left, 0 once worn out.
export const weeksLeft = (rules: ClothingRules, clothes: Clothes) =>
  clothes ? Math.max(0, rules.wearOutWeeks - clothes.weeksWorn) : 0;

// Whether the clothes meet a job's clothing requirement: not worn out, and of
// at least the required tier's rank. Worn clothes meet none (AC-008).
export function meetsClothing(
  rules: ClothingRules,
  clothes: Clothes,
  requiredTierId: string | undefined,
): boolean {
  if (requiredTierId === undefined) return true;
  const state = clothesState(rules, clothes);
  if (state === 'none' || state === 'worn') return false;
  const have = tierOf(rules, clothes);
  const need = rules.tiers.find((t) => t.id === requiredTierId);
  return !!have && !!need && have.rank >= need.rank;
}

// One more Week of wear, and what the weekend report says of it (null when
// nothing changed: no clothes, or already worn out).
export function wearOneWeek(
  rules: ClothingRules,
  clothes: Clothes,
): { clothes: Clothes; text: string | null } {
  if (!clothes || clothesState(rules, clothes) === 'worn') {
    return { clothes, text: null };
  }
  const worn = { ...clothes, weeksWorn: clothes.weeksWorn + 1 };
  const name = tierOf(rules, clothes)?.name ?? 'clothes';
  const state = clothesState(rules, worn);
  if (state === 'worn') {
    return { clothes: worn, text: `Your ${name} are worn out.` };
  }
  if (state === 'warning') {
    const left = weeksLeft(rules, worn);
    return {
      clothes: worn,
      text: `Your ${name} will wear out in ${left} ${left === 1 ? 'Week' : 'Weeks'}.`,
    };
  }
  return { clothes: worn, text: null };
}
