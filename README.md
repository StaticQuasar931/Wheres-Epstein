# Where's Epstein?

Plain HTML, CSS, and JavaScript hidden-object game built for normal websites.

## File map

- `index.html`: Full-screen home screen, level select, settings, play view, and overlays.
- `styles/main.css`: Theme-aware layout, full-screen play HUD, and responsive styling.
- `scripts/app.js`: Starts the game.
- `scripts/game.js`: Level flow, scoring, stars, progression locks, zoom and pan, and image loading.
- `scripts/levels.js`: Level data, image paths, and hitboxes.
- `scripts/storage.js`: Local save data for settings, progression, and per-level results.

## Asset naming

- Start screen: `Assets/startscreen.png`
- Main backgrounds: `Assets/Bakgrounds/level1.png` through `Assets/Bakgrounds/level10.png`
- Target previews: `Assets/Waldos/*.png`
- Bonus background: `Assets/Bakgrounds/bonus1.png`

## Editing hitboxes

All hitboxes use the original image pixel coordinates.

Rectangle example:

```js
hitbox: { type: "rect", x1: 300, y1: 220, x2: 390, y2: 370 }
```

Circle example:

```js
hitbox: { type: "circle", x: 640, y: 380, radius: 60 }
```

Rectangle rules:

- `x1, y1` is the top-left corner
- `x2, y2` is the bottom-right corner

That format is easier to tune exactly than width and height.
