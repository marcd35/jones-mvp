import type { DataPack, GameState, Job, Player } from '@/types';
import { MAX_TIME } from '@/lib/constants';
import { walkingCostHours, walkingSteps } from '@/lib/board';
import { clothesState } from '@/lib/clothing';
import { goalTarget, isGoalMet } from '@/lib/goals';
import { householdStockForWeek } from '@/lib/household-goods';
import { scalePrice } from '@/lib/inflation';

// One store action a policy asks for. The harness applies it through the
// store's public actions, exactly as the UI would.
export type PolicyAction =
  | { kind: 'walkTo'; locationId: string }
  | { kind: 'hire'; jobId: string }
  | { kind: 'work' }
  | { kind: 'buyFood'; goodId: string }
  | { kind: 'buyClothes'; tierId: string }
  | { kind: 'buyHouseholdGood'; goodId: string }
  | { kind: 'enrollCourse'; courseId: string }
  | { kind: 'attendClass' }
  | { kind: 'payRent' }
  | { kind: 'payRentBalance' }
  | { kind: 'endTurn' };

// A policy looks at the game and picks the next action. It must be a pure
// function of the state so a seed always replays the same game.
export type Policy = (state: GameState, pack: DataPack) => PolicyAction;

export type PolicyId = 'sensible' | 'careless';

// The rules of each policy in plain words, for the report.
export const POLICY_RULES: Record<PolicyId, string[]> = {
  sensible: [
    'Food: when no Weeks of food are left, walk to Black’s Market and buy the largest food pack it can afford (4, 2 or 1 Weeks).',
    'Clothing: when its clothes are about to wear out (or are worn out), buy Casual Clothes at QT Clothing.',
    'Rent: in a Week when rent is due, pay it at the Rent Office as soon as it has the cash; when an owed balance exists and the office is open, clear it if the cash is above its reserve.',
    'Cash reserve: keeps back one rent payment plus a 4-Week food pack plus one set of Casual Clothes, at the current price level. Only household goods and course fees are bought from cash above the reserve.',
    'Job: applies at the Employment Office for the best job it qualifies for. While its Career Goal is unmet it prefers the best-paying job at or above the target rung; if none is open to it yet, it picks the target-rung job with the smallest gap (missing education levels count far more than missing experience) and works towards that (the entry job of that Career for experience, courses for education). Otherwise it takes the best advertised wage, and changes job only for a higher advertised wage than the one it holds.',
    'Education: while the Education Goal (or the chosen career plan) needs a higher level, enrolls in the next course on its path (technical unless a plan needs college) and attends classes, but only while its cash covers the reserve; otherwise it works.',
    'Happiness: while the Happiness Goal is unmet, buys the in-stock, not-yet-owned household good with the lowest price per happiness point that it can afford above the reserve.',
    'Wealth: every hour not needed above is spent working its job.',
    'Time: never starts a walk it cannot finish; keeps enough Time for a pending essential errand before taking another shift; ends the Week when nothing useful fits in the Time left.',
  ],
  careless: [
    'Takes the first entry job in the data (Cook at Monolith Burger) and works every shift it can.',
    'Never buys food, clothes or household goods, never pays rent, and never studies.',
  ],
};

type Errand = {
  locationId: string;
  hours: number; // Time the action itself takes
  action: PolicyAction;
};

const player = (state: GameState): Player => state.players[state.turnIndex];

const walkHours = (pack: DataPack, from: string, to: string) => {
  if (from === to) return 0;
  const steps = walkingSteps(pack.layout, from, to);
  return steps === null
    ? Infinity
    : walkingCostHours(pack.walkingCosts, steps, MAX_TIME);
};

const goalDef = (pack: DataPack, id: string) =>
  pack.goals.find((g) => g.id === id)!;

const goalUnmet = (state: GameState, pack: DataPack, id: string) =>
  !isGoalMet(goalDef(pack, id), player(state), {
    pack,
    priceLevel: state.priceLevel,
  });

