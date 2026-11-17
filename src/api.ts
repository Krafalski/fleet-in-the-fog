// The one place the game talks to "the outside": loading, saving, scoring, results, badges.
// Screens and the reducer only ever call these functions.
//
// Right now this is the LOCAL version: the answer is worked out in the browser and everything
// is saved in localStorage. That is fine for building and testing the game in plain React.
//
// When you move to Devvit, keep the same GameApi shape and write a second version whose
// functions call your server, for example:
//     const res = await fetch('/api/guess', { method: 'POST', body: JSON.stringify({ dateKey, mode, guess }) });
// The server runs puzzleForDate() and score(), saves to Redis, and sends back only the feedback.
// Nothing else in the app has to change.
import { BADGES, MYSTERY_BADGE, badgesForStreak, computeStreak } from './game/badges';
import type { BoatLook } from './Boat';
import { testGame } from './config';
import { MODES, MODE_LIST, isWin, nextHint, puzzleForDate, score, scoreSpots } from './game/game';
import type { DailyMode, Feedback, Mode, Ship } from './game/game';
import { newGame, totalGuesses } from './game/reducer';
import { DAYS_PER_REPAIR, daysCovered, findGap, pickRepairs, repairsEarned } from './game/repairs';
import type { RepairStock } from './game/repairs';
import type { GameState, Status } from './game/reducer';

export type GuessResult = { feedback: Feedback; status: Status; answer: Ship[] | null };

// One finished puzzle.
export type DayResult = {
  dateKey: string;
  mode: DailyMode;
  status: 'won' | 'lost';
  guesses: number;  // every guess made, counting rounds before a Replay, so it can pass the limit
  rounds: number;   // 1 = solved on the first try; 2 or more = used Replay
  hints: number;
  playedOn: string; // the day it was actually played; only same-day plays count for streaks
};

export type Progress = {
  streak: number;
  badges: Record<string, string>;      // badge kind -> day first earned
  timesEarned: Record<string, number>; // badge kind -> how many years it has been earned (1 to 3); sets how many colorways are unlocked
  looks: Record<string, BoatLook>;     // badge kind -> the colorway the player chose to show
  repairs: RepairStock;                // streak repairs the player has, ready to use
  nextRepairIn: number;                // days of play until the next repair is earned
  repairOffer: RepairOffer | null;     // set when a broken streak can be mended right now
};
// A streak that can be mended: how many days were missed, what it costs, and the streak the player gets back.
export type RepairOffer = { missedDays: number; cost: RepairStock; streakAfter: number };
export type Outcome = { streak: number; newBadges: string[] };
export type DayStats = { average: number; players: number };

// Numbers for the fleet screen. Averages count solved puzzles only; null = nothing to average yet.
export type Stats = {
  you: Record<DailyMode, { average: number | null; solved: number }>;
  everyone: Record<DailyMode, number | null>;
  // sightings.easy[3] = how many Easy puzzles were solved in 3 guesses. 8 also holds anything above 8.
  sightings: Record<DailyMode, Record<number, number>>;
};
export const MOST_GUESSES_TRACKED = 8;

