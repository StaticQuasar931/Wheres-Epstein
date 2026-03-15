// Where's Epstein?
// Where's Epstein?

// This file is meant to be easy to edit by hand.
// All coordinates use the ORIGINAL image pixels.
//
// Rectangle hitbox:
//   x1, y1 = top-left corner
//   x2, y2 = bottom-right corner
// Example:
//   hitbox: { type: "rect", x1: 300, y1: 220, x2: 390, y2: 370 }
//
// Circle hitbox:
// Example:
//   hitbox: { type: "circle", x: 640, y: 380, radius: 60 }
//
// Image naming:
//   Background: Assets/Bakgrounds/level1.png
//   Preview:    Assets/waldopreviews/level1.jpg

function makeLevel(number, overrides = {}) {
  return {
    id: `level-${String(number).padStart(2, "0")}`,
    name: `Level ${number}`,
    background: `Assets/Bakgrounds/level${number}.png`,
    targetPreview: `Assets/waldopreviews/level${number}.jpg`,
    hitbox: { type: "rect", x1: 300, y1: 220, x2: 390, y2: 370 },
    ...overrides,
  };
}

export const LEVELS = [
  makeLevel(1, {
    name: "Boardwalk Search",
    hitbox: { type: "rect", x1: 991, y1: 583, x2: 1069, y2: 688 },
  }),
  makeLevel(2, {
    name: "Packed Promenade",
    hitbox: { type: "rect", x1: 1025, y1: 355, x2: 1121, y2: 503 },
  }),
  makeLevel(3, {
    name: "Festival Crush",
    hitbox: { type: "circle", x: 760, y: 410, radius: 70 },
  }),
  makeLevel(4, {
    name: "Street Parade",
    hitbox: { type: "rect", x1: 470, y1: 455, x2: 570, y2: 605 },
  }),
  makeLevel(5, {
    name: "Grandstand Crowd",
    hitbox: { type: "rect", x1: 1250, y1: 500, x2: 1352, y2: 652 },
  }),
  makeLevel(6, {
    name: "Holiday Street",
    hitbox: { type: "rect", x1: 720, y1: 395, x2: 828, y2: 557 },
  }),
  makeLevel(7, {
    name: "Beachside Maze",
    hitbox: { type: "circle", x: 1400, y: 700, radius: 78 },
  }),
  makeLevel(8, {
    name: "Crowd Gridlock",
    hitbox: { type: "rect", x1: 250, y1: 145, x2: 294, y2: 215 },
  }),
  makeLevel(9, {
    name: "Harbor Chaos",
    hitbox: { type: "rect", x1: 1655, y1: 905, x2: 1781, y2: 1095 },
  }),
  makeLevel(10, {
    name: "Final Crowd Sweep",
    hitbox: { type: "circle", x: 1040, y: 820, radius: 88 },
  }),
  {
    id: "bonus-01",
    name: "Bonus Level 1",
    background: "Assets/Bakgrounds/bonus1.png",
    targetPreview: "Assets/waldopreviews/bonus1.jpg",
    hitbox: { type: "rect", x1: 300, y1: 220, x2: 390, y2: 370 },
    isBonus: true,
  },
  {
    id: "bonus-02",
    name: "Bonus Level 2",
    background: "Assets/Bakgrounds/level11.png",
    targetPreview: "Assets/waldopreviews/level11.jpg",
    hitbox: { type: "rect", x1: 300, y1: 220, x2: 390, y2: 370 },
    isBonus: true,
  },
];

export const DEFAULT_SETTINGS = {
  correctClickPoints: 1200,
  wrongClickScorePenalty: 75,
  starThresholdsMs: {
    three: 18000,
    two: 38000,
    one: 70000,
  },
};
