import { create, StateCreator } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  DataPack,
  GameState,
  GameStatus,
  GoalId,
  GoalPoints,
  Player,
  WeekEndReason,
  WeekendEffectId,
} from '@/types';
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
import { defaultPack } from '@/data';
import { LEGACY_LOCATION_IDS } from '@/data/locations';
import { loadPack } from '@/data/loader';
import { walkingCostHours, walkingSteps } from '@/lib/board';
import { allGoalsMet, clampGoalPoints, totalGoalPoints } from '@/lib/goals';
import { createRandom, Random } from '@/lib/random';
import { WEEKEND_EFFECTS } from '@/lib/weekend';

interface GameActions {
  setGoalPoints: (goalId: GoalId, points: number) => void;
  startGame: () => void;
  walkTo: (locationId: string) => void;
  hire: (jobId: string) => void;
  work: () => void;
  dismissWeekendReport: () => void;
  eat: () => void;
  attendClass: () => void;
  endTurn: () => void;
  resetGame: () => void;
}

type GameStore = GameState & GameActions;

export interface GameDeps {
  pack: DataPack;
  // Not used by any rule yet; every random choice must go through it.
  random?: Random;
}

const STORAGE_VERSION = 4;
const DEFAULT_SEED = 1;

// Time is fractional (walks cost a share of a Week); keep it free of float dust.
const roundHours = (hours: number) => Math.round(hours * 1000) / 1000;

// Sets lastEvent and bumps eventSeq so identical messages still re-trigger.
const withEvent = (state: GameState, message: string) => ({
  lastEvent: message,
  eventSeq: state.eventSeq + 1,
});

export const defaultGoalPoints = (pack: DataPack): GoalPoints =>
  Object.fromEntries(
    pack.goals.map((g) => [g.id, g.defaultPoints]),
  ) as GoalPoints;

const newPlayer = (pack: DataPack): Player => ({
  id: 'player-1',
  name: 'You',
  money: pack.startingMoney,
  timeRemaining: MAX_TIME,
  educationLevel: 0,
  hasEaten: false,
  isStarving: false,
  locationId: pack.homeLocationId,
  jobId: null,
  goals: defaultGoalPoints(pack),
  owedRent: 0,
});

const initialState = (pack: DataPack): GameState => ({
  gameStatus: 'setup',
  lastEvent: null,
  eventSeq: 0,
  currentWeek: 1,
  weekendReport: null,
  players: [newPlayer(pack)],
  turnIndex: 0,
});

// Every rule reads and writes the active Player through these.
const activePlayer = (state: GameState): Player =>
  state.players[state.turnIndex];
const patchActive = (state: GameState, patch: Partial<Player>): Player[] =>
  state.players.map((p, i) => (i === state.turnIndex ? { ...p, ...patch } : p));

