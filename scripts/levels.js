// Easy level editing:
// Rectangles use top-left and bottom-right.
// Example:
//   hitbox: { type: "rect", x1: 300, y1: 220, x2: 390, y2: 370 }
//
// Start-screen button rectangles use the same format.
// Example:
//   start: { x1: 120, y1: 430, x2: 420, y2: 510 }

function makeLevel(number, previewFile, overrides = {}) {
  return {
    id: `level-${String(number).padStart(2, "0")}`,
    name: `Level ${number}`,
    background: `Assets/Bakgrounds/level${number}.png`,
    targetPreview: `Assets/Waldos/${previewFile}.png`,
    hitbox: { type: "rect", x1: 300, y1: 220, x2: 390, y2: 370 },
    ...overrides,
  };
}

export const START_SCREEN_BUTTONS = {
  // Edit these to match your start-screen artwork.
  start: { x1: 143, y1: 815, x2: 530, y2: 922, color: "green" },
  settings: { x1: 557, y1: 814, x2: 935, y2: 922, color: "blue" },
  moreGames: { x1: 961, y1: 814, x2: 1365, y2: 918, color: "orange" },
};

export const LEVELS = [
  makeLevel(1, "eps1", {
    name: "Welcome Party",
    hitbox: { type: "rect", x1: 991, y1: 583, x2: 1069, y2: 688 },
  }),
  makeLevel(2, "eps2", {
    name: "Rainbow Bunny",
    hitbox: { type: "rect", x1: 892, y1: 377, x2: 929, y2: 425 },
  }),
  makeLevel(3, "trum1", {
    name: "Medieval Beer",
    hitbox: { type: "rect", x1: 944, y1: 223, x2: 965, y2: 250 },
  }),
  makeLevel(4, "eps3", {
    name: "Big Party",
    hitbox: { type: "rect", x1: 35, y1: 126, x2: 69, y2: 159 },
  }),
  makeLevel(5, "eps5", {
    name: "July 4th",
    hitbox: { type: "rect", x1: 593, y1: 278, x2: 614, y2: 306 },
  }),
  makeLevel(6, "trum2", {
    name: "Waldo's Beachddsss",
    hitbox: { type: "rect", x1: 751, y1: 660, x2: 802, y2: 711 },
  }),
  makeLevel(7, "trum5", {
    name: "Beachside Maze",
    hitbox: { type: "rect", x1: 1322, y1: 622, x2: 1478, y2: 778 },
  }),
  makeLevel(8, "eps4", {
    name: "Waldo's Briefcase",
    hitbox: { type: "rect", x1: 531, y1: 204, x2: 554, y2: 225 },
  }),
  makeLevel(9, "eps2", {
    name: "Harbor Chaos",
    hitbox: { type: "rect", x1: 1655, y1: 905, x2: 1781, y2: 1095 },
  }),
  makeLevel(10, "eps5", {
    name: "Final Crowd Sweep",
    hitbox: { type: "rect", x1: 952, y1: 732, x2: 1128, y2: 908 },
  }),
  makeLevel(11, "eps7", {
    name: "Rooftop Shuffle",
    hitbox: { type: "rect", x1: 300, y1: 220, x2: 390, y2: 370 },
  }),
  makeLevel(12, "eps7", {
    name: "Packed Promenade",
    hitbox: { type: "rect", x1: 300, y1: 220, x2: 390, y2: 370 },
  }),
  makeLevel(13, "trum2", {
    name: "Festival Drift",
    hitbox: { type: "rect", x1: 300, y1: 220, x2: 390, y2: 370 },
  }),
  makeLevel(14, "eps6", {
    name: "Grand Finale Crowd",
    hitbox: { type: "rect", x1: 300, y1: 220, x2: 390, y2: 370 },
  }),
  makeLevel(15, "trum5", {
    name: "Level 15",
    hitbox: { type: "rect", x1: 300, y1: 220, x2: 390, y2: 370 },
  }),
  makeLevel(16, "eps6", {
    name: "Level 16",
    hitbox: { type: "rect", x1: 300, y1: 220, x2: 390, y2: 370 },
  }),
  makeLevel(17, "trum4", {
    name: "Level 17",
    hitbox: { type: "rect", x1: 300, y1: 220, x2: 390, y2: 370 },
  }),
  {
    id: "bonus-01",
    name: "Bonus 1",
    background: "Assets/Bakgrounds/bonus1.png",
    targetPreview: "Assets/Waldos/eps4.png",
    hitbox: { type: "rect", x1: 300, y1: 220, x2: 390, y2: 370 },
    isBonus: true,
  },
  {
    id: "bonus-02",
    name: "Bonus 2",
    background: "Assets/Bakgrounds/bonus2.png",
    targetPreview: "Assets/Waldos/steph1.png",
    hitbox: { type: "rect", x1: 300, y1: 220, x2: 390, y2: 370 },
    isBonus: true,
  },
  {
    id: "bonus-03",
    name: "Bonus 3",
    background: "Assets/Bakgrounds/bonus3.png",
    targetPreview: "Assets/Waldos/eps4.png",
    hitbox: { type: "rect", x1: 300, y1: 220, x2: 390, y2: 370 },
    isBonus: true,
  },
  {
    id: "bonus-04",
    name: "Bonus 4",
    background: "Assets/Bakgrounds/bonus4.png",
    targetPreview: "",
    hitbox: { type: "rect", x1: 300, y1: 220, x2: 390, y2: 370 },
    isBonus: true,
  },
  {
    id: "bonus-05",
    name: "Bonus 5",
    background: "Assets/Bakgrounds/bonus5.png",
    targetPreview: "Assets/Waldos/trum3.png",
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
