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

function makeAdvancedBonusLevel(number, targets, overrides = {}) {
  return {
    id: `advanced-bonus-${String(number).padStart(2, "0")}`,
    name: `Advanced Bonus ${number}`,
    background: `Assets/Bakgrounds/advanced/ab${number}.png`,
    targets,
    isAdvanced: true,
    isAdvancedBonus: true,
    ...overrides,
  };
}

function makeSpecialLevel(number, targets, overrides = {}) {
  return {
    id: `special-${String(number).padStart(2, "0")}`,
    name: `Special ${number}`,
    background: `Assets/Bakgrounds/Special/sl${number}.png`,
    targets,
    isSpecial: true,
    ...overrides,
  };
}

function makePlaceholderTarget(id) {
  return makeTarget(id, "", { type: "rect", x1: 300, y1: 220, x2: 390, y2: 370 }, "Assets/Waldos/advanced");
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
  start: { x1: 107, y1: 827, x2: 494, y2: 934, color: "green" },
  settings: { x1: 593, y1: 826, x2: 971, y2: 934, color: "blue" },
  moreGames: { x1: 1097, y1: 830, x2: 1501, y2: 934, color: "orange" },
  nameLink: { x1: 906, y1: 179, x2: 1177, y2: 257, color: "gold" },
};

export const START_SCREEN_LAYERS = {
  titleBanner: { x1: 260, y1: 38, x2: 1156, y2: 293, color: "purple", src: "Assets/ui/titlebanner.png" },
  cloud1: { x1: 70, y1: 18, x2: 350, y2: 142, color: "white", src: "Assets/ui/cloud1.png" },
  cloud2: { x1: 580, y1: -6, x2: 880, y2: 130, color: "white", src: "Assets/ui/cloud2.png" },
  cloud3: { x1: 1108, y1: -8, x2: 1428, y2: 126, color: "white", src: "Assets/ui/cloud3.png" },
  airball: { x1: 123, y1: 94, x2: 245, y2: 256, color: "cyan", src: "Assets/ui/airball.png" },
  wheelStand: { x1: 1055, y1: 171, x2: 1189, y2: 271, color: "orange", src: "Assets/ui/WheelStand.png" },
  wheel: { x1: 1042, y1: 72, x2: 1214, y2: 234, color: "blue", src: "Assets/ui/Wheel.png" },
  magnifierDecor: { x1: 242, y1: 266, x2: 1018, y2: 783, rotation: -6, color: "red", src: "Assets/ui/mglassempty.png" },
  magnifierFaces: { x1: 574, y1: 342, x2: 931, y2: 589, rotation: -6, color: "gold", src: "Assets/ui/startscreenfaces.png" },
};
// uh783kjs9tya8tji3chq8ugajskaere9h3v198jk

