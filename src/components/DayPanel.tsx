// Shown on the game screen once a game is over: the day's numbers, what was earned, and where to go next.
// "Earned" has two spots: the sea creature for the number of guesses, and a boat that lights up
// only when a streak (or the mystery boat) was earned with this game. When a broken streak can be
// mended, the boat spot shows the rescue dolphin's offer instead.
import { useEffect, useRef, useState } from 'react';
import { Boat } from '../Boat';
import { Trophy } from '../Trophy';
import type { BadgeKind } from '../Boat';
import { Creature, CREATURE_LADDER, CREATURE_NAMES } from '../Creature';
import { MOST_GUESSES_TRACKED, api } from '../api';
import type { DayResult, DayStats, Outcome, RepairOffer } from '../api';
import { BADGES, STEPS, TRACK_NAME, ghostFor, stepKey, stepToGo, trackFor } from '../game/badges';
import type { Step, Wins } from '../game/badges';
import { LAUNCH_DATE, MODES, gameScore } from '../game/game';
import type { DailyMode, Mode } from '../game/game';
import { totalGuesses } from '../game/reducer';
import type { GameState } from '../game/reducer';
import type { RepairStock } from '../game/repairs';
import { RepairCard } from './RepairCard';
import { BookShape, ButtonIcon, LighthouseShape } from './TopBar';
import { SHARE_MARKS, shareText } from '../game/share';
import { formatDate } from '../game/dates';

// The win card's boats flip by themselves: every AUTO_FLIP_MS, for AUTO_FLIP_ROUNDS times around.
const AUTO_FLIP_MS = 3200;
const AUTO_FLIP_ROUNDS = 3;
const SAIL_OUT_MS = 320; // how long a boat takes to sail off the card before the next one sails in

type Props = {
  state: GameState;          // the finished game
  outcome: Outcome | null;   // arrives when the game ended just now; its arrival reloads the numbers below
  today: string;
  onMode: (mode: Mode) => void;
  onOpenLog: () => void;
  onOpenFleet: (focus?: string) => void; // focus: a creature or boat kind to show
  onPlayDay?: (dateKey: string, mode: DailyMode) => void; // the Next banner: open a past day
  still?: boolean; // the game was already over when it opened: skip the slide-in
  onReveal: () => void;      // after a loss: lift the fog and show the fleet
  onKeepTrying: () => void;  // after a loss: play the same fleet again (a Replay; it doesn't count)
};

