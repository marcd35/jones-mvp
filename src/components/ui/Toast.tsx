'use client';

import { useEffect, useState } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { Bell } from 'lucide-react';

const TOAST_MS = 3000;

export function Toast() {
  const lastEvent = useGameStore((state) => state.lastEvent);
  const eventSeq = useGameStore((state) => state.eventSeq);
  const [dismissedSeq, setDismissedSeq] = useState<number | null>(null);

  // Hide each event 3 seconds after it appears
  useEffect(() => {
    if (!lastEvent) return;
    const timer = setTimeout(() => setDismissedSeq(eventSeq), TOAST_MS);
    return () => clearTimeout(timer);
  }, [lastEvent, eventSeq]);

  const message = lastEvent && eventSeq !== dismissedSeq ? lastEvent : null;

  return (
    <div role="status" aria-live="polite">
      {message && (
        <div className="animate-in slide-in-from-bottom-5 fade-in bg-base-100 text-base-900 border-base-900 fixed bottom-8 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-full border-2 px-6 py-3 font-bold shadow-[0_0_20px_rgba(255,255,255,0.2)] duration-300">
          <Bell aria-hidden className="fill-base-900 h-5 w-5" />
          <span>{message}</span>
        </div>
      )}
    </div>
  );
}
