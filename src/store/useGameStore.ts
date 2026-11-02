import { create, StateCreator } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { DataPack, GameState, Player } from '@/types';
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
import { defaultPack } from '@/data';
import { LEGACY_LOCATION_IDS } from '@/data/locations';
import { loadPack } from '@/data/loader';
import { walkingCostHours, walkingSteps } from '@/lib/board';
import { createRandom, Random } from '@/lib/random';

interface GameActions {
  walkTo: (locationId: string) => void;
  work: (jobId: string, hours: number) => void;
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

const STORAGE_VERSION = 2;
const DEFAULT_SEED = 1;

// Time is fractional (walks cost a share of a Week); keep it free of float dust.
const roundHours = (hours: number) => Math.round(hours * 1000) / 1000;

// Sets lastEvent and bumps eventSeq so identical messages still re-trigger.
const withEvent = (state: GameState, message: string) => ({
  lastEvent: message,
  eventSeq: state.eventSeq + 1,
});

const newPlayer = (pack: DataPack): Player => ({
  id: 'player-1',
  name: 'You',
  money: STARTING_MONEY,
  timeRemaining: MAX_TIME,
  educationLevel: 0,
  hasEaten: false,
  isStarving: false,
  locationId: pack.homeLocationId,
});

const initialState = (pack: DataPack): GameState => ({
  gameStatus: 'playing',
  lastEvent: null,
  eventSeq: 0,
  currentWeek: 1,
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

    // Ends the active Player's Week: hunger, rent, then a fresh Week of Time.
    // `sendHome` is for a Week cut short on the road.
    const rollWeek = (state: GameState, intro: string, sendHome: boolean) => {
      const player = activePlayer(state);
      let currentMoney = player.money;
      let status = state.gameStatus;
      let eventLog = intro;

      // 1. Hunger Logic
      const isStarvingNow = !player.hasEaten;
      if (isStarvingNow) eventLog += 'You are starving! Less time next week. ';

      // 2. Rent Logic (Every 4th week: 4, 8, 12...)
      if (state.currentWeek % RENT_INTERVAL === 0) {
        currentMoney -= RENT_COST;
        eventLog += `Rent Paid (-${RENT_COST}). `;

        if (currentMoney < 0) {
          status = 'lost';
          eventLog = 'Evicted! Game Over.';
        }
      }

      // 3. Reset Time (Penalty if starving)
      const nextMaxTime = isStarvingNow
        ? MAX_TIME - STARVATION_TIME_PENALTY
        : MAX_TIME;

      return {
        currentWeek: state.currentWeek + 1,
        players: patchActive(state, {
          timeRemaining: nextMaxTime,
          money: currentMoney,
          hasEaten: false,
          isStarving: isStarvingNow,
          ...(sendHome ? { locationId: pack.homeLocationId } : {}),
        }),
        gameStatus: status,
        ...withEvent(state, eventLog),
      };
    };

    return {
      ...initialState(pack),

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
            rollWeek(s, 'You ran out of time on the way home. ', true),
          );
          return;
        }

        set((s) => ({
          players: patchActive(s, {
            locationId: targetLocationId,
            timeRemaining: roundHours(activePlayer(s).timeRemaining - cost),
          }),
          lastEvent: null,
        }));
      },

      work: (jobId, hours) => {
        const state = get();
        if (state.gameStatus !== 'playing') return;
        const { timeRemaining, locationId, educationLevel } =
          activePlayer(state);

        const job = pack.jobs.find((j) => j.id === jobId);
        if (!job) return;
        if (!Number.isInteger(hours) || hours <= 0) return;

        if (educationLevel < job.educationRequired) {
          notify(
            `Requires education level ${job.educationRequired} to work as ${job.title}.`,
          );
          return;
        }
        if (locationId !== job.locationId) {
          notify(
            `You must be at ${locationOf(job.locationId)?.name ?? 'work'} to work.`,
          );
          return;
        }
        if (timeRemaining < hours) {
          notify('Not enough time to work!');
          return;
        }

        set((s) => {
          const player = activePlayer(s);
          const earned = job.wage * hours;
          const newMoney = player.money + earned;
          const isWin = newMoney >= WIN_MONEY && jobId === WIN_JOB_ID;

          return {
            players: patchActive(s, {
              money: newMoney,
              timeRemaining: roundHours(player.timeRemaining - hours),
            }),
            gameStatus: isWin ? 'won' : 'playing',
            ...withEvent(
              s,
              `Worked ${hours} hrs as ${job.title}. Earned ${earned}.`,
            ),
          };
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
          return {
            players: patchActive(s, {
              money: player.money - FOOD_COST,
              hasEaten: true,
              isStarving: false,
              timeRemaining: roundHours(player.timeRemaining - MEAL_HOURS),
            }),
            ...withEvent(s, 'You ate a meal. Hunger satisfied.'),
          };
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
          return {
            players: patchActive(s, {
              money: player.money - TUITION_COST,
              timeRemaining: roundHours(player.timeRemaining - CLASS_HOURS),
              educationLevel: player.educationLevel + 1,
            }),
            ...withEvent(
              s,
              'Education Level Increased! You can now apply for better jobs.',
            ),
          };
        });
      },

      endTurn: () => {
        if (get().gameStatus !== 'playing') return;
        set((state) => rollWeek(state, 'Week Ended. ', false));
      },

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
      return state as never;
    },
  }),
);
