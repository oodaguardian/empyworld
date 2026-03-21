import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GameShell from '../components/GameShell';
import Celebration from '../components/Celebration';
import useScore from '../hooks/useScore';
import useTTS from '../hooks/useTTS';
import { playBubble, playPop, playWrong } from '../services/sounds';

const BUBBLE_EMOJIS = ['🐱', '🐶', '🍎', '🌟', '🦋', '🐠', '🌺', '🎈', '🐻', '💖', '🍓', '🌈', 'A', 'B', 'C', '1', '2', '3'];

function randomBubble(id, width) {
  return {
    id,
    emoji: BUBBLE_EMOJIS[Math.floor(Math.random() * BUBBLE_EMOJIS.length)],
    x: 20 + Math.random() * (width - 80),
    y: window.innerHeight + 20,
    size: 50 + Math.random() * 30,
    speed: 1 + Math.random() * 1.5,
    wobble: Math.random() * 2 - 1,
    popped: false,
  };
}

export default function BubblePop() {
  const [playing, setPlaying] = useState(false);
  const [bubbles, setBubbles] = useState([]);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameOver, setGameOver] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const frameRef = useRef();
  const nextIdRef = useRef(0);
  const containerRef = useRef();
  const spawnTimerRef = useRef(0);
  const speedMultRef = useRef(1);
  const { recordScore } = useScore('bubble');
  const { speak } = useTTS();

  const startGame = () => {
    setPlaying(true);
    setScore(0);
    setLives(3);
    setGameOver(false);
    setShowCelebration(false);
    setBubbles([]);
    nextIdRef.current = 0;
    spawnTimerRef.current = 0;
    speedMultRef.current = 1;
    speak(`Go Empy!`);
  };

  const popBubble = useCallback((id) => {
    playPop();
    setBubbles(prev => prev.map(b => b.id === id ? { ...b, popped: true } : b));
    setScore(s => {
      const newScore = s + 1;
      if (newScore % 10 === 0) speedMultRef.current += 0.2;
      return newScore;
    });
  }, []);

  useEffect(() => {
    if (!playing || gameOver) return;

    let lastTime = performance.now();

    const loop = (time) => {
      const dt = (time - lastTime) / 16.67; // normalize to ~60fps
      lastTime = time;

      const width = containerRef.current?.offsetWidth || 400;

      // Spawn new bubbles
      spawnTimerRef.current += dt;
      if (spawnTimerRef.current > 30 / speedMultRef.current) {
        spawnTimerRef.current = 0;
        setBubbles(prev => [...prev, randomBubble(nextIdRef.current++, width)]);
      }

      // Move bubbles
      setBubbles(prev => {
        let missedCount = 0;
        const updated = prev
          .map(b => {
            if (b.popped) return null;
            const newY = b.y - b.speed * speedMultRef.current * dt;
            if (newY < -b.size) {
              missedCount++;
              return null;
            }
            return { ...b, y: newY, x: b.x + Math.sin(newY / 30) * b.wobble };
          })
          .filter(Boolean);

        if (missedCount > 0) {
          setLives(l => {
            const newLives = l - missedCount;
            if (newLives <= 0) {
              setGameOver(true);
            }
            return Math.max(0, newLives);
          });
        }
        return updated;
      });

      frameRef.current = requestAnimationFrame(loop);
    };

    frameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameRef.current);
  }, [playing, gameOver]);

  useEffect(() => {
    if (gameOver && score > 0) {
      recordScore(score, score >= 50 ? 3 : score >= 25 ? 2 : 1);
      if (score >= 15) {
        speak(`Nice, Empy!`);
        setTimeout(() => setShowCelebration(true), 300);
      }
    }
  }, [gameOver, score, recordScore]);

  if (!playing) {
    return (
      <GameShell title="Bubble Pop" icon="🫧" gameType="bubble" backTo="/games" instructions="Pop the bubbles!">
        <div className="h-full flex flex-col items-center justify-center gap-6 p-4">
          <motion.div animate={{ y: [0, -15, 0] }} transition={{ repeat: Infinity, duration: 2 }} className="text-8xl">🫧</motion.div>
          <h2 className="text-2xl font-display text-white">Bubble Pop!</h2>
          <p className="text-white/60 text-center max-w-xs">Tap the bubbles before they reach the top! You have 3 lives.</p>
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={startGame}
            className="btn btn-lg bg-empy-pink text-white border-empy-pink font-display text-xl px-10">
            🫧 Play!
          </motion.button>
        </div>
      </GameShell>
    );
  }

  return (
    <GameShell title="Bubble Pop" icon="🫧" gameType="bubble" backTo="/games" instructions={`Score: ${score} · Lives: ${'❤️'.repeat(lives)}`}>
      <div ref={containerRef} className="h-full relative overflow-hidden select-none" style={{ touchAction: 'none' }}>
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-empy-blue/10 to-transparent pointer-events-none" />

        {/* Bubbles */}
        <AnimatePresence>
          {bubbles.filter(b => !b.popped).map(b => (
            <motion.div
              key={b.id}
              initial={{ scale: 1 }}
              exit={{ scale: 1.5, opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => popBubble(b.id)}
              onTouchStart={(e) => { e.preventDefault(); popBubble(b.id); }}
              className="absolute rounded-full cursor-pointer flex items-center justify-center"
              style={{
                left: b.x,
                top: b.y,
                width: b.size,
                height: b.size,
                background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.4), rgba(100,200,255,0.2), rgba(200,100,255,0.1))',
                border: '2px solid rgba(255,255,255,0.3)',
                boxShadow: '0 0 15px rgba(100,200,255,0.3), inset 0 0 10px rgba(255,255,255,0.2)',
                fontSize: b.size * 0.45,
              }}
            >
              {b.emoji}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Score overlay */}
        <div className="absolute top-2 left-0 right-0 flex justify-center pointer-events-none">
          <div className="bg-black/40 backdrop-blur-sm rounded-full px-4 py-1 flex items-center gap-3 text-sm font-display">
            <span className="text-empy-yellow">Score: {score}</span>
            <span className="text-empy-pink">{'❤️'.repeat(lives)}{'🖤'.repeat(3 - lives)}</span>
          </div>
        </div>

        {/* Game Over overlay */}
        {gameOver && !showCelebration && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm z-30"
          >
            <h2 className="text-3xl font-display text-white mb-2">Game Over!</h2>
            <p className="text-xl text-empy-yellow font-display mb-4">Score: {score}</p>
            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={startGame}
              className="btn btn-lg bg-empy-pink text-white border-empy-pink font-display">
              🔄 Play Again
            </motion.button>
          </motion.div>
        )}
      </div>

      <Celebration
        show={showCelebration}
        onDone={startGame}
        message={`${score} Bubbles! 🫧`}
        stars={score >= 50 ? 3 : score >= 25 ? 2 : 1}
      />
    </GameShell>
  );
}
