'use client';

import { HUD } from '@/components/game/HUD';
import { Board } from '@/components/game/Board';
import { GameOver } from '@/components/game/GameOver';
import { Toast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { useGameStore } from '@/store/useGameStore';

export default function Home() {
  const { endTurn, resetGame } = useGameStore();

  return (
    // Added grid-pattern background
    <main className="bg-base-900 bg-grid-pattern text-base-100 relative flex min-h-screen flex-col items-center bg-[length:40px_40px] p-4 md:p-8">
      {/* Scanline overlay (Optional retro feel) */}
      <div className="scanlines" />

      {/* Header */}
      <div className="border-base-700 relative z-10 mb-8 flex w-full max-w-6xl items-center justify-between border-b-2 pb-4">
        <div className="flex flex-col">
          <h1 className="text-base-100 text-4xl font-black tracking-tighter uppercase italic">
            Jones<span className="text-retro-blue">MVP</span>
          </h1>
          <span className="text-base-300 font-mono text-xs tracking-widest">
            INDUSTRIAL LIFE SIMULATION
          </span>
        </div>

        <div className="flex gap-3">
          <Button
            variant="ghost"
            onClick={resetGame}
            className="font-mono text-xs"
          >
            RESET
          </Button>
          <Button
            variant="danger"
            onClick={endTurn}
            className="border-2 border-red-900 font-black tracking-widest shadow-lg"
          >
            END WEEK
          </Button>
        </div>
      </div>

      <div className="relative z-10 flex w-full flex-col items-center">
        <HUD />
        <Board />
      </div>

      {/* Overlays */}
      <GameOver />
      <Toast />

      {/* Footer Info */}
      <div className="text-base-300 relative z-10 mt-12 text-center font-mono text-sm">
        <p>MVP Build v0.4 • Phase 4 Complete</p>
      </div>
    </main>
  );
}
