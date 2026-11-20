import { describe, expect, test } from 'vitest';
import { MAX_REPEATS } from '../config';
import { MODES, dateKeyFor, isWin, leaderboardScore, nextHint, puzzleForDate, randomCode, score, scoreSpots } from './game';
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
    expect(isWin({ exact: 4, near: 1 }, 'hard')).toBe(false);
    expect(isWin({ exact: 5, near: 0 }, 'hard')).toBe(true);
  });
});

describe('puzzleForDate', () => {
  const modes: Mode[] = ['easy', 'hard'];

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
  test('codes are the right length, use ships 0-5, and repeat a ship no more than MAX_REPEATS times', () => {
    for (const mode of modes) {
      for (let d = 1; d <= 300; d++) {
        const { code, ruledOut } = puzzleForDate(`day-${d}`, mode);
        expect(code.length).toBe(MODES[mode].slots);
        for (const ship of code) {
          expect(ship).toBeGreaterThanOrEqual(0);
          expect(ship).toBeLessThan(6);
          expect(code.filter((s) => s === ship).length).toBeLessThanOrEqual(MAX_REPEATS ?? code.length);
          expect(ruledOut.includes(ship)).toBe(false);
        }
      }
    }
  });
  test('no mode starts with a ship ruled out', () => {
    for (const mode of modes) expect(puzzleForDate('2026-11-15', mode).ruledOut).toEqual([]);
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
  test('with the settings as shipped, uses the UTC day, not the local one', () => {
    expect(dateKeyFor(new Date('2026-11-15T23:30:00-05:00'))).toBe('2026-11-16');
  });
  test('an evening start names the game for the next day', () => {
    // 7:30 pm in New York. In November that is 00:30 UTC; in July, 23:30 UTC.
    expect(dateKeyFor(new Date('2026-11-16T19:29:00-05:00'), '19:30', 'America/New_York')).toBe('2026-11-16');
    expect(dateKeyFor(new Date('2026-11-16T19:30:00-05:00'), '19:30', 'America/New_York')).toBe('2026-11-17');
    expect(dateKeyFor(new Date('2026-11-17T09:00:00-05:00'), '19:30', 'America/New_York')).toBe('2026-11-17');
    expect(dateKeyFor(new Date('2026-07-10T19:29:00-04:00'), '19:30', 'America/New_York')).toBe('2026-07-10');
    expect(dateKeyFor(new Date('2026-07-10T19:30:00-04:00'), '19:30', 'America/New_York')).toBe('2026-07-11');
  });
  test('a morning start names the game for the day it starts', () => {
    expect(dateKeyFor(new Date('2026-11-16T05:59:00Z'), '06:00', 'UTC')).toBe('2026-11-15');
    expect(dateKeyFor(new Date('2026-11-16T06:00:00Z'), '06:00', 'UTC')).toBe('2026-11-16');
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

describe('scoreSpots', () => {
  test('marks each spot: right spot, wrong spot, or not in the fleet', () => {
    expect(scoreSpots([0, 1, 2, 3], [0, 2, 4, 4])).toEqual(['exact', 'miss', 'near', 'miss']);
  });
  test('a ship is only matched once', () => {
    // one junk (1) in the fleet, two in the guess: only the first gets a mark
    expect(scoreSpots([1, 1, 0, 0], [2, 3, 1, 4])).toEqual(['near', 'miss', 'miss', 'miss']);
    // the exact match is used first, so the other junk gets nothing
    expect(scoreSpots([1, 0, 1, 0], [2, 3, 1, 4])).toEqual(['miss', 'miss', 'exact', 'miss']);
  });
  test('agrees with the totals', () => {
    const guess = [3, 3, 1, 0, 5], code = [3, 1, 3, 5, 2];
    const spots = scoreSpots(guess, code);
    const { exact, near } = score(guess, code);
    expect(spots.filter((s) => s === 'exact').length).toBe(exact);
    expect(spots.filter((s) => s === 'near').length).toBe(near);
  });
});

describe('ships in play', () => {
  test('hints stay within the ships in play', () => {
    expect(nextHint([0, 1, 2, 3], [], 5)).toBe(4);
    expect(nextHint([0, 1, 2, 3], [4], 5)).toBe(null);
    expect(nextHint([0, 1, 2, 3], [4], MODES.easy.ships)).toBe(5);
  });
  test('randomCode only picks from the ships in play', () => {
    let n = 0;
    const rand = () => ((n = (n * 9301 + 49297) % 233280) / 233280);
    for (let i = 0; i < 50; i++) expect(randomCode(4, rand, 5).every((s) => s < 5)).toBe(true);
  });
  test('practice puzzles differ from game to game', () => {
    const a = puzzleForDate('practice-1', 'practice-hard').code.join(), b = puzzleForDate('practice-2', 'practice-hard').code.join();
    expect(a === b).toBe(false);
  });
});

describe('no repeat limit', () => {
  test('with no limit, a fleet can be all one ship', () => {
    if (MAX_REPEATS !== null) return; // only checked when the limit is off
    let allSame = false;
    for (let seed = 1; seed < 20000 && !allSame; seed++) {
      let n = seed;
      const rand = () => ((n = (n * 16807) % 2147483647) / 2147483647);
      const code = randomCode(4, rand, 6);
      allSame = code.every((s) => s === code[0]);
    }
    expect(allSame).toBe(true);
  });
});

describe('spyglassSpot', () => {
  test('finds a right-spot ship from the newest guess, leftmost first, skipping locked spots', async () => {
    const { spyglassSpot } = await import('./game');
    const code = [1, 2, 3, 4, 5];
    const guesses = [[1, 0, 0, 0, 0], [0, 2, 0, 4, 0]];
    expect(spyglassSpot(code, guesses, [null, null, null, null, null])).toEqual({ spot: 1, ship: 2 });
    expect(spyglassSpot(code, guesses, [null, 2, null, null, null])).toEqual({ spot: 3, ship: 4 });
    expect(spyglassSpot(code, guesses, [null, 2, null, 4, null])).toEqual({ spot: 0, ship: 1 });
    expect(spyglassSpot(code, guesses, [1, 2, null, 4, null])).toBe(null);
    expect(spyglassSpot(code, [], [null, null, null, null, null])).toBe(null);
  });
});

describe('rows', () => {
  test('Practice Bay: 8 rows with totals only, 6 with marks under each ship, never fewer once 6 are used', async () => {
    const { rowsFor } = await import('./game');
    expect(rowsFor('practice-easy', false, 0)).toBe(8);
    expect(rowsFor('practice-easy', true, 3)).toBe(6);
    expect(rowsFor('practice-easy', true, 6)).toBe(8);
    expect(rowsFor('easy', false, 0)).toBe(6);
    expect(rowsFor('practice-hard', true, 0)).toBe(10);
  });
});
