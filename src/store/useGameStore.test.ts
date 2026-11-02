import { beforeEach, describe, expect, it } from 'vitest';
import { createGameStore, useGameStore } from './useGameStore';
import { defaultPack } from '@/data';
import { createRandom } from '@/lib/random';
import { WEEKEND_EFFECTS } from '@/lib/weekend';
import { walkingCostHours, walkingSteps } from '@/lib/board';
import type { DataPack, GameState, Player } from '@/types';
import {
  CLASS_HOURS,
  FOOD_COST,
  MAX_TIME,
  MEAL_HOURS,
  RENT_COST,
  RENT_INTERVAL,
  STARTING_MONEY,
  STARVATION_TIME_PENALTY,
  TUITION_COST,
  WIN_JOB_ID,
  WIN_MONEY,
} from '@/lib/constants';

const HOME = defaultPack.homeLocationId;
const ENTRY_JOB = defaultPack.jobs[0];
const WIN_JOB = defaultPack.jobs.find((j) => j.id === WIN_JOB_ID)!;
const WORK = ENTRY_JOB.locationId;
const EMPLOYMENT = 'employment-office';
const STORE = 'z-mart';
const UNI = 'hi-tech-u';

const store = () => useGameStore.getState();
const player = () => store().players[store().turnIndex];
const setState = (patch: Partial<GameState>) => useGameStore.setState(patch);
// Changes the active Player, the way every rule reads it.
const setPlayer = (patch: Partial<Player>) =>
  useGameStore.setState((s) => ({
    players: s.players.map((p, i) =>
      i === s.turnIndex ? { ...p, ...patch } : p,
    ),
  }));
// Gives the active Player the job, as if hired.
const employ = (jobId: string | null) => setPlayer({ jobId });
const hoursFor = (from: string, to: string) =>
  walkingCostHours(
    defaultPack.walkingCosts,
    walkingSteps(defaultPack.layout, from, to)!,
    MAX_TIME,
  );

beforeEach(() => {
  useGameStore.setState(useGameStore.getInitialState(), true);
});

describe('initial state', () => {
  it('starts a fresh game at home with a full week', () => {
    expect(store()).toMatchObject({
      gameStatus: 'playing',
      currentWeek: 1,
      turnIndex: 0,
    });
    expect(player()).toMatchObject({
      money: STARTING_MONEY,
      timeRemaining: MAX_TIME,
      educationLevel: 0,
      hasEaten: false,
      isStarving: false,
      locationId: HOME,
    });
  });

  it('holds a list of Players and reads the active one by Turn index', () => {
    expect(store().players).toHaveLength(1);
    const second: Player = { ...player(), id: 'p2', name: 'Second', money: 7 };
    setState({ players: [player(), second], turnIndex: 1 });
    store().walkTo(WORK);
    // The walk changed the active Player only.
    expect(store().players[1].locationId).toBe(WORK);
    expect(store().players[1].money).toBe(7);
    expect(store().players[0].locationId).toBe(HOME);
    expect(store().players[0].timeRemaining).toBe(MAX_TIME);
  });
});

