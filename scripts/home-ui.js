export function layoutHomeButtons(game, config) {
  // ajsd98f7as9d8f7as9df87as9df87a9sdf
  const image = game.elements.startScreenImage;
  const overlay = game.elements.homeButtonOverlay;
  if (!image.naturalWidth || !overlay || !game.elements.homeViewport) {
    return;
  }

  const rect = game.elements.homeViewport.getBoundingClientRect();
  const imageRatio = image.naturalWidth / image.naturalHeight;
  const viewportRatio = rect.width / rect.height;
  let drawWidth;
  let drawHeight;
  let offsetX;
  let offsetY;

  if (viewportRatio > imageRatio) {
    drawHeight = rect.height;
    drawWidth = drawHeight * imageRatio;
    offsetX = (rect.width - drawWidth) / 2;
    offsetY = 0;
  } else {
    drawWidth = rect.width;
    drawHeight = drawWidth / imageRatio;
    offsetX = 0;
    offsetY = (rect.height - drawHeight) / 2;
  }

  overlay.style.left = `${offsetX}px`;
  overlay.style.top = `${offsetY}px`;
  overlay.style.width = `${drawWidth}px`;
  overlay.style.height = `${drawHeight}px`;

  const startPlacement = placeHomeArt(game, game.elements.startButtonArt, config.start, drawWidth, drawHeight, image.naturalWidth, image.naturalHeight, config);
  const settingsPlacement = placeHomeArt(game, game.elements.settingsButtonArt, config.settings, drawWidth, drawHeight, image.naturalWidth, image.naturalHeight, config);
  const morePlacement = placeHomeArt(game, game.elements.moreGamesButtonArt, config.moreGames, drawWidth, drawHeight, image.naturalWidth, image.naturalHeight, config);
  placeHomeButton(game, "start", game.elements.startGameButton, startPlacement);
  placeHomeButton(game, "settings", game.elements.openSettingsButton, settingsPlacement);
  placeHomeButton(game, "more", game.elements.moreGamesButton, morePlacement);
  placeHomeZoneButton(game, "nameLink", game.elements.homeNameButton, config.nameLink, drawWidth, drawHeight, image.naturalWidth, image.naturalHeight, config);
  placeHomeSheen(game, game.elements.startButtonSheen, startPlacement);
  placeHomeSheen(game, game.elements.settingsButtonSheen, settingsPlacement);
  placeHomeSheen(game, game.elements.moreGamesButtonSheen, morePlacement);
  renderHomeDebugOverlay(game, drawWidth, drawHeight, image.naturalWidth, image.naturalHeight, config);
}

export function bindHomeButtonHoverEffects(game) {
  const mappings = [
    [game.elements.startGameButton, game.elements.startButtonArt, game.elements.startButtonSheen],
    [game.elements.openSettingsButton, game.elements.settingsButtonArt, game.elements.settingsButtonSheen],
    [game.elements.moreGamesButton, game.elements.moreGamesButtonArt, game.elements.moreGamesButtonSheen],
  ];

  mappings.forEach(([button, art, sheen]) => {
    const activate = () => {
      art.classList.add("is-hovered");
      sheen.classList.add("is-hovered");
    };
    const deactivate = () => {
      art.classList.remove("is-hovered", "is-pressed");
      sheen.classList.remove("is-hovered", "is-pressed");
    };
    const press = () => {
      art.classList.add("is-pressed");
      sheen.classList.add("is-pressed");
    };
    const release = () => {
      art.classList.remove("is-pressed");
      sheen.classList.remove("is-pressed");
    };
    button.addEventListener("pointerenter", activate);
    button.addEventListener("pointerleave", deactivate);
    button.addEventListener("pointerdown", press);
    button.addEventListener("pointerup", release);
    button.addEventListener("pointercancel", release);
    button.addEventListener("focus", activate);
    button.addEventListener("blur", deactivate);
  });
}

