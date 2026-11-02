# V1 issue drafts (r3)

Namespace V1, spec `docs/specs/v1-spec.md` r3, repo base `8fff73c`. **Drafts only: nothing has been submitted to GitHub.** Publication needs the author's approval.

Re-cut after round 2: Phase 1 is three tracer slices, each playable end to end, so friends can play something early. Only T-01 to T-06 have full bodies and are proposed for publication; T-07 to T-17 are outlines and get full bodies once the earlier tickets are done (OD-1 to OD-4 are settled in r3).

Proposed milestone: `v1` (to be created on approval). Labels use the repo's existing set (`enhancement`, `documentation`); the repo has no triage-label doc, so no status labels are proposed.

## Tickets

| Ticket | Phase | Title                                                 | Depends on                               | Readiness                                                                                                                       | Labels        | Publish  |
| ------ | ----- | ----------------------------------------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ------------- | -------- |
| T-01   | 0     | Fresh-game fieldwork and the economy parameters doc   | none                                     | ready; the author's play session is the main input                                                                              | documentation | proposed |
| T-02   | 0     | Write the education and jobs reference                | T-01                                     | blocked on T-01 for requirements and wages (an outline can start from the design doc)                                           | documentation | proposed |
| T-03   | 1     | Slice 1: walk the Board (data, Board, walking, Time)  | none                                     | ready (walking costs come from the table in DEC-025)                                                                            | enhancement   | proposed |
| T-04   | 1     | Slice 2: earn money (first job, Work, weekend report) | T-03                                     | ready (shift length and Time cost from DEC-022 and DEC-026)                                                                     | enhancement   | proposed |
| T-05   | 1     | Slice 3: Goals setup, win and lose screens            | T-03, T-04                               | ready (targets are placeholders; a Goal with 0 points counts as met until its measure exists)                                   | enhancement   | proposed |
| T-06   | 1     | Deploy to Vercel with a preview per PR                | T-03                                     | blocked until the author authorizes the Vercel connection (DEC-006); sharing the link is gated by the naming decision (DEC-012) | enhancement   | proposed |
| T-07   | 2     | Hidden inflation level and the newspaper              | T-01, T-04                               | ready once T-04 exists (model decided, DEC-024)                                                                                 | enhancement   | outline  |
| T-08   | 2     | Hunger, food and clothing wear                        | T-01, T-04, T-07                         | ready once T-07 exists (hunger values from r2)                                                                                  | enhancement   | outline  |
| T-09   | 2     | Rent Office, rent and unpaid-rent consequence         | T-01, T-04, T-07                         | ready once T-07 exists (consequence decided, DEC-023)                                                                           | enhancement   | outline  |
| T-10   | 2     | Jobs: Employment Office, ladders, experience          | T-02, T-07, T-08                         | blocked on T-02                                                                                                                 | enhancement   | outline  |
| T-11   | 2     | Education: Hi-Tech U courses and levels               | T-02, T-04, T-07                         | blocked on T-02                                                                                                                 | enhancement   | outline  |
| T-12   | 2     | Goods, happiness and the remaining Goal measures      | T-05, T-07                               | blocked on UNK-005 for happiness values                                                                                         | enhancement   | outline  |
| T-13   | 3     | Phone layout and accessibility pass                   | T-05, T-10, T-11, T-12                   | ready once the screens exist                                                                                                    | enhancement   | outline  |
| T-14   | 3     | Save and resume with versioned migration              | T-07, T-12                               | ready once the state shape has settled                                                                                          | enhancement   | outline  |
| T-15   | 3     | Balance harness and the balance pass                  | T-01, T-07, T-08, T-09, T-10, T-11, T-12 | blocked on the economy tickets                                                                                                  | enhancement   | outline  |
| T-16   | 3     | Update docs: v1 against the design and the departures | T-15                                     | ready once T-15 is done                                                                                                         | documentation | outline  |
| T-17   | 3     | Playtest and triage                                   | T-06, T-13, T-14, T-15, T-16             | ready once the deploy and earlier tickets are done                                                                              | enhancement   | outline  |

- Phase 0: enabling work, start now
- Phase 1: tracer slices, each playable (published first)
- Phase 2: the economy (outline)
- Phase 3: ship it (outline)

Suggested build order (topological): T-01 -> T-02 -> T-03 -> T-04 -> T-05 -> T-06 -> T-07 -> T-08 -> T-09 -> T-10 -> T-11 -> T-12 -> T-13 -> T-14 -> T-15 -> T-16 -> T-17

## Spec-wide coverage ledger

