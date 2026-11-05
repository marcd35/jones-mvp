import { describe, expect, it } from 'vitest';
import { defaultPack } from '@/data';
import { loadPack } from '@/data/loader';
import { PROFILES, RUN_SETS, runGame, WEEK_CAP } from './harness';

// The balance gate itself (#45) lives in `npm run balance`, not here.
const pack = loadPack(defaultPack);
const SEEDS = [1001, 1002, 1003];

describe('balance harness', () => {
  it.each(RUN_SETS)(
    'replays $policy / $profile identically from the same seed',
    ({ policy, profile }) => {
      for (const seed of SEEDS) {
        const first = runGame(pack, seed, policy, profile);
        expect(runGame(pack, seed, policy, profile)).toEqual(first);
        expect(first.goals).toEqual(PROFILES[profile]);
        expect(['won', 'lost', 'timeout']).toContain(first.outcome);
        expect(first.endingWeek).toBeGreaterThan(0);
        expect(first.endingWeek).toBeLessThanOrEqual(WEEK_CAP);
      }
    },
  );

  it('plays the policies to an end: the careless one through the rent limit', () => {
    const careless = runGame(pack, 1001, 'careless', 'primary');
    expect(careless.outcome).toBe('lost');
    expect(careless.lossReason).toBe('rent owed limit');
    const sensible = runGame(pack, 1001, 'sensible', 'primary');
    expect(sensible.outcome).not.toBe('lost');
  });
});
