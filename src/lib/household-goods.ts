import type { DataPack, HouseholdGood } from '@/types';
import { createRandom } from './random';

const sampleSeed = (
  seed: number,
  week: number,
  locationId: string,
  goodId: string,
) => {
  const key = `${seed >>> 0}:${week}:${locationId}:${goodId}`;
  let hash = 0x811c9dc5;
  for (let index = 0; index < key.length; index++) {
    hash ^= key.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
};

// A pure Week/seed lookup: viewing stock or buying something never advances
// the random stream used by inflation or other game events.
export function householdStockForWeek(
  pack: DataPack,
  week: number,
  seed: number,
  locationId: string,
): HouseholdGood[] {
  return pack.householdGoods.goods.filter((good) => {
    if (good.locationId !== locationId) return false;
    if (good.stockChance <= 0) return false;
    if (good.stockChance >= 1) return true;
    return (
      createRandom(sampleSeed(seed, week, locationId, good.id)).next() <
      good.stockChance
    );
  });
}

export function ownedGoodsHappiness(pack: DataPack, ownedGoods: string[]) {
  const owned = new Set(ownedGoods);
  return pack.householdGoods.goods.reduce(
    (total, good) => total + (owned.has(good.id) ? good.happinessPoints : 0),
    0,
  );
}