describe('walkTo', () => {
  it('walks to an open Location and spends the table cost for the Steps', () => {
    store().walkTo('z-mart'); // two Steps from home
    expect(player().locationId).toBe('z-mart');
    expect(player().timeRemaining).toBeCloseTo(
      MAX_TIME - hoursFor(HOME, 'z-mart'),
      5,
    );
    expect(hoursFor(HOME, 'z-mart')).toBeCloseTo(0.66, 3);
  });

  it('walks the shorter way: a far Location is not far in Time', () => {
    store().walkTo('hi-tech-u'); // 7 Steps either way is the shorter of 7 and 9
    expect(walkingSteps(defaultPack.layout, HOME, 'hi-tech-u')).toBe(7);
    expect(player().timeRemaining).toBeCloseTo(
      MAX_TIME - hoursFor(HOME, 'hi-tech-u'),
      5,
    );
    expect(player().timeRemaining).toBeCloseTo(MAX_TIME - 1.392, 5);
  });

  it('does nothing when already at the target', () => {
    store().walkTo(HOME);
    expect(player().timeRemaining).toBe(MAX_TIME);
    expect(store().lastEvent).toBeNull();
  });

  it('refuses a closed Location', () => {
    store().walkTo('bank');
    expect(player().locationId).toBe(HOME);
    expect(player().timeRemaining).toBe(MAX_TIME);
    expect(store().lastEvent).toMatch(/closed/i);
  });

  it('ignores unknown Locations and the Clock', () => {
    store().walkTo('moon');
    store().walkTo('clock');
    expect(player().locationId).toBe(HOME);
    expect(player().timeRemaining).toBe(MAX_TIME);
  });

  it('starts an overrunning walk, ends the Week at once and sends the Player home', () => {
    store().walkTo(WORK);
    setPlayer({ timeRemaining: 0.3, hasEaten: true });
    store().walkTo(STORE); // costs more than 0.3 hours
    expect(player().locationId).toBe(HOME);
    expect(player().timeRemaining).toBe(MAX_TIME);
    expect(store().currentWeek).toBe(2);
    expect(store().lastEvent).toMatch(/ran out of time/i);
  });

  it('applies the weekly effects when a walk overruns', () => {
    setState({ currentWeek: RENT_INTERVAL });
    setPlayer({ timeRemaining: 0.1, money: 300 });
    store().walkTo(STORE);
    expect(player().money).toBe(300 - RENT_COST);
    expect(player().isStarving).toBe(true);
    expect(player().timeRemaining).toBe(MAX_TIME - STARVATION_TIME_PENALTY);
  });

  it('can lose the game when an overrun walk triggers unpaid rent', () => {
    setState({ currentWeek: RENT_INTERVAL });
    setPlayer({ timeRemaining: 0.1, money: 0 });
    store().walkTo(STORE);
    expect(store().gameStatus).toBe('lost');
  });

  it('succeeds with exactly enough Time, then the Week ends because Time ran out', () => {
    setPlayer({ timeRemaining: hoursFor(HOME, STORE), hasEaten: true });
    store().walkTo(STORE);
    expect(store().currentWeek).toBe(2);
    expect(store().weekendReport).toMatchObject({ week: 1, reason: 'time' });
    expect(player().locationId).toBe(HOME);
    expect(player().timeRemaining).toBe(MAX_TIME);
  });
});

describe('data pack separation', () => {
  // An invented pack: nothing here exists in the shipped data.
  const inventedPack: DataPack = {
    locations: [
      { id: 'cabin', name: 'Cabin', type: 'housing', description: 'Home.' },
      { id: 'mine', name: 'Mine', type: 'work', description: 'Dig.' },
      { id: 'shop', name: 'Shop', type: 'store', description: 'Buy.' },
      { id: 'hall', name: 'Hall', type: 'employment', description: 'Hire.' },
      {
        id: 'vault',
        name: 'Vault',
        type: 'other',
        description: '',
        closed: true,
      },
    ],
    jobs: [
      {
        id: 'digger',
        title: 'Digger',
        wage: 10,
        locationId: 'mine',
        educationRequired: 0,
        shiftHours: 5,
        workTimeHours: 2,
      },
    ],
    layout: {
      size: 3,
      cells: [
        { row: 0, col: 0, content: { kind: 'location', locationId: 'cabin' } },
        { row: 0, col: 1, content: { kind: 'location', locationId: 'mine' } },
        { row: 0, col: 2, content: { kind: 'location', locationId: 'shop' } },
        { row: 1, col: 2, content: { kind: 'blank' } },
        { row: 2, col: 2, content: { kind: 'clock' } },
        { row: 2, col: 1, content: { kind: 'location', locationId: 'vault' } },
        { row: 2, col: 0, content: { kind: 'location', locationId: 'hall' } },
        { row: 1, col: 0, content: { kind: 'blank' } },
      ],
      centre: { row: 1, col: 1, rowSpan: 1, colSpan: 1 },
    },
    walkingCosts: { 1: 10 },
    homeLocationId: 'cabin',
  };
  const inventedStore = () =>
    createGameStore({ pack: inventedPack, random: createRandom(1) });

  it('plays a walk, a hire and a work shift with no rules change', () => {
    const game = inventedStore();
    const active = () => game.getState().players[0];
    expect(active().locationId).toBe('cabin');

    game.getState().walkTo('hall'); // two Steps the short way round
    expect(active().locationId).toBe('hall');
    game.getState().hire('digger');
    expect(active().jobId).toBe('digger');

    game.getState().walkTo('mine');
    expect(active().locationId).toBe('mine');
    const before = active().timeRemaining;

    // The invented job's own numbers apply: $10 x 5 hours, 2 hours of Time.
    game.getState().work();
    expect(active().money).toBe(STARTING_MONEY + 50);
    expect(active().timeRemaining).toBeCloseTo(before - 2, 5);
    expect(game.getState().lastEvent).toMatch(/Digger/);

    game.getState().walkTo('shop'); // one more Step
    expect(active().locationId).toBe('shop');
    game.getState().eat();
    expect(active().hasEaten).toBe(true);
  });

  it('treats the invented closed Location as closed', () => {
    const game = inventedStore();
    game.getState().walkTo('vault');
    expect(game.getState().players[0].locationId).toBe('cabin');
  });

  it('fails to build a store from an invalid pack with a readable message', () => {
    expect(() =>
      createGameStore({ pack: { ...inventedPack, homeLocationId: 'moon' } }),
    ).toThrow(
      /Invalid data pack:[\s\S]*Home Location "moon" is not a Location/,
    );
  });
});

