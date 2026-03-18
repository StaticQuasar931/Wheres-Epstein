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

  const viewScale = game.getHomeEditorViewScale?.() ?? 1;
  if (viewScale !== 1) {
    drawWidth *= viewScale;
    drawHeight *= viewScale;
    offsetX = (rect.width - drawWidth) / 2;
    offsetY = (rect.height - drawHeight) / 2;
  }

  image.style.left = `${offsetX}px`;
  image.style.top = `${offsetY}px`;
  image.style.width = `${drawWidth}px`;
  image.style.height = `${drawHeight}px`;

  if (game.elements.homeBackgroundFill) {
    const src = image.currentSrc || image.src;
    const applyFill = (element, left, top, width, height, position) => {
      if (!element) {
        return;
      }
      element.style.left = `${left}px`;
      element.style.top = `${top}px`;
      element.style.width = `${Math.max(0, width)}px`;
      element.style.height = `${Math.max(0, height)}px`;
      element.style.backgroundImage = `url("${src}")`;
      element.style.backgroundSize = `${drawWidth}px ${drawHeight}px`;
      element.style.backgroundPosition = position;
      element.style.opacity = width > 0 || height > 0 ? "0.96" : "0";
    };

    applyFill(game.elements.homeFillLeft, 0, offsetY, offsetX, drawHeight, "left center");
    applyFill(game.elements.homeFillRight, offsetX + drawWidth, offsetY, Math.max(0, rect.width - (offsetX + drawWidth)), drawHeight, "right center");
    applyFill(game.elements.homeFillTop, offsetX, 0, drawWidth, offsetY, "center top");
    applyFill(game.elements.homeFillBottom, offsetX, offsetY + drawHeight, drawWidth, Math.max(0, rect.height - (offsetY + drawHeight)), "center bottom");
  }

  overlay.style.left = `${offsetX}px`;
  overlay.style.top = `${offsetY}px`;
  overlay.style.width = `${drawWidth}px`;
  overlay.style.height = `${drawHeight}px`;
  game.homeRenderedRects.clear();
  if (game.elements.homeLayerOverlay) {
    game.elements.homeLayerOverlay.style.left = `${offsetX}px`;
    game.elements.homeLayerOverlay.style.top = `${offsetY}px`;
    game.elements.homeLayerOverlay.style.width = `${drawWidth}px`;
    game.elements.homeLayerOverlay.style.height = `${drawHeight}px`;
  }

  Object.entries(config.layers ?? {}).forEach(([key, layer]) => {
    const element = getHomeElement(game, key);
    placeHomeLayer(game, key, element, layer, drawWidth, drawHeight, image.naturalWidth, image.naturalHeight, config);
  });

  const startPlacement = placeHomeArt(game, game.elements.startButtonArt, config.start, drawWidth, drawHeight, image.naturalWidth, image.naturalHeight, config);
  const settingsPlacement = placeHomeArt(game, game.elements.settingsButtonArt, config.settings, drawWidth, drawHeight, image.naturalWidth, image.naturalHeight, config);
  const morePlacement = placeHomeArt(game, game.elements.moreGamesButtonArt, config.moreGames, drawWidth, drawHeight, image.naturalWidth, image.naturalHeight, config);
  placeHomeButton(game, "start", game.elements.startGameButton, config.start, drawWidth, drawHeight, image.naturalWidth, image.naturalHeight, config);
  placeHomeButton(game, "settings", game.elements.openSettingsButton, config.settings, drawWidth, drawHeight, image.naturalWidth, image.naturalHeight, config);
  placeHomeButton(game, "more", game.elements.moreGamesButton, config.moreGames, drawWidth, drawHeight, image.naturalWidth, image.naturalHeight, config);
  placeHomeZoneButton(game, "nameLink", game.elements.homeNameButton, config.nameLink, drawWidth, drawHeight, image.naturalWidth, image.naturalHeight, config);
  placeHomeSheen(game, game.elements.startButtonSheen, startPlacement);
  placeHomeSheen(game, game.elements.settingsButtonSheen, settingsPlacement);
  placeHomeSheen(game, game.elements.moreGamesButtonSheen, morePlacement);
  renderHomeDebugOverlay(game, drawWidth, drawHeight, image.naturalWidth, image.naturalHeight, config);
  game.refreshHomeEditorUi?.();
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
    button.addEventListener("pointermove", activate);
    button.addEventListener("pointerleave", deactivate);
    button.addEventListener("pointerdown", () => {
      activate();
      press();
    });
    button.addEventListener("pointerup", release);
    button.addEventListener("pointercancel", () => {
      release();
      deactivate();
    });
    button.addEventListener("focus", activate);
    button.addEventListener("blur", deactivate);
  });
}

