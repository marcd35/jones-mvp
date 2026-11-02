import { beforeEach, describe, expect, it } from 'vitest';
import { useGameStore } from './useGameStore';
import type { GameState } from '@/types';
import {
  CLASS_HOURS,
  FOOD_COST,
  JOBS,
  MAX_TIME,
  MEAL_HOURS,
  RENT_COST,
  RENT_INTERVAL,
  STARTING_MONEY,
  STARVATION_TIME_PENALTY,
  TRAVEL_COST,
  TUITION_COST,
  WIN_JOB_ID,
  WIN_MONEY,
} from '@/lib/constants';

const ENTRY_JOB = JOBS[0];
const WIN_JOB = JOBS.find((j) => j.id === WIN_JOB_ID)!;

const store = () => useGameStore.getState();
const setState = (patch: Partial<GameState>) => useGameStore.setState(patch);

beforeEach(() => {
  useGameStore.setState(useGameStore.getInitialState(), true);
});

describe('initial state', () => {
  it('starts a fresh game at the apartment with a full week', () => {
    expect(store()).toMatchObject({
      gameStatus: 'playing',
      money: STARTING_MONEY,
      currentWeek: 1,
      timeRemaining: MAX_TIME,
      educationLevel: 0,
      hasEaten: false,
      isStarving: false,
      currentLocationId: 'apt',
    });
  });
});

describe('movePlayer', () => {
  it('moves and spends travel time', () => {
    store().movePlayer('burger');
    expect(store().currentLocationId).toBe('burger');
    expect(store().timeRemaining).toBe(MAX_TIME - TRAVEL_COST);
  });

  it('does nothing when already at the target', () => {
    store().movePlayer('apt');
    expect(store().timeRemaining).toBe(MAX_TIME);
    expect(store().lastEvent).toBeNull();
  });

  it('refuses to travel without enough time', () => {
    setState({ timeRemaining: 0 });
    store().movePlayer('burger');
    expect(store().currentLocationId).toBe('apt');
    expect(store().lastEvent).toBe('Not enough time to travel!');
  });

  it('ignores unknown locations', () => {
    store().movePlayer('moon');
    expect(store().currentLocationId).toBe('apt');
    expect(store().timeRemaining).toBe(MAX_TIME);
  });
});

describe('work', () => {
  beforeEach(() => setState({ currentLocationId: ENTRY_JOB.locationId }));

  it('pays wage times hours and spends the time', () => {
    store().work(ENTRY_JOB.id, 4);
    expect(store().money).toBe(STARTING_MONEY + ENTRY_JOB.wage * 4);
    expect(store().timeRemaining).toBe(MAX_TIME - 4);
  });

  it('refuses when there is not enough time', () => {
    setState({ timeRemaining: 3 });
    store().work(ENTRY_JOB.id, 4);
    expect(store().money).toBe(STARTING_MONEY);
    expect(store().lastEvent).toBe('Not enough time to work!');
  });

  it('ignores unknown jobs', () => {
    store().work('astronaut', 4);
    expect(store().money).toBe(STARTING_MONEY);
    expect(store().timeRemaining).toBe(MAX_TIME);
  });

  it.each([0, -4, 1.5, NaN, Infinity])(
    'rejects an invalid number of hours (%s)',
    (hours) => {
      store().work(ENTRY_JOB.id, hours);
      expect(store().money).toBe(STARTING_MONEY);
      expect(store().timeRemaining).toBe(MAX_TIME);
    },
  );

  it('refuses a job the player is not qualified for', () => {
    store().work(WIN_JOB.id, 4);
    expect(store().money).toBe(STARTING_MONEY);
    expect(store().lastEvent).toMatch(/education/i);
  });

  it('refuses to work away from the job location', () => {
    setState({ currentLocationId: 'apt' });
    store().work(ENTRY_JOB.id, 4);
    expect(store().money).toBe(STARTING_MONEY);
    expect(store().lastEvent).toMatch(/must be at/i);
  });

  it('wins when a manager reaches the money goal', () => {
    setState({ money: WIN_MONEY - WIN_JOB.wage, educationLevel: 1 });
    store().work(WIN_JOB.id, 1);
    expect(store().gameStatus).toBe('won');
  });

  it('does not win at the money goal in an entry-level job', () => {
    setState({ money: WIN_MONEY });
    store().work(ENTRY_JOB.id, 1);
    expect(store().gameStatus).toBe('playing');
  });
});

describe('eat', () => {
  beforeEach(() => setState({ currentLocationId: 'store' }));

  it('spends money and an hour to satisfy hunger', () => {
    store().eat();
    expect(store()).toMatchObject({
      money: STARTING_MONEY - FOOD_COST,
      timeRemaining: MAX_TIME - MEAL_HOURS,
      hasEaten: true,
      isStarving: false,
    });
  });

  it('refuses without enough money', () => {
    setState({ money: FOOD_COST - 1 });
    store().eat();
    expect(store().hasEaten).toBe(false);
    expect(store().lastEvent).toBe("Can't afford food or no time!");
  });

  it('refuses a second meal in the same week', () => {
    store().eat();
    store().eat();
    expect(store().money).toBe(STARTING_MONEY - FOOD_COST);
    expect(store().timeRemaining).toBe(MAX_TIME - MEAL_HOURS);
    expect(store().lastEvent).toMatch(/already/i);
  });

  it('refuses to buy food away from a store', () => {
    setState({ currentLocationId: 'apt' });
    store().eat();
    expect(store().hasEaten).toBe(false);
    expect(store().money).toBe(STARTING_MONEY);
  });
});

