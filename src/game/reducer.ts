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
  selected: Ship | null;       // ship chosen in the picker
  held: number | null;         // index of a placed ship the player has picked up
  ruledOut: Ship[];            // greyed-out ships (hard mode's free one, plus hints)
  hintsUsed: number;
  status: Status;
  answer: Ship[] | null;       // only filled in once the game is over
};

export type Action =
  | { type: 'PICK_SHIP'; ship: Ship }
  | { type: 'TAP_SLOT'; slot: number }
  | { type: 'CLEAR_ROW' }
  | { type: 'GUESS_SCORED'; guess: Ship[]; feedback: Feedback; status: Status; answer: Ship[] | null }
  | { type: 'HINT_GIVEN'; ship: Ship }
  | { type: 'LOAD'; state: GameState };

function emptyRow(mode: Mode): (Ship | null)[] {
  return new Array<Ship | null>(MODES[mode].slots).fill(null);
}

export function newGame(dateKey: string, mode: Mode, ruledOut: Ship[] = []): GameState {
  return {
    dateKey, mode,
    guesses: [], feedback: [],
    current: emptyRow(mode),
    selected: null, held: null,
    ruledOut: [...ruledOut], hintsUsed: 0,
    status: 'playing', answer: null,
  };
}

// True when every slot in the current row has a ship, so Log guess can light up.
export function canLogGuess(state: GameState): boolean {
  return state.status === 'playing' && state.current.every((s) => s !== null);
}

export function reducer(state: GameState, action: Action): GameState {
  if (action.type === 'LOAD') return action.state;
  if (state.status !== 'playing') return state; // the board is frozen once the game is over

  switch (action.type) {
    case 'PICK_SHIP': {
      if (state.ruledOut.includes(action.ship)) return state;
      // Holding a placed ship and tapping the picker replaces that ship.
      if (state.held !== null) {
        const current = [...state.current];
        current[state.held] = action.ship;
        return { ...state, current, held: null, selected: action.ship };
      }
      return { ...state, selected: action.ship };
    }

    case 'TAP_SLOT': {
      const { slot } = action;
      const current = [...state.current];
      // Tapping the held ship again clears it.
      if (state.held === slot) {
        current[slot] = null;
        return { ...state, current, held: null };
      }
      // Holding one ship and tapping another slot swaps them (or moves into an empty slot).
      if (state.held !== null) {
        [current[state.held], current[slot]] = [current[slot], current[state.held]];
        return { ...state, current, held: null };
      }
      // Tapping a filled slot picks that ship up.
      if (current[slot] !== null) return { ...state, held: slot };
      // Tapping an empty slot places the selected ship.
      if (state.selected === null) return state;
      current[slot] = state.selected;
      return { ...state, current };
    }

    case 'CLEAR_ROW':
      return { ...state, current: emptyRow(state.mode), held: null };

    case 'GUESS_SCORED':
      return {
        ...state,
        guesses: [...state.guesses, action.guess],
        feedback: [...state.feedback, action.feedback],
        current: emptyRow(state.mode),
        held: null,
        status: action.status,
        answer: action.answer,
      };

    case 'HINT_GIVEN': {
      if (state.ruledOut.includes(action.ship)) return state;
      return {
        ...state,
        ruledOut: [...state.ruledOut, action.ship],
        hintsUsed: state.hintsUsed + 1,
        // Take the ruled-out ship off the current row and out of the picker.
        current: state.current.map((s) => (s === action.ship ? null : s)),
        selected: state.selected === action.ship ? null : state.selected,
        held: null,
      };
    }
  }
}
