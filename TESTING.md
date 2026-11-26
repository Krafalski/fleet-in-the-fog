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
| `&mode=hard` | `easy`, `hard` or `all` (no value: `easy`) | Use with `seed`: which games to seed (`easy` = Bay, `hard` = Open Sea). `all` seeds both. |
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
3. `&seed=31&skip=4,5&mode=all` fakes wins in the Bay and on the Open Sea (`easy` and `hard`) for the last 31 days, except 4 and 5 days ago.

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
| `?fresh&seed=4` | Real data: 4 days played earns your first repair (the next ones come on days 25, 52, 75, 105…) |
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
| `?fresh`, lose the Open Sea | The dark ghost ship on the results card and in your fleet |
| `?fresh`, lose the Bay | The light ghost ship |
| Laptop: type `y p r g` then Enter | Ships go in, the guess is logged |
| Laptop: type `y p r g`, press ← twice, type `b` | The marker sits on spot 3, the red mailboat becomes a blue tug, the marker moves to spot 4 |

## Two tracks: Bay and Open Sea boats (Nov 26)
| Try | What you should see |
|---|---|
| `?fresh&seed=29&mode=easy`, then win today's Bay | Bay boats up to the houseboat; no Open Sea looks yet |
| `?fresh&seed=29&mode=all`, win the Bay, then the Open Sea | Bay card: "1 of 15" (Bay and Open Sea looks the 30-day streak unlocked); Open Sea card: the Open Sea houseboat |
| Fleet → tap a boat | Four looks: Bay, Open Sea, Bay · gold, Open Sea · its gem. Earned ones can be picked; the rest say what they need |
| `?fresh&seed=399&mode=easy`, win the Bay | Gold looks up to the houseboat (390 wins), none after |

## Testing the win card with more than one boat (Nov 26)
Seeded days don't hand out boats by themselves: everything they unlock arrives together on your first real win, so one win can bring several boats. The card then says "1 of 2" (or more), flips by itself every ~3 seconds (3 times around), and stops as soon as you touch it.

| Try | Then | What you should see |
|---|---|---|
| `?fresh&seed=1` | Win today's Bay | 2 boats: paper boat + kayak ("1 of 2") |
| `?fresh&seed=2` | Win today's Bay | 3 boats: paper boat, kayak, rowboat |
| `?fresh&seed=29&mode=all` | Win today's Bay, then today's Open Sea | Bay card flips through 15 looks (Bay and Open Sea); Open Sea card: the Open Sea houseboat |

Local copy only (`localhost`): the add-ons don't work on the live site. The console prints today's answers whenever you use an add-on.

## Nautilus and compass (Nov 26)
| Try | What you should see |
|---|---|
| `?test&fresh`: win the Bay with `pppp` and the Open Sea with `ppppp` (both on the first guess) | "A nautilus!" on the Open Sea results card; a lit Nautilus card at the bottom of your fleet |
| Fleet → "How to build your fleet ⓘ", wait 5 seconds | "You found a compass!" at the bottom of the card; a lit Compass card in your fleet |

## Crab and hermit crab (Nov 26)
| Try | What you should see |
|---|---|
| `?test&fresh`: Bay `yyyy` then `pppp` (2 guesses), then Open Sea `ppppp` (1 guess) | "A crab!" on the Open Sea results card; a lit Crab card in your fleet |
| `?test&fresh`: Bay `pppp` in 1, Open Sea in 2 (the reverse) | No crab |
| `?test&fresh`: win the Bay with hints, Open Sea in fewer guesses but more hints | Still a crab only if the Bay took more *guesses* (hints don't count) |
| `?test&fresh`: lose the Bay (6 different wrong guesses), tap Keep trying, play `pppp` | "A hermit crab!" on the results card (with the ghost ship, since the day still counts as a loss); a lit Hermit crab card in your fleet |

## Barnacle, starfish, sand dollar, lobsters, walruses (Nov 26)
| Try | What you should see |
|---|---|
| `?test&fresh`: Bay, 5 different wrong guesses, then `pppp` on row 6 | "A walrus!" on the results card; a lit Walrus card in your fleet. Same in the Open Sea on its last row: "A pink walrus!" |
| `?test&fresh`: lose the Bay, tap Keep trying, lose all 10 new rows too | "A barnacle!" on the results card; a lit Barnacle card. Doing it again later: no second barnacle (one-time) |
| Win 5 Bay games in Past games (first win on each day) | "A starfish!" on the fifth one's results card. Open Sea: "A sand dollar!" One-time each |
| First guess of a daily game is an albatross (every ship right, every spot wrong) | A red lobster note over the fog card (blue in the Open Sea), instead of the albatross note. Can't happen in the test game (all junks), so check the tests or a real day |
| Fleet, bottom cards | Walrus, Pink walrus, Red lobster, Blue lobster, Barnacle, Starfish, Sand dollar, greyed out with how to find each until sighted |

