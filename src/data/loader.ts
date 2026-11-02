import { ringCoordinates } from '@/lib/board';
import type { DataPack } from '@/types';

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
  for (const job of pack.jobs) {
    if (!known.has(job.locationId)) {
      problems.push(
        `Job "${job.id}" is at unknown Location "${job.locationId}".`,
      );
    }
  }
  const home = locations.find((l) => l.id === pack.homeLocationId);
  if (!home)
    problems.push(`Home Location "${pack.homeLocationId}" is not a Location.`);
  else if (home.closed) problems.push(`Home Location "${home.id}" is closed.`);

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

// Validates on load; an invalid pack fails with every problem listed.
export function loadPack(pack: DataPack): DataPack {
  const problems = validatePack(pack);
  if (problems.length > 0) {
    throw new Error(`Invalid data pack:\n- ${problems.join('\n- ')}`);
  }
  return pack;
}
