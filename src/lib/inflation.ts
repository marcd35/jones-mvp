import { createRandom, type Random } from '@/lib/random';
import type { InflationContext, InflationRule } from '@/types';

// The hidden price level (AC-010, DEC-024). Levels are kept to two decimals so
// the same seed gives the same sequence on any machine and prices never carry
// float dust. The rule that picks each Week's level is data (InflationRule).

const HUNDREDTHS = 100;

// Levels are held to the nearest hundredth.
export const roundLevel = (level: number) =>
  Math.round(level * HUNDREDTHS) / HUNDREDTHS;

// The documented rounding of a scaled price: base price x level, rounded to
// whole dollars, halves up (15 x 1.10 = 16.50 costs $17), computed on whole
// hundredths so a half is never lost to float error.
export const scalePrice = (base: number, level: number) =>
  Math.round((base * Math.round(level * HUNDREDTHS)) / HUNDREDTHS);

// Draws one seed for a game from a random source.
export const drawSeed = (random: Random) => Math.floor(random.next() * 2 ** 32);

// Each Week's step has its own stream, derived from the game's seed and the
// Week. A saved game then needs only its seed and Week to carry on the same
// sequence after a refresh.
const weekRandom = (seed: number, week: number): Random =>
  createRandom(seed + Math.imul(week, 0x9e3779b1));

// The level for `week` given the level before it. A rule that returns nothing
// usable leaves the level where it was.
export function nextPriceLevel(
  rule: InflationRule,
  seed: number,
  week: number,
  previous: number,
): number {
  const next = rule.nextLevel({
    week,
    previous,
    random: weekRandom(seed, week),
  });
  return Number.isFinite(next) && next > 0 ? roundLevel(next) : previous;
}

// The default rule: a random level within [min, max] each Week (DEC-024). The
// range is the pack's, passed in; nothing here is a number of the game.
export function randomWithinRange(range: {
  min: number;
  max: number;
}): (context: InflationContext) => number {
  return ({ random }) => range.min + random.next() * (range.max - range.min);
}

// The newspaper's headline for a move from `previous` to `next`, or null when
// the move is below every threshold. The largest threshold met names it.
export function newspaperHeadline(
  rule: InflationRule,
  previous: number,
  next: number,
): string | null {
  const move = Math.round((next - previous) * HUNDREDTHS);
  const size = Math.abs(move);
  const met = rule.notableMoves
    .filter((m) => size >= Math.round(m.minMove * HUNDREDTHS))
    .sort((a, b) => b.minMove - a.minMove)[0];
  if (!met || move === 0) return null;
  return move > 0 ? met.up : met.down;
}

const fixed = (level: number) => level.toFixed(2);

// The weekend report's inflation step line.
export const inflationStepText = (previous: number, next: number) =>
  next === previous
    ? `Price level stays at ${fixed(next)}.`
    : `Price level moves from ${fixed(previous)} to ${fixed(next)}.`;
