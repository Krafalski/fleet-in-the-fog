// One spot in a row of water. The water itself is drawn once per row, in Board.tsx.
import type { CSSProperties } from 'react';
import { Boat, SHIP_KINDS, SHIP_NAMES } from '../Boat';
import type { Ship } from '../game/game';

type Props = {
  ship: Ship | null;
  index: number;       // position in the row; staggers the bobbing so ships do not move in step
  boatSize: number;
  label: string;       // read by screen readers, e.g. "Row 2, spot 3"
  next?: boolean;      // the next ship picked lands here
  onTap?: () => void;  // only the current row is tappable
};

export function WaveSlot({ ship, index, boatSize, label, next = false, onTap }: Props) {
  const shipName = ship === null ? 'empty' : SHIP_NAMES[SHIP_KINDS[ship]];
  const fullLabel = `${label}, ${shipName}${next ? ', next ship goes here' : ''}`;
  const className = `slot${next ? ' slot--next' : ''}`;
  const style = { '--i': index } as CSSProperties;

  // `key` makes React treat a different ship as a new element, so it sails in again.
  const inside = ship !== null && (
    <span key={ship} className="slot__boat">
      <span className="slot__bob" style={style}>
        <Boat kind={SHIP_KINDS[ship]} size={boatSize} />
      </span>
    </span>
  );

  return onTap ? (
    <button type="button" className={className} onClick={onTap} aria-label={fullLabel}>{inside}</button>
  ) : (
    <div className={className} role="img" aria-label={fullLabel}>{inside}</div>
  );
}
