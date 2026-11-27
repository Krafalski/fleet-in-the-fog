// Everything the player can do on the board, as one state object and a list of actions.
// The reducer never knows the answer. Feedback arrives from outside (see api.ts),
// which is what lets the answer live on the server later.
import { MODES, rowsFor } from './game';
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
  markedIn?: Ship[];           // ships brought back by a long press even though their ✕ flags would grey them (long press wins)
  // Keep trying after a loss: the row each new try starts on. Every try adds KEEP_TRYING_ROWS rows under the old ones.
  tries?: number[];
};

// Rows added each time the player taps Keep trying after a loss.
export const KEEP_TRYING_ROWS = 10;

// How many rows this board has right now: the mode's rows, plus 10 for every Keep trying.
export function boardRows(state: GameState): number {
  const tries = state.tries ?? [];
  // The first try's rows are settled once it ends, so measure them at the row where try 2 began.
  const first = tries.length
    ? rowsFor(state.mode, state.perSpot, tries[0], false)
    : rowsFor(state.mode, state.perSpot, state.guesses.length, state.status === 'playing');
  return first + KEEP_TRYING_ROWS * tries.length;
}

// The try a row belongs to: 0 for the first try, 1 after the first Keep trying, and so on.
export function tryOfRow(state: GameState, row: number): number {
  return (state.tries ?? []).filter((start) => row >= start).length;
}
// ● sure it's right here · ○ in the fleet but somewhere else · ✕ not in the fleet (same idea as the anchors)
export type NoteFlag = 'exact' | 'near' | 'no';
const NOTE_CYCLE: (NoteFlag | undefined)[] = [undefined, 'exact', 'near', 'no'];