describe('attendClass', () => {
  beforeEach(() => setState({ currentLocationId: 'uni' }));

  it('raises education for tuition and class hours', () => {
    setState({ money: TUITION_COST });
    store().attendClass();
    expect(store()).toMatchObject({
      money: 0,
      timeRemaining: MAX_TIME - CLASS_HOURS,
      educationLevel: 1,
    });
  });

  it('refuses without enough money', () => {
    store().attendClass();
    expect(store().educationLevel).toBe(0);
    expect(store().lastEvent).toBe('Need $100 and 4 hours for school.');
  });

  it('refuses away from the university', () => {
    setState({ money: TUITION_COST, currentLocationId: 'apt' });
    store().attendClass();
    expect(store().educationLevel).toBe(0);
    expect(store().money).toBe(TUITION_COST);
  });
});

describe('endTurn', () => {
  it('advances the week and restores time', () => {
    setState({ timeRemaining: 2 });
    store().endTurn();
    expect(store().currentWeek).toBe(2);
    expect(store().timeRemaining).toBeLessThanOrEqual(MAX_TIME);
  });

  it('penalises time the week after going hungry', () => {
    store().endTurn();
    expect(store().isStarving).toBe(true);
    expect(store().timeRemaining).toBe(MAX_TIME - STARVATION_TIME_PENALTY);
  });

  it('gives a full week after eating', () => {
    setState({ currentLocationId: 'store' });
    store().eat();
    store().endTurn();
    expect(store().isStarving).toBe(false);
    expect(store().hasEaten).toBe(false);
    expect(store().timeRemaining).toBe(MAX_TIME);
  });

  it('charges rent every RENT_INTERVAL weeks', () => {
    setState({ currentWeek: RENT_INTERVAL, money: 300 });
    store().endTurn();
    expect(store().money).toBe(300 - RENT_COST);
  });

  it('does not charge rent in other weeks', () => {
    setState({ currentWeek: RENT_INTERVAL - 1, money: 300 });
    store().endTurn();
    expect(store().money).toBe(300);
  });

  it('loses the game when rent cannot be paid', () => {
    setState({ currentWeek: RENT_INTERVAL, money: RENT_COST - 1 });
    store().endTurn();
    expect(store().gameStatus).toBe('lost');
  });
});

describe('after the game has ended', () => {
  it.each(['won', 'lost'] as const)(
    'ignores every action once the game is %s',
    (gameStatus) => {
      setState({
        gameStatus,
        currentLocationId: 'burger',
        money: 500,
        educationLevel: 1,
      });
      const before = { ...store() };

      store().movePlayer('store');
      store().work(ENTRY_JOB.id, 4);
      store().eat();
      store().attendClass();
      store().endTurn();

      expect(store()).toMatchObject({
        gameStatus,
        money: before.money,
        timeRemaining: before.timeRemaining,
        currentWeek: before.currentWeek,
        currentLocationId: before.currentLocationId,
      });
    },
  );

  it('can still be reset', () => {
    setState({ gameStatus: 'lost' });
    store().resetGame();
    expect(store().gameStatus).toBe('playing');
  });
});

describe('events', () => {
  it('gives repeated identical messages a new sequence number', () => {
    setState({ currentLocationId: ENTRY_JOB.locationId });
    store().work(ENTRY_JOB.id, 1);
    const first = store().eventSeq;
    store().work(ENTRY_JOB.id, 1);
    expect(store().lastEvent).toMatch(/Worked 1 hrs/);
    expect(store().eventSeq).toBeGreaterThan(first);
  });
});

describe('resetGame', () => {
  it('restores the starting state', () => {
    setState({ currentLocationId: ENTRY_JOB.locationId });
    store().work(ENTRY_JOB.id, 4);
    store().resetGame();
    expect(store()).toMatchObject({
      money: STARTING_MONEY,
      timeRemaining: MAX_TIME,
    });
  });
});

describe('persistence', () => {
  const persisted = () =>
    JSON.parse(localStorage.getItem('jones-mvp-storage') ?? '{}');

  it('saves game state but not transient event data', () => {
    setState({ currentLocationId: ENTRY_JOB.locationId });
    store().work(ENTRY_JOB.id, 4);
    const { state } = persisted();
    expect(state.money).toBe(STARTING_MONEY + ENTRY_JOB.wage * 4);
    expect(state).not.toHaveProperty('lastEvent');
    expect(state).not.toHaveProperty('eventSeq');
  });

  it('is versioned so saved games can be migrated', () => {
    store().movePlayer('burger');
    expect(persisted().version).toBe(1);
  });

  it('migrates a version 0 save by dropping the removed job field', async () => {
    const { migrate } = useGameStore.persist.getOptions();
    const legacy = {
      money: 99,
      currentWeek: 3,
      currentJobId: 'janitor',
    };
    const migrated = (await migrate?.(legacy, 0)) as Record<string, unknown>;
    expect(migrated).toMatchObject({ money: 99, currentWeek: 3 });
    expect(migrated).not.toHaveProperty('currentJobId');
  });

  it('does not touch localStorage until rehydrated', () => {
    expect(useGameStore.persist.getOptions().skipHydration).toBe(true);
  });
});
