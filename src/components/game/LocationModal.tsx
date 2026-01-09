import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useGameStore } from '@/store/useGameStore';
import { LOCATIONS, JOBS } from '@/lib/constants';

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LocationModal({ isOpen, onClose }: LocationModalProps) {
  const { currentLocationId, work, eat, money, timeRemaining } = useGameStore();

  const currentLocation = LOCATIONS.find((l) => l.id === currentLocationId);
  const currentJob = JOBS.find((j) => j.locationId === currentLocationId);

  if (!currentLocation) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={currentLocation.name}>
      <div className="space-y-4">
        <p className="text-slate-300">{currentLocation.description}</p>

        {/* ACTION: WORK */}
        {currentLocation.type === 'work' && currentJob && (
          <div className="space-y-2">
            <h4 className="text-sm font-bold text-slate-400 uppercase">
              Shift Options
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={() => {
                  work(4);
                  onClose();
                }}
                disabled={timeRemaining < 4}
              >
                Work 4hrs (+${currentJob.wage * 4})
              </Button>
              <Button
                onClick={() => {
                  work(8);
                  onClose();
                }}
                disabled={timeRemaining < 8}
              >
                Work 8hrs (+${currentJob.wage * 8})
              </Button>
            </div>
          </div>
        )}

        {/* ACTION: STORE */}
        {currentLocation.type === 'store' && (
          <div className="space-y-2">
            <h4 className="text-sm font-bold text-slate-400 uppercase">Shop</h4>
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
          </div>
        )}

        {/* ACTION: HOUSING */}
        {currentLocation.type === 'housing' && (
          <div className="rounded-lg bg-slate-800 p-4 text-center">
            <p className="text-sm text-slate-400">
              Safe and sound. Nothing to do here but rest.
            </p>
          </div>
        )}

        {/* GENERIC CLOSE */}
        <Button variant="ghost" onClick={onClose} className="mt-4 w-full">
          Leave
        </Button>
      </div>
    </Modal>
  );
}
