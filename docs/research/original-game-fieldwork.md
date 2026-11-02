# Original game fieldwork

Play a few in-game weeks of the original 1991 game and fill in the blanks below.
Approximate is fine; write `?` where you can't tell. This is the evidence for
the v1 balance pass, so note anything surprising even if it isn't asked for.

Session notes: 1 player vs Jones, goals left at default (200 goal points, four sliders at mid), Jones set to "play fair". Played to Week 2. Clock readings are analog dial estimates only (no numeric time shown), so they are approximate.

## 1. Board and travel

| Question                                                                              | Answer                                                                                                                                                                                                                                                                                                                                                                                      |
| ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Where does a new game start the player?                                               | Low-cost housing (player token sits on it right after the board appears). Medium-high confidence.                                                                                                                                                                                                                                                                                           |
| Can you walk through the centre, or only around the outer ring?                       | ? (not tested). The centre is a blank panel that shows the player portrait or turn messages.                                                                                                                                                                                                                                                                                                |
| Does the character walk visibly, step by step, or jump to the destination?            | Corrected in Round 2 (verified): it walks visibly. The token animates along the path, the clock dial fills during the walk, and the destination screen opens only on arrival (3 to 8 seconds in the emulator for longer walks). The first-run reading of a jump was probably taken before the animation showed.                                                                             |
| What does the clock show (hours, "units", something else)? How many per week?         | "Week # N" under an analog dial. The dial has a red wedge that grows while the player moves; the wedge filling up ended Week 1. No numeric hours shown. Weeks per game: ?. Round 2 (verified by counting red pixels in saved screenshots): each player has their own dial each week, and a full dial ends that player's turn. A one-step walk fills about 3.9% of it. See Round 2 findings. |
| Does the Clock cell do anything when you visit it?                                    | Clicking it showed nothing visible.                                                                                                                                                                                                                                                                                                                                                         |
| What are the nine "char / status" cells in the middle: players, a single stats panel? | Not nine cells. The centre is one panel; four green corner boxes show player markers ("1" for the player, then Jones's face when it is his turn). Money display is bottom right (calculator).                                                                                                                                                                                               |
| Is there a street path that differs from the cell grid (e.g. entrances on one side)?  | ? (not tested). Each building is clicked on its facade and opens its own screen.                                                                                                                                                                                                                                                                                                            |

### Travel times

Use the same starting point each time. Write the clock before and after each walk.

Start confirmed at Low-cost housing. Every walk from Low-cost housing was followed by a return walk to Low-cost housing (not a table row), so the clock readings include the return trips for the next row. The dial is read as an approximate red-wedge angle (12 = top); exact time is not shown, so all clock values are estimates.

| From             | To                | Clock before                      | Clock after                                       | Used                                                                                                |
| ---------------- | ----------------- | --------------------------------- | ------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Low-cost housing | Rent Office       | ~12 (small wedge)                 | ~12, no visible change                            | Yes. Office was "OFFICE CLOSED" on arrival. Walk back to Low-cost was from Rent Office (not a row). |
| Low-cost housing | Pawn shop         | ~12 (small wedge)                 | ~1-2 o'clock                                      | Yes. Pawnshop menu: BUY / EXIT (items not read).                                                    |
| Low-cost housing | Z-Mart            | ~1 o'clock                        | ~2-3 o'clock                                      | Yes.                                                                                                |
| Low-cost housing | Monolith Burger   | ~2-3 o'clock                      | ~3 o'clock                                        | Yes.                                                                                                |
| Low-cost housing | QT Clothing       | ~3 o'clock                        | ~4 o'clock                                        | Yes.                                                                                                |
| Low-cost housing | Socket City       | ~4-5 o'clock                      | ~5 o'clock                                        | Yes.                                                                                                |
| Low-cost housing | Hi-Tech U         | ~5-6 o'clock                      | nearly full (~11 o'clock)                         | Yes. Week was nearly over.                                                                          |
| Low-cost housing | Employment Office | ? (wedge near full, read unclear) | ~1 o'clock (new week started during the sequence) | Yes. Low confidence: the week rolled over around here.                                              |
| Low-cost housing | Factory           | ?                                 | ?                                                 | No (not reached).                                                                                   |
| Low-cost housing | Bank              | ?                                 | ?                                                 | No (not reached).                                                                                   |
| Low-cost housing | Black's Market    | ?                                 | ?                                                 | No (not reached).                                                                                   |
| Low-cost housing | Le Security       | ?                                 | ?                                                 | No. Click went to Monolith Burger screen instead (see Section 4).                                   |
| Z-Mart           | Factory           | ?                                 | ?                                                 | No (not reached).                                                                                   |
| Rent Office      | Black's Market    | ?                                 | ?                                                 | No (not reached).                                                                                   |

## 2. Game setup

