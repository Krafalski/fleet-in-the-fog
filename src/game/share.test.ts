import { describe, expect, test } from 'vitest';
import { shareRow, shareText } from './share';

describe('share', () => {
  test('per-spot rows keep the order of the spots', () => {
    expect(shareRow({ exact: 1, near: 1, spots: ['near', 'miss', 'exact', 'miss'] }, 4, true)).toBe('⬜🟦⬛🟦');
  });
  test('totals rows put anchors first, so they give no positions away', () => {
    expect(shareRow({ exact: 1, near: 2, spots: ['near', 'miss', 'exact', 'near', 'miss'] }, 5, false)).toBe('⬛⬜⬜🟦🟦');
  });
  test('the winning row is a row of ships, in both modes', () => {
    expect(shareRow({ exact: 5, near: 0 }, 5, false)).toBe('🚢🚢🚢🚢🚢');
  });
  test('the whole result: title, outcome, rows, streak', () => {
    const text = shareText({
      dateKey: '2026-11-17', mode: 'easy', won: true, guesses: 2, hints: 0, creature: 'Manta ray', streak: 5,
      rows: [{ exact: 1, near: 0, spots: ['exact', 'miss', 'miss', 'miss'] }, { exact: 4, near: 0, spots: ['exact', 'exact', 'exact', 'exact'] }],
      perSpot: true,
    });
    expect(text).toBe('Fleet in the Fog · Nov 17 · Bay\nSolved in 2/6 · Manta ray sighted\n⬛🟦🟦🟦\n🚢🚢🚢🚢\nStreak: 5 days');
  });
  test('hints show next to the guesses, with the score', () => {
    const text = shareText({ dateKey: '2026-11-17', mode: 'easy', won: true, guesses: 4, hints: 1, creature: 'Octopus', streak: null, rows: null, perSpot: true });
    expect(text).toBe('Fleet in the Fog · Nov 17 · Bay\nSolved in 4/6 + 1 lookout · Score 5 · Octopus sighted');
  });
  test('spyglasses show too, and their points count in the score', () => {
    const text = shareText({ dateKey: '2026-11-17', mode: 'hard', won: true, guesses: 5, hints: 0, spyglasses: 1, spyPoints: 2, creature: 'Turtle', streak: null, rows: null, perSpot: false });
    expect(text).toBe('Fleet in the Fog · Nov 17 · Open sea\nSolved in 5/10 + 1 spyglass · Score 7 · Turtle sighted');
  });
  test('a replayed day shares the outcome without a grid', () => {
    const text = shareText({ dateKey: '2026-11-17', mode: 'hard', won: false, guesses: 10, hints: 0, creature: null, streak: null, rows: null, perSpot: false });
    expect(text).toBe('Fleet in the Fog · Nov 17 · Open sea\nThe fleet slipped away (10/10)');
  });
});
