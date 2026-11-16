// Fleet in the Fog: line icons. They take the text color (currentColor).
//   <Icon name="book" />
//   <Icon name="lighthouse" size={28} label="Your fleet" />
// Inside a button that already has an aria-label, leave `label` off.
import type { ReactElement } from 'react';

export type IconName = 'book' | 'lighthouse' | 'brush' | 'info' | 'close' | 'arrow-left' | 'arrow-right' | 'lantern' | 'replay' | 'eye' | 'comment' | 'anchor' | 'life-ring' | 'check' | 'lock' | 'star';

const PATHS: Record<IconName, ReactElement> = {
  'book': (
    <><path d="M5 18 V5 A2 2 0 0 1 7 3 H19 V17 H7 A2 2 0 0 0 5 19 A2 2 0 0 0 7 21 H19 V17" /><line x1="9" y1="7.5" x2="15" y2="7.5" /><line x1="9" y1="10.5" x2="13" y2="10.5" /></>
  ),
  'lighthouse': (
    <><path d="M8.5 6 L12 3 L15.5 6" /><rect x="9.5" y="6" width="5" height="3.5" /><path d="M9.8 9.5 L8.8 20 H15.2 L14.2 9.5" /><line x1="9.3" y1="14.5" x2="14.7" y2="14.5" /><line x1="6" y1="20.5" x2="18" y2="20.5" /><line x1="5" y1="6.5" x2="7" y2="7.2" /><line x1="19" y1="6.5" x2="17" y2="7.2" /></>
  ),
  'brush': (
    <><line x1="20" y1="4" x2="12.2" y2="11.8" /><path d="M10.8 10.6 L13.4 13.2 Q13.6 18.6 7.4 19.6 Q5 20 4 19.6 Q6.2 18 6.2 15.4 Q6.4 11.2 10.8 10.6 Z" /></>
  ),
  'info': (
    <><circle cx="12" cy="12" r="9" /><line x1="12" y1="11" x2="12" y2="16.5" /><circle cx="12" cy="7.7" r="0.6" fill="currentColor" /></>
  ),
  'close': (
    <><line x1="6" y1="6" x2="18" y2="18" /><line x1="18" y1="6" x2="6" y2="18" /></>
  ),
  'arrow-left': (
    <><path d="M15 5 L8 12 L15 19" /></>
  ),
  'arrow-right': (
    <><path d="M9 5 L16 12 L9 19" /></>
  ),
  'lantern': (
    <><path d="M9.5 5 Q12 1.8 14.5 5" /><rect x="8.5" y="5" width="7" height="2" /><path d="M9 7 L7.6 17 H16.4 L15 7" /><rect x="7" y="17" width="10" height="3" rx="0.8" /><path d="M12 9.8 Q14.2 12.4 12 14.6 Q9.8 12.4 12 9.8 Z" /></>
  ),
  'replay': (
    <><path d="M6.2 8.2 A7.2 7.2 0 1 1 4.8 12" /><path d="M5.6 3.8 V8.6 H10.4" /></>
  ),
  'eye': (
    <><path d="M2.5 12 Q12 4.5 21.5 12 Q12 19.5 2.5 12 Z" /><circle cx="12" cy="12" r="2.8" /></>
  ),
  'comment': (
    <><path d="M4.5 5 H19.5 V15.5 H11.5 L7.5 19.5 V15.5 H4.5 Z" /><line x1="8" y1="9" x2="16" y2="9" /><line x1="8" y1="12" x2="13.5" y2="12" /></>
  ),
  'anchor': (
    <><circle cx="12" cy="5.3" r="2" /><line x1="12" y1="7.3" x2="12" y2="20" /><line x1="8.5" y1="10.8" x2="15.5" y2="10.8" /><path d="M5 13.5 Q5.5 20 12 20 Q18.5 20 19 13.5" /></>
  ),
  'life-ring': (
    <><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="3.5" /><line x1="6" y1="6" x2="9.5" y2="9.5" /><line x1="18" y1="6" x2="14.5" y2="9.5" /><line x1="6" y1="18" x2="9.5" y2="14.5" /><line x1="18" y1="18" x2="14.5" y2="14.5" /></>
  ),
  'check': (
    <><path d="M5 12.5 L10 17.5 L19.5 7" /></>
  ),
  'lock': (
    <><rect x="6" y="11" width="12" height="9" rx="1.5" /><path d="M8.5 11 V8 A3.5 3.5 0 0 1 15.5 8 V11" /></>
  ),
  'star': (
    <><path d="M12 3.5 L14.6 9 L20.6 9.7 L16.2 13.8 L17.4 19.8 L12 16.8 L6.6 19.8 L7.8 13.8 L3.4 9.7 L9.4 9 Z" /></>
  ),
};

export function Icon({ name, size = 24, label }: { name: IconName; size?: number; label?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {PATHS[name]}
    </svg>
  );
}