| Question                                                         | Answer                                                                                                                                                                                                                                                                                                                              |
| ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Starting cash                                                    | $200 (high confidence, money display at start).                                                                                                                                                                                                                                                                                     |
| Starting housing, and starting clothes                           | Housing: Low-cost housing (start cell). Clothes: ? (not seen).                                                                                                                                                                                                                                                                      |
| Goal setup screen: what units (percent, points)? Default values? | Units are points: "Goal Points = 200". Four sliders with icons (money, happiness smiley, diploma, suitcase/car); all sliders at mid-position at start and not changed. Jones's goals screen also shows 200 points. Jones difficulty options: "take it easy?", "play fair?", "go for broke?" (I chose play fair; default not known). |
| What does "Relax" do, and does it cost time?                     | Corrected in Round 2 (verified): pressed once in Week 5. It costs about 11% of the dial (about 3 one-step walks) and showed no message or visible stat change.                                                                                                                                                                      |
| How is the game won and announced?                               | ? (not reached).                                                                                                                                                                                                                                                                                                                    |

## 3. Prices and wages the design doc leaves blank

| Item                                               | Value                                                                                     | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Rent per 4 weeks: Low-cost housing                 | ?                                                                                         | Rent Office was closed on the visit, so no rent list seen. Round 2: the Rent Office was open only in the rent-due week (Week 8) and lists Pay Rent for 1 month $325, Rent Low-Cost Apartment $282, Rent Security Apartment $413 (all at an index of about 0.83 of Week 1); it was closed in Weeks 2, 5 and 7.                                                                                                                                                                                               |
| Rent per 4 weeks: Le Security                      | $413 (Rent Security Apartment, Week 8)                                                    | Round 2, Rent Office list in Week 8. Le Security itself only shows an APARTMENT FOR RENT sign.                                                                                                                                                                                                                                                                                                                                                                                                              |
| Deposit or move-in fee                             | ?                                                                                         | Not seen.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| Cheapest food that clears hunger (place, price)    | ?                                                                                         | Monolith menu, Week 1: Hamburgers $82, Cheeseburger $93, Astro Chicken $130, Fries $68, Shakes $107, Colas $72. Hunger effect not tested. Cheapest item on menu: Fries $68 (Week 1). Round 2: Black's Market sells Food For 1 Week $70, 2 Weeks $128, 4 Weeks $243 (Week 7), probably the intended hunger fix; Monolith items (cheapest Fries $56 in Week 8) were never bought, so whether they clear hunger is untested. Monolith prices in Round 2: Week 3 Fries $81, Week 6 $74, Week 7 $83, Week 8 $56. |
| Doctor's bill for skipping food                    | $27 (Week 7, equal to all my cash)                                                        | Round 2: a DOCTOR BILL screen appeared at the start of Week 7 after five hungry weeks (Weeks 3 to 7).                                                                                                                                                                                                                                                                                                                                                                                                       |
| Clothing: casual / dress / suit                    | $76 / $131 / $309                                                                         | QT Clothing menu (Week 1): Casual Clothes $76, Dress Clothes $131, Business Suit $309. Round 2: Week 3 $91 / $157 / $371; Week 6 $84 / $144 / $341; Week 7 $92 / $160 / $377; Week 8 $63 / $108 / $256 (bought Casual Clothes with one click, no confirm). Z-Mart sold Casual Clothes at $44 in Week 3.                                                                                                                                                                                                     |
| First course: name, fee, hours, how many to finish | Trade School and Jr. College at Hi-Tech U; fee ?, hours ?, count ?                        | Hi-Tech U screen lists these two courses. Clicking a course says "You need to enroll in a class first." Not enrolled, so fee and hours unknown. Round 2: the ENROLL button asks 'The enrollment fee is $63. Would you like to enroll?' (Week 3), $60 in Week 4, with Yes and No. Which course it applies to, hours and count are still ?.                                                                                                                                                                   |
| Starter job wage at the Employment Office          | $4/hr (Monolith Cook, hired on the first try)                                             | Round 2, Week 3 Employment Office. Cook needs no experience; all wage lists are in Round 2 findings.                                                                                                                                                                                                                                                                                                                                                                                                        |
| Typical weekly income for a full 12 hours of work  | About $32 gross per WORK click at Cook (8h x $4, inferred); 5 clicks fit in a hungry week | Round 2, Week 6: each WORK click paid $32 and the landlord garnished $18 each time, so $14 net per click. A click costs about 10% of the dial.                                                                                                                                                                                                                                                                                                                                                              |
| Cheapest "happiness" item and what it adds         | ?                                                                                         | Not measured. Visible prices, for reference: Z-Mart TV $115, 8-track player $78, Works of Capote $105 (one item name cut off); Socket City Stereo $432, VCR $349, Microwave $346. Happiness effect not known.                                                                                                                                                                                                                                                                                               |

Other prices seen (for the sheet, Week 1 unless marked):

