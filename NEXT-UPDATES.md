# Fleet in the Fog: next updates

Planned Nov 20–22, 2026. Built Sun Nov 22 (ticked items); ready to test Monday. Unticked items are still to do or undecided.
Mockups are in the `mockups/` folder next to this file.

## First thing
- [ ] Check you're registered on Devpost: redditgameofday2026.devpost.com. If the button says "Join hackathon", click it. No separate registration deadline; submissions close Dec 8, 6pm PT (9pm ET).

## Bug fixes
- [x] **Practice Bay gives 8 rows after the 6th guess.** In `game/game.ts` `rowsFor`, change `guessesMade >= base` to `guessesMade > base`. Add a test: winning on guess 6 in Practice Bay (Under each ship) keeps 6 rows, and a 6th wrong guess ends the game.
- [x] **Ghost ship shows on a win.** In `components/DayPanel.tsx`, only show it when this game was lost:
  `const ghostToday = counted?.status === 'lost' && !!earnedOn && BADGES.some((b) => b.days === null && badges[b.kind] === earnedOn);`
- [x] **Page skips when switching Bay / Open sea.** The fog card is taller in Bay (bigger ships). Give the fog card one fixed height in every mode. Also keep the old view on screen until the new one is ready (no blank flash).
- [x] **Practice board sits lower than the daily board.** Move the Bay / Open sea size buttons to either side of the fog card (mockup: `practice-size.png`). Give `.mode-line` a min-height of two lines so all descriptions take the same space. Tidy the side buttons ("Open sea" wraps).
- [ ] **Puzzle start time.** A new puzzle starts at midnight UTC (7pm Eastern), so the date shows tomorrow in the evening. Decide: keep one shared puzzle (maybe start at midnight US Eastern) or local midnight like Wordle. Leaning: one shared puzzle.
- [x] Anchors, pegs and note flags fade out when the end animation starts and come back after (win and loss).

## Gameplay
- [ ] **"Your streak is still alive" note after a loss.** On a daily loss, when that day's other game (Bay or Open sea) hasn't been played yet, show a small line on the results card: "Your streak is still alive. Win today's Open sea to keep it going →" (or Bay). Tapping it opens the other game. Not on past days, not in Practice, and not if the other game is already won (the streak is safe) or lost.
- [ ] **✕ flags shouldn't grey a ship that's still in play.** Now: holding a ✕ flag on one ship greys that color in the picker. Wanted: if you ✕ two of three coral yachts (meaning "only one coral"), the coral stays normal in the picker. Rule: grey it out only when, in any one row, *every* coral yacht in that row has a ✕. Long press always wins over flags: long-pressing coral greys it out by hand, and long-pressing it again brings it back into play even if the flags would grey it, without changing any flags.
- [x] **Keep trying after a loss:** add 10 rows under the old ones instead of a new board. Old rows 50% greyscale, new rows and picker 20%, a "Try 2" divider, row numbers keep counting, note flags stay. "Keep trying" again adds 10 more. Works everywhere, Practice included. Score doesn't change after a loss. (Mockup C: `keep-trying-grey.png`.)
- [x] **Streak repairs:** day 2, day 20, then 45, 75, 105… (every 30 days, halfway between monthly boats). Change `game/repairs.ts`.
- [x] **Keyboard play (desktop):** Y P R G B C place ships, Enter submits when the row is full, Backspace/Delete removes right to left (skips locked ships). Ignore keys when a modal is open, after the game ends, or with Cmd/Ctrl held.
- [x] Slower sail-away on a win: keep the turn ~0.25s, slide ~1.8s, longer `ENDING_MS`.
- [x] Practice: extra rows fade out too (now fade-in only). Practice action row is crowded.

## Share text (blue squares)
- [x] ⬛ right ship, right spot · ⬜ right ship, wrong spot · 🟦 not in the fleet · 🚢 row for the winning guess
- [x] Open sea rows sorted: black, then white, then blue
- [x] Update the legend under "Copy result" to the same symbols
- [ ] Test how ⬛ looks in Reddit dark mode

