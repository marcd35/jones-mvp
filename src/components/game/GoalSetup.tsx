'use client';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { defaultPack } from '@/data';
import { goalTargetText, totalGoalPoints } from '@/lib/goals';
import { useGameStore } from '@/store/useGameStore';

// The setup screen: the Player splits the Goal points budget across the four
// Goals (DEC-009, AC-005), then starts the game.
export function GoalSetup() {
  const player = useGameStore((s) => s.players[s.turnIndex]);
  const setGoalPoints = useGameStore((s) => s.setGoalPoints);
  const startGame = useGameStore((s) => s.startGame);

  const { goalPointsBudget: budget, startingMoney, goals } = defaultPack;
  const spent = totalGoalPoints(player.goals);
  const home = defaultPack.locations.find(
    (l) => l.id === defaultPack.homeLocationId,
  )?.name;

  return (
    <Card className="w-full max-w-xl space-y-6 p-4 md:p-6">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold">Set your Goals</h2>
        <p className="text-sm text-slate-400">
          Split your Goal points across four Goals. More points on a Goal makes
          it harder. You win when you meet all four. You start at {home} with $
          {startingMoney}.
        </p>
      </div>

      <p
        className="flex items-baseline justify-between rounded border border-slate-700 bg-slate-800 px-3 py-2"
        aria-live="polite"
      >
        <span className="text-sm font-bold text-slate-300">Goal points</span>
        <span className="font-mono text-lg" data-testid="points-left">
          {budget - spent} left of {budget}
        </span>
      </p>

      <ul className="space-y-5">
        {goals.map((def) => {
          const points = player.goals[def.id];
          const id = `goal-${def.id}`;
          return (
            <li key={def.id} className="space-y-1">
              <div className="flex items-baseline justify-between gap-3">
                <label htmlFor={id} className="font-bold">
                  {def.label}
                </label>
                <output
                  htmlFor={id}
                  className="font-mono text-slate-300"
                  data-testid={`${id}-points`}
                >
                  {points} points
                </output>
              </div>
              <input
                id={id}
                type="range"
                min={0}
                max={budget}
                step={5}
                value={points}
                onChange={(e) => setGoalPoints(def.id, Number(e.target.value))}
                className="h-11 w-full cursor-pointer accent-blue-500"
              />
              <p
                className="text-sm text-slate-300"
                data-testid={`${id}-target`}
              >
                {points === 0
                  ? 'No target: this Goal counts as met.'
                  : `Target: ${goalTargetText(def, points)}`}
              </p>
            </li>
          );
        })}
      </ul>

      <Button
        onClick={startGame}
        disabled={spent === 0}
        className="min-h-11 w-full text-base"
      >
        Start game
      </Button>
      {spent === 0 && (
        <p className="text-center text-xs text-slate-400">
          Put at least one Goal point on a Goal to start.
        </p>
      )}
    </Card>
  );
}
