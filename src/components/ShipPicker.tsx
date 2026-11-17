// The ships to choose from (5 in Easy, 6 in Hard and Practice). Tap one and it drops into the row. Names stay under each ship. Ruled-out ships are greyed and crossed out.
import { Boat, SHIP_KINDS, SHIP_NAMES } from '../Boat';
import type { Ship } from '../game/game';

type Props = { ships: number; ruledOut: Ship[]; disabled: boolean; onPick: (ship: Ship) => void };

export function ShipPicker({ ships, ruledOut, disabled, onPick }: Props) {
  return (
    <div className={`picker picker--${ships}`}>
      {SHIP_KINDS.slice(0, ships).map((kind, ship) => {
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
