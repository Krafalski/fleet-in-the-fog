// Your fleet: averages, sea creature sightings, and the badge boats.
// Harbor view shows the creatures in a grid and the boats scattered, each in its own fixed spot;
// Show all lists the creatures first, then the boats in earning order. Anything not yet earned is greyed out.
// Double tap a boat in the harbor to switch it to the next colorway the player has unlocked.
// At the bottom: the rescue dolphin with the player's streak repairs, and the offer to use them if a streak broke.
import { useEffect, useRef, useState } from 'react';
import { Trophy } from '../Trophy';
import { Scenery } from '../Scenery';
import { TROPHY_DAYS } from '../game/badges';
import { Boat } from '../Boat';
import type { BadgeKind, BoatLook } from '../Boat';
import { Creature, CREATURE_LADDER, CREATURE_NAMES } from '../Creature';
import type { CreatureKind } from '../Creature';
import { MOST_GUESSES_TRACKED, api } from '../api';
import type { RepairOffer, Stats } from '../api';
import { RepairCard } from '../components/RepairCard';
import { CloseButton } from '../components/TopBar';
import { showAllColorways } from '../config';
import { BADGES, MYSTERY_BADGE } from '../game/badges';
import type { Badge } from '../game/badges';
import { formatDate } from '../game/dates';
import { MODES, MODE_LIST } from '../game/game';
import type { RepairStock } from '../game/repairs';

const NO_STATS: Stats = {
  you: { easy: { average: null, solved: 0 }, hard: { average: null, solved: 0 } },
  everyone: { easy: null, hard: null },
  sightings: { easy: {}, hard: {} },
};
// The colorways in the order they unlock: earned once, twice, three times.
const COLORWAYS: { look: BoatLook; label: string }[] = [
  { look: 'color', label: 'First year' },
  { look: 'year2', label: 'Second year' },
  { look: 'year3', label: 'Third year' },
];
// Two taps on the same boat closer together than this count as a double tap.
const DOUBLE_TAP_MS = 400;
const oneDecimal = (n: number | null) => (n === null ? '–' : n.toFixed(1));

// Where each boat sits in the harbor (pixels from the top-left of the 362 x 430 panel).
// These never change, so a player's fleet fills in the same way every time.
const HARBOR_SPOT: Record<string, { x: number; y: number }> = {
  paper: { x: 150, y: 88 },
  rowboat: { x: 50, y: 98 },
  canoe: { x: 244, y: 103 },
  raft: { x: 100, y: 7 },
  gondola: { x: 142, y: 261 },
  houseboat: { x: 58, y: 271 },
  ferry: { x: 12, y: 16 },
  lightship: { x: 280, y: 187 },
  paddle: { x: 8, y: 180 },
  cargo: { x: 104, y: 346 },
  longship: { x: 184, y: 21 },
  pirate: { x: 278, y: 10 },
  icebreaker: { x: 190, y: 175 },
  submarine: { x: 240, y: 275 },
  tallship: { x: 96, y: 191 },
  liner: { x: 188, y: 359 },
  galleon: { x: 276, y: 350 },
  ghost: { x: 14, y: 354 }
};

type Props = { today: string; onClose: () => void };