export function DayPanel({ state, outcome, today, onMode, onOpenLog, onOpenFleet, onReveal, onKeepTrying, onPlayDay, still }: Props) {
  // After a win: offer the oldest past day not played yet in this mode (the Harbor log already opens on the newest).
  // This mode first; if it's all done, the other mode; if both are all done, a one-line celebration.
  const [next, setNext] = useState<{ day: string; mode: DailyMode } | 'all' | null>(null);
  const [nextClosed, setNextClosed] = useState(false);
  useEffect(() => {
    if (state.status !== 'won') return;
    let live = true;
    const here = state.mode as DailyMode;
    const there: DailyMode = here === 'easy' ? 'hard' : 'easy';
    const usable = (d: string | null, m: DailyMode) => d && !(d === state.dateKey && m === here) ? d : null;
    (async () => {
      const a = usable(await api.nextUnplayed(here, today), here);
      const b = a ? null : usable(await api.nextUnplayed(there, today), there);
      if (!live) return;
      setNext(a ? { day: a, mode: here } : b ? { day: b, mode: there } : today > LAUNCH_DATE ? 'all' : null);
    })();
    return () => { live = false; };
  }, [state.status, state.mode, state.dateKey, today]);
  const [day, setDay] = useState<Record<DailyMode, DayResult | undefined> | null>(null);
  const [streak, setStreak] = useState<number | null>(null);
  const [badges, setBadges] = useState<Record<string, string>>({}); // badge kind -> day earned
  const [looksEarned, setLooksEarned] = useState<Record<string, string>>({});     // 'canoe:sea' -> day earned
  const [looksEarnedBy, setLooksEarnedBy] = useState<Record<string, string>>({}); // 'canoe:sea' -> the game that earned it
  const [wins, setWins] = useState<Wins>({ bay: 0, sea: 0 });
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
      setLooksEarned(p.looksEarned); setLooksEarnedBy(p.looksEarnedBy); setWins(p.wins); setTrophy(p.trophy);
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
  const hints = counted ? counted.hints ?? 0 : state.hintsUsed;
  const spyglasses = counted ? counted.spyglasses ?? 0 : state.spyglasses ?? 0;
  const spyPoints = counted ? counted.spyglassPoints ?? 0 : state.spyglassPoints ?? 0;
  const points = gameScore(guesses, hints, spyPoints); // the score: guesses + hints + what spyglasses added
  // The board on screen can be a Replay, which may end differently from the game that counts.
  const playedAgain = state.rounds > 1 || (counted !== undefined && state.rounds > (counted.rounds ?? 1));

  const other: DailyMode = state.mode === 'easy' ? 'hard' : 'easy';
  const otherPlayed = day !== null && day[other] !== undefined;

  // Spot 1: the creature for this score (guesses + hints). The seal covers 8 and up. Greyed out on a loss.
  const creature = CREATURE_LADDER.find((c) => c.score === Math.min(points, MOST_GUESSES_TRACKED)) ?? CREATURE_LADDER[0];

  // Spot 2: a boat look earned with this game, if there was one. Each boat has a Bay look and an Open Sea look,
  // in year 1 and year 2 (see game/badges.ts); a look needs that many wins in its game and a streak (up to 30 days).
  // Otherwise it shows the last look earned in this game's track, greyed out, with what the next one needs.
  const earnedOn = counted?.playedOn;
  const track = trackFor(state.mode as DailyMode);
  const resultKey = `${state.dateKey}:${state.mode}`;
  const reachedToday: Step[] = counted ? STEPS.filter((st) => looksEarnedBy[stepKey(st)] === resultKey) : [];
  // More than one step on the same day (a new boat and new colors, say): flip through them, biggest first.
  const [stepAt, setStepAt] = useState(0);
  const steps = [...reachedToday].reverse();
  const newStep = steps[Math.min(stepAt, steps.length - 1)];   // the one on the card
  // Each flip sails the boat out (to the left going forward, like ships heading home) and the next one in.
  // With two or more, it flips by itself a few times so nobody misses them, and stops for good the moment
  // the player touches the card. Never on its own with "reduce motion" on.
  const [sail, setSail] = useState<'' | 'out-left' | 'out-right' | 'in-right' | 'in-left'>('');
  const sailTimer = useRef<number | undefined>(undefined);
  const [autoFlip, setAutoFlip] = useState(true);
  const flip = (by: number, byHand = true) => {
    if (byHand) setAutoFlip(false);
    window.clearTimeout(sailTimer.current);
    setSail(by > 0 ? 'out-left' : 'out-right');
    sailTimer.current = window.setTimeout(() => {
      setStepAt((i) => (i + by + steps.length) % steps.length);
      setSail(by > 0 ? 'in-right' : 'in-left');
    }, SAIL_OUT_MS);
  };
  useEffect(() => {
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (!autoFlip || steps.length < 2 || reduced) return;
    let flips = 0;
    const timer = window.setInterval(() => {
      flips += 1;
      flip(1, false);
      if (flips >= steps.length * AUTO_FLIP_ROUNDS) { window.clearInterval(timer); setAutoFlip(false); } // ends back on the first
    }, AUTO_FLIP_MS);
    return () => window.clearInterval(timer);
  }, [autoFlip, steps.length]);
  useEffect(() => () => window.clearTimeout(sailTimer.current), []);
  const swipeFrom = useRef<number | null>(null);
  const swiped = useRef(false); // a swipe ends in a click; this keeps it from opening the fleet
  // Only the game that was lost shows the ghost ship; a win on the same day shows the usual boat card.
  // Bay losses bring the light ghost, Open Sea losses the dark one.
  const ghostToday = counted?.status === 'lost' && !!earnedOn && badges[ghostFor(state.mode as DailyMode)] === earnedOn;
  const ghost = BADGES.find((b) => b.days === null);
  // Nothing new today: show the next look in this track, greyed, and what it still needs.
  const inTrack = STEPS.filter((st) => st.track === track);
  const nextStep = inTrack.find((st) => !looksEarned[stepKey(st)]);
  const lastStep = [...inTrack].reverse().find((st) => looksEarned[stepKey(st)]);
  const quietStep = nextStep ?? lastStep; // the boat being worked toward, greyed (or the last one, once all are in)
  const toGo = nextStep && streak !== null ? stepToGo(nextStep, wins, streak) : null;
  const plural = (n: number, one: string, many: string) => `${n} more ${n === 1 ? one : many}`;
  const stepLabel = (st: Step) => (st.year === 1 ? `${TRACK_NAME[st.track]} · ${BADGES.find((b) => b.kind === st.kind)!.how}` : `${TRACK_NAME[st.track]} · ${st.look === 'gold' ? 'gold' : 'jewel tones'}`);
  const trophyToday = !!earnedOn && trophy === earnedOn;
  // Copy result: a spoiler-free grid for the day's thread. Hidden for Practice (it has no day to compare).
  const [copied, setCopied] = useState(false);
  async function copyResult() {
    const text = shareText({
      dateKey: state.dateKey, mode: state.mode, won, guesses, hints, spyglasses, spyPoints,
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


  return (
    <section className={`day-panel${still ? ' day-panel--still' : ''}`} aria-live="polite">
      {next && !nextClosed && onPlayDay && (
        <div className="next-banner">
          {next === 'all' ? (
            <p className="next-banner__go">You've sailed every day in the log! ⚓ A new fleet comes in tomorrow.</p>
          ) : (
            <button type="button" className="next-banner__go" onClick={() => onPlayDay(next.day, next.mode)}>
              Next: {formatDate(next.day, false)} · {MODES[next.mode].label} →
            </button>
          )}
          <button type="button" className="next-banner__close" aria-label="Dismiss" onClick={() => setNextClosed(true)}>✕</button>
        </div>
      )}
      {/* After a Replay the board on screen and the game that counts can end differently: say both, plainly. */}
      {playedAgain ? (
        <>
          <h2>{state.status === 'won' ? 'Replay solved' : 'Replay slipped away'}</h2>
          <p className="day-panel__replay">
            Only your first game counts. It was {won ? `solved, score ${points}` : 'a miss'}, and the numbers below are from it.
          </p>
        </>
      ) : (
        <h2>{won ? 'Fleet found' : 'The fleet slipped away'}</h2>
      )}
      {state.dateKey !== today && (
        <p className="day-panel__past">A past day: it counts for your creatures and averages, but not your streak.</p>
      )}

      <div className="stats">
        <div className="stats__score"><strong>{won ? points : '–'}</strong><span>Score</span></div>
        <div><strong>{guesses}</strong><span>{guesses === 1 ? 'Guess' : 'Guesses'}</span></div>
        <div><strong>{hints + spyPoints}</strong><span>{hints + spyPoints === 1 ? 'Hint' : 'Hints'}</span></div>
        <div><strong>{streak ?? '–'}</strong><span>Day streak</span></div>
        <div><strong>{everyone ? everyone.average.toFixed(1) : '–'}</strong><span>Harbor score</span></div>
      </div>
      <p className="stats__note">Score = guesses + hints (Lookout +1, paid Spyglass +2). Lower is better.</p>


      <div className="earned">
        <div className={`earned__slot earned__slot--tap${won ? ' is-lit' : ''}`} role="button" tabIndex={0} onClick={() => onOpenFleet(creature.kind)} onKeyDown={(e) => { if (e.key === 'Enter') onOpenFleet(creature.kind); }}>
          <Creature kind={creature.kind} look={won ? 'color' : 'locked'} size={1.4} />
          <div>
            <strong>{won ? CREATURE_NAMES[creature.kind] : 'No sighting'}</strong>
            <p>{won ? `Sighted: score ${points}${points > MOST_GUESSES_TRACKED ? ` (${MOST_GUESSES_TRACKED} or more)` : ''}` : 'Creatures show up when you solve it'}</p>
          </div>
        </div>
        {offer ? (
          <RepairCard repairs={repairs} offer={offer} onUse={useRepair} />
        ) : newStep && won ? (
          <div className="earned__slot earned__slot--tap is-lit" role="button" tabIndex={0} onClick={() => { if (swiped.current) { swiped.current = false; return; } onOpenFleet(newStep.kind); }}
            onKeyDown={(e) => { if (e.key === 'Enter') onOpenFleet(newStep.kind); if (steps.length > 1 && e.key === 'ArrowRight') flip(1); if (steps.length > 1 && e.key === 'ArrowLeft') flip(-1); }}
            onPointerDown={(e) => { swipeFrom.current = e.clientX; setAutoFlip(false); }}
            onPointerUp={(e) => { const from = swipeFrom.current; swipeFrom.current = null; if (from !== null && steps.length > 1 && Math.abs(e.clientX - from) > 30) { swiped.current = true; flip(e.clientX < from ? 1 : -1); } }}>
            <span className={`earned__sail${sail ? ` earned__sail--${sail}` : ''}`}>
              <Boat key={stepKey(newStep)} kind={newStep.kind as BadgeKind} look={newStep.look} size={1.4} />
            </span>
            <div>
              <span className={`earned__sail${sail ? ` earned__sail--${sail}` : ''}`}>
                <strong>{newStep.name}</strong>
                <p>{stepLabel(newStep)}</p>
              </span>
              {steps.length > 1 && (
                <span className="earned__flip" onClick={(e) => e.stopPropagation()}>
                  <button type="button" aria-label="Previous" onClick={() => flip(-1)}><svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><path d="M12.5 4.5 L7 10 L12.5 15.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg></button>
                  {stepAt + 1} of {steps.length}
                  <button type="button" aria-label="Next" onClick={() => flip(1)}><svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><path d="M7.5 4.5 L13 10 L7.5 15.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg></button>
                </span>
              )}
            </div>
          </div>
        ) : ghostToday && ghost ? (
          <div className="earned__slot earned__slot--tap is-lit" role="button" tabIndex={0} onClick={() => onOpenFleet(ghost.kind)} onKeyDown={(e) => { if (e.key === 'Enter') onOpenFleet(ghost.kind); }}>
            <Boat kind={ghost.kind as BadgeKind} look={state.mode === 'hard' ? 'night' : 'color'} size={1.4} />
            <div>
              <strong>{ghost.name}</strong>
              <p>Drifted in with the fog</p>
            </div>
          </div>
        ) : quietStep ? (
          <div className="earned__slot earned__slot--tap" role="button" tabIndex={0} onClick={() => onOpenFleet(quietStep.kind)} onKeyDown={(e) => { if (e.key === 'Enter') onOpenFleet(quietStep.kind); }}>
            <Boat kind={quietStep.kind as BadgeKind} look="locked" size={1.4} />
            <div>
              <strong>{nextStep ? `Next ${TRACK_NAME[track]} boat: ${nextStep.name}${nextStep.year === 2 ? (nextStep.look === 'gold' ? ' in gold' : ' in jewel tones') : ''}` : quietStep.name}</strong>
              <p>
                {!nextStep ? `Every ${TRACK_NAME[track]} look, both years`
                  : toGo && (toGo.wins > 0 || toGo.days > 0)
                    ? [toGo.wins > 0 && plural(toGo.wins, `${TRACK_NAME[track]} win`, `${TRACK_NAME[track]} wins`), toGo.days > 0 && plural(toGo.days, 'day at sea', 'days at sea')].filter(Boolean).join(' · ')
                    : 'Almost there'}
              </p>
            </div>
          </div>
        ) : null}
      </div>


      {/* The walrus: won on the very last row (grey in the Bay, pink in the Open Sea). */}
      {outcome?.walrus !== undefined && (
        <div className="trophy-card is-lit nautilus-card">
          <Creature kind={state.mode === 'hard' ? 'pinkwalrus' : 'walrus'} size={1.1} />
          <div>
            <strong>{outcome.walrus > 1 ? 'Another' : 'A'} {state.mode === 'hard' ? 'pink walrus' : 'walrus'}!</strong>
            <p>Phew. You found the fleet on the very last row.{outcome.walrus > 1 ? ` That's ${outcome.walrus} in your fleet.` : ''}</p>
          </div>
        </div>
      )}
      {/* The barnacle: lost the first Keep trying too. Once ever. */}
      {outcome?.barnacle && (
        <div className="trophy-card is-lit nautilus-card">
          <Creature kind="barnacle" size={1.1} />
          <div>
            <strong>A barnacle!</strong>
            <p>For sticking with it, no matter what. It's in your fleet now.</p>
          </div>
        </div>
      )}
      {/* The starfish and the sand dollar: the fifth Past games win in the Bay or the Open Sea. Once ever. */}
      {(outcome?.starfish || outcome?.sanddollar) && (
        <div className="trophy-card is-lit nautilus-card">
          <Creature kind={outcome.starfish ? 'starfish' : 'sanddollar'} size={1.1} />
          <div>
            <strong>{outcome.starfish ? 'A starfish!' : 'A sand dollar!'}</strong>
            <p>{outcome.starfish ? 'Five Bay wins' : 'Five Open Sea wins'} from Past games. Thanks for exploring the archive.</p>
          </div>
        </div>
      )}
      {/* The hermit crab: a win after Keep trying. */}
      {outcome?.hermit !== undefined && (
        <div className="trophy-card is-lit nautilus-card">
          <Creature kind="hermit" size={1.1} />
          <div>
            <strong>{outcome.hermit > 1 ? 'Another hermit crab!' : 'A hermit crab!'}</strong>
            <p>You kept trying and found the fleet, carrying all your old guesses along like a shell.{outcome.hermit > 1 ? ` That's ${outcome.hermit} in your fleet.` : ''}</p>
          </div>
        </div>
      )}
      {/* The crab: the Bay took more guesses than the Open Sea today. */}
      {outcome?.crab !== undefined && (
        <div className="trophy-card is-lit nautilus-card">
          <Creature kind="crab" size={1.1} />
          <div>
            <strong>{outcome.crab > 1 ? 'Another crab!' : 'A crab!'}</strong>
            <p>The Bay took more guesses than the Open Sea today. Sideways, but you got there.{outcome.crab > 1 ? ` That's ${outcome.crab} in your fleet.` : ''}</p>
          </div>
        </div>
      )}
      {/* The nautilus: this win matched the other game's score on the same puzzle day. */}
      {outcome?.nautilus !== undefined && (
        <div className="trophy-card is-lit nautilus-card">
          <Creature kind="nautilus" size={1.1} />
          <div>
            <strong>{outcome.nautilus > 1 ? 'Another nautilus!' : 'A nautilus!'}</strong>
            <p>The same score in the Bay and the Open Sea today: a perfect spiral.{outcome.nautilus > 1 ? ` That's ${outcome.nautilus} in your fleet.` : ''}</p>
          </div>
        </div>
      )}

      {trophyToday && (
        <div className="trophy-card is-lit">
          <Trophy size={1.1} />
          <div>
            <strong>Fleet Admiral</strong>
            <p>You are the fleet. Every boat, in all four looks.</p>
          </div>
        </div>
      )}

      {/* A loss keeps the fleet in the fog: look now, or try again (a Replay doesn't count). */}
      {state.status === 'lost' && !state.revealed && (
        <div className="lost-choice">
          <p>The fleet is still hidden. Want another go first?</p>
          <div className="lost-choice__buttons">
            <button type="button" className="primary-btn primary-btn--small" onClick={onKeepTrying}>Keep trying</button>
            <button type="button" className="outline-btn" onClick={onReveal}>Reveal the fleet</button>
          </div>
        </div>
      )}

      <button type="button" className="outline-btn share-btn" onClick={copyResult}>
        {copied ? 'Copied! Paste it in the comments' : 'Copy result (no spoilers)'}
      </button>
      <p className="share-key">
        {SHARE_MARKS.exact} right spot · {SHARE_MARKS.near} wrong spot · {SHARE_MARKS.miss} not in the fleet
      </p>

      {!otherPlayed && <button type="button" className="primary-btn" onClick={() => onMode(other)}>{other === 'hard' ? 'Head out to the Open Sea' : 'Back to the Bay'}</button>}

      <div className="day-panel__more">
        <h3>Keep playing</h3>
        <div className="day-panel__links">
          {/* Practice opens in the size just played; it never counts. */}
          <button type="button" className="outline-btn" onClick={() => onMode(state.mode === 'hard' ? 'practice-hard' : 'practice-easy')}>Practice</button>
          <button type="button" className="outline-btn with-icon" onClick={onOpenLog}><ButtonIcon><BookShape /></ButtonIcon>Past games</button>
        </div>
        <p>See your boats and sightings</p>
        <button type="button" className="outline-btn with-icon" onClick={() => onOpenFleet()}><ButtonIcon><LighthouseShape /></ButtonIcon>Your fleet</button>
      </div>
    </section>
  );
}
