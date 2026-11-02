import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useGameStore } from '@/store/useGameStore';
import { defaultPack } from '@/data';
import {
  CLASS_HOURS,
  FOOD_COST,
  MEAL_HOURS,
  TUITION_COST,
} from '@/lib/constants';
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
    hasEaten,
    jobId,
  } = player;
  const hire = useGameStore((s) => s.hire);
  const work = useGameStore((s) => s.work);
  const eat = useGameStore((s) => s.eat);
  const attendClass = useGameStore((s) => s.attendClass);

  const currentLocation = defaultPack.locations.find(
    (l) => l.id === currentLocationId,
  );

  // Filter jobs available at this location
  const localJobs = defaultPack.jobs.filter(
    (j) => j.locationId === currentLocationId,
  );
  const locationName = (id: string) =>
    defaultPack.locations.find((l) => l.id === id)?.name ?? id;

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
                {jobId === job.id ? (
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
                  {!isQualified ? (
                    <p className="text-xs text-red-400">
                      Requires Education Lvl {job.educationRequired}
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
              disabled={money < TUITION_COST || timeRemaining < CLASS_HOURS}
            >
              Attend Class (-${TUITION_COST} / {CLASS_HOURS}hrs)
            </Button>
          </div>
        )}

        {/* === STORE INTERACTION === */}
        {currentLocation.type === 'store' && (
          <Button
            onClick={() => {
              eat();
              onClose();
            }}
            className="w-full bg-orange-600 hover:bg-orange-700"
            disabled={
              hasEaten || money < FOOD_COST || timeRemaining < MEAL_HOURS
            }
          >
            {hasEaten
              ? 'Already ate this week'
              : `Buy Meal ($${FOOD_COST} / ${MEAL_HOURS}hr)`}
          </Button>
        )}

        {/* === HOUSING INTERACTION === */}
        {currentLocation.type === 'housing' && (
          <div className="rounded-lg bg-slate-800 p-4 text-center">
            <p className="text-sm text-slate-400">
              Safe and sound. Nothing to do here but rest.
            </p>
          </div>
        )}

        <Button variant="ghost" onClick={onClose} className="mt-4 w-full">
          Leave
        </Button>
      </div>
    </Modal>
  );
}
