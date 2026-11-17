// The six ships to choose from. Tap one and it drops into the row. Names stay under each ship. Ruled-out ships are greyed and crossed out.
import { Boat, SHIP_KINDS, SHIP_NAMES } from '../Boat';
import type { Ship } from '../game/game';

type Props = { ruledOut: Ship[]; disabled: boolean; onPick: (ship: Ship) => void };

export function ShipPicker({ ruledOut, disabled, onPick }: Props) {
  return (
    <div className="picker">
      {SHIP_KINDS.map((kind, ship) => {
        const out = ruledOut.includes(ship);
        return (
          <button
            key={kind}
            type="button"
            className={`picker__btn${out ? ' picker__btn--out' : ''}`}
            onClick={() => onPick(ship)}
            disabled={disabled || out}
            aria-label={`${SHIP_NAMES[kind]}${out ? ', ruled out' : ''}`}
          >
            <Boat kind={kind} look={out ? 'locked' : 'color'} />
            <span className="picker__name">{SHIP_NAMES[kind]}</span>
          </button>
        );
      })}
    </div>
  );
}
