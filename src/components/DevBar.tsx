// A thin bar at the very top, only on your local dev server (see devTools in config.ts).
// Reset today: play today's puzzle again from the start, as if it had never been played.
// Reset all: wipe streaks, boats, repairs and every saved game.
// For setting up streaks to test, see console-streak-testing.js in the project folder.
import { STORE, resetAll, resetToday } from '../api';
import { testGame } from '../config';

// Tells console-streak-testing.js which saved data the game is using right now.
(window as unknown as { FOG_STORE: string }).FOG_STORE = STORE;

export function DevBar({ today }: { today: string }) {
  function run(reset: () => void) {
    reset();
    window.location.reload();
  }
  return (
    <div className="devbar" role="toolbar" aria-label="Dev tools">
      <span>Dev · {testGame ? 'test data' : 'real data'}</span>
      <button type="button" onClick={() => run(() => resetToday(today))}>Reset today</button>
      <button type="button" onClick={() => { if (window.confirm('Wipe streaks, boats, repairs and all saved games?')) run(resetAll); }}>Reset all</button>
    </div>
  );
}
