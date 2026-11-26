// The final award: a gold cup filled to the brim with harbor water, and the little paper boat
// from day one floating on top. Earned once every streak boat is in all four looks (Bay, Open Sea, gold, jewels).
//   <Trophy size={1.5} />            full color
//   <Trophy size={1.5} locked />     grey outline, not earned yet
import type { CSSProperties } from 'react';

export function Trophy({ size = 1, locked = false }: { size?: number; locked?: boolean }) {
  const style: CSSProperties = locked ? { filter: 'grayscale(1)', opacity: 0.4 } : {};
  return (
    <svg viewBox="0 0 80 84" width={80 * size} height={84 * size} style={style} role="img" aria-label={locked ? 'Fleet Admiral cup, not earned yet' : 'Fleet Admiral cup'}>
      {/* handles */}
      <path d="M17 33 C5 33 5 51 21 52" fill="none" stroke="#B8862E" strokeWidth="4" strokeLinecap="round" />
      <path d="M63 33 C75 33 75 51 59 52" fill="none" stroke="#B8862E" strokeWidth="4" strokeLinecap="round" />
      {/* cup */}
      <path d="M15 30 H65 C65 50 56 62 40 63 C24 62 15 50 15 30 Z" fill="#E2B04A" />
      <path d="M15 30 H65 C65 33 64.6 35.5 64 38 H16 C15.4 35.5 15 33 15 30 Z" fill="#C99A35" />
      <path d="M22 41 C23 51 29 57 36 59" fill="none" stroke="#F4D488" strokeWidth="2.5" strokeLinecap="round" />
      {/* water at the brim */}
      <ellipse cx="40" cy="30" rx="25" ry="5" fill="#B8862E" />
      <ellipse cx="40" cy="30" rx="22.5" ry="3.6" fill="#8FB8C2" />
      <path d="M20 30.5 Q24 28.8 28 30.5 T36 30.5 T44 30.5 T52 30.5 T60 30.5" fill="none" stroke="#C9E0E4" strokeWidth="1.1" />
      {/* the paper boat, afloat */}
      <g transform="translate(25 6) scale(0.78)">
        <path d="M20 5 L28 20 H12 Z" fill="#FBF8EF" stroke="#3E4A47" strokeWidth="1" strokeLinejoin="round" />
        <line x1="20" y1="5" x2="20" y2="20" stroke="#3E4A47" strokeWidth="1" strokeLinecap="round" />
        <path d="M4 20 H36 L30 28 H10 Z" fill="#F1E6CC" stroke="#3E4A47" strokeWidth="1" strokeLinejoin="round" />
      </g>
      {/* stem and foot */}
      <path d="M36 62 H44 L45 70 H35 Z" fill="#C99A35" />
      <rect x="25" y="70" width="30" height="5" rx="1.5" fill="#E2B04A" />
      <rect x="21" y="75" width="38" height="7" rx="2" fill="#3E4A47" />
      <rect x="32" y="77.2" width="16" height="2.6" rx="1" fill="#E2B04A" />
    </svg>
  );
}
