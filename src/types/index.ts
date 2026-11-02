import type { Random } from '@/lib/random';

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

export type EducationPath = 'technical' | 'college';

export type EducationDataBasis = 'observed' | 'approved-default';

export interface EducationCourse {
  id: string;
  name: string;
  path: EducationPath;
  level: 1 | 2;
  classesRequired: number;
  classTimeHours: number;
  dataBasis: EducationDataBasis;
}

export interface EducationRules {
  locationId: string;
  enrollmentFee: number; // Base fee at price level 1.00
  enrollmentFeeDataBasis: EducationDataBasis;
  enrollmentTimeHours: number;
  enrollmentTimeDataBasis: EducationDataBasis;
  courses: EducationCourse[];
}

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
  careerId: string; // Jobs at one employer share career experience
  educationRequired: number; // 0 = none
  educationPathRequired?: EducationPath; // Absent = either education path
  educationLabel: string; // Human-readable approved reference requirement
  experienceRequired: number; // Career-specific experience points; 0 = none
  shiftHours: number; // Hours of pay one Work action earns (DEC-026)
  workTimeHours: number; // Time one Work action costs (DEC-022, DEC-026)
  // The lowest clothing tier the job asks for (a ClothingTier id); worn clothes
  // meet no tier (AC-008). Absent = no clothing requirement.
  clothingRequired?: string;
}

// Food for sale: it covers `weeks` Weeks (AC-007). Prices are base prices, at
// level 1.00; the shop charges them through the price level (AC-010).
export interface FoodGood {
  id: string;
  name: string;
  locationId: string; // The Location that sells it
  weeks: number; // Weeks of food one purchase covers
  basePrice: number;
  timeHours: number; // Time buying it costs
}

// Hunger and the food on sale (AC-007). The numbers are placeholders for the
// balance pass (T-15).
export interface FoodRules {
  // Time lost from the Week after a Week without food (DEC-022: about 35% of a
  // Week). It is not cumulative and not cleared by eating later (UNK-006).
  penaltyHours: number;
  goods: FoodGood[];
}

// A household good sold at a store. Availability is drawn deterministically
// from the game's seed for each Week; stockChance is replaceable balance data.
export interface HouseholdGood {
  id: string;
  name: string;
  locationId: string;
  basePrice: number;
  happinessPoints: number;
  stockChance: number;
}

export interface HouseholdGoodsRules {
  goods: HouseholdGood[];
}

// One clothing tier. A higher rank meets every lower rank's job requirement.
export interface ClothingTier {
  id: string;
  name: string;
  rank: number;
  basePrice: number;
}

// Clothing and its wear (AC-008).
export interface ClothingRules {
  locationId: string; // The Location that sells the tiers
  tiers: ClothingTier[];
  startTierId: string; // What a new Player wears, brand new
  wearOutWeeks: number; // Weeks of wear before clothes are worn out
  warnWeeks: number; // The Player is warned this many Weeks before that
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

// What the rule that sets a Week's price level reads (DEC-024).
export interface InflationContext {
  week: number; // The Week the level is for
  previous: number; // The level of the Week before
  random: Random; // Seeded for this Week's step: the same seed, the same draw
}

// A move of the price level big enough for the newspaper to announce.
export interface NotableMove {
  minMove: number; // The smallest change in the level that counts
  up: string; // Headline when the level rises by at least minMove
  down: string; // Headline when it falls by at least minMove
}

// The price level rule and the newspaper's thresholds (DEC-024). The rule is
// data: a pack changes how the level moves by replacing nextLevel.
export interface InflationRule {
  startLevel: number; // Week 1's level
  nextLevel: (context: InflationContext) => number;
  // Every move at or above a threshold is notable; the largest one met names
  // the headline. Wages are not scaled by the level.
  notableMoves: NotableMove[];
}

// Newspaper availability and reading costs (issue #20).
export interface NewspaperRules {
  locationId: string;
  price: number; // Fixed price, independent of the hidden price level
  timeHours: number; // Time spent reading one issue
  issueEveryWeeks: number; // A new issue appears every N Weeks
}

// Everything the rules read as content (DEC-007).
export interface DataPack {
  locations: Location[];
  jobs: Job[];
  education: EducationRules;
  layout: BoardLayout;
  walkingCosts: WalkingCostTable;
  homeLocationId: string;
  startingMoney: number; // A new Player's cash
  goalPointsBudget: number; // Goal points a Player splits across the Goals
  goals: GoalDef[]; // One row for each GoalId
  rentOwedLimit: number; // The owed rent balance that loses the game (DEC-023)
  rent: RentRules;
  inflation: InflationRule;
  newspaper: NewspaperRules;
  food: FoodRules;
  householdGoods: HouseholdGoodsRules;
  clothing: ClothingRules;
}

export interface RentRules {
  locationId: string;
  homeAmounts: Record<string, number>; // Fixed lease amount by home Location
  intervalWeeks: number;
  garnishment: number; // Deducted from each Work payment while rent is owed
}

export interface Player {
  id: string;
  name: string;
  money: number;
  timeRemaining: number; // Hours left this Turn (0-12, may be fractional)
  educationLevel: number;
  educationPath: EducationPath | null;
  enrolledCourseId: string | null;
  courseClassesCompleted: number;
  completedCourseIds: string[];
  // Weeks of food in hand, this Week included: above 0 means this Week is
  // covered. One is used up when the Week ends.
  foodWeeks: number;
  ownedGoods: string[]; // HouseholdGood ids the Player owns
  isStarving: boolean; // This Week began with the hunger penalty
  // What the Player wears and the Weeks worn; null = no clothes at all.
  clothes: { tierId: string; weeksWorn: number } | null;
  locationId: string;
  jobId: string | null; // Hired at an employment Location; null = no job
  heldWage: number | null; // Hourly wage fixed when hired; null when unemployed
  careerExperience: Record<string, number>; // Experience kept per Career
  goals: GoalPoints; // Goal points set at setup; 0 = no Goal in that category
  owedRent: number; // Rent owed and not yet paid (T-09 fills it)
  rentDueWeek: number; // The next rent due Week; extensions move it one Week
  rentExtensionAskedWeek: number | null; // Keeps the office open for the rest of an extension Week
  rentPaidWeek: number | null; // The Week rent was paid, for the weekend report
  newspaperReadWeek: number | null; // Week of the most recent issue read
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

  // The hidden price level (AC-010): scales every shop price, never wages.
  priceLevel: number; // This Week's level
  priceSeed: number; // Seeds the level's steps, so a game's sequence repeats
  newspaper: string | null; // This Week's headline, if the level moved notably

  // v1 runs with one Player; every rule reads the active one.
  players: Player[];
  turnIndex: number;
}
