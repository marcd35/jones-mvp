import { ringCoordinates } from '@/lib/board';
import { MAX_TIME } from '@/lib/constants';
import type { DataPack, GoalDef, GoalId } from '@/types';

const GOAL_IDS: GoalId[] = ['wealth', 'happiness', 'education', 'career'];

// Returns a readable message for every problem in the pack; empty when valid.
export function validatePack(pack: DataPack): string[] {
  const problems: string[] = [];
  const { layout, locations } = pack;
  const known = new Set(locations.map((l) => l.id));

  // Layout: every ring cell exactly once, nothing off the ring.
  const ring = ringCoordinates(layout.size);
  const onRing = new Set(ring.map(([r, c]) => `${r},${c}`));
  const seen = new Set<string>();
  for (const cell of layout.cells) {
    const key = `${cell.row},${cell.col}`;
    if (!onRing.has(key))
      problems.push(`Board layout cell ${key} is not on the ring.`);
    else if (seen.has(key))
      problems.push(`Board layout has two cells at ${key}.`);
    seen.add(key);
  }
  for (const key of onRing) {
    if (!seen.has(key)) problems.push(`Board layout has no cell at ${key}.`);
  }

  // Layout: contents.
  const placed = new Set<string>();
  let clocks = 0;
  for (const { content } of layout.cells) {
    if (content.kind === 'clock') clocks++;
    if (content.kind !== 'location') continue;
    if (!known.has(content.locationId)) {
      problems.push(
        `Board layout names unknown Location "${content.locationId}".`,
      );
    } else if (placed.has(content.locationId)) {
      problems.push(`Location "${content.locationId}" is on the Board twice.`);
    }
    placed.add(content.locationId);
  }
  if (clocks !== 1) {
    problems.push(
      `Board layout needs exactly one Clock cell, found ${clocks}.`,
    );
  }
  for (const id of known) {
    if (!placed.has(id)) problems.push(`Location "${id}" is not on the Board.`);
  }

  // Other tables.
  const jobIds = new Set<string>();
  for (const job of pack.jobs) {
    if (jobIds.has(job.id)) problems.push(`Job "${job.id}" is defined twice.`);
    jobIds.add(job.id);
    const at = locations.find((l) => l.id === job.locationId);
    if (!at) {
      problems.push(
        `Job "${job.id}" is at unknown Location "${job.locationId}".`,
      );
    } else if (at.closed) {
      problems.push(`Job "${job.id}" is at closed Location "${at.id}".`);
    }
    if (!(job.wage >= 0))
      problems.push(`Job "${job.id}" needs a wage of at least 0.`);
    if (typeof job.careerId !== 'string' || job.careerId.trim().length === 0) {
      problems.push(`Job "${job.id}" needs a Career id.`);
    }
    if (!Number.isInteger(job.rung) || job.rung < 1) {
      problems.push(`Job "${job.id}" needs a whole rung of at least 1.`);
    }
    if (
      typeof job.educationLabel !== 'string' ||
      job.educationLabel.trim().length === 0
    ) {
      problems.push(`Job "${job.id}" needs an education requirement label.`);
    }
    if (!(job.experienceRequired >= 0)) {
      problems.push(
        `Job "${job.id}" needs an experience requirement of at least 0.`,
      );
    }
    if (!(job.shiftHours > 0))
      problems.push(`Job "${job.id}" needs a shift of more than 0 paid hours.`);
    if (!(job.workTimeHours > 0)) {
      problems.push(
        `Job "${job.id}" needs a Work Time cost of more than 0 hours.`,
      );
    } else if (job.workTimeHours > MAX_TIME) {
      problems.push(
        `Job "${job.id}" has a Work Time cost of ${job.workTimeHours} hours, more than a Week of ${MAX_TIME}.`,
      );
    }
    if (!(job.educationRequired >= 0)) {
      problems.push(
        `Job "${job.id}" needs an education requirement of at least 0.`,
      );
    }
    if (
      job.educationPathRequired !== undefined &&
      !['technical', 'college'].includes(job.educationPathRequired)
    ) {
      problems.push(
        `Job "${job.id}" needs an education path of technical or college.`,
      );
    }
    if (
      job.clothingRequired !== undefined &&
      !pack.clothing.tiers.some((t) => t.id === job.clothingRequired)
    ) {
      problems.push(
        `Job "${job.id}" needs unknown clothing tier "${job.clothingRequired}".`,
      );
    }
  }
  // Each Career numbers its jobs 1 (the entry job) to n, one job per rung.
  const rungsByCareer = new Map<string, number[]>();
  for (const job of pack.jobs) {
    rungsByCareer.set(job.careerId, [
      ...(rungsByCareer.get(job.careerId) ?? []),
      job.rung,
    ]);
  }
  for (const [careerId, rungs] of rungsByCareer) {
    const sorted = [...rungs].sort((a, b) => a - b);
    if (sorted.some((rung, index) => rung !== index + 1)) {
      problems.push(
        `Career "${careerId}" needs rungs numbered 1 to ${rungs.length}, one job each.`,
      );
    }
  }
  const home = locations.find((l) => l.id === pack.homeLocationId);
  if (!home)
    problems.push(`Home Location "${pack.homeLocationId}" is not a Location.`);
  else if (home.closed) problems.push(`Home Location "${home.id}" is closed.`);

  // Goals: one row for each category, starting points inside the budget.
  const goalIds = new Set<string>();
  let startPoints = 0;
  for (const goal of pack.goals) {
    if (goalIds.has(goal.id))
      problems.push(`Goal "${goal.id}" is defined twice.`);
    goalIds.add(goal.id);
    validateGoalTarget(goal, pack.goalPointsBudget, problems);
    if (!(goal.defaultPoints >= 0))
      problems.push(`Goal "${goal.id}" needs default points of at least 0.`);
    startPoints += goal.defaultPoints;
  }
  for (const id of GOAL_IDS) {
    if (!goalIds.has(id)) problems.push(`Goal "${id}" is missing.`);
  }
  if (!(pack.goalPointsBudget > 0))
    problems.push('Goal points budget must be above 0.');
  else if (startPoints > pack.goalPointsBudget) {
    problems.push(
      `Default Goal points (${startPoints}) are over the budget of ${pack.goalPointsBudget}.`,
    );
  }
  if (!(pack.startingMoney >= 0))
    problems.push('Starting money must be at least 0.');
  if (!(pack.rentOwedLimit > 0))
    problems.push('The owed rent limit must be above 0.');
  const rentOffice = locations.find((l) => l.id === pack.rent.locationId);
  if (!rentOffice || rentOffice.closed) {
    problems.push(
      `The Rent Office Location "${pack.rent.locationId}" is missing or closed.`,
    );
  }
  if (
    !Number.isInteger(pack.rent.intervalWeeks) ||
    pack.rent.intervalWeeks < 1
  ) {
    problems.push('Rent must be due at a whole Week interval of at least 1.');
  }
  if (!(pack.rent.garnishment >= 0)) {
    problems.push('The rent garnishment must be at least 0.');
  }
  const homeRent = pack.rent.homeAmounts[pack.homeLocationId];
  if (!(homeRent >= 0)) {
    problems.push(
      `Rent needs a non-negative amount for home Location "${pack.homeLocationId}".`,
    );
  }
  for (const [homeId, amount] of Object.entries(pack.rent.homeAmounts)) {
    if (!known.has(homeId)) {
      problems.push(`Rent names unknown home Location "${homeId}".`);
    }
    if (!(amount >= 0)) {
      problems.push(`Rent for home Location "${homeId}" must be non-negative.`);
    }
  }

  const { inflation } = pack;
  if (!(inflation.startLevel > 0))
    problems.push('The starting price level must be above 0.');
  if (typeof inflation.nextLevel !== 'function')
    problems.push('The price level needs a rule (nextLevel).');
  for (const move of inflation.notableMoves) {
    if (!(move.minMove > 0)) {
      problems.push('A newspaper threshold needs a move of more than 0.');
    }
  }

  validateFood(pack, problems);
  validateHouseholdGoods(pack, problems);
  validateClothing(pack, problems);
  validateNewspaper(pack, problems);
  validateEducation(pack, problems);

  const costs = Object.entries(pack.walkingCosts);
  if (costs.length === 0) problems.push('Walking-cost table is empty.');
  for (const [steps, percent] of costs) {
    if (typeof percent !== 'number' || !(percent >= 0)) {
      problems.push(
        `Walking cost for ${steps} Steps must be a number of at least 0.`,
      );
    }
  }

  return problems;
}

