import { beforeEach, describe, expect, it } from 'vitest';
import { createGameStore, useGameStore } from './useGameStore';
import { defaultPack } from '@/data';
import { createRandom } from '@/lib/random';
import { scalePrice } from '@/lib/inflation';
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
  STARVATION_TIME_PENALTY,
  TUITION_COST,
} from '@/lib/constants';

const HOME = defaultPack.homeLocationId;
const ENTRY_JOB = defaultPack.jobs[0];
// The job above the entry one: it asks for education.
const BETTER_JOB = defaultPack.jobs.find((j) => j.educationRequired > 0)!;
const STARTING_MONEY = defaultPack.startingMoney;
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

// Every game starts on the setup screen; most tests play from the first Turn.
beforeEach(() => {
  useGameStore.setState(useGameStore.getInitialState(), true);
  store().startGame();
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
  startingMoney: 15,
  goalPointsBudget: 90,
  goals: [
    {
      id: 'wealth',
      label: 'Riches',
      defaultPoints: 30,
      perPoint: 2,
      prefix: '',
      suffix: ' coins',
    },
    {
      id: 'happiness',
      label: 'Joy',
      defaultPoints: 20,
      perPoint: 1,
      prefix: '',
      suffix: '',
    },
    {
      id: 'education',
      label: 'Lore',
      defaultPoints: 20,
      perPoint: 1,
      prefix: '',
      suffix: '',
    },
    {
      id: 'career',
      label: 'Rank',
      defaultPoints: 20,
      perPoint: 1,
      prefix: '',
      suffix: '',
    },
  ],
  rentOwedLimit: 40,
  // An invented rule: the level rises a quarter each Week.
  inflation: {
    startLevel: 1,
    nextLevel: ({ week }) => 1 + (week - 1) * 0.25,
    notableMoves: [{ minMove: 0.2, up: 'Gold rush!', down: 'Gold slump!' }],
  },
};
const inventedStore = () => {
  const game = createGameStore({
    pack: inventedPack,
    random: createRandom(1),
  });
  game.getState().startGame();
  return game;
};

describe('data pack separation', () => {
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
    expect(active().money).toBe(inventedPack.startingMoney + 50);
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
    store().hire(BETTER_JOB.id);
    expect(player().jobId).toBeNull();
    expect(store().lastEvent).toMatch(/education/i);
  });

  it('hires into a better job once qualified', () => {
    store().hire(ENTRY_JOB.id);
    setPlayer({ educationLevel: BETTER_JOB.educationRequired });
    store().hire(BETTER_JOB.id);
    expect(player().jobId).toBe(BETTER_JOB.id);
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
    setPlayer({ money: TUITION_COST - 1 });
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

describe('Goals setup (AC-005)', () => {
  const GOALS = defaultPack.goals.map((g) => g.id);
  const BUDGET = defaultPack.goalPointsBudget;
  const total = () =>
    Object.values(player().goals).reduce((sum, p) => sum + p, 0);
  // Back to the setup screen, before the global beforeEach started the game.
  beforeEach(() => {
    useGameStore.setState(useGameStore.getInitialState(), true);
  });

  it('opens on the setup screen with the data budget and default points within it', () => {
    expect(store().gameStatus).toBe('setup');
    expect(BUDGET).toBe(200);
    expect(total()).toBeLessThanOrEqual(BUDGET);
    expect(Object.keys(player().goals).sort()).toEqual([...GOALS].sort());
  });

  it('starts the game at Low-cost housing with the starting cash from data', () => {
    store().startGame();
    expect(store().gameStatus).toBe('playing');
    expect(player()).toMatchObject({
      locationId: 'low-cost-housing',
      money: defaultPack.startingMoney,
      owedRent: 0,
    });
    expect(defaultPack.startingMoney).toBe(200);
  });

  it('sets the points on a Goal', () => {
    // The defaults use the whole budget, so free some first.
    store().setGoalPoints('happiness', 0);
    store().setGoalPoints('education', 0);
    store().setGoalPoints('wealth', 80);
    expect(player().goals.wealth).toBe(80);
  });

  it.each(GOALS)('never lets the sum pass the budget (raising %s)', (id) => {
    for (const other of GOALS) store().setGoalPoints(other, 0);
    store().setGoalPoints('wealth', 150);
    store().setGoalPoints(id, 150);
    expect(total()).toBeLessThanOrEqual(BUDGET);
    store().setGoalPoints(id, 10_000);
    expect(total()).toBe(BUDGET);
  });

  it('gives the rest of the budget to the Goal being raised, and no more', () => {
    for (const id of GOALS) store().setGoalPoints(id, 0);
    store().setGoalPoints('wealth', 120);
    store().setGoalPoints('career', 100);
    expect(player().goals).toMatchObject({ wealth: 120, career: 80 });
    // Lowering one Goal frees points for another.
    store().setGoalPoints('wealth', 20);
    store().setGoalPoints('career', 180);
    expect(player().goals).toMatchObject({ wealth: 20, career: 180 });
  });

  it('ignores negative, fractional and non-numeric points', () => {
    store().setGoalPoints('wealth', 40);
    store().setGoalPoints('wealth', -5);
    expect(player().goals.wealth).toBe(0);
    store().setGoalPoints('wealth', 40.4);
    expect(player().goals.wealth).toBe(40);
    store().setGoalPoints('wealth', NaN);
    expect(player().goals.wealth).toBe(40);
  });

  it('will not start with no Goal points at all, which would win at once', () => {
    for (const id of GOALS) store().setGoalPoints(id, 0);
    store().startGame();
    expect(store().gameStatus).toBe('setup');
    expect(store().lastEvent).toMatch(/at least one Goal point/i);
  });

  it('cannot change Goals once the game has started', () => {
    store().setGoalPoints('wealth', 10);
    store().startGame();
    store().setGoalPoints('wealth', 90);
    expect(player().goals.wealth).toBe(10);
  });

  it('allows no actions during setup', () => {
    store().walkTo(STORE);
    store().endTurn();
    expect(player().locationId).toBe(HOME);
    expect(store().currentWeek).toBe(1);
  });

  it('reads its budget from an injected pack', () => {
    const pack = {
      ...defaultPack,
      goalPointsBudget: 60,
      goals: defaultPack.goals.map((g) => ({ ...g, defaultPoints: 10 })),
    };
    const game = createGameStore({ pack });
    game.getState().setGoalPoints('wealth', 5000);
    const goals = game.getState().players[0].goals;
    expect(Object.values(goals).reduce((a, b) => a + b, 0)).toBe(60);
  });
});

describe('winning and losing (AC-006)', () => {
  const WEALTH = defaultPack.goals.find((g) => g.id === 'wealth')!;
  // Starts a game with every point on wealth and returns its target.
  const wealthOnly = (points: number) => {
    useGameStore.setState(useGameStore.getInitialState(), true);
    for (const g of defaultPack.goals) store().setGoalPoints(g.id, 0);
    store().setGoalPoints('wealth', points);
    store().startGame();
    return Math.ceil(points * WEALTH.perPoint);
  };
  const atWork = () => setPlayer({ locationId: WORK, jobId: ENTRY_JOB.id });
  const shift = ENTRY_JOB.wage * ENTRY_JOB.shiftHours;
  const LIMIT = defaultPack.rentOwedLimit;

  it('wins when a Work action brings cash to the wealth target', () => {
    const target = wealthOnly(10);
    atWork();
    setPlayer({ money: target - shift });
    store().work();
    expect(store().gameStatus).toBe('won');
    expect(player().money).toBe(target);
  });

  it('does not win one dollar short', () => {
    const target = wealthOnly(10);
    atWork();
    setPlayer({ money: target - shift - 1 });
    store().work();
    expect(store().gameStatus).toBe('playing');
  });

  it('wins in any job: the rules name no job', () => {
    const target = wealthOnly(10);
    setPlayer({
      locationId: BETTER_JOB.locationId,
      jobId: BETTER_JOB.id,
      educationLevel: BETTER_JOB.educationRequired,
      money: target - BETTER_JOB.wage * BETTER_JOB.shiftHours,
    });
    store().work();
    expect(store().gameStatus).toBe('won');
  });

  it('wins on the last Time of a Week without rolling into the next Week', () => {
    const target = wealthOnly(10);
    atWork();
    setPlayer({
      money: target - shift,
      timeRemaining: ENTRY_JOB.workTimeHours,
    });
    store().work();
    expect(store().gameStatus).toBe('won');
    expect(store().currentWeek).toBe(1);
    expect(store().weekendReport).toBeNull();
  });

  it('plays to a win: hire, walk and earn Week after Week up to a wealth Goal', () => {
    const target = wealthOnly(10);
    store().walkTo(EMPLOYMENT);
    store().hire(ENTRY_JOB.id);
    let guard = 0;
    while (store().gameStatus === 'playing' && guard++ < 1000) {
      if (player().locationId !== WORK) store().walkTo(WORK);
      else store().work();
    }
    expect(store().gameStatus).toBe('won');
    expect(player().money).toBeGreaterThanOrEqual(target);
  });

  it('counts a Goal with points but no measure yet as unmet', () => {
    const target = wealthOnly(10);
    atWork();
    useGameStore.setState((s) => ({
      players: s.players.map((p) => ({
        ...p,
        money: target,
        goals: { ...p.goals, education: 10 },
      })),
    }));
    store().work();
    // Wealth is met, but education has points and nothing measures it yet.
    expect(store().gameStatus).toBe('playing');
  });

  it('needs every Goal met: a fortune does not win with points on the unbuilt Goals', () => {
    useGameStore.setState(useGameStore.getInitialState(), true);
    store().startGame(); // the default points on all four Goals
    atWork();
    setPlayer({ money: 1_000_000 });
    store().work();
    expect(store().gameStatus).toBe('playing');
  });

  it('allows no action after a win, and a new game is still available', () => {
    const target = wealthOnly(10);
    atWork();
    setPlayer({ money: target - shift });
    store().work();
    expect(store().gameStatus).toBe('won');
    const before = JSON.stringify(player());
    store().walkTo(STORE);
    store().work();
    store().endTurn();
    store().eat();
    expect(JSON.stringify(player())).toBe(before);
    store().resetGame();
    expect(store().gameStatus).toBe('setup');
  });

  it('loses when the owed rent reaches the limit at the end of a Week', () => {
    wealthOnly(10);
    setPlayer({ owedRent: LIMIT });
    store().endTurn();
    expect(store().gameStatus).toBe('lost');
  });

  it('loses straight away when an action leaves the owed rent at the limit', () => {
    wealthOnly(10);
    atWork();
    setPlayer({ owedRent: LIMIT });
    store().work();
    expect(store().gameStatus).toBe('lost');
  });

  it('does not lose one dollar below the limit', () => {
    wealthOnly(10);
    setPlayer({ owedRent: LIMIT - 1 });
    store().endTurn();
    expect(store().gameStatus).toBe('playing');
  });

  it('loses even when the Goals are met at the same moment', () => {
    const target = wealthOnly(10);
    atWork();
    setPlayer({ money: target, owedRent: LIMIT });
    store().work();
    expect(store().gameStatus).toBe('lost');
  });

  it('allows no action after a loss', () => {
    wealthOnly(10);
    setPlayer({ owedRent: LIMIT });
    store().endTurn();
    const week = store().currentWeek;
    const before = JSON.stringify(player());
    store().walkTo(STORE);
    store().endTurn();
    expect(store().currentWeek).toBe(week);
    expect(JSON.stringify(player())).toBe(before);
  });

  it('keeps the Week the game ended in as the Weeks played', () => {
    wealthOnly(10);
    setState({ currentWeek: 5 });
    setPlayer({ owedRent: LIMIT });
    store().endTurn();
    expect(store().gameStatus).toBe('lost');
    expect(store().currentWeek).toBe(5);
  });

  it('wins and loses in an invented pack with its own targets and limit', () => {
    const game = createGameStore({ pack: inventedPack });
    const s = () => game.getState();
    for (const g of inventedPack.goals) s().setGoalPoints(g.id, 0);
    s().setGoalPoints('wealth', 20); // 20 x 2 = a target of 40; starts with 15
    s().startGame();
    s().walkTo('hall');
    s().hire('digger');
    s().walkTo('mine');
    s().work(); // +50
    expect(s().gameStatus).toBe('won');

    s().resetGame();
    for (const g of inventedPack.goals) s().setGoalPoints(g.id, 0);
    s().setGoalPoints('wealth', 20);
    s().startGame();
    game.setState((st) => ({
      players: st.players.map((p) => ({
        ...p,
        owedRent: inventedPack.rentOwedLimit,
      })),
    }));
    s().endTurn();
    expect(s().gameStatus).toBe('lost');
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

  it.each(['won', 'lost'] as const)(
    'can start a new game after %s',
    (gameStatus) => {
      setState({ gameStatus });
      store().resetGame();
      expect(store().gameStatus).toBe('setup');
    },
  );
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
    expect(persisted().version).toBe(5);
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

  it('migrates a version 3 save: Goals and owed rent are added, and a game in play goes back through setup', async () => {
    const { migrate } = useGameStore.persist.getOptions();
    const old = { ...player(), money: 88 } as Partial<Player>;
    delete old.goals;
    delete old.owedRent;
    const migrated = (await migrate?.(
      { currentWeek: 6, gameStatus: 'playing', players: [old], turnIndex: 0 },
      3,
    )) as { players: Player[]; gameStatus: string; currentWeek: number };
    expect(migrated.gameStatus).toBe('setup');
    expect(migrated.currentWeek).toBe(6);
    expect(migrated.players[0]).toMatchObject({ money: 88, owedRent: 0 });
    expect(migrated.players[0].goals).toEqual(player().goals);
  });

  it('leaves a finished game finished when migrating', async () => {
    const { migrate } = useGameStore.persist.getOptions();
    const migrated = (await migrate?.(
      { gameStatus: 'won', players: [player()], turnIndex: 0 },
      3,
    )) as { gameStatus: string };
    expect(migrated.gameStatus).toBe('won');
  });

  it('does not touch localStorage until rehydrated', () => {
    expect(useGameStore.persist.getOptions().skipHydration).toBe(true);
  });
});

describe('inflation (AC-010)', () => {
  // A game over a pack, played from the first Turn with a seeded source.
  const gameOf = (pack: DataPack, seed = 1) => {
    const game = createGameStore({ pack, random: createRandom(seed) });
    game.getState().startGame();
    return game;
  };
  // The level of each Week from Week 1 to `weeks`, ending a Week at a time.
  const levels = (pack: DataPack, seed: number, weeks: number) => {
    const game = gameOf(pack, seed);
    const seen = [game.getState().priceLevel];
    for (let w = 1; w < weeks; w++) {
      game.getState().endTurn();
      seen.push(game.getState().priceLevel);
    }
    return seen;
  };
  const { min, max } = { min: 0.83, max: 1.22 };
  const report = () => store().weekendReport!;
  const slot = (game: ReturnType<typeof gameOf>, id: string) =>
    game.getState().weekendReport!.effects.find((e) => e.id === id)!.text;

  it('starts Week 1 at the data start level, 1.00', () => {
    expect(store().priceLevel).toBe(1);
    expect(store().newspaper).toBeNull();
    expect(gameOf(inventedPack).getState().priceLevel).toBe(1);
  });

  it('keeps the level in the data range over many Weeks and many seeds', () => {
    for (let seed = 1; seed <= 20; seed++) {
      for (const level of levels(defaultPack, seed, 40).slice(1)) {
        expect(level).toBeGreaterThanOrEqual(min);
        expect(level).toBeLessThanOrEqual(max);
      }
    }
  });

  it('holds levels to two decimals', () => {
    for (const level of levels(defaultPack, 3, 30)) {
      expect(Math.round(level * 100) / 100).toBe(level);
    }
  });

  it('moves the level each Week: the sequence is not constant', () => {
    expect(new Set(levels(defaultPack, 5, 30)).size).toBeGreaterThan(10);
  });

  it('gives the same sequence for the same seed, and another for another (TEST-006)', () => {
    expect(levels(defaultPack, 42, 20)).toEqual(levels(defaultPack, 42, 20));
    expect(levels(defaultPack, 42, 20)).not.toEqual(
      levels(defaultPack, 43, 20),
    );
  });

  it('draws a new game its own seed from the random source, repeatably', () => {
    const seedOf = (seed: number) =>
      createGameStore({
        pack: defaultPack,
        random: createRandom(seed),
      }).getState().priceSeed;
    expect(seedOf(9)).toBe(seedOf(9));
    expect(seedOf(9)).not.toBe(seedOf(10));
    const game = gameOf(defaultPack, 9);
    const first = game.getState().priceSeed;
    game.getState().resetGame();
    expect(game.getState().priceSeed).not.toBe(first);
  });

  it('applies the new level to the coming Week and reports the step', () => {
    const game = gameOf(defaultPack, 8);
    const before = game.getState().priceLevel;
    game.getState().endTurn();
    const after = game.getState().priceLevel;
    const line = slot(game, 'inflation');
    expect(line).toContain(before.toFixed(2));
    expect(line).toContain(after.toFixed(2));
  });

  it('scales the price of food and tuition by the level, rounding half up to the dollar', () => {
    setState({ priceLevel: 1.1 });
    setPlayer({ money: 500, locationId: STORE });
    store().eat();
    // 15 x 1.10 = 16.50, which rounds up to 17.
    expect(player().money).toBe(500 - 17);
    setPlayer({ locationId: UNI, timeRemaining: 12 });
    store().attendClass();
    expect(player().money).toBe(500 - 17 - 110);
  });

  it('rounds to the nearest dollar, halves up, and at level 1.00 changes nothing', () => {
    expect(scalePrice(15, 1.07)).toBe(16); // 16.05
    expect(scalePrice(15, 1.03)).toBe(15); // 15.45
    expect(scalePrice(15, 1.1)).toBe(17); // 16.50
    expect(scalePrice(15, 0.83)).toBe(12); // 12.45
    expect(scalePrice(15, 1)).toBe(15);
    expect(scalePrice(100, 1.22)).toBe(122);
  });

  it('refuses a meal the scaled price puts out of reach', () => {
    setState({ priceLevel: 1.22 });
    setPlayer({ money: 16, locationId: STORE }); // $15 at 1.00, $18 at 1.22
    store().eat();
    expect(player().hasEaten).toBe(false);
    expect(player().money).toBe(16);
  });

  it('does not scale wages', () => {
    setState({ priceLevel: 1.22 });
    employ(ENTRY_JOB.id);
    setPlayer({ locationId: WORK });
    store().work();
    expect(player().money).toBe(
      STARTING_MONEY + ENTRY_JOB.wage * ENTRY_JOB.shiftHours,
    );
  });

  it('does not scale rent here: rent belongs to T-09', () => {
    setState({ currentWeek: RENT_INTERVAL, priceLevel: 1.22 });
    setPlayer({ money: 300, hasEaten: true });
    store().endTurn();
    expect(report().cash).toBe(300 - RENT_COST);
  });

  it('works with a replacement rule in an invented pack, with no rules change', () => {
    const game = gameOf(inventedPack);
    game.getState().endTurn();
    expect(game.getState().priceLevel).toBe(1.25);
    game.getState().endTurn();
    expect(game.getState().priceLevel).toBe(1.5);
    game.getState().walkTo('shop');
    game.setState((s) => ({ players: [{ ...s.players[0], money: 100 }] }));
    game.getState().eat();
    expect(game.getState().players[0].money).toBe(
      100 - scalePrice(FOOD_COST, 1.5),
    );
  });

  it('announces a notable move in the newspaper slot and keeps the headline for the Week', () => {
    const game = gameOf(inventedPack);
    game.getState().endTurn(); // 1.00 to 1.25: a rise of 0.25
    expect(slot(game, 'newspaper')).toBe('Gold rush!');
    expect(game.getState().newspaper).toBe('Gold rush!');
  });

  it('says nothing when the move is below every threshold', () => {
    const quiet: DataPack = {
      ...inventedPack,
      inflation: { ...inventedPack.inflation, nextLevel: () => 1.05 },
    };
    const game = gameOf(quiet);
    game.getState().endTurn();
    expect(game.getState().priceLevel).toBe(1.05);
    expect(slot(game, 'newspaper')).toBeNull();
    expect(game.getState().newspaper).toBeNull();
  });

  it('announces a fall and names the largest threshold met', () => {
    const rule: DataPack['inflation'] = {
      startLevel: 1,
      nextLevel: ({ week }) => (week === 2 ? 0.7 : 0.85),
      notableMoves: [
        { minMove: 0.1, up: 'up', down: 'down' },
        { minMove: 0.25, up: 'UP', down: 'DOWN' },
      ],
    };
    const game = gameOf({ ...inventedPack, inflation: rule });
    game.getState().endTurn(); // -0.30
    expect(game.getState().newspaper).toBe('DOWN');
    game.getState().endTurn(); // +0.15
    expect(game.getState().newspaper).toBe('up');
  });

  it('ignores a rule that returns nothing usable and keeps the level', () => {
    const broken: DataPack = {
      ...inventedPack,
      inflation: { ...inventedPack.inflation, nextLevel: () => NaN },
    };
    const game = gameOf(broken);
    game.getState().endTurn();
    expect(game.getState().priceLevel).toBe(1);
  });

  it('carries on the same sequence from a saved seed and level (AC-015)', () => {
    const straight = levels(defaultPack, 77, 10);
    const first = gameOf(defaultPack, 77);
    for (let w = 1; w < 4; w++) first.getState().endTurn();
    const { priceSeed, priceLevel, currentWeek } = first.getState();
    // A refresh: a new store takes the saved fields and plays on.
    const resumed = gameOf(defaultPack, 1);
    resumed.setState({ priceSeed, priceLevel, currentWeek });
    const rest: number[] = [];
    for (let w = currentWeek; w < 10; w++) {
      resumed.getState().endTurn();
      rest.push(resumed.getState().priceLevel);
    }
    expect(rest).toEqual(straight.slice(currentWeek));
  });

  it('keeps the fixed order of the effects', () => {
    store().endTurn();
    expect(report().effects.map((e) => e.id)).toEqual([
      'food',
      'clothing',
      'rent',
      'inflation',
      'newspaper',
    ]);
  });

  it('saves the seed, the level and the headline', () => {
    store().endTurn();
    const { state } = JSON.parse(
      localStorage.getItem('jones-mvp-storage') ?? '{}',
    );
    expect(state.priceSeed).toBe(store().priceSeed);
    expect(state.priceLevel).toBe(store().priceLevel);
    expect(state).toHaveProperty('newspaper');
  });

  it('migrates a version 4 save: the level starts at 1.00 with a seed and no headline', async () => {
    const { migrate } = useGameStore.persist.getOptions();
    const migrated = (await migrate?.(
      {
        currentWeek: 6,
        gameStatus: 'playing',
        players: [player()],
        turnIndex: 0,
      },
      4,
    )) as { priceLevel: number; priceSeed: number; newspaper: null };
    expect(migrated.priceLevel).toBe(defaultPack.inflation.startLevel);
    expect(Number.isInteger(migrated.priceSeed)).toBe(true);
    expect(migrated.newspaper).toBeNull();
  });
});
