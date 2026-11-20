// The player's note flags: a small white flag on a pole, with the same idea as the anchors.
//   exact = ● filled (sure it's right here)   near = ○ hollow (in the fleet, somewhere else)   no = red ✕ (not in the fleet)
// Drawn in ink and paper, so the only color is the red ✕.
import type { NoteFlag as Flag } from '../game/reducer';

export const NOTE_LABEL: Record<Flag, string> = {
  exact: 'flagged: right spot',
  near: 'flagged: in the fleet, wrong spot',
  no: 'flagged: not in the fleet',
};

export function NoteFlag({ kind, size = 1 }: { kind: Flag; size?: number }) {
  return (
    <svg viewBox="0 0 28 32" width={20 * size} height={22.9 * size} aria-hidden="true" className="note-flag__svg">
      <line x1="3" y1="2" x2="3" y2="31" stroke="var(--ink)" strokeWidth="2" strokeLinecap="round" />
      <path d="M4 3 H26 V21 H4 Z" fill="var(--paper)" stroke="var(--ink)" strokeWidth="1.6" strokeLinejoin="round" />
      {kind === 'exact' && <circle cx="15" cy="12" r="5.5" fill="var(--ink)" />}
      {kind === 'near' && <circle cx="15" cy="12" r="5" fill="none" stroke="var(--ink)" strokeWidth="2" />}
      {kind === 'no' && <path d="M10 7 L20 17 M20 7 L10 17" stroke="#C0392B" strokeWidth="2.6" strokeLinecap="round" />}
    </svg>
  );
}
