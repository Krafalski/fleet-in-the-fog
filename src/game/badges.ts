// The badge boats and the streak rules. Plain data and functions, no React.
import { addDays } from './dates';

export type Badge = {
  kind: string;        // matches a BadgeKind in Boat.tsx
  name: string;
  how: string;         // shown to the player
  days: number | null; // streak length that earns it; null = earned another way
  note: string;
};

// In earning order. Months are counted as 30 days.
// `how` names what the boat asks for. In the first month that's a streak (and the same number of wins);
// after that it's the wins, with a 30-day streak (see STREAK_CAP below).
export const BADGES: Badge[] = [
  { kind: 'paper', name: 'Paper boat', how: 'First solved day', days: 1, note: "Folded from a page of the harbor log. Floats better than it should." },
  { kind: 'kayak', name: 'Kayak', how: '2-day streak', days: 2, note: "One seat, one paddle, back the next day. That's how it starts." },
  { kind: 'rowboat', name: 'Rowboat', how: '3-day streak', days: 3, note: "Two oars and a steady pull. Every fleet starts somewhere." },
  { kind: 'canoe', name: 'Canoe', how: '7-day streak', days: 7, note: "Slips through the reeds without a sound. A full week on the water." },
  { kind: 'raft', name: 'Raft', how: '10-day streak', days: 10, note: "Lashed together from driftwood. It holds, mostly." },
  { kind: 'gondola', name: 'Gondola', how: '14-day streak', days: 14, note: "Glides in from quieter canals. Two weeks without missing a tide." },
  { kind: 'outrigger', name: 'Outrigger', how: '21-day streak', days: 21, note: "A float on one side keeps it steady. Three weeks and you've found your balance." },
  { kind: 'houseboat', name: 'Houseboat', how: '30-day streak', days: 30, note: "After a month, you more or less live here." },
  { kind: 'catamaran', name: 'Catamaran', how: '45 wins', days: 45, note: "Two hulls, twice the balance. Halfway to the next month already." },
  { kind: 'ferry', name: 'Ferry', how: '60 wins', days: 60, note: "Runs on schedule, rain or fog. Just like you." },
  { kind: 'lightship', name: 'Lightship', how: '90 wins', days: 90, note: "Anchored where no lighthouse can stand. Other ships steer by it." },
  { kind: 'paddle', name: 'Paddle steamer', how: '120 wins', days: 120, note: "Churns upriver at its own pace. Never in a hurry, never late." },
  { kind: 'cargo', name: 'Cargo ship', how: '150 wins', days: 150, note: "Stacked high and riding low. Five months of deliveries." },
  { kind: 'longship', name: 'Longship', how: '180 wins', days: 180, note: "Shields along the rail, striped sail up. Half a year at sea." },
  { kind: 'pirate', name: 'Pirate ship', how: '210 wins', days: 210, note: "Flies its own flag. Nobody is quite sure when it arrived." },
  { kind: 'icebreaker', name: 'Icebreaker', how: '240 wins', days: 240, note: "Goes where the harbor freezes over. Nothing stops it." },
  { kind: 'submarine', name: 'Submarine', how: '270 wins', days: 270, note: "Mostly below the surface. It was here the whole time." },
  { kind: 'tallship', name: 'Tall ship', how: '300 wins', days: 300, note: "Three masts, full sail. The whole harbor turns to look." },
  { kind: 'liner', name: 'Ocean liner', how: '330 wins', days: 330, note: "Three funnels and a crossing nearly done." },
  { kind: 'galleon', name: 'Golden galleon', how: '360 wins', days: 360, note: "A full year in the fog. The harbor is yours." },
  { kind: 'ghost', name: 'Ghost ship', how: 'Mystery', days: null, note: "Seen only on the nights a fleet slips away. Some say it knows the answer." },
];