describe('hire', () => {
  beforeEach(() => setPlayer({ locationId: EMPLOYMENT }));

  it('hires the Player as a Cook with no requirement, at no cost in Time', () => {
    expect(player().jobId).toBeNull();
    store().hire(ENTRY_JOB.id);
    expect(player().jobId).toBe(ENTRY_JOB.id);
    expect(player().timeRemaining).toBe(MAX_TIME);
    expect(player().money).toBe(STARTING_MONEY);
    expect(store().lastEvent).toMatch(/Hired as Cook/);
  });

  it('refuses away from an employment Location', () => {
    setPlayer({ locationId: WORK });
    store().hire(ENTRY_JOB.id);
    expect(player().jobId).toBeNull();
    expect(store().lastEvent).toMatch(/employment office/i);
  });

  it('refuses a job the Player is not qualified for', () => {
    store().hire(WIN_JOB.id);
    expect(player().jobId).toBeNull();
    expect(store().lastEvent).toMatch(/education/i);
  });

  it('hires into a better job once qualified', () => {
    store().hire(ENTRY_JOB.id);
    setPlayer({ educationLevel: WIN_JOB.educationRequired });
    store().hire(WIN_JOB.id);
    expect(player().jobId).toBe(WIN_JOB.id);
  });

  it('says so when the Player already has the job', () => {
    store().hire(ENTRY_JOB.id);
    const seq = store().eventSeq;
    store().hire(ENTRY_JOB.id);
    expect(store().lastEvent).toMatch(/already/i);
    expect(store().eventSeq).toBeGreaterThan(seq);
  });

  it('ignores unknown jobs', () => {
    store().hire('astronaut');
    expect(player().jobId).toBeNull();
  });
});

describe('work', () => {
  beforeEach(() => {
    setPlayer({ locationId: ENTRY_JOB.locationId });
    employ(ENTRY_JOB.id);
  });

  it('pays the hourly wage times a shift and spends the job Time cost (AC-011)', () => {
    // DEC-022, DEC-026: $4/hr x 8 hours = $32 for 1.2 of 12 hours.
    expect(ENTRY_JOB).toMatchObject({
      wage: 4,
      shiftHours: 8,
      workTimeHours: 1.2,
    });
    store().work();
    expect(player().money).toBe(STARTING_MONEY + 32);
    expect(player().timeRemaining).toBe(MAX_TIME - 1.2);
    expect(store().lastEvent).toMatch(/Earned \$32/);
  });

  it('can be repeated: ten shifts use the whole Week and end it', () => {
    for (let i = 0; i < 9; i++) store().work();
    expect(player().money).toBe(STARTING_MONEY + 9 * 32);
    expect(player().timeRemaining).toBeCloseTo(1.2, 5);
    expect(store().currentWeek).toBe(1);

    store().work();
    expect(player().money).toBe(STARTING_MONEY + 10 * 32);
    expect(store().currentWeek).toBe(2);
    expect(store().weekendReport?.reason).toBe('time');
    expect(player().locationId).toBe(HOME);
    expect(player().timeRemaining).toBeLessThan(MAX_TIME); // hungry
  });

  it('refuses without a job', () => {
    employ(null);
    store().work();
    expect(player().money).toBe(STARTING_MONEY);
    expect(player().timeRemaining).toBe(MAX_TIME);
    expect(store().lastEvent).toMatch(/no job/i);
  });

  it('refuses a job the pack no longer has', () => {
    employ('astronaut');
    store().work();
    expect(player().money).toBe(STARTING_MONEY);
    expect(store().lastEvent).toMatch(/no job/i);
  });

  it('refuses to work away from the job location', () => {
    setPlayer({ locationId: HOME });
    store().work();
    expect(player().money).toBe(STARTING_MONEY);
    expect(player().timeRemaining).toBe(MAX_TIME);
    expect(store().lastEvent).toMatch(/must be at Monolith Burger/i);
  });

  it('refuses when there is not enough Time and changes nothing', () => {
    setPlayer({ timeRemaining: ENTRY_JOB.workTimeHours - 0.1 });
    store().work();
    expect(player().money).toBe(STARTING_MONEY);
    expect(player().timeRemaining).toBe(ENTRY_JOB.workTimeHours - 0.1);
    expect(store().currentWeek).toBe(1);
    expect(store().lastEvent).toBe('Not enough time to work!');
  });

  it('wins when a manager reaches the money goal', () => {
    employ(WIN_JOB.id);
    setPlayer({ money: WIN_MONEY - WIN_JOB.wage * WIN_JOB.shiftHours });
    store().work();
    expect(store().gameStatus).toBe('won');
  });

  it('does not win at the money goal in an entry-level job', () => {
    setPlayer({ money: WIN_MONEY });
    store().work();
    expect(store().gameStatus).toBe('playing');
  });
});

