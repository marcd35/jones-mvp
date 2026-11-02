import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import Home from '@/app/page';
import { useGameStore } from '@/store/useGameStore';
import { defaultPack } from '@/data';
import { newspaperHeadline, nextPriceLevel } from '@/lib/inflation';

const STARTING_MONEY = defaultPack.startingMoney;

// A fresh game opens on the setup screen; most tests play from the first Turn.
const setup = () => useGameStore.setState(useGameStore.getInitialState(), true);
beforeEach(() => {
  setup();
  useGameStore.getState().startGame();
});

// Each Location is a cell on the ring with one button.
const tileButton = (name: string) =>
  within(
    screen.getByText(name).closest('[data-cell]') as HTMLElement,
  ).getByRole('button');
const player = () => useGameStore.getState().players[0];

describe('game page', () => {
  it('shows the starting stats and the Board of 13 Locations', () => {
    const { container } = render(<Home />);
    expect(screen.getByText(`$${STARTING_MONEY}`)).toBeInTheDocument();
    expect(screen.getByText('12 hours left')).toBeInTheDocument();
    expect(container.querySelectorAll('[data-cell="location"]')).toHaveLength(
      13,
    );
  });

  it('plays a work shift: walk, get hired, walk to work, work, see money', async () => {
    render(<Home />);
    await userEvent.click(tileButton('Employment Office'));
    await userEvent.click(tileButton('Employment Office'));
    const office = screen.getByRole('dialog', { name: 'Employment Office' });
    expect(office).toHaveTextContent('Requires Education Lvl 1'); // locked rung
    await userEvent.click(
      within(office).getByRole('button', { name: 'Take the Cook job' }),
    );
    expect(player().jobId).toBe('cook');
    expect(office).toHaveTextContent('Your job');
    await userEvent.click(
      within(office).getByRole('button', { name: 'Leave' }),
    );

    await userEvent.click(tileButton('Monolith Burger'));
    await userEvent.click(tileButton('Monolith Burger'));
    const dialog = screen.getByRole('dialog', { name: 'Monolith Burger' });
    expect(dialog).toHaveTextContent(`$${STARTING_MONEY}`);

    const timeBefore = player().timeRemaining;
    await userEvent.click(
      within(dialog).getByRole('button', {
        name: /^Work: \+\$32 for 1\.2 hrs/,
      }),
    );
    expect(player().timeRemaining).toBeCloseTo(timeBefore - 1.2, 5);
    // The screen stays open and shows the new cash.
    expect(dialog).toHaveTextContent(`$${STARTING_MONEY + 32}`);
    expect(screen.getByRole('status')).toHaveTextContent(/Earned \$32/);
  });

  it('tells the Player when Work is not their job or they cannot afford the Time', async () => {
    render(<Home />);
    await userEvent.click(tileButton('Monolith Burger'));
    await userEvent.click(tileButton('Monolith Burger'));
    const dialog = screen.getByRole('dialog', { name: 'Monolith Burger' });
    expect(within(dialog).queryByRole('button', { name: /Work/ })).toBeNull();
    expect(dialog).toHaveTextContent(/Get hired at an employment office/);

    act(() =>
      useGameStore.setState((st) => ({
        players: [{ ...st.players[0], jobId: 'cook', timeRemaining: 1 }],
      })),
    );
    expect(within(dialog).getByRole('button', { name: /Work/ })).toBeDisabled();
  });

  it('shows the weekend report when the Week ends, then starts the next Turn at home', async () => {
    render(<Home />);
    act(() =>
      useGameStore.setState((st) => ({
        players: [
          { ...st.players[0], jobId: 'cook', locationId: 'monolith-burger' },
        ],
      })),
    );
    await userEvent.click(screen.getByRole('button', { name: 'END WEEK' }));

    const report = screen.getByRole('dialog', { name: /weekend report/i });
    expect(report).toHaveTextContent('You ended the Week.');
    const labels = within(report)
      .getAllByRole('listitem')
      .map((li) => li.firstElementChild?.textContent);
    expect(labels).toEqual([
      'Food',
      'Clothing wear',
      'Rent due',
      'Inflation step',
      'Newspaper',
    ]);

    await userEvent.click(
      within(report).getByRole('button', { name: 'Start Week 2' }),
    );
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(player().locationId).toBe('low-cost-housing');
    expect(screen.getByText('8 hours left')).toBeInTheDocument(); // hungry
  });

  it('ends the Week by itself when Work uses the last of the Time, closing the Monolith screen', async () => {
    render(<Home />);
    act(() =>
      useGameStore.setState((st) => ({
        players: [
          {
            ...st.players[0],
            jobId: 'cook',
            locationId: 'monolith-burger',
            timeRemaining: 1.2,
          },
        ],
      })),
    );
    await userEvent.click(tileButton('Monolith Burger'));
    await userEvent.click(screen.getByRole('button', { name: /^Work/ }));

    expect(
      screen.queryByRole('dialog', { name: 'Monolith Burger' }),
    ).toBeNull();
    const report = screen.getByRole('dialog', { name: /weekend report/i });
    expect(report).toHaveTextContent('You ran out of Time.');
    expect(report).toHaveTextContent(`$${STARTING_MONEY + 32}`);

    await userEvent.click(
      within(report).getByRole('button', { name: 'Start Week 2' }),
    );
    // Back at home: the Monolith screen does not reopen by itself.
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('shows game over when the rent cannot be paid', async () => {
    render(<Home />);
    act(() =>
      useGameStore.setState((st) => ({
        currentWeek: 4,
        players: [{ ...st.players[0], money: 0, foodWeeks: 1 }],
      })),
    );
    await userEvent.click(screen.getByRole('button', { name: 'END WEEK' }));
    expect(screen.getByText('GAME OVER')).toBeInTheDocument();
  });

  it('shows the lose screen when the owed rent reaches the limit, with no actions behind it', async () => {
    render(<Home />);
    act(() =>
      useGameStore.setState((st) => ({
        currentWeek: 3,
        players: [{ ...st.players[0], owedRent: defaultPack.rentOwedLimit }],
      })),
    );
    await userEvent.click(screen.getByRole('button', { name: 'END WEEK' }));

    const over = screen.getByRole('dialog');
    expect(over).toHaveTextContent('GAME OVER');
    expect(over).toHaveTextContent('Weeks played3');
    expect(over).toHaveTextContent(`Rent owed$${defaultPack.rentOwedLimit}`);
    expect(screen.getByRole('button', { name: 'END WEEK' })).toBeDisabled();

    await userEvent.click(
      within(over).getByRole('button', { name: 'New game' }),
    );
    expect(
      screen.getByRole('heading', { name: 'Set your Goals' }),
    ).toBeVisible();
  });

  it('loads a saved game after mount rather than during first render', async () => {
    localStorage.setItem(
      'jones-mvp-storage',
      JSON.stringify({ state: { money: 321, currentWeek: 3 }, version: 1 }),
    );
    // A version 1 save has the Player's stats at the top level.
    render(<Home />);
    expect(await screen.findByText('$321')).toBeInTheDocument();
  });
});

describe('Goals setup screen (AC-005)', () => {
  beforeEach(setup);

  const slider = (name: string) =>
    screen.getByRole('slider', { name }) as HTMLInputElement;
  const pointsLeft = () => screen.getByTestId('points-left');
  const set = (name: string, value: number) =>
    fireEvent.change(slider(name), { target: { value: String(value) } });

  it('opens on the setup screen, not the Board', () => {
    const { container } = render(<Home />);
    expect(
      screen.getByRole('heading', { name: 'Set your Goals' }),
    ).toBeInTheDocument();
    expect(container.querySelector('[data-cell]')).toBeNull();
    expect(screen.queryByRole('button', { name: 'END WEEK' })).toBeNull();
  });

  it('shows four Goal sliders over the data budget, each with its target', () => {
    render(<Home />);
    expect(screen.getAllByRole('slider')).toHaveLength(4);
    expect(pointsLeft()).toHaveTextContent('150 left of 200');
    expect(screen.getByTestId('goal-wealth-target')).toHaveTextContent(
      'Target: $2,000',
    );
  });

  // Until T-10 to T-12 measure the other Goals, only wealth starts with
  // points so the default setup can be won.
  it('starts with 50 points on Wealth and none on the unmeasured Goals', () => {
    render(<Home />);
    expect(slider('Wealth').value).toBe('50');
    expect(screen.getByTestId('goal-wealth-points')).toHaveTextContent(
      '50 points',
    );
    for (const label of ['Happiness', 'Education', 'Career']) {
      expect(slider(label).value).toBe('0');
    }
    for (const goal of ['happiness', 'education', 'career']) {
      expect(screen.getByTestId(`goal-${goal}-target`)).toHaveTextContent(
        'No target',
      );
    }
    expect(screen.getByRole('button', { name: 'Start game' })).toBeEnabled();
  });

  it('moves the target with the points, from the data table', () => {
    render(<Home />);
    set('Wealth', 100);
    expect(screen.getByTestId('goal-wealth-target')).toHaveTextContent(
      'Target: $4,000',
    );
    expect(screen.getByTestId('goal-education-target')).toHaveTextContent(
      'No target',
    );
    expect(pointsLeft()).toHaveTextContent('100 left of 200');
  });

  it('never lets the sliders add up to more than the budget', () => {
    render(<Home />);
    // Wealth holds 50 points, so Career can take at most the other 150.
    set('Career', 200);
    expect(slider('Career').value).toBe('150');
    expect(pointsLeft()).toHaveTextContent('0 left of 200');
    set('Wealth', 100);
    expect(slider('Wealth').value).toBe('50');
  });

  it('warns about a Goal that nothing measures yet', () => {
    render(<Home />);
    // The default puts no points on the unmeasured Goals, so no warning.
    expect(screen.queryByText(/Nothing measures this Goal yet/)).toBeNull();
    set('Wealth', 100);
    set('Happiness', 50);
    set('Career', 50);
    expect(screen.getAllByText(/Nothing measures this Goal yet/)).toHaveLength(
      2,
    );
    set('Happiness', 0);
    expect(screen.getAllByText(/Nothing measures this Goal yet/)).toHaveLength(
      1,
    );
  });

  it('will not start without a point on any Goal', () => {
    render(<Home />);
    for (const label of ['Wealth', 'Happiness', 'Education', 'Career']) {
      set(label, 0);
    }
    expect(screen.getByRole('button', { name: 'Start game' })).toBeDisabled();
  });

  it('starts at Low-cost housing with the starting cash, then wins at the wealth Goal', async () => {
    render(<Home />);
    set('Happiness', 0);
    set('Education', 0);
    set('Career', 0);
    set('Wealth', 10); // a target of $400 with the placeholder table
    await userEvent.click(screen.getByRole('button', { name: 'Start game' }));

    expect(
      screen.queryByRole('heading', { name: 'Set your Goals' }),
    ).toBeNull();
    expect(screen.getByText(`$${STARTING_MONEY}`)).toBeInTheDocument();
    expect(player().locationId).toBe('low-cost-housing');
    expect(screen.getByText('12 hours left')).toBeInTheDocument();

    // Earn to the Goal: hire, walk to work, work until it is met.
    await userEvent.click(tileButton('Employment Office'));
    await userEvent.click(tileButton('Employment Office'));
    await userEvent.click(
      within(
        screen.getByRole('dialog', { name: 'Employment Office' }),
      ).getByRole('button', { name: 'Take the Cook job' }),
    );
    await userEvent.click(screen.getByRole('button', { name: 'Leave' }));
    await userEvent.click(tileButton('Monolith Burger'));
    await userEvent.click(tileButton('Monolith Burger'));
    const work = () =>
      within(screen.getByRole('dialog', { name: 'Monolith Burger' })).getByRole(
        'button',
        { name: /^Work/ },
      );
    for (let i = 0; i < 7; i++) await userEvent.click(work());

    const over = screen.getByRole('dialog');
    expect(over).toHaveTextContent('VICTORY!');
    expect(over).toHaveTextContent('Weeks played1');
    expect(over).toHaveTextContent(`Cash$${STARTING_MONEY + 7 * 32}`);
    expect(over).toHaveTextContent('Wealth');
    expect(over).toHaveTextContent('(met)');
    expect(player().money).toBeGreaterThanOrEqual(400);
  });

  it('goes back to the setup screen from the victory screen with New game', async () => {
    render(<Home />);
    act(() =>
      useGameStore.setState((st) => ({
        gameStatus: 'won',
        players: [{ ...st.players[0], money: 999 }],
      })),
    );
    expect(screen.getByText('VICTORY!')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'New game' }));
    expect(screen.queryByText('VICTORY!')).toBeNull();
    expect(
      screen.getByRole('heading', { name: 'Set your Goals' }),
    ).toBeVisible();
    expect(player().money).toBe(STARTING_MONEY);
  });

  it('offers NEW GAME during play', async () => {
    useGameStore.getState().startGame();
    render(<Home />);
    await userEvent.click(screen.getByRole('button', { name: 'NEW GAME' }));
    expect(
      screen.getByRole('heading', { name: 'Set your Goals' }),
    ).toBeVisible();
  });
});

