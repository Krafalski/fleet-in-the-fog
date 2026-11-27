// The hidden fleet at the top. Clouds drift over it while playing; when the game ends
// they part and fade, and the answer fades in underneath.
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Boat, SHIP_KINDS, SHIP_NAMES } from '../Boat';
import { MODES, SHIP_COUNT } from '../game/game';
import type { Ship } from '../game/game';
import type { GameState } from '../game/reducer';

// How often one of the shapes in the fog changes.
const SHAPE_CHANGE_MS = 3200;

// The fog card is kept small so the board gets the room: its ships are drawn at this fraction of board size.
const FOG_SCALE = 0.72;

// How long a sighting takes to drift back into the fog.
const SIGHTING_OUT_MS = 700;

// sighting: a note (the albatross, a lobster) that comes in out of the fog and takes the card over for a moment,
// then drifts back into the fog and the hidden ships return. The card keeps its size, so nothing else moves.
export function FogCard({ state, boatSize, sighting = null, onSightingTap }: { state: GameState; boatSize: number; sighting?: ReactNode; onSightingTap?: () => void }) {
  const [shownSighting, setShownSighting] = useState<ReactNode>(sighting);
  const [leaving, setLeaving] = useState(false);
  useEffect(() => {
    if (sighting) { setShownSighting(sighting); setLeaving(false); return; }
    if (!shownSighting) return;
    setLeaving(true);
    const t = window.setTimeout(() => { setShownSighting(null); setLeaving(false); }, SIGHTING_OUT_MS);
    return () => window.clearTimeout(t);
  }, [sighting]); // eslint-disable-line react-hooks/exhaustive-deps
  const { slots, ships } = MODES[state.mode];
  const randomShip = (): Ship => Math.floor(Math.random() * Math.min(ships, SHIP_COUNT));
  const over = state.status !== 'playing';
  // A daily loss keeps the fleet hidden until the player taps Reveal the fleet (they may want to keep trying).
  const hidden = state.status === 'lost' && !state.revealed;
  const answer = hidden ? null : state.answer;
  const lifting = over && !hidden;


  // While the fleet is hidden, each spot shows a faint ship shape. They are picked at random
  // and have nothing to do with the answer; every so often one of them changes.
  const [shapes, setShapes] = useState<Ship[]>(() => Array.from({ length: slots }, randomShip));
  useEffect(() => {
    if (lifting) return;
    const timer = window.setInterval(() => {
      setShapes((old) => {
        const next = [...old];
        next[Math.floor(Math.random() * next.length)] = randomShip();
        return next;
      });
    }, SHAPE_CHANGE_MS);
    return () => window.clearInterval(timer);
  }, [lifting]);

  let label = `${slots} ships are hiding in the fog`;
  if (state.status === 'won') label = 'The fog lifts. Here is the fleet.';
  if (state.status === 'lost') label = hidden ? 'The fleet is still out there in the fog' : 'The fog lifts. This was the fleet.';

  return (
    <div className={`fog-card${lifting ? ' fog-card--lifting' : ''}${shownSighting ? ' fog-card--sighting' : ''}${leaving ? ' is-leaving' : ''}`}>
      <div className={`fog-card__fleet${lifting ? ' fog-reveal' : ''}`}>
        <p className="fog-card__label">{label}</p>
        <div className="fog-card__row">
          {Array.from({ length: slots }, (_, i) => {
            const ship = answer ? answer[i] : null;
            return (
              <div
                key={i}
                className={`fog-spot${ship !== null ? ' fog-spot--shown' : ''}`}
                role="img"
                aria-label={ship !== null ? `Spot ${i + 1}, ${SHIP_NAMES[SHIP_KINDS[ship]]}` : `Spot ${i + 1}, hidden in fog`}
              >
                {ship !== null
                  ? <Boat kind={SHIP_KINDS[ship]} size={boatSize * FOG_SCALE} />
                  : <span key={shapes[i]} className="fog-spot__shape"><Boat kind={SHIP_KINDS[shapes[i]]} size={boatSize * FOG_SCALE} /></span>}
              </div>
            );
          })}
        </div>
      </div>
      {shownSighting && (
        <div className="fog-sighting" role="status" onClick={onSightingTap} title="Tap to close">{shownSighting}</div>
      )}
      <div className={`cloud cloud--left${lifting ? ' lifting' : ''}`} aria-hidden="true" />
      <div className={`cloud cloud--right${lifting ? ' lifting' : ''}`} aria-hidden="true" />
    </div>
  );
}
