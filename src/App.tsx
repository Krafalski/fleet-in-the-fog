// The whole app: which screen is showing, which day and difficulty are being played.
// Navigation is one piece of state (`view`), not a router, because the game lives inside a Reddit post.
import { useState } from 'react';
import type { Outcome } from './api';
import { dateKeyFor } from './game/game';
import type { Mode } from './game/game';
import type { GameState } from './game/reducer';
import { Fleet } from './screens/Fleet';
import { GameScreen } from './screens/GameScreen';
import { HarborLog } from './screens/HarborLog';
import { Results } from './screens/Results';
import './theme.css';
import './app.css';

type View = 'game' | 'log' | 'fleet' | 'results';

export function App() {
  const today = dateKeyFor(new Date());
  const [view, setView] = useState<View>('game');
  const [dateKey, setDateKey] = useState(today); // the puzzle on screen; changes when a past day is picked
  const [mode, setMode] = useState<Mode>('easy');
  const [finished, setFinished] = useState<{ state: GameState; outcome: Outcome | null } | null>(null);

  if (view === 'log') {
    return (
      <HarborLog
        today={today}
        mode={mode}
        onClose={() => setView('game')}
        onPick={(picked) => { setDateKey(picked); setView('game'); }}
      />
    );
  }
  if (view === 'fleet') return <Fleet today={today} onClose={() => setView('game')} />;
  if (view === 'results' && finished) {
    return (
      <Results
        state={finished.state}
        outcome={finished.outcome}
        today={today}
        onClose={() => setView('game')}
        onOpenLog={() => setView('log')}
        onOpenFleet={() => setView('fleet')}
      />
    );
  }
  return (
    <GameScreen
      key={`${dateKey}:${mode}`}
      dateKey={dateKey}
      today={today}
      mode={mode}
      onMode={setMode}
      onOpenLog={() => setView('log')}
      onOpenFleet={() => setView('fleet')}
      onShowResults={(state, outcome) => { setFinished({ state, outcome }); setView('results'); }}
    />
  );
}

export default App; // Vite's main.tsx imports App as a default export
