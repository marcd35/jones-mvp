import { create } from 'zustand';
import { GameState } from '@/types';
import { MAX_TIME, TRAVEL_COST, FOOD_COST, JOBS } from '@/lib/constants';

interface GameActions {
  movePlayer: (locationId: string) => void;
  work: (hours: number) => void;
  eat: () => void;
  endTurn: () => void;
  resetGame: () => void;
}

const INITIAL_STATE: GameState = {
  money: 50, // Start with some cash
  currentWeek: 1,
  timeRemaining: MAX_TIME,
  educationLevel: 0,
  hasEaten: false,
  isStarving: false,
  currentLocationId: 'apt',
  currentJobId: 'janitor', // Start with a job for MVP simplicity
};

export const useGameStore = create<GameState & GameActions>((set, get) => ({
  ...INITIAL_STATE,

  movePlayer: (targetLocationId) => {
    const { timeRemaining, currentLocationId } = get();

    // Don't move if already there
    if (currentLocationId === targetLocationId) return;

    // Check if enough time
    if (timeRemaining < TRAVEL_COST) {
      console.warn('Not enough time to travel!');
      return;
    }

    set((state) => ({
      currentLocationId: targetLocationId,
      timeRemaining: state.timeRemaining - TRAVEL_COST,
    }));
  },

  work: (hours) => {
    const { timeRemaining, currentJobId } = get();
    const job = JOBS.find((j) => j.id === currentJobId);

    if (!job) return;
    if (timeRemaining < hours) {
      console.warn('Not enough time to work!');
      return;
    }

    set((state) => ({
      money: state.money + job.wage * hours,
      timeRemaining: state.timeRemaining - hours,
    }));
  },

  eat: () => {
    const { money, timeRemaining } = get();

    if (money < FOOD_COST) {
      console.warn('Not enough money!');
      return;
    }
    if (timeRemaining < 1) {
      console.warn('Not enough time to eat!');
      return;
    }

    set((state) => ({
      money: state.money - FOOD_COST,
      hasEaten: true,
      isStarving: false, // Cures starvation
      timeRemaining: state.timeRemaining - 1,
    }));
  },

  endTurn: () => {
    set((state) => {
      // 1. Calculate Hunger Penalty for NEXT turn
      const isStarvingNow = !state.hasEaten;

      // 2. Reset Time (If starving, you only get 8 hours next week instead of 12)
      const nextMaxTime = isStarvingNow ? MAX_TIME - 4 : MAX_TIME;

      return {
        currentWeek: state.currentWeek + 1,
        timeRemaining: nextMaxTime,
        hasEaten: false, // Reset hunger flag
        isStarving: isStarvingNow,
      };
    });
  },

  resetGame: () => set(INITIAL_STATE),
}));
