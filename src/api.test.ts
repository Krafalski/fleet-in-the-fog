// The saving side of the game: what a win actually stores, tested the same way console-streak-testing.js
// is used by hand: fake some past days, win today, then check what was saved.
// Runs in Node with a small stand-in for the browser's localStorage, so no browser is needed.
import { beforeEach, describe, expect, test } from 'vitest';

// ---- a pretend localStorage (data keys are enumerable, like the real one; the methods are not)
const storage = {} as Record<string, string> & Storage;
for (const [name, fn] of Object.entries({
  getItem: (k: string) => (k in storage ? storage[k] : null),
  setItem: (k: string, v: string) => { storage[k] = String(v); },
  removeItem: (k: string) => { delete storage[k]; },
  clear: () => { for (const k of Object.keys(storage)) delete storage[k]; },
})) Object.defineProperty(storage, name, { value: fn, enumerable: false });
(globalThis as unknown as { localStorage: Storage }).localStorage = storage;

import { api, resetToday } from './api';
import type { DayResult } from './api';
import { addDays } from './game/dates';
import { newGame } from './game/reducer';
import type { GameState } from './game/reducer';
import type { DailyMode } from './game/game';

const TODAY = '2027-06-15';
const KEY = 'fog'; // the real-game store (no window in Node, so the test game is never on)
const saved = <T,>(name: string, fallback: T): T => JSON.parse(storage.getItem(`${KEY}:${name}`) ?? 'null') ?? fallback;

// Same as seed() in console-streak-testing.js: n solved days before today, minus any skipped (1 = yesterday).
function seed(n: number, skip: number[] = [], mode: DailyMode = 'easy') {
  const results = saved<Record<string, DayResult>>('results', {});
  for (let i = 1; i <= n; i++) {
    if (skip.includes(i)) continue;
    const day = addDays(TODAY, -i);
    results[`${day}:${mode}`] = { dateKey: day, mode, status: 'won', guesses: 4, rounds: 1, hints: 0, playedOn: day };
  }
  storage.setItem(`${KEY}:results`, JSON.stringify(results));
}

// Finish today's game: won in 3 guesses, or lost.
function finished(status: 'won' | 'lost', mode: DailyMode = 'easy'): GameState {
  const s = newGame(TODAY, mode);
  const row = new Array(s.current.length).fill(0);
  return { ...s, status, guesses: [row, row, row], feedback: [], answer: row };
}
const winToday = (mode: DailyMode = 'easy') => api.recordResult(finished('won', mode), TODAY);

beforeEach(() => storage.clear());

describe('streak boats', () => {
  test('a first win earns the paper boat', async () => {
    const out = await winToday();
    expect(out.streak).toBe(1);
    expect(out.newBadges).toEqual(['paper']);
  });

  test('2 seeded days and a win: a 3-day streak and the rowboat', async () => {
    seed(2);
    const out = await winToday();
    expect(out.streak).toBe(3);
    expect(out.newBadges).toEqual(['paper', 'rowboat']);
  });

  test('359 seeded days and a win: all 17 streak boats, but no ghost ship', async () => {
    seed(359);
    await winToday();
    const badges = saved<Record<string, string>>('badges', {});
    expect(Object.keys(badges).length).toBe(17);
    expect(badges.galleon).toBe(TODAY);
    expect(badges.ghost === undefined).toBe(true);
  });

  test('a loss earns the ghost ship and does not add to the streak', async () => {
    seed(4);
    const out = await api.recordResult(finished('lost'), TODAY);
    expect(out.newBadges.includes('ghost')).toBe(true);
    expect(out.streak).toBe(4);
  });

  test('winning both modes on one day counts once, and awards nothing twice', async () => {
    seed(2);
    await winToday('easy');
    const second = await winToday('hard');
    expect(second.streak).toBe(3);
    expect(second.newBadges).toEqual([]);
  });

  test('a day finished twice keeps the first result', async () => {
    await winToday();
    const again = await api.recordResult(finished('lost'), TODAY);
    expect(again.newBadges).toEqual([]);
    expect(saved<Record<string, DayResult>>('results', {})[`${TODAY}:easy`].status).toBe('won');
  });
});

