import { create, StateCreator } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  DataPack,
  GameState,
  GameStatus,
  GoalId,
  GoalPoints,
  Job,
  Player,
  WeekEndReason,
  WeekendEffectId,
} from '@/types';
import { MAX_TIME } from '@/lib/constants';
import { defaultPack } from '@/data';
import { LEGACY_LOCATION_IDS } from '@/data/locations';
import { loadPack } from '@/data/loader';
import { walkingCostHours, walkingSteps } from '@/lib/board';
import {
  clothesState,
  meetsClothing,
  tierOf,
  wearOneWeek,
} from '@/lib/clothing';
import { allGoalsMet, clampGoalPoints, totalGoalPoints } from '@/lib/goals';
import {
  drawSeed,
  inflationStepText,
  newspaperHeadline,
  nextPriceLevel,
  scalePrice,
} from '@/lib/inflation';
import { createRandom, Random } from '@/lib/random';
import { newspaperIssueSchedule } from '@/lib/newspaper';
import { WEEKEND_EFFECTS } from '@/lib/weekend';
import { householdStockForWeek } from '@/lib/household-goods';

interface GameActions {
  setGoalPoints: (goalId: GoalId, points: number) => void;
  startGame: () => void;
  walkTo: (locationId: string) => void;
  hire: (jobId: string) => void;
  work: () => void;
  dismissWeekendReport: () => void;
  buyFood: (goodId: string) => void;
  buyHouseholdGood: (goodId: string) => void;
  buyClothes: (tierId: string) => void;
  buyNewspaper: () => void;
  enrollCourse: (courseId: string) => void;
  attendClass: () => void;
  payRent: () => void;
  payRentBalance: () => void;
  askForMoreTime: () => void;
  endTurn: () => void;
  resetGame: () => void;
}

type GameStore = GameState & GameActions;

export interface GameDeps {
  pack: DataPack;
  // Every random choice goes through it. A new game draws its seed from it,
  // and that seed fixes the game's price level sequence (AC-010).
  random?: Random;
}

const STORAGE_VERSION = 12;
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
  educationPath: null,
  enrolledCourseId: null,
  courseClassesCompleted: 0,
  completedCourseIds: [],
  foodWeeks: 0,
  ownedGoods: [],
  isStarving: false,
  clothes: { tierId: pack.clothing.startTierId, weeksWorn: 0 },
  locationId: pack.homeLocationId,
  jobId: null,
  heldWage: null,
  careerExperience: {},
  highestRung: 0,
  goals: defaultGoalPoints(pack),
  owedRent: 0,
  rentDueWeek: pack.rent.intervalWeeks,
  rentExtensionAskedWeek: null,
  rentPaidWeek: null,
  newspaperReadWeek: null,
});