export function playHomeButtonIntro(game, animationMs, staggerMs) {
  clearHomeAnimationTimers(game);
  const artLayers = [
    game.elements.startButtonArt,
    game.elements.settingsButtonArt,
    game.elements.moreGamesButtonArt,
  ];
  const sheenLayers = [
    game.elements.startButtonSheen,
    game.elements.settingsButtonSheen,
    game.elements.moreGamesButtonSheen,
  ];

  if (artLayers.some((layer) => !layer.complete || !layer.naturalWidth)) {
    return;
  }

  if (game.homeIntroPlayed) {
    artLayers.forEach((layer) => {
      layer.classList.remove("is-prepping", "is-entering");
      layer.classList.add("is-settled");
    });
    sheenLayers.forEach((layer) => {
      layer.classList.add("is-settled");
      layer.classList.remove("is-glinting");
    });
    scheduleLoopingSheenSequence(game, sheenLayers, 0);
    return;
  }

  artLayers.forEach((layer) => {
    layer.classList.remove("is-entering", "is-settled");
    layer.classList.add("is-prepping");
  });
  sheenLayers.forEach((layer) => {
    layer.classList.remove("is-settled", "is-glinting");
  });

  artLayers.forEach((layer, index) => {
    const timerId = window.setTimeout(() => {
      layer.classList.remove("is-prepping");
      layer.classList.add("is-entering");
      sheenLayers[index].classList.add("is-settled");
      const settleTimerId = window.setTimeout(() => {
        layer.classList.remove("is-entering");
        layer.classList.add("is-settled");
      }, animationMs);
      game.homeAnimationTimers.push(settleTimerId);
    }, index * staggerMs);
    game.homeAnimationTimers.push(timerId);
  });
  scheduleIntroSheenSequence(game, sheenLayers, animationMs, staggerMs);
  game.homeIntroPlayed = true;
}

export function updateHomeDebug(game, event, config) {
  if (!game.sessionTestingUnlocked) {
    return;
  }
  const imagePoint = clientToHomeImage(game, event.clientX, event.clientY);
  const pointer = imagePoint ? `Pointer: ${imagePoint.x}, ${imagePoint.y}` : "Pointer: outside image";
  const start = game.homeButtonZones.get("start");
  const settings = game.homeButtonZones.get("settings");
  const more = game.homeButtonZones.get("more");
  const nameLink = game.homeButtonZones.get("nameLink");
  const editor = game.homeButtonEditorEnabled
    ? `Editor: on (${game.homeButtonEditorSelection})\nDrag a box or use 1, 2, 3 with arrow keys.`
    : "Editor: off (press H in testing mode)";
  game.elements.homeDebugReadout.textContent = `${pointer}\n${editor}\nstart: ${formatZone(start)}\nsettings: ${formatZone(settings)}\nmore: ${formatZone(more)}\nname: ${formatZone(nameLink)}`;
}

function clearHomeAnimationTimers(game) {
  game.homeAnimationTimers.forEach((timerId) => window.clearTimeout(timerId));
  game.homeAnimationTimers = [];
}

function scheduleIntroSheenSequence(game, sheenLayers, animationMs, staggerMs) {
  const settleDelayMs = 3000;
  const introStartMs = ((sheenLayers.length - 1) * staggerMs) + animationMs + settleDelayMs;
  let cursor = introStartMs;

  for (let round = 0; round < 2; round += 1) {
    sheenLayers.forEach((layer) => {
      const startId = window.setTimeout(() => {
        triggerSheenGlint(game, layer);
      }, cursor);
      game.homeAnimationTimers.push(startId);
      cursor += 1100;
    });
  }

  scheduleLoopingSheenSequence(game, sheenLayers, cursor);
}

function scheduleLoopingSheenSequence(game, sheenLayers, startDelayMs) {
  const perButtonGapMs = 1100;
  const cycleCooldownMs = 7500;
  const queueNext = (index, delay) => {
    const timerId = window.setTimeout(() => {
      triggerSheenGlint(game, sheenLayers[index]);
      const nextIndex = (index + 1) % sheenLayers.length;
      const nextDelay = nextIndex === 0 ? cycleCooldownMs : perButtonGapMs;
      queueNext(nextIndex, nextDelay);
    }, delay);
    game.homeAnimationTimers.push(timerId);
  };

  queueNext(0, startDelayMs);
}

function triggerSheenGlint(game, layer) {
  layer.classList.remove("is-glinting");
  void layer.offsetWidth;
  layer.classList.add("is-glinting");
  const stopId = window.setTimeout(() => {
    layer.classList.remove("is-glinting");
  }, 1100);
  game.homeAnimationTimers.push(stopId);
}

function getAdjustedHomeZone(zone, config) {
  return {
    x1: zone.x1 + config.xOffset,
    x2: zone.x2 + config.xOffset,
    y1: zone.y1 + config.yOffset,
    y2: zone.y2 + config.yOffset,
    color: zone.color,
  };
}

