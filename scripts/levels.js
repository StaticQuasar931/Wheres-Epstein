// Easy level editing:
// Rectangles use top-left and bottom-right.
// Example:
//   hitbox: { type: "rect", x1: 300, y1: 220, x2: 390, y2: 370 }
//
// Multi-target levels use a targets array.
// Example:
//   targets: [
//     makeTarget("person1", "ep1", { type: "rect", x1: 120, y1: 140, x2: 180, y2: 230 }),
//     makeTarget("person2", "tru6", { type: "rect", x1: 400, y1: 500, x2: 470, y2: 620 }),
//   ]
//
// Start-screen button rectangles use the same format.

function makePreviewPath(file, folder = "Assets/Waldos") {
  return file ? `${folder}/${file}.png` : "";
}

function makeTarget(id, previewFile, hitbox, folder = "Assets/Waldos") {
  return {
    id,
    preview: makePreviewPath(previewFile, folder),
    hitbox,
  };
}

function makeLevel(number, previewFile, overrides = {}) {
  const target = makeTarget(`${String(number).padStart(2, "0")}-a`, previewFile, { type: "rect", x1: 300, y1: 220, x2: 390, y2: 370 });
  return {
    id: `level-${String(number).padStart(2, "0")}`,
    name: `Level ${number}`,
    background: `Assets/Bakgrounds/level${number}.png`,
    targets: [target],
    ...overrides,
  };
}

function makeAdvancedLevel(number, targets, overrides = {}) {
  return {
    id: `advanced-${String(number).padStart(2, "0")}`,
    name: `Advanced ${number}`,
    background: `Assets/Bakgrounds/advanced/al${number}.png`,
    targets,
    isAdvanced: true,
    ...overrides,
  };
}

function normalizeLevel(level) {
  const targets = level.targets?.length
    ? level.targets
    : [makeTarget(`${level.id}-a`, level.targetPreview?.split("/").pop()?.replace(".png", ""), level.hitbox)];

  return {
    ...level,
    targets,
    targetPreview: targets[0]?.preview ?? "",
    hitbox: targets[0]?.hitbox ?? { type: "rect", x1: 0, y1: 0, x2: 1, y2: 1 },
  };
}

export const START_SCREEN_BUTTONS = {
  start: { x1: 143, y1: 815, x2: 530, y2: 922, color: "green" },
  settings: { x1: 557, y1: 814, x2: 935, y2: 922, color: "blue" },
  moreGames: { x1: 961, y1: 814, x2: 1365, y2: 918, color: "orange" },
};

