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
import type { DailyMode, Ship } from './game/game';
import { MODES, puzzleForDate } from './game/game';
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

  test('2 seeded days and a win: a 3-day streak, the kayak and the rowboat', async () => {
    seed(2);
    const out = await winToday();
    expect(out.streak).toBe(3);
    expect(out.newBadges).toEqual(['paper', 'kayak', 'rowboat']);
  });

  test('359 seeded days and a win: all 20 streak boats, but no ghost ship', async () => {
    seed(359);
    await winToday();
    const badges = saved<Record<string, string>>('badges', {});
    expect(Object.keys(badges).length).toBe(20);
    expect(badges.galleon).toBe(TODAY);
    expect(badges.ghost === undefined).toBe(true);
  });

  test('a loss earns the ghost ship and does not add to the streak', async () => {
    seed(4);
    const out = await api.recordResult(finished('lost'), TODAY);
    expect(out.newBadges.includes('ghost')).toBe(true);
    expect(out.streak).toBe(4);
  });

  test('a Bay loss brings the light ghost, an Open Sea loss the dark one', async () => {
    expect((await api.recordResult(finished('lost', 'easy'), TODAY)).newBadges).toEqual(['ghost']);
    expect((await api.recordResult(finished('lost', 'hard'), TODAY)).newBadges).toEqual(['ghostDark']);
    const badges = saved<Record<string, string>>('badges', {});
    expect([badges.ghost, badges.ghostDark]).toEqual([TODAY, TODAY]);
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

describe('two tracks: Bay and Open Sea looks', () => {
  const looksOf = async () => (await api.loadProgress(TODAY)).looksEarned;

  test('30 days of Bay only: Bay looks up to the houseboat, no Open Sea looks', async () => {
    seed(29);
    await winToday('easy');
    const looks = await looksOf();
    expect(looks['houseboat:color']).toBe(TODAY);
    expect(looks['catamaran:color']).toBe(undefined as unknown as string); // needs 45 Bay wins
    expect(Object.keys(looks).some((k) => k.endsWith(':sea'))).toBe(false);
  });

  test('then 5 Open Sea wins: Open Sea paper boat, kayak and rowboat, not the canoe', async () => {
    seed(29);
    seed(4, [], 'hard');
    await winToday('easy');
    await winToday('hard');
    const { looksEarned, wins } = await api.loadProgress(TODAY);
    expect(wins).toEqual({ bay: 30, sea: 5 });
    expect(['paper', 'kayak', 'rowboat'].every((k) => looksEarned[`${k}:sea`])).toBe(true);
    expect(looksEarned['canoe:sea']).toBe(undefined as unknown as string);
  });

  test('after the first month only a 30-day streak is needed: 219 wins, a break, then 31 days', async () => {
    seed(220, [31]);
    const out = await winToday();
    expect(out.streak).toBe(31);
    const looks = await looksOf();
    expect(looks['longship:color']).toBe(TODAY);   // 180 wins
    expect(looks['pirate:color']).toBe(TODAY);     // 210 wins
    expect(looks['icebreaker:color']).toBe(undefined as unknown as string); // 240 wins: not yet
  });

  test('a short streak holds the next look back even with plenty of wins', async () => {
    seed(220, [10]); // a break 10 days ago: streak of 10 with today
    await winToday();
    const looks = await looksOf();
    expect(looks['raft:color']).toBe(TODAY);       // 10 wins, 10-day streak
    expect(looks['gondola:color']).toBe(undefined as unknown as string); // 14-day streak needed
  });

  test('earned looks stay after the streak breaks, and wins never reset', async () => {
    seed(40);
    await winToday();
    storage.setItem(`${KEY}:results`, JSON.stringify({}));
    const { streak, looksEarned } = await api.loadProgress(TODAY);
    expect(streak).toBe(0);
    expect(looksEarned['houseboat:color']).toBe(TODAY);
  });

  test('past days played later count for nothing here', async () => {
    const results = saved<Record<string, DayResult>>('results', {});
    for (let i = 1; i <= 10; i++) { const day = addDays(TODAY, -i); results[`${day}:hard`] = { dateKey: day, mode: 'hard', status: 'won', guesses: 4, rounds: 1, hints: 0, playedOn: TODAY }; }
    storage.setItem(`${KEY}:results`, JSON.stringify(results));
    expect((await api.loadProgress(TODAY)).wins).toEqual({ bay: 0, sea: 0 });
  });

  test('year 2: 400 Bay days gives gold up to the houseboat (390), not the catamaran (405)', async () => {
    seed(399);
    await winToday();
    const looks = await looksOf();
    expect(looks['paper:gold']).toBe(TODAY);
    expect(looks['houseboat:gold']).toBe(TODAY);
    expect(looks['catamaran:gold']).toBe(undefined as unknown as string);
    expect(Object.keys(looks).some((k) => k.endsWith(':jewel'))).toBe(false);
  });

  test('a win card only lists the looks its own game earned', async () => {
    seed(6);
    seed(6, [], 'hard');
    await winToday('easy');
    await winToday('hard');
    const { looksEarnedBy } = await api.loadProgress(TODAY);
    expect(looksEarnedBy['canoe:color']).toBe(`${TODAY}:easy`);
    expect(looksEarnedBy['canoe:sea']).toBe(`${TODAY}:hard`);
  });

  test('older saves carry over: boats keep their colors, old second-year colors become the Open Sea look', async () => {
    storage.setItem(`${KEY}:badges`, JSON.stringify({ paper: '2026-01-01', rowboat: '2026-01-03' }));
    storage.setItem(`${KEY}:years`, JSON.stringify({ paper: 2 }));
    const looks = await looksOf();
    expect(looks['paper:color']).toBe('2026-01-01');
    expect(looks['paper:sea']).toBe('2026-01-01');
    expect(looks['rowboat:sea']).toBe(undefined as unknown as string);
  });
});

describe('the Fleet Admiral cup', () => {
  test('720 Bay wins but 719 Open Sea: not yet', async () => {
    seed(719);
    seed(719, [], 'hard');
    await winToday('easy');
    expect((await api.loadProgress(TODAY)).trophy).toBe(null);
  });

  test('720 wins in each game: earned today, every boat in all four looks', async () => {
    seed(719);
    seed(719, [], 'hard');
    await winToday('easy');
    await winToday('hard');
    const { trophy, looksEarned } = await api.loadProgress(TODAY);
    expect(trophy).toBe(TODAY);
    expect(Object.keys(looksEarned).length).toBe(80);
  });
});

describe('streak repairs', () => {
  test('missed yesterday and the day before: a repair is offered for 2 days', async () => {
    seed(70, [1, 2]); // 68 days played: repairs from days 4, 25 and 52, each mends 1 day
    const { repairOffer, repairs } = await api.loadProgress(TODAY);
    expect(repairs.ones).toBe(3);
    expect(repairOffer!.missedDays).toBe(2);
    expect(repairOffer!.streakAfter).toBe(68);
  });

  test('only one repair for a 2-day gap: no offer', async () => {
    seed(12, [1, 2]); // 10 days played: one repair (day 4), not enough
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

  test('reset also takes back looks and the cup earned today', async () => {
    seed(719);
    seed(719, [], 'hard');
    await winToday('easy');
    await winToday('hard');
    resetToday(TODAY);
    const after = await api.loadProgress(TODAY);
    expect(after.trophy).toBe(null);
    expect(after.looksEarned['galleon:jewel']).toBe(undefined as unknown as string);
    await winToday('easy');
    await winToday('hard');
    const back = await api.loadProgress(TODAY);
    expect(back.trophy).toBe(TODAY);
    expect(back.looksEarned['galleon:jewel']).toBe(TODAY);
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
  test('practice shows it for fun (0) but never counts it', async () => {
    // Find a practice fleet where moving every ship one spot over gives every ship right, every spot wrong.
    const { puzzleForDate } = await import('./game/game');
    let key = '';
    let guess: number[] = [];
    for (let i = 0; i < 500 && !key; i++) {
      const { code } = puzzleForDate(`practice-${i}`, 'practice-easy');
      const g = [code[1], code[2], code[3], code[0]];
      if (g.every((ship, spot) => ship !== code[spot])) { key = `practice-${i}`; guess = g; }
    }
    const out = await api.submitGuess(newGame(key, 'practice-easy'), guess);
    expect(out.albatross).toBe(0);
    expect((await api.loadProgress(TODAY)).albatrossCount).toBe(0);
  });
});

describe('practice Bay rows', () => {
  // Plays practice-1 under each ship: five guesses that miss, then the given last guess.
  async function playSix(last: 'right' | 'wrong') {
    const { puzzleForDate } = await import('./game/game');
    const key = 'practice-1';
    const { code } = puzzleForDate(key, 'practice-easy');
    const miss = code.map((ship) => (ship + 1) % 5);
    let state = newGame(key, 'practice-easy');
    for (let i = 0; i < 6; i++) {
      const guess = i === 5 && last === 'right' ? code : miss;
      const out = await api.submitGuess(state, guess);
      state = { ...state, guesses: [...state.guesses, guess], status: out.status };
    }
    return state;
  }
  test('a 6th wrong guess under each ship ends the game (no 8 rows)', async () => {
    expect((await playSix('wrong')).status).toBe('lost');
  });
  test('winning on the 6th guess is a win, and the board stays at 6 rows', async () => {
    const { rowsFor } = await import('./game/game');
    const state = await playSix('right');
    expect(state.status).toBe('won');
    expect(rowsFor('practice-easy', true, state.guesses.length, false)).toBe(6);
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
    expect(line.startsWith('Wednesday, November 18. Bay: ')).toBe(true);
    expect(line.includes(' || Open Sea: ')).toBe(true);
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

  test('2 golden Spyglasses come with every new boat', async () => {
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
  test('Reset today gives back golden Spyglasses used today', async () => {
    await winToday('easy');
    await api.useSpyglass(await hardWithRightSpot(), TODAY);
    resetToday(TODAY, ['hard']);
    expect((await api.loadProgress(TODAY)).goldenSpyglasses).toBe(2);
  });
});

describe('adding repairs (?add-repairs=, ?add-long-repairs=)', () => {
  test('added repairs show up in the stock', async () => {
    const { addRepairs } = await import('./api');
    addRepairs(2, 1);
    const p = await api.loadProgress(TODAY);
    expect(p.repairs.ones).toBe(2);
    expect(p.repairs.threes).toBe(1);
  });
});

describe('next unplayed day', () => {
  test('the oldest past day not played in that mode', async () => {
    const { LAUNCH_DATE } = await import('./game/game');
    expect(await api.nextUnplayed('easy', TODAY)).toBe(LAUNCH_DATE);
    await api.recordResult({ ...finished('won'), dateKey: LAUNCH_DATE }, TODAY);
    const next = await api.nextUnplayed('easy', TODAY);
    expect(next !== LAUNCH_DATE && next !== null).toBe(true);
    expect(await api.nextUnplayed('hard', TODAY)).toBe(LAUNCH_DATE);
  });
});

describe('hints include spyglass points', () => {
  test('the Hints average counts Lookouts and paid spyglasses', async () => {
    await api.recordResult({ ...finished('won', 'hard'), hintsUsed: 1, spyglasses: 1, spyglassPoints: 2 }, TODAY);
    const stats = await api.loadStats();
    expect(stats.you.hard.hints).toBe(3);
    expect(stats.you.hard.score).toBe((stats.you.hard.average ?? 0) + 3);
  });
});

describe('the nautilus and the compass', () => {
  test('the Bay and the Open Sea won with the same score on one day: a nautilus, counted', async () => {
    await winToday('easy');
    const out = await winToday('hard'); // both in 3 guesses, no hints
    expect(out.nautilus).toBe(1);
    const p = await api.loadProgress(TODAY);
    expect([p.nautilus, p.nautilusCount]).toEqual([TODAY, 1]);
  });

  test('different scores, or a loss: no nautilus', async () => {
    await winToday('easy');
    const hard = { ...finished('won', 'hard'), hintsUsed: 1 }; // score 4 vs 3
    expect((await api.recordResult(hard, TODAY)).nautilus).toBe(undefined as unknown as number);
    expect((await api.loadProgress(TODAY)).nautilusCount).toBe(0);
  });

  test('the Bay took more guesses than the Open Sea: a crab, counted; the reverse gets nothing', async () => {
    const four = (mode: DailyMode) => { const f = finished('won', mode); return { ...f, guesses: [...f.guesses, f.guesses[0]] }; };
    await api.recordResult(four('easy'), TODAY); // Bay in 4
    const out = await winToday('hard');           // Open Sea in 3
    expect(out.crab).toBe(1);
    expect(out.nautilus).toBe(undefined as unknown as number);
    expect([(await api.loadProgress(TODAY)).crab, (await api.loadProgress(TODAY)).crabCount]).toEqual([TODAY, 1]);
    storage.clear();
    await winToday('easy');
    expect((await api.recordResult(four('hard'), TODAY)).crab).toBe(undefined as unknown as number);
  });

  test('a hint does not buy a crab: guesses only', async () => {
    await winToday('easy');
    const out = await api.recordResult({ ...finished('won', 'hard'), hintsUsed: 2 }, TODAY);
    expect(out.crab).toBe(undefined as unknown as number);
  });

  test('a win after Keep trying: a hermit crab, once per game', async () => {
    await api.recordResult(finished('lost'), TODAY);
    const kept = { ...finished('won'), tries: [3] } as GameState;
    expect((await api.recordResult(kept, TODAY)).hermit).toBe(1);
    expect((await api.recordResult(kept, TODAY)).hermit).toBe(1);
    const p = await api.loadProgress(TODAY);
    expect([p.hermit, p.hermitCount, p.streak]).toEqual([TODAY, 1, 0]);
  });

  test('the compass is found once', async () => {
    expect(await api.findCompass(TODAY)).toBe(true);
    expect(await api.findCompass(TODAY)).toBe(false);
    expect((await api.loadProgress(TODAY)).compass).toBe(TODAY);
  });
});

describe('barnacle, starfish, sand dollar, lobsters, walruses', () => {
  const extras = async () => (await api.loadProgress(TODAY)).extras;
  // A guess with every ship of the answer, none in its spot (an albatross), or null if there isn't one.
  function albatrossFor(code: Ship[]): Ship[] | null {
    const perms = (xs: Ship[]): Ship[][] => xs.length <= 1 ? [xs] : xs.flatMap((x, i) => perms([...xs.slice(0, i), ...xs.slice(i + 1)]).map((p) => [x, ...p]));
    return perms(code).find((p) => p.every((ship, i) => ship !== code[i])) ?? null;
  }

  test('an albatross on the very first guess: a lobster, red in the Bay and blue in the Open Sea, counted', async () => {
    let checked = 0;
    for (const mode of ['easy', 'hard'] as DailyMode[]) {
      const code = puzzleForDate(TODAY, mode).code;
      const guess = albatrossFor(code);
      if (!guess) continue; // a fleet of one ship type can't make an albatross
      checked++;
      const out = await api.submitGuess(newGame(TODAY, mode), guess);
      expect(out.lobster).toBe(1);
      expect((await extras())[mode === 'hard' ? 'bluelobster' : 'lobster'].count).toBe(1);
      // Not on a later guess.
      const later = { ...newGame(TODAY, mode), guesses: [code.map(() => code[0])], feedback: [] } as GameState;
      expect((await api.submitGuess(later, guess)).lobster).toBe(undefined as unknown as number);
    }
    expect(checked).toBeGreaterThan(0);
  });

  test('a win on the very last row: a walrus (Bay) or a pink walrus (Open Sea), counted', async () => {
    for (const mode of ['easy', 'hard'] as DailyMode[]) {
      const f = finished('won', mode);
      const out = await api.recordResult({ ...f, guesses: new Array(MODES[mode].maxGuesses).fill(f.guesses[0]) }, TODAY);
      expect(out.walrus).toBe(1);
    }
    const x = await extras();
    expect([x.walrus.count, x.pinkwalrus.count]).toEqual([1, 1]);
    storage.clear();
    expect((await winToday('easy')).walrus).toBe(undefined as unknown as number); // 3 of 6 rows
  });

  test('lost the first Keep trying too: a barnacle, once ever', async () => {
    await api.recordResult(finished('lost'), TODAY);
    const again = { ...finished('lost'), tries: [6] } as GameState;
    expect((await api.recordResult(again, TODAY)).barnacle).toBe(true);
    expect((await api.recordResult(again, TODAY)).barnacle).toBe(undefined as unknown as boolean);
    expect((await extras()).barnacle.count).toBe(1);
  });

  test('five Bay wins in Past games: a starfish, once; five Open Sea: a sand dollar', async () => {
    const past = (i: number, mode: DailyMode) => {
      const s = newGame(addDays(TODAY, -i), mode);
      const row = new Array(s.current.length).fill(0);
      return { ...s, status: 'won', guesses: [row, row], feedback: [], answer: row } as GameState;
    };
    for (let i = 1; i <= 4; i++) expect((await api.recordResult(past(i, 'easy'), TODAY)).starfish).toBe(undefined as unknown as boolean);
    await winToday('easy'); // today's own win isn't a Past game
    expect((await api.recordResult(past(5, 'easy'), TODAY)).starfish).toBe(true);
    expect((await api.recordResult(past(6, 'easy'), TODAY)).starfish).toBe(undefined as unknown as boolean);
    for (let i = 1; i <= 5; i++) await api.recordResult(past(i, 'hard'), TODAY);
    const x = await extras();
    expect([x.starfish.count, x.sanddollar.count]).toEqual([1, 1]);
  });
});

describe('catch-up and the silver compass', () => {
  test('opening the game hands out boat looks already earned but never awarded', async () => {
    await winToday('easy');
    // Pretend the Bay paper boat look was never handed out (a boat added after the win, say).
    const looks = JSON.parse(storage.getItem('fog:boatLooks') ?? '{}');
    const key = Object.keys(looks)[0];
    delete looks[key];
    storage.setItem('fog:boatLooks', JSON.stringify(looks));
    expect((await api.loadProgress(TODAY)).looksEarned[key]).toBe(TODAY);
  });

  test('the gold and silver compasses are found once each', async () => {
    expect(await api.findCompass(TODAY, 'silver')).toBe(true);
    expect(await api.findCompass(TODAY, 'silver')).toBe(false);
    expect(api.hasCompass!('gold')).toBe(false);
    expect(await api.findCompass(TODAY)).toBe(true);
    const p = await api.loadProgress(TODAY);
    expect([p.compass, p.silverCompass]).toEqual([TODAY, TODAY]);
  });
});
