# Jones in the Fast Lane

A turn-based life simulation, remade for the web. Players spend a limited number of hours each week to earn money, study and buy things, racing to reach their goals before the opponent does.

## Language

**Player**:
One participant in a game, human or Jones. v1 has a single human Player, but the game is modelled for several.
_Avoid_: User, character

**Jones**:
The computer-controlled opponent Player. Not part of v1.
_Avoid_: AI, bot, CPU

**Week**:
One in-game week. Every Player has 12 hours of Time to spend in it.
_Avoid_: Day, month

**Turn**:
One Player's go at a Week. With a single Player a Turn and a Week coincide.
_Avoid_: Move, round (see Round)

**Round**:
The span in which every Player has taken one Turn.

**Goal**:
A target in one of four categories (wealth, happiness, education, career). A Player wins by meeting all four of their Goals.
_Avoid_: Objective, victory condition

**Goal points**:
The budget a Player splits across the four Goals at setup. More points on a Goal makes that Goal harder.
_Avoid_: Difficulty, score

**Time**:
The hours a Player has left to spend in the current Turn. Every action costs Time.
_Avoid_: Energy, hours remaining

**Board**:
The play area: a ring of Locations around a central area, shown to the Player.
_Avoid_: Map, level

**Location**:
A named place on the Board where a Player can do things, such as work, shop or study.
_Avoid_: Building, store, room

**Step**:
One unit of walking between places on the Board. Walking costs Time per Step.
_Avoid_: Move, hop

**Weekend report**:
The summary shown when a Week ends. It has one line for each effect of the Week's end, always in the same order (food, clothing wear, rent due, inflation step, newspaper), and shows "No change" for an effect that does nothing yet or that week.
_Avoid_: Summary, receipt

**Newspaper**:
The full issue sold to a Player at Black's Market, carrying the current Week's headline.
_Avoid_: Headline (for the full issue)
