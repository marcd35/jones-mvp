import { describe, expect, it } from 'vitest';
import { defaultPack } from '@/data';
import { loadPack, validatePack } from './loader';
import type { BoardCell, DataPack } from '@/types';

const withCells = (cells: BoardCell[]): DataPack => ({
  ...defaultPack,
  layout: { ...defaultPack.layout, cells },
});

describe('validatePack', () => {
  it('accepts the shipped data', () => {
    expect(validatePack(defaultPack)).toEqual([]);
  });

  it('rejects invalid household good values', () => {
    const pack = {
      ...defaultPack,
      householdGoods: {
        goods: [{ ...defaultPack.householdGoods.goods[0], stockChance: 2 }],
      },
    };
    expect(validatePack(pack)).toContain(
      'Household good "microwave" needs a stock chance between 0 and 1.',
    );
  });

  it('rejects a layout with a missing cell', () => {
    const problems = validatePack(withCells(defaultPack.layout.cells.slice(1)));
    expect(problems).toContain('Board layout has no cell at 0,0.');
  });

  it('rejects a layout with a duplicate cell', () => {
    const cells = [...defaultPack.layout.cells];
    cells[1] = { ...cells[1], row: 0, col: 0 };
    const problems = validatePack(withCells(cells));
    expect(problems).toContain('Board layout has two cells at 0,0.');
    expect(problems).toContain('Board layout has no cell at 0,1.');
  });

  it('rejects a cell that is not on the ring', () => {
    const cells = [
      ...defaultPack.layout.cells,
      { row: 2, col: 2, content: { kind: 'blank' } } as BoardCell,
    ];
    expect(validatePack(withCells(cells))).toContain(
      'Board layout cell 2,2 is not on the ring.',
    );
  });

  it('rejects a Location placed twice or not placed', () => {
    const cells = defaultPack.layout.cells.map((c) =>
      c.content.kind === 'location' && c.content.locationId === 'bank'
        ? { ...c, content: { kind: 'location', locationId: 'z-mart' } as const }
        : c,
    );
    const problems = validatePack(withCells(cells));
    expect(problems).toContain('Location "z-mart" is on the Board twice.');
    expect(problems).toContain('Location "bank" is not on the Board.');
  });

  it('rejects a layout cell naming an unknown Location', () => {
    const cells = defaultPack.layout.cells.map((c) =>
      c.content.kind === 'location' && c.content.locationId === 'bank'
        ? { ...c, content: { kind: 'location', locationId: 'moon' } as const }
        : c,
    );
    expect(validatePack(withCells(cells))).toContain(
      'Board layout names unknown Location "moon".',
    );
  });

  it('rejects a layout without exactly one Clock cell', () => {
    const cells = defaultPack.layout.cells.map((c) =>
      c.content.kind === 'clock'
        ? { ...c, content: { kind: 'blank' } as const }
        : c,
    );
    expect(validatePack(withCells(cells))).toContain(
      'Board layout needs exactly one Clock cell, found 0.',
    );
  });

  it('rejects a job at an unknown Location', () => {
    const pack = {
      ...defaultPack,
      jobs: [{ ...defaultPack.jobs[0], locationId: 'moon' }],
    };
    expect(validatePack(pack)).toContain(
      'Job "cook" is at unknown Location "moon".',
    );
  });

  it('rejects a job at a closed Location', () => {
    const pack = {
      ...defaultPack,
      jobs: [{ ...defaultPack.jobs[0], locationId: 'bank' }],
    };
    expect(validatePack(pack)).toContain(
      'Job "cook" is at closed Location "bank".',
    );
  });

  it('rejects two jobs with the same id', () => {
    const pack = {
      ...defaultPack,
      jobs: [defaultPack.jobs[0], defaultPack.jobs[0]],
    };
    expect(validatePack(pack)).toContain('Job "cook" is defined twice.');
  });

  it.each([
    ['wage', -1, 'Job "cook" needs a wage of at least 0.'],
    ['wage', NaN, 'Job "cook" needs a wage of at least 0.'],
    ['shiftHours', 0, 'Job "cook" needs a shift of more than 0 paid hours.'],
    [
      'workTimeHours',
      0,
      'Job "cook" needs a Work Time cost of more than 0 hours.',
    ],
    [
      'workTimeHours',
      13,
      'Job "cook" has a Work Time cost of 13 hours, more than a Week of 12.',
    ],
    [
      'educationRequired',
      -1,
      'Job "cook" needs an education requirement of at least 0.',
    ],
  ])('rejects a job with a bad %s (%s)', (field, value, message) => {
    const pack = {
      ...defaultPack,
      jobs: [{ ...defaultPack.jobs[0], [field]: value }],
    };
    expect(validatePack(pack)).toContain(message);
  });

  it('rejects an unknown or closed home', () => {
    expect(validatePack({ ...defaultPack, homeLocationId: 'moon' })).toContain(
      'Home Location "moon" is not a Location.',
    );
    expect(validatePack({ ...defaultPack, homeLocationId: 'bank' })).toContain(
      'Home Location "bank" is closed.',
    );
  });

  it('rejects an empty or negative walking-cost table', () => {
    expect(validatePack({ ...defaultPack, walkingCosts: {} })).toContain(
      'Walking-cost table is empty.',
    );
    expect(validatePack({ ...defaultPack, walkingCosts: { 1: -2 } })).toContain(
      'Walking cost for 1 Steps must be a number of at least 0.',
    );
  });

  describe('Goals, starting cash and the rent limit', () => {
    const goals = defaultPack.goals;

    it('rejects a missing or repeated Goal', () => {
      expect(validatePack({ ...defaultPack, goals: goals.slice(1) })).toContain(
        'Goal "wealth" is missing.',
      );
      expect(
        validatePack({ ...defaultPack, goals: [...goals, goals[0]] }),
      ).toContain('Goal "wealth" is defined twice.');
    });

    it('rejects a Goal with no target per point or negative default points', () => {
      const bad = goals.map((g, i) =>
        i === 0 ? { ...g, perPoint: 0, defaultPoints: -1 } : g,
      );
      const problems = validatePack({ ...defaultPack, goals: bad });
      expect(problems).toContain(
        'Goal "wealth" needs a target per point above 0.',
      );
      expect(problems).toContain(
        'Goal "wealth" needs default points of at least 0.',
      );
    });

    it('rejects default points over the budget', () => {
      expect(validatePack({ ...defaultPack, goalPointsBudget: 40 })).toContain(
        'Default Goal points (50) are over the budget of 40.',
      );
      expect(validatePack({ ...defaultPack, goalPointsBudget: 0 })).toContain(
        'Goal points budget must be above 0.',
      );
    });

    it('rejects negative starting money and a rent limit of 0', () => {
      const problems = validatePack({
        ...defaultPack,
        startingMoney: -1,
        rentOwedLimit: 0,
      });
      expect(problems).toContain('Starting money must be at least 0.');
      expect(problems).toContain('The owed rent limit must be above 0.');
    });

    it('rejects invalid rent timing, amounts, garnishment, or office Location', () => {
      const problems = validatePack({
        ...defaultPack,
        rent: {
          ...defaultPack.rent,
          locationId: 'missing',
          intervalWeeks: 0,
          garnishment: -1,
          homeAmounts: { [defaultPack.homeLocationId]: -5 },
        },
      });
      expect(problems).toContain(
        'The Rent Office Location "missing" is missing or closed.',
      );
      expect(problems).toContain(
        'Rent must be due at a whole Week interval of at least 1.',
      );
      expect(problems).toContain('The rent garnishment must be at least 0.');
      expect(problems).toContain(
        `Rent for home Location "${defaultPack.homeLocationId}" must be non-negative.`,
      );
    });
  });
});

