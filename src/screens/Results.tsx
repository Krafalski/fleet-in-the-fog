// Shown after a game ends: streak, guesses, any new boat, and a note to post as a comment.
import { useEffect, useState } from 'react';
import { Boat } from '../Boat';
import type { BadgeKind } from '../Boat';
import { api } from '../api';
import type { DayStats, Outcome } from '../api';
import { CloseButton } from '../components/TopBar';
import { BADGES, MYSTERY_BADGE } from '../game/badges';
import { formatDate } from '../game/dates';
import { MODES } from '../game/game';
import type { GameState } from '../game/reducer';

type Props = {
  state: GameState;          // the finished game
  outcome: Outcome | null;   // streak and new boats, when the game just ended; null when reopened later
  today: string;
  onClose: () => void;
  onOpenLog: () => void;
  onOpenFleet: () => void;
};

export function Results({ state, outcome, today, onClose, onOpenLog, onOpenFleet }: Props) {
  const won = state.status === 'won';
  const { maxGuesses, label: modeLabel } = MODES[state.mode];
  const used = state.guesses.length;

  const [streak, setStreak] = useState(outcome ? outcome.streak : 0);
  const [stats, setStats] = useState<DayStats | null>(null);
  const [note, setNote] = useState('');
  const [posted, setPosted] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!outcome) api.loadProgress(today).then((p) => { if (!cancelled) setStreak(p.streak); });
    api.loadDayStats(state.dateKey, state.mode).then((s) => { if (!cancelled) setStats(s); });
    return () => { cancelled = true; };
  }, [outcome, today, state.dateKey, state.mode]);

  // The line added under the player's comment. No ships in it, so it never spoils the answer.
  const summary =
    `${formatDate(state.dateKey, false)} · ${modeLabel} · ` +
    (won ? `${used} of ${maxGuesses} guesses` : 'fleet slipped away') +
    (state.hintsUsed ? ` · ${state.hintsUsed} ${state.hintsUsed === 1 ? 'hint' : 'hints'}` : '');

  async function submit() {
    await api.postComment(state.dateKey, note.trim() ? `${note.trim()}\n\n${summary}` : summary);
    setPosted(true);
  }

  const newBoats = (outcome ? outcome.newBadges : []).map((kind) => BADGES.find((b) => b.kind === kind)).filter((b) => b !== undefined);

  return (
    <main className="screen results">
      <header className="screen-head screen-head--end">
        <CloseButton label="Close results" onClick={onClose} />
      </header>

      <div className="results__head">
        <p className="eyebrow">Log entry · {formatDate(state.dateKey)}</p>
        <h1>{won ? 'Fleet found' : 'The fleet slipped away'}</h1>
        <p className="results__streak">{streak === 1 ? '1-day streak' : `${streak}-day streak`}</p>
      </div>

      <div className="stats">
        <div><strong>{used}</strong><span>Guesses used</span></div>
        <div><strong>{maxGuesses - used}</strong><span>Guesses left</span></div>
        <div>
          <strong>{stats ? stats.average.toFixed(1) : '–'}</strong>
          <span>Harbor average</span>
          {stats && <span>{stats.players} players</span>}
        </div>
      </div>

      {newBoats.map((badge) => (
        <div key={badge.kind} className="new-boat">
          <Boat kind={badge.kind as BadgeKind} size={1.3} label={badge.name} />
          <div>
            <p>{badge.kind === MYSTERY_BADGE ? 'Something drifted in with the fog' : `New boat for your fleet · ${badge.how}`}</p>
            <strong>{badge.name}</strong>
          </div>
        </div>
      ))}

      <section className="note">
        <label htmlFor="note">Leave a note in the log</label>
        <div className="note__box">
          <textarea id="note" placeholder="How did this one go?" value={note} onChange={(e) => setNote(e.target.value)} disabled={posted} />
          <div className="note__foot">
            <div><span>Added to your comment</span><strong>{summary}</strong></div>
            <button type="button" className="primary-btn primary-btn--small" onClick={submit} disabled={posted}>{posted ? 'Posted' : 'Submit'}</button>
          </div>
        </div>
      </section>

      <div className="results__links">
        <button type="button" className="outline-btn" onClick={onOpenLog}>Harbor log</button>
        <button type="button" className="outline-btn" onClick={onOpenFleet}>Your fleet</button>
      </div>
    </main>
  );
}
