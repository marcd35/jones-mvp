import { beforeEach, describe, expect, it } from 'vitest';
import { createGameStore, useGameStore } from './useGameStore';
import { defaultPack } from '@/data';
import { createRandom } from '@/lib/random';
import { scalePrice } from '@/lib/inflation';
import { WEEKEND_EFFECTS } from '@/lib/weekend';
import { walkingCostHours, walkingSteps } from '@/lib/board';
import {
  householdStockForWeek,
  ownedGoodsHappiness,
} from '@/lib/household-goods';
import type { DataPack, GameState, Player } from '@/types';
import { CLASS_HOURS, MAX_TIME, TUITION_COST } from '@/lib/constants';

const HOME = defaultPack.homeLocationId;
const ENTRY_JOB = defaultPack.jobs[0];
// The job above the entry one: it asks for education.
const BETTER_JOB = defaultPack.jobs.find((j) => j.educationRequired > 0)!;
const STARTING_MONEY = defaultPack.startingMoney;
const RENT_COST = defaultPack.rent.homeAmounts[HOME];
const RENT_INTERVAL = defaultPack.rent.intervalWeeks;
const WORK = ENTRY_JOB.locationId;
const EMPLOYMENT = 'employment-office';
const STORE = 'z-mart';
const UNI = 'hi-tech-u';
const MARKET = 'blacks-market';
const CLOTHES_SHOP = defaultPack.clothing.locationId;
const PENALTY = defaultPack.food.penaltyHours;
const FRIES = defaultPack.food.goods.find(
  (g) => g.locationId === 'monolith-burger',
)!;
const FOOD_OF = (id: string) =>
  defaultPack.food.goods.find((g) => g.id === id)!;

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
      foodWeeks: 0,
      isStarving: false,
      clothes: { tierId: defaultPack.clothing.startTierId, weeksWorn: 0 },
      locationId: HOME,
      rentDueWeek: RENT_INTERVAL,
      rentExtensionAskedWeek: null,
      rentPaidWeek: null,
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
    setPlayer({ timeRemaining: 0.3, foodWeeks: 1 });
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
    expect(player().money).toBe(300);
    expect(player().owedRent).toBe(RENT_COST);
    expect(player().isStarving).toBe(true);
    expect(player().timeRemaining).toBe(MAX_TIME - PENALTY);
  });

  it('can lose the game when an overrun walk triggers unpaid rent', () => {
    setState({ currentWeek: RENT_INTERVAL });
    setPlayer({ timeRemaining: 0.1, money: 0 });
    store().walkTo(STORE);
    expect(store().gameStatus).toBe('playing');
    expect(player().owedRent).toBe(RENT_COST);
  });

  it('succeeds with exactly enough Time, then the Week ends because Time ran out', () => {
    setPlayer({ timeRemaining: hoursFor(HOME, STORE), foodWeeks: 1 });
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
      careerId: 'mine',
      educationRequired: 0,
      educationLabel: 'None',
      experienceRequired: 0,
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
  rent: {
    locationId: 'hall',
    homeAmounts: { cabin: 12 },
    intervalWeeks: 2,
    garnishment: 3,
  },
  food: {
    penaltyHours: 3,
    goods: [
      {
        id: 'bread',
        name: 'Bread',
        locationId: 'shop',
        weeks: 2,
        basePrice: 6,
        timeHours: 0.5,
      },
    ],
  },
  householdGoods: {
    goods: [
      {
        id: 'lamp',
        name: 'Lamp',
        locationId: 'shop',
        basePrice: 10,
        happinessPoints: 2,
        stockChance: 0.5,
      },
      {
        id: 'radio',
        name: 'Radio',
        locationId: 'shop',
        basePrice: 20,
        happinessPoints: 3,
        stockChance: 0.5,
      },
    ],
  },
  clothing: {
    locationId: 'hall',
    tiers: [
      { id: 'rags', name: 'Rags', rank: 1, basePrice: 4 },
      { id: 'cloak', name: 'Cloak', rank: 2, basePrice: 9 },
    ],
    startTierId: 'rags',
    wearOutWeeks: 3,
    warnWeeks: 1,
  },
  // An invented rule: the level rises a quarter each Week.
  inflation: {
    startLevel: 1,
    nextLevel: ({ week }) => 1 + (week - 1) * 0.25,
    notableMoves: [{ minMove: 0.2, up: 'Gold rush!', down: 'Gold slump!' }],
  },
  newspaper: {
    locationId: 'shop',
    price: 1,
    timeHours: 0.3,
    issueEveryWeeks: 1,
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
    game.getState().buyFood('bread');
    expect(active().foodWeeks).toBe(2);
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

describe('household goods', () => {
  it('adds only the happiness points for owned goods', () => {
    const microwave = defaultPack.householdGoods.goods.find(
      (good) => good.id === 'microwave',
    )!;
    expect(
      ownedGoodsHappiness(defaultPack, ['microwave', 'microwave', 'fries']),
    ).toBe(microwave.happinessPoints);
  });

  it('samples each good by configured probability with repeatable weekly stock', () => {
    const stockPack = {
      ...defaultPack,
      householdGoods: {
        goods: [
          {
            id: 'never',
            name: 'Never',
            locationId: 'z-mart',
            basePrice: 1,
            happinessPoints: 0,
            stockChance: 0,
          },
          {
            id: 'always',
            name: 'Always',
            locationId: 'z-mart',
            basePrice: 1,
            happinessPoints: 0,
            stockChance: 1,
          },
          {
            id: 'sometimes',
            name: 'Sometimes',
            locationId: 'z-mart',
            basePrice: 1,
            happinessPoints: 0,
            stockChance: 0.5,
          },
        ],
      },
    };
    const stock = (week: number) =>
      householdStockForWeek(stockPack, week, 123, 'z-mart').map((g) => g.id);

    expect(stock(1)).toContain('always');
    expect(stock(1)).not.toContain('never');
    expect(stock(1)).toEqual(stock(1));
    expect(
      new Set(
        Array.from({ length: 64 }, (_, i) =>
          stock(i + 1).includes('sometimes'),
        ),
      ),
    ).toEqual(new Set([true, false]));
  });

  it('charges current scaled price, records ownership, and keeps it after leaving', () => {
    const game = inventedStore();
    game.setState((state) => ({
      players: state.players.map((p) => ({
        ...p,
        locationId: 'shop',
        money: 100,
        timeRemaining: 0.1,
      })),
    }));
    const stock = householdStockForWeek(
      inventedPack,
      1,
      game.getState().priceSeed,
      'shop',
    );
    const good = stock[0];
    game.getState().buyHouseholdGood(good.id);
    expect(game.getState().players[0]).toMatchObject({
      money: 100 - good.basePrice,
      ownedGoods: [good.id],
      timeRemaining: 0.1,
    });
    game.setState((state) => ({
      players: state.players.map((p) => ({ ...p, locationId: 'cabin' })),
    }));
    expect(game.getState().players[0].ownedGoods).toContain(good.id);
  });

  it('refuses unaffordable, unavailable, and duplicate purchases', () => {
    const game = inventedStore();
    const stock = householdStockForWeek(
      inventedPack,
      1,
      game.getState().priceSeed,
      'shop',
    );
    const good = stock[0];
    game.setState((state) => ({
      players: state.players.map((p) => ({
        ...p,
        locationId: 'shop',
        money: 0,
      })),
    }));
    game.getState().buyHouseholdGood(good.id);
    expect(game.getState().players[0].ownedGoods).toEqual([]);
    game.setState((state) => ({
      players: state.players.map((p) => ({
        ...p,
        money: 100,
        ownedGoods: [good.id],
      })),
    }));
    game.getState().buyHouseholdGood(good.id);
    expect(game.getState().players[0].ownedGoods).toEqual([good.id]);
    game.getState().buyHouseholdGood('unknown');
    expect(game.getState().players[0].ownedGoods).toEqual([good.id]);
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

  it('requires experience in the listed Career and snapshots the scaled wage', () => {
    const job = defaultPack.jobs.find(
      (candidate) => candidate.id === 'qt-salesperson',
    )!;
    setPlayer({ educationLevel: job.educationRequired });
    setState({ priceLevel: 1.25 });

    store().hire(job.id);
    expect(player().jobId).toBeNull();
    expect(store().lastEvent).toMatch(/experience/i);

    setPlayer({ careerExperience: { [job.careerId]: job.experienceRequired } });
    store().hire(job.id);
    expect(player()).toMatchObject({
      jobId: job.id,
      heldWage: scalePrice(job.wage, 1.25),
    });
  });

  it('refuses a mismatched education path and accepts the required path', () => {
    const job = defaultPack.jobs.find(
      (candidate) => candidate.id === 'socket-repair',
    )!;
    setPlayer({
      educationLevel: job.educationRequired,
      educationPath: 'college',
    });

    store().hire(job.id);
    expect(player().jobId).toBeNull();
    expect(store().lastEvent).toMatch(/technical education path/i);

    setPlayer({ educationPath: 'technical' });
    store().hire(job.id);
    expect(player().jobId).toBe(job.id);
  });

  it('keeps the hired wage after the price level changes', () => {
    const job = ENTRY_JOB;
    setState({ priceLevel: 1.25 });
    store().hire(job.id);
    const hiredWage = scalePrice(job.wage, 1.25);
    setState({
      priceLevel: 0.8,
      players: [
        {
          ...player(),
          locationId: job.locationId,
        },
      ],
    });

    store().work();

    expect(player().heldWage).toBe(hiredWage);
    expect(player().money).toBe(STARTING_MONEY + hiredWage * job.shiftHours);
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
    expect(player().careerExperience[ENTRY_JOB.careerId]).toBe(1);
    expect(player().timeRemaining).toBe(MAX_TIME - 1.2);
    expect(store().lastEvent).toMatch(/Earned \$32/);
    expect(store().lastEvent).toMatch(/Gained 1 Career experience point/);
  });

  it('adds experience to the current Career and unlocks its qualified rung', () => {
    setPlayer({ careerExperience: { other: 3 } });
    store().work();

    expect(player().careerExperience).toEqual({
      other: 3,
      [ENTRY_JOB.careerId]: 1,
    });

    const nextRung = defaultPack.jobs.find(
      (job) =>
        job.careerId === ENTRY_JOB.careerId && job.experienceRequired === 1,
    )!;
    setPlayer({
      locationId: EMPLOYMENT,
      educationLevel: nextRung.educationRequired,
    });
    if (nextRung.educationPathRequired !== undefined) {
      setPlayer({ educationPath: nextRung.educationPathRequired });
    }
    store().hire(nextRung.id);
    expect(player().jobId).toBe(nextRung.id);
  });

  it('can be repeated: ten shifts use the whole Week and end it', () => {
    for (let i = 0; i < 9; i++) store().work();
    expect(player().money).toBe(STARTING_MONEY + 9 * 32);
    expect(player().timeRemaining).toBeCloseTo(1.2, 5);
    expect(store().currentWeek).toBe(1);

    store().work();
    expect(player().money).toBe(STARTING_MONEY + 10 * 32);
    expect(player().careerExperience[ENTRY_JOB.careerId]).toBe(10);
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
    expect(player().careerExperience).toEqual({});
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
    store().endTurn(); // Week 1: no food, no rent due
    expect(text('food')).toMatch(/no food/i);
    expect(text('rent')).toBeNull();
    expect(text('clothing')).toBeNull();
  });

  it('puts rent in its own slot in a rent Week', () => {
    setState({ currentWeek: RENT_INTERVAL });
    setPlayer({ money: 300, foodWeeks: 1 });
    store().endTurn();
    expect(text('rent')).toMatch(new RegExp(`${RENT_COST}`));
    expect(player().owedRent).toBe(RENT_COST);
    expect(text('food')).toMatch(/fed/i);
    expect(report().cash).toBe(300);
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
    setPlayer({ locationId: WORK, timeRemaining: 3, foodWeeks: 1 });
    store().endTurn();
    expect(player().locationId).toBe(HOME);
    expect(player().timeRemaining).toBe(MAX_TIME);
  });

  it('takes the hunger penalty off the next Turn after a Week without food', () => {
    setPlayer({ locationId: WORK });
    store().endTurn();
    expect(player().locationId).toBe(HOME);
    expect(player().timeRemaining).toBe(MAX_TIME - PENALTY);
  });

  it('ends the Week by itself when an action uses the last of the Time', () => {
    setPlayer({
      locationId: WORK,
      jobId: ENTRY_JOB.id,
      timeRemaining: ENTRY_JOB.workTimeHours,
      foodWeeks: 1,
    });
    store().work();
    expect(report()).toMatchObject({ week: 1, reason: 'time' });
    expect(player().money).toBe(STARTING_MONEY + 32);
    expect(player().locationId).toBe(HOME);
    expect(player().timeRemaining).toBe(MAX_TIME);
    expect(store().lastEvent).toMatch(/Earned \$32/);
  });

  it('reports an overrunning walk as ending on the road', () => {
    setPlayer({ timeRemaining: 0.1, foodWeeks: 1 });
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
    expect(player().timeRemaining).toBe(MAX_TIME - PENALTY);
  });

  it('gives a full week after eating', () => {
    setPlayer({ locationId: FRIES.locationId });
    store().buyFood(FRIES.id);
    store().endTurn();
    expect(player().isStarving).toBe(false);
    expect(player().foodWeeks).toBe(0);
    expect(player().timeRemaining).toBe(MAX_TIME);
  });

  it('adds unpaid rent to the balance every RENT_INTERVAL weeks without taking cash', () => {
    setState({ currentWeek: RENT_INTERVAL });
    setPlayer({ money: 300 });
    store().endTurn();
    expect(player().money).toBe(300);
    expect(player().owedRent).toBe(RENT_COST);
    expect(player().rentDueWeek).toBe(RENT_INTERVAL * 2);
  });

  it('does not charge rent in other weeks', () => {
    setState({ currentWeek: RENT_INTERVAL - 1 });
    setPlayer({ money: 300 });
    store().endTurn();
    expect(player().money).toBe(300);
  });

  it('does not lose until the rent owed reaches its data limit', () => {
    setState({ currentWeek: RENT_INTERVAL });
    setPlayer({
      money: RENT_COST - 1,
      owedRent: defaultPack.rentOwedLimit - RENT_COST,
    });
    store().endTurn();
    expect(store().gameStatus).toBe('lost');
    expect(player().owedRent).toBe(defaultPack.rentOwedLimit);
  });

  it('pays current rent at the Rent Office and advances the due Week', () => {
    setState({ currentWeek: RENT_INTERVAL });
    setPlayer({
      locationId: defaultPack.rent.locationId,
      money: RENT_COST + 10,
    });
    store().payRent();
    expect(player()).toMatchObject({
      money: 10,
      rentDueWeek: RENT_INTERVAL * 2,
      owedRent: 0,
    });
  });

  it('refuses current rent when cash is short and leaves the rent balance for week end', () => {
    setState({ currentWeek: RENT_INTERVAL });
    setPlayer({
      locationId: defaultPack.rent.locationId,
      money: RENT_COST - 1,
    });
    store().payRent();
    expect(player().money).toBe(RENT_COST - 1);
    expect(player().rentDueWeek).toBe(RENT_INTERVAL);
    expect(store().lastEvent).toMatch(/need/i);
  });

  it('grants a one Week extension and opens the office in the new due Week', () => {
    setState({ currentWeek: RENT_INTERVAL });
    setPlayer({ locationId: defaultPack.rent.locationId, money: 500 });
    store().askForMoreTime();
    expect(player()).toMatchObject({
      rentDueWeek: RENT_INTERVAL + 1,
      rentExtensionAskedWeek: RENT_INTERVAL,
    });
    store().askForMoreTime();
    expect(player().rentDueWeek).toBe(RENT_INTERVAL + 1);
    store().endTurn();
    expect(player().owedRent).toBe(0);
    expect(store().currentWeek).toBe(RENT_INTERVAL + 1);
    setPlayer({ locationId: defaultPack.rent.locationId });
    store().payRent();
    expect(player().rentDueWeek).toBe(RENT_INTERVAL * 2 + 1);
    expect(player().money).toBe(500 - RENT_COST);
  });

  it('garnishes each Work payment until the owed balance is cleared', () => {
    setPlayer({
      locationId: WORK,
      jobId: ENTRY_JOB.id,
      owedRent: 20,
      money: 0,
    });
    store().work();
    expect(player().money).toBe(
      ENTRY_JOB.wage * ENTRY_JOB.shiftHours - defaultPack.rent.garnishment,
    );
    expect(player().owedRent).toBe(20 - defaultPack.rent.garnishment);
    store().work();
    expect(player().owedRent).toBe(0);
  });

  it('pays off the remaining balance at the Rent Office', () => {
    setState({ currentWeek: RENT_INTERVAL });
    setPlayer({
      locationId: defaultPack.rent.locationId,
      money: 150,
      owedRent: 75,
    });
    store().payRentBalance();
    expect(player()).toMatchObject({ money: 75, owedRent: 0 });
  });

  it('explains a closed Rent Office and allows waiting for the next due Week', () => {
    setPlayer({ locationId: defaultPack.rent.locationId, owedRent: 75 });
    store().payRentBalance();
    expect(player().owedRent).toBe(75);
    expect(store().lastEvent).toMatch(/closed/i);
    store().endTurn();
    expect(store().gameStatus).toBe('playing');
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
    // A spread of points on all four Goals (the default is all on wealth).
    store().setGoalPoints('wealth', 50);
    for (const id of ['happiness', 'education', 'career'] as const) {
      store().setGoalPoints(id, 50);
    }
    store().startGame();
    atWork();
    setPlayer({ money: 1_000_000 });
    store().work();
    expect(store().gameStatus).toBe('playing');
  });

  it('wins a new game with the default Goal points by earning to the wealth target', () => {
    useGameStore.setState(useGameStore.getInitialState(), true);
    store().startGame(); // untouched defaults from the real pack
    const target = Math.ceil(player().goals.wealth * WEALTH.perPoint);
    expect(target).toBe(2000);
    expect(player().goals).toMatchObject({
      wealth: 50,
      happiness: 0,
      education: 0,
      career: 0,
    });
    atWork();
    setPlayer({ money: target - shift });
    store().work();
    expect(store().gameStatus).toBe('won');
    expect(player().money).toBe(target);
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
    store().buyFood(FRIES.id);
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

  it('garnishes the owed rent on Work before the loss threshold is reached', () => {
    wealthOnly(10);
    atWork();
    setPlayer({ owedRent: LIMIT });
    store().work();
    expect(store().gameStatus).toBe('playing');
    expect(player().owedRent).toBe(LIMIT - defaultPack.rent.garnishment);
  });

  it('does not lose one dollar below the limit', () => {
    wealthOnly(10);
    setPlayer({ owedRent: LIMIT - 1 });
    store().endTurn();
    expect(store().gameStatus).toBe('playing');
  });

  it('loses even when the Goals are met at the same moment', () => {
    const target = wealthOnly(10);
    setState({ currentWeek: RENT_INTERVAL });
    setPlayer({ money: target, owedRent: LIMIT - RENT_COST });
    store().endTurn();
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
      store().buyFood(FRIES.id);
      store().buyClothes('casual');
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
    expect(persisted().version).toBe(10);
  });

  it('migrates a version 9 job save to career experience and its previous held wage', async () => {
    const { migrate } = useGameStore.persist.getOptions();
    const oldPlayer = { ...player(), jobId: ENTRY_JOB.id } as Partial<Player>;
    delete oldPlayer.heldWage;
    delete oldPlayer.careerExperience;
    const migrated = (await migrate?.(
      { players: [oldPlayer], priceLevel: 1.25, turnIndex: 0 },
      9,
    )) as { players: Player[] };

    expect(migrated.players[0]).toMatchObject({
      jobId: ENTRY_JOB.id,
      heldWage: ENTRY_JOB.wage,
      careerExperience: {},
    });
  });

  it('maps the retired Shift Manager save to the approved Monolith Manager role', async () => {
    const { migrate } = useGameStore.persist.getOptions();
    const oldPlayer = {
      ...player(),
      jobId: 'shift-manager',
    } as Partial<Player>;
    delete oldPlayer.heldWage;
    delete oldPlayer.careerExperience;
    const migrated = (await migrate?.(
      { players: [oldPlayer], priceLevel: 1.25, turnIndex: 0 },
      9,
    )) as { players: Player[] };

    expect(migrated.players[0]).toMatchObject({
      jobId: 'monolith-manager',
      heldWage: 15,
      careerExperience: {},
    });
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

  it('migrates a version 6 save to the next rent due Week', async () => {
    const { migrate } = useGameStore.persist.getOptions();
    const old = { ...player() } as Partial<Player>;
    delete old.rentDueWeek;
    delete old.rentExtensionAskedWeek;
    delete old.rentPaidWeek;
    const migrated = (await migrate?.(
      { currentWeek: 5, players: [old], turnIndex: 0 },
      6,
    )) as { players: Player[] };
    expect(migrated.players[0]).toMatchObject({
      rentDueWeek: RENT_INTERVAL * 2,
      rentExtensionAskedWeek: null,
      rentPaidWeek: null,
    });
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
    setPlayer({ money: 500, locationId: FRIES.locationId });
    store().buyFood(FRIES.id);
    // 68 x 1.10 = 74.80, which rounds to 75.
    expect(player().money).toBe(500 - 75);
    setPlayer({ locationId: UNI, timeRemaining: 12 });
    store().attendClass();
    expect(player().money).toBe(500 - 75 - 110);
  });

  it('rounds to the nearest dollar, halves up, and at level 1.00 changes nothing', () => {
    expect(scalePrice(15, 1.07)).toBe(16); // 16.05
    expect(scalePrice(15, 1.03)).toBe(15); // 15.45
    expect(scalePrice(15, 1.1)).toBe(17); // 16.50
    expect(scalePrice(15, 0.83)).toBe(12); // 12.45
    expect(scalePrice(15, 1)).toBe(15);
    expect(scalePrice(100, 1.22)).toBe(122);
  });

  it('refuses food the scaled price puts out of reach', () => {
    setState({ priceLevel: 1.22 });
    setPlayer({ money: 70, locationId: FRIES.locationId }); // $68 at 1.00, $83 at 1.22
    store().buyFood(FRIES.id);
    expect(player().foodWeeks).toBe(0);
    expect(player().money).toBe(70);
  });

  it('scales wages when the Player is hired', () => {
    setState({ priceLevel: 1.22 });
    setPlayer({ locationId: EMPLOYMENT });
    store().hire(ENTRY_JOB.id);
    setPlayer({ locationId: WORK });
    store().work();
    expect(player().money).toBe(
      STARTING_MONEY + scalePrice(ENTRY_JOB.wage, 1.22) * ENTRY_JOB.shiftHours,
    );
  });

  it('does not scale rent here: rent belongs to T-09', () => {
    setState({ currentWeek: RENT_INTERVAL, priceLevel: 1.22 });
    setPlayer({ money: 300, foodWeeks: 1 });
    store().endTurn();
    expect(report().cash).toBe(300);
  });

  it('works with a replacement rule in an invented pack, with no rules change', () => {
    const game = gameOf(inventedPack);
    game.getState().endTurn();
    expect(game.getState().priceLevel).toBe(1.25);
    game.getState().endTurn();
    expect(game.getState().priceLevel).toBe(1.5);
    game.getState().walkTo('shop');
    game.setState((s) => ({ players: [{ ...s.players[0], money: 100 }] }));
    game.getState().buyFood('bread');
    expect(game.getState().players[0].money).toBe(
      100 - scalePrice(inventedPack.food.goods[0].basePrice, 1.5),
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

  it('migrates a version 7 save with no newspaper read history', async () => {
    const { migrate } = useGameStore.persist.getOptions();
    const oldPlayer = { ...player() } as Partial<Player>;
    delete oldPlayer.newspaperReadWeek;
    const migrated = (await migrate?.(
      { currentWeek: 4, players: [oldPlayer], turnIndex: 0 },
      7,
    )) as { players: Player[] };
    expect(migrated.players[0].newspaperReadWeek).toBeNull();
  });
});

describe('newspaper (issue #20)', () => {
  const gameOf = (pack: DataPack) => {
    const game = createGameStore({ pack, random: createRandom(12) });
    game.getState().startGame();
    return game;
  };

  it('costs the flat data price and Time once per issue', () => {
    const game = gameOf(defaultPack);
    const before = game.getState().players[0];
    game.setState({ currentWeek: 2, priceLevel: 1.5 });
    game.setState((s) => ({
      players: [
        { ...s.players[0], locationId: MARKET, money: 10, timeRemaining: 4 },
      ],
    }));

    game.getState().buyNewspaper();
    expect(game.getState().players[0]).toMatchObject({
      money: 9,
      timeRemaining: 4 - defaultPack.newspaper.timeHours,
      newspaperReadWeek: 2,
    });
    expect(game.getState().lastEvent).toMatch(
      /Bought this Week’s newspaper for \$1/,
    );

    const afterPurchase = game.getState().players[0];
    game.getState().buyNewspaper();
    expect(game.getState().players[0]).toEqual(afterPurchase);
    expect(game.getState().lastEvent).toMatch(/already read/i);
    expect(before.money).toBe(STARTING_MONEY);
  });

  it('refuses a purchase away from the seller, without money, or without Time', () => {
    const game = gameOf(defaultPack);
    game.getState().buyNewspaper();
    expect(game.getState().lastEvent).toMatch(/sold at Black's Market/i);

    game.setState((s) => ({
      players: [{ ...s.players[0], locationId: MARKET, money: 0 }],
    }));
    game.getState().buyNewspaper();
    expect(game.getState().lastEvent).toMatch(/need \$1/i);
    expect(game.getState().players[0].money).toBe(0);

    game.setState((s) => ({
      players: [{ ...s.players[0], money: 1, timeRemaining: 0.2 }],
    }));
    game.getState().buyNewspaper();
    expect(game.getState().lastEvent).toMatch(/not enough Time/i);
    expect(game.getState().players[0].money).toBe(1);
  });

  it('only offers a new issue on the configured Week cadence', () => {
    const pack: DataPack = {
      ...inventedPack,
      newspaper: { ...inventedPack.newspaper, issueEveryWeeks: 2 },
    };
    const game = gameOf(pack);
    game.setState({ currentWeek: 2 });
    game.setState((s) => ({
      players: [{ ...s.players[0], locationId: 'shop', money: 10 }],
    }));
    game.getState().buyNewspaper();
    expect(game.getState().lastEvent).toMatch(
      /next newspaper issue arrives in Week 3/i,
    );
    expect(game.getState().players[0].money).toBe(10);
  });

  it('refuses to sell from a closed Location', () => {
    const pack: DataPack = {
      ...inventedPack,
      locations: inventedPack.locations.map((location) => ({ ...location })),
    };
    const game = gameOf(pack);
    pack.locations.find((location) => location.id === 'shop')!.closed = true;
    game.setState((s) => ({
      players: [{ ...s.players[0], locationId: 'shop', money: 10 }],
    }));
    game.getState().buyNewspaper();
    expect(game.getState().lastEvent).toMatch(/Location is closed/i);
    expect(game.getState().players[0].money).toBe(10);
  });
});

describe('food (AC-007)', () => {
  const report = () => store().weekendReport!;
  const foodLine = () => report().effects.find((e) => e.id === 'food')!.text;

  it('sells one Week of food at Monolith Burger, for the scaled price and its Time', () => {
    setPlayer({ locationId: FRIES.locationId });
    store().buyFood(FRIES.id);
    expect(player()).toMatchObject({
      money: STARTING_MONEY - scalePrice(FRIES.basePrice, 1),
      timeRemaining: MAX_TIME - FRIES.timeHours,
      foodWeeks: FRIES.weeks,
    });
    expect(store().lastEvent).toMatch(/Bought/);
  });

  it.each(defaultPack.food.goods.filter((g) => g.locationId === MARKET))(
    "sells $name at Black's Market covering its Weeks",
    (good) => {
      setState({ priceLevel: 1.22 });
      setPlayer({ locationId: MARKET, money: 1000 });
      store().buyFood(good.id);
      expect(player().foodWeeks).toBe(good.weeks);
      expect(player().money).toBe(1000 - scalePrice(good.basePrice, 1.22));
    },
  );

  it("matches the observed Week 7 prices of Black's Market food (UNK-004)", () => {
    const price = (id: string) => scalePrice(FOOD_OF(id).basePrice, 1.22);
    expect([
      price('market-food-1'),
      price('market-food-2'),
      price('market-food-4'),
    ]).toEqual([70, 128, 243]);
  });

  it('adds to the food already in hand', () => {
    setPlayer({ locationId: MARKET, money: 1000, foodWeeks: 1 });
    store().buyFood('market-food-2');
    expect(player().foodWeeks).toBe(3);
  });

  it('refuses without enough money', () => {
    setPlayer({ locationId: FRIES.locationId, money: 1 });
    store().buyFood(FRIES.id);
    expect(player()).toMatchObject({ money: 1, foodWeeks: 0 });
    expect(store().lastEvent).toMatch(/You need \$68/);
  });

  it('refuses with too little Time, and the Week goes on', () => {
    setPlayer({ locationId: FRIES.locationId, timeRemaining: 0.5 });
    store().buyFood(FRIES.id);
    expect(player()).toMatchObject({
      money: STARTING_MONEY,
      foodWeeks: 0,
      timeRemaining: 0.5,
    });
    expect(store().currentWeek).toBe(1);
    expect(store().lastEvent).toMatch(/not enough time/i);
  });

  it('refuses at a Location that does not sell it, and at home', () => {
    setPlayer({ locationId: MARKET });
    store().buyFood(FRIES.id); // Fries are Monolith Burger's
    setPlayer({ locationId: HOME });
    store().buyFood('market-food-1');
    expect(player()).toMatchObject({ money: STARTING_MONEY, foodWeeks: 0 });
    expect(store().lastEvent).toMatch(/not sold here/i);
  });

  it('cannot be bought at a closed Location: the Player never gets in', () => {
    store().walkTo('bank'); // closed
    expect(store().lastEvent).toMatch(/closed/i);
    store().buyFood('market-food-1');
    expect(player()).toMatchObject({ locationId: HOME, foodWeeks: 0 });
  });

  it('ignores an unknown food', () => {
    setPlayer({ locationId: MARKET });
    store().buyFood('caviar');
    expect(player().money).toBe(STARTING_MONEY);
  });

  it('skipping food costs the data penalty off the next Week, and is reported', () => {
    store().endTurn();
    expect(player().timeRemaining).toBe(MAX_TIME - PENALTY);
    expect(player().isStarving).toBe(true);
    expect(foodLine()).toMatch(/no food/i);
    expect(foodLine()).toContain(`${PENALTY} hours`);
  });

  it('eating this Week means no penalty next Week', () => {
    setPlayer({ locationId: FRIES.locationId });
    store().buyFood(FRIES.id);
    store().endTurn();
    expect(player()).toMatchObject({
      timeRemaining: MAX_TIME,
      isStarving: false,
      foodWeeks: 0,
    });
    expect(foodLine()).toMatch(/fed.*no food left/i);
  });

  it('a bundle covers its Weeks, then the penalty returns', () => {
    setPlayer({ locationId: MARKET, money: 1000 });
    store().buyFood('market-food-2');
    store().endTurn();
    expect(foodLine()).toMatch(/1 more Week\./);
    expect(player().timeRemaining).toBe(MAX_TIME);
    store().endTurn();
    expect(player().timeRemaining).toBe(MAX_TIME);
    expect(player().foodWeeks).toBe(0);
    store().endTurn();
    expect(player().timeRemaining).toBe(MAX_TIME - PENALTY);
  });

  it('does not stack the penalty over hungry Weeks', () => {
    store().endTurn();
    store().endTurn();
    store().endTurn();
    expect(player().timeRemaining).toBe(MAX_TIME - PENALTY);
  });

  it('eating clears the earlier hunger: a fed Week after a hungry one costs nothing (UNK-006 rule)', () => {
    store().endTurn(); // hungry Week 1
    expect(player().timeRemaining).toBe(MAX_TIME - PENALTY);
    setPlayer({ locationId: FRIES.locationId });
    store().buyFood(FRIES.id);
    store().endTurn(); // fed Week 2
    expect(player().timeRemaining).toBe(MAX_TIME);
  });

  it('counts food bought with the last of the Time toward the Week it ends', () => {
    setPlayer({ locationId: FRIES.locationId, timeRemaining: FRIES.timeHours });
    store().buyFood(FRIES.id);
    expect(report()).toMatchObject({ week: 1, reason: 'time' });
    expect(player().timeRemaining).toBe(MAX_TIME);
  });

  it('does not touch rent: rent due still comes in its own slot', () => {
    setState({ currentWeek: RENT_INTERVAL });
    setPlayer({ money: 300 });
    store().endTurn();
    expect(report().cash).toBe(300);
  });
});

describe('clothing (AC-008)', () => {
  const rules = defaultPack.clothing;
  const report = () => store().weekendReport!;
  const clothingLine = () =>
    report().effects.find((e) => e.id === 'clothing')!.text;
  // A Week with food, so only the clothes are in play.
  const fedWeek = () => {
    setPlayer({ foodWeeks: 1 });
    store().endTurn();
  };

  it('starts the Player in the data clothes, brand new', () => {
    expect(player().clothes).toEqual({
      tierId: rules.startTierId,
      weeksWorn: 0,
    });
  });

  it('wears one Week at a time and says nothing until the warning', () => {
    fedWeek();
    expect(player().clothes!.weeksWorn).toBe(1);
    expect(clothingLine()).toBeNull();
  });

  it('warns before the clothes wear out, then says they have', () => {
    for (let i = 0; i < rules.wearOutWeeks - rules.warnWeeks; i++) fedWeek();
    expect(clothingLine()).toMatch(/will wear out in 1 Week/);
    expect(store().lastEvent).toMatch(/will wear out/);
    for (let i = 0; i < rules.warnWeeks; i++) fedWeek();
    expect(clothingLine()).toMatch(/worn out/);
    expect(player().clothes!.weeksWorn).toBe(rules.wearOutWeeks);
  });

  it('stops counting once worn out and reports no further change', () => {
    setPlayer({ clothes: { tierId: 'casual', weeksWorn: rules.wearOutWeeks } });
    fedWeek();
    expect(player().clothes!.weeksWorn).toBe(rules.wearOutWeeks);
    expect(clothingLine()).toBeNull();
  });

  it('blocks Work in worn clothes: no pay, no Time spent', () => {
    setPlayer({
      jobId: ENTRY_JOB.id,
      locationId: WORK,
      clothes: { tierId: 'casual', weeksWorn: rules.wearOutWeeks },
    });
    store().work();
    expect(player()).toMatchObject({
      money: STARTING_MONEY,
      timeRemaining: MAX_TIME,
    });
    expect(store().lastEvent).toMatch(/worn out/i);
  });

  it('allows hiring in worn clothes because v1 jobs have no clothing tier', () => {
    setPlayer({
      locationId: EMPLOYMENT,
      clothes: { tierId: 'casual', weeksWorn: rules.wearOutWeeks },
    });
    store().hire(ENTRY_JOB.id);
    expect(player().jobId).toBe(ENTRY_JOB.id);
    expect(store().lastEvent).toMatch(/Hired as Cook/);
  });

  it('sells each tier at QT Clothing for the scaled price, new', () => {
    setState({ priceLevel: 1.2 });
    for (const tier of rules.tiers) {
      setPlayer({
        locationId: CLOTHES_SHOP,
        money: 1000,
        clothes: { tierId: 'casual', weeksWorn: rules.wearOutWeeks },
      });
      store().buyClothes(tier.id);
      expect(player().money).toBe(1000 - scalePrice(tier.basePrice, 1.2));
      expect(player().clothes).toEqual({ tierId: tier.id, weeksWorn: 0 });
    }
  });

  it('lets the Player work again after buying new clothes', () => {
    setPlayer({
      jobId: ENTRY_JOB.id,
      clothes: { tierId: 'casual', weeksWorn: rules.wearOutWeeks },
      locationId: CLOTHES_SHOP,
    });
    store().buyClothes('casual');
    setPlayer({ locationId: WORK });
    store().work();
    expect(player().money).toBe(
      STARTING_MONEY -
        scalePrice(rules.tiers[0].basePrice, 1) +
        ENTRY_JOB.wage * ENTRY_JOB.shiftHours,
    );
  });

  it('refuses without enough money, away from QT Clothing, and for an unknown tier', () => {
    setPlayer({ locationId: CLOTHES_SHOP, money: 5 });
    store().buyClothes('suit');
    expect(store().lastEvent).toMatch(/You need \$309/);
    setPlayer({ locationId: HOME, money: 1000 });
    store().buyClothes('suit');
    expect(store().lastEvent).toMatch(/not sold here/i);
    setPlayer({ locationId: CLOTHES_SHOP });
    store().buyClothes('tuxedo');
    expect(player().clothes).toEqual({ tierId: 'casual', weeksWorn: 0 });
    expect(player().money).toBe(1000);
  });

  it('does not replace good clothes of the same or a higher tier', () => {
    setPlayer({
      locationId: CLOTHES_SHOP,
      money: 1000,
      clothes: { tierId: 'dress', weeksWorn: 1 },
    });
    store().buyClothes('casual');
    store().buyClothes('dress');
    expect(player().money).toBe(1000);
    expect(player().clothes).toEqual({ tierId: 'dress', weeksWorn: 1 });
    expect(store().lastEvent).toMatch(/still good/);
  });

  it('lets the Player upgrade, and renew clothes that are about to wear out', () => {
    setPlayer({ locationId: CLOTHES_SHOP, money: 1000 });
    store().buyClothes('dress');
    expect(player().clothes).toEqual({ tierId: 'dress', weeksWorn: 0 });
    setPlayer({
      clothes: { tierId: 'dress', weeksWorn: rules.wearOutWeeks - 1 },
    });
    store().buyClothes('dress');
    expect(player().clothes).toEqual({ tierId: 'dress', weeksWorn: 0 });
  });
});

describe('food and clothing in an invented pack, with no rules change', () => {
  // A job that asks for the invented higher tier (AC-008, AC-014).
  const pack: DataPack = {
    ...inventedPack,
    jobs: [
      ...inventedPack.jobs,
      {
        id: 'guard',
        title: 'Guard',
        wage: 20,
        locationId: 'mine',
        careerId: 'mine',
        educationRequired: 0,
        educationLabel: 'None',
        experienceRequired: 0,
        shiftHours: 4,
        workTimeHours: 1,
        clothingRequired: 'cloak',
      },
    ],
  };
  const gameOfPack = () => {
    const game = createGameStore({ pack, random: createRandom(7) });
    game.getState().startGame();
    return game;
  };
  const me = (game: ReturnType<typeof gameOfPack>) =>
    game.getState().players[0];

  it('blocks a job that needs a tier the Player lacks, until it is bought', () => {
    const game = gameOfPack();
    game.getState().walkTo('hall');
    game.getState().hire('guard');
    expect(me(game).jobId).toBeNull();
    expect(game.getState().lastEvent).toMatch(/Cloak/);

    game.getState().buyClothes('cloak'); // the hall sells clothes here: $9
    expect(me(game).money).toBe(inventedPack.startingMoney - 9);
    game.getState().hire('guard');
    expect(me(game).jobId).toBe('guard');
    game.getState().walkTo('mine');
    game.getState().work();
    expect(me(game).money).toBe(inventedPack.startingMoney - 9 + 80);
  });

  it('wears the clothes out after its own number of Weeks and blocks the job', () => {
    const game = gameOfPack();
    game.getState().walkTo('hall');
    game.getState().buyClothes('cloak');
    game.getState().hire('guard');
    const line = () =>
      game.getState().weekendReport!.effects.find((e) => e.id === 'clothing')!
        .text;
    game.getState().endTurn();
    game.getState().endTurn();
    expect(line()).toMatch(/Cloak.*wear out in 1 Week/);
    game.getState().endTurn();
    expect(line()).toMatch(/worn out/);
    game.getState().walkTo('mine');
    game.getState().work();
    expect(game.getState().lastEvent).toMatch(/worn out/i);
  });

  it('feeds from its own food with its own penalty', () => {
    const game = gameOfPack();
    game.getState().walkTo('shop');
    game.getState().buyFood('bread'); // 2 Weeks for $6, 0.5 hours
    expect(me(game)).toMatchObject({ foodWeeks: 2, money: 9 });
    game.getState().endTurn();
    game.getState().endTurn();
    expect(me(game).timeRemaining).toBe(MAX_TIME);
    game.getState().endTurn();
    expect(me(game).timeRemaining).toBe(MAX_TIME - 3);
  });
});

describe('persistence of food and clothes (version 6)', () => {
  it('migrates a version 5 save: a fed Player has one Week of food, and the clothes are new', async () => {
    const { migrate } = useGameStore.persist.getOptions();
    const old = { ...player(), hasEaten: true } as Partial<Player> & {
      hasEaten: boolean;
    };
    delete old.foodWeeks;
    delete old.clothes;
    const migrated = (await migrate?.(
      { currentWeek: 4, players: [old], turnIndex: 0 },
      5,
    )) as { players: (Player & { hasEaten?: boolean })[] };
    expect(migrated.players[0]).toMatchObject({
      foodWeeks: 1,
      clothes: { tierId: defaultPack.clothing.startTierId, weeksWorn: 0 },
    });
    expect(migrated.players[0]).not.toHaveProperty('hasEaten');
  });

  it('migrates a hungry version 5 Player to no food', async () => {
    const { migrate } = useGameStore.persist.getOptions();
    const old = { ...player(), hasEaten: false } as Partial<Player>;
    delete old.foodWeeks;
    const migrated = (await migrate?.({ players: [old], turnIndex: 0 }, 5)) as {
      players: Player[];
    };
    expect(migrated.players[0].foodWeeks).toBe(0);
  });

  it('carries the old fed flag through an older save to the Weeks of food', async () => {
    const { migrate } = useGameStore.persist.getOptions();
    const migrated = (await migrate?.(
      { money: 5, hasEaten: true, currentLocationId: 'apt' },
      1,
    )) as { players: Player[] };
    expect(migrated.players[0].foodWeeks).toBe(1);
  });

  it('saves the Weeks of food and the clothes', () => {
    setPlayer({ foodWeeks: 3 });
    const { state } = JSON.parse(
      localStorage.getItem('jones-mvp-storage') ?? '{}',
    );
    expect(state.players[0]).toMatchObject({
      foodWeeks: 3,
      clothes: { tierId: 'casual', weeksWorn: 0 },
    });
  });
});