// The rules, over an injected data pack. Persistence is added by the caller.
const gameStoreCreator =
  ({ pack }: GameDeps): StateCreator<GameStore> =>
  (set, get) => {
    const locationOf = (id: string) => pack.locations.find((l) => l.id === id);

    // Records an event without changing anything else.
    const notify = (message: string) =>
      set((state) => withEvent(state, message));

    // Whether the active Player has won or lost (AC-006). Losing comes first.
    const endStatus = (state: GameState): GameStatus => {
      const player = activePlayer(state);
      if (player.owedRent >= pack.rentOwedLimit) return 'lost';
      return allGoalsMet(pack.goals, player) ? 'won' : 'playing';
    };

    // Ends the active Player's Week. The effects run in the fixed order of
    // WEEKEND_EFFECTS; then the next Turn starts: home, with full Time less any
    // hunger penalty. `intro` begins the event message.
    const rollWeek = (
      state: GameState,
      intro: string,
      reason: WeekEndReason,
    ) => {
      const player = activePlayer(state);
      let currentMoney = player.money;
      let status = state.gameStatus;
      let eventLog = intro;
      const said: Partial<Record<WeekendEffectId, string>> = {};

      // 1. Food: hunger
      const isStarvingNow = !player.hasEaten;
      if (isStarvingNow) {
        said.food = 'You are starving! Less time next week.';
        eventLog += 'You are starving! Less time next week. ';
      }

      // 2. Clothing wear: not built yet.

      // 3. Rent due (every 4th week: 4, 8, 12...)
      if (state.currentWeek % RENT_INTERVAL === 0) {
        currentMoney -= RENT_COST;
        said.rent = `Rent paid (-$${RENT_COST}).`;
        eventLog += `Rent Paid (-${RENT_COST}). `;

        if (currentMoney < 0) {
          status = 'lost';
          said.rent += ' You could not afford it: evicted!';
          eventLog = 'Evicted! Game Over.';
        }
      }

      // 4. Inflation step and 5. newspaper: not built yet.

      // Next Turn: full Time (less the hunger penalty), back at home.
      const nextMaxTime = isStarvingNow
        ? MAX_TIME - STARVATION_TIME_PENALTY
        : MAX_TIME;

      const players = patchActive(state, {
        timeRemaining: nextMaxTime,
        money: currentMoney,
        hasEaten: false,
        isStarving: isStarvingNow,
        locationId: pack.homeLocationId,
      });
      if (status === 'playing') status = endStatus({ ...state, players });

      return {
        // A game that ended keeps the Week it ended in (the Weeks played).
        currentWeek:
          status === 'playing' ? state.currentWeek + 1 : state.currentWeek,
        players,
        gameStatus: status,
        weekendReport: {
          week: state.currentWeek,
          reason,
          effects: WEEKEND_EFFECTS.map(({ id }) => ({
            id,
            text: said[id] ?? null,
          })),
          cash: currentMoney,
        },
        ...withEvent(state, eventLog),
      };
    };

    // Applies what an action changed. If it used the last of the Player's
    // Time, the Week ends at once. `message` is the action's own event text.
    const settle = (
      state: GameState,
      next: Partial<GameState>,
      message: string | null = null,
    ) => {
      const after = { ...state, ...next };
      const status = endStatus(after);
      if (status !== 'playing' || activePlayer(after).timeRemaining > 0) {
        return {
          ...next,
          gameStatus: status,
          ...(message ? withEvent(state, message) : {}),
        };
      }
      return rollWeek(
        after,
        message ? `${message} Time is up. ` : 'Time is up. ',
        'time',
      );
    };

    return {
      ...initialState(pack),

      setGoalPoints: (goalId, points) => {
        const state = get();
        if (state.gameStatus !== 'setup') return;
        const goals = activePlayer(state).goals;
        if (!(goalId in goals)) return;
        set((s) => ({
          players: patchActive(s, {
            goals: {
              ...goals,
              [goalId]: clampGoalPoints(
                goals,
                goalId,
                points,
                pack.goalPointsBudget,
              ),
            },
          }),
        }));
      },

      startGame: () => {
        const state = get();
        if (state.gameStatus !== 'setup') return;
        // With no points at all every Goal is met and the game would end at
        // once, so at least one Goal needs a point.
        if (totalGoalPoints(activePlayer(state).goals) === 0) {
          notify('Put at least one Goal point on a Goal to start.');
          return;
        }
        set({ gameStatus: 'playing' });
      },

      walkTo: (targetLocationId) => {
        const state = get();
        if (state.gameStatus !== 'playing') return;
        const player = activePlayer(state);
        if (player.locationId === targetLocationId) return;
        const target = locationOf(targetLocationId);
        const steps = walkingSteps(
          pack.layout,
          player.locationId,
          targetLocationId,
        );
        if (!target || steps === null) return;

        if (target.closed) {
          notify(`${target.name} is closed.`);
          return;
        }

        const cost = walkingCostHours(pack.walkingCosts, steps, MAX_TIME);
        if (player.timeRemaining < cost) {
          // The walk starts, time runs out on the road, and the Player wakes
          // up at home in the next Week.
          set((s) =>
            rollWeek(s, 'You ran out of time on the way home. ', 'road'),
          );
          return;
        }

        set((s) =>
          settle(s, {
            players: patchActive(s, {
              locationId: targetLocationId,
              timeRemaining: roundHours(activePlayer(s).timeRemaining - cost),
            }),
            lastEvent: null,
          }),
        );
      },

      hire: (jobId) => {
        const state = get();
        if (state.gameStatus !== 'playing') return;
        const player = activePlayer(state);

        const job = pack.jobs.find((j) => j.id === jobId);
        if (!job) return;
        if (locationOf(player.locationId)?.type !== 'employment') {
          notify('You can only get hired at an employment office.');
          return;
        }
        if (player.educationLevel < job.educationRequired) {
          notify(
            `Requires education level ${job.educationRequired} to work as ${job.title}.`,
          );
          return;
        }
        if (player.jobId === jobId) {
          notify(`You already work as ${job.title}.`);
          return;
        }

        set((s) => ({
          players: patchActive(s, { jobId }),
          ...withEvent(
            s,
            `Hired as ${job.title} at ${locationOf(job.locationId)?.name ?? 'work'}.`,
          ),
        }));
      },

      work: () => {
        const state = get();
        if (state.gameStatus !== 'playing') return;
        const { timeRemaining, locationId, jobId } = activePlayer(state);

        const job = pack.jobs.find((j) => j.id === jobId);
        if (!job) {
          notify('You have no job. Get hired at an employment office.');
          return;
        }
        if (locationId !== job.locationId) {
          notify(
            `You must be at ${locationOf(job.locationId)?.name ?? 'work'} to work.`,
          );
          return;
        }
        if (timeRemaining < job.workTimeHours) {
          notify('Not enough time to work!');
          return;
        }

        set((s) => {
          const player = activePlayer(s);
          const earned = job.wage * job.shiftHours;
          const newMoney = player.money + earned;

          return settle(
            s,
            {
              players: patchActive(s, {
                money: newMoney,
                timeRemaining: roundHours(
                  player.timeRemaining - job.workTimeHours,
                ),
              }),
            },
            `Worked a ${job.shiftHours}-hour shift as ${job.title}. Earned $${earned}.`,
          );
        });
      },

      eat: () => {
        const state = get();
        if (state.gameStatus !== 'playing') return;
        const { money, timeRemaining, hasEaten, locationId } =
          activePlayer(state);
        if (locationOf(locationId)?.type !== 'store') return;
        if (hasEaten) {
          notify('You already ate this week.');
          return;
        }
        if (money < FOOD_COST || timeRemaining < MEAL_HOURS) {
          notify("Can't afford food or no time!");
          return;
        }

        set((s) => {
          const player = activePlayer(s);
          return settle(
            s,
            {
              players: patchActive(s, {
                money: player.money - FOOD_COST,
                hasEaten: true,
                isStarving: false,
                timeRemaining: roundHours(player.timeRemaining - MEAL_HOURS),
              }),
            },
            'You ate a meal. Hunger satisfied.',
          );
        });
      },

      attendClass: () => {
        const state = get();
        if (state.gameStatus !== 'playing') return;
        const { money, timeRemaining, locationId } = activePlayer(state);
        if (locationOf(locationId)?.type !== 'education') return;
        if (money < TUITION_COST || timeRemaining < CLASS_HOURS) {
          notify(`Need $${TUITION_COST} and ${CLASS_HOURS} hours for school.`);
          return;
        }

        set((s) => {
          const player = activePlayer(s);
          return settle(
            s,
            {
              players: patchActive(s, {
                money: player.money - TUITION_COST,
                timeRemaining: roundHours(player.timeRemaining - CLASS_HOURS),
                educationLevel: player.educationLevel + 1,
              }),
            },
            'Education Level Increased! You can now apply for better jobs.',
          );
        });
      },

      endTurn: () => {
        if (get().gameStatus !== 'playing') return;
        set((state) => rollWeek(state, 'Week Ended. ', 'ended'));
      },

      dismissWeekendReport: () => set({ weekendReport: null }),

      // Keeps eventSeq so a toast from the previous game is never re-shown.
      resetGame: () =>
        set((state) => ({ ...initialState(pack), eventSeq: state.eventSeq })),
    };
  };

