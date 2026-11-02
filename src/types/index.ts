export type LocationType =
  | 'work'
  | 'employment' // Where the Player is hired (an employment office)
  | 'store'
  | 'education'
  | 'housing'
  | 'other';

export interface Location {
  id: string;
  name: string;
  type: LocationType;
  description: string;
  closed?: boolean; // On the Board but cannot be entered (DEC-008)
}

// 'setup' is the Goal-setting screen before the first Turn (AC-005).
export type GameStatus = 'setup' | 'playing' | 'won' | 'lost';

// The four Goal categories (DEC-009).
export type GoalId = 'wealth' | 'happiness' | 'education' | 'career';

// Goal points spent on each Goal.
export type GoalPoints = Record<GoalId, number>;

// One row of the Goal table (UNK-005: the numbers are placeholders until the
// balance pass, T-15).
export interface GoalDef {
  id: GoalId;
  label: string;
  defaultPoints: number; // Where the slider starts
  perPoint: number; // The target grows by this much for each Goal point
  prefix: string; // Shown before the target, e.g. "$"
  suffix: string; // Shown after the target, e.g. " happiness"
}

export interface Job {
  id: string;
  title: string;
  wage: number; // Hourly wage
  locationId: string;
  educationRequired: number; // 0 = none
  shiftHours: number; // Hours of pay one Work action earns (DEC-026)
  workTimeHours: number; // Time one Work action costs (DEC-022, DEC-026)
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
  startingMoney: number; // A new Player's cash
  goalPointsBudget: number; // Goal points a Player splits across the Goals
  goals: GoalDef[]; // One row for each GoalId
  rentOwedLimit: number; // The owed rent balance that loses the game (DEC-023)
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
  jobId: string | null; // Hired at an employment Location; null = no job
  goals: GoalPoints; // Goal points set at setup; 0 = no Goal in that category
  owedRent: number; // Rent owed and not yet paid (T-09 fills it)
}

// The effects of a Week's end, in the fixed order they are applied and listed
// (see WEEKEND_EFFECTS in lib/weekend.ts).
export type WeekendEffectId =
  'food' | 'clothing' | 'rent' | 'inflation' | 'newspaper';

// Why a Week ended.
export type WeekEndReason = 'ended' | 'time' | 'road';

export interface WeekendReport {
  week: number; // The Week that ended
  reason: WeekEndReason;
  // One entry per effect, in the fixed order; text is null when the effect
  // has nothing to report (or is not built yet).
  effects: { id: WeekendEffectId; text: string | null }[];
  cash: number; // The Player's money once every effect has been applied
}

export interface GameState {
  // Status
  gameStatus: GameStatus;
  lastEvent: string | null; // To show "Rent Paid!" messages
  eventSeq: number; // Bumps on every event so repeated messages still show

  currentWeek: number;
  weekendReport: WeekendReport | null; // Set when a Week ends; cleared when read

  // v1 runs with one Player; every rule reads the active one.
  players: Player[];
  turnIndex: number;
}
