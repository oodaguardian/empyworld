import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import GameShell from '../components/GameShell';
import Celebration from '../components/Celebration';
import useScore from '../hooks/useScore';
import useTTS from '../hooks/useTTS';
import { playCrash, playStar, playClick } from '../services/sounds';

const LANE_COUNT = 3;
const LANE_WIDTH = 70;
const CAR_EMOJIS = ['🚗', '🚙', '🚕', '🚌', '🚎', '🏎️'];
const PLAYER_EMOJI = '🚗';
const OBSTACLE_EMOJIS = ['🚚', '🚛', '🚜', '🚒', '🚑', '🚐'];
const STAR_EMOJI = '⭐';

function randomObstacle(id, speed) {
  return {
    id,
    lane: Math.floor(Math.random() * LANE_COUNT),
    y: -40,
    type: Math.random() < 0.3 ? 'star' : 'obstacle',
    emoji: Math.random() < 0.3 ? STAR_EMOJI : OBSTACLE_EMOJIS[Math.floor(Math.random() * OBSTACLE_EMOJIS.length)],
    speed: speed + Math.random() * 1,
  };
}

export default function RacingGame() {
  const [playing, setPlaying] = useState(false);
  const [lane, setLane] = useState(1); // 0, 1, 2
  const [obstacles, setObstacles] = useState([]);
  const [score, setScore] = useState(0);
  const [stars, setStars] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const frameRef = useRef();
  const nextIdRef = useRef(0);
  const spawnTimerRef = useRef(0);
  const speedRef = useRef(2);
  const gameAreaRef = useRef();
  const scoreRef = useRef(0);
  const gameOverRef = useRef(false);
  const laneRef = useRef(1);
  const { recordScore } = useScore('racing');
  const { speak } = useTTS();

  const startGame = () => {
    setPlaying(true); setLane(1); setObstacles([]); setScore(0); setStars(0);
    setGameOver(false); setShowCelebration(false);
    nextIdRef.current = 0; spawnTimerRef.current = 0; speedRef.current = 2;
    scoreRef.current = 0; gameOverRef.current = false; laneRef.current = 1;
    speak(`Go, Empy, go!`);
  };

  const moveLeft = useCallback(() => {
    setLane(l => { const n = Math.max(0, l - 1); laneRef.current = n; return n; });
    playClick();
  }, []);

  const moveRight = useCallback(() => {
    setLane(l => { const n = Math.min(2, l + 1); laneRef.current = n; return n; });
    playClick();
  }, []);

  // Keyboard controls
  useEffect(() => {
    if (!playing || gameOver) return;
    const handleKey = (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') moveLeft();
      if (e.key === 'ArrowRight' || e.key === 'd') moveRight();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [playing, gameOver, moveLeft, moveRight]);

  // Touch swipe controls
  useEffect(() => {
    if (!playing || gameOver) return;
    const el = gameAreaRef.current;
    if (!el) return;
    let startX = 0;
    const onTouchStart = (e) => { startX = e.touches[0].clientX; };
    const onTouchEnd = (e) => {
      const dx = e.changedTouches[0].clientX - startX;
      if (dx > 30) moveRight();
      else if (dx < -30) moveLeft();
    };
    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => { el.removeEventListener('touchstart', onTouchStart); el.removeEventListener('touchend', onTouchEnd); };
  }, [playing, gameOver, moveLeft, moveRight]);

  // Game loop
  useEffect(() => {
    if (!playing || gameOver) return;
    const height = gameAreaRef.current?.offsetHeight || 500;

    const loop = (time) => {
      if (gameOverRef.current) return;

      spawnTimerRef.current++;
      if (spawnTimerRef.current > 40) {
        spawnTimerRef.current = 0;
        setObstacles(prev => [...prev, randomObstacle(nextIdRef.current++, speedRef.current)]);
      }

      // Increase speed over time
      scoreRef.current += 0.02;
      setScore(Math.floor(scoreRef.current));
      if (Math.floor(scoreRef.current) % 20 === 0 && Math.floor(scoreRef.current) > 0) {
        speedRef.current = Math.min(6, 2 + Math.floor(scoreRef.current) / 20 * 0.5);
      }

      setObstacles(prev => {
        return prev.map(obs => {
          const newY = obs.y + obs.speed;
          // Check player collision (player at bottom, ~85% height)
          const playerY = height * 0.8;
          if (newY > playerY - 25 && newY < playerY + 25 && obs.lane === laneRef.current) {
            if (obs.type === 'star') {
              playStar();
              setStars(s => s + 1);
              return null; // remove
            } else {
              playCrash();
              gameOverRef.current = true;
              setGameOver(true);
              return obs;
            }
          }
          if (newY > height + 40) return null; // past screen
          return { ...obs, y: newY };
        }).filter(Boolean);
      });

      frameRef.current = requestAnimationFrame(loop);
    };

    frameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameRef.current);
  }, [playing, gameOver]);

  useEffect(() => {
    if (gameOver && score > 10) {
      recordScore(score + stars * 5, score >= 100 ? 3 : score >= 50 ? 2 : 1);
      speak(`Great race, Empy!`);
      setTimeout(() => setShowCelebration(true), 300);
    }
  }, [gameOver]);

  if (!playing) {
    return (
      <GameShell title="Racing!" icon="🏎️" gameType="racing" backTo="/games" instructions="Dodge the cars!">
        <div className="h-full flex flex-col items-center justify-center gap-6 p-4">
          <motion.div animate={{ x: [-20, 20, -20] }} transition={{ repeat: Infinity, duration: 1.5 }} className="text-8xl">🏎️</motion.div>
          <h2 className="text-2xl font-display text-white">Racing!</h2>
          <p className="text-white/60 text-center max-w-xs">Dodge obstacles and collect stars! Swipe or use arrow buttons to move.</p>
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={startGame}
            className="btn btn-lg bg-empy-pink text-white border-empy-pink font-display text-xl px-10">🏁 Go!</motion.button>
        </div>
      </GameShell>
    );
  }

  const areaW = gameAreaRef.current?.offsetWidth || 300;
  const laneX = (l) => (areaW / LANE_COUNT) * (l + 0.5);

  return (
    <GameShell title="Racing!" icon="🏎️" gameType="racing" backTo="/games" instructions={`Score: ${score} ⭐${stars}`}>
      <div ref={gameAreaRef} className="h-full relative overflow-hidden select-none" style={{ touchAction: 'none' }}>
        {/* Road */}
        <div className="absolute inset-0 bg-gradient-to-b from-gray-800 to-gray-700">
          {/* Lane dividers */}
          {[1, 2].map(i => (
            <div key={i} className="absolute top-0 bottom-0" style={{ left: `${(i / LANE_COUNT) * 100}%`, width: 3, background: 'repeating-linear-gradient(to bottom, #EAB308 0px, #EAB308 20px, transparent 20px, transparent 40px)' }} />
          ))}
          {/* Moving road lines */}
          <div className="absolute inset-0 opacity-20 animate-pulse" style={{
            background: 'repeating-linear-gradient(to bottom, transparent 0, transparent 38px, rgba(255,255,255,0.3) 38px, rgba(255,255,255,0.3) 40px)',
          }} />
        </div>

        {/* Obstacles */}
        {obstacles.map(obs => (
          <div key={obs.id} className="absolute text-4xl transition-none" style={{ left: laneX(obs.lane) - 20, top: obs.y, fontSize: 40 }}>
            {obs.emoji}
          </div>
        ))}

        {/* Player car */}
        <motion.div
          animate={{ left: laneX(lane) - 22 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className="absolute text-5xl"
          style={{ bottom: '15%' }}>
          {PLAYER_EMOJI}
        </motion.div>

        {/* Score */}
        <div className="absolute top-2 left-0 right-0 flex justify-center pointer-events-none z-10">
          <div className="bg-black/50 backdrop-blur-sm rounded-full px-4 py-1 flex gap-3 text-sm font-display">
            <span className="text-white">Score: {score}</span>
            <span className="text-empy-yellow">⭐ {stars}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="absolute bottom-4 left-0 right-0 flex justify-between px-6 z-10">
          <motion.button whileTap={{ scale: 0.8 }} onClick={moveLeft}
            className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm text-4xl flex items-center justify-center active:bg-white/40 border-2 border-white/30">
            ◀
          </motion.button>
          <motion.button whileTap={{ scale: 0.8 }} onClick={moveRight}
            className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm text-4xl flex items-center justify-center active:bg-white/40 border-2 border-white/30">
            ▶
          </motion.button>
        </div>

        {/* Game Over */}
        {gameOver && !showCelebration && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm z-30">
            <h2 className="text-3xl font-display text-white mb-2">Crash! 💥</h2>
            <p className="text-xl text-empy-yellow font-display mb-1">Score: {score}</p>
            <p className="text-lg text-white/70 font-display mb-4">⭐ {stars} stars collected</p>
            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={startGame}
              className="btn btn-lg bg-empy-pink text-white border-empy-pink font-display">🔄 Race Again</motion.button>
          </motion.div>
        )}
      </div>

      <Celebration show={showCelebration} onDone={startGame}
        message={`Score ${score}! ⭐${stars}! 🏎️`}
        stars={score >= 100 ? 3 : score >= 50 ? 2 : 1} />
    </GameShell>
  );
}
