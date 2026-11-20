// Address add-ons for testing, read once when the page loads. Only in a test place (see TEST_HOSTS in config.ts).
// Copy-paste examples are in TESTING.md in the project folder.
//
//   ?test               test game: burgundy board, every answer is all junks, saved separately
//   ?fresh              wipe everything saved first (streaks, boats, repairs, games), like Reset all
//   ?seed=30            pretend you solved the last 30 days (1 = yesterday), then win today for real
//   &skip=1,2           with seed: leave these days out, counted back from today (1 = yesterday)
//   &mode=hard          with seed: which games to seed: easy (the default), hard, or all for both
//   ?add-golden-spyglass=3  add 3 golden (free) spyglasses
//   ?add-repairs=2          add 2 one-day streak repairs
//   ?add-long-repairs=1     add 1 three-day streak repair
//
// Any add-on at all (even just ?test) also prints today's answers in the console, for checking.
//
//   ?restart-today=easy play today's Easy again from the start (also =hard, or =all for both). Like Reset today.
//
// They work together, in this order: fresh, restart-today, add-golden-spyglass, add-repairs / add-long-repairs, then seed. Example: ?test&fresh&seed=5&skip=1,2
// After they run, fresh/seed/skip/mode are taken off the address (test stays), so a reload doesn't seed again.
import { STORE, addGoldenSpyglasses, addRepairs, resetAll, resetToday } from './api';
import type { DayResult } from './api';
import { inTestPlace, urlParams } from './config';
import { addDays } from './game/dates';
import { MODES, dateKeyFor, puzzleForDate } from './game/game';
import type { DailyMode } from './game/game';

// What happened, for the Dev bar to show. Empty when nothing ran.
export let devUrlNote = '';

// "1,2" -> [1, 2]. Anything that isn't a whole number above 0 is ignored.
export function parseDays(text: string | null): number[] {
  if (!text) return [];
  return text.split(/[,\s]+/).map(Number).filter((n) => Number.isInteger(n) && n > 0);
}

// The same as seed() in console-streak-testing.js: n solved days before today, minus the skipped ones.
// Each seeded win takes a random number of guesses, from 1 up to that mode's limit.
export function seedDays(store: string, today: string, n: number, skip: number[], mode: DailyMode): number {
  const key = `${store}:results`;
  const results: Record<string, DayResult> = JSON.parse(localStorage.getItem(key) ?? '{}');
  let count = 0;
  for (let i = 1; i <= n; i++) {
    if (skip.includes(i)) continue;
    const day = addDays(today, -i);
    const guesses = 1 + Math.floor(Math.random() * MODES[mode].maxGuesses);
    results[`${day}:${mode}`] = { dateKey: day, mode, status: 'won', guesses, rounds: 1, hints: 0, playedOn: day };
    count++;
  }
  localStorage.setItem(key, JSON.stringify(results));
  return count;
}

// The first letter of each ship's color, in ship-number order (0 fisher ... 5 yacht):
// Yellow, Purple, Red, Green, Blue, Coral. Every letter is different, so players can talk in letters too.
const COLORS = ['Y', 'P', 'R', 'G', 'B', 'C'];

// "Wednesday, November 18. Easy: R, G, B, P || Hard: B, R, R, P, P"
export function answerLine(dateKey: string): string {
  const day = new Date(`${dateKey}T12:00:00Z`).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' });
  const fleet = (mode: DailyMode) => puzzleForDate(dateKey, mode).code.map((ship) => COLORS[ship]).join(', ');
  return `${day}. Bay: ${fleet('easy')} || Open sea: ${fleet('hard')}`;
}

function run() {
  if (!inTestPlace) return;
  if (window.location.search) console.info(`[Fleet in the Fog] ${answerLine(dateKeyFor(new Date()))}`);
  const notes: string[] = [];
  if (urlParams.has('fresh')) {
    resetAll();
    notes.push('wiped');
  }
  const restart = urlParams.get('restart-today');
  if (restart !== null) {
    const modes: DailyMode[] = restart === 'easy' ? ['easy'] : restart === 'hard' ? ['hard'] : ['easy', 'hard'];
    resetToday(dateKeyFor(new Date()), modes);
    notes.push(`restarted today (${modes.join(' and ')})`);
  }
  const golden = Number(urlParams.get('add-golden-spyglass'));
  if (urlParams.has('add-golden-spyglass') && Number.isInteger(golden) && golden > 0) {
    addGoldenSpyglasses(golden);
    notes.push(`added ${golden} golden ${golden === 1 ? 'spyglass' : 'spyglasses'}`);
  }
  const ones = Number(urlParams.get('add-repairs'));
  const threes = Number(urlParams.get('add-long-repairs'));
  const okOnes = urlParams.has('add-repairs') && Number.isInteger(ones) && ones > 0;
  const okThrees = urlParams.has('add-long-repairs') && Number.isInteger(threes) && threes > 0;
  if (okOnes || okThrees) {
    addRepairs(okOnes ? ones : 0, okThrees ? threes : 0);
    const parts = [okOnes ? `${ones} one-day` : '', okThrees ? `${threes} three-day` : ''].filter(Boolean);
    notes.push(`added ${parts.join(' and ')} ${(okOnes ? ones : 0) + (okThrees ? threes : 0) === 1 ? 'repair' : 'repairs'}`);
  }
  const n = Number(urlParams.get('seed'));
  if (urlParams.has('seed') && Number.isInteger(n) && n > 0) {
    const asked = urlParams.get('mode');
    const modes: DailyMode[] = asked === 'hard' ? ['hard'] : asked === 'all' ? ['easy', 'hard'] : ['easy'];
    const skip = parseDays(urlParams.get('skip'));
    let count = 0;
    for (const mode of modes) count = seedDays(STORE, dateKeyFor(new Date()), n, skip, mode);
    notes.push(`seeded ${count} ${modes.join(' and ')} ${count === 1 ? 'day' : 'days'}${skip.length ? ` (skipped ${skip.join(', ')})` : ''}`);
  }
  if (!notes.length) return;
  devUrlNote = notes.join(', ');
  console.info(`[Fleet in the Fog] ${devUrlNote} in "${STORE}". Now win today.`);
  // Take the one-time add-ons off the address, so a reload doesn't do them again.
  const keep = new URLSearchParams(window.location.search);
  for (const name of ['fresh', 'restart-today', 'add-golden-spyglass', 'add-repairs', 'add-long-repairs', 'seed', 'skip', 'mode']) keep.delete(name);
  const rest = keep.toString().replace(/=(&|$)/g, '$1'); // "test=" -> "test"
  window.history.replaceState(null, '', `${window.location.pathname}${rest ? `?${rest}` : ''}${window.location.hash}`);
}

run();