const initialState = (pack: DataPack, priceSeed: number): GameState => ({
  gameStatus: 'setup',
  lastEvent: null,
  eventSeq: 0,
  currentWeek: 1,
  weekendReport: null,
  priceLevel: pack.inflation.startLevel,
  priceSeed,
  newspaper: null,
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
  ({ pack, random }: Required<GameDeps>): StateCreator<GameStore> =>
  (set, get) => {
    const locationOf = (id: string) => pack.locations.find((l) => l.id === id);

    // A shop price at this Week's level (AC-010).
    const priceOf = (base: number) => scalePrice(base, get().priceLevel);
    const rentOfficeName = () =>
      locationOf(pack.rent.locationId)?.name ?? 'the rent office';

    // Why the Player's clothes bar the job, or null when they meet its
    // optional data tier. Worn clothes globally block Work (AC-008).
    const clothingBlock = (job: Job, clothes: Player['clothes']) => {
      if (clothesState(pack.clothing, clothes) === 'worn') {
        const shop = locationOf(pack.clothing.locationId)?.name ?? 'the shop';
        return `Your clothes are worn out. Buy new ones at ${shop} to work as ${job.title}.`;
      }
      if (meetsClothing(pack.clothing, clothes, job.clothingRequired)) {
        return null;
      }
      const need = pack.clothing.tiers.find(
        (t) => t.id === job.clothingRequired,
      );
      const shop = locationOf(pack.clothing.locationId)?.name ?? 'the shop';
      return clothesState(pack.clothing, clothes) === 'worn'
        ? `Your clothes are worn out. Buy new ones at ${shop} to work as ${job.title}.`
        : `You need ${need?.name ?? 'better clothes'} or better to work as ${job.title}. Buy them at ${shop}.`;
    };

    // Records an event without changing anything else.
    const notify = (message: string) =>
      set((state) => withEvent(state, message));

    // Whether the active Player has won or lost (AC-006). Losing comes first.
    const endStatus = (state: GameState): GameStatus => {
      const player = activePlayer(state);
      if (player.owedRent >= pack.rentOwedLimit) return 'lost';
      return allGoalsMet(pack.goals, player, {
        pack,
        priceLevel: state.priceLevel,
      })
        ? 'won'
        : 'playing';
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
      const currentMoney = player.money;
      let status = state.gameStatus;
      let eventLog = intro;
      const said: Partial<Record<WeekendEffectId, string>> = {};

      // 1. Food: a Week with no food costs Time next Week (AC-007). Eating
      // this Week leaves nothing owing from earlier Weeks (UNK-006).
      const isStarvingNow = player.foodWeeks <= 0;
      const foodLeft = Math.max(0, player.foodWeeks - 1);
      if (isStarvingNow) {
        said.food = `No food this Week. You lose ${pack.food.penaltyHours} hours next Week.`;
        eventLog += `${said.food} `;
      } else {
        said.food = foodLeft
          ? `Fed. Food in hand for ${foodLeft} more ${foodLeft === 1 ? 'Week' : 'Weeks'}.`
          : 'Fed. No food left for next Week.';
      }

      // 2. Clothing wear: one more Week of wear (AC-008).
      const wear = wearOneWeek(pack.clothing, player.clothes);
      if (wear.text) {
        said.clothing = wear.text;
        eventLog += `${wear.text} `;
      }

      // 3. Unpaid rent is added when its due Week ends. Paying at the office
      // during the Week advances rentDueWeek before this point.
      let owedRent = player.owedRent;
      let rentDueWeek = player.rentDueWeek;
      if (state.currentWeek >= player.rentDueWeek) {
        const amount = pack.rent.homeAmounts[pack.homeLocationId];
        owedRent += amount;
        rentDueWeek += pack.rent.intervalWeeks;
        said.rent = `Rent of $${amount} is due. It was not paid; $${amount} was added to rent owed.`;
        eventLog += `${said.rent} `;
      } else if (player.rentPaidWeek === state.currentWeek) {
        const amount = pack.rent.homeAmounts[pack.homeLocationId];
        said.rent = `Rent paid ($${amount}).`;
      }

      // 4. Inflation step: the level for the coming Week.
      const week = state.currentWeek + 1;
      const level = nextPriceLevel(
        pack.inflation,
        state.priceSeed,
        week,
        state.priceLevel,
      );
      said.inflation = inflationStepText(state.priceLevel, level);

      // 5. Newspaper: announces a notable move of the level.
      const headline = newspaperHeadline(
        pack.inflation,
        state.priceLevel,
        level,
      );
      if (headline) said.newspaper = headline;

      // Next Turn: full Time (less the hunger penalty), back at home.
      const nextMaxTime = isStarvingNow
        ? MAX_TIME - pack.food.penaltyHours
        : MAX_TIME;

      const players = patchActive(state, {
        timeRemaining: nextMaxTime,
        money: currentMoney,
        foodWeeks: foodLeft,
        isStarving: isStarvingNow,
        clothes: wear.clothes,
        locationId: pack.homeLocationId,
        owedRent,
        rentDueWeek,
        rentExtensionAskedWeek:
          state.currentWeek >= player.rentDueWeek
            ? null
            : player.rentExtensionAskedWeek,
        rentPaidWeek: null,
      });
      // Goods are valued at the coming Week's level, the one the game keeps.
      if (status === 'playing')
        status = endStatus({ ...state, players, priceLevel: level });

      return {
        // A game that ended keeps the Week it ended in (the Weeks played).
        currentWeek:
          status === 'playing' ? state.currentWeek + 1 : state.currentWeek,
        players,
        gameStatus: status,
        priceLevel: level,
        newspaper: headline,
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
      ...initialState(pack, drawSeed(random)),

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
            `Education requirement: ${job.educationLabel} to apply for ${job.title}.`,
          );
          return;
        }
        if (
          job.educationPathRequired !== undefined &&
          player.educationPath !== job.educationPathRequired
        ) {
          notify(
            `Requires the ${job.educationPathRequired} education path to apply for ${job.title}.`,
          );
          return;
        }
        if (
          (player.careerExperience[job.careerId] ?? 0) < job.experienceRequired
        ) {
          notify(
            `Requires ${job.experienceRequired} ${job.experienceRequired === 1 ? 'point' : 'points'} of ${locationOf(job.locationId)?.name ?? 'career'} experience to apply for ${job.title}.`,
          );
          return;
        }
        if (player.jobId === jobId) {
          notify(`You already work as ${job.title}.`);
          return;
        }
        // Future data packs may still define a rung-specific tier, but the
        // approved v1 jobs omit it, so clothing does not block hiring.
        const dressed =
          job.clothingRequired === undefined
            ? null
            : clothingBlock(job, player.clothes);
        if (dressed) {
          notify(dressed);
          return;
        }
        // A new rung can meet the Career Goal, so hiring settles the win.
        set((s) =>
          settle(
            s,
            {
              players: patchActive(s, {
                jobId,
                heldWage: priceOf(job.wage),
                highestRung: Math.max(activePlayer(s).highestRung, job.rung),
              }),
            },
            `Hired as ${job.title} at ${locationOf(job.locationId)?.name ?? 'work'} for $${priceOf(job.wage)}/hr.`,
          ),
        );
      },

      work: () => {
        const state = get();
        if (state.gameStatus !== 'playing') return;
        const { timeRemaining, locationId, jobId, heldWage, clothes } =
          activePlayer(state);

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
        const dressed = clothingBlock(job, clothes);
        if (dressed) {
          notify(dressed);
          return;
        }
        if (timeRemaining < job.workTimeHours) {
          notify('Not enough time to work!');
          return;
        }

        set((s) => {
          const player = activePlayer(s);
          const hourlyWage = heldWage ?? scalePrice(job.wage, s.priceLevel);
          const earned = hourlyWage * job.shiftHours;
          const garnishment = Math.min(
            player.owedRent,
            pack.rent.garnishment,
            earned,
          );
          const newMoney = player.money + earned - garnishment;

          return settle(
            s,
            {
              players: patchActive(s, {
                money: newMoney,
                owedRent: player.owedRent - garnishment,
                careerExperience: {
                  ...player.careerExperience,
                  [job.careerId]:
                    (player.careerExperience[job.careerId] ?? 0) + 1,
                },
                timeRemaining: roundHours(
                  player.timeRemaining - job.workTimeHours,
                ),
              }),
            },
            `Worked a ${job.shiftHours}-hour shift as ${job.title}. Earned $${earned}${garnishment ? `; $${garnishment} was garnished for rent.` : '.'} Gained 1 Career experience point.`,
          );
        });
      },

      buyFood: (goodId) => {
        const state = get();
        if (state.gameStatus !== 'playing') return;
        const { money, timeRemaining, locationId } = activePlayer(state);
        const good = pack.food.goods.find((g) => g.id === goodId);
        if (!good) return;
        if (good.locationId !== locationId) {
          notify(`${good.name} is not sold here.`);
          return;
        }
        const price = priceOf(good.basePrice);
        if (money < price) {
          notify(`You need $${price} for ${good.name}.`);
          return;
        }
        if (timeRemaining < good.timeHours) {
          notify('Not enough time to buy food!');
          return;
        }

        set((s) => {
          const player = activePlayer(s);
          return settle(
            s,
            {
              players: patchActive(s, {
                money: player.money - price,
                foodWeeks: player.foodWeeks + good.weeks,
                timeRemaining: roundHours(
                  player.timeRemaining - good.timeHours,
                ),
              }),
            },
            `Bought ${good.name} for $${price}.`,
          );
        });
      },

      buyHouseholdGood: (goodId) => {
        const state = get();
        if (state.gameStatus !== 'playing') return;
        const player = activePlayer(state);
        const good = pack.householdGoods.goods.find((g) => g.id === goodId);
        if (!good) return;
        if (good.locationId !== player.locationId) {
          notify(`${good.name} is not sold here.`);
          return;
        }
        if (
          !householdStockForWeek(
            pack,
            state.currentWeek,
            state.priceSeed,
            player.locationId,
          ).some((item) => item.id === goodId)
        ) {
          notify(`${good.name} is out of stock this Week.`);
          return;
        }
        if (player.ownedGoods.includes(goodId)) {
          notify(`You already own ${good.name}.`);
          return;
        }
        const price = priceOf(good.basePrice);
        if (player.money < price) {
          notify(`You need $${price} for ${good.name}.`);
          return;
        }
        set((s) =>
          settle(
            s,
            {
              players: patchActive(s, {
                money: player.money - price,
                ownedGoods: [...player.ownedGoods, goodId],
              }),
            },
            `Bought ${good.name} for $${price}.`,
          ),
        );
      },

      buyClothes: (tierId) => {
        const state = get();
        if (state.gameStatus !== 'playing') return;
        const { money, locationId, clothes } = activePlayer(state);
        const tier = pack.clothing.tiers.find((t) => t.id === tierId);
        if (!tier) return;
        if (locationId !== pack.clothing.locationId) {
          notify(`${tier.name} are not sold here.`);
          return;
        }
        const price = priceOf(tier.basePrice);
        if (money < price) {
          notify(`You need $${price} for ${tier.name}.`);
          return;
        }
        // Good clothes of the same or a higher tier are not worth replacing;
        // ones about to wear out, or worn out, are.
        const have = tierOf(pack.clothing, clothes);
        if (
          have &&
          clothesState(pack.clothing, clothes) === 'good' &&
          have.rank >= tier.rank
        ) {
          notify(`Your ${have.name} are still good.`);
          return;
        }

        set((s) =>
          settle(
            s,
            {
              players: patchActive(s, {
                money: money - price,
                clothes: { tierId, weeksWorn: 0 },
              }),
            },
            `Bought ${tier.name} for $${price}.`,
          ),
        );
      },

      buyNewspaper: () => {
        const state = get();
        if (state.gameStatus !== 'playing') return;
        const player = activePlayer(state);
        const newspaper = pack.newspaper;
        const seller = locationOf(newspaper.locationId);

        if (!seller || seller.closed) {
          notify(
            'The newspaper is not available because its Location is closed.',
          );
          return;
        }
        if (player.locationId !== newspaper.locationId) {
          notify(`The newspaper is sold at ${seller.name}.`);
          return;
        }
        const issueSchedule = newspaperIssueSchedule(
          state.currentWeek,
          newspaper.issueEveryWeeks,
        );
        if (!issueSchedule.available) {
          notify(
            `The next newspaper issue arrives in Week ${issueSchedule.nextIssueWeek}.`,
          );
          return;
        }
        if (player.newspaperReadWeek === state.currentWeek) {
          notify('You already read this Week’s newspaper.');
          return;
        }
        if (player.money < newspaper.price) {
          notify(`You need $${newspaper.price} for the newspaper.`);
          return;
        }
        if (player.timeRemaining < newspaper.timeHours) {
          notify('Not enough Time to read the newspaper.');
          return;
        }

        set((s) => {
          const active = activePlayer(s);
          return settle(
            s,
            {
              players: patchActive(s, {
                money: active.money - newspaper.price,
                timeRemaining: roundHours(
                  active.timeRemaining - newspaper.timeHours,
                ),
                newspaperReadWeek: s.currentWeek,
              }),
            },
            `Bought this Week’s newspaper for $${newspaper.price}.`,
          );
        });
      },

      enrollCourse: (courseId) => {
        const state = get();
        if (state.gameStatus !== 'playing') return;
        const player = activePlayer(state);
        if (player.locationId !== pack.education.locationId) return;
        const course = pack.education.courses.find(
          (item) => item.id === courseId,
        );
        if (!course) return;
        if (player.enrolledCourseId !== null) {
          notify('Finish the current course before enrolling in another.');
          return;
        }
        if (
          player.completedCourseIds.includes(course.id) ||
          course.level !== player.educationLevel + 1
        ) {
          notify(
            `${course.name} is not the next course on your education path.`,
          );
          return;
        }
        if (
          player.educationPath !== null &&
          player.educationPath !== course.path
        ) {
          notify(
            `Your education path is ${player.educationPath}; ${course.name} is on the ${course.path} path.`,
          );
          return;
        }
        const fee = priceOf(pack.education.enrollmentFee);
        const enrollmentTime = pack.education.enrollmentTimeHours;
        if (player.money < fee || player.timeRemaining < enrollmentTime) {
          notify(
            `Need $${fee} and ${enrollmentTime} hours to enroll in ${course.name}.`,
          );
          return;
        }

        set((s) => {
          const active = activePlayer(s);
          return settle(
            s,
            {
              players: patchActive(s, {
                money: active.money - fee,
                timeRemaining: roundHours(
                  active.timeRemaining - enrollmentTime,
                ),
                enrolledCourseId: course.id,
                courseClassesCompleted: 0,
              }),
            },
            `Enrolled in ${course.name} for $${fee}.`,
          );
        });
      },

      attendClass: () => {
        const state = get();
        if (state.gameStatus !== 'playing') return;
        const player = activePlayer(state);
        if (player.locationId !== pack.education.locationId) return;
        const course = pack.education.courses.find(
          (item) => item.id === player.enrolledCourseId,
        );
        if (!course) {
          notify('Enroll in a course before attending class.');
          return;
        }
        if (player.timeRemaining < course.classTimeHours) {
          notify(`Need ${course.classTimeHours} hours to attend class.`);
          return;
        }

        const classesCompleted = player.courseClassesCompleted + 1;
        const courseComplete = classesCompleted >= course.classesRequired;
        set((s) => {
          const active = activePlayer(s);
          return settle(
            s,
            {
              players: patchActive(s, {
                timeRemaining: roundHours(
                  active.timeRemaining - course.classTimeHours,
                ),
                educationLevel: courseComplete
                  ? course.level
                  : active.educationLevel,
                educationPath: courseComplete
                  ? course.path
                  : active.educationPath,
                enrolledCourseId: courseComplete ? null : course.id,
                courseClassesCompleted: courseComplete ? 0 : classesCompleted,
                completedCourseIds: courseComplete
                  ? [...active.completedCourseIds, course.id]
                  : active.completedCourseIds,
              }),
            },
            courseComplete
              ? `Completed ${course.name}. Education level ${course.level} on the ${course.path} path.`
              : `Attended class for ${course.name}. ${classesCompleted} of ${course.classesRequired} classes complete.`,
          );
        });
      },

      payRent: () => {
        const state = get();
        if (state.gameStatus !== 'playing') return;
        const player = activePlayer(state);
        if (player.locationId !== pack.rent.locationId) {
          notify(`Go to ${rentOfficeName()} to pay rent.`);
          return;
        }
        if (state.currentWeek < player.rentDueWeek) {
          notify(
            `${rentOfficeName()} is closed because rent is not due this Week.`,
          );
          return;
        }
        const amount = pack.rent.homeAmounts[pack.homeLocationId];
        if (player.money < amount) {
          notify(`You need $${amount} to pay rent.`);
          return;
        }
        set((s) => ({
          players: patchActive(s, {
            money: player.money - amount,
            rentDueWeek: player.rentDueWeek + pack.rent.intervalWeeks,
            rentExtensionAskedWeek: null,
            rentPaidWeek: state.currentWeek,
          }),
          ...withEvent(s, `Paid rent of $${amount}.`),
        }));
      },

      payRentBalance: () => {
        const state = get();
        if (state.gameStatus !== 'playing') return;
        const player = activePlayer(state);
        if (player.locationId !== pack.rent.locationId) {
          notify(`Go to ${rentOfficeName()} to pay the rent balance.`);
          return;
        }
        if (state.currentWeek < player.rentDueWeek) {
          notify(
            `${rentOfficeName()} is closed because rent is not due this Week.`,
          );
          return;
        }
        if (player.owedRent <= 0) {
          notify('There is no rent balance to pay.');
          return;
        }
        if (player.money < player.owedRent) {
          notify(`You need $${player.owedRent} to clear the rent balance.`);
          return;
        }
        set((s) => ({
          players: patchActive(s, {
            money: player.money - player.owedRent,
            owedRent: 0,
          }),
          ...withEvent(s, `Paid the rent balance of $${player.owedRent}.`),
        }));
      },

      askForMoreTime: () => {
        const state = get();
        if (state.gameStatus !== 'playing') return;
        const player = activePlayer(state);
        if (player.locationId !== pack.rent.locationId) {
          notify(`Go to ${rentOfficeName()} to ask for more time.`);
          return;
        }
        if (state.currentWeek < player.rentDueWeek) {
          notify(
            `${rentOfficeName()} is closed because rent is not due this Week.`,
          );
          return;
        }
        set((s) => ({
          players: patchActive(s, {
            rentDueWeek: player.rentDueWeek + 1,
            rentExtensionAskedWeek: state.currentWeek,
          }),
          ...withEvent(s, 'You have one more Week to pay rent.'),
        }));
      },

      endTurn: () => {
        if (get().gameStatus !== 'playing') return;
        set((state) => rollWeek(state, 'Week Ended. ', 'ended'));
      },

      dismissWeekendReport: () => set({ weekendReport: null }),

      // Keeps eventSeq so a toast from the previous game is never re-shown.
      resetGame: () =>
        set((state) => ({
          ...initialState(pack, drawSeed(random)),
          eventSeq: state.eventSeq,
        })),
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
// Real play: each new game gets its own seed. (Tests inject a fixed one.)
const gameRandom = createRandom(Math.floor(Math.random() * 2 ** 32));

export const useGameStore = create<GameStore>()(
  persist(gameStoreCreator({ pack: gamePack, random: gameRandom }), {
    name: 'jones-mvp-storage',
    version: STORAGE_VERSION,
    storage: createJSONStorage(() => localStorage),
    // Hydrate from the client after mount (see StoreHydrator) so the first
    // client render matches the server-rendered HTML.
    skipHydration: true,
    partialize: (state) => ({
      currentWeek: state.currentWeek,
      weekendReport: state.weekendReport,
      priceLevel: state.priceLevel,
      priceSeed: state.priceSeed,
      newspaper: state.newspaper,
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
        const old = state as Partial<Player> & {
          currentLocationId?: string;
          hasEaten?: boolean; // Replaced by foodWeeks in v6
        };
        const locationId =
          LEGACY_LOCATION_IDS[old.currentLocationId ?? ''] ??
          old.currentLocationId;
        const known = gamePack.locations.some((l) => l.id === locationId);
        const player: Player = {
          ...fresh,
          money: old.money ?? fresh.money,
          timeRemaining: old.timeRemaining ?? fresh.timeRemaining,
          educationLevel: old.educationLevel ?? fresh.educationLevel,
          foodWeeks: old.hasEaten ? 1 : fresh.foodWeeks,
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
      // v5 added the hidden price level, its seed and the newspaper. A saved
      // game starts at the start level (its past levels were not kept) with a
      // seed of its own.
      if (version < 5) {
        state.priceLevel = gamePack.inflation.startLevel;
        state.priceSeed = drawSeed(gameRandom);
        state.newspaper = null;
      }
      // v6 replaced hasEaten with the Weeks of food in hand, and added the
      // Player's clothes (new ones: a saved game has no wear history).
      if (version < 6) {
        const old = state.players as (Partial<Player> & {
          hasEaten?: boolean;
        })[];
        state.players = old.map(({ hasEaten, ...p }) => ({
          ...p,
          foodWeeks: p.foodWeeks ?? (hasEaten ? 1 : 0),
          clothes: p.clothes ?? newPlayer(gamePack).clothes,
        }));
      }
      // v7 tracks the next due Week and rent paid in the current Week.
      if (version < 7) {
        const currentWeek =
          typeof state.currentWeek === 'number' ? state.currentWeek : 1;
        const interval = gamePack.rent.intervalWeeks;
        const nextDueWeek =
          Math.ceil(currentWeek / interval) * interval || interval;
        state.players = (state.players as Player[]).map((p) => ({
          ...p,
          rentDueWeek: p.rentDueWeek ?? nextDueWeek,
          rentExtensionAskedWeek: p.rentExtensionAskedWeek ?? null,
          rentPaidWeek: p.rentPaidWeek ?? null,
        }));
      }
      // v8 records the Week in which each Player last bought a newspaper.
      if (version < 8) {
        state.players = (state.players as Player[]).map((p) => ({
          ...p,
          newspaperReadWeek: p.newspaperReadWeek ?? null,
        }));
      }
      if (version < 9) {
        state.players = (state.players as Player[]).map((p) => ({
          ...p,
          ownedGoods: p.ownedGoods ?? [],
        }));
      }
      // v10 tracks experience by Career and freezes the offered wage at hire.
      if (version < 10) {
        state.players = (state.players as Player[]).map((p) => {
          // v1's old $15 Shift Manager rung maps to the approved Monolith
          // Manager role while preserving the wage already held in that save.
          const legacyShiftManager = p.jobId === 'shift-manager';
          const jobId = legacyShiftManager ? 'monolith-manager' : p.jobId;
          const job = gamePack.jobs.find((candidate) => candidate.id === jobId);
          return {
            ...p,
            jobId,
            educationPath: p.educationPath ?? null,
            careerExperience: p.careerExperience ?? {},
            heldWage:
              p.heldWage ?? (legacyShiftManager ? 15 : (job?.wage ?? null)),
          };
        });
      }
      if (version < 11) {
        state.players = (state.players as Player[]).map((p) => ({
          ...p,
          enrolledCourseId: p.enrolledCourseId ?? null,
          courseClassesCompleted: p.courseClassesCompleted ?? 0,
          completedCourseIds: p.completedCourseIds ?? [],
        }));
      }
      // v12 keeps the highest job rung ever held (#44). A save knows only its
      // current job, so that job's rung is the best record it has.
      if (version < 12) {
        state.players = (state.players as Player[]).map((p) => ({
          ...p,
          highestRung:
            p.highestRung ??
            gamePack.jobs.find((job) => job.id === p.jobId)?.rung ??
            0,
        }));
      }
      return state as never;
    },
  }),
);
