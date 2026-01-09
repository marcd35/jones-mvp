export type LocationType = 'work' | 'store' | 'education' | 'housing';

export interface Location {
  id: string;
  name: string;
  type: LocationType;
  description: string;
}

export interface Job {
  id: string;
  title: string;
  wage: number; // Hourly wage
  locationId: string;
  educationRequired: number; // 0 = none
}

export interface GameState {
  // Player Stats
  money: number;
  currentWeek: number;
  timeRemaining: number; // 0-12 hours
  educationLevel: number;

  // Needs
  hasEaten: boolean; // Resets every turn
  isStarving: boolean; // Penalty state if they didn't eat

  // Position
  currentLocationId: string;

  // Job
  currentJobId: string | null;
}
