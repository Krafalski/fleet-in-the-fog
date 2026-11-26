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
import { addDays } from './game/dates';
import { BADGES, STEPS, computeStreak, ghostFor, stepKey, stepsReady, trackFor } from './game/badges';
import type { Wins } from './game/badges';
import type { BoatLook } from './Boat';
import { testGame } from './config';
import { GOLDEN_PER_BOAT, LAUNCH_DATE, MODES, MODE_LIST, SPYGLASS_COST, dateKeyFor, gameScore, isPractice, isWin, nextHint, puzzleForDate, score, scoreSpots, spyglassSpot } from './game/game';
import type { DailyMode, Feedback, Mode, Ship } from './game/game';
import { boardRows, newGame, totalGuesses } from './game/reducer';
import { daysCovered, daysToNextRepair, findGap, pickRepairs, repairsEarned } from './game/repairs';
import type { RepairStock } from './game/repairs';
import type { GameState, Status } from './game/reducer';

// albatross: set when this guess was an albatross; the number is how many the player has sighted, this one included.
// In Practice an albatross is just for fun: albatross is 0 (shown, never counted).
// lobster: set when that albatross was the game's very first guess (red in the Bay, blue in the Open Sea); how many of that color.
export type GuessResult = { feedback: Feedback; status: Status; answer: Ship[] | null; albatross?: number; lobster?: number };

// One finished puzzle.
export type DayResult = {
  dateKey: string;
  mode: DailyMode;
  status: 'won' | 'lost';
  guesses: number;  // every guess made, counting rounds before a Replay, so it can pass the limit
  rounds: number;   // 1 = solved on the first try; 2 or more = used Replay
  hints: number;
  playedOn: string; // the day it was actually played; only same-day plays count for streaks
  spyglasses?: number;     // spyglasses used (older saves have none)
  spyglassPoints?: number; // what they added to the score
};

export type Progress = {
  streak: number;
  badges: Record<string, string>;      // badge kind -> day first earned
  // Each boat's looks (Bay / Open Sea, year 1 / year 2), keyed 'canoe:sea' -> the day it was earned.
  looksEarned: Record<string, string>;
  // The game result that earned each look ('2026-11-25:hard'), so a results card only shows its own.
  looksEarnedBy: Record<string, string>;
  wins: Wins;                          // same-day daily wins, forever: { bay: 25, sea: 5 }
  trophy: string | null;               // the day the Fleet Admiral cup was earned, or null
  albatross: string | null;            // the day the albatross was first sighted, or null
  albatrossCount: number;              // how many albatrosses the player has sighted
  nautilus: string | null;             // the puzzle day of the first nautilus (same score in the Bay and the Open Sea), or null
  nautilusCount: number;               // how many the player has sighted
  compass: string | null;              // the day the compass was found (by reading "How to build your fleet"), or null
  crab: string | null;                 // the puzzle day of the first crab (Bay took more guesses than the Open Sea), or null
  crabCount: number;
  hermit: string | null;               // the day of the first hermit crab (a win after Keep trying), or null
  hermitCount: number;
  // The rest of the sea's special sightings: when first seen (null = not yet) and how many.
  // barnacle, starfish and sanddollar are one-time; the lobsters and walruses count up.
  extras: Record<ExtraKind, { first: string | null; count: number }>;
  goldenSpyglasses: number;            // golden (free) spyglasses ready to use
  looks: Record<string, BoatLook>;     // badge kind -> the colorway the player chose to show
  repairs: RepairStock;                // streak repairs the player has, ready to use
  nextRepairIn: number;                // days of play until the next repair is earned
  repairOffer: RepairOffer | null;     // set when a broken streak can be mended right now
};
// A streak that can be mended: how many days were missed, what it costs, and the streak the player gets back.
export type RepairOffer = { missedDays: number; cost: RepairStock; streakAfter: number };
// nautilus: set when this win matched the other game's score on the same puzzle day; how many the player has sighted.
// crab: set when this win finished a day where the Bay took more guesses than the Open Sea; how many sighted.
// hermit: set when this was a win after Keep trying; how many sighted.
// barnacle / starfish / sanddollar: true when this game earned that one-time sighting.
// walrus: set when this was a win on the very last row of the first try; how many of that walrus (Bay grey, Open Sea pink).
export type Outcome = {
  streak: number; newBadges: string[]; nautilus?: number; crab?: number; hermit?: number;
  barnacle?: boolean; starfish?: boolean; sanddollar?: boolean; walrus?: number;
};
export type DayStats = { average: number; players: number };

