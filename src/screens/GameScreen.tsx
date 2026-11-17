// The main screen: title bar, difficulty switch, the fog, Log guess, the board, the picker.
// When the game is over, the board, picker and Hint give way to the day's numbers (DayPanel).
// The finished board is one tap away ("Show my guesses"), shown locked so it can't be mistaken for a live game.
// Practice is different: a random fleet that never counts, with New game, Give up and a feedback toggle,
// and the board stays on screen when it ends.
import { useEffect, useReducer, useRef, useState } from 'react';
import { api, newPracticeKey } from '../api';
import type { Outcome } from '../api';
import { AnchorMark, Board } from '../components/Board';
import { DayPanel } from '../components/DayPanel';
import { FogCard } from '../components/FogCard';
import { ShipPicker } from '../components/ShipPicker';
import { TopBar } from '../components/TopBar';
import { testGame } from '../config';
import { formatDate } from '../game/dates';
import { MODES, MODE_LIST } from '../game/game';
import type { Mode, Ship } from '../game/game';
import { alreadyGuessed, canLogGuess, newGame, reducer, totalGuesses } from '../game/reducer';
import type { Action } from '../game/reducer';

// Boats shrink a little as rows get longer.
const BOAT_SIZE: Record<Mode, number> = { easy: 1.05, hard: 0.95, practice: 0.95 };
// The moment a game ends: pegs light up, the fog lifts, a banner shows, then the day's results take over.
const ENDING_MS = 3400;
// How long "Already played" stays on the Log guess button.
const ALREADY_PLAYED_MS = 2000;
// Two taps on Replay closer together than this skip the "are you sure" question.
const DOUBLE_TAP_MS = 400;

type Props = {
  dateKey: string;  // the puzzle being played
  today: string;
  mode: Mode;
  onMode: (mode: Mode) => void;
  onOpenLog: () => void;
  onOpenFleet: () => void;
};

