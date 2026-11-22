# Testing with address add-ons

Add these to the end of the address while the game runs on your computer (`npm run dev`).
They only work on localhost / 127.0.0.1 (and any host listed in `TEST_HOSTS` in `src/config.ts`).
On your live site or on Reddit they are ignored, so players always get the real game.

The code for them is in `src/devUrl.ts`.

## The add-ons

| Add-on | Values | What it does |
|---|---|---|
| `?test` | none | Test game: burgundy board, every answer is all junks. Saved separately from real games. |
| `?fresh` | none | Wipe everything saved first (streaks, boats, repairs, games). Same as **Reset all**. |
| `?seed=30` | a positive whole number | Pretend you solved the last 30 days (1 = yesterday). Then win today for real. |
| `&skip=1,2` | positive whole numbers, separated by `,` | Use with `seed`: leave these days out, counted back from today (1 = yesterday, 2 = the day before). They don't have to be in a row: `&skip=3,10` leaves out two separate days. |
| `&mode=hard` | `easy`, `hard` or `all` (no value: `easy`) | Use with `seed`: which games to seed (`easy` = Bay, `hard` = Open sea). `all` seeds both. |
| `?add-golden-spyglass=3` | a positive whole number | Add 3 golden (free) spyglasses. |
| `?add-repairs=2` | a positive whole number | Add 2 one-day streak repairs. |
| `?add-long-repairs=1` | a positive whole number | Add 1 three-day streak repair. |
| `?restart-today=easy` | `easy`, `hard` or `all` (no value: `all`) | Play today's game again from the start. `all` does both (same as **Reset today**). |

- The first add-on starts with `?`. Every one after it starts with `&`.

### Stacking add-ons

Add-ons stack: put as many as you like in one address. For example:

`localhost:5173/?test&fresh&seed=31&skip=4,5&mode=all`

1. `?test` uses the test game (all junks, test data only).
2. `&fresh` wipes the test data first.
3. `&seed=31&skip=4,5&mode=all` fakes wins in the Bay and on the Open sea (`easy` and `hard`) for the last 31 days, except 4 and 5 days ago.

The result: winning today gives you a 4-day streak (3 seeded days plus today) with a 2-day gap behind it, so you get the repair offer. Using the repair joins everything up into a 30-day streak (mended days don't add to the count: 29 seeded days plus today) and earns the Houseboat.

- They run in this order: `fresh`, then `restart-today`, then `add-golden-spyglass`, then `add-repairs` / `add-long-repairs`, then `seed`. So `?fresh&seed=29` always starts clean.
- After they run, `fresh`, `restart-today`, `add-golden-spyglass`, `add-repairs`, `add-long-repairs`, `seed`, `skip` and `mode` disappear from the address, so reloading the page doesn't seed again. `?test` stays.
- Any add-on at all (even just `?test`) prints today's answers in the browser console, like `Wednesday, November 18. Easy: R, G, B, P || Hard: B, R, R, P, P`. The letters are the colors: **Y**ellow, **P**urple, **R**ed, **G**reen, **B**lue, **C**oral. With `?test` it shows the test answer (all P).
- Seeding goes into whichever data you're using: test data with `?test`, real data without.
- Each seeded win takes a random number of guesses (1 up to the mode's limit), with no hints.
- The Dev bar at the top says what ran (for example "wiped, seeded 29 easy days") and has a link to switch between **Test** and **Real**.
- Today must not be finished yet. If it is, add `&restart-today=all` (or tap **Reset today** in the Dev bar).

## Copy-paste scenarios

Paste after `localhost:5173/` (use your own port), then win today's game.
In a test game, today's answer is all junks: tap the Purple junk 4 times (Bay) and Log guess.

| Paste this | Then win today, and you get |
|---|---|
| `?test&fresh` | First win: the Paper boat |
| `?test&fresh&seed=2` | 3-day streak: the Rowboat |
| `?test&fresh&seed=6` | 7-day streak: the Canoe |
| `?test&fresh&seed=29` | 30-day streak: the Houseboat (and every smaller boat) |
| `?test&fresh&seed=59` | 60-day streak: the Ferry |
| `?test&fresh&seed=359` | 360-day streak: the Golden galleon (all 17 streak boats) |
| `?test&fresh&seed=360` | Year-2 colors for the Paper boat |
| `?test&fresh&seed=700` | Year-2 colors for every boat up to the Ocean liner |
| `?test&fresh&seed=900` | Year 3 for boats up to the Longship, year 2 for the rest |
| `?test&fresh&seed=1080` | The Fleet Admiral cup |
| `?test&fresh&seed=5&skip=1,2` | Missed 2 days: the repair offer (test games start with 2 one-day and 2 three-day repairs) |
| `?test&fresh&seed=15&skip=1,2,3,4,5,6,7,8,9,10` | Gap too big to repair: the streak starts over at 1 |
| `?fresh&seed=2` | Real data: 2 days played earns your first repair (the next ones come on days 20, 45, 75…) |
| `?fresh&seed=5&skip=1,2&add-repairs=2` | Real data: missed 2 days, with 2 one-day repairs to mend them |
| `?test&fresh&seed=20&mode=hard` | 20 days of Hard wins, to fill in the Hard sightings |
| `?test&restart-today=hard` | Keep everything, just play today's Hard again |
| `?test&fresh&add-golden-spyglass=1` | Hard: the first spyglass is golden (+0), the next costs +2 |

Other things to try:

- **Ghost ship:** lose a game (use up every guess without solving it).
- **Colors:** in Your fleet, double tap a boat to switch between its unlocked colors.
- **Back to real data:** remove `?test` from the address, or tap **Real** in the Dev bar.

## Notes

- Only days solved on their own day count for the streak. Opening an old day from the Harbor log won't add to it.
- `console-streak-testing.js` still works if you'd rather type commands in the browser console, but the add-ons above do the same things.
- The automated tests (`npm run test`) check seeding too, in `src/api.test.ts`.

## Keep trying, keyboard, ghosts (Nov 22)
| Try | What you should see |
|---|---|
| `?test&fresh`, lose the Bay (never use the Purple junk) | Keep trying: 10 more rows, a "Try 2" line, earlier rows greyer |
| `?fresh`, lose the Open sea | The dark ghost ship on the results card and in your fleet |
| `?fresh`, lose the Bay | The light ghost ship |
| Laptop: type `y p r g` then Enter | Ships go in, the guess is logged |
| Laptop: type `y p r g`, press ← twice, type `b` | The marker sits on spot 3, the red mailboat becomes a blue tug, the marker moves to spot 4 |
