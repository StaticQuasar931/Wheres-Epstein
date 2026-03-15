// Where's Epstein?
// Where's Epstein?

import { LEVELS, DEFAULT_SETTINGS } from "./levels.js";
import { loadSave, recordRun, saveSettings } from "./storage.js";

const MORE_GAMES_URL = "#";
const MIN_SCALE = 0.6;
const MAX_SCALE = 5;
const WHEEL_ZOOM_STEP = 0.12;
const BUTTON_ZOOM_FACTOR = 1.2;
const DRAG_THRESHOLD = 8;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function formatScore(value) {
  return Math.max(0, Math.round(value)).toLocaleString();
}

function isHit(hitbox, point) {
  if (hitbox.type === "circle") {
    const dx = point.x - hitbox.x;
    const dy = point.y - hitbox.y;
    return Math.sqrt((dx * dx) + (dy * dy)) <= hitbox.radius;
  }

  return (
    point.x >= hitbox.x &&
    point.x <= hitbox.x + hitbox.width &&
    point.y >= hitbox.y &&
    point.y <= hitbox.y + hitbox.height
  );
}

export class HiddenObjectGame {
  constructor() {
    this.save = loadSave();
    this.sessionTestingUnlocked = false;
    this.diagnosticTapCount = 0;
    this.state = {
      levelIndex: 0,
      score: 0,
      timer: 0,
      timerId: null,
      runActive: false,
      runCheated: false,
      paused: false,
      pendingResult: null,
      runRecorded: false,
      highestLevelCleared: 0,
      naturalWidth: 1,
      naturalHeight: 1,
      feedbackTimeoutId: null,
      fitScale: 1,
      transform: { scale: 1, x: 0, y: 0 },
      drag: {
        pointerId: null,
        startX: 0,
        startY: 0,
        originX: 0,
        originY: 0,
        moved: false,
      },
      pointerImage: null,
      lastClickImage: null,
    };

    this.elements = this.getElements();
    this.bindEvents();
    this.populateStaticUi();
    this.applySettingsUi();
    this.updateHomeStats();
    this.updateDiagnosticStatus();
  }

  getElements() {
    return {
      screens: {
        home: document.getElementById("homeScreen"),
        settings: document.getElementById("settingsScreen"),
        game: document.getElementById("gameScreen"),
      },
      homeLevelCount: document.getElementById("homeLevelCount"),
      homeBestScore: document.getElementById("homeBestScore"),
      homeBestCheatScore: document.getElementById("homeBestCheatScore"),
      topMenuButton: document.getElementById("topMenuButton"),
      startGameButton: document.getElementById("startGameButton"),
      openSettingsButton: document.getElementById("openSettingsButton"),
      moreGamesButton: document.getElementById("moreGamesButton"),
      closeSettingsButton: document.getElementById("closeSettingsButton"),
      timePenaltySelect: document.getElementById("timePenaltySelect"),
      scorePenaltySelect: document.getElementById("scorePenaltySelect"),
      diagnosticHintButton: document.getElementById("diagnosticHintButton"),
      diagnosticUnlock: document.getElementById("diagnosticUnlock"),
      diagnosticCodeInput: document.getElementById("diagnosticCodeInput"),
      unlockDiagnosticButton: document.getElementById("unlockDiagnosticButton"),
      diagnosticMessage: document.getElementById("diagnosticMessage"),
      diagnosticStatus: document.getElementById("diagnosticStatus"),
      hudLevelText: document.getElementById("hudLevelText"),
      hudScoreText: document.getElementById("hudScoreText"),
      hudTimerText: document.getElementById("hudTimerText"),
      cheatBadge: document.getElementById("cheatBadge"),
      targetPreviewImage: document.getElementById("targetPreviewImage"),
      targetLevelName: document.getElementById("targetLevelName"),
      targetHelpText: document.getElementById("targetHelpText"),
      levelImage: document.getElementById("levelImage"),
      sceneViewport: document.getElementById("sceneViewport"),
      sceneContent: document.getElementById("sceneContent"),
      hitboxOverlay: document.getElementById("hitboxOverlay"),
      sceneFeedback: document.getElementById("sceneFeedback"),
      debugReadout: document.getElementById("debugReadout"),
      zoomOutButton: document.getElementById("zoomOutButton"),
      zoomInButton: document.getElementById("zoomInButton"),
      resetZoomButton: document.getElementById("resetZoomButton"),
      fitZoomButton: document.getElementById("fitZoomButton"),
      pauseButton: document.getElementById("pauseButton"),
      returnHomeButton: document.getElementById("returnHomeButton"),
      levelIntroOverlay: document.getElementById("levelIntroOverlay"),
      introLevelLabel: document.getElementById("introLevelLabel"),
      introLevelName: document.getElementById("introLevelName"),
      introPreviewImage: document.getElementById("introPreviewImage"),
      startLevelButton: document.getElementById("startLevelButton"),
      pauseOverlay: document.getElementById("pauseOverlay"),
      resumeButton: document.getElementById("resumeButton"),
      pauseQuitButton: document.getElementById("pauseQuitButton"),
      resultOverlay: document.getElementById("resultOverlay"),
      resultEyebrow: document.getElementById("resultEyebrow"),
      resultTitle: document.getElementById("resultTitle"),
      resultBody: document.getElementById("resultBody"),
      resultScore: document.getElementById("resultScore"),
      resultTimeLeft: document.getElementById("resultTimeLeft"),
      resultPrimaryButton: document.getElementById("resultPrimaryButton"),
      resultSecondaryButton: document.getElementById("resultSecondaryButton"),
      completionOverlay: document.getElementById("completionOverlay"),
      completionScore: document.getElementById("completionScore"),
      completionRunType: document.getElementById("completionRunType"),
      completionBody: document.getElementById("completionBody"),
      playAgainButton: document.getElementById("playAgainButton"),
      completionHomeButton: document.getElementById("completionHomeButton"),
    };
  }

