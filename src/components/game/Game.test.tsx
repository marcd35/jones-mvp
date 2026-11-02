import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import Home from '@/app/page';
import { useGameStore } from '@/store/useGameStore';
import { STARTING_MONEY, WIN_MONEY } from '@/lib/constants';

beforeEach(() => {
  useGameStore.setState(useGameStore.getInitialState(), true);
});

// Each location tile is a card with a heading and one action button.
const tileButton = (name: string) => {
  const tile = screen.getByRole('heading', { name }).closest('div.relative');
  return tile!.querySelector('button')!;
};

describe('game page', () => {
  it('shows the starting stats and four locations', () => {
    render(<Home />);
    expect(screen.getByText(`$${STARTING_MONEY}`)).toBeInTheDocument();
    expect(screen.getByText('12 hrs')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /Travel Here/ })).toHaveLength(
      3,
    );
    expect(screen.getByRole('button', { name: 'Enter' })).toBeInTheDocument();
  });

  it('plays a work shift: travel, enter, work, see the toast', async () => {
    render(<Home />);
    await userEvent.click(tileButton('Monolith Burgers'));
    expect(screen.getByText('11 hrs')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Enter' }));
    const dialog = screen.getByRole('dialog', { name: 'Monolith Burgers' });
    expect(dialog).toHaveTextContent('Requires Education Lvl 1');

    await userEvent.click(screen.getByRole('button', { name: 'Work 4hrs' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByText(`$${STARTING_MONEY + 6 * 4}`)).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(/Worked 4 hrs/);
  });

  it('disables the meal button once the weekly meal is eaten', async () => {
    render(<Home />);
    await userEvent.click(tileButton('Z-Mart'));
    await userEvent.click(screen.getByRole('button', { name: 'Enter' }));
    await userEvent.click(screen.getByRole('button', { name: /Buy Meal/ }));

    await userEvent.click(screen.getByRole('button', { name: 'Enter' }));
    expect(
      screen.getByRole('button', { name: 'Already ate this week' }),
    ).toBeDisabled();
  });

  it('shows the victory screen and resets from it', async () => {
    render(<Home />);
    act(() => useGameStore.setState({ gameStatus: 'won', money: WIN_MONEY }));
    expect(screen.getByText('VICTORY!')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Play Again' }));
    expect(screen.queryByText('VICTORY!')).toBeNull();
    expect(useGameStore.getState().money).toBe(STARTING_MONEY);
  });

  it('shows game over when the rent cannot be paid', async () => {
    render(<Home />);
    act(() =>
      useGameStore.setState({ currentWeek: 4, money: 0, hasEaten: true }),
    );
    await userEvent.click(screen.getByRole('button', { name: 'END WEEK' }));
    expect(screen.getByText('GAME OVER')).toBeInTheDocument();
  });

  it('loads a saved game after mount rather than during first render', async () => {
    localStorage.setItem(
      'jones-mvp-storage',
      JSON.stringify({ state: { money: 321, currentWeek: 3 }, version: 1 }),
    );
    render(<Home />);
    expect(await screen.findByText('$321')).toBeInTheDocument();
  });
});
