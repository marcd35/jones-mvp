# Jones MVP

A small life-simulation board game inspired by _Jones in the Fast Lane_. Travel
between locations, work, study and eat within a 12-hour week, and pay the rent
every fourth week. Reach $500 as a Shift Manager to win; miss the rent and you
are evicted.

Built with Next.js (App Router), React, Tailwind CSS 4 and Zustand.

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000
```

## Scripts

| Command                | What it does                  |
| ---------------------- | ----------------------------- |
| `npm run dev`          | Start the dev server          |
| `npm run build`        | Production build              |
| `npm test`             | Run the Vitest suite once     |
| `npm run test:watch`   | Run Vitest in watch mode      |
| `npm run lint`         | ESLint                        |
| `npm run typecheck`    | TypeScript, no emit           |
| `npm run format`       | Format with Prettier          |
| `npm run format:check` | Check formatting (used in CI) |

CI runs lint, typecheck, format check, tests and build on every pull request.

## Project layout

- `src/lib/constants.ts` – locations, jobs and every tunable game number
- `src/store/useGameStore.ts` – all game rules (Zustand); the UI only calls its
  actions. Saved to `localStorage` under `jones-mvp-storage` (versioned).
- `src/components/game` – board, tiles, HUD, location menu, game-over screen
- `src/components/ui` – small shared primitives (button, card, modal, toast)
