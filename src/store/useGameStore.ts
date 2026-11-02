import { create, StateCreator } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { GameState } from '@/types';
import {
  CLASS_HOURS,
  FOOD_COST,
  JOBS,
  LOCATIONS,
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

interface GameActions {
  movePlayer: (locationId: string) => void;
  work: (jobId: string, hours: number) => void;
  eat: () => void;
  attendClass: () => void;
  endTurn: () => void;
  resetGame: () => void;
}

const INITIAL_STATE: GameState = {
  gameStatus: 'playing',
  lastEvent: null,
  eventSeq: 0,
  money: STARTING_MONEY,
  currentWeek: 1,
  timeRemaining: MAX_TIME,
  educationLevel: 0,
  hasEaten: false,
  isStarving: false,
  currentLocationId: 'apt',
};

const STORAGE_VERSION = 1;

// Sets lastEvent and bumps eventSeq so identical messages still re-trigger.
const withEvent = (state: GameState, message: string) => ({
  lastEvent: message,
  eventSeq: state.eventSeq + 1,
});

const gameStoreCreator: StateCreator<
  GameState & GameActions,
  [['zustand/persist', unknown]]
> = (set, get) => {
  // Records an event without changing anything else.
  const notify = (message: string) => set((state) => withEvent(state, message));

  return {
    ...INITIAL_STATE,

    movePlayer: (targetLocationId) => {
      const { gameStatus, timeRemaining, currentLocationId } = get();
      if (gameStatus !== 'playing') return;
      if (currentLocationId === targetLocationId) return;
      if (!LOCATIONS.some((l) => l.id === targetLocationId)) return;

      if (timeRemaining < TRAVEL_COST) {
        notify('Not enough time to travel!');
        return;
      }

      set((state) => ({
        currentLocationId: targetLocationId,
        timeRemaining: state.timeRemaining - TRAVEL_COST,
        lastEvent: null,
      }));
    },

    work: (jobId, hours) => {
      const { gameStatus, timeRemaining, currentLocationId, educationLevel } =
        get();
      if (gameStatus !== 'playing') return;

      const job = JOBS.find((j) => j.id === jobId);
      if (!job) return;
      if (!Number.isInteger(hours) || hours <= 0) return;

      if (educationLevel < job.educationRequired) {
        notify(
          `Requires education level ${job.educationRequired} to work as ${job.title}.`,
        );
        return;
      }
      if (currentLocationId !== job.locationId) {
        const place = LOCATIONS.find((l) => l.id === job.locationId);
        notify(`You must be at ${place?.name ?? 'work'} to work.`);
        return;
      }
      if (timeRemaining < hours) {
        notify('Not enough time to work!');
        return;
      }

      set((state) => {
        const earned = job.wage * hours;
        const newMoney = state.money + earned;
        const isWin = newMoney >= WIN_MONEY && jobId === WIN_JOB_ID;

        return {
          money: newMoney,
          timeRemaining: state.timeRemaining - hours,
          gameStatus: isWin ? 'won' : 'playing',
          ...withEvent(
            state,
            `Worked ${hours} hrs as ${job.title}. Earned ${earned}.`,
          ),
        };
      });
    },

    eat: () => {
      const { gameStatus, money, timeRemaining, hasEaten, currentLocationId } =
        get();
      if (gameStatus !== 'playing') return;
      if (LOCATIONS.find((l) => l.id === currentLocationId)?.type !== 'store') {
        return;
      }
      if (hasEaten) {
        notify('You already ate this week.');
        return;
      }
      if (money < FOOD_COST || timeRemaining < MEAL_HOURS) {
        notify("Can't afford food or no time!");
        return;
      }

      set((state) => ({
        money: state.money - FOOD_COST,
        hasEaten: true,
        isStarving: false,
        timeRemaining: state.timeRemaining - MEAL_HOURS,
        ...withEvent(state, 'You ate a meal. Hunger satisfied.'),
      }));
    },

    attendClass: () => {
      const { gameStatus, money, timeRemaining, currentLocationId } = get();
      if (gameStatus !== 'playing') return;
      if (
        LOCATIONS.find((l) => l.id === currentLocationId)?.type !== 'education'
      ) {
        return;
      }
      if (money < TUITION_COST || timeRemaining < CLASS_HOURS) {
        notify(`Need $${TUITION_COST} and ${CLASS_HOURS} hours for school.`);
        return;
      }

      set((state) => ({
        money: state.money - TUITION_COST,
        timeRemaining: state.timeRemaining - CLASS_HOURS,
        educationLevel: state.educationLevel + 1,
        ...withEvent(
          state,
          'Education Level Increased! You can now apply for better jobs.',
        ),
      }));
    },

    endTurn: () => {
      if (get().gameStatus !== 'playing') return;

      set((state) => {
        let currentMoney = state.money;
        let status = state.gameStatus;
        let eventLog = 'Week Ended. ';

        // 1. Hunger Logic
        const isStarvingNow = !state.hasEaten;
        if (isStarvingNow)
          eventLog += 'You are starving! Less time next week. ';

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
          timeRemaining: nextMaxTime,
          money: currentMoney,
          hasEaten: false,
          isStarving: isStarvingNow,
          gameStatus: status,
          ...withEvent(state, eventLog),
        };
      });
    },

    // Keeps eventSeq so a toast from the previous game is never re-shown.
    resetGame: () =>
      set((state) => ({ ...INITIAL_STATE, eventSeq: state.eventSeq })),
  };
};

export const useGameStore = create<GameState & GameActions>()(
  persist(gameStoreCreator, {
    name: 'jones-mvp-storage',
    version: STORAGE_VERSION,
    storage: createJSONStorage(() => localStorage),
    // Hydrate from the client after mount (see StoreHydrator) so the first
    // client render matches the server-rendered HTML.
    skipHydration: true,
    partialize: (state) => ({
      money: state.money,
      currentWeek: state.currentWeek,
      timeRemaining: state.timeRemaining,
      educationLevel: state.educationLevel,
      hasEaten: state.hasEaten,
      isStarving: state.isStarving,
      currentLocationId: state.currentLocationId,
      gameStatus: state.gameStatus,
    }),
    migrate: (persisted, version) => {
      const state = { ...(persisted as Record<string, unknown>) };
      // v0 stored currentJobId, which nothing ever read.
      if (version < 1) delete state.currentJobId;
      return state as never;
    },
  }),
);
