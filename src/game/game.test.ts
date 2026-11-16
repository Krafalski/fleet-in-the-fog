import { describe, expect, test } from 'vitest';
import { MODES, dateKeyFor, isWin, leaderboardScore, nextHint, puzzleForDate, score } from './game';
import type { Mode } from './game';

describe('score', () => {
  test('all correct', () => {
    expect(score([0, 1, 2, 3], [0, 1, 2, 3])).toEqual({ exact: 4, near: 0 });
  });
  test('all right ships, all wrong spots', () => {
    expect(score([3, 2, 1, 0], [0, 1, 2, 3])).toEqual({ exact: 0, near: 4 });
  });
  test('nothing matches', () => {
    expect(score([5, 5, 5, 5], [0, 1, 2, 3])).toEqual({ exact: 0, near: 0 });
  });
  test('duplicate trap: a ship in the code is only matched once', () => {
    // code has two 0s; guess has three. One exact, one near, the third 0 gets nothing.
    expect(score([0, 1, 0, 0], [0, 0, 1, 2])).toEqual({ exact: 1, near: 2 });
  });
  test('guessing a ship twice when the code has it once', () => {
    expect(score([4, 4, 5, 5], [4, 0, 1, 2])).toEqual({ exact: 1, near: 0 });
  });
  test('works for 6 slots', () => {
    expect(score([0, 1, 2, 3, 4, 4], [1, 0, 2, 3, 4, 0])).toEqual({ exact: 3, near: 2 });
  });
});

describe('isWin', () => {
  test('needs every slot exact for the mode', () => {
    expect(isWin({ exact: 4, near: 0 }, 'easy')).toBe(true);
    expect(isWin({ exact: 4, near: 1 }, 'medium')).toBe(false);
    expect(isWin({ exact: 6, near: 0 }, 'hard')).toBe(true);
  });
});

describe('puzzleForDate', () => {
  const modes: Mode[] = ['easy', 'medium', 'hard'];

  test('same date and mode always gives the same puzzle', () => {
    for (const mode of modes) {
      expect(puzzleForDate('2026-11-15', mode)).toEqual(puzzleForDate('2026-11-15', mode));
    }
  });
  test('different dates give different puzzles (over a month, not all the same)', () => {
    const seen = new Set<string>();
    for (let d = 1; d <= 30; d++) seen.add(puzzleForDate(`2026-11-${String(d).padStart(2, '0')}`, 'easy').code.join(''));
    expect(seen.size).toBeGreaterThan(25);
  });
  test('codes are the right length, use ships 0-5, and repeat a ship at most twice', () => {
    for (const mode of modes) {
      for (let d = 1; d <= 300; d++) {
        const { code, ruledOut } = puzzleForDate(`day-${d}`, mode);
        expect(code.length).toBe(MODES[mode].slots);
        for (const ship of code) {
          expect(ship).toBeGreaterThanOrEqual(0);
          expect(ship).toBeLessThan(6);
          expect(code.filter((s) => s === ship).length).toBeLessThanOrEqual(2);
          expect(ruledOut.includes(ship)).toBe(false);
        }
      }
    }
  });
  test('only hard mode starts with a ship ruled out', () => {
    expect(puzzleForDate('2026-11-15', 'easy').ruledOut).toEqual([]);
    expect(puzzleForDate('2026-11-15', 'medium').ruledOut).toEqual([]);
    expect(puzzleForDate('2026-11-15', 'hard').ruledOut.length).toBe(1);
  });
});

describe('nextHint', () => {
  test('gives the lowest ship that is not in the code and not already ruled out', () => {
    expect(nextHint([1, 1, 3, 4], [])).toBe(0);
    expect(nextHint([1, 1, 3, 4], [0])).toBe(2);
    expect(nextHint([1, 1, 3, 4], [0, 2])).toBe(5);
  });
  test('gives null when nothing is left to rule out', () => {
    expect(nextHint([1, 1, 3, 4], [0, 2, 5])).toBe(null);
  });
});

describe('dateKeyFor', () => {
  test('uses the UTC day', () => {
    expect(dateKeyFor(new Date('2026-11-15T23:30:00-05:00'))).toBe('2026-11-16');
  });
});

describe('leaderboardScore', () => {
  test('fewer guesses beats a faster time', () => {
    expect(leaderboardScore(3, 9000)).toBeLessThan(leaderboardScore(4, 5));
  });
  test('time breaks ties', () => {
    expect(leaderboardScore(4, 90)).toBeLessThan(leaderboardScore(4, 133));
  });
  test('a very long time cannot spill into the guesses part', () => {
    expect(leaderboardScore(4, 50000)).toBeLessThan(leaderboardScore(5, 0));
  });
});
