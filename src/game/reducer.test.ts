import { describe, expect, test } from 'vitest';
import { alreadyGuessed, canLogGuess, newGame, reducer, totalGuesses } from './reducer';
import type { Action, GameState } from './reducer';

function play(state: GameState, ...actions: Action[]): GameState {
  return actions.reduce(reducer, state);
}
const start = () => newGame('2026-11-15', 'easy');

describe('placing ships', () => {
  test('picking ships fills the row from the left', () => {
    const s = play(start(), { type: 'PICK_SHIP', ship: 4 }, { type: 'PICK_SHIP', ship: 2 }, { type: 'PICK_SHIP', ship: 4 });
    expect(s.current).toEqual([4, 2, 4, null]);
  });
  test('tap an empty spot first and the next ship goes there', () => {
    const s = play(start(), { type: 'TAP_SLOT', slot: 2 }, { type: 'PICK_SHIP', ship: 5 }, { type: 'PICK_SHIP', ship: 0 });
    expect(s.current).toEqual([0, null, 5, null]);
    expect(s.cursor).toBe(null);
  });
  test('picking a ship when the row is full does nothing', () => {
    const full = play(start(), ...[0, 1, 2, 3].map((ship): Action => ({ type: 'PICK_SHIP', ship })));
    expect(play(full, { type: 'PICK_SHIP', ship: 5 })).toEqual(full);
  });
});

describe('rearranging', () => {
  const filled = () => play(start(), { type: 'PICK_SHIP', ship: 1 }, { type: 'PICK_SHIP', ship: 5 });

  test('tap a placed ship to take it off', () => {
    const s = play(filled(), { type: 'TAP_SLOT', slot: 0 });
    expect(s.current).toEqual([null, 5, null, null]);
  });
  test('the next ship picked goes where the removed one was', () => {
    const s = play(filled(), { type: 'TAP_SLOT', slot: 0 }, { type: 'PICK_SHIP', ship: 3 });
    expect(s.current).toEqual([3, 5, null, null]);
  });
  test('tapping the chosen spot again lets go of it', () => {
    const s = play(filled(), { type: 'TAP_SLOT', slot: 3 }, { type: 'TAP_SLOT', slot: 3 }, { type: 'PICK_SHIP', ship: 2 });
    expect(s.current).toEqual([1, 5, 2, null]);
  });
  test('clear row empties everything', () => {
    expect(play(filled(), { type: 'CLEAR_ROW' }).current).toEqual([null, null, null, null]);
  });
});

describe('logging a guess', () => {
  test('Log guess is only allowed when the row is full', () => {
    let s = play(start(), { type: 'PICK_SHIP', ship: 2 }, { type: 'PICK_SHIP', ship: 2 }, { type: 'PICK_SHIP', ship: 2 });
    expect(canLogGuess(s)).toBe(false);
    s = play(s, { type: 'PICK_SHIP', ship: 2 });
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
    let s = play(start(), { type: 'PICK_SHIP', ship: 2 }, { type: 'HINT_GIVEN', ship: 2 });
    expect(s.ruledOut).toEqual([2]);
    expect(s.hintsUsed).toBe(1);
    expect(s.current[0]).toBe(null);
    s = play(s, { type: 'PICK_SHIP', ship: 2 });
    expect(s.current[0]).toBe(null);
  });
});

describe('replay', () => {
  const guess = (status: 'playing' | 'won' | 'lost'): Action =>
    ({ type: 'GUESS_SCORED', guess: [0, 1, 2, 3], feedback: { exact: 1, near: 0 }, status, answer: status === 'playing' ? null : [3, 3, 1, 1] });

  test('clears the board but keeps counting guesses and hints', () => {
    const s = play(start(), guess('playing'), guess('playing'), { type: 'HINT_GIVEN', ship: 5 }, { type: 'REPLAY' });
    expect(s.guesses).toEqual([]);
    expect(s.feedback).toEqual([]);
    expect(s.rounds).toBe(2);
    expect(totalGuesses(s)).toBe(2);
    expect(s.ruledOut).toEqual([5]);
    expect(totalGuesses(play(s, guess('playing')))).toBe(3);
  });
  test('works after the game is over, and hides the answer again', () => {
    const s = play(start(), guess('lost'), { type: 'REPLAY' });
    expect(s.status).toBe('playing');
    expect(s.answer).toBe(null);
  });
});

describe('alreadyGuessed', () => {
  test('spots a row that was already logged, and only an exact match', () => {
    let s = newGame('2026-11-16', 'easy');
    s = reducer(s, { type: 'GUESS_SCORED', guess: [0, 1, 2, 3], feedback: { exact: 0, near: 0 }, status: 'playing', answer: null });
    s = { ...s, current: [0, 1, 2, 3] };
    expect(alreadyGuessed(s)).toBe(true);
    s = { ...s, current: [0, 1, 3, 2] };
    expect(alreadyGuessed(s)).toBe(false);
  });
});
