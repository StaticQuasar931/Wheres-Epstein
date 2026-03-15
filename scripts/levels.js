// Where's Epstein?
// Where's Epstein?

// Level data lives here on purpose so you can edit it without digging through game logic.
// Coordinates are in the ORIGINAL image pixel space, not the visible on-screen size.
// Rectangle hitbox:
//   { type: "rect", x: 300, y: 220, width: 90, height: 150 }
// Circle hitbox:
//   { type: "circle", x: 640, y: 380, radius: 60 }
//
// Preview image convention:
//   Assets/waldopreviews/level1.jpg
//   Assets/waldopreviews/level2.jpg
// Background image convention:
//   Assets/Bakgrounds/level1.png
//   Assets/Bakgrounds/level2.png

function makeLevel(number, overrides = {}) {
  return {
    id: `level-${String(number).padStart(2, "0")}`,
    name: `Level ${number}`,
    background: `Assets/Bakgrounds/level${number}.png`,
    targetPreview: `Assets/waldopreviews/level${number}.jpg`,
    hitbox: { type: "rect", x: 300, y: 220, width: 90, height: 150 },
    camera: { x: 600, y: 400, zoom: 1.4 },
    timeLimit: 50,
    ...overrides,
  };
}

export const LEVELS = [
  makeLevel(1, {
    name: "Boardwalk Search",
    hitbox: { type: "rect", x: 991, y: 583, width: 1069, height: 688 },
    camera: { x: 1225, y: 520, zoom: 1.35 },
    timeLimit: 45,
  }),
  makeLevel(2, {
    name: "Packed Promenade",
    hitbox: { type: "rect", x: 1025, y: 355, width: 96, height: 148 },
    camera: { x: 1070, y: 430, zoom: 1.55 },
  }),
  makeLevel(3, {
    name: "Festival Crush",
    hitbox: { type: "circle", x: 760, y: 410, radius: 70 },
    camera: { x: 760, y: 410, zoom: 1.7 },
    timeLimit: 48,
  }),
  makeLevel(4, {
    name: "Street Parade",
    hitbox: { type: "rect", x: 470, y: 455, width: 100, height: 150 },
    camera: { x: 520, y: 525, zoom: 1.65 },
  }),
  makeLevel(5, {
    name: "Grandstand Crowd",
    hitbox: { type: "rect", x: 1250, y: 500, width: 102, height: 152 },
    camera: { x: 1300, y: 575, zoom: 1.55 },
  }),
  makeLevel(6, {
    name: "Holiday Street",
    hitbox: { type: "rect", x: 720, y: 395, width: 108, height: 162 },
    camera: { x: 770, y: 470, zoom: 1.55 },
    timeLimit: 52,
  }),
  makeLevel(7, {
    name: "Beachside Maze",
    hitbox: { type: "circle", x: 1400, y: 700, radius: 78 },
    camera: { x: 1400, y: 700, zoom: 1.6 },
    timeLimit: 55,
  }),
  makeLevel(8, {
    name: "Crowd Gridlock",
    hitbox: { type: "rect", x: 250, y: 145, width: 44, height: 70 },
    camera: { x: 270, y: 180, zoom: 1.9 },
    timeLimit: 38,
  }),
  makeLevel(9, {
    name: "Harbor Chaos",
    hitbox: { type: "rect", x: 1655, y: 905, width: 126, height: 190 },
    camera: { x: 1715, y: 995, zoom: 1.65 },
    timeLimit: 58,
  }),
  makeLevel(10, {
    name: "Final Crowd Sweep",
    hitbox: { type: "circle", x: 1040, y: 820, radius: 88 },
    camera: { x: 1040, y: 820, zoom: 1.7 },
    timeLimit: 60,
  }),
];

export const DEFAULT_SETTINGS = {
  correctClickPoints: 500,
  timeBonusMultiplier: 12,
  wrongClickTimePenalty: 5,
  wrongClickScorePenalty: 75,
};
