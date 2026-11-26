// Your fleet: averages, sea creature sightings, and the badge boats.
// Harbor view shows the creatures in a grid and the boats scattered, each in its own fixed spot;
// Show all lists the creatures first, then the boats in earning order. Anything not yet earned is greyed out.
// Double tap a boat in the harbor to switch it to the next look the player has earned.
// At the bottom: the rescue dolphin with the player's streak repairs, and the offer to use them if a streak broke.
import { useEffect, useRef, useState } from 'react';
import { Trophy } from '../Trophy';
import { Scenery } from '../Scenery';
import { STEPS, TRACK_NAME, TROPHY_STEPS, stepKey, stepToGo, streakNeed } from '../game/badges';
import type { Step, Wins } from '../game/badges';
import { Boat, GEM_NAME, GEM_OF } from '../Boat';
import type { BadgeKind, BoatLook } from '../Boat';
import { Creature, CREATURE_LADDER, CREATURE_NAMES } from '../Creature';
import type { CreatureKind } from '../Creature';
import { ARCHIVE_WINS_NEEDED, MOST_GUESSES_TRACKED, api } from '../api';
import type { ExtraKind, Progress, RepairOffer, Stats } from '../api';
import { RepairCard } from '../components/RepairCard';
import { CloseButton } from '../components/TopBar';
import { showAllColorways } from '../config';
import { BADGES, GHOST_DARK, MYSTERY_BADGE } from '../game/badges';
import type { Badge } from '../game/badges';
import { formatDate } from '../game/dates';
import { GOLDEN_PER_BOAT, MODES, MODE_LIST, SPYGLASS_COST } from '../game/game';
import { Spyglass } from '../Spyglass';
import { Compass } from '../Compass';
import type { RepairStock } from '../game/repairs';

const NO_STATS: Stats = {
  you: { easy: { average: null, hints: null, score: null, solved: 0 }, hard: { average: null, hints: null, score: null, solved: 0 } },
  everyone: { easy: null, hard: null },
  sightings: { easy: {}, hard: {} },
};
// Boat looks: streak boats have four (see FOUR_LOOKS below); the ghost ship has two.
// The ghost ship's two looks, and the loss that brings each one.
const GHOST_LOOKS: { look: BoatLook; label: string; key: string }[] = [
  { look: 'color', label: 'Lost in the Bay', key: MYSTERY_BADGE },
  { look: 'night', label: 'Lost on the Open Sea', key: GHOST_DARK },
];
// A streak boat's four looks, in the order they're shown: year 1 Bay, year 1 Open Sea, year 2 Bay (gold), year 2 Open Sea (jewels).
const FOUR_LOOKS: BoatLook[] = ['color', 'sea', 'gold', 'jewel'];
const LOOK_LABEL = (kind: string, look: BoatLook) =>
  look === 'color' ? 'Bay' : look === 'sea' ? 'Open Sea' : look === 'gold' ? 'Bay · gold' : `Open Sea · ${GEM_NAME[GEM_OF[kind]] ?? 'jewels'}`;
// Older saves called the inverse colors 'year2'.
const savedLook = (look: BoatLook | undefined): BoatLook | undefined => (look === 'year2' ? 'sea' : look);
// How long "How to build your fleet" has to stay open to find the compass.
const COMPASS_READ_MS = 5000;
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
  kayak: { x: 96, y: 191 },      // day 2: right under the paper boat and rowboat
  liner: { x: 188, y: 359 },
  galleon: { x: 276, y: 350 },
  ghost: { x: 14, y: 354 },
  // The bottom row (3 boats, so the rows keep alternating 4, 3, 4, 3, 4, 3)
  outrigger: { x: 52, y: 438 },
  catamaran: { x: 146, y: 444 },
  tallship: { x: 242, y: 436 },
};

type Props = { today: string; onClose: () => void; focus?: string }; // focus: creature or boat kind to show first

