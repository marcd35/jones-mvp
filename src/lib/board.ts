import type { BoardCell, BoardLayout, WalkingCostTable } from '@/types';

// Coordinates of the outer ring of a size x size grid, clockwise from the
// top-left corner.
export function ringCoordinates(size: number): [number, number][] {
  const last = size - 1;
  const coords: [number, number][] = [];
  for (let c = 0; c <= last; c++) coords.push([0, c]);
  for (let r = 1; r <= last; r++) coords.push([r, last]);
  for (let c = last - 1; c >= 0; c--) coords.push([last, c]);
  for (let r = last - 1; r >= 1; r--) coords.push([r, 0]);
  return coords;
}

// The layout's cells in ring order. Assumes a layout that passed validation.
export function ringCells(layout: BoardLayout): BoardCell[] {
  return ringCoordinates(layout.size).map(([row, col]) => {
    const cell = layout.cells.find((c) => c.row === row && c.col === col);
    if (!cell) throw new Error(`Board layout has no cell at ${row},${col}.`);
    return cell;
  });
}

export function ringIndexOf(layout: BoardLayout, locationId: string): number {
  return ringCells(layout).findIndex(
    (c) => c.content.kind === 'location' && c.content.locationId === locationId,
  );
}

// Steps between two Locations by the shorter way round the ring, or null when
// either is not a Location on the ring (the Clock and blank cells are not
// destinations).
export function walkingSteps(
  layout: BoardLayout,
  fromId: string,
  toId: string,
): number | null {
  const from = ringIndexOf(layout, fromId);
  const to = ringIndexOf(layout, toId);
  if (from < 0 || to < 0) return null;
  const length = ringCoordinates(layout.size).length;
  const gap = Math.abs(from - to);
  return Math.min(gap, length - gap);
}

// Hours a walk of `steps` costs. The table gives percent of a Week at some
// distances; others are interpolated, and distances past the last entry cost
// what the last entry does.
export function walkingCostHours(
  table: WalkingCostTable,
  steps: number,
  hoursPerWeek: number,
): number {
  if (steps <= 0) return 0;
  const known = Object.keys(table)
    .map(Number)
    .sort((a, b) => a - b);
  const below = known.filter((d) => d <= steps).pop();
  const above = known.find((d) => d >= steps);
  let percent: number;
  if (below === undefined) percent = table[known[0]];
  else if (above === undefined || below === above) percent = table[below];
  else {
    const t = (steps - below) / (above - below);
    percent = table[below] + (table[above] - table[below]) * t;
  }
  return Math.round(percent * hoursPerWeek * 10) / 1000;
}
