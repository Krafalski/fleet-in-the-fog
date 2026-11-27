// The compasses: pocket compasses with a red north needle. The gold one is found by reading "How to build your fleet",
// the silver one by reading "How to play". closed: the lid shut (the silver one tucked behind the gold in the fleet).
// Drawn in full color, or greyed out (locked) until it's found.
//   <Compass size={1.2} />  <Compass metal="silver" closed />
// How long a rules card has to stay open to find its compass (someone actually reading takes at least this long).
export const COMPASS_READ_MS = 10000;
// How long the "You found a compass!" note shows before it fades.
export const COMPASS_NOTE_MS = 4500;

const METALS = {
  gold: { ring: '#C48F2E', top: '#D9A441', case: '#C48F2E', edge: '#8A5A1C', shine: '#F1D48A', face: '#E3B98F' },
  silver: { ring: '#9AA5AD', top: '#B7C1C8', case: '#A3AEB6', edge: '#5F6B73', shine: '#E4EAEE', face: '#C9D1D6' },
};
export function Compass({ size = 1, locked = false, label, metal = 'gold', closed = false }: { size?: number; locked?: boolean; label?: string; metal?: 'gold' | 'silver'; closed?: boolean }) {
  const m = METALS[metal];
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
      <circle cx="20" cy="5.2" r="2.6" fill="none" stroke={m.ring} strokeWidth="1.4" />
      <rect x="18.2" y="6.6" width="3.6" height="3" rx="0.8" fill={m.top} />
      {/* brass case and its shine */}
      <circle cx="20" cy="22" r="14" fill={m.case} />
      <circle cx="20" cy="22" r="14" fill="none" stroke={m.edge} strokeWidth="0.8" />
      <path d="M8.5 16 A13 13 0 0 1 26 9.4" fill="none" stroke={m.shine} strokeWidth="1.6" strokeLinecap="round" />
      {closed ? (
        // the lid, shut: an engraved star on a plain disc
        <>
          <circle cx="20" cy="22" r="11" fill={m.top} />
          <circle cx="20" cy="22" r="11" fill="none" stroke={m.edge} strokeWidth="0.6" />
          <path d="M20 15 L21.6 20.4 L27 22 L21.6 23.6 L20 29 L18.4 23.6 L13 22 L18.4 20.4 Z" fill="none" stroke={m.edge} strokeWidth="0.7" strokeLinejoin="round" />
          <circle cx="20" cy="22" r="1" fill={m.edge} />
        </>
      ) : (<>
      {/* the face */}
      <circle cx="20" cy="22" r="11" fill="#FBF6E6" />
      <circle cx="20" cy="22" r="11" fill="none" stroke={m.face} strokeWidth="0.6" />
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
      <circle cx="20" cy="22" r="1.4" fill={m.top} stroke={m.edge} strokeWidth="0.4" />
      </>)}
    </svg>
  );
}