export type GameApi = {
  // The player's saved game for this day and mode, or a fresh one.
  // For practice, dateKey is ignored: it returns the practice game in progress, or a new random one.
  loadGame(dateKey: string, mode: Mode): Promise<GameState>;
  // Call after every change so the player can leave and come back.
  saveGame(state: GameState): Promise<void>;
  // Score one guess. `answer` is only sent once the game is over.
  submitGuess(state: GameState, guess: Ship[]): Promise<GuessResult>;
  // Which ship to grey out, or null if there is nothing left to rule out.
  askHint(state: GameState): Promise<Ship | null>;
  // Practice only: the answer, for Give up.
  revealAnswer(state: GameState): Promise<Ship[]>;
  // Call once when a game ends. Saves the result and hands out any new badge boats.
  recordResult(state: GameState, today: string): Promise<Outcome>;
  // Finished puzzles for these days, for the harbor log.
  loadResults(dateKeys: string[], mode: DailyMode): Promise<Record<string, DayResult | undefined>>;
  // Both modes' results for one day, for the end-of-game panel.
  loadDay(dateKey: string): Promise<Record<DailyMode, DayResult | undefined>>;
  // Averages and creature sightings, for the fleet screen.
  loadStats(): Promise<Stats>;
  // Streak and badge boats, for the fleet screen.
  loadProgress(today: string): Promise<Progress>;
  // Spend repairs on the offer in loadProgress. Does nothing if there is no offer.
  useRepair(today: string): Promise<Outcome>;
  // Remember which colorway the player wants a boat shown in.
  saveBoatLook(kind: string, look: BoatLook): Promise<void>;
  // Everyone's average for a day. Needs the server; the local version has nothing to offer.
  loadDayStats(dateKey: string, mode: Mode): Promise<DayStats | null>;
  // Post the player's note as a Reddit comment. Needs the server.
  postComment(dateKey: string, text: string): Promise<void>;
};

// ---------- local version ----------

function read<T>(key: string, fallback: T): T {
  try {
    const saved = localStorage.getItem(key);
    return saved ? (JSON.parse(saved) as T) : fallback;
  } catch {
    return fallback; // storage unavailable or unreadable
  }
}
function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage full or unavailable: the game still works, it just will not be remembered
  }
}

// Test games get their own storage, so flipping testGame never mixes them with real games.
export const STORE = testGame ? 'fog-test' : 'fog';
// There is only ever one practice game in progress, so it has one fixed key.
const gameKey = (dateKey: string, mode: Mode) => (mode === 'practice' ? `${STORE}:practice` : `${STORE}:game:${dateKey}:${mode}`);
// A made-up key that seeds a new random practice puzzle.
export const newPracticeKey = () => `practice-${Date.now()}`;
const RESULTS_KEY = `${STORE}:results`; // { '2026-11-15:easy': DayResult }
const BADGES_KEY = `${STORE}:badges`;   // { paper: '2026-11-15' }
const LOOKS_KEY = `${STORE}:looks`;     // { paper: 'year2' }
const REPAIRS_KEY = `${STORE}:repairs`; // { usedOnes: 1, usedThrees: 0, days: ['2026-11-15'] }
// Test games start with a few repairs, so the repair flow can be tried without playing 30 days.
const TEST_REPAIRS: RepairStock = testGame ? { ones: 2, threes: 2 } : { ones: 0, threes: 0 };
// Earning a boat again in a later year is not built yet, so a real boat counts as earned once.
// In test games every earned boat counts three times, so the colorway switching can be tried.
const TIMES_EARNED = testGame ? 3 : 1;

type RepairsUsed = { usedOnes: number; usedThrees: number; days: string[] }; // days = the missed days that were mended
const readRepairs = () => read<RepairsUsed>(REPAIRS_KEY, { usedOnes: 0, usedThrees: 0, days: [] });

// Days that count toward the streak: either puzzle solved on the day itself.
function solvedDays(results: Record<string, DayResult>): Set<string> {
  return new Set(Object.values(results).filter((r) => r.status === 'won' && r.playedOn === r.dateKey).map((r) => r.dateKey));
}
function streakFrom(results: Record<string, DayResult>, today: string): number {
  return computeStreak(solvedDays(results), today, new Set(readRepairs().days));
}

