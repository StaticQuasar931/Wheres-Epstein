const STORAGE_KEY = "wheres-epstein-save-v3";

const DEFAULT_SAVE = {
  settings: {
    theme: "dark",
    density: "comfortable",
    motion: "full",
    previewSize: "normal",
    showLevelIntro: "on",
  },
  legit: {
    bestScore: 0,
    highestLevelCleared: 1,
    totalWins: 0,
    levelResults: {},
  },
  cheated: {
    bestScore: 0,
    totalWins: 0,
    levelResults: {},
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
      levelResults: {
        ...DEFAULT_SAVE.legit.levelResults,
        ...(parsed?.legit?.levelResults ?? {}),
      },
    },
    cheated: {
      ...DEFAULT_SAVE.cheated,
      ...(parsed?.cheated ?? {}),
      levelResults: {
        ...DEFAULT_SAVE.cheated.levelResults,
        ...(parsed?.cheated?.levelResults ?? {}),
      },
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

export function recordLevelResult({ cheated, levelId, score, stars, clearMs, highestLevelCleared, campaignWon }) {
  const current = loadSave();
  const next = structuredClone(current);
  const bucket = cheated ? next.cheated : next.legit;
  const previous = bucket.levelResults[levelId] ?? {};

  bucket.levelResults[levelId] = {
    completed: true,
    bestScore: Math.max(previous.bestScore ?? 0, score),
    bestStars: Math.max(previous.bestStars ?? 0, stars),
    bestTimeMs: previous.bestTimeMs ? Math.min(previous.bestTimeMs, clearMs) : clearMs,
  };

  bucket.bestScore = Math.max(bucket.bestScore, score);

  if (!cheated) {
    next.legit.highestLevelCleared = Math.max(next.legit.highestLevelCleared, highestLevelCleared);
    if (campaignWon) {
      next.legit.totalWins += 1;
    }
  } else if (campaignWon) {
    next.cheated.totalWins += 1;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}
