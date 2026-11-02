import { describe, expect, it } from 'vitest';
import { createRandom } from './random';
import {
  inflationStepText,
  newspaperHeadline,
  nextPriceLevel,
  randomWithinRange,
  roundLevel,
  scalePrice,
} from './inflation';
import type { InflationRule } from '@/types';

// An invented rule: no number here belongs to the shipped data.
const rule: InflationRule = {
  startLevel: 2,
  nextLevel: randomWithinRange({ min: 3, max: 4 }),
  notableMoves: [
    { minMove: 0.5, up: 'up', down: 'down' },
    { minMove: 1, up: 'UP', down: 'DOWN' },
  ],
};

describe('scalePrice', () => {
  it('rounds to whole dollars, halves up, whatever the base', () => {
    expect(scalePrice(5, 1.1)).toBe(6); // 5.50
    expect(scalePrice(5, 1.09)).toBe(5); // 5.45
    expect(scalePrice(1, 0.4)).toBe(0);
    expect(scalePrice(200, 0.83)).toBe(166);
  });

  it('is not thrown by float error in the level', () => {
    expect(scalePrice(10, 0.1 + 0.2 + 0.25)).toBe(Math.round(10 * 0.55));
  });
});

describe('roundLevel', () => {
  it('keeps two decimals', () => {
    expect(roundLevel(1.2345)).toBe(1.23);
    expect(roundLevel(0.835)).toBeCloseTo(0.84, 2);
  });
});

describe('randomWithinRange and nextPriceLevel', () => {
  it('stays inside the range given and repeats for a seed and Week', () => {
    for (let week = 2; week < 60; week++) {
      const level = nextPriceLevel(rule, 11, week, 3);
      expect(level).toBeGreaterThanOrEqual(3);
      expect(level).toBeLessThanOrEqual(4);
      expect(nextPriceLevel(rule, 11, week, 3)).toBe(level);
    }
  });

  it('depends on the seed and the Week, not on the draws before', () => {
    expect(nextPriceLevel(rule, 11, 5, 3)).not.toBe(
      nextPriceLevel(rule, 12, 5, 3),
    );
    expect(nextPriceLevel(rule, 11, 5, 3)).not.toBe(
      nextPriceLevel(rule, 11, 6, 3),
    );
  });

  it('hands the rule a random source seeded for the Week', () => {
    const seen: number[] = [];
    const probe: InflationRule = {
      ...rule,
      nextLevel: ({ random, week, previous }) => {
        seen.push(random.next(), week, previous);
        return 1;
      },
    };
    nextPriceLevel(probe, 4, 9, 1.5);
    nextPriceLevel(probe, 4, 9, 1.5);
    expect(seen.slice(0, 3)).toEqual(seen.slice(3));
    expect(seen.slice(1, 3)).toEqual([9, 1.5]);
    expect(createRandom(4).next()).not.toBe(seen[0]);
  });

  it.each([NaN, Infinity, 0, -1])(
    'keeps the level when the rule gives %s',
    (bad) => {
      expect(nextPriceLevel({ ...rule, nextLevel: () => bad }, 1, 2, 2.5)).toBe(
        2.5,
      );
    },
  );
});

describe('newspaperHeadline', () => {
  it('is null for a move below every threshold or no move', () => {
    expect(newspaperHeadline(rule, 2, 2.4)).toBeNull();
    expect(newspaperHeadline(rule, 2, 2)).toBeNull();
    expect(newspaperHeadline({ ...rule, notableMoves: [] }, 2, 9)).toBeNull();
  });

  it('counts a move exactly at the threshold, up or down', () => {
    expect(newspaperHeadline(rule, 2, 2.5)).toBe('up');
    expect(newspaperHeadline(rule, 2, 1.5)).toBe('down');
    expect(newspaperHeadline(rule, 0.83, 1.33)).toBe('up'); // float edge
  });

  it('names the largest threshold met', () => {
    expect(newspaperHeadline(rule, 2, 3)).toBe('UP');
    expect(newspaperHeadline(rule, 3, 1.9)).toBe('DOWN');
  });
});

describe('inflationStepText', () => {
  it('shows both levels to two decimals, or that the level stayed', () => {
    expect(inflationStepText(1, 1.08)).toBe(
      'Price level moves from 1.00 to 1.08.',
    );
    expect(inflationStepText(1.2, 1.2)).toBe('Price level stays at 1.20.');
  });
});