const price = (state: GameState, base: number) =>
  scalePrice(base, state.priceLevel);

// Whether the Player meets a job's hiring checks (as the store's hire() does).
const qualifies = (p: Player, job: Job) =>
  p.educationLevel >= job.educationRequired &&
  (job.educationPathRequired === undefined ||
    p.educationPath === job.educationPathRequired) &&
  (p.careerExperience[job.careerId] ?? 0) >= job.experienceRequired;

const byWage = (a: Job, b: Job) => b.wage - a.wage || a.rung - b.rung;

const reserve = (state: GameState, pack: DataPack) => {
  const rent = pack.rent.homeAmounts[pack.homeLocationId];
  const food = Math.max(...pack.food.goods.map((g) => g.basePrice));
  const clothes = pack.clothing.tiers.find(
    (t) => t.id === pack.clothing.startTierId,
  )!.basePrice;
  return rent + price(state, food) + price(state, clothes);
};

interface CareerPlan {
  job: Job | null; // The job to hold now
  educationLevel: number; // The education level the plan needs
  educationPath: Player['educationPath']; // The path the plan needs, if any
}

// The job to hold and the education it needs (see POLICY_RULES.sensible).
const careerPlan = (state: GameState, pack: DataPack): CareerPlan => {
  const p = player(state);
  const eligible = pack.jobs.filter((j) => qualifies(p, j)).sort(byWage);
  const best = eligible[0] ?? null;
  const careerPoints = p.goals.career;
  if (careerPoints === 0) {
    return { job: best, educationLevel: 0, educationPath: null };
  }
  const targetRung = goalTarget(goalDef(pack, 'career'), careerPoints);
  if (p.highestRung >= targetRung) {
    return { job: best, educationLevel: 0, educationPath: null };
  }
  const atTarget = eligible.filter((j) => j.rung >= targetRung);
  if (atTarget.length > 0) {
    return { job: atTarget[0], educationLevel: 0, educationPath: null };
  }
  // No target-rung job is open yet: work towards the nearest one.
  const gaps = pack.jobs
    .filter((j) => j.rung >= targetRung)
    .filter(
      (j) =>
        j.educationPathRequired === undefined ||
        p.educationPath === null ||
        p.educationPath === j.educationPathRequired,
    )
    .map((j) => {
      const educationGap = Math.max(0, j.educationRequired - p.educationLevel);
      const experienceGap =
        (p.careerExperience[j.careerId] ?? 0) < j.experienceRequired;
      return { job: j, cost: educationGap * 10 + (experienceGap ? 1 : 0) };
    })
    .sort((a, b) => a.cost - b.cost || byWage(a.job, b.job));
  const goal = gaps[0]?.job;
  if (!goal) return { job: best, educationLevel: 0, educationPath: null };
  const educationLevel = goal.educationRequired;
  const educationPath = goal.educationPathRequired ?? null;
  const needsExperience =
    (p.careerExperience[goal.careerId] ?? 0) < goal.experienceRequired;
  if (needsExperience && p.educationLevel >= educationLevel) {
    const inCareer = eligible.filter((j) => j.careerId === goal.careerId);
    if (inCareer.length > 0) {
      return { job: inCareer[0], educationLevel, educationPath };
    }
  }
  return { job: best, educationLevel, educationPath };
};

// The next course the Player should take to reach `level`, or null.
const nextCourse = (
  p: Player,
  pack: DataPack,
  level: number,
  path: Player['educationPath'],
) => {
  if (p.educationLevel >= level) return null;
  const onPath = p.educationPath ?? path ?? 'technical';
  return (
    pack.education.courses.find(
      (c) =>
        c.level === p.educationLevel + 1 &&
        c.path === onPath &&
        !p.completedCourseIds.includes(c.id),
    ) ?? null
  );
};

