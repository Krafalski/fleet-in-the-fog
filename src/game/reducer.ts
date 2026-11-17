// Everything the player can do on the board, as one state object and a list of actions.
// The reducer never knows the answer. Feedback arrives from outside (see api.ts),
// which is what lets the answer live on the server later.
import { MODES } from './game';
import type { Feedback, Mode, Ship } from './game';

export type Status = 'playing' | 'won' | 'lost';

export type GameState = {
  dateKey: string;
  mode: Mode;
  guesses: Ship[][];           // logged rows, oldest first
  feedback: Feedback[];        // feedback[i] belongs to guesses[i]
  current: (Ship | null)[];    // the row being filled in
  cursor: number | null;       // the spot the next ship goes to; null = the first empty spot
  ruledOut: Ship[];            // greyed-out ships (from hints)
  hintsUsed: number;
  status: Status;
  answer: Ship[] | null;       // only filled in once the game is over
  rounds: number;              // 1 on the first try; goes up by one with every Replay
  earlierGuesses: number;      // guesses made in rounds before this one
};

export type Action =
  | { type: 'PICK_SHIP'; ship: Ship }
  | { type: 'TAP_SLOT'; slot: number }
  | { type: 'CLEAR_ROW' }
  | { type: 'GUESS_SCORED'; guess: Ship[]; feedback: Feedback; status: Status; answer: Ship[] | null }
  | { type: 'HINT_GIVEN'; ship: Ship }
  | { type: 'REPLAY' }
  | { type: 'LOAD'; state: GameState };

function emptyRow(mode: Mode): (Ship | null)[] {
  return new Array<Ship | null>(MODES[mode].slots).fill(null);
}

export function newGame(dateKey: string, mode: Mode, ruledOut: Ship[] = []): GameState {
  return {
    dateKey, mode,
    guesses: [], feedback: [],
    current: emptyRow(mode),
    cursor: null,
    ruledOut: [...ruledOut], hintsUsed: 0,
    status: 'playing', answer: null,
    rounds: 1, earlierGuesses: 0,
  };
}

// True when every slot in the current row has a ship, so Log guess can light up.
export function canLogGuess(state: GameState): boolean {
  return state.status === 'playing' && state.current.every((s) => s !== null);
}

// True when the filled-in row is exactly a row already logged in this round.
export function alreadyGuessed(state: GameState): boolean {
  return state.guesses.some((row) => row.every((ship, i) => ship === state.current[i]));
}

// Every guess made on this puzzle, counting the rounds before a Replay.
export function totalGuesses(state: GameState): number {
  return state.earlierGuesses + state.guesses.length;
}

export function reducer(state: GameState, action: Action): GameState {
  if (action.type === 'LOAD') return action.state;

  // Replay: same puzzle, clean board. Works mid-game and after the game is over.
  // Hints stay, and the guesses already made still count toward the total.
  if (action.type === 'REPLAY') {
    return {
      ...state,
      guesses: [], feedback: [],
      current: emptyRow(state.mode),
      cursor: null,
      status: 'playing', answer: null,
      rounds: state.rounds + 1,
      earlierGuesses: totalGuesses(state),
    };
  }

  if (state.status !== 'playing') return state; // the board is frozen once the game is over

  switch (action.type) {
    case 'PICK_SHIP': {
      if (state.ruledOut.includes(action.ship)) return state;
      // The ship drops into the chosen spot, or the first empty one.
      const slot = state.cursor ?? state.current.indexOf(null);
      if (slot === -1) return state; // the row is full
      const current = [...state.current];
      current[slot] = action.ship;
      return { ...state, current, cursor: null };
    }

    case 'TAP_SLOT': {
      const { slot } = action;
      // Tapping the chosen spot again lets go of it.
      if (state.cursor === slot) return { ...state, cursor: null };
      // Tapping a ship takes it off the board; the next ship picked goes in its place.
      // Tapping an empty spot just chooses it.
      const current = [...state.current];
      current[slot] = null;
      return { ...state, current, cursor: slot };
    }

    case 'CLEAR_ROW':
      return { ...state, current: emptyRow(state.mode), cursor: null };

    case 'GUESS_SCORED':
      return {
        ...state,
        guesses: [...state.guesses, action.guess],
        feedback: [...state.feedback, action.feedback],
        current: emptyRow(state.mode),
        cursor: null,
        status: action.status,
        answer: action.answer,
      };

    case 'HINT_GIVEN': {
      if (state.ruledOut.includes(action.ship)) return state;
      return {
        ...state,
        ruledOut: [...state.ruledOut, action.ship],
        hintsUsed: state.hintsUsed + 1,
        // Take the ruled-out ship off the current row.
        current: state.current.map((s) => (s === action.ship ? null : s)),
        cursor: null,
      };
    }
  }
}
