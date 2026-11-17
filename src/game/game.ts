// Pure game rules. No React, no Reddit, no storage.
// Everything here is a plain function, so it is easy to test and moves to the server unchanged.
import { MAX_REPEATS, NEW_GAME_TIME, NEW_GAME_ZONE, testGame } from '../config';
import { addDays } from './dates';

// A ship is a number 0-5. Numbers are what get stored and compared;
// they only turn into pictures when drawn (see SHIP_KINDS in Boat.tsx).
// 0 fisher, 1 junk, 2 mailboat, 3 schooner, 4 tug, 5 yacht
export type Ship = number;
export const SHIP_COUNT = 6;

export type Mode = 'easy' | 'hard';
export const MODE_LIST: Mode[] = ['easy', 'hard'];

export const MODES: Record<Mode, { slots: number; maxGuesses: number; label: string }> = {
  easy: { slots: 4, maxGuesses: 8, label: 'Easy' },
  hard: { slots: 5, maxGuesses: 10, label: 'Hard' },
};

// In test games every spot holds this ship (1 = junk). See config.ts.
const TEST_SHIP: Ship = 1;

// The first day with a puzzle. The harbor log does not go back further. Set this when you launch.
export const LAUNCH_DATE = '2026-11-06';


export type Feedback = { exact: number; near: number };

// ---------- scoring ----------

// exact = right ship, right spot. near = right ship, wrong spot.
export function score(guess: Ship[], code: Ship[]): Feedback {
  let exact = 0;
  const guessRest: Ship[] = [];
  const codeRest: Ship[] = [];
  for (let i = 0; i < code.length; i++) {
    if (guess[i] === code[i]) exact++;
    else {
      guessRest.push(guess[i]);
      codeRest.push(code[i]);
    }
  }
  let near = 0;
  for (const ship of guessRest) {
    const at = codeRest.indexOf(ship);
    if (at !== -1) {
      near++;
      codeRest.splice(at, 1); // each ship in the code can only be matched once
    }
  }
  return { exact, near };
}

export function isWin(feedback: Feedback, mode: Mode): boolean {
  return feedback.exact === MODES[mode].slots;
}

// ---------- the daily puzzle ----------

// Turns a string into a number, to seed the random generator.
function hashString(text: string): number {
  let h = 0;
  for (const ch of text) h = (Math.imul(h, 31) + ch.charCodeAt(0)) >>> 0;
  return h;
}

// A small seeded random generator (mulberry32). Same seed, same sequence, every time.
function seededRandom(seed: number): () => number {
  return () => {
    seed = (seed + 0x6d2b79f5) >>> 0;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type Puzzle = {
  code: Ship[];
  // Ships greyed out before the first guess. No mode uses this right now, but the board supports it.
  ruledOut: Ship[];
};

// dateKey looks like '2026-11-15'. Everyone gets the same puzzle for the same date and mode.
// IMPORTANT: in the real game, call this on the server only, so nobody can read the answer.
export function puzzleForDate(dateKey: string, mode: Mode): Puzzle {
  const { slots } = MODES[mode];
  if (testGame) return { code: new Array<Ship>(slots).fill(TEST_SHIP), ruledOut: [] };
  return { code: randomCode(slots, seededRandom(hashString(`fleet-in-the-fog:${dateKey}:${mode}`))), ruledOut: [] };
}

// Picks ships one spot at a time, never using one ship more than MAX_REPEATS times.
// `rand` returns a number from 0 up to (not including) 1, like Math.random.
export function randomCode(slots: number, rand: () => number): Ship[] {
  // Never fewer repeats than it takes to fill the row, or the loop below could not finish.
  const maxRepeats = Math.max(1, MAX_REPEATS, Math.ceil(slots / SHIP_COUNT));
  const code: Ship[] = [];
  const used = new Array<number>(SHIP_COUNT).fill(0);
  while (code.length < slots) {
    const ship = Math.floor(rand() * SHIP_COUNT);
    if (used[ship] >= maxRepeats) continue; // roll again
    used[ship]++;
    code.push(ship);
  }
  return code;
}

// Ships a hint could grey out next: not in the code and not already greyed out.
// The hint always gives the lowest-numbered one, so it is the same for every player.
export function nextHint(code: Ship[], ruledOut: Ship[]): Ship | null {
  for (let s = 0; s < SHIP_COUNT; s++) {
    if (!code.includes(s) && !ruledOut.includes(s)) return s;
  }
  return null;
}

// ---------- dates ----------

// Which day's puzzle is live at this moment. The whole world changes puzzle at the same instant:
// NEW_GAME_TIME on the clock in NEW_GAME_ZONE (config.ts). The last two arguments are only for tests.
export function dateKeyFor(date: Date, startTime: string = NEW_GAME_TIME, zone: string = NEW_GAME_ZONE): string {
  // What the calendar and clock say in that zone right now.
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: zone, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
  }).formatToParts(date);
  const part = (type: string) => parts.find((p) => p.type === type)?.value ?? '00';
  const zoneDay = `${part('year')}-${part('month')}-${part('day')}`;
  const minutesNow = Number(part('hour')) * 60 + Number(part('minute'));

  const [startHour, startMinute] = startTime.split(':').map(Number);
  const startsAt = startHour * 60 + startMinute;
  const started = minutesNow >= startsAt; // has today's new game started yet?
  // A morning start: the game is named for the day it starts. An afternoon or evening start: for the day after.
  if (startsAt <= 12 * 60) return started ? zoneDay : addDays(zoneDay, -1);
  return started ? addDays(zoneDay, 1) : zoneDay;
}

// ---------- leaderboard ----------

// One number for a Redis sorted set. Lower is better.
// Fewer guesses always beats a faster time; time only breaks ties.
const MAX_SECONDS = 9999;
export function leaderboardScore(guesses: number, seconds: number): number {
  return guesses * 10000 + Math.min(Math.max(0, Math.round(seconds)), MAX_SECONDS);
}
