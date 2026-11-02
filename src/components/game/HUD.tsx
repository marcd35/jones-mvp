'use client';

import { useGameStore } from '@/store/useGameStore';
import { DollarSign, Calendar, Utensils, Shirt } from 'lucide-react';
import { defaultPack } from '@/data';
import { clothesState, tierOf, weeksLeft } from '@/lib/clothing';

export function HUD() {
  const money = useGameStore((s) => s.players[s.turnIndex].money);
  const currentWeek = useGameStore((s) => s.currentWeek);
  const foodWeeks = useGameStore((s) => s.players[s.turnIndex].foodWeeks);
  const isStarving = useGameStore((s) => s.players[s.turnIndex].isStarving);
  const clothes = useGameStore((s) => s.players[s.turnIndex].clothes);
  const { clothing } = defaultPack;
  const wear = clothesState(clothing, clothes);
  const left = weeksLeft(clothing, clothes);

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

      {/* Time is shown by the dial in the Board's Clock cell. */}

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
            className={`text-lg font-bold ${foodWeeks > 0 ? 'text-green-400' : isStarving ? 'text-red-400' : 'text-orange-400'}`}
          >
            {foodWeeks > 0 ? 'Fed' : 'Needs food'}
          </p>
          {foodWeeks > 0 && (
            <p className="text-xs text-slate-400">
              {foodWeeks} {foodWeeks === 1 ? 'Week' : 'Weeks'} of food
            </p>
          )}
        </div>
      </div>

      {/* Clothes */}
      <div className="flex items-center gap-3">
        <div
          className={`rounded-lg p-2 ${wear === 'good' ? 'bg-teal-900/50 text-teal-400' : wear === 'warning' ? 'bg-orange-900/50 text-orange-400' : 'bg-red-900/50 text-red-400'}`}
        >
          <Shirt className="h-6 w-6" />
        </div>
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase">Clothes</p>
          <p
            className={`text-lg font-bold ${wear === 'good' ? 'text-green-400' : wear === 'warning' ? 'text-orange-400' : 'text-red-400'}`}
          >
            {wear === 'worn'
              ? 'Worn out'
              : wear === 'none'
                ? 'None'
                : (tierOf(clothing, clothes)?.name ?? 'Clothes')}
          </p>
          {wear === 'warning' && (
            <p className="text-xs text-orange-300">
              Wear out in {left} {left === 1 ? 'Week' : 'Weeks'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