const MAIN_LEVELS_RAW = [
  // Level 1: Welcome Party
  makeLevel(1, "eps1", { name: "Welcome Party", targets: [makeTarget("level-01-a", "eps1", { type: "rect", x1: 991, y1: 583, x2: 1069, y2: 688 })] }),
  // Level 2: Rainbow Bunny
  makeLevel(2, "eps2", { name: "Rainbow Bunny", targets: [makeTarget("level-02-a", "eps2", { type: "rect", x1: 892, y1: 377, x2: 929, y2: 425 })] }),
  // Level 3: Medieval Beer
  makeLevel(3, "trum1", { name: "Medieval Beer", targets: [makeTarget("level-03-a", "trum1", { type: "rect", x1: 944, y1: 223, x2: 965, y2: 250 })] }),
  // Level 4: Big Party
  makeLevel(4, "eps3", { name: "Big Party", targets: [makeTarget("level-04-a", "eps3", { type: "rect", x1: 35, y1: 126, x2: 69, y2: 159 })] }),
  // Level 5: July 4th
  makeLevel(5, "eps5", { name: "July 4th", targets: [makeTarget("level-05-a", "eps5", { type: "rect", x1: 593, y1: 278, x2: 614, y2: 306 })] }),
  // Level 6: Waldo's Beach
  makeLevel(6, "trum2", { name: "Waldo's Beach", targets: [makeTarget("level-06-a", "trum2", { type: "rect", x1: 751, y1: 660, x2: 802, y2: 711 })] }),
  // Level 7: Waldo's Briefcase
  makeLevel(7, "trum5", { name: "Waldo's Briefcase", targets: [makeTarget("level-07-a", "trum5", { type: "rect", x1: 531, y1: 204, x2: 554, y2: 225 })] }),
  // Level 8: Popcorn Park
  makeLevel(8, "eps4", { name: "Popcorn Park", targets: [makeTarget("level-08-a", "eps4", { type: "rect", x1: 1375, y1: 271, x2: 1352, y2: 237 })] }),
  // Level 9: Harbor Chaos
  makeLevel(9, "eps2", { name: "Harbor Chaos", targets: [makeTarget("level-09-a", "eps2", { type: "rect", x1: 425, y1: 697, x2: 394, y2: 650 })] }),
  // Level 10: Airport Travel
  makeLevel(10, "eps5", { name: "Airport Travel", targets: [makeTarget("level-10-a", "eps5", { type: "rect", x1: 929, y1: 267, x2: 907, y2: 240 })] }),
  // Level 11: Bridge Wave
  makeLevel(11, "eps7", { name: "Bridge Wave", targets: [makeTarget("level-11-a", "eps7", { type: "rect", x1: 373, y1: 494, x2: 343, y2: 445 })] }),
  // Level 12: Dragon Castle
  makeLevel(12, "eps7", { name: "Dragon Castle", targets: [makeTarget("level-12-a", "eps7", { type: "rect", x1: 567, y1: 340, x2: 538, y2: 301 })] }),
  // Level 13: Waterfall Hike
  makeLevel(13, "trum2", { name: "Waterfall Hike", targets: [makeTarget("level-13-a", "trum2", { type: "rect", x1: 700, y1: 472, x2: 663, y2: 428 })] }),
  // Level 14: Halloween Party
  makeLevel(14, "eps6", { name: "Halloween Party", targets: [makeTarget("level-14-a", "eps6", { type: "rect", x1: 1313, y1: 370, x2: 1276, y2: 330 })] }),
  // Level 15: NASA Launch
  makeLevel(15, "trum5", { name: "NASA Launch", targets: [makeTarget("level-15-a", "trum5", { type: "rect", x1: 1085, y1: 531, x2: 1055, y2: 502 })] }),
  // Level 16: Hogwarts
  makeLevel(16, "eps6", { name: "Hogwarts", targets: [makeTarget("level-16-a", "eps6", { type: "rect", x1: 1462, y1: 334, x2: 1446, y2: 316 })] }),
  // Level 17: City Forest
  makeLevel(17, "trum4", { name: "City Forest", targets: [makeTarget("level-17-a", "trum4", { type: "rect", x1: 1535, y1: 278, x2: 1502, y2: 248 })] }),
  // Level 18: Bone Archive
  makeLevel(18, "trum3", { name: "Bone Archive", targets: [makeTarget("level-18-a", "trum3", { type: "rect", x1: 596, y1: 672, x2: 540, y2: 604 })] }),
  // Level 19: New York Pizza
  makeLevel(19, "eps4", { name: "New York Pizza", targets: [makeTarget("level-19-a", "eps4", { type: "rect", x1: 787, y1: 687, x2: 731, y2: 612 })] }),
  // Level 20: NASA Hike
  makeLevel(20, "eps2", { name: "NASA Hike", targets: [makeTarget("level-20-a", "eps2", { type: "rect", x1: 815, y1: 295, x2: 789, y2: 258 })] }),
];

