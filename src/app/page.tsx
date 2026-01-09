'use client';

import { HUD } from '@/components/game/HUD';
import { Board } from '@/components/game/Board';
import { Button } from '@/components/ui/Button';
import { useGameStore } from '@/store/useGameStore';

export default function Home() {
  const { endTurn } = useGameStore();

  return (
    <main className="flex min-h-screen flex-col items-center bg-slate-900 p-4 text-white md:p-8">
      {/* Header */}
      <div className="mb-8 flex w-full max-w-6xl items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-blue-500">
          JONES<span className="text-white">MVP</span>
        </h1>
        <Button
          variant="danger"
          onClick={endTurn}
          className="px-6 py-3 text-base shadow-lg shadow-red-900/20"
        >
          End Week
        </Button>
      </div>

      {/* Stats */}
      <HUD />

      {/* Game Grid */}
      <Board />

      {/* Footer Info */}
      <div className="mt-12 text-center text-sm text-slate-500">
        <p>MVP Build v0.2 • Phase 2 Complete</p>
      </div>
    </main>
  );
}
