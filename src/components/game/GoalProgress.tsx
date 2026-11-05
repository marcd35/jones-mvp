'use client';

import { Check, Target } from 'lucide-react';
import { useGameStore } from '@/store/useGameStore';
import { defaultPack } from '@/data';
import {
  goalMeasure,
  goalProgressText,
  isGoalMet,
  type GoalContext,
} from '@/lib/goals';

// Where the Player stands on each Goal, against the target the Goal points
// set (#34). A Goal with 0 points is already met.
export function GoalProgress() {
  const player = useGameStore((s) => s.players[s.turnIndex]);
  const priceLevel = useGameStore((s) => s.priceLevel);
  const context: GoalContext = { pack: defaultPack, priceLevel };

  return (
    <section
      aria-label="Goal progress"
      className="mb-6 w-full max-w-4xl rounded-lg border border-slate-700 bg-slate-800 p-4 shadow-lg"
    >
      <h2 className="mb-2 flex items-center gap-2 text-xs font-bold text-slate-400 uppercase">
        <Target className="h-4 w-4" aria-hidden="true" /> Goals
      </h2>
      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-4">
        {defaultPack.goals.map((def) => {
          const points = player.goals[def.id];
          const met = isGoalMet(def, player, context);
          return (
            <li
              key={def.id}
              data-goal={def.id}
              className="flex items-center justify-between gap-2 text-sm"
            >
              <span className="text-slate-300">{def.label}</span>
              <span
                className={`flex items-center gap-1 font-mono font-bold ${met ? 'text-green-400' : 'text-white'}`}
              >
                {points === 0
                  ? 'No Goal'
                  : goalProgressText(
                      def,
                      goalMeasure(def.id, player, context),
                      points,
                    )}
                {met && (
                  <>
                    <Check className="h-4 w-4" aria-hidden="true" />
                    <span className="sr-only">(met)</span>
                  </>
                )}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
