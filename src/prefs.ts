// Player settings that belong to this browser, not to a game: kept in localStorage.
// (On Devvit these could move to the server later; for now they're just conveniences.)
import { STORE } from './api';

const KEY = `${STORE}:prefs`;
import type { PracticeMode } from './game/game';

// carry: start each row with the ships that were in the right spot. practice: the size last chosen in Practice.
// notesTip: the one-time tip about note flags has been seen.
export type Prefs = { carry: boolean; practice: PracticeMode; notesTip: boolean };
const DEFAULTS: Prefs = { carry: true, practice: 'practice-easy', notesTip: false };

export function loadPrefs(): Prefs {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) ?? '{}') };
  } catch {
    return DEFAULTS;
  }
}
export function savePrefs(prefs: Prefs) {
  try { localStorage.setItem(KEY, JSON.stringify(prefs)); } catch { /* storage unavailable: setting just won't stick */ }
}
