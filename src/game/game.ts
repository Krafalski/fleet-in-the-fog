// Pure game rules. No React, no Reddit, no storage.
// Everything here is a plain function, so it is easy to test and moves to the server unchanged.

// A ship is a number 0-5. Numbers are what get stored and compared;
// they only turn into pictures when drawn (see SHIP_KINDS in Boat.tsx).
// 0 fisher, 1 junk, 2 mailboat, 3 schooner, 4 tug, 5 yacht
export type Ship = number;
export const SHIP_COUNT = 6;

export type Mode = 'easy' | 'medium' | 'hard';

export const MODES: Record<Mode, { slots: number; maxGuesses: number; label: string }> = {
  easy: { slots: 4, maxGuesses: 8, label: 'Easy' },
  medium: { slots: 5, maxGuesses: 10, label: 'Medium' },
  hard: { slots: 6, maxGuesses: 12, label: 'Hard' },
};

// The first day with a puzzle. The harbor log does not go back further. Set this when you launch.
export const LAUNCH_DATE = '2026-11-06';

// Solving in this many guesses or fewer counts as "Perfect" in the harbor log.
export const PERFECT_GUESSES = 3;

// No ship appears more than twice in a code.
const MAX_REPEATS = 2;

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
  // Ships greyed out before the first guess. Hard mode rules one out so it stays playable.
  ruledOut: Ship[];
};

// dateKey looks like '2026-11-15'. Everyone gets the same puzzle for the same date and mode.
// IMPORTANT: in the real game, call this on the server only, so nobody can read the answer.
export function puzzleForDate(dateKey: string, mode: Mode): Puzzle {
  const rand = seededRandom(hashString(`fleet-in-the-fog:${dateKey}:${mode}`));
  const { slots } = MODES[mode];

  const ruledOut: Ship[] = mode === 'hard' ? [Math.floor(rand() * SHIP_COUNT)] : [];
  const allowed: Ship[] = [];
  for (let s = 0; s < SHIP_COUNT; s++) if (!ruledOut.includes(s)) allowed.push(s);

  const code: Ship[] = [];
  const used = new Array<number>(SHIP_COUNT).fill(0);
  while (code.length < slots) {
    const ship = allowed[Math.floor(rand() * allowed.length)];
    if (used[ship] >= MAX_REPEATS) continue; // roll again
    used[ship]++;
    code.push(ship);
  }
  return { code, ruledOut };
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

// The puzzle day in UTC, so the whole world changes puzzle at the same moment.
export function dateKeyFor(date: Date): string {
  return date.toISOString().slice(0, 10);
}

// ---------- leaderboard ----------

// One number for a Redis sorted set. Lower is better.
// Fewer guesses always beats a faster time; time only breaks ties.
const MAX_SECONDS = 9999;
export function leaderboardScore(guesses: number, seconds: number): number {
  return guesses * 10000 + Math.min(Math.max(0, Math.round(seconds)), MAX_SECONDS);
}