describe('colors by year', () => {
  test('700 seeded days and a win: 16 boats in year 2, the galleon still in year 1', async () => {
    seed(700);
    await winToday();
    const { timesEarned, newColorsOn } = await api.loadProgress(TODAY);
    expect(timesEarned.liner).toBe(2);
    expect(timesEarned.galleon).toBe(1);
    expect(Object.values(timesEarned).filter((y) => y === 2).length).toBe(16);
    expect(newColorsOn.liner).toBe(TODAY);
  });

  test('900 seeded days and a win: year 3 up to the longship, year 2 after it', async () => {
    seed(900);
    await winToday();
    const { timesEarned } = await api.loadProgress(TODAY);
    expect(timesEarned.longship).toBe(3);
    expect(timesEarned.pirate).toBe(2);
    expect(timesEarned.galleon).toBe(2);
  });

  test('colors stay earned after the streak breaks', async () => {
    seed(400);
    await winToday();
    storage.setItem(`${KEY}:results`, JSON.stringify({})); // every day forgotten: streak gone
    const { streak, timesEarned } = await api.loadProgress(TODAY);
    expect(streak).toBe(0);
    expect(timesEarned.paper).toBe(2);
  });
});

describe('the Fleet Admiral cup', () => {
  test('1079 seeded days and a win (1080): not yet', async () => {
    seed(1079);
    await winToday();
    expect((await api.loadProgress(TODAY)).trophy).toBe(null);
  });

  test('1080 seeded days and a win (1081): earned today, every boat in year 3', async () => {
    seed(1080);
    await winToday();
    const { trophy, timesEarned } = await api.loadProgress(TODAY);
    expect(trophy).toBe(TODAY);
    expect(Object.values(timesEarned).every((y) => y === 3)).toBe(true);
  });
});

describe('streak repairs', () => {
  test('missed yesterday and the day before: a repair is offered for 2 days', async () => {
    seed(70, [1, 2]); // 68 days played: two repairs earned (one every 30 days), each mends 1 day
    const { repairOffer, repairs } = await api.loadProgress(TODAY);
    expect(repairs.ones).toBe(2);
    expect(repairOffer!.missedDays).toBe(2);
    expect(repairOffer!.streakAfter).toBe(68);
  });

  test('only one repair for a 2-day gap: no offer', async () => {
    seed(40, [1, 2]); // 38 days played: one repair, not enough
    expect((await api.loadProgress(TODAY)).repairOffer).toBe(null);
  });

  test('a gap too big for the repairs in hand: no offer, streak starts over', async () => {
    seed(15, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    const out = await winToday();
    expect(out.streak).toBe(1);
    expect((await api.loadProgress(TODAY)).repairOffer).toBe(null);
  });
});

describe('Reset today (dev bar)', () => {
  test('win, reset, win again: the same boats come back, nothing doubled', async () => {
    seed(2);
    const first = await winToday();
    resetToday(TODAY);
    expect(saved<Record<string, string>>('badges', {}).rowboat === undefined).toBe(true);
    const again = await winToday();
    expect(again.newBadges).toEqual(first.newBadges);
  });

  test('reset also takes back colors and the cup earned today', async () => {
    seed(1080);
    await winToday();
    resetToday(TODAY);
    const after = await api.loadProgress(TODAY);
    expect(after.trophy).toBe(null);
    expect(after.timesEarned.galleon).toBe(undefined as unknown as number);
    await winToday();
    const back = await api.loadProgress(TODAY);
    expect(back.trophy).toBe(TODAY);
    expect(back.timesEarned.galleon).toBe(3);
  });
});
