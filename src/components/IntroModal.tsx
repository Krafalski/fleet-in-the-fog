// The welcome card that sits over the game when today's puzzle hasn't been played yet.
// Front: the date, "Can you find today's fleet?", ghost ships in the fog, the six ships, and Play.
// "How to play" flips the card to the rules; "Back" flips it back. Play fades the card away.
import { useState } from 'react';
import { NoteFlag } from './NoteFlag';
import { Boat, SHIP_KINDS } from '../Boat';
import { MODES } from '../game/game';
import { formatDate } from '../game/dates';
import { AnchorMark, MiniAnchor } from './Board';

// A fixed, made-up fleet for the ghost ships, so the picture never hints at the real answer.
const GHOSTS = ['schooner', 'tug', 'junk', 'yacht'] as const;

// startOn: 'rules' when opened from the message-in-a-bottle button during a game.
export function IntroModal({ today, onPlay, startOn = 'front' }: { today: string; onPlay: () => void; startOn?: 'front' | 'rules' }) {
  const [page, setPage] = useState<'front' | 'rules'>(startOn);
  const [leaving, setLeaving] = useState(false);

  function play() {
    setLeaving(true);
    window.setTimeout(onPlay, 400); // matches the fade in app.css
  }

  return (
    <div className={`intro${leaving ? ' intro--leaving' : ''}`} role="dialog" aria-modal="true" aria-labelledby="intro-title">
      <div className="intro__card">
        {page === 'front' ? (
          <>
            <p className="intro__date">{formatDate(today)}</p>
            <h2 id="intro-title">Can you find today's fleet?</h2>

            <div className="intro__fog" aria-hidden="true">
              <span className="cloud intro__cloud intro__cloud--left" />
              <span className="cloud intro__cloud intro__cloud--right" />
              <div className="intro__ghosts">
                {GHOSTS.map((kind, i) => <Boat key={i} kind={kind} look="locked" size={1.15} />)}
              </div>
            </div>

            <div className="intro__ships" aria-hidden="true">
              {SHIP_KINDS.map((kind) => <Boat key={kind} kind={kind} size={0.9} />)}
            </div>

            <button type="button" className="primary-btn intro__play" onClick={play} autoFocus>Play</button>
            <button type="button" className="link-btn" onClick={() => setPage('rules')}>How to play</button>
          </>
        ) : (
          <>
            <h2 id="intro-title">How to play</h2>
            <ol className="intro__rules">
              <li>A fleet of ships is hidden in the fog: {MODES.easy.slots} ships in the <b>Bay</b> (easy), {MODES.hard.slots} on the <b>Open sea</b> (hard). To win, find which ships are in the fleet, and in which order. <b>Ships can repeat</b>: a fleet might have two of one kind, or even be all one kind.</li>
              <li>The foggy card at the top of the game is where the fleet hides. It isn't a hint: it lifts when you find the fleet.</li>
              <li>Tap a ship to put it in the row. Tap a placed ship to take it back, or drag it to another spot. When every spot is filled, press <b>Log guess</b>.</li>
              <li>
                In the <b>Bay</b>, anchors mark each ship:
                <span className="intro__key"><AnchorMark kind="exact" size={20} /> right ship, right spot</span>
                <span className="intro__key"><AnchorMark kind="near" size={20} /> in the fleet, wrong spot</span>
                <span className="intro__key">no anchor: not in the fleet</span>
              </li>
              <li>
                On the <b>Open sea</b>, the same anchors (<i className="mini-anchor mini-anchor--exact"><MiniAnchor /></i><i className="mini-anchor mini-anchor--near"><MiniAnchor /></i>), come only as totals at the end of the row. They tell you <i>how many</i> ships are right, not <i>which</i> ones.
              </li>
              <li>Each row is another try at the same fleet.</li>
              <li><b>Hints</b> cost points (lower scores are better): the <b>Lookout</b> rules out a ship that isn't in the fleet (+1), and on the Open sea the <b>Spyglass</b> finds a ship in the right spot (+2, or free with a golden one).</li>
              <li><b>Notes</b> (optional): tap a ship in a finished row to raise your own flag: <span className="intro__flag"><NoteFlag kind="exact" size={0.7} /></span> right here, <span className="intro__flag"><NoteFlag kind="near" size={0.7} /></span> somewhere else, <span className="intro__flag"><NoteFlag kind="no" size={0.7} /></span> not in the fleet. They're just for you.</li>
              <li>Solve it in {MODES.easy.maxGuesses} guesses ({MODES.hard.maxGuesses} on the Open sea). A new fleet comes in every day.</li>
            </ol>
            {startOn === 'rules' ? (
              // Opened from the bottle during a game: one button, straight back to the game.
              <button type="button" className="primary-btn intro__play" onClick={play} autoFocus>Back to the game</button>
            ) : (
              <>
                <button type="button" className="primary-btn intro__play" onClick={play}>Play</button>
                <button type="button" className="link-btn" onClick={() => setPage('front')}>Back</button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