// Numbers for the fleet screen. Averages count solved puzzles only; null = nothing to average yet.
export type Stats = {
  // average = guesses, hints = hints used, score = guesses + hints; each averaged per solved puzzle.
  you: Record<DailyMode, { average: number | null; hints: number | null; score: number | null; solved: number }>;
  everyone: Record<DailyMode, number | null>; // everyone's average score
  // sightings.easy[3] = how many Easy puzzles were won with a score of 3. 8 also holds anything above 8.
  sightings: Record<DailyMode, Record<number, number>>;
};
export const MOST_GUESSES_TRACKED = 8; // the highest score with its own creature (the seal)
// A saved result's score. Results saved before hints were recorded count as 0 hints.
export const resultScore = (r: DayResult) => gameScore(r.guesses, r.hints ?? 0, r.spyglassPoints ?? 0);

// What the spyglass would do right now, without using it.
// available = there is a right-spot ship to show. golden = the next one is free (+0); otherwise it adds SPYGLASS_COST.
// nextBoat: the next streak boat (which brings more golden ones) and how many days of streak away it is.
export type SpyglassCheck = { allowed: boolean; available: boolean; golden: boolean; goldenLeft: number; nextBoat: { name: string; days: number } | null };
export type SpyglassUse = { spot: number; ship: Ship; cost: number; golden: boolean };

