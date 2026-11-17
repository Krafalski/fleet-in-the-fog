// The whole app: which screen is showing, which day and difficulty are being played.
// Navigation is one piece of state (`view`), not a router, because the game lives inside a Reddit post.
import { useState } from 'react';
import { DevBar } from './components/DevBar';
import { devTools } from './config';
import { dateKeyFor } from './game/game';
import type { Mode } from './game/game';
import { Fleet } from './screens/Fleet';
import { GameScreen } from './screens/GameScreen';
import { HarborLog } from './screens/HarborLog';
import './theme.css';
import './app.css';

type View = 'game' | 'log' | 'fleet';

export function App() {
  const today = dateKeyFor(new Date());
  const [view, setView] = useState<View>('game');
  const [dateKey, setDateKey] = useState(today); // the puzzle on screen; changes when a past day is picked
  const [mode, setMode] = useState<Mode>('easy');

  return (
    <>
      {devTools && <DevBar today={today} />}
      {screen()}
    </>
  );

  function screen() {
  if (view === 'log') {
    return (
      <HarborLog
        today={today}
        onClose={() => setView('game')}
        onPick={(picked, pickedMode) => { setDateKey(picked); setMode(pickedMode); setView('game'); }}
      />
    );
  }
  if (view === 'fleet') return <Fleet today={today} onClose={() => setView('game')} />;
  return (
    <GameScreen
      key={`${dateKey}:${mode}`}
      dateKey={dateKey}
      today={today}
      mode={mode}
      onMode={setMode}
      onOpenLog={() => setView('log')}
      onOpenFleet={() => setView('fleet')}
    />
  );
  }
}

export default App; // Vite's main.tsx imports App as a default export
