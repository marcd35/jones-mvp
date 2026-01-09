'use client';

import { useGameStore } from '@/store/useGameStore';
import { Clock, DollarSign, Calendar, Utensils } from 'lucide-react';

export function HUD() {
  const { money, currentWeek, timeRemaining, hasEaten, isStarving } =
    useGameStore();

  return (
    <div className="mb-6 grid w-full max-w-4xl grid-cols-2 gap-4 rounded-lg border border-slate-700 bg-slate-800 p-4 shadow-lg md:grid-cols-4">
      {/* Money */}
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-green-900/50 p-2 text-green-400">
          <DollarSign className="h-6 w-6" />
        </div>
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase">Cash</p>
          <p className="font-mono text-xl text-white">${money}</p>
        </div>
      </div>

      {/* Time */}
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-blue-900/50 p-2 text-blue-400">
          <Clock className="h-6 w-6" />
        </div>
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase">
            Time Left
          </p>
          <p className="font-mono text-xl text-white">{timeRemaining} hrs</p>
        </div>
      </div>

      {/* Week */}
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-purple-900/50 p-2 text-purple-400">
          <Calendar className="h-6 w-6" />
        </div>
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase">Week</p>
          <p className="font-mono text-xl text-white">{currentWeek}</p>
        </div>
      </div>

      {/* Hunger */}
      <div className="flex items-center gap-3">
        <div
          className={`rounded-lg p-2 ${isStarving ? 'bg-red-900/50 text-red-400' : 'bg-orange-900/50 text-orange-400'}`}
        >
          <Utensils className="h-6 w-6" />
        </div>
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase">Status</p>
          <p
            className={`text-lg font-bold ${isStarving ? 'text-red-400' : hasEaten ? 'text-green-400' : 'text-orange-400'}`}
          >
            {isStarving ? 'STARVING' : hasEaten ? 'Full' : 'Hungry'}
          </p>
        </div>
      </div>
    </div>
  );
}
