'use client';

import { useSyncExternalStore } from 'react';
import { HUD } from '@/components/game/HUD';
import { StoreHydrator } from '@/components/game/StoreHydrator';
import { Board } from '@/components/game/Board';
import { GoalSetup } from '@/components/game/GoalSetup';
import { GameOver } from '@/components/game/GameOver';
import { WeekendReport } from '@/components/game/WeekendReport';
import { Toast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { useGameStore } from '@/store/useGameStore';

// False on the server and on the first client render, true once the saved game
// has been loaded, so a returning Player never sees the setup screen flash.
const useHydrated = () =>
  useSyncExternalStore(
    (onChange) => useGameStore.persist.onFinishHydration(onChange),
    () => useGameStore.persist.hasHydrated(),
    () => false,
  );

export default function Home() {
  const endTurn = useGameStore((s) => s.endTurn);
  const resetGame = useGameStore((s) => s.resetGame);
  const gameStatus = useGameStore((s) => s.gameStatus);
  const hydrated = useHydrated();
  const isSetup = gameStatus === 'setup';

  return (
    <main className="flex min-h-screen flex-col items-center bg-slate-900 p-4 text-white md:p-8">
      <StoreHydrator />
      {/* Header */}
      <div className="mb-8 flex w-full max-w-6xl items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-blue-500">
          JONES<span className="text-white">MVP</span>
        </h1>
        {hydrated && !isSetup && (
          <div className="flex gap-3">
            <Button variant="ghost" onClick={resetGame} className="text-xs">
              NEW GAME
            </Button>
            <Button
              variant="danger"
              onClick={endTurn}
              disabled={gameStatus !== 'playing'}
              className="px-6 py-3 text-base shadow-lg shadow-red-900/20"
            >
              END WEEK
            </Button>
          </div>
        )}
      </div>

      {hydrated && isSetup && <GoalSetup />}

      {hydrated && !isSetup && (
        <>
          {/* Stats */}
          <HUD />

          {/* Game Grid */}
          <Board />
        </>
      )}

      {/* Overlays */}
      <WeekendReport />
      <GameOver />
      <Toast />

      {/* Footer Info */}
      <div className="mt-12 text-center text-sm text-slate-500">
        <p>MVP Build v0.4 • Phase 4 Complete</p>
      </div>
    </main>
  );
}
