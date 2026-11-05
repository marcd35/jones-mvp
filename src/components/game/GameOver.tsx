'use client';

import { useGameStore } from '@/store/useGameStore';
import { Button } from '@/components/ui/Button';
import { defaultPack } from '@/data';
import { goalTargetText, isGoalMet } from '@/lib/goals';

// The win and lose screens (AC-006): what happened, with a summary of the
// Weeks played and the Player's final stats.
export function GameOver() {
  const gameStatus = useGameStore((s) => s.gameStatus);
  const resetGame = useGameStore((s) => s.resetGame);
  const player = useGameStore((s) => s.players[s.turnIndex]);
  const weeksPlayed = useGameStore((s) => s.currentWeek);
  const priceLevel = useGameStore((s) => s.priceLevel);

  if (gameStatus !== 'won' && gameStatus !== 'lost') return null;

  const isWin = gameStatus === 'won';
  const job = defaultPack.jobs.find((j) => j.id === player.jobId)?.title;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="game-over-title"
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/90 p-4 backdrop-blur-sm"
    >
      <div className="animate-in zoom-in w-full max-w-md space-y-6 py-4 text-center duration-300">
        <h1
          id="game-over-title"
          className={`text-5xl font-black ${isWin ? 'text-yellow-400' : 'text-red-500'}`}
        >
          {isWin ? 'VICTORY!' : 'GAME OVER'}
        </h1>

        <p className="text-xl text-slate-300">
          {isWin
            ? 'You met all four of your Goals.'
            : 'You fell too far behind on the rent. The landlord kicked you out.'}
        </p>

        <dl className="space-y-2 rounded-lg border border-slate-700 bg-slate-800 p-4 text-left text-sm">
          <Stat label="Weeks played" value={weeksPlayed} />
          <Stat label="Cash" value={`$${player.money}`} />
          <Stat label="Education level" value={player.educationLevel} />
          <Stat label="Job" value={job ?? 'None'} />
          {player.owedRent > 0 && (
            <Stat label="Rent owed" value={`$${player.owedRent}`} />
          )}
        </dl>

        <div className="space-y-2 rounded-lg border border-slate-700 bg-slate-800 p-4 text-left text-sm">
          <h2 className="font-bold text-white">Your Goals</h2>
          <ul className="space-y-1">
            {defaultPack.goals.map((def) => {
              const points = player.goals[def.id];
              return (
                <li key={def.id} className="flex justify-between gap-3">
                  <span>{def.label}</span>
                  <span className="text-slate-300">
                    {points === 0 ? 'No Goal' : goalTargetText(def, points)}{' '}
                    {isGoalMet(def, player, { pack: defaultPack, priceLevel })
                      ? '(met)'
                      : '(not met)'}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        <Button
          onClick={resetGame}
          className="min-h-11 w-full bg-white px-8 py-4 text-lg text-black hover:bg-slate-200"
        >
          New game
        </Button>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-slate-400">{label}</dt>
      <dd className="font-mono font-bold text-white">{value}</dd>
    </div>
  );
}
