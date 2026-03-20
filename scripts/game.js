import { LEVELS, MAIN_LEVELS, BONUS_LEVELS, ADVANCED_LEVELS, SPECIAL_LEVELS, DEFAULT_SETTINGS, START_SCREEN_BUTTONS, START_SCREEN_LAYERS } from "./levels.js";
import { loadSave, recordLevelResult, recordLevelView, recordSpeedrunResult, saveSettings, saveMeta } from "./storage.js";
import { layoutHomeButtons as layoutHomeButtonsUi, bindHomeButtonHoverEffects, playHomeButtonIntro as playHomeButtonIntroUi, settleHomeButtonIntro as settleHomeButtonIntroUi, updateHomeDebug as updateHomeDebugUi } from "./home-ui.js";
import { showMenuToast as showMenuToastUi, renderPreviewList as renderPreviewListUi, syncFoundPreviewState as syncFoundPreviewStateUi, renderHitboxes as renderHitboxesUi } from "./game-renderer.js";
// 7hgasd87f6gas8d76f8g7as6d8f7g6asd8f7g

const LINK_MORE_PREFIX = ["//:sptth"];
const LINK_MORE_HOST = ["moc.elgoog.setis"];
const LINK_MORE_PATH = ["weiv", "139rasauqcitats", "z3mg"];
const LINK_DISCORD_PREFIX = ["//:sptth"];
const LINK_DISCORD_HOST = ["gg.drocsid"];
const LINK_DISCORD_PATH = ["HUQA4za2Wj"];
const LINK_DECOY_A = ["moc.elpmaxe", "kcabllaf", "etonod"];
const LINK_DECOY_B = ["gg.drocsid", "yekaf", "zzzz"];
const MIN_SCALE = 0.6;
const MAX_SCALE = 40;
const WHEEL_ZOOM_STEP = 0.12;
const BUTTON_ZOOM_FACTOR = 1.2;
const DRAG_THRESHOLD = 8;
const KEYBOARD_PAN_STEP = 18;
const KEYBOARD_PAN_SLOW_MULTIPLIER = 0.45;
const KEYBOARD_PAN_FAST_MULTIPLIER = 2.2;
const PAN_MARGIN = 360;
const DIAGNOSTIC_CODE = "5278";
const VERSION_LABEL = "Alpha Version 0.0.0.1.2.5.0";
const HOME_BUTTON_STAGGER_MS = 520;
const HOME_BUTTON_ANIMATION_MS = 2550;
const HOME_BUTTON_X_OFFSET = 0;
const HOME_BUTTON_Y_OFFSET = 0;
const HOME_BUTTON_ALPHA_THRESHOLD = 96;
const HOME_EDITOR_NUDGE_STEP = 4;
const MAGNIFIER_HOLD_MS = 240;
const MAGNIFIER_MIN_ZOOM = 1.4;
const MAGNIFIER_MAX_ZOOM = 8;
const KONAMI_SEQUENCE = ["arrowup", "arrowup", "arrowdown", "arrowdown", "arrowleft", "arrowright", "arrowleft", "arrowright", "b", "a"];
const WALDO_SEQUENCE = ["w", "a", "l", "d", "o"];
const PARTY_SEQUENCE = ["p", "a", "r", "t", "y"];
const CHEESE_SEQUENCE = ["c", "h", "e", "e", "s", "e"];
const STATIC_SEQUENCE = ["s", "t", "a", "t", "i", "c"];
const SUNSET_SEQUENCE = ["s", "u", "n"];
const FLOAT_SEQUENCE = ["f", "l", "o", "a", "t"];
const GLASS_SEQUENCE = ["g", "l", "a", "s", "s"];
// y83nfjA9023jfKsl09vna0sdf908aslkdfj23098df

const CHANGELOG_PUBLIC_NOTES = [
  "The start screen now uses the blimp, deeper cloud layering, smoother home motion, and cleaner one-time intro timing.",
  "Level select pages now have clearer page-specific theming, better route separation, and keyboard page shortcuts.",
  "Bonuses now follow the later unlock pacing, and authored special slots are shown more clearly on page three.",
  "Scene loading warms art earlier, shows clearer loading feedback, and keeps the next levels ready more often.",
  "Magnifier clicking, mirrored routes, and upsideown routes have cleaner support across level flow and HUD updates.",
  "Settings now include clearer reset wording, preload controls, magnifier zoom speed, and cleaner action buttons.",
];

const UI_DEFAULT_SETTINGS = {
  theme: "dark",
  density: "comfortable",
  motion: "full",
  previewSize: "normal",
  showLevelIntro: "on",
  showPanTip: "on",
  confirmQuit: "on",
  previewDefault: "shown",
  foundFx: "strong",
  magnifierShape: "circle",
  magnifierSize: "normal",
  magnifierZoomSpeed: "normal",
  renderAhead: "3",
};

const ADVANCED_MAIN_LEVELS = ADVANCED_LEVELS.filter((level) => !level.isAdvancedBonus);
const ADVANCED_BONUS_LEVELS = ADVANCED_LEVELS.filter((level) => level.isAdvancedBonus);
const AUTHORED_ADVANCED_MAIN_LEVELS = ADVANCED_MAIN_LEVELS.filter((level) => level.targets.some((target) => Boolean(target.preview)));

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function formatScore(value) {
  return Math.max(0, Math.round(value)).toLocaleString();
}

function formatTime(ms) {
  return `${(ms / 1000).toFixed(1)}s`;
}

function averageOrZero(total, count) {
  return count > 0 ? total / count : 0;
}

function normalizeMagnifierSize(value) {
  if (value === "large") {
    return "big";
  }
  if (["small", "normal", "big", "huge"].includes(value)) {
    return value;
  }
  return "normal";
}

function normalizeRenderAhead(value) {
  const normalized = String(value ?? "3");
  return ["1", "3", "5", "8"].includes(normalized) ? normalized : "3";
}

function reverseChunk(chunk) {
  return [...chunk].reverse().join("");
}

function stitchExternalLink(prefixParts, hostParts, pathParts) {
  const prefix = prefixParts.map(reverseChunk).join("");
  const host = hostParts.map(reverseChunk).join("");
  const path = pathParts.map(reverseChunk).join("/");
  return `${prefix}${host}/${path}`;
}

function createExternalLinkSignature(input) {
  return [...input].reduce((sum, character, index) => (sum + (character.charCodeAt(0) * (index + 17))) % 1000003, 0);
}

function burnDecoyNoise() {
  return [...LINK_DECOY_A, ...LINK_DECOY_B].map(reverseChunk).join("|");
}

function resolveExternalLinks() {
  const noise = burnDecoyNoise();
  if (noise.length < 12) {
    throw new Error("Corrupt external link table.");
  }

  const moreGames = stitchExternalLink(LINK_MORE_PREFIX, LINK_MORE_HOST, LINK_MORE_PATH);
  const discord = stitchExternalLink(LINK_DISCORD_PREFIX, LINK_DISCORD_HOST, LINK_DISCORD_PATH);
  const signature = createExternalLinkSignature(`${moreGames}|${discord}`);
  if (signature !== 412348) {
    throw new Error("Build integrity check failed.");
  }

  return { moreGames, discord };
}

const EXTERNAL_LINKS = resolveExternalLinks();
const MORE_GAMES_URL = EXTERNAL_LINKS.moreGames;
const DISCORD_URL = EXTERNAL_LINKS.discord;

function getTotalStars(bucket) {
  return Object.values(bucket.levelResults ?? {}).reduce((sum, item) => sum + (item.bestStars ?? 0), 0);
}

function getHit(point, hitbox) {
  if (hitbox.type === "circle") {
    const dx = point.x - hitbox.x;
    const dy = point.y - hitbox.y;
    return Math.sqrt((dx * dx) + (dy * dy)) <= hitbox.radius;
  }

  const left = Math.min(hitbox.x1, hitbox.x2);
  const right = Math.max(hitbox.x1, hitbox.x2);
  const top = Math.min(hitbox.y1, hitbox.y2);
  const bottom = Math.max(hitbox.y1, hitbox.y2);
  return point.x >= left && point.x <= right && point.y >= top && point.y <= bottom;
}

function getStars(elapsedMs) {
  const { three, two, one } = DEFAULT_SETTINGS.starThresholdsMs;
  if (elapsedMs <= three) {
    return 3;
  }
  if (elapsedMs <= two) {
    return 2;
  }
  if (elapsedMs <= one) {
    return 1;
  }
  return 0;
}

function starText(stars) {
  return `${"\u2605".repeat(stars)}${"\u2606".repeat(3 - stars)}`;
}

function formatTargetCountLabel(count) {
  if (count <= 2) {
    return "both";
  }
  return `all ${count}`;
}

function buildMultiTargetIntroText(count) {
  const targetLabel = formatTargetCountLabel(count);
  const patterns = [
    `Find ${targetLabel} targets before clearing the level.`,
    `Spot ${targetLabel} targets before the level clears.`,
    `Clear the scene by finding ${targetLabel} targets.`,
  ];
  return patterns[(count - 2) % patterns.length];
}

export class HiddenObjectGame {
  constructor() {
    this.save = loadSave();
    this.sessionTestingUnlocked = false;
    this.diagnosticTapCount = 0;
    this.keyState = new Set();
    this.keyboardPanFrame = null;
    this.konamiInput = [];
    this.homeAnimationTimers = [];
    this.homeArtBounds = new Map();
    this.homeButtonZones = new Map();
    this.homeRenderedRects = new Map();
    this.preloadedAssets = new Map();
    this.homeWheelAngle = 0;
    this.homeWheelBoost = 1;
    this.homeWheelDecayTimerId = null;
    this.homeWheelDecayFrameId = null;
    this.homeWheelLastFrameAt = 0;
    this.homeIntroPlayed = false;
    this.homeAssetsReady = false;
    this.homeBootStarted = false;
    this.homeDecorReady = false;
    this.homeButtonsReady = false;
    this.homeDecorStarted = false;
    this.homeDecorSettleTimerId = null;
    this.homeAnimationFrame = null;
    this.homeIntroInProgress = false;
    this.speedrunRecentIds = [];
    this.homeButtonEditorEnabled = false;
    this.homeButtonEditorSelection = "start";
    this.homeEditorDrag = null;
    this.homeEditorLockedKeys = new Set();
    this.homeEditorBoxesVisible = true;
    this.homeEditorViewScale = 1;
    this.cheatFlags = {
      levelClearance: false,
      levelHitboxes: false,
      startHitboxes: false,
      homeEditor: false,
      runTools: false,
    };
    this.sceneNudgeTimerId = null;
    this.magnifierHoldTimerId = null;
    this.state = {
      levelIndex: 0,
      levelSelectPage: 1,
      totalScore: 0,
      runMode: "standard",
      mirrorSelectArmed: false,
      mirrorActive: false,
      upsideDownSelectArmed: false,
      upsideDownActive: false,
      elapsedMs: 0,
      elapsedTimerId: null,
      runActive: false,
      runCheated: false,
      paused: false,
      wrongClicks: 0,
      naturalWidth: 1,
      naturalHeight: 1,
      fitScale: 1,
      startTimestamp: 0,
      feedbackTimeoutId: null,
      transform: { scale: 1, x: 0, y: 0 },
      pointerImage: null,
      lastClickImage: null,
      foundTargetIds: new Set(),
      drag: {
        pointerId: null,
        startX: 0,
        startY: 0,
        originX: 0,
        originY: 0,
        moved: false,
      },
      quitPromptResumeTarget: false,
      magnifier: {
        active: false,
        persistent: false,
        pointerId: null,
        pointerX: 0,
        pointerY: 0,
        zoom: 2.2,
        downAt: 0,
      },
    };

    this.elements = this.getElements();
    this.bindEvents();
    bindHomeButtonHoverEffects(this);
    this.applySettings();
    this.renderHomeStats();
    this.renderLevelSelect();
    this.startHomeBoot();
  }

  refreshHomeEditorUi() {
    const active = this.sessionTestingUnlocked && this.isStartHitboxCheatEnabled() && this.elements.screens.home.classList.contains("screen-active");
    this.elements.homeEditorPanel.classList.toggle("hidden", !active);
    this.elements.homeViewport.classList.toggle("home-editor-active", active && this.homeButtonEditorEnabled);
    if (!active) {
      return;
    }
    const zone = this.getHomeEditorZone(this.homeButtonEditorSelection);
    const exportKey = this.getHomeEditorExportKey(this.homeButtonEditorSelection);
    const locked = this.homeEditorLockedKeys.has(this.homeButtonEditorSelection);
    this.elements.homeEditorSelectionLabel.textContent = locked ? `${exportKey} (locked)` : exportKey;
    this.elements.homeEditorCoords.textContent = zone
      ? `x1: ${Math.round(zone.x1)}, y1: ${Math.round(zone.y1)}, x2: ${Math.round(zone.x2)}, y2: ${Math.round(zone.y2)}${typeof zone.rotation === "number" ? `, rot: ${zone.rotation.toFixed(1)}deg` : ""}`
      : "unavailable";
    this.elements.homeEditorToggleButton.textContent = this.homeButtonEditorEnabled ? "Editor On" : "Editor Off";
    this.elements.homeEditorToggleBoxesButton.textContent = this.homeEditorBoxesVisible ? "Boxes On" : "Boxes Off";
    this.elements.homeEditorLockButton.textContent = locked ? "Locked" : "Unlocked";
    this.elements.homeEditorZoomButton.textContent = this.homeEditorViewScale < 1 ? "Zoom Normal" : "Zoom Out";
  }

  isLevelHitboxCheatEnabled() {
    return this.sessionTestingUnlocked && this.cheatFlags.levelHitboxes;
  }

  isLevelClearanceEnabled() {
    return this.sessionTestingUnlocked && this.cheatFlags.levelClearance;
  }

  isStartHitboxCheatEnabled() {
    return this.sessionTestingUnlocked && (this.cheatFlags.startHitboxes || this.cheatFlags.homeEditor);
  }

  isRunCheatEnabled() {
    return this.sessionTestingUnlocked && this.cheatFlags.runTools;
  }

  isLegitProgressionSession() {
    return !this.sessionTestingUnlocked || (
      this.cheatFlags.levelClearance
      && !this.cheatFlags.levelHitboxes
      && !this.cheatFlags.startHitboxes
      && !this.cheatFlags.homeEditor
      && !this.cheatFlags.runTools
    );
  }

  getPreloadDepth() {
    return Number.parseInt(normalizeRenderAhead(this.save.settings.renderAhead), 10) || 3;
  }

  refreshCheatUi() {
    if (!this.elements.diagnosticCheatPanel) {
      return;
    }
    const unlocked = this.sessionTestingUnlocked;
    this.elements.diagnosticCheatPanel.classList.toggle("hidden", !unlocked);
    this.elements.diagnosticCheatPanel.setAttribute("aria-hidden", String(!unlocked));
    const mappings = [
      [this.elements.cheatLevelClearanceButton, this.cheatFlags.levelClearance],
      [this.elements.cheatLevelsButton, this.cheatFlags.levelHitboxes],
      [this.elements.cheatHomeBoxesButton, this.cheatFlags.startHitboxes],
      [this.elements.cheatHomeEditorButton, this.cheatFlags.homeEditor],
      [this.elements.cheatRunToolsButton, this.cheatFlags.runTools],
    ];
    mappings.forEach(([button, enabled]) => {
      if (!button) {
        return;
      }
      button.classList.toggle("cheat-toggle-enabled", enabled);
    });
    if (this.elements.hitboxOverlay) {
      this.elements.hitboxOverlay.classList.toggle("hidden", !this.isLevelHitboxCheatEnabled());
    }
    if (this.elements.debugReadout) {
      this.elements.debugReadout.classList.toggle("hidden", !this.isLevelHitboxCheatEnabled());
    }
    if (this.elements.skipLevelButton) {
      this.elements.skipLevelButton.classList.toggle("hidden", !this.isRunCheatEnabled());
    }
    this.renderChangelog();
    this.layoutHomeButtons();
    this.refreshHomeEditorUi();
  }

  toggleCheatFlag(flag) {
    if (!this.sessionTestingUnlocked) {
      return;
    }
    this.cheatFlags[flag] = !this.cheatFlags[flag];
    if (!this.cheatFlags.homeEditor) {
      this.homeButtonEditorEnabled = false;
    }
    this.refreshCheatUi();
    this.showMenuToast(
      flag === "levelClearance"
        ? (this.cheatFlags[flag]
          ? "Level Clearance enabled. All levels unlock, but scores still count unless another cheat is also on."
          : "Level Clearance disabled.")
        : `${flag} ${this.cheatFlags[flag] ? "enabled" : "disabled"}.`,
    );
  }

  enableAllCheats() {
    this.cheatFlags.levelClearance = true;
    this.cheatFlags.levelHitboxes = true;
    this.cheatFlags.startHitboxes = true;
    this.cheatFlags.homeEditor = true;
    this.cheatFlags.runTools = true;
    this.refreshCheatUi();
  }

  disableCheats() {
    this.sessionTestingUnlocked = false;
    this.homeButtonEditorEnabled = false;
    this.cheatFlags.levelClearance = false;
    this.cheatFlags.levelHitboxes = false;
    this.cheatFlags.startHitboxes = false;
    this.cheatFlags.homeEditor = false;
    this.cheatFlags.runTools = false;
    this.elements.diagnosticUnlock.classList.add("hidden");
    this.elements.diagnosticCheatPanel?.classList.add("hidden");
    this.elements.diagnosticMessage.textContent = "Cheats disabled.";
    this.refreshCheatUi();
  }

  renderChangelog() {
    if (this.elements.changelogTitle) {
      this.elements.changelogTitle.textContent = VERSION_LABEL;
    }
    if (this.elements.changelogPublicList) {
      this.elements.changelogPublicList.innerHTML = CHANGELOG_PUBLIC_NOTES.map((item) => `<li>${item}</li>`).join("");
    }
  }

  openChangelog() {
    this.renderChangelog();
    this.elements.changelogOverlay.classList.remove("hidden");
  }

  closeChangelog() {
    this.elements.changelogOverlay.classList.add("hidden");
  }

  buildHomeEditorExportText(selectedOnly = false) {
    const items = selectedOnly
      ? this.getHomeEditorItems().filter((item) => item.key === this.homeButtonEditorSelection)
      : this.getHomeEditorItems();
    const buttonLines = [];
    const layerLines = [];

    items.forEach(({ key }) => {
      const zone = this.getHomeEditorZone(key);
      if (!zone) {
        return;
      }
      const exportKey = this.getHomeEditorExportKey(key);
      const line = `  ${exportKey}: { x1: ${Math.round(zone.x1)}, y1: ${Math.round(zone.y1)}, x2: ${Math.round(zone.x2)}, y2: ${Math.round(zone.y2)}${typeof zone.rotation === "number" ? `, rotation: ${Number(zone.rotation.toFixed(2))}` : ""}${zone.color ? `, color: "${zone.color}"` : ""}${zone.src ? `, src: "${zone.src}"` : ""} },`;
      if (key === "start" || key === "settings" || key === "more" || key === "nameLink") {
        buttonLines.push(line);
      } else {
        layerLines.push(line);
      }
    });

    if (selectedOnly) {
      return [...buttonLines, ...layerLines].join("\n");
    }

    return [
      "export const START_SCREEN_BUTTONS = {",
      ...buttonLines,
      "};",
      "",
      "export const START_SCREEN_LAYERS = {",
      ...layerLines,
      "};",
    ].join("\n");
  }