// Repairs in hand, how long until the next one, and whether a broken streak can be mended right now.
function repairState(results: Record<string, DayResult>, today: string) {
  const used = readRepairs();
  // Any puzzle finished on its own day counts as a day played, win or lose.
  const daysPlayed = new Set(Object.values(results).filter((r) => r.playedOn === r.dateKey).map((r) => r.dateKey)).size;
  const earned = repairsEarned(daysPlayed);
  const repairs: RepairStock = {
    ones: earned.ones + TEST_REPAIRS.ones - used.usedOnes,
    threes: earned.threes + TEST_REPAIRS.threes - used.usedThrees,
  };
  const solved = solvedDays(results);
  const mended = new Set(used.days);
  const gap = findGap(solved, mended, today, daysCovered(repairs));
  const cost = gap ? pickRepairs(gap.length, repairs) : null;
  const offer: RepairOffer | null = gap && cost
    ? { missedDays: gap.length, cost, streakAfter: computeStreak(solved, today, new Set([...used.days, ...gap])) }
    : null;
  return { repairs, nextRepairIn: DAYS_PER_REPAIR - (daysPlayed % DAYS_PER_REPAIR), offer, gap, used };
}

// Hands out any streak boats the player's streak has reached but they do not have yet.
function awardStreakBadges(streak: number, today: string, extra: string[] = []): string[] {
  const badges = read<Record<string, string>>(BADGES_KEY, {});
  const newBadges = [...badgesForStreak(streak), ...extra].filter((kind) => !badges[kind]);
  for (const kind of newBadges) badges[kind] = today;
  if (newBadges.length) write(BADGES_KEY, badges);
  // Keep them in ladder order, so the biggest one comes last.
  newBadges.sort((a, b) => BADGES.findIndex((x) => x.kind === a) - BADGES.findIndex((x) => x.kind === b));
  return newBadges;
}

