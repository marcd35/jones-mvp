import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import Home from '@/app/page';
import { useGameStore } from '@/store/useGameStore';
import { STARTING_MONEY, WIN_MONEY } from '@/lib/constants';

beforeEach(() => {
  useGameStore.setState(useGameStore.getInitialState(), true);
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

  it('disables the meal button once the weekly meal is eaten', async () => {
    render(<Home />);
    await userEvent.click(tileButton('Z-Mart'));
    await userEvent.click(tileButton('Z-Mart'));
    await userEvent.click(screen.getByRole('button', { name: /Buy Meal/ }));

    await userEvent.click(tileButton('Z-Mart'));
    expect(
      screen.getByRole('button', { name: 'Already ate this week' }),
    ).toBeDisabled();
  });

  it('shows the victory screen and resets from it', async () => {
    render(<Home />);
    act(() =>
      useGameStore.setState((st) => ({
        gameStatus: 'won',
        players: [{ ...st.players[0], money: WIN_MONEY }],
      })),
    );
    expect(screen.getByText('VICTORY!')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Play Again' }));
    expect(screen.queryByText('VICTORY!')).toBeNull();
    expect(player().money).toBe(STARTING_MONEY);
  });

  it('shows game over when the rent cannot be paid', async () => {
    render(<Home />);
    act(() =>
      useGameStore.setState((st) => ({
        currentWeek: 4,
        players: [{ ...st.players[0], money: 0, hasEaten: true }],
      })),
    );
    await userEvent.click(screen.getByRole('button', { name: 'END WEEK' }));
    expect(screen.getByText('GAME OVER')).toBeInTheDocument();
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