  getHomeEditorExportKey(key) {
    if (key === "more") {
      return "moreGames";
    }
    return key;
  }

  isHomeEditorLayerKey(key) {
    return !["start", "settings", "more", "nameLink"].includes(key);
  }

  toggleHomeEditorBoxes() {
    this.homeEditorBoxesVisible = !this.homeEditorBoxesVisible;
    this.layoutHomeButtons();
    this.refreshHomeEditorUi();
  }

  toggleHomeEditorLock() {
    const key = this.homeButtonEditorSelection;
    if (this.homeEditorLockedKeys.has(key)) {
      this.homeEditorLockedKeys.delete(key);
    } else {
      this.homeEditorLockedKeys.add(key);
    }
    this.refreshHomeEditorUi();
    this.layoutHomeButtons();
  }

  toggleHomeEditorZoom() {
    this.homeEditorViewScale = this.homeEditorViewScale < 1 ? 1 : 0.84;
    this.layoutHomeButtons();
    this.refreshHomeEditorUi();
  }

  getHomeEditorViewScale() {
    if (!(this.sessionTestingUnlocked && this.elements.screens.home.classList.contains("screen-active"))) {
      return 1;
    }
    return this.homeEditorViewScale;
  }

  async copyTextToClipboard(text) {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch {}

    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.setAttribute("readonly", "");
    textArea.style.position = "fixed";
    textArea.style.opacity = "0";
    document.body.appendChild(textArea);
    textArea.select();
    const copied = document.execCommand("copy");
    document.body.removeChild(textArea);
    return copied;
  }

  async copyHomeEditorSelected() {
    const copied = await this.copyTextToClipboard(this.buildHomeEditorExportText(true));
    this.showMenuToast(copied ? `Copied ${this.getHomeEditorExportKey(this.homeButtonEditorSelection)}.` : "Copy failed.", !copied);
  }

  async copyHomeEditorExport() {
    const copied = await this.copyTextToClipboard(this.buildHomeEditorExportText(false));
    this.showMenuToast(copied ? "Copied all home layout data." : "Copy failed.", !copied);
  }

  getElements() {
    return {
      body: document.body,
      screens: {
        home: document.getElementById("homeScreen"),
        levelSelect: document.getElementById("levelSelectScreen"),
        settings: document.getElementById("settingsScreen"),
        game: document.getElementById("gameScreen"),
      },
      topMenuButton: document.getElementById("topMenuButton"),
      startGameButton: document.getElementById("startGameButton"),
      homeNameButton: document.getElementById("homeNameButton"),
      closeLevelSelectButton: document.getElementById("closeLevelSelectButton"),
      openSettingsButton: document.getElementById("openSettingsButton"),
      closeSettingsButton: document.getElementById("closeSettingsButton"),
      moreGamesButton: document.getElementById("moreGamesButton"),
      homeViewport: document.getElementById("homeViewport"),
      homeBootOverlay: document.getElementById("homeBootOverlay"),
      homeBootStatus: document.getElementById("homeBootStatus"),
      homeBackgroundFill: document.getElementById("homeBackgroundFill"),
      homeFillLeft: document.getElementById("homeFillLeft"),
      homeFillRight: document.getElementById("homeFillRight"),
      homeFillTop: document.getElementById("homeFillTop"),
      homeFillBottom: document.getElementById("homeFillBottom"),
      homeButtonOverlay: document.getElementById("homeButtonOverlay"),
      homeLayerOverlay: document.getElementById("homeLayerOverlay"),
      homeDebugOverlay: document.getElementById("homeDebugOverlay"),
      homeDebugReadout: document.getElementById("homeDebugReadout"),
      titleBannerLayer: document.getElementById("titleBannerLayer"),
      cloud1Layer: document.getElementById("cloud1Layer"),
      cloud2Layer: document.getElementById("cloud2Layer"),
      cloud3Layer: document.getElementById("cloud3Layer"),
      cloudTiny1Layer: document.getElementById("cloudTiny1Layer"),
      cloudTiny2Layer: document.getElementById("cloudTiny2Layer"),
      cloudTiny3Layer: document.getElementById("cloudTiny3Layer"),
      blimpLayer: document.getElementById("blimpLayer"),
      airballLayer: document.getElementById("airballLayer"),
      wheelStandLayer: document.getElementById("wheelStandLayer"),
      wheelLayer: document.getElementById("wheelLayer"),
      magnifierDecorLayer: document.getElementById("magnifierDecorLayer"),
      magnifierFacesLayer: document.getElementById("magnifierFacesLayer"),
      homeEditorPanel: document.getElementById("homeEditorPanel"),
      homeEditorSelectionLabel: document.getElementById("homeEditorSelectionLabel"),
      homeEditorCoords: document.getElementById("homeEditorCoords"),
      homeEditorToggleButton: document.getElementById("homeEditorToggleButton"),
      homeEditorPrevButton: document.getElementById("homeEditorPrevButton"),
      homeEditorNextButton: document.getElementById("homeEditorNextButton"),
      homeEditorCopySelectedButton: document.getElementById("homeEditorCopySelectedButton"),
      homeEditorCopyAllButton: document.getElementById("homeEditorCopyAllButton"),
      homeEditorToggleBoxesButton: document.getElementById("homeEditorToggleBoxesButton"),
      homeEditorLockButton: document.getElementById("homeEditorLockButton"),
      homeEditorZoomButton: document.getElementById("homeEditorZoomButton"),
      startButtonArt: document.getElementById("startButtonArt"),
      startButtonSheen: document.getElementById("startButtonSheen"),
      settingsButtonArt: document.getElementById("settingsButtonArt"),
      settingsButtonSheen: document.getElementById("settingsButtonSheen"),
      moreGamesButtonArt: document.getElementById("moreGamesButtonArt"),
      moreGamesButtonSheen: document.getElementById("moreGamesButtonSheen"),
      startScreenImage: document.getElementById("startScreenImage"),
      startScreenFallback: document.getElementById("startScreenFallback"),
      startScreenErrorText: document.getElementById("startScreenErrorText"),
      homeLevelCount: document.getElementById("homeLevelCount"),
      homeUnlockedText: document.getElementById("homeUnlockedText"),
      homeBestScore: document.getElementById("homeBestScore"),
      homeTotalTime: document.getElementById("homeTotalTime"),
      mainProgressText: document.getElementById("mainProgressText"),
      bonusUnlockText: document.getElementById("bonusUnlockText"),
      bonusRuleText: document.getElementById("bonusRuleText"),
      advancedRevealText: document.getElementById("advancedRevealText"),
      mainLevelGrid: document.getElementById("mainLevelGrid"),
      bonusLevelGrid: document.getElementById("bonusLevelGrid"),
      advancedLevelGrid: document.getElementById("advancedLevelGrid"),
      advancedBonusLevelGrid: document.getElementById("advancedBonusLevelGrid"),
      speedrunRouteSection: document.getElementById("speedrunRouteSection"),
      startSpeedrunButton: document.getElementById("startSpeedrunButton"),
      startMainSpeedrunButton: document.getElementById("startMainSpeedrunButton"),
      startAdvancedSpeedrunButton: document.getElementById("startAdvancedSpeedrunButton"),
      startBonusSpeedrunButton: document.getElementById("startBonusSpeedrunButton"),
      startMirrorModeButton: document.getElementById("startMirrorModeButton"),
      startUpsideDownModeButton: document.getElementById("startUpsideDownModeButton"),
      startSpecialLevelsButton: document.getElementById("startSpecialLevelsButton"),
      speedrunRoundsText: document.getElementById("speedrunRoundsText"),
      speedrunAverageScoreText: document.getElementById("speedrunAverageScoreText"),
      speedrunAverageTimeText: document.getElementById("speedrunAverageTimeText"),
      speedrunFastestText: document.getElementById("speedrunFastestText"),
      speedrunLastPickText: document.getElementById("speedrunLastPickText"),
      speedrunRecentStrip: document.getElementById("speedrunRecentStrip"),
      specialLevelsStatusText: document.getElementById("specialLevelsStatusText"),
      specialPlaceholderCards: [...document.querySelectorAll(".special-placeholder-card")],
      levelSelectPageLabel: document.getElementById("levelSelectPageLabel"),
      levelSelectPrevPageButton: document.getElementById("levelSelectPrevPageButton"),
      levelSelectNextPageButton: document.getElementById("levelSelectNextPageButton"),
      levelSelectThirdPageButton: document.getElementById("levelSelectThirdPageButton"),
      levelSelectBackFromSpeedrunButton: document.getElementById("levelSelectBackFromSpeedrunButton"),
      mainRouteSection: document.getElementById("mainRouteSection"),
      bonusRouteSection: document.getElementById("bonusRouteSection"),
      advancedRouteSection: document.getElementById("advancedRouteSection"),
      advancedBonusSection: document.getElementById("advancedBonusSection"),
      progressRouteSection: document.getElementById("progressRouteSection"),
      themeSelect: document.getElementById("themeSelect"),
      densitySelect: document.getElementById("densitySelect"),
      motionSelect: document.getElementById("motionSelect"),
      previewSizeSelect: document.getElementById("previewSizeSelect"),
      levelIntroSelect: document.getElementById("levelIntroSelect"),
      panTipSelect: document.getElementById("panTipSelect"),
      confirmQuitSelect: document.getElementById("confirmQuitSelect"),
      previewDefaultSelect: document.getElementById("previewDefaultSelect"),
      foundFxSelect: document.getElementById("foundFxSelect"),
      magnifierShapeSelect: document.getElementById("magnifierShapeSelect"),
      magnifierSizeSelect: document.getElementById("magnifierSizeSelect"),
      magnifierZoomSpeedSelect: document.getElementById("magnifierZoomSpeedSelect"),
      renderAheadSelect: document.getElementById("renderAheadSelect"),
      settingsDiscordButton: document.getElementById("settingsDiscordButton"),
      settingsMoreGamesButton: document.getElementById("settingsMoreGamesButton"),
      settingsChangelogButton: document.getElementById("settingsChangelogButton"),
      resetSettingsButton: document.getElementById("resetSettingsButton"),
      settingsLinkHint: document.getElementById("settingsLinkHint"),
      settingsMainClearsText: document.getElementById("settingsMainClearsText"),
      settingsAdvancedClearsText: document.getElementById("settingsAdvancedClearsText"),
      settingsTotalViewsText: document.getElementById("settingsTotalViewsText"),
      settingsFastestClearText: document.getElementById("settingsFastestClearText"),
      settingsSpeedrunAverageText: document.getElementById("settingsSpeedrunAverageText"),
      settingsSpeedrunBestText: document.getElementById("settingsSpeedrunBestText"),
      versionTapTarget: document.getElementById("versionTapTarget"),
      diagnosticUnlock: document.getElementById("diagnosticUnlock"),
      diagnosticCodeInput: document.getElementById("diagnosticCodeInput"),
      unlockDiagnosticButton: document.getElementById("unlockDiagnosticButton"),
      diagnosticMessage: document.getElementById("diagnosticMessage"),
      diagnosticCheatPanel: document.getElementById("diagnosticCheatPanel"),
      cheatLevelsButton: document.getElementById("cheatLevelsButton"),
      cheatLevelClearanceButton: document.getElementById("cheatLevelClearanceButton"),
      cheatHomeBoxesButton: document.getElementById("cheatHomeBoxesButton"),
      cheatHomeEditorButton: document.getElementById("cheatHomeEditorButton"),
      cheatRunToolsButton: document.getElementById("cheatRunToolsButton"),
      cheatDisableAllButton: document.getElementById("cheatDisableAllButton"),
      sceneViewport: document.getElementById("sceneViewport"),
      sceneContent: document.getElementById("sceneContent"),
      levelImage: document.getElementById("levelImage"),
      sceneLoadingText: document.getElementById("sceneLoadingText"),
      hitboxOverlay: document.getElementById("hitboxOverlay"),
      sceneFallback: document.getElementById("sceneFallback"),
      sceneFallbackTitle: document.getElementById("sceneFallbackTitle"),
      sceneFallbackText: document.getElementById("sceneFallbackText"),
      magnifierLens: document.getElementById("magnifierLens"),
      zoomOutButton: document.getElementById("zoomOutButton"),
      zoomInButton: document.getElementById("zoomInButton"),
      fitZoomButton: document.getElementById("fitZoomButton"),
      resetZoomButton: document.getElementById("resetZoomButton"),
      skipLevelButton: document.getElementById("skipLevelButton"),
      pauseButton: document.getElementById("pauseButton"),
      returnHomeButton: document.getElementById("returnHomeButton"),
      togglePreviewButton: document.getElementById("togglePreviewButton"),
      panTipText: document.getElementById("panTipText"),
      hudLevelText: document.getElementById("hudLevelText"),
      hudLevelName: document.getElementById("hudLevelName"),
      hudStarsText: document.getElementById("hudStarsText"),
      hudScoreText: document.getElementById("hudScoreText"),
      hudTimeText: document.getElementById("hudTimeText"),
      targetPreviewList: document.getElementById("targetPreviewList"),
      targetPreviewLabel: document.getElementById("targetPreviewLabel"),
      previewErrorText: document.getElementById("previewErrorText"),
      sceneFeedback: document.getElementById("sceneFeedback"),
      debugReadout: document.getElementById("debugReadout"),
      levelIntroOverlay: document.getElementById("levelIntroOverlay"),
      introLevelLabel: document.getElementById("introLevelLabel"),
      introLevelName: document.getElementById("introLevelName"),
      introPreviewList: document.getElementById("introPreviewList"),
      introPreviewHint: document.getElementById("introPreviewHint"),
      introPreviewErrorText: document.getElementById("introPreviewErrorText"),
      startLevelButton: document.getElementById("startLevelButton"),
      advancedInfoOverlay: document.getElementById("advancedInfoOverlay"),
      advancedInfoTitle: document.getElementById("advancedInfoTitle"),
      advancedInfoBody: document.getElementById("advancedInfoBody"),
      advancedInfoButton: document.getElementById("advancedInfoButton"),
      pauseOverlay: document.getElementById("pauseOverlay"),
      resumeButton: document.getElementById("resumeButton"),
      pauseQuitButton: document.getElementById("pauseQuitButton"),
      quitConfirmOverlay: document.getElementById("quitConfirmOverlay"),
      cancelQuitButton: document.getElementById("cancelQuitButton"),
      confirmQuitButton: document.getElementById("confirmQuitButton"),
      resultOverlay: document.getElementById("resultOverlay"),
      resultEyebrow: document.getElementById("resultEyebrow"),
      resultTitle: document.getElementById("resultTitle"),
      resultStarsText: document.getElementById("resultStarsText"),
      resultBody: document.getElementById("resultBody"),
      resultScore: document.getElementById("resultScore"),
      resultTimeText: document.getElementById("resultTimeText"),
      resultPrimaryButton: document.getElementById("resultPrimaryButton"),
      resultRetryButton: document.getElementById("resultRetryButton"),
      resultSecondaryButton: document.getElementById("resultSecondaryButton"),
      completionOverlay: document.getElementById("completionOverlay"),
      completionBody: document.getElementById("completionBody"),
      completionScore: document.getElementById("completionScore"),
      completionStars: document.getElementById("completionStars"),
      playAgainButton: document.getElementById("playAgainButton"),
      completionLevelSelectButton: document.getElementById("completionLevelSelectButton"),
      changelogOverlay: document.getElementById("changelogOverlay"),
      changelogTitle: document.getElementById("changelogTitle"),
      changelogPublicList: document.getElementById("changelogPublicList"),
      closeChangelogButton: document.getElementById("closeChangelogButton"),
      menuToast: document.getElementById("menuToast"),
    };
  }

