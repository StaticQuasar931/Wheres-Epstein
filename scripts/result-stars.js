/**
 * result-stars.js
 * Frontend animation only. No game logic.
 */

const FILL_DELAY_MS = 260;
const FILL_ANIM_MS = 240;
const MODAL_RISE_MS = 240;
let resultStarsInitialized = false;

function initResultStars() {
  if (resultStarsInitialized) {
    return;
  }
  const overlay = document.getElementById("resultOverlay");
  const starsEl = document.getElementById("resultStarsText");
  if (!overlay || !starsEl) {
    return;
  }
  resultStarsInitialized = true;

  let pendingTimer = null;
  const observer = new MutationObserver(() => {
    if (!overlay.classList.contains("hidden")) {
      clearTimeout(pendingTimer);
      pendingTimer = setTimeout(() => animateStars(starsEl), MODAL_RISE_MS);
    }
  });

  observer.observe(overlay, { attributeFilter: ["class"] });
}

function animateStars(starsEl) {
  const raw = starsEl.textContent || "";
  const earned = (raw.match(/★/g) || []).length;
  starsEl.style.animation = "none";
  starsEl.classList.add("result-stars-row");
  starsEl.innerHTML = [0, 1, 2].map((i) =>
    `<span class="result-star" data-index="${i}" aria-hidden="true">☆</span>`
  ).join("");

  const starEls = starsEl.querySelectorAll(".result-star");
  for (let i = 0; i < earned; i += 1) {
    const delay = i * FILL_DELAY_MS;
    setTimeout(() => {
      const el = starEls[i];
      if (!el) {
        return;
      }
      el.textContent = "★";
      el.classList.add("result-star--popping");
      setTimeout(() => {
        el.classList.remove("result-star--popping");
        el.classList.add("result-star--filled");
      }, FILL_ANIM_MS);
    }, delay);
  }
}

if (document.readyState !== "loading") {
  initResultStars();
}
document.addEventListener("DOMContentLoaded", initResultStars);
document.addEventListener("ui:fragments-ready", initResultStars);
window.addEventListener("load", initResultStars);
