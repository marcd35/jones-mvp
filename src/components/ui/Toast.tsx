'use client';

import { useEffect, useState } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { Bell } from 'lucide-react';

export function Toast() {
  const lastEvent = useGameStore((state) => state.lastEvent);
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // When lastEvent changes in the store, show it
  useEffect(() => {
    if (lastEvent) {
      setMessage(lastEvent);
      setVisible(true);

      // Auto-hide after 3 seconds
      const timer = setTimeout(() => setVisible(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [lastEvent]);

  if (!visible || !message) return null;

  return (
    <div className="animate-in slide-in-from-bottom-5 fade-in fixed bottom-8 left-1/2 z-50 -translate-x-1/2 duration-300">
      <div className="bg-base-100 text-base-900 border-base-900 flex items-center gap-3 rounded-full border-2 px-6 py-3 font-bold shadow-[0_0_20px_rgba(255,255,255,0.2)]">
        <Bell className="fill-base-900 h-5 w-5" />
        <span>{message}</span>
      </div>
    </div>
  );
}
