// The hidden fleet at the top. Clouds drift over it while playing; when the game ends
// they part and fade, and the answer fades in underneath.
import { useEffect, useState } from 'react';
import { Boat, SHIP_KINDS, SHIP_NAMES } from '../Boat';
import { MODES, SHIP_COUNT } from '../game/game';
import type { Ship } from '../game/game';
import type { GameState } from '../game/reducer';

// How often one of the shapes in the fog changes.
const SHAPE_CHANGE_MS = 3200;

// The fog card is kept small so the board gets the room: its ships are drawn at this fraction of board size.
const FOG_SCALE = 0.72;

export function FogCard({ state, boatSize }: { state: GameState; boatSize: number }) {
  const { slots, ships } = MODES[state.mode];
  const randomShip = (): Ship => Math.floor(Math.random() * Math.min(ships, SHIP_COUNT));
  const over = state.status !== 'playing';

  // While the fleet is hidden, each spot shows a faint ship shape. They are picked at random
  // and have nothing to do with the answer; every so often one of them changes.
  const [shapes, setShapes] = useState<Ship[]>(() => Array.from({ length: slots }, randomShip));
  useEffect(() => {
    if (over) return;
    const timer = window.setInterval(() => {
      setShapes((old) => {
        const next = [...old];
        next[Math.floor(Math.random() * next.length)] = randomShip();
        return next;
      });
    }, SHAPE_CHANGE_MS);
    return () => window.clearInterval(timer);
  }, [over]);

  let label = `${slots} ships came in before dawn`;
  if (state.status === 'won') label = 'The fog lifts. Here is the fleet.';
  if (state.status === 'lost') label = 'The fog lifts. This was the fleet.';

  return (
    <div className={`fog-card${over ? ' fog-card--lifting' : ''}`}>
      <div className={over ? 'fog-reveal' : undefined}>
        <p className="fog-card__label">{label}</p>
        <div className="fog-card__row">
          {Array.from({ length: slots }, (_, i) => {
            const ship = state.answer ? state.answer[i] : null;
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
      <div className={`cloud cloud--left${over ? ' lifting' : ''}`} aria-hidden="true" />
      <div className={`cloud cloud--right${over ? ' lifting' : ''}`} aria-hidden="true" />
    </div>
  );
}
