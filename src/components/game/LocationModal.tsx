import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useGameStore } from '@/store/useGameStore';
import { defaultPack } from '@/data';
import { CLASS_HOURS, TUITION_COST } from '@/lib/constants';
import { clothesState, meetsClothing, tierOf, weeksLeft } from '@/lib/clothing';
import { scalePrice } from '@/lib/inflation';
import { newspaperIssueSchedule } from '@/lib/newspaper';
import { householdStockForWeek } from '@/lib/household-goods';
import { formatHours } from './TimeDial';

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LocationModal({ isOpen, onClose }: LocationModalProps) {
  const player = useGameStore((s) => s.players[s.turnIndex]);
  const {
    locationId: currentLocationId,
    money,
    timeRemaining,
    educationLevel,
    foodWeeks,
    clothes,
    jobId,
    owedRent,
    rentDueWeek,
    rentExtensionAskedWeek,
  } = player;
  const hire = useGameStore((s) => s.hire);
  const work = useGameStore((s) => s.work);
  const buyFood = useGameStore((s) => s.buyFood);
  const buyHouseholdGood = useGameStore((s) => s.buyHouseholdGood);
  const buyClothes = useGameStore((s) => s.buyClothes);
  const buyNewspaper = useGameStore((s) => s.buyNewspaper);
  const attendClass = useGameStore((s) => s.attendClass);
  const payRent = useGameStore((s) => s.payRent);
  const payRentBalance = useGameStore((s) => s.payRentBalance);
  const askForMoreTime = useGameStore((s) => s.askForMoreTime);
  const currentWeek = useGameStore((s) => s.currentWeek);
  const priceSeed = useGameStore((s) => s.priceSeed);
  const priceLevel = useGameStore((s) => s.priceLevel);
  const newspaper = useGameStore((s) => s.newspaper);
  // Shop prices at this Week's hidden level (AC-010).
  const tuition = scalePrice(TUITION_COST, priceLevel);
  const { food, clothing, householdGoods } = defaultPack;
  const myTier = tierOf(clothing, clothes);
  const wornState = clothesState(clothing, clothes);

  const currentLocation = defaultPack.locations.find(
    (l) => l.id === currentLocationId,
  );

  // Filter jobs available at this location
  const localJobs = defaultPack.jobs.filter(
    (j) => j.locationId === currentLocationId,
  );
  const locationName = (id: string) =>
    defaultPack.locations.find((l) => l.id === id)?.name ?? id;
  const tierName = (id: string) =>
    clothing.tiers.find((t) => t.id === id)?.name ?? id;
  const localFood = food.goods.filter(
    (g) => g.locationId === currentLocationId,
  );
  const localGoods = householdStockForWeek(
    defaultPack,
    currentWeek,
    priceSeed,
    currentLocationId,
  );
  const ownedGoods = player.ownedGoods
    .map((id) => householdGoods.goods.find((good) => good.id === id))
    .filter((good) => good !== undefined);
  const sellsClothes = currentLocationId === clothing.locationId;
  const newspaperRules = defaultPack.newspaper;
  const sellsNewspaper = currentLocationId === newspaperRules.locationId;
  const newspaperIssueScheduleForWeek = newspaperIssueSchedule(
    currentWeek,
    newspaperRules.issueEveryWeeks,
  );
  const hasReadNewspaper = player.newspaperReadWeek === currentWeek;
  const rentDue = currentWeek >= rentDueWeek;
  const extensionAskedThisWeek = rentExtensionAskedWeek === currentWeek;
  const rentAmount = defaultPack.rent.homeAmounts[defaultPack.homeLocationId];

  if (!currentLocation) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={currentLocation.name}>
      <div className="space-y-4">
        <p className="text-sm text-slate-300">{currentLocation.description}</p>

        {/* === WORK INTERACTION === */}
        {currentLocation.type === 'work' && (
          <div className="space-y-3">
            <p className="flex justify-between text-sm text-slate-300">
              <span>Cash</span>
              <span className="font-mono font-bold text-white">${money}</span>
            </p>
            {localJobs.map((job) => (
              <div
                key={job.id}
                className="rounded border border-slate-700 bg-slate-800 p-3"
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-bold text-white">{job.title}</span>
                  <span className="text-green-400">${job.wage}/hr</span>
                </div>
                {jobId === job.id &&
                !meetsClothing(clothing, clothes, job.clothingRequired) ? (
                  <p className="text-xs text-red-400">
                    {wornState === 'worn'
                      ? 'Your clothes are worn out. '
                      : `Needs ${tierName(job.clothingRequired ?? '')}. `}
                    Buy clothes at {locationName(clothing.locationId)}.
                  </p>
                ) : jobId === job.id ? (
                  <Button
                    onClick={() => work()}
                    disabled={timeRemaining < job.workTimeHours}
                    className="min-h-11 w-full text-sm"
                  >
                    Work: +${job.wage * job.shiftHours} for{' '}
                    {formatHours(job.workTimeHours)} hrs
                  </Button>
                ) : (
                  <p className="text-xs text-slate-400">
                    Not your job. Get hired at an employment office.
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* === EMPLOYMENT INTERACTION === */}
        {currentLocation.type === 'employment' && (
          <div className="space-y-3">
            {defaultPack.jobs.map((job) => {
              const isQualified = educationLevel >= job.educationRequired;
              return (
                <div
                  key={job.id}
                  className="rounded border border-slate-700 bg-slate-800 p-3"
                >
                  <div className="mb-1 flex items-center justify-between">
                    <span className="font-bold text-white">{job.title}</span>
                    <span className="text-green-400">${job.wage}/hr</span>
                  </div>
                  <p className="mb-2 text-xs text-slate-400">
                    {locationName(job.locationId)}: ${job.wage * job.shiftHours}{' '}
                    a shift
                  </p>
                  {job.clothingRequired !== undefined && (
                    <p className="mb-2 text-xs text-slate-400">
                      Dress: {tierName(job.clothingRequired)} or better
                    </p>
                  )}
                  {!isQualified ? (
                    <p className="text-xs text-red-400">
                      Requires Education Lvl {job.educationRequired}
                    </p>
                  ) : !meetsClothing(
                      clothing,
                      clothes,
                      job.clothingRequired,
                    ) ? (
                    <p className="text-xs text-red-400">
                      {wornState === 'worn'
                        ? 'Your clothes are worn out.'
                        : `Requires ${tierName(job.clothingRequired ?? '')}.`}{' '}
                      Buy clothes at {locationName(clothing.locationId)}.
                    </p>
                  ) : jobId === job.id ? (
                    <p className="text-xs font-bold text-green-400">Your job</p>
                  ) : (
                    <Button
                      onClick={() => hire(job.id)}
                      className="min-h-11 w-full text-sm"
                      aria-label={`Take the ${job.title} job`}
                    >
                      Take job
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* === UNIVERSITY INTERACTION === */}
        {currentLocation.type === 'education' && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-slate-300">
              <span>Current Level:</span>
              <span className="font-bold text-white">{educationLevel}</span>
            </div>
            <Button
              onClick={() => {
                attendClass();
                onClose();
              }}
              className="w-full bg-indigo-600 hover:bg-indigo-700"
              disabled={money < tuition || timeRemaining < CLASS_HOURS}
            >
              Attend Class (-${tuition} / {CLASS_HOURS}hrs)
            </Button>
          </div>
        )}

        {/* === FOOD (AC-007): any Location whose data sells food === */}
        {localFood.length > 0 && (
          <section aria-label="Food" className="space-y-2">
            <p className="flex justify-between text-sm text-slate-300">
              <span>Food in hand</span>
              <span className="font-bold text-white">
                {foodWeeks > 0
                  ? `${foodWeeks} ${foodWeeks === 1 ? 'Week' : 'Weeks'}`
                  : 'None: this Week needs food'}
              </span>
            </p>
            {localFood.map((good) => {
              const price = scalePrice(good.basePrice, priceLevel);
              return (
                <Button
                  key={good.id}
                  onClick={() => buyFood(good.id)}
                  className="min-h-11 w-full bg-orange-600 hover:bg-orange-700"
                  disabled={money < price || timeRemaining < good.timeHours}
                >
                  Buy {good.name} (${price} / {formatHours(good.timeHours)}hr)
                </Button>
              );
            })}
          </section>
        )}

        {localGoods.length > 0 && (
          <section aria-label="Household goods" className="space-y-2">
            <h3 className="text-sm font-bold text-white">Goods in stock</h3>
            {localGoods.map((good) => {
              const price = scalePrice(good.basePrice, priceLevel);
              const alreadyOwned = player.ownedGoods.includes(good.id);
              return (
                <Button
                  key={good.id}
                  onClick={() => buyHouseholdGood(good.id)}
                  className="min-h-11 w-full bg-cyan-700 hover:bg-cyan-800"
                  disabled={alreadyOwned || money < price}
                >
                  {alreadyOwned ? 'Owned: ' : 'Buy '}
                  {good.name} (${price})
                </Button>
              );
            })}
          </section>
        )}

        {sellsNewspaper && (
          <section aria-label="Newspaper" className="space-y-2">
            <h3 className="text-sm font-bold text-white">Newspaper</h3>
            {hasReadNewspaper ? (
              <p className="rounded border border-slate-700 bg-slate-800 p-3 text-sm text-white">
                {newspaper ?? 'Nothing notable in the news this Week.'}
              </p>
            ) : newspaperIssueScheduleForWeek.available ? (
              <Button
                onClick={() => buyNewspaper()}
                disabled={
                  money < newspaperRules.price ||
                  timeRemaining < newspaperRules.timeHours
                }
                className="min-h-11 w-full"
              >
                Buy this Week&apos;s newspaper (${newspaperRules.price} /{' '}
                {formatHours(newspaperRules.timeHours)} hrs)
              </Button>
            ) : (
              <p className="text-sm text-slate-300">
                The next issue arrives in Week{' '}
                {newspaperIssueScheduleForWeek.nextIssueWeek}.
              </p>
            )}
          </section>
        )}

        {/* === CLOTHING (AC-008): the Location the data names === */}
        {sellsClothes && (
          <section aria-label="Clothing" className="space-y-2">
            <p className="flex justify-between text-sm text-slate-300">
              <span>You wear</span>
              <span
                className={
                  wornState === 'good' ? 'text-white' : 'text-orange-300'
                }
              >
                {!myTier
                  ? 'Nothing'
                  : wornState === 'worn'
                    ? `${myTier.name} (worn out)`
                    : wornState === 'warning'
                      ? `${myTier.name} (wears out in ${weeksLeft(clothing, clothes)} ${weeksLeft(clothing, clothes) === 1 ? 'Week' : 'Weeks'})`
                      : myTier.name}
              </span>
            </p>
            {clothing.tiers.map((tier) => {
              const price = scalePrice(tier.basePrice, priceLevel);
              return (
                <Button
                  key={tier.id}
                  onClick={() => buyClothes(tier.id)}
                  className="min-h-11 w-full bg-teal-700 hover:bg-teal-800"
                  disabled={money < price}
                >
                  Buy {tier.name} (${price})
                </Button>
              );
            })}
          </section>
        )}

        {/* === HOUSING INTERACTION === */}
        {currentLocation.type === 'housing' && (
          <div className="space-y-3">
            <div className="rounded-lg bg-slate-800 p-4 text-center">
              <p className="text-sm text-slate-400">
                Safe and sound. Nothing to do here but rest.
              </p>
            </div>
          </div>
        )}

        {ownedGoods.length > 0 && (
          <section aria-label="Owned goods" className="space-y-2">
            <h3 className="text-sm font-bold text-white">Owned goods</h3>
            <ul className="list-inside list-disc text-sm text-slate-300">
              {ownedGoods.map((good) => (
                <li key={good.id}>{good.name}</li>
              ))}
            </ul>
          </section>
        )}

        {/* === RENT OFFICE === */}
        {currentLocationId === defaultPack.rent.locationId && (
          <section aria-label="Rent Office" className="space-y-3">
            <p className="flex justify-between text-sm text-slate-300">
              <span>Rent owed</span>
              <span className="font-mono font-bold text-white">
                ${owedRent}
              </span>
            </p>
            {rentDue ? (
              <>
                <p className="text-sm text-slate-300">
                  Rent of ${rentAmount} is due this Week.
                </p>
                <Button
                  onClick={() => payRent()}
                  disabled={money < rentAmount}
                  className="min-h-11 w-full"
                >
                  Pay rent (${rentAmount})
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => askForMoreTime()}
                  className="min-h-11 w-full"
                >
                  Ask For More Time
                </Button>
                {owedRent > 0 && (
                  <Button
                    variant="secondary"
                    onClick={() => payRentBalance()}
                    disabled={money < owedRent}
                    className="min-h-11 w-full"
                  >
                    Pay rent balance (${owedRent})
                  </Button>
                )}
              </>
            ) : extensionAskedThisWeek ? (
              <p className="text-sm text-slate-300">
                You have until Week {rentDueWeek} to pay rent. You already asked
                for more time this Week.
              </p>
            ) : (
              <p className="text-sm text-slate-300">
                The Rent Office is closed because rent is not due this Week.
                Next due in Week {rentDueWeek}.
              </p>
            )}
          </section>
        )}

        <Button variant="ghost" onClick={onClose} className="mt-4 w-full">
          Leave
        </Button>
      </div>
    </Modal>
  );
}