function validateGoalTarget(goal: GoalDef, budget: number, problems: string[]) {
  const what = `Goal "${goal.id}"`;
  const rule = goal.target;
  switch (rule?.kind) {
    case 'per-point':
      if (!(rule.amount > 0))
        problems.push(`${what} needs a target per point above 0.`);
      return;
    case 'points-per-unit':
      if (!(rule.pointsPerUnit > 0))
        problems.push(`${what} needs points per target unit above 0.`);
      return;
    case 'bands': {
      const { bands } = rule;
      if (
        bands.some(
          (band, i) =>
            i > 0 &&
            !(
              band.maxPoints > bands[i - 1].maxPoints &&
              band.target > bands[i - 1].target
            ),
        )
      ) {
        problems.push(
          `${what} needs target bands with rising points and targets.`,
        );
      }
      if (!(bands.length > 0 && bands[bands.length - 1].maxPoints >= budget)) {
        problems.push(
          `${what} needs target bands up to the budget of ${budget}.`,
        );
      }
      return;
    }
    default:
      problems.push(`${what} needs a target table.`);
  }
}

function validateEducation(pack: DataPack, problems: string[]) {
  const { education } = pack;
  const school = pack.locations.find(
    (location) => location.id === education.locationId,
  );
  if (!school || school.closed || school.type !== 'education') {
    problems.push(
      `Education courses need an open education Location "${education.locationId}".`,
    );
  }
  if (!(education.enrollmentFee >= 0)) {
    problems.push('The course enrollment fee must be at least 0.');
  }
  if (
    !['observed', 'approved-default'].includes(education.enrollmentFeeDataBasis)
  ) {
    problems.push(
      'The course enrollment fee needs an observed or approved-default data basis.',
    );
  }
  if (!(
    education.enrollmentTimeHours >= 0 &&
    education.enrollmentTimeHours <= MAX_TIME
  )) {
    problems.push(
      `Course enrollment Time must be between 0 and ${MAX_TIME} hours.`,
    );
  }
  if (
    !['observed', 'approved-default'].includes(
      education.enrollmentTimeDataBasis,
    )
  ) {
    problems.push(
      'Course enrollment Time needs an observed or approved-default data basis.',
    );
  }
  if (education.courses.length === 0) {
    problems.push('Education needs at least one course.');
  }
  const ids = new Set<string>();
  for (const course of education.courses) {
    const what = `Course "${course.id}"`;
    if (ids.has(course.id)) problems.push(`${what} is defined twice.`);
    ids.add(course.id);
    if (course.id.trim().length === 0) {
      problems.push('Education course ids must not be empty.');
    }
    if (course.name.trim().length === 0) {
      problems.push(`${what} needs a name.`);
    }
    if (!['technical', 'college'].includes(course.path)) {
      problems.push(`${what} needs a technical or college path.`);
    }
    if (![1, 2].includes(course.level)) {
      problems.push(`${what} needs a v1 education level of 1 or 2.`);
    }
    if (
      !Number.isInteger(course.classesRequired) ||
      course.classesRequired < 1
    ) {
      problems.push(`${what} needs a whole class count of at least 1.`);
    }
    if (!(course.classTimeHours > 0 && course.classTimeHours <= MAX_TIME)) {
      problems.push(
        `${what} needs class Time above 0 and no more than ${MAX_TIME} hours.`,
      );
    }
    if (!['observed', 'approved-default'].includes(course.dataBasis)) {
      problems.push(
        `${what} needs an observed or approved-default data basis.`,
      );
    }
  }
}