// A store over any data pack, validated on load. Not persisted.
export const createGameStore = (deps: GameDeps) => {
  const pack = loadPack(deps.pack);
  return create<GameStore>()(
    gameStoreCreator({
      pack,
      random: deps.random ?? createRandom(DEFAULT_SEED),
    }),
  );
};

const gamePack = loadPack(defaultPack);

export const useGameStore = create<GameStore>()(
  persist(gameStoreCreator({ pack: gamePack }), {
    name: 'jones-mvp-storage',
    version: STORAGE_VERSION,
    storage: createJSONStorage(() => localStorage),
    // Hydrate from the client after mount (see StoreHydrator) so the first
    // client render matches the server-rendered HTML.
    skipHydration: true,
    partialize: (state) => ({
      currentWeek: state.currentWeek,
      weekendReport: state.weekendReport,
      gameStatus: state.gameStatus,
      players: state.players,
      turnIndex: state.turnIndex,
    }),
    migrate: (persisted, version) => {
      const state = { ...(persisted as Record<string, unknown>) };
      // v0 stored currentJobId, which nothing ever read.
      if (version < 1) delete state.currentJobId;
      // v1 kept the Player's stats at the top level of the save.
      if (version < 2) {
        const fresh = newPlayer(gamePack);
        const old = state as Partial<Player> & { currentLocationId?: string };
        const locationId =
          LEGACY_LOCATION_IDS[old.currentLocationId ?? ''] ??
          old.currentLocationId;
        const known = gamePack.locations.some((l) => l.id === locationId);
        const player: Player = {
          ...fresh,
          money: old.money ?? fresh.money,
          timeRemaining: old.timeRemaining ?? fresh.timeRemaining,
          educationLevel: old.educationLevel ?? fresh.educationLevel,
          hasEaten: old.hasEaten ?? fresh.hasEaten,
          isStarving: old.isStarving ?? fresh.isStarving,
          locationId: known ? (locationId as string) : fresh.locationId,
        };
        for (const key of [
          'money',
          'timeRemaining',
          'educationLevel',
          'hasEaten',
          'isStarving',
          'currentLocationId',
        ]) {
          delete state[key];
        }
        state.players = [player];
        state.turnIndex = 0;
      }
      // v3 added the Player's job and the pending weekend report.
      if (version < 3) {
        state.players = (state.players as Player[]).map((p) => ({
          ...p,
          jobId: p.jobId ?? null,
        }));
        state.weekendReport = null;
      }
      // v4 added Goals and owed rent, and a setup screen before play. A game
      // saved mid-play goes back through setup, keeping its progress.
      if (version < 4) {
        state.players = (state.players as Player[]).map((p) => ({
          ...p,
          goals: p.goals ?? defaultGoalPoints(gamePack),
          owedRent: p.owedRent ?? 0,
        }));
        if (state.gameStatus === 'playing') state.gameStatus = 'setup';
      }
      return state as never;
    },
  }),
);
