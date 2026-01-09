import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useGameStore } from '@/store/useGameStore';
import { LOCATIONS, JOBS, TUITION_COST } from '@/lib/constants';

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LocationModal({ isOpen, onClose }: LocationModalProps) {
  const {
    currentLocationId,
    work,
    eat,
    attendClass,
    money,
    timeRemaining,
    educationLevel,
  } = useGameStore();

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
                      <Button
                        onClick={() => {
                          work(job.id, 4);
                          onClose();
                        }}
                        disabled={timeRemaining < 4}
                        className="text-sm"
                      >
                        Work 4hrs
                      </Button>
                      <Button
                        onClick={() => {
                          work(job.id, 8);
                          onClose();
                        }}
                        disabled={timeRemaining < 8}
                        className="text-sm"
                      >
                        Work 8hrs
                      </Button>
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
              disabled={money < TUITION_COST || timeRemaining < 4}
            >
              Attend Class (-${TUITION_COST} / 4hrs)
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
            disabled={money < 15 || timeRemaining < 1}
          >
            Buy Meal ($15 / 1hr)
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
