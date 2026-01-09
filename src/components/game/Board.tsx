'use client';

import { useState } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { LOCATIONS, TRAVEL_COST } from '@/lib/constants';
import { LocationTile } from './LocationTile';
import { LocationModal } from './LocationModal';

export function Board() {
  const { currentLocationId, movePlayer, timeRemaining } = useGameStore();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleTileAction = (locationId: string) => {
    // If we are already here, open the menu
    if (locationId === currentLocationId) {
      setIsModalOpen(true);
    } else {
      // Otherwise move there
      movePlayer(locationId);
    }
  };

  return (
    <>
      <div className="grid w-full max-w-6xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {LOCATIONS.map((location) => (
          <LocationTile
            key={location.id}
            location={location}
            isCurrent={currentLocationId === location.id}
            disabled={
              timeRemaining < TRAVEL_COST && currentLocationId !== location.id
            }
            onMove={handleTileAction}
            onInteract={() => setIsModalOpen(true)}
          />
        ))}
      </div>

      <LocationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