const MAIN_LEVELS_RAW = [
  makeLevel(1, "eps1", { name: "Welcome Party", targets: [makeTarget("level-01-a", "eps1", { type: "rect", x1: 991, y1: 583, x2: 1069, y2: 688 })] }),
  makeLevel(2, "eps2", { name: "Rainbow Bunny", targets: [makeTarget("level-02-a", "eps2", { type: "rect", x1: 892, y1: 377, x2: 929, y2: 425 })] }),
  makeLevel(3, "trum1", { name: "Medieval Beer", targets: [makeTarget("level-03-a", "trum1", { type: "rect", x1: 944, y1: 223, x2: 965, y2: 250 })] }),
  makeLevel(4, "eps3", { name: "Big Party", targets: [makeTarget("level-04-a", "eps3", { type: "rect", x1: 35, y1: 126, x2: 69, y2: 159 })] }),
  makeLevel(5, "eps5", { name: "July 4th", targets: [makeTarget("level-05-a", "eps5", { type: "rect", x1: 593, y1: 278, x2: 614, y2: 306 })] }),
  makeLevel(6, "trum2", { name: "Waldo's Beach", targets: [makeTarget("level-06-a", "trum2", { type: "rect", x1: 751, y1: 660, x2: 802, y2: 711 })] }),
  makeLevel(7, "trum5", { name: "Waldo's Briefcase", targets: [makeTarget("level-07-a", "trum5", { type: "rect", x1: 531, y1: 204, x2: 554, y2: 225 })] }),
  makeLevel(8, "eps4", { name: "Popcorn Park", targets: [makeTarget("level-08-a", "eps4", { type: "rect", x1: 1375, y1: 271, x2: 1352, y2: 237 })] }),
  makeLevel(9, "eps2", { name: "Harbor Chaos", targets: [makeTarget("level-09-a", "eps2", { type: "rect", x1: 425, y1: 697, x2: 394, y2: 650 })] }),
  makeLevel(10, "eps5", { name: "Airport Travel", targets: [makeTarget("level-10-a", "eps5", { type: "rect", x1: 929, y1: 267, x2: 907, y2: 240 })] }),
  makeLevel(11, "eps7", { name: "Bridge Wave", targets: [makeTarget("level-11-a", "eps7", { type: "rect", x1: 373, y1: 494, x2: 343, y2: 445 })] }),
  makeLevel(12, "eps7", { name: "Dragon Castle", targets: [makeTarget("level-12-a", "eps7", { type: "rect", x1: 567, y1: 340, x2: 538, y2: 301 })] }),
  makeLevel(13, "trum2", { name: "Waterfall Hike", targets: [makeTarget("level-13-a", "trum2", { type: "rect", x1: 700, y1: 472, x2: 663, y2: 428 })] }),
  makeLevel(14, "eps6", { name: "Halloween Party", targets: [makeTarget("level-14-a", "eps6", { type: "rect", x1: 1313, y1: 370, x2: 1276, y2: 330 })] }),
  makeLevel(15, "trum5", { name: "NASA Launch", targets: [makeTarget("level-15-a", "trum5", { type: "rect", x1: 1085, y1: 531, x2: 1055, y2: 502 })] }),
  makeLevel(16, "eps6", { name: "Hogwarts", targets: [makeTarget("level-16-a", "eps6", { type: "rect", x1: 1462, y1: 334, x2: 1446, y2: 316 })] }),
  makeLevel(17, "trum4", { name: "City Forest", targets: [makeTarget("level-17-a", "trum4", { type: "rect", x1: 1535, y1: 278, x2: 1502, y2: 248 })] }),
  makeLevel(18, "trum3", { name: "Bone Archive", targets: [makeTarget("level-18-a", "trum3", { type: "rect", x1: 596, y1: 672, x2: 540, y2: 604 })] }),
  makeLevel(19, "eps4", { name: "New York Pizza", targets: [makeTarget("level-19-a", "eps4", { type: "rect", x1: 787, y1: 687, x2: 731, y2: 612 })] }),
  makeLevel(20, "eps2", { name: "NASA Hike", targets: [makeTarget("level-20-a", "eps2", { type: "rect", x1: 815, y1: 295, x2: 789, y2: 258 })] }),
];

const BONUS_LEVELS_RAW = [
  {
    id: "bonus-01",
    name: "Medieval Waterslide",
    background: "Assets/Bakgrounds/bonus1.png",
    targets: [makeTarget("bonus-01-a", "eps4", { type: "rect", x1: 2147, y1: 568, x2: 2128, y2: 540 })],
    isBonus: true,
  },
  {
    id: "bonus-02",
    name: "NASA Selfie",
    background: "Assets/Bakgrounds/bonus2.png",
    targets: [makeTarget("bonus-02-a", "steph1", { type: "rect", x1: 191, y1: 201, x2: 160, y2: 172 })],
    isBonus: true,
  },
  {
    id: "bonus-03",
    name: "StaticQuasar931",
    background: "Assets/Bakgrounds/bonus3.png",
    targets: [makeTarget("bonus-03-a", "steph1", { type: "rect", x1: 0, y1: 0, x2: 40, y2: 30 })],
    isBonus: true,
  },
  {
    id: "bonus-04",
    name: "Group Photo",
    background: "Assets/Bakgrounds/bonus4.png",
    targets: [makeTarget("bonus-04-a", "eps4", { type: "rect", x1: 785, y1: 418, x2: 731, y2: 336 })],
    isBonus: true,
  },
  {
    id: "bonus-05",
    name: "Class Photo",
    background: "Assets/Bakgrounds/bonus5.png",
    targets: [makeTarget("bonus-05-a", "trum3", { type: "rect", x1: 352, y1: 261, x2: 364, y2: 278 })],
    isBonus: true,
  },
];

