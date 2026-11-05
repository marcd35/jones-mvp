import type { DataPack, GameState, GoalId, GoalPoints } from '@/types';
import { createGameStore } from '@/store/useGameStore';
import { createRandom } from '@/lib/random';
import { goalMeasure, netWorth } from '@/lib/goals';
import { POLICIES, type PolicyAction, type PolicyId } from './policies';

// T-15b (#45): deterministic balance scenarios over the real store.

export type ProfileId = 'primary' | 'stress';

export const PROFILES: Record<ProfileId, GoalPoints> = {
  primary: { wealth: 50, happiness: 50, education: 50, career: 50 },
  stress: { wealth: 50, happiness: 0, education: 0, career: 150 },
};

// Evaluation seeds, shared by every policy and profile.
export const EVALUATION_SEEDS = Array.from({ length: 100 }, (_, i) => i + 1);
// The only seeds the sensible policy was developed and tuned on.
export const DEV_SEEDS = Array.from({ length: 20 }, (_, i) => i + 1001);

// A run that reaches the end of this Week still playing is a timeout.
export const WEEK_CAP = 52;
// Guards against a policy that never ends a Week.
const MAX_ACTIONS_PER_WEEK = 500;

export type Outcome = 'won' | 'lost' | 'timeout';

export interface RunResult {
  seed: number;
  policy: PolicyId;
  profile: ProfileId;
  outcome: Outcome;
  endingWeek: number;
  lossReason: string | null;
  goals: GoalPoints; // The Goal points the game actually started with
  final: {
    jobId: string | null;
    money: number;
    netWorth: number;
    owedRent: number;
    measures: Record<GoalId, number>;
  };
}

const GOAL_ORDER: GoalId[] = ['wealth', 'happiness', 'education', 'career'];

type Store = ReturnType<typeof createGameStore>;

const apply = (store: Store, action: PolicyAction) => {
  const s = store.getState();
  switch (action.kind) {
    case 'walkTo':
      return s.walkTo(action.locationId);
    case 'hire':
      return s.hire(action.jobId);
    case 'work':
      return s.work();
    case 'buyFood':
      return s.buyFood(action.goodId);
    case 'buyClothes':
      return s.buyClothes(action.tierId);
    case 'buyHouseholdGood':
      return s.buyHouseholdGood(action.goodId);
    case 'enrollCourse':
      return s.enrollCourse(action.courseId);
    case 'attendClass':
      return s.attendClass();
    case 'payRent':
      return s.payRent();
    case 'payRentBalance':
      return s.payRentBalance();
    case 'endTurn':
      return s.endTurn();
  }
};

const lossReason = (state: GameState, pack: DataPack) =>
  state.players[state.turnIndex].owedRent >= pack.rentOwedLimit
    ? 'rent owed limit'
    : 'unknown';

// Plays one game headless: setup with the profile's Goal points, then the
// policy's actions until a win, a loss or the Week cap.
export function runGame(
  pack: DataPack,
  seed: number,
  policyId: PolicyId,
  profileId: ProfileId,
): RunResult {
  const store = createGameStore({ pack, random: createRandom(seed) });
  const points = PROFILES[profileId];
  // Lower Goals first so a raised one always fits the budget.
  const order = [...GOAL_ORDER].sort((a, b) => points[a] - points[b]);
  for (const id of order) store.getState().setGoalPoints(id, points[id]);
  store.getState().startGame();

  const policy = POLICIES[policyId];
  let actions = 0;
  let week = store.getState().currentWeek;
  while (
    store.getState().gameStatus === 'playing' &&
    store.getState().currentWeek <= WEEK_CAP
  ) {
    const before = store.getState();
    apply(store, policy(before, pack));
    const after = store.getState();
    // An action that changed nothing (a refusal) ends the Week, so a policy
    // can never loop on it.
    if (
      after.players === before.players &&
      after.currentWeek === before.currentWeek &&
      after.gameStatus === before.gameStatus
    ) {
      after.endTurn();
    }
    if (store.getState().currentWeek !== week) {
      week = store.getState().currentWeek;
      actions = 0;
    } else if (++actions > MAX_ACTIONS_PER_WEEK) {
      store.getState().endTurn();
    }
  }

  const state = store.getState();
  const p = state.players[state.turnIndex];
  const outcome: Outcome =
    state.gameStatus === 'won'
      ? 'won'
      : state.gameStatus === 'lost'
        ? 'lost'
        : 'timeout';
  const context = { pack, priceLevel: state.priceLevel };
  return {
    seed,
    policy: policyId,
    profile: profileId,
    outcome,
    endingWeek: outcome === 'timeout' ? WEEK_CAP : state.currentWeek,
    lossReason: outcome === 'lost' ? lossReason(state, pack) : null,
    goals: p.goals,
    final: {
      jobId: p.jobId,
      money: p.money,
      netWorth: netWorth(p, pack, state.priceLevel),
      owedRent: p.owedRent,
      measures: Object.fromEntries(
        GOAL_ORDER.map((id) => [id, goalMeasure(id, p, context)]),
      ) as Record<GoalId, number>,
    },
  };
}

export interface RunSet {
  policy: PolicyId;
  profile: ProfileId;
  runs: RunResult[];
}

export const runSet = (
  pack: DataPack,
  seeds: number[],
  policy: PolicyId,
  profile: ProfileId,
): RunSet => ({
  policy,
  profile,
  runs: seeds.map((seed) => runGame(pack, seed, policy, profile)),
});

export const RUN_SETS: { policy: PolicyId; profile: ProfileId }[] = [
  { policy: 'sensible', profile: 'primary' },
  { policy: 'careless', profile: 'primary' },
  { policy: 'sensible', profile: 'stress' },
  { policy: 'careless', profile: 'stress' },
];
