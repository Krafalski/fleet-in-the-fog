// Fleet in the Fog: every boat as a React component.
// Usage:
//   <Boat kind="junk" />                    game ship, full color
//   <Boat kind="ghost" look="locked" />     badge boat, greyed out
//   <Boat kind="paper" look="year2" size={2} />
import type { CSSProperties, ReactElement } from 'react';

export type ShipKind = 'fisher' | 'junk' | 'mailboat' | 'schooner' | 'tug' | 'yacht';
export type BadgeKind = 'paper' | 'rowboat' | 'canoe' | 'raft' | 'gondola' | 'houseboat' | 'ferry' | 'lightship' | 'paddle' | 'cargo' | 'longship' | 'pirate' | 'icebreaker' | 'submarine' | 'tallship' | 'liner' | 'galleon' | 'ghost';
// Spare boats: drawn and ready, not used by the game yet.
export type SpareKind = 'barge' | 'catamaran' | 'dhow' | 'lifeboat' | 'outrigger' | 'powerboat' | 'carrier' | 'cruise' | 'kayak';
export type BoatKind = ShipKind | BadgeKind | SpareKind;
export type BoatLook = 'color' | 'locked' | 'year2' | 'year3';

// Game ships in tray order (alphabetical, each a different first letter).
export const SHIP_KINDS: ShipKind[] = ['fisher', 'junk', 'mailboat', 'schooner', 'tug', 'yacht'];
export const SHIP_NAMES: Record<ShipKind, string> = {
  fisher: 'Fisher', junk: 'Junk', mailboat: 'Mailboat', schooner: 'Schooner', tug: 'Tug', yacht: 'Yacht',
};

// Badge boats in earning order.
export const BADGE_LADDER: { kind: BadgeKind; name: string; how: string }[] = [
  { kind: 'paper', name: 'Paper boat', how: '3-day streak' },
  { kind: 'rowboat', name: 'Rowboat', how: '5-day streak' },
  { kind: 'canoe', name: 'Canoe', how: '7-day streak' },
  { kind: 'raft', name: 'Raft', how: '10-day streak' },
  { kind: 'gondola', name: 'Gondola', how: '14-day streak' },
  { kind: 'houseboat', name: 'Houseboat', how: '30-day streak' },
  { kind: 'ferry', name: 'Ferry', how: '2-month streak' },
  { kind: 'lightship', name: 'Lightship', how: '3-month streak' },
  { kind: 'paddle', name: 'Paddle steamer', how: '4-month streak' },
  { kind: 'cargo', name: 'Cargo ship', how: '5-month streak' },
  { kind: 'longship', name: 'Longship', how: '6-month streak' },
  { kind: 'pirate', name: 'Pirate ship', how: '7-month streak' },
  { kind: 'icebreaker', name: 'Icebreaker', how: '8-month streak' },
  { kind: 'submarine', name: 'Submarine', how: '9-month streak' },
  { kind: 'tallship', name: 'Tall ship', how: '10-month streak' },
  { kind: 'liner', name: 'Ocean liner', how: '11-month streak' },
  { kind: 'galleon', name: 'Golden galleon', how: '12-month streak' },
  { kind: 'ghost', name: 'Ghost ship', how: 'Mystery' },
];

export const SPARE_NAMES: Record<SpareKind, string> = {
  barge: 'Barge', catamaran: 'Catamaran', dhow: 'Dhow', lifeboat: 'Lifeboat', outrigger: 'Outrigger', powerboat: 'Powerboat', carrier: 'Aircraft carrier', cruise: 'Cruise ship', kayak: 'Kayak',
};

