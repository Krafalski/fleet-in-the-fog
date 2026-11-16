// The six ships to choose from. Names stay under each ship. Ruled-out ships are greyed and crossed out.
import { Boat, SHIP_KINDS, SHIP_NAMES } from '../Boat';
import type { Ship } from '../game/game';

type Props = { selected: Ship | null; ruledOut: Ship[]; disabled: boolean; onPick: (ship: Ship) => void };

export function ShipPicker({ selected, ruledOut, disabled, onPick }: Props) {
  return (
    <div className="picker">
      {SHIP_KINDS.map((kind, ship) => {
        const out = ruledOut.includes(ship);
        const on = selected === ship && !out;
        return (
          <button
            key={kind}
            type="button"
            className={`picker__btn${on ? ' picker__btn--on' : ''}${out ? ' picker__btn--out' : ''}`}
            onClick={() => onPick(ship)}
            disabled={disabled || out}
            aria-pressed={on}
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
