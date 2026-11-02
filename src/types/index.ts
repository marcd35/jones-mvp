export type LocationType = 'work' | 'store' | 'education' | 'housing' | 'other';

export interface Location {
  id: string;
  name: string;
  type: LocationType;
  description: string;
  closed?: boolean; // On the Board but cannot be entered (DEC-008)
}

export type GameStatus = 'playing' | 'won' | 'lost';

export interface Job {
  id: string;
  title: string;
  wage: number; // Hourly wage
  locationId: string;
  educationRequired: number; // 0 = none
}

// What sits in one cell of the Board's ring.
export type CellContent =
  | { kind: 'location'; locationId: string }
  | { kind: 'clock' }
  | { kind: 'blank' };

export interface BoardCell {
  row: number; // 0-based, top to bottom
  col: number; // 0-based, left to right
  content: CellContent;
}

export interface BoardLayout {
  size: number; // The grid is size x size; the ring is its outer cells
  cells: BoardCell[];
  centre: { row: number; col: number; rowSpan: number; colSpan: number };
}

// Walking cost: percent of a Week by ring distance (Steps), measured points
// only; the lookup interpolates between them.
export type WalkingCostTable = Record<number, number>;

// Everything the rules read as content (DEC-007).
export interface DataPack {
  locations: Location[];
  jobs: Job[];
  layout: BoardLayout;
  walkingCosts: WalkingCostTable;
  homeLocationId: string;
}

export interface Player {
  id: string;
  name: string;
  money: number;
  timeRemaining: number; // Hours left this Turn (0-12, may be fractional)
  educationLevel: number;
  hasEaten: boolean; // Resets every turn
  isStarving: boolean; // Penalty state if they didn't eat
  locationId: string;
}

export interface GameState {
  // Status
  gameStatus: GameStatus;
  lastEvent: string | null; // To show "Rent Paid!" messages
  eventSeq: number; // Bumps on every event so repeated messages still show

  currentWeek: number;

  // v1 runs with one Player; every rule reads the active one.
  players: Player[];
  turnIndex: number;
}
