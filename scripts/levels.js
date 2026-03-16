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
    name: "Waldo's Beach",
    hitbox: { type: "rect", x1: 751, y1: 660, x2: 802, y2: 711 },
  }),
  makeLevel(7, "trum5", {
    name: "Waldo's Briefcase",
    hitbox: { type: "rect", x1: 531, y1: 204, x2: 554, y2: 225 },
  }),
  makeLevel(8, "eps4", {
    name: "Popcorn Park",
    hitbox: { type: "rect", x1: 1375, y1: 271, x2: 1352, y2: 237 },
  }),
  makeLevel(9, "eps2", {
    name: "Harbor Chaos",
    hitbox: { type: "rect", x1: 425, y1: 697, x2: 394, y2: 650 },
  }),
  makeLevel(10, "eps5", {
    name: "Airport Travel",
    hitbox: { type: "rect", x1: 929, y1: 267, x2: 907, y2: 240 },
  }),
  makeLevel(11, "eps7", {
    name: "Bridge Wave",
    hitbox: { type: "rect", x1: 373, y1: 494, x2: 343, y2: 445 },
  }),
  makeLevel(12, "eps7", {
    name: "Dragon Castle",
    hitbox: { type: "rect", x1: 567, y1: 340, x2: 538, y2: 301 },
  }),
  makeLevel(13, "trum2", {
    name: "Waterfall Hike",
    hitbox: { type: "rect", x1: 700, y1: 472, x2: 663, y2: 428 },
  }),
  makeLevel(14, "eps6", {
    name: "Halloween Party",
    hitbox: { type: "rect", x1: 1313, y1: 370, x2: 1276, y2: 330 },
  }),
  makeLevel(15, "trum5", {
    name: "NASA Launch",
    hitbox: { type: "rect", x1: 1085, y1: 531, x2: 1055, y2: 502 },
  }),
  makeLevel(16, "eps6", {
    name: "Hogwarts",
    hitbox: { type: "rect", x1: 1462, y1: 334, x2: 1446, y2: 316 },
  }),
  makeLevel(17, "trum4", {
    name: "City Forest",
    hitbox: { type: "rect", x1: 1535, y1: 278, x2: 1502, y2: 248 },
  }),
  makeLevel(18, "trum3", {
    name: "Bone Archive",
    hitbox: { type: "rect", x1: 596, y1: 672, x2: 540, y2: 604 },
  }),
  makeLevel(19, "eps4", {
    name: "New York Pizza",
    hitbox: { type: "rect", x1: 787, y1: 687, x2: 731, y2: 612 },
  }),
  makeLevel(20, "eps2", {
    name: "NASA Hike",
    hitbox: { type: "rect", x1: 815, y1: 295, x2: 789, y2: 258 },
  }),
  {
    id: "bonus-01",
    name: "Medieval Waterslide",
    background: "Assets/Bakgrounds/bonus1.png",
    targetPreview: "Assets/Waldos/eps4.png",
    hitbox: { type: "rect", x1: 2147, y1: 568, x2: 2128, y2: 540 },
    isBonus: true,
  },
  {
    id: "bonus-02",
    name: "NASA Selfie",
    background: "Assets/Bakgrounds/bonus2.png",
    targetPreview: "Assets/Waldos/steph1.png",
    hitbox: { type: "rect", x1: 191, y1: 201, x2: 160, y2: 172 },
    isBonus: true,
  },
  {
    id: "bonus-03",
    name: "StaticQuasar931",
    background: "Assets/Bakgrounds/bonus3.png",
    targetPreview: "",
    hitbox: { type: "rect", x1: 0, y1: 0, x2: 40, y2: 30 },
    isBonus: true,
  },
  {
    id: "bonus-04",
    name: "Group Photo",
    background: "Assets/Bakgrounds/bonus4.png",
    targetPreview: "Assets/Waldos/eps4.png",
    hitbox: { type: "rect", x1: 785, y1: 418, x2: 731, y2: 336 },
    isBonus: true,
  },
  {
    id: "bonus-05",
    name: "Class Photo",
    background: "Assets/Bakgrounds/bonus5.png",
    targetPreview: "Assets/Waldos/trum3.png",
    hitbox: { type: "rect", x1: 352, y1: 261, x2: 364, y2: 278 },
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
