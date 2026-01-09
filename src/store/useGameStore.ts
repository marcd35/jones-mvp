import { create, StateCreator } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { GameState } from '@/types';
import {
  MAX_TIME,
  TRAVEL_COST,
  FOOD_COST,
  JOBS,
  TUITION_COST,
  RENT_COST,
  RENT_INTERVAL,
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
  money: 60, // Starting cash
  currentWeek: 1,
  timeRemaining: MAX_TIME,
  educationLevel: 0,
  hasEaten: false,
  isStarving: false,
  currentLocationId: 'apt',
  currentJobId: 'janitor',
};

const gameStoreCreator: StateCreator<
  GameState & GameActions,
  [['zustand/persist', unknown]]
> = (set, get) => ({
  ...INITIAL_STATE,

  movePlayer: (targetLocationId) => {
    const { timeRemaining, currentLocationId } = get();
    if (currentLocationId === targetLocationId) return;

    if (timeRemaining < TRAVEL_COST) {
      set({ lastEvent: 'Not enough time to travel!' });
      return;
    }

    set((state) => ({
      currentLocationId: targetLocationId,
      timeRemaining: state.timeRemaining - TRAVEL_COST,
      lastEvent: null,
    }));
  },

  work: (jobId, hours) => {
    const { timeRemaining } = get();
    const job = JOBS.find((j) => j.id === jobId);

    if (!job) return;
    if (timeRemaining < hours) {
      set({ lastEvent: 'Not enough time to work!' });
      return;
    }

    set((state) => {
      // Check for Win Condition on every earning
      const newMoney = state.money + job.wage * hours;
      const isWin = newMoney >= WIN_MONEY && jobId === 'manager';

      return {
        money: newMoney,
        timeRemaining: state.timeRemaining - hours,
        currentJobId: jobId,
        gameStatus: isWin ? 'won' : 'playing',
        lastEvent: `Worked ${hours} hrs as ${job.title}. Earned ${job.wage * hours}.`,
      };
    });
  },

  eat: () => {
    const { money, timeRemaining } = get();
    if (money < FOOD_COST || timeRemaining < 1) {
      set({ lastEvent: "Can't afford food or no time!" });
      return;
    }

    set((state) => ({
      money: state.money - FOOD_COST,
      hasEaten: true,
      isStarving: false,
      timeRemaining: state.timeRemaining - 1,
      lastEvent: 'You ate a meal. Hunger satisfied.',
    }));
  },

  attendClass: () => {
    const { money, timeRemaining } = get();
    if (money < TUITION_COST || timeRemaining < 4) {
      set({ lastEvent: 'Need $100 and 4 hours for school.' });
      return;
    }

    set((state) => ({
      money: state.money - TUITION_COST,
      timeRemaining: state.timeRemaining - 4,
      educationLevel: state.educationLevel + 1,
      lastEvent:
        'Education Level Increased! You can now apply for better jobs.',
    }));
  },

  endTurn: () => {
    set((state) => {
      let currentMoney = state.money;
      let status = state.gameStatus;
      let eventLog = 'Week Ended. ';

      // 1. Hunger Logic
      const isStarvingNow = !state.hasEaten;
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
      const nextMaxTime = isStarvingNow ? MAX_TIME - 4 : MAX_TIME;

      return {
        currentWeek: state.currentWeek + 1,
        timeRemaining: nextMaxTime,
        money: currentMoney,
        hasEaten: false,
        isStarving: isStarvingNow,
        gameStatus: status,
        lastEvent: eventLog,
      };
    });
  },

  resetGame: () => set(INITIAL_STATE),
});

export const useGameStore = create<GameState & GameActions>()(
  persist(gameStoreCreator, {
    name: 'jones-mvp-storage',
    storage: createJSONStorage(() => localStorage),
    partialize: (state) => ({
      money: state.money,
      currentWeek: state.currentWeek,
      timeRemaining: state.timeRemaining,
      educationLevel: state.educationLevel,
      hasEaten: state.hasEaten,
      isStarving: state.isStarving,
      currentLocationId: state.currentLocationId,
      currentJobId: state.currentJobId,
      gameStatus: state.gameStatus,
    }),
  })
);