export function playHomeButtonIntro(game, animationMs, staggerMs) {
  clearHomeAnimationTimers(game);
  const reducedMotion = game.save?.settings?.motion === "reduced";
  const introAnimationMs = reducedMotion ? Math.round(animationMs * 0.72) : animationMs;
  const introStaggerMs = reducedMotion ? Math.round(staggerMs * 0.78) : staggerMs;
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
    game.homeIntroInProgress = false;
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
      }, introAnimationMs);
      game.homeAnimationTimers.push(settleTimerId);
    }, index * introStaggerMs);
    game.homeAnimationTimers.push(timerId);
  });
  scheduleIntroSheenSequence(game, sheenLayers, introAnimationMs, introStaggerMs);
  game.homeIntroInProgress = true;
  const finishId = window.setTimeout(() => {
    game.homeIntroInProgress = false;
  }, ((artLayers.length - 1) * introStaggerMs) + introAnimationMs + 40);
  game.homeAnimationTimers.push(finishId);
  game.homeIntroPlayed = true;
}

export function settleHomeButtonIntro(game) {
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

  artLayers.forEach((layer) => {
    layer.classList.remove("is-prepping", "is-entering", "is-pressed");
    layer.classList.add("is-settled");
  });
  sheenLayers.forEach((layer) => {
    layer.classList.remove("is-pressed", "is-glinting");
    layer.classList.add("is-settled");
  });
  game.homeIntroPlayed = true;
  game.homeIntroInProgress = false;
  scheduleLoopingSheenSequence(game, sheenLayers, 0);
}