export type GameApi = {
  // The player's saved game for this day and mode, or a fresh one.
  // For practice, dateKey is ignored: it returns the practice game in progress, or a new random one.
  loadGame(dateKey: string, mode: Mode): Promise<GameState>;
  // Optional: the saved game right away, with no waiting. A local store can do this; a server can't,
  // so GameScreen falls back to a fresh board until loadGame answers.
  peekGame?(dateKey: string, mode: Mode): GameState;
  // Call after every change so the player can leave and come back.
  saveGame(state: GameState): Promise<void>;
  // Score one guess. `answer` is only sent once the game is over.
  submitGuess(state: GameState, guess: Ship[]): Promise<GuessResult>;
  // Which ship to grey out, or null if there is nothing left to rule out.
  askHint(state: GameState): Promise<Ship | null>;
  // Whether the spyglass can be used now, and what it would cost. Changes nothing.
  checkSpyglass(state: GameState): Promise<SpyglassCheck>;
  // Use one: which spot and ship to lock, and what it cost. Uses up a golden one when there is one (daily games only).
  useSpyglass(state: GameState, today: string): Promise<SpyglassUse | null>;
  // Practice only: the answer, for Give up.
  revealAnswer(state: GameState): Promise<Ship[]>;
  // Call once when a game ends. Saves the result and hands out any new badge boats.
  recordResult(state: GameState, today: string): Promise<Outcome>;
  // Finished puzzles for these days, for the harbor log.
  loadResults(dateKeys: string[], mode: DailyMode): Promise<Record<string, DayResult | undefined>>;
  // Both modes' results for one day, for the end-of-game panel.
  loadDay(dateKey: string): Promise<Record<DailyMode, DayResult | undefined>>;
  // The oldest past day this mode hasn't been finished on (from launch day up to yesterday), or null.
  nextUnplayed(mode: DailyMode, today: string): Promise<string | null>;
  // Averages and creature sightings, for the fleet screen.
  loadStats(): Promise<Stats>;
  // Streak and badge boats, for the fleet screen.
  loadProgress(today: string): Promise<Progress>;
  // Spend repairs on the offer in loadProgress. Does nothing if there is no offer.
  useRepair(today: string): Promise<Outcome>;
  // Remember which colorway the player wants a boat shown in.
  saveBoatLook(kind: string, look: BoatLook): Promise<void>;
  // The compass: found once, by keeping "How to build your fleet" open for a few seconds. True the first time.
  findCompass(today: string): Promise<boolean>;
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
const gameKey = (dateKey: string, mode: Mode) => (isPractice(mode) ? `${STORE}:${mode}` : `${STORE}:game:${dateKey}:${mode}`);
// A made-up key that seeds a new random practice puzzle.
export const newPracticeKey = () => `practice-${Date.now()}`;
const RESULTS_KEY = `${STORE}:results`; // { '2026-11-15:easy': DayResult }
const BADGES_KEY = `${STORE}:badges`;   // { paper: '2026-11-15' }
const LOOKS_KEY = `${STORE}:looks`;     // { paper: 'year2' }
const REPAIRS_KEY = `${STORE}:repairs`; // { usedOnes: 1, usedThrees: 0, days: ['2026-11-15'] }
// Test games start with a few repairs, so the repair flow can be tried without playing for weeks.
const TEST_REPAIRS: RepairStock = testGame ? { ones: 2, threes: 2 } : { ones: 0, threes: 0 };
// Testing (?add-repairs=2, ?add-long-repairs=1): extra repairs, saved on top of the earned ones.
const REPAIRS_ADDED_KEY = `${STORE}:repairs-added`;
export function addRepairs(ones: number, threes: number) {
  const added = read<RepairStock>(REPAIRS_ADDED_KEY, { ones: 0, threes: 0 });
  write(REPAIRS_ADDED_KEY, { ones: added.ones + ones, threes: added.threes + threes });
}
// Earning a boat again in a later year is not built yet, so a real boat counts as earned once.
// In test games every earned boat counts three times, so the colorway switching can be tried.
// badge kind -> how many years of colors it has earned (1 to 3). Kept even if the streak later breaks.
const YEARS_KEY = `${STORE}:years`;       // older saves: badge kind -> years earned (moved into BOAT_LOOKS_KEY)
const YEARS_ON_KEY = `${STORE}:yearsOn`;
const BOAT_LOOKS_KEY = `${STORE}:boatLooks`;     // { 'canoe:color': '2026-11-15', 'canoe:sea': '2026-11-20' }
const BOAT_LOOKS_BY_KEY = `${STORE}:boatLooksBy`; // { 'canoe:sea': '2026-11-20:hard' }
const TROPHY_KEY = `${STORE}:trophy`;     // the day the Fleet Admiral cup was earned
// The albatross: a daily guess with every ship right and every one in the wrong spot.
// Sighted every time it happens; each sighting is saved as the day it happened.
const ALBATROSS_KEY = `${STORE}:albatross`;     // older saves: only the day of the first one
const ALBATROSSES_KEY = `${STORE}:albatrosses`; // ['2026-11-15', '2026-11-20', ...]
// Golden Spyglasses: 2 earned with every streak boat. Saved: the ones used (day and mode), and any added for testing.
const SPYGLASS_KEY = `${STORE}:spyglass`;
type SpyglassSaved = { added: number; used: { day: string; mode: DailyMode }[] };
const readSpyglass = () => read<SpyglassSaved>(SPYGLASS_KEY, { added: 0, used: [] });
function goldenLeft(): number {
  const badges = read<Record<string, string>>(BADGES_KEY, {});
  const boats = BADGES.filter((b) => b.days !== null && badges[b.kind]).length; // streak boats only, not the mystery boat
  const saved = readSpyglass();
  return Math.max(0, boats * GOLDEN_PER_BOAT + saved.added - saved.used.length);
}
// The spyglass works in Hard, and in Practice with totals only (Easy already shows every spot).
const spyglassAllowed = (state: GameState) => state.status === 'playing' && !state.perSpot && (state.mode === 'hard' || isPractice(state.mode));
// Golden ones are only spent on a daily game's first try: Practice and Replays don't count, so they always cost points instead.
const spendsGolden = (state: GameState) => !isPractice(state.mode) && state.rounds === 1;
// Testing (?add-golden-spyglass=3): add golden Spyglasses.
export function addGoldenSpyglasses(n: number) {
  const saved = readSpyglass();
  write(SPYGLASS_KEY, { ...saved, added: saved.added + n });
}
// The nautilus: the Bay and the Open Sea won with the same score on the same puzzle day. Counted, like the albatross.
const NAUTILUS_KEY = `${STORE}:nautilus`; // ['2026-11-26', ...] puzzle days
const COMPASS_KEY = `${STORE}:compass`;   // the day it was found
const readNautilus = () => read<string[]>(NAUTILUS_KEY, []);
// The crab: both games won on one puzzle day, and the Bay took more guesses than the Open Sea. Guesses only, not score,
// so a hint can't buy one. The hermit crab: a daily win after Keep trying (it carries its old rows like a shell).
const CRAB_KEY = `${STORE}:crab`;     // ['2026-11-26', ...] puzzle days
const HERMIT_KEY = `${STORE}:hermit`; // ['2026-11-26:easy', ...] games
const readCrabs = () => read<string[]>(CRAB_KEY, []);
const readHermits = () => read<string[]>(HERMIT_KEY, []);
// The barnacle: lost the first Keep trying too (one-time). The starfish and the sand dollar: 5 Bay or 5 Open Sea
// wins in Past games, the first win on each past day (one-time, so a year of archive play earns the same one).
// The lobsters: an albatross on the very first guess (red Bay, blue Open Sea). The walruses: a win on the very
// last row of the first try (grey Bay, pink Open Sea). Lobsters and walruses count up; nobody needs to chase them.
export type ExtraKind = 'barnacle' | 'starfish' | 'sanddollar' | 'lobster' | 'bluelobster' | 'walrus' | 'pinkwalrus';
export const EXTRA_KINDS: ExtraKind[] = ['barnacle', 'starfish', 'sanddollar', 'lobster', 'bluelobster', 'walrus', 'pinkwalrus'];
export const ARCHIVE_WINS_NEEDED = 5;
const EXTRAS_KEY = `${STORE}:extras`; // { lobster: ['2026-11-26:easy', ...], barnacle: ['2026-11-26:easy'], ... }
const readExtras = () => read<Partial<Record<ExtraKind, string[]>>>(EXTRAS_KEY, {});
// Adds one sighting (once per game key) and returns how many of that kind there are now.
function sightExtra(kind: ExtraKind, key: string): number {
  const all = readExtras();
  const list = all[kind] ?? [];
  if (!list.includes(key)) write(EXTRAS_KEY, { ...all, [kind]: [...list, key] });
  return (readExtras()[kind] ?? []).length;
}
const hasExtra = (kind: ExtraKind) => (readExtras()[kind] ?? []).length > 0;
function sight(key: string, item: string, list: string[]): number {
  if (!list.includes(item)) write(key, [...list, item]);
  return read<string[]>(key, []).length;
}
function readAlbatrosses(): string[] {
  const list = read<string[] | null>(ALBATROSSES_KEY, null);
  if (list) return list;
  const first = read<string | null>(ALBATROSS_KEY, null); // carry over a save from before counting
  return first ? [first] : [];
}

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
  const added = read<RepairStock>(REPAIRS_ADDED_KEY, { ones: 0, threes: 0 });
  const repairs: RepairStock = {
    ones: earned.ones + TEST_REPAIRS.ones + added.ones - used.usedOnes,
    threes: earned.threes + TEST_REPAIRS.threes + added.threes - used.usedThrees,
  };
  const solved = solvedDays(results);
  const mended = new Set(used.days);
  const gap = findGap(solved, mended, today, daysCovered(repairs));
  const cost = gap ? pickRepairs(gap.length, repairs) : null;
  const offer: RepairOffer | null = gap && cost
    ? { missedDays: gap.length, cost, streakAfter: computeStreak(solved, today, new Set([...used.days, ...gap])) }
    : null;
  return { repairs, nextRepairIn: daysToNextRepair(daysPlayed), offer, gap, used };
}

