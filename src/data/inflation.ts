import { randomWithinRange } from '@/lib/inflation';
import type { InflationRule } from '@/types';

// DEC-021, DEC-024: Week 1 is 1.00; the level then moves in random steps in
// the observed range, about 0.83 to 1.22. The thresholds and headlines are
// placeholders for the balance pass (T-15) and the fieldwork (T-01).
export const INFLATION: InflationRule = {
  startLevel: 1,
  nextLevel: randomWithinRange({ min: 0.83, max: 1.22 }),
  notableMoves: [
    {
      minMove: 0.1,
      up: 'Prices are climbing in the shops.',
      down: 'Prices are falling in the shops.',
    },
    {
      minMove: 0.2,
      up: 'Prices soar! Everything costs far more.',
      down: 'Prices tumble! Everything costs far less.',
    },
  ],
};
