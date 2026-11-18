// The spyglass: a brass telescope with a leather barrel. Always drawn in full color;
// the box around it shows whether it's a golden (free) one.
//   <Spyglass size={1.2} />
export function Spyglass({ size = 1, label }: { size?: number; label?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      width={40 * size}
      height={40 * size}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <g transform="rotate(-24 20 20)">
        <rect x="3" y="18" width="6" height="4" rx="1" fill="#3E4A47" />
        <rect x="8" y="17.2" width="8" height="5.6" fill="#D9A441" />
        <rect x="8" y="17.2" width="8" height="1.4" fill="#F1D48A" />
        <rect x="15.5" y="16.2" width="7" height="7.6" fill="#C48F2E" />
        <rect x="15.5" y="16.2" width="7" height="1.8" fill="#E6BE63" />
        <path d="M22 15 L33 13.6 L33 26.4 L22 25 Z" fill="#8A5A3C" />
        <path d="M22 15 L33 13.6 L33 16 L22 17 Z" fill="#A87252" />
        <line x1="23.5" y1="21.6" x2="31.5" y2="22.4" stroke="#E3B98F" strokeWidth="0.5" strokeDasharray="1 0.9" strokeLinecap="round" />
        <rect x="14.6" y="15.8" width="1.6" height="8.4" rx="0.4" fill="#F1D48A" />
        <rect x="21.4" y="14.6" width="1.8" height="10.8" rx="0.4" fill="#D9A441" />
        <rect x="32.4" y="12.6" width="3.4" height="14.8" rx="0.8" fill="#D9A441" />
        <rect x="32.4" y="12.6" width="3.4" height="2.6" rx="0.8" fill="#F1D48A" />
        <ellipse cx="35.8" cy="20" rx="1" ry="6.2" fill="#9CC3CF" />
        <ellipse cx="35.9" cy="17.8" rx="0.35" ry="1.6" fill="#FBF8EF" />
      </g>
    </svg>
  );
}
