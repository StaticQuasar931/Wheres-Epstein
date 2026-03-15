// Easy level editing:
// Rectangles use top-left and bottom-right.
// Example: hitbox: { type: "rect", x1: 300, y1: 220, x2: 390, y2: 370 }
// Circles use center plus radius.
// Example: hitbox: { type: "circle", x: 640, y: 380, radius: 60 }

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

export const LEVELS = [
  makeLevel(1, "eps1", { name: "Level 1", hitbox: { type: "rect", x1: 991, y1: 583, x2: 1069, y2: 688 } }),
  makeLevel(2, "eps2", { name: "Level 2", hitbox: { type: "rect", x1: 929, y1: 425, x2: 892, y2: 377 } }),
  makeLevel(3, "trum1", { name: "Level 3", hitbox: { type: "rect", x1: 944, y1: 223, x2: 965, y2: 250 } }),
  makeLevel(4, "eps3", { name: "Level 4", hitbox: { type: "rect", x1: 35, y1: 126, x2: 69, y2: 159 } }),
  makeLevel(5, "eps5", { name: "Level 5", hitbox: { type: "rect", x1: 614, y1: 306, x2: 593, y2: 278 } }),
  makeLevel(6, "trum2", { name: "Level 6", hitbox: { type: "rect", x1: 802, y1: 660, x2: 751, y2: 711 } }),
  makeLevel(7, "trum5", { name: "Level 7", hitbox: { type: "circle", x: 1400, y: 700, radius: 78 } }),
  makeLevel(8, "eps4", { name: "Level 8", hitbox: { type: "rect", x1: 554, y1: 225, x2: 531, y2: 204 } }),
  makeLevel(9, "eps2", { name: "Level 9", hitbox: { type: "rect", x1: 1655, y1: 905, x2: 1781, y2: 1095 } }),
  makeLevel(10, "eps5", { name: "Level 10", hitbox: { type: "circle", x: 1040, y: 820, radius: 88 } }),
  makeLevel(11, "eps7", { name: "Level 11", hitbox: { type: "rect", x1: 300, y1: 220, x2: 390, y2: 370 } }),
  makeLevel(12, "eps7", { name: "Level 12", hitbox: { type: "rect", x1: 300, y1: 220, x2: 390, y2: 370 } }),
  {
    id: "bonus-01",
    name: "Bonus 1",
    background: "Assets/Bakgrounds/bonus1.png",
    targetPreview: "Assets/Waldos/eps4.png",
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
