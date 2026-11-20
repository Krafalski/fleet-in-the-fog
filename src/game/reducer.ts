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
  perSpot: boolean;            // feedback marks under each ship (true) or totals at the end of the row
  revealed: boolean;           // after a daily loss, the fleet stays in the fog until the player asks to see it
  // Spyglass (Hard, and Practice with totals only): spots a right-spot ship and locks it in place for the rest of the game.
  locked: (Ship | null)[];     // locked[i] = the ship locked in spot i, or null
  spyglasses: number;          // spyglasses used in this game
  spyglassPoints: number;      // what they added to the score (0 for a golden one, 2 for a regular one)
  // The player's own note flags on finished rows, keyed "row:spot". The game never checks them.
  notes: Record<string, NoteFlag>;
  markedOut: Ship[];           // ships the player marked as out with a long press (notes only; still pickable)
};
// ● sure it's right here · ○ in the fleet but somewhere else · ✕ not in the fleet (same idea as the anchors)
export type NoteFlag = 'exact' | 'near' | 'no';
const NOTE_CYCLE: (NoteFlag | undefined)[] = [undefined, 'exact', 'near', 'no'];

export type Action =
  | { type: 'PICK_SHIP'; ship: Ship }
  | { type: 'TAP_SLOT'; slot: number }
  | { type: 'CLEAR_ROW' }
  // carry: start the next row with the ships that were in the right spot (Easy and per-spot Practice only).
  | { type: 'GUESS_SCORED'; guess: Ship[]; feedback: Feedback; status: Status; answer: Ship[] | null; carry?: boolean }
  | { type: 'HINT_GIVEN'; ship: Ship }
  | { type: 'REPLAY' }
  | { type: 'GAVE_UP'; answer: Ship[] }   // practice only: end the game and show the fleet
  | { type: 'SET_PER_SPOT'; perSpot: boolean } // practice only: the feedback toggle
  | { type: 'REVEAL' }                     // after a loss: lift the fog and show the fleet
  | { type: 'TOGGLE_OUT'; ship: Ship } // long press on a ship button: mark it out, or back in
  | { type: 'NOTE'; row: number; spot: number } // flag a ship in a finished row: next flag in the cycle
  | { type: 'MOVE_SHIP'; from: number; to: number } // drag a ship in the current row: swaps with whatever is there
  | { type: 'SPYGLASS'; spot: number; ship: Ship; cost: number } // lock a right-spot ship in place
  | { type: 'LOAD'; state: GameState };

function emptyRow(mode: Mode): (Ship | null)[] {
  return new Array<Ship | null>(MODES[mode].slots).fill(null);
}

// A new row: empty, except for ships the spyglass locked in place.
function startRow(state: GameState): (Ship | null)[] {
  return emptyRow(state.mode).map((_, i) => state.locked?.[i] ?? null);
}
const isLocked = (state: GameState, slot: number) => state.locked?.[slot] != null;

export function newGame(dateKey: string, mode: Mode, ruledOut: Ship[] = []): GameState {
  return {
    dateKey, mode,
    guesses: [], feedback: [],
    current: emptyRow(mode),
    cursor: null,
    ruledOut: [...ruledOut], hintsUsed: 0,
    status: 'playing', answer: null,
    rounds: 1, earlierGuesses: 0,
    perSpot: MODES[mode].perSpot,
    revealed: false,
    locked: emptyRow(mode),
    spyglasses: 0, spyglassPoints: 0,
    notes: {},
    markedOut: [],
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
      current: startRow(state), // spyglass locks stay, like hints
      cursor: null,
      status: 'playing', answer: null,
      rounds: state.rounds + 1,
      earlierGuesses: totalGuesses(state),
      revealed: false,
      notes: {}, // a new round starts with a clean board
    };
  }

  // Only once the game is over: the fleet is shown.
  if (action.type === 'REVEAL') return state.status === 'playing' ? state : { ...state, revealed: true };

  // Only changes how feedback is drawn, so it works at any time, even after the game is over.
  if (action.type === 'SET_PER_SPOT') return { ...state, perSpot: action.perSpot };

  if (state.status !== 'playing') return state; // the board is frozen once the game is over

  if (action.type === 'GAVE_UP') return { ...state, status: 'lost', answer: action.answer, cursor: null };

  switch (action.type) {
    case 'PICK_SHIP': {
      if (state.ruledOut.includes(action.ship)) return state;
      // The ship drops into the chosen spot, or the first empty one.
      const slot = state.cursor ?? state.current.indexOf(null);
      if (slot === -1) return state; // the row is full
      if (isLocked(state, slot)) return state; // a spyglass ship can't be replaced
      const current = [...state.current];
      current[slot] = action.ship;
      return { ...state, current, cursor: null };
    }

    case 'TAP_SLOT': {
      const { slot } = action;
      if (isLocked(state, slot)) return state; // spyglass ships stay put
      // Tapping the chosen spot again lets go of it.
      if (state.cursor === slot) return { ...state, cursor: null };
      // Tapping a ship takes it off the board; the next ship picked goes in its place.
      // Tapping an empty spot just chooses it.
      const current = [...state.current];
      current[slot] = null;
      return { ...state, current, cursor: slot };
    }

    case 'TOGGLE_OUT': {
      const marked = state.markedOut ?? [];
      return { ...state, markedOut: marked.includes(action.ship) ? marked.filter((s) => s !== action.ship) : [...marked, action.ship] };
    }

    case 'NOTE': {
      if (action.row >= state.guesses.length) return state; // finished rows only
      const key = `${action.row}:${action.spot}`;
      const notes = { ...(state.notes ?? {}) };
      const next = NOTE_CYCLE[(NOTE_CYCLE.indexOf(notes[key]) + 1) % NOTE_CYCLE.length];
      if (next) notes[key] = next; else delete notes[key];
      return { ...state, notes };
    }

    case 'MOVE_SHIP': {
      const { from, to } = action;
      if (from === to || isLocked(state, from) || isLocked(state, to) || state.current[from] === null) return state;
      const current = [...state.current];
      [current[from], current[to]] = [current[to], current[from]]; // an empty spot just takes the ship
      return { ...state, current, cursor: null };
    }

    case 'CLEAR_ROW':
      return { ...state, current: startRow(state), cursor: null };

    case 'GUESS_SCORED':
      return {
        ...state,
        guesses: [...state.guesses, action.guess],
        feedback: [...state.feedback, action.feedback],
        current: action.carry && action.feedback.spots
          ? action.guess.map((ship, i) => (action.feedback.spots![i] === 'exact' || isLocked(state, i) ? ship : null))
          : startRow(state),
        cursor: null,
        status: action.status,
        answer: action.answer,
      };

    case 'SPYGLASS': {
      if (isLocked(state, action.spot)) return state;
      const locked = [...(state.locked ?? emptyRow(state.mode))];
      locked[action.spot] = action.ship;
      const current = [...state.current];
      current[action.spot] = action.ship;
      return {
        ...state, locked, current, cursor: null,
        spyglasses: (state.spyglasses ?? 0) + 1,
        spyglassPoints: (state.spyglassPoints ?? 0) + action.cost,
      };
    }

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
