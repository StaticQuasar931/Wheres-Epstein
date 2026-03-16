export function showMenuToast(game, message, isBad = false) {
  const node = game.elements.menuToast;
  node.textContent = message;
  node.classList.remove("hidden", "bad");
  if (isBad) {
    node.classList.add("bad");
  }
  window.clearTimeout(game.menuToastTimerId);
  game.menuToastTimerId = window.setTimeout(() => {
    node.classList.add("hidden");
  }, 2200);
}

export function renderPreviewList(container, errorElement, targets) {
  container.innerHTML = "";
  errorElement.classList.add("hidden");
  errorElement.textContent = "";
  if (!targets.length) {
    errorElement.textContent = "Tried to load: [empty preview path]";
    errorElement.classList.remove("hidden");
    return;
  }

  const missing = [];
  targets.forEach((target, index) => {
    const item = document.createElement("div");
    item.className = "preview-item";
    item.dataset.targetId = target.id;
    const image = document.createElement("img");
    image.alt = `Target preview ${index + 1}`;
    image.className = "preview-image asset-loading";
    image.addEventListener("load", () => {
      image.classList.remove("asset-loading");
    });
    image.addEventListener("error", () => {
      image.removeAttribute("src");
      image.classList.remove("asset-loading");
      missing.push(target.preview || "[empty preview path]");
      errorElement.textContent = `Tried to load: ${missing.join(" | ")}`;
      errorElement.classList.remove("hidden");
    });
    if (target.preview) {
      image.src = target.preview;
    } else {
      missing.push("[empty preview path]");
    }

    const badge = document.createElement("span");
    badge.className = "preview-badge";
    badge.textContent = targets.length > 1 ? `Target ${index + 1}` : "Target";
    item.append(image, badge);
    container.appendChild(item);
  });

  if (missing.length) {
    errorElement.textContent = `Tried to load: ${missing.join(" | ")}`;
    errorElement.classList.remove("hidden");
  }
}

export function syncFoundPreviewState(game) {
  const targetCardItems = Array.from(game.elements.targetPreviewList.querySelectorAll(".preview-item"));
  targetCardItems.forEach((item, index) => {
    const found = game.state.foundTargetIds.has(item.dataset.targetId);
    item.classList.toggle("is-found", found);
    const badge = item.querySelector(".preview-badge");
    if (badge) {
      badge.textContent = found ? "Found" : (targetCardItems.length > 1 ? `Target ${index + 1}` : "Target");
    }
  });
}

export function renderHitboxes(game, targets, foundTargetIds = new Set()) {
  game.elements.hitboxOverlay.innerHTML = "";
  targets.forEach((target) => {
    const node = document.createElement("div");
    node.className = "hitbox-shape";
    if (foundTargetIds.has(target.id)) {
      node.classList.add("hitbox-shape-found");
    }
    if (target.hitbox.type === "circle") {
      node.style.left = `${target.hitbox.x - target.hitbox.radius}px`;
      node.style.top = `${target.hitbox.y - target.hitbox.radius}px`;
      node.style.width = `${target.hitbox.radius * 2}px`;
      node.style.height = `${target.hitbox.radius * 2}px`;
      node.style.borderRadius = "50%";
    } else {
      const left = Math.min(target.hitbox.x1, target.hitbox.x2);
      const right = Math.max(target.hitbox.x1, target.hitbox.x2);
      const top = Math.min(target.hitbox.y1, target.hitbox.y2);
      const bottom = Math.max(target.hitbox.y1, target.hitbox.y2);
      node.style.left = `${left}px`;
      node.style.top = `${top}px`;
      node.style.width = `${right - left}px`;
      node.style.height = `${bottom - top}px`;
      node.style.borderRadius = "12px";
    }
    game.elements.hitboxOverlay.appendChild(node);
  });
  game.elements.hitboxOverlay.classList.toggle("hidden", !game.sessionTestingUnlocked);
  game.elements.debugReadout.classList.toggle("hidden", !game.sessionTestingUnlocked);
}
