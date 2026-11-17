// Player settings that belong to this browser, not to a game: kept in localStorage.
// (On Devvit these could move to the server later; for now they're just conveniences.)
import { STORE } from './api';

const KEY = `${STORE}:prefs`;
export type Prefs = { carry: boolean }; // carry: start each row with the ships that were in the right spot
const DEFAULTS: Prefs = { carry: true };

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
