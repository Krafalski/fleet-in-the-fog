// Title in the middle, icon buttons either side. The log book opens past puzzles, the message in a bottle
// opens How to play, the lighthouse opens the fleet.
import type { ReactNode } from 'react';

type Props = { subtitle: string; onOpenLog: () => void; onOpenFleet: () => void; onOpenHelp?: () => void };

export function TopBar({ subtitle, onOpenLog, onOpenFleet, onOpenHelp }: Props) {
  return (
    <header className="topbar">
      <div className="topbar__side">
        <IconButton label="Harbor log: past puzzles" onClick={onOpenLog} motion="bob">
          <path d="M5 18 V5 A2 2 0 0 1 7 3 H19 V17 H7 A2 2 0 0 0 5 19 A2 2 0 0 0 7 21 H19 V17" />
          <line x1="9" y1="7.5" x2="15" y2="7.5" />
          <line x1="9" y1="10.5" x2="13" y2="10.5" />
        </IconButton>
      </div>
      <div className="topbar__title">
        <h1>Fleet in <em>the Fog</em></h1>
        <p>{subtitle}</p>
      </div>
      <div className="topbar__side topbar__side--right">
        {onOpenHelp && (
          <IconButton label="How to play" onClick={onOpenHelp} motion="bob">
            {/* a message in a bottle */}
            <rect x="10" y="2.5" width="4" height="2.5" rx="0.6" />
            <path d="M10.5 5 V8 C7.5 9 6.5 11 6.5 13.5 V19 A2 2 0 0 0 8.5 21 H15.5 A2 2 0 0 0 17.5 19 V13.5 C17.5 11 16.5 9 13.5 8 V5" />
            <rect x="9" y="12.5" width="6" height="5" rx="1" />
            <line x1="10.6" y1="14.4" x2="13.4" y2="14.4" />
            <line x1="10.6" y1="15.9" x2="12.6" y2="15.9" />
          </IconButton>
        )}
        <IconButton label="Lighthouse: your fleet" onClick={onOpenFleet} motion="beacon">
          <path d="M8.5 6 L12 3 L15.5 6" />
          <rect x="9.5" y="6" width="5" height="3.5" />
          <path d="M9.8 9.5 L8.8 20 H15.2 L14.2 9.5" />
          <line x1="9.3" y1="14.5" x2="14.7" y2="14.5" />
          <line x1="6" y1="20.5" x2="18" y2="20.5" />
        </IconButton>
      </div>
    </header>
  );
}

// motion: a small idle animation that says "you can tap me". bob = floats on a wave; beacon = a lighthouse glow.
export function IconButton({ label, onClick, children, motion }: { label: string; onClick: () => void; children: ReactNode; motion?: 'bob' | 'beacon' }) {
  return (
    <button type="button" className={`icon-btn${motion ? ` icon-btn--${motion}` : ''}`} onClick={onClick} aria-label={label}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {children}
      </svg>
    </button>
  );
}

export function CloseButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <IconButton label={label} onClick={onClick}>
      <line x1="6" y1="6" x2="18" y2="18" />
      <line x1="18" y1="6" x2="6" y2="18" />
    </IconButton>
  );
}
