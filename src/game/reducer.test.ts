import { describe, expect, test } from 'vitest';
import { alreadyGuessed, boardRows, canLogGuess, newGame, reducer, totalGuesses, tryOfRow } from './reducer';
import type { Ship } from './game';
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

describe('practice actions', () => {
  test('giving up ends the game and shows the answer', () => {
    const s = reducer(newGame('practice-1', 'practice-hard'), { type: 'GAVE_UP', answer: [0, 1, 2, 3, 4] });
    expect(s.status).toBe('lost');
    expect(s.answer).toEqual([0, 1, 2, 3, 4]);
  });
  test('the feedback toggle works even after the game is over', () => {
    let s = reducer(newGame('practice-1', 'practice-hard'), { type: 'GAVE_UP', answer: [0, 1, 2, 3, 4] });
    s = reducer(s, { type: 'SET_PER_SPOT', perSpot: false });
    expect(s.perSpot).toBe(false);
  });
  test('each mode starts with its own feedback style', () => {
    expect(newGame('2026-11-17', 'easy').perSpot).toBe(true);
    expect(newGame('2026-11-17', 'hard').perSpot).toBe(false);
  });
});

describe('carrying right-spot ships', () => {
  const scored = (carry: boolean) => reducer(newGame('2026-11-17', 'easy'), {
    type: 'GUESS_SCORED', guess: [0, 1, 2, 3], status: 'playing', answer: null, carry,
    feedback: { exact: 2, near: 1, spots: ['exact', 'near', 'miss', 'exact'] },
  });
  test('with carry on, the next row starts with the ships that were in the right spot', () => {
    expect(scored(true).current).toEqual([0, null, null, 3]);
  });
  test('with carry off, the next row starts empty', () => {
    expect(scored(false).current).toEqual([null, null, null, null]);
  });
  test('a carried ship can be tapped out like any other', () => {
    const s = reducer(scored(true), { type: 'TAP_SLOT', slot: 0 });
    expect(s.current[0]).toBe(null);
  });
});

describe('reveal after a loss', () => {
  test('the fleet stays hidden until Reveal, and a Replay hides it again', () => {
    const lost: GameState = { ...newGame('2026-11-17', 'easy'), status: 'lost', answer: [0, 1, 2, 3] };
    expect(lost.revealed).toBe(false);
    const shown = reducer(lost, { type: 'REVEAL' });
    expect(shown.revealed).toBe(true);
    expect(reducer(shown, { type: 'REPLAY' }).revealed).toBe(false);
  });
  test('Reveal does nothing mid-game', () => {
    const game = newGame('2026-11-17', 'easy');
    expect(reducer(game, { type: 'REVEAL' }).revealed).toBe(false);
  });
});

describe('spyglass', () => {
  const hard = () => ({ ...newGame('2026-11-18', 'hard') });
  test('locks a ship in its spot, and every new row starts with it', () => {
    let s: GameState = reducer(hard(), { type: 'SPYGLASS', spot: 2, ship: 4, cost: 0 });
    expect(s.current[2]).toBe(4);
    expect(s.spyglasses).toBe(1);
    s = reducer(s, { type: 'GUESS_SCORED', guess: [0, 0, 4, 0, 0], feedback: { exact: 1, near: 0 }, status: 'playing', answer: null });
    expect(s.current).toEqual([null, null, 4, null, null]);
    s = reducer(s, { type: 'CLEAR_ROW' });
    expect(s.current[2]).toBe(4);
  });
  test("a locked ship can't be tapped off or replaced", () => {
    let s: GameState = reducer(hard(), { type: 'SPYGLASS', spot: 0, ship: 3, cost: 2 });
    s = reducer(s, { type: 'TAP_SLOT', slot: 0 });
    expect(s.current[0]).toBe(3);
    s = reducer(s, { type: 'PICK_SHIP', ship: 1 });
    expect(s.current[0]).toBe(3);
    expect(s.current[1]).toBe(1);
  });
  test('points add up, and a Replay keeps the locks', () => {
    let s: GameState = reducer(hard(), { type: 'SPYGLASS', spot: 0, ship: 3, cost: 2 });
    s = reducer(s, { type: 'SPYGLASS', spot: 1, ship: 3, cost: 0 });
    expect(s.spyglassPoints).toBe(2);
    s = reducer(s, { type: 'REPLAY' });
    expect(s.current.slice(0, 2)).toEqual([3, 3]);
  });
});

