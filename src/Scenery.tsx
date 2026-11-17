// Fleet in the Fog: harbor scenery (lighthouses, docks, champagne and extras).
// Works like Boat.tsx:
//   <Scenery kind="lighthouse-striped-lit" />
//   <Scenery kind="dock-crane" size={2} label="Dock with crane" />
import type { ReactElement } from 'react';

export type SceneryKind = 'lighthouse-white' | 'lighthouse-white-lit' | 'lighthouse-striped' | 'lighthouse-striped-lit' | 'dock' | 'dock-crane' | 'champagne' | 'champagne-pop' | 'buoy' | 'anchor' | 'wheel' | 'message' | 'parrot-red' | 'parrot-blue' | 'cockatoo-pink' | 'parrot-green' | 'parrot-grey' | 'barrel' | 'barrel-spilled' | 'albatross';

export const SCENERY_NAMES: Record<SceneryKind, string> = {
  'lighthouse-white': 'White lighthouse, light off',
  'lighthouse-white-lit': 'White lighthouse, light on',
  'lighthouse-striped': 'Striped lighthouse, light off',
  'lighthouse-striped-lit': 'Striped lighthouse, light on',
  'dock': 'Dock',
  'dock-crane': 'Dock with crane',
  'champagne': 'Champagne',
  'champagne-pop': 'Champagne popping',
  'buoy': 'Buoy',
  'anchor': 'Anchor',
  'wheel': "Ship's wheel",
  'message': 'Message in a bottle',
  'parrot-red': 'Red macaw',
  'parrot-blue': 'Blue macaw',
  'cockatoo-pink': 'Pink cockatoo',
  'parrot-green': 'Green parrot',
  'parrot-grey': 'African grey',
  'barrel': 'Barrel',
  'barrel-spilled': 'Spilled barrel',
  'albatross': 'Albatross',
};

