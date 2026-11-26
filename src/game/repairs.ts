// Streak repair rules. Plain functions, no React and no storage.
//
// - Repairs come on days played 4, 25 and 52, then 75, 105, 135… (every 30 days, halfway between the monthly boats),
//   so they fill the gaps between boats and never land on the same day as one.
// - The first three repairs ever earned mend one missed day each. Every repair after that mends up to three.
// - Repairs can be combined to mend a longer gap, but the whole gap has to be covered.
// - A mended day does not add to the streak. The streak picks up where it was before the gap.
import { addDays } from './dates';

export const FIRST_REPAIR_DAYS = [4, 25, 52]; // in the gaps between the early boats (3–7, 21–30, 45–60)
export const MONTHLY_REPAIR_FROM = 75;         // then one every 30 days from here
export const DAYS_PER_REPAIR = 30;
export const SMALL_REPAIRS = 3;     // how many of the first repairs are the one-day kind
export const BIG_REPAIR_DAYS = 3;   // days a later repair can mend

// A pile of repairs: `ones` mend one day each, `threes` mend up to three.
export type RepairStock = { ones: number; threes: number };

// Every repair a player has earned so far, used or not.
export function repairsEarned(daysPlayed: number): RepairStock {
  const earned = repairCount(daysPlayed);
  return { ones: Math.min(earned, SMALL_REPAIRS), threes: Math.max(0, earned - SMALL_REPAIRS) };
}

// How many repairs `daysPlayed` days have earned.
export function repairCount(daysPlayed: number): number {
  const early = FIRST_REPAIR_DAYS.filter((d) => daysPlayed >= d).length;
  const monthly = daysPlayed >= MONTHLY_REPAIR_FROM ? Math.floor((daysPlayed - MONTHLY_REPAIR_FROM) / DAYS_PER_REPAIR) + 1 : 0;
  return early + monthly;
}

// How many more days of play until the next repair.
export function daysToNextRepair(daysPlayed: number): number {
  const early = FIRST_REPAIR_DAYS.find((d) => d > daysPlayed);
  if (early !== undefined) return early - daysPlayed;
  if (daysPlayed < MONTHLY_REPAIR_FROM) return MONTHLY_REPAIR_FROM - daysPlayed;
  return DAYS_PER_REPAIR - ((daysPlayed - MONTHLY_REPAIR_FROM) % DAYS_PER_REPAIR);
}

// The most days a pile of repairs can mend.
export function daysCovered(stock: RepairStock): number {
  return stock.ones + stock.threes * BIG_REPAIR_DAYS;
}

// Which repairs to spend on a gap of `gap` missed days, or null if the pile cannot cover it.
// Wastes as little as possible, and after that spends as few repairs as possible.
export function pickRepairs(gap: number, stock: RepairStock): RepairStock | null {
  let best: RepairStock | null = null;
  let bestWaste = Infinity;
  for (let threes = 0; threes <= stock.threes; threes++) {
    const ones = Math.max(0, gap - threes * BIG_REPAIR_DAYS);
    if (ones > stock.ones) continue;
    const waste = ones + threes * BIG_REPAIR_DAYS - gap;
    const better = waste < bestWaste || (waste === bestWaste && best !== null && ones + threes < best.ones + best.threes);
    if (best === null || better) {
      best = { ones, threes };
      bestWaste = waste;
    }
  }
  return gap > 0 ? best : null;
}

// The missed days between the player's current run and the run before it, newest first.
// Null when there is nothing to mend: no gap, no earlier run, or a gap longer than `maxDays`.
// `mendedDays` are days already repaired; they hold a run together like played days do.
export function findGap(playedDays: Set<string>, mendedDays: Set<string>, today: string, maxDays: number): string[] | null {
  const held = (day: string) => playedDays.has(day) || mendedDays.has(day);
  // Step back over the current run. If today has not been played yet, the run can still end yesterday.
  let day = playedDays.has(today) ? today : addDays(today, -1);
  while (held(day)) day = addDays(day, -1);
  // Now `day` is the newest missed day. Collect missed days until the earlier run shows up.
  const gap: string[] = [];
  while (!held(day)) {
    gap.push(day);
    if (gap.length > maxDays) return null;
    day = addDays(day, -1);
  }
  return gap;
}
