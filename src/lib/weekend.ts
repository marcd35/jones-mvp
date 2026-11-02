import type { WeekendEffectId } from '@/types';

// The effects of a Week's end, in the order they are applied and listed in the
// weekend report (AC-004). The order is fixed:
//   1. food       - hunger, which sets the next Turn's Time penalty
//   2. clothing   - wear on the Player's clothes
//   3. rent       - rent falling due, paid from the cash on hand
//   4. inflation  - the step in the price level for the coming Week
//   5. newspaper  - announces the inflation step, so it comes after it
// Then the next Turn starts: the Player is at home with full Time, less any
// hunger penalty. Each later effect fills its own slot and leaves the order
// alone.
export const WEEKEND_EFFECTS: { id: WeekendEffectId; label: string }[] = [
  { id: 'food', label: 'Food' },
  { id: 'clothing', label: 'Clothing wear' },
  { id: 'rent', label: 'Rent due' },
  { id: 'inflation', label: 'Inflation step' },
  { id: 'newspaper', label: 'Newspaper' },
];