export type Action =
  | { type: 'PICK_SHIP'; ship: Ship; advance?: boolean } // advance (keyboard): the chosen spot moves one to the right, like typing
  | { type: 'TAP_SLOT'; slot: number }
  | { type: 'CLEAR_ROW' }
  | { type: 'BACKSPACE' }                  // keyboard: clear the chosen spot, or else take off the rightmost ship (spyglass ships stay)
  | { type: 'MOVE_CURSOR'; by: -1 | 1 }    // keyboard arrows: choose the spot to the left or right (skips spyglass ships)
  // carry: start the next row with the ships that were in the right spot (Easy and per-spot Practice only).
  | { type: 'GUESS_SCORED'; guess: Ship[]; feedback: Feedback; status: Status; answer: Ship[] | null; carry?: boolean }
  | { type: 'HINT_GIVEN'; ship: Ship }
  | { type: 'REPLAY' }
  | { type: 'KEEP_TRYING'; carry?: boolean } // after a loss: 10 more rows under the old ones, same puzzle (carry: like GUESS_SCORED)
  | { type: 'GAVE_UP'; answer: Ship[] }   // practice only: end the game and show the fleet
  | { type: 'SET_PER_SPOT'; perSpot: boolean } // practice only: the feedback toggle
  | { type: 'REVEAL' }                     // after a loss: lift the fog and show the fleet
  | { type: 'TOGGLE_OUT'; ship: Ship; greyed?: boolean } // long press on a ship button: grey it out, or (if greyed now, by hand or by flags) back in
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
      markedOut: [], markedIn: [], // ...and a clean tray (Lookout's ruled-out ships stay: they were paid for)
      tries: [],
    };
  }

  // Keep trying: only after a loss with the fleet still hidden. Every guess and note flag stays,
  // and 10 new rows open under them. The result already saved for the day doesn't change.
  if (action.type === 'KEEP_TRYING') {
    if (state.status !== 'lost' || state.revealed) return state;
    // With "keep ships in the right spot" on, the first new row starts with the last row's right-spot ships, like any other row.
    const last = state.guesses.length - 1;
    const spots = state.feedback[last]?.spots;
    return {
      ...state,
      status: 'playing', answer: null,
      current: action.carry && spots
        ? state.guesses[last].map((ship, i) => (spots[i] === 'exact' || isLocked(state, i) ? ship : null))
        : startRow(state),
      cursor: null,
      tries: [...(state.tries ?? []), state.guesses.length],
    };
  }

  // Only once the game is over: the fleet is shown.
  if (action.type === 'REVEAL') return state.status === 'playing' ? state : { ...state, revealed: true };

  // Only changes how feedback is drawn, so it works at any time, even after the game is over.
  if (action.type === 'SET_PER_SPOT') return { ...state, perSpot: action.perSpot };

  if (state.status !== 'playing') return state; // the board is frozen once the game is over

  if (action.type === 'GAVE_UP') return { ...state, status: 'lost', answer: action.answer, cursor: null, revealed: true };

  switch (action.type) {
    case 'PICK_SHIP': {
      if (state.ruledOut.includes(action.ship)) return state;
      // The ship drops into the chosen spot, or the first empty one.
      const slot = state.cursor ?? state.current.indexOf(null);
      if (slot === -1) return state; // the row is full
      if (isLocked(state, slot)) return state; // a spyglass ship can't be replaced
      const current = [...state.current];
      current[slot] = action.ship;
      if (action.advance && state.cursor !== null) {
        // Keyboard, with a spot chosen by the arrows: move on to the next spot to the right (skipping spyglass ships).
        for (let i = slot + 1; i < current.length; i++) if (!isLocked(state, i)) return { ...state, current, cursor: i };
      }
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

    case 'MOVE_CURSOR': {
      const n = state.current.length;
      const empty = state.current.indexOf(null);
      // Start from the highlighted spot: the chosen one, or else the next empty one. A full row starts from its edge.
      const at = state.cursor ?? (empty !== -1 ? empty : action.by === 1 ? -1 : n);
      for (let i = at + action.by; i >= 0 && i < n; i += action.by) {
        if (!isLocked(state, i)) return { ...state, cursor: i };
      }
      return state;
    }

    case 'BACKSPACE': {
      if (state.cursor !== null) {
        if (isLocked(state, state.cursor)) return state;
        const current = [...state.current];
        current[state.cursor] = null;
        return { ...state, current };
      }
      for (let i = state.current.length - 1; i >= 0; i--) {
        if (state.current[i] === null || isLocked(state, i)) continue;
        const current = [...state.current];
        current[i] = null;
        return { ...state, current, cursor: null };
      }
      return state;
    }

    case 'TOGGLE_OUT': {
      const marked = state.markedOut ?? [];
      const kept = state.markedIn ?? [];
      const greyed = action.greyed ?? marked.includes(action.ship);
      return greyed
        ? { ...state, markedOut: marked.filter((s) => s !== action.ship), markedIn: [...kept.filter((s) => s !== action.ship), action.ship] }
        : { ...state, markedOut: [...marked.filter((s) => s !== action.ship), action.ship], markedIn: kept.filter((s) => s !== action.ship) };
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

// Which ships the player's ✕ flags rule out. A ship is out only when, in some finished row, every one of it in
// that row has a ✕ (✕ on two of three coral yachts means "only one coral", so coral stays). Any ● or ○ on a
// ship, in any row, means it's in the fleet, so its ✕ flags never grey it.
export function flaggedOut(state: Pick<GameState, 'guesses' | 'notes'>): Ship[] {
  const notes = state.notes ?? {};
  const inFleet = new Set<Ship>();
  for (const [key, flag] of Object.entries(notes)) {
    const [row, spot] = key.split(':').map(Number);
    const ship = state.guesses[row]?.[spot];
    if (ship != null && (flag === 'exact' || flag === 'near')) inFleet.add(ship);
  }
  const out = new Set<Ship>();
  state.guesses.forEach((guess, row) => {
    const seen = new Map<Ship, boolean>(); // ship -> every one in this row has a ✕
    guess.forEach((ship, spot) => seen.set(ship, (seen.get(ship) ?? true) && notes[`${row}:${spot}`] === 'no'));
    for (const [ship, allX] of seen) if (allX && !inFleet.has(ship)) out.add(ship);
  });
  return [...out].sort((a, b) => a - b);
}
