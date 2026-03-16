import { LEVELS, MAIN_LEVELS, BONUS_LEVELS, ADVANCED_LEVELS, DEFAULT_SETTINGS, START_SCREEN_BUTTONS } from "./levels.js";
import { loadSave, recordLevelResult, saveSettings, saveMeta } from "./storage.js";
import { layoutHomeButtons as layoutHomeButtonsUi, playHomeButtonIntro as playHomeButtonIntroUi, updateHomeDebug as updateHomeDebugUi } from "./home-ui.js";
import { showMenuToast as showMenuToastUi, renderPreviewList as renderPreviewListUi, syncFoundPreviewState as syncFoundPreviewStateUi, renderHitboxes as renderHitboxesUi } from "./game-renderer.js";

const MORE_GAMES_URL = "https://sites.google.com/view/staticquasar931/gm3z";
const DISCORD_URL = "https://discord.gg/jW2az4AQUH";
const MIN_SCALE = 0.6;
const MAX_SCALE = 8;
const WHEEL_ZOOM_STEP = 0.12;
const BUTTON_ZOOM_FACTOR = 1.2;
const DRAG_THRESHOLD = 8;
const KEYBOARD_PAN_STEP = 18;
const PAN_MARGIN = 120;
const DIAGNOSTIC_CODE = "5278";
const HOME_BUTTON_STAGGER_MS = 260;
const HOME_BUTTON_ANIMATION_MS = 980;
const HOME_BUTTON_X_OFFSET = -90;
const HOME_BUTTON_Y_OFFSET = -180;
const HOME_BUTTON_ALPHA_THRESHOLD = 96;
const KONAMI_SEQUENCE = ["arrowup", "arrowup", "arrowdown", "arrowdown", "arrowleft", "arrowright", "arrowleft", "arrowright", "b", "a"];
const WALDO_SEQUENCE = ["w", "a", "l", "d", "o"];
const PARTY_SEQUENCE = ["p", "a", "r", "t", "y"];

const ADVANCED_MAIN_LEVELS = ADVANCED_LEVELS.filter((level) => !level.isAdvancedBonus);
const ADVANCED_BONUS_LEVELS = ADVANCED_LEVELS.filter((level) => level.isAdvancedBonus);

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function formatScore(value) {
  return Math.max(0, Math.round(value)).toLocaleString();
}

