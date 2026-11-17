// The rescue dolphin and the player's streak repairs. Used in two places:
// on the end-of-day panel (only when a streak can be mended) and at the bottom of the fleet screen (always).
// There is no "no thanks" button: to skip a repair, the player just leaves it alone. The offer stays.
import { Creature } from '../Creature';
import type { RepairOffer } from '../api';
import type { RepairStock } from '../game/repairs';

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;
const count = (stock: RepairStock) => stock.ones + stock.threes; // each repair is one rescue dolphin

// "2 one-day, 1 three-day", or "none yet".
export function stockText(stock: RepairStock): string {
  const parts = [];
  if (stock.ones > 0) parts.push(`${stock.ones} one-day`);
  if (stock.threes > 0) parts.push(`${stock.threes} three-day`);
  return parts.length ? parts.join(', ') : 'none yet';
}

type Props = {
  repairs: RepairStock;
  offer: RepairOffer | null;
  nextRepairIn?: number;   // days of play until the next repair; shown on the fleet screen
  wide?: boolean;          // fleet screen layout: dolphin on the left, text beside it
  onUse: () => void;
};

export function RepairCard({ repairs, offer, nextRepairIn, wide = false, onUse }: Props) {
  return (
    <div className={`repair${wide ? ' repair--wide' : ''}${offer ? ' is-lit' : ''}`}>
      <Creature kind="medic" size={wide ? 1.6 : 1.4} label="Rescue dolphin" />
      <div className="repair__text">
        <strong>{offer ? 'Use streak repair?' : 'Streak repairs'}</strong>
        {offer ? (
          <p>
            You missed {plural(offer.missedDays, 'day')}. Repair will use {count(offer.cost)} of {plural(count(repairs), 'rescue dolphin')}.
          </p>
        ) : (
          <p>You have: {stockText(repairs)}</p>
        )}
        {nextRepairIn !== undefined && <p>Next one in {plural(nextRepairIn, 'day')} of play</p>}
        {offer && <button type="button" className="primary-btn primary-btn--small" onClick={onUse}>Repair streak</button>}
      </div>
    </div>
  );
}
