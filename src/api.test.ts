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
import { answerLine, parseDays, seedDays } from './devUrl';

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

describe('the albatross', () => {
  test('every ship right, every spot wrong: sighted every time, and counted', async () => {
    const { puzzleForDate, score } = await import('./game/game');
    // Find a day whose fleet can be shuffled so every ship is in the wrong spot.
    let day = TODAY, shuffled: number[] = [];
    for (let i = 0; i < 400; i++) {
      day = addDays(TODAY, i);
      const { code } = puzzleForDate(day, 'easy');
      const r = [code[1], code[2], code[3], code[0]];
      const f = score(r, code);
      if (f.exact === 0 && f.near === 4) { shuffled = r; break; }
    }
    expect(shuffled.length).toBe(4);
    const first = await api.submitGuess(newGame(day, 'easy'), shuffled);
    expect(first.albatross).toBe(1);
    const again = await api.submitGuess(newGame(day, 'easy'), shuffled);
    expect(again.albatross).toBe(2);
    expect((await api.loadProgress(TODAY)).albatrossCount).toBe(2);
  });
  test('practice never sights it', async () => {
    const game = newGame('practice-7', 'practice-easy');
    const { code } = (await import('./game/game')).puzzleForDate('practice-7', 'practice-easy');
    const out = await api.submitGuess(game, [code[1], code[2], code[3], code[0]]);
    expect(out.albatross).toBe(undefined);
  });
});

describe('score', () => {
  test('hints add to the score, and creatures are sighted by score', async () => {
    // Won in 3 guesses with 2 hints: score 5, so it counts as an octopus (5), not a manta ray (3).
    await api.recordResult({ ...finished('won'), hintsUsed: 2 }, TODAY);
    const stats = await api.loadStats();
    expect(stats.you.easy.average).toBe(3);
    expect(stats.you.easy.hints).toBe(2);
    expect(stats.you.easy.score).toBe(5);
    expect(stats.sightings.easy[5]).toBe(1);
    expect(stats.sightings.easy[3]).toBe(undefined);
  });
});

describe('address add-ons (?seed=)', () => {
  test('skip=1,23 reads as days 1 and 23; junk is ignored', () => {
    expect(parseDays('1,23')).toEqual([1, 23]);
    expect(parseDays('2, x, 0, 5')).toEqual([2, 5]);
    expect(parseDays(null)).toEqual([]);
  });
  test('?seed=29 then a win today is a 30-day streak: the houseboat', async () => {
    seedDays(KEY, TODAY, 29, [], 'easy');
    const out = await winToday();
    expect(out.streak).toBe(30);
    expect(out.newBadges.includes('houseboat')).toBe(true);
  });
  test('?seed=5&skip=1,2 leaves a two-day gap', async () => {
    expect(seedDays(KEY, TODAY, 5, [1, 2], 'easy')).toBe(3);
    const out = await winToday();
    expect(out.streak).toBe(1);
  });
  test('seeded wins never pass the mode\'s guess limit', () => {
    seedDays(KEY, TODAY, 200, [], 'easy');
    const results = Object.values(saved<Record<string, DayResult>>('results', {}));
    expect(results.every((r) => r.guesses >= 1 && r.guesses <= 6)).toBe(true);
  });
});

describe('restarting one mode today', () => {
  test('restart-today=easy forgets Easy, keeps Hard and the boat it earned', async () => {
    await winToday('easy');
    await winToday('hard');
    resetToday(TODAY, ['easy']);
    const day = await api.loadDay(TODAY);
    expect(day.easy).toBe(undefined);
    expect(day.hard?.status).toBe('won');
    expect((await api.loadProgress(TODAY)).badges.paper).toBe(TODAY);
  });
});

describe('the answer line in the console', () => {
  test('names the day and both fleets in color words', () => {
    const line = answerLine('2026-11-18');
    expect(line.startsWith('Wednesday, November 18. Easy: ')).toBe(true);
    expect(line.includes(' || Hard: ')).toBe(true);
  });
});