| AC     | Disposition | Owner / contributing tickets / integration verifier            | Reason and authorization for deferral or exclusion |
| ------ | ----------- | -------------------------------------------------------------- | -------------------------------------------------- |
| AC-001 | represented | owner T-03; contributing none; verifier T-03                   | not needed (v1 scope)                              |
| AC-002 | represented | owner T-03; contributing none; verifier T-03                   | not needed (v1 scope)                              |
| AC-003 | represented | owner T-03; contributing T-13; verifier T-03                   | not needed (v1 scope)                              |
| AC-004 | represented | owner T-04; contributing T-07, T-08, T-09; verifier T-04       | not needed (v1 scope)                              |
| AC-005 | represented | owner T-05; contributing none; verifier T-05                   | not needed (v1 scope)                              |
| AC-006 | represented | owner T-05; contributing T-09; verifier T-09                   | not needed (v1 scope)                              |
| AC-007 | represented | owner T-08; contributing none; verifier T-08                   | not needed (v1 scope)                              |
| AC-008 | represented | owner T-08; contributing none; verifier T-08                   | not needed (v1 scope)                              |
| AC-009 | represented | owner T-09; contributing none; verifier T-09                   | not needed (v1 scope)                              |
| AC-010 | represented | owner T-07; contributing T-15; verifier T-07                   | not needed (v1 scope)                              |
| AC-011 | represented | owner T-10; contributing T-04; verifier T-10                   | not needed (v1 scope)                              |
| AC-012 | represented | owner T-11; contributing none; verifier T-11                   | not needed (v1 scope)                              |
| AC-013 | represented | owner T-12; contributing none; verifier T-12                   | not needed (v1 scope)                              |
| AC-014 | represented | owner T-03; contributing T-04, T-10, T-11, T-12; verifier T-03 | not needed (v1 scope)                              |
| AC-015 | represented | owner T-14; contributing none; verifier T-14                   | not needed (v1 scope)                              |
| AC-016 | represented | owner T-03; contributing none; verifier T-03                   | not needed (v1 scope)                              |
| AC-017 | represented | owner T-13; contributing none; verifier T-13                   | not needed (v1 scope)                              |
| AC-018 | represented | owner T-15; contributing none; verifier T-15                   | not needed (v1 scope)                              |
| AC-019 | represented | owner T-17; contributing none; verifier T-17                   | not needed (v1 scope)                              |
| AC-020 | represented | owner T-06; contributing none; verifier T-06                   | not needed (v1 scope)                              |
| AC-021 | represented | owner T-03; contributing none; verifier T-06                   | not needed (v1 scope)                              |
| AC-022 | represented | owner T-16; contributing none; verifier T-16                   | not needed (v1 scope)                              |
| AC-023 | represented | owner T-06; contributing T-03; verifier T-06                   | not needed (v1 scope)                              |

## Reverse coverage

- T-01: enabling task: Resolves the open parts of UNK-004, UNK-006, UNK-008 to UNK-010 and checks the numbers behind DEC-023 to DEC-026.
- T-02: enabling task: Required by DEC-018 before T-10 and T-11.
- T-03: AC-001 (owner), AC-002 (owner), AC-003 (owner), AC-014 (owner), AC-016 (owner), AC-021 (owner), AC-023 (contributes)
- T-04: AC-004 (owner), AC-011 (contributes), AC-014 (contributes)
- T-05: AC-005 (owner), AC-006 (owner)
- T-06: AC-020 (owner), AC-023 (owner)
- T-07: AC-010 (owner), AC-004 (contributes)
- T-08: AC-007 (owner), AC-008 (owner), AC-004 (contributes)
- T-09: AC-009 (owner), AC-004 (contributes), AC-006 (contributes)
- T-10: AC-011 (owner), AC-014 (contributes)
- T-11: AC-012 (owner), AC-014 (contributes)
- T-12: AC-013 (owner), AC-014 (contributes)
- T-13: AC-017 (owner), AC-003 (contributes)
- T-14: AC-015 (owner)
- T-15: AC-018 (owner), AC-010 (contributes)
- T-16: AC-022 (owner)
- T-17: AC-019 (owner)

## Dependency check

No cycles; every referenced ticket exists (17 tickets); no proposed ticket depends on an outline ticket. Every AC (23) has exactly one owner. Every test an AC names is held by a proposed ticket for that AC.

## Publication readback

Not published.

## Outline tickets (not proposed for publication yet)