  bindEvents() {
    const bind = (element, eventName, handler) => {
      if (element) {
        element.addEventListener(eventName, handler);
      }
    };
    this.elements.startGameButton.addEventListener("click", () => this.openMainLevelSelect());
    this.elements.homeNameButton.addEventListener("click", () => this.openExternalLink(MORE_GAMES_URL, "More Games link is not configured yet."));
    this.elements.closeLevelSelectButton.addEventListener("click", () => this.showScreen("home"));
    this.elements.openSettingsButton.addEventListener("click", () => this.showScreen("settings"));
    this.elements.closeSettingsButton.addEventListener("click", () => this.showScreen("home"));
    this.elements.moreGamesButton.addEventListener("click", () => this.openExternalLink(MORE_GAMES_URL, "More Games link is not configured yet."));
    bind(this.elements.homeEditorToggleButton, "click", () => this.toggleHomeButtonEditor());
    bind(this.elements.homeEditorPrevButton, "click", () => this.cycleHomeEditorSelection(-1));
    bind(this.elements.homeEditorNextButton, "click", () => this.cycleHomeEditorSelection(1));
    bind(this.elements.homeEditorCopySelectedButton, "click", () => this.copyHomeEditorSelected());
    bind(this.elements.homeEditorCopyAllButton, "click", () => this.copyHomeEditorExport());
    bind(this.elements.homeEditorToggleBoxesButton, "click", () => this.toggleHomeEditorBoxes());
    bind(this.elements.homeEditorLockButton, "click", () => this.toggleHomeEditorLock());
    bind(this.elements.homeEditorZoomButton, "click", () => this.toggleHomeEditorZoom());
    bind(this.elements.topMenuButton, "click", () => this.handleTopMenu());
    bind(this.elements.themeSelect, "change", () => this.persistSettings());
    bind(this.elements.densitySelect, "change", () => this.persistSettings());
    bind(this.elements.motionSelect, "change", () => this.persistSettings());
    bind(this.elements.previewSizeSelect, "change", () => this.persistSettings());
    bind(this.elements.levelIntroSelect, "change", () => this.persistSettings());
    bind(this.elements.panTipSelect, "change", () => this.persistSettings());
    bind(this.elements.confirmQuitSelect, "change", () => this.persistSettings());
    bind(this.elements.previewDefaultSelect, "change", () => this.persistSettings());
    bind(this.elements.foundFxSelect, "change", () => this.persistSettings());
    bind(this.elements.magnifierShapeSelect, "change", () => this.persistSettings());
    bind(this.elements.magnifierSizeSelect, "change", () => this.persistSettings());
    bind(this.elements.magnifierZoomSpeedSelect, "change", () => this.persistSettings());
    bind(this.elements.renderAheadSelect, "change", () => this.persistSettings());
    this.elements.settingsDiscordButton.addEventListener("click", () => this.openExternalLink(DISCORD_URL, "Add your Discord invite URL in scripts/game.js to enable this button."));
    this.elements.settingsMoreGamesButton.addEventListener("click", () => this.openExternalLink(MORE_GAMES_URL, "More Games link is not configured yet."));
    this.elements.settingsChangelogButton?.addEventListener("click", () => this.openChangelog());
    this.elements.resetSettingsButton?.addEventListener("click", () => this.resetSettings());
    bind(this.elements.wheelLayer, "click", () => this.triggerHomeWheelRush());
    bind(this.elements.blimpLayer, "click", () => this.triggerHomeBlimpBoost());
    bind(this.elements.airballLayer, "click", () => this.triggerHomeAirballBoost());
    bind(this.elements.magnifierFacesLayer, "click", () => this.triggerHomeFacesFlash());
    bind(this.elements.hudScoreText, "dblclick", () => this.triggerScoreSpark());
    bind(this.elements.hudTimerText, "dblclick", () => this.triggerTimeRipple());
    bind(this.elements.hudStarsText, "dblclick", () => this.triggerStarsBurst());
    this.elements.levelSelectPrevPageButton.addEventListener("click", () => this.changeLevelSelectPage(-1));
    this.elements.levelSelectNextPageButton.addEventListener("click", () => this.changeLevelSelectPage(1));
    this.elements.levelSelectThirdPageButton.addEventListener("click", () => this.changeLevelSelectPage(1));
    this.elements.levelSelectBackFromSpeedrunButton.addEventListener("click", () => this.changeLevelSelectPage(-1));
    this.elements.startSpeedrunButton.addEventListener("click", () => this.startRandomSpeedrun());
    this.elements.startMainSpeedrunButton?.addEventListener("click", () => this.startRandomSpeedrun("main"));
    this.elements.startAdvancedSpeedrunButton?.addEventListener("click", () => this.startRandomSpeedrun("advanced"));
    this.elements.startBonusSpeedrunButton?.addEventListener("click", () => this.startRandomSpeedrun("bonus"));
    this.elements.startMirrorModeButton?.addEventListener("click", () => this.armMirrorMode());
    this.elements.startUpsideDownModeButton?.addEventListener("click", () => this.armUpsideDownMode());
    this.elements.startSpecialLevelsButton?.addEventListener("click", () => this.startSpecialLevelsRoute());
    this.elements.versionTapTarget.addEventListener("click", (event) => this.handleVersionTap(event));
    this.elements.unlockDiagnosticButton.addEventListener("click", (event) => this.unlockDiagnostics(event));
    bind(this.elements.cheatLevelsButton, "click", () => this.toggleCheatFlag("levelHitboxes"));
    bind(this.elements.cheatLevelClearanceButton, "click", () => this.toggleCheatFlag("levelClearance"));
    bind(this.elements.cheatHomeBoxesButton, "click", () => this.toggleCheatFlag("startHitboxes"));
    bind(this.elements.cheatHomeEditorButton, "click", () => this.toggleCheatFlag("homeEditor"));
    bind(this.elements.cheatRunToolsButton, "click", () => this.toggleCheatFlag("runTools"));
    bind(this.elements.cheatDisableAllButton, "click", () => this.disableCheats());
    bind(this.elements.closeChangelogButton, "click", () => this.closeChangelog());
    this.elements.levelImage.addEventListener("load", () => this.onLevelImageLoaded());
    this.elements.levelImage.addEventListener("error", () => this.onLevelImageError());
    this.elements.startScreenImage.addEventListener("error", () => this.showStartImageError());
    this.elements.startScreenImage.addEventListener("load", () => {
      this.hideStartImageError();
      this.layoutHomeButtons();
    });
    [this.elements.startButtonArt, this.elements.settingsButtonArt, this.elements.moreGamesButtonArt].forEach((image) => {
      image.addEventListener("load", () => {
        this.layoutHomeButtons();
        if (this.homeAssetsReady && !this.homeIntroPlayed) {
          this.playHomeButtonIntro();
        }
      });
    });
    bind(this.elements.zoomOutButton, "click", () => this.zoomFromCenter(1 / BUTTON_ZOOM_FACTOR));
    bind(this.elements.zoomInButton, "click", () => this.zoomFromCenter(BUTTON_ZOOM_FACTOR));
    bind(this.elements.fitZoomButton, "click", () => this.fitLevelToViewport());
    bind(this.elements.resetZoomButton, "click", () => this.fitLevelToViewport());
    this.elements.skipLevelButton.addEventListener("click", () => this.skipLevel());
    this.elements.pauseButton.addEventListener("click", () => this.pauseGame());
    this.elements.returnHomeButton.addEventListener("click", () => this.quitRun());
    this.elements.togglePreviewButton.addEventListener("click", () => this.togglePreviewCard());
    this.elements.resumeButton.addEventListener("click", () => this.resumeGame());
    this.elements.pauseQuitButton.addEventListener("click", () => this.quitRun());
    this.elements.cancelQuitButton.addEventListener("click", () => this.closeQuitPrompt());
    this.elements.confirmQuitButton.addEventListener("click", () => this.confirmQuitRun());
    this.elements.startLevelButton.addEventListener("click", () => this.beginLevel());
    this.elements.advancedInfoButton.addEventListener("click", () => this.closeAdvancedInfo());
    this.elements.resultPrimaryButton.addEventListener("click", () => this.handleResultPrimary());
    this.elements.resultRetryButton.addEventListener("click", () => this.retryCurrentLevel());
    this.elements.resultSecondaryButton.addEventListener("click", () => this.returnToLevelSelect(true));
    this.elements.playAgainButton.addEventListener("click", () => this.startCampaignFromLevel(0));
    this.elements.completionLevelSelectButton.addEventListener("click", () => this.returnToLevelSelect(true));
    this.elements.hudLevelText.addEventListener("dblclick", () => this.returnToLevelSelect(true));
    this.elements.hudLevelText.addEventListener("click", () => this.returnToLevelSelect(true));

    this.elements.sceneViewport.addEventListener("wheel", (event) => {
      event.preventDefault();
      if (this.state.magnifier.active) {
        const zoomStep = this.save.settings.magnifierZoomSpeed === "fast"
          ? 0.35
          : this.save.settings.magnifierZoomSpeed === "slow"
            ? 0.12
            : 0.2;
        const delta = event.deltaY < 0 ? zoomStep : -zoomStep;
        this.state.magnifier.zoom = clamp(this.state.magnifier.zoom + delta, MAGNIFIER_MIN_ZOOM, MAGNIFIER_MAX_ZOOM);
        this.updateMagnifier(event.clientX, event.clientY);
        return;
      }
      const factor = event.deltaY < 0 ? 1 + WHEEL_ZOOM_STEP : 1 - WHEEL_ZOOM_STEP;
      this.zoomAtClientPoint(event.clientX, event.clientY, factor);
    }, { passive: false });

    this.elements.sceneViewport.addEventListener("pointerdown", (event) => this.onPointerDown(event));
    this.elements.sceneViewport.addEventListener("pointermove", (event) => this.onPointerMove(event));
    this.elements.sceneViewport.addEventListener("pointerup", (event) => this.onPointerUp(event));
    this.elements.sceneViewport.addEventListener("pointercancel", (event) => this.onPointerCancel(event));
    this.elements.sceneViewport.addEventListener("contextmenu", (event) => this.onSceneContextMenu(event));
    this.elements.homeViewport.addEventListener("pointermove", (event) => this.updateHomeDebug(event));
    this.elements.homeDebugOverlay.addEventListener("pointerdown", (event) => this.onHomeEditorPointerDown(event));
    window.addEventListener("pointermove", (event) => this.onHomeEditorPointerMove(event));
    window.addEventListener("pointerup", () => this.onHomeEditorPointerUp());

    window.addEventListener("keydown", (event) => this.onKeyDown(event));
    window.addEventListener("keyup", (event) => this.onKeyUp(event));
    window.addEventListener("blur", () => this.clearKeys());
    window.addEventListener("resize", () => {
      if (this.elements.screens.game.classList.contains("screen-active")) {
        this.fitLevelToViewport();
      }
      this.layoutHomeButtons();
    });
  }

  applySettings() {
    if (this.elements.themeSelect) this.elements.themeSelect.value = this.save.settings.theme;
    if (this.elements.densitySelect) this.elements.densitySelect.value = this.save.settings.density;
    if (this.elements.motionSelect) this.elements.motionSelect.value = this.save.settings.motion;
    if (this.elements.previewSizeSelect) this.elements.previewSizeSelect.value = this.save.settings.previewSize;
    if (this.elements.levelIntroSelect) this.elements.levelIntroSelect.value = this.save.settings.showLevelIntro;
    if (this.elements.panTipSelect) this.elements.panTipSelect.value = this.save.settings.showPanTip;
    if (this.elements.confirmQuitSelect) this.elements.confirmQuitSelect.value = this.save.settings.confirmQuit;
    if (this.elements.previewDefaultSelect) this.elements.previewDefaultSelect.value = this.save.settings.previewDefault;
    if (this.elements.foundFxSelect) this.elements.foundFxSelect.value = this.save.settings.foundFx;
    if (this.elements.magnifierShapeSelect) this.elements.magnifierShapeSelect.value = this.save.settings.magnifierShape ?? "circle";
    const magnifierSize = normalizeMagnifierSize(this.save.settings.magnifierSize);
    if (this.elements.magnifierSizeSelect) this.elements.magnifierSizeSelect.value = magnifierSize;
    if (this.elements.magnifierZoomSpeedSelect) this.elements.magnifierZoomSpeedSelect.value = this.save.settings.magnifierZoomSpeed ?? "normal";
    if (this.elements.renderAheadSelect) this.elements.renderAheadSelect.value = normalizeRenderAhead(this.save.settings.renderAhead);
    this.elements.body.dataset.theme = this.save.settings.theme;
    this.elements.body.dataset.density = this.save.settings.density;
    this.elements.body.dataset.motion = this.save.settings.motion;
    this.elements.body.dataset.preview = this.save.settings.previewSize;
    this.elements.body.dataset.foundfx = this.save.settings.foundFx;
    this.elements.body.dataset.magnifier = this.save.settings.magnifierShape ?? "circle";
    this.elements.body.dataset.magnifierSize = magnifierSize;
    this.elements.panTipText.classList.toggle("hidden", this.save.settings.showPanTip === "off");
    this.elements.skipLevelButton.classList.toggle("hidden", !this.isRunCheatEnabled());
    this.elements.settingsDiscordButton.disabled = !DISCORD_URL;
    this.elements.settingsLinkHint.textContent = DISCORD_URL
      ? "Suggestions, bug reports, and feedback can be sent in Discord. External links open in a new tab."
      : "Set your Discord invite URL in scripts/game.js to turn on the Discord button.";
    if (this.elements.versionTapTarget) {
      this.elements.versionTapTarget.textContent = VERSION_LABEL;
    }
    this.renderChangelog();
    this.refreshCheatUi();
  }

  persistSettings() {
    this.save = saveSettings({
      theme: this.elements.themeSelect?.value ?? this.save.settings.theme,
      density: this.elements.densitySelect?.value ?? this.save.settings.density,
      motion: this.elements.motionSelect?.value ?? this.save.settings.motion,
      previewSize: this.elements.previewSizeSelect?.value ?? this.save.settings.previewSize,
      showLevelIntro: this.elements.levelIntroSelect?.value ?? this.save.settings.showLevelIntro,
      showPanTip: this.elements.panTipSelect?.value ?? this.save.settings.showPanTip,
      confirmQuit: this.elements.confirmQuitSelect?.value ?? this.save.settings.confirmQuit,
      previewDefault: this.elements.previewDefaultSelect?.value ?? this.save.settings.previewDefault,
      foundFx: this.elements.foundFxSelect?.value ?? this.save.settings.foundFx,
      magnifierShape: this.elements.magnifierShapeSelect?.value ?? (this.save.settings.magnifierShape ?? "circle"),
      magnifierSize: normalizeMagnifierSize(this.elements.magnifierSizeSelect?.value ?? this.save.settings.magnifierSize),
      magnifierZoomSpeed: this.elements.magnifierZoomSpeedSelect?.value ?? (this.save.settings.magnifierZoomSpeed ?? "normal"),
      renderAhead: normalizeRenderAhead(this.elements.renderAheadSelect?.value ?? this.save.settings.renderAhead),
    });
    this.applySettings();
  }

  resetSettings() {
    this.save = saveSettings(structuredClone(UI_DEFAULT_SETTINGS));
    this.applySettings();
    this.showMenuToast("Settings reset to default.");
  }

  openMainLevelSelect() {
    this.state.mirrorSelectArmed = false;
    this.state.upsideDownSelectArmed = false;
    this.state.levelSelectPage = 1;
    this.showScreen("levelSelect");
    this.renderLevelSelect();
  }

  showScreen(name) {
    Object.entries(this.elements.screens).forEach(([key, element]) => {
      const active = key === name;
      element.classList.toggle("screen-active", active);
      element.setAttribute("aria-hidden", String(!active));
    });
    this.elements.body.classList.toggle("mode-game", name === "game");
    const variant = name === "levelSelect" && this.state.mirrorSelectArmed
      ? "mirror"
      : name === "levelSelect" && this.state.upsideDownSelectArmed
        ? "upside"
        : name === "game" && this.state.runMode === "mirror"
          ? "mirror"
          : name === "game" && this.state.runMode === "upside"
            ? "upside"
            : "standard";
    this.elements.body.dataset.routeVariant = variant;
    this.elements.body.dataset.levelPage = name === "levelSelect" ? String(this.state.levelSelectPage) : "0";
    if (this.elements.topMenuButton) {
      this.elements.topMenuButton.textContent = name === "home" ? "Levels" : "Menu";
    }
    if (name !== "game") {
      this.stopElapsedTimer();
      this.clearKeys();
      this.state.runActive = false;
      this.hideMagnifier();
      this.closeAllOverlays();
    }
    if (name === "home" || name === "levelSelect") {
      this.renderLevelSelect();
    }
    if (name === "settings") {
      this.save = loadSave();
      this.renderHomeStats();
    }
    this.layoutHomeButtons();
    this.refreshHomeEditorUi();
    this.refreshCheatUi();
    if (name === "home" && this.homeAssetsReady && this.elements.startScreenImage.naturalWidth > 0) {
      this.preloadLevelAssets(0, Math.max(2, this.getPreloadDepth()));
      if (!this.homeIntroPlayed) {
        this.playHomeButtonIntro();
      }
      if (this.homeDecorReady) {
        this.startHomeDecorAnimations();
      }
    }
    if (name !== "levelSelect") {
      this.elements.levelSelectPrevPageButton.classList.add("hidden");
      this.elements.levelSelectNextPageButton.classList.add("hidden");
      this.elements.levelSelectThirdPageButton.classList.add("hidden");
      this.elements.levelSelectBackFromSpeedrunButton.classList.add("hidden");
    }
  }

  startHomeBoot() {
    if (this.homeBootStarted) {
      return;
    }
    this.homeBootStarted = true;
    const assets = [
      ["background", this.elements.startScreenImage, "Assets/ui/backgroundplain.png"],
      ["titleBanner", this.elements.titleBannerLayer, START_SCREEN_LAYERS.titleBanner.src],
      ["cloud1", this.elements.cloud1Layer, START_SCREEN_LAYERS.cloud1.src],
      ["cloud2", this.elements.cloud2Layer, START_SCREEN_LAYERS.cloud2.src],
      ["cloud3", this.elements.cloud3Layer, START_SCREEN_LAYERS.cloud3.src],
      ["cloudTiny1", this.elements.cloudTiny1Layer, START_SCREEN_LAYERS.cloudTiny1.src],
      ["cloudTiny2", this.elements.cloudTiny2Layer, START_SCREEN_LAYERS.cloudTiny2.src],
      ["cloudTiny3", this.elements.cloudTiny3Layer, START_SCREEN_LAYERS.cloudTiny3.src],
      ["cloudTiny4", this.elements.cloudTiny4Layer, START_SCREEN_LAYERS.cloudTiny4.src],
      ["blimp", this.elements.blimpLayer, START_SCREEN_LAYERS.blimp.src],
      ["airball", this.elements.airballLayer, START_SCREEN_LAYERS.airball.src],
      ["wheelStand", this.elements.wheelStandLayer, START_SCREEN_LAYERS.wheelStand.src],
      ["wheel", this.elements.wheelLayer, START_SCREEN_LAYERS.wheel.src],
      ["magnifierDecor", this.elements.magnifierDecorLayer, START_SCREEN_LAYERS.magnifierDecor.src],
      ["magnifierFaces", this.elements.magnifierFacesLayer, START_SCREEN_LAYERS.magnifierFaces.src],
      ["start", this.elements.startButtonArt, "Assets/ui/startbutton.png"],
      ["settings", this.elements.settingsButtonArt, "Assets/ui/settingsbutton.png"],
      ["moreGames", this.elements.moreGamesButtonArt, "Assets/ui/moregbutton.png"],
    ];
    this.homeAssetsReady = false;
    this.homeDecorReady = false;
    this.homeButtonsReady = false;
    this.homeDecorStarted = false;
    this.stopHomeDecorAnimations(true);
    this.elements.homeViewport.classList.remove("home-background-ready", "home-decor-ready", "home-clouds-ready", "home-buttons-ready", "home-animating", "home-ready");
    this.elements.homeBootOverlay.classList.remove("hidden", "is-exiting");
    this.elements.homeBootStatus.textContent = "Loading menu art, buttons, and interface layers.";
    this.preloadImage(START_SCREEN_LAYERS.cloudTiny1.src);
    this.preloadImage(START_SCREEN_LAYERS.cloudTiny2.src);
    this.preloadImage(START_SCREEN_LAYERS.cloudTiny3.src);
    if (START_SCREEN_LAYERS.cloudTiny4?.src) {
      this.preloadImage(START_SCREEN_LAYERS.cloudTiny4.src);
    }
    this.preloadLevelAssets(0, 2);
    Promise.allSettled(assets.map(([key, element, src]) => this.preloadImageAsset(element, src, key))).then((results) => {
      const failures = results
        .filter((result) => result.status === "fulfilled" && !result.value.ok)
        .map((result) => result.value.src);
      this.homeAssetsReady = true;
      this.layoutHomeButtons();
      if (failures.includes("Assets/ui/backgroundplain.png")) {
        this.showStartImageError();
      }
      this.elements.homeBootStatus.textContent = failures.length
        ? `Some menu art is missing: ${failures.join(" | ")}`
        : "Start screen ready.";
      this.elements.homeBootOverlay.classList.add("is-exiting");
      window.setTimeout(() => {
        this.elements.homeBootOverlay.classList.add("hidden");
        this.elements.homeBootOverlay.classList.remove("is-exiting");
        window.requestAnimationFrame(() => {
          this.layoutHomeButtons();
          this.elements.homeViewport.classList.add("home-background-ready");
          window.setTimeout(() => {
            this.homeDecorReady = true;
            this.elements.homeViewport.classList.add("home-decor-ready");
            this.startHomeDecorAnimations(true);
          }, 520);
          window.setTimeout(() => {
            this.homeButtonsReady = true;
            this.elements.homeViewport.classList.add("home-buttons-ready", "home-ready");
            this.playHomeButtonIntro();
          }, 1620);
          window.setTimeout(() => {
            this.elements.homeViewport.classList.add("home-clouds-ready");
          }, 4300);
        });
      }, 880);
    });
  }