// Errands that keep the essentials going, most urgent first. Each is either
// affordable now or reported as pending, so work can pay for it.
const essentialErrands = (
  state: GameState,
  pack: DataPack,
): { ready: Errand[]; pending: Errand[] } => {
  const p = player(state);
  const ready: Errand[] = [];
  const pending: Errand[] = [];

  if (p.foodWeeks <= 0) {
    const packs = pack.food.goods
      .filter((g) => g.locationId === 'blacks-market')
      .sort((a, b) => b.weeks - a.weeks);
    const affordable = packs.find((g) => p.money >= price(state, g.basePrice));
    const good = affordable ?? packs[packs.length - 1];
    const errand: Errand = {
      locationId: good.locationId,
      hours: good.timeHours,
      action: { kind: 'buyFood', goodId: good.id },
    };
    (affordable ? ready : pending).push(errand);
  }

  const wear = clothesState(pack.clothing, p.clothes);
  if (wear === 'warning' || wear === 'worn' || wear === 'none') {
    const tier = pack.clothing.tiers.find(
      (t) => t.id === pack.clothing.startTierId,
    )!;
    const errand: Errand = {
      locationId: pack.clothing.locationId,
      hours: 0,
      action: { kind: 'buyClothes', tierId: tier.id },
    };
    (p.money >= price(state, tier.basePrice) ? ready : pending).push(errand);
  }

  if (state.currentWeek >= p.rentDueWeek) {
    const errand: Errand = {
      locationId: pack.rent.locationId,
      hours: 0,
      action: { kind: 'payRent' },
    };
    const amount = pack.rent.homeAmounts[pack.homeLocationId];
    (p.money >= amount ? ready : pending).push(errand);
  }

  return { ready, pending };
};

// Goods worth buying now: in stock, not owned, affordable above the reserve.
const goodsErrand = (state: GameState, pack: DataPack): Errand | null => {
  if (!goalUnmet(state, pack, 'happiness')) return null;
  const p = player(state);
  const spare = p.money - reserve(state, pack);
  const stores = [
    ...new Set(pack.householdGoods.goods.map((g) => g.locationId)),
  ];
  const candidates = stores
    .flatMap((id) =>
      householdStockForWeek(pack, state.currentWeek, state.priceSeed, id),
    )
    .filter((g) => !p.ownedGoods.includes(g.id) && g.happinessPoints > 0)
    .filter((g) => price(state, g.basePrice) <= spare)
    .sort(
      (a, b) =>
        a.basePrice / a.happinessPoints - b.basePrice / b.happinessPoints ||
        a.basePrice - b.basePrice,
    );
  const good = candidates[0];
  if (!good) return null;
  return {
    locationId: good.locationId,
    hours: 0,
    action: { kind: 'buyHouseholdGood', goodId: good.id },
  };
};

// Walks to the errand, or does it on arrival, if the Time allows.
const runErrand = (
  state: GameState,
  pack: DataPack,
  errand: Errand,
): PolicyAction | null => {
  const p = player(state);
  if (p.locationId === errand.locationId) {
    return p.timeRemaining >= errand.hours ? errand.action : null;
  }
  const walk = walkHours(pack, p.locationId, errand.locationId);
  // Arrive with enough Time left to act (an action that needs no Time still
  // needs the Player to arrive before the Week ends).
  if (p.timeRemaining - walk >= Math.max(errand.hours, 0.001)) {
    return { kind: 'walkTo', locationId: errand.locationId };
  }
  return null;
};

