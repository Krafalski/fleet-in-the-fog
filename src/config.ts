// Settings you flip while building. Check these before you ship.

// ---------- test game ----------
// Set this to true to ask for a test game: the board turns burgundy and every answer is all junks.
// Test games are saved separately, so they never mix with real ones.
const WANT_TEST_GAME = false;

// A test game only switches on where the page is served from one of these places.
// Anywhere else the game stays real, even if WANT_TEST_GAME was left on by accident.
const TEST_HOSTS = [
  'localhost',   // npm run dev, any port (localhost:5173 and so on)
  '127.0.0.1',   // the same thing by number
  'DEVVIT_TEST_HOST_GOES_HERE', // placeholder: put the host name of your Devvit playtest here once you know it
];

// The host name is the part of the address before the port: 'localhost' in 'localhost:5173'.
// There is no window when the tests run (npm run test), so tests always get the real game.
const inTestPlace = typeof window !== 'undefined' && TEST_HOSTS.includes(window.location.hostname);
if (WANT_TEST_GAME && !inTestPlace && typeof window !== 'undefined') {
  console.warn('WANT_TEST_GAME is on in config.ts, but this is not a test place, so the real game is running. Turn it off before you ship.');
}

// Dev tools (the Reset bar at the top) show only on your own computer's dev server:
// localhost or 127.0.0.1 on a port starting with 5, like localhost:5173. Never on Reddit.
export const devTools = typeof window !== 'undefined'
  && ['localhost', '127.0.0.1'].includes(window.location.hostname)
  && window.location.port.startsWith('5');

// What the rest of the app reads. True only when both are true.
export const testGame = WANT_TEST_GAME && inTestPlace;

// Fleet screen, the "First year / Second year / Third year" strip under a boat.
// true = always show all three colorways. false = show only the ones the player has unlocked.
export const showAllColorways = false;

// Which color theme the game wears. 'harbor' is the one in theme.css under :root.
// To add another, see the note at the bottom of theme.css.
export const THEME = 'harbor';

// When each day's new game starts, as a clock time in one time zone. Daylight saving is handled for you.
// '00:00' in 'UTC' is midnight UTC. For 7:30 in the evening, New York time: '19:30' and 'America/New_York'.
// A game that starts after noon is named for the next day, because that is when most people play it.
export const NEW_GAME_TIME = '00:00';
export const NEW_GAME_ZONE = 'UTC';

// The most times one ship can appear in an answer. 2 is gentle, 3 allows surprises, 5 is classic Mastermind.
export const MAX_REPEATS = 2;
