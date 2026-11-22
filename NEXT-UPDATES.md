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
