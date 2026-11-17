// Shown on the game screen once a game is over: the day's numbers, what was earned, and where to go next.
// "Earned" has two spots: the sea creature for the number of guesses, and a boat that lights up
// only when a streak (or the mystery boat) was earned with this game. When a broken streak can be
// mended, the boat spot shows the rescue dolphin's offer instead.
import { useEffect, useState } from 'react';
import { Boat } from '../Boat';
import { Trophy } from '../Trophy';
import type { BadgeKind } from '../Boat';
import { Creature, CREATURE_LADDER, CREATURE_NAMES } from '../Creature';
import { MOST_GUESSES_TRACKED, api } from '../api';
import type { DayResult, DayStats, Outcome, RepairOffer } from '../api';
import { BADGES } from '../game/badges';
import { MODES } from '../game/game';
import type { DailyMode, Mode } from '../game/game';
import { totalGuesses } from '../game/reducer';
import type { GameState } from '../game/reducer';
import type { RepairStock } from '../game/repairs';
import { RepairCard } from './RepairCard';
import { SHARE_MARKS, shareText } from '../game/share';

type Props = {
  state: GameState;          // the finished game
  outcome: Outcome | null;   // arrives when the game ended just now; its arrival reloads the numbers below
  today: string;
  onMode: (mode: Mode) => void;
  onOpenLog: () => void;
  onOpenFleet: () => void;
};

export function DayPanel({ state, outcome, today, onMode, onOpenLog, onOpenFleet }: Props) {
  const [day, setDay] = useState<Record<DailyMode, DayResult | undefined> | null>(null);
  const [streak, setStreak] = useState<number | null>(null);
  const [badges, setBadges] = useState<Record<string, string>>({}); // badge kind -> day earned
  const [newColorsOn, setNewColorsOn] = useState<Record<string, string>>({}); // badge kind -> day its new colors came
  const [years, setYears] = useState<Record<string, number>>({});
  const [trophy, setTrophy] = useState<string | null>(null);
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
      setNewColorsOn(p.newColorsOn); setYears(p.timesEarned); setTrophy(p.trophy);
    });
    api.loadDayStats(state.dateKey, state.mode).then((s) => { if (!cancelled) setEveryone(s); });
    return () => { cancelled = true; };
  }, [state.dateKey, state.mode, today, outcome, repairsUsed]);

  async function useRepair() {
    await api.useRepair(today);
    setRepairsUsed((n) => n + 1);
  }

  // The first finished game is the one that counts. Until it has loaded, show the game on screen.
  const counted = day?.[state.mode as DailyMode];
  const won = counted ? counted.status === 'won' : state.status === 'won';
  const guesses = counted ? counted.guesses : totalGuesses(state);
  const hints = counted ? counted.hints : state.hintsUsed;
  // The board on screen can be a Replay, which may end differently from the game that counts.
  const playedAgain = state.rounds > 1 || (counted !== undefined && state.rounds > (counted.rounds ?? 1));

  const other: DailyMode = state.mode === 'easy' ? 'hard' : 'easy';
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
  // Boats that came back in new colors with this game (a year passed for them).
  const recolored = earnedOn ? BADGES.filter((b) => newColorsOn[b.kind] === earnedOn) : [];
  const trophyToday = !!earnedOn && trophy === earnedOn;
  // Copy result: a spoiler-free grid for the day's thread. Hidden for Practice (it has no day to compare).
  const [copied, setCopied] = useState(false);
  async function copyResult() {
    const text = shareText({
      dateKey: state.dateKey, mode: state.mode, won, guesses,
      creature: won ? CREATURE_NAMES[creature.kind] : null,
      streak,
      rows: state.rounds > 1 ? null : state.feedback, // a replay's board isn't the game that counts
      perSpot: state.perSpot,
    });
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Older browsers: copy through a hidden text box.
      const box = document.createElement('textarea');
      box.value = text;
      document.body.appendChild(box);
      box.select();
      document.execCommand('copy');
      box.remove();
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

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

      {recolored.length > 0 && (
        <div className="new-colors">
          <div className="new-colors__boats">
            {recolored.slice(-3).map((b) => (
              <Boat key={b.kind} kind={b.kind as BadgeKind} look={years[b.kind] >= 3 ? 'year3' : 'year2'} size={1} />
            ))}
          </div>
          <div>
            <strong>New year, new colors!</strong>
            <p>
              {recolored.length === 1
                ? `Your ${recolored[0].name.toLowerCase()} has sailed with you for another year, and earned new colors.`
                : `${recolored.length} boats have sailed with you for another year, and earned new colors.`}
              {' '}Double tap a boat in your fleet to switch.
            </p>
          </div>
        </div>
      )}

      {trophyToday && (
        <div className="trophy-card is-lit">
          <Trophy size={1.1} />
          <div>
            <strong>Fleet Admiral</strong>
            <p>You are the fleet. Every boat, three years at sea, and one more day.</p>
          </div>
        </div>
      )}

      <button type="button" className="outline-btn share-btn" onClick={copyResult}>
        {copied ? 'Copied! Paste it in the comments' : 'Copy result (no spoilers)'}
      </button>
      <p className="share-key">
        {SHARE_MARKS.exact} right spot · {SHARE_MARKS.near} wrong spot · {SHARE_MARKS.miss} no match
      </p>

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
