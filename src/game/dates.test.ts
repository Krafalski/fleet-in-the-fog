import { describe, expect, test } from 'vitest';
import { STEPS, computeStreak, stepReady, stepToGo, stepsReady } from './badges';
import { addDays, formatDate, weekStart, weekdayName } from './dates';

describe('dates', () => {
  test('addDays crosses months and years', () => {
    expect(addDays('2026-11-30', 1)).toBe('2026-12-01');
    expect(addDays('2027-01-01', -1)).toBe('2026-12-31');
  });
  test('weekStart is the Monday of that week', () => {
    expect(weekStart('2026-11-15')).toBe('2026-11-09'); // a Sunday
    expect(weekStart('2026-11-09')).toBe('2026-11-09'); // a Monday
    expect(weekStart('2026-11-11')).toBe('2026-11-09');
  });
  test('names and formats', () => {
    expect(weekdayName('2026-11-15')).toBe('Sun');
    expect(formatDate('2026-11-15')).toBe('Nov 15, 2026');
    expect(formatDate('2026-11-15', false)).toBe('Nov 15');
  });
});

describe('streaks', () => {
  test('counts back from today', () => {
    expect(computeStreak(new Set(['2026-11-13', '2026-11-14', '2026-11-15']), '2026-11-15')).toBe(3);
  });
  test('still counts if today is not played yet', () => {
    expect(computeStreak(new Set(['2026-11-13', '2026-11-14']), '2026-11-15')).toBe(2);
  });
  test('a missed day breaks it', () => {
    expect(computeStreak(new Set(['2026-11-12', '2026-11-14', '2026-11-15']), '2026-11-15')).toBe(2);
    expect(computeStreak(new Set(['2026-11-12']), '2026-11-15')).toBe(0);
  });
});

describe('boat looks: wins in that game plus a streak (capped at 30 days)', () => {
  const step = (kind: string, look: string) => STEPS.find((st) => st.kind === kind && st.look === look)!;
  test('20 boats in four looks each', () => {
    expect(STEPS.length).toBe(80);
  });
  test('the first month: the streak matches the wins', () => {
    expect(stepReady(step('canoe', 'color'), { bay: 7, sea: 0 }, 7)).toBe(true);
    expect(stepReady(step('canoe', 'color'), { bay: 7, sea: 0 }, 6)).toBe(false);
    expect(stepReady(step('canoe', 'color'), { bay: 6, sea: 9 }, 9)).toBe(false); // Open Sea wins don't count for Bay
    expect(stepReady(step('canoe', 'sea'), { bay: 0, sea: 7 }, 7)).toBe(true);
  });
  test('after that, a 30-day streak is enough', () => {
    expect(stepReady(step('longship', 'color'), { bay: 180, sea: 0 }, 30)).toBe(true);
    expect(stepReady(step('longship', 'color'), { bay: 180, sea: 0 }, 29)).toBe(false);
    expect(stepReady(step('longship', 'color'), { bay: 179, sea: 0 }, 300)).toBe(false);
  });
  test('year 2 asks for 360 more wins: gold for the Bay, jewels for the Open Sea', () => {
    expect(step('canoe', 'gold').need).toBe(367);
    expect(stepReady(step('canoe', 'jewel'), { bay: 0, sea: 367 }, 30)).toBe(true);
  });
  test('what a look still needs', () => {
    expect(stepToGo(step('canoe', 'sea'), { bay: 30, sea: 5 }, 30)).toEqual({ wins: 2, days: 0 });
    expect(stepToGo(step('houseboat', 'color'), { bay: 40, sea: 0 }, 12)).toEqual({ wins: 0, days: 18 });
  });
  test('25 Bay wins, 5 Open Sea wins, a 30-day streak: Bay up to day 21, Open Sea up to day 3', () => {
    const ready = stepsReady({ bay: 25, sea: 5 }, 30).map((st) => `${st.kind}:${st.look}`);
    expect(ready.filter((k) => k.endsWith(':color'))).toEqual(['paper:color', 'kayak:color', 'rowboat:color', 'canoe:color', 'raft:color', 'gondola:color', 'outrigger:color']);
    expect(ready.filter((k) => k.endsWith(':sea'))).toEqual(['paper:sea', 'kayak:sea', 'rowboat:sea']);
  });
});
