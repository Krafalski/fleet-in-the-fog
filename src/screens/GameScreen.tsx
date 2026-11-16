// The main screen: title bar, difficulty switch, the fog, Log guess, the board, the picker.
import { useEffect, useReducer, useRef, useState } from 'react';
import { api } from '../api';
import type { Outcome } from '../api';
import { Board } from '../components/Board';
import { FogCard } from '../components/FogCard';
import { ShipPicker } from '../components/ShipPicker';
import { TopBar } from '../components/TopBar';
import { formatDate } from '../game/dates';
import { MODES } from '../game/game';
import type { Mode, Ship } from '../game/game';
import { canLogGuess, newGame, reducer } from '../game/reducer';
import type { Action, GameState } from '../game/reducer';

// How long the fog takes to lift before the results screen opens. Matches theme.css.
const FOG_LIFT_MS = 5800;
// Boats shrink a little as rows get longer.
const BOAT_SIZE: Record<Mode, number> = { easy: 1.05, medium: 0.95, hard: 0.85 };
const MODE_LIST: Mode[] = ['easy', 'medium', 'hard'];

type Props = {
  dateKey: string;  // the puzzle being played
  today: string;
  mode: Mode;
  onMode: (mode: Mode) => void;
  onOpenLog: () => void;
  onOpenFleet: () => void;
  onShowResults: (state: GameState, outcome: Outcome | null) => void;
};

// App gives this component a `key` of date + mode, so it starts fresh whenever either changes.
export function GameScreen({ dateKey, today, mode, onMode, onOpenLog, onOpenFleet, onShowResults }: Props) {
  const [state, dispatch] = useReducer(reducer, newGame(dateKey, mode));
  const [loaded, setLoaded] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  // Load the saved game once, then save after every change.
  useEffect(() => {
    let cancelled = false;
    api.loadGame(dateKey, mode).then((saved) => {
      if (cancelled) return;
      dispatch({ type: 'LOAD', state: saved });
      setLoaded(true);
    });
    return () => {
      cancelled = true;
      window.clearTimeout(timer.current);
    };
  }, [dateKey, mode]);

  useEffect(() => {
    if (loaded) api.saveGame(state);
  }, [loaded, state]);

  const over = state.status !== 'playing';
  const { maxGuesses } = MODES[mode];

  async function logGuess() {
    if (over) {
      window.clearTimeout(timer.current);
      onShowResults(state, null);
      return;
    }
    if (!canLogGuess(state)) return;
    const guess = state.current as Ship[];
    const result = await api.submitGuess(state, guess);
    const action: Action = { type: 'GUESS_SCORED', guess, ...result };
    dispatch(action);
    if (result.status !== 'playing') {
      const finished = reducer(state, action);
      const outcome = await api.recordResult(finished, today);
      // Let the fog lift, then show the results.
      timer.current = window.setTimeout(() => onShowResults(finished, outcome), FOG_LIFT_MS);
    }
  }

  async function useHint() {
    const ship = await api.askHint(state);
    if (ship !== null) dispatch({ type: 'HINT_GIVEN', ship });
  }

  const status =
    state.status === 'won' ? `Solved in ${state.guesses.length}!`
    : state.status === 'lost' ? 'The fleet slipped away'
    : `Guess ${state.guesses.length + 1} of ${maxGuesses}`;

  return (
    <main className={`screen game game--${mode}`}>
      <TopBar subtitle={`Harbor log · ${formatDate(dateKey)}`} onOpenLog={onOpenLog} onOpenFleet={onOpenFleet} />

      <div className="segmented" role="group" aria-label="Difficulty">
        {MODE_LIST.map((m) => (
          <button key={m} type="button" className={m === mode ? 'is-on' : undefined} aria-pressed={m === mode} onClick={() => onMode(m)}>
            {MODES[m].label} · {MODES[m].slots}
          </button>
        ))}
      </div>

      <FogCard state={state} boatSize={BOAT_SIZE[mode]} />

      <button type="button" className="primary-btn" onClick={logGuess} disabled={!over && !canLogGuess(state)}>
        {over ? 'See results' : 'Log guess'}
      </button>

      <Board state={state} boatSize={BOAT_SIZE[mode]} onTapSlot={(slot) => dispatch({ type: 'TAP_SLOT', slot })} />

      <div className="legend">
        <span><i className="peg peg--exact" />Right ship, right spot</span>
        <span><i className="peg peg--near" />Wrong spot</span>
        <strong>{status}</strong>
      </div>

      <ShipPicker selected={state.selected} ruledOut={state.ruledOut} disabled={over} onPick={(ship) => dispatch({ type: 'PICK_SHIP', ship })} />

      <div className="actions">
        <button type="button" className="outline-btn" onClick={useHint} disabled={over}>
          {state.hintsUsed ? `Hint · ${state.hintsUsed} used` : 'Hint'}
        </button>
        <button type="button" className="link-btn" onClick={() => dispatch({ type: 'CLEAR_ROW' })} disabled={over}>Clear row</button>
      </div>
    </main>
  );
}