describe('dragging ships in the row', () => {
  test('drop on a ship: they swap; drop on an empty spot: it moves', () => {
    let s: GameState = { ...newGame('2026-11-18', 'easy'), current: [0, 1, null, 3] };
    s = reducer(s, { type: 'MOVE_SHIP', from: 0, to: 1 });
    expect(s.current).toEqual([1, 0, null, 3]);
    s = reducer(s, { type: 'MOVE_SHIP', from: 3, to: 2 });
    expect(s.current).toEqual([1, 0, 3, null]);
  });
  test("spyglass ships don't move, and nothing can be dropped on them", () => {
    let s: GameState = { ...newGame('2026-11-18', 'hard'), current: [4, 1, null, null, null], locked: [4, null, null, null, null] };
    expect(reducer(s, { type: 'MOVE_SHIP', from: 0, to: 2 }).current).toEqual(s.current);
    expect(reducer(s, { type: 'MOVE_SHIP', from: 1, to: 0 }).current).toEqual(s.current);
  });
});

describe('note flags', () => {
  const played = (): GameState => ({ ...newGame('2026-11-18', 'hard'), guesses: [[0, 1, 2, 3, 4]], feedback: [{ exact: 0, near: 1 }] });
  test('tapping cycles: right spot, wrong spot, not in fleet, then off', () => {
    let s = played();
    const order: (string | undefined)[] = [];
    for (let i = 0; i < 4; i++) { s = reducer(s, { type: 'NOTE', row: 0, spot: 2 }); order.push(s.notes['0:2']); }
    expect(order).toEqual(['exact', 'near', 'no', undefined]);
  });
  test('only finished rows take flags, and a Replay starts clean', () => {
    let s = reducer(played(), { type: 'NOTE', row: 1, spot: 0 });
    expect(Object.keys(s.notes).length).toBe(0);
    s = reducer(s, { type: 'NOTE', row: 0, spot: 0 });
    expect(reducer(s, { type: 'REPLAY' }).notes).toEqual({});
  });
});

describe('marking ships out (long press)', () => {
  test('toggles a ship in and out of your own marks', () => {
    let s = reducer(newGame('2026-11-18', 'easy'), { type: 'TOGGLE_OUT', ship: 2 });
    expect(s.markedOut).toEqual([2]);
    s = reducer(s, { type: 'TOGGLE_OUT', ship: 2 });
    expect(s.markedOut).toEqual([]);
  });
});

describe('keep trying after a loss', () => {
  // A Bay game lost after 6 guesses, with a note flag on the first row.
  function lostBay(): GameState {
    const row = [0, 0, 0, 0] as Ship[];
    const feedback = { exact: 0, near: 0, spots: ['none', 'none', 'none', 'none'] } as unknown as GameState['feedback'][number];
    return { ...newGame('2027-06-15', 'easy'), status: 'lost', guesses: Array(6).fill(row), feedback: Array(6).fill(feedback), notes: { '0:1': 'no' } };
  }

  test('adds 10 rows under the old ones and keeps guesses and flags', () => {
    const s = reducer(lostBay(), { type: 'KEEP_TRYING' });
    expect(s.status).toBe('playing');
    expect(s.guesses.length).toBe(6);
    expect(s.notes['0:1']).toBe('no');
    expect(s.tries).toEqual([6]);
    expect(boardRows(s)).toBe(16);
    expect(tryOfRow(s, 5)).toBe(0);
    expect(tryOfRow(s, 6)).toBe(1);
  });

  test('with "keep ships in the right spot" on, the new row starts with the last row\'s right-spot ships', () => {
    const lost = lostBay();
    const last = lost.guesses.length - 1;
    lost.guesses = [...lost.guesses.slice(0, last), [1, 2, 3, 4] as Ship[]];
    lost.feedback = [...lost.feedback.slice(0, last), { exact: 2, near: 0, spots: ['exact', 'miss', 'exact', 'miss'] } as GameState['feedback'][number]];
    expect(reducer(lost, { type: 'KEEP_TRYING', carry: true }).current).toEqual([1, null, 3, null]);
    expect(reducer(lost, { type: 'KEEP_TRYING' }).current).toEqual([null, null, null, null]);
  });

  test('a second Keep trying adds 10 more', () => {
    let s = reducer(lostBay(), { type: 'KEEP_TRYING' });
    s = { ...s, status: 'lost', guesses: [...s.guesses, ...Array(10).fill(s.guesses[0])] };
    s = reducer(s, { type: 'KEEP_TRYING' });
    expect(s.tries).toEqual([6, 16]);
    expect(boardRows(s)).toBe(26);
  });

  test('not after the fleet was revealed, and not on a win', () => {
    expect(reducer({ ...lostBay(), revealed: true }, { type: 'KEEP_TRYING' }).status).toBe('lost');
    expect(reducer({ ...lostBay(), status: 'won' }, { type: 'KEEP_TRYING' }).status).toBe('won');
  });

  test('Practice Bay under each ship: 6 rows, then 16 after Keep trying (not 18)', () => {
    const s = reducer({ ...lostBay(), mode: 'practice-easy', perSpot: true }, { type: 'KEEP_TRYING' });
    expect(boardRows(s)).toBe(16);
  });
});

