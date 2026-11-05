import { describe, expect, it } from 'vitest';
import { defaultPack } from '@/data';
import { scalePrice } from './inflation';
import {
  allGoalsMet,
  goalMeasure,
  goalTarget,
  goalTargetText,
  isGoalMet,
  netWorth,
} from './goals';
import type { GoalDef, GoalId, GoalPoints, Player } from '@/types';

const goal = (id: GoalId): GoalDef =>
  defaultPack.goals.find((g) => g.id === id)!;
const ctx = (priceLevel = 1) => ({ pack: defaultPack, priceLevel });

const basePlayer = (patch: Partial<Player> = {}): Player => ({
  id: 'p',
  name: 'P',
  money: 0,
  timeRemaining: 12,
  educationLevel: 0,
  educationPath: null,
  enrolledCourseId: null,
  courseClassesCompleted: 0,
  completedCourseIds: [],
  foodWeeks: 0,
  ownedGoods: [],
  isStarving: false,
  clothes: null,
  locationId: defaultPack.homeLocationId,
  jobId: null,
  heldWage: null,
  careerExperience: {},
  highestRung: 0,
  goals: { wealth: 0, happiness: 0, education: 0, career: 0 },
  owedRent: 0,
  rentDueWeek: 4,
  rentExtensionAskedWeek: null,
  rentPaidWeek: null,
  newspaperReadWeek: null,
  ...patch,
});
const only = (id: GoalId, points: number): GoalPoints => ({
  wealth: 0,
  happiness: 0,
  education: 0,
  career: 0,
  [id]: points,
});

describe('approved Goal targets (#44)', () => {
  it('sets Wealth at $40 per point', () => {
    expect(goalTarget(goal('wealth'), 5)).toBe(200);
    expect(goalTarget(goal('wealth'), 50)).toBe(2000);
    expect(goalTarget(goal('wealth'), 200)).toBe(8000);
  });

  it('sets Happiness at points / 4, rounded up', () => {
    expect(goalTarget(goal('happiness'), 5)).toBe(2);
    expect(goalTarget(goal('happiness'), 50)).toBe(13);
    expect(goalTarget(goal('happiness'), 200)).toBe(50);
  });

  it('sets Education level 1 at 5-100 points and level 2 at 105-200', () => {
    expect(goalTarget(goal('education'), 5)).toBe(1);
    expect(goalTarget(goal('education'), 100)).toBe(1);
    expect(goalTarget(goal('education'), 105)).toBe(2);
    expect(goalTarget(goal('education'), 200)).toBe(2);
  });

  it('sets Career at points / 25, rounded up, as a rung', () => {
    expect(goalTarget(goal('career'), 5)).toBe(1);
    expect(goalTarget(goal('career'), 25)).toBe(1);
    expect(goalTarget(goal('career'), 30)).toBe(2);
    expect(goalTarget(goal('career'), 200)).toBe(8);
  });

  it('shows each target with its unit', () => {
    expect(goalTargetText(goal('wealth'), 50)).toBe('$2,000');
    expect(goalTargetText(goal('happiness'), 50)).toBe('13 happiness');
    expect(goalTargetText(goal('education'), 105)).toBe('Education level 2');
    expect(goalTargetText(goal('career'), 50)).toBe('Career rung 2');
  });
});

describe('Goal measures (#44)', () => {
  const [microwave, tv] = ['microwave', 'color-tv'].map((id) =>
    defaultPack.householdGoods.goods.find((g) => g.id === id)!,
  );

  it('measures Wealth as cash plus goods at the listed price, minus rent owed', () => {
    const p = basePlayer({
      money: 500,
      ownedGoods: [microwave.id, tv.id],
      owedRent: 100,
    });
    const level = 1.1;
    const expected =
      500 +
      scalePrice(microwave.basePrice, level) +
      scalePrice(tv.basePrice, level) -
      100;
    expect(netWorth(p, defaultPack, level)).toBe(expected);
    expect(goalMeasure('wealth', p, ctx(level))).toBe(expected);
  });

  it('measures Happiness from owned goods only: not cash, food, clothes or job', () => {
    const p = basePlayer({
      money: 10_000,
      foodWeeks: 5,
      clothes: { tierId: defaultPack.clothing.startTierId, weeksWorn: 0 },
      jobId: 'factory-general-manager',
      highestRung: 9,
      ownedGoods: [microwave.id, tv.id],
    });
    expect(goalMeasure('happiness', p, ctx())).toBe(
      microwave.happinessPoints + tv.happinessPoints,
    );
    expect(goalMeasure('happiness', basePlayer(), ctx())).toBe(0);
  });

  it('measures Education as the highest completed level', () => {
    expect(
      goalMeasure('education', basePlayer({ educationLevel: 2 }), ctx()),
    ).toBe(2);
  });

  it('measures Career as the highest rung ever held, not the current job', () => {
    const p = basePlayer({ jobId: 'cook', highestRung: 3 });
    expect(goalMeasure('career', p, ctx())).toBe(3);
  });
});

describe('meeting Goals (#44)', () => {
  it('treats a Goal with zero points as met', () => {
    for (const def of defaultPack.goals) {
      expect(isGoalMet(def, basePlayer(), ctx())).toBe(true);
    }
  });

  it('meets each positive Goal at its target and not one short', () => {
    const cases: [GoalId, Partial<Player>, Partial<Player>][] = [
      ['wealth', { money: 2000 }, { money: 1999 }],
      ['education', { educationLevel: 1 }, { educationLevel: 0 }],
      ['career', { highestRung: 2 }, { highestRung: 1 }],
    ];
    for (const [id, enough, short] of cases) {
      const goals = only(id, 50);
      expect(isGoalMet(goal(id), basePlayer({ goals, ...enough }), ctx())).toBe(
        true,
      );
      expect(isGoalMet(goal(id), basePlayer({ goals, ...short }), ctx())).toBe(
        false,
      );
    }
    // 13 happiness for 50 points: a hot tub (10) and a microwave (3).
    const goals = only('happiness', 50);
    expect(
      isGoalMet(
        goal('happiness'),
        basePlayer({ goals, ownedGoods: ['hot-tub', 'microwave'] }),
        ctx(),
      ),
    ).toBe(true);
    expect(
      isGoalMet(
        goal('happiness'),
        basePlayer({ goals, ownedGoods: ['hot-tub'] }),
        ctx(),
      ),
    ).toBe(false);
  });

  it('needs all four Goals met', () => {
    const goals = { wealth: 50, happiness: 50, education: 50, career: 50 };
    const all = basePlayer({
      goals,
      money: 2000,
      ownedGoods: ['hot-tub', 'microwave'],
      educationLevel: 1,
      highestRung: 2,
    });
    expect(allGoalsMet(defaultPack.goals, all, ctx())).toBe(true);
    expect(
      allGoalsMet(defaultPack.goals, { ...all, highestRung: 1 }, ctx()),
    ).toBe(false);
  });
});
