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
export const BADGES: Badge[] = [
  { kind: 'paper', name: 'Paper boat', how: 'First solved day', days: 1, note: "Folded from a page of the harbor log. Floats better than it should." },
  { kind: 'rowboat', name: 'Rowboat', how: '3-day streak', days: 3, note: "Two oars and a steady pull. Every fleet starts somewhere." },
  { kind: 'canoe', name: 'Canoe', how: '7-day streak', days: 7, note: "Slips through the reeds without a sound. A full week on the water." },
  { kind: 'raft', name: 'Raft', how: '10-day streak', days: 10, note: "Lashed together from driftwood. It holds, mostly." },
  { kind: 'gondola', name: 'Gondola', how: '14-day streak', days: 14, note: "Glides in from quieter canals. Two weeks without missing a tide." },
  { kind: 'houseboat', name: 'Houseboat', how: '30-day streak', days: 30, note: "After a month, you more or less live here." },
  { kind: 'ferry', name: 'Ferry', how: '2-month streak', days: 60, note: "Runs on schedule, rain or fog. Just like you." },
  { kind: 'lightship', name: 'Lightship', how: '3-month streak', days: 90, note: "Anchored where no lighthouse can stand. Other ships steer by it." },
  { kind: 'paddle', name: 'Paddle steamer', how: '4-month streak', days: 120, note: "Churns upriver at its own pace. Never in a hurry, never late." },
  { kind: 'cargo', name: 'Cargo ship', how: '5-month streak', days: 150, note: "Stacked high and riding low. Five months of deliveries." },
  { kind: 'longship', name: 'Longship', how: '6-month streak', days: 180, note: "Shields along the rail, striped sail up. Half a year at sea." },
  { kind: 'pirate', name: 'Pirate ship', how: '7-month streak', days: 210, note: "Flies its own flag. Nobody is quite sure when it arrived." },
  { kind: 'icebreaker', name: 'Icebreaker', how: '8-month streak', days: 240, note: "Goes where the harbor freezes over. Nothing stops it." },
  { kind: 'submarine', name: 'Submarine', how: '9-month streak', days: 270, note: "Mostly below the surface. It was here the whole time." },
  { kind: 'tallship', name: 'Tall ship', how: '10-month streak', days: 300, note: "Three masts, full sail. The whole harbor turns to look." },
  { kind: 'liner', name: 'Ocean liner', how: '11-month streak', days: 330, note: "Three funnels and a crossing nearly done." },
  { kind: 'galleon', name: 'Golden galleon', how: '12-month streak', days: 360, note: "A full year in the fog. The harbor is yours." },
  { kind: 'ghost', name: 'Ghost ship', how: 'Mystery', days: null, note: "Seen only on the nights a fleet slips away. Some say it knows the answer." },
];

// The mystery boat: earned the first time a fleet slips away.
export const MYSTERY_BADGE = 'ghost';
// The ghost ship has two looks: the light one comes with a Bay loss, the dark one with an Open sea loss.
// Both live in the same harbor spot; the player picks which one shows.
export const GHOST_DARK = 'ghostDark';
export const ghostFor = (mode: 'easy' | 'hard') => (mode === 'hard' ? GHOST_DARK : MYSTERY_BADGE);

// Every streak badge a streak of this many days has earned.
export function badgesForStreak(streak: number): string[] {
  return BADGES.filter((b) => b.days !== null && b.days <= streak).map((b) => b.kind);
}

// Each boat comes back in new colors every year the streak keeps going:
// year 2 at its day count + 360, year 3 at its day count + 720. Three years is the most.
export const DAYS_PER_YEAR = 360;
export const MOST_YEARS = 3;
export function yearsEarned(days: number, streak: number): number {
  if (streak < days) return 0;
  return Math.min(MOST_YEARS, 1 + Math.floor((streak - days) / DAYS_PER_YEAR));
}

// Every step of the streak ladder in the order it's reached: each boat in year 1, then each boat's
// year-2 colors, then year 3. `day` is the streak length that reaches it.
export type Milestone = { kind: string; name: string; year: number; day: number };
export const MILESTONES: Milestone[] = [1, 2, 3]
  .flatMap((year) => BADGES.filter((b) => b.days !== null).map((b) => ({ kind: b.kind, name: b.name, year, day: b.days! + (year - 1) * DAYS_PER_YEAR })))
  .sort((a, b) => a.day - b.day);

// The final award, the Fleet Admiral cup: earned the day after the last boat (the Golden galleon)
// finishes its third year, so a streak of 360 + 720 + 1 = 1081 days.
export const TROPHY_DAYS = Math.max(...BADGES.map((b) => b.days ?? 0)) + (MOST_YEARS - 1) * DAYS_PER_YEAR + 1;

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
