import { LEVELS, MAIN_LEVELS, BONUS_LEVELS, ADVANCED_LEVELS, DEFAULT_SETTINGS, START_SCREEN_BUTTONS, START_SCREEN_LAYERS } from "./levels.js";
import { loadSave, recordLevelResult, recordLevelView, recordSpeedrunResult, saveSettings, saveMeta } from "./storage.js";
import { layoutHomeButtons as layoutHomeButtonsUi, bindHomeButtonHoverEffects, playHomeButtonIntro as playHomeButtonIntroUi, updateHomeDebug as updateHomeDebugUi } from "./home-ui.js";
import { showMenuToast as showMenuToastUi, renderPreviewList as renderPreviewListUi, syncFoundPreviewState as syncFoundPreviewStateUi, renderHitboxes as renderHitboxesUi } from "./game-renderer.js";
// 7hgasd87f6gas8d76f8g7as6d8f7g6asd8f7g

const MORE_GAMES_URL = "https://sites.google.com/view/staticquasar931/gm3z";
const DISCORD_URL = "https://discord.gg/jW2az4AQUH";
const MIN_SCALE = 0.6;
const MAX_SCALE = 12;
const WHEEL_ZOOM_STEP = 0.12;
const BUTTON_ZOOM_FACTOR = 1.2;
const DRAG_THRESHOLD = 8;
const KEYBOARD_PAN_STEP = 18;
const KEYBOARD_PAN_SLOW_MULTIPLIER = 0.45;
const KEYBOARD_PAN_FAST_MULTIPLIER = 2.2;
const PAN_MARGIN = 360;
const DIAGNOSTIC_CODE = "5278";
const HOME_BUTTON_STAGGER_MS = 260;
const HOME_BUTTON_ANIMATION_MS = 1320;
const HOME_BUTTON_X_OFFSET = -90;
const HOME_BUTTON_Y_OFFSET = -180;
const HOME_BUTTON_ALPHA_THRESHOLD = 96;
const HOME_EDITOR_NUDGE_STEP = 4;
const MAGNIFIER_HOLD_MS = 240;
const MAGNIFIER_MIN_ZOOM = 1.4;
const MAGNIFIER_MAX_ZOOM = 6;
const KONAMI_SEQUENCE = ["arrowup", "arrowup", "arrowdown", "arrowdown", "arrowleft", "arrowright", "arrowleft", "arrowright", "b", "a"];
const WALDO_SEQUENCE = ["w", "a", "l", "d", "o"];
const PARTY_SEQUENCE = ["p", "a", "r", "t", "y"];
const CHEESE_SEQUENCE = ["c", "h", "e", "e", "s", "e"];
const STATIC_SEQUENCE = ["s", "t", "a", "t", "i", "c"];
// y83nfjA9023jfKsl09vna0sdf908aslkdfj23098df

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
    this.preloadedAssets = new Map();
    this.homeIntroPlayed = false;
    this.homeAssetsReady = false;
    this.homeBootStarted = false;
    this.speedrunRecentIds = [];
    this.homeButtonEditorEnabled = false;
    this.homeButtonEditorSelection = "start";
    this.homeEditorDrag = null;
    this.sceneNudgeTimerId = null;
    this.magnifierHoldTimerId = null;
    this.state = {
      levelIndex: 0,
      levelSelectPage: 1,
      totalScore: 0,
      runMode: "standard",
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
      homeButtonOverlay: document.getElementById("homeButtonOverlay"),
      homeLayerOverlay: document.getElementById("homeLayerOverlay"),
      homeDebugOverlay: document.getElementById("homeDebugOverlay"),
      homeDebugReadout: document.getElementById("homeDebugReadout"),
      startscreenLayer: document.getElementById("startscreenLayer"),
      titleCardLayer: document.getElementById("titleCardLayer"),
      titleBannerLayer: document.getElementById("titleBannerLayer"),
      cloud1Layer: document.getElementById("cloud1Layer"),
      cloud2Layer: document.getElementById("cloud2Layer"),
      cloud3Layer: document.getElementById("cloud3Layer"),
      wheelStandLayer: document.getElementById("wheelStandLayer"),
      wheelLayer: document.getElementById("wheelLayer"),
      magnifierDecorLayer: document.getElementById("magnifierDecorLayer"),
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
      homeStarCount: document.getElementById("homeStarCount"),
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
      speedrunRoundsText: document.getElementById("speedrunRoundsText"),
      speedrunAverageScoreText: document.getElementById("speedrunAverageScoreText"),
      speedrunAverageTimeText: document.getElementById("speedrunAverageTimeText"),
      speedrunFastestText: document.getElementById("speedrunFastestText"),
      speedrunLastPickText: document.getElementById("speedrunLastPickText"),
      speedrunRecentStrip: document.getElementById("speedrunRecentStrip"),
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
      settingsDiscordButton: document.getElementById("settingsDiscordButton"),
      settingsMoreGamesButton: document.getElementById("settingsMoreGamesButton"),
      settingsLevelSelectButton: document.getElementById("settingsLevelSelectButton"),
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
      sceneViewport: document.getElementById("sceneViewport"),
      sceneContent: document.getElementById("sceneContent"),
      levelImage: document.getElementById("levelImage"),
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
      menuToast: document.getElementById("menuToast"),
    };
  }

  bindEvents() {
    const bind = (element, eventName, handler) => {
      if (element) {
        element.addEventListener(eventName, handler);
      }
    };
    this.elements.startGameButton.addEventListener("click", () => this.showScreen("levelSelect"));
    this.elements.homeNameButton.addEventListener("click", () => this.openExternalLink(MORE_GAMES_URL, "More Games link is not configured yet."));
    this.elements.closeLevelSelectButton.addEventListener("click", () => this.showScreen("home"));
    this.elements.openSettingsButton.addEventListener("click", () => this.showScreen("settings"));
    this.elements.closeSettingsButton.addEventListener("click", () => this.showScreen("home"));
    this.elements.moreGamesButton.addEventListener("click", () => this.openExternalLink(MORE_GAMES_URL, "More Games link is not configured yet."));
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
    this.elements.settingsDiscordButton.addEventListener("click", () => this.openExternalLink(DISCORD_URL, "Add your Discord invite URL in scripts/game.js to enable this button."));
    this.elements.settingsMoreGamesButton.addEventListener("click", () => this.openExternalLink(MORE_GAMES_URL, "More Games link is not configured yet."));
    this.elements.settingsLevelSelectButton.addEventListener("click", () => this.showScreen("levelSelect"));
    this.elements.levelSelectPrevPageButton.addEventListener("click", () => this.changeLevelSelectPage(-1));
    this.elements.levelSelectNextPageButton.addEventListener("click", () => this.changeLevelSelectPage(1));
    this.elements.levelSelectThirdPageButton.addEventListener("click", () => this.changeLevelSelectPage(1));
    this.elements.levelSelectBackFromSpeedrunButton.addEventListener("click", () => this.changeLevelSelectPage(-1));
    this.elements.startSpeedrunButton.addEventListener("click", () => this.startRandomSpeedrun());
    this.elements.versionTapTarget.addEventListener("click", () => this.handleVersionTap());
    this.elements.unlockDiagnosticButton.addEventListener("click", () => this.unlockDiagnostics());
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
        if (this.homeAssetsReady) {
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
    this.elements.resultSecondaryButton.addEventListener("click", () => this.showScreen("levelSelect"));
    this.elements.playAgainButton.addEventListener("click", () => this.startCampaignFromLevel(0));
    this.elements.completionLevelSelectButton.addEventListener("click", () => this.showScreen("levelSelect"));
    this.elements.hudLevelText.addEventListener("dblclick", () => this.showScreen("levelSelect"));
    this.elements.hudLevelText.addEventListener("click", () => this.showScreen("levelSelect"));

    this.elements.sceneViewport.addEventListener("wheel", (event) => {
      event.preventDefault();
      if (this.state.magnifier.active) {
        const delta = event.deltaY < 0 ? 0.2 : -0.2;
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
    if (this.elements.magnifierSizeSelect) this.elements.magnifierSizeSelect.value = this.save.settings.magnifierSize ?? "large";
    this.elements.body.dataset.theme = this.save.settings.theme;
    this.elements.body.dataset.density = this.save.settings.density;
    this.elements.body.dataset.motion = this.save.settings.motion;
    this.elements.body.dataset.preview = this.save.settings.previewSize;
    this.elements.body.dataset.foundfx = this.save.settings.foundFx;
    this.elements.body.dataset.magnifier = this.save.settings.magnifierShape ?? "circle";
    this.elements.body.dataset.magnifierSize = this.save.settings.magnifierSize ?? "large";
    this.elements.panTipText.classList.toggle("hidden", this.save.settings.showPanTip === "off");
    this.elements.skipLevelButton.classList.toggle("hidden", !this.sessionTestingUnlocked);
    this.elements.settingsDiscordButton.disabled = !DISCORD_URL;
    this.elements.settingsLinkHint.textContent = DISCORD_URL
      ? "Community links open in a new tab."
      : "Set your Discord invite URL in scripts/game.js to turn on the Discord button.";
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
      magnifierSize: this.elements.magnifierSizeSelect?.value ?? (this.save.settings.magnifierSize ?? "large"),
    });
    this.applySettings();
  }

  showScreen(name) {
    Object.entries(this.elements.screens).forEach(([key, element]) => {
      const active = key === name;
      element.classList.toggle("screen-active", active);
      element.setAttribute("aria-hidden", String(!active));
    });
    this.elements.body.classList.toggle("mode-game", name === "game");
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
    if (name === "home" && this.homeAssetsReady && this.elements.startScreenImage.naturalWidth > 0) {
      this.playHomeButtonIntro();
    }
  }

  startHomeBoot() {
    if (this.homeBootStarted) {
      return;
    }
    this.homeBootStarted = true;
    const assets = [
      ["background", this.elements.startScreenImage, "Assets/ui/backgroundplain.png"],
      ["startscreen", this.elements.startscreenLayer, START_SCREEN_LAYERS.startscreen.src],
      ["titleCard", this.elements.titleCardLayer, START_SCREEN_LAYERS.titleCard.src],
      ["titleBanner", this.elements.titleBannerLayer, START_SCREEN_LAYERS.titleBanner.src],
      ["cloud1", this.elements.cloud1Layer, START_SCREEN_LAYERS.cloud1.src],
      ["cloud2", this.elements.cloud2Layer, START_SCREEN_LAYERS.cloud2.src],
      ["cloud3", this.elements.cloud3Layer, START_SCREEN_LAYERS.cloud3.src],
      ["magnifierDecor", this.elements.magnifierDecorLayer, START_SCREEN_LAYERS.magnifierDecor.src],
      ["start", this.elements.startButtonArt, "Assets/ui/startbutton.png"],
      ["settings", this.elements.settingsButtonArt, "Assets/ui/settingsbutton.png"],
      ["moreGames", this.elements.moreGamesButtonArt, "Assets/ui/moregbutton.png"],
    ];
    this.elements.homeViewport.classList.remove("home-ready");
    this.elements.homeBootOverlay.classList.remove("hidden", "is-exiting");
    this.elements.homeBootStatus.textContent = "Loading menu art, buttons, and interface layers.";
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
        this.elements.homeViewport.classList.add("home-ready");
        this.playHomeButtonIntro();
      }, 620);
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
    const mainCleared = MAIN_LEVELS.filter((level) => this.save.legit.levelResults[level.id]?.completed).length;
    const advancedCleared = AUTHORED_ADVANCED_MAIN_LEVELS.filter((level) => this.save.legit.levelResults[level.id]?.completed).length;
    const totalViews = Object.values(this.save.legit.levelResults ?? {}).reduce((sum, result) => sum + (result.viewCount ?? 0), 0);
    const fastestMain = Object.values(this.save.legit.levelResults ?? {})
      .map((result) => result.bestTimeMs ?? 0)
      .filter((value) => value > 0);
    const speedrun = this.save.legit.speedrun;
    this.elements.homeLevelCount.textContent = String(MAIN_LEVELS.length);
    this.elements.homeUnlockedText.textContent = `${unlockedMain} / ${MAIN_LEVELS.length}`;
    this.elements.homeBestScore.textContent = formatScore(this.save.legit.bestScore);
    this.elements.homeStarCount.textContent = String(starCount);
    this.elements.mainProgressText.textContent = `${mainCleared} / ${MAIN_LEVELS.length} cleared`;
    this.elements.bonusUnlockText.textContent = this.isBonusUnlocked() ? "Unlocked" : "Locked";
    this.elements.bonusRuleText.textContent = `Bonuses unlock after normal level 5 or 10 total stars. Current stars: ${starCount}.`;
    this.elements.advancedRevealText.textContent = this.getAdvancedUnlockText();
    this.elements.speedrunRoundsText.textContent = String(speedrun.roundsPlayed ?? 0);
    this.elements.speedrunAverageScoreText.textContent = formatScore(averageOrZero(speedrun.totalScore ?? 0, speedrun.roundsPlayed ?? 0));
    this.elements.speedrunAverageTimeText.textContent = formatTime(averageOrZero(speedrun.totalTimeMs ?? 0, speedrun.roundsPlayed ?? 0));
    this.elements.speedrunFastestText.textContent = speedrun.fastestTimeMs ? formatTime(speedrun.fastestTimeMs) : "0.0s";
    this.elements.speedrunLastPickText.textContent = speedrun.lastLevelId
      ? `Last random pick: ${this.getDisplayLabelForLevelId(speedrun.lastLevelId)}`
      : "Last random pick: none yet.";
    this.renderSpeedrunRecentStrip(speedrun.recentLevelIds ?? []);
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
      button.type = "button";
      button.className = `level-card${unlocked ? "" : " locked"}`;
      button.disabled = !unlocked;
      button.innerHTML = unlocked
        ? `<div class="level-card-top"><h4>${level.name}</h4><span class="level-number">${cardLabel}</span></div>${setupMarkup}${scoreMarkup}<p class="level-meta level-stars">${bestStars}</p>`
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
    if (this.sessionTestingUnlocked) {
      return true;
    }
    const index = MAIN_LEVELS.findIndex((item) => item.id === level.id);
    return index < this.save.legit.highestLevelCleared;
  }

  isBonusUnlocked() {
    if (this.sessionTestingUnlocked) {
      return true;
    }
    return this.save.legit.highestLevelCleared >= 6 || getTotalStars(this.save.legit) >= 10;
  }

  isAdvancedUnlocked() {
    if (this.sessionTestingUnlocked) {
      return true;
    }
    const mainCleared = MAIN_LEVELS.every((level) => this.save.legit.levelResults[level.id]?.completed);
    return mainCleared && getTotalStars(this.save.legit) >= 50;
  }

  isSpeedrunUnlocked() {
    if (this.sessionTestingUnlocked) {
      return true;
    }
    const mainCleared = MAIN_LEVELS.every((level) => this.save.legit.levelResults[level.id]?.completed);
    const advancedCleared = AUTHORED_ADVANCED_MAIN_LEVELS.every((level) => this.save.legit.levelResults[level.id]?.completed);
    return mainCleared && advancedCleared;
  }

  isAdvancedLevelUnlocked(level) {
    if (this.sessionTestingUnlocked) {
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
    this.syncLevelSelectPage();
  }

  syncLevelSelectPage() {
    const levelSelectActive = this.elements.screens.levelSelect.classList.contains("screen-active");
    const page = this.state.levelSelectPage;
    const onAdvancedPage = page === 2 && this.isAdvancedUnlocked();
    const onSpeedrunPage = page === 3 && this.isSpeedrunUnlocked();
    this.elements.levelSelectPageLabel.textContent = onSpeedrunPage
      ? "Level Select: Speedrun Levels"
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
  }

  startNextLevel() {
    const nextIndex = Math.max(0, Math.min(this.save.legit.highestLevelCleared - 1, MAIN_LEVELS.length - 1));
    this.state.runMode = "standard";
    this.startCampaignFromLevel(nextIndex);
  }

  startSelectedLevel(levelId) {
    const index = LEVELS.findIndex((level) => level.id === levelId);
    if (index >= 0 && (this.sessionTestingUnlocked || this.isLevelUnlocked(LEVELS[index], LEVELS[index].isAdvancedBonus ? "advancedBonus" : LEVELS[index].isAdvanced ? "advanced" : LEVELS[index].isBonus ? "bonus" : "main"))) {
      this.state.runMode = "standard";
      this.startCampaignFromLevel(index);
    }
  }

  startRandomSpeedrun() {
    const level = this.pickRandomSpeedrunLevel();
    if (!level) {
      this.showMenuToast("No speedrun level could be selected.", true);
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

  pickRandomSpeedrunLevel() {
    const available = [...MAIN_LEVELS, ...BONUS_LEVELS, ...ADVANCED_MAIN_LEVELS, ...ADVANCED_BONUS_LEVELS];
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
    if (!this.sessionTestingUnlocked) {
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
    this.state.levelIndex = index;
    this.state.totalScore = 0;
    this.state.runCheated = this.sessionTestingUnlocked;
    this.state.paused = false;
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
    if (level.isAdvancedBonus) {
      return `AB ${ADVANCED_BONUS_LEVELS.findIndex((item) => item.id === level.id) + 1}`;
    }
    if (level.isAdvanced) {
      return `AL ${ADVANCED_MAIN_LEVELS.findIndex((item) => item.id === level.id) + 1}`;
    }
    if (level.isBonus) {
      return `Bonus ${BONUS_LEVELS.findIndex((item) => item.id === level.id) + 1}`;
    }
    return `Level ${MAIN_LEVELS.findIndex((item) => item.id === level.id) + 1}`;
  }

  getDisplayLabelForLevelId(levelId) {
    const level = LEVELS.find((item) => item.id === levelId);
    if (!level) {
      return "Unknown level";
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
        ? `Find both targets before the level clears. ${level.targets.length} total.`
        : "Find the exact preview target in the crowd scene.";
    }
    this.elements.levelIntroOverlay.classList.remove("hidden");
  }

  beginLevel() {
    const level = this.getCurrentLevel();
    this.elements.levelIntroOverlay.classList.add("hidden");
    this.hideMagnifier();
    this.state.elapsedMs = 0;
    this.state.wrongClicks = 0;
    this.state.pointerImage = null;
    this.state.lastClickImage = null;
    this.state.foundTargetIds = new Set();
    this.state.runActive = false;
    this.stopElapsedTimer();
    this.elements.levelImage.classList.add("asset-loading");
    this.elements.levelImage.style.visibility = "hidden";
    this.save = recordLevelView({
      cheated: this.sessionTestingUnlocked,
      levelId: level.id,
    });
    const levelLabel = this.state.runMode === "speedrun"
      ? this.getDisplayLabelForLevelId(level.id)
      : this.getCurrentLevelLabel(level);
    this.elements.hudLevelText.textContent = `${level.name} • ${levelLabel}`;
    this.elements.hudLevelName.textContent = "";
    this.elements.targetPreviewLabel.textContent = level.targets.length > 1 ? "Find These People" : "Find This Person";
    this.elements.sceneFallback.classList.add("hidden");
    this.preloadLevelAssets(this.state.levelIndex);
    this.renderPreviewList(this.elements.targetPreviewList, this.elements.previewErrorText, level.targets);
    this.prepareSceneImageLoad();
    this.elements.levelImage.src = level.background;
    this.renderHitboxes(level.targets, this.state.foundTargetIds);
    this.setPreviewVisibility(this.save.settings.previewDefault !== "hidden");
    this.syncFoundPreviewState();
    this.updateHud();
  }

  renderPreviewList(container, errorElement, targets) {
    renderPreviewListUi(container, errorElement, targets);
  }

  syncFoundPreviewState() {
    syncFoundPreviewStateUi(this);
  }

  prepareSceneImageLoad() {
    this.elements.levelImage.classList.add("asset-loading");
    this.elements.levelImage.style.visibility = "hidden";
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
      this.preloadLevelAssets(this.getNextLevelIndex());
    } else {
      this.preloadSpeedrunAssets();
    }
  }

  onLevelImageError() {
    const path = this.getCurrentLevel().background;
    this.elements.levelImage.classList.remove("asset-loading");
    this.elements.levelImage.style.visibility = "hidden";
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

  preloadLevelAssets(levelIndex) {
    if (levelIndex === null || levelIndex < 0 || levelIndex >= LEVELS.length) {
      return;
    }
    const nextLevel = LEVELS[levelIndex];
    this.preloadImage(nextLevel.background);
    nextLevel.targets.forEach((target) => this.preloadImage(target.preview));
  }

  preloadSpeedrunAssets() {
    const pool = [...MAIN_LEVELS, ...BONUS_LEVELS, ...ADVANCED_MAIN_LEVELS, ...ADVANCED_BONUS_LEVELS];
    if (!pool.length) {
      return;
    }
    const currentId = this.getCurrentLevel()?.id;
    const picks = [];
    const recent = new Set(this.speedrunRecentIds);
    const preferred = pool.filter((level) => level.id !== currentId && !recent.has(level.id));
    const fallback = pool.filter((level) => level.id !== currentId);
    const source = preferred.length ? preferred : fallback;
    while (source.length && picks.length < 8) {
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
    this.elements.startScreenErrorText.textContent = "Tried to load: Assets/ui/nobuttonloadingscreen.jpg";
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

  playHomeButtonIntro() {
    if (!this.homeAssetsReady) {
      return;
    }
    playHomeButtonIntroUi(this, HOME_BUTTON_ANIMATION_MS, HOME_BUTTON_STAGGER_MS);
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
    this.elements.quitConfirmOverlay.classList.add("hidden");
    this.state.quitPromptResumeTarget = false;
    this.stopElapsedTimer();
    this.clearKeys();
    this.closeAllOverlays();
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
    ].forEach((node) => node.classList.add("hidden"));
  }

  handleVersionTap() {
    this.diagnosticTapCount += 1;
    if (this.diagnosticTapCount >= 4) {
      this.elements.diagnosticUnlock.classList.remove("hidden");
      this.elements.diagnosticCodeInput.focus();
      this.diagnosticTapCount = 0;
    }
  }

  unlockDiagnostics() {
    if (this.elements.diagnosticCodeInput.value.trim() === DIAGNOSTIC_CODE) {
      this.sessionTestingUnlocked = true;
      this.elements.diagnosticMessage.textContent = "Opened.";
      this.elements.hitboxOverlay.classList.remove("hidden");
      this.elements.debugReadout.classList.remove("hidden");
      this.elements.skipLevelButton.classList.remove("hidden");
      this.layoutHomeButtons();
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
      const point = this.clientToImage(event.clientX, event.clientY);
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
    if (key === "h" && this.sessionTestingUnlocked && this.elements.screens.home.classList.contains("screen-active")) {
      event.preventDefault();
      this.toggleHomeButtonEditor();
      return;
    }
    if (this.homeButtonEditorEnabled && this.elements.screens.home.classList.contains("screen-active")) {
      if (["1", "2", "3"].includes(key)) {
        event.preventDefault();
        this.homeButtonEditorSelection = key === "1" ? "start" : key === "2" ? "settings" : "more";
        this.layoutHomeButtons();
        return;
      }
      if (key === "[" || key === "]") {
        event.preventDefault();
        this.cycleHomeEditorSelection(key === "]" ? 1 : -1);
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
    }
    if (key === "l") {
      event.preventDefault();
      this.showScreen("levelSelect");
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
    this.homeButtonEditorEnabled = !this.homeButtonEditorEnabled;
    this.layoutHomeButtons();
    this.showMenuToast(this.homeButtonEditorEnabled
      ? "Home editor on. Drag boxes to move, drag the corner to resize, use [ ] to cycle, arrows to move, Shift plus arrows to resize."
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
  }

  nudgeHomeEditorZone(key, amount) {
    const zone = this.getHomeEditorZone(this.homeButtonEditorSelection);
    if (!zone) {
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
  }

  resizeHomeEditorZone(key, amount) {
    const zone = this.getHomeEditorZone(this.homeButtonEditorSelection);
    if (!zone) {
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
    const mode = event.target.closest(".home-debug-handle") ? "resize" : "move";
    this.homeEditorDrag = {
      key: box.dataset.editorKey,
      mode,
      startX: event.clientX,
      startY: event.clientY,
    };
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
    if (!zone) {
      return;
    }
    const deltaX = ((event.clientX - this.homeEditorDrag.startX) / overlayRect.width) * imageWidth;
    const deltaY = ((event.clientY - this.homeEditorDrag.startY) / overlayRect.height) * imageHeight;
    if (this.homeEditorDrag.mode === "resize") {
      zone.x2 += deltaX;
      zone.y2 += deltaY;
    } else {
      zone.x1 += deltaX;
      zone.x2 += deltaX;
      zone.y1 += deltaY;
      zone.y2 += deltaY;
    }
    this.homeEditorDrag.startX = event.clientX;
    this.homeEditorDrag.startY = event.clientY;
    this.layoutHomeButtons();
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

    if (key === "n" && this.sessionTestingUnlocked && this.elements.screens.game.classList.contains("screen-active")) {
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
    if (!level.isBonus && !this.sessionTestingUnlocked && mainIndex >= 0) {
      nextUnlock = Math.max(this.save.legit.highestLevelCleared, Math.min(MAIN_LEVELS.length + 1, mainIndex + 2));
    }

    this.save = recordLevelResult({
      cheated: this.sessionTestingUnlocked,
      levelId: level.id,
      score: levelScore,
      stars,
      clearMs: this.state.elapsedMs,
      highestLevelCleared: nextUnlock,
      campaignWon: !level.isBonus && !level.isAdvanced && mainIndex === MAIN_LEVELS.length - 1,
    });

    if (wasSpeedrun) {
      this.save = recordSpeedrunResult({
        cheated: this.sessionTestingUnlocked,
        levelId: level.id,
        score: levelScore,
        clearMs: this.state.elapsedMs,
      });
    }

    this.renderLevelSelect();

    if (!wasSpeedrun && !level.isBonus && !level.isAdvanced && mainIndex === MAIN_LEVELS.length - 1 && !this.sessionTestingUnlocked) {
      this.elements.completionBody.textContent = this.isAdvancedUnlocked()
        ? "You cleared the main route and unlocked Advanced Levels."
        : this.getAdvancedUnlockText();
      this.elements.completionScore.textContent = formatScore(this.save.legit.bestScore);
      this.elements.completionStars.textContent = String(getTotalStars(this.save.legit));
      this.elements.completionOverlay.classList.remove("hidden");
      return;
    }

    if (!wasSpeedrun && authoredAdvancedIndex === AUTHORED_ADVANCED_MAIN_LEVELS.length - 1 && !this.sessionTestingUnlocked) {
      this.elements.completionBody.textContent = this.isSpeedrunUnlocked()
        ? "You cleared the Advanced route and unlocked Speedrun Levels on page three."
        : "You cleared the Advanced route.";
      this.elements.completionScore.textContent = formatScore(this.save.legit.bestScore);
      this.elements.completionStars.textContent = String(getTotalStars(this.save.legit));
      this.elements.completionOverlay.classList.remove("hidden");
      return;
    }

    this.elements.resultEyebrow.textContent = wasSpeedrun
      ? "Speedrun Clear"
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
    if (this.state.magnifier.active) {
      this.updateMagnifier(this.state.magnifier.pointerX, this.state.magnifier.pointerY);
    }
  }

  clientToImage(clientX, clientY) {
    const rect = this.elements.sceneViewport.getBoundingClientRect();
    const localX = clientX - rect.left;
    const localY = clientY - rect.top;
    const imageX = (localX - this.state.transform.x) / this.state.transform.scale;
    const imageY = (localY - this.state.transform.y) / this.state.transform.scale;
    if (imageX < 0 || imageY < 0 || imageX > this.state.naturalWidth || imageY > this.state.naturalHeight) {
      return null;
    }
    return { x: Math.round(imageX), y: Math.round(imageY) };
  }

  clientToImagePrecise(clientX, clientY) {
    const rect = this.elements.sceneViewport.getBoundingClientRect();
    const localX = clientX - rect.left;
    const localY = clientY - rect.top;
    const imageX = (localX - this.state.transform.x) / this.state.transform.scale;
    const imageY = (localY - this.state.transform.y) / this.state.transform.scale;
    if (imageX < 0 || imageY < 0 || imageX > this.state.naturalWidth || imageY > this.state.naturalHeight) {
      return null;
    }
    return { x: imageX, y: imageY, localX, localY };
  }

  showMagnifier(clientX, clientY, persistent) {
    this.state.magnifier.active = true;
    this.state.magnifier.persistent = persistent;
    this.elements.magnifierLens.classList.remove("hidden");
    this.elements.magnifierLens.style.visibility = "visible";
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
    const { localX, localY } = precisePoint;
    const lensWidth = this.elements.magnifierLens.offsetWidth || 240;
    const lensHeight = this.elements.magnifierLens.offsetHeight || 240;
    const zoom = this.state.magnifier.zoom;
    const bgScale = this.state.transform.scale * zoom;
    this.state.magnifier.pointerX = clientX;
    this.state.magnifier.pointerY = clientY;
    this.elements.magnifierLens.style.visibility = "visible";
    this.elements.magnifierLens.style.left = `${localX}px`;
    this.elements.magnifierLens.style.top = `${localY}px`;
    this.elements.magnifierLens.style.backgroundImage = `url("${this.elements.levelImage.currentSrc || this.elements.levelImage.src}")`;
    this.elements.magnifierLens.style.backgroundSize = `${this.state.naturalWidth * bgScale}px ${this.state.naturalHeight * bgScale}px`;
    this.elements.magnifierLens.style.backgroundPosition = `${(lensWidth / 2) - (localX * zoom)}px ${(lensHeight / 2) - (localY * zoom)}px`;
  }

  updateDebugReadout() {
    if (!this.sessionTestingUnlocked) {
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
