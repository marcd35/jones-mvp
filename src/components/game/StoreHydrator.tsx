'use client';

import { useEffect } from 'react';
import { useGameStore } from '@/store/useGameStore';

// The store skips automatic hydration so the first client render matches the
// server HTML; this loads the saved game right after mount.
export function StoreHydrator() {
  useEffect(() => {
    void useGameStore.persist.rehydrate();
  }, []);

  return null;
}