const BONUS_LEVELS_RAW = [
  {
    id: "bonus-01",
    name: "NASA Selfie",
    background: "Assets/Bakgrounds/bonus1.png",
    targets: [makeTarget("bonus-01-a", "steph1", { type: "rect", x1: 191, y1: 201, x2: 160, y2: 172 })],
    isBonus: true,
  },
  {
    id: "bonus-02",
    name: "StaticQuasar931",
    background: "Assets/Bakgrounds/bonus2.png",
    targets: [makeTarget("bonus-02-a", "steph1", { type: "rect", x1: 0, y1: 0, x2: 40, y2: 30 })],
    isBonus: true,
  },
  {
    id: "bonus-03",
    name: "Medieval Waterslide",
    background: "Assets/Bakgrounds/bonus3.png",
    targets: [makeTarget("bonus-03-a", "eps4", { type: "rect", x1: 2147, y1: 568, x2: 2128, y2: 540 })],
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
  // Advanced Level 1: Advanced Arrival
  makeAdvancedLevel(1, [
    makeTarget("advanced-01-a", "di4", { type: "rect", x1: 715, y1: 450, x2: 749, y2: 493 }, "Assets/Waldos/advanced"),
  ], {
    name: "Diddy Festival",
  }),
  // Advanced Level 2: Double Elephant
  makeAdvancedLevel(2, [
    makeTarget("advanced-02-a", "ep1", { type: "rect", x1: 1103, y1: 400, x2: 1070, y2: 369 }, "Assets/Waldos/advanced"),
    makeTarget("advanced-02-b", "tru6", { type: "rect", x1: 473, y1: 378, x2: 498, y2: 405 }, "Assets/Waldos/advanced"),
  ], {
    name: "Double Exposure",
  }),
  // Advanced Level 3: Crowd Split
  makeAdvancedLevel(3, [
    makeTarget("advanced-03-a", "ep3", { type: "rect", x1: 1172, y1: 336, x2: 1136, y2: 294 }, "Assets/Waldos/advanced"),
    makeTarget("advanced-03-b", "tru2", { type: "rect", x1: 311, y1: 413, x2: 288, y2: 381 }, "Assets/Waldos/advanced"),
  ], {
    name: "Blue 11",
  }),
  // Advanced Level 4: Tight Corners
  makeAdvancedLevel(4, [
    makeTarget("advanced-04-a", "di5", { type: "rect", x1: 384, y1: 287, x2: 425, y2: 321 }, "Assets/Waldos/advanced"),
    makeTarget("advanced-04-b", "ep6", { type: "rect", x1: 929, y1: 278, x2: 917, y2: 255 }, "Assets/Waldos/advanced"),
  ], {
    name: "TECHover",
  }),
  // Advanced Level 5: Harder Reads
  makeAdvancedLevel(5, [
    makeTarget("advanced-05-a", "tru4", { type: "rect", x1: 1450, y1: 252, x2: 1416, y2: 216 }, "Assets/Waldos/advanced"),
    makeTarget("advanced-05-b", "ep2", { type: "rect", x1: 293, y1: 317, x2: 230, y2: 230 }, "Assets/Waldos/advanced"),
  ], {
    name: "Hawaiian Punch",
  }),
  // Advanced Level 6: Final Pairing
  makeAdvancedLevel(6, [
    makeTarget("advanced-06-a", "tru2", { type: "rect", x1: 1315, y1: 279, x2: 1295, y2: 254 }, "Assets/Waldos/advanced"),
    makeTarget("advanced-06-b", "ep10", { type: "rect", x1: 475, y1: 300, x2: 500, y2: 336 }, "Assets/Waldos/advanced"),
  ], {
    name: "Medieval Crowd",
  }),
  // Advanced Level 7: Masked Pair          
  makeAdvancedLevel(7, [
    makeTarget("advanced-07-a", "tru3", { type: "rect", x1: 505, y1: 252, x2: 482, y2: 230 }, "Assets/Waldos/advanced"),
    makeTarget("advanced-07-b", "ep12", { type: "rect", x1: 871, y1: 515, x2: 818, y2: 444 }, "Assets/Waldos/advanced"),
  ], {
    name: "Smile and Wave",
  }),
  // Advanced Level 8: Final Double Take           
  makeAdvancedLevel(8, [
    makeTarget("advanced-08-a", "tru10", { type: "rect", x1: 653, y1: 960, x2: 633, y2: 935 }, "Assets/Waldos/advanced"),
    makeTarget("advanced-08-b", "ep7", { type: "rect", x1: 892, y1: 346, x2: 872, y2: 315 }, "Assets/Waldos/advanced"),
  ], {
    name: "Rainbow-Fall",
  }),
  // Advanced Level 9: Crowd Pressure
  makeAdvancedLevel(9, [
    makeTarget("advanced-09-a", "di1", { type: "rect", x1: 563, y1: 321, x2: 575, y2: 339 }, "Assets/Waldos/advanced"),
    makeTarget("advanced-09-b", "tru9", { type: "rect", x1: 949, y1: 330, x2: 939, y2: 317 }, "Assets/Waldos/advanced"),
  ], {
    name: "Ski Lift",
  }),
  // Advanced Level 10: Twin Watch         
  makeAdvancedLevel(10, [
    makeTarget("advanced-10-a", "ep12", { type: "rect", x1: 680, y1: 302, x2: 656, y2: 273 }, "Assets/Waldos/advanced"),
    makeTarget("advanced-10-b", "tru6", { type: "rect", x1: 1021, y1: 286, x2: 991, y2: 251 }, "Assets/Waldos/advanced"),
  ], {
    name: "Cruisin' Balcony",
  }),
  // Advanced Level 11: Narrow Pursuit              
  makeAdvancedLevel(11, [
    makeTarget("advanced-11-a", "di2", { type: "rect", x1: 497, y1: 307, x2: 480, y2: 282 }, "Assets/Waldos/advanced"),
    makeTarget("advanced-11-b", "tru7", { type: "rect", x1: 1065, y1: 317, x2: 1043, y2: 285 }, "Assets/Waldos/advanced"),
  ], {
    name: "Mellow Market",
  }),
  // Advanced Level 12: LEGO Party                    
  makeAdvancedLevel(12, [        
    makeTarget("advanced-12-a", "tru10", { type: "rect", x1: 1112, y1: 364, x2: 1072, y2: 317 }, "Assets/Waldos/advanced"),
    makeTarget("advanced-12-b", "ep10", { type: "rect", x1: 420, y1: 315, x2: 397, y2: 275 }, "Assets/Waldos/advanced"),
  ], {
    name: "LEGO Party",
  }),
  // Advanced Level 13: Crossed Paths                         
  makeAdvancedLevel(13, [
    makeTarget("advanced-13-a", "ep4", { type: "rect", x1: 16, y1: 255, x2: 0, y2: 221 }, "Assets/Waldos/advanced"),
    makeTarget("advanced-13-b", "tru4", { type: "rect", x1: 894, y1: 258, x2: 869, y2: 230 }, "Assets/Waldos/advanced"),
  ], {
    name: "Bookoff",
  }),
  // Advanced Level 14: Crimson Route              
  makeAdvancedLevel(14, [
    makeTarget("advanced-14-a", "di5", { type: "rect", x1: 951, y1: 223, x2: 941, y2: 207 }, "Assets/Waldos/advanced"),
    makeTarget("advanced-14-b", "ep1", { type: "rect", x1: 610, y1: 202, x2: 598, y2: 189 }, "Assets/Waldos/advanced"),
  ], {
    name: "Horse Party",
    needsSetup: false,
  }),
  makeAdvancedLevel(15, [            
    makeTarget("advanced-15-a", "di1", { type: "rect", x1: 1518, y1: 267, x2: 1508, y2: 254 }, "Assets/Waldos/advanced"),
    makeTarget("advanced-15-b", "ep12", { type: "rect", x1: 313, y1: 318, x2: 348, y2: 361 }, "Assets/Waldos/advanced"),
  ], {
    name: "July 1st",
    needsSetup: false,
  }),
  makeAdvancedLevel(16, [                
    makeTarget("advanced-16-a", "di6", { type: "rect", x1: 501, y1: 401, x2: 518, y2: 423 }, "Assets/Waldos/advanced"),
    makeTarget("advanced-16-b", "tru2", { type: "rect", x1: 1122, y1: 424, x2: 1102, y2: 402 }, "Assets/Waldos/advanced"),
  ], {
    name: "Swimoff",
    needsSetup: false,
  }),
  makeAdvancedLevel(17, [            
    makeTarget("advanced-17-a", "sh1", { type: "rect", x1: 705, y1: 212, x2: 693, y2: 197 }, "Assets/Waldos/advanced"),
    makeTarget("advanced-17-b", "ep3", { type: "rect", x1: 1266, y1: 211, x2: 1246, y2: 188 }, "Assets/Waldos/advanced"),
  ], {
    name: "Chessoff",
    needsSetup: false,
  }),
  makeAdvancedBonusLevel(1, [                  
    makeTarget("advanced-bonus-01-a", "di3", { type: "rect", x1: 1281, y1: 198, x2: 1265, y2: 189 }, "Assets/Waldos/advanced"),
    makeTarget("advanced-bonus-01-b", "ep12", { type: "rect", x1: 282, y1: 716, x2: 304, y2: 743 }, "Assets/Waldos/advanced"),
  ], {
    name: "Dragon V Dragon",
    needsSetup: false,
  }),
  makeAdvancedBonusLevel(2, [                       
    makeTarget("advanced-bonus-02-a", "tru1", { type: "rect", x1: 1086, y1: 224, x2: 1075, y2: 210 }, "Assets/Waldos/advanced"),
    makeTarget("advanced-bonus-02-b", "sh1", { type: "rect", x1: 813, y1: 338, x2: 788, y2: 307 }, "Assets/Waldos/advanced"),
  ], {
    name: "Déjà Vu",
    needsSetup: false,
  }),
  makeAdvancedBonusLevel(3, [
    makeTarget("advanced-bonus-03-a", "tru8", { type: "rect", x1: 792, y1: 117, x2: 785, y2: 109 }, "Assets/Waldos/advanced"),
    makeTarget("advanced-bonus-03-b", "ep9", { type: "rect", x1: 779, y1: 511, x2: 752, y2: 465 }, "Assets/Waldos/advanced"),
  ], {
    name: "Celebrity Overmash",
    needsSetup: false,
  }),
  makeAdvancedBonusLevel(4, [
    makePlaceholderTarget("advanced-bonus-04-a"),
    makePlaceholderTarget("advanced-bonus-04-b"),
  ], {
    name: "Advanced Bonus 4",
    needsSetup: true,
  }),
  makeAdvancedBonusLevel(5, [
    makeTarget("advanced-bonus-05-a", "di6", { type: "rect", x1: 300, y1: 220, x2: 390, y2: 370 }, "Assets/Waldos/advanced"),
    makeTarget("advanced-bonus-05-b", "tru4", { type: "rect", x1: 470, y1: 300, x2: 550, y2: 410 }, "Assets/Waldos/advanced"),
  ], {
    name: "Boardwalk Clash",
    needsSetup: true,
  }),
];

for (let number = 18; number <= 20; number += 1) {
  ADVANCED_LEVELS_RAW.push(
    makeAdvancedLevel(number, [
      makePlaceholderTarget(`advanced-${String(number).padStart(2, "0")}-a`),
      makePlaceholderTarget(`advanced-${String(number).padStart(2, "0")}-b`),
    ], {
      name: `Advanced Level ${number}`,
      needsSetup: true,
    }),
  );
}

export const MAIN_LEVELS = MAIN_LEVELS_RAW.map(normalizeLevel);
export const BONUS_LEVELS = BONUS_LEVELS_RAW.map(normalizeLevel);
export const ADVANCED_LEVELS = ADVANCED_LEVELS_RAW.map(normalizeLevel);
export const SPECIAL_LEVELS = [];

export const LEVELS = [...MAIN_LEVELS, ...BONUS_LEVELS, ...ADVANCED_LEVELS, ...SPECIAL_LEVELS];

export const DEFAULT_SETTINGS = {
  correctClickPoints: 1200,
  wrongClickScorePenalty: 75,
  starThresholdsMs: {
    three: 18000,
    two: 38000,
    one: 70000,
  },
};
