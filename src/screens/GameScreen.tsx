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
import { Creature } from '../Creature';
import { Scenery } from '../Scenery';
import { ShipPicker } from '../components/ShipPicker';
import { SHIP_KINDS, SHIP_NAMES } from '../Boat';
import { TopBar } from '../components/TopBar';
import { testGame } from '../config';
import { formatDate } from '../game/dates';
import { MODES, MODE_LIST, SPYGLASS_COST, gameScore, isPractice } from '../game/game';
import { FLAG_TAP } from '../config';
import type { DailyMode, Mode, Ship, PracticeMode } from '../game/game';
import { alreadyGuessed, boardRows, canLogGuess, newGame, reducer, totalGuesses } from '../game/reducer';
import type { Action } from '../game/reducer';

// Boats shrink a little as rows get longer.
const BOAT_SIZE: Record<Mode, number> = { easy: 1.25, hard: 0.95, 'practice-easy': 1.25, 'practice-hard': 0.95 };
// The moment a game ends: pegs light up, the fog lifts, a banner shows, then the day's results take over.
// The end animation, then the result popup. A win turns quickly (0.25s) and sails slowly home (1.8s);
// a loss shrinks into the fog faster.
const ENDING_MS = { won: 2700, lost: 1900 } as const;
// How long the albatross note floats over the fog card before it fades away.
const ALBATROSS_MS = 6000;
// Keyboard letters, in ship order: Yellow fisher, Purple junk, Red mailboat, Green schooner, Blue tug, Coral yacht.
const SHIP_KEYS = ['y', 'p', 'r', 'g', 'b', 'c'];
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
  // Start from the saved game when the store can hand it over right away, so switching modes
  // never flashes an empty board before the saved one loads.
  const [initial] = useState(() => api.peekGame?.(dateKey, mode) ?? newGame(dateKey, mode));
  const [state, dispatch] = useReducer(reducer, initial);
  // A game that was already finished when this screen opened shows its results without the slide-in.
  const [overAtOpen] = useState(() => initial.status !== 'playing');
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
  const [lobster, setLobster] = useState<number | null>(null); // that albatross was the first guess: a lobster (how many)
  const albatrossTimer = useRef<number | undefined>(undefined);
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
  const maxGuesses = boardRows(state);
  const trying = (state.tries ?? []).length > 0; // Keep trying: the board turns a little grey

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
    const { albatross: sawAlbatross, lobster: sawLobster, ...scored } = result;
    setLobster(sawLobster ?? null);
    const action: Action = { type: 'GUESS_SCORED', guess, ...scored, carry: carry && state.perSpot };
    setAlbatross(sawAlbatross ?? null);
    if (sawAlbatross !== undefined && sawAlbatross !== null) {
      window.clearTimeout(albatrossTimer.current);
      albatrossTimer.current = window.setTimeout(() => setAlbatross(null), ALBATROSS_MS);
    }
    setSpyNote('');
    dispatch(action);
    if (result.status !== 'playing') {
      setEnding(true);
      endTimer.current = window.setTimeout(() => { setEnding(false); setEndPopup(true); }, ENDING_MS[result.status === 'won' ? 'won' : 'lost']);
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
      ? `Next golden Spyglass comes with the ${spy.nextBoat.name.toLowerCase()}, in ${spy.nextBoat.days} ${spy.nextBoat.days === 1 ? 'day' : 'days'}.`
      : 'You have every boat, so no more golden ones.';
    setSpyNote(used.golden
      ? `Spot ${used.spot + 1} locked in, free. ${left > 0 ? `${left} golden left.` : `That was your last golden Spyglass. ${more}`}`
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

  // Keyboard play (desktop): Y P R G B C place ships, ← → choose a spot, Enter logs a full row,
  // Backspace/Delete clears the chosen spot (or takes the last ship off).
  // Ignored while any popup is open, once the game is over, with Cmd/Ctrl/Alt held, or while typing in a field.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey || state.status !== 'playing' || ending) return;
      const target = e.target as HTMLElement | null;
      const typing = target && (target.tagName === 'TEXTAREA' || target.isContentEditable
        || (target.tagName === 'INPUT' && !['checkbox', 'radio', 'button', 'range'].includes((target as HTMLInputElement).type)));
      if (typing) return; // switches and buttons don't count: after tapping one, the letters still play
      if (document.querySelector('[aria-modal="true"], [role="alertdialog"]')) return;
      const key = e.key.toLowerCase();
      const ship = SHIP_KEYS.indexOf(key);
      if (ship !== -1 && ship < MODES[mode].ships) {
        e.preventDefault();
        dispatch({ type: 'PICK_SHIP', ship: ship as Ship, advance: true });
      } else if (e.key === 'Enter') {
        if (!canLogGuess(state)) return;
        e.preventDefault();
        logGuess();
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault();
        dispatch({ type: 'BACKSPACE' });
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        dispatch({ type: 'MOVE_CURSOR', by: e.key === 'ArrowLeft' ? -1 : 1 });
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  // After a loss: 10 more rows under the old ones. Guesses and note flags stay; the day's result doesn't change.
  function keepTrying() {
    setEndPopup(false);
    setAlbatross(null);
    setSpyNote('');
    setShowGuesses(false);
    setEnding(false);
    window.clearTimeout(endTimer.current);
    dispatch({ type: 'KEEP_TRYING', carry: carry && state.perSpot });
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
      state.spyglasses ? `${state.spyglasses} ${state.spyglasses === 1 ? 'Spyglass' : 'Spyglasses'}` : '',
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
        <p>{state.status === 'won' ? scoreLine(practice ? state.guesses.length : shown) : state.revealed ? 'Out of guesses. This one got away.' : 'Out of guesses. The fleet is still hidden in the fog. Keep trying adds 10 more rows.'}</p>
        <div className="end-card__buttons">
          {state.status === 'lost' && !state.revealed ? (
            <>
              <button type="button" className="primary-btn primary-btn--small" onClick={keepTrying}>Keep trying</button>
              <button type="button" className="outline-btn" onClick={() => { closePopup(); dispatch({ type: 'REVEAL' }); }}>Reveal the fleet</button>
              {practice && <button type="button" className="outline-btn" onClick={() => { closePopup(); newPractice(); }}>New game</button>}
            </>
          ) : practice ? (
            <button type="button" className="primary-btn primary-btn--small" onClick={() => { closePopup(); newPractice(); }}>New game</button>
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
    <main className={`screen game game--${mode}${testGame ? ' is-test' : ''}${replaying ? ' is-replay' : ''}${trying ? ' is-trying' : ''}`}>
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
            : 'Open Sea (hard): anchors at the end of each row are totals, in no order. Ships can repeat.'}
      </p>


      {/* Practice puts its two sizes beside the fog card, so the board starts at the same height as in the daily games. */}
      {practice ? (
        <div className="fog-row" role="group" aria-label="Practice size">
          <button type="button" className={`size-side${mode === 'practice-easy' ? ' is-on' : ''}`} aria-pressed={mode === 'practice-easy'} onClick={() => openPractice('practice-easy')}>
            <span>Bay</span><small>{MODES['practice-easy'].slots} ships</small>
          </button>
          <FogCard state={state} boatSize={BOAT_SIZE[mode]} />
          <button type="button" className={`size-side${mode === 'practice-hard' ? ' is-on' : ''}`} aria-pressed={mode === 'practice-hard'} onClick={() => openPractice('practice-hard')}>
            <span>Open Sea</span><small>{MODES['practice-hard'].slots} ships</small>
          </button>
        </div>
      ) : (
        <FogCard state={state} boatSize={BOAT_SIZE[mode]} />
      )}
      {/* The albatross note floats over the fog card instead of taking up space, so the board never moves.
          It fades away by itself after a few seconds, or with a tap. */}
      <div className="albatross-anchor">
      {albatross !== null && (
        <div className="albatross-note" role="status" onClick={() => setAlbatross(null)} title="Tap to close">
          {lobster !== null
            ? <Creature kind={state.mode === 'hard' ? 'bluelobster' : 'lobster'} size={0.9} />
            : <Scenery kind="albatross" size={0.9} />}
          {lobster !== null
            ? <p><strong>{lobster > 1 ? 'Another' : 'A'} {state.mode === 'hard' ? 'blue' : 'red'} lobster!</strong> An albatross on your very first guess: every ship right, every spot wrong.{lobster > 1 ? ` That's ${lobster} in your fleet.` : " It's in your fleet now."}</p>
            : albatross === 0
            ? <p><strong>An albatross!</strong> Every ship right, every spot wrong. Practice albatrosses are just for fun: they aren't added to your fleet.</p>
            : albatross === 1
            ? <p><strong>An albatross!</strong> Every ship right, every spot wrong. It's in your fleet now.</p>
            : <p><strong>Another albatross!</strong> Every ship right, every spot wrong. That's {albatross} in your fleet.</p>}
          <span className="albatross-note__x" aria-hidden="true">✕</span>
        </div>
      )}
      </div>

      {practice ? (
        <>
          {ending ? (
            <button type="button" className="primary-btn actions--holding" aria-hidden="true" tabIndex={-1}>Log guess</button>
          ) : state.status === 'lost' && !state.revealed ? (
            <button type="button" className="primary-btn" onClick={keepTrying}>Keep trying · 10 more rows</button>
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
                {state.status === 'lost' && !state.revealed && (
                  <button type="button" className="outline-btn" onClick={() => dispatch({ type: 'REVEAL' })}>Reveal the fleet</button>
                )}
                <button type="button" className="outline-btn" onClick={tapReplay}>Replay</button>
                {state.status !== 'won' && !(over && state.revealed) && <button type="button" className="outline-btn" onClick={newPractice}>New game</button>}
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
              <DayPanel state={state} outcome={outcome} today={today} still={overAtOpen && outcome === null} onMode={onMode} onOpenLog={onOpenLog} onOpenFleet={onOpenFleet}
                onReveal={() => dispatch({ type: 'REVEAL' })} onKeepTrying={keepTrying} onPlayDay={onPlayDay} />
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
