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
import { MODES, isWin, nextHint, puzzleForDate, score } from './game/game';
import type { Feedback, Mode, Ship } from './game/game';
import { newGame } from './game/reducer';
import type { GameState, Status } from './game/reducer';

export type GuessResult = { feedback: Feedback; status: Status; answer: Ship[] | null };

// One finished puzzle.
export type DayResult = {
  dateKey: string;
  mode: Mode;
  status: 'won' | 'lost';
  guesses: number;
  hints: number;
  playedOn: string; // the day it was actually played; only same-day plays count for streaks
};

export type Progress = { streak: number; badges: Record<string, string> }; // badge kind -> day earned
export type Outcome = { streak: number; newBadges: string[] };
export type DayStats = { average: number; players: number };

export type GameApi = {
  // The player's saved game for this day and mode, or a fresh one.
  loadGame(dateKey: string, mode: Mode): Promise<GameState>;
  // Call after every change so the player can leave and come back.
  saveGame(state: GameState): Promise<void>;
  // Score one guess. `answer` is only sent once the game is over.
  submitGuess(state: GameState, guess: Ship[]): Promise<GuessResult>;
  // Which ship to grey out, or null if there is nothing left to rule out.
  askHint(state: GameState): Promise<Ship | null>;
  // Call once when a game ends. Saves the result and hands out any new badge boats.
  recordResult(state: GameState, today: string): Promise<Outcome>;
  // Finished puzzles for these days, for the harbor log.
  loadResults(dateKeys: string[], mode: Mode): Promise<Record<string, DayResult | undefined>>;
  // Streak and badge boats, for the fleet screen.
  loadProgress(today: string): Promise<Progress>;
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

const gameKey = (dateKey: string, mode: Mode) => `fog:game:${dateKey}:${mode}`;
const RESULTS_KEY = 'fog:results'; // { '2026-11-15:easy': DayResult }
const BADGES_KEY = 'fog:badges';   // { paper: '2026-11-15' }

function streakFrom(results: Record<string, DayResult>, today: string): number {
  const sameDay = Object.values(results).filter((r) => r.playedOn === r.dateKey).map((r) => r.dateKey);
  return computeStreak(new Set(sameDay), today);
}

export const localApi: GameApi = {
  async loadGame(dateKey, mode) {
    const saved = read<GameState | null>(gameKey(dateKey, mode), null);
    return saved ?? newGame(dateKey, mode, puzzleForDate(dateKey, mode).ruledOut);
  },

  async saveGame(state) {
    write(gameKey(state.dateKey, state.mode), state);
  },

  async submitGuess(state, guess) {
    const { code } = puzzleForDate(state.dateKey, state.mode);
    const feedback = score(guess, code);
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
    return nextHint(code, state.ruledOut);
  },

  async recordResult(state, today) {
    const results = read<Record<string, DayResult>>(RESULTS_KEY, {});
    const badges = read<Record<string, string>>(BADGES_KEY, {});
    const key = `${state.dateKey}:${state.mode}`;
    if (state.status === 'playing' || results[key]) {
      return { streak: streakFrom(results, today), newBadges: [] }; // nothing new to record
    }
    results[key] = {
      dateKey: state.dateKey, mode: state.mode, status: state.status,
      guesses: state.guesses.length, hints: state.hintsUsed, playedOn: today,
    };
    write(RESULTS_KEY, results);

    const streak = streakFrom(results, today);
    const due = badgesForStreak(streak);
    if (state.status === 'lost') due.push(MYSTERY_BADGE);
    const newBadges = due.filter((kind) => !badges[kind]);
    for (const kind of newBadges) badges[kind] = today;
    if (newBadges.length) write(BADGES_KEY, badges);
    // Keep them in ladder order so the results screen shows the biggest one last.
    newBadges.sort((a, b) => BADGES.findIndex((x) => x.kind === a) - BADGES.findIndex((x) => x.kind === b));
    return { streak, newBadges };
  },

  async loadResults(dateKeys, mode) {
    const results = read<Record<string, DayResult>>(RESULTS_KEY, {});
    const found: Record<string, DayResult | undefined> = {};
    for (const dateKey of dateKeys) found[dateKey] = results[`${dateKey}:${mode}`];
    return found;
  },

  async loadProgress(today) {
    return {
      streak: streakFrom(read<Record<string, DayResult>>(RESULTS_KEY, {}), today),
      badges: read<Record<string, string>>(BADGES_KEY, {}),
    };
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
