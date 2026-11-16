// The hidden fleet at the top. Clouds drift over it while playing; when the game ends
// they part and fade, and the answer fades in underneath.
import { Boat, SHIP_KINDS, SHIP_NAMES } from '../Boat';
import { MODES } from '../game/game';
import type { GameState } from '../game/reducer';

export function FogCard({ state, boatSize }: { state: GameState; boatSize: number }) {
  const { slots } = MODES[state.mode];
  const over = state.status !== 'playing';
  const ruledOutNames = state.ruledOut.slice(0, state.ruledOut.length - state.hintsUsed).map((s) => SHIP_NAMES[SHIP_KINDS[s]]);

  let label = `${slots} ships came in before dawn`;
  if (ruledOutNames.length) label += `. No ${ruledOutNames.join(' or ').toLowerCase()} today.`;
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
                {ship !== null ? <Boat kind={SHIP_KINDS[ship]} size={boatSize} /> : <span className="fog-spot__q">?</span>}
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
