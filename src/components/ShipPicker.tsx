// The ships to choose from. Tap one and it drops into the row. Names stay under each ship.
// Greyed two ways:
//   ruled out by a Lookout: grey, crossed out, can't be picked (it really isn't in the fleet)
//   your own note (a ✕ flag, or a long press on the button): grey, no cross-out, still pickable
import { useRef } from 'react';
import { Boat, SHIP_KINDS, SHIP_NAMES } from '../Boat';
import type { Ship } from '../game/game';

type Props = {
  ships: number; ruledOut: Ship[]; disabled: boolean; onPick: (ship: Ship) => void;
  noted?: Ship[];                   // ships the player marked as out
  onToggleNoted?: (ship: Ship) => void; // long press: mark or unmark
  justOut?: Ship | null;            // just ruled out by the Lookout: plays a short highlight
};

const LONG_PRESS_MS = 500;

export function ShipPicker({ ships, ruledOut, disabled, onPick, noted = [], onToggleNoted, justOut = null }: Props) {
  const timer = useRef<number | null>(null);
  const longPressed = useRef(false);
  const start = (ship: Ship) => {
    if (!onToggleNoted || disabled) return;
    longPressed.current = false;
    timer.current = window.setTimeout(() => { longPressed.current = true; onToggleNoted(ship); }, LONG_PRESS_MS);
  };
  const cancel = () => { if (timer.current) window.clearTimeout(timer.current); timer.current = null; };
  return (
    <div className={`picker picker--${ships}`}>
      {SHIP_KINDS.slice(0, ships).map((kind, ship) => {
        const out = ruledOut.includes(ship);
        const mine = !out && noted.includes(ship);
        return (
          <button
            key={kind}
            type="button"
            className={`picker__btn${out ? ' picker__btn--out' : ''}${mine ? ' picker__btn--noted' : ''}${justOut === ship ? ' picker__btn--justout' : ''}`}
            onClick={() => { if (longPressed.current) { longPressed.current = false; return; } onPick(ship); }}
            onPointerDown={() => start(ship)}
            onPointerUp={cancel}
            onPointerLeave={cancel}
            onPointerCancel={cancel}
            onContextMenu={(e) => e.preventDefault()}
            disabled={disabled || out}
            aria-label={`${SHIP_NAMES[kind]}${out ? ', ruled out' : mine ? ', marked out by you' : ''}`}
          >
            <Boat kind={kind} look={out || mine ? 'locked' : 'color'} />
            {/* Two short lines so the names fit six across: the color, then the ship. */}
            <span className="picker__name">
              <b>{SHIP_NAMES[kind].split(' ')[0]}</b>
              <span>{SHIP_NAMES[kind].split(' ').slice(1).join(' ')}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