describe('inflation on screen (AC-004, AC-010)', () => {
  // A seed whose first step (Week 1 to Week 2) is, or is not, a notable move.
  const seedWhere = (notable: boolean) => {
    for (let seed = 1; seed < 500; seed++) {
      const next = nextPriceLevel(defaultPack.inflation, seed, 2, 1);
      const headline = newspaperHeadline(defaultPack.inflation, 1, next);
      if ((headline !== null) === notable) return seed;
    }
    throw new Error('no seed found');
  };
  const endWeek = async (seed: number) => {
    act(() => useGameStore.setState({ priceSeed: seed }));
    await userEvent.click(screen.getByRole('button', { name: 'END WEEK' }));
    return screen.getByRole('dialog', { name: /weekend report/i });
  };
  const lineOf = (report: HTMLElement, label: string) =>
    within(report)
      .getAllByRole('listitem')
      .find((li) => li.firstElementChild?.textContent === label)!;

  it('fills the inflation step line of the weekend report with the level move', async () => {
    render(<Home />);
    const report = await endWeek(seedWhere(false));
    const level = useGameStore.getState().priceLevel;
    expect(lineOf(report, 'Inflation step')).toHaveTextContent(
      `Price level moves from 1.00 to ${level.toFixed(2)}.`,
    );
    expect(lineOf(report, 'Newspaper')).toHaveTextContent('No change');
  });

  it('prints the headline in the Newspaper line of the report, and again at home', async () => {
    render(<Home />);
    const report = await endWeek(seedWhere(true));
    const headline = useGameStore.getState().newspaper!;
    expect(headline).toBeTruthy();
    expect(lineOf(report, 'Newspaper')).toHaveTextContent(headline);

    await userEvent.click(
      within(report).getByRole('button', { name: 'Start Week 2' }),
    );
    await userEvent.click(tileButton('Low-cost housing')); // already home
    const home = screen.getByRole('dialog', { name: 'Low-cost housing' });
    expect(
      within(within(home).getByLabelText('Newspaper')).getByText(headline),
    ).toBeInTheDocument();
  });

  it('says nothing notable at home when the level moved little', async () => {
    render(<Home />);
    const report = await endWeek(seedWhere(false));
    await userEvent.click(
      within(report).getByRole('button', { name: 'Start Week 2' }),
    );
    await userEvent.click(tileButton('Low-cost housing')); // already home
    expect(screen.getByLabelText('Newspaper')).toHaveTextContent(
      'Nothing notable in the news this Week.',
    );
  });

  it('shows shop prices at the hidden level, and never the level on the Board', async () => {
    act(() => useGameStore.setState({ priceLevel: 1.2 }));
    const { container } = render(<Home />);
    expect(container).not.toHaveTextContent('1.2');
    expect(container).not.toHaveTextContent(/price level|inflation/i);
    await userEvent.click(tileButton('Monolith Burger'));
    await userEvent.click(tileButton('Monolith Burger'));
    // Fries: 68 x 1.20 = 81.60, which rounds to $82.
    expect(
      screen.getByRole('button', { name: /Buy Fries.*\(\$82 \/ 1hr\)/ }),
    ).toBeEnabled();
  });
});