## Ghost ships and fleet
- [x] Two ghosts: **light** for a Bay loss, **dark** (black sails, white eyes, charcoal hull) for an Open sea loss. Both get the green glow, breathing slowly (4s), staying on with "reduce motion". Fade a separate glow layer (not the filter) so phones stay smooth. (`ghost-light-glow.png`, `ghost-options.png`)
- [x] Tap to pick which ghost shows, like the year boats.
- [x] Two-boat win card: "1 of 2" with ‹ › arrows or swipe; "See in fleet →" follows the boat showing.
- [ ] **Grey fleet boats** (on hold, `fleet-generic.png`): boats you haven't earned yet show as one plain grey boat instead of their real shape, so each new boat is a surprise. "Show all" stays as the full preview. **Undecided:** all plain grey, or only the next boat you can earn shows its real grey shape. Tapping a grey boat keeps its name and how to earn it.

## Ideas for later (not decided, don't build yet)
**Design rule for rewards:** lots of rewards early, then they level out to a steady, fun rhythm (about monthly). Never let the gaps keep growing (8, 16, 32 days…) like farming games, where it turns into a slog. Two tracks help: there's usually something within reach on one of them.

- [ ] **Everyone's guesses chart:** a bar chart of how many guesses winners took that day, one for the Bay and one for the Open sea (needs the server, so after the Devvit port).
- [ ] **Practice progress:** after a Practice game, show your overall Practice score. Once you've practiced for a week, compare this week to last week; after a month, also compare to last month. Practice results aren't saved today, so this needs a small Practice history first (kept separate, so Practice still never counts toward badges). Also show your Practice average next to your daily average, to compare. Super bonus: only after the Reddit version works.

- [ ] **A crab (someday):** draw an SVG crab and find a reason to award it. Ideas: a hermit crab for winning after Keep trying (it carries its old shell, like your greyed-out rows), or a crab for a first guess with no anchors at all (a sideways start).

- [x] **More boats (built Nov 26: kayak, outrigger and catamaran from the spare drawings):** streak boats on days 1, 2, 3, 7, 10, 14, 21, 30, 45, 60, then one a month. 3 new boats to draw (days 2, 21, 45), simple like the others (dinghy, kayak, small sailboat…). Harbor gets one more row of 3, so rows go 4, 3, 4, 3, 4, 3; place the day-2 boat near the paper boat and rowboat. Streak repairs move into the gaps: days 4, 25, 52, then 75, 105… (halfway between monthly boats). Hermit crab for winning after Keep trying: likes it. No-anchors crab: maybe too common, still thinking.