  bindEvents() {
    this.elements.startGameButton.addEventListener("click", () => this.startCampaign());
    this.elements.openSettingsButton.addEventListener("click", () => this.showScreen("settings"));
    this.elements.closeSettingsButton.addEventListener("click", () => this.showScreen("home"));
    this.elements.topMenuButton.addEventListener("click", () => {
      if (this.elements.screens.game.classList.contains("screen-active")) {
        this.quitRun();
        return;
      }

      this.showScreen("home");
    });
    this.elements.moreGamesButton.addEventListener("click", () => this.handleMoreGames());
    this.elements.timePenaltySelect.addEventListener("change", () => this.persistSettings());
    this.elements.scorePenaltySelect.addEventListener("change", () => this.persistSettings());
    this.elements.diagnosticHintButton.addEventListener("click", () => this.revealDiagnosticEntry());
    this.elements.unlockDiagnosticButton.addEventListener("click", () => this.unlockTestingMode());
    this.elements.startLevelButton.addEventListener("click", () => this.beginActiveLevel());
    this.elements.pauseButton.addEventListener("click", () => this.pauseGame());
    this.elements.resumeButton.addEventListener("click", () => this.resumeGame());
    this.elements.pauseQuitButton.addEventListener("click", () => this.quitRun());
    this.elements.returnHomeButton.addEventListener("click", () => this.quitRun());
    this.elements.zoomInButton.addEventListener("click", () => this.zoomFromCenter(BUTTON_ZOOM_FACTOR));
    this.elements.zoomOutButton.addEventListener("click", () => this.zoomFromCenter(1 / BUTTON_ZOOM_FACTOR));
    this.elements.resetZoomButton.addEventListener("click", () => this.resetLevelCamera());
    this.elements.fitZoomButton.addEventListener("click", () => this.fitLevelToViewport());
    this.elements.resultPrimaryButton.addEventListener("click", () => this.handleResultPrimary());
    this.elements.resultSecondaryButton.addEventListener("click", () => this.handleResultSecondary());
    this.elements.playAgainButton.addEventListener("click", () => this.startCampaign());
    this.elements.completionHomeButton.addEventListener("click", () => this.showScreen("home"));
    this.elements.levelImage.addEventListener("load", () => this.onLevelImageLoaded());
    this.elements.levelImage.addEventListener("error", () => this.showFeedback("Level image could not be loaded.", true));

    this.elements.sceneViewport.addEventListener("wheel", (event) => {
      event.preventDefault();
      const factor = event.deltaY < 0 ? 1 + WHEEL_ZOOM_STEP : 1 - WHEEL_ZOOM_STEP;
      this.zoomAtClientPoint(event.clientX, event.clientY, factor);
    }, { passive: false });

    this.elements.sceneViewport.addEventListener("pointerdown", (event) => this.onPointerDown(event));
    this.elements.sceneViewport.addEventListener("pointermove", (event) => this.onPointerMove(event));
    this.elements.sceneViewport.addEventListener("pointerup", (event) => this.onPointerUp(event));
    this.elements.sceneViewport.addEventListener("pointercancel", (event) => this.onPointerCancel(event));

    window.addEventListener("resize", () => {
      if (this.elements.screens.game.classList.contains("screen-active")) {
        this.fitLevelToViewport(false);
      }
    });
  }

