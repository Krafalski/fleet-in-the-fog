// The guess rows: logged rows, the current row, and the empty rows still to come.
// Each row is one strip of water with the ships floating in it.
// Scrolls when there are more rows than fit, and keeps the current row in view.
import { useEffect, useRef } from 'react';
import type { CSSProperties } from 'react';
import { MODES } from '../game/game';
import type { Feedback, Spot } from '../game/game';
import type { GameState } from '../game/reducer';
import { WaveSlot } from './WaveSlot';

type Props = {
  state: GameState; boatSize: number; onTapSlot: (slot: number) => void;
  lastRow?: 'won' | 'lost' | 'playing'; // set for a moment when the game ends, to light up the final row
};

export function Board({ state, boatSize, onTapSlot, lastRow }: Props) {
  const { slots, maxGuesses } = MODES[state.mode];
  const currentRow = state.status === 'playing' ? state.guesses.length : -1;
  const newestRow = state.guesses.length - 1;
  const currentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    currentRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [currentRow]);

  // A logged row shows marks under each ship when the mode asks for it and the row was scored that way.
  const perSpotRow = (r: number) => state.perSpot && r < state.guesses.length && !!state.feedback[r]?.spots;

  const rows = [];
  for (let r = 0; r < maxGuesses; r++) {
    const isPast = r < state.guesses.length;
    const isCurrent = r === currentRow;
    const ships = isPast ? state.guesses[r] : isCurrent ? state.current : new Array(slots).fill(null);
    const tone = isCurrent ? 'current' : isPast ? 'past' : 'empty';
    // The spot the next ship will land in: the one the player chose, or the first empty one.
    const nextSpot = isCurrent ? state.cursor ?? state.current.indexOf(null) : -1;
    rows.push(
      <div key={r} ref={isCurrent ? currentRef : null} className={`row${isCurrent ? ' row--current' : ''}${lastRow && r === newestRow ? ` row--${lastRow === 'won' ? 'found' : 'missed'}` : ''}`}>
        <span className="row__num">{r + 1}</span>
        <div className="row__slots">
          <div className={`sea sea--${tone}`}>
            <Water slots={slots} layer="back" />
            {ships.map((ship, i) => (
              <WaveSlot
                key={i}
                ship={ship}
                index={i}
                boatSize={boatSize}
                label={`Row ${r + 1}, spot ${i + 1}`}
                next={i === nextSpot}
                onTap={isCurrent ? () => onTapSlot(i) : undefined}
              />
            ))}
            <Water slots={slots} layer="front" />
            {perSpotRow(r) && <SpotMarks spots={state.feedback[r].spots!} reveal={r === newestRow} />}
          </div>
        </div>
        {/* With marks under each ship, the end of the row stays empty (older saved rows without marks still show totals). */}
        {state.perSpot && !(isPast && !state.feedback[r]?.spots)
          ? <div className="pegs pegs--none" aria-hidden="true" />
          : <Pegs feedback={isPast ? state.feedback[r] : null} slots={slots} reveal={r === newestRow} />}
      </div>,
    );
  }
  return <div className="board">{rows}</div>;
}

// One layer of water running the whole width of a row. The back layer sits behind the ships,
// the front layer in front of them, so the ships look like they are in the water.
function Water({ slots, layer }: { slots: number; layer: 'back' | 'front' }) {
  const width = slots * 52;
  const height = layer === 'back' ? 44 : 8;
  const y = layer === 'back' ? 32 : 4;         // where the surface sits
  const step = layer === 'back' ? 26 : 13;     // half a wave
  const lift = layer === 'back' ? 2.5 : -1.5;  // how far the first half-wave bends
  let path = `M0 ${y} Q ${step / 2} ${y + lift} ${step} ${y}`;
  for (let x = step * 2; x <= width; x += step) path += ` T ${x} ${y}`; // T repeats the bend, flipped each time
  path += ` V${height} H0 Z`;
  return (
    <svg className={`sea__${layer}`} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-hidden="true">
      <path d={path} />
    </svg>
  );
}

// Marks under each ship, in the same order as the ships: black anchor = right ship, right spot.
// White anchor = right ship, wrong spot. Nothing = not in the fleet.
// They sit on the water, lined up with the spots, and drop in one at a time.
function SpotMarks({ spots, reveal }: { spots: Spot[]; reveal: boolean }) {
  const words = { exact: 'right spot', near: 'wrong spot', miss: 'no match' };
  return (
    <div className="spot-marks" role="img" aria-label={spots.map((s, i) => `spot ${i + 1} ${words[s]}`).join(', ')}>
      {spots.map((s, i) => (
        <span key={i} className="spot-marks__cell">
          {s !== 'miss' && (
            <span className={`spot-anchor${reveal ? ' spot-anchor--reveal' : ''}`} style={{ '--i': i } as CSSProperties}>
              <AnchorMark kind={s} />
            </span>
          )}
        </span>
      ))}
    </div>
  );
}

// The anchor from the icon set, drawn twice: a thick outline underneath so it reads on the water,
// then the anchor itself on top. exact = black anchor, near = white anchor.
export function AnchorMark({ kind, size = 16 }: { kind: 'exact' | 'near'; size?: number }) {
  const shape = (
    <><circle cx="12" cy="5.3" r="2" /><line x1="12" y1="7.3" x2="12" y2="20" /><line x1="8.5" y1="10.8" x2="15.5" y2="10.8" /><path d="M5 13.5 Q5.5 20 12 20 Q18.5 20 19 13.5" /></>
  );
  return (
    <svg className={`anchor-mark anchor-mark--${kind}`} viewBox="0 0 24 24" width={size} height={size} fill="none" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <g className="anchor-mark__edge" strokeWidth={5}>{shape}</g>
      <g className="anchor-mark__body" strokeWidth={2.4}>{shape}</g>
    </svg>
  );
}

// The anchor shape alone, small, for the totals grid (no outline; the white one gets a hairline edge in CSS).
export function MiniAnchor() {
  return (
    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="5.3" r="2" /><line x1="12" y1="7.3" x2="12" y2="20" /><line x1="8.5" y1="10.8" x2="15.5" y2="10.8" /><path d="M5 13.5 Q5.5 20 12 20 Q18.5 20 19 13.5" />
    </svg>
  );
}

// Feedback dots in a fixed grid: filled = right ship, right spot. Ring = right ship, wrong spot.
// On the newest row they light up one at a time.
function Pegs({ feedback, slots, reveal }: { feedback: Feedback | null; slots: number; reveal: boolean }) {
  const label = feedback ? `${feedback.exact} right spot, ${feedback.near} wrong spot` : 'No feedback yet';
  const pegs = [];
  for (let i = 0; i < slots; i++) {
    const kind = !feedback ? 'blank' : i < feedback.exact ? 'exact' : i < feedback.exact + feedback.near ? 'near' : 'miss';
    const style = { '--i': i } as CSSProperties; // read by the CSS to delay each dot a little more
    // Right ship, right spot = small black anchor. Right ship, wrong spot = small white anchor. Otherwise a tiny dot.
    pegs.push(kind === 'exact' || kind === 'near'
      ? <span key={i} className={`mini-anchor mini-anchor--${kind}${reveal ? ' peg--reveal' : ''}`} style={style}><MiniAnchor /></span>
      : <span key={i} className={`peg peg--${kind}`} style={style} />);
  }
  return <div className={`pegs${slots > 4 ? ' pegs--wide' : ''}`} role="img" aria-label={label}>{pegs}</div>;
}