- Socket City (appliances): Refrigerator $919, Freezer $538, Stove $598, Color TV $551, VCR $349, Stereo $432, Microwave $346, Hot Tub $1317, Computer $1678.
- Z-Mart: TV $115, one item $57 (name cut off), 8-track player $78, Works of Capote $105.
- Monolith Burger, Week 2 (after the weekend): Hamburgers $88, Cheeseburger $99, Astro Chicken $139, Fries $72, Shakes $115, Colas $77. Corrected in Round 2: I could not reproduce this list. A list labelled Week 2 seen during Jones's turn read $97, $110, $154, $81, $127, $85 and the Week 3 list read $98, $111, $155, $81, $128, $86 (all about 1.20 times Week 1 for the whole ring), so treat the $88 list as unreliable. Weekly index in Round 2 findings.

## 4. Mechanics the design doc only names

| Question                                                                          | Answer                                                                                                                                                                                                                                                                                                                                                                            |
| --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Working: is a shift a fixed block of hours, or hour by hour? When are you paid?   | Corrected in Round 2 (verified): a WORK click does not end the week. It costs about 10% of the dial and pays one block ($32 gross at Cook in Week 6); 5 clicks fitted into a hungry week. The earlier week end after WORK was probably the dial running out. Pay comes with the click (the calculator updates after the bubbles are dismissed), minus garnishing if rent is owed. |
| How do you get a job: interview, skill check, just apply? What can make you fail? | Corrected in Round 2 (verified): Employment Office, click an employer, see its jobs and wages, click a job. 'Congratulations. You got the job.' or 'Sorry. You didn't get the job for the following reasons:' with Not enough Education, Not enough Experience or No openings. Entry jobs (Monolith Cook) need nothing. Each attempt costs about 6 to 8% of the dial.             |
| How does experience accumulate and what unlocks it?                               | ?                                                                                                                                                                                                                                                                                                                                                                                 |
| How does a degree show up (a level, a list of courses, a title)?                  | ? (courses shown only at Hi-Tech U; not enrolled).                                                                                                                                                                                                                                                                                                                                |
| Which items add happiness, and how many points?                                   | ?                                                                                                                                                                                                                                                                                                                                                                                 |
| What do Jones's turns look like? Where does he go, and what does he show you?     | Jones's turn: the centre panel shows Jones's portrait and the four corner boxes show Jones faces. His moves were not watched in detail. Round 2: during his turn the centre shows his portrait, hand cursor, and his own screens appear (Employment Office, Monolith with WORK). Details in Round 2 findings.                                                                     |
| When does the newspaper appear, and what do the first few headlines say?          | Round 2: never appeared in Weeks 2 to 8. Black's Market sells 'Newspaper $1' (Daily News); I had $0 there, so no headlines yet.                                                                                                                                                                                                                                                   |
| What happens when time runs out mid-walk?                                         | Round 2 (verified): the walk still starts, the week ends at once with no arrival screen (QT to Factory in Week 6 with about 5% of the dial left), then Jones's turn begins.                                                                                                                                                                                                       |

## Surprising / notes for the balance pass

