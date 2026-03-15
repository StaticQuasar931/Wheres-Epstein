import { LEVELS, DEFAULT_SETTINGS } from "./levels.js";
import { loadSave, recordLevelResult, saveSettings } from "./storage.js";

const MORE_GAMES_URL = "https://sites.google.com/view/staticquasar931/gm3z";
const MIN_SCALE = 0.6;
const MAX_SCALE = 5;
const WHEEL_ZOOM_STEP = 0.12;
const BUTTON_ZOOM_FACTOR = 1.2;
const DRAG_THRESHOLD = 8;
const KEYBOARD_PAN_STEP = 18;
const PAN_MARGIN = 120;
const DIAGNOSTIC_CODE = "5278";

const MAIN_LEVELS = LEVELS.filter((level) => !level.isBonus);
const BONUS_LEVELS = LEVELS.filter((level) => level.isBonus);

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function formatScore(value) {
  return Math.max(0, Math.round(value)).toLocaleString();
}

function formatTime(ms) {
  return `${(ms / 1000).toFixed(1)}s`;
}

function getHit(point, hitbox) {
  if (hitbox.type === "circle") {
    const dx = point.x - hitbox.x;
    const dy = point.y - hitbox.y;
    return Math.sqrt((dx * dx) + (dy * dy)) <= hitbox.radius;
  }

  return point.x >= hitbox.x1 && point.x <= hitbox.x2 && point.y >= hitbox.y1 && point.y <= hitbox.y2;
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
  return `${"*".repeat(stars)}${".".repeat(3 - stars)}`;
}

