// Fleet in the Fog: sea creatures, for the "solved in N guesses" badges.
// Works exactly like Boat.tsx:
//   <Creature kind="whale" />
//   <Creature kind="seal" look="locked" size={2} />
import type { CSSProperties, ReactElement } from 'react';

export type CreatureKind = 'seal' | 'dolphin' | 'shark' | 'whale' | 'manta' | 'octopus' | 'nautilus' | 'squid' | 'beluga' | 'nessie' | 'turtle' | 'medic';
export type CreatureLook = 'color' | 'locked';

export const CREATURE_KINDS: CreatureKind[] = ['seal', 'dolphin', 'shark', 'whale', 'manta', 'octopus', 'nautilus', 'squid', 'beluga', 'nessie', 'turtle', 'medic'];
export const CREATURE_NAMES: Record<CreatureKind, string> = {
  seal: 'Seal',
  dolphin: 'Dolphin',
  shark: 'Shark',
  whale: 'Whale',
  manta: 'Manta ray',
  octopus: 'Octopus',
  nautilus: 'Nautilus',
  squid: 'Squid',
  beluga: 'Beluga',
  nessie: 'Loch Ness monster',
  turtle: 'Sea turtle',
  medic: 'Rescue dolphin', // streak repair
};

// Which creature you sight for a winning score of N (score = guesses + hints). Commonest first, rarest last.
// The seal covers a score of 8 or more. Shown as a 4 x 2 grid in this order.
// Not on the ladder: squid and nautilus (spares), nessie (saved for a mystery).
export const CREATURE_LADDER: { score: number; kind: CreatureKind }[] = [
  { score: 8, kind: 'seal' },
  { score: 7, kind: 'turtle' },
  { score: 6, kind: 'dolphin' },
  { score: 5, kind: 'octopus' },
  { score: 4, kind: 'shark' },
  { score: 3, kind: 'manta' },
  { score: 2, kind: 'beluga' },
  { score: 1, kind: 'whale' },
];

