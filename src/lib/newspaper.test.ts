import { describe, expect, it } from 'vitest';
import { newspaperIssueSchedule } from './newspaper';

describe('newspaperIssueSchedule', () => {
  it('makes an issue available at each configured interval', () => {
    expect(newspaperIssueSchedule(1, 2)).toEqual({
      available: true,
      nextIssueWeek: null,
    });
    expect(newspaperIssueSchedule(3, 2)).toEqual({
      available: true,
      nextIssueWeek: null,
    });
  });

  it('returns the next issue Week between configured intervals', () => {
    expect(newspaperIssueSchedule(2, 2)).toEqual({
      available: false,
      nextIssueWeek: 3,
    });
    expect(newspaperIssueSchedule(5, 3)).toEqual({
      available: false,
      nextIssueWeek: 7,
    });
  });
});