describe('the Week ends (AC-004)', () => {
  const report = () => store().weekendReport!;
  const text = (id: string) => report().effects.find((e) => e.id === id)!.text;

  it('lists every effect in the fixed order, with a slot for each later one', () => {
    store().endTurn();
    expect(report().effects.map((e) => e.id)).toEqual(
      WEEKEND_EFFECTS.map((e) => e.id),
    );
    expect(WEEKEND_EFFECTS.map((e) => e.id)).toEqual([
      'food',
      'clothing',
      'rent',
      'inflation',
      'newspaper',
    ]);
  });

  it('fills the slots of effects that exist and leaves the rest empty', () => {
    store().endTurn(); // Week 1: hungry, no rent due
    expect(text('food')).toMatch(/starving/i);
    expect(text('rent')).toBeNull();
    expect(text('clothing')).toBeNull();
    expect(text('inflation')).toBeNull();
    expect(text('newspaper')).toBeNull();
  });

  it('puts rent in its own slot in a rent Week', () => {
    setState({ currentWeek: RENT_INTERVAL });
    setPlayer({ money: 300, hasEaten: true });
    store().endTurn();
    expect(text('rent')).toMatch(new RegExp(`${RENT_COST}`));
    expect(text('food')).toBeNull();
    expect(report().cash).toBe(300 - RENT_COST);
  });

  it('reports the Week that ended, why, and the cash after the effects', () => {
    store().endTurn();
    expect(report()).toMatchObject({
      week: 1,
      reason: 'ended',
      cash: STARTING_MONEY,
    });
    expect(store().currentWeek).toBe(2);
  });

  it('starts the next Turn at home with full Time, wherever the Player was', () => {
    setPlayer({ locationId: WORK, timeRemaining: 3, hasEaten: true });
    store().endTurn();
    expect(player().locationId).toBe(HOME);
    expect(player().timeRemaining).toBe(MAX_TIME);
  });

  it('takes the hunger penalty off the next Turn after a Week without food', () => {
    setPlayer({ locationId: WORK });
    store().endTurn();
    expect(player().locationId).toBe(HOME);
    expect(player().timeRemaining).toBe(MAX_TIME - STARVATION_TIME_PENALTY);
  });

  it('ends the Week by itself when an action uses the last of the Time', () => {
    setPlayer({
      locationId: WORK,
      jobId: ENTRY_JOB.id,
      timeRemaining: ENTRY_JOB.workTimeHours,
      hasEaten: true,
    });
    store().work();
    expect(report()).toMatchObject({ week: 1, reason: 'time' });
    expect(player().money).toBe(STARTING_MONEY + 32);
    expect(player().locationId).toBe(HOME);
    expect(player().timeRemaining).toBe(MAX_TIME);
    expect(store().lastEvent).toMatch(/Earned \$32/);
  });

  it('reports an overrunning walk as ending on the road', () => {
    setPlayer({ timeRemaining: 0.1, hasEaten: true });
    store().walkTo(STORE);
    expect(report().reason).toBe('road');
  });

  it('is cleared when read and when the game is reset', () => {
    store().endTurn();
    store().dismissWeekendReport();
    expect(store().weekendReport).toBeNull();
    store().endTurn();
    store().resetGame();
    expect(store().weekendReport).toBeNull();
  });

  it('keeps the money the Player earned: walk, earn, end Weeks, money grows', () => {
    for (let week = 1; week <= 3; week++) {
      store().walkTo(EMPLOYMENT);
      store().hire(ENTRY_JOB.id);
      store().walkTo(WORK);
      store().work();
      store().endTurn();
    }
    expect(player().money).toBe(STARTING_MONEY + 3 * 32);
    expect(store().currentWeek).toBe(4);
  });
});

