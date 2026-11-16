// Your fleet: the badge boats. Harbor view shows them scattered, each in its own fixed spot;
// Show all lists them in earning order. Boats not yet earned are greyed out.
import { useEffect, useState } from 'react';
import { Boat } from '../Boat';
import type { BadgeKind } from '../Boat';
import { api } from '../api';
import { CloseButton } from '../components/TopBar';
import { BADGES, MYSTERY_BADGE } from '../game/badges';
import type { Badge } from '../game/badges';
import { formatDate } from '../game/dates';

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
  const [picked, setPicked] = useState(BADGES[0].kind);

  useEffect(() => {
    let cancelled = false;
    api.loadProgress(today).then((progress) => {
      if (!cancelled) setEarned(progress.badges);
    });
    return () => { cancelled = true; };
  }, [today]);

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

  const count = BADGES.filter((b) => earned[b.kind]).length;
  const current = BADGES.find((b) => b.kind === picked) ?? BADGES[0];
  const detail = describe(current);

  return (
    <main className="screen fleet">
      <header className="screen-head">
        <div>
          <h1>Your fleet</h1>
          <p>{count} of {BADGES.length} boats in harbor</p>
        </div>
        <CloseButton label="Close your fleet" onClick={onClose} />
      </header>

      <div className="segmented" role="group" aria-label="Fleet view">
        <button type="button" className={!showAll ? 'is-on' : undefined} aria-pressed={!showAll} onClick={() => setShowAll(false)}>Harbor</button>
        <button type="button" className={showAll ? 'is-on' : undefined} aria-pressed={showAll} onClick={() => setShowAll(true)}>Show all</button>
      </div>

      {showAll ? (
        <ul className="fleet__list">
          {BADGES.map((badge) => {
            const d = describe(badge);
            return (
              <li key={badge.kind} className="fleet__item">
                <div className="fleet__icon"><Boat kind={badge.kind as BadgeKind} look={d.got ? 'color' : 'locked'} size={1.3} /></div>
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
                  onClick={() => setPicked(badge.kind)}
                  aria-label={`${d.name}, ${d.how}, ${d.got ? 'earned' : 'not yet earned'}`}
                >
                  <Boat kind={badge.kind as BadgeKind} look={d.got ? 'color' : 'locked'} size={1.4} />
                </button>
              );
            })}
          </div>

          <section className="fleet__detail" aria-live="polite">
            <div className="fleet__detail-top">
              <div className="fleet__icon fleet__icon--big"><Boat kind={current.kind as BadgeKind} look={detail.got ? 'color' : 'locked'} size={1.7} /></div>
              <div>
                <div className="fleet__name">{detail.name}</div>
                <div className="fleet__how">{detail.how}</div>
                <p className="fleet__note">{detail.note}</p>
                <p className={`fleet__status${detail.got ? ' is-earned' : ''}`}>{detail.status}</p>
              </div>
            </div>
            <div className="fleet__years">
              <div><Boat kind={current.kind as BadgeKind} look="color" /><span>First year</span></div>
              <div><Boat kind={current.kind as BadgeKind} look="year2" /><span>Second year</span></div>
              <div><Boat kind={current.kind as BadgeKind} look="year3" /><span>Third year</span></div>
            </div>
          </section>
        </>
      )}
    </main>
  );
}
