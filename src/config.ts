// Settings you flip while building. Check these before you ship.

// ---------- test game ----------
// Add ?test to the address to play a test game: the board turns burgundy and every answer is all junks.
//     localhost:5173/?test
// Test games are saved separately, so they never mix with real ones.
// More address add-ons (seeding streaks and so on) are in TESTING.md and src/devUrl.ts.

// ?test and the other add-ons only work where the page is served from one of these places.
// Anywhere else (your live site, Reddit) they are ignored and the real game runs.
export const TEST_HOSTS = [
  'localhost',   // npm run dev, any port (localhost:5173 and so on)
  '127.0.0.1',   // the same thing by number
  'DEVVIT_TEST_HOST_GOES_HERE', // placeholder: put the host name of your Devvit playtest here once you know it
];

// The host name is the part of the address before the port: 'localhost' in 'localhost:5173'.
// There is no window when the tests run (npm run test), so tests always get the real game.
export const inTestPlace = typeof window !== 'undefined' && TEST_HOSTS.includes(window.location.hostname);
// The add-ons after the ? in the address, e.g. ?test&seed=30. Empty outside a test place.
export const urlParams = new URLSearchParams(inTestPlace ? window.location.search : '');

// Dev tools (the Reset bar at the top) show only on your own computer's dev server:
// localhost or 127.0.0.1 on a port starting with 5, like localhost:5173. Never on Reddit.
export const devTools = typeof window !== 'undefined'
  && ['localhost', '127.0.0.1'].includes(window.location.hostname)
  && window.location.port.startsWith('5');

// What the rest of the app reads: true when the address has ?test (in a test place only).
export const testGame = urlParams.has('test');

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

// The most times one ship can appear in an answer, in every mode.
// null = no limit (classic Mastermind: some days the whole fleet can be one boat). 2 is gentle, 3 allows surprises.
export const MAX_REPEATS: number | null = null;