export const sensiblePolicy: Policy = (state, pack) => {
  const p = player(state);
  const { ready, pending } = essentialErrands(state, pack);

  for (const errand of ready) {
    const action = runErrand(state, pack, errand);
    if (action) return action;
  }

  // Clear an owed balance while the office is open, from cash above reserve.
  if (
    state.currentWeek >= p.rentDueWeek &&
    p.owedRent > 0 &&
    p.money - p.owedRent >= reserve(state, pack)
  ) {
    const action = runErrand(state, pack, {
      locationId: pack.rent.locationId,
      hours: 0,
      action: { kind: 'payRentBalance' },
    });
    if (action) return action;
  }

  const plan = careerPlan(state, pack);
  const current = pack.jobs.find((j) => j.id === p.jobId) ?? null;
  if (plan.job && plan.job.id !== p.jobId) {
    const advertised = price(state, plan.job.wage);
    const careerMove =
      p.goals.career > 0 &&
      p.highestRung < goalTarget(goalDef(pack, 'career'), p.goals.career) &&
      (plan.job.rung >= goalTarget(goalDef(pack, 'career'), p.goals.career) ||
        plan.job.careerId !== current?.careerId);
    if (!current || careerMove || advertised > (p.heldWage ?? 0)) {
      const employment = pack.locations.find((l) => l.type === 'employment');
      if (employment) {
        const action = runErrand(state, pack, {
          locationId: employment.id,
          hours: 0,
          action: { kind: 'hire', jobId: plan.job.id },
        });
        if (action) return action;
      }
    }
  }

  const goods = goodsErrand(state, pack);
  if (goods) {
    const action = runErrand(state, pack, goods);
    if (action) return action;
  }

  // Study when the Education Goal or the career plan needs it and the cash
  // covers the reserve.
  const educationTarget = goalUnmet(state, pack, 'education')
    ? goalTarget(goalDef(pack, 'education'), p.goals.education)
    : 0;
  const level = Math.max(educationTarget, plan.educationLevel);
  const course = p.enrolledCourseId
    ? (pack.education.courses.find((c) => c.id === p.enrolledCourseId) ?? null)
    : nextCourse(p, pack, level, plan.educationPath);
  const cashOk = p.money >= reserve(state, pack);
  if (course && cashOk && pending.length === 0) {
    const enrolled = p.enrolledCourseId !== null;
    const fee = price(state, pack.education.enrollmentFee);
    if (enrolled || p.money - fee >= reserve(state, pack)) {
      const action = runErrand(state, pack, {
        locationId: pack.education.locationId,
        hours: enrolled
          ? course.classTimeHours
          : pack.education.enrollmentTimeHours,
        action: enrolled
          ? { kind: 'attendClass' }
          : { kind: 'enrollCourse', courseId: course.id },
      });
      if (action) return action;
    }
  }

  // Work, keeping Time for the most urgent pending essential.
  if (current) {
    const keep = pending[0]
      ? walkHours(pack, current.locationId, pending[0].locationId) +
        Math.max(pending[0].hours, 0.001)
      : 0;
    const walk = walkHours(pack, p.locationId, current.locationId);
    if (p.timeRemaining - walk - current.workTimeHours >= keep) {
      return p.locationId === current.locationId
        ? { kind: 'work' }
        : { kind: 'walkTo', locationId: current.locationId };
    }
  }

  // Out of shifts: do a pending essential if it is now affordable, or end.
  for (const errand of pending) {
    const action = runErrand(state, pack, errand);
    if (action) return action;
  }
  return { kind: 'endTurn' };
};

export const carelessPolicy: Policy = (state, pack) => {
  const p = player(state);
  const job = pack.jobs.find((j) => j.rung === 1 && qualifies(p, j))!;
  if (p.jobId === null) {
    const employment = pack.locations.find((l) => l.type === 'employment')!;
    const action = runErrand(state, pack, {
      locationId: employment.id,
      hours: 0,
      action: { kind: 'hire', jobId: job.id },
    });
    return action ?? { kind: 'endTurn' };
  }
  const held = pack.jobs.find((j) => j.id === p.jobId)!;
  const walk = walkHours(pack, p.locationId, held.locationId);
  if (
    clothesState(pack.clothing, p.clothes) !== 'worn' &&
    p.timeRemaining - walk >= held.workTimeHours
  ) {
    return p.locationId === held.locationId
      ? { kind: 'work' }
      : { kind: 'walkTo', locationId: held.locationId };
  }
  return { kind: 'endTurn' };
};

export const POLICIES: Record<PolicyId, Policy> = {
  sensible: sensiblePolicy,
  careless: carelessPolicy,
};
