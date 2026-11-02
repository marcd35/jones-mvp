import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { Board } from './Board';
import { defaultPack } from '@/data';
import { useGameStore } from '@/store/useGameStore';
import type { DataPack } from '@/types';

beforeEach(() => {
  useGameStore.setState(useGameStore.getInitialState(), true);
});

const cellFor = (name: string) =>
  screen.getByText(name).closest('[data-cell]') as HTMLElement;
const player = () => useGameStore.getState().players[0];

describe('Board layout', () => {
  it('renders the ring: 13 Locations, the Clock, 2 blanks and the centre panel', () => {
    const { container } = render(<Board />);
    expect(container.querySelectorAll('[data-cell="location"]')).toHaveLength(
      13,
    );
    expect(container.querySelectorAll('[data-cell="clock"]')).toHaveLength(1);
    expect(container.querySelectorAll('[data-cell="blank"]')).toHaveLength(2);
    expect(container.querySelectorAll('[data-cell="centre"]')).toHaveLength(1);
  });

  it('places each cell where the layout data says', () => {
    render(<Board />);
    // Grid lines are 1-based: row 0 / col 2 is gridRow 1 / gridColumn 3.
    expect(cellFor('Low-cost housing')).toHaveStyle({
      gridRow: '1 / span 1',
      gridColumn: '3 / span 1',
    });
    expect(cellFor('Factory')).toHaveStyle({
      gridRow: '5 / span 1',
      gridColumn: '1 / span 1',
    });
    expect(cellFor('Socket City')).toHaveStyle({
      gridRow: '5 / span 1',
      gridColumn: '5 / span 1',
    });
    expect(cellFor('Bank')).toHaveStyle({
      gridRow: '4 / span 1',
      gridColumn: '1 / span 1',
    });
    expect(screen.getByRole('region', { name: 'Centre' })).toHaveStyle({
      gridRow: '2 / span 3',
      gridColumn: '2 / span 3',
    });
  });

  it('marks closed Locations and cannot enter them', async () => {
    render(<Board />);
    for (const name of ['Bank', 'Pawn shop', 'Le Security']) {
      const cell = cellFor(name);
      expect(within(cell).getByText('Closed')).toBeInTheDocument();
      expect(within(cell).getByRole('button')).toBeDisabled();
    }
    await userEvent.click(within(cellFor('Bank')).getByRole('button'));
    expect(player().locationId).toBe(defaultPack.homeLocationId);
    expect(player().timeRemaining).toBe(12);
  });

  it('does not mark open Locations as closed', () => {
    render(<Board />);
    expect(within(cellFor('Z-Mart')).queryByText('Closed')).toBeNull();
    expect(within(cellFor('Z-Mart')).getByRole('button')).toBeEnabled();
  });

  it('shows a readable message instead of a broken Board for an invalid layout', () => {
    const broken: DataPack = {
      ...defaultPack,
      layout: {
        ...defaultPack.layout,
        cells: defaultPack.layout.cells.slice(1),
      },
    };
    render(<Board pack={broken} />);
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Board layout has no cell at 0,0.',
    );
    expect(screen.queryByText('Z-Mart')).toBeNull();
  });
});

describe('Board time and walking', () => {
  it('shows the hours left as text, in step with the store', () => {
    render(<Board />);
    expect(screen.getByText('12 hours left')).toBeInTheDocument();
    act(() =>
      useGameStore.setState((s) => ({
        players: [{ ...s.players[0], timeRemaining: 7.25 }],
      })),
    );
    expect(screen.getByText('7.3 hours left')).toBeInTheDocument();
  });

  it('walks to an open Location and spends the walking cost', async () => {
    render(<Board />);
    await userEvent.click(within(cellFor('Z-Mart')).getByRole('button'));
    expect(player().locationId).toBe('z-mart');
    expect(screen.getByText('11.3 hours left')).toBeInTheDocument();
  });

  it('slides the token along the ring to the target', async () => {
    render(<Board />);
    const token = screen.getByTestId('token');
    expect(token).toHaveAttribute('data-location', 'low-cost-housing');
    await userEvent.click(within(cellFor('Z-Mart')).getByRole('button'));
    await waitFor(() =>
      expect(token).toHaveAttribute('data-location', 'z-mart'),
    );
  });

  it('ends the Week and brings the Player home when a walk runs out of Time', async () => {
    render(<Board />);
    await userEvent.click(within(cellFor('Z-Mart')).getByRole('button'));
    act(() =>
      useGameStore.setState((s) => ({
        players: [{ ...s.players[0], timeRemaining: 0.1, hasEaten: true }],
      })),
    );
    await userEvent.click(
      within(cellFor('Monolith Burger')).getByRole('button'),
    );
    expect(player().locationId).toBe('low-cost-housing');
    expect(useGameStore.getState().currentWeek).toBe(2);
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByText('12 hours left')).toBeInTheDocument();
  });

  it('opens the Location menu when the current Location is selected', async () => {
    render(<Board />);
    await userEvent.click(
      within(cellFor('Low-cost housing')).getByRole('button'),
    );
    expect(
      screen.getByRole('dialog', { name: 'Low-cost housing' }),
    ).toBeInTheDocument();
    expect(player().timeRemaining).toBe(12);
  });
});
