Where's Epstein? Frontend Notes

Purpose

This file is a handoff note for future frontend or animation work. The gameplay logic stays in `scripts/game.js`, but the visual systems were split so another tool or service can replace the presentation without having to rediscover how the project is wired.

Core split

- `index.html`
  Holds the screens, overlays, buttons, and all DOM ids that the game code expects.
- `styles/main.css`
  Main layout, theme variables, menu shells, play HUD layout, responsive structure.
- `styles/effects.css`
  Animation-heavy styling, hover states, home button entrance, page arrows, found-target effects.
- `scripts/game.js`
  Game state, progression, scoring, input, storage calls, level start/end flow, unlock logic.
- `scripts/home-ui.js`
  Home screen button placement, start-screen coordinate math, intro animation sequencing, home debug overlay.
- `scripts/game-renderer.js`
  Preview image rendering, found-target visual sync, hitbox overlay rendering, toast messages.
- `scripts/levels.js`
  Level data only. Hitboxes, image paths, names, targets, advanced placeholders.

Home screen boot flow

1. `game.js` calls `startHomeBoot()` in the constructor.
2. `startHomeBoot()` waits for these assets:
   - `Assets/ui/nobuttonloadingscreen.jpg`
   - `Assets/ui/startbutton.png`
   - `Assets/ui/settingsbutton.png`
   - `Assets/ui/moregbutton.png`
3. While they load, `#homeBootOverlay` stays visible.
4. When loading finishes, `home-ready` is added to `#homeViewport`.
5. Then `playHomeButtonIntro()` runs the staggered button entrance.

Home button system

- The clickable rectangles come from `START_SCREEN_BUTTONS` in `scripts/levels.js`.
- `scripts/home-ui.js` converts those original image coordinates into the rendered browser coordinates.
- The button art PNGs are not assumed to be tightly cropped.
- `getHomeArtBounds()` scans alpha so the visible painted part of the PNG is centered into the intended hitbox.

Home animation classes

- `is-prepping`
  Button art starts below the screen using `--home-enter-offset`.
- `is-entering`
  Button slides upward into place.
- `is-settled`
  Button stays in place and can idle-pulse.
- `is-hovered`
  Hover enlargement and stronger glow.
- `is-pressed`
  Click squash / press-down response.

Home sheen layers

- Each button has a separate `home-button-sheen` layer in `index.html`.
- These are aligned in `scripts/home-ui.js` with `placeHomeSheen()`.
- The shimmer is visual only. It does not affect hitboxes.

If another frontend tool replaces the start screen

- Keep the DOM ids the same if possible.
- If the button art changes, either:
  - keep the current alpha-bound scan logic, or
  - replace `placeHomeArt()` and `placeHomeSheen()` in `scripts/home-ui.js`.
- If a video or canvas intro is added later, it can still end by calling:
  - `game.layoutHomeButtons()`
  - `game.playHomeButtonIntro()`

Level select layout

- Main route and advanced route are the large left-column sections.
- Bonus and progress cards sit on the right.
- Page arrows are pure HTML buttons with SVG icons and label text.
- Card sizing is mostly controlled in `styles/main.css`.

Multi-target levels

- Levels with more than one target use `targets: []` in `scripts/levels.js`.
- Clicking a target adds its id to `state.foundTargetIds`.
- `scripts/game-renderer.js` crosses out found targets in the preview panel and marks their hitboxes as found.

Missing art behavior

- If a preview image path is missing or wrong, the preview panel shows the exact path it tried to load.
- If a background image is missing, the scene fallback shows the exact background path it tried to load.
- Placeholder advanced entries currently exist up to advanced level 20 and advanced bonus 5 so expansion does not need another structural pass.

Speedrun route

- Page 3 is the random speedrun route.
- Unlock logic lives in `game.js` with `isSpeedrunUnlocked()`.
- The current unlock uses:
  - all main levels completed
  - all authored advanced levels completed
- Random picking happens in `pickRandomSpeedrunLevel()`.
- It can repeat levels, but recent picks are softly avoided with rerolls.
- Speedrun stats are saved in `storage.js` under `bucket.speedrun`.

Safe places to change visuals later

- Change animation timing:
  - `HOME_BUTTON_STAGGER_MS` and `HOME_BUTTON_ANIMATION_MS` in `scripts/game.js`
- Change hover / shimmer / pulse:
  - `styles/effects.css`
- Change home coordinate offsets:
  - `HOME_BUTTON_X_OFFSET` and `HOME_BUTTON_Y_OFFSET` in `scripts/game.js`
- Change real home hitboxes:
  - `START_SCREEN_BUTTONS` in `scripts/levels.js`