describe('spyglass', () => {
  // A Hard game today with one guess that has the first ship in the right spot.
  async function hardWithRightSpot(mode: 'hard' | 'practice-hard' = 'hard'): Promise<GameState> {
    const { puzzleForDate } = await import('./game/game');
    const key = mode === 'hard' ? TODAY : 'practice-9';
    const { code } = puzzleForDate(key, mode);
    const other = (code[0] + 1) % 6;
    const guess = [code[0], other, other, other, other];
    const game = { ...newGame(key, mode), perSpot: false };
    const fb = await api.submitGuess(game, guess);
    return { ...game, guesses: [guess], feedback: [fb.feedback] };
  }

  test('2 golden spyglasses come with every new boat', async () => {
    await winToday(); // paper boat
    expect((await api.loadProgress(TODAY)).goldenSpyglasses).toBe(2);
  });
  test('golden ones cost 0; once they run out each one costs 2', async () => {
    await winToday('easy'); // paper boat: 2 golden
    const game = await hardWithRightSpot();
    const first = await api.useSpyglass(game, TODAY);
    expect(first?.cost).toBe(0);
    expect(first?.golden).toBe(true);
    await api.useSpyglass(game, TODAY);
    const third = await api.useSpyglass(game, TODAY);
    expect(third?.cost).toBe(2);
    expect(third?.golden).toBe(false);
    expect((await api.loadProgress(TODAY)).goldenSpyglasses).toBe(0);
  });
  test('it shows a ship that really is in the right spot', async () => {
    const { puzzleForDate } = await import('./game/game');
    const used = await api.useSpyglass(await hardWithRightSpot(), TODAY);
    expect(used?.spot).toBe(0);
    expect(used?.ship).toBe(puzzleForDate(TODAY, 'hard').code[0]);
  });
  test('needs a right-spot ship first, and never works in Easy', async () => {
    const empty = { ...newGame(TODAY, 'hard'), perSpot: false };
    expect((await api.checkSpyglass(empty)).available).toBe(false);
    expect((await api.checkSpyglass(newGame(TODAY, 'easy'))).allowed).toBe(false);
  });
  test('Practice never spends golden ones; it always costs 2', async () => {
    await winToday(); // 2 golden
    const used = await api.useSpyglass(await hardWithRightSpot('practice-hard'), TODAY);
    expect(used?.cost).toBe(2);
    expect((await api.loadProgress(TODAY)).goldenSpyglasses).toBe(2);
  });
  test("its points raise the score, but it never costs a guess", async () => {
    // 6 guesses + 1 regular spyglass (2) = score 8, and the game is still on with guesses left.
    const { puzzleForDate } = await import('./game/game');
    const code = puzzleForDate(TODAY, 'hard').code;
    const wrong = code.map((c) => (c + 1) % 6);
    const busy = { ...newGame(TODAY, 'hard'), perSpot: false, guesses: new Array(6).fill(wrong), spyglasses: 3, spyglassPoints: 6 };
    expect((await api.submitGuess(busy, wrong)).status).toBe('playing'); // guess 7 of 10: still playing
    const s = { ...finished('won', 'hard'), guesses: new Array(6).fill([0, 0, 0, 0, 0]), spyglasses: 1, spyglassPoints: 2 };
    await api.recordResult(s, TODAY);
    const stats = await api.loadStats();
    expect(stats.you.hard.score).toBe(8);
    expect(stats.sightings.hard[8]).toBe(1);
  });
  test('Reset today gives back golden spyglasses used today', async () => {
    await winToday('easy');
    await api.useSpyglass(await hardWithRightSpot(), TODAY);
    resetToday(TODAY, ['hard']);
    expect((await api.loadProgress(TODAY)).goldenSpyglasses).toBe(2);
  });
});
