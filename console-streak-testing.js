// console-streak-testing.js
// Snippets to paste into the browser console (right-click > Inspect > Console) while the game
// runs on localhost. They fake PAST days, then you play TODAY for real to see what happens.
// Not part of the game: nothing imports this file, and it never ships.
//
// The loop:  resetStreak()  ->  seed(...)  ->  reload the page  ->  win today.
// Paste the block below again after every reload (a reload forgets it).
// The game must not be finished today yet; if it is, click "Reset today" in the Dev bar first.
// (Or use the Dev bar at the top: "Reset today" lets you play today again, "Reset all" wipes everything.)
// Test game answer is all junks: tap Junk 4 times (Easy) and Log guess.

// ----- 1. paste this block once per page load -----

// Which saved data to touch. The game tells us ('fog' for the real game, 'fog-test' for the test game).
window.STORE = window.FOG_STORE || 'fog';
console.log(`Streak testing is using "${window.STORE}" data.`);

// Pretend you solved the last n days (1 = yesterday). skip = days to leave out, counted back from today.
// mode = 'easy' or 'hard'.
window.seed = (n, skip = [], mode = 'easy') => {
  const key = `${window.STORE}:results`;
  const r = JSON.parse(localStorage.getItem(key) || '{}');
  for (let i = 1; i <= n; i++) {
    if (skip.includes(i)) continue;
    const day = new Date(Date.now() - i * 864e5).toISOString().slice(0, 10);
    r[`${day}:${mode}`] = { dateKey: day, mode, status: 'won', guesses: 1 + Math.floor(Math.random() * 8), rounds: 1, hints: 0, playedOn: day };
  }
  localStorage.setItem(key, JSON.stringify(r));
  return `seeded ${n - skip.length} days into "${window.STORE}". Now reload the page and win today.`;
};

// Wipe streaks, boats, repairs and saved games for the chosen STORE.
window.resetStreak = () => {
  const gone = Object.keys(localStorage).filter((k) => k.startsWith(`${window.STORE}:`));
  gone.forEach((k) => localStorage.removeItem(k));
  return `removed ${gone.length} keys. Reload the page.`;
};

// Peek at what's saved.
window.showSaved = () => {
  for (const name of ['results', 'badges', 'repairs', 'looks']) {
    console.log(name, JSON.parse(localStorage.getItem(`${window.STORE}:${name}`) || 'null'));
  }
};

// ----- 2. scenarios (run one, reload, win today) -----
// resetStreak(); seed(2)                         -> 3-day streak, Paper boat
// resetStreak(); seed(4)                         -> 5-day streak, Rowboat
// resetStreak(); seed(6)                         -> 7-day streak, Canoe
// resetStreak(); seed(29)                        -> 30-day streak, Houseboat (plus every smaller boat)
// resetStreak(); seed(59)                        -> 60-day streak, Ferry
// resetStreak(); seed(359)                       -> 360-day streak, Golden galleon
// resetStreak(); seed(5, [1, 2])                 -> missed 2 days: repair offer (test game gives 2 one-day + 2 three-day)
// resetStreak(); seed(15, [1,2,3,4,5,6,7,8,9,10]) -> gap too big to repair: streak starts over, greyed Paper boat
// resetStreak(); seed(30)                        -> 30 days played earns your first repair (real game)
// Ghost ship: lose a game (use up every guess without solving it).
//
// Notes
// - Only days solved on their own day count; opening an old day from the Harbor log won't add to the streak.
// - If today is already finished, seeding won't replay it: use "Rez