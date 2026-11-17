// The guess rows: logged rows, the current row, and the empty rows still to come.
// Each row is one strip of water with the ships floating in it.
// Scrolls when there are more rows than fit, and keeps the current row in view.
import { useEffect, useRef } from 'react';
import type { CSSProperties } from 'react';
import { MODES } from '../game/game';
import type { Feedback } from '../game/game';
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
          </div>
        </div>
        <Pegs feedback={isPast ? state.feedback[r] : null} slots={slots} reveal={r === newestRow} />
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

// Feedback dots in a fixed grid: filled = right ship, right spot. Ring = right ship, wrong spot.
// On the newest row they light up one at a time.
function Pegs({ feedback, slots, reveal }: { feedback: Feedback | null; slots: number; reveal: boolean }) {
  const label = feedback ? `${feedback.exact} right spot, ${feedback.near} wrong spot` : 'No feedback yet';
  const pegs = [];
  for (let i = 0; i < slots; i++) {
    const kind = !feedback ? 'blank' : i < feedback.exact ? 'exact' : i < feedback.exact + feedback.near ? 'near' : 'miss';
    const style = { '--i': i } as CSSProperties; // read by the CSS to delay each dot a little more
    pegs.push(<span key={i} className={`peg peg--${kind}${reveal && feedback ? ' peg--reveal' : ''}`} style={style} />);
  }
  return <div className={`pegs${slots > 4 ? ' pegs--wide' : ''}`} role="img" aria-label={label}>{pegs}</div>;
}
