// Where's Epstein?
// Where's Epstein?

const STORAGE_KEY = "wheres-epstein-save-v2";

const DEFAULT_SAVE = {
  settings: {
    theme: "dark",
    density: "comfortable",
    motion: "full",
  },
  legit: {
    bestScore: 0,
    highestLevelCleared: 0,
    totalWins: 0,
  },
  cheated: {
    bestScore: 0,
    totalWins: 0,
  },
};

function mergeSave(parsed) {
  return {
    settings: {
      ...DEFAULT_SAVE.settings,
      ...(parsed?.settings ?? {}),
    },
    legit: {
      ...DEFAULT_SAVE.legit,
      ...(parsed?.legit ?? {}),
    },
    cheated: {
      ...DEFAULT_SAVE.cheated,
      ...(parsed?.cheated ?? {}),
    },
  };
}

export function loadSave() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return structuredClone(DEFAULT_SAVE);
    }

    return mergeSave(JSON.parse(raw));
  } catch {
    return structuredClone(DEFAULT_SAVE);
  }
}

export function saveSettings(partialSettings) {
  const current = loadSave();
  const next = {
    ...current,
    settings: {
      ...current.settings,
      ...partialSettings,
    },
  };

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

export function recordRun({ cheated, score, highestLevelCleared, campaignWon }) {
  const current = loadSave();
  const next = structuredClone(current);

  if (cheated) {
    next.cheated.bestScore = Math.max(next.cheated.bestScore, score);
    if (campaignWon) {
      next.cheated.totalWins += 1;
    }
  } else {
    next.legit.bestScore = Math.max(next.legit.bestScore, score);
    next.legit.highestLevelCleared = Math.max(next.legit.highestLevelCleared, highestLevelCleared);
    if (campaignWon) {
      next.legit.totalWins += 1;
    }
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}