function placeHomeButton(game, key, element, placement) {
  if (!placement) {
    return;
  }
  const expand = 16;
  const clickLeft = placement.rendered.left - expand;
  const clickTop = placement.rendered.top - expand;
  const clickWidth = placement.rendered.width + (expand * 2);
  const clickHeight = placement.rendered.height + (expand * 2);
  const overlayWidth = game.elements.homeButtonOverlay.clientWidth || 1;
  const overlayHeight = game.elements.homeButtonOverlay.clientHeight || 1;
  const naturalWidth = game.elements.startScreenImage.naturalWidth || 1;
  const naturalHeight = game.elements.startScreenImage.naturalHeight || 1;
  element.style.position = "absolute";
  element.style.display = "block";
  element.style.cursor = "pointer";
  element.style.left = `${clickLeft}px`;
  element.style.top = `${clickTop}px`;
  element.style.width = `${clickWidth}px`;
  element.style.height = `${clickHeight}px`;
  game.homeButtonZones.set(key, {
    x1: Math.round((clickLeft / overlayWidth) * naturalWidth),
    y1: Math.round((clickTop / overlayHeight) * naturalHeight),
    x2: Math.round(((clickLeft + clickWidth) / overlayWidth) * naturalWidth),
    y2: Math.round(((clickTop + clickHeight) / overlayHeight) * naturalHeight),
  });
}

function placeHomeZoneButton(game, key, element, zone, drawWidth, drawHeight, naturalWidth, naturalHeight, config) {
  if (!element || !zone) {
    return;
  }

  const adjusted = getAdjustedHomeZone(zone, config);
  const left = Math.min(adjusted.x1, adjusted.x2) * (drawWidth / naturalWidth);
  const top = Math.min(adjusted.y1, adjusted.y2) * (drawHeight / naturalHeight);
  const width = Math.abs(adjusted.x2 - adjusted.x1) * (drawWidth / naturalWidth);
  const height = Math.abs(adjusted.y2 - adjusted.y1) * (drawHeight / naturalHeight);

  element.style.position = "absolute";
  element.style.display = "block";
  element.style.cursor = "pointer";
  element.style.left = `${left}px`;
  element.style.top = `${top}px`;
  element.style.width = `${width}px`;
  element.style.height = `${height}px`;

  game.homeButtonZones.set(key, {
    x1: Math.round((left / drawWidth) * naturalWidth),
    y1: Math.round((top / drawHeight) * naturalHeight),
    x2: Math.round(((left + width) / drawWidth) * naturalWidth),
    y2: Math.round(((top + height) / drawHeight) * naturalHeight),
  });
}

function getHomeArtBounds(game, imageElement, alphaThreshold) {
  const existing = game.homeArtBounds.get(imageElement.id);
  if (existing) {
    return existing;
  }
  if (!imageElement.complete || !imageElement.naturalWidth || !imageElement.naturalHeight) {
    return null;
  }

  const canvas = document.createElement("canvas");
  canvas.width = imageElement.naturalWidth;
  canvas.height = imageElement.naturalHeight;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  context.drawImage(imageElement, 0, 0);
  const { data, width, height } = context.getImageData(0, 0, canvas.width, canvas.height);

  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;

  for (let index = 3; index < data.length; index += 4) {
    if (data[index] < alphaThreshold) {
      continue;
    }
    const pixelIndex = (index - 3) / 4;
    const x = pixelIndex % width;
    const y = Math.floor(pixelIndex / width);
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }

  const bounds = maxX >= 0
    ? { left: minX, top: minY, width: Math.max(1, (maxX - minX) + 1), height: Math.max(1, (maxY - minY) + 1) }
    : { left: 0, top: 0, width: imageElement.naturalWidth, height: imageElement.naturalHeight };

  game.homeArtBounds.set(imageElement.id, bounds);
  return bounds;
}

function placeHomeArt(game, imageElement, zone, drawWidth, drawHeight, naturalWidth, naturalHeight, config) {
  const bounds = getHomeArtBounds(game, imageElement, config.alphaThreshold);
  if (!bounds) {
    return;
  }

  const adjusted = getAdjustedHomeZone(zone, config);
  const left = Math.min(adjusted.x1, adjusted.x2);
  const right = Math.max(adjusted.x1, adjusted.x2);
  const top = Math.min(adjusted.y1, adjusted.y2);
  const bottom = Math.max(adjusted.y1, adjusted.y2);
  const targetLeft = left * (drawWidth / naturalWidth);
  const targetTop = top * (drawHeight / naturalHeight);
  const targetWidth = (right - left) * (drawWidth / naturalWidth);
  const targetHeight = (bottom - top) * (drawHeight / naturalHeight);
  const scale = Math.min(targetWidth / bounds.width, targetHeight / bounds.height);
  const targetCenterX = targetLeft + (targetWidth / 2);
  const targetCenterY = targetTop + (targetHeight / 2);
  const artCenterX = (bounds.left + (bounds.width / 2)) * scale;
  const artCenterY = (bounds.top + (bounds.height / 2)) * scale;
  const finalLeft = targetCenterX - artCenterX;
  const finalTop = targetCenterY - artCenterY;
  const startOffset = Math.max(drawHeight - targetTop + targetHeight + 48, 120);
  const visibleLeft = finalLeft + (bounds.left * scale);
  const visibleTop = finalTop + (bounds.top * scale);
  const visibleWidth = bounds.width * scale;
  const visibleHeight = bounds.height * scale;
  const sourceScaleX = naturalWidth / drawWidth;
  const sourceScaleY = naturalHeight / drawHeight;

  imageElement.style.left = `${finalLeft}px`;
  imageElement.style.top = `${finalTop}px`;
  imageElement.style.width = `${imageElement.naturalWidth * scale}px`;
  imageElement.style.height = `${imageElement.naturalHeight * scale}px`;
  imageElement.style.setProperty("--home-enter-offset", `${startOffset}px`);
  return {
    rendered: {
      left: visibleLeft,
      top: visibleTop,
      width: visibleWidth,
      height: visibleHeight,
    },
    source: {
      x1: visibleLeft * sourceScaleX,
      y1: visibleTop * sourceScaleY,
      x2: (visibleLeft + visibleWidth) * sourceScaleX,
      y2: (visibleTop + visibleHeight) * sourceScaleY,
    },
  };
}