// The mystery boat: earned the first time a fleet slips away.
export const MYSTERY_BADGE = 'ghost';
// The ghost ship has two looks: the light one comes with a Bay loss, the dark one with an Open Sea loss.
// Both live in the same harbor spot; the player picks which one shows.
export const GHOST_DARK = 'ghostDark';
export const ghostFor = (mode: 'easy' | 'hard') => (mode === 'hard' ? GHOST_DARK : MYSTERY_BADGE);

// ---------- Two tracks: every boat has a Bay look and an Open Sea look, in two years ----------
// Year 1: the Bay look is the boat's own colors, the Open Sea look is the same boat in inverse colors.
// Year 2: the Bay look is gold, the Open Sea look is jewel tones. There's no year 3.
//
// A look needs both:
//   1. that many wins in that game (Bay wins for Bay looks, Open Sea wins for Open Sea looks), counted forever;
//      only wins played on their own day count, like the streak; and
//   2. a streak of that many days, but never more than 30 (STREAK_CAP).
// So the first month works like a plain streak (canoe: 7 wins and a 7-day streak), and after that a broken
// streak only means rebuilding 30 days, not starting the whole fleet over. The wins are never lost.
export type Track = 'bay' | 'sea';
export const TRACKS: Track[] = ['bay', 'sea'];
export const TRACK_NAME: Record<Track, string> = { bay: 'Bay', sea: 'Open Sea' };
export const trackFor = (mode: 'easy' | 'hard'): Track => (mode === 'hard' ? 'sea' : 'bay');
export const STREAK_CAP = 30;
export const DAYS_PER_YEAR = 360; // year 2 asks for another 360 wins on top
export type StepLook = 'color' | 'sea' | 'gold' | 'jewel';
export const LOOK_FOR: Record<Track, [StepLook, StepLook]> = { bay: ['color', 'gold'], sea: ['sea', 'jewel'] };
export type Wins = Record<Track, number>;

// One look of one boat: what it takes, and the key it's saved under.
export type Step = { kind: string; name: string; track: Track; year: 1 | 2; look: StepLook; need: number };
export const stepKey = (s: { kind: string; look: string }) => `${s.kind}:${s.look}`;
export const STEPS: Step[] = TRACKS.flatMap((track) => ([1, 2] as const).flatMap((year) =>
  BADGES.filter((b) => b.days !== null).map((b) => ({
    kind: b.kind, name: b.name, track, year, look: LOOK_FOR[track][year - 1], need: b.days! + (year - 1) * DAYS_PER_YEAR,
  }))))
  .sort((a, b) => a.need - b.need || (a.track === b.track ? 0 : a.track === 'bay' ? -1 : 1));

export const streakNeed = (step: Step) => Math.min(step.need, STREAK_CAP);
export function stepReady(step: Step, wins: Wins, streak: number): boolean {
  return wins[step.track] >= step.need && streak >= streakNeed(step);
}
// How far a look still is: more wins in its game, and more days at sea.
export function stepToGo(step: Step, wins: Wins, streak: number): { wins: number; days: number } {
  return { wins: Math.max(0, step.need - wins[step.track]), days: Math.max(0, streakNeed(step) - streak) };
}
// Every look a player with these numbers has reached.
export function stepsReady(wins: Wins, streak: number): Step[] {
  return STEPS.filter((s) => stepReady(s, wins, streak));
}

// The final award, the Fleet Admiral cup: every boat in all four looks.
export const TROPHY_STEPS = STEPS.length;

// How many days in a row the player has solved a puzzle, ending today
// (or yesterday, if today's has not been played yet).
// Days mended with a streak repair keep the run going but do not add to the count.
export function computeStreak(playedDays: Set<string>, today: string, mendedDays: Set<string> = new Set()): number {
  let day = playedDays.has(today) ? today : addDays(today, -1);
  let streak = 0;
  while (playedDays.has(day) || mendedDays.has(day)) {
    if (playedDays.has(day)) streak++;
    day = addDays(day, -1);
  }
  return streak;
}