const DRAWINGS: Record<CreatureKind, ReactElement> = {
  seal: (
    <><path d="M3 28 Q5 22.5 13 22 H28 Q35 23 37 28 Z" fill="#3E4A47" /><path d="M10.8 20.2 Q7 19.6 3.8 17.6 Q4.4 20.6 6.6 22 Q4.4 23.3 3.4 25.4 Q7.6 25.2 11.6 23.7 Z" fill="#8A5A3C" /><circle cx="10.6" cy="21.9" r="1.9" fill="#8A5A3C" /><path d="M9 22 Q12 16 20 16 Q25 16 27 12 Q28 7 32 7 Q36 7.5 35.5 11 Q35 13 33 13.5 Q32 20 25 22.5 H12 Z" fill="#8A5A3C" /><path d="M27.5 13.5 Q30 15 33 13.5 Q32 20 25 22.5 H19 Q26 20 27.5 13.5 Z" fill="#E3B98F" /><path d="M22.6 19.2 Q26.6 21.4 28.4 25.8 Q23.4 25.6 19.4 22.4 Z" fill="#8A5A3C" /><circle cx="21.6" cy="21" r="1.7" fill="#8A5A3C" /><circle cx="32.6" cy="9.6" r="0.8" fill="#1F2A2A" /><circle cx="35.5" cy="10.6" r="0.8" fill="#1F2A2A" /><line x1="34.8" y1="11.8" x2="37.6" y2="11.4" stroke="#1F2A2A" strokeWidth="0.4" strokeLinecap="round" /><line x1="34.8" y1="12.2" x2="37.4" y2="12.8" stroke="#1F2A2A" strokeWidth="0.4" strokeLinecap="round" /></>
  ),
  dolphin: (
    <><path d="M10.9 24.6 Q8 20.9 3.2 22.2 Q5 27.2 10 26.9 Q11.8 30.4 17.2 29.6 Q16.4 25.2 10.9 24.6 Z" fill="#3F6E68" /><circle cx="11" cy="24.6" r="1.2" fill="#3F6E68" /><path d="M21.6 10.6 Q19.6 6.8 14.2 6 Q16.8 9 16.5 12.9 Z" fill="#3F6E68" /><path d="M10.2 25 Q12 9 26 9 Q32 9 35 12.5 L39 14 L35 16 Q30 18 26 16.5 Q18.5 15.5 11.8 25.4 Z" fill="#3F6E68" /><path d="M35 16 Q30 18 26 16.5 Q20 15.8 15.5 21 Q21 13.5 28 14.5 Q32 15.2 35.5 14.2 L39 14 Z" fill="#9DBDB6" /><path d="M25 16 Q24.5 21 20.5 22.5 Q22.5 19 21.5 16 Z" fill="#3F6E68" /><circle cx="32" cy="12.6" r="0.8" fill="#F1E6CC" /></>
  ),
  shark: (
    <><path d="M7.6 19.2 L0.8 10.4 Q7.4 13.2 10.8 17.2 Z" fill="#3E4A47" /><path d="M7.6 18.8 L1.8 26.2 Q8.2 24 11 20.6 Z" fill="#3E4A47" /><path d="M17.5 13.6 L21 5.5 Q23.5 10 25.5 13 Z" fill="#3E4A47" /><path d="M4 19 Q14 12 28 13 Q35 13.5 38 17 Q34 22 26 22.5 Q14 23 4 19 Z" fill="#3E4A47" /><path d="M12 21 Q24 21.5 33 18.5 Q36 17.8 38 17 Q34 22 26 22.5 Q18 23 12 21 Z" fill="#F1E6CC" /><path d="M22 21.8 L19.5 27 Q24 25 26.5 22 Z" fill="#3E4A47" /><circle cx="33" cy="15.8" r="0.9" fill="#F1E6CC" /><line x1="28" y1="15" x2="28" y2="18" stroke="#9DBDB6" strokeWidth="0.6" strokeLinecap="round" /><line x1="26.3" y1="15" x2="26.3" y2="18" stroke="#9DBDB6" strokeWidth="0.6" strokeLinecap="round" /><path d="M33.5 19.6 Q35.3 19.7 36.6 18.5" fill="none" stroke="#1F2A2A" strokeWidth="0.6" strokeLinecap="round" /></>
  ),
  whale: (
    <><path d="M24 9.5 V6.5 M24 6.5 Q22.5 3 19.5 4.5 M24 6.5 Q25.5 3 28.5 4.5" fill="none" stroke="#3F6E68" strokeWidth="1.1" strokeLinecap="round" /><path d="M10 26 Q1.2 25.6 2 12 L5 12 Q4.8 19 11 19 Z" fill="#2E4A6B" /><path d="M3.5 13.4 Q0.5 10.8 0.4 6.4 Q2.8 6.9 3.6 9.3 Q4.6 6.6 7.6 6.2 Q7.4 10.8 3.5 13.4 Z" fill="#2E4A6B" /><circle cx="8.6" cy="22.4" r="2.8" fill="#2E4A6B" /><path d="M6 20 Q8 10 22 10 Q36 10 37.5 19 Q37.5 27 26 27 H14 Q8 27 6 20 Z" fill="#2E4A6B" /><path d="M10 23 Q22 25.5 37.3 20.5 Q36 27 26 27 H14 Q11 26.5 10 23 Z" fill="#9DBDB6" /><circle cx="31.5" cy="17" r="1" fill="#F1E6CC" /><path d="M22.4 20.6 Q23.6 25.6 18.4 28 Q19.2 24.4 17.2 20.9 Z" fill="#2E4A6B" /></>
  ),
  manta: (
    <><line x1="11" y1="16" x2="1.5" y2="16" stroke="#6B5577" strokeWidth="1" strokeLinecap="round" /><path d="M34.5 14 Q36 11.3 38.8 12 Q37 13.5 36.3 15.4 Z" fill="#6B5577" /><path d="M34.5 18 Q36 20.7 38.8 20 Q37 18.5 36.3 16.6 Z" fill="#6B5577" /><path d="M35 13.8 Q29 12.5 22 4 Q20 12 10 15.2 L8 16 L10 16.8 Q20 20 22 28 Q29 19.5 35 18.2 Q36.2 16 35 13.8 Z" fill="#6B5577" /><ellipse cx="23.5" cy="12" rx="2.2" ry="1.2" transform="rotate(35 23.5 12)" fill="#9DBDB6" /><ellipse cx="23.5" cy="20" rx="2.2" ry="1.2" transform="rotate(-35 23.5 20)" fill="#9DBDB6" /><circle cx="32.6" cy="14.7" r="0.7" fill="#F1E6CC" /><circle cx="32.6" cy="17.3" r="0.7" fill="#F1E6CC" /></>
  ),
  octopus: (
    <><path d="M13.5 16 Q7 18.5 5 23.5 Q4 27.2 6.4 26.7 M16.5 17 Q14 22 13.2 25.5 Q12.7 28 10.4 27.2 M20 17 V25 Q20.3 27.8 23.3 26.8 M23.5 17 Q26 22 26.8 25.5 Q27.3 28 29.6 27.2 M26.5 16 Q33 18.5 35 23.5 Q36 27.2 33.6 26.7" fill="none" stroke="#B5543B" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /><path d="M11.5 17.5 Q11.5 4.5 20 4.5 Q28.5 4.5 28.5 17.5 Z" fill="#B5543B" /><circle cx="17" cy="12.5" r="1.9" fill="#F1E6CC" /><circle cx="24" cy="12.5" r="1.9" fill="#F1E6CC" /><circle cx="17.6" cy="12.7" r="0.9" fill="#1F2A2A" /><circle cx="24.6" cy="12.7" r="0.9" fill="#1F2A2A" /></>
  ),
  nautilus: (
    <><path d="M30 15.5 Q34 12.5 38 13 M30.5 17 Q35 16 38.5 17 M30.5 18.5 Q34.5 19.5 37.5 21.5 M29.5 20 Q32.5 22.5 35 25" fill="none" stroke="#8A5A3C" strokeWidth="1.2" strokeLinecap="round" /><path d="M23 9 Q30 10 32.5 16 Q31.5 21.5 26 24 Z" fill="#E3B98F" /><circle cx="16" cy="15" r="10.5" fill="#F1E6CC" /><path d="M21 18 L15.1 4.5 A10.5 10.5 0 0 0 12.8 5.0 Z" fill="#B5543B" /><path d="M21 18 L10.0 6.4 A10.5 10.5 0 0 0 8.2 8.0 Z" fill="#B5543B" /><path d="M21 18 L6.5 10.6 A10.5 10.5 0 0 0 5.7 12.8 Z" fill="#B5543B" /><path d="M21 18 L5.5 15.9 A10.5 10.5 0 0 0 6.0 18.2 Z" fill="#B5543B" /><path d="M21 18 L7.4 21.0 A10.5 10.5 0 0 0 9.0 22.8 Z" fill="#B5543B" /><path d="M21 18 L11.6 24.5 A10.5 10.5 0 0 0 13.8 25.3 Z" fill="#B5543B" /><circle cx="16" cy="15" r="10.5" fill="none" stroke="#8A5A3C" strokeWidth="0.8" /><path d="M21 18 Q21.5 14 18.5 13 Q15 12.5 14.5 16 Q14.5 19.5 18 20" fill="none" stroke="#8A5A3C" strokeWidth="0.8" strokeLinecap="round" /><circle cx="29.3" cy="15.8" r="1.4" fill="#FBF8EF" /><circle cx="29.7" cy="15.9" r="0.7" fill="#1F2A2A" /></>
  ),
  squid: (
    <><g transform="translate(40 0) scale(-1 1)"><path d="M13.5 13.5 Q9 10.5 4.5 10.5 M13 14.8 Q8 13 2.5 13.5 M13 16 Q8 16 1.5 16.5 M13 17.2 Q8 18.5 2.5 19.5 M13.5 18.5 Q9 21.5 5 22.5" fill="none" stroke="#D9A441" strokeWidth="1.2" strokeLinecap="round" /><path d="M38.5 16 L31 8.5 Q28.5 11.5 29 14 Z" fill="#B98222" /><path d="M38.5 16 L31 23.5 Q28.5 20.5 29 18 Z" fill="#B98222" /><path d="M38.5 16 Q30 10.5 18 12 Q16.5 16 18 20 Q30 21.5 38.5 16 Z" fill="#D9A441" /><path d="M18.5 12.3 Q13.5 12.8 12.5 16 Q13.5 19.2 18.5 19.7 Z" fill="#D9A441" /><circle cx="15.6" cy="14.8" r="1.5" fill="#FBF8EF" /><circle cx="15.2" cy="14.9" r="0.7" fill="#1F2A2A" /><circle cx="23" cy="14.5" r="0.7" fill="#B98222" /><circle cx="27" cy="17" r="0.7" fill="#B98222" /><circle cx="31" cy="15" r="0.7" fill="#B98222" /></g></>
  ),
  beluga: (
    <><path d="M7 19.5 L1.5 14 Q1 17 2.8 19.2 Q1 21.5 2 25 L8 21 Z" fill="#FBF8EF" stroke="#8FA09B" strokeWidth="0.7" strokeLinejoin="round" /><path d="M5 19 Q10 12.5 22 11.5 Q26.5 7.5 32 9 Q37.5 11 37.5 16 Q38.3 17.3 37 18.8 Q33 21.5 28 22.5 Q16 24.5 5 19 Z" fill="#FBF8EF" stroke="#8FA09B" strokeWidth="0.7" strokeLinejoin="round" /><path d="M24.5 22.5 Q25 26.5 20.5 27.5 Q21.5 24.5 20.5 23 Z" fill="#FBF8EF" stroke="#8FA09B" strokeWidth="0.7" strokeLinejoin="round" /><circle cx="32" cy="14.8" r="0.8" fill="#1F2A2A" /><path d="M33.3 18.6 Q35.6 18.8 37 17.5" fill="none" stroke="#3E4A47" strokeWidth="0.6" strokeLinecap="round" /></>
  ),
  nessie: (
    <><path d="M27.5 27 Q27 13 31 8.5" fill="none" stroke="#6E9B7A" strokeWidth="3.4" strokeLinecap="butt" /><ellipse cx="33.6" cy="7.6" rx="3.8" ry="2.4" fill="#6E9B7A" /><line x1="31.6" y1="5.6" x2="31.2" y2="3.6" stroke="#6E9B7A" strokeWidth="0.9" strokeLinecap="round" /><line x1="33.4" y1="5.3" x2="33.4" y2="3.3" stroke="#6E9B7A" strokeWidth="0.9" strokeLinecap="round" /><path d="M13.2 27 Q18.5 10.5 23.8 27 Z" fill="#6E9B7A" /><path d="M3.7 27 Q8 15 12.3 27 Z" fill="#6E9B7A" /><path d="M0.9 27 Q1 19.5 3.2 23.5" fill="none" stroke="#6E9B7A" strokeWidth="1.4" strokeLinecap="round" /><circle cx="34.6" cy="7" r="0.7" fill="#1F2A2A" /><path d="M34.6 8.9 Q36 9.1 36.9 8.2" fill="none" stroke="#1F2A2A" strokeWidth="0.5" strokeLinecap="round" /><circle cx="17" cy="20.5" r="0.9" fill="#B4CCC5" /><circle cx="20" cy="22" r="0.7" fill="#B4CCC5" /><circle cx="8" cy="21.5" r="0.7" fill="#B4CCC5" /><path d="M0 25.5 Q3.3 24 6.6 25.5 T13.3 25.5 T20 25.5 T26.6 25.5 T33.3 25.5 T40 25.5 V29 H0 Z" fill="#9DBDB6" /><path d="M0.6 25.5 Q3.3 24 6.6 25.5 T13.3 25.5 T20 25.5 T26.6 25.5 T33.3 25.5 T39.4 25.5" fill="none" stroke="#3F6E68" strokeWidth="1" strokeLinecap="round" /></>
  ),
  turtle: (
    <><path d="M10 19.5 L5 20 L10 21.5 Z" fill="#3F6E68" /><path d="M11.5 21 Q7 23 5 27.5 Q10.5 26.5 14 22.5 Z" fill="#3F6E68" /><path d="M31 17 Q33 13.3 36.5 14 Q39.2 15 38 17.8 Q36.5 19.8 32 19.8 Z" fill="#3F6E68" /><path d="M8 20 H33 Q30 23.8 21 23.8 Q11 23.8 8 20 Z" fill="#E3B98F" /><path d="M27 21.5 Q32.5 23 34.5 28 Q28 27 24 22.8 Z" fill="#3F6E68" /><path d="M9 20.3 Q10 9 21 9 Q31.5 9 32.5 20.3 Z" fill="#8A5A3C" /><path d="M15.5 10.3 L13.5 20 M21 9 V20 M26.5 10.3 L28.5 20 M10.3 15.5 Q21 13.5 31.7 15.5" fill="none" stroke="#E3B98F" strokeWidth="0.6" strokeLinecap="round" /><circle cx="36" cy="15.8" r="0.7" fill="#F1E6CC" /></>
  ),
  medic: (
    <><path d="M10.9 24.6 Q8 20.9 3.2 22.2 Q5 27.2 10 26.9 Q11.8 30.4 17.2 29.6 Q16.4 25.2 10.9 24.6 Z" fill="#3F6E68" /><circle cx="11" cy="24.6" r="1.2" fill="#3F6E68" /><path d="M21.6 10.6 Q19.6 6.8 14.2 6 Q16.8 9 16.5 12.9 Z" fill="#3F6E68" /><path d="M10.2 25 Q12 9 26 9 Q32 9 35 12.5 L39 14 L35 16 Q30 18 26 16.5 Q18.5 15.5 11.8 25.4 Z" fill="#3F6E68" /><path d="M35 16 Q30 18 26 16.5 Q20 15.8 15.5 21 Q21 13.5 28 14.5 Q32 15.2 35.5 14.2 L39 14 Z" fill="#9DBDB6" /><path d="M25 16 Q24.5 21 20.5 22.5 Q22.5 19 21.5 16 Z" fill="#3F6E68" /><circle cx="32" cy="12.6" r="0.8" fill="#F1E6CC" /><g transform="rotate(9 27 9.6)"><path d="M27 9.6 L27.6 4.6 Q30.6 2.8 34 5.2 L34.2 10.6 Q30.5 8.6 27 9.6 Z" fill="#FBF8EF" stroke="#8FA09B" strokeWidth="0.6" strokeLinejoin="round" /><path d="M27.1 8.3 Q30.6 7 34.1 8.9" fill="none" stroke="#2E4A6B" strokeWidth="0.8" strokeLinecap="round" /><path d="M30.8 5.5 Q30 4.2 29.2 4.8 Q28.6 5.5 30.6 6.5 Q32.7 5.9 32.3 5 Q31.7 4.2 30.8 5.5 Z" fill="#B5543B" /></g><circle cx="21.4" cy="23" r="2.6" fill="none" stroke="#FBF8EF" strokeWidth="1.7" /><path d="M21.4 20.4 A2.6 2.6 0 0 1 24 23 M21.4 25.6 A2.6 2.6 0 0 1 18.8 23" fill="none" stroke="#B5543B" strokeWidth="1.7" /></>
  ),
};

const LOOKS: Record<CreatureLook, CSSProperties> = {
  color: {},
  locked: { filter: 'grayscale(1)', opacity: 0.3 }, // not earned yet
};

export function Creature({ kind, look = 'color', size = 1, label }:
  { kind: CreatureKind; look?: CreatureLook; size?: number; label?: string }) {
  return (
    <svg
      viewBox="0 0 40 32"
      width={40 * size}
      height={32 * size}
      style={LOOKS[look]}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {DRAWINGS[kind]}
    </svg>
  );
}
