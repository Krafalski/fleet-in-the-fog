// The whole app: which screen is showing, which day and difficulty are being played.
// Navigation is one piece of state (`view`), not a router, because the game lives inside a Reddit post.
import { useEffect, useState } from 'react';
import { api } from './api';
import { IntroModal } from './components/IntroModal';
import { DevBar } from './components/DevBar';
import { devTools } from './config';
import { dateKeyFor, isPractice } from './game/game';
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
  // Which creature or boat to show when Your fleet opens from a win-screen card.
  const [fleetFocus, setFleetFocus] = useState<string | undefined>(undefined);
  const [dateKey, setDateKey] = useState(today); // the puzzle on screen; changes when a past day is picked
  const [mode, setMode] = useState<Mode>('easy');
  // The welcome card: only when today's puzzle hasn't been touched in either mode.
  const [intro, setIntro] = useState<false | 'front' | 'rules'>(false);
  useEffect(() => {
    Promise.all([api.loadDay(today), api.loadGame(today, 'easy'), api.loadGame(today, 'hard')]).then(([day, easy, hard]) => {
      const touched = day.easy || day.hard || [easy, hard].some((g) => g.guesses.length > 0 || g.rounds > 1);
      setIntro(touched ? false : 'front');
    });
  }, [today]);

  return (
    <>
      {devTools && <DevBar today={today} />}
      {screen()}
      {intro && (
        <IntroModal
          key={intro}
          today={today}
          startOn={intro}
          // From the welcome card, Play goes to today's game. From How to play mid-game, it just closes.
          onPlay={() => { if (intro === 'front') { setView('game'); setDateKey(today); } setIntro(false); }}
        />
      )}
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
  if (view === 'fleet') return <Fleet today={today} focus={fleetFocus} onClose={() => { setFleetFocus(undefined); setView('game'); }} />;
  return (
    <GameScreen
      key={isPractice(mode) ? mode : `${dateKey}:${mode}`}
      dateKey={dateKey}
      today={today}
      mode={mode}
      onMode={setMode}
      onOpenLog={() => setView('log')}
      onOpenFleet={(focus?: string) => { setFleetFocus(focus); setView('fleet'); }}
      onOpenHelp={() => setIntro('rules')}
      onPlayDay={(day, dayMode) => { setDateKey(day); setMode(dayMode); }}
    />
  );
  }
}

export default App; // Vite's main.tsx imports App as a default export
