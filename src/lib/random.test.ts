import { describe, expect, it } from 'vitest';
import { createRandom } from './random';

const draw = (seed: number, n = 5) => {
  const random = createRandom(seed);
  return Array.from({ length: n }, () => random.next());
};

describe('createRandom', () => {
  it('repeats the same sequence for the same seed', () => {
    expect(draw(42)).toEqual(draw(42));
  });

  it('gives a different sequence for a different seed', () => {
    expect(draw(1)).not.toEqual(draw(2));
  });

  it('stays in [0, 1)', () => {
    for (const n of draw(7, 200)) {
      expect(n).toBeGreaterThanOrEqual(0);
      expect(n).toBeLessThan(1);
    }
  });
});
