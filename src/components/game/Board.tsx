'use client';

import { useEffect, useState } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { defaultPack } from '@/data';
import { validatePack } from '@/data/loader';
import { ringCells, ringCoordinates, ringIndexOf } from '@/lib/board';
import type { DataPack } from '@/types';
import { LocationTile } from './LocationTile';
import { LocationModal } from './LocationModal';
import { TimeDial } from './TimeDial';

const STEP_MS = 120; // Pause per Step as the token slides along the ring

const place = (row: number, col: number, rowSpan = 1, colSpan = 1) => ({
  gridRow: `${row + 1} / span ${rowSpan}`,
  gridColumn: `${col + 1} / span ${colSpan}`,
});

export function Board({ pack = defaultPack }: { pack?: DataPack }) {
  const player = useGameStore((s) => s.players[s.turnIndex]);
  const walkTo = useGameStore((s) => s.walkTo);
  const reportPending = useGameStore((s) => s.weekendReport !== null);
  const isPlaying = useGameStore((s) => s.gameStatus === 'playing');
  // The Location whose screen is open. It shuts by itself when the Player is
  // no longer there (the Week ended and sent them home).
  const [openAt, setOpenAt] = useState<string | null>(null);
  const isModalOpen =
    openAt === player.locationId && !reportPending && isPlaying;

  const problems = validatePack(pack);
  const { layout, locations } = pack;
  const size = layout.size;
  const ringLength = problems.length === 0 ? 4 * (size - 1) : 0;

  // The token slides one ring cell at a time, the shorter way, to the Player.
  const targetIndex =
    problems.length === 0 ? ringIndexOf(layout, player.locationId) : -1;
  const [shownIndex, setShownIndex] = useState(targetIndex);
  useEffect(() => {
    if (targetIndex < 0 || shownIndex === targetIndex) return;
    const forward = (targetIndex - shownIndex + ringLength) % ringLength;
    const dir = forward <= ringLength / 2 ? 1 : -1;
    const timer = setTimeout(
      () => setShownIndex((i) => (i + dir + ringLength) % ringLength),
      STEP_MS,
    );
    return () => clearTimeout(timer);
  }, [shownIndex, targetIndex, ringLength]);

  if (problems.length > 0) {
    return (
      <div
        role="alert"
        className="w-full max-w-xl rounded-lg border border-red-700 bg-red-950 p-4 text-sm text-red-200"
      >
        <p className="font-bold">The Board data is invalid:</p>
        <ul className="list-disc pl-5">
          {problems.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      </div>
    );
  }

  const handleSelect = (locationId: string) => {
    if (locationId === player.locationId) setOpenAt(locationId);
    else {
      setOpenAt(null);
      walkTo(locationId);
    }
  };

  const shown = ringCoordinates(size)[shownIndex] ?? [0, 0];
  const shownCell = ringCells(layout)[shownIndex];
  const shownLocation =
    shownCell?.content.kind === 'location' ? shownCell.content.locationId : '';
  const cellPct = 100 / size;

  return (
    <>
      <div
        className="relative grid aspect-square w-full max-w-xl gap-0"
        style={{
          gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${size}, minmax(0, 1fr))`,
        }}
      >
        {layout.cells.map(({ row, col, content }) => {
          const style = place(row, col);
          if (content.kind === 'location') {
            const location = locations.find(
              (l) => l.id === content.locationId,
            )!;
            return (
              <LocationTile
                key={`${row},${col}`}
                location={location}
                isCurrent={player.locationId === location.id}
                style={style}
                onSelect={handleSelect}
              />
            );
          }
          if (content.kind === 'clock') {
            return (
              <div
                key={`${row},${col}`}
                data-cell="clock"
                style={style}
                className="m-0.5 min-h-0 min-w-0 rounded-md border border-slate-600 bg-slate-800 p-0.5"
              >
                <TimeDial hours={player.timeRemaining} />
              </div>
            );
          }
          return (
            <div
              key={`${row},${col}`}
              data-cell="blank"
              style={style}
              className="m-0.5 rounded-md bg-slate-900/40"
            />
          );
        })}

        <section
          aria-label="Centre"
          data-cell="centre"
          style={place(
            layout.centre.row,
            layout.centre.col,
            layout.centre.rowSpan,
            layout.centre.colSpan,
          )}
          className="m-0.5 flex items-center justify-center rounded-md border border-slate-700 bg-slate-800/40 p-2"
        >
          <p className="rounded-full bg-blue-600 px-3 py-1 text-xs font-bold text-white">
            {player.name}
          </p>
        </section>

        <div
          data-testid="token"
          data-location={shownLocation}
          aria-hidden
          className="pointer-events-none absolute flex items-center justify-center transition-[left,top] duration-100 ease-linear motion-reduce:transition-none"
          style={{
            left: `${shown[1] * cellPct}%`,
            top: `${shown[0] * cellPct}%`,
            width: `${cellPct}%`,
            height: `${cellPct}%`,
          }}
        >
          <span className="h-3 w-3 rounded-full bg-yellow-400 ring-2 ring-slate-900 sm:h-4 sm:w-4" />
        </div>
      </div>

      <LocationModal isOpen={isModalOpen} onClose={() => setOpenAt(null)} />
    </>
  );
}