describe('keyboard backspace', () => {
  test('takes off the rightmost ship and skips spyglass ships', () => {
    let s = play(start(), { type: 'PICK_SHIP', ship: 1 }, { type: 'PICK_SHIP', ship: 2 }, { type: 'PICK_SHIP', ship: 3 });
    s = { ...s, locked: [null, null, 3, null] };
    s = reducer(s, { type: 'BACKSPACE' });
    expect(s.current).toEqual([1, null, 3, null]);
    s = reducer(s, { type: 'BACKSPACE' });
    expect(s.current).toEqual([null, null, 3, null]);
    expect(reducer(s, { type: 'BACKSPACE' }).current).toEqual([null, null, 3, null]);
  });
});

describe('keyboard arrows', () => {
  test('→ and ← move the chosen spot, skipping spyglass ships; a letter there replaces the ship', () => {
    let s = play(start(), { type: 'PICK_SHIP', ship: 1 }, { type: 'PICK_SHIP', ship: 2 }); // next empty spot is 2
    s = { ...s, locked: [null, null, null, null] };
    s = reducer(s, { type: 'MOVE_CURSOR', by: -1 });
    expect(s.cursor).toBe(1);
    s = reducer(s, { type: 'PICK_SHIP', ship: 4 });
    expect(s.current).toEqual([1, 4, null, null]);
    s = { ...reducer(s, { type: 'MOVE_CURSOR', by: 1 }), locked: [null, null, null, 3], current: [1, 4, null, 3] };
    expect(s.cursor).toBe(3);
    s = reducer({ ...s, cursor: 1 }, { type: 'MOVE_CURSOR', by: 1 });
    expect(s.cursor).toBe(2);
    expect(reducer(s, { type: 'MOVE_CURSOR', by: 1 }).cursor).toBe(2); // spot 3 is a spyglass ship
  });
  test('typing into a chosen spot moves the highlight one to the right; tapping does not', () => {
    const full = play(start(), ...[0, 1, 2, 3].map((ship) => ({ type: 'PICK_SHIP', ship } as Action)));
    const keyed = reducer({ ...full, cursor: 1 }, { type: 'PICK_SHIP', ship: 4, advance: true });
    expect([keyed.current, keyed.cursor]).toEqual([[0, 4, 2, 3], 2]);
    const tapped = reducer({ ...full, cursor: 1 }, { type: 'PICK_SHIP', ship: 4 });
    expect(tapped.cursor).toBe(null);
  });
  test('Backspace clears the chosen spot and keeps it chosen', () => {
    let s = play(start(), { type: 'PICK_SHIP', ship: 1 }, { type: 'PICK_SHIP', ship: 2 }, { type: 'PICK_SHIP', ship: 3 });
    s = reducer({ ...s, cursor: 0 }, { type: 'BACKSPACE' });
    expect(s.current).toEqual([null, 2, 3, null]);
    expect(s.cursor).toBe(0);
  });
});