export function Fleet({ today, onClose }: Props) {
  const [earned, setEarned] = useState<Record<string, string>>({});
  const [showAll, setShowAll] = useState(false);
  const [timesEarned, setTimesEarned] = useState<Record<string, number>>({});
  const [looks, setLooks] = useState<Record<string, BoatLook>>({});
  const lastTap = useRef({ kind: '', at: 0 });
  const [repairs, setRepairs] = useState<RepairStock>({ ones: 0, threes: 0 });
  const [nextRepairIn, setNextRepairIn] = useState<number | undefined>(undefined);
  const [offer, setOffer] = useState<RepairOffer | null>(null);
  const [repairsUsed, setRepairsUsed] = useState(0); // goes up after a repair, so everything reloads
  const [stats, setStats] = useState<Stats>(NO_STATS);
  const [trophy, setTrophy] = useState<string | null>(null);
  const [albatross, setAlbatross] = useState<string | null>(null);
  const [streak, setStreak] = useState(0);
  // What the detail card shows: a boat's kind, or a creature's kind.
  const [picked, setPicked] = useState<string>(BADGES[0].kind);

  useEffect(() => {
    let cancelled = false;
    api.loadProgress(today).then((progress) => {
      if (cancelled) return;
      setEarned(progress.badges);
      setTimesEarned(progress.timesEarned);
      setLooks(progress.looks);
      setRepairs(progress.repairs);
      setNextRepairIn(progress.nextRepairIn);
      setOffer(progress.repairOffer);
      setTrophy(progress.trophy);
      setAlbatross(progress.albatross);
      setStreak(progress.streak);
    });
    api.loadStats().then((loaded) => {
      if (!cancelled) setStats(loaded);
    });
    return () => { cancelled = true; };
  }, [today, repairsUsed]);

  async function useRepair() {
    await api.useRepair(today);
    setRepairsUsed((n) => n + 1);
  }

  // How many colorways a boat has unlocked (0 to 3), and the one to draw it in.
  const unlocked = (kind: string) => Math.min(COLORWAYS.length, timesEarned[kind] ?? 0);
  const lookOf = (kind: string): BoatLook => {
    const n = unlocked(kind);
    if (n === 0) return 'locked';
    const chosen = COLORWAYS.findIndex((c) => c.look === looks[kind]);
    return chosen >= 0 && chosen < n ? COLORWAYS[chosen].look : 'color';
  };

  // One tap shows the boat's details. A quick second tap switches it to the next unlocked colorway.
  // With none or one unlocked there is nothing to switch to.
  function tapBoat(kind: string) {
    const now = Date.now();
    const isDouble = lastTap.current.kind === kind && now - lastTap.current.at < DOUBLE_TAP_MS;
    lastTap.current = { kind, at: isDouble ? 0 : now };
    setPicked(kind);
    const n = unlocked(kind);
    if (!isDouble || n < 2) return;
    const at = COLORWAYS.findIndex((c) => c.look === lookOf(kind));
    const next = COLORWAYS[(at + 1) % n].look;
    setLooks((old) => ({ ...old, [kind]: next }));
    api.saveBoatLook(kind, next);
  }

  // The mystery boat keeps its secret until it is earned.
  const describe = (badge: Badge) => {
    const got = Boolean(earned[badge.kind]);
    const secret = badge.kind === MYSTERY_BADGE && !got;
    return {
      got,
      name: secret ? 'Mystery boat' : badge.name,
      how: secret ? 'Mystery' : badge.how,
      note: secret ? 'Drifts in when you least expect it.' : badge.note,
      status: got ? `Earned ${formatDate(earned[badge.kind], false)}` : 'Not yet in your harbor',
    };
  };

  // One creature per number of guesses. The seal also covers anything above 8.
  const sightings = CREATURE_LADDER.map(({ guesses, kind }) => {
    const easy = stats.sightings.easy[guesses] ?? 0;
    const hard = stats.sightings.hard[guesses] ?? 0;
    const how = guesses >= MOST_GUESSES_TRACKED ? `Solved in ${guesses} or more` : guesses === 1 ? 'Solved in 1 guess' : `Solved in ${guesses} guesses`;
    return { kind, name: CREATURE_NAMES[kind], how, easy, hard, got: easy + hard > 0 };
  });
  const seen = (s: { easy: number; hard: number; got: boolean }) =>
    s.got ? `Seen ${s.easy} on Easy, ${s.hard} on Hard` : 'Not yet sighted';

  const count = BADGES.filter((b) => earned[b.kind]).length;
  const pickedCreature = sightings.find((s) => s.kind === picked);
  const current = BADGES.find((b) => b.kind === picked) ?? BADGES[0];
  const detail = describe(current);
  const colorways = showAllColorways ? COLORWAYS : COLORWAYS.slice(0, unlocked(current.kind));

  // The Fleet Admiral cup: at the top of the harbor view once earned, last on the screen until then.
  const trophyCard = (
      <div className={`trophy-card${trophy ? ' is-lit' : ''}`}>
        <Trophy size={1.1} locked={!trophy} />
        <div>
          <strong>Fleet Admiral</strong>
          {trophy ? (
            <p>You are the fleet. Earned {formatDate(trophy, false)}.</p>
          ) : (
            <p>Keep every boat sailing for three years, then one more day. {Math.max(0, TROPHY_DAYS - streak)} days to go.</p>
          )}
        </div>
      </div>
  );

  return (
    <main className="screen fleet">
      <header className="screen-head">
        <div>
          <h1>Your fleet</h1>
          <p>{count} of {BADGES.length} boats in harbor</p>
        </div>
        <CloseButton label="Close your fleet" onClick={onClose} />
      </header>

      <table className="averages">
        <caption>Average guesses to solve</caption>
        <thead>
          <tr><td /><th scope="col">You</th><th scope="col">Everyone</th></tr>
        </thead>
        <tbody>
          {MODE_LIST.map((mode) => (
            <tr key={mode}>
              <th scope="row">{MODES[mode].label}</th>
              <td><strong>{oneDecimal(stats.you[mode].average)}</strong> <span>{stats.you[mode].solved} solved</span></td>
              <td><strong>{oneDecimal(stats.everyone[mode])}</strong></td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="segmented" role="group" aria-label="Fleet view">
        <button type="button" className={!showAll ? 'is-on' : undefined} aria-pressed={!showAll} onClick={() => setShowAll(false)}>Harbor</button>
        <button type="button" className={showAll ? 'is-on' : undefined} aria-pressed={showAll} onClick={() => setShowAll(true)}>Show all</button>
      </div>

      {showAll ? (
        <ul className="fleet__list">
          {sightings.map((s) => (
            <li key={s.kind} className="fleet__item">
              <div className="fleet__icon"><Creature kind={s.kind as CreatureKind} look={s.got ? 'color' : 'locked'} size={1.3} /></div>
              <div>
                <div className="fleet__item-head"><span className="fleet__name">{s.name}</span><span className="fleet__how">{s.how}</span></div>
                <p className={`fleet__status${s.got ? ' is-earned' : ''}`}>{seen(s)}</p>
              </div>
            </li>
          ))}
          {BADGES.map((badge) => {
            const d = describe(badge);
            return (
              <li key={badge.kind} className="fleet__item">
                <div className="fleet__icon"><Boat kind={badge.kind as BadgeKind} look={lookOf(badge.kind)} size={1.3} /></div>
                <div>
                  <div className="fleet__item-head"><span className="fleet__name">{d.name}</span><span className="fleet__how">{d.how}</span></div>
                  <p className="fleet__note">{d.note}</p>
                  <p className={`fleet__status${d.got ? ' is-earned' : ''}`}>{d.status}</p>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <>
          {/* Earned: the cup leads the harbor view. Not yet: it waits at the very bottom. */}
          {trophy && trophyCard}

          <header className="fleet__section-head">
            <h2>Wins in…</h2>
            <p>Each creature is a sighting for solving in that many guesses.</p>
            <div className="fleet__key" aria-label="Counts: left is Easy, right is Hard">
              <span><i />Easy</span>
              <span><i className="is-hard" />Hard</span>
            </div>
          </header>
          <div className="sightings" role="group" aria-label="Sightings">
            {sightings.map((s) => (
              <button
                key={s.kind}
                type="button"
                className={`sighting${s.kind === picked ? ' is-on' : ''}`}
                onClick={() => setPicked(s.kind)}
                aria-label={`${s.name}, ${s.how}, ${seen(s)}`}
              >
                <Creature kind={s.kind as CreatureKind} look={s.got ? 'color' : 'locked'} size={1.3} />
                <span className="sighting__counts" aria-hidden="true"><i>{s.easy}</i><i>{s.hard}</i></span>
              </button>
            ))}
          </div>

          <header className="fleet__section-head">
            <h2>Streak fleet</h2>
            <p>The more days you play, the bigger your fleet grows.</p>
          </header>
          <div className="harbor">
            {BADGES.map((badge) => {
              const d = describe(badge);
              const spot = HARBOR_SPOT[badge.kind];
              return (
                <button
                  key={badge.kind}
                  type="button"
                  className={`harbor__boat${badge.kind === picked ? ' is-on' : ''}`}
                  style={{ left: spot.x, top: spot.y }}
                  onClick={() => tapBoat(badge.kind)}
                  aria-label={`${d.name}, ${d.how}, ${d.got ? 'earned' : 'not yet earned'}${unlocked(badge.kind) > 1 ? ', double tap to change its colors' : ''}`}
                >
                  <Boat kind={badge.kind as BadgeKind} look={lookOf(badge.kind)} size={1.4} />
                </button>
              );
            })}
          </div>

          {pickedCreature ? (
            <section className="fleet__detail" aria-live="polite">
              <div className="fleet__detail-top">
                <div className="fleet__icon fleet__icon--big"><Creature kind={pickedCreature.kind as CreatureKind} look={pickedCreature.got ? 'color' : 'locked'} size={1.7} /></div>
                <div>
                  <div className="fleet__name">{pickedCreature.name}</div>
                  <div className="fleet__how">{pickedCreature.how}</div>
                  <p className="fleet__note">The two numbers count your sightings: Easy on the left, Hard on the right.</p>
                  <p className={`fleet__status${pickedCreature.got ? ' is-earned' : ''}`}>{seen(pickedCreature)}</p>
                </div>
              </div>
            </section>
          ) : (
            <section className="fleet__detail" aria-live="polite">
              <div className="fleet__detail-top">
                <div className="fleet__icon fleet__icon--big"><Boat kind={current.kind as BadgeKind} look={lookOf(current.kind)} size={1.7} /></div>
                <div>
                  <div className="fleet__name">{detail.name}</div>
                  <div className="fleet__how">{detail.how}</div>
                  <p className="fleet__note">{detail.note}</p>
                  <p className={`fleet__status${detail.got ? ' is-earned' : ''}`}>{detail.status}</p>
                </div>
              </div>
              {unlocked(current.kind) > 1 && <p className="fleet__tip">Double tap the boat in the harbor to change its colors.</p>}
              {colorways.length > 0 && (
                <div className="fleet__years">
                  {colorways.map((c) => (
                    <div key={c.look} className={c.look === lookOf(current.kind) ? 'is-on' : undefined}>
                      <Boat kind={current.kind as BadgeKind} look={c.look} /><span>{c.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </>
      )}

      <RepairCard repairs={repairs} offer={offer} nextRepairIn={nextRepairIn} wide onUse={useRepair} />
      {/* An extra little badge: every ship right, every spot wrong. */}
      {!showAll && (
        <div className={`trophy-card albatross-card${albatross ? ' is-lit' : ''}`}>
          <span className={albatross ? undefined : 'is-locked'}><Scenery kind="albatross" size={1.1} /></span>
          <div>
            <strong>Albatross</strong>
            <p>{albatross ? `Every ship right, every spot wrong. Sighted ${formatDate(albatross, false)}.` : 'Sighted when a guess has every ship right, but every one in the wrong spot.'}</p>
          </div>
        </div>
      )}
      {!showAll && !trophy && trophyCard}
    </main>
  );
}