- [x] **Two colors per boat: Bay and Open sea (built Nov 26).** Looks (mockup: `boat-styles.png`): **Year 1:** Bay = regular colors, Open sea = inverse colors. **Year 2:** Bay = gold, Open sea = jewel tones (each boat its own gem: ruby, emerald, amethyst, sapphire…). Gold check: for boats that are already gold or brown (brown hulls, the Golden galleon…), make sure the gold version looks clearly different, e.g. flip the gold shading (light parts dark, dark parts light) for those boats. No year 3. Silver dropped: too close to the grey unearned boats. **Neon** looks great but needs a dark background: save it for a dark mode, someday.
  - **Rule:** a version needs (1) that many *wins in that game*, counted forever (wins, not plays; never resets), and (2) a streak of the boat's day, **capped at 30 days**. First month works like now (canoe: 7 Bay wins + 7-day streak). After that, only a 30-day streak is needed (longship: 180 wins + 30-day streak).
  - **Example:** 30-day streak with 25 Bay wins and 5 Open sea wins → Bay boats up to day 21, Open sea boats days 1, 2, 3.
  - **Breaking the streak** near 6 months: wins stay, so you only rebuild a 30-day streak to keep collecting. You never jump ahead of anyone.
  - **Make it clear in the fleet:** "Days at sea: 30 · Bay wins: 25 · Open sea wins: 5"; each boat shows what it needs ("Open sea: 7 Open sea wins, you have 5"); the win card shows the next goal ("Next Open sea boat: Canoe, 2 more Open sea wins").
  - **Still to decide:** how silver year 2 works (e.g. 360 + the boat's day in wins, plus a 30-day streak).

## Look and feel
- [x] **Coastal Vibes palette** (`palette-coastal.png`): dusk blue #3D5A80 for ink and buttons, powder blue #98C1D9 / light cyan #E0FBFC for water and page, jet black #293241 for text. Avoids looking like Wordspire (cream, mustard, terracotta).
- [x] **Brighter gold** #F0B429 (pale #FFF3CC, deep #C98A06, text #7A5200), only for rewards.
- [x] **Burnt peach** #EE6C4D for the "already guessed" warning: use as a banner background with dark text, or a deeper #B8452A for text.
- [x] **Fog wisps SVG background** (option C in `bg-options.png`): soft blurred white bands plus light grain.
- [ ] Then the win card, the fleet and dark mode in the new colors. Watch that the pale blue doesn't feel too cold.
- [ ] Later: 3D buttons (style A, steel blue), less "AI look" in copy and glows.

## How to play and docs
- [x] Add: long-press a ship in the picker to grey it out when you think it's not in the fleet.
- [x] Add a keyboard line (desktop only).
- [x] TESTING.md: change "Easy" to "Bay" wording.

## Devvit
- [ ] Finish CRUD practice: client `useEffect` for `/api/note`, then create, update, delete, then per-user data.
- [ ] Port: `api.ts` on server routes, Redis per user (Practice too), a dev switch instead of URL add-ons, remove `window.confirm` in DevBar.
- [ ] Later: Journeys (one per puzzle mode), everyone's score / distribution chart, Join community and Reminders, snoovatars.
- [ ] Check the OG URLs match karolinrafalski.com.

Suggested order with a Dec 5 target: bug fixes, palette and background early in the week, then Devvit. Gameplay extras fill in around it.

## What to test Monday (built Nov 22)
1. **Practice Bay, Under each ship:** win on the 6th guess. The board stays at 6 rows. A 6th wrong guess ends the game.
2. **Lose a daily game** (Bay or Open sea): the popup offers Keep trying. You get 10 more rows, a "Try 2" line, old rows greyer, flags kept, rows numbered 7, 8, 9… Lose again: Keep trying adds 10 more. Same in Practice (top button "Keep trying · 10 more rows", plus Reveal the fleet and New game).
3. **Ghost ships:** lose in the Bay = light ghost; lose on the Open sea = dark ghost. Both breathe a slow green glow. A win the same day no longer shows the ghost. In the fleet, tap the ghost: if you have both, tap "Lost in the Bay" / "Lost on the Open sea" to choose.
4. **Switch Bay / Open sea / Practice:** nothing jumps, no blank flash, the board starts at the same height everywhere. Practice sizes sit beside the fog card.
5. **End animation:** on a win the ships turn quickly and sail home slowly; anchors, pegs and flags step aside and come back with the popup.
6. **Keyboard (laptop):** Y P R G B C place ships, ← → move the gold marker to a spot (a letter there swaps the ship, then the marker moves one right), Backspace clears the marked spot (or the last ship), Enter logs. Also try it after clicking the "keep ships" switch.
7. **Copy result:** ⬛ ⬜ 🟦 and a 🚢 row for the win. Try pasting into a Reddit comment preview (light and dark mode).
8. **Streak repairs:** `?fresh&seed=1` then win today = 2 days played, first repair; the fleet says the next one is 18 days away.
9. **New look:** Coastal colors, brighter gold, fog wisps behind the page, "Already played" in burnt peach.
10. **How to play:** long-press line, Keep trying line, keyboard line (keyboard line only on a laptop/desktop).

Also changed while checking: a loss no longer shows a boat earned by the other game that day; the separate "New year, new colors!" note is gone because the win card now flips between everything earned that day ("1 of 2").

## What to test (built Nov 26, overnight)
1. **New boats:** kayak (day 2, sits under the paper boat and rowboat), outrigger (day 21), catamaran (day 45). The harbor has a new bottom row of 3 (with the tall ship moved there).
2. **Two tracks:** a Bay win only moves Bay looks forward, an Open sea win only Open sea looks. Each look needs that many wins in its game and a streak of that many days, capped at 30. Fleet shows "Days at sea · Bay wins · Open sea wins".
3. **Results card:** shows only the looks *this* game earned. With nothing new, it shows the next boat in this game's track, greyed, with what it needs ("2 more Open sea wins · 3 more days at sea").
4. **Fleet detail:** four looks per boat (Bay, Open sea, Bay · gold, Open sea · its gem). Earned ones can be tapped to choose; the rest show what they still need.
5. **Year 2:** gold (Bay) and jewel tones (Open sea), 360 more wins. No year 3. The gold for the galleon, kayak, raft, outrigger and canoe runs the other way so it doesn't look like their own colors (see `mockups/all-boat-looks.png`).
6. **Fleet Admiral cup:** now for all 80 looks (20 boats × 4).
7. **Streak repairs:** days 4, 25, 52, then 75, 105…
8. **Your saved data carries over:** boats you had keep their colors; old "second year" (inverse) colors became the Open sea look.

Decisions I made overnight (easy to change):
- Only wins played on their own day count toward boats (like the streak), so replaying the archive can't fast-forward the fleet.
- A streak that grows can unlock looks in *both* tracks at once (e.g. after seeding); the card then flips through all of them ("1 of 15").
- Ghost ships are unchanged.

Also (Nov 26 morning): when the win card has more than one boat, it flips by itself every ~3 seconds, 3 times around, then rests on the first. Each flip sails the boat out to the left and the next one in from the right. It stops for good the moment you touch the card or an arrow. Never on its own with "reduce motion" on.

Also (Nov 26): **How to build your fleet** card, opened from a link under "Your fleet" at the top of the fleet: Animals, Boats (two looks, tap to choose), Streak repairs, Golden spyglass.

Also (Nov 26): **Nautilus**: win the Bay and the Open Sea with the same score (guesses + hints + Spyglass points) on the same puzzle day. Counted like the albatross; a card on the results screen and at the bottom of the fleet. **Compass**: keep "How to build your fleet" open for 5 seconds; found once, shown at the bottom of the card and in the fleet. "Open Sea" and "Spyglass" are capitalized everywhere.

Also (Nov 26): **Crab** (smirking, a bit lopsided): win both games on one puzzle day where the Bay took more guesses than the Open Sea. Guesses only, not score, so a hint can't buy one. No award for the reverse. **Hermit crab**: win a daily game after Keep trying. The day still counts as the first try's loss (streak and ghost ship unchanged). Both are counted like the nautilus, with a results card and a fleet card.

Also (Nov 26, built): the last batch of creatures. After this the creature list is closed and the Devvit port comes next.
- **Walrus** (grey-blue, Bay) and **pink walrus** (Open Sea): win on the very last row of the first try. Counted.
- **Red lobster** (Bay) and **blue lobster** (Open Sea): an albatross on the very first guess. Counted, like the albatross (daily games and past days, not Practice).
- **Barnacle** (Karo's sideways redraw): lose, tap Keep trying, and lose that first redo too. One-time.
- **Starfish** / **sand dollar**: 5 Bay / 5 Open Sea wins in Past games, the first win on each past day. One-time, so a year of archive play earns the same one an early player has.
- Crab redrawn with serious, ouch-sized pincers; starfish given an outline and shading.