  populateStaticUi() {
    this.elements.homeLevelCount.textContent = String(LEVELS.length);
  }

  applySettingsUi() {
    this.elements.timePenaltySelect.value = String(this.save.settings.wrongClickTimePenalty);
    this.elements.scorePenaltySelect.value = String(this.save.settings.wrongClickScorePenalty);
  }

  updateHomeStats() {
    this.save = loadSave();
    this.elements.homeBestScore.textContent = formatScore(this.save.legit.bestScore);
    this.elements.homeBestCheatScore.textContent = formatScore(this.save.cheated.bestScore);
  }

  updateDiagnosticStatus() {
    // Testing mode is session-only. Once unlocked, only future runs are marked cheated.
    this.elements.diagnosticStatus.textContent = this.sessionTestingUnlocked
      ? "Testing mode is unlocked for this browser session. New runs will be marked CHEATED."
      : "Testing mode is locked for this session.";
    this.elements.cheatBadge.classList.toggle("hidden", !this.state.runCheated);
    this.elements.hitboxOverlay.classList.toggle("hidden", !this.state.runCheated);
    this.elements.debugReadout.classList.toggle("hidden", !this.state.runCheated);
  }

  showScreen(name) {
    Object.entries(this.elements.screens).forEach(([key, element]) => {
      const active = key === name;
      element.classList.toggle("screen-active", active);
      element.setAttribute("aria-hidden", String(!active));
    });

    if (name !== "game") {
      this.closeAllOverlays();
      this.stopTimer();
      this.state.runActive = false;
      this.state.paused = false;
    }

    if (name === "home") {
      this.updateHomeStats();
      this.updateDiagnosticStatus();
    }
  }

  startCampaign() {
    this.closeAllOverlays();
    this.showScreen("game");
    this.state.levelIndex = 0;
    this.state.score = 0;
    this.state.highestLevelCleared = 0;
    this.state.runCheated = this.sessionTestingUnlocked;
    this.state.runActive = false;
    this.state.paused = false;
    this.state.pendingResult = null;
    this.state.runRecorded = false;
    this.loadLevelIntro();
    this.updateHud();
    this.updateDiagnosticStatus();
  }

  loadLevelIntro() {
    const level = LEVELS[this.state.levelIndex];
    this.elements.introLevelLabel.textContent = `Level ${this.state.levelIndex + 1} of ${LEVELS.length}`;
    this.elements.introLevelName.textContent = level.name;
    this.elements.introPreviewImage.src = level.targetPreview;
    this.elements.levelIntroOverlay.classList.remove("hidden");
    this.elements.levelIntroOverlay.setAttribute("aria-hidden", "false");
  }

  beginActiveLevel() {
    this.elements.levelIntroOverlay.classList.add("hidden");
    this.elements.levelIntroOverlay.setAttribute("aria-hidden", "true");
    this.loadLevel();
  }

  loadLevel() {
    const level = LEVELS[this.state.levelIndex];
    this.state.timer = level.timeLimit ?? 45;
    this.state.pointerImage = null;
    this.state.lastClickImage = null;
    this.elements.targetPreviewImage.src = level.targetPreview;
    this.elements.targetLevelName.textContent = level.name;
    this.elements.targetHelpText.textContent = this.state.runCheated
      ? "Testing mode is active. Visible hitbox and coordinate readout are enabled."
      : "Tap or click the real person hidden in the scene.";
    this.elements.levelImage.src = level.background;
    this.renderHitbox(level.hitbox);
    this.updateHud();
    this.updateDebugReadout();
  }

  onLevelImageLoaded() {
    this.state.naturalWidth = this.elements.levelImage.naturalWidth || 1;
    this.state.naturalHeight = this.elements.levelImage.naturalHeight || 1;
    this.elements.sceneContent.style.width = `${this.state.naturalWidth}px`;
    this.elements.sceneContent.style.height = `${this.state.naturalHeight}px`;
    this.elements.hitboxOverlay.style.width = `${this.state.naturalWidth}px`;
    this.elements.hitboxOverlay.style.height = `${this.state.naturalHeight}px`;
    this.resetLevelCamera();
    this.state.runActive = true;
    this.startTimer();
  }

