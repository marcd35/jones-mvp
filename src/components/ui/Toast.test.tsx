import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Toast } from './Toast';
import { useGameStore } from '@/store/useGameStore';

beforeEach(() => {
  vi.useFakeTimers();
  useGameStore.setState(useGameStore.getInitialState(), true);
});

afterEach(() => {
  vi.useRealTimers();
});

const fire = (message: string) =>
  act(() =>
    useGameStore.setState((s) => ({
      lastEvent: message,
      eventSeq: s.eventSeq + 1,
    })),
  );

describe('Toast', () => {
  it('shows nothing until an event happens', () => {
    render(<Toast />);
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });

  it('shows an event, then hides it after three seconds', () => {
    render(<Toast />);
    fire('Rent Paid');
    expect(screen.getByRole('status')).toHaveTextContent('Rent Paid');

    act(() => vi.advanceTimersByTime(3000));
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });

  it('shows an identical message again after it was dismissed', () => {
    render(<Toast />);
    fire('Worked 4 hrs');
    act(() => vi.advanceTimersByTime(3000));
    expect(screen.getByRole('status')).toBeEmptyDOMElement();

    fire('Worked 4 hrs');
    expect(screen.getByRole('status')).toHaveTextContent('Worked 4 hrs');
  });

  it('restarts the timer when a new event arrives', () => {
    render(<Toast />);
    fire('First');
    act(() => vi.advanceTimersByTime(2000));
    fire('Second');
    act(() => vi.advanceTimersByTime(2000));
    expect(screen.getByRole('status')).toHaveTextContent('Second');
    act(() => vi.advanceTimersByTime(1000));
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });
});
