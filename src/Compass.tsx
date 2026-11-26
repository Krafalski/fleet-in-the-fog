// The compass: a brass pocket compass with a red north needle. Earned by reading "How to build your fleet".
// Drawn in full color, or greyed out (locked) until it's found.
//   <Compass size={1.2} />
export function Compass({ size = 1, locked = false, label }: { size?: number; locked?: boolean; label?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      width={40 * size}
      height={40 * size}
      style={locked ? { filter: 'grayscale(1)', opacity: 0.35 } : undefined}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {/* the ring on top */}
      <circle cx="20" cy="5.2" r="2.6" fill="none" stroke="#C48F2E" strokeWidth="1.4" />
      <rect x="18.2" y="6.6" width="3.6" height="3" rx="0.8" fill="#D9A441" />
      {/* brass case and its shine */}
      <circle cx="20" cy="22" r="14" fill="#C48F2E" />
      <circle cx="20" cy="22" r="14" fill="none" stroke="#8A5A1C" strokeWidth="0.8" />
      <path d="M8.5 16 A13 13 0 0 1 26 9.4" fill="none" stroke="#F1D48A" strokeWidth="1.6" strokeLinecap="round" />
      {/* the face */}
      <circle cx="20" cy="22" r="11" fill="#FBF6E6" />
      <circle cx="20" cy="22" r="11" fill="none" stroke="#E3B98F" strokeWidth="0.6" />
      {/* ticks at north, east, south, west */}
      <line x1="20" y1="12" x2="20" y2="14.2" stroke="#3E4A47" strokeWidth="0.9" strokeLinecap="round" />
      <line x1="30" y1="22" x2="27.8" y2="22" stroke="#3E4A47" strokeWidth="0.9" strokeLinecap="round" />
      <line x1="20" y1="32" x2="20" y2="29.8" stroke="#3E4A47" strokeWidth="0.9" strokeLinecap="round" />
      <line x1="10" y1="22" x2="12.2" y2="22" stroke="#3E4A47" strokeWidth="0.9" strokeLinecap="round" />
      {/* small rose behind the needle */}
      <path d="M20 17 L21.4 22 L20 27 L18.6 22 Z M15 22 L20 20.6 L25 22 L20 23.4 Z" fill="#E3D3AE" />
      {/* the needle: red to the north, slate to the south, tipped a little */}
      <g transform="rotate(18 20 22)">
        <path d="M20 13.6 L22.2 22 L17.8 22 Z" fill="#C84B3A" />
        <path d="M20 30.4 L22.2 22 L17.8 22 Z" fill="#3E4A47" />
      </g>
      <circle cx="20" cy="22" r="1.4" fill="#D9A441" stroke="#8A5A1C" strokeWidth="0.4" />
    </svg>
  );
}