describe('food on screen (AC-007)', () => {
  const openHere = async (name: string) => {
    await userEvent.click(tileButton(name));
    await userEvent.click(tileButton(name));
    return screen.getByRole('dialog', { name });
  };
  const status = () => screen.getByText('Status').parentElement!;

  it('says the Player needs food until the Week is covered, then that they are fed', async () => {
    render(<Home />);
    expect(status()).toHaveTextContent('Needs food');
    expect(status()).not.toHaveTextContent('Hungry');

    const dialog = await openHere('Monolith Burger');
    expect(dialog).toHaveTextContent('None: this Week needs food');
    await userEvent.click(
      within(dialog).getByRole('button', { name: /Buy Fries/ }),
    );
    expect(player().foodWeeks).toBe(1);
    expect(status()).toHaveTextContent('Fed');
    expect(status()).toHaveTextContent('1 Week of food');
    expect(dialog).toHaveTextContent('Food in hand1 Week');
  });

  it("sells Black's Market food by the Week, 1, 2 and 4, at the level's prices", async () => {
    act(() => useGameStore.setState({ priceLevel: 1.22 }));
    render(<Home />);
    act(() =>
      useGameStore.setState((st) => ({
        players: [
          { ...st.players[0], locationId: 'blacks-market', money: 1000 },
        ],
      })),
    );
    await userEvent.click(tileButton("Black's Market"));
    const dialog = screen.getByRole('dialog', { name: "Black's Market" });
    const buy = (name: RegExp) => within(dialog).getByRole('button', { name });
    expect(buy(/Food for 1 Week \(\$70/)).toBeEnabled();
    expect(buy(/Food for 2 Weeks \(\$128/)).toBeEnabled();
    expect(buy(/Food for 4 Weeks \(\$243/)).toBeEnabled();

    await userEvent.click(buy(/Food for 4 Weeks/));
    expect(player().foodWeeks).toBe(4);
    expect(player().money).toBe(1000 - 243);
    expect(dialog).toHaveTextContent('Food in hand4 Weeks');
    expect(status()).toHaveTextContent('4 Weeks of food');
  });

  it('disables a purchase the Player cannot pay for', async () => {
    act(() =>
      useGameStore.setState((st) => ({
        players: [{ ...st.players[0], money: 10 }],
      })),
    );
    render(<Home />);
    const dialog = await openHere('Monolith Burger');
    expect(
      within(dialog).getByRole('button', { name: /Buy Fries/ }),
    ).toBeDisabled();
  });

  it('fills the food line of the weekend report both ways', async () => {
    render(<Home />);
    await userEvent.click(screen.getByRole('button', { name: 'END WEEK' }));
    let report = screen.getByRole('dialog', { name: /weekend report/i });
    const line = (label: string) =>
      within(report)
        .getAllByRole('listitem')
        .find((li) => li.firstElementChild?.textContent === label)!;
    expect(line('Food')).toHaveTextContent(
      'No food this Week. You lose 4 hours next Week.',
    );
    await userEvent.click(
      within(report).getByRole('button', { name: 'Start Week 2' }),
    );
    expect(screen.getByText('8 hours left')).toBeInTheDocument();

    act(() =>
      useGameStore.setState((st) => ({
        players: [{ ...st.players[0], foodWeeks: 2 }],
      })),
    );
    await userEvent.click(screen.getByRole('button', { name: 'END WEEK' }));
    report = screen.getByRole('dialog', { name: /weekend report/i });
    expect(line('Food')).toHaveTextContent(
      'Fed. Food in hand for 1 more Week.',
    );
  });
});

describe('clothing on screen (AC-008)', () => {
  const openHere = async (name: string) => {
    await userEvent.click(tileButton(name));
    await userEvent.click(tileButton(name));
    return screen.getByRole('dialog', { name });
  };
  const wear = (weeksWorn: number, tierId = 'casual') =>
    act(() =>
      useGameStore.setState((st) => ({
        players: [{ ...st.players[0], clothes: { tierId, weeksWorn } }],
      })),
    );

  it('sells the tiers at QT Clothing at the level prices, and a purchase renews the clothes', async () => {
    act(() =>
      useGameStore.setState((st) => ({
        priceLevel: 1.2,
        players: [{ ...st.players[0], money: 1000 }],
      })),
    );
    render(<Home />);
    wear(6);
    const hud = screen.getByText('Clothes').parentElement!;
    expect(hud).toHaveTextContent('Worn out');

    const dialog = await openHere('QT Clothing');
    expect(dialog).toHaveTextContent('Casual Clothes (worn out)');
    // 76, 131 and 309 at 1.20.
    for (const label of [
      /Buy Casual Clothes \(\$91\)/,
      /Buy Dress Clothes \(\$157\)/,
      /Buy Business Suit \(\$371\)/,
    ]) {
      expect(within(dialog).getByRole('button', { name: label })).toBeEnabled();
    }
    await userEvent.click(
      within(dialog).getByRole('button', { name: /Buy Dress Clothes/ }),
    );
    expect(player().clothes).toEqual({ tierId: 'dress', weeksWorn: 0 });
    expect(player().money).toBe(1000 - 157);
    expect(hud).toHaveTextContent('Dress Clothes');
  });

  it('warns on the HUD and at QT Clothing before the clothes wear out', async () => {
    render(<Home />);
    wear(5);
    expect(screen.getByText('Clothes').parentElement).toHaveTextContent(
      'Wear out in 1 Week',
    );
    const dialog = await openHere('QT Clothing');
    expect(dialog).toHaveTextContent('Casual Clothes (wears out in 1 Week)');
  });

  it('tells a Player in worn clothes why they cannot work or take the job', async () => {
    render(<Home />);
    wear(6);
    act(() =>
      useGameStore.setState((st) => ({
        players: [
          { ...st.players[0], jobId: 'cook', locationId: 'monolith-burger' },
        ],
      })),
    );
    await userEvent.click(tileButton('Monolith Burger')); // already there
    const burger = screen.getByRole('dialog', { name: 'Monolith Burger' });
    expect(burger).toHaveTextContent('Your clothes are worn out.');
    expect(within(burger).queryByRole('button', { name: /^Work/ })).toBeNull();
    await userEvent.click(
      within(burger).getByRole('button', { name: 'Leave' }),
    );

    act(() =>
      useGameStore.setState((st) => ({
        players: [{ ...st.players[0], jobId: null }],
      })),
    );
    await userEvent.click(tileButton('Employment Office'));
    await userEvent.click(tileButton('Employment Office'));
    const office = screen.getByRole('dialog', { name: 'Employment Office' });
    expect(office).toHaveTextContent('Dress: Casual Clothes or better');
    expect(office).toHaveTextContent('Your clothes are worn out.');
    expect(
      within(office).queryByRole('button', { name: 'Take the Cook job' }),
    ).toBeNull();
  });

  it('fills the clothing wear line of the weekend report', async () => {
    render(<Home />);
    wear(4);
    await userEvent.click(screen.getByRole('button', { name: 'END WEEK' }));
    let report = screen.getByRole('dialog', { name: /weekend report/i });
    const line = () =>
      within(report)
        .getAllByRole('listitem')
        .find((li) => li.firstElementChild?.textContent === 'Clothing wear')!;
    expect(line()).toHaveTextContent(
      'Your Casual Clothes will wear out in 1 Week.',
    );
    await userEvent.click(
      within(report).getByRole('button', { name: 'Start Week 2' }),
    );
    await userEvent.click(screen.getByRole('button', { name: 'END WEEK' }));
    report = screen.getByRole('dialog', { name: /weekend report/i });
    expect(line()).toHaveTextContent('Your Casual Clothes are worn out.');
  });
});
