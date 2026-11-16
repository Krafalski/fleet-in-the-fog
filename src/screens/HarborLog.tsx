// Past puzzles, one week at a time. Tap a day to play or revisit it.
import { useEffect, useState } from 'react';
import { api } from '../api';
import type { DayResult } from '../api';
import { CloseButton } from '../components/TopBar';
import { addDays, formatDate, weekStart, weekdayName } from '../game/dates';
import { LAUNCH_DATE, PERFECT_GUESSES } from '../game/game';
import type { Mode } from '../game/game';

type Props = { today: string; mode: Mode; onPick: (dateKey: string) => void; onClose: () => void };

export function HarborLog({ today, mode, onPick, onClose }: Props) {
  const thisWeek = weekStart(today);
  const firstWeek = weekStart(LAUNCH_DATE);
  const [week, setWeek] = useState(thisWeek);
  const [onlyUnsolved, setOnlyUnsolved] = useState(false);
  const [results, setResults] = useState<Record<string, DayResult | undefined>>({});

  const days = Array.from({ length: 7 }, (_, i) => addDays(week, i));

  useEffect(() => {
    let cancelled = false;
    api.loadResults(Array.from({ length: 7 }, (_, i) => addDays(week, i)), mode).then((found) => {
      if (!cancelled) setResults(found);
    });
    return () => { cancelled = true; };
  }, [week, mode]);

  const cards = days
    .map((dateKey) => {
      const result = results[dateKey];
      const future = dateKey > today;
      const tooEarly = dateKey < LAUNCH_DATE;
      let kind: 'today' | 'perfect' | 'solved' | 'lost' | 'open' | 'none' = 'open';
      let text = 'Not played';
      if (future) { kind = 'none'; text = 'Coming soon'; }
      else if (tooEarly) { kind = 'none'; text = 'Before launch'; }
      else if (result?.status === 'lost') { kind = 'lost'; text = 'Slipped away'; }
      else if (result) {
        kind = result.guesses <= PERFECT_GUESSES ? 'perfect' : 'solved';
        text = `${kind === 'perfect' ? 'Perfect' : 'Solved'} · ${result.guesses}`;
      } else if (dateKey === today) { kind = 'today'; text = 'Today'; }
      return { dateKey, kind, text, playable: !future && !tooEarly, solved: result?.status === 'won' };
    })
    .filter((card) => !onlyUnsolved || (card.playable && !card.solved));

  return (
    <main className="screen log">
      <header className="screen-head">
        <h1>Harbor log</h1>
        <CloseButton label="Close harbor log" onClick={onClose} />
      </header>

      <div className="log__filters">
        <div className="pills">
          <button type="button" className={!onlyUnsolved ? 'is-on' : undefined} aria-pressed={!onlyUnsolved} onClick={() => setOnlyUnsolved(false)}>All</button>
          <button type="button" className={onlyUnsolved ? 'is-on' : undefined} aria-pressed={onlyUnsolved} onClick={() => setOnlyUnsolved(true)}>Unsolved</button>
        </div>
        <div className="pills">
          <button type="button" onClick={() => setWeek(thisWeek)} disabled={week === thisWeek}>Today</button>
        </div>
      </div>

      <div className="log__week">
        <button type="button" className="icon-btn" aria-label="Previous week" onClick={() => setWeek(addDays(week, -7))} disabled={week <= firstWeek}>←</button>
        <div className="log__range">{formatDate(week, false)} – {formatDate(addDays(week, 6))}</div>
        <button type="button" className="icon-btn" aria-label="Next week" onClick={() => setWeek(addDays(week, 7))} disabled={week >= thisWeek}>→</button>
      </div>

      <div className="log__grid">
        {cards.map((card) => (
          <button
            key={card.dateKey}
            type="button"
            className={`day day--${card.kind}`}
            disabled={!card.playable}
            onClick={() => onPick(card.dateKey)}
            aria-label={`${weekdayName(card.dateKey)} ${formatDate(card.dateKey)}, ${card.text}`}
          >
            <span className="day__weekday">{weekdayName(card.dateKey)}</span>
            <span className="day__date">{formatDate(card.dateKey, false)}</span>
            <span className="day__status">{card.text}</span>
          </button>
        ))}
      </div>
      {cards.length === 0 && <p className="log__empty">All clear this week. Every fleet found.</p>}
    </main>
  );
}
