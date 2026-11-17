import { describe, expect, test } from 'vitest';
import { computeStreak } from './badges';
import { daysCovered, findGap, pickRepairs, repairsEarned } from './repairs';

const days = (...list: string[]) => new Set(list.map((d) => `2026-11-${d}`));

describe('earning repairs', () => {
  test('one for every 30 days played; the first three are one-day, later ones three-day', () => {
    expect(repairsEarned(29)).toEqual({ ones: 0, threes: 0 });
    expect(repairsEarned(30)).toEqual({ ones: 1, threes: 0 });
    expect(repairsEarned(95)).toEqual({ ones: 3, threes: 0 });
    expect(repairsEarned(150)).toEqual({ ones: 3, threes: 2 });
    expect(daysCovered({ ones: 3, threes: 2 })).toBe(9);
  });
});

describe('picking which repairs to spend', () => {
  test('uses a one-day repair for one missed day', () => {
    expect(pickRepairs(1, { ones: 2, threes: 2 })).toEqual({ ones: 1, threes: 0 });
  });
  test('wastes as little as possible, then spends as few as possible', () => {
    expect(pickRepairs(2, { ones: 2, threes: 2 })).toEqual({ ones: 2, threes: 0 });
    expect(pickRepairs(3, { ones: 3, threes: 1 })).toEqual({ ones: 0, threes: 1 });
    expect(pickRepairs(4, { ones: 1, threes: 2 })).toEqual({ ones: 1, threes: 1 });
    expect(pickRepairs(2, { ones: 0, threes: 1 })).toEqual({ ones: 0, threes: 1 });
  });
  test('combines repairs for a long gap', () => {
    expect(pickRepairs(15, { ones: 0, threes: 5 })).toEqual({ ones: 0, threes: 5 });
  });
  test('says no when the gap cannot be covered', () => {
    expect(pickRepairs(2, { ones: 1, threes: 0 })).toBe(null);
    expect(pickRepairs(1, { ones: 0, threes: 0 })).toBe(null);
  });
});

describe('finding the gap to mend', () => {
  test('missed days between the current run and the one before, newest first', () => {
    expect(findGap(days('10', '11', '12', '15', '16'), new Set(), '2026-11-16', 5)).toEqual(['2026-11-14', '2026-11-13']);
  });
  test('works before today has been played', () => {
    expect(findGap(days('10', '11', '12'), new Set(), '2026-11-15', 5)).toEqual(['2026-11-14', '2026-11-13']);
  });
  test('nothing to mend: no gap, no earlier run, or a gap that is too long', () => {
    expect(findGap(days('14', '15', '16'), new Set(), '2026-11-16', 5)).toBe(null);
    expect(findGap(days('16'), new Set(), '2026-11-16', 5)).toBe(null);
    expect(findGap(days('10', '16'), new Set(), '2026-11-16', 4)).toBe(null);
  });
  test('days already mended hold the run together', () => {
    expect(findGap(days('10', '12', '15', '16'), days('13', '14'), '2026-11-16', 5)).toEqual(['2026-11-11']);
  });
});

describe('streak after a repair', () => {
  test('mended days keep the run going but do not add to the count', () => {
    const played = days('10', '11', '12', '15', '16');
    expect(computeStreak(played, '2026-11-16')).toBe(2);
    expect(computeStreak(played, '2026-11-16', days('13', '14'))).toBe(5);
  });
});