- Prices rose between the first Monolith visit (Week 1) and the second (Week 2): Hamburgers $82 to $88, Cheeseburger $93 to $99, Astro Chicken $130 to $139, Fries $68 to $72, Shakes $107 to $115, Colas $72 to $77. Confirm this is a weekly inflation step. Round 2: confirmed as a weekly uniform index, but it does not rise every week (it went down in Weeks 4 to 6 and fell 32% in Week 8).
- Cash did not reconcile: $200 at start; after the Le Security click (Monolith screen) the display read $232; after the WORK click and the weekend report ("You spent $70") it read $130. $232 - $70 = $162, not $130, so about $102 was lost or spent somewhere I did not see. Unresolved. Round 2: cash reconciled exactly in every week I played, so this gap was probably mis-landed clicks (e.g. a WORK paycheck minus the landlord's garnishing).
- Clicking a shopkeeper speech bubble can advance the game: at the Employment Office it led to a job result, and at Le Security it led to a Monolith Burger screen with WORK. Clicks near speech bubbles can trigger actions by accident.
- The "Relax" button, the Rent Office rent list (office was closed), and the course fees were not reached.

## Verification notes (main session, after the agent finished)

- Board layout checked against a full screenshot: it matches the 5x5 ring in the v1 board sketch exactly. Left column: Le Security (corner), blank, Black's Market, Bank, Factory (corner). Right column: Z-Mart (corner), Monolith Burger, QT Clothing, blank, Socket City (corner). The design doc's 4-row grid is wrong. A winding path runs around the ring. The centre is one panel with four "1" player markers at its corners.
- The emulator lags: a click can take 1 to 2 seconds to show its result. Clicks sent in quick succession can land on the wrong screen, which likely explains the cash that did not reconcile and the accidental WORK click. Treat dynamic readings (cash, clock, week rollover, hiring) as unreliable. Static menus read from one screenshot are more trustworthy.
- Z-Mart, Week 2: Stove $588, Stereo $540, Black and White TV $132, Microwave $264, Concert Tickets $48, Dog Food $21. This differs from the agent's earlier Z-Mart reading, so the stock rotates weekly, as the design doc says.
- Travel cost is still unmeasured. Suggested method: shuttle between two adjacent locations and count walks until "Oh What a Weekend!". Each location screen is modal and must be closed with its EXIT or DONE button before the next walk.

## Round 2 findings

Method and caveats:

- Continued the existing game (1 player vs Jones, "play fair"); I did not start a fresh game. I joined it halfway through Week 2 and played to Week 8. Week numbers below are the on-screen "Week # N" labels.
- Browser pane gotcha for future runs: in a small pane the emulator's gear overlay (top right) sits over Z-Mart and a click there opens its menu instead of walking. Set the tab viewport to 1024x768 (resize_window) so the board keeps the 800x600 click frame.
- One click per step with a 2 to 10 second wait. Walks are animated and take about 3 to 8 seconds; the destination screen opens only on arrival. The first click after a shopkeeper speech bubble only dismisses the bubble, so a DONE/EXIT button behind a bubble needs a second click.
- The clock has no numbers, so I measured it by counting red pixels in the dial on the saved screenshots (the full dial, which ends the week, reads 0.687 on that scale). Costs below are given as a percentage of a full dial. Resolution is about 0.5 percentage points per dial pixel, and a reading taken during the animation can be low, so single readings are good to about 1 to 2 points.
- Cash always reconciled in the weeks I played: end-of-week cash minus the "You spent $X" amount equals next week's starting cash.

### Turn structure (new, verified)

- Both players take a full turn each week, player 1 first. Each has their own dial. When the player's dial fills, the walk or action in progress ends the turn at once (no arrival screen opens), then Jones plays his turn (hand cursor, portrait in the centre, his own shop and Employment Office screens are visible), then the weekend reports appear.
- "Oh What a Weekend!" is shown per player at the start of that player's next turn: a random flavour line and "You spent $X". Amounts I saw as Player 1: $54 (Week 2 to 3), $38, $15, $23 (all my cash), $43. Jones as Player 2: $64, $39. It is not a fixed share of cash.
- The player token starts every week at Low-cost housing, wherever the previous week ended.
- Penalties are applied at the start of the turn, after the weekend report: "LESS TIME! DUE TO HUNGER" (watch picture) cut the dial at the start of Weeks 3, 4, 5, 6 and 7. Week 7 started with a "DOCTOR BILL" screen ($27, exactly my remaining cash) and an extra time loss (see below).

### Travel and action costs

All numbers are % of a full dial (one week of time). "Step" is one cell on the 16-cell ring.

| Action                                                                                                               | Cost (% of full dial) | One-step walks | Evidence                                                                                      |
| -------------------------------------------------------------------------------------------------------------------- | --------------------- | -------------- | --------------------------------------------------------------------------------------------- |
| Walk, 1 step (Low-cost to Pawn or Rent Office, Hi-Tech U to Socket City, Emp to Factory)                             | about 3.9             | 1              | 10 + 14 + several shuttle walks; typical single readings 3.5 to 4.2                           |
| Walk, 2 steps (Low-cost to Z-Mart, QT to Socket City, Hi-Tech U to Employment Office, Le Security to Black's Market) | about 5.5             | 1.4            | Low-cost to Z-Mart and back, 3 readings of 5.4 to 5.7; the other three single readings        |
| Walk, 3 steps (Low-cost to Monolith Burger, Pawn shop to Monolith Burger)                                            | about 7.7             | 2              | Low-cost to Monolith Burger, 1 reading                                                        |
| Walk, long (Low-cost to Hi-Tech U; Employment Office to Monolith Burger)                                             | about 11.6            | 3              | 2 readings. These are 6 to 7 steps round the ring but cost about 3 one-step walks, not 6 to 7 |
| Browsing: close a screen, read a menu, ENROLL prompt, Pawn BUY, Employment lists                                     | 0 measurable          | 0              | About 10 Employment Office list views in Week 3 left the dial unchanged                       |
| Applying for a job (success or rejection)                                                                            | 6 to 8                | 1.5 to 2       | 3 attempts in Week 3: Cook (hired) 7.9, General Manager 8.3, Janitor 5.7                      |
| WORK click at a job                                                                                                  | 9 to 11               | 2.4 to 2.9     | 5 clicks in Week 6; the first four measured: 11.2, 8.7, 9.6, 9.0                              |
| RELAX at Low-cost housing                                                                                            | about 11.2            | 2.9            | 1 click, Week 5                                                                               |
| Bank menu click (Apply For Loan, Loan Payment, See The Broker)                                                       | about 3 to 4 each     | about 1        | 2 clicks measured (3.5, 4.5); low confidence                                                  |
| Hunger penalty at turn start                                                                                         | 34.8                  | about 9        | Identical in Weeks 3, 4, 5, 6 and 7 (0.239 of 0.687)                                          |
| Extra penalty at start of Week 7 (after the doctor bill)                                                             | about 18.9            | about 5        | Dial read 0.369 after the popups; the extra time-loss message itself was not seen             |

A full non-hungry dial is therefore about 26 one-step walks, about 18 two-step walks, or about 9 long walks. A hungry week has about 65% of that: about 17, 12 and 6.

### Travel-count table (walks until the week ended)

| Route (shuttle)                | Steps apart | Walks counted before the week ended                                                                                      | Weeks observed               | Start state                                  |
| ------------------------------ | ----------- | ------------------------------------------------------------------------------------------------------------------------ | ---------------------------- | -------------------------------------------- |
| Low-cost housing and Pawn shop | 1           | 10 (the 10th arrival at Low-cost ended the turn)                                                                         | Week 2 only                  | Partial week: dial about 58% full at walk 1  |
| Hi-Tech U and Socket City      | 1           | 14 (13 completed, the 14th ended the week), after one Low-cost to Hi-Tech walk                                           | Week 4                       | Hungry start (35% used)                      |
| Employment Office and Factory  | 1           | 4 (partial, week ended during the 4th), after 7 other walks and 3 job applications                                       | Week 3                       | Hungry start; mixed route, not a clean count |
| Low-cost housing and Z-Mart    | 2           | 9 (the 9th, Low-cost to Z-Mart, ended the week with no arrival screen), after 2 one-step walks and 1 RELAX               | Week 5                       | Hungry start                                 |
| Low-cost housing to Hi-Tech U  | far         | Not shuttled. One walk cost 11.6% of the dial, equal to about 3 one-step walks, so it does not seem to take the long way | Weeks 4 and 7 (single walks) | Hungry start                                 |

Checks: Week 4: 35% used at the start, one long walk (11.6%) and 14 one-step walks (14 x 3.9 = 55%) land on 102%, so the 14th walk is the one that ends the week. Week 5: 35% + 2 one-step walks (8%) + RELAX (11%) + 9 two-step walks (50%) = 104%, so the 9th ends it. So walk cost is roughly linear in steps at short range (1 step about 2 units, 2 steps about 3, 3 steps about 4 where one unit is about 1.9% of the week) and caps at about 6 units for long walks. A pure Low-cost and Pawn shuttle count from a clean start (predicted 16 to 17 when hungry, about 26 when not) was not done; the Week 2 count of 10 is a partial week. Closing a screen, entering a shop or reading a menu costs nothing. Arriving at a place that opens a screen costs only the walk. When the dial cannot cover a walk the walk still starts and ends the week with no arrival screen (tested Week 6: QT to Factory started with about 5% left and Jones's turn began within 3 seconds).

### Weekly price log

Week 1 columns are the earlier agent's numbers (they fit the later ratios exactly, so I treat them as good). Percentages compare with the previous column that has a value.

Monolith Burger:

| Item          | W1  | W3  | W6  | W7  | W8  | W1 to W3 | W3 to W6 | W6 to W7 | W7 to W8 |
| ------------- | --- | --- | --- | --- | --- | -------- | -------- | -------- | -------- |
| Hamburgers    | 82  | 98  | 90  | 100 | 68  | +19.5%   | -8.2%    | +11.1%   | -32.0%   |
| Cheeseburger  | 93  | 111 | 102 | 113 | 77  | +19.4%   | -8.1%    | +10.8%   | -31.9%   |
| Astro Chicken | 130 | 155 | 143 | 157 | 107 | +19.2%   | -7.7%    | +9.8%    | -31.8%   |
| Fries         | 68  | 81  | 74  | 83  | 56  | +19.1%   | -8.6%    | +12.2%   | -32.5%   |
| Shakes        | 107 | 128 | 118 | 130 | 88  | +19.6%   | -7.8%    | +10.2%   | -32.3%   |
| Colas         | 72  | 86  | 79  | 87  | 59  | +19.4%   | -8.1%    | +10.1%   | -32.2%   |

Two other Monolith lists exist: the earlier agent's "Week 2" list ($88, $99, $139, $72, $115, $77) and a list I saw during Jones's turn while the label still said Week 2 ($97, $110, $154, $81, $127, $85), which is within 1% of the Week 3 list. I could not reproduce the $88 list; I suspect it was read at another moment or mislabelled. Monolith was not read in Weeks 4 and 5.

QT Clothing:

| Item           | W1  | W3  | W6  | W7  | W8  | W1 to W3 | W3 to W6 | W6 to W7 | W7 to W8 |
| -------------- | --- | --- | --- | --- | --- | -------- | -------- | -------- | -------- |
| Business Suit  | 309 | 371 | 341 | 377 | 256 | +20.1%   | -8.1%    | +10.6%   | -32.1%   |
| Dress Clothes  | 131 | 157 | 144 | 160 | 108 | +19.8%   | -8.3%    | +11.1%   | -32.5%   |
| Casual Clothes | 76  | 91  | 84  | 92  | 63  | +19.7%   | -7.7%    | +9.5%    | -31.5%   |

Socket City:

| Item         | W1   | W3   | W4   | W7   | W8   | W1 to W3 | W3 to W4 | W4 to W7 | W7 to W8 |
| ------------ | ---- | ---- | ---- | ---- | ---- | -------- | -------- | -------- | -------- |
| Refrigerator | 919  | 1103 | 1051 | 1121 | 761  | +20.0%   | -4.7%    | +6.7%    | -32.1%   |
| Freezer      | 538  | 645  | 615  | 656  | 445  | +19.9%   | -4.7%    | +6.7%    | -32.2%   |
| Stove        | 598  | 718  | 684  | 729  | 495  | +20.1%   | -4.7%    | +6.6%    | -32.1%   |
| Color TV     | 551  | 661  | 630  | 672  | 456  | +20.0%   | -4.7%    | +6.7%    | -32.1%   |
| VCR          | 349  | 418  | 399  | 425  | 289  | +19.8%   | -4.5%    | +6.5%    | -32.0%   |
| Stereo       | 432  | 518  | 494  | 526  | 357  | +19.9%   | -4.6%    | +6.5%    | -32.1%   |
| Microwave    | 346  | 415  | 396  | 422  | 287  | +19.9%   | -4.6%    | +6.6%    | -32.0%   |
| Hot Tub      | 1317 | 1581 | 1506 | 1606 | 1091 | +20.0%   | -4.7%    | +6.6%    | -32.1%   |
| Computer     | 1678 | 2013 | 1918 | 2045 | 1390 | +20.0%   | -4.7%    | +6.6%    | -32.0%   |

Hi-Tech U enrollment fee: Week 3 $63, Week 4 $60 (-4.8%), Week 8 $43 (0.68 of Week 3, the same 0.68 as the other Week 8 shops; Week 7 not read).

Z-Mart (stock rotates, so only some items repeat):

| Week | Items and prices                                                                                                   |
| ---- | ------------------------------------------------------------------------------------------------------------------ |
| 2    | Stove $588, Stereo $540, Black and White TV $132, Microwave $264, Concert Tickets $48, Dog Food $21 (main session) |
| 3    | Refrigerator $819, Casual Clothes $44, Concert Tickets $50, Encyclopedia $598, Dictionary $88, 8-Track Player $94  |
| 5    | Stove $578, Black and White TV $129, Microwave $259, Baseball Tickets $52, Concert Tickets $47, 8-Track Player $88 |
| 8    | Refrigerator $565, Stove $426, Baseball Tickets $39, Theatre Tickets $26, Dog Food $15, Works of Capote $87        |

Repeated items: Concert Tickets $48 (W2), $50 (W3), $47 (W5); 8-Track Player $94 (W3) to $88 (W5), -6.4%; Stove, Black and White TV and Microwave W2 to W5 -1.7%, -2.3%, -1.9%; Stove W5 $578 to W8 $426 (-26%); Baseball Tickets W5 $52 to W8 $39 (-25%); Dog Food W2 $21 to W8 $15. Z-Mart's list also includes Casual Clothes ($44 in W3, QT $91 the same week, so about half price).

Is it uniform? Yes, within rounding. In each week-to-week step every item in every shop I could compare (Monolith, QT, Socket City, Hi-Tech U fee) moved by the same percentage, within about 0.5 points for items priced above $300 and within 1.5 points for cheap items (rounding of $70 to $160 prices). Z-Mart items moved about the same way (W2 to W5 about -2%).

Price index (Week 1 = 1.00), from the stores above:

| Week | Index      | Change vs previous | Source                                                                                                                                                                                                        |
| ---- | ---------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | 1.00       |                    | earlier agent                                                                                                                                                                                                 |
| 2    | about 1.15 | unknown            | Z-Mart concert tickets only (48 vs 50 in W3); the Monolith $88 reading conflicts, treat as unknown                                                                                                            |
| 3    | 1.20       | up                 | Socket City, QT, Monolith (all +19 to +20% vs W1)                                                                                                                                                             |
| 4    | 1.143      | -4.7%              | Socket City, Hi-Tech U                                                                                                                                                                                        |
| 5    | about 1.12 | about -1.7%        | Z-Mart items only (-6% vs W3)                                                                                                                                                                                 |
| 6    | about 1.10 | about -2%          | Monolith, QT (-8.1% vs W3)                                                                                                                                                                                    |
| 7    | 1.22       | +10.5%             | Monolith, QT directly (+10.5% vs W6); Socket City +1.6% vs W3                                                                                                                                                 |
| 8    | 0.83       | -32%               | Monolith (68/77/107/56/88/59 = 0.68 x W7 on all six items), QT (256/108/63 = 0.68 x W7), Z-Mart (Refrigerator $565, Stove $426, Baseball Tickets $39, Theatre Tickets $26, Dog Food $15, Works of Capote $87) |

Week 8 detail: Monolith Hamburgers $68, Cheeseburger $77, Astro Chicken $107, Fries $56, Shakes $88, Colas $59 (each 0.675 to 0.682 of Week 7). QT Business Suit $256, Dress Clothes $108, Casual Clothes $63. Socket City (all nine items 0.679 to 0.680 of Week 7) and the Hi-Tech U fee ($43) were read too, so Week 8 is confirmed uniform across five shops.

The index is not a steady drift toward a peak or trough: it rose 20% in two weeks, fell about 8% over the next three, jumped 10.5%, then fell 32% in a single week (to 17% below Week 1). It looks like a random weekly step, mostly a few percent either way with occasional large moves of 10 to 30%. Every move seen was uniform across all items and shops. Wages did not move with it (next section). The user's "peak or trough" model is neither proved nor refuted; eight weeks is too short, but the Week 7 to 8 swing is hard to explain as a gentle walk towards a peak. The change appears between the player's turns (Jones's turn already seemed to show next-week prices, not verified).

Other prices (Week 7 unless marked):

| Item                            | Price                                                                                        |
| ------------------------------- | -------------------------------------------------------------------------------------------- |
| Black's Market food             | Food For 1 Week $70, 2 Weeks $128, 4 Weeks $243                                              |
| Black's Market other            | 10 Lottery Tickets $10, Newspaper $1 (Daily News)                                            |
| Bank investments (Market Value) | T-Bills $100, Gold $226, Silver $12, Pork Bellies $10, Blue Chip Stocks $55, Penny Stocks $7 |
| Casual Clothes at Z-Mart (W3)   | $44 (QT charged $91 the same week)                                                           |

Cash was not high enough in Week 6 to buy Monolith Fries ($74 vs $70 held), but Black's Market's 1-week food ($70, Week 7) would likely have been affordable, so it is probably the intended way to avoid hunger.

### Newspaper

No newspaper appeared at any weekend or elsewhere in Weeks 2 to 7, so no headlines to transcribe. It is sold at Black's Market as "Newspaper ... $1" (Daily News picture). I could not buy it: my cash was $0 when I reached Black's Market in Week 7. Still open.

### Rent and housing

- Rent Office: "OFFICE CLOSED" sign (door picture) when visited in Week 2 (earlier agent), Week 5 (dial about 40% used) and Week 7 (about 55% used). It was OPEN in Week 8, the week the rent-due notice appeared. So it looks open only in the rent-due week (every 4 weeks: due Weeks 4 and 8, the Week 4 notice not seen); it is not related to the dial position.
- Rent reminder: at the start of Week 8, after the weekend report, a "RENT IS DUE" paper popup in the centre showing "$325". No such popup was seen in Weeks 5 to 7 (a Week 4 one may have been missed between the other popups).
- Rent Office menu in Week 8 (portrait of the landlord, speech bubble "Welcome to the Rental Office. Come in and meet your slumlo...I mean, your landlord!"):

| Option                  | Price | Notes                                         |
| ----------------------- | ----- | --------------------------------------------- |
| Pay Rent for 1 month    | $325  | Not tried (cash $102 was too low)             |
| Ask For More Time       | none  | Bubble: "Sorry, your rent must be paid now."  |
| Rent Low-Cost Apartment | $282  | Cheaper than the $325 I owe; not tried        |
| Rent Security Apartment | $413  | Le Security; not tried                        |
| Pay Garnishment Balance | $245  | Arrears left after wage garnishing; not tried |

- The Week 8 index was about 0.83 of Week 1, so prices like $282 and $325 are at that index too; I could not tell how the $325 relates to $282 (current lease price versus listed price, or arrears or fees included). Deposit and moving cost: not seen.
- Le Security: entrance with an "APARTMENT FOR RENT" sign; clicking the door does nothing; no list or price. Low-cost housing screen: "HOME SWEET HOME", RELAX and DONE buttons.
- Rent was not taken at any weekend in Weeks 2 to 8 (cash reconciles). Instead every WORK paycheck in Week 6 (5 of 5) showed "Your Landlord garnished $18." So unpaid rent is taken from wages, a fixed $18 per paycheck. The balance shown in Week 8 is $245.
- Cash of $102 appeared in Week 8 (it was $0 on the weekend report). I do not know the source; I may have missed a popup between the weekend report and the rent notice.

### Jobs

- Flow: Employment Office opens a screen with a speech bubble ("Welcome to ACNE Employment. We'll either find you a job, or we won't."), then an Employers list. Click an employer to see its job list with wages; click a job to apply; DONE goes back one level. Result bubbles: "Congratulations. You got the job." or "Sorry. You didn't get the job for the following reasons:" followed by "Not enough Education", "Not enough Experience", or (seen on Jones) "No openings."
- Starter job: Monolith Cook $4/hr, hired on the first try in Week 3 with no experience. Factory Janitor ($8) was refused with "Not enough Experience". Factory General Manager was refused with "Not enough Education / Not enough Experience".
- WORK: a click costs about 10% of the dial. In Week 6 each WORK paid $32 gross (consistent with 8 hours x $4), then "Your Landlord garnished $18.", net $14. Five WORK clicks fitted into a hungry week after the walk to Monolith. The first WORK of Week 6 also showed "Your work habits better pick up soon or you're fired!"; cause unknown. A WORK click did not end the week, which corrects the earlier note. Cash updates on the calculator only after the bubbles are dismissed.
- Clothes: when my clothes wore out (a "YOU NEED NEW CLOTHES" notice at the start of Week 6; torn clothes in the portrait in Week 7) a WORK click gave "You are not properly dressed for work!" and nothing was paid. In Week 8 I bought Casual Clothes at QT ($63): one click on the item buys it at once (no confirm), cash $102 to $39, the shopkeeper said "Now what are you going to do about your HAIR?" and the portrait went back to normal clothes. Clothes seem to last about 5 weeks (notice at the start of Week 6; clothes were fine in Weeks 1 to 5).
- Losing the job: in Week 8 the Monolith screen had no WORK button any more, so I seem to have been fired (after the Week 6 warning and the refused Week 7 WORK); I did not see a firing message.
- Wage lists (Week 3; identical in Week 7 except Factory General Manager $31 became $32):

| Employer              | Jobs and wage per hour                                                                                                                                                                 |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Monolith Burgers      | Cook $4, Clerk $6, Assistant Manager $7, Manager $8                                                                                                                                    |
| Z-Mart Discount       | Clerk $4, Assistant Manager $7, Manager $8                                                                                                                                             |
| QT Clothing           | Salesperson $8, Assistant Manager $10, Manager $14                                                                                                                                     |
| Socket City Appliance | Salesperson $6, Electronic's Repair $13, Manager $16                                                                                                                                   |
| Hi-Tech University    | Janitor $4, Teacher $13, Professor $25                                                                                                                                                 |
| Factory               | Janitor $8, Assembly Worker $9, Secretary $10, Machinist's Helper $12, Executive Secretary $22, Machinist $23, Department Manager $27, Engineer $28, General Manager $31 (Week 7: $32) |
| Bank                  | Janitor $7, Teller $12, Assistant Manager $16, Manager $23, Investment Broker $27                                                                                                      |
| Black's Market        | Janitor $6, Checker $9, Butcher $14, Assistant Manager $18, Manager $22                                                                                                                |
| Rent Office           | Groundskeeper $7, Apartment Manager $9                                                                                                                                                 |

- Wages did not follow prices: prices were +20% (W3) and +22% (W7) over Week 1 and -8% to -5% in between, yet the displayed wage lists are the same in Weeks 3 and 7. Pay per WORK ($32 = 8 x $4) also looks unscaled. Wages are shown as whole dollars, so a change under 12% on a $4 wage would be invisible; the $32 paycheck at a time the index was about 1.10 says no change.
- Applying for a job costs 6 to 8% of the dial each time, even when refused.
- Jones: he held about $493 in Week 2 (working at Monolith), $509 after a $64 weekend at the start of his Week 3 turn, $556 and $504 during later turns, and $423 after a $39 weekend (Week 7). He was seen at the Employment Office in Weeks 3, 5 and 7, once getting "No openings" and once "Congratulations. You got the job."

### Education (Hi-Tech U)

- Screen: portrait, two book stacks "Trade School" and "Jr. College", buttons ENROLL and DONE.
- ENROLL opens a bubble "The enrollment fee is $63. Would you like to enroll?" (Week 3), $60 in Week 4, $43 in Week 8, with Yes and No. No gives "Perhaps at another time." The fee follows the price index (-4.8% W3 to W4, 0.68 in W8). I did not click a course first, so I do not know which course the fee belongs to.
- I could not afford to enroll (cash $76 in Week 3, $38 in Week 4, $0 later, $39 against a $43 fee in Week 8), so hours per course, sessions, how many to finish, and what enrolling changes are all still unknown.
- The Employment Office refused jobs for "Not enough Education"; Hi-Tech U itself employs a Janitor ($4), Teacher ($13) and Professor ($25).

### Other observations

- Bank (PIGGY Bank): menu Deposit $100, Withdraw $100, Loan Payment, Apply For Loan, See The Broker. With $0 and a Cook job: "I'm terribly sorry, but you need more money or a better job in order to get a loan" and "You do not have any savings."
- Pawn shop: PAWN, REDEEM, BUY. BUY said "No Pawned Items For Sale." PAWN was not tried.
- Hunger: no food was bought in Weeks 2 to 8, and the "LESS TIME! DUE TO HUNGER" popup showed at the start of Weeks 3 to 8 (35% of the dial each time). I do not know whether Week 2 or earlier also had it. After five hungry weeks a doctor bill took my last $27 and Week 7 had an extra time loss (about 19% of the dial, inferred); Week 8 had only the hunger loss. Black's Market sells food in 1, 2 and 4 week packs; I never bought any (and did not test whether Monolith items clear hunger).
- I fell into a poverty trap: $0 cash, worn-out clothes (so no work), loan refused, rent unpaid and garnished. A real player avoids it by buying food and clothes with the starting $200. The balance pass should note that the game is hard to recover from after about 5 weeks of hunger; the weekend takes up to all of your cash ("You spent $X" is capped at what you hold).
- Win condition and Jones's goal progress: not reached.
- Not reached: paying rent (and the effect of paying or not paying), deposit and moving cost, newspaper headlines, course details and what enrolling changes, the Pawn PAWN list, whether eating clears hunger, and the 4-week and 2-week Black's Market food effects.
