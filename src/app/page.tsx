'use client';

import { HUD } from '@/components/game/HUD';
import { Board } from '@/components/game/Board';
import { GameOver } from '@/components/game/GameOver';
import { Toast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { useGameStore } from '@/store/useGameStore';

export default function Home() {
  const { endTurn, resetGame, lastEvent } = useGameStore();

  return (
    <main className="flex min-h-screen flex-col items-center bg-slate-900 p-4 text-white md:p-8">
      {/* Header */}
      <div className="mb-8 flex w-full max-w-6xl items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-blue-500">
          JONES<span className="text-white">MVP</span>
        </h1>
        <div className="flex gap-3">
          <Button variant="ghost" onClick={resetGame} className="text-xs">
            RESET
          </Button>
          <Button
            variant="danger"
            onClick={endTurn}
            className="px-6 py-3 text-base shadow-lg shadow-red-900/20"
          >
            END WEEK
          </Button>
        </div>
      </div>

      {/* Message Log (replaced with Toast but keeping fallback) */}
      {lastEvent && !useGameStore.getState().lastEvent && (
        <div className="mb-4 animate-pulse rounded border border-slate-600 bg-slate-800/80 p-3 text-sm text-yellow-300">
          Console: {lastEvent}
        </div>
      )}

      {/* Stats */}
      <HUD />

      {/* Game Grid */}
      <Board />

      {/* Overlays */}
      <GameOver />
      <Toast />

      {/* Footer Info */}
      <div className="mt-12 text-center text-sm text-slate-500">
        <p>MVP Build v0.4 • Phase 4 Complete</p>
      </div>
    </main>
  );
}