const DRAWINGS: Record<SceneryKind, ReactElement> = {
  'lighthouse-white': (
    <><path d="M9 28 Q11 24.5 15 24.5 H25 Q29 24.5 31 28 Z" fill="#3E4A47" /><path d="M16.5 24.5 L18 11 H22 L23.5 24.5 Z" fill="#FBF8EF" /><path d="M16.5 24.5 L18 11 H22 L23.5 24.5 Z" fill="none" stroke="#8FA09B" strokeWidth="0.6" strokeLinejoin="round" /><path d="M19 24.5 V21.8 Q20 20.4 21 21.8 V24.5 Z" fill="#3E4A47" /><rect x="19.4" y="14.5" width="1.2" height="2.2" fill="#2E4A6B" /><rect x="16.6" y="9.8" width="6.8" height="1.4" fill="#3E4A47" /><rect x="18" y="6" width="4" height="3.8" fill="#9DBDB6" /><line x1="20" y1="6" x2="20" y2="9.8" stroke="#3E4A47" strokeWidth="0.5" /><path d="M17.2 6 L20 3 L22.8 6 Z" fill="#B5543B" /><line x1="20" y1="3" x2="20" y2="1.6" stroke="#3E4A47" strokeWidth="0.8" strokeLinecap="round" /></>
  ),
  'lighthouse-white-lit': (
    <><path d="M18.2 7.9 L0.5 3 V12.5 Z" fill="#F2DC9C" opacity="0.85" /><path d="M21.8 7.9 L39.5 3 V12.5 Z" fill="#F2DC9C" opacity="0.85" /><path d="M9 28 Q11 24.5 15 24.5 H25 Q29 24.5 31 28 Z" fill="#3E4A47" /><path d="M16.5 24.5 L18 11 H22 L23.5 24.5 Z" fill="#FBF8EF" /><path d="M16.5 24.5 L18 11 H22 L23.5 24.5 Z" fill="none" stroke="#8FA09B" strokeWidth="0.6" strokeLinejoin="round" /><path d="M19 24.5 V21.8 Q20 20.4 21 21.8 V24.5 Z" fill="#3E4A47" /><rect x="19.4" y="14.5" width="1.2" height="2.2" fill="#2E4A6B" /><rect x="16.6" y="9.8" width="6.8" height="1.4" fill="#3E4A47" /><rect x="18" y="6" width="4" height="3.8" fill="#D9A441" /><line x1="20" y1="6" x2="20" y2="9.8" stroke="#3E4A47" strokeWidth="0.5" /><path d="M17.2 6 L20 3 L22.8 6 Z" fill="#B5543B" /><line x1="20" y1="3" x2="20" y2="1.6" stroke="#3E4A47" strokeWidth="0.8" strokeLinecap="round" /></>
  ),
  'lighthouse-striped': (
    <><path d="M9 28 Q11 24.5 15 24.5 H25 Q29 24.5 31 28 Z" fill="#3E4A47" /><path d="M16.5 24.5 L18 11 H22 L23.5 24.5 Z" fill="#FBF8EF" /><path d="M18.00 11 H22.00 L22.33 14 H17.67 Z" fill="#B5543B" /><path d="M17.33 17 H22.67 L23.00 20 H17.00 Z" fill="#B5543B" /><path d="M16.67 23 H23.33 L23.50 24.5 H16.50 Z" fill="#B5543B" /><path d="M16.5 24.5 L18 11 H22 L23.5 24.5 Z" fill="none" stroke="#8FA09B" strokeWidth="0.6" strokeLinejoin="round" /><path d="M19 24.5 V21.8 Q20 20.4 21 21.8 V24.5 Z" fill="#3E4A47" /><rect x="16.6" y="9.8" width="6.8" height="1.4" fill="#3E4A47" /><rect x="18" y="6" width="4" height="3.8" fill="#9DBDB6" /><line x1="20" y1="6" x2="20" y2="9.8" stroke="#3E4A47" strokeWidth="0.5" /><path d="M17.2 6 L20 3 L22.8 6 Z" fill="#B5543B" /><line x1="20" y1="3" x2="20" y2="1.6" stroke="#3E4A47" strokeWidth="0.8" strokeLinecap="round" /></>
  ),
  'lighthouse-striped-lit': (
    <><path d="M18.2 7.9 L0.5 3 V12.5 Z" fill="#F2DC9C" opacity="0.85" /><path d="M21.8 7.9 L39.5 3 V12.5 Z" fill="#F2DC9C" opacity="0.85" /><path d="M9 28 Q11 24.5 15 24.5 H25 Q29 24.5 31 28 Z" fill="#3E4A47" /><path d="M16.5 24.5 L18 11 H22 L23.5 24.5 Z" fill="#FBF8EF" /><path d="M18.00 11 H22.00 L22.33 14 H17.67 Z" fill="#B5543B" /><path d="M17.33 17 H22.67 L23.00 20 H17.00 Z" fill="#B5543B" /><path d="M16.67 23 H23.33 L23.50 24.5 H16.50 Z" fill="#B5543B" /><path d="M16.5 24.5 L18 11 H22 L23.5 24.5 Z" fill="none" stroke="#8FA09B" strokeWidth="0.6" strokeLinejoin="round" /><path d="M19 24.5 V21.8 Q20 20.4 21 21.8 V24.5 Z" fill="#3E4A47" /><rect x="16.6" y="9.8" width="6.8" height="1.4" fill="#3E4A47" /><rect x="18" y="6" width="4" height="3.8" fill="#D9A441" /><line x1="20" y1="6" x2="20" y2="9.8" stroke="#3E4A47" strokeWidth="0.5" /><path d="M17.2 6 L20 3 L22.8 6 Z" fill="#B5543B" /><line x1="20" y1="3" x2="20" y2="1.6" stroke="#3E4A47" strokeWidth="0.8" strokeLinecap="round" /></>
  ),
  'dock': (
    <><rect x="6" y="21" width="2.2" height="7" fill="#3E4A47" /><rect x="15" y="21" width="2.2" height="7" fill="#3E4A47" /><rect x="24" y="21" width="2.2" height="7" fill="#3E4A47" /><rect x="33" y="21" width="2.2" height="7" fill="#3E4A47" /><rect x="2" y="18.6" width="36" height="2.8" rx="0.6" fill="#8A5A3C" /><line x1="3" y1="20" x2="37" y2="20" stroke="#E3B98F" strokeWidth="0.6" strokeLinecap="round" /><rect x="34" y="16" width="2.4" height="2.6" rx="0.5" fill="#1F2A2A" /><rect x="27" y="14.6" width="4.4" height="4" fill="#D9A441" /><line x1="27" y1="16.6" x2="31.4" y2="16.6" stroke="#8A5A3C" strokeWidth="0.6" /><rect x="22" y="15.4" width="3.6" height="3.2" rx="1" fill="#B5543B" /></>
  ),
  'dock-crane': (
    <><rect x="6" y="21" width="2.2" height="7" fill="#3E4A47" /><rect x="15" y="21" width="2.2" height="7" fill="#3E4A47" /><rect x="24" y="21" width="2.2" height="7" fill="#3E4A47" /><rect x="33" y="21" width="2.2" height="7" fill="#3E4A47" /><rect x="2" y="18.6" width="36" height="2.8" rx="0.6" fill="#8A5A3C" /><line x1="3" y1="20" x2="37" y2="20" stroke="#E3B98F" strokeWidth="0.6" strokeLinecap="round" /><rect x="34" y="16" width="2.4" height="2.6" rx="0.5" fill="#1F2A2A" /><line x1="9.5" y1="3" x2="30" y2="5.5" stroke="#B5543B" strokeWidth="1.5" strokeLinecap="round" /><line x1="9.5" y1="3" x2="4" y2="7" stroke="#B5543B" strokeWidth="1.5" strokeLinecap="round" /><line x1="26.5" y1="5.2" x2="26.5" y2="11" stroke="#3E4A47" strokeWidth="0.6" /><rect x="23.5" y="11" width="6" height="4" fill="#2E4A6B" /><rect x="8.4" y="3" width="2.2" height="15.6" fill="#3E4A47" /><rect x="6" y="11" width="7" height="5" rx="0.6" fill="#D9A441" /><rect x="7.2" y="12.2" width="2.6" height="2" fill="#2E4A6B" /><rect x="3" y="6.4" width="2.4" height="2.6" fill="#3E4A47" /></>
  ),
  'champagne': (
    <><g transform="translate(4 7.6) scale(0.74) rotate(22 20 24)"><path d="M16 27 V15 Q16 12 18.3 10.5 V6 H21.7 V10.5 Q24 12 24 15 V27 Q24 28 23 28 H17 Q16 28 16 27 Z" fill="#3F6E68" /><rect x="16" y="17" width="8" height="5.5" fill="#F1E6CC" /><line x1="17.5" y1="19" x2="22.5" y2="19" stroke="#B5543B" strokeWidth="0.8" strokeLinecap="round" /><line x1="18.5" y1="20.8" x2="21.5" y2="20.8" stroke="#8A5A3C" strokeWidth="0.6" strokeLinecap="round" /><line x1="17.4" y1="13.5" x2="17.4" y2="15.8" stroke="#9DBDB6" strokeWidth="0.7" strokeLinecap="round" /><rect x="18" y="5.2" width="4" height="4.2" rx="0.6" fill="#D9A441" /><rect x="18.3" y="2.6" width="3.4" height="3" rx="1.2" fill="#D9A441" /></g></>
  ),
  'champagne-pop': (
    <><g transform="translate(4 7.6) scale(0.74) rotate(22 20 24)"><path d="M16 27 V15 Q16 12 18.3 10.5 V6 H21.7 V10.5 Q24 12 24 15 V27 Q24 28 23 28 H17 Q16 28 16 27 Z" fill="#3F6E68" /><rect x="16" y="17" width="8" height="5.5" fill="#F1E6CC" /><line x1="17.5" y1="19" x2="22.5" y2="19" stroke="#B5543B" strokeWidth="0.8" strokeLinecap="round" /><line x1="18.5" y1="20.8" x2="21.5" y2="20.8" stroke="#8A5A3C" strokeWidth="0.6" strokeLinecap="round" /><line x1="17.4" y1="13.5" x2="17.4" y2="15.8" stroke="#9DBDB6" strokeWidth="0.7" strokeLinecap="round" /><rect x="18" y="5.2" width="4" height="4.2" rx="0.6" fill="#D9A441" /><circle cx="20" cy="4" r="1.5" fill="#F1E6CC" /><circle cx="18.2" cy="2.4" r="1.1" fill="#F1E6CC" /><circle cx="21.9" cy="2" r="1.2" fill="#F1E6CC" /><circle cx="20.2" cy="0.4" r="0.9" fill="#F1E6CC" /><circle cx="17" cy="-0.6" r="0.7" fill="#D9A441" /><circle cx="23.4" cy="-1.2" r="0.7" fill="#D9A441" /><circle cx="19.4" cy="-2.6" r="0.6" fill="#D9A441" /><line x1="16.4" y1="3.4" x2="14.4" y2="1.6" stroke="#D9A441" strokeWidth="0.8" strokeLinecap="round" /><line x1="23.6" y1="3.4" x2="25.8" y2="1.8" stroke="#D9A441" strokeWidth="0.8" strokeLinecap="round" /><rect x="18.6" y="-8" width="3.2" height="3.6" rx="1.2" fill="#E3B98F" transform="rotate(14 20 -6)" /></g></>
  ),
  'buoy': (
    <><g transform="rotate(7 20 26)"><line x1="20" y1="6.5" x2="20" y2="3.4" stroke="#3E4A47" strokeWidth="0.8" strokeLinecap="round" /><circle cx="20" cy="3" r="1.3" fill="#D9A441" /><rect x="18.2" y="6.2" width="3.6" height="3.6" fill="#3E4A47" /><path d="M17.4 9.8 H22.6 L26 23 H14 Z" fill="#B5543B" /><path d="M16.2 14.4 H23.8 L25 19 H15 Z" fill="#F1E6CC" /><path d="M11 22.6 H29 Q28.4 28 24 28 H16 Q11.6 28 11 22.6 Z" fill="#3E4A47" /></g></>
  ),
  'anchor': (
    <><g fill="none" stroke="#3E4A47" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="20" cy="5.6" r="2.4" /><line x1="20" y1="8" x2="20" y2="26.5" /><line x1="14" y1="12" x2="26" y2="12" /><path d="M9.5 18 Q10.5 26.5 20 26.5 Q29.5 26.5 30.5 18" /></g><path d="M9.5 15 L6.6 20 H12.4 Z" fill="#3E4A47" /><path d="M30.5 15 L27.6 20 H33.4 Z" fill="#3E4A47" /></>
  ),
  'wheel': (
    <><g fill="none" stroke="#8A5A3C" strokeLinecap="round"><g strokeWidth="1.6"><line x1="23.00" y1="16.00" x2="32.20" y2="16.00" /><line x1="22.12" y1="18.12" x2="28.63" y2="24.63" /><line x1="20.00" y1="19.00" x2="20.00" y2="28.20" /><line x1="17.88" y1="18.12" x2="11.37" y2="24.63" /><line x1="17.00" y1="16.00" x2="7.80" y2="16.00" /><line x1="17.88" y1="13.88" x2="11.37" y2="7.37" /><line x1="20.00" y1="13.00" x2="20.00" y2="3.80" /><line x1="22.12" y1="13.88" x2="28.63" y2="7.37" /></g><circle cx="20" cy="16" r="8.4" strokeWidth="2.2" /></g><circle cx="20" cy="16" r="2.6" fill="#D9A441" /></>
  ),
  'message': (
    <><g transform="rotate(-24 20 18)"><rect x="6" y="14" width="3.6" height="4" rx="0.8" fill="#8A5A3C" /><path d="M9 13 H13 Q14.5 10.5 17 10.5 H31 Q34 10.5 34 13.5 V18.5 Q34 21.5 31 21.5 H17 Q14.5 21.5 13 19 H9 Z" fill="#9DBDB6" stroke="#3F6E68" strokeWidth="0.7" strokeLinejoin="round" /><rect x="18" y="12.6" width="11" height="6.8" rx="1" fill="#F1E6CC" /><line x1="23.5" y1="12.6" x2="23.5" y2="19.4" stroke="#B5543B" strokeWidth="1" /></g><path d="M0 25.5 Q3.3 24 6.6 25.5 T13.3 25.5 T20 25.5 T26.6 25.5 T33.3 25.5 T40 25.5 V29 H0 Z" fill="#9DBDB6" /><path d="M0.6 25.5 Q3.3 24 6.6 25.5 T13.3 25.5 T20 25.5 T26.6 25.5 T33.3 25.5 T39.4 25.5" fill="none" stroke="#3F6E68" strokeWidth="1" strokeLinecap="round" /></>
  ),
  'parrot-red': (
    <><line x1="7" y1="24" x2="33" y2="24" stroke="#8A5A3C" strokeWidth="1.8" strokeLinecap="round" /><path d="M17.4 20.5 L10.6 31 L14.4 31 L20.4 21.6 Z" fill="#B5543B" /><path d="M17.5 23.4 Q13.4 16 17 10 Q20 6 24 8 Q27 11 25.5 17 Q24 22 20.5 23.6 Z" fill="#B5543B" /><circle cx="22.4" cy="8.4" r="4.3" fill="#B5543B" /><path d="M17.6 12 Q14.8 17 17.4 22.2 Q21.2 20 21.6 14 Z" fill="#D9A441" /><path d="M16.3 17.6 Q16.2 20 17.4 22.2 Q19.6 20.9 20.7 18.5 Z" fill="#2E4A6B" /><circle cx="24.2" cy="8.6" r="2.3" fill="#FBF8EF" /><circle cx="24.4" cy="8.1" r="0.75" fill="#1F2A2A" /><path d="M25.9 6.5 Q30 6.8 29.2 11.6 Q27.8 10 26 9.9 Z" fill="#F1E6CC" /><path d="M26 9.9 Q27.2 10.4 27.4 11.8 Q26 11.8 25.4 10.6 Z" fill="#1F2A2A" /><path d="M19.4 23 V24.6 M21.6 23 V24.6" fill="none" stroke="#1F2A2A" strokeWidth="0.9" strokeLinecap="round" /></>
  ),
  'parrot-blue': (
    <><line x1="7" y1="24" x2="33" y2="24" stroke="#8A5A3C" strokeWidth="1.8" strokeLinecap="round" /><path d="M17.4 20.5 L10.6 31 L14.4 31 L20.4 21.6 Z" fill="#2E4A6B" /><path d="M17.5 23.4 Q13.4 16 17 10 Q20 6 24 8 Q27 11 25.5 17 Q24 22 20.5 23.6 Z" fill="#2E4A6B" /><path d="M25.2 11.5 Q26.6 16 24.4 20 Q22.6 22.8 20.5 23.6 Q23.6 18 23.2 11.6 Z" fill="#D9A441" /><circle cx="22.4" cy="8.4" r="4.3" fill="#2E4A6B" /><path d="M17.6 12 Q14.8 17 17.4 22.2 Q21.2 20 21.6 14 Z" fill="#3F6E68" /><path d="M16.3 17.6 Q16.2 20 17.4 22.2 Q19.6 20.9 20.7 18.5 Z" fill="#9DBDB6" /><circle cx="24.2" cy="8.6" r="2.3" fill="#FBF8EF" /><circle cx="24.4" cy="8.1" r="0.75" fill="#1F2A2A" /><path d="M25.9 6.5 Q30 6.8 29.2 11.6 Q27.8 10 26 9.9 Z" fill="#1F2A2A" /><path d="M26 9.9 Q27.2 10.4 27.4 11.8 Q26 11.8 25.4 10.6 Z" fill="#1F2A2A" /><path d="M19.4 23 V24.6 M21.6 23 V24.6" fill="none" stroke="#1F2A2A" strokeWidth="0.9" strokeLinecap="round" /></>
  ),
  'cockatoo-pink': (
    <><line x1="7" y1="24" x2="33" y2="24" stroke="#8A5A3C" strokeWidth="1.8" strokeLinecap="round" /><path d="M17.6 21 L14 27.6 L17.4 27.6 L20.6 22 Z" fill="#E9A9A0" /><path d="M20.4 5.6 Q17.4 1 21.6 0.8 Q20.8 3 22.6 4.8 Z" fill="#D9705E" /><path d="M22.4 4.8 Q21.6 0.6 25.4 1.6 Q24 3 24.6 5.2 Z" fill="#D9705E" /><path d="M17.5 23.4 Q13.4 16 17 10 Q20 6 24 8 Q27 11 25.5 17 Q24 22 20.5 23.6 Z" fill="#E9A9A0" /><circle cx="22.4" cy="8.4" r="4.3" fill="#E9A9A0" /><path d="M17.6 12 Q14.8 17 17.4 22.2 Q21.2 20 21.6 14 Z" fill="#F6D6CF" /><path d="M16.3 17.6 Q16.2 20 17.4 22.2 Q19.6 20.9 20.7 18.5 Z" fill="#FBF8EF" /><circle cx="24.4" cy="8.1" r="0.75" fill="#1F2A2A" /><path d="M25.9 6.5 Q30 6.8 29.2 11.6 Q27.8 10 26 9.9 Z" fill="#F1E6CC" /><path d="M26 9.9 Q27.2 10.4 27.4 11.8 Q26 11.8 25.4 10.6 Z" fill="#1F2A2A" /><path d="M19.4 23 V24.6 M21.6 23 V24.6" fill="none" stroke="#1F2A2A" strokeWidth="0.9" strokeLinecap="round" /></>
  ),
  'parrot-green': (
    <><line x1="7" y1="24" x2="33" y2="24" stroke="#8A5A3C" strokeWidth="1.8" strokeLinecap="round" /><path d="M17.6 21 L14 27.6 L17.4 27.6 L20.6 22 Z" fill="#5E9E63" /><path d="M17.5 23.4 Q13.4 16 17 10 Q20 6 24 8 Q27 11 25.5 17 Q24 22 20.5 23.6 Z" fill="#5E9E63" /><circle cx="22.4" cy="8.4" r="4.3" fill="#5E9E63" /><path d="M17.6 12 Q14.8 17 17.4 22.2 Q21.2 20 21.6 14 Z" fill="#3F6E68" /><path d="M16.3 17.6 Q16.2 20 17.4 22.2 Q19.6 20.9 20.7 18.5 Z" fill="#B5543B" /><circle cx="24.2" cy="8.6" r="2.3" fill="#FBF8EF" /><circle cx="24.4" cy="8.1" r="0.75" fill="#1F2A2A" /><path d="M25.9 6.5 Q30 6.8 29.2 11.6 Q27.8 10 26 9.9 Z" fill="#F1E6CC" /><path d="M26 9.9 Q27.2 10.4 27.4 11.8 Q26 11.8 25.4 10.6 Z" fill="#1F2A2A" /><path d="M19.4 23 V24.6 M21.6 23 V24.6" fill="none" stroke="#1F2A2A" strokeWidth="0.9" strokeLinecap="round" /></>
  ),
  'parrot-grey': (
    <><line x1="7" y1="24" x2="33" y2="24" stroke="#8A5A3C" strokeWidth="1.8" strokeLinecap="round" /><path d="M17.6 21 L14 27.6 L17.4 27.6 L20.6 22 Z" fill="#B5543B" /><path d="M17.5 23.4 Q13.4 16 17 10 Q20 6 24 8 Q27 11 25.5 17 Q24 22 20.5 23.6 Z" fill="#9AA8A3" /><circle cx="22.4" cy="8.4" r="4.3" fill="#9AA8A3" /><path d="M17.6 12 Q14.8 17 17.4 22.2 Q21.2 20 21.6 14 Z" fill="#6F837D" /><path d="M16.3 17.6 Q16.2 20 17.4 22.2 Q19.6 20.9 20.7 18.5 Z" fill="#3E4A47" /><circle cx="24.2" cy="8.6" r="2.3" fill="#FBF8EF" /><circle cx="24.4" cy="8.1" r="0.75" fill="#1F2A2A" /><path d="M25.9 6.5 Q30 6.8 29.2 11.6 Q27.8 10 26 9.9 Z" fill="#1F2A2A" /><path d="M26 9.9 Q27.2 10.4 27.4 11.8 Q26 11.8 25.4 10.6 Z" fill="#1F2A2A" /><path d="M19.4 23 V24.6 M21.6 23 V24.6" fill="none" stroke="#1F2A2A" strokeWidth="0.9" strokeLinecap="round" /></>
  ),
  'barrel': (
    <><path d="M14 10.4 Q11.4 19 14 28 H26 Q28.6 19 26 10.4 Z" fill="#8A5A3C" /><path d="M17 10 Q15.8 19 17 28 M20 10 V28 M23 10 Q24.2 19 23 28" fill="none" stroke="#3E4A47" strokeWidth="0.5" opacity="0.45" /><path d="M13.2 12.6 H26.8 L27.1 14.4 H12.9 Z" fill="#3E4A47" /><path d="M12.9 23 H27.1 L26.8 24.8 H13.2 Z" fill="#3E4A47" /><ellipse cx="20" cy="10.4" rx="6" ry="2" fill="#8A5A3C" /><ellipse cx="20" cy="10.4" rx="6" ry="2" fill="none" stroke="#3E4A47" strokeWidth="0.6" /><ellipse cx="20" cy="10.8" rx="4.9" ry="1.4" fill="#E3B98F" /></>
  ),
  'barrel-spilled': (
    <><g transform="rotate(-5 16 21)"><path d="M6 14.6 Q15.5 12 25 14.6 V26.6 Q15.5 29.2 6 26.6 Z" fill="#8A5A3C" /><path d="M6.4 17.6 Q15.5 16.4 24.6 17.6 M6.4 20.6 H24.6 M6.4 23.6 Q15.5 24.8 24.6 23.6" fill="none" stroke="#3E4A47" strokeWidth="0.5" opacity="0.45" /><path d="M9 13.9 L10.8 13.5 V27.7 L9 27.3 Z" fill="#3E4A47" /><path d="M20.2 13.5 L22 13.9 V27.3 L20.2 27.7 Z" fill="#3E4A47" /><ellipse cx="25" cy="20.6" rx="2" ry="6" fill="#3E4A47" /><ellipse cx="25.3" cy="24.4" rx="1" ry="1.9" fill="#B5543B" /></g><path d="M22.6 28 Q23.6 25.2 26.4 25 Q30 24.4 32.6 26.6 Q36 26 39 28 Z" fill="#B5543B" /></>
  ),
  'albatross': (
    <><path d="M23 16.5 Q29.5 8.5 38.8 6.4 Q33.4 11.4 29.6 14.8 Q27 17.4 24.6 18.6 Z" fill="#3E4A47" /><path d="M15.4 17.6 L9.2 20.8 L15.6 20.4 Z" fill="#3E4A47" /><path d="M14.2 18.8 Q15.6 15.2 21.4 14.9 Q26.6 14.6 29.4 16 Q27.6 20.6 20.6 21 Q16.4 21 14.2 18.8 Z" fill="#FBF8EF" stroke="#8FA09B" strokeWidth="0.6" strokeLinejoin="round" /><circle cx="29" cy="15.2" r="2.7" fill="#FBF8EF" stroke="#8FA09B" strokeWidth="0.6" /><path d="M25.8 15.4 L26.6 16.4 Q27.8 18.2 29.4 17.4 L28.6 14.2 Z" fill="#FBF8EF" /><path d="M31.2 14.3 L36.6 15.3 Q37.4 16.6 36.2 17.3 Q36 16.5 35.2 16.5 L31.4 16.3 Z" fill="#E3B98F" /><path d="M35.9 15.2 Q37.4 15.8 36.2 17.3" fill="none" stroke="#B5543B" strokeWidth="0.6" strokeLinecap="round" /><circle cx="29.7" cy="14.7" r="0.6" fill="#1F2A2A" /><path d="M28.6 13.9 Q29.6 13.5 30.6 14" fill="none" stroke="#3E4A47" strokeWidth="0.5" strokeLinecap="round" /><path d="M21.6 16.2 Q13.5 8.4 1.2 8.6 Q8.4 11.6 13.4 15 Q16.8 17.6 19.6 19.4 Q21.6 18.6 21.6 16.2 Z" fill="#3E4A47" /><path d="M5 9.6 Q11 11.2 16.4 15.6" fill="none" stroke="#6F837D" strokeWidth="0.7" strokeLinecap="round" /></>
  ),
};

export function Scenery({ kind, size = 1, label }: { kind: SceneryKind; size?: number; label?: string }) {
  return (
    <svg
      viewBox="0 0 40 32"
      width={40 * size}
      height={32 * size}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {DRAWINGS[kind]}
    </svg>
  );
}