export class HiddenObjectGame {
  constructor() {
    this.save = loadSave();
    this.sessionTestingUnlocked = false;
    this.diagnosticTapCount = 0;
    this.keyState = new Set();
    this.keyboardPanFrame = null;
    this.state = {
      levelIndex: 0,
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
      drag: {
        pointerId: null,
        startX: 0,
        startY: 0,
        originX: 0,
        originY: 0,
        moved: false,
      },
    };

    this.elements = this.getElements();
    this.bindEvents();
    this.applySettings();
    this.renderHomeStats();
    this.renderLevelSelect();
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
      openLevelSelectButton: document.getElementById("openLevelSelectButton"),
      closeLevelSelectButton: document.getElementById("closeLevelSelectButton"),
      openSettingsButton: document.getElementById("openSettingsButton"),
      closeSettingsButton: document.getElementById("closeSettingsButton"),
      moreGamesButton: document.getElementById("moreGamesButton"),
      startScreenImage: document.getElementById("startScreenImage"),
      startScreenFallback: document.getElementById("startScreenFallback"),
      startScreenErrorText: document.getElementById("startScreenErrorText"),
      homeLevelCount: document.getElementById("homeLevelCount"),
      homeUnlockedText: document.getElementById("homeUnlockedText"),
      homeBestScore: document.getElementById("homeBestScore"),
      homeStarCount: document.getElementById("homeStarCount"),
      mainProgressText: document.getElementById("mainProgressText"),
      bonusUnlockText: document.getElementById("bonusUnlockText"),
      mainLevelGrid: document.getElementById("mainLevelGrid"),
      bonusLevelGrid: document.getElementById("bonusLevelGrid"),
      themeSelect: document.getElementById("themeSelect"),
      densitySelect: document.getElementById("densitySelect"),
      motionSelect: document.getElementById("motionSelect"),
      previewSizeSelect: document.getElementById("previewSizeSelect"),
      levelIntroSelect: document.getElementById("levelIntroSelect"),
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
      pauseButton: document.getElementById("pauseButton"),
      returnHomeButton: document.getElementById("returnHomeButton"),
      togglePreviewButton: document.getElementById("togglePreviewButton"),
      hudLevelText: document.getElementById("hudLevelText"),
      hudLevelName: document.getElementById("hudLevelName"),
      hudStarsText: document.getElementById("hudStarsText"),
      hudScoreText: document.getElementById("hudScoreText"),
      hudTimeText: document.getElementById("hudTimeText"),
      targetPreviewImage: document.getElementById("targetPreviewImage"),
      previewErrorText: document.getElementById("previewErrorText"),
      sceneFeedback: document.getElementById("sceneFeedback"),
      debugReadout: document.getElementById("debugReadout"),
      levelIntroOverlay: document.getElementById("levelIntroOverlay"),
      introLevelLabel: document.getElementById("introLevelLabel"),
      introLevelName: document.getElementById("introLevelName"),
      introPreviewImage: document.getElementById("introPreviewImage"),
      introPreviewErrorText: document.getElementById("introPreviewErrorText"),
      startLevelButton: document.getElementById("startLevelButton"),
      pauseOverlay: document.getElementById("pauseOverlay"),
      resumeButton: document.getElementById("resumeButton"),
      pauseQuitButton: document.getElementById("pauseQuitButton"),
      resultOverlay: document.getElementById("resultOverlay"),
      resultEyebrow: document.getElementById("resultEyebrow"),
      resultTitle: document.getElementById("resultTitle"),
      resultStarsText: document.getElementById("resultStarsText"),
      resultBody: document.getElementById("resultBody"),
      resultScore: document.getElementById("resultScore"),
      resultTimeText: document.getElementById("resultTimeText"),
      resultPrimaryButton: document.getElementById("resultPrimaryButton"),
      resultSecondaryButton: document.getElementById("resultSecondaryButton"),
      completionOverlay: document.getElementById("completionOverlay"),
      completionBody: document.getElementById("completionBody"),
      completionScore: document.getElementById("completionScore"),
      completionStars: document.getElementById("completionStars"),
      playAgainButton: document.getElementById("playAgainButton"),
      completionLevelSelectButton: document.getElementById("completionLevelSelectButton"),
    };
  }

  bindEvents() {
    this.elements.startGameButton.addEventListener("click", () => this.startNextLevel());
    this.elements.openLevelSelectButton.addEventListener("click", () => this.showScreen("levelSelect"));
    this.elements.closeLevelSelectButton.addEventListener("click", () => this.showScreen("home"));
    this.elements.openSettingsButton.addEventListener("click", () => this.showScreen("settings"));
    this.elements.closeSettingsButton.addEventListener("click", () => this.showScreen("home"));
    this.elements.moreGamesButton.addEventListener("click", () => window.open(MORE_GAMES_URL, "_blank", "noopener"));
    this.elements.topMenuButton.addEventListener("click", () => this.showScreen("home"));
    this.elements.themeSelect.addEventListener("change", () => this.persistSettings());
    this.elements.densitySelect.addEventListener("change", () => this.persistSettings());
    this.elements.motionSelect.addEventListener("change", () => this.persistSettings());
    this.elements.previewSizeSelect.addEventListener("change", () => this.persistSettings());
    this.elements.levelIntroSelect.addEventListener("change", () => this.persistSettings());
    this.elements.versionTapTarget.addEventListener("click", () => this.handleVersionTap());
    this.elements.unlockDiagnosticButton.addEventListener("click", () => this.unlockDiagnostics());
    this.elements.levelImage.addEventListener("load", () => this.onLevelImageLoaded());
    this.elements.levelImage.addEventListener("error", () => this.onLevelImageError());
    this.elements.targetPreviewImage.addEventListener("load", () => this.clearPreviewError());
    this.elements.targetPreviewImage.addEventListener("error", () => this.showPreviewError(this.getCurrentLevel()?.targetPreview));
    this.elements.introPreviewImage.addEventListener("load", () => this.clearIntroPreviewError());
    this.elements.introPreviewImage.addEventListener("error", () => this.showIntroPreviewError(this.getCurrentLevel()?.targetPreview));
    this.elements.startScreenImage.addEventListener("error", () => this.showStartImageError());
    this.elements.zoomOutButton.addEventListener("click", () => this.zoomFromCenter(1 / BUTTON_ZOOM_FACTOR));
    this.elements.zoomInButton.addEventListener("click", () => this.zoomFromCenter(BUTTON_ZOOM_FACTOR));
    this.elements.fitZoomButton.addEventListener("click", () => this.fitLevelToViewport());
    this.elements.resetZoomButton.addEventListener("click", () => this.fitLevelToViewport());
    this.elements.pauseButton.addEventListener("click", () => this.pauseGame());
    this.elements.returnHomeButton.addEventListener("click", () => this.quitRun());
    this.elements.togglePreviewButton.addEventListener("click", () => this.togglePreviewCard());
    this.elements.resumeButton.addEventListener("click", () => this.resumeGame());
    this.elements.pauseQuitButton.addEventListener("click", () => this.quitRun());
    this.elements.startLevelButton.addEventListener("click", () => this.beginLevel());
    this.elements.resultPrimaryButton.addEventListener("click", () => this.handleResultPrimary());
    this.elements.resultSecondaryButton.addEventListener("click", () => this.showScreen("levelSelect"));
    this.elements.playAgainButton.addEventListener("click", () => this.startCampaignFromLevel(0));
    this.elements.completionLevelSelectButton.addEventListener("click", () => this.showScreen("levelSelect"));
    this.elements.hudLevelText.addEventListener("dblclick", () => this.showScreen("levelSelect"));

    this.elements.sceneViewport.addEventListener("wheel", (event) => {
      event.preventDefault();
      const factor = event.deltaY < 0 ? 1 + WHEEL_ZOOM_STEP : 1 - WHEEL_ZOOM_STEP;
      this.zoomAtClientPoint(event.clientX, event.clientY, factor);
    }, { passive: false });

    this.elements.sceneViewport.addEventListener("pointerdown", (event) => this.onPointerDown(event));
    this.elements.sceneViewport.addEventListener("pointermove", (event) => this.onPointerMove(event));
    this.elements.sceneViewport.addEventListener("pointerup", (event) => this.onPointerUp(event));
    this.elements.sceneViewport.addEventListener("pointercancel", (event) => this.onPointerCancel(event));

    window.addEventListener("keydown", (event) => this.onKeyDown(event));
    window.addEventListener("keyup", (event) => this.onKeyUp(event));
    window.addEventListener("blur", () => this.clearKeys());
    window.addEventListener("resize", () => {
      if (this.elements.screens.game.classList.contains("screen-active")) {
        this.fitLevelToViewport();
      }
    });
  }

  applySettings() {
    this.elements.themeSelect.value = this.save.settings.theme;
    this.elements.densitySelect.value = this.save.settings.density;
    this.elements.motionSelect.value = this.save.settings.motion;
    this.elements.previewSizeSelect.value = this.save.settings.previewSize;
    this.elements.levelIntroSelect.value = this.save.settings.showLevelIntro;
    this.elements.body.dataset.theme = this.save.settings.theme;
    this.elements.body.dataset.density = this.save.settings.density;
    this.elements.body.dataset.motion = this.save.settings.motion;
    this.elements.body.dataset.preview = this.save.settings.previewSize;
  }

  persistSettings() {
    this.save = saveSettings({
      theme: this.elements.themeSelect.value,
      density: this.elements.densitySelect.value,
      motion: this.elements.motionSelect.value,
      previewSize: this.elements.previewSizeSelect.value,
      showLevelIntro: this.elements.levelIntroSelect.value,
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
    if (name !== "game") {
      this.stopElapsedTimer();
      this.clearKeys();
      this.state.runActive = false;
      this.closeAllOverlays();
    }
  }

  renderHomeStats() {
    const unlockedMain = Math.min(this.save.legit.highestLevelCleared, MAIN_LEVELS.length);
    const starCount = Object.values(this.save.legit.levelResults).reduce((sum, item) => sum + (item.bestStars ?? 0), 0);
    const mainCleared = MAIN_LEVELS.filter((level) => this.save.legit.levelResults[level.id]?.completed).length;
    this.elements.homeLevelCount.textContent = String(MAIN_LEVELS.length);
    this.elements.homeUnlockedText.textContent = `${unlockedMain} / ${MAIN_LEVELS.length}`;
    this.elements.homeBestScore.textContent = formatScore(this.save.legit.bestScore);
    this.elements.homeStarCount.textContent = String(starCount);
    this.elements.mainProgressText.textContent = `${mainCleared} / ${MAIN_LEVELS.length} cleared`;
    this.elements.bonusUnlockText.textContent = this.isBonusUnlocked() ? "Unlocked" : "Locked";
  }

  renderLevelSelect() {
    this.renderLevelGrid(this.elements.mainLevelGrid, MAIN_LEVELS, false);
    this.renderLevelGrid(this.elements.bonusLevelGrid, BONUS_LEVELS, true);
    this.renderHomeStats();
  }

  renderLevelGrid(container, levels, isBonus) {
    container.innerHTML = "";
    levels.forEach((level) => {
      const result = this.save.legit.levelResults[level.id];
      const unlocked = isBonus ? this.isBonusUnlocked() : this.isMainLevelUnlocked(level);
      const button = document.createElement("button");
      button.type = "button";
      button.className = `level-card${unlocked ? "" : " locked"}`;
      button.disabled = !unlocked;
      button.innerHTML = `<h4>${level.name}</h4><p class="level-meta">${unlocked ? "Ready" : "Locked"}</p><p class="level-meta">${result ? starText(result.bestStars ?? 0) : "☆☆☆"}</p>`;
      button.addEventListener("click", () => this.startSelectedLevel(level.id));
      container.appendChild(button);
    });
  }

  isMainLevelUnlocked(level) {
    const index = MAIN_LEVELS.findIndex((item) => item.id === level.id);
    return index < this.save.legit.highestLevelCleared;
  }

  isBonusUnlocked() {
    return this.save.legit.highestLevelCleared > MAIN_LEVELS.length;
  }

  startNextLevel() {
    const nextIndex = Math.max(0, Math.min(this.save.legit.highestLevelCleared - 1, MAIN_LEVELS.length - 1));
    this.startCampaignFromLevel(nextIndex);
  }

  startSelectedLevel(levelId) {
    const index = LEVELS.findIndex((level) => level.id === levelId);
    if (index >= 0) {
      this.startCampaignFromLevel(index);
    }
  }

  startCampaignFromLevel(index) {
    this.closeAllOverlays();
    this.state.levelIndex = index;
    this.state.totalScore = 0;
    this.state.runCheated = this.sessionTestingUnlocked;
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

  openLevelIntro() {
    const level = this.getCurrentLevel();
    const label = level.isBonus
      ? "Bonus Level"
      : `Level ${MAIN_LEVELS.findIndex((item) => item.id === level.id) + 1}`;
    this.elements.introLevelLabel.textContent = label;
    this.elements.introLevelName.textContent = level.name;
    this.elements.introPreviewImage.src = level.targetPreview;
    this.elements.levelIntroOverlay.classList.remove("hidden");
  }

  beginLevel() {
    const level = this.getCurrentLevel();
    this.elements.levelIntroOverlay.classList.add("hidden");
    this.state.elapsedMs = 0;
    this.state.wrongClicks = 0;
    this.state.pointerImage = null;
    this.state.lastClickImage = null;
    this.state.runActive = false;
    this.stopElapsedTimer();
    this.elements.hudLevelText.textContent = level.isBonus
      ? "Bonus"
      : `Level ${MAIN_LEVELS.findIndex((item) => item.id === level.id) + 1}`;
    this.elements.hudLevelName.textContent = level.name;
    this.elements.targetPreviewImage.src = level.targetPreview;
    this.elements.levelImage.src = level.background;
    this.renderHitbox(level.hitbox);
    this.updateHud();
  }

  onLevelImageLoaded() {
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
  }

  onLevelImageError() {
    const path = this.getCurrentLevel().background;
    this.elements.sceneFallbackTitle.textContent = "Unable to load level background";
    this.elements.sceneFallbackText.textContent = `Tried to load: ${path}`;
    this.elements.sceneFallback.classList.remove("hidden");
    this.state.runActive = false;
    this.stopElapsedTimer();
  }

  showPreviewError(path) {
    this.elements.previewErrorText.textContent = `Tried to load: ${path}`;
    this.elements.previewErrorText.classList.remove("hidden");
  }

  clearPreviewError() {
    this.elements.previewErrorText.classList.add("hidden");
    this.elements.previewErrorText.textContent = "";
  }

  showIntroPreviewError(path) {
    this.elements.introPreviewErrorText.textContent = `Tried to load: ${path}`;
    this.elements.introPreviewErrorText.classList.remove("hidden");
  }

  clearIntroPreviewError() {
    this.elements.introPreviewErrorText.classList.add("hidden");
    this.elements.introPreviewErrorText.textContent = "";
  }

  showStartImageError() {
    this.elements.startScreenFallback.classList.remove("hidden");
    this.elements.startScreenErrorText.textContent = "Tried to load: Assets/startscreen.png";
  }

  renderHitbox(hitbox) {
    this.elements.hitboxOverlay.innerHTML = "";
    const node = document.createElement("div");
    node.className = "hitbox-shape";
    if (hitbox.type === "circle") {
      node.style.left = `${hitbox.x - hitbox.radius}px`;
      node.style.top = `${hitbox.y - hitbox.radius}px`;
      node.style.width = `${hitbox.radius * 2}px`;
      node.style.height = `${hitbox.radius * 2}px`;
      node.style.borderRadius = "50%";
    } else {
      node.style.left = `${hitbox.x1}px`;
      node.style.top = `${hitbox.y1}px`;
      node.style.width = `${hitbox.x2 - hitbox.x1}px`;
      node.style.height = `${hitbox.y2 - hitbox.y1}px`;
      node.style.borderRadius = "12px";
    }
    this.elements.hitboxOverlay.appendChild(node);
    this.elements.hitboxOverlay.classList.toggle("hidden", !this.sessionTestingUnlocked);
    this.elements.debugReadout.classList.toggle("hidden", !this.sessionTestingUnlocked);
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
    const hidden = this.elements.targetPreviewImage.closest(".target-card").classList.toggle("hidden-preview");
    this.elements.togglePreviewButton.textContent = hidden ? "Show" : "Hide";
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
    this.stopElapsedTimer();
    this.clearKeys();
    this.closeAllOverlays();
    this.showScreen("home");
    this.renderLevelSelect();
  }

  closeAllOverlays() {
    [
      this.elements.levelIntroOverlay,
      this.elements.pauseOverlay,
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
      return;
    }
    this.elements.diagnosticMessage.textContent = "Denied.";
  }

  onPointerDown(event) {
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
    const key = event.key.toLowerCase();
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
    if (getHit(point, this.getCurrentLevel().hitbox)) {
      this.completeLevel();
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
      campaignWon: !level.isBonus && mainIndex === MAIN_LEVELS.length - 1,
    });

    this.renderLevelSelect();

    if (!level.isBonus && mainIndex === MAIN_LEVELS.length - 1 && !this.sessionTestingUnlocked) {
      this.elements.completionBody.textContent = "Bonus levels are now unlocked.";
      this.elements.completionScore.textContent = formatScore(this.save.legit.bestScore);
      this.elements.completionStars.textContent = String(Object.values(this.save.legit.levelResults).reduce((sum, item) => sum + (item.bestStars ?? 0), 0));
      this.elements.completionOverlay.classList.remove("hidden");
      return;
    }

    this.elements.resultEyebrow.textContent = level.isBonus ? "Bonus Cleared" : "Level Cleared";
    this.elements.resultTitle.textContent = level.name;
    this.elements.resultStarsText.textContent = starText(stars);
    this.elements.resultBody.textContent = `You cleared the scene in ${formatTime(this.state.elapsedMs)}. Faster clears earn more stars and more score.`;
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