- **T-07 Hidden inflation level and the newspaper** (phase 2; depends on T-01, T-04; ready once T-04 exists (model decided, DEC-024)). Owns AC-010; contributes AC-004. A weekly price level per DEC-024 (a replaceable rule in data, default a random level within a range, wages fixed), scaling all shop prices; the newspaper announces notable moves; the weekend report shows the level; repeatable with a seed.
- **T-08 Hunger, food and clothing wear** (phase 2; depends on T-01, T-04, T-07; ready once T-07 exists (hunger values from r2)). Owns AC-007, AC-008; contributes AC-004. Food at Monolith Burger and Black's Market; skipping food costs about a third of next Week's Time; clothing tiers at QT Clothing, wear after about 6 Weeks, a clothing requirement on some jobs.
- **T-09 Rent Office, rent and unpaid-rent consequence** (phase 2; depends on T-01, T-04, T-07; ready once T-07 exists (consequence decided, DEC-023)). Owns AC-009; contributes AC-004, AC-006. Rent every 4 Weeks paid at the Rent Office, the closed-office case, and unpaid rent per DEC-023 (a fixed garnishment from each paycheck, paying off the balance at the Rent Office, and a loss at a limit from data).
- **T-10 Jobs: Employment Office, ladders, experience** (phase 2; depends on T-02, T-07, T-08; blocked on T-02). Owns AC-011; contributes AC-014. All 8 employers with wage ladders and requirements (education, experience, clothing); job loss; experience grows by working. Cites the T-02 reference.
- **T-11 Education: Hi-Tech U courses and levels** (phase 2; depends on T-02, T-04, T-07; blocked on T-02). Owns AC-012; contributes AC-014. Trade School, Jr. College and one deeper step with fee and Time; higher rungs locked; the education Goal measure.
- **T-12 Goods, happiness and the remaining Goal measures** (phase 2; depends on T-05, T-07; blocked on UNK-005 for happiness values). Owns AC-013; contributes AC-014. Z-Mart and Socket City goods with weekly stock changes; happiness points; the happiness and career Goal measures.
- **T-13 Phone layout and accessibility pass** (phase 3; depends on T-05, T-10, T-11, T-12; ready once the screens exist). Owns AC-017; contributes AC-003. At 390x844 no horizontal scroll, 44 px tap targets, keyboard reachability and accessible names.
- **T-14 Save and resume with versioned migration** (phase 3; depends on T-07, T-12; ready once the state shape has settled). Owns AC-015; contributes none. Autosave after each action, exact restore including the price level sequence, migration from older saves, corrupt save starts a new game.
- **T-15 Balance harness and the balance pass** (phase 3; depends on T-01, T-07, T-08, T-09, T-10, T-11, T-12; blocked on the economy tickets). Owns AC-018; contributes AC-010. Scripted sensible and careless players over seeded runs; tune data until the targets hold; record them in the spec.
- **T-16 Update docs: v1 against the design and the departures** (phase 3; depends on T-15; ready once T-15 is done). Owns AC-022; contributes none. `docs/README.md` compares v1 to the design with every departure and reason; correct the 4-row grid statement.
- **T-17 Playtest and triage** (phase 3; depends on T-06, T-13, T-14, T-15, T-16; ready once the deploy and earlier tickets are done). Owns AC-019; contributes none. A stranger and 2 or 3 friends play unaided on desktop and phone; triage reports; re-check AC-021 and AC-023 on the final build.

## Ticket bodies (proposed)

---

# Ticket T-01: Fresh-game fieldwork and the economy parameters doc

Namespace / source revision / canonical source: V1 / r3 / `docs/specs/v1-spec.md` (repo `marcd35/jones-mvp`, base `8fff73c`).
Readiness: ready; the author's play session is the main input
Dependencies: none

## Scope

- Play a fresh original game with the starting $200 (the round 2 run fell into a poverty trap): eat, pay rent, enrol in a course, read the newspaper, find the $102, see what Relax and a win look like.
- Write `docs/research/economy-parameters.md`: walking costs (distances 4 and 5), inflation range, rents, wages, fees, hunger, Goal points mapping, each with source and confidence.
- Check the numbers behind the settled decisions against the fresh run: the garnishment amount and the loss limit (DEC-023), the inflation range (DEC-024), walking distances 4 and 5 (DEC-025), full-shift pay (DEC-026).

## Contract snapshot

Acceptance: none (enabling task). Resolves the open parts of UNK-004, UNK-006, UNK-008 to UNK-010 and checks the numbers behind DEC-023 to DEC-026.

Decisions:

- **DEC-003** (settled): Numbers come from a new balance pass. The design doc is a roadmap, not a contract. Deliberate departures are recorded in `docs/README.md` and this spec. Source: User, Q3 "c".
- **DEC-021** (assumption): Inflation (r2): all shop prices scale together by one hidden weekly level, which moved in what looks like random steps between about 0.83 and 1.22 over 8 Weeks (Week 1 = 1.00). Wages on the Employment Office lists did not follow it. Peaks, troughs and newspaper announcements were not observed. Source: Fieldwork round 2, "Weekly price log" (high confidence on uniformity, medium on the rest); DEC-019.
- **DEC-022** (assumption): Work and Time scale (r2): a Work action pays the hourly wage times a full shift (about 8 hours; $32 for the $4/hr Cook) and costs about 10% of a Week (about 1.2 of 12 hours). The hunger penalty is about 35% of a Week (about 4 hours). Relax costs about 11%. Source: Fieldwork round 2, "Travel and action costs" and "Jobs" (medium confidence).

Testing seams:

- none

Constraints:

- Run `node C:/Users/marcc/.claude/scripts/check-worktree.mjs` before building or committing; work on a branch, never on `main`.
- This repo uses a Next.js version with breaking changes. Read the relevant guide in `node_modules/next/dist/docs/` before writing Next-specific code (see `AGENTS.md`).
- Use the vocabulary in `CONTEXT.md` (Player, Jones, Week, Turn, Round, Time, Board, Location, Step, Goal, Goal points).
- Keep CI green: lint, typecheck, format check, tests, build. Tests go through the existing seams (store actions; Testing Library).
- Content (Locations, jobs, courses, goods, prices, Goal tables) lives in data modules, never in rules code (DEC-007).
- Placeholder art only; no Sierra assets (DEC-011, DEC-012).
- Open decisions OD-1 to OD-4 were settled in r3 (DEC-023 to DEC-026). Their numbers are data, set to the observed values and tuned by the balance pass (T-15).

Non-goals: Tuning the balance (T-15). Any game code.

## Completion

Each unknown named above is resolved with a source or recorded as an accepted default. Any figure that differs from DEC-023 to DEC-026 is reported, and the spec is re-issued with the change.

A criterion passes only with evidence covering the whole criterion; a partial contribution never implies the parent criterion passes.

Publication readback: not published.

---

# Ticket T-02: Write the education and jobs reference

Namespace / source revision / canonical source: V1 / r3 / `docs/specs/v1-spec.md` (repo `marcd35/jones-mvp`, base `8fff73c`).
Readiness: blocked on T-01 for requirements and wages (an outline can start from the design doc)
Dependencies: T-01

## Scope

- A markdown file, `docs/design/education-and-jobs.md`, explaining how the education tree and job requirements interact.
- Cover: the v1 education levels (Trade School, Jr. College, one deeper step) and the locked rungs; the wage ladders for the 8 employers; the requirement fields for each rung (education, experience, clothing); how experience accumulates; how jobs are lost (UNK-010); how this maps to the data pack schema from T-03.

## Contract snapshot

Acceptance: none (enabling task). Required by DEC-018 before T-10 and T-11.

Decisions:

- **DEC-014** (settled): Depth: all 8 employers (Z-Mart, Monolith Burger, QT Clothing, Socket City, Hi-Tech U, Factory, Black's Market, Rent Office) have wage ladders; education covers Trade School, Jr. College and one deeper step; higher rungs are shown locked; interviews are a requirements check, not a skill test. Source: User, Q13 "agree".
- **DEC-018** (settled): A markdown reference on how the education tree and job requirements interact is a ticket. It blocks the education and jobs data work. Source: User message.

Testing seams:

- none

Constraints:

- Run `node C:/Users/marcc/.claude/scripts/check-worktree.mjs` before building or committing; work on a branch, never on `main`.
- This repo uses a Next.js version with breaking changes. Read the relevant guide in `node_modules/next/dist/docs/` before writing Next-specific code (see `AGENTS.md`).
- Use the vocabulary in `CONTEXT.md` (Player, Jones, Week, Turn, Round, Time, Board, Location, Step, Goal, Goal points).
- Keep CI green: lint, typecheck, format check, tests, build. Tests go through the existing seams (store actions; Testing Library).
- Content (Locations, jobs, courses, goods, prices, Goal tables) lives in data modules, never in rules code (DEC-007).
- Placeholder art only; no Sierra assets (DEC-011, DEC-012).
- Open decisions OD-1 to OD-4 were settled in r3 (DEC-023 to DEC-026). Their numbers are data, set to the observed values and tuned by the balance pass (T-15).

Non-goals: Implementing jobs or courses (T-10, T-11). The full design-doc tree.

## Completion

The author reviews and approves the file. T-10 and T-11 cite it in their completion evidence.

A criterion passes only with evidence covering the whole criterion; a partial contribution never implies the parent criterion passes.

Publication readback: not published.

---

# Ticket T-03: Slice 1: walk the Board (data, Board, walking, Time)

Namespace / source revision / canonical source: V1 / r3 / `docs/specs/v1-spec.md` (repo `marcd35/jones-mvp`, base `8fff73c`).
Readiness: ready (walking costs come from the table in DEC-025)
Dependencies: none

## Scope

- Thinnest path through every layer: typed data modules (layout, Locations, walking-cost table) and a loader with a validator; a Players list with the active Turn; a seeded random source; the store; the Board component.
- The 5x5 ring with 13 Locations, the Clock cell, 2 blank cells and the centre panel; closed Locations marked and not enterable; placeholder tiles.
- Walk action: shorter direction around the ring, Time from the cost table; an overrunning walk starts, the Week ends at once and the Player is home with Time reset.
- Dial plus "hours left" number; the token slides along the ring.
- Replaces the MVP board and flat travel; existing store tests are migrated. Playable result: you can walk around and Weeks roll over.

## Contract snapshot

Acceptance (owned: AC-001, AC-002, AC-003, AC-014, AC-016, AC-021; contributing: AC-023):

- **AC-001**: The Board renders as the 5x5 ring in DEC-004: 13 Locations, the Clock cell, two blank cells and the centre panel, all from layout data. Closed Locations (DEC-008) are visibly marked and cannot be entered. Failure: a layout with a missing or duplicate cell is rejected by a layout validator.
  Verification: TEST-002, TEST-003
- **AC-002**: Selecting an open Location walks the Player along the ring by the shorter direction and spends Time looked up from a walking-cost table by ring distance (data, DEC-025; observed costs rise less than in proportion to distance). If the walk costs more Time than remains, the walk still starts, the Week ends at once with no arrival screen, and the Player is home (design doc: "If time runs out during travel, player returns to their home"). Selecting the current Location does nothing.
  Verification: TEST-001, TEST-003
- **AC-003**: The dial and the "hours left" number both show remaining Time, agree with the store, and expose the number as text to assistive technology. The token slides along the ring to the target.
  Verification: TEST-002, TEST-007
- **AC-014**: Rules code contains no literal Location, job, course, good or price. A test pack with an invented Location, job and good plays correctly with no rules change. Data is validated on load, and an invalid pack fails with a readable message.
  Verification: TEST-004
- **AC-016**: The model holds a list of Players, with the current Turn index. v1 runs with one Player, and every rule reads the active Player from the list.
  Verification: TEST-001
- **AC-021**: CI (lint, typecheck, format check, tests, build) is green on every PR and on `main`. The rules have test coverage for every AC marked TEST-001.
  Verification: CI run; TEST-001
- **AC-023**: No Sierra asset (art, audio, text) is in the repo or the build. Placeholder art is replaceable behind the same layout.
  Verification: Inspection of `public/` and the build output; TEST-002

Decisions:

- **DEC-004** (settled): v1 aims at a replica of the original game. The Board is the 5x5 ring verified against the original: top row Le Security, Rent Office, Low-cost housing, Pawn shop, Z-Mart; right column Monolith Burger, QT Clothing, blank; bottom row Socket City, Hi-Tech U, Clock, Employment Office, Factory; left column Bank, Black's Market, blank. The centre is one panel with up to four player markers. The design doc's 4-row grid is wrong. Source: User message; fieldwork sheet, "Verification notes".
- **DEC-005** (settled): Solo play only. The model supports several Players (a player list; a Turn is one Player's Week). Jones is the first milestone after v1. Source: User, Q4 "agree".
- **DEC-007** (settled): Locations, Board layout, jobs, courses, goods, prices and Goal tables live in typed data modules, separate from the rules. Source: User, Q6 "agree".
- **DEC-008** (settled): Functional Locations (10): Low-cost housing, Rent Office, Employment Office, Monolith Burger, Black's Market, QT Clothing, Z-Mart, Socket City, Hi-Tech U, Factory. Bank, Pawn shop and Le Security appear on the Board as closed. Source: User, Q7 "agree".
- **DEC-011** (settled): v1 uses flat placeholder art. The layout and sizes allow later art swaps without touching the rules. Source: User, Q10 "agree".
- **DEC-015** (settled): Time shows as a dial plus an "hours left" number. The token slides along the ring. A Week ends automatically with a weekend report, and the Player may also end it early. Source: User, Q14 "agree"; `game-design.md` "Turn ends when player chooses to end it".
- **DEC-017** (assumption): The rules layer is rebuilt test-first against the data modules. The CI, hydration pattern and UI primitives are kept. Source: Assistant proposal, session 2026-11-01.
- **DEC-025** (settled): Walking cost (r3, settles OD-3): Time per walk comes from a table keyed by ring distance, in data. Starting values: 1 Step 3.9%, 2 Steps 5.5%, 3 Steps 7.7%, 6 to 7 Steps 11.6% of a Week; distances 4 and 5 are interpolated until measured. Source: User, OD-3 "agree with all recommendations" (option a).

Testing seams:

- **TEST-001**: All rules: AC-002, 004 to 013, 016, 021. Boundary: Public store actions with an injected data pack and a seeded random source. Verify: Set up a state, call actions, assert state and events. Cover each failure path (no Time, no money, closed Location, unmet requirement). Reason: Matches the repo's existing seam; no UI needed to prove rules.
- **TEST-002**: Board rendering: AC-001, 003, 023. Boundary: Board component, rendering from layout data. Verify: Render with the real layout and with invalid layouts; assert cell positions, closed state, text for hours left. Reason: Cell placement is the visible contract.
- **TEST-003**: Walking distance: AC-001, 002. Boundary: Pure function over layout data. Verify: Assert Steps for every pair, symmetry, shortest direction, and that blank cells are not destinations. Reason: Small, exhaustive and cheap.
- **TEST-004**: Data separation and requirements: AC-011, 012, 014. Boundary: Data loader and rules, with a test pack. Verify: Load an invented pack; play a scenario using it; load an invalid pack and assert the message. Reason: Proves the rules do not hard-code content.
- **TEST-007**: Phone layout: AC-003, 017. Boundary: Real browser at 390x844. Verify: Manual inspection with screenshots of Board, one Location screen and the weekend report, plus a check for horizontal scroll. Reason: jsdom cannot evaluate layout.

Constraints:

- Run `node C:/Users/marcc/.claude/scripts/check-worktree.mjs` before building or committing; work on a branch, never on `main`.
- This repo uses a Next.js version with breaking changes. Read the relevant guide in `node_modules/next/dist/docs/` before writing Next-specific code (see `AGENTS.md`).
- Use the vocabulary in `CONTEXT.md` (Player, Jones, Week, Turn, Round, Time, Board, Location, Step, Goal, Goal points).
- Keep CI green: lint, typecheck, format check, tests, build. Tests go through the existing seams (store actions; Testing Library).
- Content (Locations, jobs, courses, goods, prices, Goal tables) lives in data modules, never in rules code (DEC-007).
- Placeholder art only; no Sierra assets (DEC-011, DEC-012).
- Open decisions OD-1 to OD-4 were settled in r3 (DEC-023 to DEC-026). Their numbers are data, set to the observed values and tuned by the balance pass (T-15).

Non-goals: Jobs, money rules, goals setup, real Location screens (a stub is enough), real art.

## Completion

TEST-003 over all pairs (symmetry, shortest direction, blanks excluded). TEST-004 with an invented pack that adds a Location (job and good cases are covered by T-04, T-10, T-12). TEST-001 for walking and overrun. TEST-002 for the layout, closed Locations and the dial text. TEST-007: a screenshot at 390x844. AC-021: CI green here; each later ticket keeps it green.

A criterion passes only with evidence covering the whole criterion; a partial contribution never implies the parent criterion passes.

Publication readback: not published.

---

# Ticket T-04: Slice 2: earn money (first job, Work, weekend report)

Namespace / source revision / canonical source: V1 / r3 / `docs/specs/v1-spec.md` (repo `marcd35/jones-mvp`, base `8fff73c`).
Readiness: ready (shift length and Time cost from DEC-022 and DEC-026)
Dependencies: T-03

## Scope

- Employment Office stub: the Player is hired as a Monolith Burger Cook with no requirement.
- Work action pays the wage times a shift (data) and costs Time (data); the Monolith screen; money shown.
- Week ends when Time runs out or the Player ends it; a weekend report with a documented, fixed order of effects and a slot for each later effect; each Turn starts at home with full Time.
- Playable result: walk to work, earn, end Weeks and watch money grow.

## Contract snapshot

Acceptance (owned: AC-004; contributing: AC-011, AC-014):

- **AC-004**: A Week ends when Time runs out or the Player ends it. A weekend report lists what changed: food, clothing wear, rent due, inflation step, newspaper. Then the next Turn starts with full Time (less any hunger penalty). Order of effects is fixed and documented. The Player starts each Turn at home (r2: observed).
  Verification: TEST-001, TEST-009
- **AC-011**: Jobs: the Employment Office lists jobs for all 8 employers. A job is open to the Player only if education, experience and clothing meet its requirements (data). Working spends Time, pays the wage (not inflation-adjusted by default, DEC-024), and adds experience. A Work action pays the wage times a shift of about 8 hours and costs about 1.2 hours of Time, both from data (DEC-022, DEC-026).
  Verification: TEST-001, TEST-004
- **AC-014**: Rules code contains no literal Location, job, course, good or price. A test pack with an invented Location, job and good plays correctly with no rules change. Data is validated on load, and an invalid pack fails with a readable message.
  Verification: TEST-004

Decisions:

- **DEC-013** (settled): Systems in v1: hunger and food, clothing wear, rent every 4 weeks, hidden inflation with a newspaper, jobs with experience, education, goods that raise happiness. Out: random events, robbery, doctor's bills, bank, loans, investments, pawn, lottery, Le Security, Jones. Unpaid rent has the consequence in DEC-023 (r3: garnishment comes in, so it is no longer out of scope). Source: User, Q12 "agree".
- **DEC-015** (settled): Time shows as a dial plus an "hours left" number. The token slides along the ring. A Week ends automatically with a weekend report, and the Player may also end it early. Source: User, Q14 "agree"; `game-design.md` "Turn ends when player chooses to end it".
- **DEC-022** (assumption): Work and Time scale (r2): a Work action pays the hourly wage times a full shift (about 8 hours; $32 for the $4/hr Cook) and costs about 10% of a Week (about 1.2 of 12 hours). The hunger penalty is about 35% of a Week (about 4 hours). Relax costs about 11%. Source: Fieldwork round 2, "Travel and action costs" and "Jobs" (medium confidence).
- **DEC-026** (settled): Work pays a full shift (r3, settles OD-4): a Work action pays the hourly wage times a shift length (about 8 hours) and costs the Time in DEC-022 (about 1.2 of 12 hours). Both numbers are data. Source: User, OD-4 "agree with all recommendations" (option a).

Testing seams:

- **TEST-001**: All rules: AC-002, 004 to 013, 016, 021. Boundary: Public store actions with an injected data pack and a seeded random source. Verify: Set up a state, call actions, assert state and events. Cover each failure path (no Time, no money, closed Location, unmet requirement). Reason: Matches the repo's existing seam; no UI needed to prove rules.
- **TEST-004**: Data separation and requirements: AC-011, 012, 014. Boundary: Data loader and rules, with a test pack. Verify: Load an invented pack; play a scenario using it; load an invalid pack and assert the message. Reason: Proves the rules do not hard-code content.
- **TEST-009**: Screens: AC-004 to 006, 009, 013, 017. Boundary: Components with the real store. Verify: Drive setup, location screens, weekend report and newspaper through roles and labels. Reason: Verifies what the Player actually sees.

Constraints:

- Run `node C:/Users/marcc/.claude/scripts/check-worktree.mjs` before building or committing; work on a branch, never on `main`.
- This repo uses a Next.js version with breaking changes. Read the relevant guide in `node_modules/next/dist/docs/` before writing Next-specific code (see `AGENTS.md`).
- Use the vocabulary in `CONTEXT.md` (Player, Jones, Week, Turn, Round, Time, Board, Location, Step, Goal, Goal points).
- Keep CI green: lint, typecheck, format check, tests, build. Tests go through the existing seams (store actions; Testing Library).
- Content (Locations, jobs, courses, goods, prices, Goal tables) lives in data modules, never in rules code (DEC-007).
- Placeholder art only; no Sierra assets (DEC-011, DEC-012).
- Open decisions OD-1 to OD-4 were settled in r3 (DEC-023 to DEC-026). Their numbers are data, set to the observed values and tuned by the balance pass (T-15).

Non-goals: Other employers, requirements, hunger, rent, inflation (T-07 to T-10).

## Completion

TEST-001: hire, work, insufficient Time, end Week, report order with stub slots. TEST-004: the invented pack adds a job. TEST-009: the Monolith screen and the report. Later effect tickets add their line to the report and contribute to AC-004.

A criterion passes only with evidence covering the whole criterion; a partial contribution never implies the parent criterion passes.

Publication readback: not published.

---

# Ticket T-05: Slice 3: Goals setup, win and lose screens

Namespace / source revision / canonical source: V1 / r3 / `docs/specs/v1-spec.md` (repo `marcd35/jones-mvp`, base `8fff73c`).
Readiness: ready (targets are placeholders; a Goal with 0 points counts as met until its measure exists)
Dependencies: T-03, T-04

## Scope

- Setup screen: four Goal sliders over a Goal points budget (default from data); the sum can never exceed it; each slider shows its target from the data table.
- New game starts at Low-cost housing with starting cash from data (observed: $200).
- Wealth is measured from money; the other three measures arrive in T-10 to T-12. Win when all four Goals are met; win and lose screens with a summary; no actions after either; New game is always available.
- Removes the MVP "$500 as Shift Manager" rule. Playable result: earn to a wealth Goal and win.

## Contract snapshot

Acceptance (owned: AC-005, AC-006; contributing: none):

- **AC-005**: The setup screen shows four Goal sliders over a Goal points budget (default from data, observed 200). The sum can never exceed the budget. Each slider shows its target from a data table. The game starts at Low-cost housing with starting cash from data.
  Verification: TEST-009, TEST-001
- **AC-006**: The Player wins when all four Goals are met, and the win is announced with a summary of weeks played and final stats. The Player loses if the owed rent balance reaches the limit in DEC-023. Neither state allows further actions.
  Verification: TEST-001, TEST-009

Decisions:

- **DEC-009** (settled): The four Goals (wealth, happiness, education, career) are set with sliders over a Goal points budget (observed default 200). A Player wins by meeting all four. Source: User, Q8 "agree".
- **DEC-013** (settled): Systems in v1: hunger and food, clothing wear, rent every 4 weeks, hidden inflation with a newspaper, jobs with experience, education, goods that raise happiness. Out: random events, robbery, doctor's bills, bank, loans, investments, pawn, lottery, Le Security, Jones. Unpaid rent has the consequence in DEC-023 (r3: garnishment comes in, so it is no longer out of scope). Source: User, Q12 "agree".

Testing seams:

- **TEST-001**: All rules: AC-002, 004 to 013, 016, 021. Boundary: Public store actions with an injected data pack and a seeded random source. Verify: Set up a state, call actions, assert state and events. Cover each failure path (no Time, no money, closed Location, unmet requirement). Reason: Matches the repo's existing seam; no UI needed to prove rules.
- **TEST-009**: Screens: AC-004 to 006, 009, 013, 017. Boundary: Components with the real store. Verify: Drive setup, location screens, weekend report and newspaper through roles and labels. Reason: Verifies what the Player actually sees.

Constraints:

- Run `node C:/Users/marcc/.claude/scripts/check-worktree.mjs` before building or committing; work on a branch, never on `main`.
- This repo uses a Next.js version with breaking changes. Read the relevant guide in `node_modules/next/dist/docs/` before writing Next-specific code (see `AGENTS.md`).
- Use the vocabulary in `CONTEXT.md` (Player, Jones, Week, Turn, Round, Time, Board, Location, Step, Goal, Goal points).
- Keep CI green: lint, typecheck, format check, tests, build. Tests go through the existing seams (store actions; Testing Library).
- Content (Locations, jobs, courses, goods, prices, Goal tables) lives in data modules, never in rules code (DEC-007).
- Placeholder art only; no Sierra assets (DEC-011, DEC-012).
- Open decisions OD-1 to OD-4 were settled in r3 (DEC-023 to DEC-026). Their numbers are data, set to the observed values and tuned by the balance pass (T-15).

Non-goals: Final targets (T-15). Education, career and happiness measures. The unpaid-rent loss (T-09).

## Completion

TEST-001: win, lose, no actions afterward, budget limit. TEST-009: slider behaviour and the start state. AC-006 integration verifier: T-09 checks the unpaid-rent path.

A criterion passes only with evidence covering the whole criterion; a partial contribution never implies the parent criterion passes.

Publication readback: not published.

---

# Ticket T-06: Deploy to Vercel with a preview per PR

Namespace / source revision / canonical source: V1 / r3 / `docs/specs/v1-spec.md` (repo `marcd35/jones-mvp`, base `8fff73c`).
Readiness: blocked until the author authorizes the Vercel connection (DEC-006); sharing the link is gated by the naming decision (DEC-012)
Dependencies: T-03

## Scope

- Connect the repo to Vercel: production from `main`, a preview per PR, no backend, saves in `localStorage`.
- Confirm no Sierra assets are in `public/` or the build output. Record the naming decision (UNK-007) before the first link is shared.

## Contract snapshot

Acceptance (owned: AC-020, AC-023; contributing: none):

- **AC-020**: A public Vercel URL serves the app from `main`, and each PR gets a preview. The first shared link is not sent before DEC-012's naming decision.
  Verification: TEST-008
- **AC-023**: No Sierra asset (art, audio, text) is in the repo or the build. Placeholder art is replaceable behind the same layout.
  Verification: Inspection of `public/` and the build output; TEST-002

Decisions:

- **DEC-006** (settled): Deploy to a public Vercel URL with a preview deploy per PR. Saves stay in browser `localStorage`. No backend or accounts. No Vercel connection is made until the author says so. Source: User, Q5 "agree".
- **DEC-011** (settled): v1 uses flat placeholder art. The layout and sizes allow later art swaps without touching the rules. Source: User, Q10 "agree".
- **DEC-012** (settled): The working title stays for now. The public name, and whether original location names stay, is decided before the first shared link. No Sierra assets are used. Source: User, Q11 "agree".

Testing seams:

- **TEST-008**: Deployment: AC-020. Boundary: Live URL and the Vercel dashboard. Verify: Fetch the URL; confirm the build is from `main`; open a PR and confirm a preview. Reason: Only the real deployment proves this.

Constraints:

- Run `node C:/Users/marcc/.claude/scripts/check-worktree.mjs` before building or committing; work on a branch, never on `main`.
- This repo uses a Next.js version with breaking changes. Read the relevant guide in `node_modules/next/dist/docs/` before writing Next-specific code (see `AGENTS.md`).
- Use the vocabulary in `CONTEXT.md` (Player, Jones, Week, Turn, Round, Time, Board, Location, Step, Goal, Goal points).
- Keep CI green: lint, typecheck, format check, tests, build. Tests go through the existing seams (store actions; Testing Library).
- Content (Locations, jobs, courses, goods, prices, Goal tables) lives in data modules, never in rules code (DEC-007).
- Placeholder art only; no Sierra assets (DEC-011, DEC-012).
- Open decisions OD-1 to OD-4 were settled in r3 (DEC-023 to DEC-026). Their numbers are data, set to the observed values and tuned by the balance pass (T-15).

Non-goals: Custom domain, analytics, accounts.

## Completion

TEST-008: the live URL, the build source, and a preview on a test PR. Inspection of `public/` and the build output for AC-023. AC-021 integration verifier: CI plus the Vercel build green on `main`.

A criterion passes only with evidence covering the whole criterion; a partial contribution never implies the parent criterion passes.

Publication readback: not published.
