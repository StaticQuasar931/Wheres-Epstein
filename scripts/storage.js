const STORAGE_KEY = "wheres-epstein-save-v8";
const LEGACY_STORAGE_KEYS = ["wheres-epstein-save-v7", "wheres-epstein-save-v6", "wheres-epstein-save-v5"];

const DEFAULT_SAVE = {
  settings: {
    theme: "dark",
    density: "comfortable",
    motion: "full",
    previewSize: "normal",
    showLevelIntro: "on",
    showPanTip: "on",
    confirmQuit: "on",
    previewDefault: "shown",
    foundFx: "strong",
    magnifierShape: "circle",
    magnifierSize: "normal",
    magnifierZoomSpeed: "normal",
    renderAhead: "3",
  },
  meta: {
    advancedMultiSeen: false,
    advancedPageSeen: false,
    speedrunPageSeen: false,
  },
  legit: {
    bestScore: 0,
    highestLevelCleared: 1,
    totalWins: 0,
    speedrun: {
      roundsPlayed: 0,
      totalScore: 0,
      totalTimeMs: 0,
      bestScore: 0,
      fastestTimeMs: 0,
      lastLevelId: "",
      recentLevelIds: [],
    },
    levelResults: {},
  },
  cheated: {
    bestScore: 0,
    totalWins: 0,
    speedrun: {
      roundsPlayed: 0,
      totalScore: 0,
      totalTimeMs: 0,
      bestScore: 0,
      fastestTimeMs: 0,
      lastLevelId: "",
      recentLevelIds: [],
    },
    levelResults: {},
  },
};
// iuewgt87BFE7y4t39ikjbf087t309848ufjT_ujnkg8yg88ujBF8g4998ib

function mergeSave(parsed) {
  return {
    settings: {
      ...DEFAULT_SAVE.settings,
      ...(parsed?.settings ?? {}),
    },
    meta: {
      ...DEFAULT_SAVE.meta,
      ...(parsed?.meta ?? {}),
    },
    legit: {
      ...DEFAULT_SAVE.legit,
      ...(parsed?.legit ?? {}),
      speedrun: {
        ...DEFAULT_SAVE.legit.speedrun,
        ...(parsed?.legit?.speedrun ?? {}),
      },
      levelResults: {
        ...DEFAULT_SAVE.legit.levelResults,
        ...(parsed?.legit?.levelResults ?? {}),
      },
    },
    cheated: {
      ...DEFAULT_SAVE.cheated,
      ...(parsed?.cheated ?? {}),
      speedrun: {
        ...DEFAULT_SAVE.cheated.speedrun,
        ...(parsed?.cheated?.speedrun ?? {}),
      },
      levelResults: {
        ...DEFAULT_SAVE.cheated.levelResults,
        ...(parsed?.cheated?.levelResults ?? {}),
      },
    },
  };
}

export function loadSave() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
      ?? LEGACY_STORAGE_KEYS.map((key) => window.localStorage.getItem(key)).find(Boolean);
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

export function saveMeta(partialMeta) {
  const current = loadSave();
  const next = {
    ...current,
    meta: {
      ...current.meta,
      ...partialMeta,
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
    firstScore: previous.firstScore ?? score,
    bestScore: Math.max(previous.bestScore ?? 0, score),
    bestStars: Math.max(previous.bestStars ?? 0, stars),
    bestTimeMs: previous.bestTimeMs ? Math.min(previous.bestTimeMs, clearMs) : clearMs,
    viewCount: previous.viewCount ?? 0,
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

export function recordLevelView({ cheated, levelId }) {
  const current = loadSave();
  const next = structuredClone(current);
  const bucket = cheated ? next.cheated : next.legit;
  const previous = bucket.levelResults[levelId] ?? {};

  bucket.levelResults[levelId] = {
    ...previous,
    viewCount: (previous.viewCount ?? 0) + 1,
  };

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

export function recordSpeedrunResult({ cheated, levelId, score, clearMs }) {
  const current = loadSave();
  const next = structuredClone(current);
  const bucket = cheated ? next.cheated : next.legit;

  const previousRecent = bucket.speedrun?.recentLevelIds ?? [];
  const nextRecent = [levelId, ...previousRecent.filter((item) => item !== levelId)].slice(0, 6);
  bucket.speedrun = {
    roundsPlayed: (bucket.speedrun?.roundsPlayed ?? 0) + 1,
    totalScore: (bucket.speedrun?.totalScore ?? 0) + score,
    totalTimeMs: (bucket.speedrun?.totalTimeMs ?? 0) + clearMs,
    bestScore: Math.max(bucket.speedrun?.bestScore ?? 0, score),
    fastestTimeMs: bucket.speedrun?.fastestTimeMs
      ? Math.min(bucket.speedrun.fastestTimeMs, clearMs)
      : clearMs,
    lastLevelId: levelId,
    recentLevelIds: nextRecent,
  };

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}