const ADVANCED_LEVELS_RAW = [
  makeAdvancedLevel(1, [
    makeTarget("advanced-01-a", "di4", { type: "rect", x1: 300, y1: 220, x2: 390, y2: 370 }, "Assets/Waldos/advanced"),
  ], {
    name: "Advanced Arrival",
  }),
  makeAdvancedLevel(2, [
    makeTarget("advanced-02-a", "ep1", { type: "rect", x1: 300, y1: 220, x2: 390, y2: 370 }, "Assets/Waldos/advanced"),
    makeTarget("advanced-02-b", "tru6", { type: "rect", x1: 470, y1: 300, x2: 550, y2: 410 }, "Assets/Waldos/advanced"),
  ], {
    name: "Double Trouble",
  }),
  makeAdvancedLevel(3, [
    makeTarget("advanced-03-a", "ep3", { type: "rect", x1: 300, y1: 220, x2: 390, y2: 370 }, "Assets/Waldos/advanced"),
    makeTarget("advanced-03-b", "tru2", { type: "rect", x1: 470, y1: 300, x2: 550, y2: 410 }, "Assets/Waldos/advanced"),
  ], {
    name: "Crowd Split",
  }),
  makeAdvancedLevel(4, [
    makeTarget("advanced-04-a", "di5", { type: "rect", x1: 300, y1: 220, x2: 390, y2: 370 }, "Assets/Waldos/advanced"),
    makeTarget("advanced-04-b", "ep6", { type: "rect", x1: 470, y1: 300, x2: 550, y2: 410 }, "Assets/Waldos/advanced"),
  ], {
    name: "Tight Corners",
  }),
  makeAdvancedLevel(5, [
    makeTarget("advanced-05-a", "tru4", { type: "rect", x1: 300, y1: 220, x2: 390, y2: 370 }, "Assets/Waldos/advanced"),
    makeTarget("advanced-05-b", "ep2", { type: "rect", x1: 470, y1: 300, x2: 550, y2: 410 }, "Assets/Waldos/advanced"),
  ], {
    name: "Harder Reads",
  }),
  makeAdvancedLevel(6, [
    makeTarget("advanced-06-a", "tru2", { type: "rect", x1: 300, y1: 220, x2: 390, y2: 370 }, "Assets/Waldos/advanced"),
    makeTarget("advanced-06-b", "ep10", { type: "rect", x1: 470, y1: 300, x2: 550, y2: 410 }, "Assets/Waldos/advanced"),
  ], {
    name: "Final Pairing",
  }),
  {
    id: "advanced-bonus-01",
    name: "Hidden VIPs",
    background: "Assets/Bakgrounds/advanced/ab1.png",
    targets: [
      makeTarget("advanced-bonus-01-a", "di3", { type: "rect", x1: 300, y1: 220, x2: 390, y2: 370 }, "Assets/Waldos/advanced"),
      makeTarget("advanced-bonus-01-b", "ep12", { type: "rect", x1: 470, y1: 300, x2: 550, y2: 410 }, "Assets/Waldos/advanced"),
    ],
    isAdvanced: true,
    isAdvancedBonus: true,
  },
];

export const MAIN_LEVELS = MAIN_LEVELS_RAW.map(normalizeLevel);
export const BONUS_LEVELS = BONUS_LEVELS_RAW.map(normalizeLevel);
export const ADVANCED_LEVELS = ADVANCED_LEVELS_RAW.map(normalizeLevel);

export const LEVELS = [...MAIN_LEVELS, ...BONUS_LEVELS, ...ADVANCED_LEVELS];

export const DEFAULT_SETTINGS = {
  correctClickPoints: 1200,
  wrongClickScorePenalty: 75,
  starThresholdsMs: {
    three: 18000,
    two: 38000,
    one: 70000,
  },
};
