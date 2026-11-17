// Shown on the game screen once a game is over: the day's numbers, what was earned, and where to go next.
// "Earned" has two spots: the sea creature for the number of guesses, and a boat that lights up
// only when a streak (or the mystery boat) was earned with this game. When a broken streak can be
// mended, the boat spot shows the rescue dolphin's offer instead.
import { useEffect, useState } from 'react';
import { Boat } from '../Boat';
import type { BadgeKind } from '../Boat';
import { Creature, CREATURE_LADDER, CREATURE_NAMES } from '../Creature';
import { MOST_GUESSES_TRACKED, api } from '../api';
import type { DayResult, DayStats, Outcome, RepairOffer } from '../api';
import { BADGES } from '../game/badges';
import { MODES } from '../game/game';
import type { Mode } from '../game/game';
import { totalGuesses } from '../game/reducer';
import type { GameState } from '../game/reducer';
import type { RepairStock } from '../game/repairs';
import { RepairCard } from './RepairCard';

type Props = {
  state: GameState;          // the finished game
  outcome: Outcome | null;   // arrives when the game ended just now; its arrival reloads the numbers below
  today: string;
  onMode: (mode: Mode) => void;
  onOpenLog: () => void;
  onOpenFleet: () => void;
};

export function DayPanel({ state, outcome, today, onMode, onOpenLog, onOpenFleet }: Props) {
  const [day, setDay] = useState<Record<Mode, DayResult | undefined> | null>(null);
  const [streak, setStreak] = useState<number | null>(null);
  const [badges, setBadges] = useState<Record<string, string>>({}); // badge kind -> day earned
  const [everyone, setEveryone] = useState<DayStats | null>(null);
  const [repairs, setRepairs] = useState<RepairStock>({ ones: 0, threes: 0 });
  const [offer, setOffer] = useState<RepairOffer | null>(null);
  const [repairsUsed, setRepairsUsed] = useState(0); // goes up after a repair, so the numbers reload

  // `outcome` is in the list so the numbers reload once the result has been saved.
  useEffect(() => {
    let cancelled = false;
    api.loadDay(state.dateKey).then((d) => { if (!cancelled) setDay(d); });
    api.loadProgress(today).then((p) => {
      if (cancelled) return;
      setStreak(p.streak); setBadges(p.badges); setRepairs(p.repairs); setOffer(p.repairOffer);
    });
    api.loadDayStats(state.dateKey, state.mode).then((s) => { if (!cancelled) setEveryone(s); });
    return () => { cancelled = true; };
  }, [state.dateKey, state.mode, today, outcome, repairsUsed]);

  async function useRepair() {
    await api.useRepair(today);
    setRepairsUsed((n) => n + 1);
  }

  // The first finished game is the one that counts. Until it has loaded, show the game on screen.
  const counted = day?.[state.mode];
  const won = counted ? counted.status === 'won' : state.status === 'won';
  const guesses = counted ? counted.guesses : totalGuesses(state);
  const hints = counted ? counted.hints : state.hintsUsed;
  // The board on screen can be a Replay, which may end differently from the game that counts.
  const playedAgain = state.rounds > 1 || (counted !== undefined && state.rounds > (counted.rounds ?? 1));

  const other: Mode = state.mode === 'easy' ? 'hard' : 'easy';
  const otherPlayed = day !== null && day[other] !== undefined;

  // Spot 1: the creature for this many guesses. The seal covers 8 and up. Greyed out on a loss.
  const creature = CREATURE_LADDER.find((c) => c.guesses === Math.min(guesses, MOST_GUESSES_TRACKED)) ?? CREATURE_LADDER[0];

  // Spot 2: a boat earned with this game, if there was one. BADGES is in earning order, so the last match is the biggest.
  // Otherwise it shows the last streak boat the player earned, greyed out, with how far away the next one is.
  // A player with no streak boats yet sees the first one they are working toward.
  const earnedOn = counted?.playedOn;
  const newBoat = earnedOn ? BADGES.filter((b) => badges[b.kind] === earnedOn).pop() : undefined;
  const nextBoat = BADGES.find((b) => b.days !== null && !badges[b.kind]);
  const lastBoat = BADGES.filter((b) => b.days !== null && badges[b.kind]).pop();
  const quietBoat = lastBoat ?? nextBoat;
  const daysToGo = nextBoat && nextBoat.days !== null && streak !== null ? nextBoat.days - streak : null;

  return (
    <section className="day-panel" aria-live="polite">
      <h2>{won ? 'Fleet found' : 'The fleet slipped away'}</h2>
      {playedAgain && <p className="day-panel__replay">Replay: {state.status === 'won' ? 'solved' : 'slipped away'}</p>}

      <div className="stats">
        <div><strong>{guesses}</strong><span>{guesses === 1 ? 'Guess' : 'Guesses'}</span></div>
        <div><strong>{hints}</strong><span>{hints === 1 ? 'Hint' : 'Hints'}</span></div>
        <div><strong>{streak ?? '–'}</strong><span>Day streak</span></div>
        <div><strong>{everyone ? everyone.average.toFixed(1) : '–'}</strong><span>Harbor average</span></div>
      </div>


      <div className="earned">
        <div className={`earned__slot${won ? ' is-lit' : ''}`}>
          <Creature kind={creature.kind} look={won ? 'color' : 'locked'} size={1.4} />
          <div>
            <strong>{won ? CREATURE_NAMES[creature.kind] : 'No sighting'}</strong>
            <p>{won ? `Sighted: solved in ${guesses}` : 'Creatures show up when you solve it'}</p>
          </div>
        </div>
        {offer ? (
          <RepairCard repairs={repairs} offer={offer} onUse={useRepair} />
        ) : newBoat ? (
          <div className="earned__slot is-lit">
            <Boat kind={newBoat.kind as BadgeKind} size={1.4} />
            <div>
              <strong>{newBoat.name}</strong>
              <p>{newBoat.days === null ? 'Drifted in with the fog' : `New boat: ${newBoat.how}`}</p>
            </div>
          </div>
        ) : quietBoat ? (
          <div className="earned__slot">
            <Boat kind={quietBoat.kind as BadgeKind} look="locked" size={1.4} />
            <div>
              <strong>{quietBoat.name}</strong>
              <p>
                {!nextBoat ? 'Every streak boat earned'
                  : daysToGo !== null && daysToGo > 0 ? `${daysToGo} ${daysToGo === 1 ? 'day' : 'days'} to the ${nextBoat.name.toLowerCase()}`
                  : `Next: ${nextBoat.name.toLowerCase()}, ${nextBoat.how}`}
              </p>
            </div>
          </div>
        ) : null}
      </div>

      {otherPlayed ? (
        <button type="button" className="primary-btn" onClick={onOpenLog}>Check the logs</button>
      ) : (
        <button type="button" className="primary-btn" onClick={() => onMode(other)}>Play {MODES[other].label}</button>
      )}
      <div className="day-panel__links">
        <button type="button" className="outline-btn" onClick={onOpenFleet}>Your fleet</button>
        {!otherPlayed && <button type="button" className="outline-btn" onClick={onOpenLog}>Harbor log</button>}
      </div>
    </section>
  );
}
