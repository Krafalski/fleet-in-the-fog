# Fleet in the Fog: starter files

## How it's organized

    src/
      App.tsx               Navigation. One piece of state says which screen is showing
                            (game, harbor log, fleet) and which day and difficulty.
      main.tsx              Where the app starts. Same as the one Vite makes.
      config.ts             Settings to flip while building: WANT_TEST_GAME, THEME, showAllColorways, NEW_GAME_TIME, MAX_REPEATS.
      api.ts                The only file that loads, saves and scores. Local version for now
                            (localStorage). Later, write a server version with the same shape.
      screens/
        GameScreen.tsx      The main screen. Puts the components below together.
        HarborLog.tsx       Past puzzles, a week at a time. Tap a day to play it.
        Fleet.tsx           Averages, creature sightings and the badge boats: harbor view and Show all.
      components/
        TopBar.tsx          Title, log book and lighthouse buttons.
        FogCard.tsx         The hidden fleet and the clouds that lift.
        DayPanel.tsx        After a game: the day's numbers, what was earned, where to go next.
        RepairCard.tsx      The rescue dolphin: repairs in hand and the offer to mend a streak.
        Board.tsx           All the guess rows and the feedback dots. Scrolls.
        WaveSlot.tsx        One spot in a row. The water is drawn once per row, in Board.tsx.
        ShipPicker.tsx      The six ships to choose from.
      game/
        game.ts             The rules: scoring, the daily puzzle, hints, leaderboard score.
        reducer.ts          Everything the player can do on the board. Never knows the answer.
        badges.ts           The badge boats, what earns each one, and streak counting.
        dates.ts            Date helpers.
        *.test.ts           Tests for all of the above.
      Boat.tsx              All 33 boats (6 game ships, 18 badge boats, 9 spares: barge,
                            catamaran, dhow, lifeboat, outrigger, powerboat, carrier,
                            cruise, kayak). <Boat kind="junk" />, <Boat kind="ghost" look="locked" />
      Creature.tsx          Eleven sea creatures for the solved-in-N badges, plus the rescue dolphin (streak repair). <Creature kind="whale" />
      Icon.tsx              16 line icons (book, lighthouse, brush, lantern, replay…). <Icon name="book" />
      Scenery.tsx           20 harbor pieces: lighthouses, docks, champagne, parrots, barrels, albatross, buoy…
      theme.css             Every font and color as a CSS variable (themes go here), boat looks, the fog-lift animation.
      app.css               Layout and component styles.
    assets/                 Plain SVG versions with preview pages: fleet-boats, sea-creatures,
                            scenery, icons, plus wave-slot.svg, rescue-dolphin.svg, app-icon (svg + png)
                            and cover (svg + png). All boats and creatures face right.
    mockup-reference/       The mockup screens' source, for reference only.

## How the pieces talk

    player taps  ->  dispatch(action)  ->  reducer  ->  new state  ->  screen redraws
    Log guess    ->  api.submitGuess() ->  feedback ->  dispatch(GUESS_SCORED)
    game ends    ->  api.recordResult() -> streak + new boats -> fog lifts -> DayPanel on the game screen
    log book / lighthouse / a day in the log  ->  App changes `view` or `dateKey`

Ships are numbers 0-5 everywhere in the logic (0 fisher, 1 junk, 2 mailboat, 3 schooner,
4 tug, 5 yacht). They only become pictures when drawn: SHIP_KINDS[ship] gives the boat kind.

## Not built yet

- Board themes (the brush button) and a How to play screen.
- Harbor average and posting comments: both need the server, so api.ts has empty stand-ins.

## Getting it running in plain React

    npm create vite@latest fleet -- --template react-ts
    cd fleet
    npm install
    npm install -D vitest
    # 1. Delete src/App.css and src/index.css, and remove the line importing index.css from src/main.tsx.
    #    (Vite's default styles center everything and will squash the game.)
    # 2. Copy this src/ folder's files into fleet/src/, replacing App.tsx.
    #    This src/ has its own main.tsx, the same as Vite's minus the index.css import.
    # add the fonts to index.html's <head>:
    #   <link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,500;1,9..144,500&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
    npm run dev          # play it
    npx vitest           # run the tests

## Moving to Devvit later

1. Start from Devvit's React template.
2. Copy src/game/ to where both client and server can import it.
3. On the server, add endpoints that call puzzleForDate() and score(), and save to Redis.
4. Write a second GameApi in api.ts whose functions fetch those endpoints, and point the
   `api` export at the bottom of api.ts to it.
5. Stop importing puzzleForDate in the browser, so the answer never leaves the server.

## Rules baked in (change them in game.ts)

- Easy 4 slots / 8 guesses, Hard 5 / 10. Practice is not built yet.
- No ship appears more than MAX_REPEATS times in a code (config.ts, starts at 2).
- Fleet: double tap a boat to switch between the colorways it has unlocked. showAllColorways in config.ts decides whether locked colorways are shown.
- WANT_TEST_GAME in config.ts (only switches on at a host listed in TEST_HOSTS, such as localhost): burgundy board, every answer is all junks, saved separately from real games.
- Tap a ship and it drops into the next empty spot. Tap a spot to empty it; the next ship goes there.
- Replay clears the board on the same puzzle. Guesses already made still count, and only the first finished game is recorded.
- The puzzle changes at NEW_GAME_TIME in NEW_GAME_ZONE (config.ts). It ships as midnight UTC.
- Streak repairs (game/repairs.ts): one per 30 days played. The first three mend one missed day each, later ones up to three. They combine for longer gaps. Mended days do not add to the streak. Test games start with 2 one-day and 2 three-day repairs.
- A hint greys out the lowest-numbered ship that isn't in the code.
- A streak counts days you solved either puzzle on its own day (badges.ts, api.ts).
- The mystery boat arrives the first time a fleet slips away.
- LAUNCH_DATE is at the top of game.ts.