function validateHouseholdGoods(pack: DataPack, problems: string[]) {
  const ids = new Set<string>();
  for (const good of pack.householdGoods.goods) {
    const what = `Household good "${good.id}"`;
    if (ids.has(good.id)) problems.push(`${what} is defined twice.`);
    ids.add(good.id);
    validateSeller(pack, problems, what, good.locationId);
    if (!(good.basePrice >= 0))
      problems.push(`${what} needs a price of at least 0.`);
    if (!(good.happinessPoints >= 0))
      problems.push(`${what} needs happiness points of at least 0.`);
    if (!(good.stockChance >= 0 && good.stockChance <= 1)) {
      problems.push(`${what} needs a stock chance between 0 and 1.`);
    }
  }
}

function validateNewspaper(pack: DataPack, problems: string[]) {
  const { newspaper } = pack;
  validateSeller(pack, problems, 'The newspaper', newspaper.locationId);
  if (!(newspaper.price >= 0)) {
    problems.push('The newspaper price must be at least 0.');
  }
  if (!(newspaper.timeHours >= 0 && newspaper.timeHours <= MAX_TIME)) {
    problems.push(
      `The newspaper reading Time must be between 0 and ${MAX_TIME} hours.`,
    );
  }
  if (
    !Number.isInteger(newspaper.issueEveryWeeks) ||
    newspaper.issueEveryWeeks < 1
  ) {
    problems.push(
      'A new newspaper issue must appear at a whole Week interval of at least 1.',
    );
  }
}

