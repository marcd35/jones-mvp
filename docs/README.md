# Docs

Design documents carried over from an earlier attempt at this project (a
Vite/Redux/PixiJS version, since archived). They describe the full _Jones in the
Fast Lane_ remake; **`jones-mvp` is a deliberately small slice of it.** Treat
these as the roadmap, not as a description of what the code does today.

| Document                                       | Use it for                                                                  |
| ---------------------------------------------- | --------------------------------------------------------------------------- |
| [Game design](design/game-design.md)           | Rules, locations, careers and wages, education, economy, victory conditions |
| [Art style](design/art-style.md)               | Palette, typography, UI and character/location art direction                |
| [Technical design](design/technical-design.md) | Data models and game-system notes. Stack sections are **historical**        |

The files are imported as-is (Prettier ignores them), apart from repairing
broken table-of-contents links.

## What the MVP implements vs. the design

| Topic                                              | Game design                                                                    | `jones-mvp` today                                                                                         |
| -------------------------------------------------- | ------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------- |
| Players                                            | Solo against Jones (AI) or up to four humans                                   | One player, no opponent                                                                                   |
| Week                                               | 12 hours per turn                                                              | Same (`MAX_TIME`)                                                                                         |
| Travel cost                                        | 0.615 hours per board step                                                     | Flat 1 hour between any two locations                                                                     |
| Work action                                        | 1 hour per action                                                              | 4- or 8-hour shifts                                                                                       |
| Locations                                          | 13 (Bank, Pawn Shop, Factory, Employment Office, …)                            | 4: apartment, burger shop, store, university                                                              |
| Jobs                                               | Wage ladders at most locations (e.g. Cook $4 → Manager $7 at Monolith Burgers) | Fry Cook $6/hr, Shift Manager $15/hr                                                                      |
| Goals                                              | Four custom goals: wealth ($2000 default), happiness, education, career        | Four sliders over 200 Goal points; only wealth is measured yet (`src/data/goals.ts`, placeholder targets) |
| Rent                                               | Rent Office, housing tiers                                                     | $100 every 4th week; unpaid rent ends the game                                                            |
| Hunger                                             | Food items with prices and effects                                             | One meal per week; skipping it costs 4 hours next week                                                    |
| Clothing, economy swings, random events, newspaper | Specified                                                                      | Not implemented                                                                                           |
| Save / load                                        | Specified                                                                      | Browser `localStorage`, versioned                                                                         |

Numbers for the MVP live in `src/lib/constants.ts`; rules live in
`src/store/useGameStore.ts`. When the MVP grows toward the design, update this
table.
