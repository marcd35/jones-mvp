import type { DataPack, HouseholdGood } from '@/types';
import { createRandom } from './random';

// A pure Week/seed lookup: viewing stock or buying something never advances
// the random stream used by inflation or other game events.
export function householdStockForWeek(
  pack: DataPack,
  week: number,
  seed: number,
  locationId: string,
): HouseholdGood[] {
  const goods = pack.householdGoods.goods.filter(
    (good) => good.locationId === locationId,
  );
  if (goods.length < 2) return goods;
  const random = createRandom(seed >>> 0);
  const seedOffset = Math.floor(random.next() * goods.length);
  const count = Math.max(
    1,
    Math.min(
      goods.length - 1,
      Math.round(
        (goods.reduce((sum, good) => sum + good.stockChance, 0) /
          goods.length) *
          goods.length,
      ),
    ),
  );
  const offset = (seedOffset + week - 1) % goods.length;
  return Array.from(
    { length: count },
    (_, index) => goods[(offset + index) % goods.length],
  );
}

export function ownedGoodsHappiness(pack: DataPack, ownedGoods: string[]) {
  const owned = new Set(ownedGoods);
  return pack.householdGoods.goods.reduce(
    (total, good) => total + (owned.has(good.id) ? good.happinessPoints : 0),
    0,
  );
}
