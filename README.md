# Where's Epstein?

Plain HTML, CSS, and JavaScript hidden-object game built for normal websites.

## File map

- `index.html`: Main page structure, HUD, menu screens, level intro overlay, pause overlay, result overlay, and completion overlay.
- `styles/main.css`: Responsive UI, layout, scene viewport styling, testing overlay styling, and mobile adjustments.
- `scripts/app.js`: Small bootstrap file that starts the game.
- `scripts/game.js`: Core gameplay logic, scene click detection, scoring, timer, zoom and pan math, local storage integration, and the hidden 5278 testing mode.
- `scripts/levels.js`: The level configuration file. This is the main place to add or edit levels, preview images, hitboxes, and optional starting camera values.
- `scripts/storage.js`: Local storage helpers that keep legit and cheated results separate.

## Asset folders

This build expects these asset locations:

- `Assets/Bakgrounds/`
- `Assets/waldopreviews/`
- `Assets/startscreen.png`

Background scene images are loaded from `Assets/Bakgrounds/`.
Target preview images are loaded from `Assets/waldopreviews/`.
The main menu artwork is loaded from `Assets/startscreen.png`.

## Add a new level

1. Put the large scene image into `Assets/Bakgrounds/`.
2. Put the cropped target preview image into `Assets/waldopreviews/`.
3. Open `scripts/levels.js`.
4. Add a new object to the `LEVELS` array with:
   - `name`
   - `background`
   - `targetPreview`
   - `hitbox`
   - optional `camera`
   - optional `timeLimit`

## Naming convention

- Backgrounds: `Assets/Bakgrounds/level1.png` through `Assets/Bakgrounds/level10.png`
- Previews: `Assets/waldopreviews/level1.jpg` through `Assets/waldopreviews/level10.jpg`
- Start screen art: `Assets/startscreen.png`

## Edit the click area

Open `scripts/levels.js` and change the `hitbox` for the level:

Rectangle example:

```js
hitbox: { type: "rect", x: 300, y: 220, width: 90, height: 150 }
```

Circle example:

```js
hitbox: { type: "circle", x: 640, y: 380, radius: 60 }
```

These values use the original image pixel coordinates, not the scaled screen size.

## Hidden testing mode

1. Open `Settings`.
2. Tap the `build 1.0.0` label four times.
3. Enter code `5278`.
4. Start a new run.

Testing mode is session-only and marks new runs as `CHEATED`.

## Cheated score storage

Local storage is split into:

- `legit.bestScore`
- `legit.highestLevelCleared`
- `legit.totalWins`
- `cheated.bestScore`
- `cheated.totalWins`

Cheated runs do not overwrite legit best score or legit progression.

## Hitbox tuning workflow

1. Unlock testing mode with `5278`.
2. Start the level.
3. Use the visible hitbox overlay to compare with the real target.
4. Read the pointer and last click coordinates shown on the image.
5. Adjust the level entry in `scripts/levels.js`.
6. Reload the page and test again.
