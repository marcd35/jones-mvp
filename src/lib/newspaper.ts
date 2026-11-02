export interface NewspaperIssueSchedule {
  available: boolean;
  nextIssueWeek: number | null;
}

export function newspaperIssueSchedule(
  currentWeek: number,
  issueEveryWeeks: number,
): NewspaperIssueSchedule {
  const weeksIntoCycle = (currentWeek - 1) % issueEveryWeeks;
  if (weeksIntoCycle === 0) {
    return { available: true, nextIssueWeek: null };
  }

  return {
    available: false,
    nextIssueWeek: currentWeek + issueEveryWeeks - weeksIntoCycle,
  };
}