// The bottom cards for the newer sightings, in order. once: earned one time only (no count).
const EXTRA_CARDS: { kind: ExtraKind; once: boolean; got: string; todo: string }[] = [
  { kind: 'walrus', once: false, got: 'A Bay win on the very last row.', todo: 'Sighted when you win the Bay on its very last row.' },
  { kind: 'pinkwalrus', once: false, got: 'An Open Sea win on the very last row.', todo: 'Sighted when you win the Open Sea on its very last row.' },
  { kind: 'lobster', once: false, got: 'An albatross on your first Bay guess.', todo: 'Sighted when your very first Bay guess is an albatross: every ship right, every spot wrong.' },
  { kind: 'bluelobster', once: false, got: 'An albatross on your first Open Sea guess.', todo: 'Sighted when your very first Open Sea guess is an albatross. As rare as the real thing.' },
  { kind: 'barnacle', once: true, got: 'For sticking with it, no matter what.', todo: 'Sighted when you lose a game, tap Keep trying, and lose that one too.' },
  { kind: 'starfish', once: true, got: 'Five Bay wins from Past games.', todo: `Sighted after ${ARCHIVE_WINS_NEEDED} Bay wins in Past games.` },
  { kind: 'sanddollar', once: true, got: 'Five Open Sea wins from Past games.', todo: `Sighted after ${ARCHIVE_WINS_NEEDED} Open Sea wins in Past games.` },
];

