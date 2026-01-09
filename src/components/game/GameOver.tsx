'use client';

import { useGameStore } from '@/store/useGameStore';
import { Button } from '@/components/ui/Button';

export function GameOver() {
  const { gameStatus, resetGame, money } = useGameStore();

  if (gameStatus === 'playing') return null;

  const isWin = gameStatus === 'won';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm">
      <div className="animate-in zoom-in w-full max-w-md space-y-6 text-center duration-300">
        <h1
          className={`text-6xl font-black ${isWin ? 'text-yellow-400' : 'text-red-500'}`}
        >
          {isWin ? 'VICTORY!' : 'GAME OVER'}
        </h1>

        <div className="text-xl text-slate-300">
          {isWin ? (
            <p>You made it! You have a Manager job and ${money} in the bank.</p>
          ) : (
            <p>
              You ran out of money to pay rent. The landlord kicked you out.
            </p>
          )}
        </div>

        <Button
          onClick={resetGame}
          className="w-full bg-white px-8 py-6 text-lg text-black hover:bg-slate-200"
        >
          Play Again
        </Button>
      </div>
    </div>
  );
}
