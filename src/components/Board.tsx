// The guess rows: logged rows, the current row, and the empty rows still to come.
// Scrolls when there are more rows than fit, and keeps the current row in view.
import { useEffect, useRef } from 'react';
import { MODES } from '../game/game';
import type { Feedback } from '../game/game';
import type { GameState } from '../game/reducer';
import { WaveSlot } from './WaveSlot';

type Props = { state: GameState; boatSize: number; onTapSlot: (slot: number) => void };

export function Board({ state, boatSize, onTapSlot }: Props) {
  const { slots, maxGuesses } = MODES[state.mode];
  const currentRow = state.status === 'playing' ? state.guesses.length : -1;
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
    rows.push(
      <div key={r} ref={isCurrent ? currentRef : null} className={`row${isCurrent ? ' row--current' : ''}`}>
        <span className="row__num">{r + 1}</span>
        <div className="row__slots">
          {ships.map((ship, i) => (
            <WaveSlot
              key={i}
              ship={ship}
              tone={tone}
              boatSize={boatSize}
              label={`Row ${r + 1}, spot ${i + 1}`}
              held={isCurrent && state.held === i}
              onTap={isCurrent ? () => onTapSlot(i) : undefined}
            />
          ))}
        </div>
        <Pegs feedback={isPast ? state.feedback[r] : null} slots={slots} />
      </div>,
    );
  }
  return <div className="board">{rows}</div>;
}

// Feedback dots in a fixed grid: filled = right ship, right spot. Ring = right ship, wrong spot.
function Pegs({ feedback, slots }: { feedback: Feedback | null; slots: number }) {
  const label = feedback ? `${feedback.exact} right spot, ${feedback.near} wrong spot` : 'No feedback yet';
  const pegs = [];
  for (let i = 0; i < slots; i++) {
    const kind = !feedback ? 'blank' : i < feedback.exact ? 'exact' : i < feedback.exact + feedback.near ? 'near' : 'miss';
    pegs.push(<span key={i} className={`peg peg--${kind}`} />);
  }
  return <div className={`pegs${slots > 4 ? ' pegs--wide' : ''}`} role="img" aria-label={label}>{pegs}</div>;
}