function placeHomeSheen(game, sheenElement, placement) {
  if (!sheenElement || !placement) {
    return;
  }
  sheenElement.style.left = `${placement.rendered.left}px`;
  sheenElement.style.top = `${placement.rendered.top}px`;
  sheenElement.style.width = `${placement.rendered.width}px`;
  sheenElement.style.height = `${placement.rendered.height}px`;
  sheenElement.style.setProperty("--home-enter-offset", `${Math.max(placement.rendered.top + placement.rendered.height + 120, 120)}px`);
}

function renderHomeDebugOverlay(game, drawWidth, drawHeight, naturalWidth, naturalHeight, config) {
  const debug = game.elements.homeDebugOverlay;
  debug.innerHTML = "";
  const active = game.sessionTestingUnlocked;
  debug.classList.toggle("hidden", !active);
  debug.classList.toggle("editor-active", active && game.homeButtonEditorEnabled);
  game.elements.homeDebugReadout.classList.toggle("hidden", !active);
  if (!active) {
    return;
  }

  [
    ["start", game.elements.startGameButton],
    ["settings", game.elements.openSettingsButton],
    ["more", game.elements.moreGamesButton],
    ["nameLink", game.elements.homeNameButton],
  ].forEach(([label, buttonElement]) => {
    const actual = game.homeButtonZones.get(label);
    const node = document.createElement("div");
    node.className = `home-debug-box color-${label === "start" ? "green" : label === "settings" ? "blue" : label === "more" ? "orange" : "gold"}`;
    node.dataset.editorKey = label;
    node.classList.toggle("is-selected", game.homeButtonEditorEnabled && game.homeButtonEditorSelection === label);
    const tag = document.createElement("span");
    tag.className = "home-debug-label";
    const overlayRect = game.elements.homeButtonOverlay.getBoundingClientRect();
    const buttonRect = buttonElement.getBoundingClientRect();
    node.style.left = `${buttonRect.left - overlayRect.left}px`;
    node.style.top = `${buttonRect.top - overlayRect.top}px`;
    node.style.width = `${buttonRect.width}px`;
    node.style.height = `${buttonRect.height}px`;
    tag.textContent = actual
      ? `${label}: ${Math.min(actual.x1, actual.x2)},${Math.min(actual.y1, actual.y2)} -> ${Math.max(actual.x1, actual.x2)},${Math.max(actual.y1, actual.y2)}`
      : `${label}: unavailable`;
    node.appendChild(tag);
    debug.appendChild(node);
  });
}

function clientToHomeImage(game, clientX, clientY) {
  const rect = game.elements.homeButtonOverlay.getBoundingClientRect();
  const image = game.elements.startScreenImage;
  if (!image.naturalWidth || !rect.width || !rect.height) {
    return null;
  }
  const localX = clientX - rect.left;
  const localY = clientY - rect.top;
  if (localX < 0 || localY < 0 || localX > rect.width || localY > rect.height) {
    return null;
  }
  return {
    x: Math.round((localX / rect.width) * image.naturalWidth),
    y: Math.round((localY / rect.height) * image.naturalHeight),
  };
}

function formatZone(zone) {
  if (!zone) {
    return "unavailable";
  }
  return `${Math.min(zone.x1, zone.x2)},${Math.min(zone.y1, zone.y2)} -> ${Math.max(zone.x1, zone.x2)},${Math.max(zone.y1, zone.y2)}`;
}
