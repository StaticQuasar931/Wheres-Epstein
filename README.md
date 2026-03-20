# Where's Epstein?

Where's Epstein? is a browser hidden-object game built with plain HTML, CSS, and JavaScript. The game includes a cinematic start screen, main levels, bonus levels, advanced multi-target levels, mirrored runs, Upside Down runs, speedrun routes, and special-level slots for future event content.

Frontend structure

- `index.html`
  Main document shell, metadata, SEO, and core screen layout
- `fragments/ui-shell.html`
  Shared page arrows, overlays, changelog shell, and toast UI
- `styles/main.css`
  Layout, themes, HUD, page identity, and responsive rules
- `styles/effects.css`
  Motion, hover states, layered home animation, and visual polish
- `scripts/ui-shell.js`
  Loads the shared UI fragment before the game starts

## What the game includes

- Story route with normal level progression
- Bonus levels with separate unlock logic
- Advanced levels with two-target scenes
- Advanced bonus levels
- Extras page with speedrun routes, mirror mode, Upside Down mode, and special-level slots
- In-level magnifier tool
- Local save data for score, stars, progress, and settings
- Theme, motion, magnifier, and preload settings

## Tech stack

- `index.html`
  Main app structure, screens, overlays, buttons, and required DOM ids.
- `styles/main.css`
  Layout, themes, menu structure, play HUD, start-screen layering, and responsive styling.
- `styles/effects.css`
  Animation timing, hover states, button entrance effects, cloud and decor motion, and easter-egg visuals.
- `scripts/app.js`
  Boot entry point.
- `scripts/game.js`
  Main game controller, progression, scoring, input, overlays, caching, speedrun logic, and settings.
- `scripts/home-ui.js`
  Start-screen placement math, home button alignment, sheen timing, and editor/debug rendering.
- `scripts/game-renderer.js`
  Preview rendering, hitbox rendering, and UI sync for found targets.
- `scripts/levels.js`
  Level data, names, asset paths, start-screen layout data, and target hitboxes.
- `scripts/storage.js`
  Local storage schema, settings save/load, level results, and speedrun stats.

## Assets and structure

- Main backgrounds:
  `Assets/Bakgrounds/`
- Bonus backgrounds:
  `Assets/Bakgrounds/`
- Advanced backgrounds:
  `Assets/Bakgrounds/advanced/`
- Special backgrounds:
  `Assets/Bakgrounds/Special/`
- Main target previews:
  `Assets/Waldos/`
- Advanced target previews:
  `Assets/Waldos/advanced/`
- Special target previews:
  `Assets/Waldos/Special/`
- Start-screen UI art:
  `Assets/ui/`
- Social/share image:
  `Assets/thumb.png`

## Editing hitboxes

All target hitboxes use original image pixel coordinates from the source art.

Rectangle example:

```js
hitbox: { type: "rect", x1: 300, y1: 220, x2: 390, y2: 370 }
```

Circle example:

```js
hitbox: { type: "circle", x: 640, y: 380, radius: 60 }
```

The game normalizes reversed rectangle corners automatically, so either order still works.

## Start-screen layout editing

The start screen uses two exported data blocks from `scripts/levels.js`:

- `START_SCREEN_BUTTONS`
- `START_SCREEN_LAYERS`

These values are original-image coordinates, not browser pixels.

When cheat tools are enabled, the home editor can:

- move layers
- resize layers
- rotate layers
- hide or show editor boxes
- lock individual items
- export the selected item or the whole start-screen layout block

## Performance notes

- Loaded images stay cached in memory through the game session
- Home boot preloads start-screen assets before the intro begins
- Early gameplay preloads upcoming level art and preview images
- Speedrun preloading warms a wider pool based on the preload setting
- The project is tuned with lower-power devices like Chromebooks in mind

## Important gameplay notes

- Mirror and Upside Down variants do not overwrite standard progress
- Level Clearance is an unlock-only cheat mode intended for authored-level testing
- Full cheat tools still separate cheated runs from normal runs
- Missing art produces readable fallback messages instead of silently failing

## Credits

- Game by StaticQuasar931
- Start-screen UI help and art-layer work by Cheese_Cat
