import type { ClothingRules } from '@/types';

// AC-008, DEC-024, UNK-006. Base prices are QT Clothing's Week 1 menu (level
// 1.00). Clothes wore out at about Week 6 in the original; both the wear and
// the starting clothes are placeholders for the balance pass (T-15).
export const CLOTHING: ClothingRules = {
  locationId: 'qt-clothing',
  tiers: [
    { id: 'casual', name: 'Casual Clothes', rank: 1, basePrice: 76 },
    { id: 'dress', name: 'Dress Clothes', rank: 2, basePrice: 131 },
    { id: 'suit', name: 'Business Suit', rank: 3, basePrice: 309 },
  ],
  startTierId: 'casual',
  wearOutWeeks: 6,
  warnWeeks: 1,
};
