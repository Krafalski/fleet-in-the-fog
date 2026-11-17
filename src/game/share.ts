// The spoiler-free result players can paste into the day's Reddit thread.
// It shows how the guesses went, never which ships were in the fleet.
//   🚢 right ship, right spot    ⚓️ right ship, wrong spot    🌊 no match
// Easy (and Practice "under each ship") shows a mark for each spot, in order.
// Hard shows totals for each row, anchors first, so the order gives nothing away.
import { MODES } from './game';
import type { Feedback, Mode } from './game';
import { formatDate } from './dates';

// The anchor needs \uFE0F ("show as emoji"), or some apps draw it as a small text symbol and the rows go uneven.
export const SHARE_MARKS = { exact: '🚢', near: '\u2693\uFE0F', miss: '🌊' } as const;

export function shareRow(feedback: Feedback, slots: number, perSpot: boolean): string {
  if (perSpot && feedback.spots) return feedback.spots.map((s) => SHARE_MARKS[s]).join('');
  const misses = Math.max(0, slots - feedback.exact - feedback.near);
  return SHARE_MARKS.exact.repeat(feedback.exact) + SHARE_MARKS.near.repeat(feedback.near) + SHARE_MARKS.miss.repeat(misses);
}

type ShareInput = {
  dateKey: string;
  mode: Mode;
  won: boolean;
  guesses: number;           // guesses that count (the first game of the day)
  creature: string | null;   // the creature sighted, when solved
  streak: number | null;
  rows: Feedback[] | null;   // the counted game's rows; null when the board on screen is a replay
  perSpot: boolean;
};

export function shareText({ dateKey, mode, won, guesses, creature, streak, rows, perSpot }: ShareInput): string {
  const { slots, maxGuesses, label } = MODES[mode];
  const lines = [`Fleet in the Fog · ${formatDate(dateKey, false)} · ${label}`];
  lines.push(won
    ? `Solved in ${guesses}/${maxGuesses}${creature ? ` · ${creature} sighted` : ''}`
    : `The fleet slipped away (${guesses}/${maxGuesses})`);
  if (rows) lines.push(...rows.map((f) => shareRow(f, slots, perSpot)));
  if (streak) lines.push(`Streak: ${streak} ${streak === 1 ? 'day' : 'days'}`);
  return lines.join('\n');
}
