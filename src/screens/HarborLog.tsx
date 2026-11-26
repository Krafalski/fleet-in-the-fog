// Past puzzles, one week at a time. Each day shows how Easy and Hard went.
// Tapping a day opens: Easy if neither was played, the unplayed one if only one was, Hard if both were.
import { useEffect, useState } from 'react';
import { api } from '../api';
import type { DayResult } from '../api';
import { CloseButton } from '../components/TopBar';
import { addDays, formatDate, weekStart, weekdayName } from '../game/dates';
import { LAUNCH_DATE, MODES, MODE_LIST } from '../game/game';
import type { DailyMode, Mode } from '../game/game';

type Props = { today: string; onPick: (dateKey: string, mode: Mode) => void; onClose: () => void };
type Day = Record<DailyMode, DayResult | undefined>;

// Which board a tap on this day opens.
function modeToOpen(day: Day | undefined): DailyMode {
  const easyPlayed = day?.easy !== undefined;
  return easyPlayed ? 'hard' : 'easy'; // neither or only Hard played: Easy. Easy played (with or without Hard): Hard.
}

// One line of a day card, like "Solved · 3".
function lineFor(result: DayResult | undefined): { text: string; done: boolean } {
  if (!result) return { text: 'Not played', done: false };
  if (result.status === 'lost') return { text: 'Slipped away', done: true };
  return { text: `Solved · ${result.guesses}`, done: true };
}

export function HarborLog({ today, onPick, onClose }: Props) {
  const thisWeek = weekStart(today);
  const firstWeek = weekStart(LAUNCH_DATE);
  const [week, setWeek] = useState(thisWeek);
  const [onlyUnsolved, setOnlyUnsolved] = useState(false);
  const [results, setResults] = useState<Record<string, Day>>({});

  const days = Array.from({ length: 7 }, (_, i) => addDays(week, i));

  useEffect(() => {
    let cancelled = false;
    const keys = Array.from({ length: 7 }, (_, i) => addDays(week, i));
    Promise.all(keys.map((k) => api.loadDay(k))).then((found) => {
      if (!cancelled) setResults(Object.fromEntries(keys.map((k, i) => [k, found[i]])));
    });
    return () => { cancelled = true; };
  }, [week]);

  const cards = days
    .map((dateKey) => {
      const day = results[dateKey];
      const future = dateKey > today;
      const tooEarly = dateKey < LAUNCH_DATE;
      const playable = !future && !tooEarly;
      const kind = !playable ? 'none' : dateKey === today ? 'today' : 'open';
      const note = future ? 'Coming soon' : tooEarly ? 'Before launch' : null;
      const allSolved = MODE_LIST.every((m) => day?.[m]?.status === 'won');
      return { dateKey, day, kind, note, playable, allSolved };
    })
    .filter((card) => !onlyUnsolved || (card.playable && !card.allSolved));

  return (
    <main className="screen log">
      {/* The ✕ stays at the top right while you scroll. */}
      <div className="sticky-close"><CloseButton label="Close harbor log" onClick={onClose} /></div>
      <header className="screen-head">
        <h1>Harbor log</h1>
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
            onClick={() => onPick(card.dateKey, modeToOpen(card.day))}
            aria-label={`${weekdayName(card.dateKey)} ${formatDate(card.dateKey)}, ${card.note ?? MODE_LIST.map((m) => `${MODES[m].label} ${lineFor(card.day?.[m]).text}`).join(', ')}`}
          >
            <span className="day__weekday">{weekdayName(card.dateKey)}{card.kind === 'today' ? ' · Today' : ''}</span>
            <span className="day__date">{formatDate(card.dateKey, false)}</span>
            {card.note ? (
              <span className="day__status">{card.note}</span>
            ) : (
              MODE_LIST.map((m) => {
                const line = lineFor(card.day?.[m]);
                return (
                  <span key={m} className={`day__mode${line.done ? ' is-done' : ''}`}>
                    <b>{MODES[m].label}</b> {line.text}
                  </span>
                );
              })
            )}
          </button>
        ))}
      </div>
      {cards.length === 0 && <p className="log__empty">All clear this week. Every fleet found.</p>}
    </main>
  );
}