  preloadImageAsset(element, src, key) {
    return new Promise((resolve) => {
      const finish = (ok) => resolve({ key, src, ok });
      if (element.complete) {
        finish(element.naturalWidth > 0);
        return;
      }
      const onLoad = () => {
        cleanup();
        finish(true);
      };
      const onError = () => {
        cleanup();
        finish(false);
      };
      const cleanup = () => {
        element.removeEventListener("load", onLoad);
        element.removeEventListener("error", onError);
      };
      element.addEventListener("load", onLoad, { once: true });
      element.addEventListener("error", onError, { once: true });
      if (!element.getAttribute("src")) {
        element.setAttribute("src", src);
      }
    });
  }

  openExternalLink(url, emptyMessage) {
    if (!url) {
      this.showMenuToast(emptyMessage, true);
      return;
    }
    window.open(url, "_blank", "noopener");
  }

  handleTopMenu() {
    if (this.elements.screens.game.classList.contains("screen-active")) {
      this.quitRun();
      return;
    }

    if (this.elements.screens.home.classList.contains("screen-active")) {
      this.showScreen("levelSelect");
      return;
    }

    this.showScreen("home");
  }

  isTypingTarget(target) {
    if (!target) {
      return false;
    }
    const tagName = target.tagName?.toLowerCase?.() ?? "";
    return tagName === "input" || tagName === "textarea" || tagName === "select" || target.isContentEditable;
  }

  renderHomeStats() {
    const unlockedMain = Math.min(this.save.legit.highestLevelCleared, MAIN_LEVELS.length);
    const starCount = getTotalStars(this.save.legit);
    const totalTimeMs = Object.values(this.save.legit.levelResults ?? {}).reduce((sum, result) => sum + (result.bestTimeMs ?? 0), 0);
    const mainCleared = MAIN_LEVELS.filter((level) => this.save.legit.levelResults[level.id]?.completed).length;
    const bonusCleared = BONUS_LEVELS.filter((level) => this.save.legit.levelResults[level.id]?.completed).length;
    const advancedCleared = AUTHORED_ADVANCED_MAIN_LEVELS.filter((level) => this.save.legit.levelResults[level.id]?.completed).length;
    const advancedBonusCleared = ADVANCED_BONUS_LEVELS.filter((level) => this.save.legit.levelResults[level.id]?.completed).length;
    const playableSpecials = SPECIAL_LEVELS.filter((level) => !level.needsSetup);
    const specialCleared = playableSpecials.filter((level) => this.save.legit.levelResults[level.id]?.completed).length;
    const authoredTotal = MAIN_LEVELS.length + BONUS_LEVELS.length + AUTHORED_ADVANCED_MAIN_LEVELS.length + ADVANCED_BONUS_LEVELS.length + playableSpecials.length;
    const authoredCleared = mainCleared + bonusCleared + advancedCleared + advancedBonusCleared + specialCleared;
    const totalViews = Object.values(this.save.legit.levelResults ?? {}).reduce((sum, result) => sum + (result.viewCount ?? 0), 0);
    const fastestMain = Object.values(this.save.legit.levelResults ?? {})
      .map((result) => result.bestTimeMs ?? 0)
      .filter((value) => value > 0);
    const speedrun = this.save.legit.speedrun;
    this.elements.homeLevelCount.textContent = `${authoredCleared} / ${authoredTotal}`;
    this.elements.homeUnlockedText.textContent = `${unlockedMain} / ${MAIN_LEVELS.length}`;
    this.elements.homeBestScore.textContent = formatScore(this.save.legit.bestScore);
    this.elements.homeTotalTime.textContent = formatTime(totalTimeMs);
    this.elements.mainProgressText.textContent = `${mainCleared} / ${MAIN_LEVELS.length} cleared`;
    this.elements.bonusUnlockText.textContent = this.isBonusUnlocked() ? "Unlocked" : "Locked";
    this.elements.bonusRuleText.textContent = `Bonuses unlock after normal level 10 or 20 total stars. Current stars: ${starCount}.`;
    this.elements.advancedRevealText.textContent = this.getAdvancedUnlockText();
    this.elements.speedrunRoundsText.textContent = String(speedrun.roundsPlayed ?? 0);
    this.elements.speedrunAverageScoreText.textContent = formatScore(averageOrZero(speedrun.totalScore ?? 0, speedrun.roundsPlayed ?? 0));
    this.elements.speedrunAverageTimeText.textContent = formatTime(averageOrZero(speedrun.totalTimeMs ?? 0, speedrun.roundsPlayed ?? 0));
    this.elements.speedrunFastestText.textContent = speedrun.fastestTimeMs ? formatTime(speedrun.fastestTimeMs) : "0.0s";
    this.elements.speedrunLastPickText.textContent = speedrun.lastLevelId
      ? `Last random pick: ${this.getDisplayLabelForLevelId(speedrun.lastLevelId)}`
      : "Last random pick: none yet.";
    this.renderSpeedrunRecentStrip(speedrun.recentLevelIds ?? []);
    if (this.elements.specialLevelsStatusText) {
      this.elements.specialLevelsStatusText.textContent = SPECIAL_LEVELS.length
        ? `${playableSpecials.length}/${SPECIAL_LEVELS.length} special slots are ready.`
        : "No special slots are authored yet.";
    }
    this.syncSpecialPlaceholderCards();
    this.elements.settingsMainClearsText.textContent = `${mainCleared} / ${MAIN_LEVELS.length}`;
    this.elements.settingsAdvancedClearsText.textContent = `${advancedCleared} / ${AUTHORED_ADVANCED_MAIN_LEVELS.length}`;
    this.elements.settingsTotalViewsText.textContent = String(totalViews);
    this.elements.settingsFastestClearText.textContent = fastestMain.length ? formatTime(Math.min(...fastestMain)) : "0.0s";
    this.elements.settingsSpeedrunAverageText.textContent = formatTime(averageOrZero(speedrun.totalTimeMs ?? 0, speedrun.roundsPlayed ?? 0));
    this.elements.settingsSpeedrunBestText.textContent = speedrun.fastestTimeMs ? formatTime(speedrun.fastestTimeMs) : "0.0s";
  }

  showMenuToast(message, isBad = false) {
    showMenuToastUi(this, message, isBad);
  }

  renderSpeedrunRecentStrip(levelIds) {
    const strip = this.elements.speedrunRecentStrip;
    if (!strip) {
      return;
    }
    strip.innerHTML = "";
    if (!levelIds.length) {
      const empty = document.createElement("span");
      empty.className = "speedrun-recent-empty";
      empty.textContent = "No recent speedrun picks yet.";
      strip.appendChild(empty);
      return;
    }

    levelIds.forEach((levelId) => {
      const chip = document.createElement("span");
      chip.className = "speedrun-recent-chip";
      chip.textContent = this.getDisplayLabelForLevelId(levelId);
      strip.appendChild(chip);
    });
  }

  syncSpecialPlaceholderCards() {
    const cards = this.elements.specialPlaceholderCards ?? [];
    cards.forEach((card, index) => {
      const level = SPECIAL_LEVELS[index];
      const title = card.querySelector("h4");
      const number = card.querySelector(".level-number");
      const lock = card.querySelector(".level-lock");
      if (number) {
        number.textContent = `SL ${index + 1}`;
      }
      if (!level) {
        if (title) {
          title.textContent = `Special ${index + 1}`;
        }
        if (lock) {
          lock.textContent = "Needs setup";
        }
        card.disabled = true;
        card.classList.add("locked");
        card.classList.remove("is-played", "is-unplayed");
        card.onclick = null;
        return;
      }
      if (title) {
        title.textContent = level.name;
      }
      if (level.needsSetup) {
        if (lock) {
          lock.textContent = "Needs setup";
        }
        card.disabled = true;
        card.classList.add("locked");
        card.classList.remove("is-played", "is-unplayed");
        card.onclick = null;
        return;
      }
      if (lock) {
        lock.textContent = "Playable";
      }
      card.disabled = false;
      card.classList.remove("locked");
      card.classList.toggle("is-played", Boolean(this.save.legit.levelResults[level.id]));
      card.classList.toggle("is-unplayed", !this.save.legit.levelResults[level.id]);
      card.onclick = () => {
        const levelIndex = LEVELS.findIndex((item) => item.id === level.id);
        if (levelIndex >= 0) {
          this.state.runMode = "standard";
          this.startCampaignFromLevel(levelIndex);
        }
      };
    });
  }

  renderLevelSelect() {
    this.save = loadSave();
    this.renderLevelGrid(this.elements.mainLevelGrid, MAIN_LEVELS, { kind: "main" });
    this.renderLevelGrid(this.elements.bonusLevelGrid, BONUS_LEVELS, { kind: "bonus" });
    this.renderLevelGrid(this.elements.advancedLevelGrid, ADVANCED_MAIN_LEVELS, { kind: "advanced" });
    this.renderLevelGrid(this.elements.advancedBonusLevelGrid, ADVANCED_BONUS_LEVELS, { kind: "advancedBonus" });
    this.syncLevelSelectPage();
    this.renderHomeStats();
  }

  renderLevelGrid(container, levels, options) {
    container.innerHTML = "";
    levels.forEach((level) => {
      const result = this.save.legit.levelResults[level.id];
      const unlocked = this.isLevelUnlocked(level, options.kind);
      const bestStars = result ? starText(result.bestStars ?? 0) : starText(0);
      const firstScoreValue = result?.firstScore ?? result?.bestScore ?? 0;
      const bestScoreValue = result?.bestScore ?? 0;
      const firstScore = formatScore(firstScoreValue);
      const bestScore = formatScore(bestScoreValue);
      const cardLabel = this.getLevelCardLabel(level, options.kind);
      const button = document.createElement("button");
      const setupMarkup = level.needsSetup
        ? '<p class="level-setup-note">Needs setup</p>'
        : "";
      const scoreMarkup = bestScoreValue !== firstScoreValue
        ? `<div class="level-meta level-best-score"><span>Best ${bestScore}</span><span>First ${firstScore}</span></div>`
        : `<div class="level-meta level-best-score"><span>First ${firstScore}</span></div>`;
      const mirrorMarkup = this.state.mirrorSelectArmed && unlocked
        ? '<p class="level-setup-note">Mirror ready</p>'
        : this.state.upsideDownSelectArmed && unlocked
          ? '<p class="level-setup-note">Upsideown ready</p>'
          : "";
      button.type = "button";
      button.className = `level-card${unlocked ? "" : " locked"}${result ? " is-played" : " is-unplayed"}`;
      button.disabled = !unlocked;
      button.innerHTML = unlocked
        ? `<div class="level-card-top"><h4>${level.name}</h4><span class="level-number">${cardLabel}</span></div>${setupMarkup}${mirrorMarkup}${scoreMarkup}<p class="level-meta level-stars">${bestStars}</p>`
        : `<div class="level-card-top"><h4>${level.name}</h4><span class="level-number">${cardLabel}</span></div><p class="level-lock"><span class="lock-icon" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false"><path d="M7 10V8a5 5 0 0 1 10 0v2h1.5A1.5 1.5 0 0 1 20 11.5v8A1.5 1.5 0 0 1 18.5 21h-13A1.5 1.5 0 0 1 4 19.5v-8A1.5 1.5 0 0 1 5.5 10H7Zm2 0h6V8a3 3 0 1 0-6 0v2Z" fill="currentColor"/></svg></span>Locked</p>${setupMarkup}${scoreMarkup}<p class="level-meta level-stars">${bestStars}</p>`;
      button.addEventListener("click", () => this.startSelectedLevel(level.id));
      container.appendChild(button);
    });
  }

  getLevelCardLabel(level, kind) {
    if (kind === "bonus") {
      return `Bonus ${BONUS_LEVELS.findIndex((item) => item.id === level.id) + 1}`;
    }
    if (kind === "advanced") {
      return `AL ${ADVANCED_MAIN_LEVELS.findIndex((item) => item.id === level.id) + 1}`;
    }
    if (kind === "advancedBonus") {
      return `AB ${ADVANCED_BONUS_LEVELS.findIndex((item) => item.id === level.id) + 1}`;
    }
    return `Level ${MAIN_LEVELS.findIndex((item) => item.id === level.id) + 1}`;
  }

  isLevelUnlocked(level, kind) {
    if (kind === "bonus") {
      return this.isBonusUnlocked();
    }
    if (kind === "advancedBonus") {
      return this.isAdvancedUnlocked();
    }
    if (kind === "advanced") {
      return this.isAdvancedLevelUnlocked(level);
    }
    return this.isMainLevelUnlocked(level);
  }

  isMainLevelUnlocked(level) {
    if (this.sessionTestingUnlocked && !this.isLevelClearanceEnabled()) {
      return true;
    }
    if (this.isLevelClearanceEnabled()) {
      return true;
    }
    const index = MAIN_LEVELS.findIndex((item) => item.id === level.id);
    return index < this.save.legit.highestLevelCleared;
  }

  isBonusUnlocked() {
    if (this.sessionTestingUnlocked && !this.isLevelClearanceEnabled()) {
      return true;
    }
    if (this.isLevelClearanceEnabled()) {
      return true;
    }
    return this.save.legit.highestLevelCleared >= 11 || getTotalStars(this.save.legit) >= 20;
  }

  isAdvancedUnlocked() {
    if (this.sessionTestingUnlocked && !this.isLevelClearanceEnabled()) {
      return true;
    }
    if (this.isLevelClearanceEnabled()) {
      return true;
    }
    const mainCleared = MAIN_LEVELS.every((level) => this.save.legit.levelResults[level.id]?.completed);
    return mainCleared && getTotalStars(this.save.legit) >= 50;
  }

  isSpeedrunUnlocked() {
    if (this.sessionTestingUnlocked && !this.isLevelClearanceEnabled()) {
      return true;
    }
    if (this.isLevelClearanceEnabled()) {
      return true;
    }
    const mainCleared = MAIN_LEVELS.every((level) => this.save.legit.levelResults[level.id]?.completed);
    const advancedCleared = AUTHORED_ADVANCED_MAIN_LEVELS.every((level) => this.save.legit.levelResults[level.id]?.completed);
    return mainCleared && advancedCleared;
  }

  isAdvancedLevelUnlocked(level) {
    if (this.sessionTestingUnlocked && !this.isLevelClearanceEnabled()) {
      return true;
    }
    if (this.isLevelClearanceEnabled()) {
      return true;
    }
    if (!this.isAdvancedUnlocked()) {
      return false;
    }
    const index = ADVANCED_MAIN_LEVELS.findIndex((item) => item.id === level.id);
    if (index <= 0) {
      return true;
    }
    return Boolean(this.save.legit.levelResults[ADVANCED_MAIN_LEVELS[index - 1].id]?.completed);
  }

  getAdvancedUnlockText() {
    if (this.isAdvancedUnlocked()) {
      return "Advanced levels unlocked.";
    }
    const totalStars = getTotalStars(this.save.legit);
    const remainingStars = Math.max(0, 50 - totalStars);
    const mainDone = MAIN_LEVELS.filter((level) => this.save.legit.levelResults[level.id]?.completed).length;
    if (mainDone < MAIN_LEVELS.length) {
      return `A surprise route unlocks after all 20 main levels are cleared and 50 stars are earned. Main clears: ${mainDone}/${MAIN_LEVELS.length}.`;
    }
    return `A surprise route unlocks at ${totalStars}/50 stars. ${remainingStars} more stars to go.`;
  }

  getSpeedrunUnlockText() {
    if (this.isSpeedrunUnlocked()) {
      return "Speedrun Levels unlocked.";
    }
    const advancedDone = AUTHORED_ADVANCED_MAIN_LEVELS.filter((level) => this.save.legit.levelResults[level.id]?.completed).length;
    return `Page 3 unlocks after all authored advanced levels are cleared. Advanced clears: ${advancedDone}/${AUTHORED_ADVANCED_MAIN_LEVELS.length}.`;
  }

  changeLevelSelectPage(direction) {
    const nextPage = clamp(this.state.levelSelectPage + direction, 1, 3);
    if (nextPage === 2 && !this.isAdvancedUnlocked()) {
      this.showMenuToast(this.getAdvancedUnlockText(), true);
      return;
    }
    if (nextPage === 3 && !this.isSpeedrunUnlocked()) {
      this.showMenuToast(this.getSpeedrunUnlockText(), true);
      return;
    }
    this.state.levelSelectPage = nextPage;
    if (nextPage === 2 && this.isAdvancedUnlocked() && !this.save.meta.advancedPageSeen) {
      this.save = saveMeta({ advancedPageSeen: true });
      this.showMenuToast("Page Two unlocked: Advanced Levels now hold the tougher multi-target route.");
    }
    if (nextPage === 3 && this.isSpeedrunUnlocked() && !this.save.meta.speedrunPageSeen) {
      this.save = saveMeta({ speedrunPageSeen: true });
      this.showMenuToast("Page Three unlocked: Extras holds speedrun routes, mirror mode, and future special levels.");
    }
    this.syncLevelSelectPage();
  }

  syncLevelSelectPage() {
    const levelSelectActive = this.elements.screens.levelSelect.classList.contains("screen-active");
    const page = this.state.levelSelectPage;
    this.elements.body.dataset.levelPage = levelSelectActive ? String(page) : "0";
    const onAdvancedPage = page === 2 && this.isAdvancedUnlocked();
    const onSpeedrunPage = page === 3 && this.isSpeedrunUnlocked();
    this.elements.levelSelectPageLabel.textContent = this.state.mirrorSelectArmed
      ? "Level Select: Mirror Mode"
      : this.state.upsideDownSelectArmed
        ? "Level Select: Upsideown Levels"
      : onSpeedrunPage
        ? "Level Select: Extras"
        : onAdvancedPage
        ? "Advanced Levels"
        : "Main Levels";
    this.elements.mainRouteSection.classList.toggle("hidden", page !== 1);
    this.elements.bonusRouteSection.classList.toggle("hidden", page !== 1);
    this.elements.progressRouteSection.classList.toggle("hidden", page !== 1);
    this.elements.advancedRouteSection.classList.toggle("hidden", !onAdvancedPage);
    this.elements.advancedBonusSection.classList.toggle("hidden", !onAdvancedPage);
    this.elements.speedrunRouteSection.classList.toggle("hidden", !onSpeedrunPage);
    this.elements.levelSelectPrevPageButton.classList.toggle("hidden", !levelSelectActive || !onAdvancedPage);
    this.elements.levelSelectNextPageButton.classList.toggle("hidden", !levelSelectActive || !this.isAdvancedUnlocked() || page !== 1);
    this.elements.levelSelectThirdPageButton.classList.toggle("hidden", !levelSelectActive || !this.isSpeedrunUnlocked() || !onAdvancedPage);
    this.elements.levelSelectBackFromSpeedrunButton.classList.toggle("hidden", !levelSelectActive || !onSpeedrunPage);
    if (this.elements.startSpecialLevelsButton) {
      this.elements.startSpecialLevelsButton.disabled = !SPECIAL_LEVELS.some((level) => !level.needsSetup);
    }
    if (this.elements.specialLevelsStatusText) {
      const playableSpecials = SPECIAL_LEVELS.filter((level) => !level.needsSetup).length;
      this.elements.specialLevelsStatusText.textContent = SPECIAL_LEVELS.length
        ? `${playableSpecials}/${SPECIAL_LEVELS.length} special slots are ready.`
        : "Ten special slots are reserved here. Current entries still need setup.";
    }
    if (this.elements.startSpecialLevelsButton && SPECIAL_LEVELS.some((level) => !level.needsSetup)) {
      this.elements.startSpecialLevelsButton.disabled = false;
    }
    this.syncSpecialPlaceholderCards();
  }

