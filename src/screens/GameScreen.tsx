// The main screen: title bar, difficulty switch, the fog, Log guess, the board, the picker.
// When the game is over, the board, picker and Hint give way to the day's numbers (DayPanel).
// The finished board is one tap away ("Show my guesses"), shown locked so it can't be mistaken for a live game.
// Practice is different: a random fleet that never counts, with New game, Give up and a feedback toggle,
// and the board stays on screen when it ends.
import { useEffect, useReducer, useRef, useState } from 'react';
import { api, newPracticeKey } from '../api';
import { loadPrefs, savePrefs } from '../prefs';
import { NoteFlag } from '../components/NoteFlag';
import type { Outcome, SpyglassCheck } from '../api';
import { Spyglass } from '../Spyglass';
import { AnchorMark, Board, MiniAnchor as MiniAnchorIcon } from '../components/Board';
import { DayPanel } from '../components/DayPanel';
import { FogCard } from '../components/FogCard';
import { Scenery } from '../Scenery';
import { ShipPicker } from '../components/ShipPicker';
import { SHIP_KINDS, SHIP_NAMES } from '../Boat';
import { TopBar } from '../components/TopBar';
import { testGame } from '../config';
import { formatDate } from '../game/dates';
import { MODES, MODE_LIST, SPYGLASS_COST, gameScore, isPractice, rowsFor } from '../game/game';
import { FLAG_TAP } from '../config';
import type { DailyMode, Mode, Ship, PracticeMode } from '../game/game';
import { alreadyGuessed, canLogGuess, newGame, reducer, totalGuesses } from '../game/reducer';
import type { Action } from '../game/reducer';

// Boats shrink a little as rows get longer.
const BOAT_SIZE: Record<Mode, number> = { easy: 1.25, hard: 0.95, 'practice-easy': 1.25, 'practice-hard': 0.95 };
// The moment a game ends: pegs light up, the fog lifts, a banner shows, then the day's results take over.
const ENDING_MS = 1900; // the sail-home / sink animation; then the result popup
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
  onOpenFleet: (focus?: string) => void;
  onPlayDay: (dateKey: string, mode: DailyMode) => void;
  onOpenHelp: () => void; // the message-in-a-bottle button: How to play
};

