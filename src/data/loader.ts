import { ringCoordinates } from '@/lib/board';
import { MAX_TIME } from '@/lib/constants';
import type { DataPack, GoalId } from '@/types';

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
      job.clothingRequired !== undefined &&
      !pack.clothing.tiers.some((t) => t.id === job.clothingRequired)
    ) {
      problems.push(
        `Job "${job.id}" needs unknown clothing tier "${job.clothingRequired}".`,
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
    if (!(goal.perPoint > 0))
      problems.push(`Goal "${goal.id}" needs a target per point above 0.`);
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
  validateClothing(pack, problems);
  validateNewspaper(pack, problems);

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
