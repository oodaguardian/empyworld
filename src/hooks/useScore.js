import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'empytv_scores';

function loadScores() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch { return {}; }
}

function saveScores(scores) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(scores));
}

export default function useScore(gameId) {
  const [scores, setScores] = useState(loadScores);

  const bestScore = scores[gameId]?.best || 0;
  const bestStars = scores[gameId]?.stars || 0;
  const totalPlays = scores[gameId]?.plays || 0;

  const recordScore = useCallback((score, stars = 0) => {
    setScores(prev => {
      const game = prev[gameId] || { best: 0, stars: 0, plays: 0 };
      const updated = {
        ...prev,
        [gameId]: {
          best: Math.max(game.best, score),
          stars: Math.max(game.stars, stars),
          plays: game.plays + 1,
          lastPlayed: Date.now(),
        }
      };
      saveScores(updated);
      return updated;
    });
  }, [gameId]);

  return { bestScore, bestStars, totalPlays, recordScore };
}
