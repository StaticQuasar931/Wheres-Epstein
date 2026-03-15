// Where's Epstein?
// Where's Epstein?

// Level data lives here on purpose so you can edit it without digging through game logic.
// Coordinates are in the ORIGINAL image pixel space, not the visible on-screen size.
// Rectangle hitbox:
//   { type: "rect", x: 300, y: 220, width: 90, height: 150 }
// Circle hitbox:
//   { type: "circle", x: 640, y: 380, radius: 60 }
//
// Optional camera:
//   camera: { x: 600, y: 400, zoom: 1.5 }
// x and y are the point to center on. zoom is relative to fit-to-screen.

export const LEVELS = [
  {
    id: "level-01",
    name: "Boardwalk Search",
    background: "Assets/Bakgrounds/level1.png",
    targetPreview: "Assets/Waldos/eps1.jpg",
    hitbox: { type: "rect", x: 1170, y: 450, width: 110, height: 165 },
    camera: { x: 1225, y: 520, zoom: 1.35 },
    timeLimit: 45,
  },
  {
    id: "level-02",
    name: "Packed Promenade",
    background: "Assets/Bakgrounds/532bf76e-0b12-43ed-9f75-8e6b1a394f80.png",
    targetPreview: "Assets/Waldos/eps2.jpg",
    hitbox: { type: "rect", x: 1025, y: 355, width: 96, height: 148 },
    camera: { x: 1070, y: 430, zoom: 1.55 },
    timeLimit: 50,
  },
  {
    id: "level-03",
    name: "Festival Crush",
    background: "Assets/Bakgrounds/6ece9eb6-03f9-4054-a323-1034acd271b6.png",
    targetPreview: "Assets/Waldos/eps3.jpg",
    hitbox: { type: "circle", x: 760, y: 410, radius: 70 },
    camera: { x: 760, y: 410, zoom: 1.7 },
    timeLimit: 48,
  },
  {
    id: "level-04",
    name: "Street Parade",
    background: "Assets/Bakgrounds/975163df-9b7f-44cc-968d-48eedf7b1d4d.png",
    targetPreview: "Assets/Waldos/eps4.jpg",
    hitbox: { type: "rect", x: 470, y: 455, width: 100, height: 150 },
    camera: { x: 520, y: 525, zoom: 1.65 },
    timeLimit: 50,
  },
  {
    id: "level-05",
    name: "Grandstand Crowd",
    background: "Assets/Bakgrounds/f032ac14-4035-40a2-81fe-19dfce470024.png",
    targetPreview: "Assets/Waldos/eps5.jpg",
    hitbox: { type: "rect", x: 1250, y: 500, width: 102, height: 152 },
    camera: { x: 1300, y: 575, zoom: 1.55 },
    timeLimit: 50,
  },
  {
    id: "level-06",
    name: "Holiday Street",
    background: "Assets/Bakgrounds/ff132c0f-beb3-4dd7-9054-13926d6d5dad.png",
    targetPreview: "Assets/Waldos/eps6.jpg",
    hitbox: { type: "rect", x: 720, y: 395, width: 108, height: 162 },
    camera: { x: 770, y: 470, zoom: 1.55 },
    timeLimit: 52,
  },
  {
    id: "level-07",
    name: "Beachside Maze",
    background: "Assets/Bakgrounds/Where's Waldo_0.jpg",
    targetPreview: "Assets/Waldos/eps7.jpg",
    hitbox: { type: "circle", x: 1400, y: 700, radius: 78 },
    camera: { x: 1400, y: 700, zoom: 1.6 },
    timeLimit: 55,
  },
  {
    id: "level-08",
    name: "Crowd Gridlock",
    background: "Assets/Bakgrounds/WheresWaldo12-480x360.jpg",
    targetPreview: "Assets/Waldos/steph1.jpg",
    hitbox: { type: "rect", x: 250, y: 145, width: 44, height: 70 },
    camera: { x: 270, y: 180, zoom: 1.9 },
    timeLimit: 38,
  },
  {
    id: "level-09",
    name: "Harbor Chaos",
    background: "Assets/Bakgrounds/1_7v_75ZGg1CTmWAw1rEgMHQ.jpg",
    targetPreview: "Assets/Waldos/trum1.jpg",
    hitbox: { type: "rect", x: 1655, y: 905, width: 126, height: 190 },
    camera: { x: 1715, y: 995, zoom: 1.65 },
    timeLimit: 58,
  },
  {
    id: "level-10",
    name: "Final Crowd Sweep",
    background: "Assets/Bakgrounds/waldo-page.webp",
    targetPreview: "Assets/Waldos/trum3.jpg",
    hitbox: { type: "circle", x: 1040, y: 820, radius: 88 },
    camera: { x: 1040, y: 820, zoom: 1.7 },
    timeLimit: 60,
  },
];

export const DEFAULT_SETTINGS = {
  wrongClickTimePenalty: 5,
  wrongClickScorePenalty: 75,
  correctClickPoints: 500,
  timeBonusMultiplier: 12,
};
