// One spot on the board: a shallow dip of water that a ship floats in.
import { Boat, SHIP_KINDS, SHIP_NAMES } from '../Boat';
import type { Ship } from '../game/game';

export type WaveTone = 'current' | 'past' | 'empty';

type Props = {
  ship: Ship | null;
  tone: WaveTone;      // which row it is in; sets the water color
  boatSize: number;
  label: string;       // read by screen readers, e.g. "Row 2, spot 3"
  held?: boolean;      // the player has picked this ship up
  onTap?: () => void;  // only the current row is tappable
};

export function WaveSlot({ ship, tone, boatSize, label, held = false, onTap }: Props) {
  const shipName = ship === null ? 'empty' : SHIP_NAMES[SHIP_KINDS[ship]];
  const fullLabel = `${label}, ${shipName}${held ? ', picked up' : ''}`;
  const className = `slot slot--${tone}${held ? ' slot--held' : ''}`;

  const inside = (
    <>
      <svg className="slot__back" viewBox="0 0 52 44" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 31 Q 26 37 52 31 L52 44 L0 44 Z" />
      </svg>
      {ship !== null && (
        <span className="slot__boat">
          <Boat kind={SHIP_KINDS[ship]} size={boatSize} />
        </span>
      )}
      <svg className="slot__front" viewBox="0 0 52 8" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 4 Q 6.5 2.5 13 4 T 26 4 T 39 4 T 52 4 V8 H0 Z" />
      </svg>
    </>
  );

  return onTap ? (
    <button type="button" className={className} onClick={onTap} aria-label={fullLabel}>{inside}</button>
  ) : (
    <div className={className} role="img" aria-label={fullLabel}>{inside}</div>
  );
}