// Same-day daily wins in each game, counted forever (they never reset when a streak breaks).
// Past days played later don't count, the same as for the streak.
function winsFrom(results: Record<string, DayResult>): Wins {
  const wins: Wins = { bay: 0, sea: 0 };
  for (const r of Object.values(results)) if (r.status === 'won' && r.playedOn === r.dateKey) wins[trackFor(r.mode)]++;
  return wins;
}

// The looks each boat has been earned in. Older saves (one streak, yearly colors) are carried over once:
// an earned boat keeps its own colors, and its old second-year colors (inverse) become its Open Sea look.
function readBoatLooks(): Record<string, string> {
  const saved = read<Record<string, string> | null>(BOAT_LOOKS_KEY, null);
  if (saved) return saved;
  const badges = read<Record<string, string>>(BADGES_KEY, {});
  const years = read<Record<string, number>>(YEARS_KEY, {});
  const yearsOn = read<Record<string, string>>(YEARS_ON_KEY, {});
  const looks: Record<string, string> = {};
  for (const b of BADGES) {
    if (b.days === null || !badges[b.kind]) continue;
    looks[`${b.kind}:color`] = badges[b.kind];
    if ((years[b.kind] ?? 1) >= 2) looks[`${b.kind}:sea`] = yearsOn[b.kind] ?? badges[b.kind];
  }
  return looks;
}

