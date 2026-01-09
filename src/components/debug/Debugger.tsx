'use client';

import { useGameStore } from '@/store/useGameStore';
import { LOCATIONS } from '@/lib/constants';

export default function Debugger() {
  const state = useGameStore();

  return (
    <div className="fixed top-4 right-4 w-80 rounded-lg border border-slate-600 bg-slate-800 p-4 font-mono text-xs text-white shadow-xl">
      <h3 className="mb-2 text-lg font-bold text-green-400">DEV DASHBOARD</h3>

      {/* State Monitor */}
      <div className="mb-4 space-y-1">
        <p>
          Week: <span className="text-yellow-300">{state.currentWeek}</span>
        </p>
        <p>
          Money: <span className="text-green-300">${state.money}</span>
        </p>
        <p>
          Time: <span className="text-blue-300">{state.timeRemaining}hrs</span>
        </p>
        <p>
          Hunger:{' '}
          {state.isStarving ? (
            <span className="text-red-500">STARVING</span>
          ) : state.hasEaten ? (
            'Full'
          ) : (
            'Needs Food'
          )}
        </p>
        <p>Loc: {state.currentLocationId}</p>
      </div>

      {/* Manual Controls */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={state.endTurn}
          className="rounded bg-red-600 px-2 py-1 hover:bg-red-700"
        >
          Force End Turn
        </button>
        <button
          onClick={() => state.work(4)}
          className="rounded bg-blue-600 px-2 py-1 hover:bg-blue-700"
          disabled={state.currentLocationId !== 'burger'}
        >
          Work (4hrs)
        </button>
        <button
          onClick={() => state.eat()}
          className="rounded bg-green-600 px-2 py-1 hover:bg-green-700"
        >
          Eat Food
        </button>
        <button
          onClick={state.resetGame}
          className="rounded bg-gray-600 px-2 py-1 hover:bg-gray-700"
        >
          Reset Game
        </button>
      </div>

      {/* Teleport Controls */}
      <div className="mt-4 border-t border-slate-600 pt-2">
        <p className="mb-2 text-slate-400">TELEPORT (Cost: 1hr)</p>
        <div className="grid grid-cols-2 gap-1">
          {LOCATIONS.map((loc) => (
            <button
              key={loc.id}
              onClick={() => state.movePlayer(loc.id)}
              disabled={state.currentLocationId === loc.id}
              className="rounded bg-slate-700 px-2 py-1 text-center hover:bg-slate-600 disabled:opacity-30"
            >
              {loc.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