export const localApi: GameApi = {
  async loadGame(dateKey, mode) {
    if (mode === 'practice') {
      const saved = read<Partial<GameState> | null>(gameKey(dateKey, mode), null);
      const fresh = newGame(saved?.dateKey ?? newPracticeKey(), mode);
      return saved ? { ...fresh, ...saved } : fresh;
    }
    const fresh = newGame(dateKey, mode, puzzleForDate(dateKey, mode).ruledOut);
    const saved = read<Partial<GameState> | null>(gameKey(dateKey, mode), null);
    // Start from a fresh game so a save from an older version still has every field.
    return saved ? { ...fresh, ...saved } : fresh;
  },

  async saveGame(state) {
    write(gameKey(state.dateKey, state.mode), state);
  },

  async submitGuess(state, guess) {
    const { code } = puzzleForDate(state.dateKey, state.mode);
    const feedback: Feedback = { ...score(guess, code), spots: scoreSpots(guess, code) };
    const guessesMade = state.guesses.length + 1;
    const status: Status = isWin(feedback, state.mode)
      ? 'won'
      : guessesMade >= MODES[state.mode].maxGuesses
        ? 'lost'
        : 'playing';
    return { feedback, status, answer: status === 'playing' ? null : code };
  },

  async askHint(state) {
    const { code } = puzzleForDate(state.dateKey, state.mode);
    return nextHint(code, state.ruledOut, MODES[state.mode].ships);
  },

  async revealAnswer(state) {
    return puzzleForDate(state.dateKey, state.mode).code;
  },

  async recordResult(state, today) {
    const results = read<Record<string, DayResult>>(RESULTS_KEY, {});
    const key = `${state.dateKey}:${state.mode}`;
    // Practice never counts.
    if (state.status === 'playing' || results[key] || state.mode === 'practice') {
      return { streak: streakFrom(results, today), newBadges: [] }; // nothing new to record
    }
    results[key] = {
      dateKey: state.dateKey, mode: state.mode as DailyMode, status: state.status,
      guesses: totalGuesses(state), rounds: state.rounds, hints: state.hintsUsed, playedOn: today,
    };
    write(RESULTS_KEY, results);

    const streak = streakFrom(results, today);
    return { streak, newBadges: awardStreakBadges(streak, today, state.status === 'lost' ? [MYSTERY_BADGE] : []) };
  },

  async loadResults(dateKeys, mode) {
    const results = read<Record<string, DayResult>>(RESULTS_KEY, {});
    const found: Record<string, DayResult | undefined> = {};
    for (const dateKey of dateKeys) found[dateKey] = results[`${dateKey}:${mode}`];
    return found;
  },

  async loadDay(dateKey) {
    const results = read<Record<string, DayResult>>(RESULTS_KEY, {});
    return { easy: results[`${dateKey}:easy`], hard: results[`${dateKey}:hard`] };
  },

  async loadStats() {
    const results = Object.values(read<Record<string, DayResult>>(RESULTS_KEY, {}));
    const stats: Stats = {
      you: { easy: { average: null, solved: 0 }, hard: { average: null, solved: 0 } },
      everyone: { easy: null, hard: null }, // needs the server: there is only one player in the browser
      sightings: { easy: {}, hard: {} },
    };
    for (const mode of MODE_LIST) {
      const solved = results.filter((r) => r.mode === mode && r.status === 'won');
      if (solved.length) {
        const sum = solved.reduce((total, r) => total + r.guesses, 0);
        stats.you[mode] = { average: sum / solved.length, solved: solved.length };
      }
      for (const r of solved) {
        const bucket = Math.min(r.guesses, MOST_GUESSES_TRACKED);
        stats.sightings[mode][bucket] = (stats.sightings[mode][bucket] ?? 0) + 1;
      }
    }
    return stats;
  },

  async loadProgress(today) {
    const badges = read<Record<string, string>>(BADGES_KEY, {});
    const timesEarned: Record<string, number> = {};
    for (const kind of Object.keys(badges)) timesEarned[kind] = TIMES_EARNED;
    const results = read<Record<string, DayResult>>(RESULTS_KEY, {});
    const { repairs, nextRepairIn, offer } = repairState(results, today);
    return {
      streak: streakFrom(results, today),
      badges,
      timesEarned,
      looks: read<Record<string, BoatLook>>(LOOKS_KEY, {}),
      repairs,
      nextRepairIn,
      repairOffer: offer,
    };
  },

  async useRepair(today) {
    const results = read<Record<string, DayResult>>(RESULTS_KEY, {});
    const { offer, gap, used } = repairState(results, today);
    if (!offer || !gap) return { streak: streakFrom(results, today), newBadges: [] };
    write(REPAIRS_KEY, {
      usedOnes: used.usedOnes + offer.cost.ones,
      usedThrees: used.usedThrees + offer.cost.threes,
      days: [...used.days, ...gap],
    });
    // The streak is back where it was, plus any days played since. That can be enough for a new boat.
    const streak = streakFrom(results, today);
    return { streak, newBadges: awardStreakBadges(streak, today) };
  },

  async saveBoatLook(kind, look) {
    write(LOOKS_KEY, { ...read<Record<string, BoatLook>>(LOOKS_KEY, {}), [kind]: look });
  },

  async loadDayStats() {
    return null;
  },

  async postComment() {
    // Nothing to post to yet. On Devvit, the server submits this as a comment on the day's post.
  },
};

// The version the app uses. Point this at your server version when you move to Devvit.
export const api: GameApi = localApi;

// ---------- dev tools (only used by the DevBar on localhost) ----------
// Forget today's games in both modes, so today can be played from the very start.
// Boats earned today are taken back too, so winning again earns them again.
export function resetToday(today: string) {
  for (const mode of ['easy', 'hard'] as const) localStorage.removeItem(gameKey(today, mode));
  const results = read<Record<string, DayResult>>(RESULTS_KEY, {});
  for (const key of Object.keys(results)) if (key.startsWith(`${today}:`)) delete results[key];
  write(RESULTS_KEY, results);
  const badges = read<Record<string, string>>(BADGES_KEY, {});
  for (const kind of Object.keys(badges)) if (badges[kind] === today) delete badges[kind];
  write(BADGES_KEY, badges);
}
// Forget everything this game has saved (only the test games when the test game is on).
export function resetAll() {
  for (const key of Object.keys(localStorage)) if (key.startsWith(`${STORE}:`)) localStorage.removeItem(key);
}
