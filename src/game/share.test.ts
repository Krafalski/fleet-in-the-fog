import { describe, expect, test } from 'vitest';
import { shareRow, shareText } from './share';

describe('share', () => {
  test('per-spot rows keep the order of the spots', () => {
    expect(shareRow({ exact: 1, near: 1, spots: ['near', 'miss', 'exact', 'miss'] }, 4, true)).toBe('🛟🌊⚓🌊');
  });
  test('totals rows put anchors first, so they give no positions away', () => {
    expect(shareRow({ exact: 1, near: 2, spots: ['near', 'miss', 'exact', 'near', 'miss'] }, 5, false)).toBe('⚓🛟🛟🌊🌊');
  });
  test('the whole result: title, outcome, rows, streak', () => {
    const text = shareText({
      dateKey: '2026-11-17', mode: 'easy', won: true, guesses: 2, creature: 'Manta ray', streak: 5,
      rows: [{ exact: 1, near: 0, spots: ['exact', 'miss', 'miss', 'miss'] }, { exact: 4, near: 0, spots: ['exact', 'exact', 'exact', 'exact'] }],
      perSpot: true,
    });
    expect(text).toBe('Fleet in the Fog · Nov 17 · Easy\nSolved in 2/8 · Manta ray sighted\n⚓🌊🌊🌊\n⚓⚓⚓⚓\nStreak: 5 days');
  });
  test('a replayed day shares the outcome without a grid', () => {
    const text = shareText({ dateKey: '2026-11-17', mode: 'hard', won: false, guesses: 10, creature: null, streak: null, rows: null, perSpot: false });
    expect(text).toBe('Fleet in the Fog · Nov 17 · Hard\nThe fleet slipped away (10/10)');
  });
});
