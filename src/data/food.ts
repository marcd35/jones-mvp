import type { FoodRules } from '@/types';

// AC-007, DEC-022, UNK-004, UNK-006. Prices are base prices at level 1.00 and
// are placeholders for the balance pass (T-15):
// - Monolith Burger: the cheapest menu item, Fries, was $68 in Week 1 (level
//   1.00). Fieldwork did not test that it clears hunger.
// - Black's Market: Food for 1, 2 and 4 Weeks cost $70, $128 and $243 in Week 7
//   (level 1.22), which is $57, $105 and $199 at level 1.00.
// - Hunger: about 35% of a Week (4 of 12 hours), as the old MVP rule had it.
// - Buying keeps the MVP's 1 hour of Time for each purchase (unmeasured).
export const FOOD: FoodRules = {
  penaltyHours: 4,
  goods: [
    {
      id: 'monolith-fries',
      name: 'Fries (food for 1 Week)',
      locationId: 'monolith-burger',
      weeks: 1,
      basePrice: 68,
      timeHours: 1,
    },
    {
      id: 'market-food-1',
      name: 'Food for 1 Week',
      locationId: 'blacks-market',
      weeks: 1,
      basePrice: 57,
      timeHours: 1,
    },
    {
      id: 'market-food-2',
      name: 'Food for 2 Weeks',
      locationId: 'blacks-market',
      weeks: 2,
      basePrice: 105,
      timeHours: 1,
    },
    {
      id: 'market-food-4',
      name: 'Food for 4 Weeks',
      locationId: 'blacks-market',
      weeks: 4,
      basePrice: 199,
      timeHours: 1,
    },
  ],
};