// Hands out every boat look the player's wins and streak have reached but they don't have yet,
// plus `extra` badges (the ghost ships). `by` is the game result that did it.
function awardStreakBadges(streak: number, today: string, extra: string[] = [], by = ''): string[] {
  const results = read<Record<string, DayResult>>(RESULTS_KEY, {});
  const wins = winsFrom(results);
  const looks = readBoatLooks();
  const lookBy = read<Record<string, string>>(BOAT_LOOKS_BY_KEY, {});
  const badges = read<Record<string, string>>(BADGES_KEY, {});
  const newBadges: string[] = [];
  for (const step of stepsReady(wins, streak)) {
    const key = stepKey(step);
    if (looks[key]) continue;
    looks[key] = today;
    lookBy[key] = by;
    if (!badges[step.kind]) { badges[step.kind] = today; newBadges.push(step.kind); } // the boat's first look brings the boat
  }
  for (const kind of extra) if (!badges[kind]) { badges[kind] = today; newBadges.push(kind); }
  write(BOAT_LOOKS_KEY, looks);
  write(BOAT_LOOKS_BY_KEY, lookBy);
  write(BADGES_KEY, badges);
  // The final award, once: every boat in all four looks.
  if (STEPS.every((st) => looks[stepKey(st)]) && !read<string | null>(TROPHY_KEY, null)) write(TROPHY_KEY, today);
  // Keep them in ladder order, so the biggest one comes last.
  newBadges.sort((a, b) => BADGES.findIndex((x) => x.kind === a) - BADGES.findIndex((x) => x.kind === b));
  return newBadges;
}