describe('eat', () => {
  beforeEach(() => setPlayer({ locationId: STORE }));

  it('spends money and an hour to satisfy hunger', () => {
    store().eat();
    expect(player()).toMatchObject({
      money: STARTING_MONEY - FOOD_COST,
      timeRemaining: MAX_TIME - MEAL_HOURS,
      hasEaten: true,
      isStarving: false,
    });
  });

  it('refuses without enough money', () => {
    setPlayer({ money: FOOD_COST - 1 });
    store().eat();
    expect(player().hasEaten).toBe(false);
    expect(store().lastEvent).toBe("Can't afford food or no time!");
  });

  it('refuses a second meal in the same week', () => {
    store().eat();
    store().eat();
    expect(player().money).toBe(STARTING_MONEY - FOOD_COST);
    expect(player().timeRemaining).toBe(MAX_TIME - MEAL_HOURS);
    expect(store().lastEvent).toMatch(/already/i);
  });

  it('refuses to buy food away from a store', () => {
    setPlayer({ locationId: HOME });
    store().eat();
    expect(player().hasEaten).toBe(false);
    expect(player().money).toBe(STARTING_MONEY);
  });
});

describe('attendClass', () => {
  beforeEach(() => setPlayer({ locationId: UNI }));

  it('raises education for tuition and class hours', () => {
    setPlayer({ money: TUITION_COST });
    store().attendClass();
    expect(player()).toMatchObject({
      money: 0,
      timeRemaining: MAX_TIME - CLASS_HOURS,
      educationLevel: 1,
    });
  });

  it('refuses without enough money', () => {
    store().attendClass();
    expect(player().educationLevel).toBe(0);
    expect(store().lastEvent).toBe('Need $100 and 4 hours for school.');
  });

  it('refuses away from the university', () => {
    setPlayer({ money: TUITION_COST, locationId: HOME });
    store().attendClass();
    expect(player().educationLevel).toBe(0);
    expect(player().money).toBe(TUITION_COST);
  });
});

describe('endTurn', () => {
  it('advances the week and restores time', () => {
    setPlayer({ timeRemaining: 2 });
    store().endTurn();
    expect(store().currentWeek).toBe(2);
    expect(player().timeRemaining).toBeLessThanOrEqual(MAX_TIME);
  });

  it('penalises time the week after going hungry', () => {
    store().endTurn();
    expect(player().isStarving).toBe(true);
    expect(player().timeRemaining).toBe(MAX_TIME - STARVATION_TIME_PENALTY);
  });

  it('gives a full week after eating', () => {
    setPlayer({ locationId: STORE });
    store().eat();
    store().endTurn();
    expect(player().isStarving).toBe(false);
    expect(player().hasEaten).toBe(false);
    expect(player().timeRemaining).toBe(MAX_TIME);
  });

  it('charges rent every RENT_INTERVAL weeks', () => {
    setState({ currentWeek: RENT_INTERVAL });
    setPlayer({ money: 300 });
    store().endTurn();
    expect(player().money).toBe(300 - RENT_COST);
  });

  it('does not charge rent in other weeks', () => {
    setState({ currentWeek: RENT_INTERVAL - 1 });
    setPlayer({ money: 300 });
    store().endTurn();
    expect(player().money).toBe(300);
  });

  it('loses the game when rent cannot be paid', () => {
    setState({ currentWeek: RENT_INTERVAL });
    setPlayer({ money: RENT_COST - 1 });
    store().endTurn();
    expect(store().gameStatus).toBe('lost');
  });
});

