import type { NewspaperRules } from '@/types';

// Issue #20: the original sells one $1 issue at Black's Market each Week.
// The price stays flat as the hidden shop price level changes.
export const NEWSPAPER: NewspaperRules = {
  locationId: 'blacks-market',
  price: 1,
  timeHours: 0.3, // About 2.5% of a 12-hour Week
  issueEveryWeeks: 1,
};
