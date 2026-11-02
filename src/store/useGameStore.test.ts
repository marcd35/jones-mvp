import { beforeEach, describe, expect, it } from 'vitest';
import { useGameStore } from './useGameStore';
import {
  FOOD_COST,
  MAX_TIME,
  RENT_COST,
  RENT_INTERVAL,
  TRAVEL_COST,
  TUITION_COST,
  WIN_MONEY,
} from '@/lib/constants';

const store = () => useGameStore.getState();
const setState = (patch: Parameters<typeof useGameStore.setState>[0]) =>
  useGameStore.setState(patch);

beforeEach(() => {
  useGameStore.setState(useGameStore.getInitialState(), true);
});

describe('initial state', () => {
  it('starts a fresh game at the apartment with a full week', () => {
    expect(store()).toMatchObject({
      gameStatus: 'playing',
      money: 60,
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
});

describe('work', () => {
  it('pays wage times hours and spends the time', () => {
    store().work('janitor', 4);
    expect(store().money).toBe(60 + 6 * 4);
    expect(store().timeRemaining).toBe(MAX_TIME - 4);
  });

  it('refuses when there is not enough time', () => {
    setState({ timeRemaining: 3 });
    store().work('janitor', 4);
    expect(store().money).toBe(60);
    expect(store().lastEvent).toBe('Not enough time to work!');
  });

  it('ignores unknown jobs', () => {
    store().work('astronaut', 4);
    expect(store().money).toBe(60);
    expect(store().timeRemaining).toBe(MAX_TIME);
  });

  it('wins when a manager reaches the money goal', () => {
    setState({ money: WIN_MONEY - 15, educationLevel: 1 });
    store().work('manager', 1);
    expect(store().gameStatus).toBe('won');
  });

  it('does not win at the money goal in an entry-level job', () => {
    setState({ money: WIN_MONEY });
    store().work('janitor', 1);
    expect(store().gameStatus).toBe('playing');
  });
});

describe('eat', () => {
  it('spends money and an hour to satisfy hunger', () => {
    store().eat();
    expect(store()).toMatchObject({
      money: 60 - FOOD_COST,
      timeRemaining: MAX_TIME - 1,
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
});

describe('attendClass', () => {
  it('raises education for tuition and four hours', () => {
    setState({ money: TUITION_COST });
    store().attendClass();
    expect(store()).toMatchObject({
      money: 0,
      timeRemaining: MAX_TIME - 4,
      educationLevel: 1,
    });
  });

  it('refuses without enough money', () => {
    store().attendClass();
    expect(store().educationLevel).toBe(0);
    expect(store().lastEvent).toBe('Need $100 and 4 hours for school.');
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
    expect(store().timeRemaining).toBe(MAX_TIME - 4);
  });

  it('gives a full week after eating', () => {
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

describe('resetGame', () => {
  it('restores the starting state', () => {
    store().work('janitor', 4);
    store().resetGame();
    expect(store()).toMatchObject({ money: 60, timeRemaining: MAX_TIME });
  });
});

describe('persistence', () => {
  it('saves game state but not the transient event message', () => {
    store().work('janitor', 4);
    const saved = JSON.parse(
      localStorage.getItem('jones-mvp-storage') ?? '{}',
    ).state;
    expect(saved.money).toBe(84);
    expect(saved).not.toHaveProperty('lastEvent');
  });
});