  startNextLevel() {
    const nextIndex = Math.max(0, Math.min(this.save.legit.highestLevelCleared - 1, MAIN_LEVELS.length - 1));
    this.state.runMode = "standard";
    this.startCampaignFromLevel(nextIndex);
  }

  startSelectedLevel(levelId) {
    const index = LEVELS.findIndex((level) => level.id === levelId);
    if (index >= 0 && ((this.sessionTestingUnlocked && !this.isLevelClearanceEnabled()) || this.isLevelUnlocked(LEVELS[index], LEVELS[index].isAdvancedBonus ? "advancedBonus" : LEVELS[index].isAdvanced ? "advanced" : LEVELS[index].isBonus ? "bonus" : "main"))) {
      this.state.runMode = this.state.mirrorSelectArmed
        ? "mirror"
        : this.state.upsideDownSelectArmed
          ? "upside"
          : "standard";
      this.state.mirrorSelectArmed = false;
      this.state.upsideDownSelectArmed = false;
      this.startCampaignFromLevel(index);
    }
  }

  armMirrorMode() {
    this.state.mirrorSelectArmed = true;
    this.state.upsideDownSelectArmed = false;
    this.state.levelSelectPage = 1;
    this.renderLevelSelect();
    this.showScreen("levelSelect");
    this.showMenuToast("Mirror Mode armed. Pick any unlocked level.");
  }

  armUpsideDownMode() {
    this.state.upsideDownSelectArmed = true;
    this.state.mirrorSelectArmed = false;
    this.state.levelSelectPage = 1;
    this.renderLevelSelect();
    this.showScreen("levelSelect");
    this.showMenuToast("Upsideown Levels armed. Pick any unlocked level.");
  }

  startSpecialLevelsRoute() {
    const firstReady = SPECIAL_LEVELS.find((level) => !level.needsSetup);
    if (!firstReady) {
      this.showMenuToast("Special levels are reserved here, but they still need setup.", true);
      return;
    }
    const index = LEVELS.findIndex((level) => level.id === firstReady.id);
    if (index < 0) {
      this.showMenuToast("Special level data is missing from the current build.", true);
      return;
    }
    this.state.runMode = "standard";
    this.state.mirrorSelectArmed = false;
    this.state.upsideDownSelectArmed = false;
    this.startCampaignFromLevel(index);
  }

  getSpeedrunPool(pool = "all") {
    if (pool === "main") {
      return [...MAIN_LEVELS];
    }
    if (pool === "advanced") {
      return [...ADVANCED_MAIN_LEVELS];
    }
    if (pool === "bonus") {
      return [...BONUS_LEVELS, ...ADVANCED_BONUS_LEVELS];
    }
    if (pool === "special") {
      return [...SPECIAL_LEVELS];
    }
    return [...MAIN_LEVELS, ...BONUS_LEVELS, ...ADVANCED_MAIN_LEVELS, ...ADVANCED_BONUS_LEVELS, ...SPECIAL_LEVELS];
  }

  startRandomSpeedrun(pool = "all") {
    this.state.mirrorSelectArmed = false;
    this.state.upsideDownSelectArmed = false;
    const level = this.pickRandomSpeedrunLevel(pool);
    if (!level) {
      const message = pool === "special"
        ? "No special levels are authored yet."
        : "No speedrun level could be selected.";
      this.showMenuToast(message, true);
      return;
    }
    const index = LEVELS.findIndex((item) => item.id === level.id);
    if (index < 0) {
      this.showMenuToast("Speedrun level is missing from the current data.", true);
      return;
    }
    this.state.runMode = "speedrun";
    this.startCampaignFromLevel(index);
  }