// A Location that sells something must exist and be open.
function validateSeller(
  pack: DataPack,
  problems: string[],
  what: string,
  locationId: string,
) {
  const at = pack.locations.find((l) => l.id === locationId);
  if (!at) problems.push(`${what} is at unknown Location "${locationId}".`);
  else if (at.closed)
    problems.push(`${what} is at closed Location "${at.id}".`);
}

function validateFood(pack: DataPack, problems: string[]) {
  const { food } = pack;
  if (!(food.penaltyHours >= 0 && food.penaltyHours < MAX_TIME)) {
    problems.push(
      `The hunger penalty must be at least 0 and less than a Week of ${MAX_TIME} hours.`,
    );
  }
  const ids = new Set<string>();
  for (const good of food.goods) {
    const what = `Food "${good.id}"`;
    if (ids.has(good.id)) problems.push(`${what} is defined twice.`);
    ids.add(good.id);
    validateSeller(pack, problems, what, good.locationId);
    if (!Number.isInteger(good.weeks) || good.weeks < 1) {
      problems.push(`${what} needs a whole number of Weeks, at least 1.`);
    }
    if (!(good.basePrice >= 0)) {
      problems.push(`${what} needs a price of at least 0.`);
    }
    if (!(good.timeHours >= 0 && good.timeHours <= MAX_TIME)) {
      problems.push(
        `${what} needs a Time cost between 0 and ${MAX_TIME} hours.`,
      );
    }
  }
}

function validateClothing(pack: DataPack, problems: string[]) {
  const { clothing } = pack;
  validateSeller(pack, problems, 'The clothing shop', clothing.locationId);
  if (clothing.tiers.length === 0) {
    problems.push('Clothing needs at least one tier.');
  }
  const ids = new Set<string>();
  const ranks = new Set<number>();
  for (const tier of clothing.tiers) {
    if (ids.has(tier.id)) {
      problems.push(`Clothing tier "${tier.id}" is defined twice.`);
    }
    ids.add(tier.id);
    if (ranks.has(tier.rank)) {
      problems.push(
        `Clothing tier "${tier.id}" repeats the rank ${tier.rank}.`,
      );
    }
    ranks.add(tier.rank);
    if (!(tier.basePrice >= 0)) {
      problems.push(`Clothing tier "${tier.id}" needs a price of at least 0.`);
    }
  }
  if (!ids.has(clothing.startTierId)) {
    problems.push(
      `The starting clothes "${clothing.startTierId}" are not a clothing tier.`,
    );
  }
  if (!Number.isInteger(clothing.wearOutWeeks) || clothing.wearOutWeeks < 1) {
    problems.push('Clothes need to last a whole number of Weeks, at least 1.');
  } else if (
    !Number.isInteger(clothing.warnWeeks) ||
    clothing.warnWeeks < 0 ||
    clothing.warnWeeks >= clothing.wearOutWeeks
  ) {
    problems.push(
      'The clothing warning must be a whole number of Weeks, at least 0 and less than the Weeks clothes last.',
    );
  }
}

// Validates on load; an invalid pack fails with every problem listed.
export function loadPack(pack: DataPack): DataPack {
  const problems = validatePack(pack);
  if (problems.length > 0) {
    throw new Error(`Invalid data pack:\n- ${problems.join('\n- ')}`);
  }
  return pack;
}
