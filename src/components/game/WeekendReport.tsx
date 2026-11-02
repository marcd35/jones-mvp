'use client';

import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useGameStore } from '@/store/useGameStore';
import { defaultPack } from '@/data';
import { WEEKEND_EFFECTS } from '@/lib/weekend';
import { formatHours } from './TimeDial';
import type { WeekEndReason } from '@/types';

const REASONS: Record<WeekEndReason, string> = {
  ended: 'You ended the Week.',
  time: 'You ran out of Time.',
  road: 'You ran out of Time on the way home.',
};

// What changed when a Week ended, one line per effect in the fixed order of
// WEEKEND_EFFECTS. An effect with nothing to report keeps its line.
export function WeekendReport() {
  const report = useGameStore((s) => s.weekendReport);
  const gameStatus = useGameStore((s) => s.gameStatus);
  const player = useGameStore((s) => s.players[s.turnIndex]);
  const dismiss = useGameStore((s) => s.dismissWeekendReport);

  // The game-over screen takes over when the Week ended the game.
  if (!report || gameStatus !== 'playing') return null;

  const home =
    defaultPack.locations.find((l) => l.id === player.locationId)?.name ??
    'home';

  return (
    <Modal
      isOpen
      onClose={dismiss}
      title={`Week ${report.week}: weekend report`}
    >
      <div className="space-y-4">
        <p className="text-sm text-slate-300">{REASONS[report.reason]}</p>

        <ol className="space-y-2">
          {WEEKEND_EFFECTS.map(({ id, label }) => {
            const text = report.effects.find((e) => e.id === id)?.text;
            return (
              <li
                key={id}
                className="flex flex-col rounded border border-slate-700 bg-slate-800 px-3 py-2 text-sm sm:flex-row sm:justify-between sm:gap-3"
              >
                <span className="font-bold text-white">{label}</span>
                <span className={text ? 'text-orange-300' : 'text-slate-500'}>
                  {text ?? 'No change'}
                </span>
              </li>
            );
          })}
        </ol>

        <p className="flex justify-between text-sm text-slate-300">
          <span>Cash</span>
          <span className="font-mono font-bold text-white">${report.cash}</span>
        </p>
        <p className="text-sm text-slate-300">
          Week {report.week + 1} starts at {home} with{' '}
          {formatHours(player.timeRemaining)} hours.
        </p>

        <Button onClick={dismiss} className="min-h-11 w-full">
          Start Week {report.week + 1}
        </Button>
      </div>
    </Modal>
  );
}
