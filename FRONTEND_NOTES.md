Where's Epstein? Frontend Notes

Purpose

This file is the handoff note for future frontend or animation work. The project keeps gameplay and save logic in `scripts/game.js`, while the more visual placement and animation work is split into the HTML, CSS, and start-screen helper files.

Core split

- `index.html`
  Holds all screens, overlays, start-screen layers, buttons, and DOM ids expected by the JavaScript.
- `styles/main.css`
  Layout, themes, settings layout, page 3 layout, game HUD, scene viewport, magnifier lens, and responsive rules.
- `styles/effects.css`
  Start-screen animation timing, hover states, cloud motion, decor motion, sheen timing, result polish, and easter-egg visuals.
- `scripts/game.js`
  Main game state, progression, unlocks, score saving, input, magnifier logic, preloading, route variants, changelog rendering, and settings.
- `scripts/home-ui.js`
  Start-screen coordinate math, home button placement, sheen placement, and editor/debug overlay rendering.
- `scripts/game-renderer.js`
  Preview list rendering, hitbox rendering, and found-target visual sync.
- `scripts/levels.js`
  Level data, names, backgrounds, preview assets, target hitboxes, start-screen button rectangles, and start-screen decor rectangles.
- `scripts/storage.js`
  Local save schema, settings persistence, level results, view counts, and speedrun stats.

Start-screen asset flow

`game.js` boots the home screen in a staged order:

1. Wait for base home assets during `startHomeBoot()`
2. Show the background image first
3. Fade in layered decor in sequence
4. Run the one-time button intro
5. Keep decorative motion live only after the intro settles

Important start-screen assets currently used

- `Assets/ui/backgroundplain.png`
- `Assets/ui/titlebanner.png`
- `Assets/ui/mglassempty.png`
- `Assets/ui/startscreenfaces.png`
- `Assets/ui/Wheel.png`
- `Assets/ui/WheelStand.png`
- `Assets/ui/Blimp.png`
- `Assets/ui/airball.png`
- `Assets/ui/cloud1.png`
- `Assets/ui/cloud2.png`
- `Assets/ui/cloud3.png`
- `Assets/ui/Clouds/stringycloud1.png`
- `Assets/ui/Clouds/tinycloud1.png`
- `Assets/ui/Clouds/tinycloud3.png`
- `Assets/ui/Clouds/tinytiny2.png`
- `Assets/ui/startbutton.png`
- `Assets/ui/settingsbutton.png`
- `Assets/ui/moregbutton.png`

Start-screen coordinate system

- `START_SCREEN_BUTTONS` in `scripts/levels.js`
  Stores home button rectangles in original source-image pixels.
- `START_SCREEN_LAYERS` in `scripts/levels.js`
  Stores decor layer rectangles, sources, and optional rotation.
- `scripts/home-ui.js`
  Converts those original coordinates into rendered browser placement every time the viewport changes.

The current start-screen layering order is:

1. Base background image
2. Main clouds and tiny distant clouds
3. Blimp
4. Air balloon
5. Ferris stand and ferris wheel
6. Title banner
7. Magnifying glass frame
8. Magnifying glass faces
9. Home button art and sheen
10. Invisible clickable buttons
11. Editor/debug overlay

Cloud depth system

The screen uses:

- three main cloud images
- four extra distant cloud images from `Assets/ui/Clouds/`

The smaller clouds are meant to add depth. They should stay behind the main decor and feel farther away by:

- smaller scale
- lower opacity
- slower drift
- later entrance timing

Home editor controls

When the home editor cheat is enabled:

- `H`
  Toggle the home editor on the start screen
- `1`, `2`, `3`
  Select start, settings, or more games
- `4`
  Select title banner
- `5`
  Select magnifying glass frame
- `6`
  Select magnifying glass faces
- `7`
  Select air balloon
- `8`
  Select blimp
- `9`
  Select ferris wheel
- `0`
  Select ferris stand
- `[` and `]`
  Cycle through editable items
- Drag box
  Move the selected item
- Drag corner handle
  Resize the selected item
- Arrow keys
  Nudge position
- `Shift + Arrow keys`
  Resize
- `Q` and `E`
  Rotate
- `Shift + Q` and `Shift + E`
  Fine rotate
- `B`
  Show or hide editor boxes
- `K`
  Lock or unlock the selected item
- `Z`
  Toggle zoomed-out editor view
- `Esc`
  Close the editor

Preloading and caching

The game keeps a `preloadedAssets` map in memory for the current session.

Current behavior:

- Home boot preloads early gameplay art
- Starting on the home screen warms level 1 and level 2
- Entering a level warms that level plus upcoming levels based on `renderAhead`
- Speedrun mode warms a wider random candidate pool
- Once an image is in the session cache, the game reuses it instead of creating a new request path

The settings menu now includes:

- magnifier zoom speed
- preload depth
- motion
- theme
- density
- target card size

Mirror and upsideown routes

- These are separate route variants
- They do not save over standard clear results
- The body gets a route-variant dataset flag so the frontend can tint those routes differently
- Returning to level select from a mirror or upsideown run preserves the route context

Special levels

- Special levels are authored from `Assets/Bakgrounds/Special/` and `Assets/Waldos/Special/`
- The page 3 special section shows ten slots for future content
- Slots marked `needsSetup` stay locked in the UI
- Authored slots without `needsSetup` can be opened directly

Magnifier notes

- In-level magnifier state lives in `game.js`
- Lens size is controlled by settings and CSS
- The lens now uses scale variables so mirrored and upsideown routes can visually match the variant orientation
- Click detection still uses image-space coordinates from `clientToImage()` and `clientToImagePrecise()`

Good future frontend targets

- Make page 3 feel more distinct with stronger visual grouping between speedrun, variants, and specials
- Add richer loading text or rotating tips while a scene image is still warming
- Replace some of the current typed easter eggs with more interactive visual secrets
- Add per-route art accents for mirror, upsideown, and future special categories
- Give the settings screen even better density without making it feel crowded
