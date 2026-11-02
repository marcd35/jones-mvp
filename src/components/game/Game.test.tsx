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

  it('plays a work shift: travel, enter, work, see the toast', async () => {
    render(<Home />);
    await userEvent.click(tileButton('Monolith Burger'));
    expect(screen.getByText('11.1 hours left')).toBeInTheDocument();

    await userEvent.click(tileButton('Monolith Burger'));
    const dialog = screen.getByRole('dialog', { name: 'Monolith Burger' });
    expect(dialog).toHaveTextContent('Requires Education Lvl 1');

    await userEvent.click(screen.getByRole('button', { name: 'Work 4hrs' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByText(`$${STARTING_MONEY + 6 * 4}`)).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(/Worked 4 hrs/);
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