describe('after the game has ended', () => {
  it.each(['won', 'lost'] as const)(
    'ignores every action once the game is %s',
    (gameStatus) => {
      setState({ gameStatus });
      setPlayer({ locationId: WORK, money: 500, educationLevel: 1 });
      const before = { ...player(), currentWeek: store().currentWeek };

      store().walkTo(STORE);
      store().hire(ENTRY_JOB.id);
      store().work();
      store().eat();
      store().attendClass();
      store().endTurn();

      expect(store().gameStatus).toBe(gameStatus);
      expect(store().currentWeek).toBe(before.currentWeek);
      expect(player()).toMatchObject({
        money: before.money,
        timeRemaining: before.timeRemaining,
        locationId: before.locationId,
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
    setPlayer({ locationId: ENTRY_JOB.locationId, jobId: ENTRY_JOB.id });
    store().work();
    const first = store().eventSeq;
    store().work();
    expect(store().lastEvent).toMatch(/Worked a 8-hour shift/);
    expect(store().eventSeq).toBeGreaterThan(first);
  });
});

describe('resetGame', () => {
  it('restores the starting state', () => {
    setPlayer({ locationId: ENTRY_JOB.locationId, jobId: ENTRY_JOB.id });
    store().work();
    store().resetGame();
    expect(player()).toMatchObject({
      money: STARTING_MONEY,
      timeRemaining: MAX_TIME,
      jobId: null,
    });
  });
});

describe('persistence', () => {
  const persisted = () =>
    JSON.parse(localStorage.getItem('jones-mvp-storage') ?? '{}');

  it('saves game state but not transient event data', () => {
    setPlayer({ locationId: ENTRY_JOB.locationId, jobId: ENTRY_JOB.id });
    store().work();
    const { state } = persisted();
    expect(state.players[0]).toMatchObject({
      money: STARTING_MONEY + ENTRY_JOB.wage * ENTRY_JOB.shiftHours,
      jobId: ENTRY_JOB.id,
    });
    expect(state.turnIndex).toBe(0);
    expect(state).not.toHaveProperty('lastEvent');
    expect(state).not.toHaveProperty('eventSeq');
  });

  it('is versioned so saved games can be migrated', () => {
    store().walkTo(WORK);
    expect(persisted().version).toBe(3);
  });

  it('migrates a version 0 save: drops the removed job field and moves the Player stats into the list', async () => {
    const { migrate } = useGameStore.persist.getOptions();
    const legacy = {
      money: 99,
      currentWeek: 3,
      currentJobId: 'janitor',
      currentLocationId: 'burger',
    };
    const migrated = (await migrate?.(legacy, 0)) as Record<string, unknown>;
    expect(migrated).toMatchObject({ currentWeek: 3, turnIndex: 0 });
    expect(migrated).not.toHaveProperty('currentJobId');
    expect(migrated).not.toHaveProperty('money');
    expect((migrated.players as Player[])[0]).toMatchObject({
      money: 99,
      locationId: WORK,
      jobId: null,
    });
  });

  it('saves a pending weekend report', () => {
    store().endTurn();
    expect(persisted().state.weekendReport).toMatchObject({ week: 1 });
  });

  it('migrates a version 2 save: the Player has no job and no report is pending', async () => {
    const { migrate } = useGameStore.persist.getOptions();
    const old = { ...player(), money: 77 } as Partial<Player>;
    delete old.jobId;
    const migrated = (await migrate?.(
      { currentWeek: 5, players: [old], turnIndex: 0 },
      2,
    )) as { players: Player[]; currentWeek: number };
    expect(migrated.currentWeek).toBe(5);
    expect(migrated.players[0]).toMatchObject({ money: 77, jobId: null });
  });

  it('migrates a version 1 save at an unknown place to home', async () => {
    const { migrate } = useGameStore.persist.getOptions();
    const migrated = (await migrate?.(
      { money: 5, currentLocationId: 'nowhere' },
      1,
    )) as { players: Player[] };
    expect(migrated.players[0]).toMatchObject({ money: 5, locationId: HOME });
  });

  it('does not touch localStorage until rehydrated', () => {
    expect(useGameStore.persist.getOptions().skipHydration).toBe(true);
  });
});
