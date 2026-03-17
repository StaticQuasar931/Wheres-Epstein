/**
 * result-stars.js — Frontend animation only. No game logic.
 *
 * Watches for resultOverlay becoming visible, reads the star count
 * set by game.js, then animates individual stars one by one:
 *   • Shows 3 empty stars immediately
 *   • Fills each earned star sequentially with a pop animation
 *   • Zero earned stars = stays empty (no fill)
 */

const FILL_DELAY_MS    = 260;  // time between each star filling
const FILL_ANIM_MS     = 240;  // duration of the pop animation
const MODAL_RISE_MS    = 240;  // let modal-rise animation start first

function initResultStars() {
  const overlay  = document.getElementById('resultOverlay');
  const starsEl  = document.getElementById('resultStarsText');
  if (!overlay || !starsEl) return;

  let pendingTimer = null;

  // Watch resultOverlay for class changes (hidden removal = overlay shown)
  const observer = new MutationObserver(() => {
    if (!overlay.classList.contains('hidden')) {
      clearTimeout(pendingTimer);
      pendingTimer = setTimeout(() => animateStars(starsEl), MODAL_RISE_MS);
    }
  });

  observer.observe(overlay, { attributeFilter: ['class'] });
}

function animateStars(starsEl) {
  // Read earned star count from text content set by game.js
  // starText(n) = '★'.repeat(n) + '☆'.repeat(3-n)  →  count ★ (U+2605)
  const raw    = starsEl.textContent || '';
  const earned = (raw.match(/\u2605/g) || []).length;

  // Stop the container's own burst animation — we handle per-star
  starsEl.style.animation = 'none';
  starsEl.classList.add('result-stars-row');

  // Build 3 empty star spans
  starsEl.innerHTML = [0, 1, 2].map(i =>
    `<span class="result-star" data-index="${i}" aria-hidden="true">\u2606</span>`
  ).join('');

  const starEls = starsEl.querySelectorAll('.result-star');

  // Sequentially fill each earned star
  for (let i = 0; i < earned; i++) {
    const delay = i * FILL_DELAY_MS;

    setTimeout(() => {
      const el = starEls[i];
      if (!el) return;

      // Switch to filled character and trigger pop animation
      el.textContent = '\u2605';  // ★
      el.classList.add('result-star--popping');

      setTimeout(() => {
        el.classList.remove('result-star--popping');
        el.classList.add('result-star--filled');
      }, FILL_ANIM_MS);

    }, delay);
  }
}

document.addEventListener('DOMContentLoaded', initResultStars);
