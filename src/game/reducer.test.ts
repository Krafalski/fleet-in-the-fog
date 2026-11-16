import { describe, expect, test } from 'vitest';
import { canLogGuess, newGame, reducer } from './reducer';
import type { Action, GameState } from './reducer';

function play(state: GameState, ...actions: Action[]): GameState {
  return actions.reduce(reducer, state);
}
const start = () => newGame('2026-11-15', 'easy');

describe('placing ships', () => {
  test('pick a ship, then tap slots to place it; the selection stays', () => {
    const s = play(start(), { type: 'PICK_SHIP', ship: 4 }, { type: 'TAP_SLOT', slot: 0 }, { type: 'TAP_SLOT', slot: 2 });
    expect(s.current).toEqual([4, null, 4, null]);
    expect(s.selected).toBe(4);
  });
  test('tapping an empty slot with nothing selected does nothing', () => {
    expect(play(start(), { type: 'TAP_SLOT', slot: 1 }).current).toEqual([null, null, null, null]);
  });
});

describe('rearranging', () => {
  const filled = () =>
    play(start(), { type: 'PICK_SHIP', ship: 1 }, { type: 'TAP_SLOT', slot: 0 }, { type: 'PICK_SHIP', ship: 5 }, { type: 'TAP_SLOT', slot: 1 });

  test('tap a placed ship to pick it up, tap another placed ship to swap', () => {
    const s = play(filled(), { type: 'TAP_SLOT', slot: 0 }, { type: 'TAP_SLOT', slot: 1 });
    expect(s.current).toEqual([5, 1, null, null]);
    expect(s.held).toBe(null);
  });
  test('tap a placed ship, then an empty slot, to move it', () => {
    const s = play(filled(), { type: 'TAP_SLOT', slot: 0 }, { type: 'TAP_SLOT', slot: 3 });
    expect(s.current).toEqual([null, 5, null, 1]);
  });
  test('tap a placed ship twice to clear it', () => {
    const s = play(filled(), { type: 'TAP_SLOT', slot: 1 }, { type: 'TAP_SLOT', slot: 1 });
    expect(s.current).toEqual([1, null, null, null]);
  });
  test('holding a ship and tapping the picker replaces it', () => {
    const s = play(filled(), { type: 'TAP_SLOT', slot: 0 }, { type: 'PICK_SHIP', ship: 3 });
    expect(s.current).toEqual([3, 5, null, null]);
  });
  test('clear row empties everything', () => {
    expect(play(filled(), { type: 'CLEAR_ROW' }).current).toEqual([null, null, null, null]);
  });
});

describe('logging a guess', () => {
  test('Log guess is only allowed when the row is full', () => {
    let s = play(start(), { type: 'PICK_SHIP', ship: 2 }, { type: 'TAP_SLOT', slot: 0 }, { type: 'TAP_SLOT', slot: 1 }, { type: 'TAP_SLOT', slot: 2 });
    expect(canLogGuess(s)).toBe(false);
    s = play(s, { type: 'TAP_SLOT', slot: 3 });
    expect(canLogGuess(s)).toBe(true);
  });
  test('a scored guess is added to the board and the row resets', () => {
    const s = play(start(), { type: 'GUESS_SCORED', guess: [0, 1, 2, 3], feedback: { exact: 1, near: 2 }, status: 'playing', answer: null });
    expect(s.guesses).toEqual([[0, 1, 2, 3]]);
    expect(s.feedback).toEqual([{ exact: 1, near: 2 }]);
    expect(s.current).toEqual([null, null, null, null]);
  });
  test('after a win the board is frozen', () => {
    const won = play(start(), { type: 'GUESS_SCORED', guess: [0, 1, 2, 3], feedback: { exact: 4, near: 0 }, status: 'won', answer: [0, 1, 2, 3] });
    const after = play(won, { type: 'PICK_SHIP', ship: 1 }, { type: 'TAP_SLOT', slot: 0 });
    expect(after).toEqual(won);
    expect(canLogGuess(after)).toBe(false);
  });
});

describe('hints', () => {
  test('a hinted ship is greyed out, removed from the row, and cannot be picked', () => {
    let s = play(start(), { type: 'PICK_SHIP', ship: 2 }, { type: 'TAP_SLOT', slot: 0 }, { type: 'HINT_GIVEN', ship: 2 });
    expect(s.ruledOut).toEqual([2]);
    expect(s.hintsUsed).toBe(1);
    expect(s.current[0]).toBe(null);
    expect(s.selected).toBe(null);
    s = play(s, { type: 'PICK_SHIP', ship: 2 });
    expect(s.selected).toBe(null);
  });
  test("hard mode's free ruled-out ship does not count as a hint", () => {
    const s = newGame('2026-11-15', 'hard', [3]);
    expect(s.ruledOut).toEqual([3]);
    expect(s.hintsUsed).toBe(0);
    expect(s.current.length).toBe(6);
  });
});