  pickRandomSpeedrunLevel(pool = "all") {
    const available = this.getSpeedrunPool(pool).filter((level) => !level.needsSetup);
    if (!available.length) {
      return null;
    }
    let pick = available[Math.floor(Math.random() * available.length)];
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const recentPenalty = this.speedrunRecentIds.includes(pick.id);
      if (!recentPenalty || Math.random() > 0.82) {
        break;
      }
      pick = available[Math.floor(Math.random() * available.length)];
    }
    this.speedrunRecentIds.push(pick.id);
    if (this.speedrunRecentIds.length > 3) {
      this.speedrunRecentIds.shift();
    }
    return pick;
  }

  retryCurrentLevel() {
    this.elements.resultOverlay.classList.add("hidden");
    if (this.save.settings.showLevelIntro === "on") {
      this.openLevelIntro();
      return;
    }
    this.beginLevel();
  }

  skipLevel() {
    if (!this.isRunCheatEnabled()) {
      return;
    }
    const nextIndex = this.getNextLevelIndex();
    if (nextIndex === null) {
      this.showScreen("levelSelect");
      return;
    }
    this.state.levelIndex = nextIndex;
    if (this.save.settings.showLevelIntro === "on") {
      this.openLevelIntro();
      return;
    }
    this.beginLevel();
  }

  startCampaignFromLevel(index) {
    this.closeAllOverlays();
    this.state.mirrorSelectArmed = false;
    this.state.upsideDownSelectArmed = false;
    this.state.levelIndex = index;
    this.state.totalScore = 0;
    this.state.runCheated = !this.isLegitProgressionSession();
    this.state.paused = false;
    this.state.mirrorActive = this.state.runMode === "mirror";
    this.state.upsideDownActive = this.state.runMode === "upside";
    this.showScreen("game");
    if (this.save.settings.showLevelIntro === "on") {
      this.openLevelIntro();
    } else {
      this.beginLevel();
    }
  }

  getCurrentLevel() {
    return LEVELS[this.state.levelIndex];
  }

  getCurrentLevelTargets() {
    return this.getCurrentLevel().targets ?? [];
  }

  getCurrentLevelLabel(level = this.getCurrentLevel()) {
    let base;
    if (level.isSpecial) {
      base = `SL ${SPECIAL_LEVELS.findIndex((item) => item.id === level.id) + 1}`;
    } else if (level.isAdvancedBonus) {
      base = `AB ${ADVANCED_BONUS_LEVELS.findIndex((item) => item.id === level.id) + 1}`;
    } else if (level.isAdvanced) {
      base = `AL ${ADVANCED_MAIN_LEVELS.findIndex((item) => item.id === level.id) + 1}`;
    } else if (level.isBonus) {
      base = `Bonus ${BONUS_LEVELS.findIndex((item) => item.id === level.id) + 1}`;
    } else {
      base = `Level ${MAIN_LEVELS.findIndex((item) => item.id === level.id) + 1}`;
    }
    if (this.state.runMode === "mirror") {
      return `${base} Mirror`;
    }
    if (this.state.runMode === "upside") {
      return `${base} Upsideown`;
    }
    return base;
  }

  getDisplayLabelForLevelId(levelId) {
    const level = LEVELS.find((item) => item.id === levelId);
    if (!level) {
      return "Unknown level";
    }
    if (level.isSpecial) {
      return `Page 3, SL ${SPECIAL_LEVELS.findIndex((item) => item.id === level.id) + 1}, ${level.name}`;
    }
    if (level.isAdvancedBonus) {
      return `Page 2, AB ${ADVANCED_BONUS_LEVELS.findIndex((item) => item.id === level.id) + 1}, ${level.name}`;
    }
    if (level.isAdvanced) {
      return `Page 2, AL ${ADVANCED_MAIN_LEVELS.findIndex((item) => item.id === level.id) + 1}, ${level.name}`;
    }
    if (level.isBonus) {
      return `Page 1, Bonus ${BONUS_LEVELS.findIndex((item) => item.id === level.id) + 1}, ${level.name}`;
    }
    return `Page 1, Level ${MAIN_LEVELS.findIndex((item) => item.id === level.id) + 1}, ${level.name}`;
  }

  openLevelIntro() {
    const level = this.getCurrentLevel();
    this.prepareSceneImageLoad();
    this.elements.introLevelLabel.textContent = this.state.runMode === "speedrun"
      ? `Speedrun Pick • ${this.getDisplayLabelForLevelId(level.id)}`
      : this.getCurrentLevelLabel(level);
    this.elements.introLevelName.textContent = level.name;
    this.clearIntroPreviewError();
    this.renderPreviewList(this.elements.introPreviewList, this.elements.introPreviewErrorText, level.targets);
    if (level.id === "advanced-02" && !this.save.meta.advancedMultiSeen) {
      this.elements.introPreviewHint.textContent = "Things just got a little harder. From here on, some advanced levels hide two people, and you need to click both before the level clears.";
      this.save = saveMeta({ advancedMultiSeen: true });
    } else {
      this.elements.introPreviewHint.textContent = level.targets.length > 1
        ? this.getMultiTargetIntroText(level.targets.length)
        : "Find the exact preview target in the crowd scene.";
    }
    this.elements.levelIntroOverlay.classList.remove("hidden");
  }

  beginLevel() {
    const level = this.getCurrentLevel();
    this.elements.levelIntroOverlay.classList.add("hidden");
    this.hideMagnifier();
    this.state.mirrorActive = this.state.runMode === "mirror";
    this.state.upsideDownActive = this.state.runMode === "upside";
    this.state.elapsedMs = 0;
    this.state.wrongClicks = 0;
    this.state.pointerImage = null;
    this.state.lastClickImage = null;
    this.state.foundTargetIds = new Set();
    this.state.runActive = false;
    this.stopElapsedTimer();
    this.elements.levelImage.classList.add("asset-loading");
    this.elements.levelImage.style.visibility = "hidden";
    if (this.state.runMode !== "mirror" && this.state.runMode !== "upside") {
      this.save = recordLevelView({
        cheated: this.state.runCheated,
        levelId: level.id,
      });
    }
    const levelLabel = this.state.runMode === "speedrun"
      ? this.getDisplayLabelForLevelId(level.id)
      : this.getCurrentLevelLabel(level);
    this.elements.hudLevelText.textContent = `${level.name} • ${levelLabel}`;
    this.elements.hudLevelName.textContent = "";
    this.elements.targetPreviewLabel.textContent = level.targets.length > 1 ? "Find These People" : "Find This Person";
    this.elements.sceneFallback.classList.add("hidden");
    this.preloadLevelAssets(this.state.levelIndex, Math.max(2, this.getPreloadDepth()));
    this.renderPreviewList(this.elements.targetPreviewList, this.elements.previewErrorText, level.targets);
    this.prepareSceneImageLoad();
    const warmed = this.preloadedAssets.get(level.background);
    this.elements.levelImage.src = warmed?.src || level.background;
    this.renderHitboxes(level.targets, this.state.foundTargetIds);
    this.setPreviewVisibility(this.save.settings.previewDefault !== "hidden");
    this.syncFoundPreviewState();
    this.updateHud();
  }

  renderPreviewList(container, errorElement, targets) {
    renderPreviewListUi(container, errorElement, targets);
  }

  getMultiTargetIntroText(count) {
    return buildMultiTargetIntroText(count);
  }

  syncFoundPreviewState() {
    syncFoundPreviewStateUi(this);
  }

  prepareSceneImageLoad() {
    this.elements.levelImage.classList.add("asset-loading");
    this.elements.levelImage.style.visibility = "hidden";
    this.elements.sceneLoadingText?.classList.remove("hidden");
    if (this.elements.sceneLoadingText) {
      const preloadDepth = this.getPreloadDepth();
      this.elements.sceneLoadingText.textContent = preloadDepth >= 5
        ? "Loading level art and warming nearby scenes..."
        : "Loading level art...";
    }
    this.elements.levelImage.removeAttribute("src");
    this.elements.levelImage.setAttribute("src", "");
    this.elements.levelImage.src = "";
    this.elements.sceneContent.style.width = "1px";
    this.elements.sceneContent.style.height = "1px";
    this.elements.hitboxOverlay.style.width = "1px";
    this.elements.hitboxOverlay.style.height = "1px";
  }

  onLevelImageLoaded() {
    this.elements.levelImage.classList.remove("asset-loading");
    this.elements.levelImage.style.visibility = "visible";
    this.elements.sceneLoadingText?.classList.add("hidden");
    this.state.naturalWidth = this.elements.levelImage.naturalWidth || 1;
    this.state.naturalHeight = this.elements.levelImage.naturalHeight || 1;
    this.elements.sceneContent.style.width = `${this.state.naturalWidth}px`;
    this.elements.sceneContent.style.height = `${this.state.naturalHeight}px`;
    this.elements.hitboxOverlay.style.width = `${this.state.naturalWidth}px`;
    this.elements.hitboxOverlay.style.height = `${this.state.naturalHeight}px`;
    this.elements.sceneFallback.classList.add("hidden");
    this.fitLevelToViewport();
    this.state.startTimestamp = performance.now();
    this.state.runActive = true;
    this.startElapsedTimer();
    if (this.state.runMode !== "speedrun") {
      this.preloadLevelAssets(this.getNextLevelIndex(), this.getPreloadDepth());
    } else {
      this.preloadSpeedrunAssets();
    }
  }

  onLevelImageError() {
    const path = this.getCurrentLevel().background;
    this.elements.levelImage.classList.remove("asset-loading");
    this.elements.levelImage.style.visibility = "hidden";
    this.elements.sceneLoadingText?.classList.add("hidden");
    this.elements.levelImage.removeAttribute("src");
    this.elements.sceneFallbackTitle.textContent = "Unable to load level background";
    this.elements.sceneFallbackText.textContent = `Tried to load: ${path}`;
    this.elements.sceneFallback.classList.remove("hidden");
    this.state.runActive = false;
    this.stopElapsedTimer();
  }

  clearIntroPreviewError() {
    this.elements.introPreviewErrorText.classList.add("hidden");
    this.elements.introPreviewErrorText.textContent = "";
  }

  preloadImage(path) {
    if (!path || this.preloadedAssets.has(path)) {
      return;
    }
    const image = new Image();
    image.decoding = "async";
    image.loading = "eager";
    image.src = path;
    this.preloadedAssets.set(path, image);
  }

  preloadLevelAssets(levelIndex, depth = 1) {
    if (levelIndex === null || levelIndex < 0 || levelIndex >= LEVELS.length) {
      return;
    }
    for (let offset = 0; offset < depth; offset += 1) {
      const nextLevel = LEVELS[levelIndex + offset];
      if (!nextLevel) {
        break;
      }
      this.preloadImage(nextLevel.background);
      nextLevel.targets.forEach((target) => this.preloadImage(target.preview));
    }
  }

  preloadSpeedrunAssets() {
    const pool = [...MAIN_LEVELS, ...BONUS_LEVELS, ...ADVANCED_MAIN_LEVELS, ...ADVANCED_BONUS_LEVELS, ...SPECIAL_LEVELS];
    if (!pool.length) {
      return;
    }
    const currentId = this.getCurrentLevel()?.id;
    const picks = [];
    const recent = new Set(this.speedrunRecentIds);
    const preferred = pool.filter((level) => level.id !== currentId && !recent.has(level.id));
    const fallback = pool.filter((level) => level.id !== currentId);
    const source = preferred.length ? preferred : fallback;
    const targetCount = Math.max(8, this.getPreloadDepth() * 3);
    while (source.length && picks.length < targetCount) {
      const index = Math.floor(Math.random() * source.length);
      picks.push(source.splice(index, 1)[0]);
    }
    picks.forEach((level) => {
      this.preloadImage(level.background);
      level.targets.forEach((target) => this.preloadImage(target.preview));
    });
  }

  shouldShowAdvancedInfo(level) {
    return false;
  }

  openAdvancedInfo() {
    this.elements.levelIntroOverlay.classList.add("hidden");
    this.elements.advancedInfoTitle.textContent = "Things just got more exciting";
    this.elements.advancedInfoBody.textContent = "Advanced Level 2 and beyond can hide two people in one scene. You now need to click every target before the level clears.";
    this.elements.advancedInfoOverlay.classList.remove("hidden");
  }

  closeAdvancedInfo() {
    this.save = saveMeta({ advancedMultiSeen: true });
    this.elements.advancedInfoOverlay.classList.add("hidden");
    this.beginLevel();
  }

  showStartImageError() {
    this.elements.startScreenFallback.classList.remove("hidden");
    this.elements.startScreenErrorText.textContent = "Tried to load: Assets/ui/backgroundplain.png";
  }

  hideStartImageError() {
    this.elements.startScreenFallback.classList.add("hidden");
  }

  layoutHomeButtons() {
    layoutHomeButtonsUi(this, {
      layers: START_SCREEN_LAYERS,
      start: START_SCREEN_BUTTONS.start,
      settings: START_SCREEN_BUTTONS.settings,
      moreGames: START_SCREEN_BUTTONS.moreGames,
      nameLink: START_SCREEN_BUTTONS.nameLink,
      xOffset: HOME_BUTTON_X_OFFSET,
      yOffset: HOME_BUTTON_Y_OFFSET,
      alphaThreshold: HOME_BUTTON_ALPHA_THRESHOLD,
    });
  }

  startHomeDecorAnimations(force = false) {
    if (!this.homeDecorReady) {
      return;
    }
    if (this.homeButtonEditorEnabled) {
      this.stopHomeDecorAnimations(false);
      return;
    }
    const viewport = this.elements.homeViewport;
    if (this.homeDecorSettleTimerId) {
      window.clearTimeout(this.homeDecorSettleTimerId);
      this.homeDecorSettleTimerId = null;
    }
    if (this.homeDecorStarted && !force) {
      viewport.classList.remove("home-decor-paused");
      viewport.classList.add("home-live");
      return;
    }
    this.homeDecorStarted = true;
    viewport.classList.remove("home-decor-paused", "home-live");
    viewport.classList.add("home-animating");
    this.ensureHomeWheelLoop();
    const settleDelay = this.save.settings.motion === "reduced" ? 3000 : 8600;
    this.homeDecorSettleTimerId = window.setTimeout(() => {
      viewport.classList.remove("home-animating");
      viewport.classList.add("home-live");
      this.homeDecorSettleTimerId = null;
    }, settleDelay);
  }

  stopHomeDecorAnimations(force = false) {
    if (this.homeDecorSettleTimerId) {
      window.clearTimeout(this.homeDecorSettleTimerId);
      this.homeDecorSettleTimerId = null;
    }
    if (force) {
      this.homeDecorStarted = false;
      this.elements.homeViewport.classList.remove("home-animating", "home-decor-paused", "home-live");
      this.stopHomeWheelLoop();
      return;
    }
    if (!this.homeDecorStarted) {
      return;
    }
    this.elements.homeViewport.classList.add("home-decor-paused");
  }

  playHomeButtonIntro() {
    if (!this.homeAssetsReady || !this.homeButtonsReady) {
      return;
    }
    playHomeButtonIntroUi(this, HOME_BUTTON_ANIMATION_MS, HOME_BUTTON_STAGGER_MS);
  }

  skipHomeIntroSequence() {
    if (!this.homeAssetsReady) {
      return;
    }
    this.elements.homeBootOverlay.classList.add("hidden");
    this.elements.homeBootOverlay.classList.remove("is-exiting");
    this.elements.homeViewport.classList.add("home-background-ready", "home-decor-ready", "home-clouds-ready", "home-buttons-ready", "home-ready");
    this.homeDecorReady = true;
    this.homeButtonsReady = true;
    this.startHomeDecorAnimations(true);
    settleHomeButtonIntroUi(this);
  }

  isUiEventTarget(target) {
    return Boolean(target?.closest?.("button, select, input, .play-topbar, .target-card, .play-stats, .modal-card"));
  }

  renderHomeDebugOverlay(drawWidth, drawHeight, naturalWidth, naturalHeight) {
    const debug = this.elements.homeDebugOverlay;
    debug.innerHTML = "";
    const active = this.sessionTestingUnlocked;
    debug.classList.toggle("hidden", !active);
    this.elements.homeDebugReadout.classList.toggle("hidden", !active);
    if (!active) {
      return;
    }

    [
      ["start", START_SCREEN_BUTTONS.start, this.elements.startGameButton],
      ["settings", START_SCREEN_BUTTONS.settings, this.elements.openSettingsButton],
      ["more", START_SCREEN_BUTTONS.moreGames, this.elements.moreGamesButton],
    ].forEach(([label, zone, buttonElement]) => {
      const adjusted = this.getAdjustedHomeZone(zone);
      const node = document.createElement("div");
      node.className = `home-debug-box color-${zone.color}`;
      const tag = document.createElement("span");
      tag.className = "home-debug-label";
      const overlayRect = this.elements.homeButtonOverlay.getBoundingClientRect();
      const buttonRect = buttonElement.getBoundingClientRect();
      node.style.left = `${buttonRect.left - overlayRect.left}px`;
      node.style.top = `${buttonRect.top - overlayRect.top}px`;
      node.style.width = `${buttonRect.width}px`;
      node.style.height = `${buttonRect.height}px`;
      tag.textContent = `${label}: ${Math.min(adjusted.x1, adjusted.x2)},${Math.min(adjusted.y1, adjusted.y2)} -> ${Math.max(adjusted.x1, adjusted.x2)},${Math.max(adjusted.y1, adjusted.y2)}`;
      node.appendChild(tag);
      debug.appendChild(node);
    });
  }

  updateHomeDebug(event) {
    updateHomeDebugUi(this, event, {
      layers: START_SCREEN_LAYERS,
      start: START_SCREEN_BUTTONS.start,
      settings: START_SCREEN_BUTTONS.settings,
      moreGames: START_SCREEN_BUTTONS.moreGames,
      nameLink: START_SCREEN_BUTTONS.nameLink,
      xOffset: HOME_BUTTON_X_OFFSET,
      yOffset: HOME_BUTTON_Y_OFFSET,
      alphaThreshold: HOME_BUTTON_ALPHA_THRESHOLD,
    });
  }

  renderHitboxes(targets, foundTargetIds = new Set()) {
    renderHitboxesUi(this, targets, foundTargetIds);
    this.refreshCheatUi();
  }

  startElapsedTimer() {
    this.stopElapsedTimer();
    this.state.elapsedTimerId = window.setInterval(() => {
      if (!this.state.runActive || this.state.paused) {
        return;
      }
      this.state.elapsedMs = performance.now() - this.state.startTimestamp;
      this.updateHud();
    }, 80);
  }

  stopElapsedTimer() {
    if (this.state.elapsedTimerId) {
      window.clearInterval(this.state.elapsedTimerId);
      this.state.elapsedTimerId = null;
    }
  }

  getCurrentLevelScore() {
    const timePenalty = Math.floor(this.state.elapsedMs / 120);
    return Math.max(0, DEFAULT_SETTINGS.correctClickPoints - timePenalty - (this.state.wrongClicks * DEFAULT_SETTINGS.wrongClickScorePenalty));
  }

  updateHud() {
    this.elements.hudTimeText.textContent = formatTime(this.state.elapsedMs);
    this.elements.hudStarsText.textContent = starText(getStars(this.state.elapsedMs));
    this.elements.hudScoreText.textContent = formatScore(this.getCurrentLevelScore());
  }

  togglePreviewCard() {
    const card = this.elements.targetPreviewList.closest(".target-card");
    this.setPreviewVisibility(card.classList.contains("hidden-preview"));
  }

  setPreviewVisibility(visible) {
    const card = this.elements.targetPreviewList.closest(".target-card");
    card.classList.toggle("hidden-preview", !visible);
    this.elements.togglePreviewButton.textContent = visible ? "Hide" : "Show";
  }

  pauseGame() {
    if (!this.state.runActive || this.state.paused) {
      return;
    }
    this.state.paused = true;
    this.stopElapsedTimer();
    this.clearKeys();
    this.elements.pauseOverlay.classList.remove("hidden");
  }

  resumeGame() {
    this.state.paused = false;
    this.state.startTimestamp = performance.now() - this.state.elapsedMs;
    this.startElapsedTimer();
    this.elements.pauseOverlay.classList.add("hidden");
  }

  quitRun() {
    if (this.elements.screens.game.classList.contains("screen-active")) {
      this.openQuitPrompt();
      return;
    }
    this.confirmQuitRun();
  }

  openQuitPrompt() {
    this.state.quitPromptResumeTarget = this.state.runActive && !this.state.paused;
    if (this.state.quitPromptResumeTarget) {
      this.pauseGame();
    }
    this.elements.quitConfirmOverlay.classList.remove("hidden");
  }

  closeQuitPrompt() {
    this.elements.quitConfirmOverlay.classList.add("hidden");
    if (this.elements.screens.game.classList.contains("screen-active") && this.state.quitPromptResumeTarget) {
      this.resumeGame();
    }
    this.state.quitPromptResumeTarget = false;
  }

  confirmQuitRun() {
    const previousRunMode = this.state.runMode;
    this.elements.quitConfirmOverlay.classList.add("hidden");
    this.state.quitPromptResumeTarget = false;
    this.stopElapsedTimer();
    this.clearKeys();
    this.closeAllOverlays();
    if (previousRunMode === "mirror") {
      this.state.mirrorSelectArmed = true;
      this.state.upsideDownSelectArmed = false;
      this.state.levelSelectPage = 3;
    } else if (previousRunMode === "upside") {
      this.state.upsideDownSelectArmed = true;
      this.state.mirrorSelectArmed = false;
      this.state.levelSelectPage = 3;
    }
    this.showScreen("levelSelect");
    this.renderLevelSelect();
  }

  returnToLevelSelect(preserveVariant = false) {
    if (preserveVariant && this.state.runMode === "mirror") {
      this.state.mirrorSelectArmed = true;
      this.state.upsideDownSelectArmed = false;
      this.state.levelSelectPage = 3;
    } else if (preserveVariant && this.state.runMode === "upside") {
      this.state.upsideDownSelectArmed = true;
      this.state.mirrorSelectArmed = false;
      this.state.levelSelectPage = 3;
    }
    this.showScreen("levelSelect");
    this.renderLevelSelect();
  }

  closeAllOverlays() {
    [
      this.elements.levelIntroOverlay,
      this.elements.advancedInfoOverlay,
      this.elements.pauseOverlay,
      this.elements.quitConfirmOverlay,
      this.elements.resultOverlay,
      this.elements.completionOverlay,
      this.elements.changelogOverlay,
    ].forEach((node) => node.classList.add("hidden"));
  }

  handleVersionTap(event) {
    if (event.altKey) {
      this.diagnosticTapCount += 1;
      if (this.diagnosticTapCount >= 4) {
        this.elements.diagnosticUnlock.classList.remove("hidden");
        this.elements.diagnosticCodeInput.focus();
        this.elements.diagnosticMessage.textContent = "Enter the code.";
        this.diagnosticTapCount = 0;
      }
      return;
    }
    this.diagnosticTapCount = 0;
    this.openChangelog();
  }

  unlockDiagnostics(event) {
    if (this.elements.diagnosticCodeInput.value.trim() === DIAGNOSTIC_CODE) {
      this.sessionTestingUnlocked = true;
      if (event.altKey) {
        this.enableAllCheats();
        this.elements.diagnosticMessage.textContent = "Opened with all cheats enabled.";
      } else {
        this.elements.diagnosticMessage.textContent = "Opened. Choose the tools you want below.";
        this.refreshCheatUi();
      }
      return;
    }
    this.elements.diagnosticMessage.textContent = "Denied.";
  }

  onPointerDown(event) {
    if (this.isUiEventTarget(event.target)) {
      return;
    }
    if (!this.state.runActive || this.state.paused) {
      return;
    }
    if (event.button === 2) {
      event.preventDefault();
      this.state.magnifier.pointerId = event.pointerId;
      this.state.magnifier.downAt = performance.now();
      this.state.magnifier.pointerX = event.clientX;
      this.state.magnifier.pointerY = event.clientY;
      this.elements.sceneViewport.setPointerCapture(event.pointerId);
      window.clearTimeout(this.magnifierHoldTimerId);
      this.magnifierHoldTimerId = window.setTimeout(() => {
        if (this.state.magnifier.pointerId === event.pointerId) {
          this.showMagnifier(event.clientX, event.clientY, false);
        }
      }, MAGNIFIER_HOLD_MS);
      return;
    }
    this.elements.sceneViewport.setPointerCapture(event.pointerId);
    this.state.drag.pointerId = event.pointerId;
    this.state.drag.startX = event.clientX;
    this.state.drag.startY = event.clientY;
    this.state.drag.originX = this.state.transform.x;
    this.state.drag.originY = this.state.transform.y;
    this.state.drag.moved = false;
  }

  onPointerMove(event) {
    if (this.isUiEventTarget(event.target)) {
      return;
    }
    this.state.pointerImage = this.clientToImage(event.clientX, event.clientY);
    this.updateDebugReadout();
    if (this.state.magnifier.pointerId === event.pointerId || this.state.magnifier.active) {
      this.updateMagnifier(event.clientX, event.clientY);
    }
    if (this.state.drag.pointerId !== event.pointerId) {
      return;
    }
    const dx = event.clientX - this.state.drag.startX;
    const dy = event.clientY - this.state.drag.startY;
    if (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD) {
      this.state.drag.moved = true;
    }
    if (this.state.drag.moved) {
      this.state.transform.x = this.state.drag.originX + dx;
      this.state.transform.y = this.state.drag.originY + dy;
      this.clampTransform();
      this.applyTransform();
    }
  }

  onPointerUp(event) {
    if (this.isUiEventTarget(event.target)) {
      this.clearDragState(event.pointerId);
      return;
    }
    if (event.button === 2 && this.state.magnifier.pointerId === event.pointerId) {
      event.preventDefault();
      window.clearTimeout(this.magnifierHoldTimerId);
      const held = (performance.now() - this.state.magnifier.downAt) >= MAGNIFIER_HOLD_MS;
      if (!held) {
        if (this.state.magnifier.active && this.state.magnifier.persistent) {
          this.hideMagnifier();
        } else {
          this.showMagnifier(event.clientX, event.clientY, true);
        }
      } else if (!this.state.magnifier.persistent) {
        this.hideMagnifier();
      }
      this.state.magnifier.pointerId = null;
      return;
    }
    if (this.state.drag.pointerId !== event.pointerId) {
      return;
    }
    if (!this.state.drag.moved) {
      const clickX = event.clientX;
      const clickY = event.clientY;
      const point = this.clientToImage(clickX, clickY);
      if (point) {
        this.handleSceneSelection(point);
      }
    }
    this.clearDragState(event.pointerId);
  }

  onPointerCancel(event) {
    if (this.state.magnifier.pointerId === event.pointerId) {
      window.clearTimeout(this.magnifierHoldTimerId);
      if (!this.state.magnifier.persistent) {
        this.hideMagnifier();
      }
      this.state.magnifier.pointerId = null;
    }
    this.clearDragState(event.pointerId);
  }

  onSceneContextMenu(event) {
    event.preventDefault();
  }

  clearDragState(pointerId) {
    if (this.state.drag.pointerId === pointerId) {
      this.state.drag.pointerId = null;
      this.state.drag.moved = false;
    }
  }

  onKeyDown(event) {
    if (this.isTypingTarget(event.target)) {
      return;
    }
    const key = event.key.toLowerCase();
    this.trackEasterEggs(key);
    if (key === "escape") {
      event.preventDefault();
      this.handleEscapeShortcut();
      return;
    }
    if (key === "h" && this.cheatFlags.homeEditor && this.elements.screens.home.classList.contains("screen-active")) {
      event.preventDefault();
      this.toggleHomeButtonEditor();
      return;
    }
    if (this.homeButtonEditorEnabled && this.elements.screens.home.classList.contains("screen-active")) {
      if (["1", "2", "3"].includes(key)) {
        event.preventDefault();
        this.homeButtonEditorSelection = key === "1" ? "start" : key === "2" ? "settings" : "more";
        this.layoutHomeButtons();
        this.refreshHomeEditorUi();
        return;
      }
      if (["4", "5", "6", "7", "8", "9", "0"].includes(key)) {
        event.preventDefault();
        const editorHotkeys = {
          "4": "titleBanner",
          "5": "magnifierDecor",
          "6": "magnifierFaces",
          "7": "airball",
          "8": "blimp",
          "9": "wheel",
          "0": "wheelStand",
        };
        this.homeButtonEditorSelection = editorHotkeys[key] ?? this.homeButtonEditorSelection;
        this.layoutHomeButtons();
        this.refreshHomeEditorUi();
        return;
      }
      if (key === "[" || key === "]") {
        event.preventDefault();
        this.cycleHomeEditorSelection(key === "]" ? 1 : -1);
        return;
      }
      if (key === "b") {
        event.preventDefault();
        this.toggleHomeEditorBoxes();
        return;
      }
      if (key === "k") {
        event.preventDefault();
        this.toggleHomeEditorLock();
        return;
      }
      if (key === "z") {
        event.preventDefault();
        this.toggleHomeEditorZoom();
        return;
      }
      if (["arrowup", "arrowdown", "arrowleft", "arrowright"].includes(key)) {
        event.preventDefault();
        if (event.shiftKey) {
          this.resizeHomeEditorZone(key, HOME_EDITOR_NUDGE_STEP);
        } else {
          this.nudgeHomeEditorZone(key, HOME_EDITOR_NUDGE_STEP);
        }
        return;
      }
      if (key === "q" || key === "e") {
        event.preventDefault();
        this.rotateHomeEditorZone(key === "e" ? 1 : -1, event.shiftKey ? 0.25 : 1);
        return;
      }
    }
    if (this.elements.screens.home.classList.contains("screen-active") && !this.homeButtonEditorEnabled) {
      if (event.code === "Space") {
        event.preventDefault();
        if (!this.elements.homeBootOverlay.classList.contains("hidden") || this.homeIntroInProgress) {
          this.skipHomeIntroSequence();
        } else {
          this.openMainLevelSelect();
        }
        return;
      }
      if (key === "enter") {
        event.preventDefault();
        this.openMainLevelSelect();
        return;
      }
      if (key === "1") {
        event.preventDefault();
        this.openMainLevelSelect();
        return;
      }
      if (key === "2") {
        event.preventDefault();
        this.elements.openSettingsButton.click();
        return;
      }
      if (key === "3") {
        event.preventDefault();
        this.elements.moreGamesButton.click();
        return;
      }
      if (key === "s") {
        event.preventDefault();
        this.elements.openSettingsButton.click();
        return;
      }
      if (key === "m") {
        event.preventDefault();
        this.elements.moreGamesButton.click();
        return;
      }
    }
    if (this.elements.screens.levelSelect.classList.contains("screen-active")) {
      if (["arrowleft", "a"].includes(key)) {
        event.preventDefault();
        this.changeLevelSelectPage(-1);
        return;
      }
      if (["arrowright", "d"].includes(key)) {
        event.preventDefault();
        this.changeLevelSelectPage(1);
        return;
      }
      if (["1", "2", "3"].includes(key)) {
        event.preventDefault();
        const requestedPage = Number(key);
        if (requestedPage === this.state.levelSelectPage) {
          return;
        }
        this.changeLevelSelectPage(requestedPage - this.state.levelSelectPage);
        return;
      }
    }
    if (key === "l") {
      event.preventDefault();
      this.openMainLevelSelect();
      return;
    }
    if (key === "n") {
      if (!this.elements.levelIntroOverlay.classList.contains("hidden")) {
        event.preventDefault();
        this.beginLevel();
        return;
      }
      if (!this.elements.resultOverlay.classList.contains("hidden")) {
        event.preventDefault();
        this.handleResultPrimary();
        return;
      }
      if (!this.elements.quitConfirmOverlay.classList.contains("hidden")) {
        event.preventDefault();
        this.confirmQuitRun();
        return;
      }
    }
    if (event.code === "Space") {
      if (!this.elements.advancedInfoOverlay.classList.contains("hidden")) {
        event.preventDefault();
        this.closeAdvancedInfo();
        return;
      }
      if (!this.elements.levelIntroOverlay.classList.contains("hidden")) {
        event.preventDefault();
        this.beginLevel();
        return;
      }
      if (!this.elements.resultOverlay.classList.contains("hidden")) {
        event.preventDefault();
        this.handleResultPrimary();
        return;
      }
      if (!this.elements.pauseOverlay.classList.contains("hidden")) {
        event.preventDefault();
        this.resumeGame();
        return;
      }
      if (!this.elements.quitConfirmOverlay.classList.contains("hidden")) {
        event.preventDefault();
        this.confirmQuitRun();
        return;
      }
    }
    if (key === "enter") {
      if (!this.elements.advancedInfoOverlay.classList.contains("hidden")) {
        event.preventDefault();
        this.closeAdvancedInfo();
        return;
      }
      if (!this.elements.levelIntroOverlay.classList.contains("hidden")) {
        event.preventDefault();
        this.beginLevel();
        return;
      }
      if (!this.elements.resultOverlay.classList.contains("hidden")) {
        event.preventDefault();
        this.handleResultPrimary();
        return;
      }
      if (!this.elements.pauseOverlay.classList.contains("hidden")) {
        event.preventDefault();
        this.resumeGame();
        return;
      }
      if (!this.elements.quitConfirmOverlay.classList.contains("hidden")) {
        event.preventDefault();
        this.confirmQuitRun();
        return;
      }
    }
    if (key === "r" && !this.elements.resultOverlay.classList.contains("hidden")) {
      event.preventDefault();
      this.retryCurrentLevel();
      return;
    }
    if (event.code === "Space" && this.elements.screens.game.classList.contains("screen-active")) {
      event.preventDefault();
      if (this.state.paused) {
        this.resumeGame();
      } else {
        this.pauseGame();
      }
      return;
    }
    if (!["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright", "shift", "control"].includes(key)) {
      return;
    }
    if (!this.elements.screens.game.classList.contains("screen-active")) {
      return;
    }
    event.preventDefault();
    this.keyState.add(key);
    this.ensureKeyboardPanLoop();
  }

  handleEscapeShortcut() {
    if (this.state.magnifier.active) {
      this.hideMagnifier();
      return;
    }
    if (this.elements.screens.home.classList.contains("screen-active") && this.homeButtonEditorEnabled) {
      this.toggleHomeButtonEditor();
      return;
    }
    if (!this.elements.changelogOverlay.classList.contains("hidden")) {
      this.closeChangelog();
      return;
    }
    if (!this.elements.quitConfirmOverlay.classList.contains("hidden")) {
      this.closeQuitPrompt();
      return;
    }
    if (!this.elements.resultOverlay.classList.contains("hidden")) {
      this.showScreen("levelSelect");
      return;
    }
    if (!this.elements.pauseOverlay.classList.contains("hidden")) {
      this.resumeGame();
      return;
    }
    if (!this.elements.advancedInfoOverlay.classList.contains("hidden")) {
      this.closeAdvancedInfo();
      return;
    }
    if (!this.elements.levelIntroOverlay.classList.contains("hidden")) {
      this.showScreen("levelSelect");
      return;
    }
    if (this.elements.screens.settings.classList.contains("screen-active")) {
      this.showScreen("home");
      return;
    }
    if (this.elements.screens.levelSelect.classList.contains("screen-active")) {
      this.showScreen("home");
      return;
    }
    if (this.elements.screens.game.classList.contains("screen-active")) {
      this.quitRun();
    }
  }

  toggleHomeButtonEditor() {
    if (!this.cheatFlags.homeEditor) {
      this.showMenuToast("Enable Screen Editor in the cheat tools first.", true);
      return;
    }
    this.homeButtonEditorEnabled = !this.homeButtonEditorEnabled;
    if (this.homeButtonEditorEnabled) {
      this.stopHomeDecorAnimations(false);
    } else {
      this.startHomeDecorAnimations(false);
    }
    this.layoutHomeButtons();
    this.refreshHomeEditorUi();
    this.showMenuToast(this.homeButtonEditorEnabled
      ? "Home editor on. Drag boxes to move, drag the corner to resize, use 1 2 3 or [ ] to switch, arrows to move, Shift plus arrows to resize, Q or E to rotate, and Esc to close."
      : "Home button editor off.");
  }

  getHomeEditorItems() {
    return [
      { key: "start", zone: START_SCREEN_BUTTONS.start },
      { key: "settings", zone: START_SCREEN_BUTTONS.settings },
      { key: "more", zone: START_SCREEN_BUTTONS.moreGames },
      { key: "nameLink", zone: START_SCREEN_BUTTONS.nameLink },
      ...Object.entries(START_SCREEN_LAYERS).map(([key, zone]) => ({ key, zone })),
    ];
  }

  getHomeEditorZone(key) {
    if (key === "start") return START_SCREEN_BUTTONS.start;
    if (key === "settings") return START_SCREEN_BUTTONS.settings;
    if (key === "more") return START_SCREEN_BUTTONS.moreGames;
    if (key === "nameLink") return START_SCREEN_BUTTONS.nameLink;
    return START_SCREEN_LAYERS[key];
  }

  cycleHomeEditorSelection(direction) {
    const items = this.getHomeEditorItems();
    const currentIndex = Math.max(0, items.findIndex((item) => item.key === this.homeButtonEditorSelection));
    const nextIndex = (currentIndex + direction + items.length) % items.length;
    this.homeButtonEditorSelection = items[nextIndex].key;
    this.layoutHomeButtons();
    this.refreshHomeEditorUi();
  }

  nudgeHomeEditorZone(key, amount) {
    const zone = this.getHomeEditorZone(this.homeButtonEditorSelection);
    if (!zone || this.homeEditorLockedKeys.has(this.homeButtonEditorSelection)) {
      return;
    }
    if (key === "arrowup") {
      zone.y1 -= amount;
      zone.y2 -= amount;
    } else if (key === "arrowdown") {
      zone.y1 += amount;
      zone.y2 += amount;
    } else if (key === "arrowleft") {
      zone.x1 -= amount;
      zone.x2 -= amount;
    } else if (key === "arrowright") {
      zone.x1 += amount;
      zone.x2 += amount;
    }
    this.layoutHomeButtons();
    this.refreshHomeEditorUi();
  }

  resizeHomeEditorZone(key, amount) {
    const zone = this.getHomeEditorZone(this.homeButtonEditorSelection);
    if (!zone || this.homeEditorLockedKeys.has(this.homeButtonEditorSelection)) {
      return;
    }
    const isLayer = this.isHomeEditorLayerKey(this.homeButtonEditorSelection);
    if (isLayer) {
      this.resizeHomeEditorLayerZone(zone, key, amount);
      this.layoutHomeButtons();
      this.refreshHomeEditorUi();
      return;
    }
    if (key === "arrowup") {
      zone.y2 -= amount;
    } else if (key === "arrowdown") {
      zone.y2 += amount;
    } else if (key === "arrowleft") {
      zone.x2 -= amount;
    } else if (key === "arrowright") {
      zone.x2 += amount;
    }
    this.layoutHomeButtons();
    this.refreshHomeEditorUi();
  }

  resizeHomeEditorLayerZone(zone, key, amount) {
    const element = this.getHomeEditorElement(this.homeButtonEditorSelection);
    const aspect = (element?.naturalWidth && element?.naturalHeight)
      ? (element.naturalWidth / element.naturalHeight)
      : (Math.abs(zone.x2 - zone.x1) / Math.max(1, Math.abs(zone.y2 - zone.y1)));
    const left = Math.min(zone.x1, zone.x2);
    const top = Math.min(zone.y1, zone.y2);
    const width = Math.max(8, Math.abs(zone.x2 - zone.x1));
    const height = Math.max(8, Math.abs(zone.y2 - zone.y1));
    const delta = (key === "arrowleft" || key === "arrowup") ? -amount : amount;
    const nextWidth = Math.max(8, width + delta);
    const nextHeight = Math.max(8, nextWidth / Math.max(0.01, aspect));
    zone.x1 = left;
    zone.y1 = top;
    zone.x2 = left + nextWidth;
    zone.y2 = top + nextHeight;
  }

  rotateHomeEditorZone(direction, amount = 1) {
    const zone = this.getHomeEditorZone(this.homeButtonEditorSelection);
    if (!zone || this.homeEditorLockedKeys.has(this.homeButtonEditorSelection) || !this.isHomeEditorLayerKey(this.homeButtonEditorSelection)) {
      return;
    }
    const current = typeof zone.rotation === "number" ? zone.rotation : 0;
    zone.rotation = Number((current + (direction * amount)).toFixed(2));
    this.layoutHomeButtons();
    this.refreshHomeEditorUi();
  }

  getHomeEditorElement(key) {
    const map = {
      titleBanner: this.elements.titleBannerLayer,
      cloud1: this.elements.cloud1Layer,
      cloud2: this.elements.cloud2Layer,
      cloud3: this.elements.cloud3Layer,
      cloudTiny1: this.elements.cloudTiny1Layer,
      cloudTiny2: this.elements.cloudTiny2Layer,
      cloudTiny3: this.elements.cloudTiny3Layer,
      blimp: this.elements.blimpLayer,
      airball: this.elements.airballLayer,
      wheelStand: this.elements.wheelStandLayer,
      wheel: this.elements.wheelLayer,
      magnifierDecor: this.elements.magnifierDecorLayer,
      magnifierFaces: this.elements.magnifierFacesLayer,
    };
    return map[key] ?? null;
  }

  onHomeEditorPointerDown(event) {
    if (!this.sessionTestingUnlocked || !this.homeButtonEditorEnabled) {
      return;
    }
    const box = event.target.closest(".home-debug-box");
    if (!box) {
      return;
    }
    this.homeButtonEditorSelection = box.dataset.editorKey;
    if (this.homeEditorLockedKeys.has(this.homeButtonEditorSelection)) {
      this.refreshHomeEditorUi();
      event.preventDefault();
      return;
    }
    const mode = event.target.closest(".home-debug-handle") ? "resize" : "move";
    this.homeEditorDrag = {
      key: box.dataset.editorKey,
      mode,
      startX: event.clientX,
      startY: event.clientY,
    };
    this.refreshHomeEditorUi();
    event.preventDefault();
  }

  onHomeEditorPointerMove(event) {
    if (!this.homeEditorDrag || !this.homeButtonEditorEnabled) {
      return;
    }
    const overlayRect = this.elements.homeButtonOverlay.getBoundingClientRect();
    const imageWidth = this.elements.startScreenImage.naturalWidth || 1;
    const imageHeight = this.elements.startScreenImage.naturalHeight || 1;
    const zone = this.getHomeEditorZone(this.homeEditorDrag.key);
    if (!zone || this.homeEditorLockedKeys.has(this.homeEditorDrag.key)) {
      return;
    }
    const deltaX = ((event.clientX - this.homeEditorDrag.startX) / overlayRect.width) * imageWidth;
    const deltaY = ((event.clientY - this.homeEditorDrag.startY) / overlayRect.height) * imageHeight;
    if (this.homeEditorDrag.mode === "resize") {
      if (this.isHomeEditorLayerKey(this.homeEditorDrag.key)) {
        const element = this.getHomeEditorElement(this.homeEditorDrag.key);
        const aspect = (element?.naturalWidth && element?.naturalHeight)
          ? (element.naturalWidth / element.naturalHeight)
          : (Math.abs(zone.x2 - zone.x1) / Math.max(1, Math.abs(zone.y2 - zone.y1)));
        const left = Math.min(zone.x1, zone.x2);
        const top = Math.min(zone.y1, zone.y2);
        const width = Math.max(8, Math.abs(zone.x2 - zone.x1));
        const height = Math.max(8, Math.abs(zone.y2 - zone.y1));
        const widthFromX = Math.max(8, width + deltaX);
        const widthFromY = Math.max(8, (height + deltaY) * aspect);
        const nextWidth = Math.abs(deltaX) >= Math.abs(deltaY) ? widthFromX : widthFromY;
        const nextHeight = Math.max(8, nextWidth / Math.max(0.01, aspect));
        zone.x1 = left;
        zone.y1 = top;
        zone.x2 = left + nextWidth;
        zone.y2 = top + nextHeight;
      } else {
        zone.x2 += deltaX;
        zone.y2 += deltaY;
      }
    } else {
      zone.x1 += deltaX;
      zone.x2 += deltaX;
      zone.y1 += deltaY;
      zone.y2 += deltaY;
    }
    this.homeEditorDrag.startX = event.clientX;
    this.homeEditorDrag.startY = event.clientY;
    this.layoutHomeButtons();
    this.refreshHomeEditorUi();
  }

  onHomeEditorPointerUp() {
    this.homeEditorDrag = null;
  }

  trackEasterEggs(key) {
    this.konamiInput.push(key);
    if (this.konamiInput.length > KONAMI_SEQUENCE.length) {
      this.konamiInput.shift();
    }

    if (KONAMI_SEQUENCE.every((value, index) => this.konamiInput[index] === value)) {
      document.body.classList.toggle("easter-arcade");
      this.showMenuToast(document.body.classList.contains("easter-arcade") ? "Arcade glow enabled." : "Arcade glow disabled.");
      this.konamiInput = [];
    }

    if (WALDO_SEQUENCE.every((value, index) => this.konamiInput.slice(-WALDO_SEQUENCE.length)[index] === value)) {
      document.body.classList.toggle("easter-stripes");
      this.showMenuToast(document.body.classList.contains("easter-stripes") ? "Striped mode enabled." : "Striped mode disabled.");
    }

    if (PARTY_SEQUENCE.every((value, index) => this.konamiInput.slice(-PARTY_SEQUENCE.length)[index] === value)) {
      document.body.classList.toggle("easter-party");
      this.showMenuToast(document.body.classList.contains("easter-party") ? "Party mode enabled." : "Party mode disabled.");
    }

    if (CHEESE_SEQUENCE.every((value, index) => this.konamiInput.slice(-CHEESE_SEQUENCE.length)[index] === value)) {
      document.body.classList.toggle("easter-cheese");
      this.showMenuToast(document.body.classList.contains("easter-cheese") ? "Cheese mode enabled." : "Cheese mode disabled.");
    }

    if (STATIC_SEQUENCE.every((value, index) => this.konamiInput.slice(-STATIC_SEQUENCE.length)[index] === value)) {
      document.body.classList.toggle("easter-static");
      this.showMenuToast(document.body.classList.contains("easter-static") ? "Static mode enabled." : "Static mode disabled.");
    }

    if (SUNSET_SEQUENCE.every((value, index) => this.konamiInput.slice(-SUNSET_SEQUENCE.length)[index] === value)) {
      document.body.classList.toggle("easter-sunset");
      this.showMenuToast(document.body.classList.contains("easter-sunset") ? "Sunset mode enabled." : "Sunset mode disabled.");
    }

    if (FLOAT_SEQUENCE.every((value, index) => this.konamiInput.slice(-FLOAT_SEQUENCE.length)[index] === value)) {
      document.body.classList.toggle("easter-float");
      this.showMenuToast(document.body.classList.contains("easter-float") ? "Float mode enabled." : "Float mode disabled.");
    }

    if (GLASS_SEQUENCE.every((value, index) => this.konamiInput.slice(-GLASS_SEQUENCE.length)[index] === value)) {
      document.body.classList.toggle("easter-glass");
      this.showMenuToast(document.body.classList.contains("easter-glass") ? "Glass mode enabled." : "Glass mode disabled.");
    }

    if (key === "n" && this.isRunCheatEnabled() && this.elements.screens.game.classList.contains("screen-active")) {
      this.skipLevel();
    }
  }

  onKeyUp(event) {
    this.keyState.delete(event.key.toLowerCase());
  }

  ensureKeyboardPanLoop() {
    if (this.keyboardPanFrame !== null) {
      return;
    }
    const tick = () => {
      this.keyboardPanFrame = null;
      if (this.keyState.size > 0) {
        this.panFromKeys();
        this.keyboardPanFrame = window.requestAnimationFrame(tick);
      }
    };
    this.keyboardPanFrame = window.requestAnimationFrame(tick);
  }

  panFromKeys() {
    if (this.state.transform.scale <= this.state.fitScale || this.state.paused) {
      return;
    }
    const step = this.keyState.has("control")
      ? KEYBOARD_PAN_STEP * KEYBOARD_PAN_FAST_MULTIPLIER
      : this.keyState.has("shift")
        ? KEYBOARD_PAN_STEP * KEYBOARD_PAN_SLOW_MULTIPLIER
        : KEYBOARD_PAN_STEP;
    let deltaX = 0;
    let deltaY = 0;
    if (this.keyState.has("a") || this.keyState.has("arrowleft")) {
      deltaX += step;
    }
    if (this.keyState.has("d") || this.keyState.has("arrowright")) {
      deltaX -= step;
    }
    if (this.keyState.has("w") || this.keyState.has("arrowup")) {
      deltaY += step;
    }
    if (this.keyState.has("s") || this.keyState.has("arrowdown")) {
      deltaY -= step;
    }
    this.state.transform.x += deltaX;
    this.state.transform.y += deltaY;
    this.clampTransform();
    this.applyTransform();
  }

  clearKeys() {
    this.keyState.clear();
    if (this.keyboardPanFrame !== null) {
      window.cancelAnimationFrame(this.keyboardPanFrame);
      this.keyboardPanFrame = null;
    }
  }

  handleSceneSelection(point) {
    if (!this.state.runActive || this.state.paused) {
      return;
    }
    this.state.lastClickImage = point;
    this.updateDebugReadout();
    const matchedTarget = this.getCurrentLevelTargets().find((target) => !this.state.foundTargetIds.has(target.id) && getHit(point, target.hitbox));
    if (matchedTarget) {
      this.state.foundTargetIds.add(matchedTarget.id);
      this.renderHitboxes(this.getCurrentLevelTargets(), this.state.foundTargetIds);
      this.syncFoundPreviewState();
      if (this.state.foundTargetIds.size >= this.getCurrentLevelTargets().length) {
        this.completeLevel();
        return;
      }
      if (this.getCurrentLevelTargets().length > 1) {
        this.nudgeCameraTowardTarget(matchedTarget);
      }
      this.showFeedback(`${this.state.foundTargetIds.size} of ${this.getCurrentLevelTargets().length} found. Keep going.`);
      return;
    }
    this.state.wrongClicks += 1;
    this.updateHud();
    this.showFeedback("Wrong spot. Keep searching.", true);
  }

  completeLevel() {
    this.state.runActive = false;
    this.stopElapsedTimer();
    this.clearKeys();
    const level = this.getCurrentLevel();
    const levelScore = this.getCurrentLevelScore();
    const stars = getStars(this.state.elapsedMs);
    this.state.totalScore += levelScore;
    const wasSpeedrun = this.state.runMode === "speedrun";

    const mainIndex = MAIN_LEVELS.findIndex((item) => item.id === level.id);
    const advancedIndex = ADVANCED_MAIN_LEVELS.findIndex((item) => item.id === level.id);
    const authoredAdvancedIndex = AUTHORED_ADVANCED_MAIN_LEVELS.findIndex((item) => item.id === level.id);
    let nextUnlock = this.save.legit.highestLevelCleared;
    if (!level.isBonus && !this.state.runCheated && mainIndex >= 0) {
      nextUnlock = Math.max(this.save.legit.highestLevelCleared, Math.min(MAIN_LEVELS.length + 1, mainIndex + 2));
    }

    const isVariantRun = this.state.runMode === "mirror" || this.state.runMode === "upside";
    if (!isVariantRun) {
      this.save = recordLevelResult({
        cheated: this.state.runCheated,
        levelId: level.id,
        score: levelScore,
        stars,
        clearMs: this.state.elapsedMs,
        highestLevelCleared: nextUnlock,
        campaignWon: !level.isBonus && !level.isAdvanced && mainIndex === MAIN_LEVELS.length - 1,
      });
    }

    if (wasSpeedrun) {
      this.save = recordSpeedrunResult({
        cheated: this.state.runCheated,
        levelId: level.id,
        score: levelScore,
        clearMs: this.state.elapsedMs,
      });
    }

    this.renderLevelSelect();

    if (!wasSpeedrun && !isVariantRun && !level.isBonus && !level.isAdvanced && mainIndex === MAIN_LEVELS.length - 1 && !this.state.runCheated) {
      this.elements.completionBody.textContent = this.isAdvancedUnlocked()
        ? "You cleared the main route and unlocked Page Two: Advanced Levels. That page holds the tougher multi-target route."
        : this.getAdvancedUnlockText();
      this.elements.completionScore.textContent = formatScore(this.save.legit.bestScore);
      this.elements.completionStars.textContent = String(getTotalStars(this.save.legit));
      this.elements.completionOverlay.classList.remove("hidden");
      return;
    }

    if (!wasSpeedrun && !isVariantRun && authoredAdvancedIndex === AUTHORED_ADVANCED_MAIN_LEVELS.length - 1 && !this.state.runCheated) {
      this.elements.completionBody.textContent = this.isSpeedrunUnlocked()
        ? "You cleared the Advanced route and unlocked Page Three: Extras. That page holds speedrun routes, mirror mode, and special-level slots."
        : "You cleared the Advanced route.";
      this.elements.completionScore.textContent = formatScore(this.save.legit.bestScore);
      this.elements.completionStars.textContent = String(getTotalStars(this.save.legit));
      this.elements.completionOverlay.classList.remove("hidden");
      return;
    }

    this.elements.resultEyebrow.textContent = wasSpeedrun
      ? "Speedrun Clear"
      : isVariantRun
        ? this.state.runMode === "mirror"
          ? "Mirror Clear"
          : "Upsideown Clear"
      : level.isAdvancedBonus
        ? "Advanced Bonus Cleared"
        : level.isAdvanced
          ? "Advanced Cleared"
          : level.isBonus
            ? "Bonus Cleared"
            : "Level Cleared";
    this.elements.resultTitle.textContent = level.name;
    this.elements.resultStarsText.textContent = starText(stars);
    this.elements.resultBody.textContent = wasSpeedrun
      ? `${this.getDisplayLabelForLevelId(level.id)} completed in ${formatTime(this.state.elapsedMs)}. Next will roll a new random level.`
      : isVariantRun
        ? `${this.getDisplayLabelForLevelId(level.id)} cleared in ${formatTime(this.state.elapsedMs)}. Variant runs stay separate from your standard progress.`
      : `You found ${this.getCurrentLevelTargets().length} target${this.getCurrentLevelTargets().length === 1 ? "" : "s"} in ${formatTime(this.state.elapsedMs)}. Faster clears earn more stars and more score.`;
    this.elements.resultScore.textContent = formatScore(levelScore);
    this.elements.resultTimeText.textContent = formatTime(this.state.elapsedMs);
    this.elements.resultPrimaryButton.textContent = wasSpeedrun
      ? "Next Random Level"
      : this.getNextLevelIndex() !== null
        ? "Next Level"
        : "Level Select";
    this.elements.resultOverlay.classList.remove("hidden");
  }

  getNextLevelIndex() {
    if (this.state.runMode === "speedrun") {
      const next = this.pickRandomSpeedrunLevel();
      return next ? LEVELS.findIndex((item) => item.id === next.id) : null;
    }
    const current = this.getCurrentLevel();
    const currentMainIndex = MAIN_LEVELS.findIndex((item) => item.id === current.id);
    if (currentMainIndex >= 0 && currentMainIndex < MAIN_LEVELS.length - 1) {
      return LEVELS.findIndex((item) => item.id === MAIN_LEVELS[currentMainIndex + 1].id);
    }
    const currentBonusIndex = BONUS_LEVELS.findIndex((item) => item.id === current.id);
    if (currentBonusIndex >= 0 && currentBonusIndex < BONUS_LEVELS.length - 1) {
      return LEVELS.findIndex((item) => item.id === BONUS_LEVELS[currentBonusIndex + 1].id);
    }
    const currentAdvancedIndex = ADVANCED_MAIN_LEVELS.findIndex((item) => item.id === current.id);
    if (currentAdvancedIndex >= 0 && currentAdvancedIndex < ADVANCED_MAIN_LEVELS.length - 1) {
      return LEVELS.findIndex((item) => item.id === ADVANCED_MAIN_LEVELS[currentAdvancedIndex + 1].id);
    }
    const currentAdvancedBonusIndex = ADVANCED_BONUS_LEVELS.findIndex((item) => item.id === current.id);
    if (currentAdvancedBonusIndex >= 0 && currentAdvancedBonusIndex < ADVANCED_BONUS_LEVELS.length - 1) {
      return LEVELS.findIndex((item) => item.id === ADVANCED_BONUS_LEVELS[currentAdvancedBonusIndex + 1].id);
    }
    return null;
  }

  handleResultPrimary() {
    this.elements.resultOverlay.classList.add("hidden");
    const nextIndex = this.getNextLevelIndex();
    if (nextIndex === null) {
      this.showScreen("levelSelect");
      return;
    }
    this.state.levelIndex = nextIndex;
    if (this.save.settings.showLevelIntro === "on") {
      this.prepareSceneImageLoad();
      this.openLevelIntro();
    } else {
      this.beginLevel();
    }
  }

  fitLevelToViewport() {
    const rect = this.elements.sceneViewport.getBoundingClientRect();
    const fitScale = Math.min(rect.width / this.state.naturalWidth, rect.height / this.state.naturalHeight);
    this.state.fitScale = fitScale;
    this.state.transform.scale = fitScale;
    this.state.transform.x = (rect.width - (this.state.naturalWidth * fitScale)) / 2;
    this.state.transform.y = (rect.height - (this.state.naturalHeight * fitScale)) / 2;
    this.clampTransform();
    this.applyTransform();
  }

  zoomFromCenter(factor) {
    const rect = this.elements.sceneViewport.getBoundingClientRect();
    this.zoomAtClientPoint(rect.left + (rect.width / 2), rect.top + (rect.height / 2), factor);
  }

  zoomAtClientPoint(clientX, clientY, factor) {
    const imagePoint = this.clientToImage(clientX, clientY);
    if (!imagePoint) {
      return;
    }
    const rect = this.elements.sceneViewport.getBoundingClientRect();
    const localX = clientX - rect.left;
    const localY = clientY - rect.top;
    const nextScale = clamp(this.state.transform.scale * factor, this.state.fitScale * MIN_SCALE, this.state.fitScale * MAX_SCALE);
    this.state.transform.scale = nextScale;
    this.state.transform.x = localX - (imagePoint.x * nextScale);
    this.state.transform.y = localY - (imagePoint.y * nextScale);
    this.clampTransform();
    this.applyTransform();
  }

  clampTransform() {
    const rect = this.elements.sceneViewport.getBoundingClientRect();
    const scaledWidth = this.state.naturalWidth * this.state.transform.scale;
    const scaledHeight = this.state.naturalHeight * this.state.transform.scale;
    if (scaledWidth <= rect.width) {
      this.state.transform.x = (rect.width - scaledWidth) / 2;
    } else {
      this.state.transform.x = clamp(this.state.transform.x, rect.width - scaledWidth - PAN_MARGIN, PAN_MARGIN);
    }
    if (scaledHeight <= rect.height) {
      this.state.transform.y = (rect.height - scaledHeight) / 2;
    } else {
      this.state.transform.y = clamp(this.state.transform.y, rect.height - scaledHeight - PAN_MARGIN, PAN_MARGIN);
    }
  }

  applyTransform() {
    const { x, y, scale } = this.state.transform;
    this.elements.sceneContent.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
    this.elements.sceneContent.classList.toggle("scene-mirrored", this.state.mirrorActive);
    this.elements.sceneContent.classList.toggle("scene-upside-down", this.state.upsideDownActive);
    if (this.state.magnifier.active) {
      this.updateMagnifier(this.state.magnifier.pointerX, this.state.magnifier.pointerY);
    }
  }

  clientToImage(clientX, clientY) {
    const rect = this.elements.sceneViewport.getBoundingClientRect();
    const localX = clientX - rect.left;
    const localY = clientY - rect.top;
    const baseImageX = (localX - this.state.transform.x) / this.state.transform.scale;
    const imageX = this.state.mirrorActive ? this.state.naturalWidth - baseImageX : baseImageX;
    const baseImageY = (localY - this.state.transform.y) / this.state.transform.scale;
    const imageY = this.state.upsideDownActive ? this.state.naturalHeight - baseImageY : baseImageY;
    if (imageX < 0 || imageY < 0 || imageX > this.state.naturalWidth || imageY > this.state.naturalHeight) {
      return null;
    }
    return { x: Math.round(imageX), y: Math.round(imageY) };
  }

  clientToImagePrecise(clientX, clientY) {
    const rect = this.elements.sceneViewport.getBoundingClientRect();
    const localX = clientX - rect.left;
    const localY = clientY - rect.top;
    const baseImageX = (localX - this.state.transform.x) / this.state.transform.scale;
    const imageX = this.state.mirrorActive ? this.state.naturalWidth - baseImageX : baseImageX;
    const baseImageY = (localY - this.state.transform.y) / this.state.transform.scale;
    const imageY = this.state.upsideDownActive ? this.state.naturalHeight - baseImageY : baseImageY;
    if (imageX < 0 || imageY < 0 || imageX > this.state.naturalWidth || imageY > this.state.naturalHeight) {
      return null;
    }
    return { x: imageX, y: imageY, localX, localY, rect };
  }

  showMagnifier(clientX, clientY, persistent) {
    this.state.magnifier.active = true;
    this.state.magnifier.persistent = persistent;
    this.elements.magnifierLens.classList.remove("hidden");
    this.elements.magnifierLens.style.visibility = "visible";
    this.elements.magnifierLens.style.willChange = "left, top, background-position, background-size";
    this.updateMagnifier(clientX, clientY);
  }

  hideMagnifier() {
    this.state.magnifier.active = false;
    this.state.magnifier.persistent = false;
    this.elements.magnifierLens.classList.add("hidden");
    this.elements.magnifierLens.style.visibility = "hidden";
  }

  updateMagnifier(clientX, clientY) {
    if (!this.state.magnifier.active) {
      return;
    }
    const precisePoint = this.clientToImagePrecise(clientX, clientY);
    if (!precisePoint) {
      this.elements.magnifierLens.style.visibility = "hidden";
      return;
    }
    const { localX, localY, x, y, rect } = precisePoint;
    const lensWidth = this.elements.magnifierLens.offsetWidth || 240;
    const lensHeight = this.elements.magnifierLens.offsetHeight || 240;
    const zoom = this.state.magnifier.zoom;
    const bgScale = this.state.transform.scale * zoom;
    const lensLeft = clamp(localX, lensWidth / 2, rect.width - (lensWidth / 2));
    const lensTop = clamp(localY, lensHeight / 2, rect.height - (lensHeight / 2));
    this.state.magnifier.pointerX = clientX;
    this.state.magnifier.pointerY = clientY;
    this.elements.magnifierLens.style.visibility = "visible";
    this.elements.magnifierLens.style.left = `${lensLeft}px`;
    this.elements.magnifierLens.style.top = `${lensTop}px`;
    this.elements.magnifierLens.style.setProperty("--magnifier-scale-x", this.state.mirrorActive ? "-1" : "1");
    this.elements.magnifierLens.style.setProperty("--magnifier-scale-y", this.state.upsideDownActive ? "-1" : "1");
    this.elements.magnifierLens.style.backgroundImage = `url("${this.elements.levelImage.currentSrc || this.elements.levelImage.src}")`;
    this.elements.magnifierLens.style.backgroundSize = `${this.state.naturalWidth * bgScale}px ${this.state.naturalHeight * bgScale}px`;
    this.elements.magnifierLens.style.backgroundPosition = `${(lensWidth / 2) - (x * bgScale)}px ${(lensHeight / 2) - (y * bgScale)}px`;
    this.elements.magnifierLens.style.backgroundRepeat = "no-repeat";
  }

  triggerHomeWheelRush() {
    this.homeWheelBoost += 1.45 + (this.homeWheelBoost * 0.12);
    this.elements.homeViewport.style.setProperty("--home-wheel-boost", String(this.homeWheelBoost));
    this.ensureHomeWheelLoop();
  }

  ensureHomeWheelLoop() {
    if (this.homeWheelDecayFrameId) {
      return;
    }
    this.homeWheelLastFrameAt = 0;
    const step = (timestamp) => {
      if (!this.homeWheelLastFrameAt) {
        this.homeWheelLastFrameAt = timestamp;
      }
      const dt = Math.min(48, timestamp - this.homeWheelLastFrameAt);
      this.homeWheelLastFrameAt = timestamp;
      const homeVisible = this.elements.screens.home.classList.contains("screen-active");
      const reduced = this.save.settings.motion === "reduced";
      if (homeVisible && this.homeDecorReady && !reduced) {
        const baseDegreesPerMs = 360 / 42000;
        this.homeWheelAngle -= baseDegreesPerMs * this.homeWheelBoost * dt;
        this.elements.homeViewport.style.setProperty("--home-wheel-angle", `${this.homeWheelAngle}deg`);
        const decayStrength = Math.min(1, dt * 0.0018);
        this.homeWheelBoost += (1 - this.homeWheelBoost) * decayStrength;
        if (Math.abs(this.homeWheelBoost - 1) < 0.002) {
          this.homeWheelBoost = 1;
        }
        this.elements.homeViewport.style.setProperty("--home-wheel-boost", String(this.homeWheelBoost));
      }
      this.homeWheelDecayFrameId = window.requestAnimationFrame(step);
    };
    this.homeWheelDecayFrameId = window.requestAnimationFrame(step);
  }

  stopHomeWheelLoop() {
    if (this.homeWheelDecayFrameId) {
      window.cancelAnimationFrame(this.homeWheelDecayFrameId);
      this.homeWheelDecayFrameId = null;
    }
    this.homeWheelLastFrameAt = 0;
  }

  triggerHomeAirballBoost() {
    this.elements.homeViewport.classList.remove("easter-airmail");
    void this.elements.homeViewport.offsetWidth;
    this.elements.homeViewport.classList.add("easter-airmail");
    window.clearTimeout(this.homeAirballTimerId);
    this.homeAirballTimerId = window.setTimeout(() => {
      this.elements.homeViewport.classList.remove("easter-airmail");
    }, 9000);
  }

  triggerHomeBlimpBoost() {
    this.elements.homeViewport.classList.remove("easter-blimp");
    void this.elements.homeViewport.offsetWidth;
    this.elements.homeViewport.classList.add("easter-blimp");
    window.clearTimeout(this.homeBlimpTimerId);
    this.homeBlimpTimerId = window.setTimeout(() => {
      this.elements.homeViewport.classList.remove("easter-blimp");
    }, 9000);
  }

  triggerHomeFacesFlash() {
    this.elements.homeViewport.classList.remove("easter-photo");
    void this.elements.homeViewport.offsetWidth;
    this.elements.homeViewport.classList.add("easter-photo");
    window.clearTimeout(this.homeFacesTimerId);
    this.homeFacesTimerId = window.setTimeout(() => {
      this.elements.homeViewport.classList.remove("easter-photo");
    }, 7000);
  }

  triggerHomeBannerPulse() {
    this.elements.homeViewport.classList.remove("easter-banner");
    void this.elements.homeViewport.offsetWidth;
    this.elements.homeViewport.classList.add("easter-banner");
    window.clearTimeout(this.homeBannerTimerId);
    this.homeBannerTimerId = window.setTimeout(() => {
      this.elements.homeViewport.classList.remove("easter-banner");
    }, 2200);
  }

  triggerHomeFocusBloom() {
    this.elements.homeViewport.classList.remove("easter-focus");
    void this.elements.homeViewport.offsetWidth;
    this.elements.homeViewport.classList.add("easter-focus");
    window.clearTimeout(this.homeFocusTimerId);
    this.homeFocusTimerId = window.setTimeout(() => {
      this.elements.homeViewport.classList.remove("easter-focus");
    }, 2200);
  }

  triggerHomeSkyDrift() {
    this.elements.homeViewport.classList.remove("easter-skydrift");
    void this.elements.homeViewport.offsetWidth;
    this.elements.homeViewport.classList.add("easter-skydrift");
    window.clearTimeout(this.homeSkyTimerId);
    this.homeSkyTimerId = window.setTimeout(() => {
      this.elements.homeViewport.classList.remove("easter-skydrift");
    }, 2200);
  }

  triggerScoreSpark() {
    document.body.classList.remove("easter-scorespark");
    void document.body.offsetWidth;
    document.body.classList.add("easter-scorespark");
    window.clearTimeout(this.scoreSparkTimerId);
    this.scoreSparkTimerId = window.setTimeout(() => {
      document.body.classList.remove("easter-scorespark");
    }, 1800);
  }

  triggerTimeRipple() {
    document.body.classList.remove("easter-timeripple");
    void document.body.offsetWidth;
    document.body.classList.add("easter-timeripple");
    window.clearTimeout(this.timeRippleTimerId);
    this.timeRippleTimerId = window.setTimeout(() => {
      document.body.classList.remove("easter-timeripple");
    }, 1800);
  }

  triggerStarsBurst() {
    document.body.classList.remove("easter-starsburst");
    void document.body.offsetWidth;
    document.body.classList.add("easter-starsburst");
    window.clearTimeout(this.starsBurstTimerId);
    this.starsBurstTimerId = window.setTimeout(() => {
      document.body.classList.remove("easter-starsburst");
    }, 1800);
  }

  updateDebugReadout() {
    if (!this.isLevelHitboxCheatEnabled()) {
      return;
    }
    const pointer = this.state.pointerImage ? `Pointer: ${this.state.pointerImage.x}, ${this.state.pointerImage.y}` : "Pointer: outside image";
    const click = this.state.lastClickImage ? `Last click: ${this.state.lastClickImage.x}, ${this.state.lastClickImage.y}` : "Last click: none";
    this.elements.debugReadout.textContent = `${pointer}\n${click}`;
  }

  nudgeCameraTowardTarget(target) {
    if (this.sceneNudgeTimerId) {
      window.clearTimeout(this.sceneNudgeTimerId);
      this.sceneNudgeTimerId = null;
    }
    const rect = this.elements.sceneViewport.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const hitbox = target.hitbox;
    const targetX = hitbox.type === "circle" ? hitbox.x : (Math.min(hitbox.x1, hitbox.x2) + Math.max(hitbox.x1, hitbox.x2)) / 2;
    const targetY = hitbox.type === "circle" ? hitbox.y : (Math.min(hitbox.y1, hitbox.y2) + Math.max(hitbox.y1, hitbox.y2)) / 2;
    const original = { x: this.state.transform.x, y: this.state.transform.y };
    const desiredX = centerX - (targetX * this.state.transform.scale);
    const desiredY = centerY - (targetY * this.state.transform.scale);
    this.elements.sceneContent.classList.add("scene-content-nudging");
    this.state.transform.x += (desiredX - this.state.transform.x) * 0.12;
    this.state.transform.y += (desiredY - this.state.transform.y) * 0.12;
    this.clampTransform();
    this.applyTransform();
    this.sceneNudgeTimerId = window.setTimeout(() => {
      this.state.transform.x = original.x;
      this.state.transform.y = original.y;
      this.applyTransform();
      this.sceneNudgeTimerId = window.setTimeout(() => {
        this.elements.sceneContent.classList.remove("scene-content-nudging");
        this.sceneNudgeTimerId = null;
      }, 220);
    }, 180);
  }

  showFeedback(message, bad = false) {
    this.elements.sceneFeedback.textContent = message;
    this.elements.sceneFeedback.style.color = bad ? "var(--danger)" : "var(--good)";
    this.elements.sceneFeedback.classList.add("visible");
    if (this.state.feedbackTimeoutId) {
      window.clearTimeout(this.state.feedbackTimeoutId);
    }
    this.state.feedbackTimeoutId = window.setTimeout(() => {
      this.elements.sceneFeedback.classList.remove("visible");
    }, 1400);
  }
}
