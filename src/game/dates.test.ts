import { describe, expect, test } from 'vitest';
import { badgesForStreak, computeStreak } from './badges';
import { addDays, formatDate, weekStart, weekdayName } from './dates';

describe('dates', () => {
  test('addDays crosses months and years', () => {
    expect(addDays('2026-11-30', 1)).toBe('2026-12-01');
    expect(addDays('2027-01-01', -1)).toBe('2026-12-31');
  });
  test('weekStart is the Monday of that week', () => {
    expect(weekStart('2026-11-15')).toBe('2026-11-09'); // a Sunday
    expect(weekStart('2026-11-09')).toBe('2026-11-09'); // a Monday
    expect(weekStart('2026-11-11')).toBe('2026-11-09');
  });
  test('names and formats', () => {
    expect(weekdayName('2026-11-15')).toBe('Sun');
    expect(formatDate('2026-11-15')).toBe('Nov 15, 2026');
    expect(formatDate('2026-11-15', false)).toBe('Nov 15');
  });
});

describe('streaks', () => {
  test('counts back from today', () => {
    expect(computeStreak(new Set(['2026-11-13', '2026-11-14', '2026-11-15']), '2026-11-15')).toBe(3);
  });
  test('still counts if today is not played yet', () => {
    expect(computeStreak(new Set(['2026-11-13', '2026-11-14']), '2026-11-15')).toBe(2);
  });
  test('a missed day breaks it', () => {
    expect(computeStreak(new Set(['2026-11-12', '2026-11-14', '2026-11-15']), '2026-11-15')).toBe(2);
    expect(computeStreak(new Set(['2026-11-12']), '2026-11-15')).toBe(0);
  });
  test('badges earned by streak length', () => {
    expect(badgesForStreak(2)).toEqual([]);
    expect(badgesForStreak(7)).toEqual(['paper', 'rowboat', 'canoe']);
    expect(badgesForStreak(1000).includes('ghost')).toBe(false);
    expect(badgesForStreak(360).length).toBe(17);
  });
});
