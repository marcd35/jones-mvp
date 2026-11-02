import { describe, expect, it } from 'vitest';
import { defaultPack } from '@/data';
import { ringCells, walkingCostHours, walkingSteps } from './board';

const { layout, locations, walkingCosts } = defaultPack;
const destinations = layout.cells.flatMap((c) =>
  c.content.kind === 'location' ? [c.content.locationId] : [],
);

describe('ringCells', () => {
  it('lists the 16 ring cells clockwise from the top-left corner', () => {
    const names = ringCells(layout).map((c) =>
      c.content.kind === 'location' ? c.content.locationId : c.content.kind,
    );
    expect(names).toEqual([
      'le-security',
      'rent-office',
      'low-cost-housing',
      'pawn-shop',
      'z-mart',
      'monolith-burger',
      'qt-clothing',
      'blank',
      'socket-city',
      'hi-tech-u',
      'clock',
      'employment-office',
      'factory',
      'bank',
      'blacks-market',
      'blank',
    ]);
  });
});

describe('walkingSteps', () => {
  it('counts one Step between neighbours, also across the corners', () => {
    expect(walkingSteps(layout, 'le-security', 'rent-office')).toBe(1);
    expect(walkingSteps(layout, 'z-mart', 'monolith-burger')).toBe(1);
    expect(walkingSteps(layout, 'bank', 'factory')).toBe(1);
  });

  it('counts a Step per cell, including the Clock and blank cells', () => {
    // Hi-Tech U and Employment Office are separated by the Clock cell.
    expect(walkingSteps(layout, 'hi-tech-u', 'employment-office')).toBe(2);
    // QT Clothing to Socket City passes the blank cell.
    expect(walkingSteps(layout, 'qt-clothing', 'socket-city')).toBe(2);
  });

  it('takes the shorter direction around the ring', () => {
    // Index 0 to index 12 is 12 clockwise but 4 the other way.
    expect(walkingSteps(layout, 'le-security', 'factory')).toBe(4);
    expect(walkingSteps(layout, 'le-security', 'z-mart')).toBe(4);
  });

  it('is symmetric and at most half the ring for every pair', () => {
    for (const a of destinations) {
      for (const b of destinations) {
        if (a === b) continue;
        const steps = walkingSteps(layout, a, b)!;
        expect(steps).toBe(walkingSteps(layout, b, a));
        expect(steps).toBeGreaterThanOrEqual(1);
        expect(steps).toBeLessThanOrEqual(8);
      }
    }
  });

  it('is zero for the same Location', () => {
    expect(walkingSteps(layout, 'z-mart', 'z-mart')).toBe(0);
  });

  it('has no route to the Clock, blank cells or unknown places', () => {
    expect(walkingSteps(layout, 'z-mart', 'clock')).toBeNull();
    expect(walkingSteps(layout, 'z-mart', 'moon')).toBeNull();
    expect(walkingSteps(layout, 'moon', 'z-mart')).toBeNull();
  });

  it('only offers the 13 Locations as destinations', () => {
    expect(destinations).toHaveLength(13);
    expect(new Set(destinations)).toEqual(new Set(locations.map((l) => l.id)));
  });
});

describe('walkingCostHours', () => {
  const hours = (steps: number) => walkingCostHours(walkingCosts, steps, 12);

  it('reads measured distances as a percent of the Week', () => {
    expect(hours(1)).toBeCloseTo(0.468, 3);
    expect(hours(2)).toBeCloseTo(0.66, 3);
    expect(hours(3)).toBeCloseTo(0.924, 3);
    expect(hours(6)).toBeCloseTo(1.392, 3);
    expect(hours(7)).toBeCloseTo(1.392, 3);
  });

  it('interpolates distances 4 and 5 between 3 and 6', () => {
    expect(hours(4)).toBeCloseTo(1.08, 3);
    expect(hours(5)).toBeCloseTo(1.236, 3);
  });

  it('rises less than in proportion to distance', () => {
    expect(hours(7)).toBeLessThan(7 * hours(1));
    expect(hours(3)).toBeLessThan(3 * hours(1));
  });

  it('costs the last measured amount beyond the table', () => {
    expect(hours(8)).toBeCloseTo(hours(7), 3);
  });

  it('costs nothing for no Steps', () => {
    expect(hours(0)).toBe(0);
  });
});
