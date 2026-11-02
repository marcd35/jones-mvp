import type { BoardCell, BoardLayout } from '@/types';

const loc = (row: number, col: number, locationId: string): BoardCell => ({
  row,
  col,
  content: { kind: 'location', locationId },
});
const blank = (row: number, col: number): BoardCell => ({
  row,
  col,
  content: { kind: 'blank' },
});

// DEC-004: the 5x5 ring verified against the original.
export const LAYOUT: BoardLayout = {
  size: 5,
  cells: [
    // Top row
    loc(0, 0, 'le-security'),
    loc(0, 1, 'rent-office'),
    loc(0, 2, 'low-cost-housing'),
    loc(0, 3, 'pawn-shop'),
    loc(0, 4, 'z-mart'),
    // Right column
    loc(1, 4, 'monolith-burger'),
    loc(2, 4, 'qt-clothing'),
    blank(3, 4),
    // Bottom row, left to right
    loc(4, 0, 'factory'),
    loc(4, 1, 'employment-office'),
    { row: 4, col: 2, content: { kind: 'clock' } },
    loc(4, 3, 'hi-tech-u'),
    loc(4, 4, 'socket-city'),
    // Left column, top to bottom
    blank(1, 0),
    loc(2, 0, 'blacks-market'),
    loc(3, 0, 'bank'),
  ],
  centre: { row: 1, col: 1, rowSpan: 3, colSpan: 3 },
};