  renderHitbox(hitbox) {
    // The testing overlay is drawn from the exact same hitbox data used by real clicks.
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
      node.style.left = `${hitbox.x}px`;
      node.style.top = `${hitbox.y}px`;
      node.style.width = `${hitbox.width}px`;
      node.style.height = `${hitbox.height}px`;
      node.style.borderRadius = "12px";
    }

    this.elements.hitboxOverlay.appendChild(node);
    this.elements.hitboxOverlay.classList.toggle("hidden", !this.state.runCheated);
  }

  updateHud() {
    this.elements.hudLevelText.textContent = `${this.state.levelIndex + 1} / ${LEVELS.length}`;
    this.elements.hudScoreText.textContent = formatScore(this.state.score);
    this.elements.hudTimerText.textContent = String(Math.max(0, Math.ceil(this.state.timer)));
  }

  startTimer() {
    this.stopTimer();
    this.state.timerId = window.setInterval(() => {
      if (!this.state.runActive || this.state.paused) {
        return;
      }

      this.state.timer = Math.max(0, this.state.timer - 1);
      this.updateHud();

      if (this.state.timer <= 0) {
        this.failLevel();
      }
    }, 1000);
  }

  stopTimer() {
    if (this.state.timerId) {
      window.clearInterval(this.state.timerId);
      this.state.timerId = null;
    }
  }

  pauseGame() {
    if (!this.state.runActive || this.state.paused) {
      return;
    }

    this.state.paused = true;
    this.elements.pauseOverlay.classList.remove("hidden");
    this.elements.pauseOverlay.setAttribute("aria-hidden", "false");
  }

  resumeGame() {
    this.state.paused = false;
    this.elements.pauseOverlay.classList.add("hidden");
    this.elements.pauseOverlay.setAttribute("aria-hidden", "true");
  }

  quitRun() {
    this.saveCurrentRun(false);
    this.closeAllOverlays();
    this.stopTimer();
    this.showScreen("home");
  }

  closeAllOverlays() {
    [
      this.elements.levelIntroOverlay,
      this.elements.pauseOverlay,
      this.elements.resultOverlay,
      this.elements.completionOverlay,
    ].forEach((element) => {
      element.classList.add("hidden");
      element.setAttribute("aria-hidden", "true");
    });
  }

  handleMoreGames() {
    if (MORE_GAMES_URL === "#") {
      window.alert("Set MORE_GAMES_URL in scripts/game.js to wire the More Games button to your site.");
      return;
    }

    window.open(MORE_GAMES_URL, "_blank", "noopener");
  }

  revealDiagnosticEntry() {
    this.diagnosticTapCount += 1;
    if (this.diagnosticTapCount >= 4) {
      this.elements.diagnosticUnlock.classList.remove("hidden");
      this.elements.diagnosticUnlock.setAttribute("aria-hidden", "false");
      this.elements.diagnosticCodeInput.focus();
      this.diagnosticTapCount = 0;
    }
  }

  unlockTestingMode() {
    const code = this.elements.diagnosticCodeInput.value.trim();
    if (code === "5278") {
      this.sessionTestingUnlocked = true;
      this.elements.diagnosticMessage.textContent = "Testing mode unlocked for this session.";
      this.elements.diagnosticCodeInput.value = "";
      this.updateDiagnosticStatus();
      return;
    }

    this.elements.diagnosticMessage.textContent = "Incorrect code.";
  }

  persistSettings() {
    this.save = saveSettings({
      wrongClickTimePenalty: Number(this.elements.timePenaltySelect.value),
      wrongClickScorePenalty: Number(this.elements.scorePenaltySelect.value),
    });
  }

  getCurrentLevel() {
    return LEVELS[this.state.levelIndex];
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
    this.updatePointerReadout(event);

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
      const imagePoint = this.clientToImage(event.clientX, event.clientY);
      if (imagePoint) {
        this.handleSceneSelection(imagePoint);
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

  handleSceneSelection(imagePoint) {
    if (!this.state.runActive || this.state.paused) {
      return;
    }

    this.state.lastClickImage = imagePoint;
    this.updateDebugReadout();
    const level = this.getCurrentLevel();

    if (isHit(level.hitbox, imagePoint)) {
      this.completeLevel();
      return;
    }

    this.state.score = Math.max(
      0,
      this.state.score - Number(this.save.settings.wrongClickScorePenalty ?? DEFAULT_SETTINGS.wrongClickScorePenalty),
    );
    this.state.timer = Math.max(
      0,
      this.state.timer - Number(this.save.settings.wrongClickTimePenalty ?? DEFAULT_SETTINGS.wrongClickTimePenalty),
    );
    this.updateHud();
    this.showFeedback("Wrong spot. Keep searching.", true);

    if (this.state.timer <= 0) {
      this.failLevel();
    }
  }

  completeLevel() {
    this.stopTimer();
    this.state.runActive = false;
    this.state.highestLevelCleared = Math.max(this.state.highestLevelCleared, this.state.levelIndex + 1);

    const basePoints = DEFAULT_SETTINGS.correctClickPoints;
    const timeBonus = this.state.timer * DEFAULT_SETTINGS.timeBonusMultiplier;
    this.state.score += basePoints + timeBonus;
    this.updateHud();

    const isFinalLevel = this.state.levelIndex === LEVELS.length - 1;
    if (isFinalLevel) {
      this.finishCampaign();
      return;
    }

    this.showResult({
      eyebrow: this.state.runCheated ? "Level Cleared | CHEATED" : "Level Cleared",
      title: "Target Found",
      body: `You earned ${formatScore(basePoints)} points plus ${formatScore(timeBonus)} bonus points from remaining time.`,
      primaryLabel: "Next Level",
      secondaryLabel: "Replay Level",
      primaryAction: "next",
      secondaryAction: "retry",
    });
  }

  failLevel() {
    this.stopTimer();
    this.state.runActive = false;
    this.saveCurrentRun(false);
    this.showResult({
      eyebrow: this.state.runCheated ? "Level Failed | CHEATED" : "Level Failed",
      title: "Time's Up",
      body: "You ran out of time before clicking the target. Retry this level or leave the run.",
      primaryLabel: "Retry Level",
      secondaryLabel: "Main Menu",
      primaryAction: "retry",
      secondaryAction: "quit",
    });
  }

  showResult({ eyebrow, title, body, primaryLabel, secondaryLabel, primaryAction, secondaryAction }) {
    this.state.pendingResult = { primaryAction, secondaryAction };
    this.elements.resultEyebrow.textContent = eyebrow;
    this.elements.resultTitle.textContent = title;
    this.elements.resultBody.textContent = body;
    this.elements.resultScore.textContent = formatScore(this.state.score);
    this.elements.resultTimeLeft.textContent = String(Math.max(0, Math.ceil(this.state.timer)));
    this.elements.resultPrimaryButton.textContent = primaryLabel;
    this.elements.resultSecondaryButton.textContent = secondaryLabel;
    this.elements.resultOverlay.classList.remove("hidden");
    this.elements.resultOverlay.setAttribute("aria-hidden", "false");
  }

  handleResultPrimary() {
    const action = this.state.pendingResult?.primaryAction;
    this.elements.resultOverlay.classList.add("hidden");
    this.elements.resultOverlay.setAttribute("aria-hidden", "true");

    if (action === "next") {
      this.state.levelIndex += 1;
      this.loadLevelIntro();
      return;
    }

    if (action === "retry") {
      this.loadLevelIntro();
    }
  }

  handleResultSecondary() {
    const action = this.state.pendingResult?.secondaryAction;
    this.elements.resultOverlay.classList.add("hidden");
    this.elements.resultOverlay.setAttribute("aria-hidden", "true");

    if (action === "retry") {
      this.loadLevelIntro();
      return;
    }

    this.quitRun();
  }

  finishCampaign() {
    const updatedSave = this.saveCurrentRun(true);

    this.elements.completionScore.textContent = formatScore(this.state.score);
    this.elements.completionRunType.textContent = this.state.runCheated ? "CHEATED" : "Legit";
    this.elements.completionBody.textContent = this.state.runCheated
      ? "Cheated runs are saved separately for testing and do not replace your legit best score or progression."
      : `Best legit score is now ${formatScore(updatedSave.legit.bestScore)}.`;
    this.elements.completionOverlay.classList.remove("hidden");
    this.elements.completionOverlay.setAttribute("aria-hidden", "false");
    this.updateHomeStats();
  }

  saveCurrentRun(campaignWon) {
    if (this.state.runRecorded) {
      return loadSave();
    }

    const hasProgress = this.state.score > 0 || this.state.highestLevelCleared > 0;
    if (!campaignWon && !hasProgress) {
      return loadSave();
    }

    const updatedSave = recordRun({
      cheated: this.state.runCheated,
      score: this.state.score,
      highestLevelCleared: this.state.highestLevelCleared,
      campaignWon,
    });

    this.state.runRecorded = true;
    return updatedSave;
  }

  fitLevelToViewport(useLevelCamera = true) {
    // Fit scale shows the whole image. Per-level camera values zoom in from that baseline.
    const viewportRect = this.elements.sceneViewport.getBoundingClientRect();
    const fitScale = Math.min(
      viewportRect.width / this.state.naturalWidth,
      viewportRect.height / this.state.naturalHeight,
    );

    this.state.fitScale = fitScale;
    const level = this.getCurrentLevel();
    const hasCamera = useLevelCamera && level?.camera;

    if (hasCamera) {
      this.state.transform.scale = clamp(fitScale * level.camera.zoom, fitScale * MIN_SCALE, fitScale * MAX_SCALE);
      this.state.transform.x = (viewportRect.width / 2) - (level.camera.x * this.state.transform.scale);
      this.state.transform.y = (viewportRect.height / 2) - (level.camera.y * this.state.transform.scale);
    } else {
      this.state.transform.scale = fitScale;
      this.state.transform.x = (viewportRect.width - (this.state.naturalWidth * fitScale)) / 2;
      this.state.transform.y = (viewportRect.height - (this.state.naturalHeight * fitScale)) / 2;
    }

    this.clampTransform();
    this.applyTransform();
  }

  resetLevelCamera() {
    this.fitLevelToViewport(true);
  }

  zoomFromCenter(factor) {
    const rect = this.elements.sceneViewport.getBoundingClientRect();
    this.zoomAtClientPoint(rect.left + (rect.width / 2), rect.top + (rect.height / 2), factor);
  }

  zoomAtClientPoint(clientX, clientY, factor) {
    const imagePoint = this.clientToImage(clientX, clientY);
    const rect = this.elements.sceneViewport.getBoundingClientRect();
    const localX = clientX - rect.left;
    const localY = clientY - rect.top;
    const nextScale = clamp(
      this.state.transform.scale * factor,
      this.state.fitScale * MIN_SCALE,
      this.state.fitScale * MAX_SCALE,
    );

    if (!imagePoint) {
      return;
    }

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
      this.state.transform.x = clamp(this.state.transform.x, rect.width - scaledWidth, 0);
    }

    if (scaledHeight <= rect.height) {
      this.state.transform.y = (rect.height - scaledHeight) / 2;
    } else {
      this.state.transform.y = clamp(this.state.transform.y, rect.height - scaledHeight, 0);
    }
  }

  applyTransform() {
    const { x, y, scale } = this.state.transform;
    this.elements.sceneContent.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
  }

  clientToImage(clientX, clientY) {
    // Convert visible pointer coordinates back into original image pixels so hitboxes stay accurate.
    const rect = this.elements.sceneViewport.getBoundingClientRect();
    const localX = clientX - rect.left;
    const localY = clientY - rect.top;

    const imageX = (localX - this.state.transform.x) / this.state.transform.scale;
    const imageY = (localY - this.state.transform.y) / this.state.transform.scale;

    if (
      Number.isNaN(imageX) ||
      Number.isNaN(imageY) ||
      imageX < 0 ||
      imageY < 0 ||
      imageX > this.state.naturalWidth ||
      imageY > this.state.naturalHeight
    ) {
      return null;
    }

    return {
      x: Math.round(imageX),
      y: Math.round(imageY),
    };
  }

  updatePointerReadout(event) {
    this.state.pointerImage = this.clientToImage(event.clientX, event.clientY);
    this.updateDebugReadout();
  }

  updateDebugReadout() {
    if (!this.state.runCheated) {
      return;
    }

    const pointer = this.state.pointerImage
      ? `Pointer: ${this.state.pointerImage.x}, ${this.state.pointerImage.y}`
      : "Pointer: outside image";
    const click = this.state.lastClickImage
      ? `Last click: ${this.state.lastClickImage.x}, ${this.state.lastClickImage.y}`
      : "Last click: none";

    this.elements.debugReadout.textContent = `${pointer}\n${click}`;
  }

  showFeedback(message, isBad = false) {
    const node = this.elements.sceneFeedback;
    node.textContent = message;
    node.style.color = isBad ? "var(--bad)" : "var(--good)";
    node.classList.add("visible");

    if (this.state.feedbackTimeoutId) {
      window.clearTimeout(this.state.feedbackTimeoutId);
    }

    this.state.feedbackTimeoutId = window.setTimeout(() => {
      node.classList.remove("visible");
    }, 1500);
  }
}