export function Fleet({ today, onClose, focus }: Props) {
  const [earned, setEarned] = useState<Record<string, string>>({});
  const [showAll, setShowAll] = useState(false);
  const [looksEarned, setLooksEarned] = useState<Record<string, string>>({}); // 'canoe:sea' -> day earned
  const [wins, setWins] = useState<Wins>({ bay: 0, sea: 0 });
  const [looks, setLooks] = useState<Record<string, BoatLook>>({});
  const lastTap = useRef({ kind: '', at: 0 });
  const [repairs, setRepairs] = useState<RepairStock>({ ones: 0, threes: 0 });
  const [nextRepairIn, setNextRepairIn] = useState<number | undefined>(undefined);
  const [offer, setOffer] = useState<RepairOffer | null>(null);
  const [repairsUsed, setRepairsUsed] = useState(0); // goes up after a repair, so everything reloads
  const [stats, setStats] = useState<Stats>(NO_STATS);
  const [trophy, setTrophy] = useState<string | null>(null);
  const [albatross, setAlbatross] = useState<string | null>(null);
  const [albatrossCount, setAlbatrossCount] = useState(0);
  const [golden, setGolden] = useState(0);
  const [streak, setStreak] = useState(0);
  const [rulesOpen, setRulesOpen] = useState(false); // the "How to build your fleet" card
  const [nautilus, setNautilus] = useState<string | null>(null);
  const [nautilusCount, setNautilusCount] = useState(0);
  const [crab, setCrab] = useState<{ first: string | null; count: number }>({ first: null, count: 0 });
  const [hermit, setHermit] = useState<{ first: string | null; count: number }>({ first: null, count: 0 });
  const [extras, setExtras] = useState<Progress['extras'] | null>(null);
  const [compass, setCompass] = useState<string | null>(null);
  const [compassJustFound, setCompassJustFound] = useState(false);
  // Reading pays off: keep "How to build your fleet" open for a few seconds and the compass is yours (once).
  useEffect(() => {
    if (!rulesOpen || compass) return;
    const timer = window.setTimeout(() => {
      api.findCompass(today).then((found) => {
        if (!found) return;
        setCompass(today);
        setCompassJustFound(true);
      });
    }, COMPASS_READ_MS);
    return () => window.clearTimeout(timer);
  }, [rulesOpen, compass, today]);
  // The boat the detail card shows.
  const focusIsBoat = !!focus && BADGES.some((b) => b.kind === focus);
  const [picked, setPicked] = useState<string>(focusIsBoat ? focus! : BADGES[0].kind);
  // The creature whose note shows under the sightings grid; tap it again to close.
  const [pickedKind, setPickedKind] = useState<string | null>(focus && !focusIsBoat ? focus : null);
  // Opened from a win-screen card: jump (no sliding) so that section's heading sits at the top of the screen,
  // with the creature or boat already picked. Nothing overshoots: the harbor and its card show just below.
  useEffect(() => {
    if (!focus) return;
    const t = window.setTimeout(() => document.querySelector(focusIsBoat ? '#fleet-boats' : '#fleet-creatures')?.scrollIntoView({ block: 'start' }), 50);
    return () => window.clearTimeout(t);
  }, [focus, focusIsBoat]);

  useEffect(() => {
    let cancelled = false;
    api.loadProgress(today).then((progress) => {
      if (cancelled) return;
      setEarned(progress.badges);
      setLooksEarned(progress.looksEarned);
      setWins(progress.wins);
      setLooks(progress.looks);
      setRepairs(progress.repairs);
      setNextRepairIn(progress.nextRepairIn);
      setOffer(progress.repairOffer);
      setTrophy(progress.trophy);
      setAlbatross(progress.albatross);
      setAlbatrossCount(progress.albatrossCount);
      setNautilus(progress.nautilus);
      setNautilusCount(progress.nautilusCount);
      setCrab({ first: progress.crab, count: progress.crabCount });
      setHermit({ first: progress.hermit, count: progress.hermitCount });
      setExtras(progress.extras);
      setCompass(progress.compass);
      setGolden(progress.goldenSpyglasses);
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

  // The looks a boat can show. Streak boats: Bay and Open Sea, year 1 and 2; the ghost ship has a light look
  // (from a Bay loss) and a dark one (from an Open Sea loss), each unlocked on its own.
  const ghostLooks = GHOST_LOOKS.filter((g) => showAllColorways || earned[g.key]);
  const looksFor = (kind: string): { look: BoatLook; label: string }[] => (kind === MYSTERY_BADGE
    ? ghostLooks
    : FOUR_LOOKS.filter((look) => showAllColorways || looksEarned[`${kind}:${look}`]).map((look) => ({ look, label: LOOK_LABEL(kind, look) })));
  const unlocked = (kind: string) => looksFor(kind).length;
  const lookOf = (kind: string): BoatLook => {
    const options = looksFor(kind);
    if (options.length === 0) return 'locked';
    return options.find((c) => c.look === savedLook(looks[kind]))?.look ?? options[0].look;
  };
  // What one look of a boat still needs, in words: "5 of 7 Bay wins · 7-day streak ✓".
  const stepOf = (kind: string, look: BoatLook) => STEPS.find((st) => st.kind === kind && st.look === look);
  const needText = (st: Step) => {
    const toGo = stepToGo(st, wins, streak);
    const winsPart = toGo.wins > 0 ? `${wins[st.track]} of ${st.need} ${TRACK_NAME[st.track]} wins` : `${st.need} ${TRACK_NAME[st.track]} wins ✓`;
    const days = streakNeed(st);
    const streakPart = toGo.days > 0 ? `${days}-day streak (now ${streak})` : `${days}-day streak ✓`;
    return `${winsPart} · ${streakPart}`;
  };
  function chooseLook(kind: string, look: BoatLook) {
    setLooks((old) => ({ ...old, [kind]: look }));
    api.saveBoatLook(kind, look);
  }

  // One tap shows the boat's details. A quick second tap switches it to the next unlocked colorway.
  // With none or one unlocked there is nothing to switch to.
  function tapBoat(kind: string) {
    const now = Date.now();
    const isDouble = lastTap.current.kind === kind && now - lastTap.current.at < DOUBLE_TAP_MS;
    lastTap.current = { kind, at: isDouble ? 0 : now };
    setPicked(kind);
    const options = looksFor(kind);
    if (!isDouble || options.length < 2) return;
    const at = options.findIndex((c) => c.look === lookOf(kind));
    chooseLook(kind, options[(at + 1) % options.length].look);
  }

  // The mystery boat keeps its secret until it is earned.
  const earnedOn = (kind: string) => (kind === MYSTERY_BADGE
    ? [earned[MYSTERY_BADGE], earned[GHOST_DARK]].filter(Boolean).sort()[0]
    : earned[kind]);
  const describe = (badge: Badge) => {
    const got = Boolean(earnedOn(badge.kind));
    const secret = badge.kind === MYSTERY_BADGE && !got;
    // Streak boats: what each look asks for. In the first month the streak matches the wins; after that it's 30 days.
    const how = badge.days === null ? badge.how
      : badge.days === 1 ? '1 win in a game'
      : `${badge.days} wins in a game and a ${Math.min(badge.days, 30)}-day streak`;
    return {
      got,
      name: secret ? 'Mystery boat' : badge.name,
      how: secret ? 'Mystery' : how,
      note: secret ? 'Drifts in when you least expect it.' : badge.note,
      status: got ? `Earned ${formatDate(earnedOn(badge.kind)!, false)}` : 'Not yet in your harbor',
    };
  };

  // One creature per winning score (guesses + hints). The seal also covers anything above 8.
  const sightings = CREATURE_LADDER.map(({ score, kind }) => {
    const easy = stats.sightings.easy[score] ?? 0;
    const hard = stats.sightings.hard[score] ?? 0;
    const how = score >= MOST_GUESSES_TRACKED ? `Score ${score} or more` : `Score ${score}`;
    return { kind, name: CREATURE_NAMES[kind], how, easy, hard, got: easy + hard > 0 };
  });
  const seen = (s: { easy: number; hard: number; got: boolean }) =>
    s.got ? `Seen ${s.easy} in the Bay, ${s.hard} on the Open Sea` : 'Not yet sighted';

  const count = BADGES.filter((b) => earnedOn(b.kind)).length;
  const pickedCreature = sightings.find((s) => s.kind === pickedKind);
  const current = BADGES.find((b) => b.kind === picked) ?? BADGES[0];
  const detail = describe(current);
  // The detail card lists every look: earned ones can be picked, the rest say what they still need.
  const colorways: { look: BoatLook; label: string; earned: boolean; need?: string }[] = current.kind === MYSTERY_BADGE
    ? ghostLooks.map((g) => ({ ...g, earned: true }))
    : current.days === null ? []
    : FOUR_LOOKS.map((look) => {
      const st = stepOf(current.kind, look)!;
      const on = looksEarned[stepKey(st)];
      return { look, label: LOOK_LABEL(current.kind, look), earned: !!on || showAllColorways, need: on ? `Earned ${formatDate(on, false)}` : needText(st) };
    });
  const looksDone = STEPS.filter((st) => looksEarned[stepKey(st)]).length;

  // The Fleet Admiral cup: at the top of the harbor view once earned, last on the screen until then.
  const trophyCard = (
      <div className={`trophy-card${trophy ? ' is-lit' : ''}`}>
        <Trophy size={1.1} locked={!trophy} />
        <div>
          <strong>Fleet Admiral</strong>
          {trophy ? (
            <p>You are the fleet. Earned {formatDate(trophy, false)}.</p>
          ) : (
            <p>Earn every boat in all four looks: Bay and Open Sea, year 1 and year 2. {looksDone} of {TROPHY_STEPS} so far.</p>
          )}
        </div>
      </div>
  );

  return (
    <main className="screen fleet">
      {/* The ✕ stays at the top right while you scroll. */}
      <div className="sticky-close"><CloseButton label="Close your fleet" onClick={onClose} /></div>
      <header className="screen-head">
        <div>
          <h1>Your fleet</h1>
          <p>{count} of {BADGES.length} boats in harbor</p>
          <button type="button" className="fleet__rules-link" onClick={() => setRulesOpen(true)}>How to build your fleet ⓘ</button>
        </div>
      </header>

      {/* How to build your fleet: the rules for creatures, boats, repairs and spyglasses, in one place. */}
      {rulesOpen && (
        <div className="notes-modal" role="dialog" aria-modal="true" aria-label="How to build your fleet" onClick={() => { setRulesOpen(false); setCompassJustFound(false); }}>
          <div className="notes-modal__card rules-card" onClick={(e) => e.stopPropagation()}>
            <h2>How to build your fleet</h2>
            <section>
              <span className="rules-card__icon"><Creature kind="whale" size={0.9} /></span>
              <div>
                <h3>Animal sightings</h3>
                <p>Every win brings an animal sighting based on your score: guesses plus hints. Lower scores reveal rarer animals.</p>
              </div>
            </section>
            <section>
              <span className="rules-card__icon"><Boat kind="canoe" size={0.9} /></span>
              <div>
                <h3>Boats</h3>
                <p>Win either daily game to grow your streak and earn boats. New boats arrive on days 1, 2, 3, 7, 10, 14, 21, and 30, then about once a month.</p>
                <p>Each boat has a Bay look and an Open Sea look. To unlock a look, meet that boat’s win requirement in that game and its streak requirement. Streak requirements never exceed 30 days. Once you have both looks, tap the boat to choose which one sails in your harbor.</p>
                <p>If your streak breaks, you keep your boats and win totals. Build another 30-day streak to continue collecting. After a full year of wins, you can earn gold Bay boats and jewel-toned Open Sea boats.</p>
              </div>
            </section>
            <section>
              <span className="rules-card__icon"><Creature kind="medic" size={0.9} /></span>
              <div>
                <h3>Streak repairs</h3>
                <p>Repairs protect your streak when you miss a day. You earn them after 4, 25, and 52 total days played, then every 30 days after that. They are based on total days played—not your current streak—so you can keep earning them after a break. Later repairs can cover up to three missed days.</p>
              </div>
            </section>
            <section>
              <span className="rules-card__icon"><Spyglass size={0.9} /></span>
              <div>
                <h3>Golden Spyglasses</h3>
                <p>In Open Sea, a Spyglass finds and locks in one correctly placed ship. Each new boat brings two golden Spyglasses, which are free to use. Without one, using a Spyglass adds 2 points to your score.</p>
              </div>
            </section>
            {compassJustFound && (
              <div className="rules-card__found" role="status">
                <Compass size={1} />
                <p><strong>You found a compass!</strong> Thanks for reading. Now you know your bearings.</p>
              </div>
            )}
            <button type="button" className="primary-btn primary-btn--small" onClick={() => { setRulesOpen(false); setCompassJustFound(false); }}>Got it</button>
          </div>
        </div>
      )}

      <table className="averages">
        <caption>Averages per solved puzzle</caption>
        <thead>
          <tr><td /><th scope="col">Guesses</th><th scope="col">Hints</th><th scope="col">Your score</th><th scope="col">Everyone</th></tr>
        </thead>
        <tbody>
          {MODE_LIST.map((mode) => (
            <tr key={mode}>
              <th scope="row">{MODES[mode].label}</th>
              <td><strong>{oneDecimal(stats.you[mode].average)}</strong></td>
              <td><strong>{oneDecimal(stats.you[mode].hints)}</strong></td>
              <td className="averages__score"><strong>{oneDecimal(stats.you[mode].score)}</strong></td>
              <td><strong>{oneDecimal(stats.everyone[mode])}</strong></td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="averages__note">
        Score = guesses + hints (spyglasses count as hints), lower is better. {stats.you.easy.solved} Bay and {stats.you.hard.solved} Open Sea solved.
      </p>

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

          <header id="fleet-creatures" className="fleet__section-head">
            <h2>Wins by score</h2>
            <p>Each creature is a win with that score: guesses plus hints. Tap one to see it.</p>
            <div className="fleet__key" aria-label="Counts: left is Bay, right is Open Sea">
              <span><i />Bay</span>
              <span><i className="is-hard" />Open Sea</span>
            </div>
          </header>
          <div className="sightings" role="group" aria-label="Sightings">
            {sightings.map((s) => (
              <button
                key={s.kind}
                type="button"
                className={`sighting${s.kind === pickedKind ? ' is-on' : ''}`}
                aria-pressed={s.kind === pickedKind}
                onClick={() => setPickedKind(s.kind === pickedKind ? null : s.kind)}
                aria-label={`${s.name}, ${s.how}, ${seen(s)}`}
              >
                <Creature kind={s.kind as CreatureKind} look={s.got ? 'color' : 'locked'} size={1.3} />
                <span className="sighting__counts" aria-hidden="true"><i>{s.easy}</i><i>{s.hard}</i></span>
              </button>
            ))}
          </div>
          {/* Always in place, so the page doesn't jump when you tap a creature. With nothing picked it holds
              the space with an invisible copy of the first creature's note. */}
          {(() => {
            const shown = pickedCreature ?? sightings[0];
            return (
              <div
                className={`creature-note${pickedCreature ? '' : ' creature-note--empty'}`}
                aria-live="polite"
                aria-hidden={pickedCreature ? undefined : true}
              >
                <Creature kind={shown.kind as CreatureKind} look={shown.got ? 'color' : 'locked'} size={1.2} />
                <div>
                  <strong>{shown.name}</strong>
                  <p>{shown.how} · {seen(shown)}</p>
                </div>
              </div>
            );
          })()}

          <header id="fleet-boats" className="fleet__section-head">
            <h2>Streak fleet</h2>
            <p>Every boat comes in a Bay look and an Open Sea look. Each one needs wins in that game and a streak.</p>
            <p className="fleet__counts"><span>Days at sea: <b>{streak}</b></span><span>Bay wins: <b>{wins.bay}</b></span><span>Open Sea wins: <b>{wins.sea}</b></span></p>
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
                  aria-label={`${d.name}, ${d.how}, ${d.got ? 'earned' : 'not yet earned'}${unlocked(badge.kind) > 1 ? ', double tap to change its look' : ''}`}
                >
                  <Boat kind={badge.kind as BadgeKind} look={lookOf(badge.kind)} size={1.4} />
                </button>
              );
            })}
          </div>

          {(
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
              {unlocked(current.kind) > 1 && <p className="fleet__tip">Tap an earned look below (or double tap the boat in the harbor) to choose which one sails in your harbor.</p>}
              {colorways.length > 0 && (
                <div className={`fleet__years${current.days !== null ? ' fleet__years--four' : ''}`}>
                  {colorways.map((c) => (
                    <button key={c.look} type="button" disabled={!c.earned}
                      className={`${c.look === lookOf(current.kind) && c.earned ? 'is-on' : ''}${c.earned ? '' : ' is-waiting'}`}
                      aria-pressed={c.look === lookOf(current.kind)} onClick={() => chooseLook(current.kind, c.look)}>
                      <Boat kind={current.kind as BadgeKind} look={c.earned ? c.look : 'locked'} /><span>{c.label}</span>
                      {c.need && <small>{c.need}</small>}
                    </button>
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
            <p>{albatross
              ? `Every ship right, every spot wrong. Sighted ${albatrossCount === 1 ? 'once' : `${albatrossCount} times`}, first on ${formatDate(albatross, false)}.`
              : 'Sighted when a guess has every ship right, but every one in the wrong spot.'}</p>
          </div>
        </div>
      )}
      {/* The nautilus: the Bay and the Open Sea won with the same score on the same day. */}
      {!showAll && (
        <div className={`trophy-card nautilus-card${nautilus ? ' is-lit' : ''}`}>
          <span className={nautilus ? undefined : 'is-locked'}><Creature kind="nautilus" size={1.1} /></span>
          <div>
            <strong>Nautilus</strong>
            <p>{nautilus
              ? `The same score in the Bay and the Open Sea on one day. Sighted ${nautilusCount === 1 ? 'once' : `${nautilusCount} times`}, first on ${formatDate(nautilus, false)}.`
              : 'Sighted when you win the Bay and the Open Sea with the same score on the same day.'}</p>
          </div>
        </div>
      )}
      {/* The crab: the Bay took more guesses than the Open Sea on one day. */}
      {!showAll && (
        <div className={`trophy-card nautilus-card${crab.first ? ' is-lit' : ''}`}>
          <span className={crab.first ? undefined : 'is-locked'}><Creature kind="crab" size={1.1} /></span>
          <div>
            <strong>Crab</strong>
            <p>{crab.first
              ? `The Bay took more guesses than the Open Sea. Sighted ${crab.count === 1 ? 'once' : `${crab.count} times`}, first on ${formatDate(crab.first, false)}.`
              : 'Sighted when the Bay takes you more guesses than the Open Sea on the same day, and you win both.'}</p>
          </div>
        </div>
      )}
      {/* The hermit crab: a win after Keep trying. */}
      {!showAll && (
        <div className={`trophy-card nautilus-card${hermit.first ? ' is-lit' : ''}`}>
          <span className={hermit.first ? undefined : 'is-locked'}><Creature kind="hermit" size={1.1} /></span>
          <div>
            <strong>Hermit crab</strong>
            <p>{hermit.first
              ? `You kept trying and won. Sighted ${hermit.count === 1 ? 'once' : `${hermit.count} times`}, first on ${formatDate(hermit.first, false)}.`
              : 'Sighted when you lose a daily game, tap Keep trying, and win.'}</p>
          </div>
        </div>
      )}
      {/* The rest of the special sightings, each greyed out with how to find it until it's sighted. */}
      {!showAll && extras && EXTRA_CARDS.map((c) => {
        const got = extras[c.kind];
        return (
          <div key={c.kind} className={`trophy-card nautilus-card${got.first ? ' is-lit' : ''}`}>
            <span className={got.first ? undefined : 'is-locked'}><Creature kind={c.kind} size={1.1} /></span>
            <div>
              <strong>{CREATURE_NAMES[c.kind]}</strong>
              <p>{got.first
                ? `${c.got} ${c.once ? `Sighted ${formatDate(got.first, false)}.` : `Sighted ${got.count === 1 ? 'once' : `${got.count} times`}, first on ${formatDate(got.first, false)}.`}`
                : c.todo}</p>
            </div>
          </div>
        );
      })}
      {/* The compass: found by reading How to build your fleet. */}
      {!showAll && (
        <div className={`trophy-card compass-card${compass ? ' is-lit' : ''}`}>
          <Compass size={1.2} locked={!compass} />
          <div>
            <strong>Compass</strong>
            <p>{compass ? `For finding your bearings. Found ${formatDate(compass, false)}.` : 'Hidden somewhere for curious captains.'}</p>
          </div>
        </div>
      )}
      {/* Spyglasses: gold box while golden (free) ones are left, grey once they're used up. The drawing stays in color. */}
      {!showAll && (
        <div className={`trophy-card spyglass-card${golden > 0 ? ' is-lit' : ''}`}>
          <Spyglass size={1.3} />
          <div>
            <strong>{golden > 0 ? `Golden Spyglass · ${golden} left` : 'Spyglass'}</strong>
            <p>
              {golden > 0
                ? `Free to use on the Open Sea: spots a ship in the right place and adds nothing to your score. You earn ${GOLDEN_PER_BOAT} with every new boat.`
                : `No golden ones left, so each Spyglass adds ${SPYGLASS_COST} to your score. You earn ${GOLDEN_PER_BOAT} golden ones with every new boat.`}
            </p>
          </div>
        </div>
      )}
      {!showAll && !trophy && trophyCard}
    </main>
  );
}
