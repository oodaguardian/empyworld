'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SplashScreen from '../src/components/SplashScreen';

const BG_PARTICLES = ['🌸', '💖', '✨', '🦋', '💫', '🌺', '💕', '🎀', '🌟', '⭐', '💜', '🌈'];

function BackgroundParticles() {
  const particles = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        id: i,
        emoji: BG_PARTICLES[i % BG_PARTICLES.length],
        left: `${5 + (i * 7.5) % 90}%`,
        size: 0.9 + Math.random() * 0.9,
        duration: 8 + Math.random() * 8,
        delay: Math.random() * 6,
      })),
    []
  );

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute select-none"
          style={{ left: p.left, bottom: '-5%', fontSize: `${p.size}rem` }}
          animate={{ y: [0, '-110vh'], rotate: [0, 360], opacity: [0, 0.6, 0.6, 0] }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: 'linear',
          }}
        >
          {p.emoji}
        </motion.div>
      ))}
    </div>
  );
}

export default function ClientShell({ children }) {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 4000);
    return () => clearTimeout(timer);
  }, []);

  if (showSplash) {
    return <SplashScreen />;
  }

  return (
    <>
      <BackgroundParticles />
      <AnimatePresence mode="wait">{children}</AnimatePresence>
    </>
  );
}