export function updateHomeDebug(game, event, config) {
  if (!game.isStartHitboxCheatEnabled()) {
    return;
  }
  const imagePoint = clientToHomeImage(game, event.clientX, event.clientY);
  const pointer = imagePoint ? `Pointer: ${imagePoint.x}, ${imagePoint.y}` : "Pointer: outside image";
  const selected = game.homeButtonZones.get(game.homeButtonEditorSelection);
  const selectedSource = game.getHomeEditorZone?.(game.homeButtonEditorSelection);
  const copyLine = selectedSource
    ? `${game.getHomeEditorExportKey?.(game.homeButtonEditorSelection) ?? game.homeButtonEditorSelection}: { x1: ${Math.round(selectedSource.x1)}, y1: ${Math.round(selectedSource.y1)}, x2: ${Math.round(selectedSource.x2)}, y2: ${Math.round(selectedSource.y2)} }`
    : "selected source: unavailable";
  const editor = game.homeButtonEditorEnabled
    ? `Editor: on (${game.homeButtonEditorSelection})\nDrag a box to move, drag the corner to resize.\nUse 1 2 3 for the main buttons, [ ] to cycle, arrows to move, Shift plus arrows to resize.\nUse Q and E to rotate, Shift plus Q or E for fine rotation.\nUse B for boxes, K for lock, Z for zoom, Esc to close.`
    : "Editor: off (press H in testing mode)";
  game.elements.homeDebugReadout.textContent = `${pointer}\n${editor}\nselected: ${formatZone(selected)}\n${copyLine}`;
  game.refreshHomeEditorUi?.();
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

function placeHomeButton(game, key, element, zone, drawWidth, drawHeight, naturalWidth, naturalHeight, config) {
  if (!zone) {
    return;
  }
  const adjusted = getAdjustedHomeZone(zone, config);
  const clickLeft = Math.min(adjusted.x1, adjusted.x2) * (drawWidth / naturalWidth);
  const clickTop = Math.min(adjusted.y1, adjusted.y2) * (drawHeight / naturalHeight);
  const clickWidth = Math.abs(adjusted.x2 - adjusted.x1) * (drawWidth / naturalWidth);
  const clickHeight = Math.abs(adjusted.y2 - adjusted.y1) * (drawHeight / naturalHeight);
  element.style.position = "absolute";
  element.style.display = "block";
  element.style.cursor = "pointer";
  element.style.left = `${clickLeft}px`;
  element.style.top = `${clickTop}px`;
  element.style.width = `${clickWidth}px`;
  element.style.height = `${clickHeight}px`;
  game.homeRenderedRects.set(key, {
    left: clickLeft,
    top: clickTop,
    width: clickWidth,
    height: clickHeight,
  });
  game.homeButtonZones.set(key, {
    x1: Math.round(Math.min(adjusted.x1, adjusted.x2)),
    y1: Math.round(Math.min(adjusted.y1, adjusted.y2)),
    x2: Math.round(Math.max(adjusted.x1, adjusted.x2)),
    y2: Math.round(Math.max(adjusted.y1, adjusted.y2)),
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
  game.homeRenderedRects.set(key, {
    left,
    top,
    width,
    height,
  });

  game.homeButtonZones.set(key, {
    x1: Math.round((left / drawWidth) * naturalWidth),
    y1: Math.round((top / drawHeight) * naturalHeight),
    x2: Math.round(((left + width) / drawWidth) * naturalWidth),
    y2: Math.round(((top + height) / drawHeight) * naturalHeight),
  });
}

function placeHomeArt(game, imageElement, zone, drawWidth, drawHeight, naturalWidth, naturalHeight, config) {
  if (!imageElement || !zone) {
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
  const startOffset = Math.max(drawHeight - targetTop + targetHeight + 48, 120);
  imageElement.style.left = `${targetLeft}px`;
  imageElement.style.top = `${targetTop}px`;
  imageElement.style.width = `${targetWidth}px`;
  imageElement.style.height = `${targetHeight}px`;
  imageElement.style.setProperty("--home-enter-offset", `${startOffset}px`);
  return {
    rendered: {
      left: targetLeft,
      top: targetTop,
      width: targetWidth,
      height: targetHeight,
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
  const active = game.isStartHitboxCheatEnabled();
  debug.classList.toggle("hidden", !active || !game.homeEditorBoxesVisible);
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
    ...Object.keys(config.layers ?? {}).map((key) => [key, getHomeElement(game, key)]),
  ].forEach(([label, buttonElement]) => {
    if (!buttonElement) {
      return;
    }
    const actual = game.homeButtonZones.get(label);
    const node = document.createElement("div");
    node.className = `home-debug-box color-${getDebugColor(label, config)}`;
    node.dataset.editorKey = label;
    node.classList.toggle("is-selected", game.homeButtonEditorEnabled && game.homeButtonEditorSelection === label);
    node.classList.toggle("is-locked", game.homeEditorLockedKeys?.has(label));
    const tag = document.createElement("span");
    tag.className = "home-debug-label";
    const rendered = game.homeRenderedRects.get(label);
    if (rendered) {
      node.style.left = `${rendered.left}px`;
      node.style.top = `${rendered.top}px`;
      node.style.width = `${rendered.width}px`;
      node.style.height = `${rendered.height}px`;
    } else {
      const overlayRect = game.elements.homeButtonOverlay.getBoundingClientRect();
      const buttonRect = buttonElement.getBoundingClientRect();
      node.style.left = `${buttonRect.left - overlayRect.left}px`;
      node.style.top = `${buttonRect.top - overlayRect.top}px`;
      node.style.width = `${buttonRect.width}px`;
      node.style.height = `${buttonRect.height}px`;
    }
    const sourceZone = game.getHomeEditorZone?.(label);
    const rotationText = typeof sourceZone?.rotation === "number" ? ` rot ${sourceZone.rotation.toFixed(1)}deg` : "";
    tag.textContent = actual
      ? `${label}${game.homeEditorLockedKeys?.has(label) ? " [locked]" : ""}: ${Math.min(actual.x1, actual.x2)},${Math.min(actual.y1, actual.y2)} -> ${Math.max(actual.x1, actual.x2)},${Math.max(actual.y1, actual.y2)}${rotationText}`
      : `${label}: unavailable`;
    const handle = document.createElement("span");
    handle.className = "home-debug-handle";
    node.appendChild(tag);
    node.appendChild(handle);
    debug.appendChild(node);
  });
}

function placeHomeLayer(game, key, element, zone, drawWidth, drawHeight, naturalWidth, naturalHeight, config) {
  if (!element || !zone) {
    return;
  }
  const clickableKeys = new Set(["titleBanner", "cloud1", "cloud2", "cloud3", "airball", "wheel", "magnifierDecor", "magnifierFaces"]);
  element.classList.toggle("home-decor-clickable", clickableKeys.has(key));
  const adjusted = getAdjustedHomeZone(zone, config);
  const left = Math.min(adjusted.x1, adjusted.x2);
  const right = Math.max(adjusted.x1, adjusted.x2);
  const top = Math.min(adjusted.y1, adjusted.y2);
  const bottom = Math.max(adjusted.y1, adjusted.y2);
  const targetLeft = left * (drawWidth / naturalWidth);
  const targetTop = top * (drawHeight / naturalHeight);
  const targetWidth = (right - left) * (drawWidth / naturalWidth);
  const targetHeight = (bottom - top) * (drawHeight / naturalHeight);
  element.style.left = `${targetLeft}px`;
  element.style.top = `${targetTop}px`;
  element.style.width = `${targetWidth}px`;
  element.style.height = `${targetHeight}px`;
  element.style.setProperty("--home-layer-rotate", `${zone.rotation ?? 0}deg`);
  game.homeRenderedRects.set(key, {
    left: targetLeft,
    top: targetTop,
    width: targetWidth,
    height: targetHeight,
  });
  game.homeButtonZones.set(key, {
    x1: Math.round(Math.min(adjusted.x1, adjusted.x2)),
    y1: Math.round(Math.min(adjusted.y1, adjusted.y2)),
    x2: Math.round(Math.max(adjusted.x1, adjusted.x2)),
    y2: Math.round(Math.max(adjusted.y1, adjusted.y2)),
  });
}

function getHomeElement(game, key) {
  const map = {
    titleBanner: game.elements.titleBannerLayer,
    cloud1: game.elements.cloud1Layer,
    cloud2: game.elements.cloud2Layer,
    cloud3: game.elements.cloud3Layer,
    blimp: game.elements.blimpLayer,
    airball: game.elements.airballLayer,
    wheelStand: game.elements.wheelStandLayer,
    wheel: game.elements.wheelLayer,
    magnifierDecor: game.elements.magnifierDecorLayer,
    magnifierFaces: game.elements.magnifierFacesLayer,
  };
  return map[key] ?? null;
}

function getDebugColor(label, config) {
  if (label === "start") return "green";
  if (label === "settings") return "blue";
  if (label === "more") return "orange";
  if (label === "nameLink") return "gold";
  return config.layers?.[label]?.color ?? "white";
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