// App gives this component a `key` of date + mode, so it starts fresh whenever either changes.
export function GameScreen({ dateKey, today, mode, onMode, onOpenLog, onOpenFleet }: Props) {
  const [state, dispatch] = useReducer(reducer, newGame(dateKey, mode));
  const [loaded, setLoaded] = useState(false);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [askReplay, setAskReplay] = useState(false);
  const [showGuesses, setShowGuesses] = useState(false); // the finished board, in place of the results
  const [ending, setEnding] = useState(false);            // true for a few seconds right after the last guess
  const [repeat, setRepeat] = useState(false);            // true while "Already played" shows
  const endTimer = useRef<number | undefined>(undefined);
  const repeatTimer = useRef<number | undefined>(undefined);
  useEffect(() => () => { window.clearTimeout(endTimer.current); window.clearTimeout(repeatTimer.current); }, []);
  const lastReplayTap = useRef(0);
  const [askGiveUp, setAskGiveUp] = useState(false);
  const practice = mode === 'practice';

  // Load the saved game once, then save after every change.
  useEffect(() => {
    let cancelled = false;
    api.loadGame(dateKey, mode).then((saved) => {
      if (cancelled) return;
      dispatch({ type: 'LOAD', state: saved });
      setLoaded(true);
    });
    return () => { cancelled = true; };
  }, [dateKey, mode]);

  useEffect(() => {
    if (loaded) api.saveGame(state);
  }, [loaded, state]);

  const over = state.status !== 'playing';
  const replaying = state.rounds > 1 && !practice; // the whole board goes grey during a replay, so it's clear it doesn't count
  const { maxGuesses } = MODES[mode];

  async function logGuess() {
    if (!canLogGuess(state)) return;
    if (alreadyGuessed(state)) {
      // Same row as one already played: say so for a moment, and don't log it.
      setRepeat(true);
      window.clearTimeout(repeatTimer.current);
      repeatTimer.current = window.setTimeout(() => setRepeat(false), ALREADY_PLAYED_MS);
      return;
    }
    const guess = state.current as Ship[];
    const result = await api.submitGuess(state, guess);
    const action: Action = { type: 'GUESS_SCORED', guess, ...result };
    dispatch(action);
    if (result.status !== 'playing') {
      setEnding(true);
      endTimer.current = window.setTimeout(() => setEnding(false), ENDING_MS);
      if (!practice) setOutcome(await api.recordResult(reducer(state, action), today));
    }
  }

  async function useHint() {
    const ship = await api.askHint(state);
    if (ship !== null) dispatch({ type: 'HINT_GIVEN', ship });
  }

  function replay() {
    setAskReplay(false);
    setOutcome(null);
    setShowGuesses(false);
    setEnding(false);
    window.clearTimeout(endTimer.current);
    dispatch({ type: 'REPLAY' });
  }

  // Practice: a new random fleet. The feedback toggle carries over.
  function newPractice() {
    setAskGiveUp(false);
    setEnding(false);
    window.clearTimeout(endTimer.current);
    dispatch({ type: 'LOAD', state: { ...newGame(newPracticeKey(), 'practice'), perSpot: state.perSpot } });
  }

  async function giveUp() {
    setAskGiveUp(false);
    dispatch({ type: 'GAVE_UP', answer: await api.revealAnswer(state) });
  }

  // One tap asks first. A quick second tap means "yes, I'm sure".
  // Practice never counts, so there it just starts over.
  function tapReplay() {
    if (practice) return replay();
    const now = Date.now();
    if (now - lastReplayTap.current < DOUBLE_TAP_MS) replay();
    else setAskReplay(true);
    lastReplayTap.current = now;
  }

  // During a replay, count only this round's guesses.
  const shown = replaying ? state.guesses.length : totalGuesses(state);
  const status =
    state.status === 'won' ? `Solved in ${shown}!`
    : state.status === 'lost' ? 'Slipped away'
    : `${replaying ? 'Replay · ' : ''}Guess ${state.guesses.length + 1} of ${maxGuesses}`;

  const replayConfirm = askReplay && (
    <div className="confirm" role="alertdialog" aria-label="Replay this puzzle?">
      <p><strong>Are you sure?</strong> Only the first game will count.</p>
      <div className="confirm__buttons">
        <button type="button" className="outline-btn" onClick={() => setAskReplay(false)}>Keep playing</button>
        <button type="button" className="primary-btn primary-btn--small" onClick={replay}>Replay</button>
      </div>
    </div>
  );

  const giveUpConfirm = askGiveUp && (
    <div className="confirm" role="alertdialog" aria-label="Give up?">
      <p><strong>Give up?</strong> The fog lifts and shows the fleet.</p>
      <div className="confirm__buttons">
        <button type="button" className="outline-btn" onClick={() => setAskGiveUp(false)}>Keep playing</button>
        <button type="button" className="primary-btn primary-btn--small" onClick={giveUp}>Show the fleet</button>
      </div>
    </div>
  );

  // The legend matches how feedback is drawn right now.
  const legend = (
    <div className="legend">
      {state.perSpot ? (
        <>
          <span><AnchorMark kind="exact" size={18} />Right spot</span>
          <span><AnchorMark kind="near" size={18} />Wrong spot</span>
          <span className="legend__none">None: not in fleet</span>
        </>
      ) : (
        <>
          <span><i className="peg peg--exact" />Right ship, right spot</span>
          <span><i className="peg peg--near" />Wrong spot</span>
        </>
      )}
      {!over && <strong>{status}</strong>}
    </div>
  );
  const legendNote = state.perSpot
    ? <p className="legend__note">Each mark sits under its ship.</p>
    : <p className="legend__note">Marks are totals for the row, in no order.</p>;

  return (
    <main className={`screen game game--${mode}${testGame ? ' is-test' : ''}${replaying ? ' is-replay' : ''}`}>
      <TopBar subtitle={practice ? 'Practice · a new fleet every game' : `Harbor log · ${formatDate(dateKey)}`} onOpenLog={onOpenLog} onOpenFleet={onOpenFleet} />

      <div className="segmented" role="group" aria-label="Difficulty">
        {MODE_LIST.map((m) => (
          <button key={m} type="button" className={m === mode ? 'is-on' : undefined} aria-pressed={m === mode} onClick={() => onMode(m)}>
            {MODES[m].label} · {MODES[m].slots}
          </button>
        ))}
        <button type="button" className={practice ? 'is-on' : undefined} aria-pressed={practice} onClick={() => onMode('practice')}>
          Practice
        </button>
      </div>

      {practice && (
        <div className="feedback-toggle" role="group" aria-label="Feedback">
          <span>Feedback</span>
          <button type="button" className={state.perSpot ? 'is-on' : undefined} aria-pressed={state.perSpot} onClick={() => dispatch({ type: 'SET_PER_SPOT', perSpot: true })}>Under each ship</button>
          <button type="button" className={!state.perSpot ? 'is-on' : undefined} aria-pressed={!state.perSpot} onClick={() => dispatch({ type: 'SET_PER_SPOT', perSpot: false })}>Totals only</button>
        </div>
      )}

      <FogCard state={state} boatSize={BOAT_SIZE[mode]} />

      {practice ? (
        <>
          {ending ? (
            <button type="button" className={`end-banner end-banner--${state.status}`} onClick={() => { window.clearTimeout(endTimer.current); setEnding(false); }}>
              <strong>{state.status === 'won' ? 'Fleet found!' : 'The fleet slipped away'}</strong>
              <span>{state.status === 'won' ? `Solved in ${state.guesses.length}` : 'The fog lifts…'}</span>
            </button>
          ) : over ? (
            <button type="button" className="primary-btn" onClick={newPractice}>
              {state.status === 'won' ? `Solved in ${state.guesses.length}! · New game` : 'New game'}
            </button>
          ) : (
            <button type="button" className={`primary-btn${repeat ? ' primary-btn--repeat' : ''}`} onClick={logGuess} disabled={!canLogGuess(state)}>
              {repeat ? 'Already played' : 'Log guess'}
            </button>
          )}

          <Board state={state} boatSize={BOAT_SIZE[mode]} onTapSlot={(slot) => dispatch({ type: 'TAP_SLOT', slot })} lastRow={ending ? state.status : undefined} />
          {legend}
          {legendNote}
          <ShipPicker ships={MODES[mode].ships} ruledOut={state.ruledOut} disabled={over} onPick={(ship) => dispatch({ type: 'PICK_SHIP', ship })} />

          {!ending && (
            <div className="actions">
              {giveUpConfirm}
              <div className="actions__left">
                {!over && (
                  <button type="button" className="outline-btn" onClick={useHint}>
                    {state.hintsUsed ? `Hint · ${state.hintsUsed} used` : 'Hint'}
                  </button>
                )}
                <button type="button" className="outline-btn" onClick={tapReplay}>Replay</button>
                {!over && <button type="button" className="outline-btn" onClick={newPractice}>New game</button>}
              </div>
              {!over && <button type="button" className="link-btn" onClick={() => setAskGiveUp(true)}>Give up</button>}
            </div>
          )}
        </>
      ) : over && !ending ? (
        <>
          {showGuesses ? (
            <section className="board-final" aria-label="Finished board">
              <button type="button" className="outline-btn" onClick={() => setShowGuesses(false)}>Back to the day's results</button>
              <p className="board-final__tag">Finished board · {state.status === 'won' ? 'solved' : 'slipped away'} · can't be changed</p>
              <Board state={state} boatSize={BOAT_SIZE[mode]} onTapSlot={() => {}} />
              {legend}
            </section>
          ) : (
            <>
              <DayPanel state={state} outcome={outcome} today={today} onMode={onMode} onOpenLog={onOpenLog} onOpenFleet={onOpenFleet} />
              <button type="button" className="outline-btn" onClick={() => setShowGuesses(true)}>Show my guesses</button>
            </>
          )}
          <div className="actions">
            {replayConfirm}
            <div className="actions__left">
              <button type="button" className="outline-btn replay-btn" onClick={tapReplay}>Replay</button>
            </div>
          </div>
        </>
      ) : (
        <>
          {ending ? (
            // The game just ended: a banner where Log guess was. Tap it to skip ahead.
            <button type="button" className={`end-banner end-banner--${state.status}`} onClick={() => { window.clearTimeout(endTimer.current); setEnding(false); }}>
              <strong>{state.status === 'won' ? (replaying ? 'Replay solved!' : 'Fleet found!') : 'The fleet slipped away'}</strong>
              <span>{state.status === 'won' ? `Solved in ${shown}` : 'The fog lifts…'}</span>
            </button>
          ) : (
            <button type="button" className={`primary-btn${repeat ? ' primary-btn--repeat' : ''}`} onClick={logGuess} disabled={!canLogGuess(state)}>
              {repeat ? 'Already played' : 'Log guess'}
            </button>
          )}

          {testGame && <p className="test-tag">Test game: the answer is all junks</p>}
          <Board state={state} boatSize={BOAT_SIZE[mode]} onTapSlot={(slot) => dispatch({ type: 'TAP_SLOT', slot })} lastRow={ending ? state.status : undefined} />

          {legend}
          {state.guesses.length === 0 && legendNote}

          <ShipPicker ships={MODES[mode].ships} ruledOut={state.ruledOut} disabled={over} onPick={(ship) => dispatch({ type: 'PICK_SHIP', ship })} />

          {!ending && (
            <div className="actions">
              {replayConfirm}
              <div className="actions__left">
                <button type="button" className="outline-btn" onClick={useHint}>
                  {state.hintsUsed ? `Hint · ${state.hintsUsed} used` : 'Hint'}
                </button>
                <button type="button" className="outline-btn replay-btn" onClick={tapReplay}>Replay</button>
              </div>
              <button type="button" className="link-btn" onClick={() => dispatch({ type: 'CLEAR_ROW' })}>Clear row</button>
            </div>
          )}
        </>
      )}
    </main>
  );
}
