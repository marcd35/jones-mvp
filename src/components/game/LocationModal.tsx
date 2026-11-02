import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useGameStore } from '@/store/useGameStore';
import {
  CLASS_HOURS,
  FOOD_COST,
  JOBS,
  LOCATIONS,
  MEAL_HOURS,
  TUITION_COST,
  WORK_SHIFTS,
} from '@/lib/constants';

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LocationModal({ isOpen, onClose }: LocationModalProps) {
  const currentLocationId = useGameStore((s) => s.currentLocationId);
  const work = useGameStore((s) => s.work);
  const eat = useGameStore((s) => s.eat);
  const attendClass = useGameStore((s) => s.attendClass);
  const money = useGameStore((s) => s.money);
  const timeRemaining = useGameStore((s) => s.timeRemaining);
  const educationLevel = useGameStore((s) => s.educationLevel);
  const hasEaten = useGameStore((s) => s.hasEaten);

  const currentLocation = LOCATIONS.find((l) => l.id === currentLocationId);

  // Filter jobs available at this location
  const localJobs = JOBS.filter((j) => j.locationId === currentLocationId);

  if (!currentLocation) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={currentLocation.name}>
      <div className="space-y-4">
        <p className="text-sm text-slate-300">{currentLocation.description}</p>

        {/* === WORK INTERACTION === */}
        {currentLocation.type === 'work' && (
          <div className="space-y-3">
            {localJobs.map((job) => {
              const isQualified = educationLevel >= job.educationRequired;
              return (
                <div
                  key={job.id}
                  className="rounded border border-slate-700 bg-slate-800 p-3"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-bold text-white">{job.title}</span>
                    <span className="text-green-400">${job.wage}/hr</span>
                  </div>
                  {!isQualified ? (
                    <p className="mb-2 text-xs text-red-400">
                      Requires Education Lvl {job.educationRequired}
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {WORK_SHIFTS.map((hours) => (
                        <Button
                          key={hours}
                          onClick={() => {
                            work(job.id, hours);
                            onClose();
                          }}
                          disabled={timeRemaining < hours}
                          className="text-sm"
                        >
                          Work {hours}hrs
                        </Button>
                      ))}
                    </div>
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