// App gives this component a `key` of date + mode, so it starts fresh whenever either changes.
export function GameScreen({ dateKey, today, mode, onMode, onOpenLog, onOpenFleet, onOpenHelp, onPlayDay }: Props) {
  const [state, dispatch] = useReducer(reducer, newGame(dateKey, mode));
  const [loaded, setLoaded] = useState(false);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [askReplay, setAskReplay] = useState(false);
  const [showGuesses, setShowGuesses] = useState(false); // the finished board, in place of the results
  const [ending, setEnding] = useState(false);            // true for a few seconds right after the last guess
  const [repeat, setRepeat] = useState(false);            // true while "Already played" shows
  const endTimer = useRef<number | undefined>(undefined);
  const [endPopup, setEndPopup] = useState(false); // the result popup after the end animation
  const repeatTimer = useRef<number | undefined>(undefined);
  useEffect(() => () => { window.clearTimeout(endTimer.current); window.clearTimeout(repeatTimer.current); }, []);
  const lastReplayTap = useRef(0);
  const [askGiveUp, setAskGiveUp] = useState(false);
  const [carry, setCarry] = useState(() => loadPrefs().carry);
  // The albatross note: how many the player has sighted. null = no note; 0 = a Practice albatross (shown, not counted).
  // Stays until the next guess is logged.
  const [albatross, setAlbatross] = useState<number | null>(null);
  const practice = isPractice(mode);
  // Practice sizes: remembered, so the Practice button goes back to the last one used.
  function openPractice(size: PracticeMode) {
    savePrefs({ ...loadPrefs(), practice: size });
    onMode(size);
  }

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
  const maxGuesses = rowsFor(mode, state.perSpot, state.guesses.length);

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
    const { albatross: sawAlbatross, ...scored } = result;
    const action: Action = { type: 'GUESS_SCORED', guess, ...scored, carry: carry && state.perSpot };
    setAlbatross(sawAlbatross ?? null);
    setSpyNote('');
    dispatch(action);
    if (result.status !== 'playing') {
      setEnding(true);
      endTimer.current = window.setTimeout(() => { setEnding(false); setEndPopup(true); }, ENDING_MS);
      if (!practice) setOutcome(await api.recordResult(reducer(state, action), today));
    }
  }

  // Hints run out once every ship that isn't in the fleet is greyed out.
  // Ask ahead (asking changes nothing) so the button can grey out the moment the last one is used.
  const [hintsLeft, setHintsLeft] = useState(true);
  useEffect(() => {
    let live = true;
    api.askHint(state).then((ship) => { if (live) setHintsLeft(ship !== null); });
    return () => { live = false; };
  }, [state.ruledOut.length, state.dateKey, state.mode]);

  // The spyglass (Hard, and Practice with totals only): asked ahead, like the hint, so the button shows what it would cost.
  const [spy, setSpy] = useState<SpyglassCheck | null>(null);
  const [spyNote, setSpyNote] = useState('');
  useEffect(() => {
    let live = true;
    api.checkSpyglass(state).then((check) => { if (live) setSpy(check); });
    return () => { live = false; };
  }, [state.guesses.length, state.locked?.join(','), state.status, state.perSpot, state.rounds, state.dateKey, state.mode]);

  async function useSpyglass() {
    if (!spy?.available) return;
    const used = await api.useSpyglass(state, today);
    if (!used) return;
    dispatch({ type: 'SPYGLASS', spot: used.spot, ship: used.ship, cost: used.cost });
    // One line under the board. When the last golden one is gone, it also says when more come.
    const left = used.golden ? spy.goldenLeft - 1 : 0;
    const more = spy.nextBoat
      ? `Next golden spyglass comes with the ${spy.nextBoat.name.toLowerCase()}, in ${spy.nextBoat.days} ${spy.nextBoat.days === 1 ? 'day' : 'days'}.`
      : 'You have every boat, so no more golden ones.';
    setSpyNote(used.golden
      ? `Spot ${used.spot + 1} locked in, free. ${left > 0 ? `${left} golden left.` : `That was your last golden spyglass. ${more}`}`
      : `Spot ${used.spot + 1} locked in, +${used.cost} to your score.${practice || state.rounds > 1 ? '' : ` No golden ones left. ${more}`}`);
  }

  const spyglassButton = spy?.allowed && (
    <button
      type="button"
      className={`outline-btn spyglass-btn${spy.golden ? ' spyglass-btn--golden' : ''}`}
      onClick={useSpyglass}
      disabled={!spy.available}
      aria-label={`Spyglass, ${spy.golden ? `golden, free, ${spy.goldenLeft} left` : `adds ${SPYGLASS_COST} to your score`}${spy.available ? '' : ', needs a ship in the right spot first'}`}
    >
      <Spyglass size={0.6} />
      Spyglass <small>{spy.golden ? 'free' : `+${SPYGLASS_COST}`}</small>
      {/* How many golden ones are left: a small gold circle on the corner, only while there are any */}
      {spy.golden && <span className="spyglass-btn__count" aria-hidden="true">{spy.goldenLeft}</span>}
    </button>
  );

  async function useHint() {
    if (!hintsLeft) return;
    const ship = await api.askHint(state);
    if (ship === null) return;
    dispatch({ type: 'HINT_GIVEN', ship });
    // Make it noticeable: the ship's button lights up for a moment, and a line says what happened.
    setJustOut(ship);
    window.setTimeout(() => setJustOut(null), 800);
    setSpyNote(`Lookout: no ${SHIP_NAMES[SHIP_KINDS[ship]].toLowerCase()} out there. +1 to your score.`);
  }
  const [justOut, setJustOut] = useState<Ship | null>(null);

  // Ships you've marked out: a ✕ flag that has stayed put for half a second (so tapping through the
  // flags doesn't flicker the panel), plus long-pressed ones.
  const xShips = [...new Set(Object.entries(state.notes ?? {}).filter(([, f]) => f === 'no')
    .map(([key]) => state.guesses[Number(key.split(':')[0])]?.[Number(key.split(':')[1])]).filter((x): x is Ship => x != null))].sort().join(',');
  const [settledX, setSettledX] = useState(xShips);
  useEffect(() => { const t = window.setTimeout(() => setSettledX(xShips), 500); return () => window.clearTimeout(t); }, [xShips]);
  const noted = [...new Set([...(settledX ? settledX.split(',').map(Number) : []), ...(state.markedOut ?? [])])];

  function replay() {
    setEndPopup(false);
    setAskReplay(false);
    setAlbatross(null);
    setSpyNote('');
    setOutcome(null);
    setShowGuesses(false);
    setEnding(false);
    window.clearTimeout(endTimer.current);
    dispatch({ type: 'REPLAY' });
  }

  // Practice: a new random fleet. The feedback toggle carries over.
  function newPractice() {
    setEndPopup(false);
    setAskGiveUp(false);
    setAlbatross(null);
    setSpyNote('');
    setEnding(false);
    window.clearTimeout(endTimer.current);
    dispatch({ type: 'LOAD', state: { ...newGame(newPracticeKey(), mode), perSpot: state.perSpot } });
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
  // Score = guesses + hints. Shown with the hints, so it's clear where the extra points came from.
  const scoreLine = (guesses: number) => {
    const extras = [
      state.hintsUsed ? `${state.hintsUsed} ${state.hintsUsed === 1 ? 'lookout' : 'lookouts'}` : '',
      state.spyglasses ? `${state.spyglasses} ${state.spyglasses === 1 ? 'spyglass' : 'spyglasses'}` : '',
    ].filter(Boolean);
    return extras.length
      ? `Solved in ${guesses} + ${extras.join(' + ')} · Score ${gameScore(guesses, state.hintsUsed, state.spyglassPoints ?? 0)}`
      : `Solved in ${guesses}`;
  };
  const status =
    state.status === 'won' ? `Solved in ${shown}!`
    : state.status === 'lost' ? 'Slipped away'
    : `${practice ? 'Practice · ' : ''}${replaying ? 'Replay · ' : ''}Guess ${state.guesses.length + 1} of ${maxGuesses}`;


  // The result popup, after the fleet sails home (win) or shrinks away (loss). Close it to look at the board.
  const closePopup = () => setEndPopup(false);
  const lookAtBoard = () => { setEndPopup(false); if (!practice) setShowGuesses(true); };
  const endModal = endPopup && over && (
    <div className="notes-modal" role="dialog" aria-modal="true" aria-label="Result" onClick={closePopup}>
      <div className={`notes-modal__card end-card end-card--${state.status}`} onClick={(e) => e.stopPropagation()}>
        <button type="button" className="end-card__x" aria-label="Close" onClick={closePopup}>✕</button>
        <h2>{state.status === 'won' ? (replaying ? 'Replay solved!' : 'Fleet found!') : 'The fleet slipped away'}</h2>
        <p>{state.status === 'won' ? scoreLine(practice ? state.guesses.length : shown) : practice ? 'Out of guesses. This one got away.' : 'Out of guesses. The fleet is still hidden in the fog.'}</p>
        <div className="end-card__buttons">
          {practice ? (
            <button type="button" className="primary-btn primary-btn--small" onClick={() => { closePopup(); newPractice(); }}>New game</button>
          ) : state.status === 'lost' && !state.revealed ? (
            <>
              <button type="button" className="primary-btn primary-btn--small" onClick={() => { closePopup(); replay(); }}>Keep trying</button>
              <button type="button" className="outline-btn" onClick={() => { closePopup(); dispatch({ type: 'REVEAL' }); }}>Reveal the fleet</button>
            </>
          ) : (
            <button type="button" className="primary-btn primary-btn--small" onClick={closePopup}>See the day's results</button>
          )}
          <button type="button" className="outline-btn" onClick={lookAtBoard}>Look at the board</button>
        </div>
      </div>
    </div>
  );

  const replayConfirm = askReplay && (
    <div className="confirm" role="alertdialog" aria-label="Replay this puzzle?">
      <p><strong>Are you sure?</strong> Only the first game will count.</p>
      <div className="confirm__buttons">
        <button type="button" className="outline-btn" onClick={() => setAskReplay(false)}>Back</button>
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
          <span className="legend__none">No anchor: no match</span>
        </>
      ) : (
        <>
          <span><i className="mini-anchor mini-anchor--exact"><MiniAnchorIcon /></i>Right ship, right spot</span>
          <span><i className="mini-anchor mini-anchor--near"><MiniAnchorIcon /></i>Wrong spot</span>
        </>
      )}
      <button type="button" className="legend__notes" onClick={() => setNotesOpen(true)}>Notes ⓘ</button>
      {/* Kept (hidden) once the game ends, so the page doesn't get shorter and jump */}
      <strong style={over ? { visibility: 'hidden' } : undefined}>{status}</strong>
    </div>
  );

  // Note flags. The popup explains them; a one-time tip (Hard and totals-only Practice, where notes help most)
  // shows once a row is logged, until the first flag goes up.
  const [notesOpen, setNotesOpen] = useState(false);
  const [notesTipSeen, setNotesTipSeen] = useState(() => loadPrefs().notesTip);
  const anyFlag = Object.keys(state.notes ?? {}).length > 0;
  useEffect(() => {
    if (anyFlag && !notesTipSeen) { setNotesTipSeen(true); savePrefs({ ...loadPrefs(), notesTip: true }); }
  }, [anyFlag, notesTipSeen]);
  const notesTip = !notesTipSeen && !state.perSpot && state.guesses.length > 0 && (
    <p className="notes-tip" style={over ? { visibility: 'hidden' } : undefined}>Tip: {FLAG_TAP === 'double' ? 'double tap' : 'tap'} a ship in a finished row to raise a note flag.</p>
  );
  const notesModal = notesOpen && (
    <div className="notes-modal" role="dialog" aria-modal="true" aria-label="Notes" onClick={() => setNotesOpen(false)}>
      <div className="notes-modal__card" onClick={(e) => e.stopPropagation()}>
        <h2>Notes</h2>
        <p>Keep track of what you've worked out: {FLAG_TAP === 'double' ? 'double tap' : 'tap'} any ship in a finished row to raise a flag, and again to change it.</p>
        <ul className="notes-modal__key">
          <li><NoteFlag kind="exact" /> Sure it's right, right here</li>
          <li><NoteFlag kind="near" /> In the fleet, but somewhere else</li>
          <li><NoteFlag kind="no" /> Not in the fleet</li>
          <li><span style={{ width: 20 }} /> {FLAG_TAP === 'double' ? 'Double tap' : 'Tap'} once more to take the flag down</li>
        </ul>
        <p>A ✕ also greys that ship out in the ship panel. You can grey one out (or back in) yourself too: press and hold its button.</p>
        <p>These are just your notes: the game never checks them, so use them however you like.</p>
        <button type="button" className="primary-btn primary-btn--small" onClick={() => setNotesOpen(false)}>Got it</button>
      </div>
    </div>
  );
  // Carry right-spot ships into the next row (Easy, and Practice with marks under each ship).
  // Lives at the very bottom: set-and-forget, found later by people who want it off.
  // Shown while playing; during the end banner it stays (hidden by actions--holding) so the page keeps its height.
  const carryToggle = state.perSpot && (!over || ending) && (
    <label className="carry-toggle">
      <input type="checkbox" checked={carry} onChange={() => { setCarry(!carry); savePrefs({ ...loadPrefs(), carry: !carry }); }} />
      <span className="carry-toggle__switch" aria-hidden="true" />
      Keep ships that are in the right spot for the next row
    </label>
  );

  return (
    <main className={`screen game game--${mode}${testGame ? ' is-test' : ''}${replaying ? ' is-replay' : ''}`}>
      {endModal}
      <TopBar onOpenHelp={onOpenHelp} subtitle={practice ? 'Practice waters' : `Harbor log · ${formatDate(dateKey)}`} onOpenLog={onOpenLog} onOpenFleet={onOpenFleet} />

      <div className="segmented" role="group" aria-label="Difficulty">
        {MODE_LIST.map((m) => (
          <button key={m} type="button" className={m === mode ? 'is-on' : undefined} aria-pressed={m === mode} onClick={() => onMode(m)}>
            {MODES[m].label} · {MODES[m].slots}
          </button>
        ))}
        <button type="button" className={practice ? 'is-on' : undefined} aria-pressed={practice} onClick={() => onMode(loadPrefs().practice)}>
          Practice
        </button>
      </div>

      {/* One line saying how this mode's feedback works. */}
      <p className="mode-line">
        {practice
          ? 'Practice: a new fleet every game. It doesn’t count toward badges.'
          : mode === 'easy'
            ? 'Bay (easy): an anchor under each ship tells you about that ship. Ships can repeat.'
            : 'Open sea (hard): anchors at the end of each row are totals, in no order. Ships can repeat.'}
      </p>


      {practice && (
        <div className="feedback-toggle" role="group" aria-label="Practice size">
          <span>Size</span>
          {(['practice-easy', 'practice-hard'] as const).map((size) => (
            <button key={size} type="button" className={size === mode ? 'is-on' : undefined} aria-pressed={size === mode} onClick={() => openPractice(size)}>
              {size === 'practice-easy' ? 'Bay' : 'Open sea'} · {MODES[size].slots}
            </button>
          ))}
        </div>
      )}


      <FogCard state={state} boatSize={BOAT_SIZE[mode]} />
      {albatross !== null && (
        <div className="albatross-note" role="status">
          <Scenery kind="albatross" size={0.9} />
          {albatross === 0
            ? <p><strong>An albatross!</strong> Every ship right, every spot wrong. Practice albatrosses are just for fun: they aren't added to your fleet.</p>
            : albatross === 1
            ? <p><strong>An albatross!</strong> Every ship right, every spot wrong. It's in your fleet now.</p>
            : <p><strong>Another albatross!</strong> Every ship right, every spot wrong. That's {albatross} in your fleet.</p>}
        </div>
      )}

      {practice ? (
        <>
          {ending ? (
            <button type="button" className="primary-btn actions--holding" aria-hidden="true" tabIndex={-1}>Log guess</button>
          ) : over ? (
            <button type="button" className="primary-btn" onClick={newPractice}>
              {state.status === 'won' ? `Solved in ${state.guesses.length}! · New game` : 'New game'}
            </button>
          ) : (
            <button type="button" className={`primary-btn${repeat ? ' primary-btn--repeat' : ''}`} onClick={logGuess} disabled={!canLogGuess(state)}>
              {repeat ? 'Already played' : 'Log guess'}
            </button>
          )}

          {/* Phones: the ships sit pinned to the bottom of the screen. Wide screens: a column beside the board. */}
          <div className="play-area play-area--practice">
            <div className="play-area__board">
              <Board state={state} boatSize={BOAT_SIZE[mode]} onTapSlot={(slot) => dispatch({ type: 'TAP_SLOT', slot })} onMoveShip={(from, to) => dispatch({ type: 'MOVE_SHIP', from, to })} onNote={(row, spot) => dispatch({ type: 'NOTE', row, spot })} lastRow={ending ? state.status : undefined} />
              {legend}
              {notesTip}
              {notesModal}
              {spyNote && <p className="spyglass-note" role="status">{spyNote}</p>}
            </div>
            <ShipPicker ships={MODES[mode].ships} ruledOut={state.ruledOut} disabled={over} onPick={(ship) => dispatch({ type: 'PICK_SHIP', ship })}
              noted={noted} onToggleNoted={(ship) => dispatch({ type: 'TOGGLE_OUT', ship })} justOut={justOut} />
          </div>

          {/* While the win/loss banner shows, the buttons stay in place but hidden: removing them made the
              page shorter, and the browser jumped the board down to fill the gap. */}
          {(
            <div className={`actions${ending ? ' actions--holding' : ''}`} aria-hidden={ending || undefined}>
              {giveUpConfirm}
              <div className="actions__left">
                {!over && (
                  <button type="button" className="outline-btn" onClick={useHint} disabled={!hintsLeft}>
                    {!hintsLeft ? 'No lookouts left' : <>Lookout <small>+1</small></>}
                  </button>
                )}
                {!over && spyglassButton}
                <button type="button" className="outline-btn" onClick={tapReplay}>Replay</button>
                {!over && <button type="button" className="outline-btn" onClick={newPractice}>New game</button>}
              </div>
              {!over && <button type="button" className="link-btn" onClick={() => setAskGiveUp(true)}>Give up</button>}
            </div>
          )}
          <div className={ending ? 'actions--holding' : undefined} aria-hidden={ending || undefined}>{carryToggle}</div>
          {/* Set-and-forget, so it lives at the bottom and leaves room for the board */}
          <div className="feedback-toggle" role="group" aria-label="Feedback">
          <span>Feedback</span>
          <button type="button" className={state.perSpot ? 'is-on' : undefined} aria-pressed={state.perSpot} onClick={() => dispatch({ type: 'SET_PER_SPOT', perSpot: true })}>Under each ship</button>
          <button type="button" className={!state.perSpot ? 'is-on' : undefined} aria-pressed={!state.perSpot} onClick={() => dispatch({ type: 'SET_PER_SPOT', perSpot: false })}>Totals only</button>
          </div>

        </>
      ) : over && !ending ? (
        <>
          {showGuesses ? (
            <section className="board-final" aria-label="Finished board">
              <button type="button" className="outline-btn" onClick={() => { setAskReplay(false); setShowGuesses(false); }}>Back to the day's results</button>
              <p className="board-final__tag">Finished board · {state.status === 'won' ? 'solved' : 'slipped away'} · can't be changed</p>
              <Board state={state} boatSize={BOAT_SIZE[mode]} onTapSlot={() => {}} />
              {legend}
              {notesModal}
            </section>
          ) : (
            <>
              <DayPanel state={state} outcome={outcome} today={today} onMode={onMode} onOpenLog={onOpenLog} onOpenFleet={onOpenFleet}
                onReveal={() => dispatch({ type: 'REVEAL' })} onKeepTrying={replay} onPlayDay={onPlayDay} />
              <button type="button" className="outline-btn" onClick={() => { setAskReplay(false); setShowGuesses(true); }}>Show my guesses</button>
            </>
          )}
          {/* On the finished board the bottom button just goes back; Replay lives on the day's results. */}
          <div className="actions">
            {!showGuesses && replayConfirm}
            <div className="actions__left">
              {showGuesses
                ? <button type="button" className="outline-btn" onClick={() => setShowGuesses(false)}>Back</button>
                : <button type="button" className="outline-btn replay-btn" onClick={tapReplay}>Replay</button>}
            </div>
          </div>
        </>
      ) : (
        <>
          {ending ? (
            // The game just ended: a banner where Log guess was. Tap it to skip ahead.
            <button type="button" className="primary-btn actions--holding" aria-hidden="true" tabIndex={-1}>Log guess</button>
          ) : (
            <button type="button" className={`primary-btn${repeat ? ' primary-btn--repeat' : ''}`} onClick={logGuess} disabled={!canLogGuess(state)}>
              {repeat ? 'Already played' : 'Log guess'}
            </button>
          )}

          {testGame && <p className="test-tag">Test game: the answer is all junks</p>}
          {/* Phones: the ships sit pinned to the bottom of the screen. Wide screens: a column beside the board. */}
          <div className="play-area">
            <div className="play-area__board">
              <Board state={state} boatSize={BOAT_SIZE[mode]} onTapSlot={(slot) => dispatch({ type: 'TAP_SLOT', slot })} onMoveShip={(from, to) => dispatch({ type: 'MOVE_SHIP', from, to })} onNote={(row, spot) => dispatch({ type: 'NOTE', row, spot })} lastRow={ending ? state.status : undefined} />
              {legend}
              {notesTip}
              {notesModal}
              {spyNote && <p className="spyglass-note" role="status">{spyNote}</p>}
            </div>
            <ShipPicker ships={MODES[mode].ships} ruledOut={state.ruledOut} disabled={over} onPick={(ship) => dispatch({ type: 'PICK_SHIP', ship })}
              noted={noted} onToggleNoted={(ship) => dispatch({ type: 'TOGGLE_OUT', ship })} justOut={justOut} />
          </div>

          {/* While the win/loss banner shows, the buttons stay in place but hidden: removing them made the
              page shorter, and the browser jumped the board down to fill the gap. */}
          {(
            <div className={`actions${ending ? ' actions--holding' : ''}`} aria-hidden={ending || undefined}>
              {replayConfirm}
              <div className="actions__left">
                <button type="button" className="outline-btn" onClick={useHint} disabled={!hintsLeft}>
                  {!hintsLeft ? 'No lookouts left' : <>Lookout <small>+1</small></>}
                </button>
                {spyglassButton}
                <button type="button" className="outline-btn replay-btn" onClick={tapReplay}>Replay</button>
              </div>
              <button type="button" className="link-btn" onClick={() => dispatch({ type: 'CLEAR_ROW' })}>Clear row</button>
            </div>
          )}
          <div className={ending ? 'actions--holding' : undefined} aria-hidden={ending || undefined}>{carryToggle}</div>
        </>
      )}
    </main>
  );
}