describe('loadPack', () => {
  it('returns a valid pack unchanged', () => {
    expect(loadPack(defaultPack)).toBe(defaultPack);
  });

  it('fails with a readable message listing every problem', () => {
    const pack = {
      ...defaultPack,
      homeLocationId: 'moon',
      walkingCosts: {},
    };
    expect(() => loadPack(pack)).toThrow(
      /Invalid data pack:[\s\S]*Home Location "moon" is not a Location\.[\s\S]*Walking-cost table is empty\./,
    );
  });
});

describe('validatePack inflation rule', () => {
  const rule = defaultPack.inflation;

  it('rejects a start level of 0, a missing rule and a threshold of 0', () => {
    const problems = validatePack({
      ...defaultPack,
      inflation: {
        startLevel: 0,
        nextLevel: undefined as never,
        notableMoves: [{ minMove: 0, up: 'a', down: 'b' }],
      },
    });
    expect(problems).toContain('The starting price level must be above 0.');
    expect(problems).toContain('The price level needs a rule (nextLevel).');
    expect(problems).toContain(
      'A newspaper threshold needs a move of more than 0.',
    );
  });

  it('accepts a replacement rule', () => {
    expect(
      validatePack({
        ...defaultPack,
        inflation: { ...rule, nextLevel: () => 1 },
      }),
    ).toEqual([]);
  });
});

