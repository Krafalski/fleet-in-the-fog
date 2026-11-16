// Title in the middle, icon buttons either side. The log book opens past puzzles, the lighthouse opens the fleet.
import type { ReactNode } from 'react';

type Props = { subtitle: string; onOpenLog: () => void; onOpenFleet: () => void };

export function TopBar({ subtitle, onOpenLog, onOpenFleet }: Props) {
  return (
    <header className="topbar">
      <div className="topbar__side">
        <IconButton label="Harbor log: past puzzles" onClick={onOpenLog}>
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
        <IconButton label="Lighthouse: your fleet" onClick={onOpenFleet}>
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

export function IconButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" className="icon-btn" onClick={onClick} aria-label={label}>
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