export const localApi: GameApi = {
  async loadGame(dateKey, mode) {
    return localApi.peekGame!(dateKey, mode);
  },

  peekGame(dateKey, mode) {
    if (isPractice(mode)) {
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
      : guessesMade >= boardRows({ ...state, status: 'playing' })
        ? 'lost'
        : 'playing';
    // Every ship right, every spot wrong: an albatross, every time.
    // Daily games (past days too) count it in the fleet. Practice shows it just for fun (0 = not counted).
    let albatross: number | undefined;
    if (feedback.exact === 0 && feedback.near === guess.length) {
      if (isPractice(state.mode)) {
        albatross = 0;
      } else {
        const seen = [...readAlbatrosses(), dateKeyFor(new Date())];
        write(ALBATROSSES_KEY, seen);
        albatross = seen.length;
      }
    }
    // ...and on the very first guess of the game: a lobster.
    let lobster: number | undefined;
    if (albatross && state.guesses.length === 0 && !(state.tries ?? []).length) {
      lobster = sightExtra(state.mode === 'hard' ? 'bluelobster' : 'lobster', `${state.dateKey}:${state.mode}`);
    }
    return { feedback, status, answer: status === 'playing' ? null : code, albatross, lobster };
  },

  async askHint(state) {
    const { code } = puzzleForDate(state.dateKey, state.mode);
    return nextHint(code, state.ruledOut, MODES[state.mode].ships);
  },

  async checkSpyglass(state) {
    const left = goldenLeft();
    const streak = streakFrom(read<Record<string, DayResult>>(RESULTS_KEY, {}), dateKeyFor(new Date()));
    const next = BADGES.find((b) => b.days !== null && b.days > streak);
    const nextBoat = next && next.days !== null ? { name: next.name, days: next.days - streak } : null;
    if (!spyglassAllowed(state)) return { allowed: false, available: false, golden: false, goldenLeft: left, nextBoat };
    const { code } = puzzleForDate(state.dateKey, state.mode);
    const found = spyglassSpot(code, state.guesses, state.locked ?? []);
    return { allowed: true, available: found !== null, golden: spendsGolden(state) && left > 0, goldenLeft: left, nextBoat };
  },

  async useSpyglass(state, today) {
    if (!spyglassAllowed(state)) return null;
    const { code } = puzzleForDate(state.dateKey, state.mode);
    const found = spyglassSpot(code, state.guesses, state.locked ?? []);
    if (!found) return null;
    const golden = spendsGolden(state) && goldenLeft() > 0;
    if (golden) {
      const saved = readSpyglass();
      write(SPYGLASS_KEY, { ...saved, used: [...saved.used, { day: today, mode: state.mode as DailyMode }] });
    }
    return { ...found, cost: golden ? 0 : SPYGLASS_COST, golden };
  },

  async revealAnswer(state) {
    return puzzleForDate(state.dateKey, state.mode).code;
  },

  async recordResult(state, today) {
    const results = read<Record<string, DayResult>>(RESULTS_KEY, {});
    const key = `${state.dateKey}:${state.mode}`;
    // A win after Keep trying: a hermit crab. The day's result stays the first try's (the loss).
    const hermit = state.status === 'won' && (state.tries ?? []).length > 0 && !isPractice(state.mode)
      ? sight(HERMIT_KEY, key, readHermits()) : undefined;
    // Lost the first Keep trying too: a barnacle, for sticking with it no matter what. Once ever.
    const barnacle = state.status === 'lost' && (state.tries ?? []).length === 1 && !isPractice(state.mode) && !hasExtra('barnacle')
      ? (sightExtra('barnacle', key), true) : undefined;
    // Practice never counts.
    if (state.status === 'playing' || results[key] || isPractice(state.mode)) {
      return { streak: streakFrom(results, today), newBadges: [], hermit, barnacle }; // nothing new to record
    }
    results[key] = {
      dateKey: state.dateKey, mode: state.mode as DailyMode, status: state.status,
      guesses: totalGuesses(state), rounds: state.rounds, hints: state.hintsUsed, playedOn: today,
      spyglasses: state.spyglasses ?? 0, spyglassPoints: state.spyglassPoints ?? 0,
    };
    write(RESULTS_KEY, results);

    const streak = streakFrom(results, today);
    const newBadges = awardStreakBadges(streak, today, state.status === 'lost' ? [ghostFor(state.mode as DailyMode)] : [], key);
    // Both games of the same puzzle day won with the same score: a nautilus.
    const other = results[`${state.dateKey}:${state.mode === 'easy' ? 'hard' : 'easy'}`];
    let nautilus: number | undefined;
    if (state.status === 'won' && other?.status === 'won' && resultScore(other) === resultScore(results[key])) {
      const seen = readNautilus();
      if (!seen.includes(state.dateKey)) write(NAUTILUS_KEY, [...seen, state.dateKey]);
      nautilus = readNautilus().length;
    }
    // Both won, and the Bay took more guesses than the Open Sea: a crab.
    let crab: number | undefined;
    const bay = results[`${state.dateKey}:easy`], sea = results[`${state.dateKey}:hard`];
    if (state.status === 'won' && bay?.status === 'won' && sea?.status === 'won' && bay.guesses > sea.guesses) {
      crab = sight(CRAB_KEY, state.dateKey, readCrabs());
    }
    // A win on the very last row of the first try: a walrus (phew).
    let walrus: number | undefined;
    if (state.status === 'won' && !(state.tries ?? []).length && state.guesses.length === MODES[state.mode].maxGuesses) {
      walrus = sightExtra(state.mode === 'hard' ? 'pinkwalrus' : 'walrus', key);
    }
    // The fifth Past games win in this game: a starfish (Bay) or a sand dollar (Open Sea). Once ever.
    let starfish: boolean | undefined, sanddollar: boolean | undefined;
    if (state.status === 'won' && today !== state.dateKey) {
      const kind: ExtraKind = state.mode === 'hard' ? 'sanddollar' : 'starfish';
      const pastWins = Object.values(results).filter((r) => r.mode === state.mode && r.status === 'won' && r.playedOn !== r.dateKey).length;
      if (pastWins >= ARCHIVE_WINS_NEEDED && !hasExtra(kind)) {
        sightExtra(kind, key);
        if (kind === 'starfish') starfish = true; else sanddollar = true;
      }
    }
    return { streak, newBadges, nautilus, crab, hermit, walrus, starfish, sanddollar };
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

  async nextUnplayed(mode, today) {
    const results = read<Record<string, DayResult>>(RESULTS_KEY, {});
    for (let day = LAUNCH_DATE; day < today; day = addDays(day, 1)) {
      if (!results[`${day}:${mode}`]) return day;
    }
    return null;
  },

  async loadStats() {
    const results = Object.values(read<Record<string, DayResult>>(RESULTS_KEY, {}));
    const stats: Stats = {
      you: { easy: { average: null, hints: null, score: null, solved: 0 }, hard: { average: null, hints: null, score: null, solved: 0 } },
      everyone: { easy: null, hard: null }, // needs the server: there is only one player in the browser
      sightings: { easy: {}, hard: {} },
    };
    for (const mode of MODE_LIST) {
      const solved = results.filter((r) => r.mode === mode && r.status === 'won');
      if (solved.length) {
        const sum = solved.reduce((total, r) => total + r.guesses, 0);
        // Hints = everything that helped: Lookouts (+1 each) and spyglass points (+2 for a paid one).
        const hints = solved.reduce((total, r) => total + (r.hints ?? 0) + (r.spyglassPoints ?? 0), 0);
        const scores = solved.reduce((total, r) => total + resultScore(r), 0);
        const n = solved.length;
        stats.you[mode] = { average: sum / n, hints: hints / n, score: scores / n, solved: n };
      }
      for (const r of solved) {
        const bucket = Math.min(resultScore(r), MOST_GUESSES_TRACKED);
        stats.sightings[mode][bucket] = (stats.sightings[mode][bucket] ?? 0) + 1;
      }
    }
    return stats;
  },

  async loadProgress(today) {
    const badges = read<Record<string, string>>(BADGES_KEY, {});
    const results = read<Record<string, DayResult>>(RESULTS_KEY, {});
    const { repairs, nextRepairIn, offer } = repairState(results, today);
    return {
      streak: streakFrom(results, today),
      badges,
      looksEarned: readBoatLooks(),
      looksEarnedBy: read<Record<string, string>>(BOAT_LOOKS_BY_KEY, {}),
      wins: winsFrom(results),
      trophy: read<string | null>(TROPHY_KEY, null),
      albatross: readAlbatrosses()[0] ?? null,
      albatrossCount: readAlbatrosses().length,
      nautilus: [...readNautilus()].sort()[0] ?? null,
      nautilusCount: readNautilus().length,
      compass: read<string | null>(COMPASS_KEY, null),
      crab: [...readCrabs()].sort()[0] ?? null,
      crabCount: readCrabs().length,
      hermit: [...readHermits()].sort()[0]?.split(':')[0] ?? null,
      hermitCount: readHermits().length,
      extras: Object.fromEntries(EXTRA_KINDS.map((kind) => {
        const list = readExtras()[kind] ?? [];
        return [kind, { first: [...list].sort()[0]?.split(':')[0] ?? null, count: list.length }];
      })) as Progress['extras'],
      goldenSpyglasses: goldenLeft(),
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

  async findCompass(today) {
    if (read<string | null>(COMPASS_KEY, null)) return false;
    write(COMPASS_KEY, today);
    return true;
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
// modes: which of today's games to forget (both by default).
// If the other mode's game today is kept, today's boats and colors stay too, since that game may have earned them.
export function resetToday(today: string, modes: DailyMode[] = ['easy', 'hard']) {
  for (const mode of modes) localStorage.removeItem(gameKey(today, mode));
  const results = read<Record<string, DayResult>>(RESULTS_KEY, {});
  for (const mode of modes) delete results[`${today}:${mode}`];
  write(RESULTS_KEY, results);
  // Golden Spyglasses used today in these games come back.
  const spy = readSpyglass();
  write(SPYGLASS_KEY, { ...spy, used: spy.used.filter((u) => !(u.day === today && modes.includes(u.mode))) });
  if (Object.keys(results).some((key) => key.startsWith(`${today}:`))) return;
  const badges = read<Record<string, string>>(BADGES_KEY, {});
  for (const kind of Object.keys(badges)) if (badges[kind] === today) delete badges[kind];
  write(BADGES_KEY, badges);
  // Boat looks earned today are taken back as well.
  const looks = readBoatLooks();
  const lookBy = read<Record<string, string>>(BOAT_LOOKS_BY_KEY, {});
  for (const key of Object.keys(looks)) if (looks[key] === today) { delete looks[key]; delete lookBy[key]; }
  write(BOAT_LOOKS_KEY, looks);
  write(BOAT_LOOKS_BY_KEY, lookBy);
  if (read<string | null>(TROPHY_KEY, null) === today) localStorage.removeItem(TROPHY_KEY);
  if (read<string | null>(ALBATROSS_KEY, null) === today) localStorage.removeItem(ALBATROSS_KEY);
  write(ALBATROSSES_KEY, readAlbatrosses().filter((day) => day !== today));
  write(NAUTILUS_KEY, readNautilus().filter((day) => day !== today));
  write(CRAB_KEY, readCrabs().filter((day) => day !== today));
  write(HERMIT_KEY, readHermits().filter((game) => !modes.some((mode) => game === `${today}:${mode}`)));
  const extras = readExtras();
  for (const kind of EXTRA_KINDS) if (extras[kind]) extras[kind] = extras[kind]!.filter((game) => !modes.some((mode) => game === `${today}:${mode}`));
  write(EXTRAS_KEY, extras);
}
// Forget everything this game has saved (only the test games when the test game is on).
export function resetAll() {
  for (const key of Object.keys(localStorage)) if (key.startsWith(`${STORE}:`)) localStorage.removeItem(key);
}