describe('validatePack newspaper rules', () => {
  it.each([
    [{ locationId: 'moon' }, 'The newspaper is at unknown Location "moon".'],
    [{ locationId: 'bank' }, 'The newspaper is at closed Location "bank".'],
    [{ price: -1 }, 'The newspaper price must be at least 0.'],
    [
      { timeHours: 13 },
      'The newspaper reading Time must be between 0 and 12 hours.',
    ],
    [
      { issueEveryWeeks: 0 },
      'A new newspaper issue must appear at a whole Week interval of at least 1.',
    ],
  ])('rejects invalid newspaper rules %j', (patch, message) => {
    expect(
      validatePack({
        ...defaultPack,
        newspaper: { ...defaultPack.newspaper, ...patch },
      }),
    ).toContain(message);
  });

  it('accepts the default newspaper rules', () => {
    expect(validatePack(defaultPack)).toEqual([]);
  });
});

describe('validatePack: food and clothing', () => {
  const { food, clothing } = defaultPack;
  const withFood = (patch: Partial<typeof food>) => ({
    ...defaultPack,
    food: { ...food, ...patch },
  });
  const withGood = (patch: Record<string, unknown>) =>
    withFood({ goods: [{ ...food.goods[0], ...patch }] });
  const withClothing = (patch: Partial<typeof clothing>) => ({
    ...defaultPack,
    clothing: { ...clothing, ...patch },
  });

  it('rejects a job that asks for an unknown clothing tier', () => {
    const pack = {
      ...defaultPack,
      jobs: [{ ...defaultPack.jobs[0], clothingRequired: 'tuxedo' }],
    };
    expect(validatePack(pack)).toContain(
      'Job "cook" needs unknown clothing tier "tuxedo".',
    );
  });

  it('accepts a job with no clothing requirement', () => {
    const { clothingRequired, ...job } = defaultPack.jobs[0];
    void clothingRequired;
    expect(validatePack({ ...defaultPack, jobs: [job] })).toEqual([]);
  });

  it.each([
    [
      { locationId: 'moon' },
      'Food "monolith-fries" is at unknown Location "moon".',
    ],
    [
      { locationId: 'bank' },
      'Food "monolith-fries" is at closed Location "bank".',
    ],
    [
      { weeks: 0 },
      'Food "monolith-fries" needs a whole number of Weeks, at least 1.',
    ],
    [
      { weeks: 1.5 },
      'Food "monolith-fries" needs a whole number of Weeks, at least 1.',
    ],
    [{ basePrice: -1 }, 'Food "monolith-fries" needs a price of at least 0.'],
    [
      { timeHours: 13 },
      'Food "monolith-fries" needs a Time cost between 0 and 12 hours.',
    ],
  ])('rejects food with %j', (patch, message) => {
    expect(validatePack(withGood(patch))).toContain(message);
  });

  it('rejects food defined twice and a penalty that takes the whole Week', () => {
    expect(
      validatePack(withFood({ goods: [food.goods[0], food.goods[0]] })),
    ).toContain('Food "monolith-fries" is defined twice.');
    expect(validatePack(withFood({ penaltyHours: 12 }))).toContain(
      'The hunger penalty must be at least 0 and less than a Week of 12 hours.',
    );
  });

  it.each([
    [
      { locationId: 'moon' },
      'The clothing shop is at unknown Location "moon".',
    ],
    [{ locationId: 'bank' }, 'The clothing shop is at closed Location "bank".'],
    [{ tiers: [] }, 'Clothing needs at least one tier.'],
    [
      { startTierId: 'rags' },
      'The starting clothes "rags" are not a clothing tier.',
    ],
    [
      { wearOutWeeks: 0 },
      'Clothes need to last a whole number of Weeks, at least 1.',
    ],
    [
      { warnWeeks: 6 },
      'The clothing warning must be a whole number of Weeks, at least 0 and less than the Weeks clothes last.',
    ],
  ])('rejects clothing with %j', (patch, message) => {
    expect(validatePack(withClothing(patch))).toContain(message);
  });

  it('rejects repeated tier ids and ranks, and a tier priced below 0', () => {
    const [a, b] = clothing.tiers;
    const problems = validatePack(
      withClothing({
        tiers: [a, { ...b, id: a.id, rank: a.rank, basePrice: -1 }],
      }),
    );
    expect(problems).toContain('Clothing tier "casual" is defined twice.');
    expect(problems).toContain('Clothing tier "casual" repeats the rank 1.');
    expect(problems).toContain(
      'Clothing tier "casual" needs a price of at least 0.',
    );
  });
});