const DRAWINGS: Record<BoatKind, ReactElement> = {
  // game ships
  yacht: (
    <><g transform="translate(40 0) scale(-1 1)"><line x1="20" y1="3" x2="20" y2="22" stroke="#3E4A47" strokeWidth="1.5" /><path d="M21 4 L21 21 L32 21 Z" fill="#B5543B" /><path d="M19 8 L19 21 L11 21 Z" fill="#E3B98F" /><path d="M3 22 H37 L33 28 H7 Z" fill="#3E4A47" /></g></>
  ),
  tug: (
    <><rect x="20" y="7" width="4" height="7" fill="#1F2A2A" /><rect x="13" y="13" width="15" height="9" rx="1.5" fill="#E8D9B0" /><rect x="16" y="15" width="3" height="3" fill="#2E4A6B" /><rect x="22" y="15" width="3" height="3" fill="#2E4A6B" /><path d="M4 22 H36 L32 28 H8 Z" fill="#2E4A6B" /></>
  ),
  mailboat: (
    <><rect x="13" y="7" width="4" height="8" fill="#1F2A2A" /><rect x="23" y="7" width="4" height="8" fill="#1F2A2A" /><rect x="9" y="15" width="22" height="6" fill="#F1E6CC" /><path d="M2 21 H38 L34 28 H6 Z" fill="#B5543B" /><circle cx="20" cy="24.5" r="1.8" fill="#F1E6CC" /></>
  ),
  schooner: (
    <><g transform="translate(40 0) scale(-1 1)"><line x1="14" y1="4" x2="14" y2="22" stroke="#2F3B3A" strokeWidth="1.5" /><line x1="25" y1="2" x2="25" y2="22" stroke="#2F3B3A" strokeWidth="1.5" /><path d="M15 5 L15 21 L23 21 Z" fill="#3F6E68" /><path d="M26 3 L26 21 L35 21 Z" fill="#3F6E68" /><path d="M13 8 L13 21 L6 21 Z" fill="#9DBDB6" /><path d="M3 22 H37 L33 28 H7 Z" fill="#2F3B3A" /></g></>
  ),
  fisher: (
    <><g transform="translate(40 0) scale(-1 1)"><line x1="12" y1="5" x2="12" y2="22" stroke="#3E4A47" strokeWidth="1.5" /><line x1="12" y1="6" x2="20.5" y2="12.5" stroke="#3E4A47" strokeWidth="1" /><rect x="21" y="13" width="11" height="9" fill="#F1E6CC" /><rect x="20" y="12" width="13" height="1.5" fill="#3E4A47" /><rect x="23.5" y="15.5" width="6" height="3" fill="#3E4A47" /><path d="M3 22 H37 L33 28 H7 Z" fill="#D9A441" /></g></>
  ),
  junk: (
    <><path d="M12 4 Q28 1 31 12 L31 22.5 L13.1 22.5 Z" fill="#6B5577" /><line x1="12.4" y1="9" x2="29.5" y2="9" stroke="#F1E6CC" strokeWidth="1" /><line x1="12.7" y1="13.5" x2="31" y2="13.5" stroke="#F1E6CC" strokeWidth="1" /><line x1="12.9" y1="18" x2="31" y2="18" stroke="#F1E6CC" strokeWidth="1" /><path d="M2 21 Q20 23 38 20 L33 28 H8 Z" fill="#3E4A47" /></>
  ),
  // badge boats
  paper: (
    <><path d="M20 5 L28 20 H12 Z" fill="#FBF8EF" stroke="#3E4A47" strokeWidth="0.8" strokeLinejoin="round" /><line x1="20" y1="5" x2="20" y2="20" stroke="#3E4A47" strokeWidth="0.8" strokeLinecap="round" /><path d="M4 20 H36 L30 28 H10 Z" fill="#F1E6CC" stroke="#3E4A47" strokeWidth="0.8" strokeLinejoin="round" /></>
  ),
  rowboat: (
    <><line x1="13" y1="21" x2="6" y2="10" stroke="#3E4A47" strokeWidth="1.5" strokeLinecap="round" /><line x1="27" y1="21" x2="34" y2="10" stroke="#3E4A47" strokeWidth="1.5" strokeLinecap="round" /><circle cx="6" cy="10" r="2" fill="#E3B98F" /><circle cx="34" cy="10" r="2" fill="#E3B98F" /><path d="M5 19 H35 L31 28 H9 Z" fill="#B5543B" /><rect x="6" y="19" width="28" height="2" fill="#E8D9B0" /></>
  ),
  canoe: (
    <><line x1="23" y1="7" x2="17" y2="24" stroke="#8A5A3C" strokeWidth="1.5" strokeLinecap="round" /><path d="M21.5 5 L25 6.5 L24 10.5 L21 9 Z" fill="#E3B98F" /><path d="M2 16 Q5 22 10 22 H30 Q35 22 38 16 Q36 28 30 28 H10 Q4 28 2 16 Z" fill="#3F6E68" /><line x1="9" y1="24.5" x2="31" y2="24.5" stroke="#F1E6CC" strokeWidth="1" strokeLinecap="round" /></>
  ),
  raft: (
    <><line x1="20" y1="5" x2="20" y2="22" stroke="#3E4A47" strokeWidth="1.5" strokeLinecap="round" /><rect x="21" y="6" width="10" height="9" fill="#F1E6CC" /><line x1="21" y1="10.5" x2="31" y2="10.5" stroke="#B5543B" strokeWidth="1.5" strokeLinecap="round" /><rect x="5" y="21" width="30" height="3.5" rx="1.7" fill="#E3B98F" /><rect x="4" y="24.5" width="32" height="3.5" rx="1.7" fill="#8A5A3C" /><rect x="10" y="20.5" width="1.6" height="8" fill="#3E4A47" /><rect x="28.4" y="20.5" width="1.6" height="8" fill="#3E4A47" /></>
  ),
  gondola: (
    <><line x1="28" y1="5" x2="24" y2="24" stroke="#B5543B" strokeWidth="1.5" strokeLinecap="round" /><path d="M2 11 Q4 22 12 23 H30 Q35 23 38 13 Q37 28 30 28 H11 Q3 28 2 11 Z" fill="#2F3B3A" /><rect x="14" y="20" width="8" height="3" rx="1" fill="#B5543B" /><line x1="10" y1="25.5" x2="31" y2="25.5" stroke="#D9A441" strokeWidth="0.8" strokeLinecap="round" /></>
  ),
  houseboat: (
    <><rect x="26" y="4" width="3" height="6" fill="#3E4A47" /><rect x="7" y="9" width="26" height="3" rx="1" fill="#B5543B" /><rect x="9" y="12" width="22" height="10" fill="#E8D9B0" /><rect x="12" y="14" width="4" height="4" fill="#3F6E68" /><rect x="18" y="14" width="4" height="4" fill="#3F6E68" /><rect x="25" y="14" width="4" height="8" fill="#8A5A3C" /><path d="M3 22 H37 L35 28 H5 Z" fill="#2E4A6B" /></>
  ),
  ferry: (
    <><rect x="17" y="4" width="5" height="6" fill="#D9A441" /><rect x="17" y="4" width="5" height="1.8" fill="#3E4A47" /><rect x="10" y="10" width="18" height="5" fill="#F1E6CC" /><rect x="6" y="15" width="28" height="6" fill="#F1E6CC" /><rect x="9" y="16.5" width="3" height="2.5" fill="#2E4A6B" /><rect x="14" y="16.5" width="3" height="2.5" fill="#2E4A6B" /><rect x="19" y="16.5" width="3" height="2.5" fill="#2E4A6B" /><rect x="24" y="16.5" width="3" height="2.5" fill="#2E4A6B" /><rect x="29" y="16.5" width="3" height="2.5" fill="#2E4A6B" /><rect x="13" y="11.5" width="3" height="2" fill="#2E4A6B" /><rect x="22" y="11.5" width="3" height="2" fill="#2E4A6B" /><path d="M2 21 H38 L35 28 H5 Z" fill="#3F6E68" /><line x1="5" y1="23.5" x2="35" y2="23.5" stroke="#F1E6CC" strokeWidth="1" strokeLinecap="round" /></>
  ),
  lightship: (
    <><line x1="20" y1="6" x2="20" y2="17" stroke="#3E4A47" strokeWidth="1.5" strokeLinecap="round" /><line x1="11" y1="11" x2="11" y2="20" stroke="#3E4A47" strokeWidth="1" strokeLinecap="round" /><line x1="29" y1="11" x2="29" y2="20" stroke="#3E4A47" strokeWidth="1" strokeLinecap="round" /><circle cx="20" cy="6" r="3.2" fill="#D9A441" /><line x1="14" y1="4" x2="15.5" y2="5" stroke="#D9A441" strokeWidth="1" strokeLinecap="round" /><line x1="26" y1="4" x2="24.5" y2="5" stroke="#D9A441" strokeWidth="1" strokeLinecap="round" /><line x1="13.5" y1="8" x2="15.5" y2="7.5" stroke="#D9A441" strokeWidth="1" strokeLinecap="round" /><line x1="26.5" y1="8" x2="24.5" y2="7.5" stroke="#D9A441" strokeWidth="1" strokeLinecap="round" /><rect x="14" y="16" width="12" height="5" fill="#F1E6CC" /><path d="M3 21 H37 L33 28 H7 Z" fill="#B5543B" /><line x1="8" y1="24" x2="32" y2="24" stroke="#F1E6CC" strokeWidth="1.2" strokeLinecap="round" /></>
  ),
  paddle: (
    <><g transform="translate(40 0) scale(-1 1)"><rect x="11" y="4" width="2" height="8" fill="#1F2A2A" /><rect x="17" y="4" width="2" height="8" fill="#1F2A2A" /><rect x="9" y="11" width="14" height="5" fill="#F1E6CC" /><rect x="6" y="16" width="22" height="6" fill="#F1E6CC" /><rect x="9" y="17.5" width="2.5" height="2.5" fill="#2E4A6B" /><rect x="14" y="17.5" width="2.5" height="2.5" fill="#2E4A6B" /><rect x="19" y="17.5" width="2.5" height="2.5" fill="#2E4A6B" /><path d="M3 22 H37 L35 28 H5 Z" fill="#2E4A6B" /><circle cx="31" cy="21.5" r="6.5" fill="#B5543B" /><line x1="31" y1="15" x2="31" y2="28" stroke="#F1E6CC" strokeWidth="1" strokeLinecap="round" /><line x1="24.5" y1="21.5" x2="37.5" y2="21.5" stroke="#F1E6CC" strokeWidth="1" strokeLinecap="round" /><line x1="26.4" y1="16.9" x2="35.6" y2="26.1" stroke="#F1E6CC" strokeWidth="1" strokeLinecap="round" /><line x1="35.6" y1="16.9" x2="26.4" y2="26.1" stroke="#F1E6CC" strokeWidth="1" strokeLinecap="round" /><circle cx="31" cy="21.5" r="1.5" fill="#F1E6CC" /></g></>
  ),
  cargo: (
    <><g transform="translate(40 0) scale(-1 1)"><rect x="28" y="8" width="7" height="12" fill="#F1E6CC" /><rect x="29.5" y="10" width="4" height="2.5" fill="#2E4A6B" /><rect x="8" y="10" width="6" height="5" fill="#2E4A6B" /><rect x="14" y="10" width="6" height="5" fill="#6B5577" /><rect x="5" y="15" width="6" height="5" fill="#B5543B" /><rect x="11" y="15" width="6" height="5" fill="#D9A441" /><rect x="17" y="15" width="6" height="5" fill="#3F6E68" /><rect x="23" y="15" width="4" height="5" fill="#B5543B" /><path d="M2 20 H38 L35 28 H5 Z" fill="#3E4A47" /><line x1="5" y1="26" x2="35" y2="26" stroke="#B5543B" strokeWidth="1.4" strokeLinecap="round" /></g></>
  ),
  longship: (
    <><line x1="20" y1="3" x2="20" y2="22" stroke="#3E4A47" strokeWidth="1.5" strokeLinecap="round" /><rect x="11" y="5" width="18" height="12" fill="#F1E6CC" /><rect x="14" y="5" width="3" height="12" fill="#B5543B" /><rect x="20" y="5" width="3" height="12" fill="#B5543B" /><rect x="26" y="5" width="3" height="12" fill="#B5543B" /><path d="M3 13 Q4 22 10 22 H30 Q36 22 37 11 Q39 28 30 28 H10 Q2 28 3 13 Z" fill="#8A5A3C" /><circle cx="3.4" cy="12.5" r="1.6" fill="#8A5A3C" /><circle cx="36.8" cy="10.6" r="1.6" fill="#8A5A3C" /><circle cx="12" cy="25" r="1.7" fill="#D9A441" /><circle cx="17.5" cy="25" r="1.7" fill="#D9A441" /><circle cx="23" cy="25" r="1.7" fill="#D9A441" /><circle cx="28.5" cy="25" r="1.7" fill="#D9A441" /></>
  ),
  pirate: (
    <><g transform="translate(40 0) scale(-1 1)"><line x1="14.5" y1="3" x2="14.5" y2="19" stroke="#3E4A47" strokeWidth="1.5" strokeLinecap="round" /><line x1="26.5" y1="2" x2="26.5" y2="19" stroke="#3E4A47" strokeWidth="1.5" strokeLinecap="round" /><path d="M26.5 2 L32 3.5 L26.5 5 Z" fill="#B5543B" /><rect x="10" y="6" width="9" height="10" fill="#1F2A2A" /><rect x="22" y="6" width="9" height="10" fill="#1F2A2A" /><circle cx="26.5" cy="10" r="2" fill="#F1E6CC" /><rect x="25.5" y="11.5" width="2" height="1.5" fill="#F1E6CC" /><rect x="30" y="14" width="7" height="5" fill="#2F3B3A" /><path d="M3 19 H37 L33 28 H7 Z" fill="#2F3B3A" /><line x1="7" y1="22" x2="34" y2="22" stroke="#D9A441" strokeWidth="1" strokeLinecap="round" /></g></>
  ),
  icebreaker: (
    <><rect x="18" y="4" width="5" height="6" fill="#D9A441" /><rect x="18" y="4" width="5" height="1.8" fill="#3E4A47" /><rect x="15" y="9" width="11" height="5" fill="#F1E6CC" /><rect x="12" y="14" width="17" height="6" fill="#F1E6CC" /><rect x="17" y="10.5" width="2.5" height="2" fill="#2E4A6B" /><rect x="21.5" y="10.5" width="2.5" height="2" fill="#2E4A6B" /><path d="M2 20 H31 L38 20 L29 28 H6 Z" fill="#2E4A6B" /><path d="M4 24 H33.5 L29 28 H6 Z" fill="#B5543B" /><path d="M31 28 L34.5 24.5 L37 28 Z" fill="#FBF8EF" stroke="#3E4A47" strokeWidth="0.8" strokeLinejoin="round" /><path d="M36 28 L38 26.5 L39.5 28 Z" fill="#FBF8EF" stroke="#3E4A47" strokeWidth="0.8" strokeLinejoin="round" /></>
  ),
  submarine: (
    <><path d="M21 11 V5 H25" fill="none" stroke="#3E4A47" strokeWidth="1.5" strokeLinecap="round" /><rect x="15" y="10" width="9" height="8" rx="1.5" fill="#3F6E68" /><rect x="4" y="16" width="32" height="11" rx="5.5" fill="#3F6E68" /><circle cx="12" cy="21.5" r="1.7" fill="#F1E6CC" /><circle cx="19" cy="21.5" r="1.7" fill="#F1E6CC" /><circle cx="26" cy="21.5" r="1.7" fill="#F1E6CC" /><path d="M3 19 L1 17 V26 L3 24 Z" fill="#3E4A47" /><line x1="8" y1="25.5" x2="32" y2="25.5" stroke="#9DBDB6" strokeWidth="1" strokeLinecap="round" /></>
  ),
  tallship: (
    <><line x1="10" y1="4" x2="10" y2="20" stroke="#3E4A47" strokeWidth="1" strokeLinecap="round" /><line x1="20" y1="2" x2="20" y2="20" stroke="#3E4A47" strokeWidth="1" strokeLinecap="round" /><line x1="30" y1="4" x2="30" y2="20" stroke="#3E4A47" strokeWidth="1" strokeLinecap="round" /><rect x="6" y="5" width="8" height="6" fill="#FBF8EF" stroke="#3E4A47" strokeWidth="0.8" strokeLinejoin="round" /><rect x="6" y="12" width="8" height="6.5" fill="#FBF8EF" stroke="#3E4A47" strokeWidth="0.8" strokeLinejoin="round" /><rect x="16" y="3" width="8" height="7" fill="#FBF8EF" stroke="#3E4A47" strokeWidth="0.8" strokeLinejoin="round" /><rect x="16" y="11" width="8" height="7.5" fill="#FBF8EF" stroke="#3E4A47" strokeWidth="0.8" strokeLinejoin="round" /><rect x="26" y="5" width="8" height="6" fill="#FBF8EF" stroke="#3E4A47" strokeWidth="0.8" strokeLinejoin="round" /><rect x="26" y="12" width="8" height="6.5" fill="#FBF8EF" stroke="#3E4A47" strokeWidth="0.8" strokeLinejoin="round" /><path d="M2 20 H38 L34 28 H7 Z" fill="#3E4A47" /><line x1="6" y1="23" x2="35" y2="23" stroke="#F1E6CC" strokeWidth="1.2" strokeLinecap="round" /></>
  ),
  liner: (
    <><rect x="11" y="4" width="4" height="8" fill="#D9A441" /><rect x="11" y="4" width="4" height="2" fill="#1F2A2A" /><rect x="18" y="4" width="4" height="8" fill="#D9A441" /><rect x="18" y="4" width="4" height="2" fill="#1F2A2A" /><rect x="25" y="4" width="4" height="8" fill="#D9A441" /><rect x="25" y="4" width="4" height="2" fill="#1F2A2A" /><rect x="9" y="11" width="22" height="4" fill="#F1E6CC" /><rect x="6" y="15" width="28" height="5" fill="#F1E6CC" /><circle cx="9" cy="17.5" r="0.9" fill="#2E4A6B" /><circle cx="13" cy="17.5" r="0.9" fill="#2E4A6B" /><circle cx="17" cy="17.5" r="0.9" fill="#2E4A6B" /><circle cx="21" cy="17.5" r="0.9" fill="#2E4A6B" /><circle cx="25" cy="17.5" r="0.9" fill="#2E4A6B" /><circle cx="29" cy="17.5" r="0.9" fill="#2E4A6B" /><circle cx="33" cy="17.5" r="0.9" fill="#2E4A6B" /><path d="M1 20 H39 L36 28 H5 Z" fill="#2E4A6B" /><path d="M3.2 25 H37.1 L36 28 H5 Z" fill="#B5543B" /></>
  ),
  galleon: (
    <><line x1="15.5" y1="3" x2="15.5" y2="18" stroke="#3E4A47" strokeWidth="1.5" strokeLinecap="round" /><line x1="27" y1="5" x2="27" y2="18" stroke="#3E4A47" strokeWidth="1.5" strokeLinecap="round" /><path d="M15.5 2 L20 3.2 L15.5 4.4 Z" fill="#B5543B" /><path d="M27 4 L31 5.1 L27 6.2 Z" fill="#B5543B" /><path d="M11 5 H20 Q23 10.5 20 16 H11 Q14 10.5 11 5 Z" fill="#FBF8EF" stroke="#3E4A47" strokeWidth="0.8" strokeLinejoin="round" /><path d="M23 7 H31 Q33.5 11.5 31 16 H23 Q25.5 11.5 23 7 Z" fill="#FBF8EF" stroke="#3E4A47" strokeWidth="0.8" strokeLinejoin="round" /><path d="M3 18 H31 L37 12 V19 L33 28 H8 Z" fill="#D9A441" /><line x1="6" y1="21.5" x2="35" y2="21.5" stroke="#8A5A3C" strokeWidth="1.2" strokeLinecap="round" /><circle cx="12" cy="24.8" r="1" fill="#8A5A3C" /><circle cx="18" cy="24.8" r="1" fill="#8A5A3C" /><circle cx="24" cy="24.8" r="1" fill="#8A5A3C" /><circle cx="30" cy="24.8" r="1" fill="#8A5A3C" /></>
  ),
  ghost: (
    <><line x1="15.5" y1="5" x2="15.5" y2="19" stroke="#8FA09B" strokeWidth="1" strokeLinecap="round" /><line x1="27" y1="7" x2="27" y2="19" stroke="#8FA09B" strokeWidth="1" strokeLinecap="round" /><path d="M10.5 3.5 L13 7 H18 L20.5 3.5 V15 Q19.25 17.5 18 15 Q16.75 12.5 15.5 15 Q14.25 17.5 13 15 Q11.75 12.5 10.5 15 Z" fill="#F1F8F3" stroke="#9FB5AE" strokeWidth="0.6" strokeLinejoin="round" /><ellipse cx="13.6" cy="10.4" rx="0.9" ry="1.3" fill="#3F6E68" /><ellipse cx="17.4" cy="10.4" rx="0.9" ry="1.3" fill="#3F6E68" /><path d="M23 6.5 L25 9.2 H29 L31 6.5 V14.5 Q30 16.5 29 14.5 Q28 12.5 27 14.5 Q26 16.5 25 14.5 Q24 12.5 23 14.5 Z" fill="#F1F8F3" stroke="#9FB5AE" strokeWidth="0.6" strokeLinejoin="round" /><ellipse cx="25.7" cy="11.4" rx="0.7" ry="1" fill="#3F6E68" /><ellipse cx="28.3" cy="11.4" rx="0.7" ry="1" fill="#3F6E68" /><path d="M3 19 H37 L33 28 H7 Z" fill="#B4CCC5" /><line x1="8" y1="23" x2="33" y2="23" stroke="#F1F8F3" strokeWidth="1" strokeLinecap="round" strokeDasharray="3 2" /></>
  ),
  // spare boats
  barge: (
    <><rect x="4" y="13" width="7" height="8" fill="#F1E6CC" /><rect x="6" y="15" width="3" height="2.5" fill="#2E4A6B" /><rect x="3" y="12" width="9" height="1.5" fill="#B5543B" /><path d="M13 21 Q17.5 12 22 21 Z" fill="#D9A441" /><path d="M21 21 Q26 13 31 21 Z" fill="#8A5A3C" /><rect x="34" y="18.5" width="1.5" height="2.5" fill="#1F2A2A" /><path d="M2 21 H38 L36 28 H4 Z" fill="#3E4A47" /><line x1="5" y1="24" x2="35" y2="24" stroke="#F1E6CC" strokeWidth="1" strokeLinecap="round" /></>
  ),
  catamaran: (
    <><g transform="translate(40 0) scale(-1 1)"><line x1="20" y1="2" x2="20" y2="21" stroke="#3E4A47" strokeWidth="1.5" /><path d="M21 3 L21 19 L33 19 Z" fill="#2E4A6B" /><path d="M19 6 L19 19 L10 19 Z" fill="#F1E6CC" /><rect x="13" y="17.5" width="13" height="3.5" rx="1.5" fill="#9DBDB6" /><path d="M3 21 H37 L34 28 H25 Q20 21.5 15 28 H6 Z" fill="#3F6E68" /></g></>
  ),
  dhow: (
    <><line x1="19" y1="7" x2="19" y2="21" stroke="#3E4A47" strokeWidth="1.5" /><path d="M9 2 L33 14 L11 19 Z" fill="#F1E6CC" /><line x1="8" y1="1.5" x2="34" y2="14.5" stroke="#8A5A3C" strokeWidth="1.3" strokeLinecap="round" /><path d="M2 16 H7 L9 21 H30 Q35 21 38 15 Q37 28 30 28 H9 Q4 27 2 16 Z" fill="#8A5A3C" /><line x1="9" y1="24.5" x2="31" y2="24.5" stroke="#D9A441" strokeWidth="1" strokeLinecap="round" /></>
  ),
  lifeboat: (
    <><line x1="18.5" y1="5" x2="18.5" y2="11" stroke="#3E4A47" strokeWidth="1" /><circle cx="18.5" cy="5" r="1.4" fill="#D9A441" /><rect x="12" y="10.5" width="13" height="9" rx="1.5" fill="#B5543B" /><rect x="14" y="12.5" width="3.5" height="2.5" fill="#F1E6CC" /><rect x="19.5" y="12.5" width="3.5" height="2.5" fill="#F1E6CC" /><path d="M3 19 H30 L38 17 L34 28 H7 Z" fill="#2E4A6B" /><circle cx="11.5" cy="23.5" r="2" fill="none" stroke="#F1E6CC" strokeWidth="1.3" /><line x1="16.5" y1="23.5" x2="33" y2="23.5" stroke="#F1E6CC" strokeWidth="1.2" strokeLinecap="round" /></>
  ),
  outrigger: (
    <><line x1="20" y1="4" x2="20" y2="19" stroke="#3E4A47" strokeWidth="1.5" strokeLinecap="round" /><path d="M21 17 L21 5 Q28 8 35 3 Q32 14 21 17 Z" fill="#B5543B" /><path d="M3 15 Q5 19.5 10 19.5 H30 Q35 19.5 37 15 Q36 24 30 24 H10 Q4 24 3 15 Z" fill="#8A5A3C" /><line x1="12" y1="23" x2="12" y2="26.5" stroke="#3E4A47" strokeWidth="1" /><line x1="28" y1="23" x2="28" y2="26.5" stroke="#3E4A47" strokeWidth="1" /><rect x="7" y="25.8" width="26" height="2.2" rx="1.1" fill="#E3B98F" /></>
  ),
  powerboat: (
    <><line x1="34" y1="18.5" x2="34" y2="12" stroke="#3E4A47" strokeWidth="1" strokeLinecap="round" /><path d="M34 12 L29.5 13.2 L34 14.4 Z" fill="#D9A441" /><path d="M23 20 L19 14 L17.5 14 L18 20 Z" fill="#9DBDB6" /><rect x="9" y="17" width="7" height="3" rx="1" fill="#F1E6CC" /><rect x="1.5" y="17.5" width="3" height="5.5" rx="1" fill="#1F2A2A" /><rect x="2.5" y="23" width="1" height="4" fill="#1F2A2A" /><path d="M4 20 H30 L38 18 L31 28 H7 Z" fill="#6B5577" /><line x1="7.5" y1="23.5" x2="33" y2="23.5" stroke="#F1E6CC" strokeWidth="1.2" strokeLinecap="round" /></>
  ),
  carrier: (
    <><line x1="25" y1="7" x2="25" y2="2.5" stroke="#3E4A47" strokeWidth="1" strokeLinecap="round" /><line x1="23" y1="4" x2="27" y2="4" stroke="#3E4A47" strokeWidth="1" strokeLinecap="round" /><rect x="23.5" y="7" width="3.5" height="4" fill="#9DBDB6" /><rect x="21.5" y="10.5" width="8" height="7.5" fill="#9DBDB6" /><rect x="22.5" y="12.5" width="6" height="1.5" fill="#2E4A6B" /><path d="M4 17.5 L4 13 L7 15.5 H13.5 L16.5 17.5 Z" fill="#2E4A6B" /><path d="M30.5 17.5 L30.5 14.5 L32.6 16.2 H36 L38 17.5 Z" fill="#2E4A6B" /><rect x="1" y="17.5" width="38" height="2.5" fill="#1F2A2A" /><line x1="3" y1="18.7" x2="20" y2="18.7" stroke="#D9A441" strokeWidth="0.6" strokeDasharray="2 1.5" /><path d="M3 20 H37 L34 28 H7 Z" fill="#3E4A47" /><line x1="7" y1="25.5" x2="34.5" y2="25.5" stroke="#B5543B" strokeWidth="1.4" strokeLinecap="round" /></>
  ),
  cruise: (
    <><path d="M18.5 8 L20 3 H24.5 L25.5 8 Z" fill="#B5543B" /><rect x="19.6" y="3" width="5.1" height="1.6" fill="#D9A441" /><rect x="10" y="7.5" width="18" height="4" fill="#F1E6CC" /><rect x="7" y="11.5" width="25" height="4" fill="#FBF8EF" /><rect x="4" y="15.5" width="31" height="4.5" fill="#F1E6CC" /><rect x="12.0" y="8.7" width="2" height="1.5" fill="#2E4A6B" /><rect x="15.5" y="8.7" width="2" height="1.5" fill="#2E4A6B" /><rect x="19.0" y="8.7" width="2" height="1.5" fill="#2E4A6B" /><rect x="22.5" y="8.7" width="2" height="1.5" fill="#2E4A6B" /><rect x="26.0" y="8.7" width="2" height="1.5" fill="#2E4A6B" /><rect x="9.0" y="12.7" width="2" height="1.5" fill="#2E4A6B" /><rect x="12.5" y="12.7" width="2" height="1.5" fill="#2E4A6B" /><rect x="16.0" y="12.7" width="2" height="1.5" fill="#2E4A6B" /><rect x="19.5" y="12.7" width="2" height="1.5" fill="#2E4A6B" /><rect x="23.0" y="12.7" width="2" height="1.5" fill="#2E4A6B" /><rect x="26.5" y="12.7" width="2" height="1.5" fill="#2E4A6B" /><rect x="30.0" y="12.7" width="2" height="1.5" fill="#2E4A6B" /><rect x="6.0" y="17" width="2" height="1.5" fill="#2E4A6B" /><rect x="9.5" y="17" width="2" height="1.5" fill="#2E4A6B" /><rect x="13.0" y="17" width="2" height="1.5" fill="#2E4A6B" /><rect x="16.5" y="17" width="2" height="1.5" fill="#2E4A6B" /><rect x="20.0" y="17" width="2" height="1.5" fill="#2E4A6B" /><rect x="23.5" y="17" width="2" height="1.5" fill="#2E4A6B" /><rect x="27.0" y="17" width="2" height="1.5" fill="#2E4A6B" /><rect x="30.5" y="17" width="2" height="1.5" fill="#2E4A6B" /><path d="M1 20 H39 L35 28 H5 Z" fill="#3F6E68" /><line x1="4.5" y1="23" x2="36.5" y2="23" stroke="#F1E6CC" strokeWidth="1.2" strokeLinecap="round" /></>
  ),
  kayak: (
    <><path d="M2 21.5 Q20 17.5 38 21.5 Q20 29.5 2 21.5 Z" fill="#D9A441" /><ellipse cx="20" cy="21" rx="4.5" ry="1.3" fill="#1F2A2A" /><line x1="8" y1="21.5" x2="13" y2="21.5" stroke="#B5543B" strokeWidth="1" strokeLinecap="round" /><line x1="27" y1="21.5" x2="32" y2="21.5" stroke="#B5543B" strokeWidth="1" strokeLinecap="round" /><line x1="11" y1="9" x2="28" y2="25" stroke="#3E4A47" strokeWidth="1.3" strokeLinecap="round" /><ellipse cx="10.5" cy="8.5" rx="3" ry="1.5" transform="rotate(43 10.5 8.5)" fill="#3F6E68" /><ellipse cx="28.5" cy="25.5" rx="3" ry="1.5" transform="rotate(43 28.5 25.5)" fill="#3F6E68" /></>
  ),
};

const LOOKS: Record<BoatLook, CSSProperties> = {
  color: {},
  locked: { filter: 'grayscale(1)', opacity: 0.3 },        // not earned yet
  year2: { filter: 'invert(1) hue-rotate(180deg)' },       // second time around
  year3: { filter: 'grayscale(1) contrast(1.15)' },        // third time around
};

export function Boat({ kind, look = 'color', size = 1, label }:
  { kind: BoatKind; look?: BoatLook; size?: number; label?: string }) {
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
