// A thin bar at the very top, only on your local dev server (see devTools in config.ts).
// Reset today: play today's puzzle again from the start, as if it had never been played.
// Reset all: wipe streaks, boats, repairs and every saved game.
// The left side says which data is in use, with a link to switch. Seeding streaks: see TESTING.md.
import { STORE, resetAll, resetToday } from '../api';
import { testGame } from '../config';
import { devUrlNote } from '../devUrl';

// Tells console-streak-testing.js which saved data the game is using right now.
(window as unknown as { FOG_STORE: string }).FOG_STORE = STORE;

export function DevBar({ today }: { today: string }) {
  function run(reset: () => void) {
    reset();
    window.location.reload();
  }
  return (
    <div className="devbar" role="toolbar" aria-label="Dev tools">
      <span>Dev · {testGame ? 'test game' : 'real data'}</span>
      {/* Switch between the test game and real data: same page, with or without ?test */}
      <a href={testGame ? window.location.pathname : `${window.location.pathname}?test`}>{testGame ? 'Real' : 'Test'}</a>
      {devUrlNote && <span className="devbar__note">{devUrlNote}</span>}
      <button type="button" onClick={() => run(() => resetToday(today))}>Reset today</button>
      <button type="button" onClick={() => { if (window.confirm('Wipe streaks, boats, repairs and all saved games?')) run(resetAll); }}>Reset all</button>
    </div>
  );
}
