'use client';

import { useEffect, useState } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { Bell } from 'lucide-react';

export function Toast() {
  const lastEvent = useGameStore((state) => state.lastEvent);
  const [dismissed, setDismissed] = useState<string | null>(null);

  // Show lastEvent until the 3 second timer marks it dismissed
  useEffect(() => {
    if (lastEvent) {
      const timer = setTimeout(() => setDismissed(lastEvent), 3000);
      return () => clearTimeout(timer);
    }
  }, [lastEvent]);

  const message = lastEvent !== dismissed ? lastEvent : null;
  if (!message) return null;

  return (
    <div className="animate-in slide-in-from-bottom-5 fade-in fixed bottom-8 left-1/2 z-50 -translate-x-1/2 duration-300">
      <div className="bg-base-100 text-base-900 border-base-900 flex items-center gap-3 rounded-full border-2 px-6 py-3 font-bold shadow-[0_0_20px_rgba(255,255,255,0.2)]">
        <Bell className="fill-base-900 h-5 w-5" />
        <span>{message}</span>
      </div>
    </div>
  );
}
