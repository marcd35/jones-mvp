import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useGameStore } from '@/store/useGameStore';
import { defaultPack } from '@/data';
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
    educationPath,
    enrolledCourseId,
    courseClassesCompleted,
    completedCourseIds,
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
  const enrollCourse = useGameStore((s) => s.enrollCourse);
  const attendClass = useGameStore((s) => s.attendClass);
  const payRent = useGameStore((s) => s.payRent);
  const payRentBalance = useGameStore((s) => s.payRentBalance);
  const askForMoreTime = useGameStore((s) => s.askForMoreTime);
  const currentWeek = useGameStore((s) => s.currentWeek);
  const priceSeed = useGameStore((s) => s.priceSeed);
  const priceLevel = useGameStore((s) => s.priceLevel);
  const newspaper = useGameStore((s) => s.newspaper);
  // Shop prices at this Week's hidden level (AC-010).
  const { education, food, clothing, householdGoods } = defaultPack;
  const courseFee = scalePrice(education.enrollmentFee, priceLevel);
  const enrolledCourse = education.courses.find(
    (course) => course.id === enrolledCourseId,
  );
  const myTier = tierOf(clothing, clothes);
  const wornState = clothesState(clothing, clothes);

  const currentLocation = defaultPack.locations.find(
    (l) => l.id === currentLocationId,
  );

  // Filter jobs available at this location.
  const localJobs = defaultPack.jobs.filter(
    (j) => j.locationId === currentLocationId,
  );
  const employerGroups = defaultPack.locations
    .map((location) => ({
      location,
      jobs: defaultPack.jobs.filter((job) => job.locationId === location.id),
    }))
    .filter((group) => group.jobs.length > 0);
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
        {localJobs.length > 0 && (
          <div className="space-y-3">
            <p className="flex justify-between text-sm text-slate-300">
              <span>Cash</span>
              <span className="font-mono font-bold text-white">${money}</span>
            </p>
            {localJobs.map((job) => {
              const hourlyWage =
                jobId === job.id && player.heldWage !== null
                  ? player.heldWage
                  : scalePrice(job.wage, priceLevel);
              return (
                <div
                  key={job.id}
                  className="rounded border border-slate-700 bg-slate-800 p-3"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-bold text-white">{job.title}</span>
                    <span className="text-green-400">${hourlyWage}/hr</span>
                  </div>
                  {jobId === job.id &&
                  (wornState === 'worn' ||
                    !meetsClothing(clothing, clothes, job.clothingRequired)) ? (
                    <p className="text-xs text-red-400">
                      {wornState === 'worn'
                        ? 'Your clothes are worn out. Work is refused with no pay or Time spent, and your job remains held. '
                        : `Needs ${tierName(job.clothingRequired ?? '')}. `}
                      Buy clothes at {locationName(clothing.locationId)} to work
                      again.
                    </p>
                  ) : jobId === job.id ? (
                    <Button
                      onClick={() => work()}
                      disabled={timeRemaining < job.workTimeHours}
                      className="min-h-11 w-full text-sm"
                    >
                      Work: +${hourlyWage * job.shiftHours} for{' '}
                      {formatHours(job.workTimeHours)} hrs
                    </Button>
                  ) : (
                    <p className="text-xs text-slate-400">
                      Not your job. Get hired at an employment office.
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* === EMPLOYMENT INTERACTION === */}
        {currentLocation.type === 'employment' && (
          <div className="space-y-3">
            <p className="text-xs text-slate-300">
              Listed wages use this Week&apos;s price level. Hiring fixes the
              offered hourly wage. No job has a clothing tier; worn or torn
              clothes block Work at every employer.
            </p>
            {employerGroups.map(({ location, jobs }) => (
              <section
                key={location.id}
                aria-label={`${location.name} jobs`}
                className="space-y-2"
              >
                <h3 className="text-sm font-bold text-white">
                  {location.name}
                </h3>
                {jobs.map((job) => {
                  const hasEducationLevel =
                    educationLevel >= job.educationRequired;
                  const hasEducationPath =
                    job.educationPathRequired === undefined ||
                    player.educationPath === job.educationPathRequired;
                  const isEducationQualified =
                    hasEducationLevel && hasEducationPath;
                  const careerExperience =
                    player.careerExperience[job.careerId] ?? 0;
                  const isExperienceQualified =
                    careerExperience >= job.experienceRequired;
                  const hourlyWage = scalePrice(job.wage, priceLevel);
                  const shiftPay = hourlyWage * job.shiftHours;
                  return (
                    <div
                      key={job.id}
                      className="rounded border border-slate-700 bg-slate-800 p-3"
                    >
                      <div className="mb-1 flex items-center justify-between">
                        <span className="font-bold text-white">
                          {job.title}
                        </span>
                        <span className="text-green-400">${hourlyWage}/hr</span>
                      </div>
                      <p className="mb-2 text-xs text-slate-400">
                        ${shiftPay} for a {job.shiftHours}-hour shift
                      </p>
                      <dl className="mb-2 space-y-1 text-xs text-slate-400">
                        <div>
                          <dt className="inline font-semibold">Education: </dt>
                          <dd className="inline">{job.educationLabel}</dd>
                        </div>
                        <div>
                          <dt className="inline font-semibold">
                            Career experience:{' '}
                          </dt>
                          <dd className="inline">
                            {job.experienceRequired === 0
                              ? 'None'
                              : `${job.experienceRequired} ${job.experienceRequired === 1 ? 'point' : 'points'} (${careerExperience} earned)`}
                          </dd>
                        </div>
                        <div>
                          <dt className="inline font-semibold">Clothing: </dt>
                          <dd className="inline">
                            No job-specific tier; worn or torn clothes block
                            Work globally.
                          </dd>
                        </div>
                      </dl>
                      {jobId === job.id ? (
                        <p className="text-xs font-bold text-green-400">
                          Your job — held at ${player.heldWage ?? hourlyWage}/hr
                        </p>
                      ) : !isEducationQualified ? (
                        <p className="text-xs text-red-400">
                          {hasEducationLevel
                            ? `Locked: requires the ${job.educationPathRequired} education path; your current path is ${player.educationPath ?? 'none'}.`
                            : `Locked: requires ${job.educationLabel}.`}
                        </p>
                      ) : !isExperienceQualified ? (
                        <p className="text-xs text-red-400">
                          Locked: needs {job.experienceRequired}{' '}
                          {job.experienceRequired === 1 ? 'point' : 'points'} of
                          experience in this Career; you have {careerExperience}
                          .
                        </p>
                      ) : (
                        <Button
                          onClick={() => hire(job.id)}
                          className="min-h-11 w-full text-sm"
                          aria-label={`Take the ${job.title} job at ${location.name}`}
                        >
                          Apply
                        </Button>
                      )}
                    </div>
                  );
                })}
              </section>
            ))}
          </div>
        )}

        {/* === UNIVERSITY INTERACTION === */}
        {currentLocation.type === 'education' && (
          <section aria-label="Education" className="space-y-3">
            <div className="flex justify-between text-sm text-slate-300">
              <span>Education level:</span>
              <span className="font-bold text-white">
                {educationLevel} {educationPath ? `(${educationPath})` : ''}
              </span>
            </div>

            {completedCourseIds.length > 0 && (
              <div className="space-y-1 text-sm text-slate-300">
                <h3 className="font-semibold text-white">Completed courses</h3>
                <ul className="list-inside list-disc">
                  {completedCourseIds.map((courseId) => {
                    const course = education.courses.find(
                      (item) => item.id === courseId,
                    );
                    return course ? (
                      <li key={course.id}>{course.name}</li>
                    ) : null;
                  })}
                </ul>
              </div>
            )}

            {enrolledCourse ? (
              <div className="space-y-2 rounded border border-slate-700 bg-slate-800 p-3">
                <h3 className="font-semibold text-white">
                  In progress: {enrolledCourse.name}
                </h3>
                <p className="text-sm text-slate-300">
                  {courseClassesCompleted} of {enrolledCourse.classesRequired}{' '}
                  classes complete
                </p>
                <Button
                  onClick={attendClass}
                  className="w-full bg-indigo-600 hover:bg-indigo-700"
                  disabled={timeRemaining < enrolledCourse.classTimeHours}
                >
                  Attend class ({formatHours(enrolledCourse.classTimeHours)} hr)
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-white">
                  Courses at Hi-Tech U
                </h3>
                {education.courses.map((course) => {
                  const completed = completedCourseIds.includes(course.id);
                  const nextLevel = course.level === educationLevel + 1;
                  const samePath =
                    educationPath === null || educationPath === course.path;
                  const canEnroll = !completed && nextLevel && samePath;
                  const lockedReason = completed
                    ? 'Completed'
                    : !samePath
                      ? `Locked: requires the ${course.path} education path; your current path is ${educationPath}.`
                      : course.level <= educationLevel
                        ? `Locked: v1 allows one course at each level; level ${educationLevel} is complete.`
                        : `Locked: complete an education level ${course.level - 1} course first.`;

                  return (
                    <div
                      key={course.id}
                      className="rounded border border-slate-700 bg-slate-800 p-3"
                    >
                      <p className="text-sm font-semibold text-white">
                        {course.name} — level {course.level} ({course.path})
                      </p>
                      {canEnroll ? (
                        <Button
                          onClick={() => enrollCourse(course.id)}
                          className="mt-2 min-h-11 w-full bg-indigo-600 hover:bg-indigo-700"
                          disabled={
                            money < courseFee ||
                            timeRemaining < education.enrollmentTimeHours
                          }
                        >
                          Enroll in {course.name} (${courseFee} /{' '}
                          {formatHours(education.enrollmentTimeHours)} hr)
                        </Button>
                      ) : (
                        <p className="mt-1 text-xs text-slate-300">
                          {lockedReason}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
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