function formatTime(ms) {
  return `${(ms / 1000).toFixed(1)}s`;
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
    this.preloadedAssets = new Set();
    this.homeIntroPlayed = false;
    this.state = {
      levelIndex: 0,
      levelSelectPage: 1,
      totalScore: 0,
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
    };

    this.elements = this.getElements();
    this.bindEvents();
    this.applySettings();
    this.renderHomeStats();
    this.renderLevelSelect();
    window.requestAnimationFrame(() => {
      this.layoutHomeButtons();
      this.playHomeButtonIntro();
    });
    if (this.elements.startScreenImage.complete) {
      if (this.elements.startScreenImage.naturalWidth > 0) {
        this.layoutHomeButtons();
        this.playHomeButtonIntro();
      } else {
        this.showStartImageError();
      }
    }
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
      closeLevelSelectButton: document.getElementById("closeLevelSelectButton"),
      openSettingsButton: document.getElementById("openSettingsButton"),
      closeSettingsButton: document.getElementById("closeSettingsButton"),
      moreGamesButton: document.getElementById("moreGamesButton"),
      homeViewport: document.getElementById("homeViewport"),
      homeButtonOverlay: document.getElementById("homeButtonOverlay"),
      homeDebugOverlay: document.getElementById("homeDebugOverlay"),
      homeDebugReadout: document.getElementById("homeDebugReadout"),
      startButtonArt: document.getElementById("startButtonArt"),
      settingsButtonArt: document.getElementById("settingsButtonArt"),
      moreGamesButtonArt: document.getElementById("moreGamesButtonArt"),
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
      levelSelectPageLabel: document.getElementById("levelSelectPageLabel"),
      levelSelectPrevPageButton: document.getElementById("levelSelectPrevPageButton"),
      levelSelectNextPageButton: document.getElementById("levelSelectNextPageButton"),
      mainRouteSection: document.getElementById("mainRouteSection"),
      bonusRouteSection: document.getElementById("bonusRouteSection"),
      advancedRouteSection: document.getElementById("advancedRouteSection"),
      advancedBonusSection: document.getElementById("advancedBonusSection"),
      themeSelect: document.getElementById("themeSelect"),
      densitySelect: document.getElementById("densitySelect"),
      motionSelect: document.getElementById("motionSelect"),
      previewSizeSelect: document.getElementById("previewSizeSelect"),
      levelIntroSelect: document.getElementById("levelIntroSelect"),
      panTipSelect: document.getElementById("panTipSelect"),
      confirmQuitSelect: document.getElementById("confirmQuitSelect"),
      previewDefaultSelect: document.getElementById("previewDefaultSelect"),
      settingsDiscordButton: document.getElementById("settingsDiscordButton"),
      settingsMoreGamesButton: document.getElementById("settingsMoreGamesButton"),
      settingsLevelSelectButton: document.getElementById("settingsLevelSelectButton"),
      settingsLinkHint: document.getElementById("settingsLinkHint"),
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
    this.elements.startGameButton.addEventListener("click", () => this.showScreen("levelSelect"));
    this.elements.closeLevelSelectButton.addEventListener("click", () => this.showScreen("home"));
    this.elements.openSettingsButton.addEventListener("click", () => this.showScreen("settings"));
    this.elements.closeSettingsButton.addEventListener("click", () => this.showScreen("home"));
    this.elements.moreGamesButton.addEventListener("click", () => this.openExternalLink(MORE_GAMES_URL, "More Games link is not configured yet."));
    this.elements.topMenuButton.addEventListener("click", () => this.handleTopMenu());
    this.elements.themeSelect.addEventListener("change", () => this.persistSettings());
    this.elements.densitySelect.addEventListener("change", () => this.persistSettings());
    this.elements.motionSelect.addEventListener("change", () => this.persistSettings());
    this.elements.previewSizeSelect.addEventListener("change", () => this.persistSettings());
    this.elements.levelIntroSelect.addEventListener("change", () => this.persistSettings());
    this.elements.panTipSelect.addEventListener("change", () => this.persistSettings());
    this.elements.confirmQuitSelect.addEventListener("change", () => this.persistSettings());
    this.elements.previewDefaultSelect.addEventListener("change", () => this.persistSettings());
    this.elements.settingsDiscordButton.addEventListener("click", () => this.openExternalLink(DISCORD_URL, "Add your Discord invite URL in scripts/game.js to enable this button."));
    this.elements.settingsMoreGamesButton.addEventListener("click", () => this.openExternalLink(MORE_GAMES_URL, "More Games link is not configured yet."));
    this.elements.settingsLevelSelectButton.addEventListener("click", () => this.showScreen("levelSelect"));
    this.elements.levelSelectPrevPageButton.addEventListener("click", () => this.changeLevelSelectPage(-1));
    this.elements.levelSelectNextPageButton.addEventListener("click", () => this.changeLevelSelectPage(1));
    this.elements.versionTapTarget.addEventListener("click", () => this.handleVersionTap());
    this.elements.unlockDiagnosticButton.addEventListener("click", () => this.unlockDiagnostics());
    this.elements.levelImage.addEventListener("load", () => this.onLevelImageLoaded());
    this.elements.levelImage.addEventListener("error", () => this.onLevelImageError());
    this.elements.startScreenImage.addEventListener("error", () => this.showStartImageError());
    this.elements.startScreenImage.addEventListener("load", () => {
      this.hideStartImageError();
      this.layoutHomeButtons();
      this.playHomeButtonIntro();
    });
    [this.elements.startButtonArt, this.elements.settingsButtonArt, this.elements.moreGamesButtonArt].forEach((image) => {
      image.addEventListener("load", () => this.layoutHomeButtons());
    });
    this.elements.zoomOutButton.addEventListener("click", () => this.zoomFromCenter(1 / BUTTON_ZOOM_FACTOR));
    this.elements.zoomInButton.addEventListener("click", () => this.zoomFromCenter(BUTTON_ZOOM_FACTOR));
    this.elements.fitZoomButton.addEventListener("click", () => this.fitLevelToViewport());
    this.elements.resetZoomButton.addEventListener("click", () => this.fitLevelToViewport());
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
      const factor = event.deltaY < 0 ? 1 + WHEEL_ZOOM_STEP : 1 - WHEEL_ZOOM_STEP;
      this.zoomAtClientPoint(event.clientX, event.clientY, factor);
    }, { passive: false });

    this.elements.sceneViewport.addEventListener("pointerdown", (event) => this.onPointerDown(event));
    this.elements.sceneViewport.addEventListener("pointermove", (event) => this.onPointerMove(event));
    this.elements.sceneViewport.addEventListener("pointerup", (event) => this.onPointerUp(event));
    this.elements.sceneViewport.addEventListener("pointercancel", (event) => this.onPointerCancel(event));
    this.elements.homeViewport.addEventListener("pointermove", (event) => this.updateHomeDebug(event));

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
    this.elements.themeSelect.value = this.save.settings.theme;
    this.elements.densitySelect.value = this.save.settings.density;
    this.elements.motionSelect.value = this.save.settings.motion;
    this.elements.previewSizeSelect.value = this.save.settings.previewSize;
    this.elements.levelIntroSelect.value = this.save.settings.showLevelIntro;
    this.elements.panTipSelect.value = this.save.settings.showPanTip;
    this.elements.confirmQuitSelect.value = this.save.settings.confirmQuit;
    this.elements.previewDefaultSelect.value = this.save.settings.previewDefault;
    this.elements.body.dataset.theme = this.save.settings.theme;
    this.elements.body.dataset.density = this.save.settings.density;
    this.elements.body.dataset.motion = this.save.settings.motion;
    this.elements.body.dataset.preview = this.save.settings.previewSize;
    this.elements.panTipText.classList.toggle("hidden", this.save.settings.showPanTip === "off");
    this.elements.skipLevelButton.classList.toggle("hidden", !this.sessionTestingUnlocked);
    this.elements.settingsDiscordButton.disabled = !DISCORD_URL;
    this.elements.settingsLinkHint.textContent = DISCORD_URL
      ? "Community links open in a new tab."
      : "Set your Discord invite URL in scripts/game.js to turn on the Discord button.";
  }

  persistSettings() {
    this.save = saveSettings({
      theme: this.elements.themeSelect.value,
      density: this.elements.densitySelect.value,
      motion: this.elements.motionSelect.value,
      previewSize: this.elements.previewSizeSelect.value,
      showLevelIntro: this.elements.levelIntroSelect.value,
      showPanTip: this.elements.panTipSelect.value,
      confirmQuit: this.elements.confirmQuitSelect.value,
      previewDefault: this.elements.previewDefaultSelect.value,
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
    this.elements.topMenuButton.textContent = name === "home" ? "Levels" : "Menu";
    if (name !== "game") {
      this.stopElapsedTimer();
      this.clearKeys();
      this.state.runActive = false;
      this.closeAllOverlays();
    }
    if (name === "home" || name === "levelSelect") {
      this.renderLevelSelect();
    }
    this.layoutHomeButtons();
    if (name === "home" && this.elements.startScreenImage.naturalWidth > 0) {
      this.playHomeButtonIntro();
    }
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
    this.elements.homeLevelCount.textContent = String(MAIN_LEVELS.length);
    this.elements.homeUnlockedText.textContent = `${unlockedMain} / ${MAIN_LEVELS.length}`;
    this.elements.homeBestScore.textContent = formatScore(this.save.legit.bestScore);
    this.elements.homeStarCount.textContent = String(starCount);
    this.elements.mainProgressText.textContent = `${mainCleared} / ${MAIN_LEVELS.length} cleared`;
    this.elements.bonusUnlockText.textContent = this.isBonusUnlocked() ? "Unlocked" : "Locked";
    this.elements.bonusRuleText.textContent = `Bonuses unlock after normal level 5 or 10 total stars. Current stars: ${starCount}.`;
    this.elements.advancedRevealText.textContent = this.getAdvancedUnlockText();
  }

  showMenuToast(message, isBad = false) {
    showMenuToastUi(this, message, isBad);
  }

  renderLevelSelect() {
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
      const bestScore = result ? formatScore(result.bestScore ?? 0) : "0";
      const cardLabel = this.getLevelCardLabel(level, options.kind);
      const button = document.createElement("button");
      button.type = "button";
      button.className = `level-card${unlocked ? "" : " locked"}`;
      button.disabled = !unlocked;
      button.innerHTML = unlocked
        ? `<div class="level-card-top"><h4>${level.name}</h4><span class="level-number">${cardLabel}</span></div><p class="level-meta level-best-score">Best score: ${bestScore}</p><p class="level-meta level-stars">${bestStars}</p>`
        : `<div class="level-card-top"><h4>${level.name}</h4><span class="level-number">${cardLabel}</span></div><p class="level-lock"><span class="lock-icon" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false"><path d="M7 10V8a5 5 0 0 1 10 0v2h1.5A1.5 1.5 0 0 1 20 11.5v8A1.5 1.5 0 0 1 18.5 21h-13A1.5 1.5 0 0 1 4 19.5v-8A1.5 1.5 0 0 1 5.5 10H7Zm2 0h6V8a3 3 0 1 0-6 0v2Z" fill="currentColor"/></svg></span>Locked</p><p class="level-meta level-best-score">Best score: ${bestScore}</p><p class="level-meta level-stars">${bestStars}</p>`;
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
      return `Surprise unlocks after all 20 main levels are cleared and 50 stars are earned. Main clears: ${mainDone}/${MAIN_LEVELS.length}.`;
    }
    return `Surprise unlocks at ${totalStars}/50 stars. ${remainingStars} more stars to reveal Advanced Levels.`;
  }

  changeLevelSelectPage(direction) {
    const nextPage = clamp(this.state.levelSelectPage + direction, 1, 2);
    if (nextPage === 2 && !this.isAdvancedUnlocked()) {
      this.showMenuToast(this.getAdvancedUnlockText(), true);
      return;
    }
    this.state.levelSelectPage = nextPage;
    this.syncLevelSelectPage();
  }

  syncLevelSelectPage() {
    const onAdvancedPage = this.state.levelSelectPage === 2 && this.isAdvancedUnlocked();
    this.elements.levelSelectPageLabel.textContent = onAdvancedPage ? "Advanced Levels" : "Main Levels";
    this.elements.mainRouteSection.classList.toggle("hidden", onAdvancedPage);
    this.elements.bonusRouteSection.classList.toggle("hidden", onAdvancedPage);
    this.elements.advancedRouteSection.classList.toggle("hidden", !onAdvancedPage);
    this.elements.advancedBonusSection.classList.toggle("hidden", !onAdvancedPage);
    this.elements.levelSelectPrevPageButton.classList.toggle("hidden", !onAdvancedPage);
    this.elements.levelSelectNextPageButton.classList.toggle("hidden", !this.isAdvancedUnlocked() || onAdvancedPage);
  }

  startNextLevel() {
    const nextIndex = Math.max(0, Math.min(this.save.legit.highestLevelCleared - 1, MAIN_LEVELS.length - 1));
    this.startCampaignFromLevel(nextIndex);
  }

  startSelectedLevel(levelId) {
    const index = LEVELS.findIndex((level) => level.id === levelId);
    if (index >= 0 && (this.sessionTestingUnlocked || this.isLevelUnlocked(LEVELS[index], LEVELS[index].isAdvancedBonus ? "advancedBonus" : LEVELS[index].isAdvanced ? "advanced" : LEVELS[index].isBonus ? "bonus" : "main"))) {
      this.startCampaignFromLevel(index);
    }
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

  openLevelIntro() {
    const level = this.getCurrentLevel();
    this.elements.introLevelLabel.textContent = this.getCurrentLevelLabel(level);
    this.elements.introLevelName.textContent = level.name;
    this.clearIntroPreviewError();
    this.renderPreviewList(this.elements.introPreviewList, this.elements.introPreviewErrorText, level.targets);
    this.elements.introPreviewHint.textContent = level.targets.length > 1
      ? `Find both targets before the level clears. ${level.targets.length} total.`
      : "Find the exact preview target in the crowd scene.";
    this.elements.levelIntroOverlay.classList.remove("hidden");
  }

  beginLevel() {
    const level = this.getCurrentLevel();
    if (this.shouldShowAdvancedInfo(level)) {
      this.openAdvancedInfo();
      return;
    }
    this.elements.levelIntroOverlay.classList.add("hidden");
    this.state.elapsedMs = 0;
    this.state.wrongClicks = 0;
    this.state.pointerImage = null;
    this.state.lastClickImage = null;
    this.state.foundTargetIds = new Set();
    this.state.runActive = false;
    this.stopElapsedTimer();
    this.elements.hudLevelText.textContent = this.getCurrentLevelLabel(level);
    this.elements.hudLevelName.textContent = level.name;
    this.elements.targetPreviewLabel.textContent = level.targets.length > 1 ? "Find These People" : "Find This Person";
    this.elements.sceneFallback.classList.add("hidden");
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
    this.elements.levelImage.removeAttribute("src");
    this.elements.sceneContent.style.width = "1px";
    this.elements.sceneContent.style.height = "1px";
    this.elements.hitboxOverlay.style.width = "1px";
    this.elements.hitboxOverlay.style.height = "1px";
  }

  onLevelImageLoaded() {
    this.elements.levelImage.classList.remove("asset-loading");
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
    this.preloadLevelAssets(this.getNextLevelIndex());
  }

  onLevelImageError() {
    const path = this.getCurrentLevel().background;
    this.elements.levelImage.classList.remove("asset-loading");
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
    image.src = path;
    this.preloadedAssets.add(path);
  }

  preloadLevelAssets(levelIndex) {
    if (levelIndex === null || levelIndex < 0 || levelIndex >= LEVELS.length) {
      return;
    }
    const nextLevel = LEVELS[levelIndex];
    this.preloadImage(nextLevel.background);
    nextLevel.targets.forEach((target) => this.preloadImage(target.preview));
  }

  shouldShowAdvancedInfo(level) {
    return level.id === "advanced-02" && !this.save.meta.advancedMultiSeen && !this.sessionTestingUnlocked;
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
      start: START_SCREEN_BUTTONS.start,
      settings: START_SCREEN_BUTTONS.settings,
      moreGames: START_SCREEN_BUTTONS.moreGames,
      xOffset: HOME_BUTTON_X_OFFSET,
      yOffset: HOME_BUTTON_Y_OFFSET,
      alphaThreshold: HOME_BUTTON_ALPHA_THRESHOLD,
    });
  }

  playHomeButtonIntro() {
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
      start: START_SCREEN_BUTTONS.start,
      settings: START_SCREEN_BUTTONS.settings,
      moreGames: START_SCREEN_BUTTONS.moreGames,
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
    this.clearDragState(event.pointerId);
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
    if (key === "l") {
      event.preventDefault();
      this.showScreen("levelSelect");
      return;
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
    if (!["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(key)) {
      return;
    }
    if (!this.elements.screens.game.classList.contains("screen-active")) {
      return;
    }
    event.preventDefault();
    this.keyState.add(key);
    this.ensureKeyboardPanLoop();
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
    let deltaX = 0;
    let deltaY = 0;
    if (this.keyState.has("a") || this.keyState.has("arrowleft")) {
      deltaX += KEYBOARD_PAN_STEP;
    }
    if (this.keyState.has("d") || this.keyState.has("arrowright")) {
      deltaX -= KEYBOARD_PAN_STEP;
    }
    if (this.keyState.has("w") || this.keyState.has("arrowup")) {
      deltaY += KEYBOARD_PAN_STEP;
    }
    if (this.keyState.has("s") || this.keyState.has("arrowdown")) {
      deltaY -= KEYBOARD_PAN_STEP;
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

    const mainIndex = MAIN_LEVELS.findIndex((item) => item.id === level.id);
    const advancedIndex = ADVANCED_MAIN_LEVELS.findIndex((item) => item.id === level.id);
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

    this.renderLevelSelect();

    if (!level.isBonus && !level.isAdvanced && mainIndex === MAIN_LEVELS.length - 1 && !this.sessionTestingUnlocked) {
      this.elements.completionBody.textContent = this.isAdvancedUnlocked()
        ? "You cleared the main route and unlocked Advanced Levels."
        : this.getAdvancedUnlockText();
      this.elements.completionScore.textContent = formatScore(this.save.legit.bestScore);
      this.elements.completionStars.textContent = String(getTotalStars(this.save.legit));
      this.elements.completionOverlay.classList.remove("hidden");
      return;
    }

    if (advancedIndex === ADVANCED_MAIN_LEVELS.length - 1 && !this.sessionTestingUnlocked) {
      this.elements.completionBody.textContent = "You cleared the Advanced route. Advanced bonus levels stay open on page two.";
      this.elements.completionScore.textContent = formatScore(this.save.legit.bestScore);
      this.elements.completionStars.textContent = String(getTotalStars(this.save.legit));
      this.elements.completionOverlay.classList.remove("hidden");
      return;
    }

    this.elements.resultEyebrow.textContent = level.isAdvancedBonus ? "Advanced Bonus Cleared" : level.isAdvanced ? "Advanced Cleared" : level.isBonus ? "Bonus Cleared" : "Level Cleared";
    this.elements.resultTitle.textContent = level.name;
    this.elements.resultStarsText.textContent = starText(stars);
    this.elements.resultBody.textContent = `You found ${this.getCurrentLevelTargets().length} target${this.getCurrentLevelTargets().length === 1 ? "" : "s"} in ${formatTime(this.state.elapsedMs)}. Faster clears earn more stars and more score.`;
    this.elements.resultScore.textContent = formatScore(levelScore);
    this.elements.resultTimeText.textContent = formatTime(this.state.elapsedMs);
    this.elements.resultPrimaryButton.textContent = this.getNextLevelIndex() !== null ? "Next Level" : "Level Select";
    this.elements.resultOverlay.classList.remove("hidden");
  }

  getNextLevelIndex() {
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

  updateDebugReadout() {
    if (!this.sessionTestingUnlocked) {
      return;
    }
    const pointer = this.state.pointerImage ? `Pointer: ${this.state.pointerImage.x}, ${this.state.pointerImage.y}` : "Pointer: outside image";
    const click = this.state.lastClickImage ? `Last click: ${this.state.lastClickImage.x}, ${this.state.lastClickImage.y}` : "Last click: none";
    this.elements.debugReadout.textContent = `${pointer}\n${click}`;
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
